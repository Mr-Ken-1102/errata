import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTempDir } from '../setup'
import { createApp } from '@/server/api'

let dataDir: string
let cleanup: () => Promise<void>
let app: ReturnType<typeof createApp>

beforeEach(async () => {
  const tmp = await createTempDir()
  dataDir = tmp.path
  cleanup = tmp.cleanup
  app = createApp(dataDir)
})

afterEach(async () => {
  await cleanup()
})

async function api(path: string, init?: RequestInit) {
  const response = await app.fetch(new Request(`http://localhost/api${path}`, init))
  return { status: response.status, json: async () => response.json() }
}

async function apiJson(path: string, body: unknown, method = 'POST') {
  return api(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeBundle(overrides?: Record<string, unknown>) {
  return {
    _errata: 'fragment-bundle',
    version: 1,
    source: 'test-source',
    exportedAt: new Date().toISOString(),
    storyName: 'Source Story',
    fragments: [
      {
        id: 'ch-alice1',
        type: 'character',
        name: 'Alice',
        description: 'Protagonist',
        content: 'Alice is the protagonist.',
        tags: ['cast'],
        sticky: true,
        refs: ['ch-bob0001'],
      },
      {
        id: 'ch-bob0001',
        type: 'character',
        name: 'Bob',
        description: 'Deuteragonist',
        content: 'Bob is the deuteragonist.',
        tags: ['cast'],
        sticky: false,
        refs: ['ch-alice1'],
      },
    ],
    ...overrides,
  }
}

describe('story preset API routes', () => {
  it('creates, lists, gets, renames, and deletes presets', async () => {
    const createdResponse = await apiJson('/presets', {
      name: ' Noir Cast ',
      description: ' reusable cast ',
      bundle: makeBundle(),
    })
    expect(createdResponse.status).toBe(200)
    const created = await createdResponse.json()
    expect(created.name).toBe('Noir Cast')
    expect(created.fragmentCount).toBe(2)

    const list = await api('/presets')
    expect(list.status).toBe(200)
    expect((await list.json()).presets).toHaveLength(1)

    const get = await api(`/presets/${created.id}`)
    expect(get.status).toBe(200)
    expect((await get.json()).bundle.fragments).toHaveLength(2)

    const renamed = await apiJson(`/presets/${created.id}`, { name: 'Renamed' }, 'PATCH')
    expect(renamed.status).toBe(200)
    expect((await renamed.json()).name).toBe('Renamed')

    const removed = await api(`/presets/${created.id}`, { method: 'DELETE' })
    expect(removed.status).toBe(200)
    expect((await api(`/presets/${created.id}`)).status).toBe(404)
  })

  it('returns 422 for invalid metadata and unsafe bundles', async () => {
    expect((await apiJson('/presets', { name: '   ', bundle: makeBundle() })).status).toBe(422)

    const withConfig = await apiJson('/presets', {
      name: 'Bad preset',
      bundle: makeBundle({ blockConfig: { customBlocks: [], overrides: {}, blockOrder: [] } }),
    })
    expect(withConfig.status).toBe(422)
    expect((await withConfig.json()).error).toMatch(/block configuration/i)

    const withProse = await apiJson('/presets', {
      name: 'Bad preset',
      bundle: makeBundle({
        fragments: [
          ...makeBundle().fragments,
          { type: 'prose', name: 'Chapter', content: 'text', tags: [], sticky: false },
        ],
      }),
    })
    expect(withProse.status).toBe(422)
    expect((await withProse.json()).error).toMatch(/prose/)
  })

  it('returns 404 for unknown preset operations', async () => {
    expect((await api('/presets/preset-doesnotexist')).status).toBe(404)
    expect((await apiJson('/presets/preset-doesnotexist', { name: 'X' }, 'PATCH')).status).toBe(404)
    expect((await api('/presets/preset-doesnotexist', { method: 'DELETE' })).status).toBe(404)
  })

  it('applies copied fragments with internal refs and local preset provenance', async () => {
    const preset = await (await apiJson('/presets', { name: 'Noir Cast', bundle: makeBundle() })).json()
    const story = await (await apiJson('/stories', { name: 'Target Story', description: '' })).json()

    const applied = await apiJson(`/presets/${preset.id}/apply`, { storyId: story.id })
    expect(applied.status).toBe(200)
    const body = await applied.json()
    expect(body.count).toBe(2)

    const alice = body.fragments.find((fragment: { name: string }) => fragment.name === 'Alice')
    const bob = body.fragments.find((fragment: { name: string }) => fragment.name === 'Bob')
    expect(alice.refs).toEqual([bob.id])
    expect(bob.refs).toEqual([alice.id])
    expect(alice.meta.preset).toMatchObject({ id: preset.id, name: 'Noir Cast' })
    expect(alice.meta.erratanet).toBeUndefined()

    const second = await (await apiJson(`/presets/${preset.id}/apply`, { storyId: story.id })).json()
    const firstIds = new Set(body.fragments.map((fragment: { id: string }) => fragment.id))
    expect(second.fragments.every((fragment: { id: string }) => !firstIds.has(fragment.id))).toBe(true)

    const storedPreset = await (await api(`/presets/${preset.id}`)).json()
    expect(storedPreset.bundle.fragments.find((fragment: { id: string }) => fragment.id === 'ch-alice1')).toBeDefined()
  })

  it('404s when applying an unknown preset or to an unknown story', async () => {
    const story = await (await apiJson('/stories', { name: 'Target Story', description: '' })).json()
    expect((await apiJson('/presets/preset-doesnotexist/apply', { storyId: story.id })).status).toBe(404)

    const preset = await (await apiJson('/presets', { name: 'Noir Cast', bundle: makeBundle() })).json()
    expect((await apiJson(`/presets/${preset.id}/apply`, { storyId: 'story-doesnotexist' })).status).toBe(404)
  })
})
