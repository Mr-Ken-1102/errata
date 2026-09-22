import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createTempDir, makeTestSettings } from '../setup'
import { createStory } from '@/server/fragments/storage'
import { clearRuns, getRun } from '@/server/runs'
import { createConversation, getChatHistory, getConversationHistory } from '@/server/librarian/storage'
import type { AgentStreamCompletion, AgentStreamResult } from '@/server/agents/stream-types'

let nextStreamResult: AgentStreamResult | null = null
let lastAgentInput: Record<string, unknown> | null = null
const failMock = vi.fn()

vi.mock('@/server/agents', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/server/agents')>()
  return {
    ...actual,
    listAgentRuns: () => [],
    createAgentInstance: () => ({
      agentName: 'librarian.chat',
      execute: async (input: Record<string, unknown>) => {
        lastAgentInput = input
        if (!nextStreamResult) throw new Error('missing mocked stream')
        return nextStreamResult
      },
      fail: (error: unknown) => failMock(error),
    }),
  }
})

import { createApp } from '@/server/api'

function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>(r => { resolve = r })
  return { promise, resolve }
}

function completion(text = 'done'): AgentStreamCompletion {
  return {
    text,
    reasoning: '',
    toolCalls: [],
    toolErrors: [],
    stepCount: 1,
    finishReason: 'stop',
  }
}

function gatedStream(gate: ReturnType<typeof deferred>, opts?: { tool?: boolean; onCancel?: () => void }): AgentStreamResult {
  let resolveCompletion!: (value: AgentStreamCompletion) => void
  let cancelled = false
  let completionSettled = false
  const completionPromise = new Promise<AgentStreamCompletion>(resolve => { resolveCompletion = resolve })
  const settleCompletion = () => {
    if (completionSettled) return
    completionSettled = true
    resolveCompletion(completion('partial'))
  }
  const eventStream = new ReadableStream<string>({
    start(controller) {
      controller.enqueue(JSON.stringify({ type: 'text', text: 'partial' }) + '\n')
      if (opts?.tool) {
        controller.enqueue(JSON.stringify({
          type: 'tool-call',
          id: 'tc-1',
          toolName: 'editFragments',
          args: { id: 'ch-1' },
        }) + '\n')
        controller.enqueue(JSON.stringify({
          type: 'tool-result',
          id: 'tc-1',
          toolName: 'editFragments',
          result: { ok: true },
        }) + '\n')
      }
      void gate.promise.then(() => {
        if (cancelled) return
        controller.enqueue(JSON.stringify({ type: 'finish', finishReason: 'stop', stepCount: 1 }) + '\n')
        controller.close()
        settleCompletion()
      })
    },
    cancel() {
      cancelled = true
      opts?.onCancel?.()
      settleCompletion()
    },
  })
  return { eventStream, completion: completionPromise }
}

async function waitForPersistedToolCall(
  dataDir: string,
  storyId: string,
): Promise<void> {
  for (let attempt = 0; attempt < 50; attempt++) {
    const history = await getChatHistory(dataDir, storyId)
    if (history.messages.at(-1)?.toolCalls?.[0]?.result !== undefined) return
    await new Promise(resolve => setTimeout(resolve, 1))
  }
  throw new Error('tool result was not persisted before Stop')
}

async function readRunId(res: Response) {
  if (!res.body) throw new Error('missing response body')
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) throw new Error('ended before run-start')
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.trim()) continue
      const event = JSON.parse(line)
      if (event.type === 'run-start') return { runId: event.runId as string, reader }
    }
  }
}

