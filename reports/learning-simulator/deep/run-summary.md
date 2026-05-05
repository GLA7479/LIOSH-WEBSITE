# Learning simulator — deep longitudinal v1

- Generated at: 2026-05-05T22:07:15.550Z
- Wall clock (ms): 4955
- Scenarios: 24
- Passed: 24 / 24
- Total sessions / questions / mistakes: 2576 / 41110 / 11187

## Per scenario

| Scenario | OK | Sessions | Questions | Report assertions | Behavior pass |
| --- | --- | ---: | ---: | --- | --- |
| strong_all_subjects_g3_30d | yes | 110 | 1838 | yes | yes |
| strong_all_subjects_g3_30d__soak1 | yes | 110 | 1727 | yes | yes |
| weak_all_subjects_g3_30d | yes | 110 | 1737 | yes | yes |
| weak_all_subjects_g3_30d__soak1 | yes | 110 | 1741 | yes | yes |
| improving_student_g4_90d | yes | 216 | 3510 | yes | yes |
| improving_student_g4_90d__soak1 | yes | 216 | 3443 | yes | yes |
| declining_student_g4_90d | yes | 210 | 3317 | yes | yes |
| declining_student_g4_90d__soak1 | yes | 210 | 3319 | yes | yes |
| random_guessing_student_g3_30d | yes | 96 | 1513 | yes | yes |
| random_guessing_student_g3_30d__soak1 | yes | 96 | 1570 | yes | yes |
| inconsistent_student_g5_30d | yes | 102 | 1636 | yes | yes |
| inconsistent_student_g5_30d__soak1 | yes | 102 | 1610 | yes | yes |
| weak_math_fractions_g5_30d | yes | 78 | 1295 | yes | yes |
| weak_math_fractions_g5_30d__soak1 | yes | 78 | 1248 | yes | yes |
| weak_hebrew_comprehension_g3_30d | yes | 72 | 1089 | yes | yes |
| weak_hebrew_comprehension_g3_30d__soak1 | yes | 72 | 1161 | yes | yes |
| weak_english_grammar_g4_30d | yes | 76 | 1230 | yes | yes |
| weak_english_grammar_g4_30d__soak1 | yes | 76 | 1191 | yes | yes |
| weak_science_experiments_g5_30d | yes | 74 | 1134 | yes | yes |
| weak_science_experiments_g5_30d__soak1 | yes | 74 | 1184 | yes | yes |
| weak_geometry_area_g5_30d | yes | 74 | 1193 | yes | yes |
| weak_geometry_area_g5_30d__soak1 | yes | 74 | 1164 | yes | yes |
| weak_moledet_geography_maps_g4_30d | yes | 70 | 1158 | yes | yes |
| weak_moledet_geography_maps_g4_30d__soak1 | yes | 70 | 1102 | yes | yes |

## Failures

- (none)


## Runtime note

- Deep v1 uses full parent-report generation per scenario; for CI, prefer `qa:learning-simulator:aggregate` (quick) as a fast gate and run deep on a schedule if needed.
