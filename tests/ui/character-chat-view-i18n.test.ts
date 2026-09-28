import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { translate } from '@/lib/i18n'

describe('CharacterChatView localization', () => {
  it('provides Vietnamese fixed character-chat chrome', () => {
    expect(translate('vi', 'characterChat.view.loadFailed')).toBe('Không thể tải cuộc trò chuyện')
    expect(translate('vi', 'characterChat.view.selectCharacterToBegin')).toBe('Chọn một nhân vật để bắt đầu.')
    expect(translate('vi', 'characterChat.view.reconnecting')).toContain('Đang kết nối lại')
    expect(translate('vi', 'characterChat.view.stopTarget')).toBe('Dừng {target}')
    expect(translate('vi', 'characterChat.view.sendHint')).toContain('Shift+Enter')
  })

  it('preserves server-owned run identity, recovery, retry handoff, branch scope, and IME semantics', () => {
    const source = readFileSync('src/components/character-chat/CharacterChatView.tsx', 'utf8')

    expect(source).toContain("`errata:character-chat:active:${storyId}:${branchId ?? ''}`")
    expect(source).toContain("`errata:character-chat:pending:${storyId}:${branchId ?? ''}:${conversationIdToUse}`")
    expect(source).toContain("kind: 'character-chat'")
    expect(source).toContain('scopeId: conversationId')
    expect(source).toContain('autoAttach: !!conversationId && pendingFirstMessage === null')
    expect(source).toContain('sessionStorage.setItem(activeConversationStorageKey, conversation.id)')
    expect(source).toContain('sessionStorage.setItem(pendingMessageStorageKey(conversation.id), text)')
    expect(source).toContain('sessionStorage.getItem(pendingMessageStorageKey(conversation.id))')
    expect(source).toContain('sessionStorage.removeItem(pendingMessageStorageKey(conversation.id))')
    expect(source).toContain('await run.start((clientRequestId) =>')
    expect(source).toContain('api.characterChat.chat(')
    expect(source).toContain('clientRequestId,')
    expect(source).toContain('api.characterChat.createConversation(storyId, {')
    expect(source).toContain('storyPointFragmentId: storyPointId')
    expect(source).toContain('if (!conversationId || pendingFirstMessage === null) return')
    expect(source).toContain('!event.nativeEvent.isComposing')
    expect(source).toContain('void run.cancel()')
    expect(source).toContain('content: current.content + event.text')
    expect(source).toContain("reasoning: (current.reasoning ?? '') + event.text")
    expect(source).toContain('error: event.error')
    expect(source).toContain('{selectedCharacter.name}')
    expect(source).toContain('{selectedCharacter.description}')
  })

  it('uses a translation ref so language changes do not become first-send effect dependencies', () => {
    const source = readFileSync('src/components/character-chat/CharacterChatView.tsx', 'utf8')
    expect(source).toContain('const tRef = useRef(t)')
    expect(source).toContain('tRef.current = t')
    expect(source).toContain("tRef.current('characterChat.view.chatFailed')")
  })
})
