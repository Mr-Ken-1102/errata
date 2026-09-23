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
    expect(translate('vi', 'settings.remote.heading')).toBe('Truy cập từ xa')
    expect(translate('vi', 'settings.remote.httpWarning')).toContain('HTTP thuần')
    expect(translate('vi', 'settings.erratanet.description')).toContain('pack cộng đồng')
    expect(translate('vi', 'erratanet.account.logIn')).toBe('Đăng nhập')
    expect(translate('vi', 'erratanet.browser.title')).toBe('Duyệt và cài đặt pack')
    expect(translate('vi', 'erratanet.agentConfig.heading')).toBe('Cấu hình agent')
    expect(translate('vi', 'erratanet.agentConfig.presetRunsCode')).toContain('chạy mã')
    expect(translate('vi', 'erratanet.agentConfig.chooseWhatToApply')).toBe('Chọn phần cần áp dụng')
    expect(translate('vi', 'erratanet.agentConfig.configurationRunsCode')).toContain('chạy mã')
    expect(translate('vi', 'erratanet.publish.title')).toBe('Xuất bản lên ErrataNet')
    expect(translate('vi', 'erratanet.publish.visibility')).toBe('Khả năng hiển thị')
    expect(translate('vi', 'erratanet.shareConfig.title')).toBe('Chia sẻ cấu hình agent')
    expect(translate('vi', 'erratanet.shareConfig.runsCodeDescription')).toContain('xem mã nguồn script')
    expect(translate('vi', 'settings.plugins.heading')).toBe('Plugin')
    expect(translate('vi', 'settings.plugins.noneAvailable')).toBe('Không có plugin khả dụng')
    expect(translate('vi', 'providers.heading')).toBe('Nhà cung cấp')
    expect(translate('vi', 'providers.addProvider')).toBe('Thêm nhà cung cấp')
    expect(translate('vi', 'settings.modelSelect.noProvider')).toBe('Chưa chọn nhà cung cấp')
    expect(translate('vi', 'settings.customCss.save')).toBe('Lưu CSS')
    expect(translate('vi', 'settings.numberInput.usingWholeNumber')).toBe('và dùng số nguyên')
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
    expect(transformsSource).toContain("tr('settings.authoring.transformLabel')")
    expect(transformsSource).toContain("tr('settings.authoring.transformInstruction')")
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

  it('localizes Remote presentation without changing sharing API calls, credential fields, network ids, or server errors', () => {
    const sharingSource = readFileSync('src/components/settings/SharingPanel.tsx', 'utf8')

    expect(sharingSource).toContain('useLanguage()')
    expect(sharingSource).toContain("t('settings.remote.heading')")
    expect(sharingSource).toContain("t('settings.remote.httpWarning')")
    expect(sharingSource).toContain('api.sharing.getStatus()')
    expect(sharingSource).toContain('api.sharing.setAuth(data)')
    expect(sharingSource).toContain('api.sharing.setLan(en)')
    expect(sharingSource).toContain('api.sharing.setTunnel(en)')
    expect(sharingSource).toContain("useState('errata')")
    expect(sharingSource).toContain("username: username.trim() || 'errata'")
    expect(sharingSource).toContain('password })')
    expect(sharingSource).toContain("s.tunnel.status === 'downloading' || s.tunnel.status === 'starting'")
    expect(sharingSource).toContain("status?.tunnel.status === 'running'")
    expect(sharingSource).toContain("status.tunnel.error || t('settings.remote.tunnelError')")
    expect(sharingSource).toContain('url={status.lan.url}')
    expect(sharingSource).toContain('url={status.tunnel.url}')
  })

  it('localizes ErrataNet settings, intro, and account chrome without changing hub credentials, API operations, or pack data', () => {
    const settingsSource = readFileSync('src/components/sidebar/SettingsPanel.tsx', 'utf8')
    const introSource = readFileSync('src/components/erratanet/ErratanetIntroPrompt.tsx', 'utf8')
    const panelSource = readFileSync('src/components/erratanet/ErratanetPanel.tsx', 'utf8')

    expect(settingsSource).toContain("t('settings.erratanet.description')")
    expect(settingsSource).toContain("setConfig.mutate({ hubUrl: next })")
    expect(settingsSource).toContain("setConfig.mutate(next ? { enabled: true, introSeen: true } : { enabled: false })")
    expect(settingsSource).toContain("const DEFAULT_HUB = 'https://errata.tealios.com'")

    expect(introSource).toContain('useLanguage()')
    expect(introSource).toContain("t('erratanet.intro.title')")
    expect(introSource).toContain("mutation.mutate({ enabled: true, introSeen: true })")
    expect(introSource).toContain("mutation.mutate({ introSeen: true })")

    expect(panelSource).toContain('useLanguage()')
    expect(panelSource).toContain("api.erratanet.login(data)")
    expect(panelSource).toContain("api.erratanet.setConfig(data)")
    expect(panelSource).toContain("api.erratanet.setConfig({ token: '' })")
    expect(panelSource).toContain("loginMut.mutate({ hubUrl: url, identifier: identifier.trim(), password })")
    expect(panelSource).toContain("connectMut.mutate({ hubUrl: url, token: token.trim() })")
    expect(panelSource).toContain('pack={publishedAs.pack}')
    expect(panelSource).toContain('pack={fp.pack}')
    expect(panelSource).toContain('hubUrl={config?.hubUrl}')
    expect(panelSource).toContain('storyName={story.name}')
  })

  it('localizes ErrataNet browsing chrome without changing pack references, install payloads, hub metadata, or agent-config routing', () => {
    const browserSource = readFileSync('src/components/erratanet/ErratanetBrowserPanel.tsx', 'utf8')

    expect(browserSource).toContain('useLanguage()')
    expect(browserSource).toContain("t('erratanet.browser.title')")
    expect(browserSource).toContain("api.erratanet.search(q)")
    expect(browserSource).toContain("api.erratanet.getPack(id, version)")
    expect(browserSource).toContain("pack.contentKind === 'agent-config'")
    expect(browserSource).toContain("setConfigRef({ id: pack.id, version: version ?? pack.version })")
    expect(browserSource).toContain("api.erratanet.install({")
    expect(browserSource).toContain('id: selected.id')
    expect(browserSource).toContain('version: selected.version')
    expect(browserSource).toContain("targetStoryId: asNewStory ? undefined : storyId")
    expect(browserSource).toContain("asNewStory")
    expect(browserSource).toContain('result.title')
    expect(browserSource).toContain('result.description')
    expect(browserSource).toContain('result.tags')
    expect(browserSource).toContain('result.fragmentTypes')
    expect(browserSource).toContain('pack.title')
    expect(browserSource).toContain('pack.description')
    expect(browserSource).toContain('pack.license')
    expect(browserSource).toContain('pack.tags')
    expect(browserSource).toContain('pack.fragmentTypes')
    expect(browserSource).toContain("type InstallTarget = 'this-story' | 'new-story'")
  })

  it('localizes agent-config selector and presets without changing selection payloads, script consent, provider metadata, or persisted names', () => {
    const selectorSource = readFileSync('src/components/erratanet/AgentConfigSelector.tsx', 'utf8')
    const sectionSource = readFileSync('src/components/erratanet/AgentConfigSection.tsx', 'utf8')

    expect(selectorSource).toContain('useLanguage()')
    expect(selectorSource).toContain("t('erratanet.agentConfig.contextBlocks')")
    expect(selectorSource).toContain('agentBlocks: state.agents')
    expect(selectorSource).toContain('providerShapes: state.providers')
    expect(selectorSource).toContain('modelRoles: state.modelRoles')
    expect(selectorSource).toContain('preview.scripts.filter((s) => state.agents[s.agent]?.includes(s.blockId))')
    expect(selectorSource).toContain('label: p.name')
    expect(selectorSource).toContain('p.baseURL ? `${p.defaultModel} · ${p.baseURL}` : p.defaultModel')
    expect(selectorSource).toContain('label: humanize(r.role)')
    expect(selectorSource).toContain('hint: r.model ?? undefined')
    expect(selectorSource).toContain('<span className="truncate text-[0.75rem]">{b.name}</span>')
    expect(selectorSource).toContain('<span className="text-[0.5625rem] uppercase tracking-wider text-muted-foreground">{b.role}</span>')

    expect(sectionSource).toContain('useLanguage()')
    expect(sectionSource).toContain("api.erratanet.presets.save({ name, fromStoryId: storyId })")
    expect(sectionSource).toContain("api.erratanet.presets.apply(preset.id, {")
    expect(sectionSource).toContain('...(consentToScripts ? { consentToScripts: true } : {})')
    expect(sectionSource).toContain("err instanceof ApiError && err.data.requiresConsent === true")
    expect(sectionSource).toContain('applyMut.mutate(true)')
    expect(sectionSource).toContain('api.erratanet.presets.remove(preset.id)')
    expect(sectionSource).toContain('{preset.name}')
    expect(sectionSource).toContain('{preset.source.pack}')
    expect(sectionSource).toContain("setSavingName(storyName ? `${storyName} setup` : '')")
  })

  it('localizes agent-config import chrome without changing inspect/apply payloads, script consent gates, or hub manifest content', () => {
    const importSource = readFileSync('src/components/erratanet/AgentConfigImportView.tsx', 'utf8')

    expect(importSource).toContain('useLanguage()')
    expect(importSource).toContain("t('erratanet.agentConfig.chooseWhatToApply')")
    expect(importSource).toContain("api.erratanet.agentConfig.inspect(id, version)")
    expect(importSource).toContain("queryKey: ['agent-config-inspect', id, version ?? 'latest']")
    expect(importSource).toContain('selection: toSelectionPayload(selection)')
    expect(importSource).toContain('consentToScripts: hasSelectedScripts && consent ? true : undefined')
    expect(importSource).toContain('...(applyToStory && storyId ? { applyToStoryId: storyId } : {})')
    expect(importSource).toContain('...(savePreset ? { savePreset: { name: presetName.trim() || data?.manifest.title || id } } : {})')
    expect(importSource).toContain('const scripts = data ? selectedScripts(selection, data.preview) : []')
    expect(importSource).toContain('const needsConsent = hasSelectedScripts && applyToStory')
    expect(importSource).toContain('const consentOk = !needsConsent || consent')
    expect(importSource).toContain('{manifest.title}')
    expect(importSource).toContain('{manifest.description}')
    expect(importSource).toContain('{s.content}')
    expect(importSource).toContain('{s.blockName}')
    expect(importSource).toContain('onChange={(e) => onConsent(e.target.checked)}')
    expect(importSource).toContain("data-component-id=\"agent-config-consent\"")
    expect(importSource).toContain("t('erratanet.agentConfig.configurationRunsCode')")
    expect(importSource).toContain("a.modelRolesNeedingProvider.map(humanizeAgent).join(', ')")
    expect(importSource).toContain("a.suggestedProviders.map((p) => `${p.name} (${p.defaultModel})`).join(', ')")
  })

  it('localizes ErrataNet publish chrome without changing slugs, versions, ratings, visibility, manifest fields, or publish payloads', () => {
    const publishSource = readFileSync('src/components/erratanet/PublishPackDialog.tsx', 'utf8')

    expect(publishSource).toContain('useLanguage()')
    expect(publishSource).toContain("t('erratanet.publish.title')")
    expect(publishSource).toContain("type ContentRating = 'general' | 'mature' | 'r18'")
    expect(publishSource).toContain("useState<ContentRating>('general')")
    expect(publishSource).toContain("useState<'public' | 'unlisted'>('public')")
    expect(publishSource).toContain("useState<BumpKind>('patch')")
    expect(publishSource).toContain('const nextVersion = useMemo(() => bumpVersion(latestVersion, bump), [latestVersion, bump])')
    expect(publishSource).toContain("const cleanSlug = slug.trim() || slugify(title)")
    expect(publishSource).toContain('GLOBAL_PACK_ID_REGEX.test(id)')
    expect(publishSource).toContain("setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))")
    expect(publishSource).toContain("value: 'CC0-1.0'")
    expect(publishSource).toContain("value: 'CC-BY-4.0'")
    expect(publishSource).toContain("value: 'CC-BY-SA-4.0'")
    expect(publishSource).toContain("value: 'CC-BY-NC-4.0'")
    expect(publishSource).toContain("value: 'proprietary'")
    expect(publishSource).toContain("nsfw: contentRating === 'r18'")
    expect(publishSource).toContain('contentRating,')
    expect(publishSource).toContain('license,')
    expect(publishSource).toContain('tags,')
    expect(publishSource).toContain('title: title.trim()')
    expect(publishSource).toContain('description: description.trim()')
    expect(publishSource).toContain('version: nextVersion')
    expect(publishSource).toContain('publisher: `@${handle}`')
    expect(publishSource).toContain("api.erratanet.publish({ storyId, manifest, unlisted: visibility === 'unlisted' })")
    expect(publishSource).toContain('const bundleJson = serializeBundle(selectedFragments, mediaById, storyName)')
    expect(publishSource).toContain('bundleJson,')
    expect(publishSource).toContain("unlisted: visibility === 'unlisted'")
    expect(publishSource).toContain('fragmentIds: selectedFragments.map((f) => f.id)')
    expect(publishSource).toContain("if (typeof manifest.title === 'string' && manifest.title) setTitle(manifest.title)")
    expect(publishSource).toContain("if (typeof manifest.license === 'string' && manifest.license) setLicense(manifest.license)")
    expect(publishSource).toContain("if (typeof manifest.readme === 'string') setReadme(manifest.readme)")
    expect(publishSource).toContain('result.push({ title: marker.name, order: result.length })')
  })
  it('localizes agent-config sharing chrome without changing snapshot selection, manifest values, script detection, or publish payloads', () => {
    const shareSource = readFileSync('src/components/erratanet/ShareAgentConfigDialog.tsx', 'utf8')

    expect(shareSource).toContain('useLanguage()')
    expect(shareSource).toContain("t('erratanet.shareConfig.title')")
    expect(shareSource).toContain("api.erratanet.agentConfig.snapshot(storyId)")
    expect(shareSource).toContain('const full = fullSelection(snapshot.preview)')
    expect(shareSource).toContain('restrictToSurfaces(full, defaultIncludes)')
    expect(shareSource).toContain('selectedScripts(selection, snapshot.preview)')
    expect(shareSource).toContain('selection: toSelectionPayload(selection)')
    expect(shareSource).toContain('manifest,')
    expect(shareSource).toContain("unlisted: visibility === 'unlisted'")
    expect(shareSource).toContain("type BumpKind")
    expect(shareSource).toContain("useState<'public' | 'unlisted'>('public')")
    expect(shareSource).toContain("useState<BumpKind>('patch')")
    expect(shareSource).toContain("const nextVersion = useMemo(() => bumpVersion(latestVersion, bump), [latestVersion, bump])")
    expect(shareSource).toContain("setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))")
    expect(shareSource).toContain("value: 'CC0-1.0'")
    expect(shareSource).toContain("value: 'CC-BY-4.0'")
    expect(shareSource).toContain("value: 'CC-BY-SA-4.0'")
    expect(shareSource).toContain("value: 'proprietary'")
    expect(shareSource).toContain("nsfw: false")
    expect(shareSource).toContain('title: title.trim()')
    expect(shareSource).toContain('description: description.trim()')
    expect(shareSource).toContain('license,')
    expect(shareSource).toContain('tags,')
    expect(shareSource).toContain('publisher: `@${handle}`')
    expect(shareSource).toContain('manifest.tags')
    expect(shareSource).toContain('manifest.description')
    expect(shareSource).toContain('manifest.license')
    expect(shareSource).toContain('manifest.readme')
    expect(shareSource).toContain('manifest.title')
    expect(shareSource).toContain("storyName ? `${storyName} setup` : ''")
  })

  it('localizes plugin settings chrome without changing plugin identity, metadata, enablement, panel routing, or sidebar visibility semantics', () => {
    const settingsSource = readFileSync('src/components/sidebar/SettingsPanel.tsx', 'utf8')

    expect(settingsSource).toContain("t('settings.plugins.heading')")
    expect(settingsSource).toContain("t('settings.plugins.openPanel')")
    expect(settingsSource).toContain('{plugin.name}')
    expect(settingsSource).toContain('{plugin.description}')
    expect(settingsSource).toContain('v{plugin.version}')
    expect(settingsSource).toContain('story.settings.enabledPlugins.includes(plugin.name)')
    expect(settingsSource).toContain('togglePlugin(plugin.name)')
    expect(settingsSource).toContain('onOpenPluginPanel(plugin.name)')
    expect(settingsSource).toContain('onTogglePluginSidebar(plugin.name, !isSidebarVisible)')
    expect(settingsSource).toContain("(pluginSidebarVisibility?.[plugin.name]) ?? (plugin.panel?.showInSidebar !== false)")
    expect(settingsSource).toContain("aria-label={`${isEnabled ? t('settings.plugins.disable') : t('settings.plugins.enable')} ${plugin.name}`}")
  })

  it('localizes provider management chrome without changing provider presets, credentials, model IDs, headers, or API payloads', () => {
    const providerSource = readFileSync('src/components/settings/ProviderManager.tsx', 'utf8')

    expect(providerSource).toContain('useLanguage()')
    expect(providerSource).toContain("t('providers.heading')")
    expect(providerSource).toContain("deepseek: { name: 'DeepSeek', baseURL: 'https://api.deepseek.com', defaultModel: 'deepseek-v4-flash'")
    expect(providerSource).toContain("openai: { name: 'OpenAI', baseURL: 'https://api.openai.com/v1', defaultModel: 'gpt-5.2'")
    expect(providerSource).toContain("anthropic: { name: 'Anthropic', baseURL: 'https://api.anthropic.com/v1', defaultModel: 'claude-opus-4-6'")
    expect(providerSource).toContain("openrouter: { name: 'OpenRouter', baseURL: 'https://openrouter.ai/api/v1'")
    expect(providerSource).toContain("custom: { name: '', baseURL: '', defaultModel: '' }")
    expect(providerSource).toContain('api.config.addProvider(data)')
    expect(providerSource).toContain('api.config.updateProvider(id, data)')
    expect(providerSource).toContain('api.config.deleteProvider(id)')
    expect(providerSource).toContain('api.config.setDefaultProvider(id)')
    expect(providerSource).toContain('api.config.duplicateProvider(id)')
    expect(providerSource).toContain('api.config.startOpenRouterOAuth()')
    expect(providerSource).toContain('api.config.listModels(editingId)')
    expect(providerSource).toContain('api.config.testModels({ baseURL: form.baseURL, apiKey: form.apiKey, preset: form.preset, customHeaders: getFormHeaders() })')
    expect(providerSource).toContain('api.config.testStoredProvider(editingId, { model: form.defaultModel })')
    expect(providerSource).toContain('api.config.testConnection({')
    expect(providerSource).toContain('baseURL: form.baseURL')
    expect(providerSource).toContain('apiKey: form.apiKey')
    expect(providerSource).toContain('model: form.defaultModel')
    expect(providerSource).toContain('preset: form.preset')
    expect(providerSource).toContain('customHeaders: getFormHeaders()')
    expect(providerSource).toContain('if (form.apiKey) data.apiKey = form.apiKey')
    expect(providerSource).toContain('{p.name}')
    expect(providerSource).toContain('{p.defaultModel}')
    expect(providerSource).toContain('{p.baseURL}')
    expect(providerSource).toContain('{p.apiKey}')
    expect(providerSource).toContain('{m.id}')
    expect(providerSource).toContain('header.key')
    expect(providerSource).toContain('header.value')
  })

  it('localizes shared settings controls without changing model IDs, custom CSS persistence, or numeric validation semantics', () => {
    const modelSource = readFileSync('src/components/settings/ModelSelect.tsx', 'utf8')
    const cssSource = readFileSync('src/components/settings/CustomCssPanel.tsx', 'utf8')
    const samplingSource = readFileSync('src/components/settings/SamplingNumberInput.tsx', 'utf8')

    expect(modelSource).toContain('useLanguage()')
    expect(modelSource).toContain("queryKey: ['provider-models', providerId]")
    expect(modelSource).toContain('api.config.listModels(providerId!)')
    expect(modelSource).toContain("onChange={(e) => onChange(e.target.value || null)}")
    expect(modelSource).toContain('value={m.id}')
    expect(modelSource).toContain('{m.id}')
    expect(modelSource).toContain('placeholder="model-id"')
    expect(modelSource).toContain("t('settings.modelSelect.noProvider')")
    expect(modelSource).toContain("defaultLabel ?? t('settings.modelSelect.default')")

    expect(cssSource).toContain('useLanguage()')
    expect(cssSource).toContain('useCustomCss()')
    expect(cssSource).toContain('setCss(value)')
    expect(cssSource).toContain("setValue('')")
    expect(cssSource).toContain("const CUSTOM_CSS_STYLE_ID = 'errata-custom-css'")
    expect(cssSource).toContain('styleEl.textContent = css')
    expect(cssSource).toContain('styleEl.remove()')
    expect(cssSource).toContain("t('settings.customCss.save')")

    expect(samplingSource).toContain('useLanguage()')
    expect(samplingSource).toContain("const nextValue = trimmed === '' ? null : Number(trimmed)")
    expect(samplingSource).toContain('Number.isFinite(nextValue)')
    expect(samplingSource).toContain('nextValue >= min')
    expect(samplingSource).toContain('nextValue <= max')
    expect(samplingSource).toContain('!integer || Number.isInteger(nextValue)')
    expect(samplingSource).toContain('if (nextValue !== currentValue) onCommit(nextValue)')
    expect(samplingSource).toContain("if (event.key === 'Enter') event.currentTarget.blur()")
    expect(samplingSource).toContain("if (event.key === 'Escape')")
    expect(samplingSource).toContain("t('settings.numberInput.enterValueFrom')")
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