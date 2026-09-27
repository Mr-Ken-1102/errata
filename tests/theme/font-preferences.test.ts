import { describe, expect, it } from 'vitest'
import {
  DEFAULT_FONTS,
  FONT_CATALOGUE,
  VIETNAMESE_DEFAULT_FONTS,
  getActiveFont,
  getDefaultFontForLanguage,
} from '@/lib/theme'

describe('font preferences', () => {
  it('keeps the existing English defaults', () => {
    expect(DEFAULT_FONTS).toEqual({
      display: 'Instrument Serif',
      prose: 'Newsreader',
      sans: 'Outfit',
      mono: 'JetBrains Mono',
    })
  })

  it('uses Vietnamese-capable defaults for Vietnamese UI', () => {
    expect(VIETNAMESE_DEFAULT_FONTS).toEqual({
      display: 'Newsreader',
      prose: 'Newsreader',
      sans: 'Inter',
      mono: 'JetBrains Mono',
    })
    expect(getDefaultFontForLanguage('display', 'vi')).toBe('Newsreader')
    expect(getDefaultFontForLanguage('sans', 'vi')).toBe('Inter')
    expect(getDefaultFontForLanguage('display', 'en')).toBe('Instrument Serif')
    expect(getDefaultFontForLanguage('sans', 'en')).toBe('Outfit')
  })

  it('uses locale defaults only when the user has not selected a font', () => {
    expect(getActiveFont('sans', {}, 'vi')).toBe('Inter')
    expect(getActiveFont('display', {}, 'vi')).toBe('Newsreader')
    expect(getActiveFont('sans', { sans: 'Comfortaa' }, 'vi')).toBe('Comfortaa')
    expect(getActiveFont('display', { display: 'Comfortaa' }, 'vi')).toBe('Comfortaa')
  })

  it('offers Comfortaa only in roles where it is appropriate', () => {
    expect(FONT_CATALOGUE.display.map(font => font.name)).toContain('Comfortaa')
    expect(FONT_CATALOGUE.sans.map(font => font.name)).toContain('Comfortaa')
    expect(FONT_CATALOGUE.prose.map(font => font.name)).not.toContain('Comfortaa')
    expect(FONT_CATALOGUE.mono.map(font => font.name)).not.toContain('Comfortaa')
  })

  it('offers Inter as a selectable interface font', () => {
    expect(FONT_CATALOGUE.sans.map(font => font.name)).toContain('Inter')
  })
})
