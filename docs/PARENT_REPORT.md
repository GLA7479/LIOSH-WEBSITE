# Parent report system (developer handoff)

Concise map of how the parent report pipeline fits together, what each test script covers, and where to look when something breaks. This doc is scoped to **parent-report / detailed report / related tests only** — not the whole app.

**Engine layers, merge precedence, and Phase 15 UI consolidation:** see [`docs/PARENT_REPORT_ENGINE.md`](./PARENT_REPORT_ENGINE.md).

**QA / calibration / red-team log:** see [`docs/PARENT_REPORT_QA_CALIBRATION.md`](./PARENT_REPORT_QA_CALIBRATION.md).

## Pipeline layers (data flow)

Order is roughly bottom-up: raw usage → enriched rows → subject diagnostics → assembled reports → UI.

1. **V2 base report** (`utils/parent-report-v2.js`, `generateParentReportV2`)  
   Period-bound snapshot: `summary`, per-subject topic maps (`mathOperations`, `geometryTopics`, …), `analysis` (mistake counts by bucket), optional `mistakes` input to pattern analysis, `dataIntegrityReport`.

2. **Row diagnostics** (`utils/parent-report-row-diagnostics.js`)  
   Per topic row: sufficiency, stability/confidence scores, `suppressAggressiveStep`, `decisionTrace`, Hebrew labels for data quality. Feeds topic engine and optional row enrichment on maps.

3. **Trend** (`utils/parent-report-row-trend.js`)  
   Session-window style signals attached to rows where applicable; consumed by Phase 2 / topic-next-step for risk derivation.

4. **Behavior** (`utils/parent-report-row-behavior.js`)  
   Dominant behavior profile per row (e.g. fragile success, knowledge gap); feeds Phase 2 risk flags and explainability.

4b. **Diagnostic Engine V2** (`utils/diagnostic-engine-v2/`)  
   Structured blueprint-aligned output on `report.diagnosticEngineV2` (taxonomy, confidence, priority, gating, probe/intervention). See [`docs/DIAGNOSTIC_ENGINE_V2.md`](./DIAGNOSTIC_ENGINE_V2.md).

5. **Topic next step** (`utils/topic-next-step-engine.js`, `utils/topic-next-step-phase2.js`, `utils/topic-next-step-config.js`)  
   `buildTopicRecommendationRecord` merges diagnostics + legacy step logic + Phase 2 guards + aggressive evidence cap. Output includes `recommendedNextStep`, Hebrew copy, `riskFlags`, `whyThisRecommendationHe`, structured trace.

6. **Learning patterns analysis** (`utils/learning-patterns-analysis.js`)  
   `analyzeLearningPatterns` produces `patternDiagnostics` (versioned subject payloads: strengths, weaknesses, dominant risks, Phase-3-style fields). Can be supplied pre-built for fixtures.

7. **Detailed report** (`utils/detailed-parent-report.js`)  
   `buildDetailedParentReportFromBaseReport` / `generateDetailedParentReport`: single **detailed** payload with `subjectProfiles`, `topicRecommendations` per subject, `overallSnapshot`, `crossSubjectInsights`, `homePlan`, `nextPeriodGoals`, etc.

8. **Executive summary** (`utils/detailed-parent-report.js` — built inside detailed assembly)  
   Cross-subject narrative, `supportingSignals.crossRiskFlags`, dominance labels, readiness strings.

9. **UI layers**  
   - **Short report** (`pages/learning/parent-report.js`): charts, tables, `ParentReportTopicExplainBlock` from `components/parent-report-topic-explain-row.jsx`.  
   - **Detailed report** (`pages/learning/parent-report-detailed.js`): imports presentational chunks from `components/parent-report-detailed-surface.jsx` (`Bullets`, `ExecutiveSummarySection`, `SubjectPhase3Insights`, `SubjectSummaryBlock`, `TopicRecommendationExplainStrip`).  
   - **Normalize** (`utils/parent-report-payload-normalize.js`): safe defaults for partial / legacy `executiveSummary` when rendering.

Explaining strings for chips and snippets generally live in `utils/parent-report-ui-explain-he.js`. Label/id contract helpers for tests: `utils/parent-report-label-contract.js`.

## Main payload fields (mental model)

