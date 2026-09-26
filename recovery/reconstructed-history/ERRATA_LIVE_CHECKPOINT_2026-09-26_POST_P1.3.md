# ERRATA LIVE CHECKPOINT — 2026-09-26 — POST P1.3

## Authority
- Workspace only: `D:\AI-Workspace\Errata`
- Active repo: `D:\AI-Workspace\Errata\MasterFix`
- Windows user used: `DESKTOP-OET19S7\ai-agent`
- Frozen baseline: `master @ 230b87878379ec0290b973fc3e747a63cbd3525b`
- Active branch: `master-fix @ f3bf53930a28b4c2c9e7c934e8491272fe5c6c88`
- Local and `origin/master-fix` match; working tree clean.
- Do not merge `master-fix` into `master` without Owner authorization.

## P1.3 localization — CLOSED
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
## Test maintenance after P1.3
- `578378f`: wait for direction-card expansion between presses.
- `cfcce94`: extend expansion wait.
- `da1f26c`: scope direction-card suite timeout to 15s for shared-worker scheduling pauses.
- These are test-only; production code is unchanged.
- After `da1f26c` content, full Vitest default ran twice: `1676/1676 PASS` both times.

## Automated deep audit — CLOSED
- `master-fix` is based directly on frozen `master`; no behind commits.
- Delta inventory before final test-only commit: 148 changed files, concentrated in UI/tests.
- Tree hashes are identical between master and master-fix for:
  - `src/server`
  - `plugins`
  - `packages`
  - `desktop`
- Only `src/lib/i18n.tsx` changes inside `src/lib`.
- i18n dictionaries: 1492 EN keys / 1491 VI keys; no duplicates.
- The only intentional VI omission is `app.name`; product name remains `Errata`.
- Vietnamese diacritics in production source occur only in `src/lib/i18n.tsx` and intentional Vietnamese Help files.
- Heuristic scan outside i18n/Help found only technical literals such as `ctx` and `Esc`.
- Dedicated i18n checkpoint: 40 files / 142 tests PASS.
## Windows automated runtime smoke
- Vite dev server started successfully on `127.0.0.1:7739`.
- Runtime data and TEMP/TMP were forced under `D:\AI-Workspace\Errata\.runtime-smoke-masterfix`.
- Root page: HTTP 200, contains `Errata` and language boot script.
- Warm `/api/health`: HTTP 200, body `{"status":"ok"}`, ~211 ms.
- `/api/stories` on empty smoke data: HTTP 200, body `[]`, ~205 ms.
- Warm root request: HTTP 200, ~147 ms, HTML length 12092.
- First cold `/api/health` request timed out while dev/API initialization was still warming; subsequent request was healthy.
- Vite warning remains: installed Vite 7.3.6 while builder requests ^8.
- Smoke server and OpenRouter callback bridge were terminated; ports 7739 and 3000 were closed.
- Smoke temp directory (~5.9 MB) was deleted.
- Generated `src/routeTree.gen.ts` reorder drift was inspected and restored to HEAD.

## Remaining critical path
1. Owner/manual Windows UI runtime test: launch app and exercise language switching + representative workflows.
2. Performance benchmark: frozen `master` vs `master-fix`.
3. Review workspace cleanup plan (~7.4 GiB reclaimable) separately.
4. Only after runtime + benchmark: discuss merge/release strategy.

Do not redo P1.3 Help sections or automated deep audit unless new evidence invalidates this checkpoint.

## Windows source launcher follow-up
- `7485a79`: `start.bat` skips dependency installation when validated dependencies are already present.
- Root cause of the second EBUSY was deeper in `package.json`: `dev` still ran `bun install --frozen-lockfile` before Vite.
- Provenance: that nested install pattern already existed in frozen `master` and older upstream-derived history; it was not introduced by localization.
- `f3bf539`: changed only `scripts.dev` to `vite dev --port 7739`.
- Validation after `f3bf539`:
  - package.json parses and diff check passes.
  - app + desktop typecheck PASS.
  - architecture lint PASS.
  - full Vitest: 559/559 suites, 1676/1676 tests PASS.
  - `start.bat web` prints dependency skip, then `$ vite dev --port 7739`; no nested `bun install`.
  - Vite ready in ~5.1 s on warm verification; `http://localhost:7739/api/health` returned 200 in ~16.9 s on its first API warm-up.
  - Verification processes stopped; ports 7739 and 3000 closed; temp verification data removed; working tree clean.
- Other package scripts still contain nested `bun install --frozen-lockfile`; treat that as a separate reproducibility/tooling task, not part of the startup fix.
