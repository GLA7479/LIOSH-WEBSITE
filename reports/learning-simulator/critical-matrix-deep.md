# Critical Matrix Deep Assertions

- Run id: critical-deep-mop20xu8
- Generated at: 2026-05-03T00:50:43.664Z
- Selected critical cells: 56 (target band **40–80**, not full 618-cell deep suite)
- Per-grade balancing target (6–12 when total≤72): **met**
- Scenarios executed: 108 (3 profile variants × each grade×subject group with selected cells)
- Failures: 0

## Why this is not a 618-cell run

- Matrix Smoke already exercises aggregate plumbing per supported sampled cell.
- This layer picks a **deterministic risk subset** (~40–80 cells) and runs **report + behavior** contracts with **strong / weak / thin** synthetic profiles per grade×subject group.

## Selection summary

```json
{
  "targetCells": 56,
  "poolSize": 747,
  "strategy": "Balanced quotas per grade (6–12 when total≤72), then level/subject gaps with per-grade cap, round-robin subject fill to target, bypass cap only to reach minimum 40.",
  "gradeQuotasDesired": {
    "g1": 10,
    "g2": 10,
    "g3": 9,
    "g4": 9,
    "g5": 9,
    "g6": 9
  },
  "gradeQuotaShortfall": {},
  "balancingBandMinPerGrade": 6,
  "balancingBandMaxPerGrade": 12,
  "balancingTargetMet": true,
  "balancingNote": "Each grade within 6–12 band (or pool-limited shortfall documented).",
  "finalCount": 56,
  "byGrade": {
    "g1": 10,
    "g2": 10,
    "g3": 9,
    "g4": 9,
    "g5": 9,
    "g6": 9
  },
  "bySubject": {
    "math": 12,
    "geometry": 12,
    "science": 12,
    "english": 8,
    "hebrew": 6,
    "moledet_geography": 6
  },
  "byLevel": {
    "easy": 33,
    "hard": 21,
    "medium": 2
  }
}
```

## Cells by subject

- math: 12
- geometry: 12
- science: 12
- english: 8
- hebrew: 6
- moledet_geography: 6

## Cells by grade

- g1: 10
- g2: 10
- g3: 9
- g4: 9
- g5: 9
- g6: 9

## Cells by level

- easy: 33
- hard: 21
- medium: 2

## Assertion rollup

```json
{
  "storage_pipeline_ok": 108,
  "report_build_ok": 108,
  "behavior_summary_ok": 108,
  "no_crash": 108,
  "no_internal_terms": 108,
  "non_generic_report_ok": 108,
  "no_false_strong_weak_ok": 108,
  "trend_guard_ok": 108,
  "evidence_level_ok": 108
}
```

## Failures

- (none)


Full JSON: `C:/Users/ERAN YOSEF/Desktop/final projects/FINAL-WEB/LIOSH-WEB-TRY/reports/learning-simulator/critical-matrix-deep.json`
