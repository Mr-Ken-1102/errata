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

vi.mock('@/components/chat/LibrarianEditCard', () => ({
  LibrarianEditCard: () => null,
  isAppliedEditResult: () => false,
}))

import { ReasoningSection, ToolCallCard } from '@/components/chat/ChatMessageParts'

describe('ChatMessageParts localization', () => {
  it('localizes fixed tool-call chrome while preserving dynamic tool data verbatim', () => {
    const html = renderToStaticMarkup(
      React.createElement(ToolCallCard, {
        defaultExpanded: true,
        tc: {
          id: 'call-1',
          toolName: 'dynamicToolName',
          args: { target: 'DYNAMIC_ARG' },
          result: { value: 'DYNAMIC_RESULT' },
          error: 'DYNAMIC_ERROR',
        },
      }),
    )

    expect(html).toContain('dynamicToolName')
    expect(html).toContain('DYNAMIC_ARG')
    expect(html).toContain('DYNAMIC_RESULT')
    expect(html).toContain('DYNAMIC_ERROR')
    expect(html).toContain('Đối số')
    expect(html).toContain('Kết quả')
    expect(html).toContain('Lỗi')
    expect(html).toContain('xong')
    expect(html).toContain('lỗi')
  })

  it('localizes reasoning state labels without changing reasoning text', () => {
    const settled = renderToStaticMarkup(
      React.createElement(ReasoningSection, {
        reasoning: 'RAW_REASONING_TEXT',
        streaming: false,
      }),
    )
    expect(settled).toContain('Lập luận')

    const streaming = renderToStaticMarkup(
      React.createElement(ReasoningSection, {
        reasoning: 'RAW_REASONING_TEXT',
        streaming: true,
      }),
    )
    expect(streaming).toContain('Đang suy nghĩ...')
  })
})
