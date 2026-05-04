# Product Quality Phase 10 — Complete Science `patternFamily` Metadata

**Last updated:** 2026-05-05  
**Status:** Completed.

## Scope

| Item | Detail |
|------|--------|
| Files | [`data/science-questions.js`](../data/science-questions.js), [`data/science-questions-phase3.js`](../data/science-questions-phase3.js) |
| Changes | `params.patternFamily` on every row that lacked it; `params.subtype` added only where audit showed missing |
| Mechanical helper | [`scripts/apply-science-pattern-family-phase10.mjs`](../scripts/apply-science-pattern-family-phase10.mjs) (topic + Hebrew stem heuristics; idempotent skip if `patternFamily` already present) |

## Rules

- **No** changes to stems, options, `correctIndex`, `grades`, or `topic`.
- **Three legacy rows** (`body_1`, `body_2`, `body_3`) **kept** existing `patternFamily` values (`science_body_*`, `science_respiratory_*`) to avoid breaking taxonomy references under [`utils/question-metadata-qa/`](../utils/question-metadata-qa/) and fixtures.
- **Subtype:** added `"subtype": "sci_body_general"` to `body_1`, `body_2`, `body_3` only (the only rows previously missing subtype).

## Quantitative results

| Metric | Before Phase 10 | After Phase 10 |
|--------|-----------------|----------------|
| Total science rows | 383 | 383 |
| Rows with `patternFamily` | 35 | **383** |
| Rows missing `patternFamily` | 348 | **0** |
| Rows missing `subtype` | 3 | **0** |
| Rows updated with **new** `patternFamily` | — | **348** |
| Subtype rows fixed | — | **3** |

## `patternFamily` values in audit output (distinct)

Counts from latest `reports/question-audit/items.json` (science rows only):

| patternFamily | Rows |
|---------------|------|
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
| sci_body_health | 2 |
| sci_materials_changes | 2 |
| science_body_heart_location | 1 (legacy) |
| science_body_sense_organs | 1 (legacy) |
| science_respiratory_gas_exchange | 1 (legacy) |

**Note:** Sums to **383**. After the first mechanical pass, **nine** experiment rows were re-tagged from `sci_experiments_scientific_method` to `sci_experiments_observation_inference` (Hebrew keyword detection cannot use `\\b`; see [`scripts/fix-science-experiments-observation-inference.mjs`](../scripts/fix-science-experiments-observation-inference.mjs)).

## Heuristic taxonomy (broad families)

Assignment priority: **topic default**, then **Hebrew keyword** match for a narrower bucket where obvious:

- **body:** `sci_body_health` (nutrition/health/disease/hygiene cues) else `sci_body_systems`
- **animals:** `sci_animals_life_processes` (life cycle / reproduction / development cues) else `sci_animals_classification`
- **plants:** `sci_plants_parts` (roots/stem/flower/seed/leaf cues) else `sci_plants_growth`
- **materials:** `sci_materials_changes` (chemical change / reaction cues) else `sci_materials_properties`
- **earth_space:** `sci_earth_space_weather` (weather/atmosphere cues) else `sci_earth_space_cycles`
- **environment:** `sci_environment_sustainability` (recycling/waste/reduction cues) else `sci_environment_ecosystems`
- **experiments:** `sci_experiments_observation_inference` (hypothesis/conclusion/inference cues) else `sci_experiments_scientific_method`

## Verification

- Command: `npx tsx scripts/audit-question-banks.mjs` — **pass** (exit 0).
- `reports/question-audit/*` regenerated.
- Stage2 science: every topic shows `withPatternFamily` = topic row count and `withSubtype` = topic row count.

## `patternFamilyWideGradeSpan` (audit)

After completion, `findings.patternFamilyWideGradeSpan` has **10** entries total: **1** Hebrew (`vocabulary_typed`) + **9** science families (`sci_earth_space_cycles`, `sci_environment_ecosystems`, `sci_experiments_scientific_method`, `sci_animals_classification`, `sci_body_systems`, `sci_materials_properties`, `sci_environment_sustainability`, `sci_experiments_observation_inference`, `sci_materials_changes`). **Phase 9** reported **3** such rows (mostly Hebrew + few science); the increase to **9** science-wide families is **expected** once almost every science row carries a `patternFamily` that spans multiple grades.

**Why this is expected:** those families appear in items whose **grade spans** cover many bands. The heuristic reused **broad, reusable** families across grades, so the audit flags “wide span” as **informational** for later taxonomy tightening — not a product defect. Families with smaller row counts or narrower grade spans (e.g. `sci_body_health`, `sci_plants_parts`) often **do not** appear in this list.

**Later review (optional):** if product owners want fewer “wide span” families, split metadata further **without** changing question text (e.g. subtopic-specific `patternFamily` only where agreed).

## Recommended next step (Science)

Run a **content** pass: factual accuracy and distractor plausibility by topic (per Phase 8), using `patternFamily` as the grouping key in review tooling.
