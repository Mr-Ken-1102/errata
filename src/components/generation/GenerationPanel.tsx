import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { invalidateStoryContent } from '@/lib/branch-cache'
import { useActiveBranchId } from '@/lib/query-keys'
import { useRunStream } from '@/hooks/use-run-stream'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { StreamMarkdown } from '@/components/ui/stream-markdown'
import {
  Panel,
  PanelActions,
  PanelHeader,
  PanelHeaderText,
  PanelTitle,
} from '@/components/ui/panel'
import { DebugPanel } from './DebugPanel'
import { QuestionCard } from './QuestionCard'
import { PovSelect } from './PovSelect'
import { Send, Eye, Square, Bug, ArrowLeft } from 'lucide-react'
import type { ChatEvent, ClarifyQuestion, Clarification, RunStatus } from '@/lib/api/types'
import { useLanguage } from '@/lib/i18n'

interface GenerationPanelProps {
  storyId: string
  onBack?: () => void
}

interface GenerationContext {
  input: string
  saveResult: boolean
  clarifications: Clarification[]
  round: number
  pendingQuestions?: ClarifyQuestion[]
}

const FORCE_PROCEED_ROUND = 99
const SURFACE_ID = 'generation-panel'

function readStoredContext(key: string): GenerationContext | null {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<GenerationContext>
    if (typeof parsed.input !== 'string' || typeof parsed.saveResult !== 'boolean') return null
    return {
      input: parsed.input,
      saveResult: parsed.saveResult,
      clarifications: Array.isArray(parsed.clarifications) ? parsed.clarifications : [],
      round: typeof parsed.round === 'number' ? parsed.round : 0,
      ...(Array.isArray(parsed.pendingQuestions)
        ? { pendingQuestions: parsed.pendingQuestions as ClarifyQuestion[] }
        : {}),
    }
  } catch {
    return null
  }
}

