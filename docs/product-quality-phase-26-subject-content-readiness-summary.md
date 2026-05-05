# Product Quality Phase 26 — Deep Subject Coverage Matrix + Readiness Summary

**Last updated:** 2026-05-05  
**Status:** Analysis/report only (Phase 26 snapshot). **Phase 27–30** English expansion **implemented** (+**52** English audit rows): [**28**](product-quality-phase-28-english-expansion-batch-1.md), [**29**](product-quality-phase-29-english-grammar-expansion-batch.md), [**30**](product-quality-phase-30-english-expansion-quality-review.md). Original Phase 27 planning doc: [`product-quality-phase-27-english-targeted-expansion-plan.md`](product-quality-phase-27-english-targeted-expansion-plan.md).

**Data sources:** [`reports/question-audit/items.json`](../reports/question-audit/items.json), [`reports/question-audit/findings.json`](../reports/question-audit/findings.json), [`reports/question-audit/stage2.json`](../reports/question-audit/stage2.json), [`reports/math-probe-audit/summary.json`](../reports/math-probe-audit/summary.json).  
**Phase context:** Phases 8-25 docs (especially 8, 10-13, 14-15, 16-17, 19, 20-23, 24-25, and 1).

---

## 1) Global totals

| Subject | Rows | Active grades | Topics | Subtopics | Pattern families | Difficulty | Answer mode | Provenance |
|---|---:|---|---:|---:|---:|---|---|---|
| Geography | 3506 | G1-G6 | 6 | 6 | 1 | easy 1318, medium 1101, hard 1087 | mcq 3506 | static_bank 3506 |
| Science | 383 | G1-G6 | 7 | 10 | 17 | easy 113, medium 145, hard 124, mixed 1 | mcq 360, true_false 23 | science_direct_bank 383 |
| Hebrew | 926 | G1-G6 | 6 | 0 (mostly blank) | 364 | easy 380, medium 291, hard 208, mixed 47 | choice 725, typing 201 | static_bank 926 |
| English | 852 | G1-G6 | 3 | 23 | 242 | basic 659, standard 111, advanced 82 | mcq 816, runtime_translation 36 | static_bank 852 |
| Geometry | 2548 | G1-G6 | 22 | 122 | 117 | easy 816, medium 816, hard 828, mixed 88 | numeric_mcq 1455, mcq_text 1038, binary 55 | static_bank 100, generator_sample 2448 |
| Math | 3942 | G1-G6 | 23 | 107 | 106 | easy 1314, medium 1314, hard 1314 | numeric 3942 | generator_sample 3942 |

**Total rows:** 12157.

---

## 2) Grade coverage matrix

### Geography

| Grade | Total | Easy | Medium | Hard | Signal |
|---|---:|---:|---:|---:|---|
| G1 | 617 | 257 | 180 | 180 | Balanced |
| G2 | 634 | 263 | 189 | 182 | Balanced |
| G3 | 617 | 244 | 190 | 183 | Balanced |
| G4 | 554 | 193 | 180 | 181 | Slightly lower total |
| G5 | 541 | 180 | 181 | 180 | Slightly lower total |
| G6 | 543 | 181 | 181 | 181 | Slightly lower total |

### Science

| Grade | Total | Easy | Medium | Hard | Signal |
|---|---:|---:|---:|---:|---|
| G1 | 97 | 84 | 7 | 6 | Easy-heavy |
| G2 | 116 | 89 | 18 | 9 | Easy-heavy |
| G3 | 144 | 14 | 109 | 21 | Medium concentration |
| G4 | 114 | 8 | 84 | 22 | Medium concentration |
| G5 | 130 | 6 | 35 | 89 | Hard concentration |
| G6 | 121 | 6 | 33 | 82 | Hard concentration |

### Hebrew

| Grade | Total | Easy | Medium | Hard | Signal |
|---|---:|---:|---:|---:|---|
| G1 | 346 | 186 | 88 | 72 | Strong early concentration |
| G2 | 199 | 102 | 53 | 44 | Moderate |
| G3 | 94 | 34 | 45 | 15 | ⚠ thin vs G1 |
| G4 | 93 | 29 | 45 | 19 | ⚠ thin vs G1 |
| G5 | 95 | 29 | 37 | 29 | ⚠ thin vs G1 |
| G6 | 99 | 19 | 51 | 29 | ⚠ thin vs G1 |

### English

