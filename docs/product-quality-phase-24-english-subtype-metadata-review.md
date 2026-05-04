# Product Quality Phase 24 — English Subtype Metadata Review

**Last updated:** 2026-05-05  
**Status:** Documentation only — **no** English question text, Hebrew wording, answers, indices, scoring, runtime, UI, reports, Parent AI, Copilot, APIs, or bank files were modified.

**Follow-up:** [**Phase 25**](product-quality-phase-25-english-subtype-audit-representation-fix.md) implemented **Option A** in [`scripts/audit-question-banks.mjs`](../scripts/audit-question-banks.mjs) and regenerated [`reports/question-audit/`](../reports/question-audit/) — audit **`subtype`** now defaults from **`poolKey`** when the bank omits it (**621** → **0** empty in export). **No** bank file edits.

**Sources:** [`reports/question-audit/items.json`](../reports/question-audit/items.json), [`reports/question-audit/findings.json`](../reports/question-audit/findings.json), [`docs/product-quality-phase-8-subject-coverage-content-plan.md`](product-quality-phase-8-subject-coverage-content-plan.md), [`docs/product-quality-phase-14-english-translation-model-review.md`](product-quality-phase-14-english-translation-model-review.md), [`docs/product-quality-phase-15-english-audit-representation-fix.md`](product-quality-phase-15-english-audit-representation-fix.md), [`scripts/audit-question-banks.mjs`](../scripts/audit-question-banks.mjs) (`collectEnglishPool`), [`data/english-questions/grammar-pools.js`](../data/english-questions/grammar-pools.js), [`data/english-questions/translation-pools.js`](../data/english-questions/translation-pools.js), [`data/english-questions/sentence-pools.js`](../data/english-questions/sentence-pools.js).

---

## 1. Executive conclusion

**621** English audit rows show **empty `subtype`**. For **all 621**, the audit already carries an equivalent **pool / skill bucket** in **`subtopic`** (grammar / translation **pool key**) and a granular **`patternFamily`** (often grade-scoped, e.g. `question_frames_g2`, `modals_g5`). Grammar rows may also include **`grammar_line_id`**.

**Verdict:** This is **not** a learner-facing content defect. It is primarily an **audit / schema completeness** issue (the `subtype` column unused for most pools) plus optional **bank enrichment** if product analytics require a literal `subtype` field on every JSON object.

**Critical / high issues:** **None** identified for this pass.

---

## 2. Inventory — English rows missing `subtype`

| Metric | Value |
|--------|-------|
| English rows in audit (`subject === english`) | **852** |
| Rows with **non-empty** `subtype` | **231** |
| Rows with **empty** `subtype` | **621** |

### 2.1 By source file

| Source file | Missing `subtype` count |
|-------------|-------------------------|
| [`data/english-questions/grammar-pools.js`](../data/english-questions/grammar-pools.js) | **585** |
| [`data/english-questions/translation-pools.js`](../data/english-questions/translation-pools.js) | **36** |
| [`data/english-questions/sentence-pools.js`](../data/english-questions/sentence-pools.js) | **0** |

All **128** sentence rows include `subtype` (e.g. `routine`, `descriptive`, `narrative`, `advanced`). **Grammar** objects mostly omit `subtype` except pools **`be_basic`** and **`present_simple`**, which were enriched (see file header comment + explicit `subtype` on items).

### 2.2 By topic

| Topic | Missing `subtype` |
|-------|---------------------|
| grammar | **585** |
| translation | **36** |

### 2.3 By `patternFamily` (all missing-subtype rows)

**Grammar (585)** — **12** `patternFamily` values (counts sum to **585**):

| patternFamily | Count |
|---------------|-------|
| question_frames_g2 | 49 |
| question_frames_g3 | 49 |
| progressive | 49 |
| past_simple | 49 |
| modals_g5 | 49 |
| modals_g6 | 49 |
| future_forms | 49 |
| complex_tenses | 49 |
| conditionals | 49 |
| quantifiers | 48 |
| comparatives_g5 | 48 |
| comparatives_g6 | 48 |

**Translation phrase rows (36)** — `answerMode` **`runtime_translation`** per [**Phase 15**](product-quality-phase-15-english-audit-representation-fix.md); **20** distinct `patternFamily` strings (six pools × grade slices; some slices have **2** rows and a few **1** — see audit export). Totals sum to **36**.

### 2.4 By difficulty (missing `subtype` only)

| difficulty | Count |
|------------|-------|
| basic | **591** |
| standard | **15** |
| advanced | **15** |

### 2.5 By grade span (`minGrade`–`maxGrade`)

| Span | Count |
|------|-------|
| 5–5 | 203 |
| 6–6 | 202 |
| 3–3 | 57 |
| 4–4 | 56 |
| 2–2 | 53 |
| 4–5 | 48 |
| 1–1 | 2 |

### 2.6 By `answerMode`

| answerMode | Count |
|------------|-------|
| mcq | **585** |
| runtime_translation | **36** |

### 2.7 By pool key (`subtopic`, identical to grammar/translation pool)

**Grammar — approximate row totals by pool** (from audit `subtopic` / `poolKey`):

| Pool key | ~Rows |
|----------|-------|
| question_frames | 98 |
| modals | 98 |
| comparatives | 96 |
| progressive | 49 |
| past_simple | 49 |
| future_forms | 49 |
| complex_tenses | 49 |
| conditionals | 49 |
| quantifiers | 48 |

