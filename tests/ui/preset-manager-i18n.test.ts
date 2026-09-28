import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { translate } from '@/lib/i18n'

describe('PresetManager localization', () => {
  it('provides Vietnamese fixed preset-management chrome', () => {
    expect(translate('vi', 'presetManager.today')).toBe('hôm nay')
    expect(translate('vi', 'presetManager.delete')).toBe('Xóa')
    expect(translate('vi', 'presetManager.rename')).toBe('Đổi tên')
    expect(translate('vi', 'presetManager.loading')).toBe('Đang tải preset...')
    expect(translate('vi', 'presetManager.importFromFile')).toBe('Nhập preset truyện từ tệp')
  })

  it('preserves persisted preset names, bundle data, API identity, downloads, and IME guard', () => {
    const source = readFileSync('src/components/presets/PresetManager.tsx', 'utf8')

    expect(source).toContain('parseErrataExport(text)')
    expect(source).toContain('name: parsed.fragment.name')
    expect(source).toContain("name: parsed.storyName || 'Imported preset'")
    expect(source).toContain("_errata: 'fragment-bundle'")
    expect(source).toContain('fragments: [{ ...parsed.fragment, attachments: parsed.attachments }]')
    expect(source).toContain('api.presets.update(preset.id, { name: nextName })')
    expect(source).toContain('api.presets.delete(preset.id)')
    expect(source).toContain('api.presets.get(preset.id)')
    expect(source).toContain('downloadExportFile(JSON.stringify(bundle, null, 2), `errata-preset-${safeName}.json`)')
    expect(source).toContain('!event.nativeEvent.isComposing')
    expect(source).toContain('{preset.name}')
    expect(source).toContain('{preset.description}')
  })
})
