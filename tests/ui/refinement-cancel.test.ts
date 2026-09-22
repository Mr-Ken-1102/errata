// @vitest-environment jsdom
import React from 'react'
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ChatEvent, SequencedChatEvent } from '@/lib/api'
 
const mocks = vi.hoisted(() => ({
  refine: vi.fn(),
  cancelRun: vi.fn(),
  listBranches: vi.fn(),
}))

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>()
  return {
    ...actual,
    api: {
      ...actual.api,
      librarian: { ...actual.api.librarian, refine: mocks.refine },
      runs: { ...actual.api.runs, cancel: mocks.cancelRun },
      branches: { ...actual.api.branches, list: mocks.listBranches },
    },
  }
})

import { RefinementPanel } from '@/components/refinement/RefinementPanel'

const APPLIED_EDIT: ChatEvent = {
  type: 'tool-result',
  id: 'call-1',
  toolName: 'editFragments',
  result: {
    operations: [{
      action: 'set_fields',
      status: 'applied',
      target: { fragmentId: 'ch-vic' },
      diffs: [{ field: 'content', before: 'Terse.', after: 'Rather less terse.' }],
    }],
    appliedChanges: [{ kind: 'update', fragmentId: 'ch-vic' }],
  },
}

function controlledRun(runId: string, script: ChatEvent[] = []) {
  let controller!: ReadableStreamDefaultController<SequencedChatEvent>
  let seq = 0
  const stream = new ReadableStream<SequencedChatEvent>({
    start(next) {
      controller = next
      controller.enqueue({
        type: 'run-start',
        runId,
        kind: 'librarian.refine',
        status: 'running',
        seq: seq++,
      })
      controller.enqueue({ type: 'text', text: 'Reworking the sheet', seq: seq++ })
      for (const event of script) {
        controller.enqueue({ ...event, seq: seq++ } as SequencedChatEvent)
      }
    },
  })

  return {
    runId,
    stream,
    finishCancelled() {
      controller.enqueue({ type: 'run-end', status: 'cancelled', seq: seq++ })
      controller.close()
    },
  }
}

function mockRefine(script: ChatEvent[] = []) {
  const run = controlledRun('run-refine-1', script)
  mocks.refine.mockResolvedValue(run.stream)
  mocks.cancelRun.mockImplementation(async (_storyId: string, runId: string, branchId?: string) => {
    expect(runId).toBe(run.runId)
    expect(branchId).toBe('main')
    run.finishCancelled()
    return { ok: true, cancelled: true }
  })
  return run
}

function renderPanel(onComplete: () => void, onClose: () => void) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const utils = render(
    React.createElement(QueryClientProvider, { client: queryClient },
      React.createElement(RefinementPanel, {
        storyId: 'story-1',
        fragmentId: 'ch-vic',
        fragmentName: 'Victoria',
        onComplete,
        onClose,
      }),
    ),
  )
  const byId = <T extends HTMLElement>(id: string) =>
    utils.container.querySelector<T>(`[data-component-id="${id}"]`)
  return { ...utils, byId }
}

async function startRefining(byId: ReturnType<typeof renderPanel>['byId'], instructions: string) {
  await waitFor(() => expect(byId<HTMLButtonElement>('refinement-submit')?.disabled).toBe(false))
  fireEvent.change(byId<HTMLTextAreaElement>('refinement-input')!, { target: { value: instructions } })
  await act(async () => { fireEvent.click(byId('refinement-submit')!) })
}

describe('cancelling a refinement', () => {
  afterEach(cleanup)

  beforeEach(() => {
    mocks.refine.mockReset()
    mocks.cancelRun.mockReset()
    mocks.listBranches.mockReset()
    mocks.listBranches.mockResolvedValue({
      activeBranchId: 'main',
      rootBranchId: 'main',
      branches: [{ id: 'main', name: 'Main', order: 0, createdAt: '2026-01-01T00:00:00.000Z' }],
    })
  })

  it('uses the server-owned run id for explicit cancellation', async () => {
    const run = mockRefine()
    const onComplete = vi.fn()
    const onClose = vi.fn()
    const { byId } = renderPanel(onComplete, onClose)
    await startRefining(byId, 'tighten the voice')

    await waitFor(() => expect(byId('refinement-stop')).toBeTruthy())
    await act(async () => { fireEvent.click(byId('refinement-stop')!) })

    await waitFor(() => {
      expect(mocks.cancelRun).toHaveBeenCalledWith('story-1', run.runId, 'main')
    })
    expect(onClose).not.toHaveBeenCalled()
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('returns to the form with the instructions intact so the run can be retried', async () => {
    mockRefine()
    const { byId } = renderPanel(vi.fn(), vi.fn())
    await startRefining(byId, 'tighten the voice')

    await waitFor(() => expect(byId('refinement-stop')).toBeTruthy())
    expect(byId('refinement-input')).toBeNull()

    await act(async () => { fireEvent.click(byId('refinement-stop')!) })

    await waitFor(() => {
      expect(byId<HTMLTextAreaElement>('refinement-input')?.value).toBe('tighten the voice')
    })
    expect(byId('refinement-done')).toBeNull()
    expect(byId('refinement-cancelled')?.textContent).toContain('Refinement stopped')
  })

  it('does not infer completion from a tool result emitted before Stop', async () => {
    mockRefine([APPLIED_EDIT])
    const onComplete = vi.fn()
    const { byId } = renderPanel(onComplete, vi.fn())
    await startRefining(byId, 'tighten the voice')

    await waitFor(() => expect(byId('refinement-stop')).toBeTruthy())
    await act(async () => { fireEvent.click(byId('refinement-stop')!) })

    await waitFor(() => expect(byId('refinement-cancelled')).toBeTruthy())
    expect(onComplete).not.toHaveBeenCalled()
    expect(byId('refinement-done')).toBeNull()
  })

  it('cancels the server-owned run when the panel unmounts', async () => {
    const run = mockRefine()
    const { byId, unmount } = renderPanel(vi.fn(), vi.fn())
    await startRefining(byId, 'tighten the voice')

    await waitFor(() => expect(byId('refinement-stop')).toBeTruthy())
    await act(async () => { unmount() })

    expect(mocks.cancelRun).toHaveBeenCalledWith('story-1', run.runId, 'main')
  })

  it('does not submit Ctrl/Cmd+Enter while Vietnamese IME composition is active', async () => {
    mockRefine()
    const { byId } = renderPanel(vi.fn(), vi.fn())
    const input = byId<HTMLTextAreaElement>('refinement-input')!
    await waitFor(() => expect(byId<HTMLButtonElement>('refinement-submit')?.disabled).toBe(false))
    fireEvent.change(input, { target: { value: 'giữ giọng kể nhất quán' } })

    fireEvent.keyDown(input, {
      key: 'Enter',
      ctrlKey: true,
      isComposing: true,
    })
    expect(mocks.refine).not.toHaveBeenCalled()

    fireEvent.keyDown(input, {
      key: 'Enter',
      ctrlKey: true,
      isComposing: false,
    })
    await waitFor(() => expect(mocks.refine).toHaveBeenCalledTimes(1))
  })
})
