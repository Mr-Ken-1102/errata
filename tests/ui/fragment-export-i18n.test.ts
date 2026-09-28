import React from 'react'
import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/i18n')>()
  return {
    ...actual,
    useLanguage: () => ({
      language: 'vi' as const,
      setLanguage: () => undefined,
      t: (key: Parameters<typeof actual.translate>[1]) => actual.translate('vi', key),
    }),
  }
})

vi.mock('@/lib/query-keys', () => ({
  useActiveBranchId: () => 'branch-main',
  q: {
    fragments: (...parts: unknown[]) => ({
      queryKey: ['fragments', ...parts],
      queryFn: async () => [],
    }),
  },
}))

vi.mock('@/components/erratanet/PublishPackDialog', () => ({
  PublishPackDialog: () => null,
}))

vi.mock('@/components/presets/SavePresetDialog', () => ({
  SavePresetDialog: () => null,
}))

import { FragmentExportPanel } from '@/components/fragments/FragmentExportPanel'

describe('FragmentExportPanel localization', () => {
  it('renders Vietnamese fixed export chrome in the empty state', () => {
    const client = new QueryClient()
    const html = renderToStaticMarkup(
      React.createElement(
        QueryClientProvider,
        { client },
        React.createElement(FragmentExportPanel, {
          storyId: 'story-1',
          storyName: 'Dynamic Story Name',
          onClose: () => undefined,
        }),
      ),
    )

    expect(html).toContain('Xuất fragment')
    expect(html).toContain('Chọn tất cả')
    expect(html).toContain('fragment khả dụng')
    expect(html).toContain('Không có fragment để xuất')
    expect(html).toContain('Bao gồm cấu hình ngữ cảnh')
    expect(html).toContain('Tải xuống .json')
    expect(html).toContain('Xuất bản pack')
    expect(html).toContain('Lưu thành preset')
    expect(html).toContain('Xuất bản truyện')
    expect(html).toContain('>Hủy</button>')
  })

  it('preserves serialization, filenames, dynamic fragment data, and publish payload wiring', () => {
    const source = readFileSync('src/components/fragments/FragmentExportPanel.tsx', 'utf8')

    expect(source).toContain('serializeFragment(selectedFragments[0], mediaById)')
    expect(source).toContain('serializeBundle(selectedFragments, mediaById, storyName, bundleConfigs)')
    expect(source).toContain('downloadExportFile(json, `errata-${safeName}.json`)')
    expect(source).toContain('downloadExportFile(json, `errata-${safeName}-${selectedFragments.length}.fragment-pack.json`)')
    expect(source).toContain('copyText(json)')
    expect(source).toContain("mode={publishMode ?? 'fragments'}")
    expect(source).toContain('storyName={storyName}')
    expect(source).toContain('{visual.label}')
    expect(source).toContain('{fragment.name}')
    expect(source).toContain('{fragment.id}')
  })
})
