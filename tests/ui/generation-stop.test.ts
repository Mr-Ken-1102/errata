// @vitest-environment jsdom
import React from 'react'
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SequencedChatEvent } from '@/lib/api/types'

const mocks = vi.hoisted(() => ({
  generateAndSave: vi.fn(),
  listRuns: vi.fn(),
  getRun: vi.fn(),
  runEvents: vi.fn(),
  cancelRun: vi.fn(),
}))

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>()
  return {
    ...actual,
    api: {
      ...actual.api,
      generation: { ...actual.api.generation, generateAndSave: mocks.generateAndSave },
      runs: {
        ...actual.api.runs,
        list: mocks.listRuns,
        get: mocks.getRun,
        events: mocks.runEvents,
        cancel: mocks.cancelRun,
      },
      branches: { ...actual.api.branches, list: async () => ({ activeBranchId: 'main', branches: [] }) },
      librarian: {
        ...actual.api.librarian,
        getStatus: async () => ({ runStatus: 'idle' }),
        listAnalyses: async () => [],
      },
      stories: { ...actual.api.stories, get: async () => null },
      config: { ...actual.api.config, getProviders: async () => null },
    },
  }
})

import { TooltipProvider } from '@/components/ui/tooltip'
import { InlineGenerationInput } from '@/components/prose/InlineGenerationInput'
import { withLanguageProvider } from './test-providers'

function streamOf(events: SequencedChatEvent[]): ReadableStream<SequencedChatEvent> {
  return new ReadableStream<SequencedChatEvent>({
    start(controller) {
      for (const event of events) controller.enqueue(event)
      controller.close()
    },
  })
}

function controlledRun(runId: string) {
  let controller!: ReadableStreamDefaultController<SequencedChatEvent>
  const stream = new ReadableStream<SequencedChatEvent>({
    start(next) {
      controller = next
      controller.enqueue({
        type: 'run-start',
        runId,
        kind: 'generation',
        status: 'running',
        seq: 0,
      })
      controller.enqueue({ type: 'text', text: 'The door swung', seq: 1 })
    },
  })
  return {
    stream,
    finishCancelled() {
      controller.enqueue({ type: 'run-end', status: 'cancelled', seq: 2 })
      controller.close()
    },
  }
}

function renderInput() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const utils = render(withLanguageProvider(
    React.createElement(QueryClientProvider, { client: queryClient },
      React.createElement(TooltipProvider, null,
        React.createElement(InlineGenerationInput, {
          storyId: 'story-1',
          isGenerating: false,
          onGenerationStart: () => {},
          onGenerationStream: () => {},
          onGenerationComplete: () => {},
          onGenerationError: () => {},
        }),
      ),
    ),
  ))
  const textarea = utils.container.querySelector<HTMLTextAreaElement>(
    '[data-component-id="inline-generation-input"]',
  )!
  return { ...utils, textarea }
}

async function write(textarea: HTMLTextAreaElement, container: HTMLElement, prompt: string) {
  await waitFor(() => expect(textarea.disabled).toBe(false))
  fireEvent.change(textarea, { target: { value: prompt } })
  const submit = await waitFor(() => {
    const button = container.querySelector<HTMLButtonElement>(
      '[data-component-id="inline-generation-submit"]',
    )
    expect(button).toBeTruthy()
    expect(button!.disabled).toBe(false)
    return button!
  })
  await act(async () => { fireEvent.click(submit) })
}

describe('stopping a prose generation', () => {
  afterEach(cleanup)

  beforeEach(() => {
    mocks.generateAndSave.mockReset()
    mocks.listRuns.mockReset()
    mocks.getRun.mockReset()
    mocks.runEvents.mockReset()
    mocks.cancelRun.mockReset()
    mocks.listRuns.mockResolvedValue([])
  })

  it('uses the server run cancel endpoint and keeps the prompt after explicit Stop', async () => {
    const run = controlledRun('run-stop-1')
    mocks.generateAndSave.mockResolvedValue(run.stream)
    mocks.cancelRun.mockImplementation(async () => {
      run.finishCancelled()
      return { ok: true, cancelled: true }
    })

    const { textarea, container } = renderInput()
    await write(textarea, container, 'open the door')

    const stop = await waitFor(() => {
      const button = container.querySelector<HTMLButtonElement>(
        '[data-component-id="inline-generation-stop"]',
      )
      expect(button).toBeTruthy()
      return button!
    })

    await act(async () => { fireEvent.click(stop) })

    await waitFor(() => {
      expect(mocks.cancelRun).toHaveBeenCalledWith('story-1', 'run-stop-1', 'main')
    })
    await waitFor(() => expect(textarea.value).toBe('open the door'))
  })

  it('clears the prompt only when the server-owned run completes', async () => {
    mocks.generateAndSave.mockResolvedValue(streamOf([
      {
        type: 'run-start',
        runId: 'run-complete-1',
        kind: 'generation',
        status: 'running',
        seq: 0,
      },
      { type: 'text', text: 'The door swung open.', seq: 1 },
      { type: 'run-end', status: 'complete', seq: 2 },
    ]))

    const { textarea, container } = renderInput()
    await write(textarea, container, 'open the door')

    await waitFor(() => expect(textarea.value).toBe(''))
    expect(mocks.cancelRun).not.toHaveBeenCalled()
  })
})
