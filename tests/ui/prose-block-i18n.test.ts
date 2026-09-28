import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { translate } from '@/lib/i18n'

describe('ProseBlock localization', () => {
  it('provides Vietnamese fixed passage chrome', () => {
    expect(translate('vi', 'proseBlock.analyzedByLibrarian')).toBe('Đã được Librarian phân tích')
    expect(translate('vi', 'proseBlock.splitFromHere')).toBe('Tách nhánh từ đây')
    expect(translate('vi', 'proseBlock.removeConfirmTitle')).toBe('Xóa đoạn văn này?')
    expect(translate('vi', 'proseBlock.analyze')).toBe('Phân tích')
    expect(translate('vi', 'proseBlock.reverting')).toBe('Đang hoàn tác...')
  })

  it('preserves generation prompt, run identity, branch pinning, rejection, variation, archive, librarian, TTS, and IME semantics', () => {
    const source = readFileSync('src/components/prose/ProseBlock.tsx', 'utf8')

    expect(source).toContain("const quickRegenerateInput = generatedFrom || fragment.description?.trim() || ''")
    expect(source).toContain('const result = await startAndConsumeRun(')
    expect(source).toContain('(clientRequestId) => api.generation.regenerate(')
    expect(source).toContain('{ clientRequestId, ...(branchId ? { branchId } : {}) }')
    expect(source).toContain('{ branchId },')
    expect(source).toContain("if (event.type === 'generation-rejected')")
    expect(source).toContain('rejection = event.reason')
    expect(source).toContain("if (rejection || result.status === 'error' || result.status === 'cancelled')")
    expect(source).toContain('if (await runRegeneration(quickRegenerateInput))')
    expect(source).toContain('if (await runRegeneration(actionInput))')
    expect(source).toContain('api.proseChain.switchVariation(storyId, sectionIndex, fragmentId)')
    expect(source).toContain('api.proseChain.removeSection(storyId, sectionIndex)')
    expect(source).toContain('!e.nativeEvent.isComposing')
    expect(source).toContain('onAskLibrarian(fragment.id, `refine ${fragment.id}: `, { capturePov: true })')
    expect(source).toContain('onAskLibrarian(fragment.id)')
    expect(source).toContain('onAnalyze(fragment.id)')
    expect(source).toContain('playFragment(fragment.id, fragment.content, fragment.name, ttsSettings)')
    expect(source).toContain('stopTts()')
    expect(source).toContain('copyText(fragment.id)')
    expect(source).toContain('onBranchFrom(sectionIndex)')
    expect(source).toContain('onSelect(fragment)')
    expect(source).toContain('onDebugLog(fragment.id)')
  })

  it('preserves inline passage update and revert payloads', () => {
    const source = readFileSync('src/components/prose/ProseBlock.tsx', 'utf8')
    expect(source).toContain('api.fragments.update(storyId, fragment.id, {')
    expect(source).toContain('name: fragment.name')
    expect(source).toContain('description: fragment.description')
    expect(source).toContain('content,')
    expect(source).toContain('api.fragments.revert(storyId, fragment.id)')
  })
})
