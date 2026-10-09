# Errata v1.0.1 — Maintenance release

**Release type:** Stable maintenance update
**Tag:** `v1.0.1`
**Version:** `1.0.1`
**Based on:** Errata v1.0.0 plus the post-audit fixes merged via [PR #50](https://github.com/Mr-Ken-1102/errata/pull/50).

## What's fixed

- **Safer desktop updates:** Errata now refuses to start an update installation if the required story-data backup fails. It shows the failure and allows trying again after resolving the issue.
- **More reproducible builds:** Synchronized generated route definitions and introduced checks to detect drift during Linux and Windows builds.
- **Accurate release history:** Corrected changelog and source provenance to reflect the actual v1.0.0 release.

No new application features, data format changes, or account requirements are included in v1.0.1.

## Downloads

Choose the asset for your operating system under the GitHub Release:

- **Windows desktop installer:** `Errata-1.0.1-windows-x64.exe` (installs the desktop application)
- **Windows standalone ZIP:** `errata-1.0.1-windows-x64.zip` (extract and run; no desktop installer)
- **Linux:** desktop AppImage and standalone ZIP
- **macOS:** desktop DMG/ZIP and standalone ARM64 ZIP

Existing v1.0.0 builds are left untouched.

## Installation and existing stories

On Windows, use the v1.0.1 installer to update an existing curated Errata desktop installation. The curated installation path and user-data identity are unchanged.

**Recommended precaution:** Make an independent copy/export of your important story data before upgrading; automatic backup protection is not a substitute for an independent backup.

Windows and macOS desktop binaries are distributed without publisher code signing, as in v1.0.0. Windows SmartScreen and macOS Gatekeeper may display warnings. Only install files downloaded from this repository's official GitHub Release.

## Verification

This maintenance release must pass the exact-head PR test/build/packaging gates and both published release workflows before being considered complete. Verify `latest.yml`, `latest-mac.yml`, and `latest-linux.yml` against the published installer assets.
