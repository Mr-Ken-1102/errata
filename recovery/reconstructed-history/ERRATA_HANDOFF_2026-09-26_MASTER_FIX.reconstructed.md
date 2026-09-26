# ERRATA HANDOFF — RECONSTRUCTED AFTER 2026-09-27 INCIDENT

> Provenance: **RECONSTRUCTED-HISTORY**. This file is not claimed byte-identical to the deleted `ERRATA_HANDOFF_2026-09-26_MASTER_FIX.md`. It is rebuilt from GitHub state, preserved Project files, pre-incident Desktop Commander history, and the final checkpoint write history.

## Authoritative branches

- Frozen baseline: `master @ 230b87878379ec0290b973fc3e747a63cbd3525b`
- Pre-incident active development: `master-fix @ f3bf53930a28b4c2c9e7c934e8491272fe5c6c88`
- Older Vietnamese feature branch: `feature/vietnamese-ui-2026-09 @ 4bb1bcf57dde8b33c020ccab7a52f348b28f22f6`
- GitHub comparison at recovery start:
  - `master-fix` = 126 commits ahead of `master`, 0 behind.
  - `master-fix` = 23 commits ahead of `feature/vietnamese-ui-2026-09`, 0 behind.
  - `f3bf539...` and GitHub `master-fix` are identical.

## Closed work before incident

P1.3 localization was closed. Recorded commits:

- Story Library/Home: `2473548`
- FragmentList: `39b0ebd`
- LibrarianPanel: `344f292`
- Help shell: `899fba2`
- Help Generation: `514d722`
- Shared Help primitives: `cf6ba58`
- Help Context Blocks: `94b6e3f`
- Help Fragments: `b25f961`
- Help Librarian: `fa05297`
- Help Timelines: `cebb3d1`
- Help Stories: `25023df`
- Help Settings: `4719ad4`

Test-stabilization commits:
- `578378f`
- `cfcce94`
- `da1f26c`

After the final test-only change, full Vitest default was recorded twice at **1676/1676 PASS**.

## Deep audit state before incident

Recorded pre-incident conclusions:
- `master-fix` was directly based on frozen `master`, with no behind commits.
- production/server-sensitive trees were audited; `src/server`, `plugins`, `packages`, and `desktop` were identical between baseline and localization state at the relevant checkpoint.
- `src/lib/i18n.tsx` was the intended localization change inside `src/lib`.
- i18n checkpoint recorded 1492 EN keys / 1491 VI keys; intentional VI omission: `app.name`.
- dedicated i18n checkpoint: 40 files / 142 tests PASS.

## Windows launcher work before incident

- `7485a79`: skip redundant dependency reinstall in `start.bat` when validated dependencies already exist.
- `f3bf539`: remove nested `bun install --frozen-lockfile` from `scripts.dev`; `dev` became `vite dev --port 7739`.
- Validation after `f3bf539` recorded:
  - package.json parse / diff check PASS
  - app + desktop typecheck PASS
  - architecture lint PASS
  - full Vitest 1676/1676 PASS
  - `start.bat web` reached Vite without nested install
  - health endpoint HTTP 200 after warm-up
  - working tree clean

Known separate reproducibility debt remained: other package scripts still contained nested installs and the repository did not track a lockfile while using nightly/latest dependencies.

## Baseline manual/runtime discovery on 2026-09-27

A detached worktree of exact `master @ 230b878...` was created and validated.

Automated baseline gates recorded:
- app typecheck PASS
- desktop typecheck PASS
- architecture lint PASS
- production build PASS
- full Vitest: 1495/1495 PASS
- `/api/health` HTTP 200
- `/api/stories` HTTP 200
- root HTTP 200

Manual use still reproduced the same `Not Found` / `socket hang up` behavior seen on the Vietnamese branch.

## Root cause discovered before incident

The OpenAI-compatible provider URL handling was inconsistent:
- config Test/List routes normalized an unversioned API root to `/v1`
- runtime LLM model creation used the raw provider Base URL

For Ollama:
- `http://192.168.1.3:11434/models` -> 404
- `http://192.168.1.3:11434/v1/models` -> 200

With Base URL ending in `/v1`, Librarian and Story Setup worked normally. This proved the localization work was not the source of the provider failure.

## Provider URL fix

Original detached-worktree commit before deletion:
- `6efe4e46f14d153dd313c63f15899b2bb080a8ee`
- parent: `230b87878379ec0290b973fc3e747a63cbd3525b`
- message: `fix(llm): normalize OpenAI-compatible base URLs`
- 6 files; 100 insertions, 12 deletions

The patch was reconstructed after the incident as local commit:
- `35931929fee9aebace4ea66cfe8663bac25e742d`

Recorded validation of the reconstructed patch:
- targeted provider/config/client regression tests PASS
- app + desktop typecheck PASS
- architecture lint PASS
- full suite rerun 1499/1499 PASS
- production build PASS
- real Ollama provider stored **without** `/v1` resolved at runtime to `/v1`
- real Story Setup HTTP 200 / finishReason stop
- real Librarian HTTP 200 / run-end status complete
- no `Not Found`, no `socket hang up`

The exact six Git blob objects from `3593192` are now preserved on branch `Recovery-2026-09-27-005304`.

## Incident

At approximately **2026-09-27 00:53:04 +07:00**, a cleanup command escaped the intended temporary path and a child `cmd.exe rmdir /s /q` process continued after its parent session was terminated.

Confirmed timeline:
- 00:53:04 — destructive cleanup process starts
- 00:55:32 — detached baseline could still create commit `6efe4e4`
- 00:55:51 — same worktree no longer recognized as a Git repository
- 00:56:21 — surviving child `cmd.exe` identified; `MasterFix` and baseline had lost Git metadata
- 00:56:40 — destructive child PID terminated
- 00:58 onward — emergency recovery clone/reconstruction began

## Damage / recovery state

Safe on GitHub:
- all committed `master` source
- all committed `master-fix` work, including localization and launcher fixes
- older Vietnamese feature branch

Local-only historical evidence lost from the working filesystem includes handoff/status/audit files and P0/P1.3 result directories. These remain forensic/reconstruction targets.

## Recovery branch

All further recovered material must go to:
`Recovery-2026-09-27-005304`

Do not write recovered material back into the damaged Errata workspace during recovery.
