# Learning Simulator — Release readiness summary

- **runId:** release-summary-moovn6kp
- **generatedAt:** 2026-05-02T21:52:04.105Z

## Overall

| Field | Value |
| --- | --- |
| **overallStatus** | pass_with_known_backlog |
| **releaseDecision** | ready_except_content_backlog |
| **buildStatus** (from orchestrator) | pass |
| **orchestrator pass** | yes |

### Coverage (catalog)

| Metric | Count |
| --- | ---: |
| total cells | 819 |
| covered | 706 |
| unsupported_expected | 72 |
| unsupported_needs_content | 41 |
| sampled | 0 |
| uncovered | 0 |
| unknown_needs_review (catalog rows) | 0 |

### Content backlog

**Total backlog items:** 41

*פירוט לפי נושא / כיתה / נושא מטריצה / סיכון שחרור — ראה JSON (`countsBySubject`, …).*


### Simulator gates

| Gate | Status |
| --- | --- |
| matrix smoke | pass |
| critical deep | pass |
| profile stress | pass |
| pace oracle | pass |
| scenario coverage | present |

### Render gate

| Field | Value |
| --- | --- |
| browserMode | true |
| checks passed / total | 7 / 7 |
| consoleErrorsTotal | 0 |
| fatalErrorsTotal | 0 |
| PDF/export | deferred (documented) |


### Known remaining work (groups)

- **content_backlog:** 41 tracked items in content-gap-backlog.json
- **pdf_binary_export_deferred:** PDF/export validation deferred per render-release-gate policy
- **optional_render_expansion:** Additional routes/surfaces can be added to render gate without product changes
- **optional_ci_runtime_optimization:** Use RENDER_GATE_AUTO_SERVER=0 with dev server up to shorten CI wall time

### failures / warnings

- (none)



Full JSON: `C:/Users/ERAN YOSEF/Desktop/final projects/FINAL-WEB/LIOSH-WEB-TRY/reports/learning-simulator/release-readiness-summary.json`