- **Base (V2):** `summary`, subject maps, `analysis`, `patternDiagnostics`, `dataIntegrityReport`.  
- **Row (enriched / engine):** `topicEngineRowSignals`, `recommendationDecisionTrace`, diagnostic badges, trend/behavior attachments.  
- **Detailed top-level:** `version`, `generatedAt`, `periodInfo`, `executiveSummary`, `overallSnapshot`, `subjectProfiles`, `crossSubjectInsights`, `homePlan`, `nextPeriodGoals`, `dataIntegrityReport`.  
- **Subject profile:** strengths/weaknesses lists, `dominantLearningRisk` / `dominantSuccessPattern` **ids**, matching `*LabelHe` fields for UI, `topicRecommendations` (full engine row shape), `majorRiskFlagsAcrossRows`, home/caution copy.  
- **Executive summary:** lists of Hebrew strings, `dominantCrossSubjectRisk` + `dominantCrossSubjectRiskLabelHe`, `supportingSignals` (including `crossRiskFlags` booleans), readiness / evidence balance copy.

New additive fields across phases should remain **backward compatible**: older clients expect keys to exist (possibly `null` / empty arrays). Phase 6 suite enforces key presence across golden scenarios.

## Test commands (exact)

| Command | What it covers |
|--------|----------------|
| `npm run test:parent-report-phase1` | Row diagnostics, row trend, row behavior, data integrity validation, a golden `buildTopicRecommendationRecord` path — **integration smoke** of the row stack without Jest. |
| `npm run test:topic-next-step-phase2` | Phase 2 risk/guard helpers and related topic-next-step behavior (script name is historical). |
| `npm run test:parent-report-phase6` | **Two steps:** (1) `scripts/parent-report-phase6-suite.mjs` — fixtures → detailed report, executive rules, payload/key contracts, label contract, topic-rec key set, aggressive cap helper, generators smoke, etc. (2) `scripts/parent-report-pages-ssr.mjs` — `react-dom/server` render of **extracted** UI components (same modules as pages), stress/long Hebrew/partial fields. |
| `npx next build` | Full Next.js compile of all pages (including `/learning/parent-report` and `/learning/parent-report-detailed`). Catches import/JSX issues not hit by `tsx` scripts alone. |

CI (`.github/workflows/parent-report-tests.yml`) on push/PR to `main`/`master` runs `npm ci`, then the three `npm run test:*` parent-report scripts in order, then `npx next build` for a full compile check.

## Where to debug

| Symptom | Likely layer | Start here |
|--------|----------------|------------|
| Wrong or missing per-topic recommendation / step | Topic engine + diagnostics | `topic-next-step-engine.js`, `parent-report-row-diagnostics.js`, Phase 2 in `topic-next-step-phase2.js` |
| Trend text or trend-driven risk wrong | Trend | `parent-report-row-trend.js`, trend sections in Phase 2 |
| Behavior chip or dominance wrong | Behavior profile | `parent-report-row-behavior.js` |
| Subject narrative / dominant pattern / home copy wrong | Pattern analysis | `learning-patterns-analysis.js`, `patternDiagnostics` shape |
| Detailed JSON shape / missing keys | Detailed builder | `detailed-parent-report.js`, fixtures `tests/fixtures/parent-report-pipeline.mjs` |
| Cross-subject / exec block wrong | Executive summary | `buildExecutiveSummary` in `detailed-parent-report.js` |
| Chips / “למה” / trace bullets garbled or English ids | UI explainability | `parent-report-ui-explain-he.js`, components under `components/parent-report-*` |
| SSR / layout import issues in tests | Test harness | Use `components/parent-report-detailed-surface.jsx` and `components/parent-report-topic-explain-row.jsx` from `scripts/parent-report-pages-ssr.mjs` — do not import full `pages/` if that pulls `Layout` into `tsx`. |

## Backward compatibility

- Detailed payload and `executiveSummary` are treated as **versioned contracts** in Phase 6: required keys and subject-profile key union across scenarios.  
- UI normalization (`normalizeExecutiveSummary`) avoids crashes when older payloads omit newer executive fields.  
- Avoid removing or renaming payload keys without updating **fixtures**, **phase6 suite lists**, and any **normalize** fallbacks.

## Related files (quick index)

| Area | Path |
|------|------|
| Fixtures | `tests/fixtures/parent-report-pipeline.mjs` |
| Phase 6 suite | `scripts/parent-report-phase6-suite.mjs` |
| Page SSR smoke | `scripts/parent-report-pages-ssr.mjs` |
| Detailed surface UI | `components/parent-report-detailed-surface.jsx` |
| Short report topic explain UI | `components/parent-report-topic-explain-row.jsx` |
