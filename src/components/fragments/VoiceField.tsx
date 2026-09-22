import { useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type Fragment } from '@/lib/api'
import { qk } from '@/lib/query-keys'
import { Textarea } from '@/components/ui/textarea'

interface VoiceFieldProps {
  storyId: string
  branchId?: string
  fragment: Fragment | null
  disabled?: boolean
}

const SAVE_DEBOUNCE_MS = 800

function readVoice(fragment: Fragment | null): string {
  const raw = fragment?.meta?.voice
  return typeof raw === 'string' ? raw : ''
}

/**
 * Author-owned POV voice notes stored in character meta.voice.
 *
 * Text is stored verbatim (including Vietnamese diacritics and whitespace);
 * trim is used only to decide whether a blank draft removes the key.
 */
export function VoiceField({
  storyId,
  branchId,
  fragment,
  disabled,
}: VoiceFieldProps) {
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const commitRef = useRef<() => void>(() => {})

  useEffect(() => {
    setDraft(null)
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [branchId, fragment?.id])

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  const value = draft ?? readVoice(fragment)

  const saveMutation = useMutation({
    mutationFn: async (voice: string) => {
      if (!fragment) throw new Error('No character fragment')
      const meta: Record<string, unknown> = { ...fragment.meta }
      if (voice.trim()) meta.voice = voice
      else delete meta.voice
      return api.fragments.update(storyId, fragment.id, {
        name: fragment.name,
        description: fragment.description,
        content: fragment.content,
        meta,
      }, branchId)
    },
    onSuccess: (updated) => {
      if (!fragment) return
      queryClient.setQueryData(qk.fragment(storyId, branchId, fragment.id), updated)
      queryClient.invalidateQueries({ queryKey: qk.fragments(storyId, branchId, 'character') })
    },
  })

  function commitNow() {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (
      draft !== null
      && fragment
      && branchId
      && draft !== readVoice(fragment)
      && !saveMutation.isPending
    ) {
      saveMutation.mutate(draft)
    }
  }
  commitRef.current = commitNow

  return (
    <div data-component-id="character-voice-field">
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Voice{' '}
        <span className="normal-case tracking-normal text-muted-foreground">
          (used when this character is POV)
        </span>
      </label>
      <Textarea
        value={value}
        onChange={(event) => {
          const next = event.target.value
          setDraft(next)
          if (timerRef.current) clearTimeout(timerRef.current)
          timerRef.current = setTimeout(() => commitRef.current(), SAVE_DEBOUNCE_MS)
        }}
        onBlur={() => commitRef.current()}
        disabled={disabled || !branchId || saveMutation.isPending}
        placeholder="Diction, cadence, inner monologue, verbal habits, and how this character perceives the world..."
        className="min-h-[72px] resize-y bg-transparent text-sm"
        data-component-id="character-voice-input"
      />
    </div>
  )
}
