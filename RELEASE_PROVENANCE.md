# Errata v1.0 — Release Provenance

This document is the canonical provenance record for the first curated release line of
`Mr-Ken-1102/errata`.

## Release identity

- Product name: **Errata v1.0**
- SemVer / package version: **1.0.0**
- Planned Git tag: **v1.0.0**
- Repository / curator: `Mr-Ken-1102/errata`
- Provenance prepared: **2026-09-22**
- License lineage: GPL-2.0, inherited from Errata upstream.

### Why this release is called v1.0

`v1.0` means **version 1 of the curated Mr-Ken-1102 distribution**, not version 1 of the
original Errata project. The codebase has older upstream release history and fork history,
all retained in Git. The version is intentionally reset so future releases of this curated
line can be numbered and audited independently.

The machine-readable version is `1.0.0` and the Git tag must be `v1.0.0`; the human-facing
release name may be displayed as **Errata v1.0**.

## Direct Git ancestry

### 1. Upstream base — tealios/errata

- Source / maintainer line: `tealios/errata`
- Upstream version: **v1.12.0**
- Upstream release/tag date: **2026-09-14**
- Commit: `610c7e7587fe334f0908dd2065f9be7c4761a0dc`
- Relationship: **direct ancestry / base commit**

The curated integration branch started from exactly this upstream commit. This is important:
`v1.0.0` does not erase or replace the upstream `v1.12.0` history; it starts a new downstream
numbering line on top of it.

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

The integration audit also examined Didact, Tointer, St5mesh and other Errata forks/branches.
They are **not claimed as direct code ancestry for v1.0 unless a concrete commit is already in
this repository's Git history**. In particular:

- Didact lifecycle/transport ideas informed the durable-run design, but Didact generation
  semantics were not made authoritative and no wholesale Didact branch/PR was merged.
- Tointer and St5mesh were audit/comparison inputs; no release component is attributed to
  them here without a concrete imported commit.

This distinction is deliberate: future maintainers should be able to separate inspiration or
comparative audit from actual source-code provenance.

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

## Validation lineage for the integrated source tree

Before release-prep, the integrated source tree passed:

- Full Vitest suite: 159 suites, 1,488 tests / 1,491 runs in the latest reporting format.
- App and desktop TypeScript checks.
- Architecture boundary checks.
- Production application build.
- Windows desktop packaging smoke, including `start.bat check`, Electron packaging,
  packaged sidecar verification, sidecar boot and HTTP 200 from `/api/health`.

Release-prep changes are intentionally isolated in a separate PR and must pass CI again before
merge and before tag creation.

## How to audit a future upgrade

When importing a newer upstream/fork version:

1. Record the source repository, branch/tag, exact commit SHA, package version and snapshot date.
2. Compare against the SHA recorded in this document, not only against a version label.
3. Classify each incoming area as direct merge, selective port, conceptual influence, rejected,
   or reverted.
4. Preserve the architectural invariants above.
5. Add new subsystem checkpoint commits and CI evidence here before publishing the next release.
6. Never overwrite this v1.0 provenance section; append a new release provenance section or a
   new versioned provenance document so historical traceability remains intact.

## Release-prep note

At the time this document was added, **no `v1.0.0` tag or GitHub Release had yet been created**.
The release must only be tagged from the final, reviewed master commit after release-prep is
merged and post-merge validation succeeds.
