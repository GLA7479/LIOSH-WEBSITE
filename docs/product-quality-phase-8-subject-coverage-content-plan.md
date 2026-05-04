# Product Quality Phase 8 — Subject Coverage & Content Improvement Plan

**Last updated:** 2026-05-05  
**Status:** Planning doc; **Phase 10** metadata complete; **Phase 11–12** Science review reports published ([**Phase 11** spot sample](product-quality-phase-11-science-factual-distractor-review.md), [**Phase 12** full-bank mechanical sweep](product-quality-phase-12-science-full-content-review.md)) — **documentation only; no bank edits**. **Phase 14** English translation **model** review (audit vs runtime): [`product-quality-phase-14-english-translation-model-review.md`](product-quality-phase-14-english-translation-model-review.md).  
**Strict boundary (Phase 8 original):** Phase 8 was documentation-only. **Phases 9–10** changed **only** neutral metadata in [`data/science-questions.js`](../data/science-questions.js) and [`data/science-questions-phase3.js`](../data/science-questions-phase3.js); no stems, answers, or grade gates.

### Phase 9 — Science `patternFamily` first batch (historical counts)

| Metric | Before Phase 9 | After Phase 9 |
|--------|----------------|---------------|
| Science rows with `patternFamily` | **3** / 383 | **35** / 383 |
| Science rows missing `patternFamily` | **380** | **348** |

Details: [`docs/product-quality-phase-9-science-metadata-patch.md`](product-quality-phase-9-science-metadata-patch.md).

### Phase 10 — Science `patternFamily` completion (latest audit)

| Metric | After Phase 10 |
|--------|----------------|
| Science rows with `patternFamily` | **383** / **383** |
| Science rows missing `patternFamily` | **0** |
| Science rows missing `subtype` | **0** |

Details: [`docs/product-quality-phase-10-science-metadata-completion.md`](product-quality-phase-10-science-metadata-completion.md).

### Phase 11 — Science factual + distractor review (report only)

| Scope | Result |
|-------|--------|
| Spot-check sample | **18** rows (17 = one per `patternFamily` + `env_9` for environment/ecosystems balance) |
| Bank edits | **None** |

Details: [`docs/product-quality-phase-11-science-factual-distractor-review.md`](product-quality-phase-11-science-factual-distractor-review.md).

### Phase 12 — Full science bank sweep (report only)

| Scope | Result |
|-------|--------|
| Rows mechanically reviewed | **383** / **383** |
| Additional backlog ids vs Phase 11 | **None** (semantic backlog remains **`animals_4`**, **`exp_1`**) |

Details: [`docs/product-quality-phase-12-science-full-content-review.md`](product-quality-phase-12-science-full-content-review.md).

### Phase 14 — English translation model (audit vs runtime, report only)

| Scope | Result |
|-------|--------|
| Translation audit rows reviewed | **41** (36 phrase-pool rows with empty static `optionCount` + **5** `simulator_translation_mcq` rows with `optionCount` **4**) |
| Bank / wording edits | **None** |

Details: [`docs/product-quality-phase-14-english-translation-model-review.md`](product-quality-phase-14-english-translation-model-review.md).

## Sources

- [`reports/question-audit/items.json`](../reports/question-audit/items.json)
- [`reports/question-audit/findings.json`](../reports/question-audit/findings.json)
- [`reports/question-audit/stage2.json`](../reports/question-audit/stage2.json)
- [`docs/product-quality-phase-1-audit.md`](product-quality-phase-1-audit.md)
- [`docs/question-bank-professional-qa-plan.md`](question-bank-professional-qa-plan.md)
- [`docs/product-quality-phase-3-hebrew-owner-review.md`](product-quality-phase-3-hebrew-owner-review.md)

The latest audit contains **12158** rows.

---

## 1. Executive Summary

