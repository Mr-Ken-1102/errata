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

import { QuestionCard } from '@/components/generation/QuestionCard'

describe('QuestionCard localization', () => {
  it('renders Vietnamese chrome while preserving model-provided question and option text', () => {
    const html = renderToStaticMarkup(
      React.createElement(QuestionCard, {
        questions: [
          {
            header: 'Tone',
            question: 'Keep the storm?',
            multiSelect: false,
            options: [
              { label: 'Keep it', description: 'Dynamic option from model' },
              { label: 'Clear skies', description: 'Another dynamic option' },
            ],
          },
          {
            header: 'Detail',
            question: 'What should the room smell like?',
            multiSelect: false,
          },
        ],
        onSubmit: () => undefined,
        onCancel: () => undefined,
      }),
    )

    expect(html).toContain('Một vài câu hỏi trước khi viết')
    expect(html).toContain('Khác…')
    expect(html).toContain('Nhập câu trả lời…')
    expect(html).toContain('Các câu trả lời chỉ định hướng đoạn này — không có gì được lưu.')
    expect(html).toContain('Bỏ qua')
    expect(html).toContain('Trả lời và tiếp tục')

    expect(html).toContain('Tone')
    expect(html).toContain('Keep the storm?')
    expect(html).toContain('Keep it')
    expect(html).toContain('title="Dynamic option from model"')
    expect(html).toContain('Detail')
    expect(html).toContain('What should the room smell like?')
  })
})
