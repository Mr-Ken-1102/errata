import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTempDir, makeTestSettings } from '../setup'
import { createStory } from '@/server/fragments/storage'
import { clearRuns, startRun } from '@/server/runs'
import { createApp } from '@/server/api'

const STORY_ID = 'story-run-infra'

function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>(r => { resolve = r })
  return { promise, resolve }
}

describe('run infrastructure routes', () => {
  let dataDir: string
  let cleanup: () => Promise<void>
  let app: ReturnType<typeof createApp>

  beforeEach(async () => {
    const tmp = await createTempDir()
    dataDir = tmp.path
    cleanup = tmp.cleanup
    await createStory(dataDir, {
      id: STORY_ID,
      name: 'Run Infra',
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

  it('lists and replays a completed run', async () => {
    const run = await startRun({
      dataDir,
      storyId: STORY_ID,
      kind: 'generation',
      body: async ({ emit }) => {
        emit({ type: 'text', text: 'hello' })
        emit({ type: 'finish', finishReason: 'stop', stepCount: 1 })
      },
    })
    await run.done

    const listRes = await app.fetch(new Request(`http://localhost/api/stories/${STORY_ID}/runs`))
    expect(listRes.status).toBe(200)
    const listed = await listRes.json() as Array<{ id: string; status: string }>
    expect(listed.find(item => item.id === run.id)?.status).toBe('complete')

    const eventRes = await app.fetch(new Request(`http://localhost/api/stories/${STORY_ID}/runs/${run.id}/events?cursor=0`))
    expect(eventRes.status).toBe(200)
    const body = await eventRes.text()
    expect(body).toContain('"type":"run-start"')
    expect(body).toContain('"type":"text"')
    expect(body).toContain('"type":"run-end"')
  })

  it('cancels only through the explicit cancel endpoint', async () => {
    const gate = deferred()
    const run = await startRun({
      dataDir,
      storyId: STORY_ID,
      kind: 'generation',
      body: async ({ signal }) => {
        await Promise.race([
          gate.promise,
          new Promise<void>(resolve => signal.addEventListener('abort', () => resolve(), { once: true })),
        ])
      },
    })

    const res = await app.fetch(new Request(`http://localhost/api/stories/${STORY_ID}/runs/${run.id}/cancel`, { method: 'POST' }))
    expect(res.status).toBe(200)
    await run.done
    expect(run.status).toBe('cancelled')
    gate.resolve()
  })
})
