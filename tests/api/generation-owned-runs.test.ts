import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createTempDir, makeTestSettings } from '../setup'
import { createStory } from '@/server/fragments/storage'
import { clearRuns, getRun } from '@/server/runs'
import type { ServerRunEvent } from '@/server/runs/types'

const mocks = vi.hoisted(() => ({
  runGeneration: vi.fn(),
}))

vi.mock('@/server/generation/run-generation', () => ({
  runGeneration: mocks.runGeneration,
}))

import { createApp } from '@/server/api'

function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>(r => { resolve = r })
  return { promise, resolve }
}

function engineStream(
  initial: ServerRunEvent[] = [],
  later: ServerRunEvent[] = [],
  gate?: ReturnType<typeof deferred>,
  signal?: AbortSignal,
  onCancel?: () => void,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  return new ReadableStream<Uint8Array>({
    start(controller) {
      const emit = (event: ServerRunEvent) =>
        controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'))

      for (const event of initial) emit(event)

      let closed = false
      const close = () => {
        if (closed) return
        closed = true
        controller.close()
      }

      if (signal) {
        signal.addEventListener('abort', close, { once: true })
      }

      if (gate) {
        void gate.promise.then(() => {
          if (closed) return
          for (const event of later) emit(event)
          close()
        })
      } else {
        for (const event of later) emit(event)
        close()
      }
    },
    cancel() {
      onCancel?.()
    },
  })
}

async function readRunStart(response: Response) {
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
      if (event.type === 'run-start') {
        return { runId: event.runId as string, reader }
      }
    }
  }
}

async function readAllEvents(response: Response): Promise<any[]> {
  const text = await response.text()
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => JSON.parse(line))
}

