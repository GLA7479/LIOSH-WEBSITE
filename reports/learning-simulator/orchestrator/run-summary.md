# Learning simulator orchestrator

- **Mode:** full
- **Overall:** **PASS**
- **Started:** 2026-05-02T20:34:41.627Z
- **Finished:** 2026-05-02T20:35:07.457Z
- **Total duration:** 25829 ms

## Steps

| # | Stage | Script | Duration (ms) | Result |
| --- | --- | --- | ---: | --- |
| 1 | Coverage matrix | `qa:learning-simulator:matrix` | 642 | PASS |
| 2 | Schema validation (profiles + scenarios) | `qa:learning-simulator:schema` | 599 | PASS |
| 3 | Aggregate simulator (quick scenarios) | `qa:learning-simulator:aggregate` | 626 | PASS |
| 4 | Parent report assertions (Phase 3) | `qa:learning-simulator:reports` | 1256 | PASS |
| 5 | Behavior checks (Phase 5) | `qa:learning-simulator:behavior` | 599 | PASS |
| 6 | Question integrity (Phase 4) | `qa:learning-simulator:questions` | 882 | PASS |
| 7 | Deep longitudinal simulator | `qa:learning-simulator:deep` | 2023 | PASS |
| 8 | Next.js production build | `build` | 17424 | PASS |
| 9 | Parent report phase1 selftest | `test:parent-report-phase1` | 958 | PASS |
| 10 | Intelligence layer v1 usage selftest | `test:intelligence-layer-v1-usage` | 816 | PASS |

## Key artifact paths (repo-relative)

- **coverageMatrix:** `reports/learning-simulator/coverage-matrix.json`
- **coverageMatrixMd:** `reports/learning-simulator/coverage-matrix.md`
- **schemaValidation:** `reports/learning-simulator/schema-validation.json`
- **schemaValidationMd:** `reports/learning-simulator/schema-validation.md`
- **aggregateSummary:** `reports/learning-simulator/aggregate/run-summary.json`
- **aggregateSummaryMd:** `reports/learning-simulator/aggregate/run-summary.md`
- **reportAssertions:** `reports/learning-simulator/reports/run-summary.json`
- **behaviorSummary:** `reports/learning-simulator/behavior/run-summary.json`
- **behaviorFailures:** `reports/learning-simulator/behavior/failures.json`
- **questionIntegrity:** `reports/learning-simulator/questions/run-summary.json`
- **questionFailures:** `reports/learning-simulator/questions/failures.json`
- **deepSummary:** `reports/learning-simulator/deep/run-summary.json`
- **deepFailures:** `reports/learning-simulator/deep/failures.json`
- **orchestratorSummary:** `reports/learning-simulator/orchestrator/run-summary.json`

---

See `docs/learning-simulator-qa.md` for what each gate proves and current limits.
