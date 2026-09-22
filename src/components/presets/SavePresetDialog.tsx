import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type Fragment } from '@/lib/api'
import { serializeBundle } from '@/lib/fragment-clipboard'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, Loader2 } from 'lucide-react'

interface SavePresetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedFragments: Fragment[]
  mediaById: Map<string, Fragment>
  storyName?: string
}

export function SavePresetDialog({
  open,
  onOpenChange,
  selectedFragments,
  mediaById,
  storyName,
}: SavePresetDialogProps) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(storyName ?? '')
  const [description, setDescription] = useState('')

  const saveMutation = useMutation({
    mutationFn: async () => {
      const bundle = JSON.parse(
        serializeBundle(selectedFragments, mediaById, storyName),
      ) as Record<string, unknown>
      return api.presets.create({
        name: name.trim(),
        description: description.trim() || undefined,
        sourceStoryName: storyName,
        bundle,
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['presets'] })
      onOpenChange(false)
      setName(storyName ?? '')
      setDescription('')
    },
  })

  const close = () => {
    onOpenChange(false)
    saveMutation.reset()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen)
        if (!nextOpen) saveMutation.reset()
      }}
    >
      <DialogContent className="sm:max-w-[440px]" data-component-id="save-preset-dialog">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">Save as story preset</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Save the {selectedFragments.length} selected fragment{selectedFragments.length === 1 ? '' : 's'} as reusable
            story context. Applying this preset creates independent copies; context/agent configuration is never included.
          </p>

          <div>
            <label className="mb-2 block text-[0.5625rem] font-medium uppercase tracking-[0.15em] text-muted-foreground">
              Name
            </label>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Noir Detective Cast"
              maxLength={80}
              autoFocus
              className="h-9"
              data-component-id="save-preset-name"
            />
          </div>

          <div>
            <label className="mb-2 block text-[0.5625rem] font-medium uppercase tracking-[0.15em] text-muted-foreground">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional notes about this preset..."
              maxLength={250}
              rows={3}
              className="resize-none text-xs"
              data-component-id="save-preset-description"
            />
          </div>

          {saveMutation.isError && (
            <div className="flex items-start gap-2 rounded-md bg-destructive/5 px-3 py-2 text-xs text-destructive/80">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
              <span>
                {saveMutation.error instanceof Error
                  ? saveMutation.error.message
                  : 'Failed to save preset'}
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 border-t border-border/30 pt-3">
          <Button
            variant="ghost"
            onClick={close}
            className="text-xs"
            data-component-id="save-preset-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={!name.trim() || selectedFragments.length === 0 || saveMutation.isPending}
            className="gap-1.5 text-xs"
            data-component-id="save-preset-submit"
          >
            {saveMutation.isPending && <Loader2 className="size-3 animate-spin" />}
            Save preset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
