# Product Quality Phase 12 — Full Science Content Review Sweep

**Last updated:** 2026-05-05  
**Status:** Review sweep was report-only; **Phase 13** applied one **owner-approved** Hebrew edit to `animals_4` (see [§10](#10-phase-13-follow-up--owner-approved-wording)).  
**Original Phase 12 boundary:** no bank edits at write time; superseded for `animals_4` by Phase 13.

## Purpose

Complete a **full-bank pass** over **383** science rows (`SCIENCE_QUESTIONS`) before any content fixes: mechanical consistency checks, overlap signals from audit artifacts, and **carry-forward** of Phase 11 semantic findings.

## Sources

| Artifact | Role |
|----------|------|
| [`data/science-questions.js`](../data/science-questions.js) | Primary bank (**311** ids unique to this file) |
| [`data/science-questions-phase3.js`](../data/science-questions-phase3.js) | Extension bank (**72** ids unique to this file); concatenated into `SCIENCE_QUESTIONS` |
| [`reports/question-audit/items.json`](../reports/question-audit/items.json) | Indexed stems (`stemHash`), grades, difficulty, `patternFamily`, `poolKey` |
| [`reports/question-audit/findings.json`](../reports/question-audit/findings.json) | Duplicate/near-duplicate signals (science overlap heuristic excluded where noted in audit) |
| [`docs/product-quality-phase-10-science-metadata-completion.md`](product-quality-phase-10-science-metadata-completion.md) | Metadata baseline |
| [`docs/product-quality-phase-11-science-factual-distractor-review.md`](product-quality-phase-11-science-factual-distractor-review.md) | Prior spot sample (**18** rows) |
| [`docs/product-quality-phase-8-subject-coverage-content-plan.md`](product-quality-phase-8-subject-coverage-content-plan.md) | Subject planning context |

---

## 1. Methodology (what “review all 383” means here)

| Layer | Coverage |
|-------|----------|
| **A. Mechanical / structural** | Every object in `SCIENCE_QUESTIONS`: non-empty stem; **`options.length ≥ 2`**; **`correctIndex` in range**; **no duplicate option strings within the same item**; **correct answer text does not appear twice** (distinct indices); **explanation present** (non-empty string). |
| **B. Within-bank duplication** | **`stemHash`** collisions among science audit rows: **none** (each stem hashes uniquely within the science set in `items.json`). |
| **C. Audit overlap queues** | Hebrew-centric **`withinBandClassPairOverlaps`** in [`reports/question-audit/stage2.json`](../reports/question-audit/stage2.json) lists **no science rows** (science items are excluded from that Hebrew overlap heuristic per Phase 1 audit notes). |
| **D. Semantic factual/distractor QA** | **Not** repeated Hebrew-by-Hebrew for all 383 items in this phase. Phase 11 performed deep read on **18** representatives; Phase 12 **re-validates** those conclusions against mechanical gates and confirms **no additional rows** trip structural or intra-bank duplication checks. **Residual factual risk** outside Phase 11 sampling remains possible and requires future domain QA if desired. |

---

## 2. Inventory & grouping (all 383 rows)

### 2.1 Rows by source file

| Source | Row count |
|--------|-----------|
| `science-questions.js` only | **311** |
| `science-questions-phase3.js` only | **72** |
| **Total** | **383** |

### 2.2 Rows by `topic`

| topic | Rows |
|-------|-----:|
| earth_space | 66 |
| environment | 65 |
| experiments | 59 |
| animals | 51 |
| body | 50 |
| plants | 46 |
| materials | 46 |

### 2.3 Rows by `params.patternFamily`

| patternFamily | Rows |
|---------------|-----:|
| sci_earth_space_cycles | 62 |
| sci_environment_ecosystems | 53 |
| sci_experiments_scientific_method | 49 |
| sci_animals_classification | 47 |
| sci_body_systems | 45 |
| sci_materials_properties | 44 |
| sci_plants_growth | 39 |
| sci_environment_sustainability | 13 |
| sci_experiments_observation_inference | 9 |
| sci_plants_parts | 7 |
| sci_earth_space_weather | 5 |
| sci_animals_life_processes | 3 |
| sci_materials_changes | 2 |
| sci_body_health | 2 |
| science_body_heart_location | 1 |
| science_body_sense_organs | 1 |
| science_respiratory_gas_exchange | 1 |

### 2.4 Rows by canonical difficulty (`params.difficulty`)

| difficulty | Rows |
|------------|-----:|
| basic | 114 |
| standard | 145 |
| advanced | 124 |

*(Maps from legacy `minLevel`/`maxLevel` bands in source objects.)*

### 2.5 Grade span & difficulty matrix (audit columns)

See [`reports/question-audit/items.json`](../reports/question-audit/items.json): each row includes **`minGrade`**, **`maxGrade`**, **`difficulty`**, **`answerMode`**, **`optionCount`**. Stratification yields **129** distinct tuples `(topic | patternFamily | grade span | difficulty | answerMode | optionCount)` — long tail of low-volume cells; largest strata align with [`docs/product-quality-phase-11-science-factual-distractor-review.md`](product-quality-phase-11-science-factual-distractor-review.md) §1.3.

---

## 3. Classification summary (all 383 items)

| Classification | Count | Notes |
|----------------|------:|-------|
| **OK** (pass mechanical sweep + no open semantic flag) | **382** | As of Phase 13, includes **`animals_4`** after owner-approved option text. |
| **Non-OK** (optional / low-priority) | **1** | **`exp_1`** only — optional precision polish; no change applied. |

**Phase 12 confirmation (historical):** No **additional** ids were added from structural / duplicate-option / duplicate-stem checks. **`animals_4`** was later resolved by **owner-approved exact wording** in Phase 13 (see below).

---

## 4. Non-OK backlog — full detail (required fields)

**Instruction:** No Hebrew replacement text appears below. Where wording must change, action is **Owner exact wording required** (per project rule).

### 4.1 `animals_4` (Phase 11 → Phase 12 → **resolved Phase 13**)

Historical Phase 11/12 issue: keyed option text was narrowly predation-focused (“נטרף”) vs explanation on energy flow / producers→consumers.

**Resolution:** Owner-approved **exact** replacement text for the option at **`correctIndex` 1** only — see [`docs/product-quality-phase-13-science-content-fix.md`](product-quality-phase-13-science-content-fix.md). Stem, index, explanation, theoryLines, metadata unchanged.

### 4.2 `exp_1` (Phase 11 → Phase 12 confirmed)

| Field | Value |
|-------|--------|
| **question id** | `exp_1` |
| **file** | `data/science-questions.js` |
| **topic** | experiments |
| **patternFamily** | `sci_experiments_scientific_method` |
| **grade span (audit)** | G3–G4 |
| **difficulty** | easy (basic) |
| **Question summary** | MCQ compares heating of water in sun vs shade; correct option cites everyday heat transfer wording. |
| **Correct answer** | Index **2** — option referencing sun warming water (“השמש מעבירה חום”). |
| **Issue types** | wording precision concern (physics register vs everyday language) |
| **Severity** | **low** |
| **Recommended action** | factual review needed (optional precision pass); owner exact wording required **only if** editing copy |
| **Visible Hebrew text would need to change?** | **yes** only if pursuing precision |
| **Owner approval required?** | **yes** if editing |

---

## 5. Severity totals (after Phase 13)

| Severity | Open items (ids) |
|----------|------------------|
| Critical | **0** |
| High | **0** (`animals_4` closed) |
| Medium | **0** |
| Low | **1** (`exp_1` — optional polish only) |

---

## 6. Concern-type totals (current; post Phase 13)

| Concern type | Count of items affected |
|--------------|-------------------------|
| OK / no open backlog item | **382** |
| factual concern (open) | **0** |
| answer / `correctIndex` concern | **0** |
| distractor concern | **0** (no structural distractor defect found; semantic distractor QA not exhaustively run) |
| grade / difficulty concern | **0** (no automatic mis-band signal) |
| wording precision concern (optional, open) | **1** (`exp_1`) |
| too vague / too broad (auto) | **0** (short stems not auto-flagged; see §3) |
| duplicate / near-duplicate ( mechanical ) | **0** |

---

## 7. Phase 12 boundary

| Check | Result |
|-------|--------|
| Question text changed? | **No** |
| Hebrew wording changed / generated? | **No** |
| Answers / `correctIndex` changed? | **No** |
| Metadata / grades / topics changed? | **No** |
| UI / APIs / reports changed? | **No** |

---

## 8. Recommended first Science content fix batch (post-owner approval)

~~1. **`animals_4`** — applied in **Phase 13** (owner-approved exact wording).~~  
1. **`exp_1`** — optional precision pass (**low**) — **unchanged**; remains polish-only.

No other ids are backed by Phase 12 mechanical findings.

---

## 10. Phase 13 follow-up — owner-approved wording

- **`animals_4`:** correct MCQ option at index **1** replaced with owner-approved exact Hebrew (stem, `correctIndex`, explanation, theoryLines, metadata unchanged). Details: [`docs/product-quality-phase-13-science-content-fix.md`](product-quality-phase-13-science-content-fix.md).
- **`exp_1`:** left unchanged; still optional low-priority polish.

---

## 9. Limitations (explicit)

- **Full Hebrew disciplinary review** of all **383** prompts was **not** executed in Phase 12; remaining items are **OK relative to mechanical gates** and **unchallenged** by Phase 11 spot sampling beyond the two registered ids.
- Future **stochastic** or **domain-expert** passes may surface additional items; they should be logged in a new phase if discovered.
