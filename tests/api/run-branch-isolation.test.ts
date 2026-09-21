import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTempDir, makeTestSettings } from '../setup'
import { createStory } from '@/server/fragments/storage'
import { createBranch, switchActiveBranch } from '@/server/fragments/branches'
import { clearRuns, startRun } from '@/server/runs'
import { createApp } from '@/server/api'

describe('run API branch isolation', () => {
  let dataDir: string
  let cleanup: () => Promise<void>
  let app: ReturnType<typeof createApp>
  const storyId = 'story-run-branches'

  beforeEach(async () => {
    const tmp = await createTempDir()
    dataDir = tmp.path
    cleanup = tmp.cleanup
    clearRuns()
    await createStory(dataDir, {
      id: storyId,
      name: 'Run Branches',
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

  it('does not expose or cancel a run from another active branch', async () => {
    let release!: () => void
    const gate = new Promise<void>(resolve => { release = resolve })

    const run = await startRun({
      dataDir,
      storyId,
      kind: 'generation',
      body: async () => { await gate },
    })
    expect(run.branchId).toBe('main')

    const alt = await createBranch(dataDir, storyId, 'Alternate', 'main')

    const listAlt = await app.fetch(new Request(
      `http://localhost/api/stories/${storyId}/runs?active=1`,
    ))
    expect(await listAlt.json()).toEqual([])

    const getAlt = await app.fetch(new Request(
      `http://localhost/api/stories/${storyId}/runs/${run.id}`,
    ))
    expect(getAlt.status).toBe(404)

    const eventsAlt = await app.fetch(new Request(
      `http://localhost/api/stories/${storyId}/runs/${run.id}/events?cursor=0`,
    ))
    expect(eventsAlt.status).toBe(404)

    const cancelAlt = await app.fetch(new Request(
      `http://localhost/api/stories/${storyId}/runs/${run.id}/cancel`,
      { method: 'POST' },
    ))
    expect(cancelAlt.status).toBe(404)
    expect(run.status).toBe('running')

    await switchActiveBranch(dataDir, storyId, 'main')
    const getMain = await app.fetch(new Request(
      `http://localhost/api/stories/${storyId}/runs/${run.id}`,
    ))
    expect(getMain.status).toBe(200)

    await switchActiveBranch(dataDir, storyId, alt.id)
    release()
    await run.done
  })
})
