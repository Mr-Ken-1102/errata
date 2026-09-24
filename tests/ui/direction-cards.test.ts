// @vitest-environment jsdom
import React from 'react'
import { render, fireEvent, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  proposeDirections: vi.fn(),
  branchesList: vi.fn(),
  getStatus: vi.fn(),
  listAnalyses: vi.fn(),
  storiesGet: vi.fn(),
  getProviders: vi.fn(),
  generateAndSave: vi.fn(),
  listRuns: vi.fn(),
}))

vi.mock('@/lib/api', () => ({
  api: {
    generation: {
      proposeDirections: mocks.proposeDirections,
      generateAndSave: mocks.generateAndSave,
    },
    librarian: {
      getStatus: mocks.getStatus,
      listAnalyses: mocks.listAnalyses,
      getAnalysis: vi.fn(),
    },
    branches: { list: mocks.branchesList },
    stories: { get: mocks.storiesGet },
    config: { getProviders: mocks.getProviders },
    runs: {
      list: mocks.listRuns,
      get: vi.fn(),
      events: vi.fn(),
      cancel: vi.fn(),
    },
    fragments: { create: vi.fn() },
    proseChain: { addSection: vi.fn() },
    settings: { update: vi.fn() },
  },
}))

import { InlineGenerationInput } from '@/components/prose/InlineGenerationInput'
import { TooltipProvider } from '@/components/ui/tooltip'
import { withLanguageProvider } from './test-providers'

const DIRECTION = {
  title: 'Aftermath',
  description: 'The long quiet after the thing that happened, and who speaks first.',
  instruction: 'Write the aftermath.',
}

/**
 * A direction card commits only if it was already showing what it will do when
 * the press started.
 *
 * Hover satisfies that ahead of the press, so a mouse generates in one click
 * exactly as it always did. A touch pointer has no hover, so it expands on the
 * first tap and commits on the second. One rule, no device branch, and a finger
 * that misses the edit control lands on a collapsed card and merely opens it.
 *
 * "When the press started" is load-bearing rather than pedantic: pressing a
 * button focuses it, and focus expands the card, so the live state already reads
 * "open" by the time the click handler runs.
 */
