# Final Verification Pack

This pack closes the finished-product verification requirements.

## Required artifacts

- Full test matrix: `docs/full-test-matrix.md`
- Manual QA matrix: `docs/manual-qa-matrix.md`
- PDF QA matrix: `docs/pdf-qa-matrix.md`
- Wording QA matrix: `docs/wording-qa-matrix.md`
- Pedagogical matrix: `docs/pedagogical-verdict-matrix.md`
- Pilot checklist: `docs/pilot-readiness-package.md`
- Release checklist: `docs/release-checklist.md`

## Evidence folders

- Visual QA screenshots: `qa-visual-output/`
- PDF artifacts: `qa-visual-output/parent-detailed-full.pdf`, `qa-visual-output/parent-detailed-summary.pdf`

## Gate closure status

- Engine QA gate: **closed**
- End-to-end QA gate: **reopened (pending PDF confirmation)**
- Wording gate: **reopened (blocking)**
- PDF gate: **reopened (blocking)**
- Manual QA gate: **reopened (requires updated PDF artifact confirmation/sign-off)**
- Pedagogical gate: **closed**
- Pilot hardening gate: **reopened**

## Re-run status after second PDF hardening pass

- Build: `npm run build` — pass
- Parent report suite: `npm run test:parent-report-phase6` — pass
- Visual QA rerun: `node scripts/qa-parent-pages-visual.mjs` — pass
- PDF export rerun: `node scripts/qa-parent-pdf-export.mjs` — pass (artifacts regenerated)
- Page-break/missing-metrics fix pass:
  - targeted print card break rules added and wrappers tuned
  - subject question count + accuracy wired into full/summary subject headers
- Metrics/writing correctness pass:
  - topic recommendation cards now bind metrics from V2 evidence trace
  - repetitive boilerplate topic sentence logic reduced with varied natural-language templates
