import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTempDir, makeTestSettings } from '../setup'
import { createFragment, createStory, getFragment } from '@/server/fragments/storage'
import type { Fragment, StoryMeta } from '@/server/fragments/schema'
import { createSetCharacterVoiceTool } from '@/server/librarian/character-voice-tool'
import { agentBlockRegistry } from '@/server/agents/agent-block-registry'
import { ensureCoreAgentsRegistered } from '@/server/agents'

function story(): StoryMeta {
  const now = new Date().toISOString()
  return {
    id: 'story-voice-tool',
    name: 'Voice Tool Story',
    description: '',
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
    description: 'POV character',
    content: 'Maya observes before speaking.',
    tags: [],
    refs: [],
    sticky: false,
    placement: 'user',
    createdAt: now,
    updatedAt: now,
    order: 0,
    meta: {},
    archived: false,
    ...overrides,
  }
}

async function execute(toolDef: any, args: Record<string, unknown>) {
  return toolDef.execute!(args, { toolCallId: 'tc-voice', messages: [] })
}

describe('librarian character voice tool', () => {
  let dataDir: string
  let cleanup: () => Promise<void>
  const storyId = 'story-voice-tool'

  beforeEach(async () => {
    const temp = await createTempDir()
    dataDir = temp.path
    cleanup = temp.cleanup
    await createStory(dataDir, story())
    ensureCoreAgentsRegistered()
  })

  afterEach(async () => {
    await cleanup()
  })

  it('stores Vietnamese voice notes verbatim and clears them on blank input', async () => {
    await createFragment(dataDir, storyId, fragment({}))
    const voice = '  Tôi nói chậm, câu ngắn; nội tâm giàu cảm giác.  '
    const tool = createSetCharacterVoiceTool(dataDir, storyId)

    expect(await execute(tool, { fragmentId: 'ch-maya', voice })).toMatchObject({
      ok: true,
      fragmentId: 'ch-maya',
      voiceSet: true,
    })
    expect((await getFragment(dataDir, storyId, 'ch-maya'))?.meta.voice).toBe(voice)

    expect(await execute(tool, { fragmentId: 'ch-maya', voice: '   ' })).toMatchObject({
      ok: true,
      voiceSet: false,
    })
    expect((await getFragment(dataDir, storyId, 'ch-maya'))?.meta).not.toHaveProperty('voice')
  })

  it('refuses non-character and locked fragments', async () => {
    await createFragment(dataDir, storyId, fragment({
      id: 'kn-lore',
      type: 'knowledge',
      name: 'Lore',
    }))
    await createFragment(dataDir, storyId, fragment({
      id: 'ch-locked',
      meta: { locked: true },
    }))
    const tool = createSetCharacterVoiceTool(dataDir, storyId)

    expect(await execute(tool, {
      fragmentId: 'kn-lore',
      voice: 'voice',
    })).toMatchObject({ ok: false, error: expect.stringContaining('only character') })

    expect(await execute(tool, {
      fragmentId: 'ch-locked',
      voice: 'voice',
    })).toMatchObject({ ok: false, error: expect.stringContaining('locked') })
  })

  it('is registered only for librarian chat, not automatic librarian agents', () => {
    const chat = agentBlockRegistry.get('librarian.chat')
    expect(chat?.availableTools).toContain('setCharacterVoice')

    for (const name of [
      'librarian.analyze',
      'librarian.refine',
      'librarian.optimize-character',
      'librarian.prose-transform',
    ]) {
      expect(agentBlockRegistry.get(name)?.availableTools ?? []).not.toContain('setCharacterVoice')
    }
  })
})
