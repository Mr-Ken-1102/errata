import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(path, 'utf8')

describe('desktop release signing policy', () => {
  it('keeps unsigned packaging available while preserving a signed release config', () => {
    const base = read('electron-builder.yml')
    const unsigned = read('electron-builder.unsigned.yml')
    const signed = read('electron-builder.release.yml')

    expect(base).not.toMatch(/^\s*identity:\s*null\s*$/m)
    expect(unsigned).toContain('extends: electron-builder.yml')
    expect(unsigned).toContain('identity: null')

    expect(signed).toContain('extends: electron-builder.yml')
    expect(signed).toContain('forceCodeSigning: true')
    expect(signed).toContain('notarize: true')
  })

  it('uses signed policy only when publication explicitly enables signing', () => {
    const source = read('scripts/build-electron.mjs')

    expect(source).toContain(
      "const signingEnabled = process.env.ERRATA_ENABLE_DESKTOP_SIGNING === '1'",
    )
    expect(source).toContain("publishMode !== 'never' && signingEnabled")
    expect(source).toContain("'electron-builder.release.yml'")
    expect(source).toContain("'electron-builder.unsigned.yml'")
    expect(source).toContain(
      'Desktop signing credentials are not configured; publishing unsigned desktop artifacts.',
    )
  })

  it('detects signing credentials without making them mandatory for personal releases', () => {
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

    expect(workflow).toContain('Detect optional desktop signing')
    expect(workflow).not.toContain('Require Windows signing secrets')
    expect(workflow).not.toContain('Require macOS signing and notarization secrets')
    expect(workflow).toContain('publishing unsigned installer')
    expect(workflow).toContain('publishing unsigned artifacts')
    expect(workflow).toContain('ERRATA_ENABLE_DESKTOP_SIGNING')
  })

  it('verifies signatures only when optional signing is enabled', () => {
    const workflow = read('.github/workflows/desktop-release.yml')

    expect(workflow).toContain(
      "if: runner.os == 'Windows' && steps.signing.outputs.enabled == '1'",
    )
    expect(workflow).toContain('Get-AuthenticodeSignature')
    expect(workflow).toContain("if ($signature.Status -ne 'Valid')")

    expect(workflow).toContain(
      "if: runner.os == 'macOS' && steps.signing.outputs.enabled == '1'",
    )
    expect(workflow).toContain('codesign --verify --deep --strict --verbose=2')
    expect(workflow).toContain('spctl --assess --verbose --type exec')
    expect(workflow).toContain('xcrun stapler validate')
  })

  it('keeps unsigned PR/local validation and unsigned release fallback explicit', () => {
    const workflow = read('.github/workflows/desktop-release.yml')

    expect(workflow).toContain('Build desktop installers without publishing')
    expect(workflow).toContain('bun run electron:dist')
    expect(workflow).toContain('Build and upload desktop artifacts')
    expect(workflow).toContain('intentionally published unsigned for personal/community distribution')
  })
})
