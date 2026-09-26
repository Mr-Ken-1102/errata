import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { translate } from '@/lib/i18n'

describe('ContextOrderPanel localization', () => {
  it('provides Vietnamese fixed context-order chrome', () => {
    expect(translate('vi', 'contextOrder.empty')).toContain('Không có fragment nào được ghim')
    expect(translate('vi', 'contextOrder.dragHint')).toContain('Kéo để sắp xếp lại')
    expect(translate('vi', 'contextOrder.moveToUserMessage')).toBe('Chuyển sang tin nhắn người dùng')
    expect(translate('vi', 'contextOrder.moveToSystemMessage')).toBe('Chuyển sang tin nhắn hệ thống')
  })

  it('preserves placement enums, ordering payload, API identity, and dynamic fragment data', () => {
    const source = readFileSync('src/components/fragments/ContextOrderPanel.tsx', 'utf8').replace(/\r\n/g, '\n')

    expect(source).toContain('api.fragments.setPlacement(storyId, fragmentId, placement)')
    expect(source).toContain("placement: fragment.placement === 'system' ? 'user' : 'system'")
    expect(source).toContain('settingsMutation.mutate({ fragmentOrder: newOrder })')
    expect(source).toContain('{fragment.name}')
    expect(source).toContain('{fragment.id}')
    expect(source).toContain('{fragment.type}')
    expect(source).toContain('\n                      sys\n')
  })
})
