import { useState, useRef, useCallback, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useActiveBranchId } from '@/lib/query-keys'
import { consumeRun } from '@/lib/api/runs'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles, Square, X } from 'lucide-react'
import { StreamMarkdown } from '@/components/ui/stream-markdown'
import { useLanguage } from '@/lib/i18n'

interface RefinementPanelProps {
  storyId: string
  fragmentId: string
  fragmentName: string
  onComplete?: () => void
  onClose: () => void
}

export function RefinementPanel({
  storyId,
  fragmentId,
  fragmentName,
  onComplete,
  onClose,
}: RefinementPanelProps) {
  const { t } = useLanguage()
  const queryClient = useQueryClient()
  const branchId = useActiveBranchId(storyId)
  const [instructions, setInstructions] = useState('')
  const [streamedText, setStreamedText] = useState('')
  const [isRefining, setIsRefining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const outputRef = useRef<HTMLDivElement>(null)
  const runIdRef = useRef<string | null>(null)
  const storyIdRef = useRef(storyId)
  const branchIdRef = useRef(branchId)
  storyIdRef.current = storyId
  branchIdRef.current = branchId
  const activeRef = useRef(false)
  const cancelRequestedRef = useRef(false)
  const mountedRef = useRef(true)

  // Closing this panel is an explicit user stop, not a network disconnect.
  // If the run-start event has not arrived yet, remember the intent and send
  // the cancellation as soon as the server-issued run id is observed.
  useEffect(() => () => {
    mountedRef.current = false
    if (!activeRef.current) return
    cancelRequestedRef.current = true
    const runId = runIdRef.current
    if (runId) {
      void api.runs.cancel(storyIdRef.current, runId, branchIdRef.current).catch(() => {})
    }
  }, [])

  const handleRefine = useCallback(async () => {
    if (activeRef.current || !branchId) return

    activeRef.current = true
    cancelRequestedRef.current = false
    runIdRef.current = null
    setIsRefining(true)
    setStreamedText('')
    setError(null)
    setDone(false)
    setCancelled(false)

    const refreshFragments = () => Promise.all([
      queryClient.invalidateQueries({ queryKey: ['fragments', storyId] }),
      queryClient.invalidateQueries({ queryKey: ['fragment', storyId] }),
    ])

    try {
      const stream = await api.librarian.refine(
        storyId,
        fragmentId,
        instructions.trim() || undefined,
        { branchId },
      )

      let accumulated = ''
      const result = await consumeRun(storyId, stream, (event) => {
        if (event.type === 'run-start') {
          runIdRef.current = event.runId
          if (cancelRequestedRef.current) {
            void api.runs.cancel(storyId, event.runId, branchId).catch(() => {})
          }
          return
        }

        if (event.type === 'text') {
          accumulated += event.text
          if (mountedRef.current) setStreamedText(accumulated)
        }

        if (mountedRef.current && outputRef.current) {
          outputRef.current.scrollTop = outputRef.current.scrollHeight
        }
      }, { branchId })

      // A cancelled write-enabled run may already have landed a tool call.
      await refreshFragments()
      if (!mountedRef.current) return

      if (result.status === 'cancelled') {
        setCancelled(true)
        return
      }
      if (result.status === 'error') {
        setError(result.error ?? t('refinement.failed'))
        return
      }

      setDone(true)
      onComplete?.()
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : t('refinement.failed'))
      }
    } finally {
      activeRef.current = false
      runIdRef.current = null
      cancelRequestedRef.current = false
      if (mountedRef.current) setIsRefining(false)
    }
  }, [instructions, storyId, branchId, fragmentId, queryClient, onComplete, t])

  const handleCancel = useCallback(() => {
    if (!activeRef.current) return
    cancelRequestedRef.current = true
    const runId = runIdRef.current
    if (runId) void api.runs.cancel(storyId, runId, branchId).catch(() => {})
  }, [storyId, branchId])

  return (
    <div className="border border-border/40 rounded-lg bg-card/30" data-component-id="refinement-root">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
        <div className="flex items-center gap-1.5 text-xs">
          <Sparkles className="size-3 text-primary/70" />
          <span className="font-medium">{t('refinement.title')}</span>
          <span className="text-muted-foreground truncate max-w-[150px]">{fragmentName}</span>
        </div>
        <Button size="icon" variant="ghost" className="size-5 text-muted-foreground" onClick={onClose} data-component-id="refinement-close">
          <X className="size-3" />
        </Button>
      </div>

      <div className="p-3 space-y-2">
        {/* Instructions input */}
        {!isRefining && !done && (
          <>
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder={t('refinement.placeholder')}
              className="min-h-[60px] resize-none text-xs bg-transparent placeholder:italic placeholder:text-muted-foreground"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !e.nativeEvent.isComposing) {
                  e.preventDefault()
                  handleRefine()
                }
              }}
              data-component-id="refinement-input"
            />
            <div className="flex items-center justify-between">
              <Button
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={handleRefine}
                disabled={!branchId}
                data-component-id="refinement-submit"
              >
                <Sparkles className="size-3" />
                {t('refinement.refine')}
              </Button>
              <span className="text-[0.625rem] text-muted-foreground">
                {t('refinement.shortcutHint')}
              </span>
            </div>
          </>
        )}

        {/* Streaming output */}
        {(isRefining || streamedText) && (
          <div ref={outputRef} className="max-h-[200px] overflow-auto">
            <div className="text-xs text-muted-foreground">
              <StreamMarkdown content={streamedText} streaming={isRefining} variant="prose" />
            </div>
          </div>
        )}

        {/* Stop button while refining */}
        {isRefining && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1.5"
            onClick={handleCancel}
            data-component-id="refinement-stop"
          >
            <Square className="size-3" />
            {t('refinement.cancel')}
          </Button>
        )}

        {/* Cancelled */}
        {cancelled && (
          <div className="text-xs text-muted-foreground" data-component-id="refinement-cancelled">
            {t('refinement.stopped')}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-xs text-destructive bg-destructive/5 rounded-md p-2">
            {error}
          </div>
        )}

        {/* Done state */}
        {done && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-primary/70">{t('refinement.updated')}</span>
            <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={onClose} data-component-id="refinement-done">
              {t('refinement.close')}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
