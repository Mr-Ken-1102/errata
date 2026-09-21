import { Elysia, t } from 'elysia'
import { getRun, listRuns, cancelRun } from '../runs'
import { runStreamResponse } from '../runs/http'
import { createLogger } from '../logging'
import { getActiveBranchId } from '../fragments/branches'

/**
 * Reattachment surface for server-authoritative generations.
 *
 * A client that lost its connection — or reloaded, or came back to a
 * backgrounded tab — finds its run here and resumes reading from the cursor it
 * had reached, instead of losing the turn.
 */
export function runRoutes(dataDir: string) {
  const logger = createLogger('api:runs')

  return new Elysia({ detail: { tags: ['Runs'] } })
    .get('/stories/:storyId/runs', async ({ params, query }) => {
      const active = query.active === '1' || query.active === 'true'
      const scopeId = typeof query.scopeId === 'string' ? query.scopeId : undefined
      const branchId = await getActiveBranchId(dataDir, params.storyId)
      return listRuns(params.storyId, {
        branchId,
        ...(active ? { active: true } : {}),
        ...(scopeId !== undefined ? { scopeId } : {}),
      })
    }, {
      query: t.Object({
        active: t.Optional(t.String()),
        scopeId: t.Optional(t.String()),
      }),
      detail: { summary: 'List runs for a story (use ?active=1 for in-flight runs)' },
    })

    .get('/stories/:storyId/runs/:runId', async ({ params, set }) => {
      const run = getRun(params.runId)
      const branchId = await getActiveBranchId(dataDir, params.storyId)
      if (!run || run.storyId !== params.storyId || run.branchId !== branchId) {
        set.status = 404
        return { error: 'Run not found' }
      }
      return {
        id: run.id,
        storyId: run.storyId,
        kind: run.kind,
        scopeId: run.scopeId,
        status: run.status,
        startedAt: run.startedAt,
        ...(run.finishedAt ? { finishedAt: run.finishedAt } : {}),
        ...(run.error ? { error: run.error } : {}),
        seq: run.events.length,
      }
    }, { detail: { summary: 'Get a run' } })

    .get('/stories/:storyId/runs/:runId/events', async ({ params, query, set }) => {
      const run = getRun(params.runId)
      const branchId = await getActiveBranchId(dataDir, params.storyId)
      if (!run || run.storyId !== params.storyId || run.branchId !== branchId) {
        set.status = 404
        return { error: 'Run not found' }
      }
      const cursor = Number.parseInt(query.cursor ?? '0', 10)
      return runStreamResponse(run, Number.isFinite(cursor) && cursor > 0 ? cursor : 0)
    }, {
      query: t.Object({ cursor: t.Optional(t.String()) }),
      detail: { summary: 'Stream a run’s events from a cursor (NDJSON, replay then live)' },
    })

    .post('/stories/:storyId/runs/:runId/cancel', async ({ params, set }) => {
      const run = getRun(params.runId)
      const branchId = await getActiveBranchId(dataDir, params.storyId)
      if (!run || run.storyId !== params.storyId || run.branchId !== branchId) {
        set.status = 404
        return { error: 'Run not found' }
      }
      const cancelled = cancelRun(params.runId)
      logger.info('Run cancel requested', { runId: params.runId, cancelled })
      return { ok: true, cancelled, status: run.status }
    }, { detail: { summary: 'Cancel a run (the only thing that stops a generation)' } })
}
