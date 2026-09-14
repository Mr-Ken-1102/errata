import { useEffect, useLayoutEffect, useRef, useState } from 'react'

interface ProseInlineEditorProps {
  content: string
  saving?: boolean
  onSave: (content: string) => void
  onCancel: () => void
}

/**
 * In-place editor for a passage. Replaces the rendered markdown with a
 * textarea styled like the reading surface, so editing feels like writing on
 * the same page rather than opening a form.
 *
 * Ctrl/Cmd+Enter saves, Esc cancels. Saving with unchanged text just closes.
 */
export function ProseInlineEditor({ content, saving, onSave, onCancel }: ProseInlineEditorProps) {
  const [draft, setDraft] = useState(content)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const dirty = draft !== content

  // Grow with the text so the passage keeps its footprint on the page.
  useLayoutEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = '0px'
    el.style.height = `${el.scrollHeight}px`
  }, [draft])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.focus()
    const end = el.value.length
    el.setSelectionRange(end, end)
  }, [])

  const commit = () => {
    if (saving) return
    if (!dirty) { onCancel(); return }
    onSave(draft)
  }

  return (
    <div
      className="rounded-lg p-4 -mx-4 bg-card/50 ring-1 ring-primary/15"
      data-component-id="prose-inline-editor"
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      <textarea
        ref={textareaRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        disabled={saving}
        spellCheck
        aria-label="Edit passage"
        className="prose-content w-full resize-none overflow-hidden bg-transparent p-0 text-foreground outline-none border-none caret-primary disabled:opacity-60"
        onKeyDown={(e) => {
          if (e.key === 'Escape') { e.preventDefault(); onCancel(); return }
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); commit() }
        }}
      />
      <div className="mt-3 flex items-center gap-2 border-t border-border/20 pt-2">
        <span className="text-[0.6rem] font-mono tracking-wide text-muted-foreground/50">
          {saving ? 'SAVING' : 'CTRL+ENTER · ESC'}
        </span>
        <button
          type="button"
          className="ml-auto rounded px-1.5 py-0.5 text-[0.625rem] font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground disabled:opacity-30"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </button>
        <button
          type="button"
          className="rounded px-1.5 py-0.5 text-[0.625rem] font-medium text-primary/70 transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-30"
          onClick={commit}
          disabled={saving || !dirty}
        >
          Save
        </button>
      </div>
    </div>
  )
}
