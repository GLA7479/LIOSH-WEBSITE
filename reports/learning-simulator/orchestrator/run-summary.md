# Learning simulator orchestrator

- **Mode:** full
- **Overall:** **PASS**
- **Started:** 2026-05-02T22:28:43.195Z
- **Finished:** 2026-05-02T22:37:19.327Z
- **Total duration:** 516131 ms

## Steps

| # | Stage | Script | Duration (ms) | Result |
| --- | --- | --- | ---: | --- |
| 1 | Coverage matrix | `qa:learning-simulator:matrix` | 763 | PASS |
| 2 | Schema validation (profiles + scenarios) | `qa:learning-simulator:schema` | 734 | PASS |
| 3 | Aggregate simulator (quick scenarios) | `qa:learning-simulator:aggregate` | 825 | PASS |
| 4 | Parent report assertions (Phase 3) | `qa:learning-simulator:reports` | 1581 | PASS |
| 5 | Behavior checks (Phase 5) | `qa:learning-simulator:behavior` | 908 | PASS |
| 6 | Question integrity (Phase 4) | `qa:learning-simulator:questions` | 1211 | PASS |
| 7 | Matrix smoke (sampled cells → aggregate) | `qa:learning-simulator:matrix-smoke` | 814 | PASS |
| 8 | Coverage catalog (819 cells) | `qa:learning-simulator:coverage` | 748 | PASS |
| 9 | Unsupported cells classification | `qa:learning-simulator:unsupported` | 785 | PASS |
| 10 | Content gap audit (informational) | `qa:learning-simulator:content-gaps` | 809 | PASS |
| 11 | Content gap backlog (documentation) | `qa:learning-simulator:content-backlog` | 745 | PASS |
| 12 | Scenario coverage (fixtures + smoke) | `qa:learning-simulator:scenario-coverage` | 756 | PASS |
| 13 | Critical matrix deep assertions | `qa:learning-simulator:critical-deep` | 2252 | PASS |
| 14 | Profile stress (synthetic profiles) | `qa:learning-simulator:profile-stress` | 2919 | PASS |
| 15 | Scenario coverage (+ critical deep + profile stress) | `qa:learning-simulator:scenario-coverage` | 771 | PASS |
| 16 | Render release gate (browser/SSR smoke for learning + parent-report) | `qa:learning-simulator:render` | 202434 | PASS |
| 17 | PDF export gate (parent-report file download) | `qa:learning-simulator:pdf-export` | 267202 | PASS |
| 18 | Deep longitudinal simulator | `qa:learning-simulator:deep` | 2937 | PASS |
| 19 | Next.js production build | `build` | 23950 | PASS |
| 20 | Parent report phase1 selftest | `test:parent-report-phase1` | 1322 | PASS |
| 21 | Intelligence layer v1 usage selftest | `test:intelligence-layer-v1-usage` | 955 | PASS |
| 22 | Release readiness summary (master QA artifact) | `qa:learning-simulator:release-summary` | 698 | PASS |

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
- **orchestratorSummary:** `reports/learning-simulator/orchestrator/run-summary.json`

---

See `docs/learning-simulator-qa.md` for what each gate proves and current limits.
