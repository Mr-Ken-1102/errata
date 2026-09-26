import React from 'react'
import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { Fragment } from '@/lib/api/types'

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

import { ChatConfig } from '@/components/character-chat/ChatConfig'

describe('ChatConfig localization', () => {
  it('localizes always-visible selector and navigation chrome', () => {
    const html = renderToStaticMarkup(
      React.createElement(ChatConfig, {
        characters: [],
        selectedCharacterId: null,
        onCharacterChange: () => undefined,
        persona: { type: 'stranger' },
        onPersonaChange: () => undefined,
        proseChain: null,
        proseFragments: [],
        storyPointId: null,
        onStoryPointChange: () => undefined,
        onShowConversations: () => undefined,
        onClose: () => undefined,
        mediaById: new Map<string, Fragment>(),
      }),
    )

    expect(html).toContain('Chọn nhân vật')
    expect(html).toContain('Người lạ')
    expect(html).toContain('Mới nhất')
    expect(html).toContain('aria-label="Các cuộc trò chuyện trước"')
    expect(html).toContain('Lịch sử')
    expect(html).toContain('title="Quay lại truyện"')
    expect(html).toContain('aria-label="Quay lại truyện"')
  })

  it('preserves persona/story-point enum values and dynamic character/prose data', () => {
    const source = readFileSync('src/components/character-chat/ChatConfig.tsx', 'utf8')

    expect(source).toContain("onPersonaChange({ type: 'stranger' })")
    expect(source).toContain("onPersonaChange({ type: 'character', characterId: ch.id })")
    expect(source).toContain("onPersonaChange({ type: 'custom', prompt: prompt.trim() })")
    expect(source).toContain('onStoryPointChange(null)')
    expect(source).toContain('onStoryPointChange(entry.id)')
    expect(source).toContain('{ch.name}')
    expect(source).toContain('{ch.description}')
    expect(source).toContain('{entry.name}')
    expect(source).toContain("window.prompt(t('characterChat.config.describePersonaPrompt'))")
  })
})
