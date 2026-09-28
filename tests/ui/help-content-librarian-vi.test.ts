import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { HELP_SECTIONS } from '@/components/help/help-content'
import { VI_HELP_SECTIONS } from '@/components/help/help-content.vi'

function markup(node: React.ReactNode): string {
  return renderToStaticMarkup(React.createElement(React.Fragment, null, node))
}

describe('Vietnamese Librarian help content', () => {
  const en = HELP_SECTIONS.find((section) => section.id === 'librarian')!
  const vi = VI_HELP_SECTIONS.find((section) => section.id === 'librarian')!

  it('preserves section and subsection identities while localizing presentation', () => {
    expect(vi.id).toBe(en.id)
    expect(vi).not.toBe(en)
    expect(vi.subsections.map((sub) => sub.id)).toEqual(en.subsections.map((sub) => sub.id))
    expect(vi.title).toBe('Librarian')
    expect(vi.subsections.map((sub) => sub.id)).toEqual([
      'overview',
      'continuity-memory',
      'chat-tab',
      'story-tab',
      'summaries',
      'manual-analysis',
      'contradictions',
      'suggestions',
      'refine',
      'auto-suggestions',
      'analysis-controls',
      'activity-tab',
      'status',
    ])
  })

  it('preserves continuity state and character-awareness semantics', () => {
    const continuity = vi.subsections.find((sub) => sub.id === 'continuity-memory')!
    const html = markup(continuity.content)

    for (const token of [
      'Writer',
      'continuity view',
      'foreground',
      'background',
      'dormant',
      'witnessed',
      'told',
      'inferred',
    ]) {
      expect(html).toContain(token)
    }
    expect(html).toContain('không phải danh sách việc cần làm')
    expect(html).toContain('không tự suy ra một danh sách toàn cục')
  })

  it('preserves author-owned memory scope and technical fields', () => {
    const summaries = vi.subsections.find((sub) => sub.id === 'summaries')!
    const html = markup(summaries.content)

    expect(html).toContain('summary')
    expect(html).toContain('meta.validThrough')
    expect(html).toContain('live story head')
    expect(html).toContain('Librarian không nối thêm hay ghi đè')
    expect(html).toContain('loại nó khỏi prompt mà không xóa')
  })

  it('preserves contradiction and suggestion evidence contracts', () => {
    const contradictionHtml = markup(vi.subsections.find((sub) => sub.id === 'contradictions')!.content)
    const suggestionHtml = markup(vi.subsections.find((sub) => sub.id === 'suggestions')!.content)

    expect(contradictionHtml).toContain('fragment ID')
    expect(contradictionHtml).toContain('Xem xét')
    expect(contradictionHtml).toContain('false positive')
    expect(suggestionHtml).toContain('proposal path')
    expect(suggestionHtml).toContain('đoạn trích nguyên văn')
    expect(suggestionHtml).toContain('span nguyên văn theo thứ tự')
    expect(suggestionHtml).toContain('local difference')
    expect(suggestionHtml).toContain('broad rewrite sẽ bị từ chối')
  })

  it('preserves analysis controls, run tracing, and status vocabulary', () => {
    const html = vi.subsections
      .filter((sub) => ['analysis-controls', 'activity-tab', 'status'].includes(sub.id))
      .map((sub) => markup(sub.content))
      .join('\n')

    for (const token of ['summary', 'contradiction', 'analyze', 'refine', 'chat', 'idle', 'queued', 'Fragment ID']) {
      expect(html).toContain(token)
    }
  })

  it('uses the localized Settings section', () => {
    expect(VI_HELP_SECTIONS.find((section) => section.id === 'settings'))
      .not.toBe(HELP_SECTIONS.find((section) => section.id === 'settings'))
  })
})
