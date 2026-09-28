import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { translate } from '@/lib/i18n'

describe('CropDialog localization', () => {
  it('provides Vietnamese fixed crop chrome', () => {
    expect(translate('vi', 'cropDialog.title')).toBe('Vùng cắt')
    expect(translate('vi', 'cropDialog.instruction')).toBe('Nhấp và kéo để chọn vùng cắt')
    expect(translate('vi', 'cropDialog.reset')).toBe('Đặt lại')
    expect(translate('vi', 'cropDialog.cancel')).toBe('Hủy')
    expect(translate('vi', 'cropDialog.applyCrop')).toBe('Áp dụng vùng cắt')
    expect(translate('vi', 'cropDialog.noCrop')).toBe('Không cắt')
  })

  it('preserves crop geometry, dynamic image data, and apply semantics', () => {
    const source = readFileSync('src/components/fragments/CropDialog.tsx', 'utf8')

    expect(source).toContain('const MIN_SIZE = 0.02')
    expect(source).toContain('x: Math.round(boundary.x * 1000) / 1000')
    expect(source).toContain('y: Math.round(boundary.y * 1000) / 1000')
    expect(source).toContain('width: Math.round(boundary.width * 1000) / 1000')
    expect(source).toContain('height: Math.round(boundary.height * 1000) / 1000')
    expect(source).toContain('onApply(undefined)')
    expect(source).toContain('onOpenChange(false)')
    expect(source).toContain('alt={imageName}')
    expect(source).toContain('— {imageName}')
    expect(source).toContain('setBoundary(initialBoundary ?? null)')
    expect(source).toContain("if (dragMode === 'create')")
  })
})
