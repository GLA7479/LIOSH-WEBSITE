# Product Quality Phase 21 — Hebrew Intentional Spiral Audit Allowlist

**Last updated:** 2026-05-05  
**Status:** Implemented — **audit report noise reduction only**; **no** Hebrew question text, answers, difficulty, `patternFamily`, or runtime changes.

**Sources:** [`docs/product-quality-phase-20-hebrew-structural-cleanup-plan.md`](product-quality-phase-20-hebrew-structural-cleanup-plan.md) (C1 classification), [`scripts/question-audit-hebrew-spiral-allowlist.json`](../scripts/question-audit-hebrew-spiral-allowlist.json), [`scripts/audit-question-banks.mjs`](../scripts/audit-question-banks.mjs).

---

## 1. Goal

Stop treating **28** acceptable **Hebrew** adjacent-band overlaps (Phase 20 **C1** — intentional spiral repetition) as **unresolved** duplicate/overlap warnings in `reports/question-audit/stage2.json` / `findings.json` summaries.

**Non-goals:** editing question banks, Hebrew wording, product logic, UI, Parent AI, Copilot, APIs, or user-facing reports outside this audit artifact pipeline.

---

## 2. Behavior

| Artifact | Change |
|----------|--------|
| `stage2.withinBandClassPairOverlaps` | Contains **only unresolved** adjacent-band overlaps (Hebrew: **9** rows after split). |
| `stage2.hebrewIntentionalSpiralOverlaps` | **New** — **28** Hebrew rows matching the allowlist; each row includes `intentionalSpiral: true`, `phase20Classification: "C1"`, and a short `note`. |
| `findings.stage2Summary.withinBandOverlapCount` | Equals **unresolved** overlap count (**9** in current snapshot — Hebrew-only overlaps). |
| `findings.stage2Summary.hebrewIntentionalSpiralOverlapCount` | **28** |

**Matching rule:** Allowlist keys are composite strings (same band pair as emitted by the audit):

`bandPair|subject|patternFamily|stemHash|subtopic`

This preserves **H-O34** vs **H-O35**: same `stemHash` but different `patternFamily` — **neither** is allowlisted; both remain **unresolved**.

---

## 3. Allowlist contents

- **File:** [`scripts/question-audit-hebrew-spiral-allowlist.json`](../scripts/question-audit-hebrew-spiral-allowlist.json)  
- **Count:** **28** `keys` — aligned with Phase 20 rows **H-O02–H-O14**, **H-O21–H-O33**, **H-O36–H-O37**.

---

## 4. Hebrew findings still unresolved (not allowlisted)

**Adjacent-band overlaps (`withinBandClassPairOverlaps`):** **9** rows — **H-O01**, **H-O15–H-O20**, **H-O34**, **H-O35** (see [`docs/product-quality-phase-3-hebrew-owner-review.md`](product-quality-phase-3-hebrew-owner-review.md)).

**Phase 22 note:** One **internal G5 duplicate** for **H-O15** was removed from the question bank (identical copy in **G5 hard** vs **G5 medium**); the **g5_vs_g6** overlap signal for that stem **remains** (audit unresolved count still **9**). Details: [`docs/product-quality-phase-22-hebrew-unresolved-structural-fixes.md`](product-quality-phase-22-hebrew-unresolved-structural-fixes.md).

**Legacy triple-level stems (`findings.hebrewLegacySameStemThreeLevels`):** unchanged — **H-L1**, **H-L2** (not part of this Phase 21 split).

---

## 5. Regeneration

```bash
npx tsx scripts/audit-question-banks.mjs
```

Full pipeline (includes harness): `npm run audit:questions`

---

## 6. Verification checklist

| Check | Expected |
|-------|----------|
| Hebrew rows in `items.json` | **927** |
| `withinBandClassPairOverlaps.length` (unresolved) | **9** |
| `hebrewIntentionalSpiralOverlaps.length` | **28** |
| `hebrewLegacySameStemThreeLevels` | **2** groups (unchanged semantics) |

---

## 7. References

- Phase 20 structural plan: [`docs/product-quality-phase-20-hebrew-structural-cleanup-plan.md`](product-quality-phase-20-hebrew-structural-cleanup-plan.md)  
- Phase 1 audit narrative: [`docs/product-quality-phase-1-audit.md`](product-quality-phase-1-audit.md) (section 3 — Hebrew duplicate / overlap detail)