| Subject | Rows | Active grades | Readiness status | Strongest evidence | Weakest evidence | Blockers before launch | What can wait |
|---------|------|---------------|------------------|-------------------|------------------|------------------------|---------------|
| **Math** | 3942 | G1-G6 | **Ready enough** with focused diagnostic follow-up | Balanced easy/medium/hard (**1314** each); broad topic generator coverage; no missing difficulty / subtype / patternFamily in audit output | 5 probe-gated diagnostic kinds not hit by plain audit sample | If diagnostic precision matters for launch: probe-aware harness, not more random sampling | Story diversity, context variety |
| **Geometry** | 2548 | G1-G6 | **Ready enough** with metadata polish | Broad topic set; no missing difficulty or patternFamily; conceptual + generator coverage | **1313** rows missing `subtype` in audit output, mostly generated rows | Review key visual/formula topics for answer-key and diagram assumption risk | Broaden real-world contexts |
| **Hebrew** | 927 | G1-G6 | **Needs owner review** | No missing difficulty / patternFamily / subtype; full grade span | Phase 3 unresolved duplicate/overlap owner decisions | Owner approval for legacy triple stems + high-risk overlap rows. **Owner exact wording required** for any wording change | Spiral-repetition keep list can wait after spot-check |
| **English** | 852 | G1-G6 | **Needs focused fixes** | English translation difficulty metadata fixed; no missing difficulty | **621** rows missing `subtype`; **36** translation phrase rows have **empty** static `optionCount` in audit (see **Phase 14** — **expected** with current audit rules; runtime builds MCQ/typing) | Subtype metadata policy; optional **audit** enhancement for translation `optionCount` / `answerMode` | Wider topical variety |
| **Science** | 383 | G1-G6 via broad grade spans | **Metadata complete**; **Phase 11 spot-review documented** | Full `patternFamily` + `subtype` (**Phase 10**); spot sample flagged **`animals_4`** for owner wording/factual alignment (see Phase 11 doc) | Full-bank human read still optional | Owner decision on Phase 11 flagged items; broader factual pass by family | Add questions only after owner-approved fixes |
| **Homeland / Geography** | 3506 | G1-G6 | **Ready enough** | Largest static bank; full metadata; balanced difficulty; all option counts 4 | Broad topics span many grades and may hide repeated templates | Spot-check factual freshness and map/civic ambiguity | Contemporary examples and terminology polish |

**Weakest subject right now (content QA):** **Science** — metadata taxonomy is **complete** in the audit (**Phase 10**), but factual accuracy and distractor quality still need a documented human review pass (not an audit artifact gap).

**Strongest subject right now:** **Homeland / Geography**, because it has **3506** static rows, full grade coverage, full metadata, balanced topics/difficulty, and no missing option metadata in audit output.

---

## 2. Coverage Matrix by Subject

### 2.1 Math

| Metric | Evidence |
|--------|----------|
| Active grades | G1-G6 |
| Count by grade | G1 **342**, G2 **444**, G3 **672**, G4 **864**, G5 **780**, G6 **840** |
| Count by difficulty | easy **1314**, medium **1314**, hard **1314** |
| Count by topic | addition 288; subtraction 288; multiplication 288; compare 288; number_sense 294; word_problems 252; equations 240; division 240; fractions 258; divisibility 144; division_with_remainder 192; sequences 192; decimals 210; order_of_operations 48; rounding 144; prime_composite 48; powers 48; zero_one_properties 48; factors_multiples 144; estimation 96; percentages 96; ratio 48; scale 48 |
| Top subtopics | div 305; cmp 288; sub_two 281; mul 263; add_two 234; sequence 192; divisibility 144; round 144 |
| Missing metadata | difficulty **0**, patternFamily **0**, subtype **0** |
| Answer mode / options | numeric **3942**; option counts: 2 (**162**), 3 (**288**), 4 (**3492**) |
| Suspected duplicate clusters | No exact / near duplicates listed in `findings.json`; math duplicates normalized away as generator templates |
| Answer-key risk | Arithmetic determinism appears structurally strong, but generator answer correctness still depends on code paths |
| Distractor risk | Common-error distractors need targeted review for conceptual plausibility |

**Weak / underrepresented topics:** `order_of_operations`, `prime_composite`, `powers`, `zero_one_properties`, `ratio`, `scale` each have **48** sampled rows. This may be acceptable if these are advanced/limited units, but they are lower-volume than core operations.

**Overrepresented topics:** core arithmetic and number sense are intentionally high-volume.

**Launch readiness:** **ready enough**, unless diagnostic precision is part of launch promise.

**Blocker before launch:** none for baseline practice. If diagnostics are launch-critical, create a **probe harness** for the five missed probe kinds.

---

### 2.2 Geometry

