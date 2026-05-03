# Learning Simulator — Release readiness summary

- **runId:** release-summary-moq7zkqm
- **generatedAt:** 2026-05-03T20:25:23.902Z

## Overall

| Field | Value |
| --- | --- |
| **overallStatus** | pass |
| **releaseDecision** | ready_for_next_dev_phase |
| **buildStatus** (from orchestrator) | skipped |
| **orchestrator pass** | yes |

### Coverage (catalog)

| Metric | Count |
| --- | ---: |
| total cells | 819 |
| covered | 747 |
| unsupported_expected | 72 |
| unsupported_needs_content | — |
| sampled | 0 |
| uncovered | 0 |
| unknown_needs_review (catalog rows) | 0 |

### Content backlog

**Total backlog items:** 0

*פירוט לפי נושא / כיתה / נושא מטריצה / סיכון שחרור — ראה JSON (`countsBySubject`, …).*


### Question metadata gate (static banks)

| Field | Value |
| --- | --- |
| gateDecision | pass_with_advisory |
| scanOutcome | ok |
| blockingIssueCount | 0 |
| advisoryIssueCount | 15876 |
| exemptedIssueCount | 878 |
| highRiskCount | 439 |
| human report | `reports/question-metadata-qa/summary.md` |


### Adaptive planner (artifacts — non-live)

| Field | Value |
| --- | --- |
| planner runs | 126 |
| safetyViolationCount | 0 |
| inputsWithAvailableMetadata | 126 |
| availableQuestionMetadata_missing (after index) | 0 |
| metadataSubjectFallbackCount | 0 |
| englishSkillTaggingIncompleteCount | 0 |
| needs_human_review outputs | 0 |
| metadata index source | snapshot_file |
| human report | `reports/adaptive-learning-planner/artifact-summary.md` |

**plannerStatus:** {"caution":122,"ready":4}

**nextAction:** {"pause_collect_more_data":98,"probe_skill":24,"practice_current":2,"advance_skill":2}

*Release fails if `safetyViolationCount > 0` or the orchestrator adaptive-planner step failed. Other rows are advisory until diagnostic units carry bank-aligned skill ids.*


### Simulator gates

| Gate | Status |
| --- | --- |
| question metadata | warn |
| adaptive planner artifacts | pass |
| matrix smoke | pass |
| critical deep | pass |
| profile stress | pass |
| pace oracle | pass |
| scenario coverage | present |
| pdf export | pass |

### Render gate

| Field | Value |
| --- | --- |
| browserMode | true |
| checks passed / total | 7 / 7 |
| consoleErrorsTotal | 0 |
| fatalErrorsTotal | 0 |
| PDF/export (render gate doc) | deferred surfaces / informational |


### Parent narrative safety (artifacts)

| Field | Value |
| --- | --- |
| status | warnings_only |
| narrativesChecked | 10398 |
| artifactFileCount | 84 |
| blockCount | 0 |
| warningCount | 124 |
| infoCautionCount | 16 |
| human report | `reports/parent-report-narrative-safety-artifacts/summary.md` |

Top warning codes: ambiguous_evidence:124


### PDF export gate

| Field | Value |
| --- | --- |
| status | pass |
| checkedRoute | /learning/parent-report?qa_pdf=file |
| downloadSucceeded | true |
| fileSizeBytes | 3919650 |
| pdfHeaderOk | true |
| deferredReason | — |


### Known remaining work (groups)

- **content_backlog:** none
- **optional_render_expansion:** Additional routes/surfaces can be added to render gate without product changes
- **optional_ci_runtime_optimization:** Use RENDER_GATE_AUTO_SERVER=0 with dev server up to shorten CI wall time

### failures / warnings

- (none)

- **warning:** Question metadata: pass_with_advisory — advisoryIssueCount=15876, highRiskCount=439

Full JSON: `C:/Users/ERAN YOSEF/Desktop/final projects/FINAL-WEB/LIOSH-WEB-TRY/reports/learning-simulator/release-readiness-summary.json`
