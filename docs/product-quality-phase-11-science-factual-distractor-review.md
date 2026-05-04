# Product Quality Phase 11 — Science Factual + Distractor Review

**Last updated:** 2026-05-05  
**Status:** Review/report only — **no question banks edited**, no Hebrew wording generated, no answers or `correctIndex` changed.

## Sources

| Source | Use |
|--------|-----|
| [`data/science-questions.js`](../data/science-questions.js) | Primary bank |
| [`data/science-questions-phase3.js`](../data/science-questions-phase3.js) | Concatenated bank (included in `SCIENCE_QUESTIONS`) |
| [`reports/question-audit/items.json`](../reports/question-audit/items.json) | Matrix aggregates (`topic`, `patternFamily`, grades, difficulty, answer mode) |
| [`reports/question-audit/findings.json`](../reports/question-audit/findings.json) | Cross-grade / wide-span signals |
| [`docs/product-quality-phase-10-science-metadata-completion.md`](product-quality-phase-10-science-metadata-completion.md) | Metadata baseline |
| [`docs/product-quality-phase-8-subject-coverage-content-plan.md`](product-quality-phase-8-subject-coverage-content-plan.md) | Subject plan reference |

## 1. Science bank inventory (audit snapshot)

- **Total science rows:** **383** (`subject === "science"` in `items.json`).
- **Duplicate findings:** `findings.json` reports **no** exact/near duplicate clusters among audited rows for science (same as prior audits).
- **Wide grade-span families:** see Phase 10 doc — informational for taxonomy, not a content defect.

### 1.1 Difficulty & answer mode (all 383 rows)

| Dimension | Distribution |
|-----------|----------------|
| **Difficulty** (`difficulty` column) | easy **113**, medium **145**, hard **124**, easy\|hard **1** |
| **Answer mode** | MCQ (4 options): **360**; true/false (2 options): **23** |

### 1.2 Topic × `patternFamily` (row counts)

| Topic | patternFamily (count) |
|-------|------------------------|
| **animals** | `sci_animals_classification` **47**; `sci_animals_life_processes` **3**; `sci_environment_ecosystems` **1** |
| **body** | `sci_body_systems` **45**; `sci_body_health` **2**; `science_body_heart_location` **1**; `science_body_sense_organs` **1**; `science_respiratory_gas_exchange` **1** |
| **earth_space** | `sci_earth_space_cycles` **61**; `sci_earth_space_weather` **5** |
| **environment** | `sci_environment_ecosystems` **52**; `sci_environment_sustainability` **13** |
| **experiments** | `sci_experiments_scientific_method` **49**; `sci_experiments_observation_inference` **9**; `sci_earth_space_cycles` **1** (water-cycle ordering item filed under experiments topic) |
| **materials** | `sci_materials_properties` **44**; `sci_materials_changes` **2** |
| **plants** | `sci_plants_growth` **39**; `sci_plants_parts` **7** |

### 1.3 Stratification coverage (matrix keys)

Aggregating `items.json` by  
`(topic | patternFamily | minGrade–maxGrade | difficulty | answerMode | optionCount)` yields **129** distinct strata (many small long-tail cells). Largest strata (top 5 by count): experiments hard G5–G6 + scientific_method (**20** rows); animals easy G1–G2 + classification (**17**); environment hard G5–G6 + ecosystems (**17**); body easy G1–G2 + body_systems (**15**); materials medium G3–G4 + properties (**15**).

---

## 2. Sampling methodology

This phase is **not** a full read of 383 items. It combines:

1. **Exhaustive coverage of taxonomy:** exactly **one** representative **`poolKey` (question id)** per **distinct `patternFamily`** (**17** rows), taken as the first science row per family in audit order (stable, reproducible).
2. **Topic coverage:** those **17** rows already span all **seven** curriculum topics; one **additional** environment row (`env_9`) was reviewed to sample **`sci_environment_ecosystems`** under `topic: environment` (the family default sample was `animals_4`, which is filed under animals).

**Total manually reviewed for classification:** **18** rows.

---

## 3. Representative sample — one row per `patternFamily`

