import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { translate } from '@/lib/i18n'

describe('LorebookImportDialog localization', () => {
  it('provides Vietnamese fixed lorebook-import chrome', () => {
    expect(translate('vi', 'lorebookImport.title')).toBe('Nhập lorebook')
    expect(translate('vi', 'lorebookImport.type.character')).toBe('Nhân vật')
    expect(translate('vi', 'lorebookImport.type.knowledge')).toBe('Kiến thức')
    expect(translate('vi', 'lorebookImport.selectAll')).toBe('Chọn tất cả')
    expect(translate('vi', 'lorebookImport.importing')).toBe('Đang nhập…')
  })

  it('preserves parser identity, import types, dynamic item data, sticky/placement semantics, and API payloads', () => {
    const source = readFileSync('src/components/fragments/LorebookImportDialog.tsx', 'utf8')

    expect(source).toContain('parseSillyTavernLorebook(text)')
    expect(source).toContain('typeOverride: type')
    expect(source).toContain('finalType: state?.typeOverride ?? item.suggestedType')
    expect(source).toContain('type: item.finalType')
    expect(source).toContain('name: item.name')
    expect(source).toContain('description: item.description')
    expect(source).toContain('content: item.content')
    expect(source).toContain('tags: item.tags')
    expect(source).toContain('meta: item.meta')
    expect(source).toContain('api.fragments.toggleSticky(storyId, fragment.id, true)')
    expect(source).toContain("item.placement === 'system'")
    expect(source).toContain("api.fragments.setPlacement(storyId, fragment.id, 'system')")
    expect(source).toContain('{item.name}')
    expect(source).toContain('{item.content.slice(0, 120)}')
    expect(source).toContain('{tag}')
  })
})
