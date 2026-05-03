# Pace profile oracle audit (simulator)

- Generated at: 2026-05-03T13:50:45.965Z
- Source run id: profile-stress-moptw2q5

## How profiles are simulated

**fast_wrong**: cloned from `p_random_guessing_student` with `responseTimePolicy` mean ~9s (narrow std) so aggregate `meanSecondsPerQuestion` stays low vs slow_correct.
**slow_correct**: cloned from `p_strong_all_subjects` with tighter high accuracy band and `responseTimePolicy` mean ~66s so aggregate SPQ stays high.
Session `duration` comes from `computeDurationSec` (answer-policy-engine): proportional to configured seconds mean × 60 before aggregation.

## Evidence fields

`oracle.paceOracle.meanSecondsPerQuestion` — global Σ(duration)/Σ(questions) across math/topic tracks.
`oracle.evidence.overallAccuracyPct`, `mistakeRateApprox`, `mistakeEventCount` — from aggregate meta stats.
`reportSignals.overallAccuracy` — structured parent-report summary for confusion checks (no Hebrew parsing).

## Deterministic thresholds

```json
{
  "FAST_WRONG_MAX_SPQ": 118,
  "SLOW_CORRECT_MIN_SPQ": 96,
  "MIN_COHORT_MEDIAN_SPQ_GAP": 24,
  "FAST_WRONG_MAX_OVERALL_ACCURACY_PCT": 58,
  "SLOW_CORRECT_MIN_OVERALL_ACCURACY_PCT": 72,
  "FAST_WRONG_MIN_MISTAKE_RATE": 0.08,
  "SLOW_CORRECT_MAX_MISTAKE_RATE": 0.42
}
```

## Latest cohort statistics

| Metric | fast_wrong | slow_correct |
| --- | ---: | ---: |
| Count | 8 | 8 |
| Median SPQ | 45.4 | 243.44 |
| Mean SPQ | 45.32 | 245.2 |
| Mean accuracy % | 33.45 | 88.03 |

### Cohort separation

- Median SPQ gap (slow − fast): **198.04** (min required: **24**)
- pace_accuracy_separation_ok (cohort): **PASS**

## Oracle weaknesses addressed

Same-topic matrix refs prevent bucket mismatch between weakness profile and topic metrics.
Cohort median SPQ gap enforces separation beyond per-scenario thresholds.

## Recommended next steps

If cohort gap tightens (curriculum volume shifts), revisit `PACE_PROFILE_ORACLE_THRESHOLDS` in pace-profile-oracle.mjs only.

JSON: `C:/Users/ERAN YOSEF/Desktop/final projects/FINAL-WEB/LIOSH-WEB-TRY/reports/learning-simulator/pace-profile-oracle-audit.json`
