# Errata v1.0 — Release Provenance

This document is the canonical provenance record for the first curated release line of
`Mr-Ken-1102/errata`.

## Release identity

- Product name: **Errata v1.0**
- SemVer / package version: **1.0.0**
- Published Git tag: **v1.0.0**
- Repository / curator: `Mr-Ken-1102/errata`
- Provenance prepared: **2026-09-22**; release-readiness review refreshed: **2026-09-28**
- License lineage: GPL-2.0, inherited from Errata upstream.

### Why this release is called v1.0

`v1.0` means **version 1 of the curated Mr-Ken-1102 distribution**, not version 1 of the
original Errata project. The codebase has older upstream release history and fork history,
all retained in Git. The version is intentionally reset so future releases of this curated
line can be numbered and audited independently.

The machine-readable version is `1.0.0` and the Git tag must be `v1.0.0`; the human-facing
release name may be displayed as **Errata v1.0**.


## Verified publication record (2026-10-09)

The checkpoint below documents the **historical pre-publication review**; it no longer
represents the current GitHub release status. Publication was verified independently:

- Public release: [Errata v1.0](https://github.com/Mr-Ken-1102/errata/releases/tag/v1.0.0)
- Publication time: **2026-09-28 09:04:55 UTC**
- Published tag: **`v1.0.0`**, pointing to commit `ecbc97ce5bebc80d83a0ca27df83a312415886db`
- Released source tree: `e41cfc41dbd5cfc7607260cf0da83bbec70b6745`
- Assets: **13** (standalone/desktop installers and update metadata)
- Current `master` after the two post-release signing changes were reverted:
  `73a3b340c4c939b78e4dc841aa1d611ecc912e4f`, with **the same source tree**.
- The existing release tag and its assets remain unchanged. Signing/notarization
  experiments after publication were reverted; they are not part of the v1.0 tree.

## Historical curated release-candidate checkpoint (pre-publication)

The latest **functional** checkpoint before the P2.4 documentation/whitespace closeout is:

- Long-lived integration branch: `master-fix`
- Functional checkpoint: `0598aaa159290eefce122ca003b05067310267be`
- Functional tree: `5af5b559079de1a118b05281a0c7c9c727983235`
- Frozen comparison/default branch during P0-P2 work:
  `master @ 230b87878379ec0290b973fc3e747a63cbd3525b`
- Integration PR: **#12 — master-fix integration and validation**
- Package version: **1.0.0**
- Planned release tag: **v1.0.0**
- Tag status at this review: **not created**
- GitHub Release status at this review: **not published**

The P2.4 closeout changes release documentation and two whitespace-only test-file
hygiene defects; it does not intentionally change application behavior. The final
release commit is therefore established only after P2.4 exact-head validation,
expected-head merge into `master-fix`, Owner authorization of P3, and the required
post-merge validation on the default branch.

Upstream has continued after the audited v1.12.0 baseline. At the 2026-09-28
release-readiness review, `tealios/errata` `master` was observed at
`8c3db3a1572726e477f88d6ef3af8fd248fa1a4f`. That newer upstream state is
**not** silently merged or rebased into this v1.0 release scope.

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
| Vietnamese UI integration to master-fix | `2500e04` | 2026-09-27 | Integrated the audited Vietnamese UI work into the frozen `master-fix` development line |
| Story Setup reliability hardening | `40cd254` | 2026-09-27 | Merged structured-snapshot and stream-timing hardening after validation |
| Strict provider Base URL integration | `9a8d042` | 2026-09-27 | Merged explicit OpenAI-compatible Base URL behavior; invalid unversioned endpoints are not silently repaired |
| Vietnamese font/onboarding integration | `a009515` | 2026-09-27 | Merged Vietnamese-capable font defaults and onboarding layout stabilization |
| Librarian analyze recovery | `27af617` | 2026-09-27 | Merged recovery for incomplete analyze-tool tails |
| Agent UI localization | `bd27768` | 2026-09-28 | Merged localized agent display metadata while preserving model/machine identifiers |
| P1.4 localization cleanup A | `83c1666` | 2026-09-28 | First exact-head validated final UI cleanup merge |
| P1.4 localization cleanup B | `91d4a1d` | 2026-09-28 | Second exact-head validated final UI cleanup merge |
| P1.4 localization cleanup C | `94eb2f72160dfedce38f05c3e692f424773c69f3` | 2026-09-28 | P1.4 closure merge; final classified UI rescan found no actionable leakage |
| P1.5 manual UX remediation | `ac63ebb4905c0f7529153f79df7a6df036093626` | 2026-09-28 | Closed Settings role-presentation and Remote accessibility findings after runtime re-acceptance |
| P2.1 reproducible toolchain | `0598aaa159290eefce122ca003b05067310267be` | 2026-09-28 | Merged locked Bun/Vite/Nitro toolchain, tracked `bun.lock`, frozen installs and exact-head CI checkout |

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

The historical 2026-09-22 release-prep validation remains part of the repository
history, but later `master-fix` work supersedes it as the current release-candidate
evidence.

### P1.4 — localization regression closure

P1.4 closed/pass after three controlled cleanup merges. The final P1.4 merge
`94eb2f72160dfedce38f05c3e692f424773c69f3` had a tree byte-identical to the
validated head. Exact-head CI passed tests, app + desktop typecheck, architecture
boundaries, production build, Windows desktop smoke, standalone packaging and
desktop installer dry-runs. The final classified UI hard-code rescan reported no
actionable user-facing English leakage.

### P1.5 — manual UX acceptance

P1.5 exercised the release-binary runtime in isolated data/browser directories across
the story library, Provider settings, Writer, Story Setup, Librarian, Agent panel,
Help, Settings, TTS and Remote surfaces. The first pass found one major Settings
role-presentation localization gap and one minor Remote accessibility label gap.
Both were remediated in frontend presentation only; server role identifiers,
provider/model values and machine data were preserved.

The remediation head passed **214 test files / 1,711 tests**, typecheck,
architecture, production build, Windows desktop smoke, standalone packaging and
desktop installer matrix. Targeted runtime re-acceptance passed, and merge commit
`ac63ebb4905c0f7529153f79df7a6df036093626` matched the validated tree.

### P2.1 — reproducible toolchain

P2.1 closed/pass with:

- Bun `1.4.2`
- Node `>=22.12.0`
- tracked `bun.lock`
- Vite `7.3.6`
- Nitro `3.0.1-20260821-003948-5e7235e6`
- frozen dependency installs
- explicit exact-PR-head checkout for validation workflows
- Windows/Linux/macOS standalone packaging selection
- improved `start.bat` / legacy `run.bat` diagnostics

The P2.1 successor PR was merged with an expected-head lock as
`0598aaa159290eefce122ca003b05067310267be`; the post-merge tree matched the
validated branch tree exactly.

### P2.2 — full CI matrix on canonical master-fix

The canonical checkpoint `0598aaa159290eefce122ca003b05067310267be`
(tree `5af5b559079de1a118b05281a0c7c9c727983235`) passed:

1. **Vitest #358** — **215 test files / 1,716 tests**.
2. App + desktop TypeScript checks.
3. Architecture boundary checks.
4. Production build.
5. **Windows desktop smoke #93**.
6. **Release Binary #48** — Windows x64, Linux x64 and macOS ARM64 dry-runs.
7. **Desktop release #48** — Windows, Linux and macOS installer dry-runs.

Representative runner logs resolved HEAD directly to `0598aaa...`; the validation
did not rely on GitHub's synthetic PR merge commit.

### P2.3 — controlled performance comparison

P2.3 compared frozen `master`
`230b87878379ec0290b973fc3e747a63cbd3525b` with canonical
`master-fix` `0598aaa...` on one isolated Ubuntu GitHub runner. Both trees
used Bun 1.4.2 and the same candidate `package.json` + `bun.lock` at runtime so
dependency drift in frozen `master` could not distort the source/runtime comparison.

The accepted run used three alternating trials per side, 30 measured iterations
plus five warmups per trial on a synthetic 2,000-prose + 500-non-prose fixture.
Correctness parity passed in every trial. No core metric met the predeclared
material-regression rule (>20% slower in all three trials and >5 ms median absolute
delta). Verdict: **PASS_NO_SIGNIFICANT_REGRESSION**.

### P2.4 / P3 release boundary

P2.4 is the final release-readiness review and documentation/hygiene closeout.
It must be exact-head validated and merged into `master-fix` before the Owner is
asked to authorize P3.

The `Test Results` workflow has an attempt-scoped artifact-selection fix in
`master-fix`, but GitHub `workflow_run` executes the workflow definition from
the default branch. Therefore its final placement cannot be fully proven until an
Owner-authorized P3 merge updates default `master`. After that merge, **Vitest +
Test Results must both succeed before creating or publishing `v1.0.0`**.

No tag or GitHub Release should be created merely because P2.4 passes.

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

## Pre-release note

At the 2026-09-28 P2.4 review, no `v1.0.0` tag or GitHub Release had been
created. The functional candidate through P2.3 is `master-fix @ 0598aaa...`;
P2.4 is a documentation/hygiene closeout only.

The release sequence remains intentionally gated:

1. exact-head CI for the P2.4 remediation;
2. expected-head merge of that remediation into `master-fix`;
3. P2.4 readiness re-review;
4. explicit Owner authorization for P3;
5. controlled merge of current `master-fix` into default `master`;
6. post-merge Vitest + `Test Results` verification on the default branch;
7. only then create/publish `v1.0.0` if the Owner authorizes release publication.

Future provenance must append to this record rather than rewriting the historical
source lineage above.
