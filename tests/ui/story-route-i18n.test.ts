import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { translate } from '@/lib/i18n'

describe('story route localization', () => {
  it('provides Vietnamese fixed story-route chrome', () => {
    expect(translate('vi', 'storyRoute.loading')).toBe('Đang tải truyện...')
    expect(translate('vi', 'storyRoute.characterChat')).toBe('Trò chuyện nhân vật')
    expect(translate('vi', 'storyRoute.dropFile')).toBe('Thả tệp để nhập')
    expect(translate('vi', 'storyRoute.importAgentConfig')).toBe('Nhập cấu hình agent')
    expect(translate('vi', 'storyRoute.importFailed')).toBe('Nhập thất bại')
  })

  it('preserves storage keys, import routing, dynamic agent identity, and config payloads', () => {
    const source = readFileSync('src/routes/story.$storyId.tsx', 'utf8')

    expect(source).toContain("`errata:plugin-sidebar:${storyId}`")
    expect(source).toContain("const OUTLINE_OPEN_KEY = 'errata:passages-panel-open'")
    expect(source).toContain("localStorage.setItem(OUTLINE_OPEN_KEY, outlineOpen ? '1' : '0')")
    expect(source).toContain('parseErrataExport(text)')
    expect(source).toContain('parseCardJson(text)')
    expect(source).toContain('parseSillyTavernLorebook(text)')
    expect(source).toContain('isTavernCardPng(buffer)')
    expect(source).toContain('extractParsedCard(cardBuffers[0])')
    expect(source).toContain('AgentBlockConfigSchema.safeParse(json.config)')
    expect(source).toContain('agentName: json.agentName')
    expect(source).toContain("displayName: typeof json.displayName === 'string' ? json.displayName : undefined")
    expect(source).toContain('config: parsed.data')
    expect(source).toContain('pendingAgentConfigImport?.displayName ?? pendingAgentConfigImport?.agentName')
    expect(source).toContain('const { agentName, config } = pendingAgentConfigImport')
    expect(source).toContain('await api.agentBlocks.importConfig(storyId, agentName, config)')
    expect(source).toContain("queryClient.invalidateQueries({ queryKey: ['agent-blocks', storyId, agentName] })")
    expect(source).toContain('error instanceof Error ? error.message')
    expect(source).toContain("setMainView('character-chat')")
    expect(source).toContain("setMainView('prose')")
  })
})
