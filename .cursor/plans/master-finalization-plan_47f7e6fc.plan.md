---
name: master-finalization-plan
overview: תוכנית סופית, קשיחה ומלאה להבאת המוצר ממצב controlled-pilot למוצר מוגמר, יציב, ברור, מקצועי, ובדוק עד הסוף, ללא ביצוע קוד בשלב זה.
todos: []
isProject: false
---

# Master Finished Product Plan v2

## Target hierarchy (explicit)
- **Primary target**: finished internal product.
- **Secondary target**: ready for controlled pilot.
- **Separate and not claimed here**: external/school/contractual readiness.

---

## Part 1 — Final Gap Map (reclassified)

### Blocking for finished product
- **Core stabilization closure**
  - Any authority inconsistency (`diagnosticEngineV2` not primary where expected).
  - Any payload contract break in base/detailed outputs.
  - Any fallback path that is not explicit to the user.
  - Likely areas: [utils/parent-report-v2.js](utils/parent-report-v2.js), [utils/detailed-parent-report.js](utils/detailed-parent-report.js), [utils/diagnostic-engine-v2/run-diagnostic-engine-v2.js](utils/diagnostic-engine-v2/run-diagnostic-engine-v2.js), [utils/diagnostic-engine-v2/output-gating.js](utils/diagnostic-engine-v2/output-gating.js), [pages/learning/parent-report.js](pages/learning/parent-report.js).
- **Parent report final quality closure (core, not polish)**
  - Robotic Hebrew, repetitive template tone, unclear confidence/cannot-conclude text, unclear parent actionability.
  - Wording quality is a product correctness gate.
  - Likely areas: [utils/parent-report-ui-explain-he.js](utils/parent-report-ui-explain-he.js), [utils/detailed-report-parent-letter-he.js](utils/detailed-report-parent-letter-he.js), [utils/detailed-parent-report.js](utils/detailed-parent-report.js), [components/parent-report-detailed-surface.jsx](components/parent-report-detailed-surface.jsx), [pages/learning/parent-report.js](pages/learning/parent-report.js), [pages/learning/parent-report-detailed.js](pages/learning/parent-report-detailed.js).
- **PDF final quality closure (core deliverable)**
  - Any clipping, broken page hierarchy, unreadable tables/charts, broken long-text wrapping, major mismatch vs on-screen hierarchy.
  - Likely areas: [utils/math-report-generator.js](utils/math-report-generator.js), [pages/learning/parent-report.js](pages/learning/parent-report.js), [pages/learning/parent-report-detailed.js](pages/learning/parent-report-detailed.js), [components/parent-report-detailed-surface.jsx](components/parent-report-detailed-surface.jsx), [scripts/qa-parent-pages-visual.mjs](scripts/qa-parent-pages-visual.mjs).
- **Verification closure**
  - Product cannot be finished without signed manual QA matrix, signed wording QA matrix, and signed PDF QA matrix.
  - Product cannot be finished without full automated regression pass.

### Blocking for pilot
- Any open severe category from [docs/pilot-readiness-package.md](docs/pilot-readiness-package.md):
  - `authority_regression`
  - `contract_break`
  - `unsafe_overclaim`
  - `cross_subject_failure`
  - `cannot_conclude_breach`
- Any open issue that prevents controlled, observable use under monitoring.

### Out of scope by definition
- External curriculum validation and formal psychometric validation.
- Contractual/school certification readiness.
- Any external legal/commercial accreditation not defined in current internal source-of-truth set.

---

## Part 2 — Definition of Finished Internal Product

### Binary criteria (must all be true)
- **Engine correctness**
  - `npm run test:parent-report-phase1` pass
  - `npm run test:topic-next-step-phase2` pass
  - `npm run test:topic-next-step-engine-scenarios` pass
  - `npm run test:diagnostic-engine-v2-harness` pass
  - Zero `unsafe_overclaim` findings in weak/sparse/contradictory scenarios.
