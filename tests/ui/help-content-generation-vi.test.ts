import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { HELP_SECTIONS } from '@/components/help/help-content'
import { VI_HELP_SECTIONS } from '@/components/help/help-content.vi'

function markup(node: React.ReactNode): string {
  return renderToStaticMarkup(React.createElement(React.Fragment, null, node))
}

describe('Vietnamese Generation help content', () => {
  const en = HELP_SECTIONS.find((section) => section.id === 'generation')!
  const vi = VI_HELP_SECTIONS.find((section) => section.id === 'generation')!

  it('preserves section and subsection identities while localizing presentation', () => {
    expect(vi.id).toBe(en.id)
    expect(vi.subsections.map((sub) => sub.id)).toEqual(en.subsections.map((sub) => sub.id))
    expect(vi.title).toBe('Tạo nội dung')
    expect(vi.description).toContain('Errata')
    expect(vi.subsections.map((sub) => sub.title)).toEqual([
      'Cách hoạt động',
      'Xây dựng ngữ cảnh',
      'Công cụ tích hợp',
      'Định dạng đầu ra',
      'Chế độ tạo nội dung',
      'Số bước tối đa',
      'Tắt chế độ suy luận',
      'Tóm tắt và bộ nhớ truyện',
      'Bộ nhớ do tác giả tạo',
      'Giới hạn ngữ cảnh',
      'Phím tắt',
      'Chế độ có hướng dẫn',
      'Dừng quá trình tạo',
      'Hoạt động của agent',
      'Định dạng hội thoại',
      'Bảng Debug',
    ])
  })

  it('preserves technical names, enum values, shortcuts, and tool identities verbatim', () => {
    const html = vi.subsections.map((sub) => markup(sub.content)).join('\n')

    for (const token of [
      'sticky',
      'system',
      'user',
      'readFragments(ids)',
      'listFragments(filters)',
      'findFragments(query)',
      'readProseChain()',
      'listFragmentTypes()',
      'readStorySummary()',
      'editFragments(operations)',
      'editProse(edits)',
      'plaintext',
      'markdown',
      'Prewriter',
      'Keybinds',
      'Ctrl',
      'Enter',
      'Esc',
      'Writer',
      'Directions',
      'Librarian',
      'Debug',
      'Prompt',
      'Tools',
    ]) {
      expect(html).toContain(token)
    }
  })

  it('documents explicit Stop as discard, matching server-owned generation semantics', () => {
    const enAbort = en.subsections.find((sub) => sub.id === 'aborting')!
    const viAbort = vi.subsections.find((sub) => sub.id === 'aborting')!
    const enHtml = markup(enAbort.content)
    const viHtml = markup(viAbort.content)

    expect(enHtml).toContain('Stopping discards the unfinished passage')
    expect(enHtml).not.toContain('saved as a partial prose fragment')
    expect(viHtml).toContain('loại bỏ đoạn viết chưa hoàn tất')
    expect(viHtml).toContain('thay vì lưu văn xuôi một phần')
  })

  it('uses the localized Settings section', () => {
    expect(VI_HELP_SECTIONS.find((section) => section.id === 'settings'))
      .not.toBe(HELP_SECTIONS.find((section) => section.id === 'settings'))
  })
})
