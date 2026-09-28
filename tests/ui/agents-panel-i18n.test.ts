import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { translate } from '@/lib/i18n'

describe('AgentsPanel localization', () => {
  it('provides Vietnamese tab labels', () => {
    expect(translate('vi', 'agentsPanel.configure')).toBe('Cấu hình')
    expect(translate('vi', 'agentsPanel.activity')).toBe('Hoạt động')
  })

  it('preserves internal tab values and child-panel wiring', () => {
    const source = readFileSync('src/components/agents/AgentsPanel.tsx', 'utf8')

    expect(source).toContain("useState<'activity' | 'configure'>('configure')")
    expect(source).toContain("setTab(v as 'activity' | 'configure')")
    expect(source).toContain('<TabsTrigger value="configure"')
    expect(source).toContain('<TabsTrigger value="activity"')
    expect(source).toContain('<TabsContent value="activity"')
    expect(source).toContain('<TabsContent value="configure"')
    expect(source).toContain('<AgentActivityPanel storyId={storyId} />')
    expect(source).toContain('<AgentConfigurePanel storyId={storyId} />')
  })
})
