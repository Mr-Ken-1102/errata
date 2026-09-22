import { ApiError, apiFetch } from './client'
import { isTerminalChatEvent, type ChatEvent, type RunStatus, type RunSummary, type SequencedChatEvent } from './types'

const API_BASE = '/api'

export function createRunRequestId(): string {
  return `cr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export async function fetchRunEventStream(
  path: string,
  init?: RequestInit,
): Promise<ReadableStream<SequencedChatEvent>> {
  const res = await fetch(`${API_BASE}${path}`, init)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new ApiError(err.error ?? `API error: ${res.status}`, res.status, err)
  }
  if (!res.body) throw new Error('No response body')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  return new ReadableStream<SequencedChatEvent>({
    async pull(controller) {
      while (true) {
        const newlineIdx = buffer.indexOf('\n')
        if (newlineIdx !== -1) {
          const line = buffer.slice(0, newlineIdx).trim()
          buffer = buffer.slice(newlineIdx + 1)
          if (!line) {
            controller.enqueue({ type: 'keepalive' } as SequencedChatEvent)
            return
          }
          try { controller.enqueue(JSON.parse(line) as SequencedChatEvent) } catch { /* skip malformed */ }
          return
        }
        const { done, value } = await reader.read()
        if (done) {
          const remaining = buffer.trim()
          if (remaining) {
            try { controller.enqueue(JSON.parse(remaining) as SequencedChatEvent) } catch { /* skip malformed */ }
          }
          controller.close()
          return
        }
        buffer += decoder.decode(value, { stream: true })
      }
    },
    cancel() { return reader.cancel() },
  })
}

const RECONNECT_DELAYS_MS = [500, 1000, 2000, 4000, 8000]

/**
 * How long to wait for anything before treating the stream as dead. The server
 * keepalives every 5s, so silence this long means the connection is gone even
 * though the socket still looks open — and a reader that never resolves would
 * otherwise hang here forever with no stream end to trigger a reconnect.
 */
const STALL_TIMEOUT_MS = 15_000

class StreamStalled extends Error {
  constructor() {
    super('Stream stalled')
    this.name = 'StreamStalled'
  }
}

async function readWithStallTimeout<T>(
  reader: ReadableStreamDefaultReader<T>,
): Promise<ReadableStreamReadResult<T>> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      reader.read(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new StreamStalled()), STALL_TIMEOUT_MS)
      }),
    ])
  } finally {
    clearTimeout(timer)
  }
}

export interface ConsumeRunResult {
  runId: string | null
  status: RunStatus
  error?: string
}

export interface ConsumeRunOptions {
  /** Timeline pinned when the run was started. */
  branchId?: string | null
}

function conflictRunId(error: unknown): string | null {
  if (!(error instanceof ApiError) || error.status !== 409) return null
  return typeof error.data.runId === 'string' ? error.data.runId : null
}

/**
 * Start an imperative run with the same idempotency guarantee as useRunStream.
 *
 * If the initial POST loses its response, retry once with the same request id:
 * the server either starts exactly one producer or replays the one it already
 * created. A 409 from a genuinely competing surface is followed via its run id.
 */
export async function startAndConsumeRun(
  storyId: string,
  post: (clientRequestId: string) => Promise<ReadableStream<SequencedChatEvent>>,
  onEvent: (event: ChatEvent) => void,
  options: ConsumeRunOptions = {},
): Promise<ConsumeRunResult> {
  const clientRequestId = createRunRequestId()
  let stream: ReadableStream<SequencedChatEvent>

  try {
    stream = await post(clientRequestId)
  } catch (firstError) {
    const existing = conflictRunId(firstError)
    if (existing) {
      stream = await runs.events(storyId, existing, 0, options.branchId)
    } else if (!(firstError instanceof ApiError)) {
      // A transport failure may have happened after the server accepted the
      // request. The same key makes this retry attach rather than duplicate.
      try {
        stream = await post(clientRequestId)
      } catch (retryError) {
        const retryExisting = conflictRunId(retryError)
        if (!retryExisting) throw retryError
        stream = await runs.events(storyId, retryExisting, 0, options.branchId)
      }
    } else {
      throw firstError
    }
  }

  let result = await consumeRun(storyId, stream, onEvent, options)
  if (
    result.runId === null
    && result.status === 'error'
    && result.error === 'Connection lost'
  ) {
    // Same edge as the hook: the response opened but died before run-start, so
    // there is no run id to GET yet. Re-POST once with the same key.
    try {
      stream = await post(clientRequestId)
    } catch (retryError) {
      const existing = conflictRunId(retryError)
      if (!existing) throw retryError
      stream = await runs.events(storyId, existing, 0, options.branchId)
    }
    result = await consumeRun(storyId, stream, onEvent, options)
  }

  return result
}

/**
 * Read a run to completion, reconnecting across dropped connections.
 *
 * The imperative counterpart to `useRunStream`, for call sites that just
 * accumulate text inside an async handler. It gives them the important half of
 * the guarantee — a dropped connection or a backgrounded tab resumes from the
 * cursor instead of truncating — without restructuring them around a hook.
 * (Surviving an unmount or a page reload needs the hook, which persists the
 * run id.)
 *
 * `onEvent` sees every event exactly once, deduped by `seq`.
 */
export async function consumeRun(
  storyId: string,
  initial: ReadableStream<SequencedChatEvent>,
  onEvent: (event: ChatEvent) => void,
  options: ConsumeRunOptions = {},
): Promise<ConsumeRunResult> {
  let runId: string | null = null
  let cursor = 0
  let attempt = 0
  let result: ConsumeRunResult | null = null

  /** Returns true if the run reached a terminal event. */
  async function read(stream: ReadableStream<SequencedChatEvent>): Promise<boolean> {
    const reader = stream.getReader()
    try {
      while (true) {
        const { done, value } = await readWithStallTimeout(reader)
        if (done) return false

        const event = value
        // Server padding: proves the link is alive while the model is quiet.
        if (event.type === 'keepalive') continue
        if (typeof event.seq === 'number') {
          if (event.seq < cursor) continue
          cursor = event.seq + 1
        }
        if (event.type === 'run-start') runId = event.runId

        onEvent(event)

        if (isTerminalChatEvent(event)) {
          result = event.type === 'error'
            ? { runId, status: 'error', error: event.error }
            : { runId, status: event.status }
          return true
        }
      }
    } catch {
      // Stalled or errored mid-stream: not a result, so the caller reconnects.
      return false
    } finally {
      reader.cancel().catch(() => {})
    }
  }

  if (await read(initial)) return result!

  // The stream ended without a terminal event, which means the connection
  // dropped rather than the run finishing.
  while (runId) {
    const delay = RECONNECT_DELAYS_MS[Math.min(attempt, RECONNECT_DELAYS_MS.length - 1)]
    await new Promise(r => setTimeout(r, delay))
    try {
      const stream = await runs.events(storyId, runId, cursor, options.branchId)
      attempt = 0
      if (await read(stream)) return result!
    } catch (err) {
      // A 404 means the run aged out; there is nothing left to reattach to.
      if ((err as { status?: number })?.status === 404) {
        return { runId, status: 'error', error: 'This generation is no longer available' }
      }
      attempt += 1
    }
  }

  return { runId, status: 'error', error: 'Connection lost' }
}

export const runs = {
  /** List runs for a story. `active` filters to generations still in flight. */
  list: (storyId: string, opts?: { active?: boolean; scopeId?: string | null; branchId?: string | null }) => {
    const params = new URLSearchParams()
    if (opts?.active) params.set('active', '1')
    if (opts?.scopeId != null) params.set('scopeId', opts.scopeId)
    if (opts?.branchId) params.set('branchId', opts.branchId)
    const query = params.toString()
    return apiFetch<RunSummary[]>(`/stories/${storyId}/runs${query ? `?${query}` : ''}`)
  },

  get: (storyId: string, runId: string, branchId?: string | null) => {
    const query = branchId ? `?branchId=${encodeURIComponent(branchId)}` : ''
    return apiFetch<RunSummary>(`/stories/${storyId}/runs/${runId}${query}`)
  },

  /**
   * Reattach to a run, replaying everything from `cursor` and then following
   * live. This is what turns a dropped connection into a non-event.
   */
  events: (storyId: string, runId: string, cursor = 0, branchId?: string | null) => {
    const params = new URLSearchParams({ cursor: String(cursor) })
    if (branchId) params.set('branchId', branchId)
    return fetchRunEventStream(
      `/stories/${storyId}/runs/${runId}/events?${params.toString()}`,
    ) as Promise<ReadableStream<SequencedChatEvent>>
  },

  /** Explicit user Stop — the only thing that ends a generation early. */
  cancel: (storyId: string, runId: string, branchId?: string | null) => {
    const query = branchId ? `?branchId=${encodeURIComponent(branchId)}` : ''
    return apiFetch<{ ok: boolean; cancelled: boolean }>(
      `/stories/${storyId}/runs/${runId}/cancel${query}`,
      { method: 'POST' },
    )
  },
}
