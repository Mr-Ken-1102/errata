import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  normalizeLanguage,
  persistLanguagePreference,
  readLanguagePreference,
  translate,
  translateSettingsNavigation,
} from '../../src/lib/i18n'

describe('interface language preference', () => {
  it('defaults to English for missing or unsupported values', () => {
    expect(normalizeLanguage(null)).toBe(DEFAULT_LANGUAGE)
    expect(normalizeLanguage('fr')).toBe(DEFAULT_LANGUAGE)
    expect(normalizeLanguage('en')).toBe('en')
  })

  it('restores a saved Vietnamese preference', () => {
    const storage = {
      getItem: (key: string) => key === LANGUAGE_STORAGE_KEY ? 'vi' : null,
    }

    expect(readLanguagePreference(storage)).toBe('vi')
  })

  it('falls back to English when storage cannot be read', () => {
    const storage = {
      getItem: () => {
        throw new Error('storage blocked')
      },
    }

    expect(readLanguagePreference(storage)).toBe('en')
  })

  it('persists only the explicit interface preference', () => {
    const writes: Array<[string, string]> = []
    const storage = {
      setItem: (key: string, value: string) => writes.push([key, value]),
    }

    persistLanguagePreference('vi', storage)

    expect(writes).toEqual([[LANGUAGE_STORAGE_KEY, 'vi']])
  })
})

describe('translation fallback', () => {
  it('returns Vietnamese text when the key has a Vietnamese translation', () => {
    expect(translate('vi', 'settings.language.heading')).toBe('Ngôn ngữ')
    expect(translate('vi', 'settings.dialog.title')).toBe('Cài đặt')
    expect(translate('vi', 'settings.tts.enable')).toBe('Bật đọc thành tiếng')
    expect(translate('vi', 'settings.updates.checkForUpdates')).toBe('Kiểm tra cập nhật')
    expect(translate('vi', 'settings.proseColors.heading')).toBe('Màu văn bản')
  })

  it('falls back to the English source string when Vietnamese is intentionally absent', () => {
    expect(translate('vi', 'app.name')).toBe('Errata')
  })

  it('localizes settings navigation while leaving unknown extension labels intact', () => {
    expect(translateSettingsNavigation('vi', 'Appearance')).toBe('Giao diện')
    expect(translateSettingsNavigation('vi', 'Writing')).toBe('Viết')
    expect(translateSettingsNavigation('vi', 'Plugin-defined section')).toBe('Plugin-defined section')
  })
})

describe('language UI wiring', () => {
  it('mounts one app-level language provider and exposes the selector through both settings surfaces', () => {
    const rootSource = readFileSync('src/routes/__root.tsx', 'utf8')
    const aboutSource = readFileSync('src/components/settings/AboutPanel.tsx', 'utf8')
    const storyLibrarySource = readFileSync('src/routes/index.tsx', 'utf8')
    const storySettingsSource = readFileSync('src/components/sidebar/SettingsPanel.tsx', 'utf8')

    expect(rootSource).toContain('<LanguageProvider>')
    expect(rootSource).toContain("localStorage.getItem('errata-language')")
    expect(aboutSource).toContain('useLanguage()')
    expect(aboutSource).toContain('<SegmentedControl')
    expect(storyLibrarySource).toContain('<AboutSection />')
    expect(storySettingsSource).toContain('<AboutSection />')
  })

  it('localizes the story-editor settings shell and table of contents', () => {
    const settingsViewSource = readFileSync('src/components/sidebar/SettingsView.tsx', 'utf8')

    expect(settingsViewSource).toContain('useLanguage()')
    expect(settingsViewSource).toContain('translateSettingsNavigation(language')
    expect(settingsViewSource).toContain("t('settings.dialog.title')")
    expect(settingsViewSource).toContain("t('settings.dialog.closeSettings')")
    expect(settingsViewSource).toContain("t('settings.dialog.sections')")
  })

  it('localizes read-aloud presentation text without changing TTS engine values', () => {
    const ttsSource = readFileSync('src/components/settings/TtsSettings.tsx', 'utf8')

    expect(ttsSource).toContain('useLanguage()')
    expect(ttsSource).toContain("t('settings.tts.enable')")
    expect(ttsSource).toContain("t('settings.tts.testVoice')")
    expect(ttsSource).toContain("value: 'browser'")
    expect(ttsSource).toContain("value: 'supertonic'")
  })

  it('localizes desktop update presentation text without changing updater commands or release notes', () => {
    const updatesSource = readFileSync('src/components/settings/DesktopUpdatesPanel.tsx', 'utf8')

    expect(updatesSource).toContain('useLanguage()')
    expect(updatesSource).toContain("t('settings.updates.checkForUpdates')")
    expect(updatesSource).toContain('if (state.releaseNotes) return state.releaseNotes')
    expect(updatesSource).toContain('bridge.checkForUpdates()')
    expect(updatesSource).toContain('bridge.downloadUpdate()')
    expect(updatesSource).toContain('bridge.installUpdate()')
    expect(updatesSource).toContain("bridge.skipUpdate(state.version ?? '')")
  })

  it('localizes prose-color presentation without changing channel ids, presets, or preview prose', () => {
    const colorsSource = readFileSync('src/components/settings/ProseColorsPanel.tsx', 'utf8')

    expect(colorsSource).toContain('useLanguage()')
    expect(colorsSource).toContain("t('settings.proseColors.heading')")
    expect(colorsSource).toContain("key: 'dialogue'")
    expect(colorsSource).toContain("key: 'narration'")
    expect(colorsSource).toContain("key: 'emphasis'")
    expect(colorsSource).toContain("'#6b8aad'")
    expect(colorsSource).toContain("'#888888'")
    expect(colorsSource).toContain('The rain hammered against the cobblestones as she rounded the corner.')
  })
})