describe('server-owned generation route', () => {
  let dataDir: string
  let cleanup: () => Promise<void>
  let app: ReturnType<typeof createApp>
  const storyId = 'story-generation-owned'

  beforeEach(async () => {
    const tmp = await createTempDir()
    dataDir = tmp.path
    cleanup = tmp.cleanup
    clearRuns()
    mocks.runGeneration.mockReset()

    await createStory(dataDir, {
      id: storyId,
      name: 'Owned generation',
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

  const post = (body: Record<string, unknown>) =>
    app.fetch(new Request(`http://localhost/api/stories/${storyId}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }))

  it('keeps the engine alive when the HTTP subscriber disconnects', async () => {
    const gate = deferred()
    const engineReaderCancelled = vi.fn()
    let engineSignal: AbortSignal | undefined

    mocks.runGeneration.mockImplementation(async (
      _dataDir: string,
      _storyId: string,
      _body: unknown,
      options: { abortSignal?: AbortSignal },
    ) => {
      engineSignal = options.abortSignal
      return {
        ok: true as const,
        eventStream: engineStream(
          [{ type: 'text', text: 'first ' }],
          [
            { type: 'text', text: 'second' },
            { type: 'finish', finishReason: 'stop', stepCount: 1 },
          ],
          gate,
          options.abortSignal,
          engineReaderCancelled,
        ),
      }
    })

    const response = await post({
      input: 'Continue',
      saveResult: true,
      scopeId: 'inline-generation',
      clientRequestId: 'disconnect-1',
    })
    const { runId, reader } = await readRunStart(response)

    await reader.cancel()
    expect(engineSignal?.aborted).toBe(false)
    expect(engineReaderCancelled).not.toHaveBeenCalled()

    gate.resolve()
    await getRun(runId)!.done

    expect(getRun(runId)?.status).toBe('complete')
    expect(engineSignal?.aborted).toBe(false)
    expect(engineReaderCancelled).not.toHaveBeenCalled()
  })

  it('ignores a client-supplied run id and passes the server-owned id to the engine', async () => {
    let engineBody: unknown
    mocks.runGeneration.mockImplementation(async (
      _dataDir: string,
      _storyId: string,
      body: unknown,
    ) => {
      engineBody = body
      return {
        ok: true as const,
        eventStream: engineStream([
          { type: 'finish', finishReason: 'stop', stepCount: 1 },
        ]),
      }
    })

    const response = await post({
      input: 'Continue',
      runId: 'client-owned-run-id',
      clientRequestId: 'server-authority-1',
    })
    const events = await readAllEvents(response)
    const started = events.find(event => event.type === 'run-start')

    expect(started?.runId).toBeTruthy()
    expect(started?.runId).not.toBe('client-owned-run-id')
    expect(engineBody).toMatchObject({ runId: started.runId })
  })

  it('forwards the requested POV into the server-owned engine body', async () => {
    let engineBody: Record<string, unknown> | undefined
    mocks.runGeneration.mockImplementation(async (
      _dataDir: string,
      _storyId: string,
      body: Record<string, unknown>,
    ) => {
      engineBody = body
      return {
        ok: true as const,
        eventStream: engineStream([
          { type: 'finish', finishReason: 'stop', stepCount: 1 },
        ]),
      }
    })

    const response = await post({
      input: 'Continue',
      clientRequestId: 'pov-request-1',
      povCharacterId: 'ch-maya',
    })
    const events = await readAllEvents(response)
    const started = events.find(event => event.type === 'run-start')

    expect(started?.runId).toBeTruthy()
    expect(engineBody).toMatchObject({
      runId: started.runId,
      povCharacterId: 'ch-maya',
    })
  })

  it('replays the same producer for an idempotent POST retry', async () => {
    const gate = deferred()
    mocks.runGeneration.mockImplementation(async (
      _dataDir: string,
      _storyId: string,
      _body: unknown,
      options: { abortSignal?: AbortSignal },
    ) => ({
      ok: true as const,
      eventStream: engineStream(
        [],
        [{ type: 'finish', finishReason: 'stop', stepCount: 1 }],
        gate,
        options.abortSignal,
      ),
    }))

    const body = {
      input: 'Continue',
      scopeId: 'generation-panel',
      clientRequestId: 'same-request',
    }

    const first = await post(body)
    const a = await readRunStart(first)
    const retry = await post(body)
    const b = await readRunStart(retry)

    expect(b.runId).toBe(a.runId)

    await new Promise(resolve => setTimeout(resolve, 0))
    expect(mocks.runGeneration).toHaveBeenCalledTimes(1)

    gate.resolve()
    await getRun(a.runId)!.done
    await a.reader.cancel()
    await b.reader.cancel()
  })

  it('returns the live run id for a competing generation on the same surface', async () => {
    const gate = deferred()
    mocks.runGeneration.mockImplementation(async (
      _dataDir: string,
      _storyId: string,
      _body: unknown,
      options: { abortSignal?: AbortSignal },
    ) => ({
      ok: true as const,
      eventStream: engineStream([], [], gate, options.abortSignal),
    }))

    const first = await post({
      input: 'First',
      scopeId: 'generation-panel',
      clientRequestId: 'request-a',
    })
    const { runId, reader } = await readRunStart(first)

    const second = await post({
      input: 'Second',
      scopeId: 'generation-panel',
      clientRequestId: 'request-b',
    })
    expect(second.status).toBe(409)
    expect(await second.json()).toMatchObject({ runId })

    gate.resolve()
    await getRun(runId)!.done
    await reader.cancel()
  })

  it('forwards Stop into the engine abort signal and settles cancelled', async () => {
    let engineSignal: AbortSignal | undefined
    mocks.runGeneration.mockImplementation(async (
      _dataDir: string,
      _storyId: string,
      _body: unknown,
      options: { abortSignal?: AbortSignal },
    ) => {
      engineSignal = options.abortSignal
      return {
        ok: true as const,
        eventStream: engineStream(
          [{ type: 'text', text: 'partial' }],
          [],
          deferred(),
          options.abortSignal,
        ),
      }
    })

    const response = await post({
      input: 'Continue',
      scopeId: 'inline-generation',
      clientRequestId: 'cancel-1',
    })
    const { runId, reader } = await readRunStart(response)

    const cancel = await app.fetch(new Request(
      `http://localhost/api/stories/${storyId}/runs/${runId}/cancel`,
      { method: 'POST' },
    ))
    expect(cancel.status).toBe(200)

    await getRun(runId)!.done
    expect(engineSignal?.aborted).toBe(true)
    expect(getRun(runId)?.status).toBe('cancelled')
    await reader.cancel()
  })

  it('preserves prewriter, clarify, rejection and finish events through the run log', async () => {
    mocks.runGeneration.mockImplementation(async () => ({
      ok: true as const,
      eventStream: engineStream([
        { type: 'phase', phase: 'prewriting' },
        { type: 'prewriter-text', text: 'brief' },
        {
          type: 'clarify-questions',
          questions: [{
            question: 'Which door?',
            header: 'Door',
            multiSelect: false,
            options: [],
          }],
          round: 0,
        },
        {
          type: 'generation-rejected',
          reason: 'Incomplete output',
          code: 'incomplete_finish',
          finishReason: 'length',
        },
        { type: 'finish', finishReason: 'length', stepCount: 2 },
      ]),
    }))

    const response = await post({
      input: 'Continue',
      scopeId: 'generation-panel',
      clientRequestId: 'events-1',
    })

    const events = await readAllEvents(response)
    expect(events.some(event => event.type === 'run-start')).toBe(true)
    expect(events.some(event => event.type === 'phase' && event.phase === 'prewriting')).toBe(true)
    expect(events.some(event => event.type === 'prewriter-text' && event.text === 'brief')).toBe(true)
    expect(events.some(event => event.type === 'clarify-questions')).toBe(true)
    expect(events.some(event => event.type === 'generation-rejected')).toBe(true)
    expect(events.some(event => event.type === 'finish' && event.finishReason === 'length')).toBe(true)
    expect(events.at(-1)).toMatchObject({ type: 'run-end', status: 'complete' })

    const sequenced = events.filter(event => typeof event.seq === 'number')
    expect(sequenced.map(event => event.seq)).toEqual(
      sequenced.map((_, index) => index),
    )
  })
})
