# Product Quality Phase 27 — English Targeted Expansion Plan

**Last updated:** 2026-05-05  
**Status:** **Implemented** — Batch 1 + grammar distribution delivered in Phases [**28**](product-quality-phase-28-english-expansion-batch-1.md)–[**30**](product-quality-phase-30-english-expansion-quality-review.md). This document remains the historical planning baseline.

**Upstream:** [**Phase 26**](product-quality-phase-26-subject-content-readiness-summary.md) identified English as the weakest subject by coverage matrix; [**Phase 24–25**](product-quality-phase-24-english-subtype-metadata-review.md) closed audit **`subtype`** representation — remaining gap is **content volume / distribution**, not metadata.

**Sources:** [`reports/question-audit/items.json`](../reports/question-audit/items.json) (baseline aligned with Phase 26 export), [`data/english-questions/translation-pools.js`](../data/english-questions/translation-pools.js), [`data/english-questions/sentence-pools.js`](../data/english-questions/sentence-pools.js), [`data/english-questions/grammar-pools.js`](../data/english-questions/grammar-pools.js), [**Phase 14**](product-quality-phase-14-english-translation-model-review.md), [**Phase 15**](product-quality-phase-15-english-audit-representation-fix.md).

---

## 1. Baseline — weak English cells (Phase 26 audit matrix)

Counts use **topic × grade** expansion from [`reports/question-audit/items.json`](../reports/question-audit/items.json): a row contributes to grade *g* if `minGrade ≤ g ≤ maxGrade`.

### 1.1 Priority weak cells (explicit)

| Cell | Current count | Notes |
|------|---------------|--------|
| `english.translation` @ **G1** | **2** | Smallest practical cell |
| `english.translation` @ **G2** | **5** | Second-smallest |
| `english.sentence` @ **G1** | **6** | Thin vs upper grades |

### 1.2 Additional English signals (Phase 26)

| Signal | Evidence |
|--------|----------|
| Topic imbalance | `grammar` **683** vs `translation` **41** vs `sentence` **128** |
| Grade thinness (all English topics combined) | G1 **23** total rows vs G5 **291** |
| Grammar topic difficulty | **635** basic / **48** standard / **0** advanced (topic-level) |
| Translation topic difficulty | **7** basic / **17** standard / **17** advanced — low **volume** overall |

---

## 2. Target minimums, gaps, and placement

### 2.1 Launch minimums (weak cells — batch priority)

| Target cell | Current | Launch minimum | Gap | Primary bank file | Question type (audit) |
|-------------|--------:|---------------:|----:|-------------------|------------------------|
| `translation` @ G1 | 2 | 8 | **+6** | [`translation-pools.js`](../data/english-questions/translation-pools.js) | **`runtime_translation`** (phrase rows — Phase 15) |
| `translation` @ G2 | 5 | 10 | **+5** | `translation-pools.js` | **`runtime_translation`** |
| `sentence` @ G1 | 6 | 10 | **+4** | [`sentence-pools.js`](../data/english-questions/sentence-pools.js) | **sentence MCQ** (`answerMode` mcq, static options) |

**Combined gap for priority cells:** **+15** items (6+5+4).

### 2.2 Grammar distribution targets (Phase 2 expansion — **not** batch 1)

Balance **`grammar`** difficulty within grade bands where Phase 26 shows **zero** rows at the needed bucket. Targets below are **launch minimums** for a **later** implementation batch after early-grade translation/sentence closure.

| Target slice | Current (Phase 26 summary) | Launch minimum | Gap | Primary bank file | Question type |
|--------------|------------------------------|----------------|-----|-------------------|---------------|
| `grammar` @ G2 · **standard** | **0** | **8** | +8 | [`grammar-pools.js`](../data/english-questions/grammar-pools.js) | grammar MCQ |
| `grammar` @ G3 · **advanced** | **0** | **6** | +6 | `grammar-pools.js` | grammar MCQ |
| `grammar` @ G4 · **advanced** | **0** | **6** | +6 | `grammar-pools.js` | grammar MCQ |
| `grammar` @ G5 · **standard** | **0** | **8** | +8 | `grammar-pools.js` | grammar MCQ |
| `grammar` @ G6 · **standard** | **0** | **8** | +8 | `grammar-pools.js` | grammar MCQ |