| Grade | Total | Basic | Standard | Advanced | Signal |
|---|---:|---:|---:|---:|---|
| G1 | 23 | 23 | 0 | 0 | ⚠ very thin |
| G2 | 100 | 100 | 0 | 0 | ⚠ no standard/advanced |
| G3 | 106 | 49 | 57 | 0 | no advanced |
| G4 | 151 | 97 | 54 | 0 | no advanced |
| G5 | 291 | 243 | 0 | 48 | no standard |
| G6 | 229 | 195 | 0 | 34 | no standard |

### Geometry

| Grade | Total | Easy | Medium | Hard | Signal |
|---|---:|---:|---:|---:|---|
| G1 | 151 | 55 | 48 | 48 | ⚠ thin vs upper grades |
| G2 | 223 | 79 | 72 | 72 | lower than upper grades |
| G3 | 521 | 180 | 172 | 169 | strong |
| G4 | 449 | 156 | 148 | 145 | strong |
| G5 | 672 | 228 | 223 | 221 | strongest |
| G6 | 532 | 182 | 177 | 173 | strong |

### Math

| Grade | Total | Easy | Medium | Hard | Signal |
|---|---:|---:|---:|---:|---|
| G1 | 342 | 118 | 112 | 112 | ⚠ thinner than G3-G6 |
| G2 | 444 | 156 | 144 | 144 | moderate |
| G3 | 672 | 224 | 224 | 224 | strong |
| G4 | 864 | 288 | 288 | 288 | strongest |
| G5 | 780 | 256 | 268 | 256 | strong |
| G6 | 840 | 272 | 278 | 290 | strong |

---

## 3) Topic coverage matrix

### Geography

| Topic | Total | Grades | Diff (E/M/H) | Strongest | Weakest | Notes |
|---|---:|---|---|---|---|---|
| homeland | 620 | G1-G6 | 241/200/179 | G2(115) | G5(90) | Stable |
| geography | 584 | G1-G6 | 221/186/177 | G2/G3(106) | G4-G6(90) | Stable |
| maps | 583 | G1-G6 | 218/181/184 | G3(106) | G4/G6(90) | Stable |
| citizenship | 575 | G1-G6 | 211/182/182 | G1(101) | G5(90) | Stable |
| values | 573 | G1-G6 | 214/177/182 | G3(103) | G4-G6(90) | Stable |
| community | 571 | G1-G6 | 213/175/183 | G2(106) | G5(90) | Stable |

### Science

| Topic | Total | Grades | Diff (E/M/H) | Strongest | Weakest | Notes |
|---|---:|---|---|---|---|---|
| earth_space | 66 | G1-G6 | 17/27/22 | G5(30) | G2(4) | ⚠ G2 thin |
| environment | 65 | G1-G6 | 11/26/28 | G5(35) | G1(11) | Upper-heavy |
| experiments | 59 | G2-G6 | 9/21/29 | G5(36) | G2(11) | No G1 |
| animals | 51 | G1-G6 | 21/19/11 | G2(24) | G6(8) | Late thin |
| body | 50 | G1-G6 | 26/13/11 | G2(24) | G6(9) | Late thin |
| plants | 46 | G1-G3 | 16/19/11 | G3(30) | G1(17) | ⚠ No G4-G6 |
| materials | 46 | G1-G6 | 14/20/12 | G3(22) | G6(9) | Late thin |

### Hebrew

| Topic | Total | Grades | Diff (E/M/H) | Strongest | Weakest | Notes |
|---|---:|---|---|---|---|---|
| reading | 199 | G1-G6 | 86/72/41 | G1(119) | G5/G6(9) | Early-heavy |
| grammar | 186 | G1-G6 | 73/77/36 | G1(73) | G5(17) | Early-heavy |
| comprehension | 173 | G1-G6 | 75/59/39 | G1(53) | G5/G6(22) | Early-heavy |
| vocabulary | 153 | G1-G6 | 70/45/38 | G1(47) | G4(19) | Moderate imbalance |
| writing | 141 | G1-G6 | 63/43/35 | G2(45) | G4(13) | Mid-thin |
| speaking | 74 | G1-G6 | 32/23/19 | G2(26) | G3/G4(5) | ⚠ thinnest topic |

### English

