import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { HELP_SECTIONS } from '@/components/help/help-content'
import { VI_HELP_SECTIONS } from '@/components/help/help-content.vi'

function markup(node: React.ReactNode): string {
  return renderToStaticMarkup(React.createElement(React.Fragment, null, node))
}

describe('Vietnamese Fragments help content', () => {
  const en = HELP_SECTIONS.find((section) => section.id === 'fragments')!
  const vi = VI_HELP_SECTIONS.find((section) => section.id === 'fragments')!

  it('preserves section and subsection identities while localizing presentation', () => {
    expect(vi.id).toBe(en.id)
    expect(vi).not.toBe(en)
    expect(vi.subsections.map((sub) => sub.id)).toEqual(en.subsections.map((sub) => sub.id))
    expect(vi.title).toBe('Fragment')
    expect(vi.subsections.map((sub) => sub.title)).toEqual([
      'Fragment là gì',
      'Các loại fragment',
      'Sticky và non-sticky',
      'Xuất và nhập',
      'Tag và reference',
    ])
  })

  it('preserves fragment-id examples, technical concepts, and lookup API names', () => {
    const html = vi.subsections.map((sub) => markup(sub.content)).join('\n')

    for (const token of [
      'pr-katemi',
      'ch-bokura',
      'gl-sideno',
      'kn-taviku',
      'Prose',
      'Characters',
      'Guidelines',
      'Knowledge',
      'sticky',
      'non-sticky',
      'ID',
      'metadata',
      'placement',
      'order',
      'context configuration',
      'custom block',
      'block override',
      'world-rules',
      'ctx.getFragmentByTag',
      'ctx.getFragmentByTag(tag)',
    ]) {
      expect(html).toContain(token)
    }
  })

  it('keeps import/export semantics explicit without promising stable ids on conflict', () => {
    const section = vi.subsections.find((sub) => sub.id === 'export-import')!
    const html = markup(section.content)

    expect(html).toContain('ID fragment được giữ khi nhập nếu có thể')
    expect(html).toContain('nếu một ID xung đột')
    expect(html).toContain('ID mới sẽ được tạo tự động')
    expect(html).toContain('Cấu hình được nhập sẽ thay thế')
  })

  it('leaves later not-yet-localized sections as exact English objects', () => {
    for (const id of ['settings']) {
      expect(VI_HELP_SECTIONS.find((section) => section.id === id))
        .toBe(HELP_SECTIONS.find((section) => section.id === id))
    }
  })
})