| Metric | Evidence |
|--------|----------|
| Active grades | G1-G6 |
| Count by grade | G1 **151**, G2 **223**, G3 **521**, G4 **449**, G5 **672**, G6 **532** |
| Count by difficulty | easy **816**, medium **816**, hard **828**, easy/medium **44**, medium/hard **24**, easy/medium/hard **20** |
| Count by topic | area 366; perimeter 288; angles 226; volume 222; parallel_perpendicular 152; quadrilaterals 152; solids 152; shapes_basic 152; transformations 148; diagonal 148; triangles 76; symmetry 76; pythagoras 74; tiling 74; heights 74; rotation 74; circles 73; plus small conceptual combined topics |
| Top subtopics | concept_measure_interpret 254; triangle_angles 116; transformations 111; solids 106; parallel_perpendicular 102; concept_angle_reason 95 |
| Missing metadata | difficulty **0**, patternFamily **0**, subtype **1313** |
| Answer mode / options | mcq_text **1038**, numeric_mcq **1455**, binary **55**; option counts 2/4 only |
| Suspected duplicate clusters | No exact / near duplicates listed; conceptual rows are small static bank + broad generated sample |
| Answer-key risk | Higher for diagram/formula topics: area/perimeter, volume, circles, pythagoras |
| Distractor risk | Area/perimeter confusion and diagram assumption distractors need review |

**Weak / underrepresented topics:** `circles|area|perimeter` (1), `symmetry|transformations` (2), `angles|triangles` (2), `quadrilaterals|triangles` (4) are small combined conceptual slices.

**Overrepresented topics:** area/perimeter and generated formula topics dominate, likely acceptable for practice volume.

**Launch readiness:** **ready enough** with metadata polish.

**Blocker before launch:** none obvious from audit; answer-key review for diagram/formula assumptions should be high priority.

---

### 2.3 Hebrew

| Metric | Evidence |
|--------|----------|
| Active grades | G1-G6 |
| Count by grade | G1 **346**, G2 **199**, G3 **94**, G4 **93**, G5 **96**, G6 **99** |
| Count by difficulty | easy **380**, medium **291**, hard **209**, medium/hard **28**, easy/medium **19** |
| Count by topic | reading 199; grammar 186; comprehension 173; vocabulary 154; writing 141; speaking 74 |
| Subtopics | Audit output has subtype metadata for all rows, but subtopic column is blank in the summary view |
| Missing metadata | difficulty **0**, patternFamily **0**, subtype **0** |
| Answer mode / options | choice **726**, typing **201**; option counts 2 (**4**) and 4 (**923**) |
| Suspected duplicate clusters | 2 legacy same-stem triple-level groups; 37 adjacent-band overlap rows |
| Answer-key risk | Accepted variants / typing policy and grammar-correctness need owner/content review |
| Distractor risk | Linguistic distractors can become accidentally correct; requires human review |

**Known owner-review risks:** see [`docs/product-quality-phase-3-hebrew-owner-review.md`](product-quality-phase-3-hebrew-owner-review.md). Highest attention: `H-L1`, `H-L2`, `H-O01`, `H-O15–H-O20`, `H-O34–H-O35`.

**Launch readiness:** **needs owner review**.

**Blocker before launch:** unresolved owner decisions for duplicate/overlap rows. If wording changes are needed: **Owner exact wording required**. No alternative Hebrew wording should be generated by the agent.

---

### 2.4 English

| Metric | Evidence |
|--------|----------|
| Active grades | G1-G6 |
| Count by grade | G1 **23**, G2 **100**, G3 **106**, G4 **103**, G4-G5 **48**, G5 **243**, G6 **229** |
| Count by difficulty | basic **659**, standard **111**, advanced **82** |
| Count by topic | grammar **683**, sentence **128**, translation **41** |
| Top subtopics | question_frames 98; modals 98; comparatives 96; be_basic 50; progressive 49; past_simple 49; future_forms 49; complex_tenses 49; conditionals 49 |
| Missing metadata | difficulty **0**, patternFamily **0**, subtype **621** |
| Answer mode / options | mcq **852** (audit default); option counts 3 (**811**), 4 (**5**), **empty / falsy** (**36** translation phrase rows — **Phase 14**) |
| Suspected duplicate clusters | No exact / near duplicates listed |
| Answer-key risk | Translation phrase rows: runtime builds MCQ/typing (**Phase 14**); audit empty `optionCount` is **not** a missing key signal |
| Distractor risk | Grammar distractors should reflect learner mistakes; translation distractors need naturalness review |

**Weak / underrepresented topics:** translation is small (**41**) relative to grammar (**683**). This may be fine if translation is a light activity, but it is underrepresented as a content area.

**Overrepresented topics:** grammar is dominant.

**Launch readiness:** **needs focused fixes**. Difficulty gap is closed; next risk is translation answer/metadata modeling and subtype sparsity.

---

### 2.5 Science

