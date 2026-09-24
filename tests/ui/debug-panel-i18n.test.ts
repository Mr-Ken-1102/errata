import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { translate } from '@/lib/i18n'

describe('DebugPanel localization', () => {
  it('provides Vietnamese fixed debug chrome', () => {
    expect(translate('vi', 'debugPanel.title')).toBe('Gỡ lỗi')
    expect(translate('vi', 'debugPanel.generationLogs')).toBe('Nhật ký tạo nội dung')
    expect(translate('vi', 'debugPanel.noLogs')).toBe('Chưa có nhật ký')
    expect(translate('vi', 'debugPanel.collapseAll')).toBe('Thu gọn tất cả')
    expect(translate('vi', 'debugPanel.generatedText')).toBe('Văn bản đã tạo')
  })

  it('preserves log identities, technical enums, model data, rejection data, and tool payloads', () => {
    const source = readFileSync('src/components/generation/DebugPanel.tsx', 'utf8')

    expect(source).toContain("useState<'prompt' | 'prewriter-prompt' | 'tools' | 'output'>('prompt')")
    expect(source).toContain('qk.generationLogs(storyId, branchId)')
    expect(source).toContain('api.generation.listLogs(storyId)')
    expect(source).toContain('qk.generationLog(storyId, branchId, selectedLogId)')
    expect(source).toContain('api.generation.getLog(storyId, selectedLogId!)')
    expect(source).toContain('{selectedLog.model}')
    expect(source).toContain('{selectedLog.finishReason}')
    expect(source).toContain('{selectedLog.fragmentId}')
    expect(source).toContain('{selectedLog.rejectionReason}')
    expect(source).toContain('{log.input}')
    expect(source).toContain("function getToolKind(name: string): 'read' | 'write'")
    expect(source).toContain('if (r.error) return `error: ${r.error}`')
    expect(source).toContain('const argsStr = JSON.stringify(tc.args, null, 2)')
    expect(source).toContain('const resultStr = JSON.stringify(tc.result, null, 2)')
    expect(source).toContain('{tc.toolName}')
    expect(source).toContain('{summary}')
    expect(source).toContain('{kind}')
    expect(source).toContain('{log.prewriterReasoning}')
    expect(source).toContain('{log.prewriterBrief}')
    expect(source).toContain('{log.reasoning}')
    expect(source).toContain("{t('debugPanel.generatedText')}")
    expect(source).toContain("{log.generatedText.length.toLocaleString()} {t('debugPanel.chars')}")
    expect(source).toContain('content={log.generatedText}')
  })
})