| Topic | Total | Grades | Diff (B/S/A) | Strongest | Weakest | Notes |
|---|---:|---|---|---|---|---|
| grammar | 683 | G1-G6 | 635/48/0 | G5(243) | G1(15) | ⚠ dominant + no advanced |
| sentence | 128 | G1-G6 | 17/46/65 | G5(39) | G1(6) | Better depth |
| translation | 41 | G1-G6 | 7/17/17 | G3/G5(9) | G1(2) | ⚠ smallest |

### Geometry (compact)

Core topics (`area`, `perimeter`, `angles`, `volume`, `shapes_basic`, `solids`) are generally balanced by difficulty, but coverage is intentionally gated by grade and includes many boundary anchor cells (count 1-2).

### Math (compact)

Core tracks (`addition`, `subtraction`, `multiplication`, `compare`, `number_sense`) are highly stable with near-uniform grade distribution; narrow topics are intentionally grade-specific.

---

## 4) Grade × Topic matrix

### Geography

| Topic \\ Grade | G1 | G2 | G3 | G4 | G5 | G6 |
|---|---:|---:|---:|---:|---:|---:|
| homeland | 112 | 115 | 113 | 100 | 90 | 90 |
| geography | 102 | 106 | 106 | 90 | 90 | 90 |
| maps | 101 | 105 | 106 | 90 | 91 | 90 |
| citizenship | 101 | 101 | 98 | 93 | 90 | 92 |
| values | 99 | 101 | 103 | 90 | 90 | 90 |
| community | 102 | 106 | 91 | 91 | 90 | 91 |

**Empty:** 0. **Low:** mostly 90-92 in G4-G6 (still high absolute). **Overrepresented:** homeland/maps/geography in G2-G3.

### Science

| Topic \\ Grade | G1 | G2 | G3 | G4 | G5 | G6 |
|---|---:|---:|---:|---:|---:|---:|
| animals | 21 | 24 | 21 | 21 | 9 | 8 |
| body | 23 | 24 | 16 | 17 | 10 | 9 |
| earth_space | 12 | 4 | 20 | 20 | 30 | 28 |
| environment | 11 | 13 | 19 | 20 | 35 | 33 |
| experiments | 0 | 11 | 16 | 15 | 36 | 34 |
| materials | 13 | 16 | 22 | 21 | 10 | 9 |
| plants | 17 | 24 | 30 | 0 | 0 | 0 |

**Empty:** 4. **Low:** earth_space@G2=4; late animals/body/materials 8-10. **Overrepresented:** environment/experiments in G5-G6.

### Hebrew

| Topic \\ Grade | G1 | G2 | G3 | G4 | G5 | G6 |
|---|---:|---:|---:|---:|---:|---:|
| reading | 119 | 40 | 12 | 10 | 9 | 9 |
| grammar | 73 | 35 | 18 | 22 | 17 | 21 |
| comprehension | 53 | 29 | 23 | 24 | 22 | 22 |
| vocabulary | 47 | 24 | 21 | 19 | 21 | 21 |
| writing | 34 | 45 | 15 | 13 | 17 | 17 |
| speaking | 20 | 26 | 5 | 5 | 9 | 9 |

**Empty:** 0. **Low:** speaking@G3/G4=5; reading@G5/G6=9. **Overrepresented:** reading@G1=119.

### English

| Topic \\ Grade | G1 | G2 | G3 | G4 | G5 | G6 |
|---|---:|---:|---:|---:|---:|---:|
| grammar | 15 | 84 | 78 | 116 | 243 | 195 |
| sentence | 6 | 11 | 19 | 27 | 39 | 26 |
| translation | 2 | 5 | 9 | 8 | 9 | 8 |

**Empty:** 0. **Low:** translation@G1=2, translation@G2=5, sentence@G1=6. **Overrepresented:** grammar@G5/G6.

### Geometry / Math (compact)

- **Geometry:** 63 empty grade-topic cells (mostly intentional grade gating), many low boundary anchors (count 1-2), strong repeated core cells around 72-75 in intended grades.
- **Math:** 57 empty cells (intentional topic-grade gating), baseline non-zero often 48 (stable sampling), peaks: decimals@G6=66, fractions@G2=60, word_problems@G5/G6=54.

---

## 5) Topic × Difficulty matrix

### Geography

All six topics show broad spread (roughly 175-241 per difficulty bucket); no topic is missing a difficulty band.

### Science

All topics have E/M/H presence; `animals`, `body`, `materials` are relatively hard-thin in upper grades.

### Hebrew

