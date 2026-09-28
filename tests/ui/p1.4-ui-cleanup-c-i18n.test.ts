import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { translate } from '../../src/lib/i18n'

describe('P1.4-C final UI localization cleanup', () => {
  it('localizes ErrataNet license presentation while preserving license machine values', () => {
    const publish = readFileSync('src/components/erratanet/PublishPackDialog.tsx', 'utf8')
    const share = readFileSync('src/components/erratanet/ShareAgentConfigDialog.tsx', 'utf8')

    expect(translate('vi', 'erratanet.license.cc0')).toBe('CC0 1.0 (miền công cộng)')
    expect(translate('vi', 'erratanet.license.ccBy')).toBe('CC BY 4.0 (ghi công)')
    expect(translate('vi', 'erratanet.license.ccBySa')).toBe('CC BY-SA 4.0 (chia sẻ tương tự)')
    expect(translate('vi', 'erratanet.license.ccByNc')).toBe('CC BY-NC 4.0 (phi thương mại)')
    expect(translate('vi', 'erratanet.license.proprietary')).toBe('Độc quyền (bảo lưu mọi quyền)')

    expect(publish).toContain("{ value: 'CC0-1.0', labelKey: 'erratanet.license.cc0' }")
    expect(publish).toContain("{ value: 'CC-BY-4.0', labelKey: 'erratanet.license.ccBy' }")
    expect(publish).toContain("{ value: 'CC-BY-SA-4.0', labelKey: 'erratanet.license.ccBySa' }")
    expect(publish).toContain("{ value: 'CC-BY-NC-4.0', labelKey: 'erratanet.license.ccByNc' }")
    expect(publish).toContain("{ value: 'proprietary', labelKey: 'erratanet.license.proprietary' }")
    expect(publish).toContain('{t(l.labelKey)}')
    expect(share).toContain('{t(l.labelKey)}')
    expect(publish).not.toContain("label: 'CC0 1.0 (public domain)'")
    expect(share).not.toContain("label: 'CC0 1.0 (public domain)'")
  })

  it('keeps content-rating machine values while removing dead English presentation metadata', () => {
    const publish = readFileSync('src/components/erratanet/PublishPackDialog.tsx', 'utf8')

    expect(publish).toContain("const CONTENT_RATINGS: ContentRating[] = ['general', 'mature', 'r18']")
    expect(publish).toContain("value === 'general' ? t('erratanet.publish.ratingGeneral')")
    expect(publish).toContain("t('erratanet.publish.ratingGeneralHint')")
    expect(publish).not.toContain("label: 'General'")
    expect(publish).not.toContain("hint: 'Suitable for everyone.'")
  })

  it('localizes timeline prompt and local run-stream fallbacks without translating real runtime errors', () => {
    const prose = readFileSync('src/components/prose/ProseChainView.tsx', 'utf8')
    const runStream = readFileSync('src/hooks/use-run-stream.ts', 'utf8')

    expect(prose).toContain("window.prompt(t('timeline.namePlaceholder'))")
    expect(prose).not.toContain("window.prompt('Timeline name:')")

    expect(translate('vi', 'runStream.timelineLoading')).toBe('Dòng thời gian vẫn đang tải')
    expect(translate('vi', 'runStream.noLongerAvailable')).toBe('Lần tạo nội dung này không còn khả dụng')
    expect(translate('vi', 'runStream.requestFailed')).toBe('Yêu cầu thất bại')
    expect(runStream).toContain('useOptionalTranslation()')
    expect(runStream).toContain("throw new Error(t('runStream.timelineLoading'))")
    expect(runStream).toContain("settle('error', t('runStream.noLongerAvailable'))")
    expect(runStream).toContain("err instanceof Error ? err.message : t('runStream.requestFailed')")
    expect(runStream).toContain("settle('error', event.error)")
  })
})
