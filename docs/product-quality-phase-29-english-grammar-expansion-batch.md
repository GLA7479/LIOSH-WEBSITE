# Product Quality Phase 29 — English Grammar Expansion Batch

**Last updated:** 2026-05-05  
**Status:** Implemented — adds **36** new grammar MCQ rows to close Phase 27 distribution targets for specific grade × difficulty cells.

**Changed file:** [`data/english-questions/grammar-pools.js`](../data/english-questions/grammar-pools.js).

**Report:** [`reports/question-audit/`](../reports/question-audit/) regenerated via `npx tsx scripts/audit-question-banks.mjs`.

---

## New pools (append-only)

| Pool key | Rows | `minGrade`/`maxGrade` | `difficulty` |
|----------|-----:|------------------------|--------------|
| `phase29_g2_standard` | **8** | 2 / 2 | `standard` |
| `phase29_g3_advanced` | **6** | 3 / 3 | `advanced` |
| `phase29_g4_advanced` | **6** | 4 / 4 | `advanced` |
| `phase29_g5_standard` | **8** | 5 / 5 | `standard` |
| `phase29_g6_standard` | **8** | 6 / 6 | `standard` |

Each item sets `patternFamily`, `skillId`, `subtype` (= pool key), `cognitiveLevel`, and `expectedErrorTypes` consistent with the rest of the grammar bank.

---

## Row identifiers (`patternFamily`)

### `phase29_g2_standard`

`phase29_g2_std_01` … `phase29_g2_std_08`

### `phase29_g3_advanced`

`phase29_g3_adv_01` … `phase29_g3_adv_06`

### `phase29_g4_advanced`

`phase29_g4_adv_01` … `phase29_g4_adv_06`

### `phase29_g5_standard`

`phase29_g5_std_01` … `phase29_g5_std_08`

### `phase29_g6_standard`

`phase29_g6_std_01` … `phase29_g6_std_08`

---

## Audit targets (after regeneration)

| Cell | Target | Result |
|------|--------|--------|
| `grammar` @ G2 · standard | ≥ 8 | **8** |
| `grammar` @ G3 · advanced | ≥ 6 | **6** |
| `grammar` @ G4 · advanced | ≥ 6 | **6** |
| `grammar` @ G5 · standard | ≥ 8 | **8** |
| `grammar` @ G6 · standard | ≥ 8 | **8** |

---

## Next

[**Phase 30**](product-quality-phase-30-english-expansion-quality-review.md) — quality review of all **52** new English rows (Phases 28 + 29).
