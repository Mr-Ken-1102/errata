# ERRATA RECOVERY MANIFEST — incident 2026-09-27 00:53:04 +07:00

## Recovery branch

- Branch: `Recovery-2026-09-27-005304`
- Base: `master-fix`
- Base SHA at branch creation: `f3bf53930a28b4c2c9e7c934e8491272fe5c6c88`
- Incident start used for naming: **2026-09-27 00:53:04 +07:00**
- Rule: recovery work must be written to this GitHub branch, not back into `D:\AI-Workspace\Errata`.
- The damaged D: workspace is evidence only. Read-only inspection is allowed; no build/install/cleanup/reclone into that workspace during recovery.

## Authoritative GitHub state already safe

These items do **not** require undelete/forensic recovery:

| Item | Authoritative source | Status |
|---|---|---|
| Main baseline | `master @ 230b87878379ec0290b973fc3e747a63cbd3525b` | Safe on GitHub |
| Vietnamese/current development | `master-fix @ f3bf53930a28b4c2c9e7c934e8491272fe5c6c88` | Safe on GitHub; exact clean HEAD before incident |
| Older Vietnamese feature branch | `feature/vietnamese-ui-2026-09 @ 4bb1bcf57dde8b33c020ccab7a52f348b28f22f6` | Safe on GitHub |
| Tracked source in damaged `MasterFix` | `master-fix` | Do not forensic; restore from GitHub later |
| Tracked source in damaged `Vietnamese` | feature/master-fix history | Do not forensic; restore from GitHub later |
| Baseline worktree source | `master` | Do not forensic |
| `Official` source mirror | upstream/GitHub source | Re-download/recreate; do not spend forensic effort |
| audit/candidate Git clones | Git history/known SHAs | Recreate; do not spend forensic effort |
| node_modules / dist / caches / temp | package install/build | Regenerate; do not forensic |

GitHub compare verified before this manifest:
- `master -> master-fix`: 126 commits ahead, 0 behind, 150 changed files.
- `feature/vietnamese-ui-2026-09 -> master-fix`: 23 commits ahead, 0 behind.
- `f3bf539... -> master-fix`: identical.

## MUST RECOVER — local-only / historical evidence

These were present before the incident and were not established as tracked on GitHub. Preserve exact bytes if recoverable.

### Priority A — root handoff/checkpoint/audit files

1. `ERRATA_HANDOFF_2026-09-26_MASTER_FIX.md`
2. `ERRATA_HANDOFF_BUNDLE_2026-09-26_MASTER_FIX.zip`
3. `ERRATA_NEXT_CHAT_PROMPT_2026-09-26_MASTER_FIX.txt`
4. `ERRATA_STATUS_2026-09-26_MASTER_FIX.json`
5. `ERRATA_TOPLEVEL_SIZE_AUDIT.csv`
6. `ERRATA_WORKSPACE_AUDIT_2026-09-26.md`
7. `ERRATA_LIVE_CHECKPOINT_2026-09-26_POST_P1.3.md`

The first six are confirmed by the pre-incident top-level inventory. The LIVE checkpoint is confirmed by pre-incident tool history and was updated after P1.3.

### Priority A — historical validation/result directories

Exact historical artifacts are useful because rerunning tests does not reproduce the original evidence byte-for-byte.

