import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTempDir } from '../setup'
import {
  createPreset,
  deletePreset,
  getPreset,
  InvalidPresetBundleError,
  InvalidPresetInputError,
  listPresets,
  sanitizePresetBundle,
  updatePresetMeta,
} from '@/server/presets/storage'
import { PRESET_LIMITS } from '@/server/presets/schema'
import type { FragmentBundleData } from '@/lib/fragment-clipboard'

function makeBundle(overrides?: Partial<FragmentBundleData>): FragmentBundleData {
  return {
    _errata: 'fragment-bundle',
    version: 1,
    source: 'test-source',
    exportedAt: new Date().toISOString(),
    storyName: 'Source Story',
    fragments: [
      {
        type: 'character',
        name: 'Alice',
        description: 'Protagonist',
        content: 'Alice is the protagonist.',
        tags: ['cast'],
        sticky: true,
        meta: {
          erratanet: { pack: '@old/source', version: '1.0.0' },
          custom: 'keep-me',
        },
      },
      {
        type: 'guideline',
        name: 'Tone',
        description: 'Voice guidance',
        content: 'Keep it noir.',
        tags: [],
        sticky: false,
      },
    ],
    ...overrides,
  }
}

describe('sanitizePresetBundle', () => {
  it('accepts reusable context and strips transport provenance', () => {
    const bundle = sanitizePresetBundle(makeBundle())
    expect(bundle.fragments).toHaveLength(2)
    expect(bundle.fragments[0].meta).toMatchObject({ custom: 'keep-me' })
    expect(bundle.fragments[0].meta?.erratanet).toBeUndefined()
    expect(bundle.fragments[0].meta?.preset).toBeUndefined()
  })

  it('rejects context configuration and prose', () => {
    expect(() => sanitizePresetBundle(makeBundle({
      blockConfig: { customBlocks: [], overrides: {}, blockOrder: [] },
    }))).toThrow(InvalidPresetBundleError)

    expect(() => sanitizePresetBundle(makeBundle({
      fragments: [
        ...makeBundle().fragments,
        { type: 'prose', name: 'Chapter', description: '', content: 'text', tags: [], sticky: false },
      ],
    }))).toThrow(/prose/)
  })

  it('rejects malformed, empty, and oversized fragment-count bundles', () => {
    expect(() => sanitizePresetBundle({ _errata: 'fragment-bundle', version: 1, fragments: [] }))
      .toThrow(InvalidPresetBundleError)
    expect(() => sanitizePresetBundle({ not: 'a bundle' })).toThrow(InvalidPresetBundleError)

    const fragments = Array.from({ length: PRESET_LIMITS.maxFragments + 1 }, (_, i) => ({
      type: 'knowledge',
      name: `Fact ${i}`,
      description: '',
      content: 'x',
      tags: [],
      sticky: false,
    }))
    expect(() => sanitizePresetBundle(makeBundle({ fragments }))).toThrow(InvalidPresetBundleError)
  })
})

describe('story preset storage', () => {
  let dataDir: string
  let cleanup: () => Promise<void>

  beforeEach(async () => {
    const tmp = await createTempDir()
    dataDir = tmp.path
    cleanup = tmp.cleanup
  })

  afterEach(async () => {
    await cleanup()
  })

  it('creates, lists, reads, renames, and deletes a preset', async () => {
    const first = await createPreset(dataDir, {
      name: '  Noir Detective Cast  ',
      description: '  A grim little world  ',
      sourceStoryName: ' Source Story ',
      bundle: makeBundle(),
    })
    await new Promise(resolve => setTimeout(resolve, 2))
    const second = await createPreset(dataDir, { name: 'Second', bundle: makeBundle() })

    expect(first.name).toBe('Noir Detective Cast')
    expect(first.description).toBe('A grim little world')
    expect(first.sourceStoryName).toBe('Source Story')
    expect(first.fragmentCount).toBe(2)
    expect(first.countsByType).toEqual({ character: 1, guideline: 1 })
    expect((await listPresets(dataDir)).map(item => item.id)).toEqual([second.id, first.id])

    const fetched = await getPreset(dataDir, first.id)
    expect(fetched?.bundle.fragments).toHaveLength(2)

    const renamed = await updatePresetMeta(dataDir, first.id, { name: 'Renamed' })
    expect(renamed?.name).toBe('Renamed')
    expect((await getPreset(dataDir, first.id))?.bundle).toEqual(fetched?.bundle)

    expect(await deletePreset(dataDir, first.id)).toBe(true)
    expect(await getPreset(dataDir, first.id)).toBeNull()
    expect(await deletePreset(dataDir, first.id)).toBe(false)
  })

  it('rejects whitespace-only or overlong metadata', async () => {
    await expect(createPreset(dataDir, { name: '   ', bundle: makeBundle() }))
      .rejects.toBeInstanceOf(InvalidPresetInputError)

    await expect(createPreset(dataDir, {
      name: 'x'.repeat(PRESET_LIMITS.maxNameLength + 1),
      bundle: makeBundle(),
    })).rejects.toBeInstanceOf(InvalidPresetInputError)
  })

  it('refuses traversal-shaped ids', async () => {
    expect(await getPreset(dataDir, '../../etc/passwd')).toBeNull()
    expect(await deletePreset(dataDir, '../../etc/passwd')).toBe(false)
  })
})
