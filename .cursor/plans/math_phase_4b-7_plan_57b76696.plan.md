---
name: Math Phase 4B-7 Plan
overview: Create `scripts/curriculum-audit/build-math-catalog-only-patch-plan.mjs` that reads existing reports, computes per-branch catalog gaps, proposes safe `mapsToNormalizedKeys` additions to `math-official-subsection-catalog.js`, and writes `math-catalog-only-patch-plan.{json,md}`. No edits to the catalog, generator, banks, or UI.
todos:
  - id: write-script
    content: Write scripts/curriculum-audit/build-math-catalog-only-patch-plan.mjs (reads 5 JSON inputs, builds coverage gap index, proposes extensions, writes plan JSON + MD)
    status: completed
  - id: update-package-json
    content: Add audit:curriculum:math-catalog-patch-plan script and append to math-source-hardening chain in package.json
    status: completed
  - id: update-docs
    content: "Update docs/curriculum-audit.md: phase table row, owner-rules bullet, Phase 4B-7 section, artifacts table entry"
    status: completed
  - id: run-and-verify
    content: Run math-catalog-patch-plan, math-source-hardening, qa:curriculum-audit, and build — confirm all exit 0
    status: completed
isProject: false
---

# Math Phase 4B-7 — Catalog-only Patch Plan

## Scope

Reports-only. The script identifies **which grades are missing** a normalized key in the catalog for each of the **20 `improve_subsection_catalog` branches**, proposes the safest extension per gap (add key to an existing section vs note a new section would be needed), and outputs a structured plan for owner review. **Nothing is edited.**

## Key inputs and what they provide

- [`reports/curriculum-audit/math-owner-approval-candidates.json`](reports/curriculum-audit/math-owner-approval-candidates.json) — the 20 catalog-only branches with row counts, grades, suspicion codes, no-candidate counts.
- [`reports/curriculum-audit/math-generator-branch-mapping.json`](reports/curriculum-audit/math-generator-branch-mapping.json) — `samplePreviews` and `classificationRationale` per branch.
- [`reports/curriculum-audit/math-row-subsection-candidates.json`](reports/curriculum-audit/math-row-subsection-candidates.json) — per-row data for enriched previews.
- [`reports/curriculum-audit/math-official-subsection-catalog.json`](reports/curriculum-audit/math-official-subsection-catalog.json) — current per-grade catalog to detect coverage gaps.
- [`reports/curriculum-audit/question-inventory.json`](reports/curriculum-audit/question-inventory.json) — topic/subtopic for branch enrichment.
- [`utils/curriculum-audit/math-official-subsection-catalog.js`](utils/curriculum-audit/math-official-subsection-catalog.js) — **read-only** source of truth; exact section keys shown in §Gap analysis below.

## Catalog gap analysis (already known from research — drives script logic)

The script builds a reverse index `normalizedKey → Set<grade>` from the catalog JSON, then for each branch computes **missing grades** = `gradesPresent \ coveredGrades`.

Key gaps identified:

- `math.addition_subtraction`: covered at grades 1–2 (`g1_add_sub_facts`, `g2_add_sub_multi_digit`); **gaps at grades 3, 4, 5, 6**. Affects `subtraction::sub_two` (281 rows), `addition::add_two` (234 rows), `addition::add_three` (19 rows, grades 5–6).
- `math.multiplication_division`: covered at g2, g3, g5; **gaps at grades 4, 6** for dedicated sections. Affects `multiplication::mul` (263 rows), `division_with_remainder::div_with_remainder` (112 rows), `division_with_remainder::div` (80 rows), `division::div_long` (9 rows, g4), `multiplication::mul_vertical` (7 rows, g4).
- `math.estimation_rounding`: covered at g1–g3; **gaps at grades 4, 5, 6**. Affects `rounding::round` (144 rows), `estimation::est_quantity` (34 rows), `estimation::est_mul` (31 rows), `estimation::est_add` (31 rows).
- `math.divisibility_factors`: covered at g3, g5, g6; **gap at grade 4** (`prime_composite::prime_composite`, 48 rows) and partial at g2 for `divisibility::divisibility` (144 rows, grades 2–4).
- `math.number_sense`: covered at g1–g3, g6; **gaps at grades 4, 5**. Affects `number_sense::ns_complement100` (57 rows), `number_sense::ns_place_hundreds` (54 rows), `zero_one_properties::*` (4 branches, 48 rows combined).

## Proposed change types per branch (script logic to encode)

For each missing grade the script will assign:

- `add_key_to_existing_section` when a natural host exists (e.g. add `math.addition_subtraction` to `g4_operations_fractions_decimals`, `g5_fractions_operations`, `g6_mixed_review`; add `math.multiplication_division` to `g4_operations_fractions_decimals` and `g6_divisibility_lcm_gcd`; add `math.estimation_rounding` to `g5_decimals_percent` and `g6_mixed_review`; add `math.divisibility_factors` to `g4_powers_ratio`; add `math.number_sense` to `g4_powers_ratio` or `g5_ratio_scale`).
- `propose_new_section` when no suitable host exists (e.g. `math.estimation_rounding` in g4 — no estimation-adjacent section; `math.number_sense` at g4 / g5 where existing sections focus on fractions/ratios).