- **Output correctness**
  - Zero contract-break findings in base/detailed payload review.
  - Zero silent fallback findings.
  - Zero missing critical sections without explicit cannot-conclude behavior.
- **Parent report language quality (core gate)**
  - Pass signed wording QA matrix for all 6 subjects.
  - Zero findings in categories:
    - robotic phrasing
    - repeated template feel
    - fake certainty
    - system-internal tone
    - unclear parent action
- **PDF quality (core gate)**
  - Pass signed PDF QA matrix on short and long reports.
  - Zero findings in categories:
    - clipping
    - broken tables
    - awkward/broken page breaks
    - unreadable charts
    - giant unintended empty regions
    - hierarchy mismatch vs on-screen report
    - broken Hebrew wrapping/readability
- **E2E/runtime stability**
  - `npm run test:parent-report-phase6` pass
  - `npm run build` pass
  - Manual route-flow pass for `parent-report` and `parent-report-detailed`.
- **Pedagogical acceptability**
  - All 6 subjects remain acceptable with no open blocking pedagogical issue.

### Definition of done (strict)
- **What must be true**
  - All Phase A–E exit gates passed.
  - All required matrices signed (manual, wording, PDF).
  - Final verification artifact pack complete.
- **What must not remain open**
  - No essential item in wording/PDF/QA/readability/fallback clarity remains open.
  - No required “later pass” remains for internal finished product.
- **Evidence proving completion**
  - Test outputs, signed matrices, PDF artifacts, checklist docs, and verdict docs in the final artifact pack.

---

## Part 3 — Final Execution Phases (A–E only)

### Phase A — Core Stabilization Closure
1. **goal**
- Close authority/contracts/fallback/engine safety/runtime stability.
2. **exact areas/files likely involved**
- [utils/parent-report-v2.js](utils/parent-report-v2.js)
- [utils/detailed-parent-report.js](utils/detailed-parent-report.js)
- [utils/diagnostic-engine-v2/run-diagnostic-engine-v2.js](utils/diagnostic-engine-v2/run-diagnostic-engine-v2.js)
- [utils/diagnostic-engine-v2/output-gating.js](utils/diagnostic-engine-v2/output-gating.js)
- [pages/learning/parent-report.js](pages/learning/parent-report.js)
3. **what must be implemented or fixed**
- Remove any remaining mixed-authority behavior.
- Ensure fallback remains explicit only.
- Harden contracts and cannot-conclude visibility across flows.
4. **what must be verified**
- Engine/authority automated suite pass.
- Contract validation on sparse/contradictory/mixed payloads.
5. **exit gate**
- Zero authority/contract/fallback blockers.
6. **what would count as fail**
- Any silent fallback, authority mismatch, or contract break.
7. **what cannot be left open after this phase**
- Any unresolved authority ambiguity.

### Phase B — Parent Report Final Quality Closure
1. **goal**
- Deliver parent report language and usability at finished-product quality.
2. **exact areas/files likely involved**
- [utils/parent-report-ui-explain-he.js](utils/parent-report-ui-explain-he.js)
- [utils/detailed-report-parent-letter-he.js](utils/detailed-report-parent-letter-he.js)
- [utils/detailed-parent-report.js](utils/detailed-parent-report.js)
- [components/parent-report-detailed-surface.jsx](components/parent-report-detailed-surface.jsx)
- [pages/learning/parent-report.js](pages/learning/parent-report.js)
- [pages/learning/parent-report-detailed.js](pages/learning/parent-report-detailed.js)
3. **what must be implemented or fixed**
- Eliminate robotic/repetitive phrasing.
- Make confidence/cannot-conclude wording natural and clear.
- Ensure recommendations are concrete, concise, and safe.
4. **what must be verified**
- Signed wording QA matrix (all 6 subjects, key scenario families).
- Double human review (language + pedagogy lens).
5. **exit gate**
- Wording matrix signed with zero blocking issues.
6. **what would count as fail**
- Any fake certainty, unclear parent action, or system-internal tone.
7. **what cannot be left open after this phase**
- Any wording issue that materially affects user understanding.

