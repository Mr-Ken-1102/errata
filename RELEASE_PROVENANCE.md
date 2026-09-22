# Errata v1.0 — Release Provenance

This document is the canonical provenance record for the first curated release line of
`Mr-Ken-1102/errata`.

## Release identity

- Product name: **Errata v1.0**
- SemVer / package version: **1.0.0**
- Canonical Git tag: **v1.0.0**
- Release date: **2026-09-22**
- Repository / curator: `Mr-Ken-1102/errata`
- Provenance prepared and closed: **2026-09-22**
- Pre-tag reviewed `master` checkpoint before this final metadata closeout: `426eca8551544b12ad8641509a8fab36e327060b`
- License lineage: GPL-2.0, inherited from Errata upstream.

The `v1.0.0` tag itself is the authoritative pointer to the final release commit once created.
This document deliberately records the last reviewed pre-tag checkpoint rather than predicting
its own eventual tagged commit SHA before the tag exists.

### Why this release is called v1.0

`v1.0` means **version 1 of the curated Mr-Ken-1102 distribution**, not version 1 of the
original Errata project. The codebase has older upstream release history and fork history,
all retained in Git. The version is intentionally reset so future releases of this curated
line can be numbered and audited independently.

The machine-readable version is `1.0.0` and the Git tag must be `v1.0.0`; the human-facing
release name may be displayed as **Errata v1.0**.

## Curated distribution identity and isolation

The curated v1.x line is intentionally a separate desktop distribution even though the visible
product name remains `Errata`.

- Stable desktop application ID: `io.github.mrken1102.errata`
- Previous inherited Viscerous ID: `com.viscerous.errata` — **not used by curated v1.0**
- Desktop user-data root: `<OS appData>/Mr-Ken-1102/Errata`
- Desktop session-data root: `<OS appData>/Mr-Ken-1102/Errata/session`
- Story data under desktop: `<userData>/data`
- Windows default install directory: `%LOCALAPPDATA%\Programs\Mr-Ken-1102\Errata`
- Update provider: GitHub `Mr-Ken-1102/errata`
- Stable update metadata channel: `latest`
- Prerelease auto-update policy: **disabled by default**
- Downgrade policy: **disabled**

The application ID and data namespace are release invariants from v1.0 onward. They must not be
changed casually because doing so would break desktop upgrade identity or move users to another
data namespace.

There is intentionally **no automatic migration or move** from upstream/Viscerous desktop data
in v1.0. Import/migration, if added later, must be explicit, copy-safe, reversible and separately
tested. This prevents the first curated release from silently taking ownership of another
Errata distribution's data.

## Direct Git ancestry

### 1. Upstream base — tealios/errata

- Source / maintainer line: `tealios/errata`
- Upstream version: **v1.12.0**
- Upstream release/tag date: **2026-09-14**
- Commit: `610c7e7587fe334f0908dd2065f9be7c4761a0dc`
- Relationship: **direct ancestry / base commit**

The curated integration branch started from exactly this upstream commit. `v1.0.0` does not
erase or replace the upstream `v1.12.0` history; it starts a new downstream numbering line on
top of it.

### 2. Best-of integration — Mr-Ken-1102/errata PR #2

- Curator / integration owner: `Mr-Ken-1102`
- Integration branch: `integration/best-of-errata-2026-09`
- Base: `610c7e7587fe334f0908dd2065f9be7c4761a0dc`
- Final validated integration HEAD: `58d254a7400f635a530af8912a477ca6780179bb`
- Integration PR: **#2 — WIP: best-of Errata integration**
- PR created: **2026-09-21**
- PR merged: **2026-09-22**
- Merge commit: `332d3f25a89fca529dfe6cdae9431860c44a8269`
- Integrated commits reported by GitHub: **448**
- Changed files reported by GitHub: **447**
- Relationship: **direct merge into master after owner authorization**

The merge commit has two parents: upstream/base `610c7e...` and validated integration HEAD
`58d254a...`. This makes the complete integration lineage recoverable from Git alone.

## External fork/source provenance

The table below distinguishes direct ancestry from selective ports and conceptual influence.
A source listed here must not be interpreted as a wholesale branch merge unless explicitly
stated.