All six topics have E/M/H presence; `speaking` has the lowest absolute spread (32/23/19).

### English

- grammar: 635/48/0 (⚠ no advanced)
- sentence: 17/46/65 (good spread)
- translation: 7/17/17 (acceptable but low volume)

### Geometry

Core topics are mostly balanced by difficulty; micro-composite topics are too small to fully represent all difficulties.

### Math

Strongest difficulty spread across subjects: many topics are exactly balanced (96/96/96, 80/80/80, 48/48/48, or 16/16/16 by design).

---

## 6) Subtopic / patternFamily matrix

### Geography
- Top subtopics: homeland (620), geography (584), maps (583), citizenship (575), values (573).
- Pattern family is very broad: `moledet_geography_bank` across all rows.
- Metadata acceptable for this pass; granularity can be improved later.

### Science
- Top subtopics are general buckets (`sci_*_general`), with a small long-tail (counts 1-3).
- Pattern families are present (Phase 9-10 closure) and usable.
- Metadata acceptable.

### Hebrew
- `subtopic` mostly blank; classification depends on `topic` + `patternFamily`.
- Rich long-tail of small pattern families (many count 1-3).
- Metadata acceptable for analysis, but subtopic sparsity hurts readability.

### English
- Phase 24-25 closed audit subtype representation (621 missing -> 0 in export).
- Strong pool-based subtopics and granular pattern families.
- Metadata acceptable; weakness is coverage distribution, not metadata.

### Geometry
- Subtopic/pattern metadata is complete after Phase 17.
- Includes micro anchors (count 1-2) and broad generator families.
- Acceptable.

### Math
- Stable and complete metadata; top clusters in `div`, `cmp`, `sub_two`.
- Probe harness summary is `overallPass: true` (Phase 19).

---

## 7) Weakness detection (ranked)

1. **Weakest subject overall:** English (heavy grammar dominance, thin translation, weak early-grade depth).
2. **Weakest grade band overall:** G1 (driven mainly by English thinness).
3. **Weakest topic overall:** English translation (41 total; G1=2, G2=5).
4. **Weakest subject-topic-grade cell (practical):** English translation @ G1 = 2.
5. **Strongest subject:** Geography (all topics across all grades, no empty cells, balanced difficulty).
6. **Strongest topic distribution:** Geography (topic counts tightly clustered).
7. **Overrepresented areas:** English grammar (G5-G6), Hebrew reading (G1), repeated core generator cells in Geometry/Math (design-driven).

---

## 8) Launch readiness per subject

| Subject | Classification | Reasoning |
|---|---|---|
| Geography | **closed for this pass** | Very strong matrix coverage; remaining work is factual/ambiguity QA (Phase 23), not structural coverage gaps. |
| Math | **closed for this pass** | Strong balanced coverage and probe validation (Phase 19); empty cells are mostly intentional topic-grade gating. |
| Geometry | **acceptable with owner review** | Strong volume + metadata closure; still needs targeted manual QA themes from Phase 16. |
| Science | **acceptable with owner review** | Metadata complete; some thin cells and factual/distractor QA remains from Phases 11-13. |
| Hebrew | **needs focused fix** | Coverage exists, but unresolved owner decisions from Phases 20-22 still block full closure. |
| English | **needs focused fix** | Metadata issue closed (Phase 25), but coverage matrix still shows topic/grade imbalance. |

---

## 9) Content blockers

### True launch blockers
- None found as hard blockers from coverage matrix alone.

### Owner-decision blockers
- Hebrew unresolved adjacent-band overlaps (9 unresolved in `stage2.json`) from Phases 20-22.

### QA/manual-review blockers
- Science factual/distractor QA depth.
- Geometry formula/diagram/story ambiguity checks (Phase 16 themes).
- Geography factual freshness/map-civic ambiguity checks (Phase 23).

### Non-blocking polish
- English translation + early-grade expansion.
- Hebrew speaking depth in G3-G4.
- Optional metadata granularity polish (Geography/Hebrew).

---

## 10) Recommended next content action

1. **Concrete backlog + first batch (Phase 27):** [`docs/product-quality-phase-27-english-targeted-expansion-plan.md`](product-quality-phase-27-english-targeted-expansion-plan.md) — target minimums for `translation` @ G1/G2 and `sentence` @ G1; first **16**-item batch (translation + sentence only; grammar in batch 2).
2. In parallel, close **Hebrew owner-decision** items from Phases 20-22.
3. Execute focused QA packs for Science/Geometry/Geography flagged themes.
4. Keep Math and Geography in monitor mode (closed for current pass).