- `P0.1-results\`
- `P0.2-results\`
- `P0.3-results\`
- `P0.5-results\`
- `P0.6-results\`
- `P0.7-results\`
- `P1.3-A-results\`
- `P1.3-B-results\`
- `P1.3-BC-results\`
- `P1.3-C-results\`
- `P1.3-D-results\`
- `P1.3-D1-results\`
- `P1.3-D2A-results\`
- `P1.3-D2B-results\`
- `P1.3-D2C-results\`

Known exact artifact names seen in tool history include, but are not limited to:
- `P0.6-results/full-suite-01.log`
- `P0.6-results/full-suite-02.log`
- `P0.6-results/full-suite-03.log`
- `P1.3-D-results/full-timelines-candidate.json`
- `P1.3-D-results/full-timelines-rerun.json`
- `P1.3-D-results/full-librarian-candidate.json`

Do not invent missing filenames. Add more paths only when supported by pre-incident history or actual forensic discovery.

### Priority A — baseline/provider-fix validation evidence created on 2026-09-27

- `baseline-audit-results/full-master-230b878.json`
- `baseline-audit-results/full-master-provider-url-fix.json` (pre-incident run, if recoverable)

These are historical evidence. Equivalent reruns may be stored separately but must not be mislabeled as the original artifacts.

### Priority A — local-only provider URL fix

Original detached-worktree commit before deletion:
- `6efe4e46f14d153dd313c63f15899b2bb080a8ee`
- message: `fix(llm): normalize OpenAI-compatible base URLs`
- parent: `230b87878379ec0290b973fc3e747a63cbd3525b`
- 6 files, 100 insertions, 12 deletions.

This commit was lost from the damaged Git metadata, but the patch was reconstructed after the incident and validated again. It should be recovered into this Recovery branch after verifying the five pre-existing files are byte-identical between `master` and `master-fix` (already verified).

## RECOVER IF FOUND, BUT DO NOT SPEND FORENSIC TIME FIRST

- Any additional root `.md`, `.txt`, `.json`, `.csv`, `.zip`, `.log` file under the old Errata workspace that is not tracked in GitHub.
- Any uncommitted file whose content cannot be reproduced from GitHub or tool-call history.
- Original test reports/JUnit artifacts from the deleted result directories.
- Any handoff bundle whose exact bytes are not otherwise available.

## DO NOT FORENSIC / RECREATE LATER

Confirmed pre-incident top-level items that were disposable/rebuildable:

- `.audit-p1.3-bc\`
- `.audit-p1.3-d\`
- `.p0.1-master-clean\`
- `.p0.3-candidate\`
- `.p0.3-validate\`
- `.p0.3-verify\`
- `.p0.5-candidate\`
- `.p0.5-verify\`
- `.p0.6-combined\`
- `.bun-cache\`
- `.tmp\`
- `.tmp-audit-p13\`
- `.tmp-audit-p13d\`
- `.tmp-masterfix\`
- `.tmp-p03\`
- `.tmp-p03-stress\`
- `.tmp-p06-checks\`
- `.tmp-p06-run1\`
- `.tmp-p06-run2\`
- `.tools\`
- `MasterFix\` tracked source
- `Vietnamese\` tracked source
- `MasterBaseline-230b878\` tracked source
- `Official\`

Exception: if a forensic scan reveals an **untracked, user-authored** file inside one of these disposable trees, classify that individual file as MUST RECOVER.

## Confirmed damage boundary

The destructive child process was terminated at approximately 00:56:40 +07:00.

Current checks after the incident established:
- `master` and `master-fix` remote refs remained intact.
- Other inspected projects (`Marinara-Engine`, `Sami-Kilo-Sandbox`, `D:\Kilo_Sandbox`) passed Git connectivity checks.
- `Marinara Engine viet hoa` retained source/QA/backup ZIPs.
- The heaviest confirmed destruction is inside `D:\AI-Workspace\Errata`.

## Recovery provenance labels

Every recovered item committed to this branch must be labeled in its commit message or accompanying index as one of:

- **EXACT-GITHUB** — exact content already stored on GitHub.
- **EXACT-PROJECT-FILE** — exact bytes/text recovered from a Project/conversation file that predates the incident.
- **EXACT-FORENSIC** — exact recovered file from deleted storage.
- **RECONSTRUCTED-HISTORY** — rebuilt from tool-call/chat history; not claimed byte-identical to the deleted original.
- **RERUN-EVIDENCE** — newly rerun validation; never substitute for original historical artifact.

## Current recovery actions

1. Recovery branch created from exact pre-incident `master-fix`.
2. This manifest committed to the Recovery branch.
3. Next: preserve exact Project/conversation handoff material already available without writing to D:.
4. Next: apply the validated provider URL patch directly to the Recovery branch through GitHub.
5. Next: targeted read-only forensic discovery of Priority-A local-only artifacts; upload recovered content directly to GitHub, never back to the damaged Errata workspace.
