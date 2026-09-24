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

import { GenerationThoughts } from '@/components/prose/GenerationThoughts'
import type { ThoughtStep } from '@/components/prose/InlineGenerationInput'

describe('GenerationThoughts localization', () => {
  it('localizes fixed thought chrome while preserving streamed text and tool metadata', () => {
    const steps: ThoughtStep[] = [
      { type: 'prewriter-text', text: 'MODEL WRITING BRIEF' },
      { type: 'phase', phase: 'prewriting' },
      { type: 'reasoning', text: 'RAW REASONING TEXT' },
      { type: 'tool-call', id: 'tool-1', toolName: 'inspectStory', args: { target: 'chapter-7' } },
      { type: 'tool-result', id: 'tool-1', toolName: 'inspectStory', result: { name: 'Dynamic Result' } },
    ]

    const html = renderToStaticMarkup(
      React.createElement(GenerationThoughts, {
        steps,
        streaming: false,
        hasText: true,
        defaultExpanded: true,
      }),
    )

    expect(html).toContain('Suy nghĩ')
    expect(html).toContain('Định hướng viết')
    expect(html).toContain('Đang lập kế hoạch...')
    expect(html).toContain('MODEL WRITING BRIEF')
    expect(html).toContain('RAW REASONING TEXT')
    expect(html).toContain('Inspect Story')
    expect(html).toContain('target=chapter-7')
    expect(html).toContain('Dynamic Result')
  })

  it('uses the localized active thinking header without altering reasoning content', () => {
    const html = renderToStaticMarkup(
      React.createElement(GenerationThoughts, {
        steps: [{ type: 'reasoning', text: 'UNTRANSLATED STREAM' }],
        streaming: true,
        hasText: false,
        defaultExpanded: true,
      }),
    )

    expect(html).toContain('Đang suy nghĩ')
    expect(html).toContain('UNTRANSLATED STREAM')
  })
})
