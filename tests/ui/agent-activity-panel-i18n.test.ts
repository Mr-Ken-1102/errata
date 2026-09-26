import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { translate } from '@/lib/i18n'

describe('AgentActivityPanel localization', () => {
  it('provides Vietnamese fixed activity chrome', () => {
    expect(translate('vi', 'agentActivity.queued')).toBe('Đang chờ')
    expect(translate('vi', 'agentActivity.idle')).toBe('Nhàn rỗi')
    expect(translate('vi', 'agentActivity.runs')).toBe('Lượt chạy agent')
    expect(translate('vi', 'agentActivity.noActivity')).toBe('Chưa có hoạt động')
    expect(translate('vi', 'agentActivity.reasoning')).toBe('Lập luận')
    expect(translate('vi', 'agentActivity.liveTrace')).toBe('Dấu vết trực tiếp')
  })

  it('preserves agent metadata, technical statuses, errors, ids, and live-stream semantics', () => {
    const source = readFileSync('src/components/agents/AgentActivityPanel.tsx', 'utf8')

    expect(source).toContain('getAgentMeta(leadName).status')
    expect(source).toContain('{run.status}')
    expect(source).toContain('{node.status}')
    expect(source).toContain('{status.lastError}')
    expect(source).toContain('{fragmentId}')
    expect(source).toContain('api.librarian.listAgentRuns(storyId)')
    expect(source).toContain('api.agents.streamActivity(storyId, agentName)')
    expect(source).toContain('readerRef.current?.cancel().catch(() => {})')
    expect(source).toContain("if (ev.type === 'reasoning')")
    expect(source).toContain("collapsed.push({ kind: 'tool-call', toolName: ev.toolName, args: ev.args })")
    expect(source).toContain("collapsed.push({ kind: 'tool-error', toolName: ev.toolName, error: ev.error })")
    expect(source).toContain('{item.toolName}: {item.error}')
  })
})