### Phase C — PDF Final Quality Closure
1. **goal**
- Deliver professional, stable, readable PDF output as core product quality.
2. **exact areas/files likely involved**
- [utils/math-report-generator.js](utils/math-report-generator.js)
- [pages/learning/parent-report.js](pages/learning/parent-report.js)
- [pages/learning/parent-report-detailed.js](pages/learning/parent-report-detailed.js)
- [components/parent-report-detailed-surface.jsx](components/parent-report-detailed-surface.jsx)
- [scripts/qa-parent-pages-visual.mjs](scripts/qa-parent-pages-visual.mjs)
3. **what must be implemented or fixed**
- Fix page-break behavior and continuity.
- Eliminate clipping and broken table/chart rendering.
- Stabilize long-text Hebrew wrapping and visual hierarchy parity.
4. **what must be verified**
- Signed PDF QA matrix over short and long reports, both routes, print/save flows.
- Artifact review with screenshot/PDF evidence for each matrix row.
5. **exit gate**
- PDF matrix signed with zero blocking defects.
6. **what would count as fail**
- Any clipping, unreadable chart/table, broken hierarchy, or severe blank-region artifact.
7. **what cannot be left open after this phase**
- Any unresolved PDF quality blocker.

### Phase D — Final Verification Closure
1. **goal**
- Close all verification gates (automated + manual + wording + PDF + regression + E2E).
2. **exact areas/files likely involved**
- [scripts/parent-report-phase1-selftest.mjs](scripts/parent-report-phase1-selftest.mjs)
- [scripts/topic-next-step-phase2.test.mjs](scripts/topic-next-step-phase2.test.mjs)
- [scripts/topic-next-step-engine-scenarios.mjs](scripts/topic-next-step-engine-scenarios.mjs)
- [scripts/diagnostic-engine-v2-harness.mjs](scripts/diagnostic-engine-v2-harness.mjs)
- [scripts/parent-report-phase6-suite.mjs](scripts/parent-report-phase6-suite.mjs)
- [scripts/parent-report-pages-ssr.mjs](scripts/parent-report-pages-ssr.mjs)
- [scripts/qa-parent-pages-visual.mjs](scripts/qa-parent-pages-visual.mjs)
- [.github/workflows/parent-report-tests.yml](.github/workflows/parent-report-tests.yml)
3. **what must be implemented or fixed**
- Ensure final acceptance set is complete and reproducible.
- Close any gap between required verification and CI/runner coverage.
4. **what must be verified**
- Full automated suite pass.
- Signed manual QA matrix, signed wording QA matrix, signed PDF QA matrix.
- Regression rerun after last fix batch.
5. **exit gate**
- All matrices signed and all automated gates green.
6. **what would count as fail**
- Any red automation gate or unsigned blocking matrix item.
7. **what cannot be left open after this phase**
- Any required verification item.

### Phase E — Finished-Product Closeout
1. **goal**
- Produce final closure artifacts and binary verdicts.
2. **exact areas/files likely involved**
- [docs/final-verification-pack.md](docs/final-verification-pack.md) (create if missing)
- [docs/pilot-readiness-package.md](docs/pilot-readiness-package.md)
- [docs/pedagogical-verdict-matrix.md](docs/pedagogical-verdict-matrix.md)
- [docs/stage1-freeze-checklist.md](docs/stage1-freeze-checklist.md)
- [docs/PARENT_REPORT_QA_CALIBRATION.md](docs/PARENT_REPORT_QA_CALIBRATION.md)
- [docs/final-verdict.md](docs/final-verdict.md) (create if missing)
3. **what must be implemented or fixed**
- Assemble final artifact pack and traceability to all pass/fail gates.
- Publish binary verdict documents.
4. **what must be verified**
- Artifact pack completeness and consistency.
- No blocker left in finished-product scope.
5. **exit gate**
- Final verdict docs approved with binary outcomes only.
6. **what would count as fail**
- Missing artifact evidence, unresolved blocker, or ambiguous verdict.
7. **what cannot be left open after this phase**
- Any essential item for finished internal product.

