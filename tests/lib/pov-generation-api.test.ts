// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  generation,
  readPovCharacterId,
  writePovCharacterId,
} from '@/lib/api/generation'

describe('branch-local generation POV preference', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('isolates the selected character between sibling timelines', () => {
    writePovCharacterId('story-1', 'branch-a', 'ch-a')
    writePovCharacterId('story-1', 'branch-b', 'ch-b')

    expect(readPovCharacterId('story-1', 'branch-a')).toBe('ch-a')
    expect(readPovCharacterId('story-1', 'branch-b')).toBe('ch-b')
    expect(readPovCharacterId('story-1', undefined)).toBeUndefined()

    writePovCharacterId('story-1', 'branch-a', undefined)
    expect(readPovCharacterId('story-1', 'branch-a')).toBeUndefined()
    expect(readPovCharacterId('story-1', 'branch-b')).toBe('ch-b')
  })

  it('automatically attaches only the POV selected for the request branch', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(new Response(
      '{"type":"run-end","status":"complete","seq":0}\n',
      { status: 200 },
    ))
    vi.stubGlobal('fetch', fetchSpy)

    writePovCharacterId('story-1', 'branch-a', 'ch-a')
    writePovCharacterId('story-1', 'branch-b', 'ch-b')

    await generation.generateAndSave('story-1', 'Continue', undefined, {
      branchId: 'branch-b',
      clientRequestId: 'request-1',
    })

    const init = fetchSpy.mock.calls[0][1] as RequestInit
    expect(JSON.parse(String(init.body))).toMatchObject({
      input: 'Continue',
      saveResult: true,
      branchId: 'branch-b',
      clientRequestId: 'request-1',
      povCharacterId: 'ch-b',
    })
  })

  it('allows an explicit narrator override without leaking the stored selection', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(new Response(
      '{"type":"run-end","status":"complete","seq":0}\n',
      { status: 200 },
    ))
    vi.stubGlobal('fetch', fetchSpy)

    writePovCharacterId('story-1', 'branch-a', 'ch-a')
    await generation.stream('story-1', 'Continue', undefined, {
      branchId: 'branch-a',
      povCharacterId: '',
    })

    const init = fetchSpy.mock.calls[0][1] as RequestInit
    const body = JSON.parse(String(init.body)) as Record<string, unknown>
    expect(body.branchId).toBe('branch-a')
    expect(body).not.toHaveProperty('povCharacterId')
  })
})
