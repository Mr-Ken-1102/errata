import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { translate } from '@/lib/i18n'

describe('PovSelect localization', () => {
  it('provides Vietnamese POV selector chrome', () => {
    expect(translate('vi', 'povSelect.narrator')).toBe('Người kể chuyện')
    expect(translate('vi', 'povSelect.ariaLabel')).toBe('Nhân vật góc nhìn')
    expect(translate('vi', 'povSelect.placeholder')).toBe('Nhập để lọc…')
    expect(translate('vi', 'povSelect.noMatching')).toBe('Không có nhân vật phù hợp')
  })

  it('preserves branch-local POV identity, character ids/names, and keyboard behavior', () => {
    const source = readFileSync('src/components/generation/PovSelect.tsx', 'utf8')

    expect(source).toContain("? [{ id: '', name: narratorLabel }]")
    expect(source).toContain("'narrator'.includes(normalized)")
    expect(source).toContain('readPovCharacterId(storyId, branchId)')
    expect(source).toContain('writePovCharacterId(storyId, branchId, undefined)')
    expect(source).toContain('writePovCharacterId(storyId, branchId, id || undefined)')
    expect(source).toContain("...q.fragments(storyId, branchId, 'character')")
    expect(source).toContain('character.id === value')
    expect(source).toContain('character.name.toLocaleLowerCase().includes(normalized)')
    expect(source).toContain("event.key === 'ArrowDown'")
    expect(source).toContain("event.key === 'ArrowUp'")
    expect(source).toContain("event.key === 'Enter'")
    expect(source).toContain("event.key === 'Escape'")
    expect(source).toContain('{option.name}')
  })
})
