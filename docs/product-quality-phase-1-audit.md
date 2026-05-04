# Product Quality Phase 1 — Question Banks + Learning Flow + Parent Report

**Last updated:** 2026-05-05 (Phase 17 — Geometry generator audit rows: **`subtype`** filled from **`kind`** when absent; audit re-run **12158** rows)  
**Scope:** Learning product quality only (not security, not production hardening, not report/AI code changes).

### Phase 3 — Hebrew owner review

[`docs/product-quality-phase-3-hebrew-owner-review.md`](product-quality-phase-3-hebrew-owner-review.md) maps owner decisions for Hebrew overlap findings from §3 below (**legacy triple stems + 37 adjacent-band rows**). **No Hebrew question content was edited** in Phase 3. **Next step:** owner approval on that map **before** any Hebrew wording or bank merges.

### Phase 4 — Parent report product review

[`docs/product-quality-phase-4-parent-report-review.md`](product-quality-phase-4-parent-report-review.md) reviews parent report **surfaces** (short/detailed, disclaimer, weak-data messaging, contract blocks, print/PDF, Parent AI insight) as **product/experience** — **documentation only**; **no** report code, Parent AI logic, or Hebrew copy was changed. **Next step:** owner UAT + editorial sign-off ([`docs/PARENT_REPORT_EDITORIAL_SIGNOFF.md`](PARENT_REPORT_EDITORIAL_SIGNOFF.md)) before any approved copy/layout tweaks.

### Phase 5 — Mobile + RTL + basic UX audit

[`docs/product-quality-phase-5-mobile-rtl-ux-audit.md`](product-quality-phase-5-mobile-rtl-ux-audit.md) records mobile/RTL/UX risks and maps them to [`docs/mobile-rtl-manual-qa-checklist.md`](mobile-rtl-manual-qa-checklist.md).

### Phase 6 — Focused mobile/RTL UX fixes

[`docs/product-quality-phase-6-focused-ux-fixes.md`](product-quality-phase-6-focused-ux-fixes.md) implements **P5-01, P5-02, P5-03** (RTL on Layout + learning hub, browser zoom, Hebrew parent-login errors). **P5-04–P5-10** remain **device QA** only. **Next step:** owner confirms fixes on hardware + runs remaining checklist rows.

### Phase 8 — Subject coverage & content plan

[`docs/product-quality-phase-8-subject-coverage-content-plan.md`](product-quality-phase-8-subject-coverage-content-plan.md) turns the audit outputs into a concrete subject-by-subject content plan. **No question content, answers, Hebrew wording, or bank files were changed.** Recommended first patch: **Science metadata-only** (`patternFamily` taxonomy + factual/distractor review seed) before adding new content.

### Phase 9 — Science metadata-only first batch

[`docs/product-quality-phase-9-science-metadata-patch.md`](product-quality-phase-9-science-metadata-patch.md): added `params.patternFamily` to **32** science rows in [`data/science-questions.js`](../data/science-questions.js) ( **35** / **383** rows now tagged; **348** still missing). No stems, answers, or `correctIndex` changed.

### Phase 10 — Science metadata completion

[`docs/product-quality-phase-10-science-metadata-completion.md`](product-quality-phase-10-science-metadata-completion.md): **383** / **383** science rows have `params.patternFamily`; **0** missing `subtype`. Files: [`data/science-questions.js`](../data/science-questions.js), [`data/science-questions-phase3.js`](../data/science-questions-phase3.js). Helpers: [`scripts/apply-science-pattern-family-phase10.mjs`](../scripts/apply-science-pattern-family-phase10.mjs), [`scripts/fix-science-experiments-observation-inference.mjs`](../scripts/fix-science-experiments-observation-inference.mjs).

### Phase 11 — Science factual + distractor review (report only)

[`docs/product-quality-phase-11-science-factual-distractor-review.md`](product-quality-phase-11-science-factual-distractor-review.md): spot-check **18** science rows; **no** bank edits.

### Phase 12 — Full science bank content sweep (report only)

[`docs/product-quality-phase-12-science-full-content-review.md`](product-quality-phase-12-science-full-content-review.md): mechanical pass **383** science rows; semantic backlog unchanged (**`animals_4`**, **`exp_1`**).

