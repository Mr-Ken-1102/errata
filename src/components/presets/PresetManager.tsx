import { useCallback, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type StoryPresetMeta } from '@/lib/api'
import {
  downloadExportFile,
  parseErrataExport,
  readFileAsText,
  type FragmentBundleData,
} from '@/lib/fragment-clipboard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyHint, Hint } from '@/components/ui/prose-text'
import { Check, Download, Pencil, Trash2, Upload, X } from 'lucide-react'

function relativeDate(iso: string): string {
  const diffMs = Date.now() - Date.parse(iso)
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

function countsSummary(counts: Record<string, number>): string {
  const labels: Record<string, string> = {
    character: 'character',
    guideline: 'guideline',
    knowledge: 'knowledge',
  }
  return ['character', 'guideline', 'knowledge']
    .filter(type => (counts[type] ?? 0) > 0)
    .map(type => {
      const count = counts[type] ?? 0
      return `${count} ${labels[type]}${count === 1 ? '' : 's'}`
    })
    .join(', ') || 'empty'
}

function PresetRow({ preset }: { preset: StoryPresetMeta }) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(preset.name)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['presets'] })

  const renameMutation = useMutation({
    mutationFn: (nextName: string) => api.presets.update(preset.id, { name: nextName }),
    onSuccess: async () => {
      await invalidate()
      setEditing(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.presets.delete(preset.id),
    onSuccess: invalidate,
  })

  const handleDownload = useCallback(async () => {
    const { bundle } = await api.presets.get(preset.id)
    const safeName = preset.name.replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 40)
    downloadExportFile(JSON.stringify(bundle, null, 2), `errata-preset-${safeName}.json`)
  }, [preset.id, preset.name])

  return (
    <div className="flex items-center gap-2 py-1.5" data-component-id={`preset-row-${preset.id}`}>
      {editing ? (
        <>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={80}
            className="h-7 flex-1 text-sm"
            autoFocus
            onKeyDown={(event) => {
              if (
                event.key === 'Enter'
                && !event.nativeEvent.isComposing
                && name.trim()
              ) {
                renameMutation.mutate(name.trim())
              }
              if (event.key === 'Escape') {
                setEditing(false)
                setName(preset.name)
              }
            }}
            data-component-id={`preset-rename-input-${preset.id}`}
          />
          <Button
            size="icon"
            variant="ghost"
            className="size-6 shrink-0"
            disabled={!name.trim() || renameMutation.isPending}
            onClick={() => renameMutation.mutate(name.trim())}
            aria-label={`Save name for ${preset.name}`}
          >
            <Check className="size-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-6 shrink-0"
            onClick={() => {
              setEditing(false)
              setName(preset.name)
            }}
            aria-label={`Cancel renaming ${preset.name}`}
          >
            <X className="size-3.5" />
          </Button>
        </>
      ) : (
        <>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm">{preset.name}</p>
            <p className="truncate text-[0.6875rem] text-muted-foreground">
              {countsSummary(preset.countsByType)} · {relativeDate(preset.createdAt)}
            </p>
            {preset.description && (
              <p className="mt-0.5 line-clamp-1 text-[0.625rem] text-muted-foreground/80">
                {preset.description}
              </p>
            )}
          </div>
          {confirmingDelete ? (
            <>
              <span className="shrink-0 text-[0.6875rem] text-muted-foreground">Delete?</span>
              <Button
                size="sm"
                variant="destructive"
                className="h-6 shrink-0 px-2 text-[0.6875rem]"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate()}
              >
                Delete
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="size-6 shrink-0"
                onClick={() => setConfirmingDelete(false)}
                aria-label={`Cancel deleting ${preset.name}`}
              >
                <X className="size-3.5" />
              </Button>
            </>
          ) : (
            <>
              <Button
                size="icon"
                variant="ghost"
                className="size-6 shrink-0 text-muted-foreground"
                onClick={() => { void handleDownload() }}
                title="Download .json"
                aria-label={`Download ${preset.name}`}
              >
                <Download className="size-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="size-6 shrink-0 text-muted-foreground"
                onClick={() => setEditing(true)}
                title="Rename"
                aria-label={`Rename ${preset.name}`}
              >
                <Pencil className="size-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="size-6 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => setConfirmingDelete(true)}
                title="Delete"
                aria-label={`Delete ${preset.name}`}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </>
          )}
        </>
      )}
    </div>
  )
}

export function PresetManager() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['presets'],
    queryFn: api.presets.list,
  })

  const importMutation = useMutation({
    mutationFn: async (text: string) => {
      const parsed = parseErrataExport(text)
      if (!parsed) throw new Error('Not a valid Errata fragment export')

      if (parsed._errata === 'fragment') {
        const bundle: FragmentBundleData = {
          _errata: 'fragment-bundle',
          version: 1,
          source: parsed.source,
          exportedAt: parsed.exportedAt,
          fragments: [{ ...parsed.fragment, attachments: parsed.attachments }],
        }
        return api.presets.create({
          name: parsed.fragment.name,
          bundle: bundle as unknown as Record<string, unknown>,
        })
      }

      return api.presets.create({
        name: parsed.storyName || 'Imported preset',
        bundle: parsed as unknown as Record<string, unknown>,
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['presets'] })
      setImportError(null)
    },
    onError: (error) => {
      setImportError(error instanceof Error ? error.message : 'Failed to import preset')
    },
  })

  const handleFileInput = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const text = await readFileAsText(file)
      importMutation.mutate(text)
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Could not read preset file')
    }
  }, [importMutation])

  const presets = data?.presets ?? []

  return (
    <div className="space-y-2">
      {isLoading && <Hint>Loading presets...</Hint>}
      {!isLoading && presets.length === 0 && (
        <EmptyHint>
          No story presets yet. Save selected characters, guidelines, or knowledge from a story's export panel.
        </EmptyHint>
      )}
      {presets.length > 0 && (
        <div className="divide-y divide-border/20">
          {presets.map(preset => <PresetRow key={preset.id} preset={preset} />)}
        </div>
      )}

      {importError && (
        <p className="text-[0.6875rem] text-destructive/80">{importError}</p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleFileInput}
      />
      <Button
        size="sm"
        variant="outline"
        className="h-7 w-full gap-1.5 text-xs"
        onClick={() => fileInputRef.current?.click()}
        disabled={importMutation.isPending}
        data-component-id="preset-manager-import"
      >
        <Upload className="size-3.5" />
        Import story preset from file
      </Button>
    </div>
  )
}
