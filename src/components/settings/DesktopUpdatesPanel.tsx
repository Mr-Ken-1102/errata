/**
 * Desktop-only Updates controls. Renders nothing in the browser build. Inside the Electron
 * shell it drives electron-updater: a manual check, confirm-to-download (or skip), download
 * progress, and restart-to-install. Updates are never checked, downloaded, or installed until
 * the user asks. Stories are backed up before any update is applied. Update state is pushed
 * from the main process (see desktop/updater.ts) via the preload bridge.
 *
 * No em dashes in copy, per project convention.
 */
import { useEffect, useState } from 'react'
import { RefreshCw, Download } from 'lucide-react'
import { getDesktopBridge, onDesktopBridgeReady, type DesktopUpdateState, type ErrataDesktop } from '@/lib/desktop'
import { useLanguage, type TranslationKey } from '@/lib/i18n'
import { SectionHeading, SettingsCard, SettingRow } from './primitives'

const primaryBtn =
  'flex items-center gap-1.5 rounded-md bg-foreground px-2.5 py-1 text-[0.6875rem] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40'
const ghostBtn =
  'flex items-center gap-1.5 rounded-md px-2 py-1 text-[0.6875rem] text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground/70 disabled:opacity-40'

type Translate = (key: TranslationKey) => string

function interpolate(message: string, values: Record<string, string | number>): string {
  let result = message
  for (const [key, value] of Object.entries(values)) {
    result = result.replace(`{${key}}`, String(value))
  }
  return result
}

function statusText(state: DesktopUpdateState, t: Translate): string {
  switch (state.status) {
    case 'checking':
      return t('settings.updates.status.checking')
    case 'available':
      return interpolate(t('settings.updates.status.available'), { version: state.version ?? '' })
    case 'downloading':
      return interpolate(t('settings.updates.status.downloading'), {
        version: state.version ?? t('settings.updates.updateNoun'),
        percent: state.percent ?? 0,
      })
    case 'downloaded':
      return interpolate(t('settings.updates.status.downloaded'), { version: state.version ?? '' })
    case 'skipped':
      return interpolate(t('settings.updates.status.skipped'), { version: state.version ?? '' })
    case 'not-available':
      return t('settings.updates.status.latest')
    case 'error':
      return interpolate(t('settings.updates.status.error'), {
        error: state.error ?? t('settings.updates.unknownError'),
      })
    default:
      return t('settings.updates.status.idle')
  }
}

function nextVersionText(state: DesktopUpdateState, t: Translate): string {
  if (state.version) return `v${state.version}`
  if (state.status === 'checking') return t('settings.updates.next.checking')
  if (state.status === 'not-available') return t('settings.updates.next.none')
  return t('settings.updates.next.checkToLoad')
}

function changelogText(state: DesktopUpdateState, t: Translate): string {
  if (state.releaseNotes) return state.releaseNotes
  if (state.status === 'available' || state.status === 'downloaded' || state.status === 'skipped') {
    return t('settings.updates.changelog.none')
  }
  if (state.status === 'checking') return t('settings.updates.changelog.checking')
  return t('settings.updates.changelog.idle')
}

function releaseMetaText(state: DesktopUpdateState): string | undefined {
  const parts = [
    state.releaseName,
    state.releaseDate ? new Date(state.releaseDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : undefined,
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(' / ') : undefined
}

export function DesktopUpdatesControls() {
  const { t } = useLanguage()
  const [bridge, setBridge] = useState<ErrataDesktop | null>(() => getDesktopBridge())
  const [currentVersion, setCurrentVersion] = useState(__APP_VERSION__)
  const [state, setState] = useState<DesktopUpdateState>({ status: 'idle' })
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let unsubscribeUpdates: (() => void) | undefined
    const stopWaiting = onDesktopBridgeReady((currentBridge) => {
      setBridge(currentBridge)
      currentBridge.getVersion().then(setCurrentVersion).catch(() => {})
      currentBridge.getUpdateState().then(setState).catch(() => {})
      unsubscribeUpdates = currentBridge.onUpdateState(setState)
    })
    return () => {
      stopWaiting()
      unsubscribeUpdates?.()
    }
  }, [])

  if (!bridge) return null

  const check = async () => {
    setBusy(true)
    try {
      setState(await bridge.checkForUpdates())
    } finally {
      setBusy(false)
    }
  }

  const checking = busy || state.status === 'checking'
  const checkButton = (
    <button type="button" className={ghostBtn} onClick={check} disabled={checking}>
      <RefreshCw className={`size-3 ${checking ? 'animate-spin' : ''}`} />
      {t('settings.updates.checkForUpdates')}
    </button>
  )

  const actions = () => {
    switch (state.status) {
      case 'available':
        return (
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <button type="button" className={primaryBtn} onClick={() => bridge.downloadUpdate()}>
              <Download className="size-3" />
              {t('settings.updates.downloadAndInstall')}
            </button>
            <button type="button" className={ghostBtn} onClick={() => bridge.skipUpdate(state.version ?? '')}>
              {t('settings.updates.skip')}
            </button>
            {checkButton}
          </div>
        )
      case 'skipped':
        return (
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <button type="button" className={ghostBtn} onClick={() => bridge.downloadUpdate()}>
              <Download className="size-3" />
              {t('settings.updates.download')}
            </button>
            {checkButton}
          </div>
        )
      case 'downloaded':
        return (
          <button type="button" className={primaryBtn} onClick={() => bridge.installUpdate()}>
            <Download className="size-3" />
            {t('settings.updates.restartAndInstall')}
          </button>
        )
      case 'downloading':
      case 'checking':
        return null
      default:
        return checkButton
    }
  }

  return (
    <div>
      <SectionHeading label={t('settings.updates.heading')} />
      <SettingsCard>
        <SettingRow label={t('settings.updates.installedVersion')}>
          <span className="font-mono text-[0.6875rem] tabular-nums text-muted-foreground">v{currentVersion}</span>
        </SettingRow>
        <SettingRow label={t('settings.updates.nextVersion')} description={releaseMetaText(state)}>
          <span className="font-mono text-[0.6875rem] tabular-nums text-muted-foreground">{nextVersionText(state, t)}</span>
        </SettingRow>
        <SettingRow label={t('settings.updates.desktopUpdates')} description={statusText(state, t)}>
          {actions()}
        </SettingRow>
        <div className="px-3 py-2.5">
          <p className="text-[0.75rem] font-medium text-foreground/80">{t('settings.updates.changelog')}</p>
          <pre className="mt-1.5 max-h-44 whitespace-pre-wrap overflow-y-auto rounded-md bg-accent/20 px-2.5 py-2 font-sans text-[0.6875rem] leading-relaxed text-muted-foreground">
            {changelogText(state, t)}
          </pre>
        </div>
      </SettingsCard>
      <p className="mt-1.5 px-3 text-[0.625rem] leading-snug text-muted-foreground">
        {t('settings.updates.backupNotice')}
      </p>
    </div>
  )
}
