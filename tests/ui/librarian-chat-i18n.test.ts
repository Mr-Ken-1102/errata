import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { translate } from '@/lib/i18n'

describe('LibrarianChat localization', () => {
  it('provides Vietnamese fixed chat chrome', () => {
    expect(translate('vi', 'librarianChat.emptyHint')).toContain('Librarian')
    expect(translate('vi', 'librarianChat.reconnecting')).toContain('Đang kết nối lại')
    expect(translate('vi', 'librarianChat.placeholder')).toBe('Hỏi Librarian...')
    expect(translate('vi', 'librarianChat.stopLabel')).toBe('Dừng Librarian')
    expect(translate('vi', 'librarianChat.shortcutHint')).toContain('Shift+Enter')
  })

  it('preserves server-owned run identity, replay/cancel semantics, IME guard, and dynamic errors', () => {
    const source = readFileSync('src/components/librarian/LibrarianChat.tsx', 'utf8')

    expect(source).toContain("kind: 'librarian.chat'")
    expect(source).toContain('scopeId: conversationId ?? null')
    expect(source).toContain('autoAttach: historyReady')
    expect(source).toContain('api.librarian.conversationChat(')
    expect(source).toContain('api.librarian.chat(storyId, text, clientRequestId, branchId)')
    expect(source).toContain("&& !event.nativeEvent.isComposing")
    expect(source).toContain("if (status === 'cancelled') setError(null)")
    expect(source).toContain('onStop={() => { void run.cancel() }}')
    expect(source).toContain("return { role: 'user', content: message.content }")
    expect(source).toContain("case 'error':\n      return { ...message, error: event.error }")
    expect(source).toContain("sendError instanceof Error ? sendError.message : t('librarianChat.chatFailed')")
  })
})
