import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { translate } from '@/lib/i18n'

describe('TavernCardImportDialog localization', () => {
  it('provides Vietnamese fixed import chrome and errors', () => {
    expect(translate('vi', 'tavernImport.titleOne')).toBe('Nhập thẻ nhân vật')
    expect(translate('vi', 'tavernImport.dropLabel')).toBe('Thả thẻ nhân vật vào đây')
    expect(translate('vi', 'tavernImport.cancel')).toBe('Hủy')
    expect(translate('vi', 'tavernImport.importing')).toBe('Đang nhập…')
    expect(translate('vi', 'tavernImport.removeFromList')).toBe('Xóa khỏi danh sách')
  })

  it('preserves persisted imported data, API payloads, routing, and dynamic character metadata', () => {
    const source = readFileSync('src/components/fragments/TavernCardImportDialog.tsx', 'utf8')

    expect(source).toContain('name: `${character.name} (card image)`')
    expect(source).toContain('description: `Character card image for ${character.name}`.slice(0, 250)')
    expect(source).toContain('type: character.type')
    expect(source).toContain('name: character.name')
    expect(source).toContain('description: character.description')
    expect(source).toContain('content: character.content')
    expect(source).toContain('tags: character.tags')
    expect(source).toContain("visualRefs: [{ fragmentId: imageFragment.id, kind: 'image' }]")
    expect(source).toContain('parseCardJson(text)')
    expect(source).toContain("t('tavernImport.importing')")
    expect(source).toContain('onJsonCardDetected(parsed)')
    expect(source).toContain('{card.character.name}')
    expect(source).toContain('{card.character.description}')
    expect(source).toContain("{card.character.meta.tavernSpec || 'character'}")
    expect(source).toContain('card.character.tags.slice')
  })
})
