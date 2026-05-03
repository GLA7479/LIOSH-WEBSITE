# Learning simulator orchestrator

- **Mode:** quick
- **Overall:** **PASS**
- **Started:** 2026-05-03T13:05:21.108Z
- **Finished:** 2026-05-03T13:05:29.802Z
- **Total duration:** 8693 ms

## Steps

| # | Stage | Script | Duration (ms) | Result |
| --- | --- | --- | ---: | --- |
| 1 | Coverage matrix | `qa:learning-simulator:matrix` | 765 | PASS |
| 2 | Schema validation (profiles + scenarios) | `qa:learning-simulator:schema` | 678 | PASS |
| 3 | Aggregate simulator (quick scenarios) | `qa:learning-simulator:aggregate` | 781 | PASS |
| 4 | Parent report assertions (Phase 3) | `qa:learning-simulator:reports` | 1537 | PASS |
| 5 | Engine truth audit (aggregation ↔ diagnosis V2 ↔ report model) | `qa:learning-simulator:engine` | 2986 | PASS |
| 6 | Behavior checks (Phase 5) | `qa:learning-simulator:behavior` | 710 | PASS |
| 7 | Question integrity (Phase 4) | `qa:learning-simulator:questions` | 1234 | PASS |

## Key artifact paths (repo-relative)

- **coverageMatrix:** `reports/learning-simulator/coverage-matrix.json`
- **schemaValidation:** `reports/learning-simulator/schema-validation.json`
- **aggregateSummary:** `reports/learning-simulator/aggregate/run-summary.json`
- **reportAssertions:** `reports/learning-simulator/reports/run-summary.json`
- **behaviorSummary:** `reports/learning-simulator/behavior/run-summary.json`
- **questionIntegrity:** `reports/learning-simulator/questions/run-summary.json`
- **orchestratorSummary:** `reports/learning-simulator/orchestrator/run-summary.json`

---

See `docs/learning-simulator-qa.md` for what each gate proves and current limits.
