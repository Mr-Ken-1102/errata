import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type StoryMeta, type GlobalConfigSafe } from '@/lib/api'
import { useTheme, useQuickSwitch, useMentionTypes, BASE_MENTION_TYPES, useTimelineBar, useProseWidth, useUiFontSize, UI_FONT_SIZE_LABELS, useProseFontSize, PROSE_FONT_SIZE_LABELS, useFontPreferences, getActiveFont, FONT_CATALOGUE, loadFullFontCatalogue, useCustomCss, useWritingTransforms, useTransformContext, type TransformContext, type FontRole, type ProseWidth, type UiFontSize, type ProseFontSize } from '@/lib/theme'
import { Settings2, ChevronRight, ExternalLink, Eye, EyeOff, Puzzle, RotateCcw, CircleHelp, Code } from 'lucide-react'
import { useHelp } from '@/hooks/use-help'
import { CustomCssPanel } from '@/components/settings/CustomCssPanel'
import { TtsSettings } from '@/components/settings/TtsSettings'
import { SharingPanel } from '@/components/settings/SharingPanel'
import { ProseColorsControls } from '@/components/settings/ProseColorsPanel'
import { CustomTransformsControls } from '@/components/settings/CustomTransformsPanel'
import { DesktopUpdatesControls } from '@/components/settings/DesktopUpdatesPanel'
import { AboutSection } from '@/components/settings/AboutPanel'
import { ModelSelect } from '@/components/settings/ModelSelect'
import { SamplingNumberInput } from '@/components/settings/SamplingNumberInput'
import { ProviderSelect } from '@/components/settings/ProviderSelect'
import { getDesktopBridge, onDesktopBridgeReady } from '@/lib/desktop'
import { resolveProvider, getInheritLabel } from '@/lib/model-role-helpers'
import { useInteractionSounds } from '@/lib/interaction-sounds'
import { useLanguage } from '@/lib/i18n'
import {
  BUILTIN_FRAGMENT_TYPES,
  compareFragmentTypeVisuals,
  FragmentTypeDisplayIcon,
  getFragmentTypeVisual,
} from '@/components/fragments/fragment-type-icons'
import {
  SettingsSection,
  SectionHeading,
  SettingsCard,
  SettingRow,
  Toggle,
  SegmentedControl,
  NumberField,
} from '@/components/settings/primitives'

interface SettingsPanelProps {
  storyId: string
  story: StoryMeta
  onManageProviders: () => void
  onOpenPluginPanel?: (pluginName: string) => void
  onTogglePluginSidebar?: (pluginName: string, visible: boolean) => void
  pluginSidebarVisibility?: Record<string, boolean>
}


function SettingsGroup({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border/30 overflow-hidden">
      <div className="px-3 py-2 border-b border-border/20 bg-muted/20">
        <p className="text-[0.625rem] uppercase tracking-[0.14em] text-muted-foreground">{title}</p>
        {description && <p className="text-[0.6875rem] text-muted-foreground mt-0.5 leading-snug">{description}</p>}
      </div>
      <div className="divide-y divide-border/20">
        {children}
      </div>
    </div>
  )
}

