import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { translate } from '@/lib/i18n'

describe('GenerationPanel localization', () => {
  it('provides Vietnamese fixed generation chrome', () => {
    expect(translate('vi', 'generationPanel.title')).toBe('Tạo nội dung')
    expect(translate('vi', 'generationPanel.debug')).toBe('Gỡ lỗi')
    expect(translate('vi', 'generationPanel.reconnecting')).toContain('Đang kết nối lại')
    expect(translate('vi', 'generationPanel.generateAndSave')).toBe('Tạo và lưu')
    expect(translate('vi', 'generationPanel.preview')).toBe('Xem trước')
  })

  it('preserves server-owned run, branch, clarification, cancellation, recovery, and IME semantics', () => {
    const source = readFileSync('src/components/generation/GenerationPanel.tsx', 'utf8')

    expect(source).toContain("if (event.type === 'generation-rejected')")
    expect(source).toContain('rejectionRef.current = event.reason')
    expect(source).toContain("if (event.type === 'error')")
    expect(source).toContain('setError(event.error)')
    expect(source).toContain("kind: 'generation'")
    expect(source).toContain('scopeId: SURFACE_ID')
    expect(source).toContain('recoverFullRunOnAttach: true')
    expect(source).toContain('clientRequestId')
    expect(source).toContain('clarifyRound: round')
    expect(source).toContain('...(branchId ? { branchId } : {})')
    expect(source).toContain('api.generation.generateAndSave(storyId, genInput, undefined, opts)')
    expect(source).toContain('api.generation.stream(storyId, genInput, undefined, opts)')
    expect(source).toContain("if (status === 'cancelled')")
    expect(source).toContain('void run.cancel()')
    expect(source).toContain('!event.nativeEvent.isComposing')
    expect(source).toContain('sessionStorage.setItem(contextStorageKey, JSON.stringify(context))')
    expect(source).toContain('sessionStorage.removeItem(contextStorageKey)')
  })
})