### Phase 13 — Science content fix (owner-approved)

[`docs/product-quality-phase-13-science-content-fix.md`](product-quality-phase-13-science-content-fix.md): **`animals_4`** — one MCQ option string at index 1 replaced with owner-approved exact Hebrew; **`exp_1`** unchanged.

### Phase 14 — English translation model review (report only)

[`docs/product-quality-phase-14-english-translation-model-review.md`](product-quality-phase-14-english-translation-model-review.md): phrase translation rows have **no** static `options` in [`data/english-questions/translation-pools.js`](../data/english-questions/translation-pools.js); runtime MCQ/typing is built in English Master. **No bank edits.**

### Phase 15 — English translation audit representation fix

[`docs/product-quality-phase-15-english-audit-representation-fix.md`](product-quality-phase-15-english-audit-representation-fix.md): [`scripts/audit-question-banks.mjs`](../scripts/audit-question-banks.mjs) emits **`answerMode: runtime_translation`** and **`optionCount: runtime`** for **36** English translation phrase rows so audit readers do not interpret them as broken zero-option MCQ. **`simulator_translation_mcq`** rows remain standard MCQ (**5** rows, `optionCount` **4**). Regenerated [`reports/question-audit/`](../reports/question-audit/) only; **no** question text, answers, or runtime learning code changed.

### Phase 17 — Geometry audit subtype fill

[`docs/product-quality-phase-17-geometry-audit-representation-fix.md`](product-quality-phase-17-geometry-audit-representation-fix.md): for **`geometry_generator_sample`** rows, audit **`subtype`** is **`params.subtype`** when set, otherwise **`kind`** (same as **`subtopic`**). **2548** geometry rows; **0** missing **`subtype`** in export. **No** edits to [`utils/geometry-question-generator.js`](../utils/geometry-question-generator.js) or stems.

---

## Executive summary (pipeline)

- **Central audit script:** [`scripts/audit-question-banks.mjs`](../scripts/audit-question-banks.mjs) ingests **`SCIENCE_QUESTIONS`** from [`data/science-questions.js`](../data/science-questions.js) into the same `reports/question-audit/*` outputs as other subjects. **Phase 15:** English **translation** phrase rows (no static options in the bank) use **`answerMode: runtime_translation`** and **`optionCount: runtime`** instead of empty option counts and default `mcq`. **Phase 17:** **`geometry_generator_sample`** rows inherit **`subtype`** from **`kind`** when **`params.subtype`** is absent.
- **Row lineage:** each CSV/JSON row includes **`bankProvenance`**:
  - `static_bank` — geography, Hebrew legacy/rich, English pools, geometry conceptual items.
  - `generator_sample` — math + geometry deterministic audit samples (`*_generator_sample` / `math_generator_sample`).
  - `science_direct_bank` — each MCQ from `SCIENCE_QUESTIONS` (`rowKind`: `science_bank_item`).
- **Science vs Hebrew overlap heuristic:** `science_bank_item` rows are excluded from `withinBandClassPairOverlaps` (wide grade spans would falsely inflate “adjacent band” overlap counts).
- **Re-run command:** `npx tsx scripts/audit-question-banks.mjs`  
- **Artifacts:** `reports/question-audit/items.json`, `items.csv`, `findings.json`, `stage2.json`.

**Latest run totals:** **12158** rows.

| Subject | Rows in `items.json` | Main provenance |
|--------|----------------------|-----------------|
| math | 3942 | generator_sample |
| geometry | 2548 | static_bank + generator_sample |
| hebrew | 927 | static_bank |
| english | 852 | static_bank |
| geography | 3506 | static_bank |
| science | 383 | science_direct_bank |

**Rows by `bankProvenance` (latest run):**

| bankProvenance | Count |
|----------------|-------|
| static_bank | 5385 |
| generator_sample | 6390 |
| science_direct_bank | 383 |

---

## 1. Science — unified audit results

Science is now first-class in `items.json`. Aggregates from the latest run:

