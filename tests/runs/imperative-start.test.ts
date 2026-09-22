import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/lib/api/client'
import { startAndConsumeRun } from '@/lib/api/runs'
import type { SequencedChatEvent } from '@/lib/api/types'

function completedStream(runId: string, text = 'done'): ReadableStream<SequencedChatEvent> {
  return new ReadableStream<SequencedChatEvent>({
    start(controller) {
      controller.enqueue({
        type: 'run-start',
        runId,
        kind: 'generation',
        status: 'running',
        seq: 0,
      })
      controller.enqueue({ type: 'text', text, seq: 1 })
      controller.enqueue({ type: 'run-end', status: 'complete', seq: 2 })
      controller.close()
    },
  })
}

describe('startAndConsumeRun', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('retries a lost POST response with the same idempotency key', async () => {
    const ids: string[] = []
    let calls = 0
    const events: string[] = []

    const result = await startAndConsumeRun(
      'story-1',
      async (clientRequestId) => {
        ids.push(clientRequestId)
        calls += 1
        if (calls === 1) throw new Error('connection reset after send')
        return completedStream('run-1')
      },
      event => events.push(event.type),
    )

    expect(calls).toBe(2)
    expect(ids[0]).toBe(ids[1])
    expect(result).toMatchObject({ runId: 'run-1', status: 'complete' })
    expect(events).toEqual(['run-start', 'text', 'run-end'])
  })

  it('attaches to the run id returned by a same-surface 409', async () => {
    const body = [
      JSON.stringify({
        type: 'run-start',
        runId: 'run-existing',
        kind: 'generation',
        status: 'running',
        seq: 0,
      }),
      JSON.stringify({ type: 'text', text: 'existing output', seq: 1 }),
      JSON.stringify({ type: 'run-end', status: 'complete', seq: 2 }),
      '',
    ].join('\n')

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      expect(String(input)).toContain('/stories/story-1/runs/run-existing/events?cursor=0&branchId=main')
      return new Response(body, {
        status: 200,
        headers: { 'Content-Type': 'application/x-ndjson' },
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    const seen: string[] = []
    const result = await startAndConsumeRun(
      'story-1',
      async () => {
        throw new ApiError('already running', 409, { runId: 'run-existing' })
      },
      event => {
        if (event.type === 'text') seen.push(event.text)
      },
      { branchId: 'main' },
    )

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(seen).toEqual(['existing output'])
    expect(result).toMatchObject({ runId: 'run-existing', status: 'complete' })
  })

  it('re-POSTs with the same key when a 200 stream ends before run-start', async () => {
    const ids: string[] = []
    let calls = 0

    const result = await startAndConsumeRun(
      'story-1',
      async (clientRequestId) => {
        ids.push(clientRequestId)
        calls += 1
        if (calls === 1) {
          return new ReadableStream<SequencedChatEvent>({
            start(controller) { controller.close() },
          })
        }
        return completedStream('run-after-empty-stream')
      },
      () => {},
    )

    expect(calls).toBe(2)
    expect(ids[0]).toBe(ids[1])
    expect(result).toMatchObject({
      runId: 'run-after-empty-stream',
      status: 'complete',
    })
  })

})
