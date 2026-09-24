import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { translate } from '@/lib/i18n'

describe('ScriptBlockEditor localization', () => {
  it('provides Vietnamese fixed script-editor chrome', () => {
    expect(translate('vi', 'scriptBlock.output')).toBe('Đầu ra')
    expect(translate('vi', 'scriptBlock.showContext')).toBe('Hiện ngữ cảnh')
    expect(translate('vi', 'scriptBlock.fullContext')).toBe('Toàn bộ ngữ cảnh')
    expect(translate('vi', 'scriptBlock.fragmentReference')).toBe('Tham chiếu fragment')
    expect(translate('vi', 'scriptBlock.copyId')).toBe('Sao chép ID')
  })

  it('preserves script source, evaluation, save, preview routing, and fragment identities', () => {
    const source = readFileSync('src/components/blocks/ScriptBlockEditor.tsx', 'utf8')

    expect(source).toContain('api.blocks.evalScript(storyId, local)')
    expect(source).toContain('}, 400)')
    expect(source).toContain('if (id === requestIdRef.current)')
    expect(source).toContain('if (local !== savedRef.current)')
    expect(source).toContain('onSave(local)')
    expect(source).toContain('savedRef.current = local')
    expect(source).toContain('placeholder="return `...`"')
    expect(source).toContain("const previewAgentName = context?.type === 'agent'")
    expect(source).toContain('? context.agentName')
    expect(source).toContain(": 'generation.writer'")
    expect(source).toContain('api.agentBlocks.preview(storyId, previewAgentName)')
    expect(source).toContain('onSaveDirty()')
    expect(source).toContain('queryClient.invalidateQueries({ queryKey: previewQueryKey })')
    expect(source).toContain('await refetchPreview()')
    expect(source).toContain('{blockRole}')
    expect(source).toContain('<span>JavaScript</span>')
    expect(source).toContain('{blockId}')
    expect(source).toContain('messages={preview.messages}')
    expect(source).toContain('blocks={preview.blocks}')
    expect(source).toContain('q.fragments(storyId, branchId)')
    expect(source).toContain('f => ({ id: f.id, name: f.name, type: f.type })')
    expect(source).toContain('{type}')
    expect(source).toContain('{item.id}')
    expect(source).toContain('{item.name}')
    expect(source).toContain('copyText(id)')
  })
})
