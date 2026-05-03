# Learning simulator orchestrator

- **Mode:** full
- **Overall:** **PASS**
- **Started:** 2026-05-03T07:40:34.569Z
- **Finished:** 2026-05-03T07:48:38.372Z
- **Total duration:** 483802 ms

## Steps

| # | Stage | Script | Duration (ms) | Result |
| --- | --- | --- | ---: | --- |
| 1 | Coverage matrix | `qa:learning-simulator:matrix` | 715 | PASS |
| 2 | Schema validation (profiles + scenarios) | `qa:learning-simulator:schema` | 621 | PASS |
| 3 | Aggregate simulator (quick scenarios) | `qa:learning-simulator:aggregate` | 654 | PASS |
| 4 | Parent report assertions (Phase 3) | `qa:learning-simulator:reports` | 1440 | PASS |
| 5 | Engine truth audit (aggregation ↔ diagnosis V2 ↔ report model) | `qa:learning-simulator:engine` | 2569 | PASS |
| 6 | Professional diagnostic framework QA (mock contracts) | `qa:learning-simulator:diagnostic-framework` | 637 | PASS |
| 7 | Professional framework real scenario validation | `qa:learning-simulator:framework-real-scenarios` | 1490 | PASS |
| 8 | Engine completion summary artifact | `qa:learning-simulator:engine-completion-summary` | 657 | PASS |
| 9 | Question skill metadata QA | `qa:learning-simulator:question-skill-metadata` | 934 | PASS |
| 10 | Misconception engine QA | `qa:learning-simulator:misconceptions` | 736 | PASS |
| 11 | Mastery engine QA | `qa:learning-simulator:mastery` | 661 | PASS |
| 12 | Dependency engine QA | `qa:learning-simulator:dependencies` | 631 | PASS |
| 13 | Calibration engine QA | `qa:learning-simulator:calibration` | 631 | PASS |
| 14 | Reliability engine QA | `qa:learning-simulator:reliability` | 591 | PASS |
| 15 | Probe engine QA | `qa:learning-simulator:probes` | 626 | PASS |
| 16 | Cross-subject engine QA | `qa:learning-simulator:cross-subject` | 626 | PASS |
| 17 | Professional engine output QA | `qa:learning-simulator:professional-engine-output` | 678 | PASS |
| 18 | Professional engine synthetic validation | `qa:learning-simulator:professional-engine` | 702 | PASS |
| 19 | Behavior checks (Phase 5) | `qa:learning-simulator:behavior` | 627 | PASS |
| 20 | Question integrity (Phase 4) | `qa:learning-simulator:questions` | 928 | PASS |
| 21 | Matrix smoke (sampled cells → aggregate) | `qa:learning-simulator:matrix-smoke` | 682 | PASS |
| 22 | Coverage catalog (819 cells) | `qa:learning-simulator:coverage` | 630 | PASS |
| 23 | Unsupported cells classification | `qa:learning-simulator:unsupported` | 627 | PASS |
| 24 | Content gap audit (informational) | `qa:learning-simulator:content-gaps` | 647 | PASS |
| 25 | Content gap backlog (documentation) | `qa:learning-simulator:content-backlog` | 603 | PASS |
| 26 | Scenario coverage (fixtures + smoke) | `qa:learning-simulator:scenario-coverage` | 640 | PASS |
| 27 | Critical matrix deep assertions | `qa:learning-simulator:critical-deep` | 2020 | PASS |
| 28 | Profile stress (synthetic profiles) | `qa:learning-simulator:profile-stress` | 2497 | PASS |
| 29 | Scenario coverage (+ critical deep + profile stress) | `qa:learning-simulator:scenario-coverage` | 626 | PASS |
| 30 | Render release gate (browser/SSR smoke for learning + parent-report) | `qa:learning-simulator:render` | 188628 | PASS |
| 31 | PDF export gate (parent-report file download) | `qa:learning-simulator:pdf-export` | 243845 | PASS |
| 32 | Deep longitudinal simulator | `qa:learning-simulator:deep` | 2301 | PASS |
| 33 | Next.js production build | `build` | 20125 | PASS |
| 34 | Parent report phase1 selftest | `test:parent-report-phase1` | 1178 | PASS |
| 35 | Intelligence layer v1 usage selftest | `test:intelligence-layer-v1-usage` | 918 | PASS |
| 36 | Release readiness summary (master QA artifact) | `qa:learning-simulator:release-summary` | 673 | PASS |

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
- **engineCompletionSummary:** `reports/learning-simulator/engine-completion/engine-completion-summary.json`
- **realScenarioFrameworkValidation:** `reports/learning-simulator/engine-completion/real-scenario-framework-validation.json`
- **orchestratorSummary:** `reports/learning-simulator/orchestrator/run-summary.json`

---

See `docs/learning-simulator-qa.md` for what each gate proves and current limits.
