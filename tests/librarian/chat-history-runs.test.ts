import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTempDir, makeTestSettings } from '../setup'
import { createStory } from '@/server/fragments/storage'
import {
  appendChatMessage,
  getChatHistory,
  updateChatMessageByRunId,
} from '@/server/librarian/storage'
import { clearRuns, startRun } from '@/server/runs'

describe('durable librarian chat history', () => {
  let dataDir: string
  let cleanup: () => Promise<void>
  const storyId = 'story-chat-runs'

  beforeEach(async () => {
    const tmp = await createTempDir()
    dataDir = tmp.path
    cleanup = tmp.cleanup
    clearRuns()
    await createStory(dataDir, {
      id: storyId,
      name: 'Chat Runs',
      description: '',
      coverImage: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: makeTestSettings(),
    })
  })

  afterEach(async () => {
    clearRuns()
    await cleanup()
  })

  it('does not lose messages when many appends race', async () => {
    await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        appendChatMessage(dataDir, storyId, { role: 'user', content: `message-${i}` }),
      ),
    )

    const history = await getChatHistory(dataDir, storyId)
    expect(history.messages).toHaveLength(20)
    expect(new Set(history.messages.map(m => m.content)).size).toBe(20)
  })

  it('updates exactly the assistant turn addressed by run id', async () => {
    await appendChatMessage(dataDir, storyId, {
      role: 'assistant',
      content: 'old-a',
      runId: 'run-a',
      status: 'streaming',
    })
    await appendChatMessage(dataDir, storyId, {
      role: 'assistant',
      content: 'old-b',
      runId: 'run-b',
      status: 'streaming',
    })

    await updateChatMessageByRunId(dataDir, storyId, null, 'run-a', {
      content: 'new-a',
      status: 'complete',
      toolCalls: [{ toolName: 'updateFragment', args: { id: 'ch-1' }, result: { ok: true } }],
    })

    const history = await getChatHistory(dataDir, storyId)
    const a = history.messages.find(m => m.runId === 'run-a')
    const b = history.messages.find(m => m.runId === 'run-b')
    expect(a).toMatchObject({ content: 'new-a', status: 'complete' })
    expect(a?.toolCalls).toHaveLength(1)
    // run-b is not live, so read reconciliation marks it interrupted, but its
    // content is untouched by run-a's late patch.
    expect(b?.content).toBe('old-b')
  })

  it('keeps a streaming status while its run is live, then reports interruption when the run vanishes', async () => {
    let release!: () => void
    const gate = new Promise<void>(resolve => { release = resolve })
    const run = await startRun({
      dataDir,
      storyId,
      kind: 'librarian.chat',
      body: async () => { await gate },
    })

    await appendChatMessage(dataDir, storyId, {
      role: 'assistant',
      content: 'partial',
      runId: run.id,
      status: 'streaming',
    })

    expect((await getChatHistory(dataDir, storyId)).messages[0].status).toBe('streaming')

    // Simulate process restart / registry loss. The persisted turn must not
    // claim it is still running forever.
    clearRuns()
    const after = await getChatHistory(dataDir, storyId)
    expect(after.messages[0]).toMatchObject({
      status: 'error',
      error: 'Generation was interrupted',
      content: 'partial',
    })

    release()
  })
})
