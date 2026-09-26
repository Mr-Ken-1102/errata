import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { HELP_SECTIONS } from '@/components/help/help-content'
import { VI_HELP_SECTIONS } from '@/components/help/help-content.vi'

function markup(node: React.ReactNode): string {
  return renderToStaticMarkup(React.createElement(React.Fragment, null, node))
}

describe('Vietnamese Context Blocks help content', () => {
  const en = HELP_SECTIONS.find((section) => section.id === 'blocks')!
  const vi = VI_HELP_SECTIONS.find((section) => section.id === 'blocks')!

  it('preserves section and subsection identities while localizing presentation', () => {
    expect(vi.id).toBe(en.id)
    expect(vi).not.toBe(en)
    expect(vi.subsections.map((sub) => sub.id)).toEqual(en.subsections.map((sub) => sub.id))
    expect(vi.title).toBe('Khối ngữ cảnh')
    expect(vi.description).toContain('agent')
    expect(vi.subsections.map((sub) => sub.title)).toEqual([
      'Block là gì',
      'Block tích hợp',
      'Tắt block',
      'Ghi đè nội dung',
      'Sắp xếp lại block',
      'Custom block',
      'Script block',
    ])
  })

  it('preserves block ids, roles, modes, ctx API names, and code-sample identifiers', () => {
    const html = vi.subsections.map((sub) => markup(sub.content)).join('\n')

    for (const token of [
      'instructions',
      'tools',
      'system-fragments',
      'story-info',
      'summary',
      'user-fragments',
      'fragment-catalog',
      'prose',
      'author-input',
      'system',
      'user',
      'None',
      'Prepend',
      'Append',
      'Override',
      'Role',
      'Type: Simple',
      'Type: Script',
      'ctx.story',
      'ctx.proseFragments',
      'ctx.stickyGuidelines',
      'ctx.stickyKnowledge',
      'ctx.stickyCharacters',
      'ctx.guidelineCatalog',
      'ctx.knowledgeCatalog',
      'ctx.characterCatalog',
      'ctx.authorInput',
      'ctx.getFragment(id)',
      'ctx.getFragments(type?)',
      'ctx.getFragmentByTag(tag)',
      'ctx.getFragmentsByTag(tag)',
      'kn-abc123',
      'combat',
      '[Script error]',
      'Fragment Reference',
    ]) {
      expect(html).toContain(token)
    }
  })

  it('keeps executable example structure intact', () => {
    const script = vi.subsections.find((sub) => sub.id === 'script-blocks')!
    const html = markup(script.content)

    expect(html).toContain('const total = ctx.proseFragments')
    expect(html).toContain('.reduce((n, f) =&gt; n + f.content.split(/\\s+/).length, 0)')
    expect(html).toContain("const frag = await ctx.getFragment(&#x27;kn-abc123&#x27;)")
    expect(html).toContain("const rules = await ctx.getFragmentsByTag(&#x27;combat&#x27;)")
    expect(html).toContain("return rules.map(r =&gt; r.content).join(&#x27;\\n&#x27;)")
  })

  it('leaves later not-yet-localized sections as exact English objects', () => {
    for (const id of ['librarian', 'timelines', 'stories', 'settings']) {
      expect(VI_HELP_SECTIONS.find((section) => section.id === id))
        .toBe(HELP_SECTIONS.find((section) => section.id === id))
    }
  })
})