export function GenerationPanel({ storyId, onBack }: GenerationPanelProps) {
  const { t } = useLanguage()
  const queryClient = useQueryClient()
  const branchId = useActiveBranchId(storyId)
  const [input, setInput] = useState('')
  const [streamedText, setStreamedText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showDebug, setShowDebug] = useState(false)
  const [pendingQuestions, setPendingQuestions] = useState<ClarifyQuestion[] | null>(null)
  const outputRef = useRef<HTMLDivElement>(null)

  const accumulatedRef = useRef('')
  const askedRef = useRef<ClarifyQuestion[] | null>(null)
  const rejectionRef = useRef<string | null>(null)
  const rafScheduledRef = useRef(false)
  const genCtxRef = useRef<GenerationContext>({
    input: '',
    saveResult: true,
    clarifications: [],
    round: 0,
  })

  const contextStorageKey = useMemo(
    () => `errata:generation:context:${storyId}:${branchId ?? ''}:${SURFACE_ID}`,
    [branchId, storyId],
  )

  const persistContext = useCallback((context: GenerationContext | null) => {
    try {
      if (context) sessionStorage.setItem(contextStorageKey, JSON.stringify(context))
      else sessionStorage.removeItem(contextStorageKey)
    } catch {
      // Session persistence is recovery-only; never block generation on it.
    }
  }, [contextStorageKey])

  // Load the round context before useRunStream's attach effect runs. A retained
  // run can then replay from seq 0 and still know how to continue clarification.
  useEffect(() => {
    genCtxRef.current = {
      input: '',
      saveResult: true,
      clarifications: [],
      round: 0,
    }
    accumulatedRef.current = ''
    askedRef.current = null
    rejectionRef.current = null
    setInput('')
    setStreamedText('')
    setPendingQuestions(null)
    setError(null)

    const stored = readStoredContext(contextStorageKey)
    if (!stored) return
    genCtxRef.current = stored
    setInput(stored.input)
    if (stored.pendingQuestions?.length) {
      setPendingQuestions(stored.pendingQuestions)
    }
  }, [contextStorageKey])

  const handleEvent = useCallback((event: ChatEvent) => {
    if (event.type === 'run-start') {
      accumulatedRef.current = ''
      askedRef.current = null
      rejectionRef.current = null
      setStreamedText('')
      setPendingQuestions(null)
      setError(null)
      return
    }

    if (event.type === 'text') {
      accumulatedRef.current += event.text
      if (!rafScheduledRef.current) {
        rafScheduledRef.current = true
        requestAnimationFrame(() => {
          setStreamedText(accumulatedRef.current)
          if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight
          }
          rafScheduledRef.current = false
        })
      }
      return
    }

    if (event.type === 'clarify-questions') {
      askedRef.current = event.questions
      const nextContext = {
        ...genCtxRef.current,
        pendingQuestions: event.questions,
      }
      genCtxRef.current = nextContext
      persistContext(nextContext)
      return
    }

    if (event.type === 'generation-rejected') {
      rejectionRef.current = event.reason
      return
    }

    if (event.type === 'error') {
      setError(event.error)
    }
  }, [persistContext])

  const handleSettled = useCallback(async (status: RunStatus, message?: string) => {
    setStreamedText(accumulatedRef.current)

    if (askedRef.current) {
      setPendingQuestions(askedRef.current)
      if (message) setError(message)
      return
    }

    if (rejectionRef.current) {
      setError(rejectionRef.current)
      persistContext(null)
      return
    }

    if (status === 'error') {
      setError(message ?? t('generationPanel.failed'))
      persistContext(null)
      return
    }

    if (status === 'cancelled') {
      setPendingQuestions(null)
      persistContext(null)
      return
    }

    // A completed save may have changed fragments/prose-chain. Invalidating for
    // previews too is harmless and makes retained-run recovery deterministic.
    await invalidateStoryContent(queryClient, storyId)

    if (genCtxRef.current.saveResult) {
      setInput('')
    }
    persistContext(null)
  }, [persistContext, queryClient, storyId, t])

  const run = useRunStream({
    storyId,
    branchId,
    kind: 'generation',
    scopeId: SURFACE_ID,
    onEvent: handleEvent,
    onSettled: handleSettled,
    recoverFullRunOnAttach: true,
  })
  const isGenerating = run.isStreaming

  const runGeneration = useCallback(async (
    genInput: string,
    saveResult: boolean,
    clarifications: Clarification[],
    round: number,
  ) => {
    if (!genInput.trim() || isGenerating || branchId === undefined) return

    setError(null)
    setPendingQuestions(null)
    if (round === 0) setStreamedText('')
    accumulatedRef.current = ''
    askedRef.current = null
    rejectionRef.current = null

    const context: GenerationContext = {
      input: genInput,
      saveResult,
      clarifications,
      round,
      pendingQuestions: undefined,
    }
    genCtxRef.current = context
    persistContext(context)

    try {
      await run.start((clientRequestId) => {
        const opts = {
          clarifications,
          clarifyRound: round,
          clientRequestId,
          scopeId: SURFACE_ID,
          ...(branchId ? { branchId } : {}),
        }
        return saveResult
          ? api.generation.generateAndSave(storyId, genInput, undefined, opts)
          : api.generation.stream(storyId, genInput, undefined, opts)
      })
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : t('generationPanel.failed'))
      persistContext(null)
    }
  }, [branchId, isGenerating, persistContext, run.start, storyId, t])

  const handleGenerate = useCallback((saveResult: boolean) => {
    if (isGenerating) return
    void runGeneration(input, saveResult, [], 0)
  }, [input, isGenerating, runGeneration])

  const handleAnswers = useCallback((answers: Clarification[]) => {
    const { input: original, saveResult, clarifications, round } = genCtxRef.current
    void runGeneration(
      original,
      saveResult,
      [...clarifications, ...answers],
      round + 1,
    )
  }, [runGeneration])

  const handleSkipQuestions = useCallback(() => {
    const { input: original, saveResult, clarifications } = genCtxRef.current
    void runGeneration(original, saveResult, clarifications, FORCE_PROCEED_ROUND)
  }, [runGeneration])

  const handleStop = useCallback(() => {
    void run.cancel()
    setPendingQuestions(null)
  }, [run.cancel])

  return (
    <Panel data-component-id="generation-panel-root">
      <PanelHeader>
        <PanelHeaderText>
          <PanelTitle>{t('generationPanel.title')}</PanelTitle>
        </PanelHeaderText>
        <PanelActions>
          <Button
            size="sm"
            variant={showDebug ? 'secondary' : 'ghost'}
            className="h-7 text-xs gap-1"
            onClick={() => setShowDebug(!showDebug)}
            data-component-id="generation-debug-toggle"
          >
            <Bug className="size-3" />
            {t('generationPanel.debug')}
          </Button>
          {onBack && (
            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={onBack} data-component-id="generation-back">
              <ArrowLeft className="size-3" />
              {t('generationPanel.back')}
            </Button>
          )}
        </PanelActions>
      </PanelHeader>

      {showDebug ? (
        <DebugPanel
          storyId={storyId}
          onClose={() => setShowDebug(false)}
        />
      ) : (
        <>
          {streamedText && (
            <>
              <div ref={outputRef} className="flex-1 overflow-auto px-6 py-6" data-component-id="generation-output">
                <div className="max-w-[38rem] mx-auto">
                  <StreamMarkdown content={streamedText} streaming={isGenerating} variant="prose" />
                </div>
              </div>
              <div className="h-px bg-border/30" />
            </>
          )}

          {run.isReconnecting && (
            <div className="px-6 py-2 text-xs text-muted-foreground bg-muted/20 border-b border-border/30">
              {t('generationPanel.reconnecting')}
            </div>
          )}

          {error && (
            <div className="px-6 py-2 text-sm text-destructive bg-destructive/5 border-b border-border/50">
              {error}
            </div>
          )}

          {pendingQuestions && (
            <QuestionCard
              questions={pendingQuestions}
              onSubmit={handleAnswers}
              onCancel={handleSkipQuestions}
              disabled={isGenerating}
            />
          )}

          <div className="px-6 py-5 space-y-3">
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t('generationPanel.placeholder')}
              className="min-h-[80px] resize-none text-sm bg-transparent placeholder:italic placeholder:text-muted-foreground"
              disabled={isGenerating || branchId === undefined}
              onKeyDown={(event) => {
                if (
                  event.key === 'Enter'
                  && (event.ctrlKey || event.metaKey)
                  && !event.nativeEvent.isComposing
                ) {
                  event.preventDefault()
                  handleGenerate(true)
                }
              }}
              data-component-id="generation-input"
            />
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                {isGenerating ? (
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={handleStop} data-component-id="generation-stop">
                    <Square className="size-3" />
                    {t('generationPanel.stop')}
                  </Button>
                ) : (
                  <>
                    <Button
                      size="sm"
                      className="h-7 text-xs gap-1.5"
                      onClick={() => handleGenerate(true)}
                      disabled={!input.trim() || branchId === undefined}
                      data-component-id="generation-submit"
                    >
                      <Send className="size-3" />
                      {t('generationPanel.generateAndSave')}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs gap-1.5 text-muted-foreground"
                      onClick={() => handleGenerate(false)}
                      disabled={!input.trim() || branchId === undefined}
                      data-component-id="generation-preview"
                    >
                      <Eye className="size-3" />
                      {t('generationPanel.preview')}
                    </Button>
                    <PovSelect
                      storyId={storyId}
                      branchId={branchId}
                      disabled={isGenerating}
                    />
                  </>
                )}
              </div>
              <span className="text-[0.625rem] text-muted-foreground">
                {t('generationPanel.shortcutHint')}
              </span>
            </div>
          </div>
        </>
      )}
    </Panel>
  )
}