| Source / author line | Audited version/snapshot | Snapshot date | What entered this curated line | Integration method |
| --- | --- | --- | --- | --- |
| `tealios/errata` | tag `v1.12.0`, commit `610c7e7587fe334f0908dd2065f9be7c4761a0dc` | 2026-09-14 | Upstream application base and all upstream history through v1.12.0 | **Direct Git ancestry** |
| `Viscerous/errata` (Viscerous) | package `1.11.0-vis.1`; `main` tip `88048bd97291dde42db7b1d2159c5d892deb3c60` | 2026-09-04 | Continuity/context/generation semantics used as the authoritative behavioral baseline; selected Librarian/generation lineage retained during integration | **Selective integration / semantic baseline; not a claim that the entire source tip was merged wholesale** |
| `pax-co/errata` (pax-co) | package `1.11.0`; branch `fork-features` tip `0a4b157d388fd5c1cc96c490d117e1d2ff8f84ae` | 2026-08-26 | POV and character Voice concepts/implementation adapted onto branch-aware, server-owned-run architecture | **Selective port; no wholesale cherry-pick of the branch** |
| `ivanlisovyi/errata` (Ivan Lisovyi / lisovyi.ivan) | package `1.7.0`; `perf/lazy-load-google-fonts` commit `1813d37cdcdb7cca90682ac3d1547f81c3993b96` | 2026-02-23 | Lazy font catalogue/loading idea and selected low-risk performance work | **Selective port/adaptation** |
| `ivanlisovyi/errata` | `perf/lazy-load-story-route` tip `133d5233b051124cc42026c72dfbfed799410ad5` | 2026-02-23 | Explicit story-route lazy split was evaluated in this project, measured, and then reverted because it did not improve the current build | **Audited/tested, NOT retained** |
| `ivanlisovyi/errata` | `perf/optimize-disk-storage` tip `a12be67cc991c74ae1aadb2d8327832b713ade3d` | 2026-02-23 | Disk/index ideas were audited; only low-risk caching/parallel-read ideas were retained. Persistent fragment/log indexing was intentionally not ported where consistency risk was unacceptable | **Partial conceptual/selective adoption; risky persistent index NOT merged** |

### Sources audited but not directly merged

These sources are recorded separately so future audits can distinguish "examined" from "code
ancestry".

| Source | Release-readiness baseline | Package version | Result |
| --- | --- | --- | --- |
| `Tointer/errata-md` | `master` `82aca32c12643232f8af5f6458526f207c1ff712`, 2026-09-21 | `1.12.0` | Audit/comparison input; no component is claimed as direct v1.0 ancestry without a concrete imported commit |
| `St5mesh/errata` | `master` `e050ddfbccf397b5dd4f2342e0518a05ab80aae1`, 2026-05-09 | `1.7.0` | Audit/comparison input; no component is claimed as direct v1.0 ancestry without a concrete imported commit |
| Didact source used during architecture comparison | **Historical source coordinates were not preserved with enough evidence to assert a repository/SHA/version here** | unknown | Durable lifecycle/transport ideas informed design; no wholesale branch/PR was merged and Didact generation semantics are not authoritative |

The Didact row is deliberately explicit about missing coordinates rather than inventing a SHA.
Before any future Didact-derived upgrade, the source repository/branch must be re-identified and
a fresh baseline SHA recorded first.

## Major integration checkpoints in this repository

These commits are useful anchors when auditing or upgrading individual subsystems later.

| Area | Commit | Date | Meaning |
| --- | --- | --- | --- |
| Durable run/generation milestone | `0f4602e570e9079e7a185dcaed455f84af9de549` | 2026-09-22 | Generation/server-owned-run milestone reached green CI after contract/race fixes |
| Story Presets hardening | `c1eda09a666799a6af651d47c076e60ee52e9dff` | 2026-09-22 | Self-contained preset reference graph and duplicate-ID hardening |
| POV/Voice validation checkpoint | `5cc8b43df7772f01e64224e7b72a26838606261b` | 2026-09-22 | Branch/IME validation checkpoint in the POV/Voice integration phase |
| Active-branch cache safety | `e8c426b90980769e3195065378b13c7cc0d21db8` | 2026-09-22 | Corrected cache seeding so migration cannot cache without story identity |
| Vietnamese IME production fix | `0eb9d1dcf802d698946e3c45f568c20788361760` | 2026-09-22 | Guarded Fragment tag/ref Enter actions during IME composition |
| Final integration test HEAD | `58d254a7400f635a530af8912a477ca6780179bb` | 2026-09-22 | Final IME regression coverage; source tree validated before merge |
| Best-of merge to master | `332d3f25a89fca529dfe6cdae9431860c44a8269` | 2026-09-22 | PR #2 merge commit; canonical post-integration master before release-prep |
| Final release-prep HEAD | `a66846cfb9dc403f36dff5775d521036636b5a11` | 2026-09-22 | PR #4 final validated head after Windows installer-location hardening |
| Release-prep merge to master | `d73b1f305a69ada9ec05121e8faccb4251ef8d1c` | 2026-09-22 | PR #4 merge checkpoint; tree exactly matches the validated release-prep HEAD |
| Provenance closeout merge to master | `426eca8551544b12ad8641509a8fab36e327060b` | 2026-09-22 | PR #5 documentation-only merge; final reviewed pre-tag master checkpoint before release-date closeout |

## Architectural decisions that must survive future upgrades

Future upstream/fork merges must preserve these invariants unless an explicit architecture
migration is separately designed, reviewed and tested:

1. The server owns authoritative run identity.
2. Browser/HTTP disconnect is **not** model cancellation.
3. Explicit Stop aborts the engine and must never commit partial prose.
4. Reconnect, replay, cancel and lost-POST recovery remain pinned to story branch/timeline.
5. Generation keeps the validated continuity/context/output-validation/save/Librarian semantics.
6. Chat persistence is keyed by server run identity, not a last-message heuristic.
7. Vietnamese IME composition must not trigger Enter/Ctrl+Enter actions prematurely.
8. Story Presets remain copy-isolated and self-contained with safe reference remapping.
9. Curated desktop identity remains `io.github.mrken1102.errata` and the curated user-data
   namespace remains isolated from other Errata distributions.