describe('server-owned librarian chat route', () => {
  let dataDir: string
  let cleanup: () => Promise<void>
  let app: ReturnType<typeof createApp>
  const storyId = 'story-chat-owned'

  beforeEach(async () => {
    const tmp = await createTempDir()
    dataDir = tmp.path
    cleanup = tmp.cleanup
    clearRuns()
    nextStreamResult = null
    lastAgentInput = null
    failMock.mockReset()
    await createStory(dataDir, {
      id: storyId,
      name: 'Owned chat',
      description: '',
      coverImage: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: makeTestSettings(),
    })
    app = createApp(dataDir)
  })

  afterEach(async () => {
    clearRuns()
    await cleanup()
  })

  const post = (message: string, clientRequestId?: string) =>
    app.fetch(new Request(`http://localhost/api/stories/${storyId}/librarian/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, ...(clientRequestId ? { clientRequestId } : {}) }),
    }))

  it('keeps named-conversation retries scoped and idempotent', async () => {
    const conversation = await createConversation(dataDir, storyId, 'Named chat')
    const gate = deferred()
    nextStreamResult = gatedStream(gate)

    const send = (clientRequestId: string) => app.fetch(new Request(
      `http://localhost/api/stories/${storyId}/librarian/conversations/${conversation.id}/chat`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'hello named chat', clientRequestId }),
      },
    ))

    const first = await send('named-request')
    const a = await readRunId(first)
    const retry = await send('named-request')
    const b = await readRunId(retry)

    expect(b.runId).toBe(a.runId)
    expect(getRun(a.runId)?.scopeId).toBe(conversation.id)

    const history = await getConversationHistory(dataDir, storyId, conversation.id)
    expect(history.messages.filter(message => message.role === 'user')).toHaveLength(1)
    expect(history.messages[0].content).toBe('hello named chat')

    gate.resolve()
    await getRun(a.runId)!.done
    await a.reader.cancel()
    await b.reader.cancel()
  })

  it('passes stored conversation POV to the durable chat agent and not from the turn request', async () => {
    const conversation = await createConversation(dataDir, storyId, 'POV chat', 'ch-maya')
    const gate = deferred()
    nextStreamResult = gatedStream(gate)

    const response = await app.fetch(new Request(
      `http://localhost/api/stories/${storyId}/librarian/conversations/${conversation.id}/chat`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'refine this passage',
          clientRequestId: 'pov-conversation-request',
        }),
      },
    ))
    const { runId, reader } = await readRunId(response)

    for (let attempt = 0; attempt < 50 && !lastAgentInput; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 1))
    }
    expect(lastAgentInput).toMatchObject({
      povCharacterId: 'ch-maya',
      maxSteps: expect.any(Number),
      messages: expect.any(Array),
    })

    gate.resolve()
    await getRun(runId)!.done
    await reader.cancel()
  })

  it('keeps general librarian chat narrator-scoped by default', async () => {
    const gate = deferred()
    nextStreamResult = gatedStream(gate)

    const response = await post('general question', 'general-no-pov')
    const { runId, reader } = await readRunId(response)

    for (let attempt = 0; attempt < 50 && !lastAgentInput; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 1))
    }
    expect(lastAgentInput).not.toHaveProperty('povCharacterId')

    gate.resolve()
    await getRun(runId)!.done
    await reader.cancel()
  })

  it('replays the same run for an idempotent retry without duplicating the user turn', async () => {
    const gate = deferred()
    nextStreamResult = gatedStream(gate)

    const first = await post('hello', 'request-1')
    const a = await readRunId(first)

    const retry = await post('hello', 'request-1')
    const b = await readRunId(retry)
    expect(b.runId).toBe(a.runId)

    const history = await getChatHistory(dataDir, storyId)
    expect(history.messages.filter(m => m.role === 'user')).toHaveLength(1)

    gate.resolve()
    await getRun(a.runId)!.done
    await a.reader.cancel()
    await b.reader.cancel()
  })

  it('rejects a competing turn for the same surface and does not append it', async () => {
    const gate = deferred()
    nextStreamResult = gatedStream(gate)

    const first = await post('first', 'request-a')
    const { runId, reader } = await readRunId(first)

    const second = await post('second', 'request-b')
    expect(second.status).toBe(409)
    const conflict = await second.json() as { runId: string }
    expect(conflict.runId).toBe(runId)

    const history = await getChatHistory(dataDir, storyId)
    expect(history.messages.filter(m => m.role === 'user').map(m => m.content)).toEqual(['first'])

    gate.resolve()
    await getRun(runId)!.done
    await reader.cancel()
  })

  it('keeps working after the HTTP subscriber disconnects', async () => {
    const gate = deferred()
    const sourceCancelled = vi.fn()
    nextStreamResult = gatedStream(gate, { onCancel: sourceCancelled })

    const response = await post('continue', 'request-disconnect')
    const { runId, reader } = await readRunId(response)
    await reader.cancel()
    expect(sourceCancelled).not.toHaveBeenCalled()

    gate.resolve()
    await getRun(runId)!.done
    expect(getRun(runId)!.status).toBe('complete')
    expect(sourceCancelled).not.toHaveBeenCalled()

    const history = await getChatHistory(dataDir, storyId)
    expect(history.messages.at(-1)).toMatchObject({
      role: 'assistant',
      content: 'partial',
      status: 'complete',
    })
  })

  it('persists landed tool calls and marks an explicit Stop as cancelled', async () => {
    const gate = deferred()
    const sourceCancelled = vi.fn()
    nextStreamResult = gatedStream(gate, { tool: true, onCancel: sourceCancelled })

    const response = await post('edit it', 'request-cancel')
    const { runId, reader } = await readRunId(response)

    // Stop only after the tool result has landed durably. This tests the
    // invariant directly instead of racing an arbitrary event-loop tick.
    await waitForPersistedToolCall(dataDir, storyId)

    const cancel = await app.fetch(new Request(
      `http://localhost/api/stories/${storyId}/runs/${runId}/cancel`,
      { method: 'POST' },
    ))
    expect(cancel.status).toBe(200)

    await getRun(runId)!.done
    expect(getRun(runId)!.status).toBe('cancelled')
    expect(sourceCancelled).toHaveBeenCalledTimes(1)

    const history = await getChatHistory(dataDir, storyId)
    const assistant = history.messages.at(-1)
    expect(assistant?.status).toBe('cancelled')
    expect(assistant?.toolCalls?.[0]).toMatchObject({
      toolName: 'editFragments',
      result: { ok: true },
    })

    await reader.cancel()
    gate.resolve()
  })
})