**Topic-level:** add at least **20** grammar rows at **`advanced`** difficulty across eligible grades (supports closing **635/48/0** imbalance over time).

---

## 3. Per-target-cell specification (implementation checklist)

Use this table when authoring bank objects (future PR — not now).

### 3.1 Translation — `runtime_translation` phrase rows

| Field | Rule |
|-------|------|
| **Target file / pool** | Add objects under existing pools in [`translation-pools.js`](../data/english-questions/translation-pools.js): **`classroom`** (G1/G2 focus), **`routines`** (G2), optionally **`hobbies`** later — match **`minGrade`/`maxGrade`** to weak cell. |
| **Shape** | `{ en, he, minGrade, maxGrade, patternFamily, difficulty }` — **no** static `options` (Phase 14). |
| **`difficulty`** | Match product ladder: G1/G2 phrase expansion → mostly **`basic`**; some **`standard`** acceptable for G2 if aligned with pedagogy. |
| **Audit** | Phase 15: **`answerMode: runtime_translation`**, **`optionCount: runtime`** — **must not regress**. |
| **Hebrew text** | **Yes** — every phrase includes **`he`**; translations are bilingual pairs (Phase 14). |
| **Owner exact wording** | **Yes** for **Hebrew** strings if any editorial change is proposed; English wording should also be owner-reviewed if policy requires. |
| **Risk** | **Medium** — distractors at runtime come from general vocab (Phase 14); unnatural MCQ distractors possible until curated pass (optional later). |

### 3.2 Sentence — MCQ (`sentence` topic)

| Field | Rule |
|-------|------|
| **Target file / pool** | [`sentence-pools.js`](../data/english-questions/sentence-pools.js) — expand **`base`** pool for **G1** first (existing pattern: `template`, `options`, `correct`, grades, `patternFamily`, `subtype`). |
| **Question type** | Static **MCQ** — grammar MCQ / cloze style. |
| **Hebrew text** | **Possible** in **`explanation`** fields (existing bank mixes EN prompts with Hebrew explanations); any **new** Hebrew requires owner-approved exact wording per project rule. |
| **Owner exact wording** | **Yes** if adding/changing Hebrew in **`explanation`** or any learner-facing Hebrew. |
| **Risk** | **Low–medium** — duplicate **`template`** stems must be avoided (closure criteria). |

### 3.3 Grammar — MCQ (batch 2)

| Field | Rule |
|-------|------|
| **Target file** | [`grammar-pools.js`](../data/english-questions/grammar-pools.js) — add to pools consistent with grade gates (e.g. `present_simple`, `question_frames`, …). |
| **Question type** | grammar MCQ (`answerMode` mcq in audit). |
| **Hebrew text** | Often in **`explanation`** — owner rules apply. |
| **Risk** | **Medium** — large bank; avoid overlapping **`patternFamily`** / duplicate **`question`** stems. |

---

## 4. First expansion batch (16 items) — planning only

**Scope:** **10–20** items max; this batch = **16** total. **No grammar bank edits** in batch 1.

| # | Count | Target cell | Bank location | Type |
|---|------:|-------------|---------------|------|
| 1–6 | **6** | `translation` @ **G1** | `translation-pools.js` → extend **`classroom`** (and/or add G1-only phrases in **`routines`** if thematically cleaner) | `runtime_translation` |
| 7–11 | **5** | `translation` @ **G2** | `translation-pools.js` → **`classroom`** `translation_classroom_g2`, **`routines`** `translation_routines_g2` | `runtime_translation` |
| 12–16 | **5** | `sentence` @ **G1** | `sentence-pools.js` → **`base`** pool (new `template`/`options` rows, `minGrade`/`maxGrade` 1–1) | sentence MCQ |

**After batch 1 (expected audit deltas if targets hit):**

- `translation` @ G1: 2 → **8**
- `translation` @ G2: 5 → **10**
- `sentence` @ G1: 6 → **11** *(meets launch minimum **10**)*

