import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { SharingStatusResponse } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import { copyText } from '@/lib/clipboard'
import { Lock, Wifi, Globe, Loader2, Copy, Check, AlertTriangle, ShieldCheck } from 'lucide-react'
import { Toggle } from './primitives'
import { useLanguage } from '@/lib/i18n'

const inputClass = 'h-[28px] w-full rounded-md border border-border/40 bg-background px-2 text-[0.75rem] text-foreground focus:border-foreground/20 focus:outline-none'

function CopyButton({ value }: { value: string }) {
  const { t } = useLanguage()
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={async () => {
        if (!await copyText(value)) return
        setCopied(true)
        setTimeout(() => setCopied(false), 1200)
      }}
      className="grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
      title={t('settings.remote.copy')}
      aria-label={t('settings.remote.copyLink')}
    >
      {copied ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
    </button>
  )
}

function ConnectionCard({ icon, label, url, qr }: { icon: React.ReactNode; label: string; url: string; qr: string | null }) {
  return (
    <div className="space-y-2 rounded-md border border-border/30 bg-card/30 p-3">
      <div className="flex items-center gap-2">
        <span className="text-primary/70">{icon}</span>
        <span className="min-w-0 flex-1 truncate font-mono text-[0.6875rem] text-foreground/80">{url}</span>
        <CopyButton value={url} />
      </div>
      {qr && (
        <div className="flex justify-center pt-1">
          <img src={qr} alt={`${label} QR code`} className="size-40 rounded-md bg-white p-1.5" />
        </div>
      )}
    </div>
  )
}

