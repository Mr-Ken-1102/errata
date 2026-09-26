# Recovery index — 2026-09-27 incident

Recovery branch: `Recovery-2026-09-27-005304`

This index records what has already been preserved on GitHub without writing back into the damaged `D:\AI-Workspace\Errata` workspace.

| Item | Provenance | Recovery status | GitHub evidence |
|---|---|---|---|
| Recovery manifest | RECONSTRUCTED-HISTORY from pre-incident inventory + GitHub state | PRESERVED | `e816905a2cb387dbb25f1d665cfd1bf2f240d70a` |
| `Báo cáo tiếp quản GitHub.txt` (465 lines) | EXACT-PROJECT-FILE; Project/conversation file predating incident | PRESERVED | `70cc2d9243834ace30f50684570ec65a10a550cc` |
| Final P1.3 live checkpoint | RECONSTRUCTED-HISTORY from complete write/append/edit tool-call sequence | PRESERVED | `126c3b480d392215c35ec5fc1902ab94db226cff` |
| Provider URL fix — six target blobs | EXACT from surviving local Git commit `35931929fee9aebace4ea66cfe8663bac25e742d` using raw `git cat-file` bytes | PRESERVED EXACTLY | recovery commit `3274ac94233009a6c497c073e4e0f1c613975858` |

## Exact provider-fix blobs now stored on GitHub

| Path | Exact blob SHA |
|---|---|
| `src/server/config/provider-urls.ts` | `9ed94338c6fabc0ef442ba9c4ef20fc062823cfb` |
| `src/server/llm/client.ts` | `7145fd1d6bb1db476137b718ba85f8ee8cadcbb9` |
| `src/server/routes/config.ts` | `b39ba517b9b40fa0bf95c8565af3907a011b92a4` |
| `tests/api/config-routes.test.ts` | `e5cc055d5c8c364254baa224d1126105839cd2e3` |
| `tests/config/provider-urls.test.ts` | `e526202503cbb6074b1b9a2591bcded382162cd2` |
| `tests/llm/client.test.ts` | `f0d7ef1c4073bbafd74543825b6414b9422316f6` |

The five pre-existing provider-fix files were verified byte-identical between `master` and `master-fix` before the recovered blobs were applied. Therefore restoring the exact fixed blobs onto the Recovery branch does not overwrite unrelated `master-fix` work.

## Still outstanding — forensic/local-only

Highest-priority original files still not recovered as exact bytes:

- `ERRATA_HANDOFF_2026-09-26_MASTER_FIX.md`
- `ERRATA_HANDOFF_BUNDLE_2026-09-26_MASTER_FIX.zip`
- `ERRATA_NEXT_CHAT_PROMPT_2026-09-26_MASTER_FIX.txt`
- `ERRATA_STATUS_2026-09-26_MASTER_FIX.json`
- `ERRATA_TOPLEVEL_SIZE_AUDIT.csv`
- `ERRATA_WORKSPACE_AUDIT_2026-09-26.md`
- historical contents of `P0.*-results` and `P1.3-*-results`
- original pre-incident `baseline-audit-results` JSON files

The deleted checkpoint itself has been reconstructed from its full tool-call write history, but it remains classified as RECONSTRUCTED-HISTORY rather than EXACT-FORENSIC.

## Rule for further recovery

When another artifact is recovered:
1. do not write it into the damaged Errata workspace;
2. push it directly to this branch;
3. record exact provenance here;
4. distinguish exact recovered bytes from reconstructed material.


## Additional exact GitHub evidence preserved

- `recovery/exact-github/ci-f3bf539-vitest-job.log` — EXACT-GITHUB job log, run 36252326650, job 108432546858.
- `recovery/exact-github/ci-f3bf539-windows-desktop-smoke.log` — EXACT-GITHUB job log, run 36252326688, job 108432547102.
- `recovery/exact-github/GITHUB_ACTIONS_EVIDENCE_f3bf539.md` — artifact IDs, SHA-256 digests, expiry dates, workflow/job identities and independently checked vitest artifact digest.
