# Learning simulator orchestrator

- **Mode:** full
- **Overall:** **PASS**
- **Started:** 2026-05-03T05:20:43.848Z
- **Finished:** 2026-05-03T05:25:55.986Z
- **Total duration:** 312137 ms

## Steps

| # | Stage | Script | Duration (ms) | Result |
| --- | --- | --- | ---: | --- |
| 1 | Coverage matrix | `qa:learning-simulator:matrix` | 646 | PASS |
| 2 | Schema validation (profiles + scenarios) | `qa:learning-simulator:schema` | 629 | PASS |
| 3 | Aggregate simulator (quick scenarios) | `qa:learning-simulator:aggregate` | 631 | PASS |
| 4 | Parent report assertions (Phase 3) | `qa:learning-simulator:reports` | 1280 | PASS |
| 5 | Engine truth audit (aggregation ↔ diagnosis V2 ↔ report model) | `qa:learning-simulator:engine` | 2415 | PASS |
| 6 | Behavior checks (Phase 5) | `qa:learning-simulator:behavior` | 609 | PASS |
| 7 | Question integrity (Phase 4) | `qa:learning-simulator:questions` | 864 | PASS |
| 8 | Matrix smoke (sampled cells → aggregate) | `qa:learning-simulator:matrix-smoke` | 646 | PASS |
| 9 | Coverage catalog (819 cells) | `qa:learning-simulator:coverage` | 594 | PASS |
| 10 | Unsupported cells classification | `qa:learning-simulator:unsupported` | 611 | PASS |
| 11 | Content gap audit (informational) | `qa:learning-simulator:content-gaps` | 616 | PASS |
| 12 | Content gap backlog (documentation) | `qa:learning-simulator:content-backlog` | 575 | PASS |
| 13 | Scenario coverage (fixtures + smoke) | `qa:learning-simulator:scenario-coverage` | 605 | PASS |
| 14 | Critical matrix deep assertions | `qa:learning-simulator:critical-deep` | 1886 | PASS |
| 15 | Profile stress (synthetic profiles) | `qa:learning-simulator:profile-stress` | 2300 | PASS |
| 16 | Scenario coverage (+ critical deep + profile stress) | `qa:learning-simulator:scenario-coverage` | 592 | PASS |
| 17 | Render release gate (browser/SSR smoke for learning + parent-report) | `qa:learning-simulator:render` | 27927 | PASS |
| 18 | PDF export gate (parent-report file download) | `qa:learning-simulator:pdf-export` | 243407 | PASS |
| 19 | Deep longitudinal simulator | `qa:learning-simulator:deep` | 2239 | PASS |
| 20 | Next.js production build | `build` | 20516 | PASS |
| 21 | Parent report phase1 selftest | `test:parent-report-phase1` | 1048 | PASS |
| 22 | Intelligence layer v1 usage selftest | `test:intelligence-layer-v1-usage` | 884 | PASS |
| 23 | Release readiness summary (master QA artifact) | `qa:learning-simulator:release-summary` | 611 | PASS |

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
- **coverageCatalog:** `reports/learning-simulator/coverage-catalog.json`
- **coverageCatalogMd:** `reports/learning-simulator/coverage-catalog.md`
- **unsupportedCells:** `reports/learning-simulator/unsupported-cells.json`
- **unsupportedCellsMd:** `reports/learning-simulator/unsupported-cells.md`
- **scenarioCoverage:** `reports/learning-simulator/scenario-coverage.json`
- **scenarioCoverageMd:** `reports/learning-simulator/scenario-coverage.md`
- **matrixSmoke:** `reports/learning-simulator/matrix-smoke.json`
- **matrixSmokeMd:** `reports/learning-simulator/matrix-smoke.md`
- **criticalMatrixDeep:** `reports/learning-simulator/critical-matrix-deep.json`
- **criticalMatrixDeepMd:** `reports/learning-simulator/critical-matrix-deep.md`
- **profileStress:** `reports/learning-simulator/profile-stress.json`
- **profileStressMd:** `reports/learning-simulator/profile-stress.md`
- **contentGapAudit:** `reports/learning-simulator/content-gap-audit.json`
- **contentGapAuditMd:** `reports/learning-simulator/content-gap-audit.md`
- **contentGapBacklog:** `reports/learning-simulator/content-gap-backlog.json`
- **contentGapBacklogMd:** `reports/learning-simulator/content-gap-backlog.md`
- **deepSummary:** `reports/learning-simulator/deep/run-summary.json`
- **deepFailures:** `reports/learning-simulator/deep/failures.json`
- **renderReleaseGate:** `reports/learning-simulator/render-release-gate.json`
- **renderReleaseGateMd:** `reports/learning-simulator/render-release-gate.md`
- **renderReleaseGateAudit:** `reports/learning-simulator/render-release-gate-audit.json`
- **pdfExportGate:** `reports/learning-simulator/pdf-export-gate.json`
- **pdfExportGateMd:** `reports/learning-simulator/pdf-export-gate.md`
- **pdfExportAudit:** `reports/learning-simulator/pdf-export-audit.json`
- **releaseReadinessSummary:** `reports/learning-simulator/release-readiness-summary.json`
- **releaseReadinessSummaryMd:** `reports/learning-simulator/release-readiness-summary.md`
- **engineTruthSummary:** `reports/learning-simulator/engine-truth/engine-truth-summary.json`
- **engineTruthSummaryMd:** `reports/learning-simulator/engine-truth/engine-truth-summary.md`
- **orchestratorSummary:** `reports/learning-simulator/orchestrator/run-summary.json`

---

See `docs/learning-simulator-qa.md` for what each gate proves and current limits.