10. Stable users are not opted into prerelease updates or version downgrades by default.

## Deliberately rejected or reverted integrations

These are recorded so a future upgrade does not accidentally reintroduce already-evaluated
risk or complexity:

- Explicit lazy story-route split: tested and reverted after no measurable bundle benefit.
- Wholesale persistent fragment/index storage optimization: not ported because of consistency,
  migration, collision, locking and branch-semantics risk.
- Wholesale `pax-co/fork-features` cherry-pick: not done; POV/Voice was ported selectively.
- Wholesale Didact branch/PR merge: not done; lifecycle ideas only.
- Client-authoritative run IDs: rejected.
- Mapping network disconnect to model cancel: rejected.

## Validation lineage and release gates

Before release-prep, the integrated source tree passed:

- Full Vitest suite: 159 suites, 1,488 tests / 1,491 runs in the latest reporting format.
- App and desktop TypeScript checks.
- Architecture boundary checks.
- Production application build.
- Windows desktop packaging smoke, including `start.bat check`, Electron packaging,
  packaged sidecar verification, sidecar boot and HTTP 200 from `/api/health`.

PR #4 release-prep closed all pre-merge release gates on exact HEAD
`a66846cfb9dc403f36dff5775d521036636b5a11` (tree
`e8ada2f764d9e178562cf19fd582cec9c29343eb`):

1. **vitest #172** — run ID `35696996552` — **success**. Standard PR CI covered tests,
   app + desktop typecheck, architecture boundaries and production build.
2. **Windows desktop smoke #34** — run ID `35696996566` — **success**. It validated
   `start.bat`, desktop typecheck, unpacked Windows packaging, packaged sidecar presence,
   sidecar boot and HTTP 200 from `/api/health`.
3. **Desktop release #3** — run ID `35696996558` — **success**. Non-publishing installer
   dry-runs passed on `windows-latest`, `ubuntu-latest` and `macos-latest`; the publish job
   was skipped as intended.
4. **Release Binary #3** — run ID `35696996573` — **success**. Non-publishing standalone
   archive dry-runs passed for Windows x64, Linux x64 and macOS ARM64; the publish job was
   skipped as intended.

PR #4 then merged to `master` as
`d73b1f305a69ada9ec05121e8faccb4251ef8d1c`. The merge commit has the same tree SHA
`e8ada2f764d9e178562cf19fd582cec9c29343eb` as the validated PR HEAD, so the merge itself
introduced no executable-source mutation.

Post-merge validation on that exact `master` merge commit also completed successfully:

- **vitest #173** — run ID `35697656773` — **success**.
- **Test Results #173** — run ID `35697833469` — **success**.

PR #5 then closed the documentation provenance record and merged to `master` as
`426eca8551544b12ad8641509a8fab36e327060b`. GitHub comparison confirms the changes from
PR #4's merge checkpoint to this pre-tag checkpoint are documentation-only
(`CHANGELOG.md` and `RELEASE_PROVENANCE.md`). Post-merge validation on that exact commit
completed successfully:

- **vitest #175** — run ID `35704076086` — **success**.
- **Test Results #176** — run ID `35704262595` — **success**.

Windows desktop smoke and the release dry-run workflows do not automatically run on a normal
`master` push; their validated PR #4 HEAD and the PR #4 merge commit are tree-identical for
executable source, and all changes after that checkpoint through PR #5 are documentation-only.
The release packaging evidence above therefore remains applicable to the executable source.

The immutable `v1.0.0` Git tag is the canonical pointer to the final reviewed release commit once
created. Tag creation by itself does not publish installers or standalone archives: the current
release workflows publish assets only on a GitHub `release: published` event, and they reject a
release whose tag version does not match `package.json` version `1.0.0`.

## How to audit a future upgrade

When importing a newer upstream/fork version:

1. Record the source repository, branch/tag, exact commit SHA, package version and snapshot date.
2. Compare against the SHA recorded in this document, not only against a version label.
3. Classify each incoming area as direct merge, selective port, conceptual influence, rejected,
   or reverted.
4. Preserve the architectural and desktop identity invariants above.
5. Add new subsystem checkpoint commits and CI evidence before publishing the next release.
6. Never overwrite this v1.0 provenance section; append a new release provenance section or a
   new versioned provenance document so historical traceability remains intact.

## Final pre-tag note

Release date metadata is locked to **2026-09-22**. At the start of this final metadata closeout,
`master` was `426eca8551544b12ad8641509a8fab36e327060b`, and both the `v1.0.0` tag and GitHub
Release were still absent by design. After this documentation-only closeout is reviewed, merged
and green on `master`, the next explicit action is to create the immutable `v1.0.0` tag from that
final reviewed `master` commit. Publishing the GitHub Release remains a separate owner-controlled
action after the tag is verified.
