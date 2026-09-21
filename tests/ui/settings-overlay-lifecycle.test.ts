// @vitest-environment jsdom
import { createElement } from 'react'
import { act, render } from '@testing-library/react'
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
  vi.useFakeTimers()
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    return window.setTimeout(() => cb(performance.now()), 0)
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => window.clearTimeout(id))
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
    expect(document.querySelector('[data-component-id="settings-view-root"]')).not.toBeNull()

    view.rerender(createElement(DetailPanel, detailProps(null)))

    await act(async () => {
      vi.advanceTimersByTime(251)
    })

    expect(document.querySelector('[data-component-id="settings-view-root"]')).toBeNull()
    expect(document.querySelector('button[aria-label="Close settings"]')).toBeNull()
  })
})
