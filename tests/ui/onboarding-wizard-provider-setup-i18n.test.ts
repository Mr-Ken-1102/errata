import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { translate } from '@/lib/i18n'

describe('OnboardingWizard provider setup localization', () => {
  it('provides Vietnamese provider-setup chrome and fallbacks', () => {
    expect(translate('vi', 'onboarding.setup.allSet')).toBe('Mọi thứ đã sẵn sàng!')
    expect(translate('vi', 'onboarding.setup.customProvider')).toBe('Nhà cung cấp tùy chỉnh')
    expect(translate('vi', 'onboarding.setup.enterApiKey')).toBe('Nhập API key của bạn')
    expect(translate('vi', 'onboarding.setup.saveAndContinue')).toBe('Lưu và tiếp tục')
    expect(translate('vi', 'providers.fetchModelsFailed')).toBe('Không thể tải danh sách mô hình')
  })

  it('preserves credentials, model identities, server results, and provider API payloads', () => {
    const source = readFileSync('src/components/onboarding/OnboardingWizard.tsx', 'utf8')

    expect(source).toContain("const [apiKey, setApiKey] = useState('')")
    expect(source).toContain('const [baseURL, setBaseURL] = useState<string>(card.baseURL)')
    expect(source).toContain('const [defaultModel, setDefaultModel] = useState<string>(card.defaultModel)')
    expect(source).toContain("const [name, setName] = useState<string>(card.name || '')")
    expect(source).toContain('api.config.addProvider(data)')
    expect(source).toContain('api.config.testModels({ baseURL, apiKey, preset, customHeaders: cardHeaders })')
    expect(source).toContain('setFetchError(result.error)')
    expect(source).toContain('setFetchedModels(result.models)')
    expect(source).toContain('setDefaultModel(result.models[0].id)')
    expect(source).toContain('api.config.testConnection({')
    expect(source).toContain('model: defaultModel')
    expect(source).toContain('customHeaders: cardHeaders')
    expect(source).toContain('setTestResult(result)')
    expect(source).toContain('const providerName = name || card.name || preset')
    expect(source).toContain('name: providerName')
    expect(source).toContain('{m.id}')
    expect(source).toContain("{m.owned_by ? ` (${m.owned_by})` : ''}")
    expect(source).toContain('onClick={() => setDefaultModel(m)}')
    expect(source).toContain('{fetchError}')
    expect(source).toContain('{testResult.reply}')
    expect(source).toContain('{testResult.error}')
    expect(source).toContain('addMutation.error instanceof Error ? addMutation.error.message')
    expect(source).toContain('placeholder="https://api.example.com/v1"')
  })
})
