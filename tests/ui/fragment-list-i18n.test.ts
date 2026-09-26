// @vitest-environment jsdom
import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  fragmentsList: vi.fn(),
  fragmentsUpdate: vi.fn(),
  fragmentsReorder: vi.fn(),
  fragmentsArchive: vi.fn(),
  foldersList: vi.fn(),
  foldersCreate: vi.fn(),
  foldersUpdate: vi.fn(),
  foldersDelete: vi.fn(),
  foldersAssignFragment: vi.fn(),
  foldersReorder: vi.fn(),
}))

vi.mock('@/lib/api', () => ({
  api: {
    fragments: {
      list: mocks.fragmentsList,
      update: mocks.fragmentsUpdate,
      reorder: mocks.fragmentsReorder,
      archive: mocks.fragmentsArchive,
    },
    folders: {
      list: mocks.foldersList,
      create: mocks.foldersCreate,
      update: mocks.foldersUpdate,
      delete: mocks.foldersDelete,
      assignFragment: mocks.foldersAssignFragment,
      reorder: mocks.foldersReorder,
    },
  },
}))

vi.mock('@/lib/query-keys', () => ({
  useActiveBranchId: () => 'branch-main',
  qk: {
    folders: (storyId: string | undefined, branchId: string | undefined) =>
      ['folders', storyId, branchId],
  },
  q: {
    fragments: (
      storyId: string | undefined,
      branchId: string | undefined,
      type?: string,
    ) => ({
      queryKey: ['fragments', storyId, branchId, type],
      queryFn: async () => [],
    }),
  },
}))

import { FragmentList } from '@/components/fragments/FragmentList'
import { LANGUAGE_STORAGE_KEY, translate } from '@/lib/i18n'
import { TooltipProvider } from '@/components/ui/tooltip'
import { withLanguageProvider } from './test-providers'

function renderFragmentList(language: 'en' | 'vi') {
  localStorage.clear()
  if (language === 'vi') localStorage.setItem(LANGUAGE_STORAGE_KEY, 'vi')

  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(withLanguageProvider(
    React.createElement(
      QueryClientProvider,
      { client },
      React.createElement(
        TooltipProvider,
        null,
        React.createElement(FragmentList, {
          storyId: 'story-1',
          listIdBase: 'test-fragments',
          onSelect: () => undefined,
          onCreateNew: () => undefined,
          onImport: () => undefined,
          onImportCard: () => undefined,
          onImportLorebook: () => undefined,
        }),
      ),
    ),
  ))
}

describe('FragmentList localization', () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) mock.mockReset()
    mocks.fragmentsList.mockResolvedValue([])
    mocks.foldersList.mockResolvedValue({ folders: [], assignments: {} })
  })

  afterEach(() => {
    cleanup()
    localStorage.clear()
    document.documentElement.lang = ''
  })

  it('renders English list controls and empty/search states', async () => {
    renderFragmentList('en')

    expect(await screen.findByText('No fragments yet')).toBeTruthy()
    expect(screen.getByPlaceholderText('Search...')).toBeTruthy()
    expect(screen.getByText('order')).toBeTruthy()
    expect(screen.getByText('name')).toBeTruthy()
    expect(screen.getByText('newest')).toBeTruthy()
    expect(screen.getByText('oldest')).toBeTruthy()
    expect(screen.getByText('Pinned fragments are sent in full. Unpinned ones appear as catalog rows.')).toBeTruthy()

    fireEvent.change(screen.getByPlaceholderText('Search...'), { target: { value: 'missing' } })
    expect(await screen.findByText('No matches')).toBeTruthy()
    expect(document.documentElement.lang).toBe('en')
  })

  it('renders Vietnamese list controls and empty/search states', async () => {
    renderFragmentList('vi')

    expect(await screen.findByText('Chưa có fragment')).toBeTruthy()
    expect(screen.getByPlaceholderText('Tìm kiếm...')).toBeTruthy()
    expect(screen.getByText('thứ tự')).toBeTruthy()
    expect(screen.getByText('tên')).toBeTruthy()
    expect(screen.getByText('mới nhất')).toBeTruthy()
    expect(screen.getByText('cũ nhất')).toBeTruthy()
    expect(screen.getByText('Fragment đã ghim được gửi đầy đủ. Fragment chưa ghim chỉ xuất hiện dưới dạng hàng trong danh mục.')).toBeTruthy()

    fireEvent.change(screen.getByPlaceholderText('Tìm kiếm...'), { target: { value: 'không có' } })
    expect(await screen.findByText('Không có kết quả phù hợp')).toBeTruthy()
    expect(document.documentElement.lang).toBe('vi')
  })

  it('provides Vietnamese fixed labels for row, folder, import, and archive actions', () => {
    expect(translate('vi', 'storyInfo.pinned')).toBe('đã ghim')
    expect(translate('vi', 'fragmentList.unpin')).toBe('Bỏ ghim')
    expect(translate('vi', 'fragmentList.pinToContext')).toBe('Ghim vào ngữ cảnh')
    expect(translate('vi', 'fragmentList.rename')).toBe('Đổi tên')
    expect(translate('vi', 'fragmentList.delete')).toBe('Xóa')
    expect(translate('vi', 'fragmentList.uncategorized')).toBe('Chưa phân loại')
    expect(translate('vi', 'fragmentList.newFolder')).toBe('Thư mục mới')
    expect(translate('vi', 'fragmentList.importCharacterCard')).toBe('Nhập thẻ nhân vật')
    expect(translate('vi', 'fragmentList.importStandaloneLorebook')).toBe('Nhập lorebook độc lập')
    expect(translate('vi', 'fragmentList.importFromClipboardOrFile')).toBe('Nhập từ bộ nhớ tạm hoặc tệp')
    expect(translate('vi', 'fragmentList.createNewFragment')).toBe('Tạo fragment mới')
    expect(translate('vi', 'fragmentList.dropToArchive')).toBe('Thả để lưu trữ')
  })

  it('preserves branch scope, mutation payloads, drag ids, enums, default folder data, and dynamic values', () => {
    const source = readFileSync('src/components/fragments/FragmentList.tsx', 'utf8').replace(/\r\n/g, '\n')

    expect(source).toContain("type SortMode = 'name' | 'newest' | 'oldest' | 'order'")
    expect(source).toContain("const fragmentsQueryKey = ['fragments', storyId, branchId, type, allowedTypes?.join(',') ?? 'all']")
    expect(source).toContain('api.fragments.list(storyId, type, branchId)')
    expect(source).toContain('api.fragments.reorder(storyId, items)')
    expect(source).toContain('api.fragments.archive(storyId, fragmentId)')
    expect(source).toContain('api.folders.assignFragment(storyId, fragmentId, folderId)')
    expect(source).toContain('api.folders.reorder(storyId, items)')
    expect(source).toContain("createFolderMutation.mutate('New Folder')")
    expect(source).toContain("e.dataTransfer.setData('application/x-errata-fragment-id', id)")
    expect(source).toContain("e.dataTransfer.setData('application/x-errata-folder-id', folderId)")
    expect(source).toContain('{fragment.name}')
    expect(source).toContain('{fragment.id}')
    expect(source).toContain('{fragment.type}')
    expect(source).toContain('{folder.name}')
    expect(source).toContain('              sys')
  })
})
