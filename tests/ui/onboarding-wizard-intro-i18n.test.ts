import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { translate } from '@/lib/i18n'

describe('OnboardingWizard introductory localization', () => {
  it('provides Vietnamese theme, typography, welcome, and provider-selection chrome', () => {
    expect(translate('vi', 'onboarding.themeQuestion')).toBe('Bạn thích đọc theo giao diện nào?')
    expect(translate('vi', 'onboarding.chooseTypeface')).toBe('Chọn kiểu chữ')
    expect(translate('vi', 'onboarding.getStarted')).toBe('Bắt đầu')
    expect(translate('vi', 'onboarding.chooseProvider')).toBe('Chọn nhà cung cấp')
    expect(translate('vi', 'onboarding.provider.deepseekDescription')).toContain('Nhanh')
  })

  it('preserves provider identities, URLs, models, headers, selection, and setup API payloads', () => {
    const source = readFileSync('src/components/onboarding/OnboardingWizard.tsx', 'utf8')

    expect(source).toContain("name: 'DeepSeek'")
    expect(source).toContain("baseURL: 'https://api.deepseek.com'")
    expect(source).toContain("defaultModel: 'deepseek-v4-flash'")
    expect(source).toContain("name: 'OpenAI'")
    expect(source).toContain("baseURL: 'https://api.openai.com/v1'")
    expect(source).toContain("defaultModel: 'gpt-5.2'")
    expect(source).toContain("name: 'Anthropic'")
    expect(source).toContain("baseURL: 'https://api.anthropic.com/v1'")
    expect(source).toContain("defaultModel: 'claude-opus-4-6'")
    expect(source).toContain("name: 'Google Gemini'")
    expect(source).toContain("baseURL: 'https://generativelanguage.googleapis.com/v1beta'")
    expect(source).toContain("defaultModel: 'gemini-3.5-flash'")
    expect(source).toContain("name: 'Kimi Code'")
    expect(source).toContain("baseURL: 'https://api.kimi.com/coding/v1'")
    expect(source).toContain("customHeaders: { 'User-Agent': 'claude-code/1.0' }")
    expect(source).toContain("name: 'OpenRouter'")
    expect(source).toContain("baseURL: 'https://openrouter.ai/api/v1'")
    expect(source).toContain("setTheme('light')")
    expect(source).toContain("setTheme('dark')")
    expect(source).toContain("setFont('prose', opt.name)")
    expect(source).toContain("setFont('display', opt.name)")
    expect(source).toContain('onClick={() => onSelect(key)}')
    expect(source).toContain('key={f.titleKey}')
    expect(source).toContain('{t(f.titleKey)}')
    expect(source).toContain('api.config.addProvider(data)')
    expect(source).toContain('api.config.testModels({ baseURL, apiKey, preset, customHeaders: cardHeaders })')
    expect(source).toContain('api.config.testConnection({')
    expect(source).toContain('name: providerName')
    expect(source).toContain('defaultModel,')
    expect(source).toContain('customHeaders: cardHeaders')
  })
})
