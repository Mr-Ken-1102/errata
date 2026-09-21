import { describe, expect, it } from 'vitest'
import { toLibrarianProviderMessages } from '@/server/routes/librarian'
import type { ChatHistoryMessage } from '@/server/librarian/storage'

describe('toLibrarianProviderMessages', () => {
  it('never emits empty assistant content', () => {
    const history: ChatHistoryMessage[] = [
      { role: 'user', content: 'do a thing' },
      { role: 'assistant', content: '', status: 'complete' },
      { role: 'user', content: 'and another' },
    ]
    const sent = toLibrarianProviderMessages(history)
    expect(sent.every(message => message.content.trim().length > 0)).toBe(true)
    expect(sent[1].content).toContain('No reply was recorded')
  })

  it('replays edits that already landed', () => {
    const history: ChatHistoryMessage[] = [
      { role: 'user', content: 'update Alice' },
      {
        role: 'assistant',
        content: '',
        status: 'complete',
        toolCalls: [{
          toolName: 'updateFragment',
          args: { id: 'ch-alice' },
          result: { ok: true },
        }],
      },
    ]
    const sent = toLibrarianProviderMessages(history)
    expect(sent[1].content).toContain('Already applied this turn')
    expect(sent[1].content).toContain('updateFragment')
    expect(sent[1].content).toContain('ch-alice')
  })

  it('marks interrupted turns and truncates giant arguments', () => {
    const history: ChatHistoryMessage[] = [
      { role: 'user', content: 'rewrite it' },
      {
        role: 'assistant',
        content: 'Partial.',
        status: 'error',
        error: 'interrupted',
        toolCalls: [{
          toolName: 'editFragments',
          args: { content: 'x'.repeat(5000) },
          result: { ok: true },
        }],
      },
    ]
    const sent = toLibrarianProviderMessages(history)
    expect(sent[1].content).toContain('ended early')
    expect(sent[1].content).toContain('…')
    expect(sent[1].content.length).toBeLessThan(800)
  })
})
