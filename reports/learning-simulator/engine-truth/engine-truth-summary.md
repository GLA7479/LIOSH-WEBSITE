# Engine truth audit

- **Result:** **PASS**
- Generated: 2026-05-03T21:06:32.946Z
- Scenarios exercised: 25
- Pace fast_wrong vs slow_correct: PASS

## Checks applied

- Summary: subject totals sum to global totals; overall accuracy matches `totalCorrect/totalQuestions`
- Topic-map rollups vs per-subject totals on summary
- Row accuracy arithmetic + zero-question rows not flagged as failure
- Practice minutes sum vs `summary.totalTimeMinutes`
- Engine ↔ detailed report: `topWeaknesses` / `topStrengths` trace to V2 units
- Thin-data / false-strong guards
- Corpus leak / debug key scan
- Evidence contract consistency
- No-data subjects must not show weaknesses
- Golden scenario expectations (see `lib/engine-truth-golden.mjs`)
- **Scenario intent:** report included volume vs simulator (`minRetentionRatio`); per-subject/topic minimum questions; thin-data evidence cap; weak/strength signals; `expected.topWeaknessExpected` present in model
