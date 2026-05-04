# Product Quality Phase 9 — Science Metadata-Only First Patch

**Last updated:** 2026-05-05  
**Status:** Completed (first batch).  
**Scope:** [`data/science-questions.js`](../data/science-questions.js) only — `params.patternFamily` additions. No question stems, options, `correctIndex`, grades, or topic keys changed.

## Goal

Improve auditability of the science direct bank by adding neutral English `patternFamily` identifiers to a small first batch (25–40 rows), covering all seven curriculum topics, without editing Hebrew content or answers.

## Batch summary

| Measure | Value |
|--------|-------|
| Rows updated this batch | **32** |
| Pre-existing rows with `patternFamily` (unchanged) | **3** (`body_1`, `body_2`, `body_3`) |
| Total science rows with `patternFamily` after patch | **35** / **383** |
| Science rows still missing `patternFamily` | **348** |

## Rows touched (ids)

- **body (5):** `body_4`, `body_5`, `body_6`, `body_7`, `body_8` → `sci_body_systems`
- **animals (5):** `animals_1`, `animals_2`, `animals_3`, `animals_5` → `sci_animals_classification`; `animals_4` → `sci_environment_ecosystems` (food-chain / energy-flow framing)
- **plants (5):** `plants_1`–`plants_5` → `sci_plants_growth`
- **materials (5):** `materials_1`–`materials_5` → `sci_materials_properties`
- **earth_space (4):** `earth_1`–`earth_4` → `sci_earth_space_cycles`
- **environment (4):** `env_1`–`env_4` → `sci_environment_ecosystems`
- **experiments (4):** `exp_1`–`exp_3` → `sci_experiments_scientific_method`; `exp_4` (water-cycle ordering, filed under `topic: experiments`) → `sci_earth_space_cycles`

## Pattern families used (stable identifiers)

| patternFamily | Use |
|---------------|-----|
| `sci_body_systems` | Organ systems, senses, movement/digestion context |
| `sci_animals_classification` | Taxa, traits, adaptations (broad) |
| `sci_plants_growth` | Needs of plants, structure, photosynthesis, gas exchange |
| `sci_materials_properties` | States of matter, mixtures, metals, physical change |
| `sci_earth_space_cycles` | Earth rotation/orbit, moon, layers, water cycle |
| `sci_environment_ecosystems` | Human/environment actions, ecosystems, pollution, greenhouse |
| `sci_experiments_scientific_method` | Variables, questions, simple controlled comparisons |

## Verification

- **Question text:** unchanged (diff verified by edit scope: only `params` blocks).
- **Answers / `correctIndex`:** unchanged.
- **Total science row count:** **383** (audit `science_direct_bank`).
- **Command:** `npx tsx scripts/audit-question-banks.mjs` — **pass** (exit 0); `reports/question-audit/*` regenerated.

## Audit notes

- `findings.patternFamilyWideGradeSpan` may list additional families as metadata spreads across grades; expected when introducing new `patternFamily` labels.
- Subtype was **not** added in this pass (existing `subtype` values preserved).

## Recommended next step

~~Continue metadata batches~~ — **Done in Phase 10.** See [`docs/product-quality-phase-10-science-metadata-completion.md`](product-quality-phase-10-science-metadata-completion.md): all **383** science rows now have `params.patternFamily`; remaining gaps (`subtype` on `body_1`–`body_3`) were closed there. Next: factual/distractor QA by family.

---

### Follow-up: Phase 10

[`docs/product-quality-phase-10-science-metadata-completion.md`](product-quality-phase-10-science-metadata-completion.md) completes the taxonomy rollout for the remaining rows (including [`data/science-questions-phase3.js`](../data/science-questions-phase3.js)).
