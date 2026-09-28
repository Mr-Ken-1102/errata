import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  binaryPatternForPlatform,
  runInstructionsForPlatform,
} from '../../scripts/package-binary-utils.ts'

const read = (path: string) => readFileSync(path, 'utf8')

describe('P2.1 reproducible toolchain', () => {
  it('pins the package manager and compatible Vite/Nitro toolchain', () => {
    const pkg = JSON.parse(read('package.json')) as {
      packageManager?: string
      engines?: { node?: string }
      dependencies: Record<string, string>
      devDependencies: Record<string, string>
    }

    expect(pkg.packageManager).toBe('bun@1.4.2')
    expect(pkg.engines?.node).toBe('>=22.12.0')
    expect(pkg.dependencies.nitro).toBe(
      'npm:nitro-nightly@3.0.1-20260821-003948-5e7235e6',
    )
    expect(pkg.dependencies.nitro).not.toContain('@latest')
    expect(pkg.devDependencies.vite).toBe('7.3.6')
  })

  it('tracks an authoritative Bun lockfile', () => {
    expect(existsSync('bun.lock')).toBe(true)

    const ignored = read('.gitignore')
      .split(/\r?\n/)
      .map((line) => line.trim())
    expect(ignored).not.toContain('bun.lock')

    const lock = read('bun.lock')
    expect(lock).toContain(
      '"nitro": ["nitro-nightly@3.0.1-20260821-003948-5e7235e6"',
    )
    expect(lock).toContain('"peerDependencies": { "vite": "^7 || ^8" }')
    expect(lock).toContain('"vite": ["vite@7.3.6"')
  })

  it('pins Bun in every release-critical GitHub Actions setup step', () => {
    const smoke = read('.github/workflows/windows-desktop-smoke.yml')
    const workflows = [
      '.github/workflows/vitest.yml',
      '.github/workflows/windows-desktop-smoke.yml',
      '.github/workflows/release-binary.yml',
      '.github/workflows/desktop-release.yml',
    ].map(read).join('\n')

    expect(workflows.match(/uses: oven-sh\/setup-bun@v2/g)).toHaveLength(6)
    expect(workflows.match(/bun-version: 1\.4\.2/g)).toHaveLength(6)
    expect(
      workflows.match(
        /ref: \$\{\{ github\.event\.pull_request\.head\.sha \|\| github\.sha \}\}/g,
      ),
    ).toHaveLength(6)
    expect(workflows).toContain('bun install --frozen-lockfile')
    expect(smoke).toContain('- bun.lock')
  })

  it('makes the Windows launchers honor the pinned dependency graph', () => {
    const start = read('start.bat')
    const setup = read('scripts/setup.ps1')
    const legacyRun = read('run.bat')

    expect(start).toContain('set "ERRATA_BUN_VERSION=1.4.2"')
    expect(start).toContain('install --frozen-lockfile')
    expect(start).toContain('if not exist "bun.lock"')
    expect(start).not.toContain('.errata-deps-ready')
    expect(start).not.toContain(':dependencies_current')

    expect(setup).toContain("$BunVersion = '1.4.2'")
    expect(setup).toContain('& $installer -Version $BunVersion')
    expect(setup).toContain('bun install --frozen-lockfile')
    expect(legacyRun).toContain('Use start.bat for automatic pinned Bun setup')
    expect(legacyRun).toContain('pause >nul')
  })

  it('packages the host binary on Windows and Unix-like systems', () => {
    const windows = binaryPatternForPlatform('win32')
    const linux = binaryPatternForPlatform('linux')
    const mac = binaryPatternForPlatform('darwin')

    expect(windows.test('errata.exe')).toBe(true)
    expect(windows.test('errata-123.exe')).toBe(true)
    expect(windows.test('errata')).toBe(false)

    expect(linux.test('errata')).toBe(true)
    expect(linux.test('errata-123')).toBe(true)
    expect(linux.test('errata.exe')).toBe(false)
    expect(mac.test('errata')).toBe(true)

    expect(runInstructionsForPlatform('win32', 'errata.exe')).toEqual([
      '  .\\errata.exe',
    ])
    expect(runInstructionsForPlatform('linux', 'errata')).toEqual([
      '  chmod +x errata',
      '  ./errata',
    ])

    const source = read('scripts/package-binary.mjs')
    expect(source).toContain('binaryPatternForPlatform(process.platform)')
    expect(source).toContain('runInstructionsForPlatform(process.platform, binaryName)')
  })
})
