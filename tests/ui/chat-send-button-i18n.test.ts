import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

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

import { ChatSendButton } from '@/components/chat/ChatSendButton'

describe('ChatSendButton localization', () => {
  it('localizes the fixed send label', () => {
    const html = renderToStaticMarkup(
      React.createElement(ChatSendButton, {
        isStreaming: false,
        canSend: true,
        onSend: () => undefined,
        onStop: () => undefined,
        stopLabel: 'caller-owned stop label',
        idPrefix: 'test-chat',
      }),
    )

    expect(html).toContain('aria-label="Gửi tin nhắn"')
    expect(html).toContain('data-component-id="test-chat-send"')
  })

  it('preserves caller-provided stop labels verbatim', () => {
    const dynamicStopLabel = 'Stop Linh exactly as supplied'
    const html = renderToStaticMarkup(
      React.createElement(ChatSendButton, {
        isStreaming: true,
        canSend: true,
        onSend: () => undefined,
        onStop: () => undefined,
        stopLabel: dynamicStopLabel,
        idPrefix: 'test-chat',
      }),
    )

    expect(html).toContain(`aria-label="${dynamicStopLabel}"`)
    expect(html).toContain('data-component-id="test-chat-stop"')
  })
})
