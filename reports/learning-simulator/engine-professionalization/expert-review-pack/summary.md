# Expert Review Pack — summary

**Disclaimer:** This is an internal educational diagnostic support review artifact. It is **not** a clinical or medical diagnosis. It is **not** a parent-facing report.

> **Generation mode:** artifact snapshot (API-safe).

- **Generated:** 2026-05-03T08:40:33.905Z
- **Status:** PASS
- **Scenario count:** 22
- **requiresHumanExpertReview:** true

## Engine final (if present)

```json
{
  "engineFinalStatus": "PASS",
  "engineTechnicallyComplete": true,
  "professionalReadiness": "internal_engine_and_release_gates_passed",
  "releaseStatus": "PASS",
  "knownLimitations": [
    "English difficulty tiers may not align perfectly with matrix level labels.",
    "Cross-subject patterns are heuristic and require confirming probes.",
    "Subskill and misconception precision is limited until question pools carry dense expectedErrorTypes and prerequisiteSkillIds."
  ]
}
```

## Orchestrator run summary (if present)

```json
{
  "mode": "full",
  "startedAt": "2026-05-03T07:40:34.569Z",
  "finishedAt": "2026-05-03T07:48:38.372Z",
  "totalDurationMs": 483802,
  "pass": true,
  "failedStep": null,
  "steps": [
    {
      "id": "matrix",
      "label": "Coverage matrix",
      "script": "qa:learning-simulator:matrix",
      "exitCode": 0,
      "durationMs": 715,
      "pass": true
    },
    {
      "id": "schema",
      "label": "Schema validation (profiles + scenarios)",
      "script": "qa:learning-simulator:schema",
      "exitCode": 0,
      "durationMs": 621,
      "pass": true
    },
    {
      "id": "aggregate",
      "label": "Aggregate simulator (quick scenarios)",
      "script": "qa:learning-simulator:aggregate",
      "exitCode": 0,
      "durationMs": 654,
      "pass": true
    },
    {
      "id": "reports",
      "label": "Parent report assertions (Phase 3)",
      "script": "qa:learning-simulator:reports",
      "exitCode": 0,
      "durationMs": 1440,
      "pass": true
    },
    {
      "id": "engineTruth",
      "label": "Engine truth audit (aggregation ↔ diagnosis V2 ↔ report model)",
      "script": "qa:learning-simulator:engine",
      "exitCode": 0,
      "durationMs": 2569,
      "pass": true
    },
    {
      "id": "diagnosticFramework",
      "label": "Professional diagnostic framework QA (mock contracts)",
      "script": "qa:learning-simulator:diagnostic-framework",
      "exitCode": 0,
      "durationMs": 637,
      "pass": true
    },
    {
      "id": "frameworkRealScenarios",
      "label": "Professional framework real scenario validation",
      "script": "qa:learning-simulator:framework-real-scenarios",
      "exitCode": 0,
      "durationMs": 1490,
      "pass": true
    },
    {
      "id": "engineCompletionSummary",
      "label": "Engine completion summary artifact",
      "script": "qa:learning-simulator:engine-completion-summary",
      "exitCode": 0,
      "durationMs": 657,
      "pass": true
    },
    {
      "id": "questionSkillMetadata",
      "label": "Question skill metadata QA",
      "script": "qa:learning-simulator:question-skill-metadata",
      "exitCode": 0,
      "durationMs": 934,
      "pass": true
    },
    {
      "id": "misconceptions",
      "label": "Misconception engine QA",
      "script": "qa:learning-simulator:misconceptions",
      "exitCode": 0,
      "durationMs": 736,
      "pass": true
    },
    {
      "id": "masteryEngine",
      "label": "Mastery engine QA",
      "script": "qa:learning-simulator:mastery",
      "exitCode": 0,
      "durationMs": 661,
      "pass": true
    },
    {
      "id": "dependenciesEngine",
      "label": "Dependency engine QA",
      "script": "qa:learning-simulator:dependencies",
      "exitCode": 0,
      "durationMs": 631,
      "pass": true
    },
    {
      "id": "calibrationEngine",
      "label": "Calibration engine QA",
      "script": "qa:learning-simulator:calibration",
      "exitCode": 0,
      "durationMs": 631,
      "pass": true
    },
    {
      "id": "reliabilityEngine",
      "label": "Reliability engine QA",
      "script": "qa:learning-simulator:reliability",
      "exitCode": 0,
      "durationMs": 591,
      "pass": true
    },
    {
      "id": "probeEngine",
      "label": "Probe engine QA",
      "script": "qa:learning-simulator:probes",
      "exitCode": 0,
      "durationMs": 626,
      "pass": true
    },
    {
      "id": "crossSubjectEngine",
      "label": "Cross-subject engine QA",
      "script": "qa:learning-simulator:cross-subject",
      "exitCode": 0,
      "durationMs": 626,
      "pass": true
    },
    {
      "id": "professionalEngineOutput",
      "label": "Professional engine output QA",
      "script": "qa:learning-simulator:professional-engine-output",
      "exitCode": 0,
      "durationMs": 678,
      "pass": true
    },
    {
      "id": "professionalEngineValidation",
      "label": "Professional engine synthetic validation",
      "script": "qa:learning-simulator:professional-engine",
      "exitCode": 0,
      "durationMs": 702,
      "pass": true
    },
    {
      "id": "behavior",
      "label": "Behavior checks (Phase 5)",
      "script": "qa:learning-simulator:behavior",
      "exitCode": 0,
      "durationMs": 627,
      "pass": true
    },
    {
      "id": "questions",
      "label": "Question integrity (Phase 4)",
      "script": "qa:learning-simulator:questions",
      "exitCode": 0,
      "durationMs": 928,
      "pass": true
    },
    {
      "id": "matrixSmoke",
      "label": "Matrix smoke (sampled cells → aggregate)",
      "script": "qa:learning-simulator:matrix-smoke",
      "exitCode": 0,
      "durationMs": 682,
      "pass": true
    },
    {
      "id": "coverageCatalog",
      "label": "Coverage catalog (819 cells)",
      "script": "qa:learning-simulator:coverage",
      "exitCode": 0,
      "durationMs": 630,
      "pass": true
    },
    {
      "id": "unsupportedCells",
      "label": "Unsupported cells classification",
      "script": "qa:learning-simulator:unsupported",
      "exitCode": 0,
      "durationMs": 627,
      "pass": true
    },
    {
      "id": "contentGapAudit",
      "label": "Content gap audit (informational)",
      "script": "qa:learning-simulator:content-gaps",
      "exitCode": 0,
      "durationMs": 647,
      "pass": true
    },
    {
      "id": "contentBacklog",
      "label": "Content gap backlog (documentation)",
      "script": "qa:learning-simulator:content-backlog",
      "exitCode": 0,
      "durationMs": 603,
      "pass": true
    },
    {
      "id": "scenarioCoverage",
      "label": "Scenario coverage (fixtures + smoke)",
      "script": "qa:learning-simulator:scenario-coverage",
      "exitCode": 0,
      "durationMs": 640,
      "pass": true
    },
    {
      "id": "criticalDeep",
      "label": "Critical matrix deep assertions",
      "script": "qa:learning-simulator:critical-deep",
      "exitCode": 0,
      "durationMs": 2020,
      "pass": true
    },
    {
      "id": "profileStress",
      "label": "Profile stress (synthetic profiles)",
      "script": "qa:learning-simulator:profile-stress",
      "exitCode": 0,
      "durationMs": 2497,
      "pass": true
    },
    {
      "id": "scenarioCoverageFinal",
      "label": "Scenario coverage (+ critical deep + profile stress)",
      "script": "qa:learning-simulator:scenario-coverage",
      "exitCode": 0,
      "durationMs": 626,
      "pass": true
    },
    {
      "id": "renderReleaseGate",
      "label": "Render release gate (browser/SSR smoke for learning + parent-report)",
      "script": "qa:learning-simulator:render",
      "exitCode": 0,
      "durationMs": 188628,
      "pass": true
    },
    {
      "id": "pdfExportGate",
      "label": "PDF export gate (parent-report file download)",
      "script": "qa:learning-simulator:pdf-export",
      "exitCode": 0,
      "durationMs": 243845,
      "pass": true
    },
    {
      "id": "deep",
      "label": "Deep longitudinal simulator",
      "script": "qa:learning-simulator:deep",
      "exitCode": 0,
      "durationMs": 2301,
      "pass": true
    },
    {
      "id": "build",
      "label": "Next.js production build",
      "script": "build",
      "exitCode": 0,
      "durationMs": 20125,
      "pass": true
    },
    {
      "id": "parentReportPhase1",
      "label": "Parent report phase1 selftest",
      "script": "test:parent-report-phase1",
      "exitCode": 0,
      "durationMs": 1178,
      "pass": true
    },
    {
      "id": "intelligenceUsage",
      "label": "Intelligence layer v1 usage selftest",
      "script": "test:intelligence-layer-v1-usage",
      "exitCode": 0,
      "durationMs": 918,
      "pass": true
    },
    {
      "id": "releaseReadinessSummary",
      "label": "Release readiness summary (master QA artifact)",
      "script": "qa:learning-simulator:release-summary",
      "exitCode": 0,
      "durationMs": 673,
      "pass": true
    }
  ],
  "artifactLinks": {
    "coverageMatrix": "reports/learning-simulator/coverage-matrix.json",
    "coverageMatrixMd": "reports/learning-simulator/coverage-matrix.md",
    "schemaValidation": "reports/learning-simulator/schema-validation.json",
    "schemaValidationMd": "reports/learning-simulator/schema-validation.md",
    "aggregateSummary": "reports/learning-simulator/aggregate/run-summary.json",
    "aggregateSummaryMd": "reports/learning-simulator/aggregate/run-summary.md",
    "reportAssertions": "reports/learning-simulator/reports/run-summary.json",
    "behaviorSummary": "reports/learning-simulator/behavior/run-summary.json",
    "behaviorFailures": "reports/learning-simulator/behavior/failures.json",
    "questionIntegrity": "reports/learning-simulator/questions/run-summary.json",
    "questionFailures": "reports/learning-simulator/questions/failures.json",
    "coverageCatalog": "reports/learning-simulator/coverage-catalog.json",
    "coverageCatalogMd": "reports/learning-simulator/coverage-catalog.md",
    "unsupportedCells": "reports/learning-simulator/unsupported-cells.json",
    "unsupportedCellsMd": "reports/learning-simulator/unsupported-cells.md",
    "scenarioCoverage": "reports/learning-simulator/scenario-coverage.json",
    "scenarioCoverageMd": "reports/learning-simulator/scenario-coverage.md",
    "matrixSmoke": "reports/learning-simulator/matrix-smoke.json",
    "matrixSmokeMd": "reports/learning-simulator/matrix-smoke.md",
    "criticalMatrixDeep": "reports/learning-simulator/critical-matrix-deep.json",
    "criticalMatrixDeepMd": "reports/learning-simulator/critical-matrix-deep.md",
    "profileStress": "reports/learning-simulator/profile-stress.json",
    "profileStressMd": "reports/learning-simulator/profile-stress.md",
    "contentGapAudit": "reports/learning-simulator/content-gap-audit.json",
    "contentGapAuditMd": "reports/learning-simulator/content-gap-audit.md",
    "contentGapBacklog": "reports/learning-simulator/content-gap-backlog.json",
    "contentGapBacklogMd": "reports/learning-simulator/content-gap-backlog.md",
    "deepSummary": "reports/learning-simulator/deep/run-summary.json",
    "deepFailures": "reports/learning-simulator/deep/failures.json",
    "renderReleaseGate": "reports/learning-simulator/render-release-gate.json",
    "renderReleaseGateMd": "reports/learning-simulator/render-release-gate.md",
    "renderReleaseGateAudit": "reports/learning-simulator/render-release-gate-audit.json",
    "pdfExportGate": "reports/learning-simulator/pdf-export-gate.json",
    "pdfExportGateMd": "reports/learning-simulator/pdf-export-gate.md",
    "pdfExportAudit": "reports/learning-simulator/pdf-export-audit.json",
    "releaseReadinessSummary": "reports/learning-simulator/release-readiness-summary.json",
    "releaseReadinessSummaryMd": "reports/learning-simulator/release-readiness-summary.md",
    "engineTruthSummary": "reports/learning-simulator/engine-truth/engine-truth-summary.json",
    "engineTruthSummaryMd": "reports/learning-simulator/engine-truth/engine-truth-summary.md",
    "engineCompletionSummary": "reports/learning-simulator/engine-completion/engine-completion-summary.json",
    "realScenarioFrameworkValidation": "reports/learning-simulator/engine-completion/real-scenario-framework-validation.json",
    "orchestratorSummary": "reports/learning-simulator/orchestrator/run-summary.json"
  },
  "nextAction": null,
  "options": {
    "continueOnFail": false
  }
}
```

