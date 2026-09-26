/**
 * In-app update prompt for the Electron shell. A quiet, dismissible card (top-right, never a
 * modal over the writing surface) that appears when an update needs a decision or is ready to
 * install. Renders nothing in the browser build. Full controls live in Settings > Updates.
 *
 * No em dashes in copy, per project convention.
 */
import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'
import { getDesktopBridge, onDesktopBridgeReady, type DesktopUpdateState, type ErrataDesktop } from '@/lib/desktop'
import { useLanguage } from '@/lib/i18n'

const primaryBtn =
  'flex items-center gap-1.5 rounded-md bg-foreground px-2.5 py-1 text-[0.6875rem] font-medium text-background transition-opacity hover:opacity-90'
const ghostBtn =
  'rounded-md px-2 py-1 text-[0.6875rem] text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground/70'

function interpolate(message: string, values: Record<string, string | number>): string {
  let result = message
  for (const [key, value] of Object.entries(values)) {
    result = result.replace(`{${key}}`, String(value))
  }
  return result
}

export function DesktopUpdateBanner() {
  const { t } = useLanguage()
  const [bridge, setBridge] = useState<ErrataDesktop | null>(() => getDesktopBridge())
  const [state, setState] = useState<DesktopUpdateState>({ status: 'idle' })
  const [dismissedKey, setDismissedKey] = useState<string | null>(null)

  useEffect(() => {
    let unsubscribeUpdates: (() => void) | undefined
    const stopWaiting = onDesktopBridgeReady((currentBridge) => {
      setBridge(currentBridge)
      currentBridge.getUpdateState().then(setState).catch(() => {})
      unsubscribeUpdates = currentBridge.onUpdateState(setState)
    })
    return () => {
      stopWaiting()
      unsubscribeUpdates?.()
    }
  }, [])

  if (!bridge) return null

  // Only prompt for states that need attention.
  const visibleStatus =
    state.status === 'available' || state.status === 'downloading' || state.status === 'downloaded'
  const key = `${state.status}:${state.version ?? ''}`
  if (!visibleStatus || dismissedKey === key) return null

  const title =
    state.status === 'downloaded'
      ? interpolate(t('desktopUpdateBanner.title.downloaded'), { version: state.version ?? '' })
      : state.status === 'downloading'
        ? interpolate(t('desktopUpdateBanner.title.downloading'), { version: state.version ?? '' })
        : interpolate(t('desktopUpdateBanner.title.available'), { version: state.version ?? '' })

  const subtitle =
    state.status === 'downloading'
      ? interpolate(t('desktopUpdateBanner.subtitle.downloading'), { percent: state.percent ?? 0 })
      : state.status === 'downloaded'
        ? t('desktopUpdateBanner.subtitle.downloaded')
        : t('desktopUpdateBanner.subtitle.available')

  return (
    <div className="fixed right-3 top-3 z-50 w-[20rem] max-w-[calc(100vw-1.5rem)] rounded-lg border border-border/40 bg-background/95 px-3 py-2.5 shadow-lg backdrop-blur">
      <div className="flex items-start justify-between gap-2">
        <p className="font-display text-[0.9375rem] italic leading-tight text-foreground">{title}</p>
        <button
          type="button"
          aria-label={t('desktopUpdateBanner.dismiss')}
          onClick={() => setDismissedKey(key)}
          className="-mr-1 -mt-0.5 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground/70"
        >
          <X className="size-3.5" />
        </button>
      </div>
      <p className="mt-1 text-[0.6875rem] leading-snug text-muted-foreground">{subtitle}</p>

      {state.status !== 'downloading' && (
        <div className="mt-2 flex items-center gap-1.5">
          {state.status === 'downloaded' ? (
            <button type="button" className={primaryBtn} onClick={() => bridge.installUpdate()}>
              <Download className="size-3" />
              {t('settings.updates.restartAndInstall')}
            </button>
          ) : (
            <>
              <button type="button" className={primaryBtn} onClick={() => bridge.downloadUpdate()}>
                <Download className="size-3" />
                {t('settings.updates.downloadAndInstall')}
              </button>
              <button
                type="button"
                className={ghostBtn}
                onClick={() => bridge.skipUpdate(state.version ?? '')}
              >
                {t('settings.updates.skip')}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}