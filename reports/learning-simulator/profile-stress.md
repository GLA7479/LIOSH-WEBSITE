# Profile stress (simulator)

- Run id: profile-stress-moprnd6p
- Generated at: 2026-05-03T12:48:00.385Z
- Eligible pool (covered, non-mixed, not backlog): **747**
- Scenarios: **112** (14 profile types × 8 slots)
- Distinct matrix cells touched: **139**
- Failures: **0**

## Profile types

- strong_all_subjects: 8
- weak_all_subjects: 8
- average_student: 8
- thin_data: 8
- random_guessing: 8
- inconsistent: 8
- fast_wrong: 8
- slow_correct: 8
- improving: 8
- declining: 8
- subject_specific_weak: 8
- subject_specific_strong: 8
- topic_specific_weak: 8
- mixed_strengths: 8

## Coverage

- Grades: g1, g2, g3, g4, g5, g6
- Subjects: english, geometry, hebrew, math, moledet_geography, science
- Levels: easy, hard, medium

## Assertion rollup

```json
{
  "storage_pipeline_ok": 112,
  "report_build_ok": 112,
  "behavior_summary_ok": 112,
  "no_crash": 112,
  "no_internal_terms": 112,
  "profile_behavior_contract": 112,
  "non_generic_report_ok": 112,
  "trend_guard_ok": 112,
  "evidence_level_ok": 112,
  "fast_wrong_has_low_accuracy": 8,
  "fast_wrong_has_fast_pace": 8,
  "fast_wrong_not_confused_with_slow_correct": 8,
  "slow_correct_has_high_accuracy": 8,
  "slow_correct_has_slow_pace": 8,
  "slow_correct_not_confused_with_fast_wrong": 8,
  "pace_accuracy_separation_ok": 1,
  "profile_stress_not_overconfident_summary": 16
}
```

## Pace profile oracle (fast_wrong vs slow_correct)

- Thresholds (deterministic): see `scripts/learning-simulator/lib/pace-profile-oracle.mjs` and `reports/learning-simulator/pace-profile-oracle-audit.md`.
- **Median SPQ fast_wrong:** 45.400000000000006 · **Median SPQ slow_correct:** 243.435 · **Gap:** 198.04 (min 24)
- **pace_accuracy_separation_ok:** PASS
- Mean SPQ fast: **45.32** · slow: **245.2**
- Mean accuracy % fast: **33.45** · slow: **88.03**

## Failures

- (none)


## Recommended next profile gaps

- If cohort SPQ gap shrinks, tune `PACE_PROFILE_ORACLE_THRESHOLDS` (simulator-only).
- Optionally raise slots per type if CI budget allows (still cap total scenarios).

Full JSON: `C:/Users/ERAN YOSEF/Desktop/final projects/FINAL-WEB/LIOSH-WEB-TRY/reports/learning-simulator/profile-stress.json`