---

## Part 4 — Final Verification Framework

### Automated QA (hard gate)
- `npm run test:parent-report-phase1`
- `npm run test:topic-next-step-phase2`
- `npm run test:topic-next-step-engine-scenarios`
- `npm run test:diagnostic-engine-v2-harness`
- `npm run test:parent-report-phase6`
- `npm run build`
- **Pass/fail rule**: all pass, zero unresolved failures.

### Manual QA (hard gate)
- Matrix file: [docs/manual-qa-matrix.md](docs/manual-qa-matrix.md) (create if missing)
- Required dimensions:
  - route: parent / detailed
  - data shape: sparse / contradictory / fragile / mastery / mixed / recovery
  - all 6 subjects
  - fallback visibility
  - cannot-conclude clarity
- **Pass/fail rule**: matrix signed, zero blocking findings.

### Wording QA (hard gate)
- Matrix file: [docs/wording-qa-matrix.md](docs/wording-qa-matrix.md) (create if missing)
- Required criteria (explicit):
  - no robotic phrasing
  - no repeated template feel
  - no fake certainty
  - no system-internal tone
  - clear parent action
  - understandable by ordinary parent
  - concise but concrete
  - uncertainty phrased naturally
- **Pass/fail rule**: all criteria pass for each subject/scenario cell; signed by language + pedagogy reviewers.

### PDF QA (hard gate)
- Matrix file: [docs/pdf-qa-matrix.md](docs/pdf-qa-matrix.md) (create if missing)
- Required criteria (explicit):
  - no clipping
  - no broken tables
  - no awkward/broken page breaks
  - no unreadable charts
  - no giant unintended empty regions
  - no hierarchy mismatch vs on-screen version
  - Hebrew readable and properly wrapped
  - both short and long reports pass
- **Pass/fail rule**: zero blocking defects; signed by reviewer.

### Regression QA (hard gate)
- Rerun automated full suite after final fix batch.
- Re-check sampled manual + wording + PDF rows after final fix batch.
- **Pass/fail rule**: no new regression findings.

### Final Artifact Pack (concrete contents)
- [docs/final-verification-pack.md](docs/final-verification-pack.md) includes:
  - exact automated test outputs (command + result)
  - signed [docs/manual-qa-matrix.md](docs/manual-qa-matrix.md)
  - signed [docs/wording-qa-matrix.md](docs/wording-qa-matrix.md)
  - signed [docs/pdf-qa-matrix.md](docs/pdf-qa-matrix.md)
  - PDF artifacts/screenshots references for each PDF matrix row
  - wording review notes per subject/scenario
  - final checklist closure references:
    - [docs/pilot-readiness-package.md](docs/pilot-readiness-package.md)
    - [docs/pedagogical-verdict-matrix.md](docs/pedagogical-verdict-matrix.md)
    - [docs/stage1-freeze-checklist.md](docs/stage1-freeze-checklist.md)
  - final verdict doc reference: [docs/final-verdict.md](docs/final-verdict.md)

---

## Part 5 — Final Verdict Model (binary only)

### Product verdict
- `finished`
- `not finished`

### Pilot verdict
- `ready for controlled pilot`
- `not ready for controlled pilot`

### External readiness verdict
- `not claimed yet / requires external validation`

### Rules
- No `pass with leftovers`.
- No `almost ready`.
- No hidden follow-up pass after `finished`.

---

## Part 6 — Ready to execute?

`ready to execute finished-product plan`