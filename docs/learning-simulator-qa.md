# Learning simulator QA

This document describes the **unified learning-simulator quality gates**: what they validate, how to run them, where artifacts land, and what they **do not** prove.

## What the simulator does (high level)

The learning simulator generates **aggregate storage-shaped snapshots** (similar to product localStorage for learning activity), optionally builds **parent reports** from that storage in Node, and runs **integrity / behavior / report-contract checks**. It is designed to validate pipelines and fixtures **without** driving the full browser student UI for every scenario.

## Orchestrator commands

| Command | Meaning |
| -------- | ------- |
| `npm run qa:learning-simulator` | Same as **full** — recommended default before merge when you want the whole gate. |
| `npm run qa:learning-simulator:quick` | Fast CI gate: matrix → schema → aggregate → reports → behavior → questions. |
| `npm run qa:learning-simulator:full` | **quick** → deep longitudinal → `next build` → parent-report phase1 selftest → intelligence-layer v1 usage selftest. |

Orchestrator summaries:

- `reports/learning-simulator/orchestrator/run-summary.json`
- `reports/learning-simulator/orchestrator/run-summary.md`

Stopping behavior: by default the orchestrator **stops on the first failing step**. Set `LS_CONTINUE_ON_FAIL=1` to run all steps anyway (still exits non-zero if any step failed).

## What **quick** runs

In order:

1. **`qa:learning-simulator:matrix`** — Builds/refreshes `coverage-matrix.json` from curriculum/subject sources.
2. **`qa:learning-simulator:schema`** — Validates profiles + scenario fixtures (quick + deep definitions) against the matrix.
3. **`qa:learning-simulator:aggregate`** — Simulates **quick** scenarios into per-student storage + meta under `aggregate/per-student/`.
4. **`qa:learning-simulator:reports`** — Builds slim parent-report payloads and runs **Phase 3** report assertions (`scenario.expected`).
5. **`qa:learning-simulator:behavior`** — Runs **Phase 5** behavior assertions on storage + slim report facets (`behavior-oracle` / `behavior-assertion-engine`).
6. **`qa:learning-simulator:questions`** — **Phase 4** generator/bank question integrity over matrix cells (samples per cell).

## What **full** adds on top of quick

After the quick chain:

7. **`qa:learning-simulator:deep`** — Longitudinal **30d / 90d** scenarios: storage, reports, report assertions, behavior assertions; outputs under `reports/learning-simulator/deep/`.
8. **`npm run build`** — Next.js production build (types + lint during build).
9. **`npm run test:parent-report-phase1`** — Parent report Phase 1 selftest.
10. **`npm run test:intelligence-layer-v1-usage`** — Intelligence layer usage contract selftest.

**Not included by default:** Playwright E2E (`npm run test:e2e`). Add explicitly when you need browser automation.

**Not included:** PDF generation for learning simulations (use dedicated generate scripts if needed).

## What **deep** runs (when invoked via full or standalone)

`npm run qa:learning-simulator:deep` executes the **deep scenario suite** only (see `tests/fixtures/learning-simulator/scenarios/deep-scenarios.mjs`): larger horizons, more sessions, same report + assertion stack as aggregate but heavier. Artifacts: `reports/learning-simulator/deep/`.

## What this does **not** prove

- **Full student UX:** Aggregate/deep simulation is **storage-level** (session payloads written into snapshot shape). It does not replay every click in Chrome.
- **Every answer path in UI:** Question integrity checks generated/bank questions structurally; it does **not** assert every cell through the math/hebrew/etc. pages interactively.
- **Production Supabase / auth:** Gates are largely offline/fixture-driven unless a script explicitly hits APIs.
- **Complete curriculum coverage:** Unsupported matrix cells remain flagged separately (`unsupportedCells` in question integrity output).
- **Full Cartesian matrix expansion:** Running every grade × subject × topic × level combination as separate student timelines is **not** implemented in the orchestrator yet.

## How to inspect failures

1. Read **`reports/learning-simulator/orchestrator/run-summary.md`** for which step failed and suggested next steps.
2. Open the **stage-specific** summary JSON under `reports/learning-simulator/<stage>/`:
   - **questions:** `questions/failures.json`
   - **behavior:** `behavior/failures.json`
   - **reports:** `reports/run-summary.json` + `per-student/*.assertions.json`
   - **deep:** `deep/failures.json`
3. Re-run a **single** npm script (e.g. `npm run qa:learning-simulator:behavior`) to iterate faster.

## Artifact locations (repo-relative)

| Gate | Main outputs |
| ----- | ------------- |
| Matrix | `reports/learning-simulator/coverage-matrix.json`, `.md` |
| Schema | `reports/learning-simulator/schema-validation.json`, `.md` |
| Aggregate | `reports/learning-simulator/aggregate/run-summary.json`, `per-student/*.storage.json`, `*.meta.json` |
| Reports | `reports/learning-simulator/reports/run-summary.json`, `per-student/*.report.json`, `*.assertions.json` |
| Behavior | `reports/learning-simulator/behavior/run-summary.json`, `failures.json`, `per-student/*.behavior.json` |
| Questions | `reports/learning-simulator/questions/run-summary.json`, `failures.json` |
| Deep | `reports/learning-simulator/deep/run-summary.json`, `failures.json`, `per-student/*` |
| Orchestrator | `reports/learning-simulator/orchestrator/run-summary.json`, `.md` |

## When to run quick vs full

- **`quick`:** Frequent feedback during fixture/report/simulator changes; minutes faster than full when deep + build are unnecessary.
- **`full`:** Pre-merge / nightly / release candidate — includes deep horizons, production build, and parent-report / intelligence contract tests.

## Targeted subcommands

Run individual gates without the orchestrator, e.g.:

```bash
npm run qa:learning-simulator:matrix
npm run qa:learning-simulator:schema
npm run qa:learning-simulator:aggregate
npm run qa:learning-simulator:reports
npm run qa:learning-simulator:behavior
npm run qa:learning-simulator:questions
npm run qa:learning-simulator:deep
```

## Known limits (current)

1. **Simulation fidelity:** Sessions are synthesized into storage-compatible structures; not a full browser playback.
2. **Question integrity:** Validates generator/bank outputs per sampled cells; **unsupported** cells are reported separately and are not forced green.
3. **Matrix expansion:** Orchestrator does not run “every possible longitudinal combination”; deep v1 is a **manageable** scenario set.
4. **E2E:** Not part of the default full gate; add `npm run test:e2e` manually when appropriate.
