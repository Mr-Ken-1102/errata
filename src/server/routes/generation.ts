import { Elysia, t } from 'elysia'
import { getStory, getFragment } from '../fragments/storage'
import { invokeAgent } from '../agents/runner'
import { createLogger } from '../logging'
import type { DirectionProposalResult } from '../directions/suggest'
import { runGeneration } from '../generation/run-generation'
import { getBranchesIndex, isBranchDeleting } from '../fragments/branches'
import { startRun, findLiveRun } from '../runs'
import type { ServerRunEvent } from '../runs/types'
import { resolveExistingRun, runStreamResponse } from '../runs/http'
import { withKeyLock } from '../async-lock'
import { describeError } from '../error-message'

async function forwardGenerationEvents(
  stream: ReadableStream<Uint8Array>,
  emit: (event: ServerRunEvent) => void,
): Promise<void> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      while (true) {
        const newline = buffer.indexOf('\n')
        if (newline < 0) break
        const line = buffer.slice(0, newline).trim()
        buffer = buffer.slice(newline + 1)
        if (!line) continue
        emit(JSON.parse(line) as ServerRunEvent)
      }
    }

    buffer += decoder.decode()
    const tail = buffer.trim()
    if (tail) emit(JSON.parse(tail) as ServerRunEvent)
  } finally {
    try { reader.releaseLock() } catch { /* stream may already be errored */ }
  }
}

export function generationRoutes(dataDir: string) {
  const logger = createLogger('api:generation', { dataDir })

  return new Elysia({ detail: { tags: ['Generation'] } })
    .post('/stories/:storyId/propose-directions', async ({ params, body, set }) => {
      const requestLogger = logger.child({ storyId: params.storyId })
      requestLogger.info('Propose directions request')

      const story = await getStory(dataDir, params.storyId)
      if (!story) {
        set.status = 404
        return { error: 'Story not found' }
      }

      try {
        const { output } = await invokeAgent<DirectionProposalResult>({
          dataDir,
          storyId: params.storyId,
          agentName: 'directions.suggest',
          input: { count: body.count },
        })
        return { suggestions: output.suggestions }
      } catch (err) {
        requestLogger.error('Propose directions failed', { error: err instanceof Error ? err.message : String(err) })
        set.status = 502
        return { error: err instanceof Error ? err.message : 'Failed to generate suggestions' }
      }
    }, {
      body: t.Object({
        count: t.Optional(t.Number()),
      }),
      detail: { summary: 'Get AI-generated story direction suggestions' },
    })
    .post('/stories/:storyId/generate', async ({ params, body, set }) => {
      const requestLogger = logger.child({ storyId: params.storyId })

      const story = await getStory(dataDir, params.storyId)
      if (!story) {
        set.status = 404
        return { error: 'Story not found' }
      }

      if (!body.input?.trim()) {
        set.status = 422
        return { error: 'Input is required' }
      }

      const branches = await getBranchesIndex(dataDir, params.storyId)
      const branchId = body.branchId ?? branches.activeBranchId
      if (!branches.branches.some(branch => branch.id === branchId)) {
        set.status = 404
        return { error: `Timeline '${branchId}' not found` }
      }
      if (isBranchDeleting(params.storyId, branchId)) {
        set.status = 409
        return { error: `Timeline '${branchId}' is being deleted` }
      }

      const mode = body.mode ?? 'generate'
      if (mode === 'regenerate' || mode === 'refine') {
        if (!body.fragmentId) {
          set.status = 422
          return { error: 'fragmentId is required for regenerate/refine modes' }
        }
        const fragment = await getFragment(dataDir, params.storyId, body.fragmentId)
        if (!fragment) {
          set.status = 404
          return { error: 'Fragment not found' }
        }
      }

      // A continuation is one story-level surface. Regenerate/refine is scoped
      // to the fragment being replaced, so independent passages may proceed
      // without attaching to each other.
      const scopeId = body.scopeId ?? body.fragmentId ?? null
      const lockKey = `generation-start:${params.storyId}:${branchId}:${scopeId ?? 'story'}`

      return withKeyLock(lockKey, async () => {
        const existing = resolveExistingRun(
          params.storyId,
          scopeId,
          body.clientRequestId,
          branchId,
        )
        if (existing) return existing

        const live = findLiveRun(params.storyId, 'generation', scopeId, branchId)
        if (live) {
          return new Response(JSON.stringify({
            error: 'A generation is already running for this surface',
            runId: live.id,
          }), {
            status: 409,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        try {
          const run = await startRun({
            dataDir,
            storyId: params.storyId,
            kind: 'generation',
            scopeId,
            branchId,
            ...(body.clientRequestId ? { clientRequestId: body.clientRequestId } : {}),
            body: async ({ runId, emit, signal }) => {
              const result = await runGeneration(
                dataDir,
                params.storyId,
                {
                  ...body,
                  runId,
                  branchId,
                },
                { abortSignal: signal },
              )

              // Route pre-validation should make this rare, but the engine owns
              // the canonical validation and can still reject a request if state
              // changes before the detached body starts.
              if (!result.ok) {
                throw new Error(result.error)
              }

              await forwardGenerationEvents(result.eventStream, emit)
            },
          })

          requestLogger.info('Generation run started', {
            runId: run.id,
            branchId,
            scopeId,
            saveResult: body.saveResult ?? false,
            mode,
          })
          return runStreamResponse(run)
        } catch (error) {
          requestLogger.error('Generation failed to start', { error: describeError(error) })
          return new Response(JSON.stringify({
            error: error instanceof Error ? error.message : 'Generation failed',
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      })
    }, {
      body: t.Object({
        input: t.String(),
        runId: t.Optional(t.String()),
        clientRequestId: t.Optional(t.String()),
        scopeId: t.Optional(t.String()),
        branchId: t.Optional(t.String()),
        saveResult: t.Optional(t.Boolean()),
        mode: t.Optional(t.Union([t.Literal('generate'), t.Literal('regenerate'), t.Literal('refine')])),
        fragmentId: t.Optional(t.String()),
        clarifications: t.Optional(t.Array(t.Object({ question: t.String(), answer: t.String() }))),
        clarifyRound: t.Optional(t.Number()),
      }),
      detail: { summary: 'Generate prose (server-owned run; streaming NDJSON)' },
    })
}
