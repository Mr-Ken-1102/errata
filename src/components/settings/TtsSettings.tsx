import { useState } from 'react'
import { Volume2, Download, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n'
import {
  useTtsSettings,
  useBrowserVoices,
  isBrowserTtsSupported,
  SUPERTONIC_VOICES,
  playFragment,
  preloadNeural,
  stopTts,
  type TtsEngine,
} from '@/lib/tts'
import {
  SettingRow,
  Toggle,
  SegmentedControl,
  Slider,
  SettingsSelect,
} from './primitives'

const SAMPLE = 'And here he stands, the one they call the Knight of the Sorrowful Countenance, the once and future king'

function BrowserVoiceRow({ voiceURI, onChange, disabled }: { voiceURI: string | null; onChange: (uri: string | null) => void; disabled?: boolean }) {
  const voices = useBrowserVoices()
  const { t } = useLanguage()
  return (
    <SettingRow
      label={t('settings.tts.voice')}
      description={isBrowserTtsSupported()
        ? t('settings.tts.browserVoiceDescription')
        : t('settings.tts.noBrowserVoiceDescription')}
      disabled={disabled}
    >
      <SettingsSelect className="max-w-[11rem]" value={voiceURI ?? ''} onChange={(v) => onChange(v || null)} disabled={disabled || !isBrowserTtsSupported()}>
        <option value="">{t('settings.tts.defaultVoice')}</option>
        {voices.map((v) => (
          <option key={v.voiceURI} value={v.voiceURI}>{v.name}{v.lang ? ` (${v.lang})` : ''}</option>
        ))}
      </SettingsSelect>
    </SettingRow>
  )
}

export function TtsSettings() {
  const [s, set] = useTtsSettings()
  const [preload, setPreload] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const { t } = useLanguage()

  const handlePreload = async () => {
    setPreload('loading')
    try {
      await preloadNeural(s)
      setPreload('ready')
    } catch {
      setPreload('error')
    }
  }

  const disabled = !s.enabled

  return (
    <div>
      <label className="mb-2 block text-[0.625rem] uppercase tracking-wider text-muted-foreground">{t('settings.tts.heading')}</label>
      <div className="divide-y divide-border/20 rounded-lg border border-border/30">
        <SettingRow label={t('settings.tts.enable')} description={t('settings.tts.enableDescription')}>
          <Toggle checked={s.enabled} onChange={(next) => { if (!next) stopTts(); set({ enabled: next }) }} label={t('settings.tts.toggle')} />
        </SettingRow>

        <SettingRow label={t('settings.tts.engine')} description={t('settings.tts.engineDescription')} disabled={disabled}>
          <SegmentedControl<TtsEngine>
            value={s.engine}
            options={[
              { value: 'browser', label: t('settings.tts.browser') },
              { value: 'supertonic', label: t('settings.tts.supertonic') },
            ]}
            onChange={(v) => { stopTts(); set({ engine: v }) }}
            disabled={disabled}
          />
        </SettingRow>

        {s.engine === 'browser' ? (
          <BrowserVoiceRow voiceURI={s.browserVoiceURI} onChange={(uri) => set({ browserVoiceURI: uri })} disabled={disabled} />
        ) : (
          <>
            <SettingRow label={t('settings.tts.voice')} description={t('settings.tts.supertonicVoiceDescription')} disabled={disabled}>
              <SettingsSelect className="max-w-[11rem]" value={s.supertonicVoiceId} onChange={(v) => { stopTts(); set({ supertonicVoiceId: v }) }} disabled={disabled}>
                {SUPERTONIC_VOICES.map((v) => (
                  <option key={v.id} value={v.id}>{v.label}</option>
                ))}
              </SettingsSelect>
            </SettingRow>
            <SettingRow label={t('settings.tts.model')} description={t('settings.tts.modelDescription')} disabled={disabled}>
              {preload === 'loading' ? (
                <span className="inline-flex items-center gap-1.5 font-mono text-[0.625rem] text-muted-foreground"><Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" />{t('settings.tts.loading')}</span>
              ) : preload === 'ready' ? (
                <span className="inline-flex items-center gap-1 text-[0.6875rem] text-primary"><Check className="size-3.5" />{t('settings.tts.ready')}</span>
              ) : (
                <button onClick={handlePreload} disabled={disabled} className="inline-flex items-center gap-1.5 rounded-md border border-border/40 px-2.5 py-1 text-[0.6875rem] text-foreground/80 transition-colors hover:border-primary/30 hover:bg-primary/[0.04] disabled:opacity-40">
                  <Download className="size-3.5" />{t('settings.tts.preload')}
                </button>
              )}
            </SettingRow>
            <Slider label={t('settings.tts.quality')} value={s.steps} min={1} max={20} step={1} onChange={(v) => set({ steps: v })} format={(v) => `${v} ${t('settings.tts.steps')}`} disabled={disabled} />
          </>
        )}

        <Slider label={t('settings.tts.speed')} value={s.rate} min={0.5} max={2} step={0.05} onChange={(v) => set({ rate: v })} format={(v) => `${v.toFixed(2)}×`} disabled={disabled} />
        <Slider label={t('settings.tts.pitch')} value={s.pitch} min={0.5} max={2} step={0.05} onChange={(v) => set({ pitch: v })} format={(v) => `${v.toFixed(2)}×`} disabled={disabled} />
        <Slider label={t('settings.tts.volume')} value={s.volume} min={0} max={1} step={0.05} onChange={(v) => set({ volume: v })} format={(v) => `${Math.round(v * 100)}%`} disabled={disabled} />

        <div className={cn('px-3 py-2.5', disabled && 'pointer-events-none opacity-40')}>
          <button
            onClick={() => playFragment('__tts_test__', SAMPLE, t('settings.tts.testVoice'), s)}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 rounded-md border border-border/40 px-2.5 py-1 text-[0.6875rem] text-foreground/80 transition-colors hover:border-primary/30 hover:bg-primary/[0.04] disabled:opacity-40"
          >
            <Volume2 className="size-3.5" />{t('settings.tts.testVoice')}
          </button>
        </div>
      </div>
    </div>
  )
}