describe('direction card activation', () => {
  let onGenerationStart: ReturnType<typeof vi.fn>

  async function renderCards() {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const view = render(withLanguageProvider(
      React.createElement(
        QueryClientProvider,
        { client },
        // The app mounts one of these near the root; Radix throws without it.
        React.createElement(TooltipProvider, null, React.createElement(InlineGenerationInput, {
          storyId: 'story-test',
          isGenerating: false,
          latestFragmentId: 'frag-head',
          onGenerationStart,
          onGenerationStream: () => undefined,
          onGenerationComplete: () => undefined,
          onGenerationError: () => undefined,
        })),
      ),
    ))
    // Generous windows: the cards arrive behind mocked queries, and the default
    // 1s is tight enough to flake when the whole suite runs in parallel.
    const suggest = await screen.findByText('Suggest directions', {}, { timeout: 10_000 })
    await waitFor(() => {
      expect((suggest as HTMLButtonElement).disabled).toBe(false)
    }, { timeout: 10_000 })
    fireEvent.click(suggest)
    await waitFor(() => expect(screen.getByText(DIRECTION.title)).toBeTruthy())
    return view
  }

  /**
   * Everything a browser dispatches for one press, in order — including the focus
   * the pointerdown causes. Tests here must not use a bare `fireEvent.click`:
   * without the focus they cannot observe a first tap committing, which is the
   * bug this file exists for.
   */
  function press(el: HTMLElement, pointerType = 'touch') {
    fireEvent.pointerDown(el, { pointerType })
    fireEvent.focus(el)
    fireEvent.pointerUp(el, { pointerType })
    fireEvent.click(el)
  }

  /** The drawer holding the full description; open at 1fr, shut at 0fr. */
  const drawer = (container: HTMLElement) =>
    container.querySelector('[class*="grid-rows-"]')!.className

  /** The card's primary control — expands, then commits. */
  const body = () => screen.getByText(DIRECTION.title).closest('button')!

  const card = () => screen.getByText(DIRECTION.title).closest('[class*="group/card"]')!

  beforeEach(() => {
    onGenerationStart = vi.fn()
    mocks.proposeDirections.mockReset()
    mocks.branchesList.mockReset()
    mocks.getStatus.mockReset()
    mocks.listAnalyses.mockReset()
    mocks.storiesGet.mockReset()
    mocks.getProviders.mockReset()
    mocks.generateAndSave.mockReset()
    mocks.listRuns.mockReset()

    mocks.proposeDirections.mockResolvedValue({ suggestions: [DIRECTION] })
    mocks.branchesList.mockResolvedValue({ activeBranchId: 'br-test', branches: [] })
    mocks.getStatus.mockResolvedValue({ runStatus: 'idle' })
    mocks.listAnalyses.mockResolvedValue([])
    mocks.storiesGet.mockResolvedValue(null)
    mocks.getProviders.mockResolvedValue(null)
    mocks.listRuns.mockResolvedValue([])
    mocks.generateAndSave.mockImplementation(async () => new ReadableStream({
      start(controller) {
        controller.enqueue({
          type: 'run-start',
          runId: 'run-direction',
          kind: 'generation',
          status: 'running',
          seq: 0,
        })
        controller.enqueue({ type: 'run-end', status: 'complete', seq: 1 })
        controller.close()
      },
    }))

    localStorage.setItem('errata:generation-mode', 'guided')
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
  })

  it('expands on the first press instead of generating', async () => {
    const { container } = await renderCards()
    expect(drawer(container)).toContain('grid-rows-[0fr]')

    press(body())

    expect(onGenerationStart).not.toHaveBeenCalled()
    expect(drawer(container)).toContain('grid-rows-[1fr]')
    expect(body().getAttribute('aria-expanded')).toBe('true')
  })

  it('commits on the second press', async () => {
    await renderCards()
    press(body())
    press(body())

    expect(onGenerationStart).toHaveBeenCalledWith(DIRECTION.instruction)
  })

  it('still commits in one press when hover opened the card first', async () => {
    const { container } = await renderCards()

    fireEvent.pointerEnter(card(), { pointerType: 'mouse' })
    expect(drawer(container)).toContain('grid-rows-[1fr]')
    press(body(), 'mouse')

    expect(onGenerationStart).toHaveBeenCalledWith(DIRECTION.instruction)
  })

  it('commits on Enter for a keyboard user, whose focus was its own interaction', async () => {
    await renderCards()
    // Tab moves focus in a separate interaction, so the description is already up
    // before the keypress; no pointerdown means there is no snapshot to consult.
    fireEvent.focus(body())
    fireEvent.click(body())

    expect(onGenerationStart).toHaveBeenCalledWith(DIRECTION.instruction)
  })

  it('does not let a touch on a hybrid device skip the expand step', async () => {
    const { container } = await renderCards()

    // A touchscreen laptop reports hover *and* delivers touch pointers. If the
    // touch drove the preview, pointerenter would expand the card and the same
    // tap would then commit.
    fireEvent.pointerEnter(card(), { pointerType: 'touch' })
    expect(drawer(container)).toContain('grid-rows-[0fr]')

    press(body())
    expect(onGenerationStart).not.toHaveBeenCalled()
    press(body())
    expect(onGenerationStart).toHaveBeenCalledWith(DIRECTION.instruction)
  })

  it('does not treat a pen touching the screen as a hover', async () => {
    const { container } = await renderCards()

    // A pen that reaches the card by contact rather than by hovering gets its
    // pointerenter and its click from the same press. Only a mouse previews.
    fireEvent.pointerEnter(card(), { pointerType: 'pen' })
    expect(drawer(container)).toContain('grid-rows-[0fr]')

    press(body(), 'pen')
    expect(onGenerationStart).not.toHaveBeenCalled()
  })

  it('keeps the expanded description a direct commit', async () => {
    await renderCards()
    press(body())

    // Once open, the wrapped description is itself the confirm target, so the
    // second tap can land anywhere on the card rather than only the title row.
    const expanded = screen.getAllByText(DIRECTION.description)
      .find(el => el.className.includes('whitespace-normal'))!
    press(expanded)

    expect(onGenerationStart).toHaveBeenCalledWith(DIRECTION.instruction)
  })

  it('focuses the editable direction inside the press that asked for it', async () => {
    await renderCards()

    press(screen.getByLabelText(`Edit ${DIRECTION.title} before sending`))

    // Asserted with nothing awaited on purpose. The textarea mounts with the mode
    // change, and iOS raises the keyboard only for a focus() in the gesture's own
    // task — so a focus that waits for a frame is one the reader has to tap for
    // a second time.
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
    expect(document.activeElement).toBe(textarea)
    expect(textarea.value).toBe(DIRECTION.instruction)
    // Typing continues at the end rather than in front of the text.
    expect(textarea.selectionStart).toBe(DIRECTION.instruction.length)
    expect(onGenerationStart).not.toHaveBeenCalled()
  })

  it('sizes the edit control for a fingertip on coarse pointers', async () => {
    await renderCards()
    const edit = screen.getByLabelText(`Edit ${DIRECTION.title} before sending`)
    // 32px suits a cursor; 44px is the WCAG 2.5.5 / HIG floor for touch.
    expect(edit.className).toContain('w-8')
    expect(edit.className).toContain('pointer-coarse:w-11')
  })
})