| Metric | Value |
|--------|-------|
| Total science rows | 383 |
| Topics | body 50, animals 51, plants 46, materials 46, earth_space 66, environment 65, experiments 59 |
| Rows with `patternFamily` (`params.patternFamily`) | **383** (**Phase 10** — none missing) |
| Difficulty labels (`difficulty` column) | easy 113, medium 145, hard 124, easy\|hard 1 |
| `correctIndex` missing | 0 (not audited via separate script — MCQ objects in source include index) |

Phase 1 ingestion did not modify science **content**; **Phases 9–10** added only neutral `patternFamily` / `subtype` metadata (no wording or answer changes). See [`docs/product-quality-phase-10-science-metadata-completion.md`](product-quality-phase-10-science-metadata-completion.md).

---

## 2. English — translation pool `difficulty` metadata (**fixed**)

**Status (Phase 1c):** Every item in `TRANSLATION_POOLS` under pools `classroom`, `routines`, `hobbies`, `community`, `technology`, and `global` now includes `"difficulty": "basic" | "standard" | "advanced"` derived from **`minGrade`** only:

- grades **1–2** → `basic`
- grades **3–4** → `standard`
- grades **5–6** → `advanced`

**Scope of edit:** [`data/english-questions/translation-pools.js`](../data/english-questions/translation-pools.js) — **36** phrase-translation objects updated (metadata field only). **`simulator_translation_mcq`** entries were unchanged (already had `difficulty`).

**Verification (`reports/question-audit/items.json` after `npx tsx scripts/audit-question-banks.mjs`):**

| Check | Result |
|-------|--------|
| English rows with empty `difficulty` | **0** (was **36** on translation phrase rows) |
| Total audit rows | **12158** (unchanged) |
| English difficulty distribution | basic **659**, standard **111**, advanced **82** (sums to **852** English rows) |

No English sentence text, Hebrew text, answers, pool keys, or grade gates were modified — only the added `difficulty` property on the 36 objects listed historically in Phase 1b.

---

## 3. Hebrew — duplicate / overlap detail

### 3.1 Legacy same stem across three levels (`findings.json`)

| Key (topic + stem snippet) | Levels seen | Classification | Recommended action |
|----------------------------|-------------|------------------|---------------------|
| `grammar::איזה משפט לא תקין?` | easy, medium, hard | True duplicate stem across difficulty buckets | Owner review — differentiate prompts or collapse levels |
| `grammar::בחרו משפט תקין:` | easy, medium, hard | True duplicate stem across difficulty buckets | Owner review — same |

### 3.2 Adjacent band overlap (`withinBandClassPairOverlaps`) — 37 entries

Full table (generated from `reports/question-audit/items.json` + `stage2.json`). Hebrew stem text for each `stemHash` is available in `items.csv` / `items.json`.

