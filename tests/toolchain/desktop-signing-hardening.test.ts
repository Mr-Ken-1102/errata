import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(path, 'utf8')

describe('desktop release signing hardening', () => {
  it('keeps unsigned validation separate from fail-closed release signing', () => {
    const base = read('electron-builder.yml')
    const unsigned = read('electron-builder.unsigned.yml')
    const release = read('electron-builder.release.yml')

    expect(base).not.toMatch(/^\s*identity:\s*null\s*$/m)
    expect(unsigned).toContain('extends: electron-builder.yml')
    expect(unsigned).toContain('identity: null')

    expect(release).toContain('extends: electron-builder.yml')
    expect(release).toContain('forceCodeSigning: true')
    expect(release).toContain('notarize: true')
  })

  it('selects signing policy from publication mode instead of silently falling back', () => {
    const source = read('scripts/build-electron.mjs')

    expect(source).toContain(
      "publishMode === 'never' ? 'electron-builder.unsigned.yml' : 'electron-builder.release.yml'",
    )
    expect(source).toContain("const builderArgs = ['electron-builder', '--config', builderConfig]")
  })

  it('requires dedicated Windows and macOS signing secrets before publication', () => {
    const workflow = read('.github/workflows/desktop-release.yml')

    for (const secret of [
      'WIN_CSC_LINK',
      'WIN_CSC_KEY_PASSWORD',
      'MAC_CSC_LINK',
      'MAC_CSC_KEY_PASSWORD',
      'APPLE_ID',
      'APPLE_APP_SPECIFIC_PASSWORD',
      'APPLE_TEAM_ID',
    ]) {
      expect(workflow).toContain(secret)
    }

    expect(workflow).toContain('Require Windows signing secrets')
    expect(workflow).toContain('Require macOS signing and notarization secrets')
    expect(workflow).toContain('CSC_LINK: ${{ secrets.MAC_CSC_LINK }}')
    expect(workflow).toContain('CSC_KEY_PASSWORD: ${{ secrets.MAC_CSC_KEY_PASSWORD }}')
  })

  it('verifies released desktop artifacts instead of trusting build success alone', () => {
    const workflow = read('.github/workflows/desktop-release.yml')

    expect(workflow).toContain('Get-AuthenticodeSignature')
    expect(workflow).toContain("if ($signature.Status -ne 'Valid')")
    expect(workflow).toContain('codesign --verify --deep --strict --verbose=2')
    expect(workflow).toContain('spctl --assess --verbose --type exec')
    expect(workflow).toContain('xcrun stapler validate')
  })

  it('keeps pull-request packaging explicitly unsigned and release packaging credentialed', () => {
    const workflow = read('.github/workflows/desktop-release.yml')

    expect(workflow).toContain('Build desktop installers without publishing')
    expect(workflow).toContain('bun run electron:dist')
    expect(workflow).toContain('Build and upload Windows desktop installer')
    expect(workflow).toContain('Build, sign, notarize, and upload macOS desktop artifacts')
    expect(workflow).toContain('Build and upload Linux desktop artifact')
  })
})
