import { Elysia, t } from 'elysia'
import { getStory, getFragment } from '../fragments/storage'
import {
  saveConversation as saveCharacterConversation,
  getConversation as getCharacterConversation,
  listConversations as listCharacterConversations,
  deleteConversation as deleteCharacterConversation,
  appendMessage as appendCharacterMessage,
  updateMessageByRunId as updateCharacterMessageByRunId,
  generateConversationId,
  type CharacterChatConversation,
} from '../character-chat/storage'
import { createLogger } from '../logging'
import { describeError } from '../error-message'
import { startAgentRun } from '../runs/agent-run'
import { findLiveRun, abortedByTimeout, abortedByUser } from '../runs'
import { runStreamResponse, resolveExistingRun } from '../runs/http'
import { createTurnTracker } from '../runs/turn-tracker'
import { getActiveBranchId, withBranch } from '../fragments/branches'
import { withKeyLock } from '../async-lock'

export function characterChatRoutes(dataDir: string) {
  const logger = createLogger('api:character-chat', { dataDir })

  return new Elysia({ detail: { tags: ['Character Chat'] } })
    .get('/stories/:storyId/character-chat/conversations', async ({ params, query }) => {
      const characterId = typeof query?.characterId === 'string' ? query.characterId : undefined
      return listCharacterConversations(dataDir, params.storyId, characterId)
    }, {
      detail: { summary: 'List conversations, optionally filtered by character' },
    })

    .get('/stories/:storyId/character-chat/conversations/:conversationId', async ({ params, set }) => {
      const conv = await getCharacterConversation(dataDir, params.storyId, params.conversationId)
      if (!conv) {
        set.status = 404
        return { error: 'Conversation not found' }
      }
      return conv
    }, {
      detail: { summary: 'Get a conversation by ID' },
    })

    .post('/stories/:storyId/character-chat/conversations', async ({ params, body, set }) => {
      const story = await getStory(dataDir, params.storyId)
      if (!story) {
        set.status = 404
        return { error: 'Story not found' }
      }

      const character = await getFragment(dataDir, params.storyId, body.characterId)
      if (!character || character.type !== 'character') {
        set.status = 404
        return { error: 'Character not found' }
      }

      const now = new Date().toISOString()
      const conv: CharacterChatConversation = {
        id: generateConversationId(),
        characterId: body.characterId,
        persona: body.persona,
        storyPointFragmentId: body.storyPointFragmentId ?? null,
        title: body.title || `Chat with ${character.name}`,
        messages: [],
        createdAt: now,
        updatedAt: now,
      }
      await saveCharacterConversation(dataDir, params.storyId, conv)
      return conv
    }, {
      detail: { summary: 'Create a new conversation' },
      body: t.Object({
        characterId: t.String(),
        persona: t.Union([
          t.Object({ type: t.Literal('character'), characterId: t.String() }),
          t.Object({ type: t.Literal('stranger') }),
          t.Object({ type: t.Literal('custom'), prompt: t.String() }),
        ]),
        storyPointFragmentId: t.Optional(t.Union([t.String(), t.Null()])),
        title: t.Optional(t.String()),
      }),
    })

    .delete('/stories/:storyId/character-chat/conversations/:conversationId', async ({ params, set }) => {
      const deleted = await deleteCharacterConversation(dataDir, params.storyId, params.conversationId)
      if (!deleted) {
        set.status = 404
        return { error: 'Conversation not found' }
      }
      return { ok: true }
    }, {
      detail: { summary: 'Delete a conversation' },
    })

    .post('/stories/:storyId/character-chat/conversations/:conversationId/chat', async ({ params, body, set }) => {
      const requestLogger = logger.child({
        storyId: params.storyId,
        extra: { conversationId: params.conversationId },
      })

      const story = await getStory(dataDir, params.storyId)
      if (!story) {
        set.status = 404
        return { error: 'Story not found' }
      }

      const text = body.message.trim()
      if (!text) {
        set.status = 422
        return { error: 'message is required' }
      }

      const branchId = await getActiveBranchId(dataDir, params.storyId)
      const lockKey = `character-chat-start:${params.storyId}:${branchId}:${params.conversationId}`

      return withKeyLock(lockKey, async () => {
        // Everything below is pinned to the branch captured above. A timeline
        // switch after the request starts cannot redirect transcript writes.
        return withBranch(dataDir, params.storyId, async () => {
          const conversation = await getCharacterConversation(
            dataDir,
            params.storyId,
            params.conversationId,
          )
          if (!conversation) {
            return new Response(JSON.stringify({ error: 'Conversation not found' }), {
              status: 404,
              headers: { 'Content-Type': 'application/json' },
            })
          }

          const existing = resolveExistingRun(
            params.storyId,
            params.conversationId,
            body.clientRequestId,
            branchId,
          )
          if (existing) return existing

          const live = findLiveRun(
            params.storyId,
            'character-chat',
            params.conversationId,
            branchId,
          )
          if (live) {
            return new Response(JSON.stringify({
              error: 'A chat turn is already running',
              runId: live.id,
            }), {
              status: 409,
              headers: { 'Content-Type': 'application/json' },
            })
          }

          const afterUser = await appendCharacterMessage(
            dataDir,
            params.storyId,
            params.conversationId,
            {
              role: 'user',
              content: text,
              createdAt: new Date().toISOString(),
            },
          )
          if (!afterUser) {
            return new Response(JSON.stringify({ error: 'Conversation not found' }), {
              status: 404,
              headers: { 'Content-Type': 'application/json' },
            })
          }

          const providerMessages = afterUser.messages.map(message => ({
            role: message.role,
            content: message.content.trim() || (
              message.role === 'assistant'
                ? '[No reply was recorded for this turn.]'
                : '(empty message)'
            ),
          }))

          try {
            let trackerRunId: string | null = null
            const tracker = createTurnTracker({
              write: async (snapshot) => {
                if (!trackerRunId) return
                await updateCharacterMessageByRunId(
                  dataDir,
                  params.storyId,
                  params.conversationId,
                  trackerRunId,
                  {
                    content: snapshot.content,
                    ...(snapshot.reasoning ? { reasoning: snapshot.reasoning } : {}),
                  },
                )
              },
            })

            const run = await startAgentRun({
              dataDir,
              storyId: params.storyId,
              branchId,
              kind: 'character-chat',
              scopeId: params.conversationId,
              ...(body.clientRequestId ? { clientRequestId: body.clientRequestId } : {}),
              agentName: 'character-chat.chat',
              input: {
                characterId: conversation.characterId,
                persona: conversation.persona,
                storyPointFragmentId: conversation.storyPointFragmentId,
                messages: providerMessages,
                maxSteps: story.settings.maxSteps ?? 10,
              },
              onStart: async (runId) => {
                trackerRunId = runId
                await appendCharacterMessage(
                  dataDir,
                  params.storyId,
                  params.conversationId,
                  {
                    role: 'assistant',
                    content: '',
                    createdAt: new Date().toISOString(),
                    runId,
                    status: 'streaming',
                  },
                )
              },
              onEvent: (event) => tracker.onEvent(event),
              onComplete: async (result, signal) => {
                await tracker.flush()
                if (!trackerRunId) return

                const saidNothing = !result.text.trim() && !signal.aborted
                const status = abortedByTimeout(signal)
                  ? 'error'
                  : abortedByUser(signal)
                    ? 'cancelled'
                    : saidNothing
                      ? 'error'
                      : 'complete'

                await updateCharacterMessageByRunId(
                  dataDir,
                  params.storyId,
                  params.conversationId,
                  trackerRunId,
                  {
                    content: result.text,
                    ...(result.reasoning ? { reasoning: result.reasoning } : {}),
                    status,
                    ...(abortedByTimeout(signal) ? { error: 'Generation timed out.' } : {}),
                    ...(saidNothing ? { error: 'The model returned an empty response.' } : {}),
                  },
                )

                requestLogger.info('Character chat completed', {
                  runId: trackerRunId,
                  stepCount: result.stepCount,
                  finishReason: result.finishReason,
                  status,
                })
              },
              onError: async (error, signal) => {
                await tracker.flush()
                if (!trackerRunId) return
                const status = abortedByUser(signal) ? 'cancelled' : 'error'
                await updateCharacterMessageByRunId(
                  dataDir,
                  params.storyId,
                  params.conversationId,
                  trackerRunId,
                  {
                    status,
                    ...(status === 'error'
                      ? {
                          error: abortedByTimeout(signal)
                            ? 'Generation timed out.'
                            : describeError(error),
                        }
                      : {}),
                  },
                )
              },
            })

            return runStreamResponse(run)
          } catch (error) {
            requestLogger.error('Character chat failed to start', {
              error: describeError(error),
            })
            return new Response(JSON.stringify({
              error: error instanceof Error ? error.message : 'Chat failed',
            }), {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            })
          }
        }, branchId)
      })
    }, {
      detail: { summary: 'Send a character message (server-owned run; streaming NDJSON)' },
      body: t.Object({
        message: t.String({ minLength: 1 }),
        clientRequestId: t.Optional(t.String()),
      }),
    })
}