| # | מסלול כיתות | patternFamily | stemHash | תיאור מסלולים (כיתה / רמה / מקור) | הבדל מהותי | סיווג | המלצה |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | g1_vs_g2_early_band | comprehension_typed_band_early_g1_g2 | `de0354911b95de9ad44cc026` | g1–g1 / hard / hebrew_legacy / G1_HARD_QUESTIONS · g2–g2 / easy / hebrew_legacy / G2_EASY_QUESTIONS | אותו stem לאחר נירמול באודיט | needs owner decision (legacy buckets differ: G1 hard vs G2 easy) | owner review |
| 2 | g1_vs_g2_early_band | spell_word_early_ab_writing | `79e4f72cad1d20cee05e3bbf` | g1–g1 / easy\|medium / hebrew_rich / rich#36_g1 · g2–g2 / easy\|medium / hebrew_rich / rich#36_g2 | אותו stem לאחר נירמול באודיט | acceptable spiral repetition (parallel grade copies) | keep |
| 3 | g1_vs_g2_early_band | spell_word_early_ab_writing | `9ad685219c7ad324c02010b9` | g1–g1 / easy\|medium / hebrew_rich / rich#37_g1 · g2–g2 / easy\|medium / hebrew_rich / rich#37_g2 | אותו stem לאחר נירמול באודיט | acceptable spiral repetition | keep |
| 4 | g3_vs_g4_mid_band | part_of_speech | `6a2ad9857e86dff48e858111` | g3–g3 / easy / hebrew_rich / rich#25_g3 · g4–g4 / easy / hebrew_rich / rich#25_g4 | אותו stem לאחר נירמול באודיט | acceptable spiral repetition (rich G3 vs G4) | keep |
| 5 | g3_vs_g4_mid_band | synonym | `da37a5314178ed76542fda0b` | g3–g3 / easy\|medium / hebrew_rich / rich#27_g3 · g4–g4 / easy\|medium / hebrew_rich / rich#27_g4 | אותו stem לאחר נירמול באודיט | acceptable spiral repetition | keep |
| 6 | g3_vs_g4_mid_band | antonym | `0ec045a82811fa8a310f7927` | g3–g3 / medium / hebrew_rich / rich#28_g3 · g4–g4 / medium / hebrew_rich / rich#28_g4 | אותו stem לאחר נירמול באודיט | acceptable spiral repetition | keep |
| 7 | g3_vs_g4_mid_band | precision | `826be299e3b427c278a74f00` | g3–g3 / medium\|hard / hebrew_rich / rich#33_g3 · g4–g4 / medium\|hard / hebrew_rich / rich#33_g4 | אותו stem לאחר נירמול באודיט | acceptable spiral repetition | keep |
| 8 | g3_vs_g4_mid_band | sentence_read | `cdf008e5d4f15b5cd67a6c71` | g3–g3 / medium / hebrew_rich / rich#38_g3 · g4–g4 / medium / hebrew_rich / rich#38_g4 | אותו stem לאחר נירמול באודיט | acceptable spiral repetition | keep |
| 9 | g3_vs_g4_mid_band | structured_completion | `c04754a184986189a40939e8` | g3–g3 / easy\|medium / hebrew_rich / rich#39_g3 · g4–g4 / easy\|medium / hebrew_rich / rich#39_g4 | אותו stem לאחר נירמול באודיט | acceptable spiral repetition | keep |
| 10 | g3_vs_g4_mid_band | logic_completion | `52dc1d2cd2c01bbbd6c60d66` | g3–g3 / medium / hebrew_rich / rich#41_g3 · g4–g4 / medium / hebrew_rich / rich#41_g4 | אותו stem לאחר נירמול באודיט | acceptable spiral repetition | keep |
| 11 | g3_vs_g4_mid_band | social_reply_mid_help | `66b9c746ea637db24013c7ed` | g3–g3 / medium / hebrew_rich / rich#44_g3 · g4–g4 / medium / hebrew_rich / rich#44_g4 | אותו stem לאחר נירמול באודיט | acceptable spiral repetition | keep |
| 12 | g3_vs_g4_mid_band | analogy_reasoning | `fc28241b872907c379e234da` | g3–g3 / medium / hebrew_rich / rich#47_g3 · g4–g4 / medium / hebrew_rich / rich#47_g4 | אותו stem לאחר נירמול באודיט | acceptable spiral repetition | keep |
| 13 | g3_vs_g4_mid_band | morphology | `8883e640b6f4ce786f35c7d3` | g3–g3 / medium\|hard / hebrew_rich / rich#49_g3 · g4–g4 / medium\|hard / hebrew_rich / rich#49_g4 | אותו stem לאחר נירמול באודיט | acceptable spiral repetition | keep |
| 14 | g3_vs_g4_mid_band | semantic_field | `d4661209298d073b68d1745a` | g3–g3 / medium\|hard / hebrew_rich / rich#52_g3 · g4–g4 / medium\|hard / hebrew_rich / rich#52_g4 | אותו stem לאחר נירמול באודיט | acceptable spiral repetition | keep |
| 15 | g5_vs_g6_late_band | vocabulary_typed | `67896186392d1f45166a2066` | g5–g5 / medium / hebrew_legacy / G5_MEDIUM_QUESTIONS · g5–g5 / hard / hebrew_legacy / G5_HARD_QUESTIONS · g6–g6 / medium / hebrew_legacy / G6_EASY_QUESTIONS · g6–g6 / medium / hebrew_legacy / G6_MEDIUM_QUESTIONS | אותו stem לאחר נירמול באודיט | needs owner decision (legacy academic stems across bands) | owner review |
| 16 | g5_vs_g6_late_band | comprehension_infer | `68a9da2f2c17757224d1811c` | g5–g5 / hard / hebrew_legacy / G5_HARD_QUESTIONS · g6–g6 / medium / hebrew_legacy / G6_MEDIUM_QUESTIONS | אותו stem לאחר נירמול באודיט | needs owner decision | owner review |
| 17 | g5_vs_g6_late_band | comprehension_typed_band_late_g5_g6 | `1464d31153471210d8d526a5` | g5–g5 / hard / hebrew_legacy / G5_HARD_QUESTIONS · g6–g6 / medium / hebrew_legacy / G6_MEDIUM_QUESTIONS | אותו stem לאחר נירמול באודיט | needs owner decision | owner review |
| 18 | g5_vs_g6_late_band | writing_spelling_band_late_g5_g6 | `ac17ef3c224d5be5d7d1e881` | g5–g5 / hard / hebrew_legacy / G5_HARD_QUESTIONS · g6–g6 / medium / hebrew_legacy / G6_MEDIUM_QUESTIONS | אותו stem לאחר נירמול באודיט | needs owner decision | owner review |
| 19 | g5_vs_g6_late_band | speaking_phrase_band_late_g5_g6 | `2f364c7a884f52a5d42b5fda` | g5–g5 / hard / hebrew_legacy / G5_HARD_QUESTIONS · g6–g6 / medium / hebrew_legacy / G6_MEDIUM_QUESTIONS | אותו stem לאחר נירמול באודיט | needs owner decision | owner review |
| 20 | g5_vs_g6_late_band | speaking_phrase_band_late_g5_g6 | `71d28944b66247a8ba283ae8` | g5–g5 / hard / hebrew_legacy / G5_HARD_QUESTIONS · g6–g6 / medium / hebrew_legacy / G6_MEDIUM_QUESTIONS | אותו stem לאחר נירמול באודיט | needs owner decision | owner review |
| 21 | g5_vs_g6_late_band | sequence | `84e223a5922743f1d11d7a80` | g5–g5 / easy\|medium / hebrew_rich / rich#4_g5 · g6–g6 / easy\|medium / hebrew_rich / rich#4_g6 | אותו stem לאחר נירמול באודיט | acceptable spiral repetition | keep |
| 22 | g5_vs_g6_late_band | reference | `da6619e7587165fc79840b03` | g5–g5 / medium\|hard / hebrew_rich / rich#5_g5 · g6–g6 / medium\|hard / hebrew_rich / rich#5_g6 | אותו stem לאחר נירמול באודיט | acceptable spiral repetition | keep |
| 23 | g5_vs_g6_late_band | main_idea | `453ec8757b98350c03136d3c` | g5–g5 / hard / hebrew_rich / rich#6_g5 · g6–g6 / hard / hebrew_rich / rich#6_g6 | אותו stem לאחר נירמול באודיט | acceptable spiral repetition | keep |
| 24 | g5_vs_g6_late_band | compare_statements | `8bbed894472c308de3622b3e` | g5–g5 / medium\|hard / hebrew_rich / rich#9_g5 · g6–g6 / medium\|hard / hebrew_rich / rich#9_g6 | אותו stem לאחר נירמול באודיט | acceptable spiral repetition | keep |
| 25 | g5_vs_g6_late_band | tense_shift | `37e7037da668504ff33543d6` | g5–g5 / medium\|hard / hebrew_rich / rich#20_g5 · g6–g6 / medium\|hard / hebrew_rich / rich#20_g6 | אותו stem לאחר נירמול באודיט | acceptable spiral repetition | keep |
| 26 | g5_vs_g6_late_band | sentence_correction | `6cbab1e1865511d21807383f` | g5–g5 / hard / hebrew_rich / rich#21_g5 · g6–g6 / hard / hebrew_rich / rich#21_g6 | אותו stem לאחר נירמול באודיט | acceptable spiral repetition | keep |
| 27 | g5_vs_g6_late_band | transform | `783dff40552f725071ae8482` | g5–g5 / medium\|hard / hebrew_rich / rich#24_g5 · g6–g6 / medium\|hard / hebrew_rich / rich#24_g6 | אותו stem לאחר נירמול באודיט | acceptable spiral repetition | keep |
| 28 | g5_vs_g6_late_band | binary_grammar | `2ba0538b85ed2a5ec5cb13d3` | g5–g5 / hard / hebrew_rich / rich#26_g5 · g6–g6 / hard / hebrew_rich / rich#26_g6 | אותו stem לאחר נירמול באודיט | acceptable spiral repetition | keep |
| 29 | g5_vs_g6_late_band | context_fit | `b5b0f104f36af44a37800ab7` | g5–g5 / medium\|hard / hebrew_rich / rich#29_g5 · g6–g6 / medium\|hard / hebrew_rich / rich#29_g6 | אותו stem לאחר נירמול באודיט | acceptable spiral repetition | keep |
| 30 | g5_vs_g6_late_band | category_exclusion | `a25f1e14e63cd06340950f6a` | g5–g5 / hard / hebrew_rich / rich#30_g5 · g6–g6 / hard / hebrew_rich / rich#30_g6 | אותו stem לאחר נירמול באודיט | acceptable spiral repetition | keep |
| 31 | g5_vs_g6_late_band | rephrase | `9bb273f6e0ee68a816efbccd` | g5–g5 / medium\|hard / hebrew_rich / rich#40_g5 · g6–g6 / medium\|hard / hebrew_rich / rich#40_g6 | אותו stem לאחר נירמול באודיט | acceptable spiral repetition | keep |
| 32 | g5_vs_g6_late_band | implicit_tone | `1e818e598517ea5380f83953` | g5–g5 / hard / hebrew_rich / rich#45_g5 · g6–g6 / hard / hebrew_rich / rich#45_g6 | אותו stem לאחר נירמול באודיט | acceptable spiral repetition | keep |
| 33 | g5_vs_g6_late_band | supporting_detail | `71a97fec43ae213bc60e9805` | g5–g5 / medium\|hard / hebrew_rich / rich#46_g5 · g6–g6 / medium\|hard / hebrew_rich / rich#46_g6 | אותו stem לאחר נירמול באודיט | acceptable spiral repetition | keep |
| 34 | g5_vs_g6_late_band | sentence_correction | `42682abfc4af20a01f81d36a` | כולל גם rich#48 ו-rich#50 — אותו stemHash תחת שני patternFamily (sentence_correction vs verb_agreement) | שני מסלולי מיומנות שונים על אותו נירמול stem | same stem but different skill tags — needs owner decision | owner review |
| 35 | g5_vs_g6_late_band | verb_agreement | `42682abfc4af20a01f81d36a` | ראה שורה 34 | כמו לעיל | same stem but different skill tags — needs owner decision | owner review |
| 36 | g5_vs_g6_late_band | collocation | `ad4b531737604021084585a5` | g5–g5 / hard / hebrew_rich / rich#51_g5 · g6–g6 / hard / hebrew_rich / rich#51_g6 | אותו stem לאחר נירמול באודיט | acceptable spiral repetition | keep |
| 37 | g5_vs_g6_late_band | structural | `0755dab1d0b6bbdaa7561382` | g5–g5 / medium\|hard / hebrew_rich / rich#53_g5 · g6–g6 / medium\|hard / hebrew_rich / rich#53_g6 | אותו stem לאחר נירמול באודיט | acceptable spiral repetition | keep |

