# Product Quality Phase 28 — English Expansion Batch 1

**Last updated:** 2026-05-05  
**Status:** Implemented — adds **16** new English pool rows per [**Phase 27**](product-quality-phase-27-english-targeted-expansion-plan.md) Batch 1 scope.

**Changed files:** [`data/english-questions/translation-pools.js`](../data/english-questions/translation-pools.js), [`data/english-questions/sentence-pools.js`](../data/english-questions/sentence-pools.js).

**Report:** [`reports/question-audit/`](../reports/question-audit/) regenerated via `npx tsx scripts/audit-question-banks.mjs`.

---

## Scope (exact counts)

| Bucket | Count | Grade gate | Bank location |
|--------|------:|------------|---------------|
| `runtime_translation` phrase rows | **6** | G1 only | `TRANSLATION_POOLS.classroom` |
| `runtime_translation` phrase rows | **5** | G2 only | `TRANSLATION_POOLS.classroom` (+3), `TRANSLATION_POOLS.routines` (+2) |
| Sentence MCQ (`base` pool) | **5** | G1 only | `SENTENCE_POOLS.base` |

**Total new rows:** **16**.

---

## Added translation phrases (runtime MCQ at runtime; audit: `answerMode: runtime_translation`, `optionCount: runtime`)

### G1 — `classroom`

| # | `patternFamily` | English | Hebrew |
|---|-----------------|---------|--------|
| 1 | `translation_classroom_g1_p28a` | Thank you, teacher | תודה, מורה |
| 2 | `translation_classroom_g1_p28b` | Good morning, class | בוקר טוב, כיתה |
| 3 | `translation_classroom_g1_p28c` | I have a pencil | יש לי עפרון |
| 4 | `translation_classroom_g1_p28d` | This is my bag | זה התיק שלי |
| 5 | `translation_classroom_g1_p28e` | Look at the board | הסתכלו על הלוח |
| 6 | `translation_classroom_g1_p28f` | We like our school | אנחנו אוהבים את בית הספר שלנו |

### G2 — `classroom`

| # | `patternFamily` | English | Hebrew |
|---|-----------------|---------|--------|
| 7 | `translation_classroom_g2_p28a` | Please open your book | בבקשה פתחו את הספר |
| 8 | `translation_classroom_g2_p28b` | Work with a partner | עבדו עם בן זוג |
| 9 | `translation_classroom_g2_p28c` | Put your things away | סידרו את הדברים |

### G2 — `routines`

| # | `patternFamily` | English | Hebrew |
|---|-----------------|---------|--------|
| 10 | `translation_routines_g2_p28d` | I wash my hands before lunch | אני שוטף ידיים לפני ארוחת צהריים |
| 11 | `translation_routines_g2_p28e` | We turn off the lights at night | אנחנו מכבים את האורות בלילה |

---

## Added sentence MCQ rows (`base`)

| # | `patternFamily` / `skillId` | Template | Correct |
|---|-----------------------------|----------|---------|
| 1 | `base_be_toy_g1_p28` | My toy ___ red | is |
| 2 | `base_be_ducks_g1_p28` | The ducks ___ in the pond | are |
| 3 | `base_be_juice_g1_p28` | Juice ___ cold in the fridge | is |
| 4 | `base_be_parents_g1_p28` | Mom and Dad ___ home now | are |
| 5 | `base_be_baby_g1_p28` | The baby ___ sleepy | is |

All include `difficulty: basic`, `subtype: base`, and full metadata consistent with neighboring `base` items.

---

## Audit deltas (topic × grade expansion)

| Cell | Before | After |
|------|-------:|------:|
| `translation` @ G1 | 2 | **8** |
| `translation` @ G2 | 5 | **10** |
| `sentence` @ G1 | 6 | **11** |

---

## Next

[**Phase 29**](product-quality-phase-29-english-grammar-expansion-batch.md) — grammar distribution batch (grade × difficulty targets).
