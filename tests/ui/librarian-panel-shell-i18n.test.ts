// @vitest-environment jsdom
import React from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  listConversations: vi.fn(),
  createConversation: vi.fn(),
  deleteConversation: vi.fn(),
  getStatus: vi.fn(),
  listAnalyses: vi.fn(),
  getAnalysis: vi.fn(),
  getStory: vi.fn(),
}))

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>()
  return {
    ...actual,
    api: {
      ...actual.api,
      librarian: {
        ...actual.api.librarian,
        listConversations: mocks.listConversations,
        createConversation: mocks.createConversation,
        deleteConversation: mocks.deleteConversation,
        getStatus: mocks.getStatus,
        listAnalyses: mocks.listAnalyses,
        getAnalysis: mocks.getAnalysis,
      },
      stories: {
        ...actual.api.stories,
        get: mocks.getStory,
      },
    },
  }
})

vi.mock('@/lib/query-keys', () => ({
  useActiveBranchId: () => 'branch-main',
  qk: {
    librarianConversations: (storyId: string, branchId: string) =>
      ['librarian-conversations', storyId, branchId],
    librarianStatus: (storyId: string, branchId: string) =>
      ['librarian-status', storyId, branchId],
    librarianAnalyses: (storyId: string, branchId: string) =>
      ['librarian-analyses', storyId, branchId],
    fragmentsArchived: (storyId: string, branchId: string, type?: string) =>
      ['fragments-archived', storyId, branchId, type],
  },
  q: {
    fragments: (
      storyId: string,
      branchId: string,
      type?: string,
    ) => ({
      queryKey: ['fragments', storyId, branchId, type],
      queryFn: async () => [],
    }),
  },
}))

import { LibrarianPanel } from '@/components/sidebar/LibrarianPanel'
import { LANGUAGE_STORAGE_KEY, translate } from '@/lib/i18n'
import { withLanguageProvider } from './test-providers'

function renderPanel(language: 'en' | 'vi', savedTab?: 'story' | 'summaries') {
  localStorage.clear()
  if (language === 'vi') localStorage.setItem(LANGUAGE_STORAGE_KEY, 'vi')
  if (savedTab) localStorage.setItem('errata.librarian.activeTab.story-1', savedTab)
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(withLanguageProvider(
    React.createElement(
      QueryClientProvider,
      { client },
      React.createElement(LibrarianPanel, { storyId: 'story-1' }),
    ),
  ))
}

