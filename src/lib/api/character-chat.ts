import { apiFetch } from './client'
import { fetchRunEventStream } from './runs'
import type {
  CharacterChatConversation,
  CharacterChatConversationSummary,
  PersonaMode,
} from './types'

export const characterChat = {
  listConversations: (storyId: string, characterId?: string) => {
    const query = characterId ? `?characterId=${encodeURIComponent(characterId)}` : ''
    return apiFetch<CharacterChatConversationSummary[]>(
      `/stories/${storyId}/character-chat/conversations${query}`,
    )
  },

  getConversation: (storyId: string, conversationId: string) =>
    apiFetch<CharacterChatConversation>(
      `/stories/${storyId}/character-chat/conversations/${conversationId}`,
    ),

  createConversation: (
    storyId: string,
    opts: {
      characterId: string
      persona: PersonaMode
      storyPointFragmentId?: string | null
      title?: string
    },
  ) =>
    apiFetch<CharacterChatConversation>(
      `/stories/${storyId}/character-chat/conversations`,
      {
        method: 'POST',
        body: JSON.stringify(opts),
      },
    ),

  deleteConversation: (storyId: string, conversationId: string) =>
    apiFetch<{ ok: boolean }>(
      `/stories/${storyId}/character-chat/conversations/${conversationId}`,
      { method: 'DELETE' },
    ),

  chat: (
    storyId: string,
    conversationId: string,
    message: string,
    clientRequestId?: string,
  ) => fetchRunEventStream(
    `/stories/${storyId}/character-chat/conversations/${conversationId}/chat`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        ...(clientRequestId ? { clientRequestId } : {}),
      }),
    },
  ),
}
