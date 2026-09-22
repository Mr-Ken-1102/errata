import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

const read = (path: string) => readFileSync(path, 'utf-8')

describe('curated desktop release identity', () => {
  it('uses the v1 curated package version and a distribution-specific app id', () => {
    const pkg = JSON.parse(read('package.json')) as { version: string }
    const builder = read('electron-builder.yml')

    expect(pkg.version).toBe('1.0.0')
    expect(builder).toMatch(/^appId: io\.github\.mrken1102\.errata$/m)
    expect(builder).not.toContain('appId: com.viscerous.errata')
    expect(builder).toContain('include: build/installer.nsh')
  })

  it('isolates curated desktop data and Windows installation paths', () => {
    const main = read('desktop/main.ts')
    const installer = read('build/installer.nsh')

    expect(main).toContain("join(app.getPath('appData'), 'Mr-Ken-1102', 'Errata')")
    expect(main).toContain("app.setPath('userData', userData)")
    expect(main).toContain("app.setPath('sessionData', sessionData)")
    expect(main).toContain("app.setAppUserModelId(CURATED_APP_ID)")
    expect(installer).toContain('$LOCALAPPDATA\\Programs\\Mr-Ken-1102\\Errata')
  })

  it('keeps the stable updater off prerelease and downgrade channels', () => {
    const updater = read('desktop/updater.ts')

    expect(updater).toContain('autoUpdater.allowPrerelease = false')
    expect(updater).toContain('autoUpdater.allowDowngrade = false')
    expect(updater).not.toContain('autoUpdater.allowPrerelease = true')
    expect(updater).not.toContain("autoUpdater.channel = 'latest'")
  })

  it('supports non-publishing release dry-runs', () => {
    const desktopRelease = read('.github/workflows/desktop-release.yml')
    const binaryRelease = read('.github/workflows/release-binary.yml')

    for (const workflow of [desktopRelease, binaryRelease]) {
      expect(workflow).toContain('workflow_dispatch:')
      expect(workflow).toContain('pull_request:')
      expect(workflow).toContain("if: github.event_name != 'release'")
    }

    expect(binaryRelease).toContain('actions/upload-artifact@v4')
  })
})
