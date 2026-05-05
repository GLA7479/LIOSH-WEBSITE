# Scenario comparison (expected vs actual)

| Scenario | Golden kind | Pass | Total Q | Diagnosed | Units | Actions (sample) |
| --- | --- | --- | ---: | ---: | ---: | --- |
| strong_all_subjects_g3_7d | strong_all_subjects | yes | 642 | 0 | 24 | withhold, probe_only |
| thin_data_g3_1d | thin_data | yes | 13 | 0 | 1 | probe_only |
| improving_student_g4_30d | improving | yes | 771 | 17 | 22 | intervene, probe_only |
| declining_student_g4_30d | declining | yes | 746 | 14 | 20 | intervene, probe_only |
| weak_math_fractions_g5_7d | weak_math_topic_only | yes | 290 | 1 | 1 | diagnose_only |
| weak_hebrew_comprehension_g3_7d | weak_hebrew | yes | 216 | 1 | 1 | diagnose_only |
| weak_english_grammar_g4_7d | weak_english | yes | 274 | 1 | 1 | diagnose_only |
| weak_science_cause_effect_g5_7d | weak_science | yes | 217 | 1 | 1 | diagnose_only |
| weak_geometry_area_g5_7d | weak_math_topic_only | yes | 194 | 1 | 1 | diagnose_only |
| weak_moledet_geography_maps_g4_7d | weak_moledet | yes | 182 | 1 | 1 | diagnose_only |
| strong_all_subjects_g3_30d | strong_all_subjects | yes | 1838 | 0 | 38 | withhold, probe_only |
| weak_all_subjects_g3_30d | weak_all_subjects | yes | 1737 | 39 | 41 | probe_only, intervene |
| improving_student_g4_90d | improving | yes | 3510 | 24 | 31 | probe_only, intervene |
| declining_student_g4_90d | declining | yes | 3317 | 23 | 32 | intervene, probe_only |
| random_guessing_student_g3_30d | random_guessing | yes | 1500 | 26 | 29 | intervene, probe_only |
| inconsistent_student_g5_30d | inconsistent | yes | 1636 | 23 | 26 | intervene, probe_only |
| weak_math_fractions_g5_30d | weak_math_topic_only | yes | 1295 | 1 | 1 | diagnose_only |
| weak_hebrew_comprehension_g3_30d | weak_hebrew | yes | 1072 | 1 | 1 | diagnose_only |
| weak_english_grammar_g4_30d | weak_english | yes | 1230 | 1 | 1 | diagnose_only |
| weak_science_experiments_g5_30d | weak_science | yes | 1134 | 1 | 1 | diagnose_only |
| weak_geometry_area_g5_30d | weak_geometry_area | yes | 1193 | 1 | 1 | diagnose_only |
| weak_moledet_geography_maps_g4_30d | weak_moledet | yes | 1158 | 1 | 1 | diagnose_only |
| engine_truth_fast_wrong_g1_math_s0 | fast_wrong | yes | 607 | 1 | 1 | diagnose_only |
| engine_truth_slow_correct_g2_english_s0 | slow_correct | yes | 565 | 0 | 1 | withhold |
| engine_truth_mixed_strengths_g2_mixed_s0 | mixed_strengths | yes | 582 | 10 | 13 | diagnose_only, probe_only, intervene |

## Golden expectation notes

Row **Golden kind** maps to `ENGINE_GOLDEN_BY_SCENARIO_ID` / stress `engineTruthKind`. Full expected fields: `scripts/learning-simulator/lib/engine-truth-golden.mjs`.
