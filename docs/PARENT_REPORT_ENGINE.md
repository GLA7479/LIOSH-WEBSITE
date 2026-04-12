# Parent report engine — layer order and precedence

Engineering handoff for Phases **7–15** (diagnostic depth through consolidation). This document is the **source of truth** for how layers stack, how conflicts are resolved, and what UI is allowed to assume.

## 1. Data flow (bottom → top)

1. **V2 base report** — period snapshot, per-subject topic maps, mistake aggregates (`utils/parent-report-v2.js`).
2. **Row diagnostics** — sufficiency, stability, caps, `decisionTrace` (`utils/parent-report-row-diagnostics.js`).
3. **Trend / behavior** — session-style signals and dominant behavior (`parent-report-row-trend.js`, `parent-report-row-behavior.js`).
4. **Topic next step engine** — merges diagnostics + legacy step + Phases 7–14 overlays into one `decideTopicNextStep` object (`utils/topic-next-step-engine.js`, helpers in `topic-next-step-phase2.js` and standalone `parent-report-*.js` modules).
5. **Pattern diagnostics** — subject aggregation from enriched rows (`utils/learning-patterns-analysis.js`).
6. **Detailed report** — `subjectProfiles`, `topicRecommendations`, `executiveSummary` (`utils/detailed-parent-report.js`).
7. **Normalization** — safe defaults for partial payloads (`utils/parent-report-payload-normalize.js`).
8. **UI** — chips and **parent-facing lines** built from the same Hebrew helpers as letters (`utils/parent-report-ui-explain-he.js`, `components/parent-report-*.jsx`).

## 2. Topic engine internal merge order (single object)

Inside `decideTopicNextStep`, later spreads **override** earlier keys only where both define the same key. Semantic **precedence** for narratives is documented in code comments (Phase 15 in `topic-next-step-engine.js`):

- **Restraint / root cause** — baseline `whyThisRecommendationHe`; diagnostic caution appended early.
- **Phase 10 aging** — softens wording when decay applies; does not remove Phase 8–9 actions.
- **Phase 11 drift** — repeat/rotation warnings append after aging.
- **Phase 12 memory/outcome** — `whatNeedsFreshEvidenceNowHe` only when memory is thin **and** it does not duplicate Phase 13 “what evidence we still need” (substring probe).
- **Phase 13 gates/targets** — `whatEvidenceWeStillNeedHe` skipped if an equivalent fragment is already inside `whyThisRecommendationHe`.
- **Phase 14 dependency/ordering** — `whyFoundationFirstHe` / parallel / gather lines; release/advance softening sentence appended only if the Hebrew fragment `"לא מרחיבים שחרור"` is not already present (avoids double caution).

**Intentionally conservative:** proxy-based signals (low `q`, low evidence, `gateReadiness: insufficient`) keep dependency state in `insufficient_dependency_evidence` and ordering in evidence-first paths (`parent-report-foundation-dependency.js`, `parent-report-foundation-ordering.js`).

## 3. Parent-facing narrative priority (Phase 15 UI)

For **compact** topic UI (explain row + `TopicRecommendationExplainStrip`), the visible order is:

1. What is most likely — `whyThisRecommendationHe` (plus badges / intervention / do-now).
2. What support fits — Phase 8 plan, calibration, RTI.
3. What we still need — merged **freshness + fresh-evidence + recalibration** (`topicFreshnessUnifiedLineHe`).
4. What should wait / how to sequence — merged **adjustment + sequence + repetition** (`topicSequencingRepeatCompactLineHe`).
5. Memory / outcome / continuation — one line when texts overlap (`topicMemoryOutcomeContinuationCompactLineHe`).
6. Gates / cycle focus / evidence target / trigger — one line with chunk dedupe (`topicGatesEvidenceDecisionCompactLineHe`).
7. Foundation vs local + ordering + before expansion + downstream hint — one line (`topicFoundationDependencyCompactLineHe`).

Granular helpers (`gateStateLineHe`, `freshnessLineHe`, …) remain exported for letters, tests, and any consumer that needs a single facet.

## 4. Subject and executive summaries

- **Subject** rows in `SubjectPhase3Insights` still use **structured** fields from `learning-patterns-analysis.js` (no duplicate of topic strip logic in Phase 15).
- **Executive** blocks remain list-oriented; cross-subject dependency (Phase 14) uses **priority walks** over vote counts (documented in `detailed-parent-report.js` / `learning-patterns-analysis.js`).

## 5. Contracts and safety

- **Keys:** Phase 6 suite enforces presence of topic recommendation keys and executive keys; do not rename without updating fixtures and `parent-report-payload-normalize.js`.
- **Labels:** `parent-report-label-contract.js` asserts Hebrew UI strings for executive + subject profiles — **ids must not leak** into those strings.
- **SSR:** `scripts/parent-report-pages-ssr.mjs` renders extracted components only (no full Next layout).

## 6. QA calibration (Phase X)

Release / continuation / stale / memory alignment: see [`PARENT_REPORT_QA_CALIBRATION.md`](./PARENT_REPORT_QA_CALIBRATION.md) for contradiction matrix, red-team results, and regression test names.

## 7. Calibration notes (Phase 15)

- **Foundation dependency:** `likely_foundational_block` from the “single foundation score + instability” branch requires **`foundationScore >= 2`** (was ≥1). Procedure fallback `procedure_automaticity_gap` when blocker unknown requires **`q >= 15`**.
- **Foundation ordering:** see JSDoc on `buildFoundationOrderingPhase14` in `parent-report-foundation-ordering.js`.

## 8. Related docs

- Pipeline and test commands: `docs/PARENT_REPORT.md`.
