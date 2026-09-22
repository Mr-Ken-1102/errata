import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createTempDir, makeTestSettings } from '../setup'
import { createStory } from '@/server/fragments/storage'
import { cancelRun, clearRuns, subscribeRun } from '@/server/runs'
import { startAgentRun } from '@/server/runs/agent-run'
import type { AgentStreamCompletion, AgentStreamResult } from '@/server/agents/stream-types'

const executeMock = vi.fn()
const failMock = vi.fn()

vi.mock('@/server/agents', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/server/agents')>()
  return {
    ...actual,
    createAgentInstance: () => ({
      agentName: 'test.agent',
      execute: (...args: unknown[]) => executeMock(...args),
      fail: (error: unknown) => failMock(error),
    }),
  }
})

function completion(): AgentStreamCompletion {
  return {
    text: 'hello',
    reasoning: '',
    toolCalls: [],
    toolErrors: [],
    stepCount: 1,
    finishReason: 'stop',
  }
}

async function drain(stream: ReadableStream<string>) {
  const out: any[] = []
  const reader = stream.getReader()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    for (const line of value.split('\n')) {
      if (line.trim()) out.push(JSON.parse(line))
    }
  }
  return out
}

describe('Viscerous agent -> server run bridge', () => {
  let dataDir: string
  let cleanup: () => Promise<void>
  const storyId = 'story-agent-run-bridge'

  beforeEach(async () => {
    const tmp = await createTempDir()
    dataDir = tmp.path
    cleanup = tmp.cleanup
    await createStory(dataDir, {
      id: storyId,
      name: 'Bridge',
      description: '',
      coverImage: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: makeTestSettings(),
    })
    executeMock.mockReset()
    failMock.mockReset()
  })

  afterEach(async () => {
    clearRuns()
    await cleanup()
  })

  it('forwards agent NDJSON events and finishes the run after completion', async () => {
    const streamResult: AgentStreamResult = {
      eventStream: new ReadableStream<string>({
        start(controller) {
          controller.enqueue(JSON.stringify({ type: 'text', text: 'hello' }) + '\n')
          controller.enqueue(JSON.stringify({ type: 'finish', finishReason: 'stop', stepCount: 1 }) + '\n')
          controller.close()
        },
      }),
      completion: Promise.resolve(completion()),
    }
    executeMock.mockResolvedValue(streamResult)
    const onComplete = vi.fn()

    const run = await startAgentRun({
      dataDir,
      storyId,
      kind: 'librarian.refine',
      agentName: 'test.agent',
      input: { prompt: 'go' },
      onComplete,
    })
    await run.done

    const events = await drain(subscribeRun(run.id, 0)!)
    expect(events.map(e => e.type)).toEqual(['run-start', 'text', 'finish', 'run-end'])
    expect(events.at(-1)).toMatchObject({ status: 'complete' })
    expect(onComplete).toHaveBeenCalledWith(completion(), expect.any(AbortSignal))
    expect(failMock).not.toHaveBeenCalled()
  })

  it('explicit run cancellation cancels the owned agent stream', async () => {
    let cancelled = false
    let resolveCompletion!: (value: AgentStreamCompletion) => void
    const completionPromise = new Promise<AgentStreamCompletion>(resolve => { resolveCompletion = resolve })

    const streamResult: AgentStreamResult = {
      eventStream: new ReadableStream<string>({
        start(controller) {
          controller.enqueue(JSON.stringify({ type: 'text', text: 'partial' }) + '\n')
        },
        cancel() {
          cancelled = true
          resolveCompletion(completion())
        },
      }),
      completion: completionPromise,
    }
    executeMock.mockResolvedValue(streamResult)

    const run = await startAgentRun({
      dataDir,
      storyId,
      kind: 'librarian.refine',
      agentName: 'test.agent',
      input: {},
    })

    expect(cancelRun(run.id)).toBe(true)
    await run.done
    expect(cancelled).toBe(true)
    expect(run.status).toBe('cancelled')
  })
})
