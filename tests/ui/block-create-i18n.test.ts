import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { translate } from '@/lib/i18n'

describe('BlockCreateDialog localization', () => {
  it('provides Vietnamese fixed block-creation chrome', () => {
    expect(translate('vi', 'blockCreate.title')).toBe('Khối tùy chỉnh mới')
    expect(translate('vi', 'blockCreate.role')).toBe('Vai trò')
    expect(translate('vi', 'blockCreate.system')).toBe('Hệ thống')
    expect(translate('vi', 'blockCreate.user')).toBe('Người dùng')
    expect(translate('vi', 'blockCreate.create')).toBe('Tạo khối')
  })

  it('preserves persisted enum values, user content, and the JavaScript example verbatim', () => {
    const source = readFileSync('src/components/blocks/BlockCreateDialog.tsx', 'utf8')

    expect(source).toContain('name: name.trim(), role, type, content')
    expect(source).toContain("setRole('user')")
    expect(source).toContain("setType('simple')")
    expect(source).toContain("value: 'system' as const")
    expect(source).toContain("value: 'user' as const")
    expect(source).toContain("value: 'simple' as const")
    expect(source).toContain("value: 'script' as const")
    expect(source).toContain('return `Word count: ${ctx.proseFragments.reduce((n, f) => n + f.content.split(" ").length, 0)}`')
    expect(source).toContain('onChange={(e) => setContent(e.target.value)}')
  })
})
