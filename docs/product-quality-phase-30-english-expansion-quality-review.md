# Product Quality Phase 30 — English Expansion Quality Review

**Last updated:** 2026-05-05  
**Status:** Complete — all **52** new English bank rows (Phases **28** + **29**) reviewed; issues found in **new** content only were fixed in the same workstream (no legacy edits).

**Scope:** Review new items for typos, duplicate **stems** (vs full bank export), unclear keys/distractors, grade/metadata mismatches, and audit regressions.

---

## Verification commands (all passed)

| Command | Result |
|---------|--------|
| `npx tsx scripts/audit-question-banks.mjs` | Exit **0** — `reports/question-audit/*` regenerated |
| `npm run build` | Exit **0** (existing webpack “Critical dependency” warnings unchanged) |

---

## Global audit checks

| Check | Expected | Actual |
|-------|----------|--------|
| Total rows delta | +52 | **12157 → 12209** |
| English rows delta | +52 | **852 → 904** |
| Non-English rows unchanged | **11305** | **11305** |
| English missing `difficulty` | **0** | **0** |
| English missing `subtype` | **0** | **0** |
| `nearDup` (findings) | **0** new duplicate stems | **0** |
| Translation phrase audit (`runtime_translation` / `runtime`) | All phrase-only translation rows | **OK** (simulator MCQ rows remain explicit MCQ) |

**Findings snapshot:** `exactCrossGrade(all)=0`, `exactStatic=0`, `nearDup=0`, `familyWide=10` (unchanged English-wide signal — **no** new family-wide rows attributed to this expansion).

---

## Target cells — before → after

Counts use topic × grade expansion from [`reports/question-audit/items.json`](../reports/question-audit/items.json) (`minGrade ≤ g ≤ maxGrade`) and exact `difficulty` match.

| Target | Before | After |
|--------|-------:|------:|
| `translation` @ G1 | 2 | **8** |
| `translation` @ G2 | 5 | **10** |
| `sentence` @ G1 | 6 | **11** |
| `grammar` @ G2 · standard | 0 | **8** |
| `grammar` @ G3 · advanced | 0 | **6** |
| `grammar` @ G4 · advanced | 0 | **6** |
| `grammar` @ G5 · standard | 0 | **8** |
| `grammar` @ G6 · standard | 0 | **8** |

**Phase 27 launch minimums:** satisfied for all listed weak cells (sentence @ G1 exceeds minimum **10**).

---

## Per-item review summary

### Phase 28 — Batch 1 (16 items)

| Area | Result |
|------|--------|
| Translation phrases | **Pass** — simple **en/he** pairs; Hebrew adjusted once for neutral plural (“We like our school”) to avoid gender skew. |
| Sentence `base` MCQ | **Pass** — single clear **be**-verb agreement; distractors are wrong agreement forms only. |

### Phase 29 — Grammar batch (36 items)

| Area | Result |
|------|--------|
| Options / keys | **Pass** — corrected **G3** item `phase29_g3_adv_06` options during review (removed duplicate **heard** option). |
| Grade gates | **Pass** — each pool locked to a single grade band as designed. |
| Content safety | **Pass** — school/life contexts only; no sensitive topics. |

---

## Files touched (Phases 28–30)

| File | Role |
|------|------|
| [`data/english-questions/translation-pools.js`](../data/english-questions/translation-pools.js) | Phase 28 translation phrases |
| [`data/english-questions/sentence-pools.js`](../data/english-questions/sentence-pools.js) | Phase 28 sentence MCQ |
| [`data/english-questions/grammar-pools.js`](../data/english-questions/grammar-pools.js) | Phase 29 grammar MCQ |
| [`reports/question-audit/*`](../reports/question-audit/) | Regenerated audit artifacts |
| [`docs/product-quality-phase-28-english-expansion-batch-1.md`](product-quality-phase-28-english-expansion-batch-1.md) | Phase 28 documentation |
| [`docs/product-quality-phase-29-english-grammar-expansion-batch.md`](product-quality-phase-29-english-grammar-expansion-batch.md) | Phase 29 documentation |
| This file | Phase 30 documentation |

**Not modified:** runtime scoring, UI, report generators, Parent AI, Copilot, APIs, non-English banks, [`scripts/audit-question-banks.mjs`](../scripts/audit-question-banks.mjs) (no reporting bugs found).

---

## סיכום בעברית (תוצאות סופיות)

ראה את הדוח הסופי בהודעת הסיכום של הסוכן — כולל רשימת פריטים, פקודות, ואישור גבולות שינוי.
