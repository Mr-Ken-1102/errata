import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { translate } from '@/lib/i18n'

describe('FragmentImportDialog localization', () => {
  it('provides Vietnamese fixed import and script-warning chrome', () => {
    expect(translate('vi', 'fragmentImport.title')).toBe('Nhập fragment')
    expect(translate('vi', 'fragmentImport.clipboardFailed')).toContain('bộ nhớ tạm')
    expect(translate('vi', 'fragmentImport.scriptWarning')).toContain('JavaScript')
    expect(translate('vi', 'fragmentImport.contextConfiguration')).toBe('Cấu hình ngữ cảnh')
    expect(translate('vi', 'fragmentImport.loadDifferent')).toBe('Tải tệp khác')
  })

  it('preserves export contracts, imported data, config payloads, script detection, and dynamic metadata', () => {
    const source = readFileSync('src/components/fragments/FragmentImportDialog.tsx', 'utf8')
    expect(source).toContain("data._errata === 'fragment'")
    expect(source).toContain("data._errata === 'fragment-bundle'")
    expect(source).toContain('parseErrataExport(text)')
    expect(source).toContain('readClipboardText()')
    expect(source).toContain('readFileAsText(file)')
    expect(source).toContain('importFragmentEntry(storyId, entry)')
    expect(source).toContain('payload.blockConfig = data.blockConfig')
    expect(source).toContain('selected[name] = data.agentBlockConfigs[name]')
    expect(source).toContain('payload.agentBlockConfigs = selected')
    expect(source).toContain('await api.blocks.importConfigs(storyId, payload)')
    expect(source).toContain("parsed.blockConfig?.customBlocks.some((block) => block.type === 'script')")
    expect(source).toContain("config.customBlocks.some((block) => block.type === 'script')")
    expect(source).toContain('{f.type}')
    expect(source).toContain('{f.name}')
    expect(source).toContain('{f.description}')
    expect(source).toContain('{tag}')
    expect(source).toContain('{data.source.slice(0, 8)}')
    expect(source).toContain('{entry.name}')
    expect(source).toContain('{entry.description}')
    expect(source).toContain('{type}')
    expect(source).toContain('{data.storyName}')
    expect(source).toContain('{formatAgentName(name)}')
  })
})
