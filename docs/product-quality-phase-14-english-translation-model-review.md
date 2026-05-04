# Product Quality Phase 14 — English Translation Model Review

**Last updated:** 2026-05-05  
**Status:** Review complete — **documentation only**. No changes to question banks, English or Hebrew wording, answers, UI, reports, Parent AI, Copilot, APIs, or learning logic.

## Purpose

Close the loop on English **translation** rows in [`reports/question-audit/items.json`](../reports/question-audit/items.json) where **`optionCount` is absent / falsy** (often described informally as “`optionCount=0`”). Determine whether that reflects the **runtime translation model** or an **audit/modeling bug**.

## Sources

| Artifact | Role |
|----------|------|
| [`data/english-questions/translation-pools.js`](../data/english-questions/translation-pools.js) | Canonical translation bank (`TRANSLATION_POOLS`) |
| [`reports/question-audit/items.json`](../reports/question-audit/items.json) | Per-row audit projection (`english_pool_item`, topic `translation`) |
| [`reports/question-audit/findings.json`](../reports/question-audit/findings.json) | No translation-specific finding strings (nothing additional for this pass) |
| [`scripts/audit-question-banks.mjs`](../scripts/audit-question-banks.mjs) | How `optionCount` and `stemText` are derived |
| [`pages/learning/english-master.js`](../pages/learning/english-master.js) | Runtime question construction, MCQ vs typing, scoring helpers |

## 1. Audit inventory (English · topic `translation`)

| Metric | Value |
|--------|------:|
| Total audit rows | **41** |
| Rows with **empty** `optionCount` (falsy after `opts.length \|\| ""`) | **36** |
| Rows with **numeric** `optionCount` **4** | **5** |

The **41** rows match the bank structure: **six** content pools × **six** phrases each (**36**) plus **`simulator_translation_mcq`** (**five** explicit MCQ rows).

## 2. Why most rows show no static `optionCount`

In `collectEnglishPool`, each pool item contributes:

```521:521:scripts/audit-question-banks.mjs
      const opts = item.options || item.answers || [];
```

```634:635:scripts/audit-question-banks.mjs
        answerMode: item.answerMode || "mcq",
        optionCount: opts.length || "",
```

Phrase-style translation entries (`en` / `he` only) have **no** `options` or `answers` array → `opts.length` is **0** → stored as **`""`** (empty string), not the literal number `0`.

**Conclusion:** For the **phrase pools**, empty `optionCount` is **expected from the current audit definition**. It does **not** mean the live activity has “zero choices” at runtime.

## 3. Two content shapes in one bank

### 3.1 Phrase pools (runtime-generated UI choices / typing)

Pools: **`classroom`**, **`routines`**, **`hobbies`**, **`community`**, **`technology`**, **`global`**.

Each holds **six** `{ en, he, minGrade, maxGrade, patternFamily, difficulty }` rows (no static options).

**Learning UI (`english-master.js`):**

- Grade profiles list **only** these six pool keys in `translationPools` — **`simulator_translation_mcq` is not included** ([`GRADE_PROFILES`](../pages/learning/english-master.js) ~203–249).
- For a picked phrase, `correctAnswer` is the **target string** (`sentence.he` for `en_to_he`, `sentence.en` for `he_to_en`).
- `resolveEnglishQType` decides **`choice`** vs **`typing`**:
  - **`en_to_he`** → always **`choice`** (MCQ).
  - **`he_to_en`** → **`typing`** when rules hit (e.g. hard level, higher grades, long answers); otherwise **`choice`** ([`resolveEnglishQType`](../pages/learning/english-master.js) ~392–397).
- When `qType === "choice"`, **wrong answers are sampled** from vocabulary keys (`WORD_LISTS`), **not** from sibling phrases in the translation pool ([`generateQuestion`](../pages/learning/english-master.js) ~914–954).

**Scoring:** `acceptedAnswers` is built via `buildAcceptedAnswers(correctAnswer)` — quote normalization, trimming, optional stripping of surrounding punctuation ([`buildAcceptedAnswers`](../pages/learning/english-master.js) ~464–487).

**Runtime params:** `mergedParams.answerMode` stores the resolved **`qType`** (`choice` / `typing`), which is **more accurate** than the audit’s static default **`answerMode: "mcq"`** for phrase rows.

### 3.2 `simulator_translation_mcq` (static MCQ rows)

**Five** rows (grades **2–6**), each with **`question`**, **`options` (4)**, **`correct`**, explanations, skill ids — see [`translation-pools.js`](../data/english-questions/translation-pools.js) from ~303 onward.

