import { describe, expect, it } from 'vitest'
import { normalizeOpenAICompatibleBaseURL } from '@/server/config/provider-urls'

describe('normalizeOpenAICompatibleBaseURL', () => {
  it('preserves an unversioned API root', () => {
    expect(normalizeOpenAICompatibleBaseURL('http://localhost:11434'))
      .toBe('http://localhost:11434')
  })

  it('trims whitespace and trailing slashes without adding a version', () => {
    expect(normalizeOpenAICompatibleBaseURL('  http://localhost:11434///  '))
      .toBe('http://localhost:11434')
  })

  it('preserves an explicit v1 API root', () => {
    expect(normalizeOpenAICompatibleBaseURL('http://localhost:11434/v1/'))
      .toBe('http://localhost:11434/v1')
  })

  it('preserves other explicit API versions', () => {
    expect(normalizeOpenAICompatibleBaseURL('https://api.example.com/v4/'))
      .toBe('https://api.example.com/v4')
  })
})
