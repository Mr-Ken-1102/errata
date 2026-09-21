/**
 * Bridge Viscerous' NDJSON AgentStreamResult into the server-owned run registry.
 *
 * The agent stream remains the single source of agent lifecycle/activity events.
 * This adapter owns the stream reader so an HTTP subscriber disconnect cannot
 * cancel the model. Only the run registry's explicit AbortSignal cancels it.
 */
import { createAgentInstance } from '../agents'
import type { AgentStreamCompletion, AgentStreamEvent } from '../agents/stream-types'
import { startRun, type Run } from './registry'
import type { RunKind } from './types'

export interface StartAgentRunOptions {
  dataDir: string
  storyId: string
  kind: RunKind
  scopeId?: string | null
  clientRequestId?: string
  branchId?: string
  agentName: string
  input: Record<string, unknown>
  onStart?: (runId: string) => Promise<void> | void
  onEvent?: (event: AgentStreamEvent) => Promise<void> | void
  onComplete?: (result: AgentStreamCompletion, signal: AbortSignal) => Promise<void> | void
  onError?: (error: unknown, signal: AbortSignal) => Promise<void> | void
}

function emitNdjsonChunk(
  chunk: string,
  buffer: string,
  emit: (event: AgentStreamEvent) => void,
): string {
  buffer += chunk
  while (true) {
    const newline = buffer.indexOf('\n')
    if (newline < 0) return buffer
    const line = buffer.slice(0, newline).trim()
    buffer = buffer.slice(newline + 1)
    if (!line) continue
    try {
      emit(JSON.parse(line) as AgentStreamEvent)
    } catch {
      // Malformed diagnostic output must not abort an otherwise valid model run.
    }
  }
}

export async function startAgentRun(opts: StartAgentRunOptions): Promise<Run> {
  return startRun({
    dataDir: opts.dataDir,
    storyId: opts.storyId,
    kind: opts.kind,
    scopeId: opts.scopeId ?? null,
    ...(opts.clientRequestId ? { clientRequestId: opts.clientRequestId } : {}),
    ...(opts.branchId ? { branchId: opts.branchId } : {}),
    body: async ({ runId, emit, signal }) => {
      await opts.onStart?.(runId)
      const agent = createAgentInstance(opts.agentName, {
        dataDir: opts.dataDir,
        storyId: opts.storyId,
        runId,
      })

      let streamResult
      try {
        streamResult = await agent.execute(opts.input)
      } catch (error) {
        agent.fail(error)
        throw error
      }

      const reader = streamResult.eventStream.getReader()
      let buffer = ''
      let readerCancelled = false

      const cancel = () => {
        if (readerCancelled) return
        readerCancelled = true
        // Cancelling the Viscerous event stream invokes createEventStream's
        // onCancel callback, which aborts the provider request.
        void reader.cancel(signal.reason).catch(() => {})
      }
      if (signal.aborted) cancel()
      else signal.addEventListener('abort', cancel, { once: true })

      try {
        while (!signal.aborted) {
          const { done, value } = await reader.read()
          if (done) break
          buffer = emitNdjsonChunk(value, buffer, (event) => {
            void opts.onEvent?.(event)
            emit(event)
          })
        }

        // A final event may arrive without a trailing newline.
        const tail = buffer.trim()
        if (tail && !signal.aborted) {
          try {
            const event = JSON.parse(tail) as AgentStreamEvent
            await opts.onEvent?.(event)
            emit(event)
          } catch { /* ignore malformed tail */ }
        }

        const result = await streamResult.completion
        await opts.onComplete?.(result, signal)
      } catch (error) {
        await opts.onError?.(error, signal)
        throw error
      } finally {
        signal.removeEventListener('abort', cancel)
        try { reader.releaseLock() } catch { /* reader may have been cancelled */ }
      }
    },
  })
}
