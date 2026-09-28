import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { translate } from '@/lib/i18n'

describe('InlineGenerationInput localization', () => {
  it('provides Vietnamese fixed inline-generation chrome', () => {
    expect(translate('vi', 'inlineGeneration.freeform')).toBe('Tự do')
    expect(translate('vi', 'inlineGeneration.guided')).toBe('Có hướng dẫn')
    expect(translate('vi', 'inlineGeneration.compose')).toBe('Soạn trực tiếp')
    expect(translate('vi', 'inlineGeneration.suggestDirections')).toBe('Đề xuất hướng đi')
    expect(translate('vi', 'inlineGeneration.addSection')).toBe('Thêm phần')
  })

  it('preserves default generation instructions exactly', () => {
    const source = readFileSync('src/components/prose/InlineGenerationInput.tsx', 'utf8')

    expect(source).toContain("const DEFAULT_CONTINUE_INSTRUCTION = 'Continue the story naturally. Write the next scene, advancing the plot and developing characters.'")
    expect(source).toContain(`const DEFAULT_SCENE_SETTING_INSTRUCTION = "Continue the story without advancing the plot. Focus on atmosphere, internal thoughts, sensory details, or character moments. Don't introduce new events or move the story forward."`)
    expect(source).toContain('handleGenerateWithInput(story?.settings.guidedContinuePrompt || DEFAULT_CONTINUE_INSTRUCTION)')
    expect(source).toContain('handleGenerateWithInput(story?.settings.guidedSceneSettingPrompt || DEFAULT_SCENE_SETTING_INSTRUCTION)')
  })

  it('preserves server-owned run, branch, clarification, recovery, cancellation, compose, suggestion, and IME semantics', () => {
    const source = readFileSync('src/components/prose/InlineGenerationInput.tsx', 'utf8')

    expect(source).toContain('const FORCE_PROCEED_ROUND = 99')
    expect(source).toContain("`errata:generation:context:${storyId}:${branchId ?? ''}:inline-generation`")
    expect(source).toContain("kind: 'generation'")
    expect(source).toContain("scopeId: 'inline-generation'")
    expect(source).toContain('recoverFullRunOnAttach: true')
    expect(source).toContain('await run.start((clientRequestId) => api.generation.generateAndSave(')
    expect(source).toContain('clarifyRound: round')
    expect(source).toContain('clientRequestId,')
    expect(source).toContain('...(branchId ? { branchId } : {})')
    expect(source).toContain("if (event.type === 'generation-rejected')")
    expect(source).toContain('rejectionReasonRef.current = event.reason')
    expect(source).toContain('setError(event.error)')
    expect(source).toContain('void handleGenerateWithInput(generationInput, clarifications, FORCE_PROCEED_ROUND)')
    expect(source).toContain('void run.cancel()')
    expect(source).toContain("type: 'prose'")
    expect(source).toContain("meta: { generationMode: 'manual' }")
    expect(source).toContain('api.proseChain.addSection(storyId, fragment.id)')
    expect(source).toContain('api.generation.proposeDirections(storyId)')
    expect(source).toContain('setManualSuggestions(result.suggestions)')
    expect(source).toContain('handleGenerateWithInput(s.instruction)')
    expect(source).toContain('setInput(s.instruction)')
    expect(source).toContain('{s.title}')
    expect(source).toContain('{s.description}')
    expect(source.match(/!e\.nativeEvent\.isComposing/g)?.length).toBe(2)
  })

  it('uses a translation ref so language changes do not alter run callback dependencies', () => {
    const source = readFileSync('src/components/prose/InlineGenerationInput.tsx', 'utf8')
    expect(source).toContain('const tRef = useRef(t)')
    expect(source).toContain('tRef.current = t')
    expect(source).toContain("tRef.current('inlineGeneration.failed')")
  })
})
