import { describe, expect, it } from 'vitest'
import { normalizeOpenAICompatibleBaseURL } from '@/server/config/provider-urls'

describe('normalizeOpenAICompatibleBaseURL', () => {
  it('adds /v1 to an unversioned API root', () => {
    expect(normalizeOpenAICompatibleBaseURL('http://localhost:11434/'))
      .toBe('http://localhost:11434/v1')
  })

  it('preserves an existing v1 endpoint while trimming trailing slashes', () => {
    expect(normalizeOpenAICompatibleBaseURL('http://localhost:11434/v1/'))
      .toBe('http://localhost:11434/v1')
  })

  it('preserves other numeric API versions', () => {
    expect(normalizeOpenAICompatibleBaseURL('https://api.example.com/v4'))
      .toBe('https://api.example.com/v4')
  })
})