function FontPicker({ role, label, description, activeFont, onSelect }: {
  role: FontRole
  label: string
  description: string
  activeFont: string
  onSelect: (name: string) => void
}) {
  useEffect(() => { loadFullFontCatalogue() }, [])
  const { t } = useLanguage()
  const options = FONT_CATALOGUE[role]
  return (
    <div className="px-3 py-2.5">
      <p className="text-[0.75rem] font-medium text-foreground/80 mb-0.5">{label}</p>
      <p className="text-[0.625rem] text-muted-foreground mb-2 leading-snug">{description}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const isActive = opt.name === activeFont
          return (
            <button
              key={opt.name}
              onClick={() => onSelect(opt.name)}
              style={{ fontFamily: `"${opt.name}", ${opt.fallback}` }}
              className={`px-2.5 py-1 rounded-md text-[0.75rem] border transition-all duration-150 inline-flex items-center gap-1.5 ${isActive
                  ? 'border-foreground/25 bg-foreground/5 text-foreground shadow-[0_0_0_1px_var(--foreground)/5]'
                  : 'border-transparent text-muted-foreground hover:text-foreground/70 hover:bg-accent/30'
                }`}
            >
              {opt.name}
              {opt.tag && (
                <span className="text-[0.5rem] font-sans font-medium uppercase tracking-wider text-primary/60 bg-primary/8 px-1.5 py-px rounded-full leading-tight">
                  {opt.tag === 'high-visibility' ? t('settings.typography.highVisibility') : opt.tag}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function MentionTypePicker({
  story,
  enabledTypes,
  onChange,
}: {
  story: StoryMeta
  enabledTypes: string[]
  onChange: (types: string[]) => void
}) {
  const customTypes = story.settings.customFragmentTypes ?? []
  const options = useMemo(() => {
    const visuals = [
      ...BASE_MENTION_TYPES.map((type) => getFragmentTypeVisual(type, customTypes)),
      ...customTypes
        .filter((def) => !BUILTIN_FRAGMENT_TYPES.has(def.type))
        .map((def) => getFragmentTypeVisual(def.type, customTypes)),
    ]
    return visuals.sort(compareFragmentTypeVisuals)
  }, [customTypes])
  const enabled = new Set(enabledTypes)

  const toggleType = (type: string) => {
    onChange(enabled.has(type)
      ? enabledTypes.filter((current) => current !== type)
      : [...enabledTypes, type])
  }

  return (
    <div className="flex max-w-[22rem] flex-wrap justify-end gap-1.5">
      {options.map((option) => {
        const active = enabled.has(option.type)
        return (
          <button
            key={option.type}
            type="button"
            aria-pressed={active}
            onClick={() => toggleType(option.type)}
            className={`inline-flex h-6 items-center gap-1 rounded-md border px-1.5 text-[0.625rem] font-medium transition-colors ${active
                ? 'border-foreground/25 bg-foreground text-background shadow-[0_0_0_1px_rgba(0,0,0,0.03)]'
                : 'border-border/40 bg-transparent text-muted-foreground hover:border-border/70 hover:text-foreground/75'
              }`}
            title={option.label}
          >
            <FragmentTypeDisplayIcon type={option.type} customTypes={customTypes} className="size-3" />
            <span>{option.singularLabel}</span>
          </button>
        )
      })}
    </div>
  )
}


function LLMSection({ story, globalConfig, updateMutation, onManageProviders }: {
  story: StoryMeta
  globalConfig: GlobalConfigSafe | null
  updateMutation: { mutate: (data: Parameters<typeof api.settings.update>[1]) => void; isPending: boolean }
  onManageProviders: () => void
}) {
  const { openHelp } = useHelp()
  const { t } = useLanguage()
  const settings = story.settings
  const overrides = settings.modelOverrides ?? {}

  const { data: modelRoles } = useQuery({
    queryKey: ['model-roles'],
    queryFn: () => api.agentBlocks.listModelRoles(),
  })

  const roles = modelRoles ?? []

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <label className="text-[0.625rem] text-muted-foreground uppercase tracking-wider">LLM</label>
        <button
          type="button"
          onClick={() => openHelp('settings#providers')}
          className="text-muted-foreground hover:text-primary/60 transition-colors"
          title={t('settings.providers.aboutModelConfiguration')}
        >
          <CircleHelp className="size-3" />
        </button>
      </div>
      <div className="rounded-lg border border-border/30 divide-y divide-border/20">
        {roles.map((role) => {
          const directProviderId = overrides[role.key]?.providerId ?? null
          const directModelId = overrides[role.key]?.modelId ?? null
          const effectiveProviderId = resolveProvider(role.key, settings, globalConfig)
          const isGeneration = role.key === 'generation'

          return (
            <div key={role.key} className="px-3 py-2">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="min-w-0">
                  <p className="text-[0.75rem] font-medium text-foreground/80">{role.label}</p>
                  <p className="text-[0.625rem] text-muted-foreground leading-snug">{role.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <ProviderSelect
                    value={directProviderId}
                    globalConfig={globalConfig}
                    onChange={(id) => {
                      const current = overrides[role.key] ?? {}
                      updateMutation.mutate({
                        modelOverrides: { ...overrides, [role.key]: { ...current, providerId: id, modelId: null } },
                      })
                    }}
                    disabled={updateMutation.isPending}
                    inheritLabel={isGeneration ? undefined : getInheritLabel(role.key, roles, settings, globalConfig)}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <ModelSelect
                    providerId={effectiveProviderId}
                    value={directModelId}
                    onChange={(mid) => {
                      const current = overrides[role.key] ?? {}
                      updateMutation.mutate({
                        modelOverrides: {
                          ...overrides,
                          [role.key]: {
                            ...current,
                            providerId: mid ? (current.providerId ?? effectiveProviderId) : current.providerId,
                            modelId: mid,
                          },
                        },
                      })
                    }}
                    disabled={updateMutation.isPending}
                    defaultLabel={isGeneration ? t('settings.providers.default') : t('settings.providers.inherit')}
                  />
                </div>
                <div className="shrink-0 w-16">
                  <SamplingNumberInput
                    min={0}
                    max={2}
                    step={0.1}
                    value={overrides[role.key]?.temperature}
                    onCommit={(temperature) => {
                      const current = overrides[role.key] ?? {}
                      updateMutation.mutate({
                        modelOverrides: { ...overrides, [role.key]: { ...current, temperature } },
                      })
                    }}
                    disabled={updateMutation.isPending}
                    placeholder={t('settings.providers.temperatureShort')}
                    title={t('settings.providers.temperatureDescription')}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )
        })}
        <button
          type="button"
          onClick={onManageProviders}
          className="w-full flex items-center justify-between px-3 py-2 text-[0.6875rem] text-muted-foreground hover:text-foreground/60 hover:bg-accent/20 transition-colors rounded-b-lg"
          data-component-id="settings-manage-providers"
        >
          <span className="flex items-center gap-1.5">
            <Settings2 className="size-3" />
            {t('settings.providers.manageProviders')}
          </span>
          <ChevronRight className="size-3" />
        </button>
      </div>
    </div>
  )
}

const DEFAULT_CONTINUE = 'Continue the story naturally. Write the next scene, advancing the plot and developing characters.'
const DEFAULT_SCENE_SETTING = "Continue the story without advancing the plot. Focus on atmosphere, internal thoughts, sensory details, or character moments. Don't introduce new events or move the story forward."
const DEFAULT_SUGGEST = `Based on everything in the story so far, suggest exactly {{count}} possible directions the story could go next. Return ONLY a JSON array with no other text. Each element must have:
- "title": a short evocative title (3-6 words)
- "description": 1-2 sentences describing this direction
- "instruction": a detailed writing prompt (2-3 sentences) that could be given to a writer to produce this continuation

Consider a mix of: advancing the main plot, exploring character relationships, introducing tension or conflict, quiet character moments, and unexpected developments. Make each suggestion meaningfully different from the others.

Respond with ONLY the JSON array, no markdown fences or other text.`

function GuidedPromptsControls({ story, onUpdate, isPending }: {
  story: StoryMeta
  onUpdate: (data: { guidedContinuePrompt?: string; guidedSceneSettingPrompt?: string; guidedSuggestPrompt?: string }) => void
  isPending: boolean
}) {
  const { t } = useLanguage()
  const [continuePrompt, setContinuePrompt] = useState(story.settings.guidedContinuePrompt ?? '')
  const [sceneSettingPrompt, setSceneSettingPrompt] = useState(story.settings.guidedSceneSettingPrompt ?? '')
  const [suggestPrompt, setSuggestPrompt] = useState(story.settings.guidedSuggestPrompt ?? '')

  useEffect(() => {
    setContinuePrompt(story.settings.guidedContinuePrompt ?? '')
    setSceneSettingPrompt(story.settings.guidedSceneSettingPrompt ?? '')
    setSuggestPrompt(story.settings.guidedSuggestPrompt ?? '')
  }, [
    story.settings.guidedContinuePrompt,
    story.settings.guidedSceneSettingPrompt,
    story.settings.guidedSuggestPrompt,
  ])

  const save = (field: 'guidedContinuePrompt' | 'guidedSceneSettingPrompt' | 'guidedSuggestPrompt', value: string) => {
    onUpdate({ [field]: value.trim() === '' ? '' : value })
  }

  return (
    <div className="space-y-4">
        <div>
          <label className="text-[0.6875rem] font-medium text-foreground/80 mb-1 block">{t('settings.authoring.continuePrompt')}</label>
          <p className="text-[0.625rem] text-muted-foreground mb-1.5 leading-snug">{t('settings.authoring.continuePromptDescription')}</p>
          <textarea
            value={continuePrompt}
            onChange={(e) => setContinuePrompt(e.target.value)}
            onBlur={() => save('guidedContinuePrompt', continuePrompt)}
            placeholder={DEFAULT_CONTINUE}
            rows={3}
            disabled={isPending}
            className="w-full text-[0.75rem] bg-muted/30 border border-border/30 rounded-md px-2.5 py-2 resize-none outline-none focus:border-primary/30 transition-colors placeholder:text-muted-foreground/50 disabled:opacity-40"
          />
        </div>
        <div>
          <label className="text-[0.6875rem] font-medium text-foreground/80 mb-1 block">{t('settings.authoring.sceneSettingPrompt')}</label>
          <p className="text-[0.625rem] text-muted-foreground mb-1.5 leading-snug">{t('settings.authoring.sceneSettingPromptDescription')}</p>
          <textarea
            value={sceneSettingPrompt}
            onChange={(e) => setSceneSettingPrompt(e.target.value)}
            onBlur={() => save('guidedSceneSettingPrompt', sceneSettingPrompt)}
            placeholder={DEFAULT_SCENE_SETTING}
            rows={3}
            disabled={isPending}
            className="w-full text-[0.75rem] bg-muted/30 border border-border/30 rounded-md px-2.5 py-2 resize-none outline-none focus:border-primary/30 transition-colors placeholder:text-muted-foreground/50 disabled:opacity-40"
          />
        </div>
        <div>
          <label className="text-[0.6875rem] font-medium text-foreground/80 mb-1 block">{t('settings.authoring.suggestDirectionsPrompt')}</label>
          <p className="text-[0.625rem] text-muted-foreground mb-1.5 leading-snug">
            {t('settings.authoring.suggestDirectionsPromptDescription')} <code className="text-[0.625rem] bg-muted/50 px-1 rounded">{'{{count}}'}</code> {t('settings.authoring.suggestDirectionsCountSuffix')}
          </p>
          <textarea
            value={suggestPrompt}
            onChange={(e) => setSuggestPrompt(e.target.value)}
            onBlur={() => save('guidedSuggestPrompt', suggestPrompt)}
            placeholder={DEFAULT_SUGGEST}
            rows={6}
            disabled={isPending}
            className="w-full text-[0.75rem] bg-muted/30 border border-border/30 rounded-md px-2.5 py-2 resize-none outline-none focus:border-primary/30 transition-colors placeholder:text-muted-foreground/50 disabled:opacity-40"
          />
        </div>
        <p className="text-[0.625rem] text-muted-foreground italic">
          {t('settings.authoring.guidedPromptSaveNotice')}
        </p>
    </div>
  )
}

const DEFAULT_HUB = 'https://errata.tealios.com'

function ErrataNetSection() {
  const queryClient = useQueryClient()
  const { t } = useLanguage()
  const { data: config } = useQuery({
    queryKey: ['erratanet-config'],
    queryFn: () => api.erratanet.getConfig(),
  })
  const setConfig = useMutation({
    mutationFn: (data: { enabled?: boolean; hubUrl?: string; introSeen?: boolean }) =>
      api.erratanet.setConfig(data),
    onSuccess: (cfg) => {
      queryClient.setQueryData(['erratanet-config'], cfg)
      queryClient.invalidateQueries({ queryKey: ['erratanet-account'] })
    },
  })

  const enabled = config?.enabled ?? false

  // Local draft for the endpoint so typing does not fire a save on every key.
  const [endpoint, setEndpoint] = useState('')
  useEffect(() => {
    setEndpoint(config?.hubUrl ?? '')
  }, [config?.hubUrl])

  const saveEndpoint = () => {
    const next = endpoint.trim().replace(/\/+$/, '')
    setEndpoint(next)
    if (next === (config?.hubUrl ?? '')) return
    setConfig.mutate({ hubUrl: next })
  }

  return (
    <>
      <SectionHeading label={t('settings.erratanet.heading')} />
      <div className="space-y-3">
        <SettingsCard>
          <SettingRow
            label={t('settings.erratanet.heading')}
            description={t('settings.erratanet.description')}
          >
            <Toggle
              checked={enabled}
              disabled={setConfig.isPending}
              onChange={(next) => setConfig.mutate(next ? { enabled: true, introSeen: true } : { enabled: false })}
              label={t('settings.erratanet.toggle')}
            />
          </SettingRow>
        </SettingsCard>

        <div className={`rounded-lg border border-border/30 p-3 ${enabled ? '' : 'pointer-events-none opacity-40'}`}>
          <p className="text-[0.75rem] font-medium text-foreground/80">{t('settings.erratanet.apiEndpoint')}</p>
          <p className="mt-0.5 text-[0.625rem] leading-snug text-muted-foreground">
            {t('settings.erratanet.apiEndpointDescription')}
          </p>
          <input
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            onBlur={saveEndpoint}
            onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
            placeholder={DEFAULT_HUB}
            spellCheck={false}
            autoComplete="off"
            disabled={!enabled || setConfig.isPending}
            className="mt-2 h-[28px] w-full rounded-md border border-border/40 bg-background px-2 font-mono text-[0.75rem] text-foreground focus:border-foreground/20 focus:outline-none disabled:opacity-60"
          />
        </div>
      </div>
    </>
  )
}

export function SettingsPanel({
  storyId,
  story,
  onManageProviders,
  onOpenPluginPanel,
  onTogglePluginSidebar,
  pluginSidebarVisibility,
}: SettingsPanelProps) {
  const queryClient = useQueryClient()
  const { t } = useLanguage()

  const { data: plugins } = useQuery({
    queryKey: ['plugins'],
    queryFn: () => api.plugins.list(),
  })

  const { data: globalConfig } = useQuery({
    queryKey: ['global-config'],
    queryFn: () => api.config.getProviders(),
  })

  const updateMutation = useMutation({
    mutationFn: (data: Parameters<typeof api.settings.update>[1]) =>
      api.settings.update(storyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['story', storyId] })
    },
  })

  const togglePlugin = (pluginName: string) => {
    const enabled = story.settings.enabledPlugins
    const next = enabled.includes(pluginName)
      ? enabled.filter((p) => p !== pluginName)
      : [...enabled, pluginName]
    updateMutation.mutate({ enabledPlugins: next })
  }

  const [customCssPanelOpen, setCustomCssPanelOpen] = useState(false)
  const [writingTransforms] = useWritingTransforms()
  const enabledTransformCount = writingTransforms.filter(t => t.enabled).length
  const [transformContext, setTransformContext] = useTransformContext()
  const { openHelp } = useHelp()
  const { theme, setTheme } = useTheme()
  const [interactionSounds, setInteractionSounds] = useInteractionSounds()
  const [quickSwitch, setQuickSwitch] = useQuickSwitch()
  const [mentionTypes, setMentionTypes] = useMentionTypes()
  const [timelineBar, setTimelineBar] = useTimelineBar()
  const [proseWidth, setProseWidth] = useProseWidth()
  const [uiFontSize, setUiFontSize] = useUiFontSize()
  const [proseFontSize, setProseFontSize] = useProseFontSize()
  const [fontPrefs, setFont, resetFonts] = useFontPreferences()
  const hasCustomFonts = Object.keys(fontPrefs).length > 0
  const [, customCssEnabled, , setCustomCssEnabled] = useCustomCss()
  const [hasDesktopBridge, setHasDesktopBridge] = useState(() => getDesktopBridge() !== null)

  useEffect(() => {
    return onDesktopBridgeReady(() => setHasDesktopBridge(true))
  }, [])

  if (customCssPanelOpen) {
    return <CustomCssPanel onClose={() => setCustomCssPanelOpen(false)} />
  }

  return (
    <div className="p-4 space-y-4" data-component-id="settings-panel-root">
      {/* Appearance */}
      <SettingsSection id="set-appearance" label="Appearance" group="Interface">
        <SectionHeading label={t('settings.appearance.heading')} />
        <SettingsCard>
          <SettingRow label={t('settings.appearance.theme')}>
            <SegmentedControl
              value={theme}
              options={[
                { value: 'light', label: t('settings.appearance.light') },
                { value: 'dark', label: t('settings.appearance.dark') },
                { value: 'high-contrast', label: t('settings.appearance.highContrast') },
              ]}
              onChange={setTheme}
            />
          </SettingRow>
          <SettingRow label={t('settings.appearance.interactionSounds')} description={t('settings.appearance.interactionSoundsDescription')}>
            <Toggle
              checked={interactionSounds}
              onChange={setInteractionSounds}
              label={t('settings.appearance.toggleInteractionSounds')}
            />
          </SettingRow>
          <SettingRow label={t('settings.appearance.uiSize')} description={t('settings.appearance.uiSizeDescription')}>
            <SegmentedControl<UiFontSize>
              value={uiFontSize}
              options={[
                { value: 'xs', label: UI_FONT_SIZE_LABELS.xs },
                { value: 'sm', label: UI_FONT_SIZE_LABELS.sm },
                { value: 'md', label: UI_FONT_SIZE_LABELS.md },
                { value: 'lg', label: UI_FONT_SIZE_LABELS.lg },
                { value: 'xl', label: UI_FONT_SIZE_LABELS.xl },
              ]}
              onChange={setUiFontSize}
            />
          </SettingRow>
          <SettingRow label={t('settings.appearance.quickSwitch')} description={t('settings.appearance.quickSwitchDescription')}>
            <Toggle checked={quickSwitch} onChange={setQuickSwitch} label={t('settings.appearance.toggleQuickSwitch')} />
          </SettingRow>
          <SettingRow label={t('settings.appearance.mentions')} description={t('settings.appearance.mentionsDescription')}>
            <MentionTypePicker story={story} enabledTypes={mentionTypes} onChange={setMentionTypes} />
          </SettingRow>
          <SettingRow label={t('settings.appearance.timelineBar')} description={t('settings.appearance.timelineBarDescription')}>
            <Toggle checked={timelineBar} onChange={setTimelineBar} label={t('settings.appearance.toggleTimelineBar')} />
          </SettingRow>
          <SettingRow label={t('settings.appearance.proseWidth')} description={t('settings.appearance.proseWidthDescription')}>
            <SegmentedControl<ProseWidth>
              value={proseWidth}
              options={[
                { value: 'narrow', label: t('settings.appearance.widthNarrow') },
                { value: 'medium', label: t('settings.appearance.widthMedium') },
                { value: 'wide', label: t('settings.appearance.widthWide') },
                { value: 'full', label: t('settings.appearance.widthFull') },
              ]}
              onChange={setProseWidth}
            />
          </SettingRow>
          <SettingRow label={t('settings.appearance.fontSize')} description={t('settings.appearance.fontSizeDescription')}>
            <SegmentedControl<ProseFontSize>
              value={proseFontSize}
              options={[
                { value: 'xs', label: PROSE_FONT_SIZE_LABELS.xs },
                { value: 'sm', label: PROSE_FONT_SIZE_LABELS.sm },
                { value: 'md', label: PROSE_FONT_SIZE_LABELS.md },
                { value: 'lg', label: PROSE_FONT_SIZE_LABELS.lg },
                { value: 'xl', label: PROSE_FONT_SIZE_LABELS.xl },
              ]}
              onChange={setProseFontSize}
            />
          </SettingRow>
          <SettingRow label={t('settings.appearance.customCss')} description={t('settings.appearance.customCssDescription')}>
            <Toggle checked={customCssEnabled} onChange={setCustomCssEnabled} label={t('settings.appearance.toggleCustomCss')} />
          </SettingRow>
          {customCssEnabled && (
            <button
              type="button"
              onClick={() => setCustomCssPanelOpen(true)}
              className="w-full flex items-center justify-between px-3 py-2 text-[0.6875rem] text-muted-foreground hover:text-foreground/60 hover:bg-accent/20 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Code className="size-3" />
                {t('settings.appearance.editCustomCss')}
              </span>
              <ChevronRight className="size-3" />
            </button>
          )}
        </SettingsCard>
        <ProseColorsControls />
      </SettingsSection>

      {/* Typography */}
      <SettingsSection id="set-typography" label="Typography" group="Interface">
        <SectionHeading
          label={t('settings.typography.heading')}
          action={hasCustomFonts && (
            <button
              onClick={resetFonts}
              className="flex items-center gap-1 text-[0.625rem] text-muted-foreground hover:text-foreground/60 transition-colors"
            >
              <RotateCcw className="size-2.5" />
              {t('settings.typography.reset')}
            </button>
          )}
        />
        <SettingsCard>
          <FontPicker
            role="display"
            label={t('settings.typography.display')}
            description={t('settings.typography.displayDescription')}
            activeFont={getActiveFont('display', fontPrefs)}
            onSelect={(name) => setFont('display', name)}
          />
          <FontPicker
            role="prose"
            label={t('settings.typography.prose')}
            description={t('settings.typography.proseDescription')}
            activeFont={getActiveFont('prose', fontPrefs)}
            onSelect={(name) => setFont('prose', name)}
          />
          <FontPicker
            role="sans"
            label={t('settings.typography.interface')}
            description={t('settings.typography.interfaceDescription')}
            activeFont={getActiveFont('sans', fontPrefs)}
            onSelect={(name) => setFont('sans', name)}
          />
          <FontPicker
            role="mono"
            label={t('settings.typography.code')}
            description={t('settings.typography.codeDescription')}
            activeFont={getActiveFont('mono', fontPrefs)}
            onSelect={(name) => setFont('mono', name)}
          />
        </SettingsCard>
      </SettingsSection>

      {/* Read aloud (TTS) */}
      <SettingsSection id="set-read-aloud" label="Read aloud" group="Interface"><TtsSettings /></SettingsSection>

      {/* LLM */}
      <SettingsSection id="set-providers" label="Providers" group="Writing">
        <LLMSection
          story={story}
          globalConfig={globalConfig ?? null}
          updateMutation={updateMutation}
          onManageProviders={onManageProviders}
        />
      </SettingsSection>

      {/* Generation */}
      <SettingsSection id="set-generation" label="Generation" group="Writing">
        <SectionHeading label={t('settings.generation.heading')} helpTopic="generation#overview" />
        <div className="space-y-3">
          <SettingsGroup title={t('settings.generation.workflow')} description={t('settings.generation.workflowDescription')}>
            <SettingRow label={t('settings.generation.mode')} description={t('settings.generation.modeDescription')}>
              <SegmentedControl
                value={(story.settings.generationMode ?? 'standard') as 'standard' | 'prewriter'}
                options={[
                  { value: 'standard' as const, label: t('settings.generation.standard') },
                  { value: 'prewriter' as const, label: t('settings.generation.prewriter') },
                ]}
                onChange={(v) => updateMutation.mutate({ generationMode: v })}
                disabled={updateMutation.isPending}
              />
            </SettingRow>
            {(story.settings.generationMode ?? 'standard') === 'prewriter' && (
              <>
                <SettingRow label={t('settings.generation.prewriterReasoning')} description={t('settings.generation.prewriterReasoningDescription')}>
                  <SegmentedControl
                    value={(story.settings.prewriterReasoning ?? 'normal') as 'short' | 'normal' | 'extensive'}
                    options={[
                      { value: 'short' as const, label: t('settings.generation.reasoningShort') },
                      { value: 'normal' as const, label: t('settings.generation.reasoningNormal') },
                      { value: 'extensive' as const, label: t('settings.generation.reasoningExtensive') },
                    ]}
                    onChange={(v) => updateMutation.mutate({ prewriterReasoning: v })}
                    disabled={updateMutation.isPending}
                  />
                </SettingRow>
                <SettingRow label={t('settings.generation.clarifyBeforeWriting')} description={t('settings.generation.clarifyBeforeWritingDescription')}>
                  <Toggle
                    checked={story.settings.clarifyBeforeGenerate ?? false}
                    onChange={(next) => updateMutation.mutate({ clarifyBeforeGenerate: next })}
                    disabled={updateMutation.isPending}
                    label={t('settings.generation.toggleClarifyBeforeWriting')}
                  />
                </SettingRow>
              </>
            )}
            <SettingRow label={t('settings.generation.outputFormat')} helpTopic="generation#output-format">
              <SegmentedControl
                value={story.settings.outputFormat}
                options={[
                  { value: 'plaintext', label: t('settings.generation.plain') },
                  { value: 'markdown', label: t('settings.generation.markdown') },
                ]}
                onChange={(v) => updateMutation.mutate({ outputFormat: v })}
                disabled={updateMutation.isPending}
              />
            </SettingRow>
            <SettingRow label={t('settings.generation.maxSteps')} description={t('settings.generation.maxStepsDescription')} helpTopic="generation#max-steps">
              <NumberField
                value={story.settings.maxSteps ?? 10}
                min={1}
                max={50}
                onChange={(v) => updateMutation.mutate({ maxSteps: v })}
                disabled={updateMutation.isPending}
              />
            </SettingRow>
            <SettingRow label={t('settings.generation.disableThinking')} description={t('settings.generation.disableThinkingDescription')}>
              <Toggle
                checked={story.settings.disableThinking ?? false}
                onChange={(next) => updateMutation.mutate({ disableThinking: next })}
                disabled={updateMutation.isPending}
                label={t('settings.generation.toggleDisableThinking')}
              />
            </SettingRow>
            <SettingRow label={t('settings.generation.expandThinking')} description={t('settings.generation.expandThinkingDescription')}>
              <Toggle
                checked={story.settings.expandThoughtsByDefault ?? true}
                onChange={(next) => updateMutation.mutate({ expandThoughtsByDefault: next })}
                disabled={updateMutation.isPending}
                label={t('settings.generation.toggleExpandThinking')}
              />
            </SettingRow>
          </SettingsGroup>

          <SettingsGroup title={t('settings.generation.context')} description={t('settings.generation.contextDescription')}>
            <SettingRow label={t('settings.generation.fragmentOrdering')} description={t('settings.generation.fragmentOrderingDescription')} helpTopic="settings#prompt-control">
              <SegmentedControl
                value={story.settings.contextOrderMode ?? 'simple'}
                options={[
                  { value: 'simple', label: t('settings.generation.grouped') },
                  { value: 'advanced', label: t('settings.generation.custom') },
                ]}
                onChange={(v) => updateMutation.mutate({ contextOrderMode: v })}
                disabled={updateMutation.isPending}
              />
            </SettingRow>
            <div className="px-3 py-2.5">
              <div className="flex items-center gap-1">
                <p className="text-[0.75rem] font-medium text-foreground/80">{t('settings.generation.contextLimit')}</p>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); openHelp('generation#context-limit') }}
                  className="text-muted-foreground hover:text-primary/60 transition-colors"
                  title={t('settings.generation.learnMore')}
                >
                  <CircleHelp className="size-3" />
                </button>
              </div>
              <p className="text-[0.625rem] text-muted-foreground mt-0.5 leading-snug">{t('settings.generation.contextLimitDescription')}</p>
              <div className="flex items-center justify-between gap-2 mt-2.5">
                <SegmentedControl
                  value={(story.settings.contextCompact?.type ?? 'proseLimit') as 'proseLimit' | 'maxTokens' | 'maxCharacters'}
                  options={[
                    { value: 'proseLimit' as const, label: t('settings.generation.fragments') },
                    { value: 'maxTokens' as const, label: t('settings.generation.tokens') },
                    { value: 'maxCharacters' as const, label: t('settings.generation.characters') },
                  ]}
                  onChange={(v) => {
                    const defaults = { proseLimit: 10, maxTokens: 40000, maxCharacters: 160000 } as const
                    updateMutation.mutate({ contextCompact: { type: v, value: defaults[v] } })
                  }}
                  disabled={updateMutation.isPending}
                />
                <NumberField
                  value={story.settings.contextCompact?.value ?? 10}
                  min={(story.settings.contextCompact?.type ?? 'proseLimit') === 'proseLimit' ? 1 : (story.settings.contextCompact?.type ?? 'proseLimit') === 'maxTokens' ? 100 : 500}
                  max={(story.settings.contextCompact?.type ?? 'proseLimit') === 'proseLimit' ? 100 : (story.settings.contextCompact?.type ?? 'proseLimit') === 'maxTokens' ? 100000 : 500000}
                  onChange={(v) => updateMutation.mutate({ contextCompact: { type: story.settings.contextCompact?.type ?? 'proseLimit', value: v } })}
                  disabled={updateMutation.isPending}
                  className={(story.settings.contextCompact?.type ?? 'proseLimit') !== 'proseLimit' ? 'w-20' : undefined}
                />
              </div>
            </div>
          </SettingsGroup>

          <SettingsGroup title={t('settings.generation.librarian')} description={t('settings.generation.librarianDescription')}>
            <SettingRow label={t('settings.generation.disableAutoAnalysis')} description={t('settings.generation.disableAutoAnalysisDescription')}>
              <Toggle
                checked={story.settings.disableLibrarianAutoAnalysis ?? false}
                onChange={(next) => updateMutation.mutate({ disableLibrarianAutoAnalysis: next })}
                disabled={updateMutation.isPending}
                label={t('settings.generation.toggleDisableAutoAnalysis')}
              />
            </SettingRow>
            <SettingRow label={t('settings.generation.autoApplySuggestions')} description={t('settings.generation.autoApplySuggestionsDescription')} helpTopic="librarian#auto-suggestions">
              <Toggle
                checked={story.settings.autoApplyLibrarianSuggestions ?? false}
                onChange={(next) => updateMutation.mutate({ autoApplyLibrarianSuggestions: next })}
                disabled={updateMutation.isPending}
                label={t('settings.generation.toggleAutoApplySuggestions')}
              />
            </SettingRow>
            <SettingRow label={t('settings.generation.disableAutomaticDirections')} description={t('settings.generation.disableAutomaticDirectionsDescription')}>
              <Toggle
                checked={story.settings.disableLibrarianDirections ?? false}
                onChange={(next) => updateMutation.mutate({ disableLibrarianDirections: next })}
                disabled={updateMutation.isPending}
                label={t('settings.generation.toggleAutomaticDirections')}
              />
            </SettingRow>
            <SettingRow label={t('settings.generation.disableSuggestions')} description={t('settings.generation.disableSuggestionsDescription')}>
              <Toggle
                checked={story.settings.disableLibrarianSuggestions ?? false}
                onChange={(next) => updateMutation.mutate({ disableLibrarianSuggestions: next })}
                disabled={updateMutation.isPending}
                label={t('settings.generation.toggleDisableSuggestions')}
              />
            </SettingRow>
          </SettingsGroup>
        </div>
      </SettingsSection>

      {/* Authoring (transforms + guided prompts) */}
      <SettingsSection id="set-authoring" label="Authoring" group="Writing">
        <SectionHeading label={t('settings.authoring.heading')} />
        <div className="space-y-6">
          <div className="space-y-2.5">
            <div>
              <p className="text-[0.625rem] uppercase tracking-[0.14em] text-muted-foreground">
                {t('settings.authoring.selectionTransforms')}{enabledTransformCount > 0 ? ` · ${enabledTransformCount} ${t('settings.authoring.active')}` : ''}
              </p>
              <p className="text-[0.6875rem] text-muted-foreground mt-0.5 leading-snug">
                {t('settings.authoring.selectionTransformsDescription')}
              </p>
            </div>
            <SettingsCard>
              <SettingRow label={t('settings.authoring.surroundingContext')} description={t('settings.authoring.surroundingContextDescription')}>
                <SegmentedControl
                  value={transformContext}
                  options={[
                    { value: 'tight' as TransformContext, label: t('settings.authoring.contextNearby') },
                    { value: 'wide' as TransformContext, label: t('settings.authoring.contextWider') },
                    { value: 'passage' as TransformContext, label: t('settings.authoring.contextWholePassage') },
                  ]}
                  onChange={setTransformContext}
                />
              </SettingRow>
            </SettingsCard>
            <CustomTransformsControls />
          </div>

          <div className="space-y-2.5">
            <div>
              <p className="text-[0.625rem] uppercase tracking-[0.14em] text-muted-foreground">{t('settings.authoring.guidedModePrompts')}</p>
              <p className="text-[0.6875rem] text-muted-foreground mt-0.5 leading-snug">
                {t('settings.authoring.guidedModePromptsDescription')}
              </p>
            </div>
            <GuidedPromptsControls story={story} onUpdate={(data) => updateMutation.mutate(data)} isPending={updateMutation.isPending} />
          </div>
        </div>
      </SettingsSection>

      {/* Remote access (auth + LAN + tunnel) */}
      <SettingsSection id="set-remote" label="Remote" group="System">
        <SharingPanel />
      </SettingsSection>

      {/* ErrataNet (pack hub: enable + API endpoint) */}
      <SettingsSection id="set-erratanet" label="ErrataNet" group="System">
        <ErrataNetSection />
      </SettingsSection>

      {/* Updates */}
      {hasDesktopBridge && (
        <SettingsSection id="set-updates" label="Updates" group="System">
          <DesktopUpdatesControls />
        </SettingsSection>
      )}

      {/* Plugins */}
      <SettingsSection id="set-plugins" label="Plugins" group="System">
        <SectionHeading label={t('settings.plugins.heading')} helpTopic="settings#plugins" className="mb-3" />
        {plugins && plugins.length > 0 ? (
          <div className="space-y-2">
            {plugins.map((plugin) => {
              const isEnabled = story.settings.enabledPlugins.includes(plugin.name)
              const isSidebarVisible = (pluginSidebarVisibility?.[plugin.name]) ?? (plugin.panel?.showInSidebar !== false)
              return (
                <div
                  key={plugin.name}
                  className={`rounded-lg border transition-colors ${isEnabled
                      ? 'border-border/60 bg-accent/20'
                      : 'border-border/30 bg-transparent'
                    }`}
                >
                  {/* Main row: toggle + info */}
                  <div className="flex items-start gap-3 px-3 py-2.5">
                    <button
                      onClick={() => togglePlugin(plugin.name)}
                      disabled={updateMutation.isPending}
                      className={`mt-0.5 relative shrink-0 h-[18px] w-[32px] rounded-full transition-colors ${isEnabled
                          ? 'bg-foreground'
                          : 'bg-muted-foreground/20'
                        }`}
                      aria-label={`${isEnabled ? t('settings.plugins.disable') : t('settings.plugins.enable')} ${plugin.name}`}
                    >
                      <span
                        className={`absolute top-[2px] h-[14px] w-[14px] rounded-full bg-background transition-[left] duration-150 ${isEnabled ? 'left-[16px]' : 'left-[2px]'
                          }`}
                      />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.8125rem] font-medium leading-tight text-foreground/85">{plugin.name}</p>
                      <p className="text-[0.6875rem] text-muted-foreground mt-0.5 leading-snug">{plugin.description}</p>
                    </div>
                    <span className={`text-[0.5625rem] uppercase tracking-widest mt-1 shrink-0 ${isEnabled ? 'text-foreground/50' : 'text-muted-foreground'
                      }`}>
                      v{plugin.version}
                    </span>
                  </div>

                  {/* Panel actions — only when enabled and has a panel */}
                  {isEnabled && plugin.panel && (
                    <div className="flex items-center gap-1 px-3 pb-2.5 pt-0">
                      {onOpenPluginPanel && (
                        <button
                          onClick={() => onOpenPluginPanel(plugin.name)}
                          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[0.6875rem] text-muted-foreground hover:text-foreground/70 hover:bg-accent/40 transition-colors"
                        >
                          <ExternalLink className="size-3" />
                          {t('settings.plugins.openPanel')}
                        </button>
                      )}
                      {onTogglePluginSidebar && (
                        <button
                          onClick={() => onTogglePluginSidebar(plugin.name, !isSidebarVisible)}
                          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[0.6875rem] text-muted-foreground hover:text-foreground/70 hover:bg-accent/40 transition-colors"
                        >
                          {isSidebarVisible ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
                          {isSidebarVisible ? t('settings.plugins.visibleInSidebar') : t('settings.plugins.hiddenFromSidebar')}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center py-6 text-center">
            <Puzzle className="size-5 text-muted-foreground mb-2" />
            <p className="text-[0.6875rem] text-muted-foreground">{t('settings.plugins.noneAvailable')}</p>
          </div>
        )}
      </SettingsSection>

      {/* About: version, links (docs, Discord, GitHub, releases), attribution + desktop updates */}
      <SettingsSection id="set-about" label="About" group="System">
        <AboutSection />
      </SettingsSection>
    </div>
  )
}