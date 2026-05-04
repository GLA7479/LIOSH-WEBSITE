# Product Quality Phase 22 — Hebrew Unresolved Structural Fix Plan + Safe Patch

**Last updated:** 2026-05-05  
**Status:** Inspection complete; **one** safe dedupe applied in [`utils/hebrew-question-generator.js`](../utils/hebrew-question-generator.js). **No** Hebrew wording, stems, answers, or runtime product logic changed beyond removing a redundant duplicate object.

**Sources:** [`reports/question-audit/items.json`](../reports/question-audit/items.json), [`reports/question-audit/stage2.json`](../reports/question-audit/stage2.json), [`reports/question-audit/findings.json`](../reports/question-audit/findings.json), [`utils/hebrew-question-generator.js`](../utils/hebrew-question-generator.js), [`utils/hebrew-rich-question-bank.js`](../utils/hebrew-rich-question-bank.js), [`docs/product-quality-phase-20-hebrew-structural-cleanup-plan.md`](product-quality-phase-20-hebrew-structural-cleanup-plan.md).

---

## Step A — Inspection summary (unresolved Hebrew findings)

Legend: **Stem identical** = same normalized `stemText` in audit; **Answers identical** = same MCQ option lists and correct index where applicable (audit rows often omit options — verified in **source**).

| ID | Source file | Source location | Grades / difficulty (audit) | patternFamily | stemHash | Stem text identical across collision? | Answers identical? | Classification | Safe structural action |
|----|-------------|-----------------|----------------------------|---------------|----------|----------------------------------------|---------------------|----------------|------------------------|
| **H-O01** | `utils/hebrew-question-generator.js` | `G1_*` → comprehension · line ~1480; `G2_*` → comprehension · line ~1778 | G1 **hard** vs G2 **easy** · `comprehension_typed_band_early_g1_g2` | `comprehension_typed_band_early_g1_g2` | `de0354911b95de9ad44cc026` | **Yes** (shared stem sentence) | **No** — G1/G2 **answer arrays differ** (e.g. distractors 3–4) | Same stem, **different items** + legacy bucket mismatch | **None without Hebrew or owner policy** — retag difficulty would misrepresent intent |
| **H-O15** | `utils/hebrew-question-generator.js` | `G5_MEDIUM_QUESTIONS.vocabulary` ~3923; ~~`G5_HARD_QUESTIONS.vocabulary`~~ (removed Phase 22); `G6_EASY_QUESTIONS` ~4125; `G6_MEDIUM_QUESTIONS` ~4335 | Late band · `vocabulary_typed` | `vocabulary_typed` | `67896186392d1f45166a2066` | **Yes** | **Mixed** — G5 medium duplicate of hard was **identical**; G6 rows use **different** correct-option wording | Cross-grade overlap + **internal G5 duplicate** | **Applied:** remove byte-identical duplicate from **G5 hard** (see Step C) |
| **H-O16** | `utils/hebrew-question-generator.js` | `G5_HARD_QUESTIONS.comprehension` ~3970; `G6_MEDIUM_QUESTIONS.comprehension` ~4209 | `comprehension_infer` | `68a9da2f2c17757224d1811c` | Same stem; **first answer option text differs** (G6 adds “ברמת חטיבת ביניים”) | **No** | Calibrated parallel, not duplicate | **None** — needs owner / editorial if stems should diverge |
| **H-O17** | same | ~3971 vs ~4210 | `comprehension_typed_band_late_g5_g6` | `1464d31153471210d8d526a5` | Same pattern as O16 | **No** | Same | **None** |
| **H-O18** | same | writing pools ~3995 vs ~4234 | `writing_spelling_band_late_g5_g6` | `ac17ef3c224d5be5d7d1e881` | Same stem; answers differ (depth wording) | **No** | Same | **None** |
| **H-O19** | same | speaking ~4055 vs ~4366 | `speaking_phrase_band_late_g5_g6` | `2f364c7a884f52a5d42b5fda` | Same stem; answers differ | **No** | Same | **None** |
| **H-O20** | same | speaking ~4056 vs ~4367 | `speaking_phrase_band_late_g5_g6` | `71d28944b66247a8ba283ae8` | Same stem; answers differ | **No** | Same | **None** |
| **H-O34** | `utils/hebrew-rich-question-bank.js` | Pool **rich#48** · object ~1260 (`sentence_correction` / `sv_agreement_plural`) | G5/G6 late · **hard** | `sentence_correction` | `42682abfc4af20a01f81d36a` | Same short stem **איזה משפט תקין?** | **No** — options test **subject–verb with plural eating** | Skill-tag / taxonomy conflict vs O35 | **None without stem differentiation** (forbidden here) or owner decision |
| **H-O35** | same | Pool **rich#50** · object ~1309 (`verb_agreement` / `plural_subject`) | G5/G6 late · medium\|hard | `verb_agreement` | **Same hash** | Same short stem | **No** — options test **הלכו** paradigm | Same | **None** |
| **H-L1** | `utils/hebrew-question-generator.js` | Multiple **`grammar`** entries titled **איזה משפט לא תקין?** across `G1_EASY` / `G1_MEDIUM` / `G1_HARD` | easy / medium / hard · `grammar_morphology` (typical) | (various `patternFamily` per item) | Multiple rows share phrase | **Phrase repeated**; **full MCQ differs** (different `answers`, `correct`) | **No** — not one duplicate item | **Not** a single duplicate row — **distinct questions** sharing opening | **None** — collapse would remove valid items |
| **H-L2** | same | Multiple **`בחרו משפט תקין:`** across G1 levels | same | same issue | **Phrase repeated**; items differ | **No** | Same | **None** |

