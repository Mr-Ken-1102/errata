import { describe, expect, it, vi } from 'vitest'
import { installAfterBackup } from '../../desktop/update-state'

describe('desktop update backup gate', () => {
  it('does not install when copying story data fails', async () => {
    const backup = vi.fn().mockRejectedValue(new Error('disk full'))
    const install = vi.fn()
    const result = await installAfterBackup(backup, install)
    expect(result).toEqual({ ok: false, stage: 'backup', reason: 'disk full' })
    expect(backup).toHaveBeenCalledOnce()
    expect(install).not.toHaveBeenCalled()
  })

  it('installs exactly once and only after a successful backup', async () => {
    const events: string[] = []
    const backup = vi.fn(async () => { events.push('backup') })
    const install = vi.fn(() => { events.push('install') })
    expect(await installAfterBackup(backup, install)).toEqual({ ok: true })
    expect(events).toEqual(['backup', 'install'])
    expect(install).toHaveBeenCalledOnce()
  })

  it('a newly initialized installation without any data can use a no-op backup', async () => {
    const backup = vi.fn(async () => {})
    const install = vi.fn()
    expect(await installAfterBackup(backup, install)).toEqual({ ok: true })
    expect(install).toHaveBeenCalledOnce()
  })

  it('reports installation startup errors without claiming the backup failed', async () => {
    const backup = vi.fn(async () => {})
    const install = vi.fn(() => { throw new Error('installer unavailable') })
    const result = await installAfterBackup(backup, install)
    expect(result).toEqual({ ok: false, stage: 'install', reason: 'installer unavailable' })
    expect(backup).toHaveBeenCalledOnce()
  })

  it('can be retried after a failed backup, without losing the data-safety gate', async () => {
    let attempts = 0
    const backup = vi.fn(async () => {
      attempts++
      if (attempts === 1) throw new Error('temporary backup error')
    })
    const install = vi.fn()
    expect((await installAfterBackup(backup, install)).ok).toBe(false)
    expect(install).not.toHaveBeenCalled()
    expect(await installAfterBackup(backup, install)).toEqual({ ok: true })
    expect(install).toHaveBeenCalledOnce()
  })

  it('supports non-Error failures without allowing installation', async () => {
    const install = vi.fn()
    expect(await installAfterBackup(async () => { throw 'access denied' }, install))
      .toEqual({ ok: false, stage: 'backup', reason: 'access denied' })
    expect(install).not.toHaveBeenCalled()
  })
})
