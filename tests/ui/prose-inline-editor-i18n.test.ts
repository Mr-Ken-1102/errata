import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { translate } from '@/lib/i18n'

describe('ProseInlineEditor localization', () => {
  it('provides Vietnamese fixed editor chrome', () => {
    expect(translate('vi', 'proseInlineEditor.editPassage')).toBe('Chỉnh sửa đoạn văn')
    expect(translate('vi', 'proseInlineEditor.saving')).toBe('ĐANG LƯU')
    expect(translate('vi', 'proseInlineEditor.shortcutHint')).toContain('CTRL+ENTER')
    expect(translate('vi', 'proseInlineEditor.cancel')).toBe('Hủy')
    expect(translate('vi', 'proseInlineEditor.save')).toBe('Lưu')
  })

  it('preserves draft/save/cancel, click-away, and Vietnamese IME semantics', () => {
    const source = readFileSync('src/components/prose/ProseInlineEditor.tsx', 'utf8')

    expect(source).toContain('const dirty = draft !== content')
    expect(source).toContain('if (!dirty) { onCancel(); return }')
    expect(source).toContain('onSave(draft)')
    expect(source).toContain('if (saving) return')
    expect(source).toContain('if (root && !root.contains(e.target as Node)) commitRef.current()')
    expect(source).toContain("if (e.key === 'Escape') { e.preventDefault(); onCancel(); return }")
    expect(source).toContain("!e.nativeEvent.isComposing")
    expect(source).toContain('value={draft}')
    expect(source).toContain('onChange={(e) => setDraft(e.target.value)}')
  })
})
