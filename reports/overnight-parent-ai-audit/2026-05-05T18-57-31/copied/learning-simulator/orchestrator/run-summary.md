# Learning simulator orchestrator

- **Mode:** full
- **Overall:** **PASS**
- **Started:** 2026-05-05T19:19:29.102Z
- **Finished:** 2026-05-05T19:28:20.052Z
- **Total duration:** 530948 ms

## Steps

| # | Stage | Script | Duration (ms) | Result |
| --- | --- | --- | ---: | --- |
| 1 | Coverage matrix | `qa:learning-simulator:matrix` | 1547 | PASS |
| 2 | Schema validation (profiles + scenarios) | `qa:learning-simulator:schema` | 1424 | PASS |
| 3 | Aggregate simulator (quick scenarios) | `qa:learning-simulator:aggregate` | 1433 | PASS |
| 4 | Parent report assertions (Phase 3) | `qa:learning-simulator:reports` | 3415 | PASS |
| 5 | Engine truth audit (aggregation ↔ diagnosis V2 ↔ report model) | `qa:learning-simulator:engine` | 3857 | PASS |
| 6 | Professional diagnostic framework QA (mock contracts) | `qa:learning-simulator:diagnostic-framework` | 1009 | PASS |
| 7 | Professional framework real scenario validation | `qa:learning-simulator:framework-real-scenarios` | 2483 | PASS |
| 8 | Engine completion summary artifact | `qa:learning-simulator:engine-completion-summary` | 1047 | PASS |
| 9 | Question bank metadata gate (static scan + taxonomy blocking policy) | `qa:question-metadata` | 1592 | PASS |
| 10 | Question skill metadata QA | `qa:learning-simulator:question-skill-metadata` | 1627 | PASS |
| 11 | Misconception engine QA | `qa:learning-simulator:misconceptions` | 1082 | PASS |
| 12 | Mastery engine QA | `qa:learning-simulator:mastery` | 1127 | PASS |
| 13 | Dependency engine QA | `qa:learning-simulator:dependencies` | 1078 | PASS |
| 14 | Calibration engine QA | `qa:learning-simulator:calibration` | 989 | PASS |
| 15 | Reliability engine QA | `qa:learning-simulator:reliability` | 1023 | PASS |
| 16 | Probe engine QA | `qa:learning-simulator:probes` | 1082 | PASS |
| 17 | Cross-subject engine QA | `qa:learning-simulator:cross-subject` | 1011 | PASS |
| 18 | Professional engine output QA | `qa:learning-simulator:professional-engine-output` | 1038 | PASS |
| 19 | Professional engine synthetic validation | `qa:learning-simulator:professional-engine` | 1357 | PASS |
| 20 | Adaptive planner artifacts (metadata-backed non-live safety gate) | `test:adaptive-planner:artifacts` | 1648 | PASS |
| 21 | Adaptive planner runtime bridge (practice snapshot → recommendation) | `test:adaptive-planner:runtime` | 1617 | PASS |
| 22 | Adaptive planner recommendation UI mapping (Phase 3 gates) | `test:adaptive-planner:recommendation-ui` | 1291 | PASS |
| 23 | Adaptive planner recommended practice (Phase 4 adapter + button rules) | `test:adaptive-planner:recommended-practice` | 1413 | PASS |
| 24 | Adaptive planner AI explainer guards (Phase 5) | `test:adaptive-planner:ai-explainer` | 1218 | PASS |
| 25 | Behavior checks (Phase 5) | `qa:learning-simulator:behavior` | 1160 | PASS |
| 26 | Question integrity (Phase 4) | `qa:learning-simulator:questions` | 1847 | PASS |
| 27 | Matrix smoke (sampled cells → aggregate) | `qa:learning-simulator:matrix-smoke` | 1189 | PASS |
| 28 | Coverage catalog (819 cells) | `qa:learning-simulator:coverage` | 1161 | PASS |
| 29 | Unsupported cells classification | `qa:learning-simulator:unsupported` | 1244 | PASS |
| 30 | Content gap audit (informational) | `qa:learning-simulator:content-gaps` | 995 | PASS |
| 31 | Content gap backlog (documentation) | `qa:learning-simulator:content-backlog` | 947 | PASS |
| 32 | Scenario coverage (fixtures + smoke) | `qa:learning-simulator:scenario-coverage` | 1066 | PASS |
| 33 | Critical matrix deep assertions | `qa:learning-simulator:critical-deep` | 3171 | PASS |
| 34 | Profile stress (synthetic profiles) | `qa:learning-simulator:profile-stress` | 4145 | PASS |
| 35 | Scenario coverage (+ critical deep + profile stress) | `qa:learning-simulator:scenario-coverage` | 1050 | PASS |
| 36 | Render release gate (browser/SSR smoke for learning + parent-report) | `qa:learning-simulator:render` | 346209 | PASS |
| 37 | PDF export gate (parent-report file download) | `qa:learning-simulator:pdf-export` | 45489 | PASS |
| 38 | Deep longitudinal simulator | `qa:learning-simulator:deep` | 5300 | PASS |
| 39 | Next.js production build | `build` | 73035 | PASS |
| 40 | Parent report phase1 selftest | `test:parent-report-phase1` | 2227 | PASS |
| 41 | Parent narrative safety (artifact JSON) | `test:parent-report-narrative-safety-artifacts` | 1902 | PASS |
| 42 | Intelligence layer v1 usage selftest | `test:intelligence-layer-v1-usage` | 1377 | PASS |
| 43 | Release readiness summary (master QA artifact) | `qa:learning-simulator:release-summary` | 838 | PASS |

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
- **parentNarrativeSafetyArtifacts:** `reports/parent-report-narrative-safety-artifacts/summary.json`
- **parentNarrativeSafetyArtifactsMd:** `reports/parent-report-narrative-safety-artifacts/summary.md`
- **questionMetadataSummary:** `reports/question-metadata-qa/summary.json`
- **questionMetadataSummaryMd:** `reports/question-metadata-qa/summary.md`
- **adaptivePlannerArtifactSummary:** `reports/adaptive-learning-planner/artifact-summary.json`
- **adaptivePlannerArtifactSummaryMd:** `reports/adaptive-learning-planner/artifact-summary.md`
- **adaptivePlannerMetadataSnapshot:** `reports/adaptive-learning-planner/metadata-index-snapshot.json`
- **orchestratorSummary:** `reports/learning-simulator/orchestrator/run-summary.json`