| Metric | Evidence |
|--------|----------|
| Active grades | G1-G6 via direct-bank grade spans |
| Count by grade/span | G1-G2 **80**, G3-G4 **93**, G5-G6 **109**, plus smaller single/overlap spans |
| Count by difficulty | easy **113**, medium **145**, hard **124**, easy/hard **1** |
| Count by topic | earth_space 66; environment 65; experiments 59; animals 51; body 50; plants 46; materials 46 |
| Top subtopics | sci_earth_space_general 66; sci_environment_general 65; sci_experiments_general 59; sci_animals_general 51; sci_body_general 47; sci_plants_general 46; sci_materials_general 46 |
| Missing metadata | difficulty **0**, patternFamily **0**, subtype **0** (**Phase 10**) |
| Answer mode / options | mcq **360**, true_false **23**; option counts 4 (**360**), 2 (**23**) |
| Suspected duplicate clusters | No exact / near duplicates listed |
| Content QA | **Phase 11** spot sample (**18** rows): see [`docs/product-quality-phase-11-science-factual-distractor-review.md`](product-quality-phase-11-science-factual-distractor-review.md) — **1** high-priority wording/factual alignment flag (`animals_4`); full bank not read end-to-end |
| Answer-key risk | Spot sample did not invalidate keyed indices; flagged item needs **owner-approved** Hebrew alignment if text changes |
| Distractor risk | No distractor issues identified in the Phase 11 sample; full bank not exhaustively reviewed |

**Weak / underrepresented topics:** plants/materials are lowest at **46** each; body has three specific subtopics plus mostly general tagging.

**Overrepresented topics:** earth_space/environment are highest but close to experiments/body.

**Launch readiness:** **improved** vs metadata-only; still **owner-dependent** for any approved Hebrew edits from Phase 11.

**Blocker before launch:** none for “metadata + initial spot review”; **owner approval** if acting on Phase 11 wording flags.

---

### 2.6 Homeland / Geography

| Metric | Evidence |
|--------|----------|
| Active grades | G1-G6 |
| Count by grade | G1 **617**, G2 **634**, G3 **617**, G4 **554**, G5 **541**, G6 **543** |
| Count by difficulty | easy **1318**, medium **1101**, hard **1087** |
| Count by topic | homeland 620; geography 584; maps 583; citizenship 575; values 573; community 571 |
| Subtopics | homeland 620; geography 584; maps 583; citizenship 575; values 573; community 571 |
| Missing metadata | difficulty **0**, patternFamily **0**, subtype **0** |
| Answer mode / options | mcq **3506**; option count 4 for all rows |
| Suspected duplicate clusters | No exact / near duplicates listed |
| Answer-key risk | Factual freshness, place names, map/scale assumptions |
| Distractor risk | Plausible location/feature confusion without ambiguity |

**Weak / underrepresented topics:** no clear underrepresented topic by row count; all six topics are between **571–620** rows.

**Overrepresented topics:** none by count, but `findings.json` notes broad topics span many grades with dominant single family (`moledet_geography_bank`), so topic labels are broad rather than granular.

**Launch readiness:** **ready enough**.

**Blocker before launch:** no structural blocker from audit; spot-check factual freshness and map/civic ambiguity.

---

## 3. Priority List

### Critical content blockers

1. **Hebrew owner decisions** before any Hebrew edits: `H-L1`, `H-L2`, `H-O01`, `H-O15–H-O20`, `H-O34–H-O35`.  
   - Action type: **owner wording decision** / remove-merge later if approved.  
   - Owner approval required: **yes**.  
   - Hebrew exact wording required: **yes**, if any prompt changes.

2. **Science factual/distractor review** (metadata taxonomy **complete** as of **Phase 10**).  
   - Action type: **review answer key**, **review distractors**.  
   - Owner approval required: **no** for metadata; **yes** if content wording changes.

### High priority fixes

1. **English translation answer/option model** — **Phase 14** documented: empty static `optionCount` on **36** phrase rows matches audit rules; runtime uses generated MCQ/typing. **Next (optional):** improve **audit** projection only (`optionCount` / `answerMode`), or a **curated** distractor pass — not required to interpret current audit.

2. **Math probe harness** if diagnostic behavior is part of launch claims.  
   - Action type: **create probe harness**.

3. **Geometry subtype metadata and formula/diagram answer-key spot-check**.  
   - Action type: **add metadata**, **review answer key**.

### Medium improvements

- English subtype coverage for grammar-heavy rows.
- Science topic/subtopic granularity beyond general `sci_*_general`.
- Geography factual freshness and map/civic ambiguity spot-check.
- Hebrew accepted-variants policy for typing rows.

### Polish later

- Math story/context variety.
- Geometry real-world context diversity.
- English translation pool expansion after metadata review.
- Geography contemporary local examples.

---

## 4. First Recommended Content Patch