| patternFamily | Representative id | File |
|---------------|-------------------|------|
| `science_body_heart_location` | `body_1` | `science-questions.js` |
| `science_body_sense_organs` | `body_2` | `science-questions.js` |
| `science_respiratory_gas_exchange` | `body_3` | `science-questions.js` |
| `sci_body_systems` | `body_4` | `science-questions.js` |
| `sci_body_health` | `body_20` | `science-questions.js` |
| `sci_animals_classification` | `animals_1` | `science-questions.js` |
| `sci_animals_life_processes` | `animals_13` | `science-questions.js` |
| `sci_plants_growth` | `plants_1` | `science-questions.js` |
| `sci_plants_parts` | `plants_12` | `science-questions.js` |
| `sci_materials_properties` | `materials_1` | `science-questions.js` |
| `sci_materials_changes` | `materials_13` | `science-questions.js` |
| `sci_earth_space_cycles` | `earth_1` | `science-questions.js` |
| `sci_earth_space_weather` | `earth_11` | `science-questions.js` |
| `sci_environment_ecosystems` | `animals_4` | `science-questions.js` |
| `sci_environment_sustainability` | `env_5` | `science-questions.js` |
| `sci_experiments_scientific_method` | `exp_1` | `science-questions.js` |
| `sci_experiments_observation_inference` | `exp_9` | `science-questions.js` |

**Additional topic-balanced sample:** `env_9` (`sci_environment_ecosystems`, `environment`) — see §4.

---

## 4. Issue register (reviewed rows)

**Legend — issue type:** combines factual / distractor / grade / wording / breadth flags where applicable.  
**Severity:** critical / high / medium / low.  
**Action:** recommended action type only — **no edits applied**.

### 4.1 Register table

| id | file | topic | patternFamily | Grade span (audit) | Difficulty | Question summary (neutral) | Correct answer | Classification | Issue type(s) | Severity | Recommended action | Hebrew text change? | Owner approval? |
|----|------|-------|---------------|---------------------|------------|---------------------------|----------------|----------------|---------------|----------|-------------------|---------------------|-----------------|
| `body_1` | `science-questions.js` | body | `science_body_heart_location` | G1–G2 | easy | MCQ heart location | Index **1** — chest, slightly left of midline | **OK** | — | low | keep | no | no |
| `body_2` | `science-questions.js` | body | `science_body_sense_organs` | G1–G2 | easy | MCQ organ of sight | Index **1** — eyes | **OK** | — | low | keep | no | no |
| `body_3` | `science-questions.js` | body | `science_respiratory_gas_exchange` | G3–G4 | medium | MCQ role of respiratory system (gas exchange) | Index **1** | **OK** | — | low | keep | no | no |
| `body_4` | `science-questions.js` | body | `sci_body_systems` | G3–G6 | medium | T/F skeleton + muscles enable movement | Index **0** — true | **OK** | — | low | keep | no | no |
| `body_20` | `science-questions.js` | body | `sci_body_health` | G3–G4 | hard | MCQ role of immune system | Index **1** | **OK** | — | low | keep | no | no |
| `animals_1` | `science-questions.js` | animals | `sci_animals_classification` | G1–G2 | easy | MCQ which animal is a mammal | Index **2** — cat | **OK** | — | low | keep | no | no |
| `animals_13` | `science-questions.js` | animals | `sci_animals_life_processes` | G3–G4 | hard | MCQ definition of life cycle | Index **1** | **OK** | — | low | keep | no | no |
| `plants_1` | `science-questions.js` | plants | `sci_plants_growth` | G1–G2 | easy | MCQ what plants need to grow | Index **1** — sun, water, soil | **OK** | — | low | keep | no | no |
| `plants_12` | `science-questions.js` | plants | `sci_plants_parts` | G3 | medium | MCQ role of flowers | Index **1** | **OK** | — | low | keep | no | no |
| `materials_1` | `science-questions.js` | materials | `sci_materials_properties` | G3–G4 | easy | MCQ state of matter of ice | Index **0** — solid | **OK** | — | low | keep | no | no |
| `materials_13` | `science-questions.js` | materials | `sci_materials_changes` | G5–G6 | hard | MCQ definition of chemical change | Index **1** | **OK** | — | low | keep | no | no |
| `earth_1` | `science-questions.js` | earth_space | `sci_earth_space_cycles` | G3–G4 | easy | MCQ why day/night exists (Earth rotation) | Index **1** | **OK** | — | low | keep | no | no |
| `earth_11` | `science-questions.js` | earth_space | `sci_earth_space_weather` | G3–G4 | hard | MCQ weather vs climate | Index **1** | **OK** | — | low | keep | no | no |
| `animals_4` | `science-questions.js` | animals | `sci_environment_ecosystems` | G5–G6 | hard | MCQ definition of food chain | Index **1** | **Factual concern**; **wording precision concern** | The keyed option stresses a linear **predation** chain (“נטרף”), while the item’s own explanation describes **energy flow** from producers to consumers (herbivory, not only predation). Pedagogically defensible as simplification; scientifically narrow. | **high** | factual review needed; if text changes → **owner exact wording required** | **yes** if any rewrite | **yes** if rewrite |
| `env_5` | `science-questions.js` | environment | `sci_environment_sustainability` | G1–G2 | easy | MCQ where to dispose of waste / recycling | Index **2** | **OK** | — | low | keep | no | no |
| `exp_1` | `science-questions.js` | experiments | `sci_experiments_scientific_method` | G3–G4 | easy | MCQ which cup warms in sun vs shade | Index **2** | **Wording precision concern** (physics register) | Correct option uses everyday “מעבירה חום”; sunlight coupling is often taught as radiation — acceptable at primary level but imprecise. | **low** | factual review needed (optional precision pass) | **yes** only if rephrasing | **yes** if rephrasing |
| `exp_9` | `science-questions.js` | experiments | `sci_experiments_observation_inference` | G3–G4 | hard | MCQ what a hypothesis is | Index **1** | **OK** | — | low | keep | no | no |
| `env_9` | `science-questions.js` | environment | `sci_environment_ecosystems` | G3–G4 | medium | MCQ definition of pollution | Index **1** | **OK** | — | low | keep | no | no |