---

## Appendix — Full large-subject grade×topic matrices

### Geometry

| Topic \\ Grade | G1 | G2 | G3 | G4 | G5 | G6 |
|---|---:|---:|---:|---:|---:|---:|
| angles | 0 | 0 | 74 | 2 | 75 | 75 |
| angles\|triangles | 0 | 0 | 0 | 0 | 1 | 1 |
| area | 1 | 73 | 73 | 73 | 73 | 73 |
| area\|perimeter | 0 | 0 | 2 | 2 | 4 | 4 |
| circles | 0 | 0 | 0 | 0 | 0 | 73 |
| circles\|area\|perimeter | 0 | 0 | 0 | 0 | 0 | 1 |
| diagonal | 0 | 0 | 1 | 73 | 73 | 1 |
| heights | 0 | 0 | 0 | 0 | 73 | 1 |
| parallel_perpendicular | 0 | 0 | 74 | 2 | 74 | 2 |
| perimeter | 0 | 0 | 72 | 72 | 72 | 72 |
| pythagoras | 0 | 0 | 0 | 0 | 0 | 74 |
| quadrilaterals | 0 | 0 | 74 | 2 | 74 | 2 |
| quadrilaterals\|triangles | 0 | 0 | 1 | 1 | 1 | 1 |
| rotation | 0 | 0 | 73 | 1 | 0 | 0 |
| shapes_basic | 74 | 2 | 2 | 74 | 0 | 0 |
| solids | 2 | 74 | 0 | 0 | 2 | 74 |
| symmetry | 0 | 0 | 1 | 73 | 1 | 1 |
| symmetry\|transformations | 0 | 0 | 0 | 0 | 1 | 1 |
| tiling | 0 | 0 | 0 | 0 | 73 | 1 |
| transformations | 74 | 74 | 0 | 0 | 0 | 0 |
| triangles | 0 | 0 | 73 | 1 | 1 | 1 |
| volume | 0 | 0 | 1 | 73 | 74 | 74 |

### Math

| Topic \\ Grade | G1 | G2 | G3 | G4 | G5 | G6 |
|---|---:|---:|---:|---:|---:|---:|
| addition | 48 | 48 | 48 | 48 | 48 | 48 |
| compare | 48 | 48 | 48 | 48 | 48 | 48 |
| decimals | 0 | 0 | 48 | 48 | 48 | 66 |
| divisibility | 0 | 48 | 48 | 48 | 0 | 0 |
| division | 0 | 48 | 48 | 48 | 48 | 48 |
| division_with_remainder | 0 | 0 | 48 | 48 | 48 | 48 |
| equations | 48 | 0 | 48 | 48 | 48 | 48 |
| estimation | 0 | 0 | 0 | 48 | 48 | 0 |
| factors_multiples | 0 | 0 | 0 | 48 | 48 | 48 |
| fractions | 0 | 60 | 48 | 48 | 54 | 48 |
| multiplication | 48 | 48 | 48 | 48 | 48 | 48 |
| number_sense | 54 | 48 | 48 | 48 | 48 | 48 |
| order_of_operations | 0 | 0 | 48 | 0 | 0 | 0 |
| percentages | 0 | 0 | 0 | 0 | 48 | 48 |
| powers | 0 | 0 | 0 | 48 | 0 | 0 |
| prime_composite | 0 | 0 | 0 | 48 | 0 | 0 |
| ratio | 0 | 0 | 0 | 0 | 0 | 48 |
| rounding | 0 | 0 | 0 | 48 | 48 | 48 |
| scale | 0 | 0 | 0 | 0 | 0 | 48 |
| sequences | 0 | 0 | 48 | 48 | 48 | 48 |
| subtraction | 48 | 48 | 48 | 48 | 48 | 48 |
| word_problems | 48 | 48 | 48 | 0 | 54 | 54 |
| zero_one_properties | 0 | 0 | 0 | 48 | 0 | 0 |

---

## Method notes

- Grade coverage is expanded by eligibility (`minGrade..maxGrade` contributes to each covered grade).
- Difficulty was normalized to easy/basic, medium/standard, hard/advanced for cross-subject comparison.
- Weak/overrepresented labels are matrix diagnostics, not automatic product blockers.
