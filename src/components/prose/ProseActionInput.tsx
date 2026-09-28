import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { startAndConsumeRun } from '@/lib/api/runs'
import { invalidateStoryContent } from '@/lib/branch-cache'
import { useActiveBranchId } from '@/lib/query-keys'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useLanguage } from '@/lib/i18n'

interface ProseActionInputProps {
  storyId: string
  fragmentId: string
  mode: 'regenerate' | 'refine'
  onComplete: () => void
  onCancel: () => void
  onStreamStart: () => void
  onStream: (text: string) => void
}

export function ProseActionInput({
  storyId,
  fragmentId,
  mode,
  onComplete,
  onCancel,
  onStreamStart,
  onStream,
}: ProseActionInputProps) {
  const { t } = useLanguage()
  const queryClient = useQueryClient()
  const branchId = useActiveBranchId(storyId)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || isLoading || branchId === undefined) return

    setIsLoading(true)
    setError(null)
    onStreamStart()

    try {
      let accumulated = ''
      let rejection: string | null = null
      const result = await startAndConsumeRun(
        storyId,
        (clientRequestId) => {
          const opts = { clientRequestId, ...(branchId ? { branchId } : {}) }
          return mode === 'regenerate'
            ? api.generation.regenerate(storyId, fragmentId, input, undefined, opts)
            : api.generation.refine(storyId, fragmentId, input, undefined, opts)
        },
        (event) => {
          if (event.type === 'text') {
            accumulated += event.text
            onStream(accumulated)
          } else if (event.type === 'generation-rejected') {
            rejection = event.reason
          }
        },
        { branchId },
      )

      if (rejection) {
        setError(rejection)
        return
      }
      if (result.status === 'error') {
        setError(result.error ?? t('proseAction.operationFailed'))
        return
      }
      if (result.status === 'cancelled') return

      await invalidateStoryContent(queryClient, storyId)
      onComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('proseAction.operationFailed'))
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, storyId, branchId, fragmentId, mode, queryClient, onComplete, onStreamStart, onStream, t])

  const placeholder = mode === 'regenerate'
    ? t('proseAction.regeneratePlaceholder')
    : t('proseAction.refinePlaceholder')

  return (
    <div className="mt-3 rounded-lg border border-primary/15 bg-card/30 p-4" data-component-id="prose-action-root">
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={placeholder}
        className="min-h-[56px] max-h-[120px] resize-none text-sm bg-transparent border-border/40 placeholder:italic placeholder:text-muted-foreground"
        disabled={isLoading}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            onCancel()
          }
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !e.nativeEvent.isComposing) {
            e.preventDefault()
            handleSubmit()
          }
        }}
        data-component-id="prose-action-input"
      />
      {error && (
        <p className="text-sm text-destructive mt-2">{error}</p>
      )}
      <div className="flex items-center justify-between mt-2.5">
        <span className="text-[0.625rem] text-muted-foreground">
          {t('proseAction.shortcutHint')}
        </span>
        <div className="flex gap-1.5">
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onCancel} disabled={isLoading} data-component-id="prose-action-cancel">
            {t('proseAction.cancel')}
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit} disabled={!input.trim() || isLoading || branchId === undefined} data-component-id="prose-action-submit">
            {isLoading
              ? (mode === 'regenerate' ? t('proseAction.regenerating') : t('proseAction.refining'))
              : (mode === 'regenerate' ? t('proseAction.regenerate') : t('proseAction.refine'))
            }
          </Button>
        </div>
      </div>
    </div>
  )
}
