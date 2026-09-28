import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { translate } from '@/lib/i18n'

describe('RefinementPanel localization', () => {
  it('provides Vietnamese fixed refinement chrome', () => {
    expect(translate('vi', 'refinement.title')).toBe('Tinh chỉnh')
    expect(translate('vi', 'refinement.placeholder')).toContain('fragment này')
    expect(translate('vi', 'refinement.shortcutHint')).toContain('Ctrl+Enter')
    expect(translate('vi', 'refinement.stopped')).toContain('Đã dừng tinh chỉnh')
    expect(translate('vi', 'refinement.updated')).toBe('Đã cập nhật fragment')
  })

  it('preserves server-owned cancellation, branch pinning, dynamic errors, and IME guard', () => {
    const source = readFileSync('src/components/refinement/RefinementPanel.tsx', 'utf8')

    expect(source).toContain('api.librarian.refine(')
    expect(source).toContain('{ branchId }')
    expect(source).toContain('const result = await consumeRun(storyId, stream')
    expect(source).toContain('runIdRef.current = event.runId')
    expect(source).toContain('void api.runs.cancel(storyId, event.runId, branchId)')
    expect(source).toContain('void api.runs.cancel(storyIdRef.current, runId, branchIdRef.current)')
    expect(source).toContain("if (result.status === 'cancelled')")
    expect(source).toContain("result.error ?? t('refinement.failed')")
    expect(source).toContain("err instanceof Error ? err.message : t('refinement.failed')")
    expect(source).toContain('!e.nativeEvent.isComposing')
    expect(source).toContain('{fragmentName}')
  })
})
