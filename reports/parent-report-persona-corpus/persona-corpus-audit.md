# Persona Corpus Audit

- personas: 30
- pass: 1
- fail: 29
- LOW_REPORT_VARIATION: YES

## Diversity
- unique mainPriorityHe: 10
- unique doNowHe: 10
- unique avoidNowHe: 11
- unique confidenceHe: 2
- unique primary subject ids: 0
- identical top-contract percentage: 70%

| Persona | Category | Expected focus | Inferred focus | Status | Failed checks |
|---|---|---|---|---|---|
| p01_new_user_no_data | A_no_low_data | insufficient_data | mixed_priority | FAIL | primaryFocusTypeMatchesExpected |
| p02_one_subject_low_data | A_no_low_data | insufficient_data | weakness_hebrew | FAIL | primaryFocusTypeMatchesExpected, noDuplicatePrimaryAction |
| p03_partial_cross_subject_low_data | A_no_low_data | insufficient_data | weakness_hebrew | FAIL | primaryFocusTypeMatchesExpected, noDuplicatePrimaryAction |
| p04_malformed_old_storage_recoverable | A_no_low_data | insufficient_data | mixed_priority | FAIL | primaryFocusTypeMatchesExpected |
| p05_weak_math_enough_evidence | B_weakness | weakness_math | weakness_math | FAIL | noDuplicatePrimaryAction |
| p06_weak_math_thin_evidence | B_weakness | weakness_math | weakness_math | FAIL | noDuplicatePrimaryAction |
| p07_weak_geometry_enough_evidence | B_weakness | weakness_geometry | strength_maintain | FAIL | primaryFocusTypeMatchesExpected, noDuplicatePrimaryAction |
| p08_weak_hebrew_enough_evidence | B_weakness | weakness_hebrew | strength_maintain | FAIL | primaryFocusTypeMatchesExpected, noDuplicatePrimaryAction |
| p09_repeated_mistakes_low_count | B_weakness | insufficient_data | weakness_hebrew | FAIL | primaryFocusTypeMatchesExpected, noDuplicatePrimaryAction |
| p10_multi_subject_weakness | B_weakness | mixed_priority | strength_maintain | FAIL | noDuplicatePrimaryAction |
| p11_strong_stable_one_subject | C_strong | strength_maintain | strength_maintain | FAIL | noDuplicatePrimaryAction |
| p12_strong_multi_subject | C_strong | strength_maintain | strength_maintain | PASS | - |
| p13_strong_narrow_sample | C_strong | strength_maintain | strength_maintain | FAIL | noDuplicatePrimaryAction |
| p14_strong_accuracy_low_time | C_strong | strength_maintain | strength_maintain | FAIL | noDuplicatePrimaryAction |
| p15_strong_recent_difficulty_transition | C_strong | mixed_priority | strength_maintain | FAIL | noDuplicatePrimaryAction |
| p16_speed_issue_only | D_speed_behavior | speed_behavior | speed_behavior | FAIL | noDuplicatePrimaryAction |
| p17_slow_but_accurate | D_speed_behavior | speed_behavior | mixed_priority | FAIL | primaryFocusTypeMatchesExpected, speedNoKnowledgeGapWording, noDuplicatePrimaryAction |
| p18_fast_and_careless | D_speed_behavior | speed_behavior | weakness_math | FAIL | primaryFocusTypeMatchesExpected, speedNoKnowledgeGapWording, noDuplicatePrimaryAction |
| p19_hint_support_dependence | D_speed_behavior | support_dependence | weakness_math | FAIL | primaryFocusTypeMatchesExpected, noDuplicatePrimaryAction |
| p20_fragile_success | D_speed_behavior | support_dependence | weakness_math | FAIL | primaryFocusTypeMatchesExpected, noDuplicatePrimaryAction |
| p21_trend_insufficient | E_trend | trend_insufficient | weakness_math | FAIL | primaryFocusTypeMatchesExpected, noDuplicatePrimaryAction |
| p22_trend_sufficient_up | E_trend | trend_up | weakness_math | FAIL | primaryFocusTypeMatchesExpected, noDuplicatePrimaryAction |
| p23_trend_sufficient_down | E_trend | trend_down | strength_maintain | FAIL | primaryFocusTypeMatchesExpected, noDuplicatePrimaryAction |
| p24_trend_flat_stable | E_trend | trend_flat | strength_maintain | FAIL | primaryFocusTypeMatchesExpected, noDuplicatePrimaryAction |
| p25_improving_but_not_independent | E_trend | support_dependence | weakness_math | FAIL | primaryFocusTypeMatchesExpected, noDuplicatePrimaryAction |
| p26_one_clear_priority_many_subjects | F_mixed | mixed_priority | strength_maintain | FAIL | noDuplicatePrimaryAction |
| p27_strength_plus_weakness_same_subject | F_mixed | mixed_priority | weakness_math | FAIL | noDuplicatePrimaryAction |
| p28_high_risk_despite_strengths | F_mixed | mixed_priority | weakness_math | FAIL | noDuplicatePrimaryAction |
| p29_multi_weak_no_decisive_conclusion | F_mixed | insufficient_data | weakness_math | FAIL | primaryFocusTypeMatchesExpected, noDuplicatePrimaryAction |
| p30_conflicting_signals_require_caution | F_mixed | mixed_priority | weakness_math | FAIL | noDuplicatePrimaryAction |

## Suspiciously Similar Summaries
- personas: p01_new_user_no_data, p04_malformed_old_storage_recoverable
- personas: p02_one_subject_low_data, p03_partial_cross_subject_low_data, p09_repeated_mistakes_low_count
- personas: p05_weak_math_enough_evidence, p06_weak_math_thin_evidence, p21_trend_insufficient, p29_multi_weak_no_decisive_conclusion, p30_conflicting_signals_require_caution
- personas: p10_multi_subject_weakness, p26_one_clear_priority_many_subjects
- personas: p13_strong_narrow_sample, p14_strong_accuracy_low_time
- personas: p15_strong_recent_difficulty_transition, p23_trend_sufficient_down
- personas: p22_trend_sufficient_up, p24_trend_flat_stable, p25_improving_but_not_independent
- personas: p27_strength_plus_weakness_same_subject, p28_high_risk_despite_strengths