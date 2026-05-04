# Product Quality Phase 13 — Science content fix (owner-approved)

**Last updated:** 2026-05-05  
**Scope:** Science only — **one** Hebrew text edit in [`data/science-questions.js`](../data/science-questions.js).

## Boundary

| Check | Result |
|-------|--------|
| Stems changed? | **No** |
| `correctIndex` changed? | **No** |
| Explanation / theoryLines changed? | **No** |
| Other options changed? | **No** |
| `exp_1` or any other question touched? | **No** |
| Metadata (`topic`, `patternFamily`, `grades`, difficulty params) changed? | **No** |
| UI / reports / APIs changed? | **No** |

## Item: `animals_4`

| Field | Value |
|-------|--------|
| **File** | `data/science-questions.js` |
| **topic** | `animals` |
| **patternFamily** | `sci_environment_ecosystems` |
| **Grades** | `g5`, `g6` |
| **correctIndex** | **1** (unchanged) |

### Change (option at index 1 only)

**Removed:**

`סדרה של יצורים חיים שבה כל אחד נטרף על ידי הבא אחריו`

**Inserted (owner-approved exact wording):**

`רצף של יצורים חיים שבו כל יצור משמש מזון ליצור הבא אחריו`

## Item intentionally unchanged: `exp_1`

Optional low-priority wording polish — **no edit** in this phase.

## Verification

- Command: `npx tsx scripts/audit-question-banks.mjs` — **pass** (exit code 0); `reports/question-audit/*` regenerated.

## Related docs

- Phase 12 backlog note updated: [`docs/product-quality-phase-12-science-full-content-review.md`](product-quality-phase-12-science-full-content-review.md).
