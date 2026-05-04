# Product Quality Phase 3 — Hebrew Owner Review (Decision Map Only)

**Last updated:** 2026-05-05  
**Status:** Documentation / decisions — **no Hebrew question content was edited** in this phase.  
**Sources:** [`reports/question-audit/items.json`](../reports/question-audit/items.json), [`reports/question-audit/stage2.json`](../reports/question-audit/stage2.json) (`withinBandClassPairOverlaps` = unresolved; `hebrewIntentionalSpiralOverlaps` = Phase 21 C1 allowlist), [`reports/question-audit/findings.json`](../reports/question-audit/findings.json) (`hebrewLegacySameStemThreeLevels`), [`docs/product-quality-phase-1-audit.md`](product-quality-phase-1-audit.md) (section 3).

**Structural cleanup plan (Phase 20, planning only — no bank edits):** [`docs/product-quality-phase-20-hebrew-structural-cleanup-plan.md`](product-quality-phase-20-hebrew-structural-cleanup-plan.md) — maps overlap rows **H-O01–H-O37** and legacy groups **H-L1**, **H-L2** to structural vs wording-required actions.

**Scope:** Hebrew only — overlap / duplicate signals for **owner approval** before any bank edits.

---

## How to read this document

- **ID prefixes:** `H-L*` = legacy three-level stem groups (§3.1). `H-O*` = adjacent-band overlap rows (§3.2), aligned with row numbers in Phase 1 §3.2 (1–37).
- **Exact difference:** describes what **changes between versions** after audit normalization (stem hash collision); options / distractors may still differ even when stem text matches — confirm in `items.json` / source pools before editing.
- **Change now?** Always **no** until owner signs off (this phase is mapping only).

---

## Summary counts (for planning)

| Classification (proposed) | Count | Notes |
|---------------------------|-------|------|
| Keep as spiral repetition | **28** | Overlap rows **H-O02–H-O14**, **H-O21–H-O33**, **H-O36–H-O37** — parallel `rich#N_gX` / intentional grade pairing |
| True duplicate (same stem, difficulty buckets only) | **2** | Legacy grammar stems **H-L1**, **H-L2** — same prompt across easy/medium/hard |
| Same stem, different skill / patternFamily | **4** | **H-O34** + **H-O35** (pair); stem shared under `sentence_correction` vs `verb_agreement` with different `subtype` / `spine_skill_id` |
| Owner decision required (overlap table) | **9** | **H-O01**, **H-O15–H-O20** |
| Owner decision required (legacy) | **2** | **H-L1**, **H-L2** |
| Recommended rewrite (candidate, not executed) | **2** | Grammar stems — **if** owner rejects triple duplication |
| Merge / remove later (candidate) | **2** | Same grammar stems — **if** owner chooses to collapse levels |

**Risk default:** **Low** for spiral keeps; **Medium** for G3/G4 rich parallels unless content review says otherwise; **High** for legacy grammar triple + G1/G2 comprehension bucket clash + late-band legacy academic clashes (**H-O01**, **H-O15–H-O20**, **H-O34–H-O35**).

---

## Part A — Legacy same stem across three levels (`findings.json`)

These are **not** part of the 37-row overlap table; they are **grammar** topic duplicates across legacy difficulty buckets.

### H-L1 — `grammar::איזה משפט לא תקין?`

| Field | Value |
|-------|--------|
| **Levels seen** | easy, medium, hard |
| **Repeated stem (snippet)** | איזה משפט לא תקין? |
| **Grade / path A–C** | Legacy grammar pools per level (see audit rows with this stem in `items.json`). |
| **Difficulty A / B / C** | easy \| medium \| hard (all three present). |
| **patternFamily** | `grammar_morphology` (typical for legacy grammar MCQ in audit). |
| **Exact difference** | **None in stem wording** — same stem reused across three difficulty labels; distractors / tagging may differ by level. |
| **Classification** | **True duplicate** (stem repeated across buckets) — pedagogically intentional spiral vs accidental duplicate **needs owner call**. |
| **Risk** | **High** — learners may see identical stem thrice in one topic journey. |
| **Recommended action** | Differentiate prompts per level **or** collapse to one level **or** keep if distractors differ meaningfully — **owner approval**. |
| **Change content/code now?** | **No** |

### H-L2 — `grammar::בחרו משפט תקין:`

