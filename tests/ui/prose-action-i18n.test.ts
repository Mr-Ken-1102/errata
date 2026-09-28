import React from 'react'
import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/i18n')>()
  return {
    ...actual,
    useLanguage: () => ({
      language: 'vi' as const,
      setLanguage: () => undefined,
      t: (key: Parameters<typeof actual.translate>[1]) => actual.translate('vi', key),
    }),
  }
})

vi.mock('@/lib/query-keys', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/query-keys')>()
  return {
    ...actual,
    useActiveBranchId: () => 'branch-main',
  }
})

import { ProseActionInput } from '@/components/prose/ProseActionInput'

function render(mode: 'regenerate' | 'refine') {
  const client = new QueryClient()
  return renderToStaticMarkup(
    React.createElement(
      QueryClientProvider,
      { client },
      React.createElement(ProseActionInput, {
        storyId: 'story-1',
        fragmentId: 'prose-1',
        mode,
        onComplete: () => undefined,
        onCancel: () => undefined,
        onStreamStart: () => undefined,
        onStream: () => undefined,
      }),
    ),
  )
}

describe('ProseActionInput localization', () => {
  it('renders Vietnamese regenerate/refine chrome without changing action mode values', () => {
    const regenerate = render('regenerate')
    expect(regenerate).toContain('placeholder="Hướng mới..."')
    expect(regenerate).toContain('Esc để hủy · Ctrl+Enter để gửi')
    expect(regenerate).toContain('>Hủy</button>')
    expect(regenerate).toContain('>Tạo lại</button>')

    const refine = render('refine')
    expect(refine).toContain('placeholder="Bạn muốn tinh chỉnh thế nào..."')
    expect(refine).toContain('>Tinh chỉnh</button>')
  })

  it('keeps server rejection/error text verbatim and preserves run identity and cancellation semantics', () => {
    const source = readFileSync('src/components/prose/ProseActionInput.tsx', 'utf8')

    expect(source).toContain('setError(rejection)')
    expect(source).toContain("setError(result.error ?? t('proseAction.operationFailed'))")
    expect(source).toContain("setError(err instanceof Error ? err.message : t('proseAction.operationFailed'))")
    expect(source).toContain('const opts = { clientRequestId, ...(branchId ? { branchId } : {}) }')
    expect(source).toContain('api.generation.regenerate(storyId, fragmentId, input, undefined, opts)')
    expect(source).toContain('api.generation.refine(storyId, fragmentId, input, undefined, opts)')
    expect(source).toContain("if (result.status === 'cancelled') return")
  })
})