Each record also gets:
- `confidence`: `high` (key fits existing section thematically) / `medium` (plausible fit) / `low` (new section required).
- `riskLevel`: `low` (catalog-audit-mapping only) / `medium` (proposed new section) — always including the caveat that **no runtime output changes**.
- `ownerDecisionNeeded`: defaults to `approve_catalog_edit` for `add_key_to_existing_section`, `request_more_samples` for `propose_new_section`.
- `safetyChecks`: object asserting `noGeneratorCodeChange: true`, `noStudentFacingTextChange: true`, `noUIChange: true`, `noStaticBankChange: true`, `onlyAuditMappingAffected: true`.
- `qaAfterApproval`: `["npm run audit:curriculum:math-subsection-candidates", "npm run audit:curriculum:math-generator-branches", "npm run audit:curriculum:math-approval-candidates"]`.

## New file: `scripts/curriculum-audit/build-math-catalog-only-patch-plan.mjs`

Pattern follows [`scripts/curriculum-audit/build-math-owner-approval-candidates.mjs`](scripts/curriculum-audit/build-math-owner-approval-candidates.mjs) exactly (same import style, `loadJson`, `isExecutedAsMainScript`). Key internal functions:

```js
// Reverse index: normalizedKey -> Set<number> of grades covered
function buildCoverageIndex(catalogPayload) { ... }

// For a missing grade + normalizedKey, find best existing section host
function suggestExtension(grade, normKey, catalogPayload) {
  // look through grade's sections for thematic match
  // return { targetSectionKey, changeType, confidence }
}

// For each catalog-only branch: compute gaps, propose changes
function planBranch(branch, approvalRecord, catalogPayload, coverageIdx, mappingBranch) { ... }
```

Output shape per branch:

```json
{
  "branchKey": "subtraction::sub_two",
  "affectedRowCount": 281,
  "gradesAffected": [1,2,3,4,5,6],
  "normalizedTopicKeys": ["math.addition_subtraction"],
  "noCandidateCount": 192,
  "competingCandidateCount": 0,
  "sampleQuestionPreviews": ["…"],
  "currentCatalogSectionCandidates": ["g1_add_sub_facts","g2_add_sub_multi_digit"],
  "missingCatalogGrades": [3,4,5,6],
  "proposedCatalogChanges": [
    {
      "targetGrade": 3,
      "changeType": "propose_new_section",
      "proposedNewSectionNote": "Grade 3 has no add/sub section; propose g3_add_sub_multistep",
      "targetFile": "utils/curriculum-audit/math-official-subsection-catalog.js",
      "confidence": "medium",
      "riskLevel": "medium"
    },
    {
      "targetGrade": 4,
      "changeType": "add_key_to_existing_section",
      "targetSectionKey": "g4_operations_fractions_decimals",
      "normalizedKeyToAdd": "math.addition_subtraction",
      "targetFile": "utils/curriculum-audit/math-official-subsection-catalog.js",
      "confidence": "high",
      "riskLevel": "low"
    },
    ...
  ],
  "safetyChecks": { "noGeneratorCodeChange": true, ... },
  "ownerDecisionNeeded": "approve_catalog_edit",
  "suggestedOwnerDecision": "approve_catalog_edit",
  "ownerApprovalRequired": true,
  "qaAfterApproval": [...]
}
```

## `package.json` changes

Add one script and extend the hardening chain:

```json
"audit:curriculum:math-catalog-patch-plan": "node --experimental-vm-modules scripts/curriculum-audit/build-math-catalog-only-patch-plan.mjs",
"audit:curriculum:math-source-hardening": "... && node --experimental-vm-modules scripts/curriculum-audit/build-math-catalog-only-patch-plan.mjs"
```

## `docs/curriculum-audit.md` changes

- Add row `| **4B-7 (Math)** | Complete | **Catalog-only patch plan** — branch-by-branch plan for the 20 `improve_subsection_catalog` branches (`math-catalog-only-patch-plan.*`). Planning only — catalog edits still require explicit owner approval. |` to the phase table.
- Update the owner-rules bullet to reference Phase 4B-7.
- Add a Phase 4B-7 section before Phase 4A with the bash block for the new npm script.
- Add `math-catalog-only-patch-plan.json / .md` to the Artifacts table.

## Execution order

1. Write `scripts/curriculum-audit/build-math-catalog-only-patch-plan.mjs`.
2. Update `package.json` (two script changes).
3. Update `docs/curriculum-audit.md` (four targeted `StrReplace` calls).
4. Run `npm run audit:curriculum:math-catalog-patch-plan` (verify exit 0).
5. Run `npm run audit:curriculum:math-source-hardening` (verify exit 0).
6. Run `npm run qa:curriculum-audit` (verify exit 0).
7. Run `npm run build` (verify exit 0).
