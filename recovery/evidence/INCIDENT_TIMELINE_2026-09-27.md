# Incident timeline — 2026-09-27

Provenance: RECONSTRUCTED-HISTORY from Desktop Commander tool-call/process history.

## Confirmed destructive sequence

- **00:53:04 +07:00** — cleanup command intended for a temporary Errata directory starts.
- The child process command line was later observed as a malformed `cmd.exe /d /c "rmdir /s /q ..."`.
- Process output retained paths from the root of D:, including examples under `$RECYCLE.BIN` and the pnpm store, proving the delete traversal escaped the intended temporary directory.
- **00:53:35** — parent Desktop Commander session was force-terminated.
- The destructive child `cmd.exe` survived the parent termination.
- **00:55:32** — detached baseline worktree still successfully created commit `6efe4e46f14d153dd313c63f15899b2bb080a8ee`.
- **00:55:51** — the same baseline path no longer had functioning Git metadata; push attempt returned `not a git repository`.
- **00:56:21** — surviving child process found:
  - PID: `12844`
  - parent PID: `5788`
  - executable: `cmd.exe`
  - command line contained the runaway `rmdir /s /q`.
- At 00:56:21:
  - `MasterBaseline-230b878\.git` was gone and only `src` remained at top level.
  - `MasterFix\.git` was gone.
- **00:56:40** — PID 12844 was explicitly terminated.
- **00:57:11** — no remaining suspect delete process found.
- **00:57:44** — GitHub remote refs verified intact:
  - `master = 230b87878379ec0290b973fc3e747a63cbd3525b`
  - `master-fix = f3bf53930a28b4c2c9e7c934e8491272fe5c6c88`
- **00:58:15 onward** — emergency recovery clone/reconstruction began.

## Confirmed scope observations

- The heaviest confirmed filesystem destruction is inside `D:\AI-Workspace\Errata`.
- Other inspected Git projects later passed Git connectivity checks.
- NTFS USN change journal on D: was not active when checked, so it cannot provide a complete deleted-file ledger.
- No further `rmdir /s /q` process was running when rechecked.

## Recovery policy

Do not use this timeline as proof that no other file anywhere on D: was affected. It records only what has been directly verified.