---

## Step B — Safe fixes chosen

| Allowed fix type | Applied? | Notes |
|------------------|-----------|-------|
| Disable/remove exact duplicate from pool | **Yes** | **H-O15:** identical object in **G5_HARD** vs **G5_MEDIUM** |
| Retag difficulty / grade / patternFamily | **No** | Would alter semantics or hide real overlaps without owner sign-off |
| Merge O34/O35 taxonomies | **No** | Different skills and different answer sets — not a labeling mistake |

---

## Step C — Implemented patch

**Change:** Removed one vocabulary object from **`G5_HARD_QUESTIONS.vocabulary`** — the entry that was **byte-identical** to the entry already present under **`G5_MEDIUM_QUESTIONS.vocabulary`** (`question` / `answers` / `correct` / `subtopicId` for **מה אוצר מילים אקדמי?**).

**Rationale:** Same grade (G5), same stem, same answers — redundant exposure in both medium and hard pools. One copy remains in **G5 medium**.

**Not changed:** Hebrew strings, answer strings, correct indices, G6 variants (different wording — intentional).

---

## Audit verification (after patch)

| Metric | Before (Phase 21 baseline) | After Phase 22 |
|--------|----------------------------|----------------|
| Total audit rows | 12158 | **12157** |
| Hebrew rows | 927 | **926** |
| `hebrewIntentionalSpiralOverlaps` | 28 | **28** |
| `withinBandClassPairOverlaps` (unresolved) | 9 | **9** |
| Audit rows for H-O15 stemHash | 4 | **3** |

**Command:** `npx tsx scripts/audit-question-banks.mjs` — **pass** (exit 0).

---

## Remaining unresolved (owner / product)

- **H-O01**, **H-O16–H-O20**, **H-O34**, **H-O35**: overlap signals reflect **pedagogical or taxonomy choices**, or **different answers under same stem** — require **owner exact wording** or product policy before bank edits.
- **H-L1**, **H-L2**: finding keys aggregate **shared opening phrases**, not removable duplicate rows.

---

## References

- Phase 20 plan: [`docs/product-quality-phase-20-hebrew-structural-cleanup-plan.md`](product-quality-phase-20-hebrew-structural-cleanup-plan.md)  
- Phase 21 allowlist: [`docs/product-quality-phase-21-hebrew-spiral-allowlist.md`](product-quality-phase-21-hebrew-spiral-allowlist.md)  
- Phase 8 coverage: [`docs/product-quality-phase-8-subject-coverage-content-plan.md`](product-quality-phase-8-subject-coverage-content-plan.md)

---

## דוח סיכום (Phase 22)

1. **קבצים:** נוצר [`docs/product-quality-phase-22-hebrew-unresolved-structural-fixes.md`](product-quality-phase-22-hebrew-unresolved-structural-fixes.md); עודכנו [`docs/product-quality-phase-20-hebrew-structural-cleanup-plan.md`](product-quality-phase-20-hebrew-structural-cleanup-plan.md), [`docs/product-quality-phase-21-hebrew-spiral-allowlist.md`](product-quality-phase-21-hebrew-spiral-allowlist.md), [`docs/product-quality-phase-8-subject-coverage-content-plan.md`](product-quality-phase-8-subject-coverage-content-plan.md); שונה [`utils/hebrew-question-generator.js`](../utils/hebrew-question-generator.js); נוצרו מחדש [`reports/question-audit/*`](../reports/question-audit/).
2. **סוקרו:** כל רשימת הלא-פתורים: **H-O01**, **H-O15–H-O20**, **H-O34**, **H-O35**, **H-L1**, **H-L2** (מול מקור וביקורת).
3. **תוקן מבנית:** פריט **אחד** — הסרת כפילות זהה ב־**G5 hard vocabulary** (כפול ל־**G5 medium**) עבור **H-O15**.
4. **נשארו לא פתורים:** **H-O01**, **H-O16–H-O20**, **H-O34**, **H-O35**, **H-L1**, **H-L2**; חפיפת **H-O15** בין כיתות נשארת בתוצאת האודיט (**9** לא פתורים).
5. **סיבה:** ניסוח גזע/פיצוח מיומנות/דיפרנסיאציה גלויה דורשים בעלים; פריטי **O16–O20** מובחנים בין G5 ל־G6 בניסוח המסיחים; **O01** — גזע זהה אך מסיחים שונים; **O34/O35** — אותו גזע קצר אך תוכן MCQ שונה; **H-L1/H-L2** — מספר שאלות שונות עם אותה פתיחה.
6. **מונה חפיפות לא פתורות:** לפני **9**, אחרי **9** (לא ירד — כפילות שהוסרה הייתה בתוך G5 בלבד).
7. **אישור:** לא שונה טקסט עברי גלוי.
8. **אישור:** לא שונו מחרוזות תשובות או אינדקס תשובה נכונה (רק הוסר אובייקט כפול זהה).
9. **פקודה:** `npx tsx scripts/audit-question-banks.mjs` — **הצלחה** (exit 0).
10. **המשך מומלץ:** החלטות בעלים ל־**H-O01**, **O16–O20**, **O34/O35**; ניתוח נפרד ל־**H-L1/H-L2** לפי תוכן מלא (לא לפי פתיחה בלבד).