| Field | Value |
|-------|--------|
| **Levels seen** | easy, medium, hard |
| **Repeated stem (snippet)** | בחרו משפט תקין: |
| **Difficulty A / B / C** | easy \| medium \| hard |
| **Exact difference** | **None in stem wording** across levels. |
| **Classification** | **True duplicate** (same stem across buckets) — same owner tradeoff as **H-L1**. |
| **Risk** | **High** |
| **Recommended action** | Same as **H-L1**. |
| **Change content/code now?** | **No** |

---

## Part B — Adjacent-band overlaps (`withinBandClassPairOverlaps`, Hebrew only)

The audit emits **37** Hebrew overlap records (same `stemHash` appearing in both sides of a grade-band pair). Below: **full decision rows** for all **9** “owner review” overlaps plus the **H-O34 / H-O35** pair; then a **single consolidated table** for the **28** “spiral repetition” rows.

### B.1 Owner-review rows (detail)

#### H-O01 — stemHash `de0354911b95de9ad44cc026` — comprehension G1 vs G2

| Field | Value |
|-------|--------|
| **bandPair** | `g1_vs_g2_early_band` |
| **patternFamily** | `comprehension_typed_band_early_g1_g2` |
| **Repeated stem** | כשכותבים 'ילדים משחקים בחצר' — מה הם עושים? |
| **Path A** | g1–g1 · **hard** · `hebrew_legacy` · `G1_HARD_QUESTIONS` |
| **Path B** | g2–g2 · **easy** · `hebrew_legacy` · `G2_EASY_QUESTIONS` |
| **Difficulty A / B** | hard vs easy |
| **patternFamily A / B** | Same family (`comprehension_typed_band_early_g1_g2`) — collision is cross-band placement. |
| **Exact difference** | **Identical stem text** after normalization; **bucket mismatch**: G1 labeled hard vs G2 labeled easy for same item shape — risks perceived inconsistency. |
| **Classification** | **Owner decision required** (legacy bucket semantics). |
| **Risk** | **High** |
| **Recommended action** | Align difficulty semantics **or** rewrite one band version **or** accept as intentional bridge item — **owner**. |
| **Change now?** | **No** |

#### H-O15 — stemHash `67896186392d1f45166a2066` — `vocabulary_typed`

| Field | Value |
|-------|--------|
| **bandPair** | `g5_vs_g6_late_band` |
| **Paths (summary)** | Multiple legacy late-band rows share hash across G5 medium/hard and G6 rows (`hebrew_legacy` pools — see Phase 1 §3.2 row 15). |
| **Exact difference** | Same normalized stem across **legacy academic** vocabulary rows; grade/rubric differs. |
| **Classification** | **Owner decision required** — legacy academic overlap. |
| **Risk** | **High** |
| **Recommended action** | Audit distractors / definitions side-by-side; dedupe or differentiate — **owner**. |
| **Change now?** | **No** |

#### H-O16 — stemHash `68a9da2f2c17757224d1811c` — `comprehension_infer`

| Field | Value |
|-------|--------|
| **bandPair** | `g5_vs_g6_late_band` |
| **Exact difference** | Legacy **G5_HARD** vs **G6_MEDIUM** pairing — same stem hash across infer items (Phase 1 §3.2 row 16). |
| **Classification** | **Owner decision required** |
| **Risk** | **High** |
| **Recommended action** | Confirm whether inference difficulty tracks grade; rewrite one band if duplicate — **owner**. |
| **Change now?** | **No** |

#### H-O17 — stemHash `1464d31153471210d8d526a5` — `comprehension_typed_band_late_g5_g6`

| Field | Value |
|-------|--------|
| **bandPair** | `g5_vs_g6_late_band` |
| **Exact difference** | Same stem hash across late comprehension band items G5 hard vs G6 medium (legacy). |
| **Classification** | **Owner decision required** |
| **Risk** | **High** |
| **Recommended action** | Same as H-O16 — **owner**. |
| **Change now?** | **No** |

#### H-O18 — stemHash `ac17ef3c224d5be5d7d1e881` — `writing_spelling_band_late_g5_g6`

| Field | Value |
|-------|--------|
| **bandPair** | `g5_vs_g6_late_band` |
| **Exact difference** | Legacy late writing/spelling stem reused across G5 hard / G6 medium rows. |
| **Classification** | **Owner decision required** |
| **Risk** | **High** |
| **Recommended action** | Decide if spelling drills should stay parallel or diverge by grade — **owner**. |
| **Change now?** | **No** |

