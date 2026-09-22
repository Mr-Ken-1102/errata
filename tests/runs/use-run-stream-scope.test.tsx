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
  _scopeId: string | null,
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

  it('does not attach or start a run before the timeline resolves', async () => {
    mocks.list.mockResolvedValue([])

    const { result, rerender } = renderHook(
      ({ branchId }) => useRunStream({
        storyId: 'story-1',
        branchId,
        kind: 'generation',
        scopeId: 'generation-panel',
      }),
      { initialProps: { branchId: undefined as string | undefined } },
    )

    await act(async () => {})
    expect(mocks.list).not.toHaveBeenCalled()
    expect(sessionStorage.length).toBe(0)

    await expect(act(async () => {
      await result.current.start(async () => {
        throw new Error('must not post before branch resolves')
      })
    })).rejects.toThrow('Timeline is still loading')
    expect(result.current.phase).toBe('idle')
    expect(sessionStorage.length).toBe(0)

    rerender({ branchId: 'main' })
    await waitFor(() => {
      expect(mocks.list).toHaveBeenCalledWith('story-1', {
        active: true,
        scopeId: 'generation-panel',
        branchId: 'main',
      })
    })
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

  it('replays a retained completed generation from seq 0 for a non-durable view', async () => {
    const onEvent = vi.fn()
    const onSettled = vi.fn()
    const key = 'errata:run:story-1:main:generation:generation-panel'
    sessionStorage.setItem(key, JSON.stringify({ runId: 'run-complete', cursor: 7 }))

    mocks.get.mockResolvedValue({
      id: 'run-complete',
      storyId: 'story-1',
      kind: 'generation',
      scopeId: 'generation-panel',
      status: 'complete',
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      seq: 4,
    } satisfies RunSummary)
    mocks.events.mockImplementation(async (
      _storyId: string,
      runId: string,
      cursor: number,
    ) => {
      expect(runId).toBe('run-complete')
      expect(cursor).toBe(0)
      return new ReadableStream<SequencedChatEvent>({
        start(controller) {
          controller.enqueue({
            type: 'run-start',
            runId,
            kind: 'generation',
            status: 'running',
            seq: 0,
          })
          controller.enqueue({ type: 'text', text: 'whole passage', seq: 1 })
          controller.enqueue({ type: 'finish', finishReason: 'stop', stepCount: 1, seq: 2 })
          controller.enqueue({ type: 'run-end', status: 'complete', seq: 3 })
          controller.close()
        },
      })
    })

    const { result } = renderHook(() => useRunStream({
      storyId: 'story-1',
      branchId: 'main',
      kind: 'generation',
      scopeId: 'generation-panel',
      recoverFullRunOnAttach: true,
      onEvent,
      onSettled,
    }))

    await waitFor(() => expect(result.current.phase).toBe('complete'))
    expect(mocks.get).toHaveBeenCalledWith('story-1', 'run-complete', 'main')
    expect(mocks.events).toHaveBeenCalledWith('story-1', 'run-complete', 0, 'main')
    expect(onEvent).toHaveBeenCalledWith(expect.objectContaining({
      type: 'text',
      text: 'whole passage',
    }))
    expect(onSettled).toHaveBeenCalledWith('complete', undefined)
    expect(sessionStorage.getItem(key)).toBeNull()
  })

  it('settles and reports a POST start failure exactly once', async () => {
    const onSettled = vi.fn()
    mocks.list.mockResolvedValue([])

    const { result } = renderHook(() => useRunStream({
      storyId: 'story-1',
      branchId: 'main',
      kind: 'generation',
      scopeId: 'generation-panel',
      autoAttach: false,
      onSettled,
    }))

    await expect(act(async () => {
      await result.current.start(async () => {
        throw new Error('provider unavailable')
      })
    })).rejects.toThrow('provider unavailable')

    await waitFor(() => expect(result.current.phase).toBe('error'))
    expect(result.current.error).toBe('provider unavailable')
    expect(onSettled).toHaveBeenCalledTimes(1)
    expect(onSettled).toHaveBeenCalledWith('error', 'provider unavailable')
  })


  it('retries the same POST key when the response dies before run-start', async () => {
    const ids: string[] = []
    const onSettled = vi.fn()
    let calls = 0

    const { result } = renderHook(() => useRunStream({
      storyId: 'story-1',
      branchId: 'main',
      kind: 'generation',
      scopeId: 'generation-panel',
      autoAttach: false,
      onSettled,
    }))

    await act(async () => {
      await result.current.start(async (clientRequestId) => {
        ids.push(clientRequestId)
        calls += 1
        if (calls === 1) {
          return new ReadableStream<SequencedChatEvent>({
            start(controller) { controller.close() },
          })
        }
        return new ReadableStream<SequencedChatEvent>({
          start(controller) {
            controller.enqueue({
              type: 'run-start',
              runId: 'run-after-retry',
              kind: 'generation',
              status: 'running',
              seq: 0,
            })
            controller.enqueue({ type: 'run-end', status: 'complete', seq: 1 })
            controller.close()
          },
        })
      })
    })

    expect(calls).toBe(2)
    expect(ids[0]).toBe(ids[1])
    expect(result.current.phase).toBe('complete')
    expect(onSettled).toHaveBeenCalledWith('complete', undefined)
  })

})