Audit rows for these show **`optionCount: 4`** and stems like `מה התרגום הנכון למשפט: "…"?`.

These items exist for **matrix / simulator / diagnostic alignment** (e.g. [`question-generator-adapters.mjs`](../scripts/learning-simulator/lib/question-generator-adapters.mjs) flattens all translation pools; [`diagnostic-unit-skill-alignment.js`](../utils/adaptive-learning-planner/diagnostic-unit-skill-alignment.js) references `simulator_translation_mcq`). They are **not** pulled into the main **`english-master`** translation topic via grade profiles.

## 4. Per-group summary (pool = item group)

All phrase pools: **answer model** = target-language string; **options** for MCQ = **generated at runtime** from vocab (not stored per phrase). **Audit** should eventually distinguish **`runtime_mcq`** / **`runtime_typing`** vs static MCQ — see §6.

| Pool | Phrases in bank | Audit rows | Static `optionCount` in audit | Runtime options |
|------|-----------------|-----------|------------------------------|-----------------|
| `classroom` | 6 | 6 | empty | Generated when `qType === "choice"` |
| `routines` | 6 | 6 | empty | Generated when `qType === "choice"` |
| `hobbies` | 6 | 6 | empty | Generated when `qType === "choice"` |
| `community` | 6 | 6 | empty | Generated when `qType === "choice"` |
| `technology` | 6 | 6 | empty | Generated when `qType === "choice"` |
| `global` | 6 | 6 | empty | Generated when `qType === "choice"` |
| `simulator_translation_mcq` | 5 | 5 | **4** | Fixed in source |

**English / Hebrew text:** Each phrase row is a bilingual pair in source; audit **`stemText`** for phrase rows uses `item.en || item.he` (single-language snippet), not the paired column — another **audit presentation** limitation, not a content defect.

## 5. Checks requested

| Check | Result |
|-------|--------|
| Missing **difficulty** (audit) | **0** / 41 missing |
| Missing **expected answer** in source | Phrase rows: **`he` / `en`** present; simulator rows: **`correct`** present |
| Unclear **scoring** | **Runtime is defined** (`choice` compares to `correctAnswer`; `typing` uses `acceptedAnswers`). Audit **`answerMode`** default **`mcq`** is **misleading** for phrase rows |
| **EN/HE pair** mismatch | Not systematically re-proofread in this phase; no automated mismatch signal in audit |
| **Grade** mismatch | Each phrase carries explicit **`minGrade` / `maxGrade`** matching per-grade `patternFamily`; simulator rows gated **2–6** |

## 6. Should the audit represent translation differently?

**Yes, as a future tooling improvement (not implemented here):**

1. **`optionCount`:** For phrase translation rows, either omit the column, emit a sentinel like **`runtime`**, or derive an illustrative count from `GRADE_PROFILES[grade].choiceCount` plus `resolveEnglishQType` rules — **without** implying static bank options.
2. **`answerMode`:** Align with runtime (`choice` / `typing`) or add `runtime_answer_mode` rather than default **`mcq`** for all phrase rows.
3. **`stemText`:** Optionally audit **both** `en` and `he` for translation phrase rows for bilingual QA.

## 7. Risk summary

| Risk | Level | Notes |
|------|-------|------|
| Misreading empty `optionCount` as “broken MCQ” | **Medium (process)** | Clarified: **expected** with current audit rules |
| MCQ distractors sampled from **general vocab**, not phrase neighbors | **Medium (pedagogy)** | Known design; may produce unnatural distractors vs. curated sets |
| **`simulator_translation_mcq`** not in main translation pools | **Low** | Intended separation; avoid confusing simulator-only rows with live translation prompts |
| Metadata / difficulty gaps for translation | **Low** here | **No** missing difficulty in audit output for these **41** rows |

**Critical / high content defects:** **None identified** in this documentation-only review.

## 8. Content changes

**None.** No bank files or prompts were edited.

## 9. Recommended next English patch (when implementation is allowed)

1. **Audit-only:** Extend [`scripts/audit-question-banks.mjs`](../scripts/audit-question-banks.mjs) (or a small helper) so English translation phrase rows expose **meaningful** `optionCount` / **answer mode** metadata — **without** changing any learner-facing strings or answers.
2. **Optional product follow-up:** If distractor quality matters for translation MCQ, consider **curated** wrong answers per phrase or pool — **separate** content project; out of scope for Phase 14.

---

*Cross-reference:* Phase 1 audit pipeline — [`docs/product-quality-phase-1-audit.md`](product-quality-phase-1-audit.md).