**Classification summary (approximate):**

| Bucket | Count | Notes |
|--------|-------|-------|
| Acceptable spiral repetition (rich parallel grades) | ~26 | Intentional `rich#N_g3` / `rich#N_g4` style pairing |
| Needs owner decision | ~11 | Legacy academic duplicates, comprehension G1/G2 bucket mismatch, stem shared across skill tags (rows 34–35) |

---

## 4. Math — five generator kinds “missed” in audit sample

Sources: `reports/question-audit/stage2.json` → `generatorBranchCoverage.math.kindsNotHitInRun`, implementation in [`utils/math-question-generator.js`](../utils/math-question-generator.js) inside diagnostic probe helper (~lines 760–1005).

| Generator kind (`params.kind`) | Expected topic / operation context | Why it matters | Unreachable vs rare vs sampling gap | Recommended next check |
|-------------------------------|-------------------------------------|----------------|-------------------------------------|-------------------------|
| `frac_probe_common_denominator_only` | `fractions` + probe `suggestedQuestionType === "fraction_common_denominator_only"` | LCD / common denominator diagnostic | **Probe-only** — audit sampling does not inject `pendingProbe` | Force-probe harness or integration test with active diagnostic session |
| `math_probe_fraction_operation_gate` | `fractions` + probe `fraction_operation_gate` | Separates “same denominator add” misconception | **Probe-only** | Same |
| `math_probe_place_value` | `number_sense` or `decimals` + probe `place_value_digit_value` | Digit place-value vs face value | **Probe-only** | Same |
| `math_probe_times_fact` | `multiplication` + probe `multiplication_fact_check` | Fact retrieval gap signal | **Probe-only** | Same |
| `math_probe_operation_word_choice` | `word_problems` + probe `operation_choice_word_problem` | Operation selection in WP | **Probe-only** | Same |