---

## 5. Summary counts (this sample)

| Metric | Count |
|--------|------:|
| Rows reviewed in detail | **18** |
| **OK** | **16** |
| **Factual concern** | **1** (`animals_4`) |
| **Distractor concern** | **0** (no misleading distractor stood out in this sample; `animals_4` issue is primarily **keyed answer wording** vs explanation) |
| **Answer / `correctIndex` review required** | **0** (no evidence in sample that keyed index is wrong; `animals_4` needs **wording** alignment if pedagogy requires broader definition) |
| **Grade / difficulty concern** | **0** in sample |
| **Wording precision concern** | **2** (`animals_4` — high; `exp_1` — low) |
| **Critical** | **0** |
| **High** | **1** (`animals_4`) |

---

## 6. Recommended first Science content fix batch (after owner approval)

**Only if** product owners agree to change Hebrew text (not implemented in this phase):

1. **`animals_4` — `sci_environment_ecosystems`:** Align the correct-option definition of “שרשרת מזון” with the explanation (energy flow / trophic levels), or explicitly scope the item as “דוגמה לשרשרת טורף־טרף” — **owner exact wording required**.
2. **`exp_1` (optional):** Optional precision pass on heat-transfer wording for older grades — **low priority**.

---

## 7. Phase 11 boundary check

| Check | Result |
|-------|--------|
| Question text changed? | **No** |
| Hebrew wording changed? | **No** |
| Answers / `correctIndex` changed? | **No** |
| Metadata / topics / grades changed? | **No** |
| Code / UI / APIs changed? | **No** |

---

## 8. Next step

Owner/content review of **`animals_4`** (and optional **`exp_1`**) before any edit. After approval, implement wording fixes in a dedicated content-edit phase with regression audit (`npx tsx scripts/audit-question-banks.mjs`).

---

### Phase 12 — Full bank sweep (follow-up)

[`docs/product-quality-phase-12-science-full-content-review.md`](product-quality-phase-12-science-full-content-review.md): mechanical review of **383** / **383** science rows + confirmation that **`animals_4`** and **`exp_1`** remain the only registered semantic backlog items from this initiative (no new ids from structural / intra-bank duplication checks).
