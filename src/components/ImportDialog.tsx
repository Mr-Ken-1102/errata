import { useState, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
  isTavernCardPng,
  extractParsedCard,
  parseCardJson,
  type ParsedCharacterCard,
} from '@/lib/importers/tavern-card'
import { FileDropDialog } from '@/components/ui/file-drop-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/async-view'
import { useLanguage } from '@/lib/i18n'
import {
  Upload,
  Link as LinkIcon,
  FileArchive,
  FileJson,
  Image,
} from 'lucide-react'

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type ImportStatus =
  | { type: 'idle' }
  | { type: 'processing'; message: string }
  | { type: 'error'; message: string }

export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState<ImportStatus>({ type: 'idle' })

  const reset = useCallback(() => {
    setUrl('')
    setStatus({ type: 'idle' })
  }, [])

  const handleOpenChange = useCallback((v: boolean) => {
    if (!v) reset()
    onOpenChange(v)
  }, [onOpenChange, reset])

  /** Store parsed card data in sessionStorage and navigate to the new story */
  const importCharacterCard = useCallback(async (
    parsed: ParsedCharacterCard,
    imageDataUrl?: string | null,
  ) => {
    const newStory = await api.stories.create({
      name: parsed.card.name,
      description: parsed.card.description.slice(0, 250) || 'Imported from character card',
    })

    const cardJson = JSON.stringify({
      data: {
        name: parsed.card.name,
        description: parsed.card.description,
        personality: parsed.card.personality,
        first_mes: parsed.card.firstMessage,
        mes_example: parsed.card.messageExamples,
        scenario: parsed.card.scenario,
        creator_notes: parsed.card.creatorNotes,
        system_prompt: parsed.card.systemPrompt,
        post_history_instructions: parsed.card.postHistoryInstructions,
        alternate_greetings: parsed.card.alternateGreetings,
        tags: parsed.card.tags,
        creator: parsed.card.creator,
        character_version: parsed.card.characterVersion,
        character_book: parsed.book ? {
          name: parsed.book.name,
          entries: parsed.book.entries.map(e => ({
            keys: e.keys, secondary_keys: e.secondaryKeys, content: e.content,
            comment: e.comment, name: e.name, enabled: e.enabled, constant: e.constant,
            selective: e.selective, insertion_order: e.insertionOrder,
            position: e.position, priority: e.priority, id: e.id,
          })),
        } : undefined,
      },
      spec: parsed.card.spec,
      spec_version: parsed.card.specVersion,
    })

    sessionStorage.setItem('errata:pending-card-import', JSON.stringify({
      type: imageDataUrl ? 'png' : 'json',
      imageDataUrl: imageDataUrl ?? undefined,
      cardJson,
    }))

    await queryClient.invalidateQueries({ queryKey: ['stories'] })
    handleOpenChange(false)
    navigate({ to: '/story/$storyId', params: { storyId: newStory.id } })
  }, [navigate, queryClient, handleOpenChange])

  const processFile = useCallback(async (file: File) => {
    const name = file.name.toLowerCase()

    if (name.endsWith('.zip') || file.type === 'application/zip' || file.type === 'application/x-zip-compressed') {
      setStatus({ type: 'processing', message: t('importDialog.importingStoryArchive') })
      try {
        const newStory = await api.stories.importFromZip(file)
        await queryClient.invalidateQueries({ queryKey: ['stories'] })
        handleOpenChange(false)
        navigate({ to: '/story/$storyId', params: { storyId: newStory.id } })
      } catch (err) {
        setStatus({ type: 'error', message: err instanceof Error ? err.message : t('importDialog.failedImportStoryArchive') })
      }
      return
    }

    if (name.endsWith('.png') || file.type === 'image/png') {
      setStatus({ type: 'processing', message: t('importDialog.readingCharacterCardImage') })
      try {
        const buffer = await file.arrayBuffer()
        if (!isTavernCardPng(buffer)) {
          setStatus({ type: 'error', message: t('importDialog.pngNoEmbeddedCard') })
          return
        }
        const parsed = extractParsedCard(buffer)
        if (!parsed) {
          setStatus({ type: 'error', message: t('importDialog.pngParseFailed') })
          return
        }
        const bytes = new Uint8Array(buffer)
        let binary = ''
        for (let j = 0; j < bytes.length; j++) {
          binary += String.fromCharCode(bytes[j])
        }
        const imageDataUrl = `data:image/png;base64,${btoa(binary)}`
        await importCharacterCard(parsed, imageDataUrl)
      } catch (err) {
        setStatus({ type: 'error', message: err instanceof Error ? err.message : t('importDialog.failedReadPng') })
      }
      return
    }

    if (name.endsWith('.json') || file.type === 'application/json') {
      setStatus({ type: 'processing', message: t('importDialog.parsingJson') })
      try {
        const text = await file.text()
        const parsed = parseCardJson(text)
        if (parsed) {
          await importCharacterCard(parsed)
          return
        }
        setStatus({ type: 'error', message: t('importDialog.jsonNotRecognized') })
      } catch (err) {
        setStatus({ type: 'error', message: err instanceof Error ? err.message : t('importDialog.failedReadJson') })
      }
      return
    }

    setStatus({ type: 'error', message: t('importDialog.unsupportedFileType') })
  }, [importCharacterCard, navigate, queryClient, handleOpenChange, t])

  const handleFiles = useCallback(async (files: File[]) => {
    const file = files[0]
    if (file) await processFile(file)
  }, [processFile])

  const handleUrlFetch = useCallback(async () => {
    const trimmed = url.trim()
    if (!trimmed) return

    setStatus({ type: 'processing', message: t('importDialog.fetchingUrl') })
    try {
      const res = await fetch(trimmed)
      if (!res.ok) {
        setStatus({ type: 'error', message: `${t('importDialog.fetchFailed')}: ${res.status} ${res.statusText}` })
        return
      }

      const contentType = res.headers.get('content-type') ?? ''
      const text = await res.text()

      const parsed = parseCardJson(text)
      if (parsed) {
        await importCharacterCard(parsed)
        return
      }

      if (contentType.includes('json') || trimmed.endsWith('.json')) {
        setStatus({ type: 'error', message: t('importDialog.fetchedJsonNotRecognized') })
        return
      }

      setStatus({ type: 'error', message: t('importDialog.fetchedContentNotRecognized') })
    } catch (err) {
      setStatus({ type: 'error', message: err instanceof Error ? err.message : t('importDialog.networkError') })
    }
  }, [url, importCharacterCard, t])

  const isProcessing = status.type === 'processing'

  return (
    <FileDropDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={t('importDialog.title')}
      contentClassName="max-w-md"
      showCloseButton
    >
      <FileDropDialog.Dropzone
        onFiles={handleFiles}
        accept=".zip,.json,.png,image/png,application/json,application/zip"
        disabled={isProcessing}
        icon={<Upload className="size-6" aria-hidden="true" />}
        label={
          isProcessing
            ? status.message
            : t('importDialog.dropzoneLabel')
        }
        hint={
          !isProcessing ? (
            <span className="inline-flex items-center justify-center gap-3">
              <span className="inline-flex items-center gap-1">
                <FileArchive className="size-3" />.zip
              </span>
              <span className="inline-flex items-center gap-1">
                <FileJson className="size-3" />.json
              </span>
              <span className="inline-flex items-center gap-1">
                <Image className="size-3" />.png
              </span>
            </span>
          ) : undefined
        }
      >
        {isProcessing ? (
          <div className="flex flex-col items-center gap-2 py-3">
            <Spinner size="md" />
            <p className="text-xs text-muted-foreground italic">{status.message}</p>
          </div>
        ) : undefined}
      </FileDropDialog.Dropzone>

      {/* URL input */}
      <div className="space-y-1.5">
        <label className="text-[0.6875rem] font-medium text-muted-foreground uppercase tracking-wider">
          {t('importDialog.importFromUrl')}
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <LinkIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleUrlFetch() } }}
              placeholder="https://..."
              className="pl-8 text-sm h-9"
              disabled={isProcessing}
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-9 px-3"
            disabled={isProcessing || !url.trim()}
            onClick={handleUrlFetch}
          >
            {isProcessing ? <Spinner size="sm" /> : t('importDialog.fetch')}
          </Button>
        </div>
      </div>

      <FileDropDialog.Errors>
        {status.type === 'error' ? status.message : undefined}
      </FileDropDialog.Errors>

      <p className="text-[0.6875rem] text-muted-foreground leading-relaxed">
        <strong className="text-muted-foreground">.zip</strong> — {t('importDialog.zipDescription')}
        {' · '}
        <strong className="text-muted-foreground">.json</strong> — {t('importDialog.jsonDescription')}
        {' · '}
        <strong className="text-muted-foreground">.png</strong> — {t('importDialog.pngDescription')}
      </p>
    </FileDropDialog>
  )
}