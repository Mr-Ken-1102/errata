# Reconstructed validation/result summaries

> Provenance: **RECONSTRUCTED-HISTORY**. These summaries are rebuilt from pre-incident command output, checkpoint writes, and post-incident recovery records. They are not replacements for the original deleted JSON/log artifacts.

## P0.6 repeated full-suite evidence

Pre-incident command history recorded:

| Run | Test files | Tests | Duration |
|---|---:|---:|---:|
| full-suite-01 | 160/160 passed | 1495/1495 passed | 95.86 s |
| full-suite-02 | 160/160 passed | 1495/1495 passed | 94.35 s |
| full-suite-03 | 160/160 passed | 1495/1495 passed | 97.06 s |

Original paths:
- `P0.6-results/full-suite-01.log`
- `P0.6-results/full-suite-02.log`
- `P0.6-results/full-suite-03.log`

## P1.3 localization progression

Known deleted result paths include:
- `P1.3-D-results/full-librarian-candidate.json`
- `P1.3-D-results/full-timelines-candidate.json`
- `P1.3-D-results/full-timelines-rerun.json`

Recorded facts:
- previous Librarian candidate summary: **1655/1655 tests PASS**
- one Timelines full-suite run reported `tests/ui/direction-cards.test.ts` failed with 8 failed assertions
- that failure was investigated as timing/shared-worker behavior, not accepted as product regression
- subsequent test-maintenance commits:
  - `578378f`
  - `cfcce94`
  - `da1f26c`
- after `da1f26c`, full Vitest default was recorded twice at **1676/1676 PASS**

## Final P1.3/launcher checkpoint

After `f3bf539`:
- app typecheck PASS
- desktop typecheck PASS
- architecture lint PASS
- full Vitest: **559/559 suites, 1676/1676 tests PASS**
- source launcher reached Vite without the nested install
- health endpoint returned HTTP 200 after first warm-up
- working tree clean

## Exact master baseline audit on 2026-09-27

`master @ 230b87878379ec0290b973fc3e747a63cbd3525b`:

- app typecheck PASS
- desktop typecheck PASS
- architecture lint PASS
- full Vitest: **463/463 suites, 1495/1495 tests PASS**
- production build PASS
- `/api/health`: HTTP 200
- `/api/stories`: HTTP 200 with empty isolated data
- root page: HTTP 200

This automated baseline still reproduced the provider failure under real/manual use, showing the test suite did not cover the missing `/v1` runtime path.

Known original artifact:
- `baseline-audit-results/full-master-230b878.json`

## Provider URL fix validation

Patch lineage:
- original pre-deletion detached commit: `6efe4e46f14d153dd313c63f15899b2bb080a8ee`
- post-incident reconstructed local commit: `35931929fee9aebace4ea66cfe8663bac25e742d`

Targeted regression suite:
- provider URL helper
- config routes
- LLM client
- recorded targeted result: **26/26 PASS**

Full-suite first recovery run:
- total suites: 465
- passed suites: 463
- failed suites: 2
- total tests: 1499
- passed tests: 1498
- failed tests: 1
- failed assertion:
  - `server-owned librarian chat route > persists landed tool calls and marks an explicit Stop as cancelled`
  - message: `tool result was not persisted before Stop`
- this failure was outside the provider URL code path and was treated as the known Librarian timing/race issue

Full-suite rerun:
- **465/465 suites PASS**
- **1499/1499 tests PASS**
- 0 failed
- 0 pending

Real Ollama integration with provider stored as unversioned root:
- stored Base URL: `http://192.168.1.3:11434/`
- runtime resolved Base URL: `http://192.168.1.3:11434/v1`
- config connection test PASS
- Story Setup: HTTP 200, streamed text, finishReason stop
- Librarian: HTTP 200, run-start -> text -> finishReason stop -> run-end complete
- no `Not Found`
- no `socket hang up`

## Outstanding exact-byte recovery

The original historical JSON/log files remain Priority-A forensic targets. If exact copies are later recovered, store them under `recovery/exact-forensic/` and retain this reconstructed summary as provenance/history rather than deleting it.
