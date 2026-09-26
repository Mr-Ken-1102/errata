import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { HELP_SECTIONS } from '@/components/help/help-content'
import { VI_HELP_SECTIONS } from '@/components/help/help-content.vi'

function markup(node: React.ReactNode): string {
  return renderToStaticMarkup(React.createElement(React.Fragment, null, node))
}

describe('Vietnamese Settings help content', () => {
  const en = HELP_SECTIONS.find((section) => section.id === 'settings')!
  const vi = VI_HELP_SECTIONS.find((section) => section.id === 'settings')!

  it('preserves section and subsection identities while localizing presentation', () => {
    expect(vi.id).toBe(en.id)
    expect(vi).not.toBe(en)
    expect(vi.title).toBe('Cài đặt')
    expect(vi.subsections.map((sub) => sub.id)).toEqual(en.subsections.map((sub) => sub.id))
    expect(vi.subsections.map((sub) => sub.id)).toEqual([
      'overview',
      'providers',
      'read-aloud',
      'appearance',
      'authoring',
      'remote',
      'prompt-control',
      'plugins',
    ])
  })

  it('preserves the boundary between local UI preferences and story/app controls', () => {
    const html = markup(vi.subsections.find((sub) => sub.id === 'overview')!.content)
    for (const token of ['theme', 'kích thước UI', 'thanh dòng thời gian', 'CSS tùy chỉnh', 'UI cục bộ']) {
      expect(html).toContain(token)
    }
    for (const token of ['tạo nội dung', 'bộ nhớ', 'nhà cung cấp', 'plugin', 'truy cập từ xa']) {
      expect(html).toContain(token)
    }
    expect(html).toContain('truyện hiện tại hoặc ứng dụng đang chạy')
  })

  it('preserves provider roles, per-agent overrides, and sampling inheritance', () => {
    const html = markup(vi.subsections.find((sub) => sub.id === 'providers')!.content)
    for (const token of [
      'API endpoint',
      'generation',
      'librarian',
      'character chat',
      'direction suggestions',
      'temperature',
      'Top P',
      'Top K',
      'kế thừa từ vai trò cha',
      'OpenAI',
      'Google Gemini',
      'Generative Language API',
      'model discovery',
      'tool calling',
    ]) {
      expect(html).toContain(token)
    }
  })

  it('preserves OpenRouter browser auth and localhost callback behavior', () => {
    const html = markup(vi.subsections.find((sub) => sub.id === 'providers')!.content)
    expect(html).toContain('openrouter/free')
    expect(html).toContain('API key')
    expect(html).toContain('OpenRouter callback')
    expect(html).toContain('localhost callback bridge')
    expect(html.match(/3000/g)?.length).toBeGreaterThanOrEqual(2)
  })

  it('preserves read-aloud defaults, engines, download size, caching, and controls', () => {
    const html = markup(vi.subsections.find((sub) => sub.id === 'read-aloud')!.content)
    for (const token of [
      'mặc định tắt',
      'theo từng câu',
      'Browser',
      'Supertonic',
      '~200 MB',
      'GPU',
      'cache',
      'offline',
      'quality',
      'speed',
      'pitch',
      'volume',
      'Test voice',
      'Stop',
    ]) {
      expect(html).toContain(token)
    }
  })

  it('preserves appearance and authoring controls', () => {
    const appearance = markup(vi.subsections.find((sub) => sub.id === 'appearance')!.content)
    const authoring = markup(vi.subsections.find((sub) => sub.id === 'authoring')!.content)
    for (const token of ['Interface', 'Typography', 'theme', 'display/prose/interface/code', 'CSS']) {
      expect(appearance).toContain(token)
    }
    for (const token of [
      'Authoring',
      'prose editor',
      'guided generation',
      'Selection transforms',
      'floating toolbar',
      'Continue',
      'Scene-setting',
      'Suggest directions',
      'inline generation input',
    ]) {
      expect(authoring).toContain(token)
    }
  })

  it('preserves remote-access security and transport semantics', () => {
    const html = markup(vi.subsections.find((sub) => sub.id === 'remote')!.content)
    for (const token of [
      'Basic Auth',
      'username',
      'password',
      'Wi-Fi',
      'HTTP',
      'không được mã hóa',
      'LAN',
      'Cloudflare',
      'Tunnel HTTPS',
      'cloudflared',
      'URL',
      'mã QR',
    ]) {
      expect(html).toContain(token)
    }
  })

  it('preserves fragment ordering modes and message placement', () => {
    const html = markup(vi.subsections.find((sub) => sub.id === 'prompt-control')!.content)
    for (const token of [
      'Fragment ordering',
      'sticky fragment',
      'Grouped',
      'Custom',
      'Fragment Order',
      'pinned fragment',
      'system message',
      'user message',
      'Agents',
      'Context blocks',
    ]) {
      expect(html).toContain(token)
    }
  })

  it('preserves all plugin pipeline hooks and extension capabilities', () => {
    const html = markup(vi.subsections.find((sub) => sub.id === 'plugins')!.content)
    for (const token of [
      'fragment type',
      'model tool',
      'API route',
      'sidebar panel',
      'beforeContext',
      'beforeGeneration',
      'afterGeneration',
      'afterSave',
      'context state',
      'system message',
      'user message',
      'side effect',
      'custom model tool',
      'fragment tool',
    ]) {
      expect(html).toContain(token)
    }
  })

  it('leaves no Help section on the exact English fallback object', () => {
    expect(VI_HELP_SECTIONS.map((section) => section.id)).toEqual(HELP_SECTIONS.map((section) => section.id))
    for (const section of HELP_SECTIONS) {
      expect(VI_HELP_SECTIONS.find((candidate) => candidate.id === section.id)).not.toBe(section)
    }
  })
})
