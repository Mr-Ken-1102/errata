// @vitest-environment jsdom
import { createElement } from 'react'
import { act, render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SettingsView } from '@/components/sidebar/SettingsView'
import { DetailPanel } from '@/components/sidebar/DetailPanel'

vi.mock('@/components/sidebar/SettingsPanel', () => ({
  SettingsPanel: () => createElement('div', { 'data-testid': 'settings-panel-stub' }, 'settings'),
}))

vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }))

const story = {
  id: 'story-test',
  name: 'Test Story',
  description: '',
  summary: '',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  settings: {},
} as any

function detailProps(section: 'settings' | null) {
  return {
    storyId: story.id,
    story,
    section,
    onClose: vi.fn(),
    onSelectFragment: vi.fn(),
    onCreateFragment: vi.fn(),
    onManageProviders: vi.fn(),
    enabledPanelPlugins: [],
  } as any
}

beforeEach(() => {
  let rafId = 0
  // DetailPanel only needs RAF identities in this lifecycle test. Using
  // setTimeout as RAF under fake timers mixes timer kinds during cleanup and
  // contaminates later jsdom tests in the shared worker.
  vi.stubGlobal('requestAnimationFrame', () => ++rafId)
  vi.stubGlobal('cancelAnimationFrame', () => {})
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

describe('Settings overlay close lifecycle', () => {
  it('stops the invisible backdrop and panel from intercepting pointer input immediately when hidden', () => {
    const props = {
      storyId: story.id,
      story,
      visible: true,
      onClose: vi.fn(),
      onTransitionEnd: vi.fn(),
      onManageProviders: vi.fn(),
    }
    const view = render(createElement(SettingsView, props))

    const backdrop = document.querySelector('button[aria-label="Close settings"]') as HTMLButtonElement
    const panel = document.querySelector('[data-component-id="settings-view-root"]') as HTMLDivElement
    expect(backdrop.className).toContain('pointer-events-auto')
    expect(panel.className).toContain('pointer-events-auto')

    view.rerender(createElement(SettingsView, { ...props, visible: false }))

    expect(backdrop.className).toContain('pointer-events-none')
    expect(panel.className).toContain('pointer-events-none')
  })

  it('unmounts the settings portal even when transitionend never fires', async () => {
    const view = render(createElement(DetailPanel, detailProps('settings')))
    await waitFor(() => {
      expect(document.querySelector('[data-component-id="settings-view-root"]')).not.toBeNull()
    })

    // The fallback is the behavior under test. Turn on fake timers only after
    // the lazy SettingsView has resolved so Suspense itself is not timer-bound.
    vi.useFakeTimers()
    view.rerender(createElement(DetailPanel, detailProps(null)))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(251)
    })

    expect(document.querySelector('[data-component-id="settings-view-root"]')).toBeNull()
    expect(document.querySelector('button[aria-label="Close settings"]')).toBeNull()
  })
})
