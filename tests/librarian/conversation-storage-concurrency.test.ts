import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createTempDir, makeTestSettings } from '../setup'
import { createStory } from '@/server/fragments/storage'
import {
  createConversation,
  listConversations,
  saveConversationHistory,
} from '@/server/librarian/storage'

describe('librarian conversation storage concurrency', () => {
  let dataDir: string
  let cleanup: () => Promise<void>
  const storyId = 'story-conv-test'

  beforeEach(async () => {
    const tmp = await createTempDir()
    dataDir = tmp.path
    cleanup = tmp.cleanup
    await createStory(dataDir, {
      id: storyId,
      name: 'Conversation Test Story',
      description: 'Concurrency regression fixture',
      coverImage: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: makeTestSettings(),
    })
  })

  afterEach(async () => {
    await cleanup()
  })

  it('keeps every record when many conversations are created concurrently', async () => {
    const created = await Promise.all(
      Array.from({ length: 25 }, (_, i) => createConversation(dataDir, storyId, `conv-${i}`)),
    )

    const listed = await listConversations(dataDir, storyId)
    expect(listed).toHaveLength(created.length)
    for (const conv of created) {
      expect(listed.find(c => c.id === conv.id)).toEqual(conv)
    }
  })

  it('round-trips optional POV metadata without changing legacy conversations', async () => {
    const pov = await createConversation(dataDir, storyId, 'POV refine', 'ch-maya')
    const general = await createConversation(dataDir, storyId, 'General chat')

    const listed = await listConversations(dataDir, storyId)
    expect(listed.find(conversation => conversation.id === pov.id)).toMatchObject({
      id: pov.id,
      povCharacterId: 'ch-maya',
    })
    expect(listed.find(conversation => conversation.id === general.id)).not.toHaveProperty('povCharacterId')
  })

  it('a background history save does not erase conversations created meanwhile', async () => {
    const first = await createConversation(dataDir, storyId, 'New chat')
    await saveConversationHistory(dataDir, storyId, first.id, [
      { role: 'user', content: 'hello from the first chat' },
    ])

    await Promise.all([
      saveConversationHistory(dataDir, storyId, first.id, [
        { role: 'user', content: '@pr-late late completion' },
      ]),
      ...Array.from({ length: 10 }, (_, i) =>
        createConversation(dataDir, storyId, `refine-${i}`),
      ),
    ])

    const listed = await listConversations(dataDir, storyId)
    expect(listed).toHaveLength(11)

    const firstAfter = listed.find(c => c.id === first.id)
    expect(firstAfter).toBeDefined()
    expect(firstAfter!.title).toBe('hello from the first chat')
    for (let i = 0; i < 10; i++) {
      expect(listed.find(c => c.title === `refine-${i}`)).toBeDefined()
    }
  })
})
