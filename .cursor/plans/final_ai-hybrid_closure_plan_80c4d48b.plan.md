---
name: Final AI-Hybrid Closure Plan
overview: Final single-sequence completion plan to close AI-hybrid work with an explicit truth split between repo-local finish items and external program gates, so execution can proceed once and not reopen.
todos:
  - id: repo-hardening-pass
    content: Close final repo-local safety/wording edge cases in one pass.
    status: completed
  - id: repo-verification-lock
    content: Run full local test/build + git proof set and freeze repo-local scope.
    status: completed
  - id: external-program-handoff
    content: Move remaining gates to explicit external execution ownership.
    status: completed
isProject: false
---

# Final AI-Hybrid Closure Plan

## A. Exact current status
- Working tree is currently clean: `git status --short` / `git diff --name-only` / `git diff --name-only --cached` are empty in latest read.
- Required hybrid source files are tracked and visible via `git ls-files`, including [`utils/ai-hybrid-diagnostic/run-hybrid-for-report.js`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/utils/ai-hybrid-diagnostic/run-hybrid-for-report.js), [`utils/ai-hybrid-diagnostic/safe-build-hybrid-runtime.js`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/utils/ai-hybrid-diagnostic/safe-build-hybrid-runtime.js), [`scripts/ai-hybrid-harness.mjs`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/scripts/ai-hybrid-harness.mjs), and [`docs/AI_HYBRID_ENGINE.md`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/docs/AI_HYBRID_ENGINE.md).
- Ignore policy is correct:
  - `data/ai-hybrid-gold/synthetic-gold-v1.jsonl` is ignored by [`.gitignore`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/.gitignore).
  - `utils/ai-hybrid-diagnostic/run-hybrid-for-report.js` is not ignored.
- Runtime safety is implemented in code:
  - [`utils/parent-report-v2.js`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/utils/parent-report-v2.js) calls `safeBuildHybridRuntimeForReport` (best-effort, nullable output).
  - [`utils/detailed-parent-report.js`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/utils/detailed-parent-report.js) validates hybrid payload with `isValidHybridRuntimePayload` before forwarding.
- Last known local verification from recent execution run (already performed): all required commands passed (`test:diagnostic-engine-v2-harness`, `test:ai-hybrid-harness`, `test:parent-report-phase6`, `build`).

## B. Completed already
- Hybrid module set implemented and integrated under [`utils/ai-hybrid-diagnostic/`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/utils/ai-hybrid-diagnostic/).
- Hybrid runtime contract and validator implemented and wired.
- Parent report and detailed report safety-path behavior implemented (nullable hybrid fallback).
- Harness and CI references added in [`package.json`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/package.json) and [`.github/workflows/parent-report-tests.yml`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/.github/workflows/parent-report-tests.yml).
- Repo-local documentation truth-scoped in [`docs/AI_HYBRID_ENGINE.md`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/docs/AI_HYBRID_ENGINE.md).

## C. Still incomplete inside repo
- No functional repo-local gap remains for the declared repo-complete scope.
- Explicit scope rule:
  - Repo-complete **does include** runtime exception safety, malformed hybrid payload fallback to `null`, detailed-report validation/fallback behavior, and clean local verification + tracked repo state.
  - Repo-complete **does not include** survival of ES-module parse/load/link failure before module execution (static import failure path).
  - ES-module parse/load/link survival is classified as a separate future hardening task, not part of repo-complete acceptance.

## D. External-only incomplete items
- Expert/adjudicated gold labeling program and dispute adjudication operations.
- Inter-rater agreement / kappa measurement and acceptance.
- Real shadow monitoring over time (multi-window/week runtime evidence).
- Controlled rollout cohorts and operational rollback governance.
- Production monitoring and incident response operations.
- Trained external models replacing current heuristic rank/probe logic.

## E. Final completion plan (one sequence only)

### Phase 1 — Repo-local closure hardening (repo-local)
**Produces**
- Final code-level closure on the declared repo-complete scope only: runtime exception safety, malformed payload fallback to `null`, detailed-report validation/fallback, and wording truth consistency.
- Final wording normalization so all docs/comments reflect repo-local scope only.

**Done when**
- `generateParentReportV2` cannot be broken by hybrid runtime exceptions/malformed outputs and still returns valid V2 payload.
- `buildDetailedParentReportFromBaseReport` handles `hybridRuntime` null/missing/invalid with deterministic fallback.
- No misleading “full program complete” wording in repo docs.

**Stop/approval gate**
- Code review check: runtime safety and truth wording accepted.

### Phase 2 — Repo-local verification lock (repo-local)
**Produces**
- Fresh final proofs from one contiguous local run:
  - `npm run test:diagnostic-engine-v2-harness`
  - `npm run test:ai-hybrid-harness`
  - `npm run test:parent-report-phase6`
  - `npm run build`
- Fresh git proof set:
  - `git status --short`
  - `git diff --name-only`
  - `git diff --name-only --cached`
  - `git ls-files ...`
  - `git check-ignore -v ...`

**Done when**
- All four runtime/build commands pass.
- Required source files are tracked; synthetic gold file remains ignored; no unexpected repo leftovers.

**Stop/approval gate**
- Final repo-local closeout report accepted.

### Phase 3 — External execution program (external)
**Produces**
- Expert gold set operations, adjudication, kappa acceptance, shadow-period metrics, rollout cohort evidence, operational readiness artifacts.

**Done when**
- External gates from the master program are evidenced and approved by human operations owners.

**Stop/approval gate**
- Program steering sign-off for rollout readiness.

### Shortest correct path to finish without reopening
- Execute Phase 1 once, immediately followed by Phase 2 once.
- Freeze repo-local scope after Phase 2.
- Move all remaining work to external Phase 3 with explicit ownership and no new repo patch cycles unless external evidence reveals a concrete defect.

## F. Definition of Done
- **repo complete**: runtime safety against hybrid runtime exceptions is implemented; malformed hybrid payload fallback to `null` is implemented; detailed-report hybrid validation/fallback is implemented; required local verification passes; required files are tracked; ignore policy is correct. ES-module parse/load/link survival before module execution is explicitly out of repo-complete scope.
- **product complete**: repo complete plus operational acceptance in real usage context (shadow monitoring, rollout controls, production observability).
- **full program complete**: product complete plus external expert/gold/adjudication/calibration program gates fully passed.

## G. Final estimate of remaining work
- **Repo-local**: small.
- **Full completion (including external program)**: large.

## H. Final recommendation
- continue immediately with execution of the final plan