**Conclusion:** Not missed because generators are broken — **the audit does not simulate an active diagnostic probe session**, so these branches are **conditionally unreachable** in plain `genMath` sampling. Status: **rare / probe-gated**, not standard curriculum MCQ kinds.

---

## 5. Learning flow — manual staging E2E checklist

Use a **non-production** or **staging** student account with Supabase learning tables enabled.

| Step | Action | Pass criteria |
|------|--------|---------------|
| 1 | Open `/student/login`, complete username/PIN login | Redirect to student home; no error toast |
| 2 | Navigate `/learning` → pick **one** subject master (e.g. math) | Page loads; grade/mode selectable |
| 3 | Start practice so the client calls `POST /api/learning/session/start` | Response `200`, body contains `learningSessionId` |
| 4 | Answer **3** questions (correct or incorrect) | Each answer triggers `POST /api/learning/answer` with `200` |
| 5 | End session (UI flow that calls `POST /api/learning/session/finish`) | `200`; session status completed in DB |
| 6 | DB: query `learning_sessions` | Row exists for student; `started_at`/`ended_at` populated; `metadata.summary` reasonable |
| 7 | DB: query `answers` | Three rows linked to `learning_session_id`; `is_correct` boolean plausible |
| 8 | Parent-facing report / dashboard (if configured for this student) | Aggregates move; **no** `undefined` / `null` / `NaN` / `00000` in UI |
| 9 | Console / UI scan | No uncaught errors in browser console for the flow |