## Limitations

- English difficulty tiers may not align perfectly with matrix level labels.
- Cross-subject patterns are heuristic and require confirming probes.
- Subskill and misconception precision is limited until question pools carry dense expectedErrorTypes and prerequisiteSkillIds.
- Artifact snapshot mode: scenario files contain validation snapshots only; run CLI expert-review-pack for full engine JSON.
- Cross-subject and dependency outputs are heuristic teaching hypotheses.
- Sparse expectedErrorTypes / prerequisiteSkillIds on generated questions limit fine-grained misconception and prerequisite mapping.

## Per scenario

- **strong_all_subjects** — PASS — confidence high — readiness ready_for_internal_review
- **weak_all_subjects** — PASS — confidence high — readiness ready_for_internal_review
- **weak_math_fractions** — PASS — confidence medium — readiness ready_for_internal_review
- **weak_hebrew_comprehension** — PASS — confidence low — readiness needs_more_data
- **weak_english_grammar** — PASS — confidence low — readiness needs_more_data
- **weak_science_experiments** — PASS — confidence low — readiness needs_more_data
- **weak_geometry_area** — PASS — confidence medium — readiness ready_for_internal_review
- **weak_moledet_geography_maps** — PASS — confidence medium — readiness ready_for_internal_review
- **thin_data** — PASS — confidence low — readiness needs_more_data
- **random_guessing** — PASS — confidence low — readiness ready_for_internal_review
- **inconsistent** — PASS — confidence medium — readiness ready_for_internal_review
- **fast_wrong** — PASS — confidence low — readiness ready_for_internal_review
- **slow_correct** — PASS — confidence medium — readiness ready_for_internal_review
- **improving** — PASS — confidence low — readiness needs_more_data
- **declining** — PASS — confidence low — readiness needs_more_data
- **mixed_strengths** — PASS — confidence medium — readiness ready_for_internal_review
- **cross_subject_instruction_overlap** — PASS — confidence medium — readiness ready_for_internal_review
- **prerequisite_gap** — PASS — confidence medium — readiness ready_for_internal_review
- **prerequisite_direct_skill_gap** — PASS — confidence low — readiness ready_for_internal_review
- **misconception_repeat** — PASS — confidence low — readiness needs_more_data
- **mastery_decay_retention** — PASS — confidence medium — readiness ready_for_internal_review
- **difficulty_calibration_easy_only** — PASS — confidence medium — readiness ready_for_internal_review
