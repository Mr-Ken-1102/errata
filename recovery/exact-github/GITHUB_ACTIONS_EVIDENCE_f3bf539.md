# GitHub Actions evidence preserved during recovery

Provenance: **EXACT-GITHUB metadata**, queried from GitHub Actions for pre-incident HEAD `f3bf53930a28b4c2c9e7c934e8491272fe5c6c88`.

## Workflow runs

### vitest
- run id: `36252326650`
- run number: `313`
- conclusion: `success`
- test job id: `108432546858`
- steps recorded successful:
  - Checkout
  - Setup Bun
  - Install dependencies
  - Run tests
  - Typecheck app and desktop
  - Check architectural boundaries
  - Build production application
  - Upload test artifacts

Exact job log has been copied to:
- `recovery/exact-github/ci-f3bf539-vitest-job.log`

### Windows desktop smoke
- run id: `36252326688`
- run number: `49`
- conclusion: `success`
- job id: `108432547102`
- steps recorded successful:
  - Validate start.bat
  - Install dependencies
  - Typecheck desktop
  - Package unpacked Windows desktop
  - Verify packaged server sidecar
  - Boot bundled server sidecar

Exact job log has been copied to:
- `recovery/exact-github/ci-f3bf539-windows-desktop-smoke.log`

## Still-live GitHub Actions artifact

Artifact:
- name: `vitest-results`
- artifact id: `10909137263`
- workflow run: `36252326650`
- head branch: `master-fix`
- head SHA: `f3bf53930a28b4c2c9e7c934e8491272fe5c6c88`
- size: `86259` bytes
- GitHub digest: `sha256:8627f99bd2bbf65d91fcd2815251d3be5ad6fb3197315de0b872f5d7d7974f94`
- created: `2026-09-26T15:35:00Z`
- expires: `2026-10-26T15:34:59Z`
- expired at recovery time: `false`

The downloaded archive was independently hash-checked during recovery:
- size: `86259` bytes
- SHA-256: `8627f99bd2bbf65d91fcd2815251d3be5ad6fb3197315de0b872f5d7d7974f94`
- archive member: `junit.xml`
- uncompressed member size: `998798` bytes

The artifact ZIP is currently retained by GitHub Actions and also exists as a temporary recovery download outside the damaged D: workspace. The exact job log is already permanent on the Recovery branch.

## Release-binary artifacts still retained by GitHub

Run `36252326785`, conclusion `success`, HEAD `f3bf539...`:

- Windows x64: artifact `10909612417`, 48,356,690 bytes, digest `sha256:d79df4a8c868755ef6d73ea08011e0989b854b12b55de304a42eb0e12fe147c9`
- Linux x64: artifact `10910080767`, 46,479,417 bytes, digest `sha256:73921f5354480a9130734955db580929795b5ee11c53edd43834fdb469373021`
- macOS arm64: artifact `10908894278`, 35,728,901 bytes, digest `sha256:3ec56a5e1091cbf6656383d725cd5846d4996daf6b091227fa7c5462dcc44606`

These binaries are not forensic priorities because they can be regenerated from the preserved source, but their IDs/digests are retained here as recovery evidence.