**Optional 17th item (still ≤20):** buffer for **`translation` @ G1** or extra **`sentence` @ G1** if product wants round-number pools per grade.

---

## 5. Content rules (future implementation batch)

1. **Age-appropriate English** — vocabulary and sentence length match **`minGrade`/`maxGrade`**.
2. **Hebrew** — simple, natural classroom Hebrew for phrase pairs; **no** agent-generated alternative Hebrew without owner sign-off.
3. **Scoring / ambiguity** — correct answers must map cleanly to **`buildAcceptedAnswers`** behavior (Phase 14); avoid phrases with multiple equally valid translations unless product accepts them.
4. **No duplicate stems** — check new **`template`** / **`question`** / phrase **`en`||**`he`** against existing rows (normalized compare recommended).
5. **Metadata** — every row: **`difficulty`**, **`patternFamily`**, grade span; phrase rows remain without static `options` unless intentionally static MCQ.
6. **Audit** — run `npx tsx scripts/audit-question-banks.mjs` after edits; English rows must keep **0** missing **`subtype`** (Phase 25), **0** missing **`difficulty`**.
7. **No Hebrew alternative wording** policy — same as Phase 8 non-negotiable rule for Hebrew-facing edits.

---

## 6. Closure criteria (English expansion pass)

### 6.1 Coverage

- [ ] **`translation` @ G1** ≥ **8** audit rows (expanded eligibility).
- [ ] **`translation` @ G2** ≥ **10** audit rows.
- [ ] **`sentence` @ G1** ≥ **10** audit rows.
- [ ] **Grammar** distribution backlog: either **closed** per §2.2 minimums or **documented residual** with counts.

### 6.2 Audit / tooling

- [ ] `npx tsx scripts/audit-question-banks.mjs` exits **0**.
- [ ] English **`subtype`** missing = **0**; **`difficulty`** missing = **0** (post–Phase 25 baseline).
- [ ] Translation phrase rows: **`answerMode: runtime_translation`** and **`optionCount: runtime`** unchanged in meaning (Phase 15).
- [ ] No new duplicate-stem clusters beyond acceptable tolerance (spot-check `findings.json` / manual hash review).

### 6.3 Product boundaries

- [ ] **No** changes to [`pages/learning/english-master.js`](../pages/learning/english-master.js) unless a separate engineering phase is opened.
- [ ] **No** report schema / Parent AI / Copilot / API changes as part of content work.

---

## 7. Recommended next step (after owner approval)

1. Implement **batch 1** (§4) in **`translation-pools.js`** and **`sentence-pools.js`** only.
2. Regenerate [`reports/question-audit/`](../reports/question-audit/) and verify §6.
3. Plan **batch 2** grammar difficulty slices (§2.2).

---

## 8. דוח סיכום (Phase 27)

1. **קבצים:** נוצר [`docs/product-quality-phase-27-english-targeted-expansion-plan.md`](product-quality-phase-27-english-targeted-expansion-plan.md); עודכנו [`docs/product-quality-phase-26-subject-content-readiness-summary.md`](product-quality-phase-26-subject-content-readiness-summary.md) ו-[`docs/product-quality-phase-8-subject-coverage-content-plan.md`](product-quality-phase-8-subject-coverage-content-plan.md).

2. **תאים חלשים וספירות נוכחיות:** `translation@G1=2`, `translation@G2=5`, `sentence@G1=6`; חוסר פיזור ב-grammar (635 basic / 48 standard / 0 advanced ברמת topic).

3. **יעדי מינימום להשקה:** `translation@G1` **8**, `translation@G2` **10**, `sentence@G1` **10**; פערים **+6**, **+5**, **+4**; יעדי grammar לפי §2.2 (batch 2).

4. **מנה ראשונה מומלצת:** **16** פריטים — **6** תרגום G1, **5** תרגום G2, **5** משפט G1; **בלי** grammar ב-batch 1.

5. **שינוי תוכן בוצע?** **לא** — מסמך תכנון בלבד.

6. **נוסח אנגלית/עברית הופק?** **לא**.

7. **צעד יישום הבא:** אישור בעלים → עריכת בנקים לפי §4–§5 → הרצת אודיט ובדיקת §6.
