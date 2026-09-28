import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import type { Fragment } from '@/lib/api'
import type { CharacterChatConversationSummary } from '@/lib/api/types'

vi.mock('@/lib/i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/i18n')>()
  return {
    ...actual,
    useLanguage: () => ({
      language: 'vi' as const,
      setLanguage: () => undefined,
      t: (key: Parameters<typeof actual.translate>[1]) => actual.translate('vi', key),
    }),
  }
})

import { ConversationList } from '@/components/character-chat/ConversationList'

const character: Fragment = {
  id: 'ch-maya',
  type: 'character',
  name: 'MAYA-DYNAMIC',
  description: '',
  content: '',
  tags: [],
  refs: [],
  sticky: false,
  placement: 'user',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  order: 0,
  meta: {},
  archived: false,
}

function renderWith(conversations: CharacterChatConversationSummary[]) {
  const client = new QueryClient()
  client.setQueryData(['character-chat-conversations', 'story-1', null], conversations)
  return renderToStaticMarkup(
    React.createElement(
      QueryClientProvider,
      { client },
      React.createElement(ConversationList, {
        storyId: 'story-1',
        characterId: null,
        characters: [character],
        mediaById: new Map<string, Fragment>(),
        onSelect: () => undefined,
        onNew: () => undefined,
        onClose: () => undefined,
      }),
    ),
  )
}

describe('ConversationList localization', () => {
  it('localizes chrome while preserving dynamic conversation and character names', () => {
    const html = renderWith([{
      id: 'conv-1',
      characterId: 'ch-maya',
      persona: { type: 'character', characterId: 'ch-maya' },
      storyPointFragmentId: null,
      title: 'MODEL-GENERATED TITLE',
      messageCount: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }])

    expect(html).toContain('Cuộc trò chuyện')
    expect(html).toContain('>Mới</button>')
    expect(html).toContain('MODEL-GENERATED TITLE')
    expect(html).toContain('MAYA-DYNAMIC')
    expect(html).toContain('vai MAYA-DYNAMIC')
    expect(html).toContain('2 tin nhắn')
    expect(html).toContain('vừa xong')
  })

  it('localizes the empty state without changing the character-chat query identity', () => {
    const html = renderWith([])
    expect(html).toContain('Chưa có cuộc trò chuyện nào')
    expect(html).toContain('Bắt đầu một cuộc trò chuyện với nhân vật của bạn.')
  })
})
