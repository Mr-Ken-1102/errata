import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { translate } from '../../src/lib/i18n'

describe('P1.4-A UI localization cleanup', () => {
  it('localizes Agent Configure chrome without changing technical ids', () => {
    const source = readFileSync('src/components/agents/AgentConfigurePanel.tsx', 'utf8')

    expect(translate('vi', 'agentsPanel.exportConfig')).toBe('Xuất cấu hình')
    expect(translate('vi', 'agentsPanel.provider')).toBe('Nhà cung cấp')
    expect(translate('vi', 'agentsPanel.addContextBlock')).toBe('Thêm khối ngữ cảnh')
    expect(source).toContain("t('agentsPanel.exportConfig')")
    expect(source).toContain("t('agentsPanel.disablePostAnalysis')")
    expect(source).toContain("t('agentsPanel.addContextBlock')")
    expect(source).toContain('getLocalizedInheritLabel(')
    expect(source).toContain('getLocalizedRoleSource(')
    expect(source).toContain("block.role === 'system'")
    expect(source).toContain("'topP'")
    expect(source).toContain("'topK'")
    expect(source).not.toContain('title="Export config"')
    expect(source).not.toContain('>Add Context Block<')
    expect(source).not.toContain('>Original Content<')
  })

  it('localizes Fragment Editor chrome while preserving fragment/type ids and URL examples', () => {
    const source = readFileSync('src/components/fragments/FragmentEditor.tsx', 'utf8')

    expect(translate('vi', 'fragmentEditor.versionHistory')).toBe('Lịch sử phiên bản')
    expect(translate('vi', 'fragmentEditor.noTags')).toBe('Chưa có thẻ')
    expect(translate('vi', 'fragmentEditor.references')).toBe('Tham chiếu')
    expect(source).toContain("t('fragmentEditor.copyTooltip')")
    expect(source).toContain("t('fragmentEditor.versionHistory')")
    expect(source).toContain("t('fragmentEditor.noTags')")
    expect(source).toContain("t('fragmentEditor.noRefs')")
    expect(source).toContain("fragment.type !== 'prose'")
    expect(source).toContain("placeholder=\"https://example.com/image.png\"")
    expect(source).not.toContain('>Version history<')
    expect(source).not.toContain('>No tags<')
    expect(source).not.toContain('>No refs<')
  })

  it('localizes built-in fragment type and icon presentation without changing machine values', () => {
    const helper = readFileSync('src/components/fragments/fragment-type-icons.tsx', 'utf8')
    const editor = readFileSync('src/components/fragments/FragmentEditor.tsx', 'utf8')
    const list = readFileSync('src/components/fragments/FragmentList.tsx', 'utf8')
    const contextOrder = readFileSync('src/components/fragments/ContextOrderPanel.tsx', 'utf8')
    const archive = readFileSync('src/components/sidebar/ArchivePanel.tsx', 'utf8')
    const wizard = readFileSync('src/components/wizard/StoryWizard.tsx', 'utf8')
    const typesPanel = readFileSync('src/components/sidebar/FragmentTypesPanel.tsx', 'utf8')
    const settings = readFileSync('src/components/sidebar/SettingsPanel.tsx', 'utf8')

    expect(translate('vi', 'fragmentTypes.builtin.characters')).toBe('Nhân vật')
    expect(translate('vi', 'fragmentTypes.icon.mapPin')).toBe('Ghim bản đồ')
    expect(helper).toContain('getLocalizedFragmentTypeVisual')
    expect(helper).toContain('getLocalizedFragmentTypeLabel')
    expect(helper).toContain('getLocalizedFragmentTypeIconLabel')
    expect(helper).toContain("type: 'character'")
    expect(helper).toContain("value: 'MapPin'")
    expect(editor).toContain('getLocalizedFragmentTypeVisual(fragment.type')
    expect(list).toContain('getLocalizedFragmentTypeLabel(fragment.type, t)')
    expect(contextOrder).toContain('getLocalizedFragmentTypeVisual(fragment.type')
    expect(archive).toContain('getLocalizedFragmentTypeLabel(fragment.type, t)')
    expect(wizard).toContain('getLocalizedFragmentTypeLabel(fragment.type, t)')
    expect(typesPanel).toContain('getLocalizedFragmentTypeIconLabel(option.value, t)')
    expect(settings).toContain('getLocalizedFragmentTypeVisual(type, customTypes, t)')
  })
})
