// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { librarian } from '@/lib/api/librarian'
import { writePovCharacterId } from '@/lib/api/generation'

function runResponse(): Response {
  return new Response(
    '{"type":"run-start","runId":"run-1","kind":"librarian.prose-transform","status":"running","seq":0}\n'
      + '{"type":"run-end","status":"complete","seq":1}\n',
    { status: 200 },
  )
}

describe('branch-aware librarian POV client contract', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('sends the POV selected for the same timeline with prose transforms', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(runResponse())
    vi.stubGlobal('fetch', fetchSpy)

    writePovCharacterId('story-1', 'branch-a', 'ch-a')
    writePovCharacterId('story-1', 'branch-b', 'ch-b')

    await librarian.transformProseSelection(
      'story-1',
      'pr-1',
      'rewrite',
      'selected prose',
      {
        sourceContent: 'selected prose',
        branchId: 'branch-b',
      },
    )

    const init = fetchSpy.mock.calls[0][1] as RequestInit
    expect(JSON.parse(String(init.body))).toMatchObject({
      fragmentId: 'pr-1',
      selectedText: 'selected prose',
      operation: 'rewrite',
      branchId: 'branch-b',
      povCharacterId: 'ch-b',
    })
  })

  it('pins refinement requests to the caller timeline', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(runResponse())
    vi.stubGlobal('fetch', fetchSpy)

    await librarian.refine(
      'story-1',
      'ch-1',
      'Tighten the character sheet',
      { branchId: 'branch-alt' },
    )

    const init = fetchSpy.mock.calls[0][1] as RequestInit
    expect(JSON.parse(String(init.body))).toMatchObject({
      fragmentId: 'ch-1',
      instructions: 'Tighten the character sheet',
      branchId: 'branch-alt',
    })
  })

  it('sends POV only when a conversation is explicitly created with one', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({
        id: 'conv-1',
        title: 'New chat',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    ))
    vi.stubGlobal('fetch', fetchSpy)

    await librarian.createConversation('story-1', undefined, 'ch-maya')
    let init = fetchSpy.mock.calls.at(-1)?.[1] as RequestInit
    expect(JSON.parse(String(init.body))).toMatchObject({ povCharacterId: 'ch-maya' })

    await librarian.createConversation('story-1')
    init = fetchSpy.mock.calls.at(-1)?.[1] as RequestInit
    expect(JSON.parse(String(init.body))).not.toHaveProperty('povCharacterId')
  })

  it('branch-addresses librarian conversation reads and starts', async () => {
    const fetchSpy = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }))
      .mockResolvedValueOnce(runResponse())
    vi.stubGlobal('fetch', fetchSpy)

    await librarian.listConversations('story-1', 'branch-b')
    expect(String(fetchSpy.mock.calls[0][0])).toContain(
      '/stories/story-1/librarian/conversations?branch=branch-b',
    )

    await librarian.conversationChat(
      'story-1',
      'conv-1',
      'continue',
      'request-branch',
      'branch-b',
    )
    const init = fetchSpy.mock.calls[1][1] as RequestInit
    expect(JSON.parse(String(init.body))).toMatchObject({
      message: 'continue',
      clientRequestId: 'request-branch',
      branchId: 'branch-b',
    })
  })

  it('allows an explicit narrator transform without reusing stored POV', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(runResponse())
    vi.stubGlobal('fetch', fetchSpy)

    writePovCharacterId('story-1', 'branch-a', 'ch-a')
    await librarian.transformProseSelection(
      'story-1',
      'pr-1',
      'compress',
      'selected prose',
      {
        branchId: 'branch-a',
        povCharacterId: '',
      },
    )

    const init = fetchSpy.mock.calls[0][1] as RequestInit
    const body = JSON.parse(String(init.body)) as Record<string, unknown>
    expect(body.branchId).toBe('branch-a')
    expect(body).not.toHaveProperty('povCharacterId')
  })
})
