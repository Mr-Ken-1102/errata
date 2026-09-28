import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { translate } from '../../src/lib/i18n'

describe('P1.4-B UI localization cleanup', () => {
  it('localizes shared UI defaults through optional i18n without requiring LanguageProvider', () => {
    const i18n = readFileSync('src/lib/i18n.tsx', 'utf8')
    const sidebar = readFileSync('src/components/ui/sidebar.tsx', 'utf8')
    const dialog = readFileSync('src/components/ui/dialog.tsx', 'utf8')
    const sheet = readFileSync('src/components/ui/sheet.tsx', 'utf8')
    const fileDrop = readFileSync('src/components/ui/file-drop-dialog.tsx', 'utf8')
    const asyncView = readFileSync('src/components/ui/async-view.tsx', 'utf8')
    const primitives = readFileSync('src/components/settings/primitives.tsx', 'utf8')

    expect(translate('vi', 'common.close')).toBe('Đóng')
    expect(translate('vi', 'common.loading')).toBe('Đang tải')
    expect(translate('vi', 'common.toggleSidebar')).toBe('Bật hoặc tắt thanh bên')
    expect(i18n).toContain('export function useOptionalTranslation()')
    expect(i18n).toContain('context?.t(key) ?? translate(DEFAULT_LANGUAGE, key)')

    expect(sidebar).toContain("t('common.sidebar')")
    expect(sidebar).toContain("t('common.mobileSidebarDescription')")
    expect(sidebar).toContain("t('common.toggleSidebar')")
    expect(dialog).toContain("t('common.close')")
    expect(sheet).toContain("t('common.close')")
    expect(fileDrop).toContain("label ?? t('common.fileDropPrompt')")
    expect(asyncView).toContain("label ?? t('common.loading')")
    expect(primitives).toContain("helpLabel ?? t('common.learnMore')")
    expect(primitives).not.toContain("helpLabel = 'Learn more'")
  })

  it('localizes client fallback errors without replacing actual runtime error messages', () => {
    const storySetup = readFileSync('src/components/wizard/use-story-setup-controller.ts', 'utf8')
    const chat = readFileSync('src/components/chat/use-chat-turn.ts', 'utf8')

    expect(translate('vi', 'storySetup.error.paused')).toBe('Thiết lập truyện đã tạm dừng.')
    expect(translate('vi', 'chat.fallbackFailed')).toBe('Trò chuyện thất bại')
    expect(storySetup).toContain("caught instanceof Error ? caught.message : t('storySetup.error.continueFailed')")
    expect(storySetup).toContain("t('storySetup.error.validateWithDetail').replace('{error}', latestToolError)")
    expect(storySetup).toContain("t('storySetup.error.paused')")
    expect(chat).toContain("err instanceof Error ? err.message : t('chat.fallbackFailed')")
    expect(chat).toContain("t('chat.streamEndedBeforeCompletion')")
  })

  it('localizes TTS preset voice presentation while preserving voice ids', () => {
    const tts = readFileSync('src/lib/tts.ts', 'utf8')
    const settings = readFileSync('src/components/settings/TtsSettings.tsx', 'utf8')

    expect(translate('vi', 'settings.tts.femaleVoice')).toBe('Giọng nữ {number}')
    expect(translate('vi', 'settings.tts.maleVoice')).toBe('Giọng nam {number}')
    expect(tts).toContain("{ id: 'F1', label: 'Female 1' }")
    expect(tts).toContain("{ id: 'M5', label: 'Male 5' }")
    expect(settings).toContain("v.id.startsWith('F')")
    expect(settings).toContain("t('settings.tts.femaleVoice')")
    expect(settings).toContain("t('settings.tts.maleVoice')")
    expect(settings).toContain("v.id.slice(1)")
    expect(settings).not.toContain('>{v.label}<')
  })

  it('localizes tunnel accessibility presentation while preserving sharing machine states', () => {
    const sharing = readFileSync('src/components/settings/SharingPanel.tsx', 'utf8')

    expect(translate('vi', 'settings.remote.tunnelLabel')).toBe('Đường hầm')
    expect(sharing).toContain("label={t('settings.remote.tunnelLabel')}")
    expect(sharing).toContain("t('settings.remote.qrCodeAlt').replace('{label}', label)")
    expect(sharing).toContain("label=\"LAN\"")
    expect(sharing).toContain("status?.tunnel.status === 'running'")
    expect(sharing).toContain("status?.tunnel.status === 'error'")
  })
})
