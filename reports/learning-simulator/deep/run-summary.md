# Learning simulator — deep longitudinal v1

- Generated at: 2026-05-02T20:34:48.222Z
- Wall clock (ms): 1422
- Scenarios: 12
- Passed: 12 / 12
- Total sessions / questions / mistakes: 1288 / 20650 / 5587

## Per scenario

| Scenario | OK | Sessions | Questions | Report assertions | Behavior pass |
| --- | --- | ---: | ---: | --- | --- |
| strong_all_subjects_g3_30d | yes | 110 | 1838 | yes | yes |
| weak_all_subjects_g3_30d | yes | 110 | 1737 | yes | yes |
| improving_student_g4_90d | yes | 216 | 3510 | yes | yes |
| declining_student_g4_90d | yes | 210 | 3317 | yes | yes |
| random_guessing_student_g3_30d | yes | 96 | 1513 | yes | yes |
| inconsistent_student_g5_30d | yes | 102 | 1636 | yes | yes |
| weak_math_fractions_g5_30d | yes | 78 | 1295 | yes | yes |
| weak_hebrew_comprehension_g3_30d | yes | 72 | 1089 | yes | yes |
| weak_english_grammar_g4_30d | yes | 76 | 1230 | yes | yes |
| weak_science_experiments_g5_30d | yes | 74 | 1134 | yes | yes |
| weak_geometry_area_g5_30d | yes | 74 | 1193 | yes | yes |
| weak_moledet_geography_maps_g4_30d | yes | 70 | 1158 | yes | yes |

## Failures

- (none)


## Runtime note

- Deep v1 uses full parent-report generation per scenario; for CI, prefer `qa:learning-simulator:aggregate` (quick) as a fast gate and run deep on a schedule if needed.
