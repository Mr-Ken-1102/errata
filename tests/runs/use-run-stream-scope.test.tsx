// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { RunSummary, SequencedChatEvent } from '@/lib/api/types'

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  get: vi.fn(),
  events: vi.fn(),
  cancel: vi.fn(),
}))

vi.mock('@/lib/api', () => ({
  api: {
    runs: {
      list: mocks.list,
      get: mocks.get,
      events: mocks.events,
      cancel: mocks.cancel,
    },
  },
}))

import { useRunStream } from '@/hooks/use-run-stream'

function liveStream(
  runId: string,
  scopeId: string | null,
  onCancel: () => void,
): ReadableStream<SequencedChatEvent> {
  return new ReadableStream<SequencedChatEvent>({
    start(controller) {
      controller.enqueue({
        type: 'run-start',
        runId,
        kind: 'librarian.chat',
        status: 'running',
        seq: 0,
      })
      controller.enqueue({ type: 'text', text: 'partial', seq: 1 })
    },
    cancel() {
      onCancel()
    },
  })
}

function summary(id: string, scopeId: string | null): RunSummary {
  return {
    id,
    storyId: 'story-1',
    kind: 'librarian.chat',
    scopeId,
    status: 'running',
    startedAt: new Date().toISOString(),
    seq: 2,
  }
}

describe('useRunStream surface isolation', () => {
  beforeEach(() => {
    sessionStorage.clear()
    mocks.list.mockReset()
    mocks.get.mockReset()
    mocks.events.mockReset()
    mocks.cancel.mockReset()
  })

  it('cancels the old reader immediately when conversation scope changes', async () => {
    const cancelled = vi.fn()

    mocks.list.mockImplementation(async (_storyId: string, options?: { scopeId?: string | null }) => {
      return options?.scopeId === 'conv-a' ? [summary('run-a', 'conv-a')] : []
    })
    mocks.events.mockImplementation(async (_storyId: string, runId: string) => {
      if (runId !== 'run-a') throw new Error('unexpected run')
      return liveStream('run-a', 'conv-a', cancelled)
    })

    const { result, rerender } = renderHook(
      ({ scopeId }) => useRunStream({
        storyId: 'story-1',
        branchId: 'main',
        kind: 'librarian.chat',
        scopeId,
      }),
      { initialProps: { scopeId: 'conv-a' as string | null } },
    )

    await waitFor(() => expect(result.current.runId).toBe('run-a'))

    rerender({ scopeId: 'conv-b' })

    await waitFor(() => expect(cancelled).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(result.current.runId).toBeNull())
    expect(result.current.phase).toBe('idle')
  })

  it('separates persisted cursor/readers when the story branch changes', async () => {
    const cancelled = vi.fn()
    let serverBranch = 'main'

    mocks.list.mockImplementation(async () => (
      serverBranch === 'main' ? [summary('run-main', 'conv-a')] : []
    ))
    mocks.events.mockImplementation(async (_storyId: string, runId: string) => (
      liveStream(runId, 'conv-a', cancelled)
    ))

    const { result, rerender } = renderHook(
      ({ branchId }) => useRunStream({
        storyId: 'story-1',
        branchId,
        kind: 'librarian.chat',
        scopeId: 'conv-a',
      }),
      { initialProps: { branchId: 'main' } },
    )

    await waitFor(() => expect(result.current.runId).toBe('run-main'))

    await act(async () => {
      serverBranch = 'alternate'
      rerender({ branchId: 'alternate' })
    })

    await waitFor(() => expect(cancelled).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(result.current.runId).toBeNull())

    // The old branch cursor remains isolated under its own storage key and
    // cannot be reused by the alternate timeline.
    const keys = Array.from({ length: sessionStorage.length }, (_, i) => sessionStorage.key(i)!)
    expect(keys.some(key => key.includes(':main:librarian.chat:conv-a'))).toBe(true)
    expect(keys.some(key => key.includes(':alternate:librarian.chat:conv-a'))).toBe(false)
  })
})
