import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { translate } from '@/lib/i18n'

describe('BlockContentView localization', () => {
  it('provides Vietnamese fixed context-block chrome', () => {
    expect(translate('vi', 'blockContent.empty')).toBe('Không có khối nào trong ngữ cảnh')
    expect(translate('vi', 'blockContent.tools')).toBe('Công cụ')
    expect(translate('vi', 'blockContent.chars')).toBe('ký tự')
    expect(translate('vi', 'blockContent.enabled')).toBe('đang bật')
    expect(translate('vi', 'blockContent.disabled')).toBe('đã tắt')
  })

  it('preserves marker parsing and dynamic block/tool data verbatim', () => {
    const source = readFileSync('src/components/blocks/BlockContentView.tsx', 'utf8')

    expect(source).toContain('msg.content.split(/\\[@block=([^\\]]+)\\]\\n?/)') 
    expect(source).toContain('const srcMatch = marker.match(/^(.+?)\\s+src=(.+)$/)')
    expect(source).toContain('segments.push({ id: srcMatch[2], name: srcMatch[1], role: msg.role, content })')
    expect(source).toContain('segments.push({ id: marker, name: marker, role: msg.role, content })')
    expect(source).toContain('{group.role}')
    expect(source).toContain('{block.name}')
    expect(source).toContain('{seg.name}')
    expect(source).toContain('{seg.id}')
    expect(source).toContain('{seg.role}')
    expect(source).toContain('{seg.content}')
    expect(source).toContain('tools?.filter((tool) => tool.enabled)')
    expect(source).toContain("t('blockContent.enabled')")
    expect(source).toContain('{tool.name}')
    expect(source).toContain('{tool.description}')
    expect(source).toContain("const TOOLS_BLOCK_ID = '__tools__'")
  })
})
