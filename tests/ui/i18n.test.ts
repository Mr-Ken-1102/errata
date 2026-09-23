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
    expect(translate('vi', 'settings.appearance.theme')).toBe('Chủ đề')
    expect(translate('vi', 'settings.typography.heading')).toBe('Kiểu chữ')
    expect(translate('vi', 'settings.providers.manageProviders')).toBe('Quản lý nhà cung cấp')
    expect(translate('vi', 'settings.generation.heading')).toBe('Tạo nội dung')
    expect(translate('vi', 'settings.generation.outputFormat')).toBe('Định dạng đầu ra')
    expect(translate('vi', 'settings.authoring.heading')).toBe('Soạn thảo')
    expect(translate('vi', 'settings.authoring.addTransform')).toBe('Thêm thao tác biến đổi')
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

  it('localizes Appearance and Typography presentation without changing preference values or font roles', () => {
    const settingsSource = readFileSync('src/components/sidebar/SettingsPanel.tsx', 'utf8')

    expect(settingsSource).toContain('useLanguage()')
    expect(settingsSource).toContain("t('settings.appearance.theme')")
    expect(settingsSource).toContain("t('settings.typography.heading')")
    expect(settingsSource).toContain("value: 'light'")
    expect(settingsSource).toContain("value: 'dark'")
    expect(settingsSource).toContain("value: 'high-contrast'")
    expect(settingsSource).toContain("value: 'narrow'")
    expect(settingsSource).toContain("value: 'full'")
    expect(settingsSource).toContain('role="display"')
    expect(settingsSource).toContain('role="prose"')
    expect(settingsSource).toContain('role="sans"')
    expect(settingsSource).toContain('role="mono"')
    expect(settingsSource).toContain("opt.tag === 'high-visibility'")
  })

  it('localizes provider controls without changing model-role or provider/model identifiers', () => {
    const settingsSource = readFileSync('src/components/sidebar/SettingsPanel.tsx', 'utf8')

    expect(settingsSource).toContain("t('settings.providers.manageProviders')")
    expect(settingsSource).toContain("t('settings.providers.default')")
    expect(settingsSource).toContain("t('settings.providers.inherit')")
    expect(settingsSource).toContain('{role.label}')
    expect(settingsSource).toContain('{role.description}')
    expect(settingsSource).toContain('overrides[role.key]?.providerId')
    expect(settingsSource).toContain('overrides[role.key]?.modelId')
    expect(settingsSource).toContain('resolveProvider(role.key, settings, globalConfig)')
    expect(settingsSource).toContain('temperature }')
  })

  it('localizes Generation presentation without changing generation values, prompts, or update semantics', () => {
    const settingsSource = readFileSync('src/components/sidebar/SettingsPanel.tsx', 'utf8')

    expect(settingsSource).toContain("t('settings.generation.heading')")
    expect(settingsSource).toContain("t('settings.generation.mode')")
    expect(settingsSource).toContain("t('settings.generation.contextLimit')")
    expect(settingsSource).toContain("t('settings.generation.disableAutoAnalysis')")

    expect(settingsSource).toContain("value={(story.settings.generationMode ?? 'standard') as 'standard' | 'prewriter'}")
    expect(settingsSource).toContain("value: 'standard' as const")
    expect(settingsSource).toContain("value: 'prewriter' as const")
    expect(settingsSource).toContain("value: 'short' as const")
    expect(settingsSource).toContain("value: 'normal' as const")
    expect(settingsSource).toContain("value: 'extensive' as const")
    expect(settingsSource).toContain("value: 'plaintext'")
    expect(settingsSource).toContain("value: 'markdown'")
    expect(settingsSource).toContain("value: 'simple'")
    expect(settingsSource).toContain("value: 'advanced'")
    expect(settingsSource).toContain("value: 'proseLimit' as const")
    expect(settingsSource).toContain("value: 'maxTokens' as const")
    expect(settingsSource).toContain("value: 'maxCharacters' as const")

    expect(settingsSource).toContain("const DEFAULT_CONTINUE = 'Continue the story naturally. Write the next scene, advancing the plot and developing characters.'")
    expect(settingsSource).toContain('const DEFAULT_SCENE_SETTING = "Continue the story without advancing the plot.')
    expect(settingsSource).toContain('const DEFAULT_SUGGEST = `Based on everything in the story so far, suggest exactly {{count}} possible directions')
    expect(settingsSource).toContain('updateMutation.mutate({ generationMode: v })')
    expect(settingsSource).toContain('updateMutation.mutate({ contextOrderMode: v })')
    expect(settingsSource).toContain('updateMutation.mutate({ disableLibrarianAutoAnalysis: next })')
  })

  it('localizes Authoring chrome without changing guided prompts, transform content, context ids, or persistence semantics', () => {
    const settingsSource = readFileSync('src/components/sidebar/SettingsPanel.tsx', 'utf8')
    const transformsSource = readFileSync('src/components/settings/CustomTransformsPanel.tsx', 'utf8')
    const themeSource = readFileSync('src/lib/theme.tsx', 'utf8')

    expect(settingsSource).toContain("t('settings.authoring.heading')")
    expect(settingsSource).toContain("t('settings.authoring.selectionTransforms')")
    expect(settingsSource).toContain("t('settings.authoring.guidedModePrompts')")
    expect(settingsSource).toContain("value: 'tight' as TransformContext")
    expect(settingsSource).toContain("value: 'wide' as TransformContext")
    expect(settingsSource).toContain("value: 'passage' as TransformContext")
    expect(settingsSource).toContain("save('guidedContinuePrompt', continuePrompt)")
    expect(settingsSource).toContain("save('guidedSceneSettingPrompt', sceneSettingPrompt)")
    expect(settingsSource).toContain("save('guidedSuggestPrompt', suggestPrompt)")
    expect(settingsSource).toContain('placeholder={DEFAULT_CONTINUE}')
    expect(settingsSource).toContain('placeholder={DEFAULT_SCENE_SETTING}')
    expect(settingsSource).toContain('placeholder={DEFAULT_SUGGEST}')
    expect(settingsSource).toContain("const DEFAULT_CONTINUE = 'Continue the story naturally. Write the next scene, advancing the plot and developing characters.'")
    expect(settingsSource).toContain('const DEFAULT_SCENE_SETTING = "Continue the story without advancing the plot.')
    expect(settingsSource).toContain('const DEFAULT_SUGGEST = `Based on everything in the story so far, suggest exactly {{count}} possible directions')

    expect(transformsSource).toContain('useLanguage()')
    expect(transformsSource).toContain("t('settings.authoring.transformLabel')")
    expect(transformsSource).toContain("t('settings.authoring.transformInstruction')")
    expect(transformsSource).toContain("label: 'New transform'")
    expect(transformsSource).toContain("instruction: ''")
    expect(transformsSource).toContain('value={t.label}')
    expect(transformsSource).toContain('value={t.instruction}')
    expect(transformsSource).toContain('updateLabel(t.id, e.target.value)')
    expect(transformsSource).toContain('updateInstruction(t.id, e.target.value)')

    expect(themeSource).toContain("export type TransformContext = 'tight' | 'wide' | 'passage'")
    expect(themeSource).toContain('tight: 240')
    expect(themeSource).toContain('wide: 1200')
    expect(themeSource).toContain('passage: Number.MAX_SAFE_INTEGER')
    expect(themeSource).toContain("const WRITING_TRANSFORMS_KEY = 'errata-writing-transforms'")
    expect(themeSource).toContain("{ id: 'inner-thoughts', label: 'Add inner thoughts', instruction: 'Add inner thoughts and internal monologue")
    expect(themeSource).toContain("{ id: 'remove-llmism', label: 'Remove LLM-isms', instruction: 'Identify and remove common language patterns")
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