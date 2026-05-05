# Adaptive planner artifact summary

Generated: **2026-05-05T19:19:59.713Z**

## Scan

- Artifact paths scanned: **22**
- Sample paths: `reports\learning-simulator\deep\per-student\declining_student_g4_90d.report.json`, `reports\learning-simulator\deep\per-student\improving_student_g4_90d.report.json`, `reports\learning-simulator\deep\per-student\inconsistent_student_g5_30d.report.json`, `reports\learning-simulator\deep\per-student\random_guessing_student_g3_30d.report.json`, `reports\learning-simulator\deep\per-student\strong_all_subjects_g3_30d.report.json`, `reports\learning-simulator\deep\per-student\weak_all_subjects_g3_30d.report.json`, `reports\learning-simulator\deep\per-student\weak_english_grammar_g4_30d.report.json`, `reports\learning-simulator\deep\per-student\weak_geometry_area_g5_30d.report.json`, `reports\learning-simulator\deep\per-student\weak_hebrew_comprehension_g3_30d.report.json`, `reports\learning-simulator\deep\per-student\weak_math_fractions_g5_30d.report.json`, `reports\learning-simulator\deep\per-student\weak_moledet_geography_maps_g4_30d.report.json`, `reports\learning-simulator\deep\per-student\weak_science_experiments_g5_30d.report.json`, `reports\learning-simulator\reports\per-student\declining_student_g4_30d.report.json`, `reports\learning-simulator\reports\per-student\improving_student_g4_30d.report.json`, `reports\learning-simulator\reports\per-student\strong_all_subjects_g3_7d.report.json`, `reports\learning-simulator\reports\per-student\thin_data_g3_1d.report.json`, `reports\learning-simulator\reports\per-student\weak_english_grammar_g4_7d.report.json`, `reports\learning-simulator\reports\per-student\weak_geometry_area_g5_7d.report.json`, `reports\learning-simulator\reports\per-student\weak_hebrew_comprehension_g3_7d.report.json`, `reports\learning-simulator\reports\per-student\weak_math_fractions_g5_7d.report.json`, `reports\learning-simulator\reports\per-student\weak_moledet_geography_maps_g4_7d.report.json`, `reports\learning-simulator\reports\per-student\weak_science_cause_effect_g5_7d.report.json`
- Candidate payloads (file × unit): **126**
- Planner inputs built: **126**

## Planner output — nextAction

- `pause_collect_more_data`: **98**
- `probe_skill`: **24**
- `practice_current`: **2**
- `advance_skill`: **2**

## Planner output — plannerStatus

- `caution`: **122**
- `ready`: **4**

## Adapter

- Warnings total: **0** (by code below)

## Counts

- Missing-field rows (adapter): **0**
- Missing-field keys (aggregated): {}
- needs_human_review outputs: **0**
- insufficient_data outputs: **0**
- English skillTaggingIncomplete inputs: **0**

## Metadata index

- `availableQuestionMetadata_missing` (baseline, no index): **126**
- `availableQuestionMetadata_missing` (after index): **0**
- Inputs with metadata (len > 0): **126**
- Average candidates per input (when len > 0): **1.5**
- Subject fallback resolutions: **0**
- Subject fallback (baseline, no unit skill fields): **117**
- Skill-only fallback resolutions: **0**
- Metadata exact match (no subject/skill-only fallback): **126**
- Skill+subskill query matches (same): **126**
- Units with facet skill alignment fields: **126**
- `skillAlignmentCoverage` (runs with non-missing confidence / runs): **1**
- `skillAlignmentBySource`: `{"topic_mapping":115,"taxonomy_bridge":7,"unit_field":4}`
- `skillAlignmentWarnings` (total): **0**
- Metadata index source: **snapshot_file**
- Snapshot path: `reports/adaptive-learning-planner/metadata-index-snapshot.json`
- Index stats: `{"totalEntries":5419,"bySubject":{"science":383,"hebrew":54,"english":231,"moledet-geography":3506,"hebrew-archive":1091,"geometry":52,"math":102},"staticBankModulesAttempted":17,"geometryConceptual":true,"mathProceduralPlaceholdersIncluded":true,"loadErrors":[],"fromSnapshotFile":true,"snapshotPath":"reports/adaptive-learning-planner/metadata-index-snapshot.json"}`
- Subject coverage (runs): `{"math":103,"geometry":10,"english":6,"hebrew":3,"moledet-geography":2,"science":2}`

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