If no DB access: document **Network tab** HAR + response bodies for the three API calls as evidence.

---

## 6. Parent report (product lens) — unchanged from Phase 1a

Suggestions remain **documentation-only**; no Hebrew copy or report code was edited here. Prior notes in this file’s earlier revision still apply conceptually.

---

## 7. Files touched (Phase 1b + 1c)

| File | Change |
|------|--------|
| [`scripts/audit-question-banks.mjs`](../scripts/audit-question-banks.mjs) | (1b) Science ingestion; `bankProvenance`; CSV; science excluded from within-band overlap heuristic |
| [`scripts/print-hebrew-overlap-md.mjs`](../scripts/print-hebrew-overlap-md.mjs) | (1b) Optional Hebrew overlap table helper |
| [`data/english-questions/translation-pools.js`](../data/english-questions/translation-pools.js) | (1c) `difficulty` on 36 phrase-translation items only |
| [`docs/product-quality-phase-1-audit.md`](product-quality-phase-1-audit.md) | This document |
| `reports/question-audit/*` | Regenerated after audit runs |

**Wording:** Hebrew stems and English/Hebrew phrase text in translation pools were **not** edited in Phase 1c — only the **`difficulty`** metadata field was added.

---

## 8. Recommended next fix phase (product quality)

1. ~~Apply translation pool `difficulty` metadata~~ — **done** (Phase 1c).  
2. **Hebrew:** owner review for §3.1 (three-level grammar stems) and §3.2 rows marked owner review (especially 1, 15–20, 34–35).  
3. **Math:** if diagnostics matter for launch, add **probe-aware** audit harness — not more random sampling.  
4. Run the **§5 E2E checklist** on staging with DB visibility once safe.
