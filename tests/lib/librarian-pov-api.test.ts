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
