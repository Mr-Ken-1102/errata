// @vitest-environment jsdom
import React from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  state: { open: true, section: null as string | null, anchor: null as string | null, seq: 1 },
  closeHelp: vi.fn(),
  openHelp: vi.fn(),
}))

vi.mock('@/hooks/use-help', () => ({
  useHelp: () => ({
    state: mocks.state,
    closeHelp: mocks.closeHelp,
    openHelp: mocks.openHelp,
  }),
}))

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}))

import { HelpPanel } from '@/components/help/HelpPanel'
import { LANGUAGE_STORAGE_KEY, translate } from '@/lib/i18n'
import { withLanguageProvider } from './test-providers'

function renderHelp(language: 'en' | 'vi', section: string | null = null) {
  localStorage.clear()
  if (language === 'vi') localStorage.setItem(LANGUAGE_STORAGE_KEY, 'vi')
  mocks.state = { open: true, section, anchor: null, seq: mocks.state.seq + 1 }
  return render(withLanguageProvider(React.createElement(HelpPanel)))
}

describe('HelpPanel localization', () => {
  beforeEach(() => {
    mocks.closeHelp.mockReset()
    mocks.openHelp.mockReset()
    mocks.state = { open: true, section: null, anchor: null, seq: 1 }
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0)
      return 1
    })
  })

  afterEach(() => {
    cleanup()
    localStorage.clear()
    document.documentElement.lang = ''
    vi.unstubAllGlobals()
  })

  it('renders English help shell', async () => {
    renderHelp('en')

    expect(await screen.findByRole('heading', { name: 'Help' })).toBeTruthy()
    expect(screen.getByText("Select a topic to learn more about Errata's features.")).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Close help' })).toBeTruthy()
    expect(screen.getByText((_, element) => element?.tagName === 'P' && element.textContent === 'Press Esc to close')).toBeTruthy()
    expect(document.documentElement.lang).toBe('en')
  })

  it('renders Vietnamese help shell', async () => {
    renderHelp('vi')

    expect(await screen.findByRole('heading', { name: 'Trợ giúp' })).toBeTruthy()
    expect(screen.getByText('Chọn một chủ đề để tìm hiểu thêm về các tính năng của Errata.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Đóng trợ giúp' })).toBeTruthy()
    expect(screen.getByText((_, element) => element?.tagName === 'P' && element.textContent === 'Nhấn Esc để đóng')).toBeTruthy()
    expect(document.documentElement.lang).toBe('vi')
  })

  it('localizes section navigation chrome without changing section ids', async () => {
    renderHelp('vi', 'generation')

    expect(await screen.findByTitle('Quay lại chủ đề')).toBeTruthy()
    expect(screen.getByText('Trong trang này')).toBeTruthy()
    expect(mocks.state.section).toBe('generation')
    expect(translate('en', 'help.onThisPage')).toBe('On this page')
    expect(translate('vi', 'help.onThisPage')).toBe('Trong trang này')
  })
})
