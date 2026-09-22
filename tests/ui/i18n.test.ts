import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  normalizeLanguage,
  persistLanguagePreference,
  readLanguagePreference,
  translate,
} from '../../src/lib/i18n'

describe('interface language preference', () => {
  it('defaults to English for missing or unsupported values', () => {
    expect(normalizeLanguage(null)).toBe(DEFAULT_LANGUAGE)
    expect(normalizeLanguage('fr')).toBe(DEFAULT_LANGUAGE)
    expect(normalizeLanguage('en')).toBe('en')
  })

  it('restores a saved Vietnamese preference', () => {
    const storage = {
      getItem: (key: string) => key === LANGUAGE_STORAGE_KEY ? 'vi' : null,
    }

    expect(readLanguagePreference(storage)).toBe('vi')
  })

  it('falls back to English when storage cannot be read', () => {
    const storage = {
      getItem: () => {
        throw new Error('storage blocked')
      },
    }

    expect(readLanguagePreference(storage)).toBe('en')
  })

  it('persists only the explicit interface preference', () => {
    const writes: Array<[string, string]> = []
    const storage = {
      setItem: (key: string, value: string) => writes.push([key, value]),
    }

    persistLanguagePreference('vi', storage)

    expect(writes).toEqual([[LANGUAGE_STORAGE_KEY, 'vi']])
  })
})

describe('translation fallback', () => {
  it('returns Vietnamese text when the key has a Vietnamese translation', () => {
    expect(translate('vi', 'settings.language.heading')).toBe('Ngôn ngữ')
  })

  it('falls back to the English source string when Vietnamese is intentionally absent', () => {
    expect(translate('vi', 'app.name')).toBe('Errata')
  })
})

describe('language UI wiring', () => {
  it('mounts one app-level language provider and exposes the selector through both settings surfaces', () => {
    const rootSource = readFileSync('src/routes/__root.tsx', 'utf8')
    const aboutSource = readFileSync('src/components/settings/AboutPanel.tsx', 'utf8')
    const storyLibrarySource = readFileSync('src/routes/index.tsx', 'utf8')
    const storySettingsSource = readFileSync('src/components/sidebar/SettingsPanel.tsx', 'utf8')

    expect(rootSource).toContain('<LanguageProvider>')
    expect(rootSource).toContain("localStorage.getItem('errata-language')")
    expect(aboutSource).toContain('useLanguage()')
    expect(aboutSource).toContain('<SegmentedControl')
    expect(storyLibrarySource).toContain('<AboutSection />')
    expect(storySettingsSource).toContain('<AboutSection />')
  })
})
