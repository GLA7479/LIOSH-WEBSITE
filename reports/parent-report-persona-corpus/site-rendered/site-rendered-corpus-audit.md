# Site Rendered Persona Corpus Audit

- baseUrl: http://localhost:3001
- artifactType: SITE_RENDERED_PDF
- personas: 30
- pass: 4
- fail: 26

| Persona | Category | Status | Failures |
|---|---|---|---|
| p01_new_user_no_data | A_no_low_data | PASS | - |
| p02_one_subject_low_data | A_no_low_data | PASS | - |
| p03_partial_cross_subject_low_data | A_no_low_data | PASS | - |
| p04_malformed_old_storage_recoverable | A_no_low_data | PASS | - |
| p05_weak_math_enough_evidence | B_weakness | FAIL | detailed.mobile:no_data_state, summary.mobile:no_data_state, detailed.desktop:no_data_state, summary.desktop:no_data_state |
| p06_weak_math_thin_evidence | B_weakness | FAIL | detailed.mobile:no_data_state, summary.mobile:no_data_state, detailed.desktop:no_data_state, summary.desktop:no_data_state |
| p07_weak_geometry_enough_evidence | B_weakness | FAIL | detailed.mobile:no_data_state, summary.mobile:no_data_state, detailed.desktop:no_data_state, summary.desktop:no_data_state |
| p08_weak_hebrew_enough_evidence | B_weakness | FAIL | detailed.mobile:no_data_state, summary.mobile:no_data_state, detailed.desktop:no_data_state, summary.desktop:no_data_state |
| p09_repeated_mistakes_low_count | B_weakness | FAIL | detailed.mobile:no_data_state, summary.mobile:no_data_state, detailed.desktop:no_data_state, summary.desktop:no_data_state |
| p10_multi_subject_weakness | B_weakness | FAIL | detailed.mobile:no_data_state, summary.mobile:no_data_state, detailed.desktop:no_data_state, summary.desktop:no_data_state |
| p11_strong_stable_one_subject | C_strong | FAIL | detailed.mobile:no_data_state, summary.mobile:no_data_state, detailed.desktop:no_data_state, summary.desktop:no_data_state |
| p12_strong_multi_subject | C_strong | FAIL | short_missing_contract_top, short.mobile:no_data_state, detailed.mobile:no_data_state, summary.mobile:no_data_state, short.desktop:no_data_state, detailed.desktop:no_data_state, summary.desktop:no_data_state |
| p13_strong_narrow_sample | C_strong | FAIL | detailed.mobile:no_data_state, summary.mobile:no_data_state, detailed.desktop:no_data_state, summary.desktop:no_data_state |
| p14_strong_accuracy_low_time | C_strong | FAIL | detailed.mobile:no_data_state, summary.mobile:no_data_state, detailed.desktop:no_data_state, summary.desktop:no_data_state |
| p15_strong_recent_difficulty_transition | C_strong | FAIL | detailed.mobile:no_data_state, summary.mobile:no_data_state, detailed.desktop:no_data_state, summary.desktop:no_data_state |
| p16_speed_issue_only | D_speed_behavior | FAIL | detailed.mobile:no_data_state, summary.mobile:no_data_state, detailed.desktop:no_data_state, summary.desktop:no_data_state |
| p17_slow_but_accurate | D_speed_behavior | FAIL | detailed.mobile:no_data_state, summary.mobile:no_data_state, detailed.desktop:no_data_state, summary.desktop:no_data_state |
| p18_fast_and_careless | D_speed_behavior | FAIL | detailed.mobile:no_data_state, summary.mobile:no_data_state, detailed.desktop:no_data_state, summary.desktop:no_data_state |
| p19_hint_support_dependence | D_speed_behavior | FAIL | detailed.mobile:no_data_state, summary.mobile:no_data_state, detailed.desktop:no_data_state, summary.desktop:no_data_state |
| p20_fragile_success | D_speed_behavior | FAIL | detailed.mobile:no_data_state, summary.mobile:no_data_state, detailed.desktop:no_data_state, summary.desktop:no_data_state |
| p21_trend_insufficient | E_trend | FAIL | detailed.mobile:no_data_state, summary.mobile:no_data_state, detailed.desktop:no_data_state, summary.desktop:no_data_state |
| p22_trend_sufficient_up | E_trend | FAIL | detailed.mobile:no_data_state, summary.mobile:no_data_state, detailed.desktop:no_data_state, summary.desktop:no_data_state |
| p23_trend_sufficient_down | E_trend | FAIL | detailed.mobile:no_data_state, summary.mobile:no_data_state, detailed.desktop:no_data_state, summary.desktop:no_data_state |
| p24_trend_flat_stable | E_trend | FAIL | detailed.mobile:no_data_state, summary.mobile:no_data_state, detailed.desktop:no_data_state, summary.desktop:no_data_state |
| p25_improving_but_not_independent | E_trend | FAIL | detailed.mobile:no_data_state, summary.mobile:no_data_state, detailed.desktop:no_data_state, summary.desktop:no_data_state |
| p26_one_clear_priority_many_subjects | F_mixed | FAIL | detailed.mobile:no_data_state, summary.mobile:no_data_state, detailed.desktop:no_data_state, summary.desktop:no_data_state |
| p27_strength_plus_weakness_same_subject | F_mixed | FAIL | detailed.mobile:no_data_state, summary.mobile:no_data_state, detailed.desktop:no_data_state, summary.desktop:no_data_state |
| p28_high_risk_despite_strengths | F_mixed | FAIL | detailed.mobile:no_data_state, summary.mobile:no_data_state, detailed.desktop:no_data_state, summary.desktop:no_data_state |
| p29_multi_weak_no_decisive_conclusion | F_mixed | FAIL | detailed.mobile:no_data_state, summary.mobile:no_data_state, detailed.desktop:no_data_state, summary.desktop:no_data_state |
| p30_conflicting_signals_require_caution | F_mixed | FAIL | detailed.mobile:no_data_state, summary.mobile:no_data_state, detailed.desktop:no_data_state, summary.desktop:no_data_state |