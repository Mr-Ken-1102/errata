import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { translate } from '@/lib/i18n'

describe('CharacterCardImportDialog localization', () => {
  it('provides Vietnamese fixed JSON character-card import chrome', () => {
    expect(translate('vi', 'characterCardImport.title')).toBe('Nhập thẻ nhân vật')
    expect(translate('vi', 'characterCardImport.dropLabel')).toBe('Thả JSON thẻ nhân vật vào đây')
    expect(translate('vi', 'characterCardImport.selectAll')).toBe('Chọn tất cả')
    expect(translate('vi', 'characterCardImport.importing')).toBe('Đang nhập…')
    expect(translate('vi', 'characterCardImport.typeProse')).toBe('Văn xuôi')
  })

  it('preserves parsed card data, type enums, API payloads, placement, and prose-chain semantics', () => {
    const source = readFileSync('src/components/fragments/CharacterCardImportDialog.tsx', 'utf8')

    expect(source).toContain('parseCardJson(text)')
    expect(source).toContain('const response = await fetch(url)')
    expect(source).toContain('throw new Error(`HTTP ${response.status}`)')
    expect(source).toContain('type: item.finalType')
    expect(source).toContain('name: item.name')
    expect(source).toContain('description: item.description')
    expect(source).toContain('content: item.content')
    expect(source).toContain('tags: item.tags')
    expect(source).toContain('meta: item.meta')
    expect(source).toContain('api.fragments.toggleSticky(storyId, fragment.id, true)')
    expect(source).toContain("if (item.placement === 'system')")
    expect(source).toContain("api.fragments.setPlacement(storyId, fragment.id, 'system')")
    expect(source).toContain("if (item.finalType === 'prose')")
    expect(source).toContain('api.proseChain.addSection(storyId, fragment.id)')
    expect(source).toContain('state?.typeOverride ?? item.suggestedType')
    expect(source).toContain('{cardData.card.name}')
    expect(source).toContain('{cardData.card.spec}')
    expect(source).toContain('{cardData.card.creator}')
    expect(source).toContain('{item.name}')
    expect(source).toContain('{item.content.slice(0, 120)}')
    expect(source).toContain('item.tags.slice(0, 4)')
  })
})
