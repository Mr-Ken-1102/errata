import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { ensureCoreAgentsRegistered } from '@/server/agents/register-core'
import { createTempDir, makeTestSettings } from '../setup'
import { createFragment, createStory } from '@/server/fragments/storage'
import type { Fragment, StoryMeta } from '@/server/fragments/schema'
import {
  buildContext,
  buildContextState,
  createDefaultBlocks,
  findBlock,
  getFragmentVoice,
  resolvePovVoicePlaceholders,
} from '@/server/llm/context-builder'
import { createWriterBriefBlocks } from '@/server/llm/prewriter'

function makeStory(): StoryMeta {
  const now = new Date().toISOString()
  return {
    id: 'story-pov',
    name: 'POV Story',
    description: 'Perspective test',
    coverImage: null,
    createdAt: now,
    updatedAt: now,
    settings: makeTestSettings(),
  }
}

function fragment(overrides: Partial<Fragment>): Fragment {
  const now = new Date().toISOString()
  return {
    id: 'ch-maya',
    type: 'character',
    name: 'Maya',
    description: 'Protagonist',
    content: 'A watchful detective.',
    tags: [],
    refs: [],
    sticky: false,
    placement: 'user',
    createdAt: now,
    updatedAt: now,
    order: 0,
    meta: {},
    ...overrides,
  }
}

describe('POV voice generation context', () => {
  let dataDir: string
  let cleanup: () => Promise<void>

  beforeAll(() => {
    ensureCoreAgentsRegistered()
  })

  beforeEach(async () => {
    const temp = await createTempDir()
    dataDir = temp.path
    cleanup = temp.cleanup
  })

  afterEach(async () => {
    await cleanup()
  })

  it('reads voice notes without normalizing author text beyond prompt-edge whitespace', () => {
    expect(getFragmentVoice(fragment({
      meta: { voice: '  Tôi quan sát kỹ, nói ngắn và khô.  ' },
    }))).toBe('Tôi quan sát kỹ, nói ngắn và khô.')
    expect(getFragmentVoice(fragment({ meta: { voice: '   ' } }))).toBeUndefined()
  })

  it('resolves only a real character as POV and ignores other fragment types', async () => {
    const story = makeStory()
    await createStory(dataDir, story)
    await createFragment(dataDir, story.id, fragment({
      id: 'ch-maya',
      meta: { voice: 'Tôi quan sát kỹ, nói ngắn và khô.' },
    }))
    await createFragment(dataDir, story.id, fragment({
      id: 'kn-city',
      type: 'knowledge',
      name: 'City',
      meta: { voice: 'must not become POV' },
    }))

    const state = await buildContextState(dataDir, story.id, 'Tiếp tục.', {
      povCharacterId: 'ch-maya',
    })
    expect(state.povVoice).toEqual({
      characterName: 'Maya',
      content: 'Tôi quan sát kỹ, nói ngắn và khô.',
    })

    const nonCharacter = await buildContextState(dataDir, story.id, 'Tiếp tục.', {
      povCharacterId: 'kn-city',
    })
    expect(nonCharacter.povVoice).toBeUndefined()
  })

  it('resolves POV placeholders after the editable block template exists', async () => {
    const story = makeStory()
    await createStory(dataDir, story)
    await createFragment(dataDir, story.id, fragment({
      id: 'ch-dollar',
      name: 'Maya $&',
      meta: { voice: 'Nhịp $& vẫn phải được giữ nguyên.' },
    }))

    const state = await buildContextState(dataDir, story.id, 'Đi qua cánh cửa.', {
      povCharacterId: 'ch-dollar',
    })
    const raw = findBlock(createDefaultBlocks(state), 'pov-voice')
    expect(raw?.content).toContain('{{characterName}}')
    expect(raw?.content).toContain('{{voice}}')

    const resolved = findBlock(
      resolvePovVoicePlaceholders(createDefaultBlocks(state), state.povVoice),
      'pov-voice',
    )
    expect(resolved?.content).toContain('Maya $&')
    expect(resolved?.content).toContain('Nhịp $& vẫn phải được giữ nguyên.')
    expect(resolved?.content).not.toContain('{{voice}}')
  })

  it('direct context assembly never leaks unresolved POV tokens', async () => {
    const story = makeStory()
    await createStory(dataDir, story)
    await createFragment(dataDir, story.id, fragment({
      meta: { voice: 'Ngôi thứ nhất, tiết chế.' },
    }))

    const messages = await buildContext(dataDir, story.id, 'Tiếp tục.', {
      povCharacterId: 'ch-maya',
    })
    const user = messages.find(message => message.role === 'user')?.content ?? ''
    expect(user).toContain("Maya's point of view")
    expect(user).toContain('Ngôi thứ nhất, tiết chế.')
    expect(user).not.toContain('{{characterName}}')
    expect(user).not.toContain('{{voice}}')
  })

  it('keeps POV after the prewriter strips full context for the writer', () => {
    const povVoice = {
      characterName: 'Maya',
      content: 'Câu ngắn. Nội tâm quan sát.',
    }
    const blocks = createWriterBriefBlocks(
      [],
      'Maya enters the station.',
      undefined,
      povVoice,
    )
    const writingBrief = findBlock(blocks, 'writing-brief')!
    const pov = findBlock(blocks, 'pov-voice')!

    expect(pov.order).toBeGreaterThan(writingBrief.order)
    const resolved = findBlock(resolvePovVoicePlaceholders(blocks, povVoice), 'pov-voice')!
    expect(resolved.content).toContain('Maya')
    expect(resolved.content).toContain('Câu ngắn. Nội tâm quan sát.')
  })
})
