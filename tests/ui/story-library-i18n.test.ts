// @vitest-environment jsdom
import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  confirm: vi.fn(),
  setTheme: vi.fn(),
  setInteractionSounds: vi.fn(),
  storiesList: vi.fn(),
  storiesCreate: vi.fn(),
  storiesDelete: vi.fn(),
  storiesImportFromZip: vi.fn(),
  storiesUpdate: vi.fn(),
  presetsList: vi.fn(),
  presetsApply: vi.fn(),
  settingsUpdate: vi.fn(),
  getProviders: vi.fn(),
  fragmentsList: vi.fn(),
  proseChainGet: vi.fn(),
}))

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return { ...actual, useNavigate: () => mocks.navigate }
})
vi.mock('@/lib/api', () => ({
  api: {
    stories: {
      list: mocks.storiesList,
      create: mocks.storiesCreate,
      delete: mocks.storiesDelete,
      importFromZip: mocks.storiesImportFromZip,
      update: mocks.storiesUpdate,
    },
    presets: { list: mocks.presetsList, apply: mocks.presetsApply },
    settings: { update: mocks.settingsUpdate },
    config: { getProviders: mocks.getProviders },
    fragments: { list: mocks.fragmentsList },
    proseChain: { get: mocks.proseChainGet },
  },
}))

vi.mock('@/hooks/use-window-file-drop', () => ({ useWindowFileDrop: () => false }))
vi.mock('@/lib/theme', () => ({ useTheme: () => ({ theme: 'light', setTheme: mocks.setTheme }) }))
vi.mock('@/lib/interaction-sounds', () => ({
  useInteractionSounds: () => [false, mocks.setInteractionSounds],
}))
vi.mock('@/components/ui/confirm-dialog', () => ({ useConfirm: () => mocks.confirm }))
vi.mock('@/components/fragments/FragmentImportDialog', () => ({
  SingleFragmentPreview: () => null,
  BundlePreview: () => null,
}))
vi.mock('@/components/onboarding/OnboardingWizard', () => ({ OnboardingWizard: () => null }))
vi.mock('@/components/ImportDialog', () => ({ ImportDialog: () => null }))
vi.mock('@/components/settings/ProviderManager', () => ({
  ProviderList: () => React.createElement('div', null, 'provider-list'),
  ProviderPanel: () => React.createElement('div', null, 'provider-panel'),
}))
vi.mock('@/components/settings/AboutPanel', () => ({
  AboutSection: () => React.createElement('div', null, 'about-section'),
}))
vi.mock('@/components/settings/DesktopUpdatesPanel', () => ({
  DesktopUpdatesControls: () => React.createElement('div', null, 'desktop-updates'),
}))
vi.mock('@/components/presets/PresetManager', () => ({
  PresetManager: () => React.createElement('div', null, 'preset-manager'),
}))
vi.mock('@/components/ErrataLogo', () => ({
  ErrataLogo: () => React.createElement('span', null, 'Errata'),
}))
vi.mock('@/components/GeneratedCover', () => ({ GeneratedCover: () => null }))

import { Route } from '@/routes/index'
import { LANGUAGE_STORAGE_KEY } from '@/lib/i18n'
import { withLanguageProvider } from './test-providers'

function renderLibrary(language: 'en' | 'vi') {
  localStorage.clear()
  if (language === 'vi') localStorage.setItem(LANGUAGE_STORAGE_KEY, 'vi')
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const Component = Route.options.component as React.ComponentType
  return render(withLanguageProvider(
    React.createElement(QueryClientProvider, { client }, React.createElement(Component)),
  ))
}
describe('story library localization', () => {
  beforeEach(() => {
    mocks.storiesList.mockResolvedValue([])
    mocks.presetsList.mockResolvedValue({ presets: [] })
    mocks.getProviders.mockResolvedValue({ providers: [{ id: 'test-provider' }] })
    mocks.confirm.mockResolvedValue(true)
  })

  afterEach(() => {
    localStorage.clear()
    document.documentElement.lang = ''
  })

  it('renders the English library and create-story chrome', async () => {
    renderLibrary('en')

    expect(await screen.findByText('Begin something new.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'New story' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Open settings' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'New story' }))

    expect(await screen.findByText('Create a new story')).toBeTruthy()
    expect(screen.getByPlaceholderText('Untitled Story')).toBeTruthy()
    expect(document.documentElement.lang).toBe('en')
  })

  it('renders the Vietnamese library and create-story chrome', async () => {
    renderLibrary('vi')

    expect(await screen.findByText('Bắt đầu một điều mới.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Truyện mới' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Mở cài đặt' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Truyện mới' }))

    expect(await screen.findByText('Tạo truyện mới')).toBeTruthy()
    expect(screen.getByPlaceholderText('Truyện chưa đặt tên')).toBeTruthy()
    await waitFor(() => expect(document.documentElement.lang).toBe('vi'))
  })

  it('keeps story mutations, technical ids, and persisted import fallback semantic', () => {
    const source = readFileSync('src/routes/index.tsx', 'utf8')

    expect(source).toContain('api.stories.create({ name, description, coverImage })')
    expect(source).toContain('api.settings.update(newStory.id, { autoApplyLibrarianSuggestions: true })')
    expect(source).toContain('api.presets.apply(selectedPresetId, newStory.id)')
    expect(source).toContain("sessionStorage.setItem('errata:pending-card-import'")
    expect(source).toContain("value: 'light' as const")
    expect(source).toContain("value: 'dark' as const")
    expect(source).toContain("value: 'high-contrast' as const")
    expect(source.match(/Imported from character card/g)).toHaveLength(2)
  })
})