**Translation** — six phrase pools × six phrases = **36** rows (`classroom`, `routines`, `hobbies`, `community`, `technology`, `global`) — aligns with [**Phase 14**](product-quality-phase-14-english-translation-model-review.md).

---

## 3. Is `subtype` already represented?

| Row kind | Where taxonomy lives today | Assessment |
|----------|----------------------------|------------|
| Grammar MCQ (missing `subtype`) | **`subtopic`** = pool key; **`patternFamily`** = fine-grained skill + grade split; optional **`grammar_line_id`** | **Already represented** for reporting — `subtype` empty is **redundant gap** if consumers can read `subtopic` / `patternFamily`. |
| Translation phrase (`runtime_translation`) | **`patternFamily`** encodes pool + grade slice (e.g. `translation_community_g4`); stem model per Phase 14 | **Already represented**; empty `subtype` **expected** unless bank adds a field. |
| Sentence pools | **`subtype`** populated on bank items | **No gap** for sentence topic. |

---

## 4. Classification by group (recommended action)

| Group | Nature | Recommended action (Phase 24 decision) |
|-------|--------|----------------------------------------|
| Grammar pools except `be_basic` / `present_simple` | Bank objects usually **omit** `subtype`; **`subtopic`** in audit = pool key | **Keep as-is** for this pass **or** future **audit representation fix**: default audit `subtype` ← `subtopic` when blank (**no** English text change). |
| Grammar `be_basic` / `present_simple` | **98** rows already have `subtype` in bank | N/A (not in the 621 gap). |
| Translation phrase (**36**) | No static options; **Phase 15** audit labels correct | **Keep as-is** **or** **derive subtype in audit** from pool key / `patternFamily` suffix — **audit-only**. |
| Translation `simulator_translation_mcq` (**5**) | Already have `subtype` **`simulator_translation_mcq`** | Not part of **621** gap. |

**Owner / content review** is **not** required solely because `subtype` is empty — unless product policy mandates the literal JSON field for external exports.

---

## 5. Relationship to Phase 14 / 15

- [**Phase 14**](product-quality-phase-14-english-translation-model-review.md): Explains **runtime** translation behavior; **not** a subtype gap issue.
- [**Phase 15**](product-quality-phase-15-english-audit-representation-fix.md): Fixed **`answerMode`** / **`optionCount`** for phrase rows — **orthogonal** to `subtype` sparsity.

---

## 6. Recommended first English “subtype” patch

**Option A (preferred for zero bank churn):** Implemented in [**Phase 25**](product-quality-phase-25-english-subtype-audit-representation-fix.md) — [`scripts/audit-question-banks.mjs`](../scripts/audit-question-banks.mjs) uses **`englishAuditSubtype(item, poolKey)`** when emitting `english_pool_item` (trimmed bank **`subtype`** when present, else **`poolKey`**). Audit consumers no longer see **621** empty **`subtype`** rows.

**Option B (not executed):** Add **`subtype`** mirroring pool key or `patternFamily` on each grammar / translation bank object — **metadata-only** batch, **no** stem/answer edits — increases file size and duplication.

---

## 7. Confirmations (Phase 24)

| Confirmation | Status |
|--------------|--------|
| Question / answer content changed | **No** |
| Scoring / runtime / UI / reports / AI surfaces changed | **No** |

---

## 8. דוח סיכום (Phase 24)

1. **קבצים:** נוצר [`docs/product-quality-phase-24-english-subtype-metadata-review.md`](product-quality-phase-24-english-subtype-metadata-review.md); עודכנו [`docs/product-quality-phase-8-subject-coverage-content-plan.md`](product-quality-phase-8-subject-coverage-content-plan.md) ו-[`docs/product-quality-phase-1-audit.md`](product-quality-phase-1-audit.md).
2. **כמה שורות אנגלית בלי subtype:** **621** מתוך **852**.
3. **אילו קבצים/בריכות:** **`grammar-pools.js` — 585** (בריכות כמו **question_frames**, **modals**, **comparatives**, …); **`translation-pools.js` — 36** (שורות **runtime_translation** מכל ששת ה-pools).
4. **סוג בעיה:** בעיקר **ייצוג באודיט / עקביות עמודות** — לכל השורות יש **`subtopic`** (מפתח בריכה) ו-**`patternFamily`** מפורט; **לא** נמצא חוסר תוכן לומד בפני עצמו.
5. **קריטי / גבוה:** **אין**.
6. **תיקון ראשון מומלץ:** ברירת מחדל באודיט בלבד: **`subtype` ← `poolKey` / `subtopic`** כשהשדה ריק בבנק — ללא שינוי טקסט שאלות.
7. **שינוי תוכן:** **לא**.
8. **שינוי תשובות / ציון / ריצה:** **לא**.
9. **המשך מומלץ:** יושם **אופציה A** ב-[**Phase 25**](product-quality-phase-25-english-subtype-audit-representation-fix.md); להמשך אופציונלי — **אופציה B** בבנק אם נדרש שדה ליטרלי בקבצים.

---

## 9. Phase 25 reference

See [**Phase 25 — English Subtype Audit Representation Fix**](product-quality-phase-25-english-subtype-audit-representation-fix.md) for implementation details, verification counts, and confirmations.