#### H-O19 — stemHash `2f364c7a884f52a5d42b5fda` — `speaking_phrase_band_late_g5_g6`

| Field | Value |
|-------|--------|
| **bandPair** | `g5_vs_g6_late_band` |
| **Exact difference** | Speaking phrase stem shared across legacy late bands (one of two speaking overlaps). |
| **Classification** | **Owner decision required** |
| **Risk** | **Medium** |
| **Recommended action** | Validate phrase appropriateness per grade; adjust or keep — **owner**. |
| **Change now?** | **No** |

#### H-O20 — stemHash `71d28944b66247a8ba283ae8` — `speaking_phrase_band_late_g5_g6`

| Field | Value |
|-------|--------|
| **bandPair** | `g5_vs_g6_late_band` |
| **Exact difference** | Second speaking phrase overlap — same hash family as H-O19 pattern. |
| **Classification** | **Owner decision required** |
| **Risk** | **Medium** |
| **Recommended action** | Same as H-O19 — **owner**. |
| **Change now?** | **No** |

#### H-O34 & H-O35 — stemHash `42682abfc4af20a01f81d36a` — **two patternFamily rows (pair)**

| Field | H-O34 (`sentence_correction`) | H-O35 (`verb_agreement`) |
|-------|------------------------------|--------------------------|
| **bandPair** | `g5_vs_g6_late_band` | `g5_vs_g6_late_band` |
| **Repeated stem** | איזה משפט תקין? | איזה משפט תקין? (same hash) |
| **Path A / B (representative)** | G5/G6 **sentence_correction** · `rich#48_g5` / `rich#48_g6` · subtype `sv_agreement_plural` | G5/G6 **verb_agreement** · `rich#50_g5` / `rich#50_g6` · subtype `plural_subject` |
| **Difficulty** | hard (G5/G6 rows shown) vs medium\|hard band on verb_agreement rows — see `items.json` |
| **patternFamily A vs B** | `sentence_correction` vs `verb_agreement` |
| **Exact difference** | **Identical stem text**; **different skill tagging** (`spine_skill_id`, `subtype`, pools rich#48 vs rich#50) — same stem teaching two grammar constructs. |
| **Classification** | **Same stem but different skill** — **owner decision required** (keep both with clearer stems vs split wording vs drop one). |
| **Risk** | **High** (learner confusion / analytics ambiguity). |
| **Recommended action** | Disambiguate stems or consolidate skills — **owner**. |
| **Change now?** | **No** |

---

### B.2 Spiral repetition rows — consolidated (28 rows)

**Classification:** **Keep as spiral repetition** — proposed **Low** risk for intentional `hebrew_rich` parallel grades unless spot-check finds identical distractors.

**Change content/code now?** **No** for all.

| ID | stemHash | bandPair | patternFamily | Phase 1 reference |
|----|----------|----------|---------------|-------------------|
| H-O02 | `79e4f72cad1d20cee05e3bbf` | g1_vs_g2_early_band | spell_word_early_ab_writing | rich#36_g1 vs rich#36_g2 |
| H-O03 | `9ad685219c7ad324c02010b9` | g1_vs_g2_early_band | spell_word_early_ab_writing | rich#37_g1 vs g2 |
| H-O04 | `6a2ad9857e86dff48e858111` | g3_vs_g4_mid_band | part_of_speech | rich#25 |
| H-O05 | `da37a5314178ed76542fda0b` | g3_vs_g4_mid_band | synonym | rich#27 |
| H-O06 | `0ec045a82811fa8a310f7927` | g3_vs_g4_mid_band | antonym | rich#28 |
| H-O07 | `826be299e3b427c278a74f00` | g3_vs_g4_mid_band | precision | rich#33 |
| H-O08 | `cdf008e5d4f15b5cd67a6c71` | g3_vs_g4_mid_band | sentence_read | rich#38 |
| H-O09 | `c04754a184986189a40939e8` | g3_vs_g4_mid_band | structured_completion | rich#39 |
| H-O10 | `52dc1d2cd2c01bbbd6c60d66` | g3_vs_g4_mid_band | logic_completion | rich#41 |
| H-O11 | `66b9c746ea637db24013c7ed` | g3_vs_g4_mid_band | social_reply_mid_help | rich#44 |
| H-O12 | `fc28241b872907c379e234da` | g3_vs_g4_mid_band | analogy_reasoning | rich#47 |
| H-O13 | `8883e640b6f4ce786f35c7d3` | g3_vs_g4_mid_band | morphology | rich#49 |
| H-O14 | `d4661209298d073b68d1745a` | g3_vs_g4_mid_band | semantic_field | rich#52 |
| H-O21 | `84e223a5922743f1d11d7a80` | g5_vs_g6_late_band | sequence | rich#4 |
| H-O22 | `da6619e7587165fc79840b03` | g5_vs_g6_late_band | reference | rich#5 |
| H-O23 | `453ec8757b98350c03136d3c` | g5_vs_g6_late_band | main_idea | rich#6 |
| H-O24 | `8bbed894472c308de3622b3e` | g5_vs_g6_late_band | compare_statements | rich#9 |
| H-O25 | `37e7037da668504ff33543d6` | g5_vs_g6_late_band | tense_shift | rich#20 |
| H-O26 | `6cbab1e1865511d21807383f` | g5_vs_g6_late_band | sentence_correction | rich#21 |
| H-O27 | `783dff40552f725071ae8482` | g5_vs_g6_late_band | transform | rich#24 |
| H-O28 | `2ba0538b85ed2a5ec5cb13d3` | g5_vs_g6_late_band | binary_grammar | rich#26 |
| H-O29 | `b5b0f104f36af44a37800ab7` | g5_vs_g6_late_band | context_fit | rich#29 |
| H-O30 | `a25f1e14e63cd06340950f6a` | g5_vs_g6_late_band | category_exclusion | rich#30 |
| H-O31 | `9bb273f6e0ee68a816efbccd` | g5_vs_g6_late_band | rephrase | rich#40 |
| H-O32 | `1e818e598517ea5380f83953` | g5_vs_g6_late_band | implicit_tone | rich#45 |
| H-O33 | `71a97fec43ae213bc60e9805` | g5_vs_g6_late_band | supporting_detail | rich#46 |
| H-O36 | `ad4b531737604021084585a5` | g5_vs_g6_late_band | collocation | rich#51 |
| H-O37 | `0755dab1d0b6bbdaa7561382` | g5_vs_g6_late_band | structural | rich#53 |

**Exact difference (typical):** identical stem after normalization; pools differ by **`rich#N_g5` vs `rich#N_g6`** (or G3/G4); options may be grade-tuned — verify per hash in `items.json`.

**Recommended action:** **Keep** as cross-grade spiral unless item-level review shows identical answer keys.

---

## Part C — G1/G2 comprehension overlap (row H-O01)

Row **H-O01** is the **only** early-band comprehension overlap in the 37-row set with **G1 vs G2** bucket tension (see **Part B.1**). No additional separate “G1/G2 list” beyond §3.2 in Phase 1.

---

## Part D — Legacy academic cases

Rows **H-O15–H-O20** cover **legacy `hebrew_legacy` late-band** collisions (vocabulary, infer, comprehension band, writing/spelling, speaking). Treat as **high-attention** owner review (see **Part B.1**).

---

## Owner sign-off checklist (before any bank edit)

- [ ] Confirm classifications for **H-L1**, **H-L2** (grammar triples).  
- [ ] Confirm handling for **H-O01** (G1 hard vs G2 easy same stem).  
- [ ] Confirm handling for **H-O15–H-O20** (legacy late-band).  
- [ ] Confirm handling for **H-O34 / H-O35** (same stem, two pattern families).  
- [ ] Spot-check a sample of **Part B.2** for identical MCQ keys across grades.  
- [ ] Only then schedule implementation PR(s) for Hebrew content (out of scope for Phase 3).

---

## Artifacts (read-only)

| Artifact | Path |
|----------|------|
| Flat items | [`reports/question-audit/items.json`](../reports/question-audit/items.json), `items.csv` |
| Overlap list | [`reports/question-audit/stage2.json`](../reports/question-audit/stage2.json) → `withinBandClassPairOverlaps` |
| Legacy triple stems | [`reports/question-audit/findings.json`](../reports/question-audit/findings.json) → `hebrewLegacySameStemThreeLevels` |
| Regenerate overlap markdown (optional) | [`scripts/print-hebrew-overlap-md.mjs`](../scripts/print-hebrew-overlap-md.mjs) |

---

**End of Phase 3 decision map** — no wording changes applied.
