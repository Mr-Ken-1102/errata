import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { translate } from '@/lib/i18n'

describe('StoryWizard localization safety', () => {
  it('provides Vietnamese fixed story-setup chrome', () => {
    expect(translate('vi', 'storyWizard.title')).toBe('Định hình câu chuyện')
    expect(translate('vi', 'storyWizard.storyChecklist')).toBe('Danh sách kiểm tra truyện')
    expect(translate('vi', 'storyWizard.start.premise')).toBe('Một tiền đề')
    expect(translate('vi', 'storyWizard.openStory')).toBe('Mở truyện')
    expect(translate('vi', 'storyWizard.sendHint')).toContain('Shift+Enter')
  })

  it('preserves starter messages, checklist state, dynamic story data, send/stop/retry, and IME semantics', () => {
    const source = readFileSync('src/components/wizard/StoryWizard.tsx', 'utf8')

    expect(source).toContain("message: 'I have a premise, but it is still rough.'")
    expect(source).toContain("message: 'I want to begin with a character.'")
    expect(source).toContain("message: 'I have a scene I can picture.'")
    expect(source).toContain("message: 'I only have a mood or feeling so far.'")
    expect(source).toContain('onClick={() => send(point.message)}')
    expect(source).toContain('send(input)')
    expect(source).toContain("if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing)")
    expect(source).toContain('STORY_SETUP_CHECKLIST.map(definition =>')
    expect(source).toContain('checklistByKey.get(definition.key)')
    expect(source).toContain("item.status === 'covered'")
    expect(source).toContain("item.status !== 'missing'")
    expect(source).toContain('{item.note}')
    expect(source).toContain('{fragment.name}')
    expect(source).toContain('{fragment.type}')
    expect(source).toContain('{fragment.description}')
    expect(source).toContain('{fragment.content}')
  })
})
