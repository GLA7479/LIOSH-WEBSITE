---
name: phase27-english-expansion-plan
overview: Prepare a planning-only Phase 27 backlog for English weak coverage cells with exact target counts, a small first batch, implementation rules, and closure criteria, without changing any content now.
todos:
  - id: baseline-english-cells
    content: Document current weak English cells and grammar distribution gaps with exact counts from Phase 26 baseline.
    status: completed
  - id: define-targets-and-gaps
    content: Set explicit launch minimum counts and numeric gaps per target cell, including file/pool/type/grade/difficulty metadata.
    status: completed
  - id: first-batch-design
    content: Design a 10–20 item first expansion batch focused on G1/G2 translation and G1 sentence, excluding grammar rewrite in batch 1.
    status: completed
  - id: rules-and-closure-criteria
    content: Define implementation content rules and measurable closure criteria (audit, metadata, duplicates, no-runtime-regression).
    status: completed
  - id: doc-update-plan
    content: Specify creation/update scope for Phase 27 doc and references in Phase 26 and Phase 8 docs.
    status: completed
isProject: false
---

# Product Quality Phase 27 Plan

## Goal
Build a planning-only English expansion backlog that targets weak coverage cells from Phase 26, defines exact launch minimums and gaps, and proposes a first 10–20 item batch without writing question content yet.

## Scope To Cover In Plan Document
- Weak-cell backlog for:
  - `english.translation @ G1` (current 2)
  - `english.translation @ G2` (current 5)
  - `english.sentence @ G1` (current 6)
  - Grammar distribution gaps (`grammar` by grade-difficulty)
  - Any additional weak English cells from Phase 26 matrix
- Per target cell include:
  - current count, desired launch minimum, gap
  - target file/pool, difficulty, grade range
  - question type (`runtime_translation`, sentence MCQ, grammar MCQ)
  - Hebrew involvement, owner exact wording required, risk level
- First small expansion batch (10–20 items total), focused on G1/G2 translation and/or G1 sentence, with no grammar rewrite in batch 1.
- Future implementation rules and closure criteria.

## Inputs To Use
- Coverage/readiness baseline: [docs/product-quality-phase-26-subject-content-readiness-summary.md](docs/product-quality-phase-26-subject-content-readiness-summary.md)
- Program context and status: [docs/product-quality-phase-8-subject-coverage-content-plan.md](docs/product-quality-phase-8-subject-coverage-content-plan.md)
- Translation runtime and audit behavior: [docs/product-quality-phase-14-english-translation-model-review.md](docs/product-quality-phase-14-english-translation-model-review.md), [docs/product-quality-phase-15-english-audit-representation-fix.md](docs/product-quality-phase-15-english-audit-representation-fix.md)
- Subtype closure context: [docs/product-quality-phase-24-english-subtype-metadata-review.md](docs/product-quality-phase-24-english-subtype-metadata-review.md), [docs/product-quality-phase-25-english-subtype-audit-representation-fix.md](docs/product-quality-phase-25-english-subtype-audit-representation-fix.md)
- Data and bank structure: [reports/question-audit/items.json](reports/question-audit/items.json), [data/english-questions/translation-pools.js](data/english-questions/translation-pools.js), [data/english-questions/sentence-pools.js](data/english-questions/sentence-pools.js), [data/english-questions/grammar-pools.js](data/english-questions/grammar-pools.js)

## Proposed Quantitative Defaults (to document explicitly)
- `translation @ G1`: current **2** -> launch minimum **8** (gap **+6**)
- `translation @ G2`: current **5** -> launch minimum **10** (gap **+5**)
- `sentence @ G1`: current **6** -> launch minimum **10** (gap **+4**)
- Grammar distribution balancing targets (future batch, not batch 1):
  - `grammar @ G2 standard`: current **0** -> minimum **8**
  - `grammar @ G3 advanced`: current **0** -> minimum **6**
  - `grammar @ G4 advanced`: current **0** -> minimum **6**
  - `grammar @ G5 standard`: current **0** -> minimum **8**
  - `grammar @ G6 standard`: current **0** -> minimum **8**

## Recommended First Small Expansion Batch (planning only)
- Total: **16 items** (within 10–20)
  - +6 `runtime_translation` for G1 (target pool: `translation-pools.js` -> `classroom`-style G1 entries)
  - +5 `runtime_translation` for G2 (target pools: `classroom`/`routines` G2)
  - +5 sentence MCQ for G1 (target pool: `sentence-pools.js` -> `base` G1)
- No grammar additions in batch 1 (kept for batch 2 once early-grade gaps are closed).

## File Outputs For Implementation Turn (after approval)
- Create: [docs/product-quality-phase-27-english-targeted-expansion-plan.md](docs/product-quality-phase-27-english-targeted-expansion-plan.md)
- Update summary references in:
  - [docs/product-quality-phase-26-subject-content-readiness-summary.md](docs/product-quality-phase-26-subject-content-readiness-summary.md)
  - [docs/product-quality-phase-8-subject-coverage-content-plan.md](docs/product-quality-phase-8-subject-coverage-content-plan.md)

## Acceptance / Closure Criteria To Include
- Weak-cell minimums reached (or explicit residual backlog with numeric delta).
- Audit run passes with no regressions in:
  - missing difficulty/subtype for English rows,
  - translation audit representation (`answerMode: runtime_translation`, `optionCount: runtime` for phrase rows),
  - duplicate stem checks.
- No runtime logic/report/API/UI changes.
- No Hebrew alternative wording without owner approval.
