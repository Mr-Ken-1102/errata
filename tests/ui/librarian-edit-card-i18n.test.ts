import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { translate } from '@/lib/i18n'

describe('LibrarianEditCard localization', () => {
  it('provides Vietnamese fixed edit-card chrome', () => {
    expect(translate('vi', 'librarianEdit.changeOne')).toBe('thay đổi fragment')
    expect(translate('vi', 'librarianEdit.undone')).toBe('Đã hoàn tác')
    expect(translate('vi', 'librarianEdit.undoFailed')).toBe('Hoàn tác thất bại')
    expect(translate('vi', 'librarianEdit.created')).toBe('đã tạo')
    expect(translate('vi', 'librarianEdit.edited')).toBe('đã chỉnh sửa')
    expect(translate('vi', 'librarianEdit.archived')).toBe('đã lưu trữ')
  })

  it('preserves revert semantics and dynamic fragment/diff data', () => {
    const source = readFileSync('src/components/chat/LibrarianEditCard.tsx', 'utf8')

    expect(source).toContain('api.fragments.revertApplied(storyId, result.appliedChanges ?? [])')
    expect(source).toContain("queryKey: ['fragments', storyId]")
    expect(source).toContain('const name = nameById.get(change.fragmentId) ?? change.fragmentId')
    expect(source).toContain('{name}')
    expect(source).toContain('{diff.field}')
    expect(source).toContain('diffRows(diff.before, diff.after)')
    expect(source).toContain("if (op.status !== 'applied') continue")
    expect(source).toContain('const fragmentId = op.createdFragmentId ?? op.target?.fragmentId')
  })
})
