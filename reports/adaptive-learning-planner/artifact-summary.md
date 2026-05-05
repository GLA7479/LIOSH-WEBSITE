# Adaptive planner artifact summary

Generated: **2026-05-05T22:03:47.299Z**

## Scan

- Artifact paths scanned: **34**
- Sample paths: `reports\learning-simulator\deep\per-student\declining_student_g4_90d.report.json`, `reports\learning-simulator\deep\per-student\declining_student_g4_90d__soak1.report.json`, `reports\learning-simulator\deep\per-student\improving_student_g4_90d.report.json`, `reports\learning-simulator\deep\per-student\improving_student_g4_90d__soak1.report.json`, `reports\learning-simulator\deep\per-student\inconsistent_student_g5_30d.report.json`, `reports\learning-simulator\deep\per-student\inconsistent_student_g5_30d__soak1.report.json`, `reports\learning-simulator\deep\per-student\random_guessing_student_g3_30d.report.json`, `reports\learning-simulator\deep\per-student\random_guessing_student_g3_30d__soak1.report.json`, `reports\learning-simulator\deep\per-student\strong_all_subjects_g3_30d.report.json`, `reports\learning-simulator\deep\per-student\strong_all_subjects_g3_30d__soak1.report.json`, `reports\learning-simulator\deep\per-student\weak_all_subjects_g3_30d.report.json`, `reports\learning-simulator\deep\per-student\weak_all_subjects_g3_30d__soak1.report.json`, `reports\learning-simulator\deep\per-student\weak_english_grammar_g4_30d.report.json`, `reports\learning-simulator\deep\per-student\weak_english_grammar_g4_30d__soak1.report.json`, `reports\learning-simulator\deep\per-student\weak_geometry_area_g5_30d.report.json`, `reports\learning-simulator\deep\per-student\weak_geometry_area_g5_30d__soak1.report.json`, `reports\learning-simulator\deep\per-student\weak_hebrew_comprehension_g3_30d.report.json`, `reports\learning-simulator\deep\per-student\weak_hebrew_comprehension_g3_30d__soak1.report.json`, `reports\learning-simulator\deep\per-student\weak_math_fractions_g5_30d.report.json`, `reports\learning-simulator\deep\per-student\weak_math_fractions_g5_30d__soak1.report.json`, `reports\learning-simulator\deep\per-student\weak_moledet_geography_maps_g4_30d.report.json`, `reports\learning-simulator\deep\per-student\weak_moledet_geography_maps_g4_30d__soak1.report.json`, `reports\learning-simulator\deep\per-student\weak_science_experiments_g5_30d.report.json`, `reports\learning-simulator\deep\per-student\weak_science_experiments_g5_30d__soak1.report.json`
- Candidate payloads (file × unit): **204**
- Planner inputs built: **204**

## Planner output — nextAction

- `pause_collect_more_data`: **153**
- `probe_skill`: **47**
- `practice_current`: **2**
- `advance_skill`: **2**

## Planner output — plannerStatus

- `caution`: **199**
- `needs_human_review`: **1**
- `ready`: **4**

## Adapter

- Warnings total: **1** (by code below)
  - `availableQuestionMetadata_missing`: 1

## Counts

- Missing-field rows (adapter): **0**
- Missing-field keys (aggregated): {}
- needs_human_review outputs: **1**
- insufficient_data outputs: **0**
- English skillTaggingIncomplete inputs: **1**

## Metadata index

- `availableQuestionMetadata_missing` (baseline, no index): **204**
- `availableQuestionMetadata_missing` (after index): **1**
- Inputs with metadata (len > 0): **203**
- Average candidates per input (when len > 0): **1.458**
- Subject fallback resolutions: **0**
- Subject fallback (baseline, no unit skill fields): **190**
- Skill-only fallback resolutions: **0**
- Metadata exact match (no subject/skill-only fallback): **203**
- Skill+subskill query matches (same): **203**
- Units with facet skill alignment fields: **203**
- `skillAlignmentCoverage` (runs with non-missing confidence / runs): **0.995**
- `skillAlignmentBySource`: `{"topic_mapping":186,"taxonomy_bridge":13,"unit_field":4}`
- `skillAlignmentWarnings` (total): **0**
- Metadata index source: **snapshot_file**
- Snapshot path: `reports/adaptive-learning-planner/metadata-index-snapshot.json`
- Index stats: `{"totalEntries":5419,"bySubject":{"science":383,"hebrew":54,"english":231,"moledet-geography":3506,"hebrew-archive":1091,"geometry":52,"math":102},"staticBankModulesAttempted":17,"geometryConceptual":true,"mathProceduralPlaceholdersIncluded":true,"loadErrors":[],"fromSnapshotFile":true,"snapshotPath":"reports/adaptive-learning-planner/metadata-index-snapshot.json"}`
- Subject coverage (runs): `{"math":169,"english":9,"geometry":16,"hebrew":4,"moledet-geography":3,"science":3}`

## Safety

- Safety violations: **0**
- All checks passed.

## Examples (first 5)

### reports\learning-simulator\deep\per-student\declining_student_g4_90d.report.json#unit0
- nextAction: `pause_collect_more_data`  plannerStatus: `caution`
- warnings: (none)

### reports\learning-simulator\deep\per-student\declining_student_g4_90d.report.json#unit1
- nextAction: `pause_collect_more_data`  plannerStatus: `caution`
- warnings: (none)

### reports\learning-simulator\deep\per-student\declining_student_g4_90d.report.json#unit2
- nextAction: `pause_collect_more_data`  plannerStatus: `caution`
- warnings: (none)

### reports\learning-simulator\deep\per-student\declining_student_g4_90d.report.json#unit3
- nextAction: `pause_collect_more_data`  plannerStatus: `caution`
- warnings: (none)

### reports\learning-simulator\deep\per-student\declining_student_g4_90d.report.json#unit4
- nextAction: `pause_collect_more_data`  plannerStatus: `caution`
- warnings: (none)
