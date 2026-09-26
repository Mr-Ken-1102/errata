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

import { ChevronRail } from '@/components/prose/ChevronRail'

describe('ChevronRail localization', () => {
  it('localizes previous/next accessibility labels without changing direction identity', () => {
    const previous = renderToStaticMarkup(
      React.createElement(ChevronRail, {
        direction: 'prev',
        disabled: false,
        onClick: () => undefined,
        fragmentId: 'fragment-1',
      }),
    )
    const next = renderToStaticMarkup(
      React.createElement(ChevronRail, {
        direction: 'next',
        disabled: false,
        onClick: () => undefined,
        fragmentId: 'fragment-1',
      }),
    )

    expect(previous).toContain('aria-label="Biến thể trước"')
    expect(previous).toContain('data-component-id="prose-fragment-1-variation-prev"')
    expect(next).toContain('aria-label="Biến thể tiếp theo"')
    expect(next).toContain('data-component-id="prose-fragment-1-variation-next"')
  })

  it('keeps disabled rails out of the tab order', () => {
    const html = renderToStaticMarkup(
      React.createElement(ChevronRail, {
        direction: 'prev',
        disabled: true,
        onClick: () => undefined,
        fragmentId: 'fragment-1',
      }),
    )

    expect(html).toContain('tabindex="-1"')
  })
})
