import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { HELP_SECTIONS } from '@/components/help/help-content'
import { VI_HELP_SECTIONS } from '@/components/help/help-content.vi'

function markup(node: React.ReactNode): string {
  return renderToStaticMarkup(React.createElement(React.Fragment, null, node))
}

describe('Vietnamese Stories help content', () => {
  const en = HELP_SECTIONS.find((section) => section.id === 'stories')!
  const vi = VI_HELP_SECTIONS.find((section) => section.id === 'stories')!

  it('preserves section and subsection identities while localizing presentation', () => {
    expect(vi.id).toBe(en.id)
    expect(vi).not.toBe(en)
    expect(vi.title).toBe('Truyện')
    expect(vi.subsections.map((sub) => sub.id)).toEqual(en.subsections.map((sub) => sub.id))
    expect(vi.subsections.map((sub) => sub.id)).toEqual(['cover-images', 'gallery'])
  })

  it('preserves all three cover-image entry points', () => {
    const html = markup(vi.subsections.find((sub) => sub.id === 'cover-images')!.content)
    for (const token of [
      'Hộp thoại Tạo',
      'Danh sách truyện',
      'biểu tượng camera',
      'Bảng Thông tin',
      'trường Ảnh bìa',
      'banner',
    ]) {
      expect(html).toContain(token)
    }
  })

  it('preserves self-contained cover storage and size guidance', () => {
    const html = markup(vi.subsections.find((sub) => sub.id === 'cover-images')!.content)
    expect(html).toContain('data URL')
    expect(html).toContain('tự chứa hoàn toàn')
    expect(html).toContain('kích thước hợp lý')
    expect(html).toContain('dung lượng file truyện')
  })

  it('preserves gallery generation, metadata, and card actions', () => {
    const html = markup(vi.subsections.find((sub) => sub.id === 'gallery')!.content)
    for (const token of [
      'lưới thẻ dọc tự thích ứng',
      'guilloche',
      'SVG',
      'story ID',
      'prose',
      'character',
      'knowledge',
      'guideline',
      'ngày cập nhật gần nhất',
      'biểu tượng camera',
      'nút xóa',
    ]) {
      expect(html).toContain(token)
    }
  })

  it('leaves Settings as the exact English object', () => {
    expect(VI_HELP_SECTIONS.find((section) => section.id === 'settings'))
      .toBe(HELP_SECTIONS.find((section) => section.id === 'settings'))
  })
})
