import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTempDir, makeTestSettings } from '../setup'
import { createPreset, getPreset } from '@/server/presets/storage'
import { installFragmentBundle } from '@/server/erratanet/pack-install'
import { createFragment, createStory, getFragment, updateFragment } from '@/server/fragments/storage'
import type { FragmentBundleData } from '@/lib/fragment-clipboard'

const STORY_ID = 'story-preset-target'
const PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC'

function makeBundle(): FragmentBundleData {
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
        placement: 'system',
        order: 3,
        refs: ['ch-bob0001'],
        meta: { erratanet: { pack: '@old/source', version: '1.0.0' } },
        attachments: [
          { kind: 'image', name: 'Alice portrait', description: 'Portrait', content: PNG_DATA_URL },
        ],
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
  }
}

describe('applying a story preset', () => {
  let dataDir: string
  let cleanup: () => Promise<void>

  beforeEach(async () => {
    const tmp = await createTempDir()
    dataDir = tmp.path
    cleanup = tmp.cleanup
    const now = new Date().toISOString()
    await createStory(dataDir, {
      id: STORY_ID,
      name: 'Apply Target',
      description: '',
      coverImage: null,
      createdAt: now,
      updatedAt: now,
      settings: makeTestSettings(),
    })
  })

  afterEach(async () => {
    await cleanup()
  })

  it('copies independently, re-wires refs and portraits, and stamps only preset provenance', async () => {
    const preset = await createPreset(dataDir, { name: 'Noir Cast', bundle: makeBundle() })
    const storedPreset = (await getPreset(dataDir, preset.id))!

    const created = await installFragmentBundle(dataDir, STORY_ID, storedPreset.bundle, {
      pack: preset.id,
      version: '0.0.0',
      kind: 'preset',
      presetName: preset.name,
    })
    const alice = created.find(fragment => fragment.name === 'Alice')!
    const bob = created.find(fragment => fragment.name === 'Bob')!

    expect(alice.refs).toEqual([bob.id])
    expect(bob.refs).toEqual([alice.id])
    expect(alice.sticky).toBe(true)
    expect(alice.placement).toBe('system')
    expect(alice.order).toBe(3)
    expect(alice.meta.preset).toMatchObject({ id: preset.id, name: 'Noir Cast' })
    expect(alice.meta.erratanet).toBeUndefined()

    const visualRefs = alice.meta.visualRefs as Array<{ fragmentId: string; kind: string }>
    expect(visualRefs).toHaveLength(1)
    const portrait = created.find(fragment => fragment.id === visualRefs[0].fragmentId)!
    expect(portrait.type).toBe('image')
    expect(portrait.content).toBe(PNG_DATA_URL)
    expect(portrait.meta.preset).toMatchObject({ id: preset.id })
    expect(portrait.meta.erratanet).toBeUndefined()
  })

  it('does not mutate the stored preset when a copied fragment is edited', async () => {
    const preset = await createPreset(dataDir, { name: 'Noir Cast', bundle: makeBundle() })
    const before = (await getPreset(dataDir, preset.id))!.bundle
    const created = await installFragmentBundle(dataDir, STORY_ID, before, {
      pack: preset.id,
      version: '0.0.0',
      kind: 'preset',
      presetName: preset.name,
    })
    const alice = created.find(fragment => fragment.name === 'Alice')!
    const stored = (await getFragment(dataDir, STORY_ID, alice.id))!
    await updateFragment(dataDir, STORY_ID, { ...stored, content: 'Alice has been rewritten.' })

    const after = (await getPreset(dataDir, preset.id))!.bundle
    expect(after).toEqual(before)
    expect(after.fragments.find(fragment => fragment.id === 'ch-alice1')?.content)
      .toBe('Alice is the protagonist.')
  })

  it('produces disjoint ids when the same preset is applied twice', async () => {
    const preset = await createPreset(dataDir, { name: 'Noir Cast', bundle: makeBundle() })
    const bundle = (await getPreset(dataDir, preset.id))!.bundle
    const provenance = {
      pack: preset.id,
      version: '0.0.0',
      kind: 'preset' as const,
      presetName: preset.name,
    }

    const first = await installFragmentBundle(dataDir, STORY_ID, bundle, provenance)
    const second = await installFragmentBundle(dataDir, STORY_ID, bundle, provenance)
    const firstIds = new Set(first.map(fragment => fragment.id))
    expect(second.every(fragment => !firstIds.has(fragment.id))).toBe(true)
  })

  it('replaces stale preset provenance as well as ErrataNet provenance', async () => {
    const now = new Date().toISOString()
    await createFragment(dataDir, STORY_ID, {
      id: 'ch-source1',
      type: 'character',
      name: 'Occupied',
      description: '',
      content: '',
      tags: [],
      refs: [],
      sticky: false,
      placement: 'user',
      createdAt: now,
      updatedAt: now,
      order: 0,
      meta: {},
      archived: false,
      version: 1,
      versions: [],
    })

    const bundle = makeBundle()
    bundle.fragments[0].meta = {
      preset: { id: 'preset-old', name: 'Old' },
      erratanet: { pack: '@old/source', version: '1.0.0' },
      note: 'keep',
    }
    const created = await installFragmentBundle(dataDir, STORY_ID, bundle, {
      pack: 'preset-new',
      version: '0.0.0',
      kind: 'preset',
      presetName: 'New',
    })
    const alice = created.find(fragment => fragment.name === 'Alice')!
    expect(alice.meta).toMatchObject({ preset: { id: 'preset-new', name: 'New' }, note: 'keep' })
    expect(alice.meta.erratanet).toBeUndefined()
  })
})
