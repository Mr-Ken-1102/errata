import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createTempDir, makeTestSettings } from '../setup'
import { createStory, createFragment } from '@/server/fragments/storage'
import { clearRuns, getRun } from '@/server/runs'
import type { AgentStreamCompletion, AgentStreamResult } from '@/server/agents/stream-types'

let nextStreamResult: AgentStreamResult | null = null
const failMock = vi.fn()

vi.mock('@/server/agents', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/server/agents')>()
  return {
    ...actual,
    listAgentRuns: () => [],
    createAgentInstance: () => ({
      agentName: 'librarian.refine',
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

function completion(): AgentStreamCompletion {
  return {
    text: 'updated',
    reasoning: '',
    toolCalls: [],
    toolErrors: [],
    stepCount: 1,
    finishReason: 'stop',
  }
}

async function readRunId(res: Response): Promise<{ reader: ReadableStreamDefaultReader<Uint8Array>; runId: string }> {
  if (!res.body) throw new Error('missing response body')
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) throw new Error('stream ended before run-start')
    buffer += decoder.decode(value, { stream: true })
    for (const line of buffer.split('\n')) {
      if (!line.trim()) continue
      const event = JSON.parse(line)
      if (event.type === 'run-start') return { reader, runId: event.runId }
    }
  }
}

describe('librarian server-owned refine route', () => {
  let dataDir: string
  let cleanup: () => Promise<void>
  let app: ReturnType<typeof createApp>
  const storyId = 'story-refine-run'

  beforeEach(async () => {
    const tmp = await createTempDir()
    dataDir = tmp.path
    cleanup = tmp.cleanup
    clearRuns()
    nextStreamResult = null
    failMock.mockReset()

    await createStory(dataDir, {
      id: storyId,
      name: 'Refine Run',
      description: '',
      coverImage: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: makeTestSettings(),
    })
    await createFragment(dataDir, storyId, {
      id: 'ch-refine',
      type: 'character',
      name: 'Mara',
      description: 'A character',
      content: 'Original sheet.',
      tags: [],
      refs: [],
      sticky: false,
      placement: 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: 0,
      meta: {},
    })
    app = createApp(dataDir)
  })

  afterEach(async () => {
    clearRuns()
    await cleanup()
  })

  function makeGatedStream(gate: ReturnType<typeof deferred>, onCancel: () => void): AgentStreamResult {
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
        controller.enqueue(JSON.stringify({ type: 'text', text: 'working' }) + '\n')
        void gate.promise.then(() => {
          if (cancelled) return
          controller.enqueue(JSON.stringify({ type: 'finish', finishReason: 'stop', stepCount: 1 }) + '\n')
          controller.close()
          settleCompletion()
        })
      },
      cancel() {
        cancelled = true
        onCancel()
        settleCompletion()
      },
    })
    return { eventStream, completion: completionPromise }
  }

  async function startRefine() {
    return app.fetch(new Request(`http://localhost/api/stories/${storyId}/librarian/refine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fragmentId: 'ch-refine', instructions: 'Improve it' }),
    }))
  }

  it('keeps the agent running when the HTTP subscriber disconnects', async () => {
    const gate = deferred()
    const sourceCancelled = vi.fn()
    nextStreamResult = makeGatedStream(gate, sourceCancelled)

    const res = await startRefine()
    expect(res.status).toBe(200)
    const { reader, runId } = await readRunId(res)

    // Simulate a sleeping phone / dropped browser connection.
    await reader.cancel()
    expect(sourceCancelled).not.toHaveBeenCalled()

    gate.resolve()
    const run = getRun(runId)
    expect(run).not.toBeNull()
    await run!.done
    expect(run!.status).toBe('complete')
    expect(sourceCancelled).not.toHaveBeenCalled()
  })

  it('cancels the owned agent only through the explicit run cancel endpoint', async () => {
    const gate = deferred()
    const sourceCancelled = vi.fn()
    nextStreamResult = makeGatedStream(gate, sourceCancelled)

    const res = await startRefine()
    const { reader, runId } = await readRunId(res)

    const cancelRes = await app.fetch(new Request(
      `http://localhost/api/stories/${storyId}/runs/${runId}/cancel`,
      { method: 'POST' },
    ))
    expect(cancelRes.status).toBe(200)

    const run = getRun(runId)
    await run!.done
    expect(run!.status).toBe('cancelled')
    expect(sourceCancelled).toHaveBeenCalledTimes(1)

    await reader.cancel()
    gate.resolve()
  })
})