export function SharingPanel() {
  const qc = useQueryClient()
  const { t } = useLanguage()
  const { data: status } = useQuery({
    queryKey: ['sharing-status'],
    queryFn: () => api.sharing.getStatus(),
    refetchInterval: (q) => {
      const s = q.state.data as SharingStatusResponse | undefined
      return s && (s.tunnel.status === 'downloading' || s.tunnel.status === 'starting') ? 1500 : false
    },
  })

  const [username, setUsername] = useState('errata')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const onSettled = (next: SharingStatusResponse) => { qc.setQueryData(['sharing-status'], next); setError(null) }
  const onError = (e: unknown) => setError(e instanceof Error ? e.message : t('settings.remote.requestFailed'))

  const authMut = useMutation({
    mutationFn: (data: { enabled: boolean; username?: string; password?: string }) => api.sharing.setAuth(data),
    onSuccess: (d) => { onSettled(d); setPassword('') },
    onError,
  })
  const lanMut = useMutation({ mutationFn: (en: boolean) => api.sharing.setLan(en), onSuccess: onSettled, onError })
  const tunnelMut = useMutation({ mutationFn: (en: boolean) => api.sharing.setTunnel(en), onSuccess: onSettled, onError })

  const authOn = status?.authEnabled ?? false
  const canExpose = authOn && (status?.hasPassword ?? false)
  const busy = authMut.isPending || lanMut.isPending || tunnelMut.isPending

  const tunnelStatusLabel = (() => {
    switch (status?.tunnel.status) {
      case 'downloading': return t('settings.remote.downloadingCloudflared')
      case 'starting': return t('settings.remote.startingTunnel')
      case 'running': return null
      case 'error': return status.tunnel.error || t('settings.remote.tunnelError')
      default: return null
    }
  })()

  return (
    <div>
<label className="mb-2 block text-[0.625rem] uppercase tracking-wider text-muted-foreground">{t('settings.remote.heading')}</label>
      <div className="space-y-3 rounded-lg border border-border/30 p-3">
        {/* Authentication */}
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <Lock className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-[0.75rem] font-medium text-foreground/80">{t('settings.remote.requirePassword')}</p>
              <p className="text-[0.625rem] leading-snug text-muted-foreground">
                {t('settings.remote.requirePasswordDescription')}
              </p>
            </div>
            {authOn && (
              <button
                onClick={() => authMut.mutate({ enabled: false })}
                disabled={busy}
                className="shrink-0 rounded-md border border-border/40 px-2 py-1 text-[0.625rem] text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive disabled:opacity-40"
              >
                {t('settings.remote.disable')}
              </button>
            )}
          </div>

          {authOn ? (
            <div className="flex items-center gap-1.5 pl-6 text-[0.6875rem] text-primary">
              <ShieldCheck className="size-3.5" />
              <span>{t('settings.remote.onUser')} <span className="font-mono">{status?.username}</span></span>
            </div>
          ) : (
            <div className="space-y-1.5 pl-6">
              <input className={inputClass} value={username} onChange={(e) => setUsername(e.target.value)} placeholder={t('settings.remote.username')} autoComplete="off" />
              <input className={inputClass} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('settings.remote.password')} autoComplete="new-password" />
              <button
                onClick={() => { if (!password.trim()) { setError(t('settings.remote.enterPassword')); return } authMut.mutate({ enabled: true, username: username.trim() || 'errata', password }) }}
                disabled={busy || !password.trim()}
                className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-2.5 py-1 text-[0.6875rem] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {authMut.isPending ? <Loader2 className="size-3 animate-spin" /> : <Lock className="size-3" />}
                {t('settings.remote.enable')}
              </button>
            </div>
          )}
        </div>

        <div className="h-px bg-border/20" />

        {/* Local network */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Wifi className="size-3.5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-[0.75rem] font-medium text-foreground/80">{t('settings.remote.localNetwork')}</p>
              <p className="text-[0.625rem] leading-snug text-muted-foreground">{t('settings.remote.localNetworkDescription')}</p>
            </div>
            <Toggle checked={status?.lan.enabled ?? false} disabled={!canExpose || busy} onChange={(next) => lanMut.mutate(next)} label={t('settings.remote.toggleLocalNetwork')} />
          </div>
          {status?.lan.enabled && status.lan.url && (
            <ConnectionCard icon={<Wifi className="size-3.5" />} label="LAN" url={status.lan.url} qr={status.lanQr} />
          )}
        </div>

        <div className="h-px bg-border/20" />

        {/* Internet tunnel */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Globe className="size-3.5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-[0.75rem] font-medium text-foreground/80">{t('settings.remote.internetTunnel')}</p>
              <p className="text-[0.625rem] leading-snug text-muted-foreground">{t('settings.remote.internetTunnelDescription')}</p>
            </div>
            <Toggle checked={status?.tunnel.enabled ?? false} disabled={!canExpose || busy} onChange={(next) => tunnelMut.mutate(next)} label={t('settings.remote.toggleTunnel')} />
          </div>
          {status?.tunnel.enabled && tunnelStatusLabel && (
            <div className={cn('flex items-center gap-1.5 pl-6 text-[0.6875rem]', status.tunnel.status === 'error' ? 'text-destructive' : 'text-muted-foreground')}>
              {status.tunnel.status === 'error' ? <AlertTriangle className="size-3.5" /> : <Loader2 className="size-3.5 animate-spin" />}
              {tunnelStatusLabel}
            </div>
          )}
          {status?.tunnel.status === 'running' && status.tunnel.url && (
            <ConnectionCard icon={<Globe className="size-3.5" />} label="Tunnel" url={status.tunnel.url} qr={status.tunnelQr} />
          )}
        </div>

        {!canExpose && (
          <p className="text-[0.625rem] leading-snug text-muted-foreground">{t('settings.remote.setPasswordToShare')}</p>
        )}
        {canExpose && (status?.lan.enabled) && (
          <p className="flex items-start gap-1.5 text-[0.625rem] leading-snug text-muted-foreground">
            <AlertTriangle className="mt-px size-3 shrink-0 text-amber-500/70" />
            {t('settings.remote.httpWarning')}
          </p>
        )}
        {error && <p className="text-[0.625rem] text-destructive">{error}</p>}
      </div>
    </div>
  )
}