## Adaptive planner (artifacts — non-live)

Human-readable report: **`reports/adaptive-learning-planner/artifact-summary.md`**.

| Field | Value |
| --- | --- |
| planner runs | 126 |
| safetyViolationCount | 0 |
| inputsWithAvailableMetadata | 126 |
| availableQuestionMetadata_missing (after index) | 0 |
| metadataSubjectFallbackCount | 0 |
| metadata index source | snapshot_file |

*Fails this orchestrator step only when `safetyViolationCount > 0`, script non-zero exit, or missing `artifact-summary.json` after the step. Soft metrics (fallback counts, English tagging, `needs_human_review`) are warnings in logs / release summary only.*


## Parent narrative safety (artifacts)

Full gate validates parent-visible Hebrew copy in saved report JSON. Human-readable report: **`reports/parent-report-narrative-safety-artifacts/summary.md`**.

| Field | Value |
| --- | --- |
| status | warnings_only |
| narrativesChecked | 10398 |
| artifactFileCount | 84 |
| blockCount | 0 |
| warningCount | 124 |
| infoCautionCount | 16 |
| cleanPassCount | 10258 |

Top warning issue codes:

| code | count |
| --- | --- |
| ambiguous_evidence | 124 |

*Blocks fail this orchestrator step. `warnings_only` passes at this stage (review MD). `no_artifacts_found` fails — no JSON matched configured artifact paths.*


---

See `docs/learning-simulator-qa.md` for what each gate proves and current limits.
