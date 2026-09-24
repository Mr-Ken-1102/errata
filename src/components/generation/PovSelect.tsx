import { useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { Fragment } from '@/lib/api'
import { q } from '@/lib/query-keys'
import { readPovCharacterId, writePovCharacterId } from '@/lib/api/generation'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n'

interface PovSelectProps {
  storyId: string
  branchId?: string
  disabled?: boolean
}

function filterOptions(
  characters: Fragment[] | undefined,
  query: string,
  narratorLabel: string,
): Array<Pick<Fragment, 'id' | 'name'>> {
  const normalized = query.trim().toLocaleLowerCase()
  return [
    ...(!normalized || narratorLabel.toLocaleLowerCase().includes(normalized)
      ? [{ id: '', name: narratorLabel }]
      : []),
    ...(characters ?? [])
      .filter(character => !character.archived)
      .filter(character => (
        !normalized || character.name.toLocaleLowerCase().includes(normalized)
      )),
  ]
}

/**
 * Timeline-local point-of-view picker.
 *
 * The selection is intentionally UI preference state rather than a story
 * setting, but its key includes the active branch so sibling timelines cannot
 * silently inherit each other's POV.
 */
export function PovSelect({ storyId, branchId, disabled }: PovSelectProps) {
  const { t } = useLanguage()
  const narratorLabel = t('povSelect.narrator')
  const [value, setValue] = useState(() => readPovCharacterId(storyId, branchId) ?? '')
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlight, setHighlight] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listboxId = useId()

  const { data: characters } = useQuery({
    ...q.fragments(storyId, branchId, 'character'),
    enabled: !!branchId,
    staleTime: 30_000,
  })

  useEffect(() => {
    setValue(readPovCharacterId(storyId, branchId) ?? '')
    setOpen(false)
    setQuery('')
    setHighlight(0)
  }, [branchId, storyId])

  // A branch may not contain the character selected in a prior browser
  // session anymore. Clear that stale preference rather than sending an ID
  // that only makes sense in an older snapshot.
  useEffect(() => {
    if (!branchId || characters === undefined || !value) return
    if (characters.some(character => !character.archived && character.id === value)) return
    setValue('')
    writePovCharacterId(storyId, branchId, undefined)
  }, [branchId, characters, storyId, value])

  const options = filterOptions(characters, query, narratorLabel)
  const activeIndex = Math.max(0, Math.min(highlight, options.length - 1))
  const selectedName = (characters ?? []).find(character => (
    !character.archived && character.id === value
  ))?.name

  function openList() {
    if (disabled || !branchId) return
    setOpen(true)
    setQuery('')
    setHighlight(Math.max(
      0,
      filterOptions(characters, '', narratorLabel).findIndex(option => option.id === value),
    ))
  }

  function close() {
    setOpen(false)
    setQuery('')
    inputRef.current?.blur()
  }

  function commit(id: string) {
    if (!branchId) return
    setValue(id)
    writePovCharacterId(storyId, branchId, id || undefined)
    close()
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open && (event.key === 'ArrowDown' || event.key === 'Enter')) {
      event.preventDefault()
      openList()
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlight(Math.min(activeIndex + 1, options.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlight(Math.max(activeIndex - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const option = options[activeIndex]
      if (option) commit(option.id)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      close()
    }
  }

  return (
    <div className="relative inline-block" data-component-id="pov-select">
      <input
        ref={inputRef}
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={t('povSelect.ariaLabel')}
        value={open ? query : selectedName ?? narratorLabel}
        placeholder={t('povSelect.placeholder')}
        disabled={disabled || !branchId}
        onFocus={openList}
        onChange={(event) => {
          setQuery(event.target.value)
          setHighlight(0)
        }}
        onKeyDown={onKeyDown}
        onBlur={() => {
          if (open) close()
        }}
        title={t('povSelect.title')}
        className={cn(
          'w-[140px] truncate rounded-md border border-border/40 bg-muted/50 py-1 pl-2 pr-2',
          'font-mono text-[0.625rem] text-foreground/60 outline-none transition-all duration-200',
          'hover:border-border/60 hover:bg-muted/70 focus:border-primary/30 focus:bg-muted/70 focus:ring-1 focus:ring-primary/20',
          'disabled:cursor-default disabled:opacity-30',
        )}
        data-component-id="pov-select-input"
      />
      {open && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute bottom-full left-0 z-50 mb-1 max-h-[220px] w-full overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
          data-component-id="pov-select-options"
        >
          {options.map((option, index) => (
            <li
              key={option.id || 'narrator'}
              role="option"
              aria-selected={option.id === value}
              title={option.name}
              onMouseDown={event => event.preventDefault()}
              onMouseEnter={() => setHighlight(index)}
              onClick={() => commit(option.id)}
              className={cn(
                'cursor-pointer truncate rounded-sm px-2 py-1 font-mono text-xs',
                index === activeIndex
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground',
                option.id === value && 'font-medium',
              )}
            >
              {option.name}
            </li>
          ))}
          {options.length === 0 && (
            <li className="px-2 py-1 font-mono text-xs italic text-muted-foreground">
              {t('povSelect.noMatching')}
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
