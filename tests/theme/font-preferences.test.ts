import { describe, expect, it } from 'vitest'
import {
  DEFAULT_FONTS,
  FONT_CATALOGUE,
  VIETNAMESE_DEFAULT_FONTS,
  getActiveFont,
  getDefaultFontForLanguage,
  getRecommendedFontWeight,
} from '@/lib/theme'

describe('font preferences', () => {
  it('uses Comfortaa as the default UI and display family', () => {
    expect(DEFAULT_FONTS).toEqual({
      display: 'Comfortaa',
      prose: 'Newsreader',
      sans: 'Comfortaa',
      mono: 'JetBrains Mono',
    })
    expect(VIETNAMESE_DEFAULT_FONTS).toEqual(DEFAULT_FONTS)

    expect(getDefaultFontForLanguage('display', 'en')).toBe('Comfortaa')
    expect(getDefaultFontForLanguage('sans', 'en')).toBe('Comfortaa')
    expect(getDefaultFontForLanguage('display', 'vi')).toBe('Comfortaa')
    expect(getDefaultFontForLanguage('sans', 'vi')).toBe('Comfortaa')
  })

  it('keeps purpose-built Vietnamese-capable defaults for prose and code', () => {
    expect(getDefaultFontForLanguage('prose', 'vi')).toBe('Newsreader')
    expect(getDefaultFontForLanguage('mono', 'vi')).toBe('JetBrains Mono')
  })

  it('uses locale defaults only when the user has not selected a font', () => {
    expect(getActiveFont('sans', {}, 'vi')).toBe('Comfortaa')
    expect(getActiveFont('display', {}, 'vi')).toBe('Comfortaa')
    expect(getActiveFont('prose', {}, 'vi')).toBe('Newsreader')
    expect(getActiveFont('sans', { sans: 'Inter' }, 'vi')).toBe('Inter')
    expect(getActiveFont('prose', { prose: 'Comfortaa' }, 'vi')).toBe('Comfortaa')
  })

  it('uses slightly heavier Comfortaa weights without changing other families', () => {
    expect(getRecommendedFontWeight('display', 'Comfortaa')).toBe(600)
    expect(getRecommendedFontWeight('sans', 'Comfortaa')).toBe(500)
    expect(getRecommendedFontWeight('prose', 'Comfortaa')).toBe(500)
    expect(getRecommendedFontWeight('sans', 'Inter')).toBe(400)
    expect(getRecommendedFontWeight('prose', 'Newsreader')).toBe(400)
  })

  it('offers Comfortaa for display, interface, and optional prose, but not mono', () => {
    expect(FONT_CATALOGUE.display.map(font => font.name)).toContain('Comfortaa')
    expect(FONT_CATALOGUE.sans.map(font => font.name)).toContain('Comfortaa')
    expect(FONT_CATALOGUE.prose.map(font => font.name)).toContain('Comfortaa')
    expect(FONT_CATALOGUE.mono.map(font => font.name)).not.toContain('Comfortaa')
  })

  it('keeps Inter available as an alternate interface font', () => {
    expect(FONT_CATALOGUE.sans.map(font => font.name)).toContain('Inter')
  })
})