describe('LibrarianPanel shell localization', () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) mock.mockReset()
    mocks.listConversations.mockResolvedValue([])
    mocks.getStatus.mockResolvedValue({ recentMentions: {}, timeline: [] })
    mocks.listAnalyses.mockResolvedValue([])
    mocks.getStory.mockResolvedValue({ settings: { customFragmentTypes: [] } })
  })

  afterEach(() => {
    cleanup()
    localStorage.clear()
    document.documentElement.lang = ''
  })

  it('renders English conversation chrome', async () => {
    renderPanel('en')

    expect(await screen.findByText('New chat')).toBeTruthy()
    expect(screen.getByText('No conversations yet')).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Chat' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Story' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Memory' })).toBeTruthy()
    expect(document.documentElement.lang).toBe('en')
  })

  it('renders English story overview from the persisted tab', async () => {
    renderPanel('en', 'story')

    expect(await screen.findByText('Nothing tracked yet')).toBeTruthy()
    expect(screen.getByText('Refine')).toBeTruthy()
    expect(screen.getByText('No fragments to refine yet.')).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Story' }).getAttribute('aria-selected')).toBe('true')
  })

  it('renders English authored-memory chrome from the persisted tab', async () => {
    renderPanel('en', 'summaries')

    expect(await screen.findByText('No authored memory')).toBeTruthy()
    expect(screen.getByText('Story history is derived automatically from source-linked analyses. Optional summary fragments you author appear here.')).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Memory' }).getAttribute('aria-selected')).toBe('true')
  })

  it('renders Vietnamese conversation chrome', async () => {
    renderPanel('vi')

    expect(await screen.findByText('Trò chuyện mới')).toBeTruthy()
    expect(screen.getByText('Chưa có cuộc trò chuyện nào')).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Trò chuyện' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Câu chuyện' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Ghi nhớ' })).toBeTruthy()
    expect(document.documentElement.lang).toBe('vi')
  })

  it('renders Vietnamese story overview from the persisted tab', async () => {
    renderPanel('vi', 'story')

    expect(await screen.findByText('Chưa có nội dung được theo dõi')).toBeTruthy()
    expect(screen.getByText('Tinh chỉnh')).toBeTruthy()
    expect(screen.getByText('Chưa có fragment để tinh chỉnh.')).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Câu chuyện' }).getAttribute('aria-selected')).toBe('true')
  })

  it('renders Vietnamese authored-memory chrome from the persisted tab', async () => {
    renderPanel('vi', 'summaries')

    expect(await screen.findByText('Chưa có bộ nhớ do tác giả tạo')).toBeTruthy()
    expect(screen.getByText('Lịch sử truyện được suy ra tự động từ các phân tích liên kết nguồn. Các fragment tóm tắt tùy chọn do bạn viết sẽ xuất hiện ở đây.')).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Ghi nhớ' }).getAttribute('aria-selected')).toBe('true')
  })

  it('provides localized count and relative-time labels', () => {
    expect(translate('vi', 'librarianPanel.contradictionMany').replace('{count}', '3')).toBe('3 mâu thuẫn')
    expect(translate('vi', 'librarianPanel.suggestionMany').replace('{count}', '2')).toBe('2 đề xuất')
    expect(translate('vi', 'librarianPanel.mentionMany').replace('{count}', '4')).toBe('4 tham chiếu')
    expect(translate('vi', 'librarianPanel.showMore').replace('{count}', '5')).toBe('Hiển thị thêm 5')
    expect(translate('vi', 'librarianPanel.justNow')).toBe('Vừa xong')
    expect(translate('vi', 'librarianPanel.summaryUpdate')).toBe('Cập nhật tóm tắt')
    expect(translate('vi', 'librarianPanel.continuityNotes')).toBe('Ghi chú tính liên tục')
    expect(translate('vi', 'librarianPanel.contradictions')).toBe('Mâu thuẫn')
    expect(translate('vi', 'librarianPanel.suggestions')).toBe('Đề xuất')
    expect(translate('vi', 'librarianPanel.analysisTrace')).toBe('Dấu vết phân tích')
    expect(translate('vi', 'librarianPanel.restoreSummary')).toBe('Khôi phục tóm tắt')
    expect(translate('vi', 'librarianPanel.archiveSummary')).toBe('Lưu trữ tóm tắt')
    expect(translate('vi', 'librarianPanel.closeEditor')).toBe('Đóng trình sửa')
    expect(translate('vi', 'librarianPanel.saveFailed')).toBe('không thể lưu')
  })

  it('preserves tab ids, branch-scoped APIs, POV capture, persisted keys, and dynamic story data', () => {
    const source = readFileSync('src/components/sidebar/LibrarianPanel.tsx', 'utf8').replace(/\r\n/g, '\n')

    expect(source).toContain("type TabValue = 'chat' | 'story' | 'summaries'")
    expect(source).toContain('errata.librarian.activeTab.')
    expect(source).toContain('qk.librarianConversations(storyId, branchId)')
    expect(source).toContain('api.librarian.createConversation(storyId, input.title, input.povCharacterId, branchId)')
    expect(source).toContain('api.librarian.deleteConversation(storyId, conversationId, branchId)')
    expect(source).toContain('readPovCharacterId(storyId, branchId)')
    expect(source).toContain('const prefill = askPrefill ??')
    expect(source).toContain('askFragmentId')
    expect(source).toContain('{conv.title}')
    expect(source).toContain('{entry.event}')
    expect(source).toContain('{entry.fragmentId}')
    expect(source).toContain('{group.visual.label}')
    expect(source).toContain('{f.name} ({f.type})')
    expect(source).toContain('Review and fix this contradiction if it is valid:')
    expect(source).toContain('THREAD_ACTION_LABELS[operation.action] ?? operation.action')
    expect(source).toContain('<span className="opacity-70">{pass.status}</span>')
  })
})