**Patch name:** Science metadata + review-pack seed (no wording changes)

| Field | Scope |
|-------|-------|
| **Subject** | Science |
| **Exact file(s)** | [`data/science-questions.js`](../data/science-questions.js) for metadata only; optionally add/update a docs/reports review artifact if an existing science metadata review-pack script is used later |
| **Grades** | Existing science grade spans only; do not change grade gates |
| **Topic/subtopic** | All seven science topics: body, animals, plants, materials, earth_space, environment, experiments. Priority first pass: rows currently summarized under general subtopics (`sci_*_general`) |
| **Issue being fixed** | Audit showed **380/383** science rows missing `patternFamily` (now **348** after Phase 9 first batch). Difficulty remains present. Full taxonomy rollout still limits content-quality review by concept family until complete. |
| **Action type** | **add metadata**, then **review answer key** and **review distractors** in a separate review pass |
| **Why this is safest first patch** | It improves auditability and professional review without changing question wording, answers, grade gates, UI, or runtime logic. It avoids Hebrew wording risk and does not require adding new questions before the existing bank is classified. |
| **Owner approval required** | **No** for adding neutral metadata taxonomy; **yes** if any question text, answer, or distractor is later found to require content change |
| **Hebrew exact wording required** | **No** for metadata-only patch. **Yes** if a later factual/distractor review requires changing Hebrew text in a science question |
| **Must not be touched** | Do not change `question`, `answers`, `correctIndex`, grade ranges, topic keys, UI, generators, reports, Parent AI, Copilot, or Hebrew bank files |

**Recommended batch size:** 25–40 science rows first, covering at least one sample from each topic, then run the existing question audit to confirm metadata visibility. Do **not** add new science questions until taxonomy and factual-review criteria are stable.

---

## 5. Next Patch Candidates (After First Patch)

| Rank | Subject | File(s) | Issue | Action type | Risk | Owner approval required | Hebrew exact wording required |
|------|---------|---------|-------|-------------|------|-------------------------|-------------------------------|
| 2 | Hebrew | `utils/hebrew-question-generator.js`, `utils/hebrew-rich-question-bank.js` | Phase 3 unresolved duplicate/overlap owner decisions | owner wording decision; remove/merge duplicate later | High | **Yes** | **Yes** |
| 3 | English | `data/english-questions/translation-pools.js` | **Phase 14:** model confirmed; **36** rows = empty static `optionCount` (expected). Optional: audit fields or curated distractors | optional **audit** metadata; optional content distractor pass | Low–Medium | No for audit-only; yes for content changes | No unless Hebrew prompts are changed |
| 4 | Math | `utils/math-question-generator.js`; future harness script | Five probe-gated kinds not hit by plain audit | create probe harness | Medium | No | No |
| 5 | Geometry | `utils/geometry-question-generator.js`, `utils/geometry-conceptual-bank.js` | Missing subtype on generated rows; formula/diagram answer assumptions | add metadata; review answer key | Medium | No for metadata; yes for content changes | No unless Hebrew prompt text changes |
| 6 | Geography | `data/geography-questions/g*.js` | Factual freshness / map-civic ambiguity spot-check | review answer key; review distractors | Low-Medium | Yes for factual wording changes | Yes if Hebrew wording changes |

---

## 6. Non-Negotiable Hebrew Rule

For Hebrew or Hebrew-facing content issues:

- Do **not** rewrite Hebrew wording.
- Do **not** generate alternative Hebrew wording.
- Do **not** change Hebrew question text without exact owner approval.
- Mark the item: **Owner exact wording required**.

This applies to Hebrew subject banks and to any Hebrew text embedded in English/Science/Geography prompts if wording changes are proposed later.

---

## 7. Final Phase 8 Boundary

| Check | Result |
|-------|--------|
| Question content changed? | **No** |
| Hebrew wording changed? | **No** |
| Alternative Hebrew wording generated? | **No** |
| Answers changed? | **No** |
| Product logic / UI / APIs changed? | **No** |

*Phases 9–10* added neutral `params.patternFamily` (and closed `subtype` gaps) in `data/science-questions.js` and `data/science-questions-phase3.js`, with the same “no content / no answers” rules; see [`docs/product-quality-phase-10-science-metadata-completion.md`](product-quality-phase-10-science-metadata-completion.md).

**Recommended next action:** run **Science factual/distractor QA** grouped by `patternFamily` ([`docs/product-quality-phase-10-science-metadata-completion.md`](product-quality-phase-10-science-metadata-completion.md)), or prioritize Hebrew owner decisions if owner review is already available.
