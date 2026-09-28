import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { HELP_SECTIONS } from '@/components/help/help-content'
import { VI_HELP_SECTIONS } from '@/components/help/help-content.vi'

function markup(node: React.ReactNode): string {
  return renderToStaticMarkup(React.createElement(React.Fragment, null, node))
}

describe('Vietnamese Timelines help content', () => {
  const en = HELP_SECTIONS.find((section) => section.id === 'timelines')!
  const vi = VI_HELP_SECTIONS.find((section) => section.id === 'timelines')!

  it('preserves section and subsection identities while localizing presentation', () => {
    expect(vi.id).toBe(en.id)
    expect(vi).not.toBe(en)
    expect(vi.subsections.map((sub) => sub.id)).toEqual(en.subsections.map((sub) => sub.id))
    expect(vi.title).toBe('Dòng thời gian')
    expect(vi.subsections.map((sub) => sub.id)).toEqual([
      'overview',
      'creating',
      'switching',
      'managing',
      'isolation',
    ])
  })

  it('preserves the Main branch name and independence semantics', () => {
    const html = markup(vi.subsections.find((sub) => sub.id === 'overview')!.content)
    expect(html).toContain('Main')
    expect(html).toContain('bản sao đầy đủ, độc lập')
    expect(html).toContain('không bao giờ ảnh hưởng đến dòng khác')
  })

  it('preserves both fork entry points and fork-at-section behavior', () => {
    const html = markup(vi.subsections.find((sub) => sub.id === 'creating')!.content)
    expect(html).toContain('+')
    expect(html).toContain('thanh dòng thời gian')
    expect(html).toContain('Dòng thời gian')
    expect(html).toContain('ngay tại điểm đó')
    expect(html).toContain('đến và bao gồm phần đã chọn')
    expect(html).toContain('không ảnh hưởng')
  })

  it('preserves switching and management behavior', () => {
    const switching = markup(vi.subsections.find((sub) => sub.id === 'switching')!.content)
    const managing = markup(vi.subsections.find((sub) => sub.id === 'managing')!.content)

    for (const token of ['prose chain', 'fragment', 'Librarian']) expect(switching).toContain(token)
    expect(switching).toContain('nhiều hơn một dòng thời gian')
    expect(managing).toContain('...')
    expect(managing).toContain('Main')
    expect(managing).toContain('không thể bị xóa')
    expect(managing).toContain('từ Main tại phần 3')
  })

  it('preserves copied data categories and post-fork isolation', () => {
    const html = markup(vi.subsections.find((sub) => sub.id === 'isolation')!.content)
    for (const token of [
      'Prose chain',
      'Character',
      'guideline',
      'knowledge',
      'Librarian',
      'Log tạo nội dung',
      'Cấu hình block',
    ]) {
      expect(html).toContain(token)
    }
    expect(html).toContain('tách biệt hoàn toàn')
    expect(html).toContain('tên, mô tả và cấu hình mô hình')
    expect(html).toContain('được dùng chung')
    expect(html).toContain('được cô lập')
  })

  it('uses the localized Settings section', () => {
    expect(VI_HELP_SECTIONS.find((section) => section.id === 'settings'))
      .not.toBe(HELP_SECTIONS.find((section) => section.id === 'settings'))
  })
})
