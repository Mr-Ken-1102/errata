import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { translate } from '../../src/lib/i18n'

describe('P1.5 manual UX remediation', () => {
  it('localizes built-in model-role presentation in Vietnamese settings', () => {
    expect(translate('vi', 'settings.providers.modelRole.generation.label')).toBe('Tạo nội dung')
    expect(translate('vi', 'settings.providers.modelRole.generation.description')).toBe('Viết văn xuôi chính')
    expect(translate('vi', 'settings.providers.modelRole.characterChat.label')).toBe('Trò chuyện nhân vật')
    expect(translate('vi', 'settings.providers.modelRole.characterChat.description')).toBe('Trò chuyện nhập vai theo nhân vật')
    expect(translate('vi', 'settings.providers.modelRole.directions.label')).toBe('Hướng truyện')
    expect(translate('vi', 'settings.providers.modelRole.directions.description')).toBe('Đề xuất hướng phát triển truyện')
    expect(translate('vi', 'settings.providers.modelRole.librarian.label')).toBe('Thủ thư')
    expect(translate('vi', 'settings.providers.modelRole.librarian.description')).toBe('Phân tích nền và tóm tắt')
    expect(translate('vi', 'settings.providers.modelRole.storySetup.label')).toBe('Thiết lập truyện')
    expect(translate('vi', 'settings.providers.modelRole.storySetup.description')).toBe('Lập kế hoạch truyện bằng hội thoại')
  })

  it('keeps model-role internals canonical and localizes only frontend presentation', () => {
    const settings = readFileSync('src/components/sidebar/SettingsPanel.tsx', 'utf8')
    const registry = readFileSync('src/server/agents/model-role-registry.ts', 'utf8')
    const characterChat = readFileSync('src/server/character-chat/agents.ts', 'utf8')
    const directions = readFileSync('src/server/directions/agents.ts', 'utf8')
    const librarian = readFileSync('src/server/librarian/agents.ts', 'utf8')
    const storySetup = readFileSync('src/server/story-setup/agents.ts', 'utf8')

    expect(settings).toContain('const MODEL_ROLE_DISPLAY_KEYS')
    expect(settings).toContain('getModelRoleDisplay(role, t)')
    expect(settings).toContain('{roleDisplay.label}')
    expect(settings).toContain('{roleDisplay.description}')
    expect(settings).toContain('getLocalizedSettingsInheritLabel(getInheritLabel(')
    expect(settings).not.toContain('>{role.label}<')
    expect(settings).not.toContain('>{role.description}<')

    expect(registry).toContain("key: 'generation'")
    expect(registry).toContain("label: 'Generation'")
    expect(registry).toContain("description: 'Main prose writing'")
    expect(characterChat).toContain("label: 'Character Chat'")
    expect(characterChat).toContain("description: 'In-character conversations'")
    expect(directions).toContain("label: 'Directions'")
    expect(directions).toContain("description: 'Story direction suggestions'")
    expect(librarian).toContain("label: 'Librarian'")
    expect(librarian).toContain("description: 'Background analysis and summaries'")
    expect(storySetup).toContain("label: 'Story Setup'")
    expect(storySetup).toContain("description: 'Conversational planning for a new story'")
  })

  it('fully localizes the Remote tunnel accessibility label', () => {
    const sharing = readFileSync('src/components/settings/SharingPanel.tsx', 'utf8')

    expect(translate('vi', 'settings.remote.toggleTunnel')).toBe('Bật hoặc tắt đường hầm Internet')
    expect(sharing).toContain("label={t('settings.remote.toggleTunnel')}")
  })
})
