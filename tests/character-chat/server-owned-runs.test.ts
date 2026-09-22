import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createTempDir, makeTestSettings } from '../setup'
import { createStory, createFragment } from '@/server/fragments/storage'
import {
  appendMessage,
  getConversation,
  saveConversation,
  type CharacterChatConversation,
} from '@/server/character-chat/storage'
import { clearRuns, getRun } from '@/server/runs'
import type { AgentStreamCompletion, AgentStreamResult } from '@/server/agents/stream-types'

let nextStreamResult: AgentStreamResult | null = null
const failMock = vi.fn()

vi.mock('@/server/agents', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/server/agents')>()
  return {
    ...actual,
    createAgentInstance: () => ({
      agentName: 'character-chat.chat',
      execute: async () => {
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

function completion(text = 'partial'): AgentStreamCompletion {
  return {
    text,
    reasoning: '',
    toolCalls: [],
    toolErrors: [],
    stepCount: 1,
    finishReason: 'stop',
  }
}

function gatedStream(gate: ReturnType<typeof deferred>, onCancel?: () => void): AgentStreamResult {
  let resolveCompletion!: (value: AgentStreamCompletion) => void
  let cancelled = false
  let completionSettled = false
  const completionPromise = new Promise<AgentStreamCompletion>(resolve => { resolveCompletion = resolve })
  const settleCompletion = () => {
    if (completionSettled) return
    completionSettled = true
    resolveCompletion(completion())
  }
  const eventStream = new ReadableStream<string>({
    start(controller) {
      controller.enqueue(JSON.stringify({ type: 'text', text: 'partial' }) + '\n')
      void gate.promise.then(() => {
        if (cancelled) return
        controller.enqueue(JSON.stringify({ type: 'finish', finishReason: 'stop', stepCount: 1 }) + '\n')
        controller.close()
        settleCompletion()
      })
    },
    cancel() {
      cancelled = true
      onCancel?.()
      settleCompletion()
    },
  })
  return { eventStream, completion: completionPromise }
}

async function readRunId(response: Response) {
  if (!response.body) throw new Error('missing response body')
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) throw new Error('stream ended before run-start')
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

describe('server-owned character chat', () => {
  let dataDir: string
  let cleanup: () => Promise<void>
  let app: ReturnType<typeof createApp>
  const storyId = 'story-character-owned'
  const conversationId = 'cc-owned'

  beforeEach(async () => {
    const tmp = await createTempDir()
    dataDir = tmp.path
    cleanup = tmp.cleanup
    clearRuns()
    nextStreamResult = null
    failMock.mockReset()

    await createStory(dataDir, {
      id: storyId,
      name: 'Character Owned',
      description: '',
      coverImage: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: makeTestSettings(),
    })
    await createFragment(dataDir, storyId, {
      id: 'ch-kael',
      type: 'character',
      name: 'Kael',
      description: 'A wanderer',
      content: 'Kael speaks carefully.',
      tags: [],
      refs: [],
      sticky: false,
      placement: 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: 0,
      meta: {},
    })

    const now = new Date().toISOString()
    const conversation: CharacterChatConversation = {
      id: conversationId,
      characterId: 'ch-kael',
      persona: { type: 'stranger' },
      storyPointFragmentId: null,
      title: 'Chat with Kael',
      messages: [],
      createdAt: now,
      updatedAt: now,
    }
    await saveConversation(dataDir, storyId, conversation)
    app = createApp(dataDir)
  })

  afterEach(async () => {
    clearRuns()
    await cleanup()
  })

  const post = (message: string, clientRequestId?: string) =>
    app.fetch(new Request(
      `http://localhost/api/stories/${storyId}/character-chat/conversations/${conversationId}/chat`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, ...(clientRequestId ? { clientRequestId } : {}) }),
      },
    ))

  it('replays an idempotent retry without duplicating the user message', async () => {
    const gate = deferred()
    nextStreamResult = gatedStream(gate)

    const first = await post('Hello', 'cc-request-1')
    const a = await readRunId(first)
    const retry = await post('Hello', 'cc-request-1')
    const b = await readRunId(retry)

    expect(b.runId).toBe(a.runId)
    const conversation = await getConversation(dataDir, storyId, conversationId)
    expect(conversation?.messages.filter(message => message.role === 'user')).toHaveLength(1)

    gate.resolve()
    await getRun(a.runId)!.done
    await a.reader.cancel()
    await b.reader.cancel()
  })

  it('does not cancel the character when the HTTP subscriber disconnects', async () => {
    const gate = deferred()
    const sourceCancelled = vi.fn()
    nextStreamResult = gatedStream(gate, sourceCancelled)

    const response = await post('Keep talking', 'cc-disconnect')
    const { runId, reader } = await readRunId(response)
    await reader.cancel()

    expect(sourceCancelled).not.toHaveBeenCalled()
    gate.resolve()
    await getRun(runId)!.done
    expect(getRun(runId)!.status).toBe('complete')

    const conversation = await getConversation(dataDir, storyId, conversationId)
    expect(conversation?.messages.at(-1)).toMatchObject({
      role: 'assistant',
      content: 'partial',
      status: 'complete',
    })
  })

  it('persists explicit Stop as cancelled and keeps partial text', async () => {
    const gate = deferred()
    const sourceCancelled = vi.fn()
    nextStreamResult = gatedStream(gate, sourceCancelled)

    const response = await post('Stop later', 'cc-cancel')
    const { runId, reader } = await readRunId(response)

    await new Promise(resolve => setTimeout(resolve, 0))
    const cancel = await app.fetch(new Request(
      `http://localhost/api/stories/${storyId}/runs/${runId}/cancel`,
      { method: 'POST' },
    ))
    expect(cancel.status).toBe(200)

    await getRun(runId)!.done
    expect(sourceCancelled).toHaveBeenCalledTimes(1)

    const conversation = await getConversation(dataDir, storyId, conversationId)
    expect(conversation?.messages.at(-1)).toMatchObject({
      role: 'assistant',
      content: 'partial',
      status: 'cancelled',
    })

    await reader.cancel()
    gate.resolve()
  })

  it('serializes concurrent message appends without losing history', async () => {
    await Promise.all(
      Array.from({ length: 20 }, (_, index) =>
        appendMessage(dataDir, storyId, conversationId, {
          role: 'user',
          content: `message-${index}`,
          createdAt: new Date().toISOString(),
        }),
      ),
    )

    const conversation = await getConversation(dataDir, storyId, conversationId)
    expect(conversation?.messages).toHaveLength(20)
    expect(new Set(conversation?.messages.map(message => message.content)).size).toBe(20)
  })
})
