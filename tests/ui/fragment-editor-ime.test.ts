// @vitest-environment jsdom
import { createElement } from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RefsSection, TagsSection } from '@/components/fragments/FragmentEditor'

const mocks = vi.hoisted(() => ({
  addTag: vi.fn(),
  addRef: vi.fn(),
}))

vi.mock('@/lib/query-keys', async () => {
  const actual = await vi.importActual<typeof import('@/lib/query-keys')>('@/lib/query-keys')
  return {
    ...actual,
    useActiveBranchId: () => 'main',
  }
})

vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api')>('@/lib/api')
  return {
    ...actual,
    api: {
      ...actual.api,
      fragments: {
        ...actual.api.fragments,
        getTags: async () => ({ tags: [] }),
        addTag: mocks.addTag,
        removeTag: vi.fn(),
        getRefs: async () => ({ refs: [], backRefs: [] }),
        addRef: mocks.addRef,
        removeRef: vi.fn(),
      },
    },
  }
})

function renderWithQuery(child: ReturnType<typeof createElement>) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(createElement(QueryClientProvider, { client }, child))
}

describe('FragmentEditor IME-safe Enter actions', () => {
  beforeEach(() => {
    mocks.addTag.mockReset()
    mocks.addRef.mockReset()
    mocks.addTag.mockResolvedValue({ ok: true })
    mocks.addRef.mockResolvedValue({ ok: true })
  })

  afterEach(() => {
    cleanup()
  })

  it('does not add a tag when Enter completes Vietnamese IME composition', async () => {
    renderWithQuery(createElement(TagsSection, { storyId: 'story-1', fragmentId: 'ch-1' }))
    const input = await screen.findByPlaceholderText('Add tag...')

    fireEvent.change(input, { target: { value: 'nhân vật chính' } })
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true })
    expect(mocks.addTag).not.toHaveBeenCalled()

    fireEvent.keyDown(input, { key: 'Enter', isComposing: false })
    await waitFor(() => expect(mocks.addTag).toHaveBeenCalledWith('story-1', 'ch-1', 'nhân vật chính'))
  })

  it('does not add a reference when Enter completes IME composition', async () => {
    renderWithQuery(createElement(RefsSection, { storyId: 'story-1', fragmentId: 'ch-1' }))
    const input = await screen.findByPlaceholderText('Fragment ID (e.g. ch-bokura)')

    fireEvent.change(input, { target: { value: 'ch-maya' } })
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true })
    expect(mocks.addRef).not.toHaveBeenCalled()

    fireEvent.keyDown(input, { key: 'Enter', isComposing: false })
    await waitFor(() => expect(mocks.addRef).toHaveBeenCalledWith('story-1', 'ch-1', 'ch-maya'))
  })
})
