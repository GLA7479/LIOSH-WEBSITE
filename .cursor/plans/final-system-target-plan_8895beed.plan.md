---
name: final-system-target-plan
plan_version: v2.0-execution-blueprint
last_updated: 2026-04-15
status: awaiting approval
execution_status: not approved
approved_scope: none yet
next_approval_target: Phase 1 only
overview: Source of truth מחייב לביצוע עתידי של EBPIE, כולל runtime order קנוני, schemas, phase plan, approval gates, וגבולות rollout. אין אישור לביצוע קוד בשלב זה.
todos:
  - id: approve-phase1-scope
    content: אישור מפורש ל-Phase 1 בלבד לפני כל שינוי קוד.
    status: pending
  - id: approve-phase1-schema
    content: אישור סופי ל-EvidenceContract schema ולכללי הוולידציה של Phase 1.
    status: pending
  - id: approve-phase1-tests
    content: אישור חבילת הבדיקות של Phase 1 כולל non-regression של פלט עברי.
    status: pending
  - id: approve-feature-flag
    content: אישור מנגנון feature flag ו-dual path rollout לפני הטמעת Phases 2-5.
    status: pending
  - id: approve-post-phase1-gates
    content: אישור מחדש לכל Phase מעבר ל-Phase 1.
    status: pending
isProject: false
---

# Final System Plan (Updated Source of Truth) — Evidence-Based Parent Insight Engine

## 1. Plan Header

- **Plan version:** `v2.0-execution-blueprint`
- **Last updated:** `2026-04-15`
- **Status:** `awaiting approval`
- **Execution status:** `not approved`
- **Approved scope:** `none yet`
- **Next approval target:** `Phase 1 only`
- **Approved in principle:**  
  - הכיוון המערכתי: `contracts + wrappers + deterministic gates + language envelopes + QA hard gates`.
  - מודל מוצר: `Evidence-Based Parent Insight Engine`.
- **Pending approval (before any code):**  
  - אישור מפורש ל־Phase 1 scope/files/tests/acceptance.
  - אישור schema Phase 1.
  - אישור gate להפעלת קוד.

## 2. Target System Section

- **שם מנוע יעד:** `Evidence-Based Parent Insight Engine (EBPIE)`.
- **מה המוצר כן:** מנוע תובנות הורי מבוסס ראיות ביצועיות, זהיר בדפוסים, ודטרמיניסטי בהחלטות.
- **מה המוצר לא:** מנוע אבחון מקצועי/קליני, לא מפרש מצב רגשי/טיפולי, לא טוען מעבר לראיות.
- **גבול סמכות:** המנוע מתאר observed performance, מזהה דפוסים, ומציע תרגול ביתי רק כשיש eligibility מבוסס ראיה.
- **אמינות ללא איש מקצוע:** deterministic contracts, hard gates, language envelopes, ו-QA system-level.
- **תפקיד איש מקצוע בעתיד (אופציונלי):** calibration עדין ושיפור ניסוח/דיוק, לא תנאי לפעולה תקינה של v1.

## 3. Canonical Runtime Order (מחייב)

### Stage 1 — Raw Data
- **Exact input:** `playerName`, `reportRange`, subject buckets, raw topic rows, raw mistakes.
- **Exact output:** `rawReportContext`.
- **Owner:** `generateParentReportV2()` ב־[`utils/parent-report-v2.js`](utils/parent-report-v2.js).
- **Forbidden:** claiming, readiness, parent wording.

### Stage 2 — Normalization
- **Exact input:** `rawReportContext`.
- **Exact output:** `normalizedRows`, `normalizedMistakeEvents`, `normalizedSubjectMaps`.
- **Owner:** `normalizeMistakeEvent()` ב־[`utils/mistake-event.js`](utils/mistake-event.js), row normalization ב־[`utils/parent-report-row-diagnostics.js`](utils/parent-report-row-diagnostics.js).
- **Forbidden:** tier/eligibility decisions, recommendation text.

### Stage 3 — Evidence Contract Build
- **Exact input:** normalized rows/events + period boundaries.
- **Exact output:** `EvidenceContract[]` + `SubjectEvidenceAggregate`.
- **Owner:** `computeRowDiagnosticSignals()` + enrichment stack ב־[`utils/parent-report-row-diagnostics.js`](utils/parent-report-row-diagnostics.js), [`utils/parent-report-row-trend.js`](utils/parent-report-row-trend.js), [`utils/parent-report-row-behavior.js`](utils/parent-report-row-behavior.js).
- **Forbidden:** recommendation intensity selection, parent-facing phrases.

### Stage 4 — Decision Contract
- **Exact input:** `EvidenceContract` + DEv2 outputs.
- **Exact output:** `DecisionContract`.
- **Owner:** `runDiagnosticEngineV2()` / `applyOutputGating()` + phase gates ב־[`utils/diagnostic-engine-v2/output-gating.js`](utils/diagnostic-engine-v2/output-gating.js), [`utils/parent-report-decision-gates.js`](utils/parent-report-decision-gates.js).
- **Forbidden:** language rendering, new facts not in evidence.

### Stage 5 — Readiness + Confidence
- **Exact input:** `DecisionContract` + evidence breadth/variance/recency.
- **Exact output:** `ReadinessContract`, `ConfidenceContract`.
- **Owner:** readiness/cap policies ב־[`utils/minimal-safe-scope-enforcement.js`](utils/minimal-safe-scope-enforcement.js).
- **Forbidden:** changing decision tier, bypassing deny reasons.

### Stage 6 — Recommendation Contract
- **Exact input:** Decision + Readiness + Confidence + evidence anchors.
- **Exact output:** `RecommendationContract`.
- **Owner:** recommendation engine ב־[`utils/topic-next-step-engine.js`](utils/topic-next-step-engine.js).
- **Forbidden:** recommendation without evidence anchors, phrasing escalation.

### Stage 7 — Narrative Contract
- **Exact input:** Evidence + Decision + Readiness + Confidence + Recommendation contracts.
- **Exact output:** `NarrativeContract`.
- **Owner:** governance/safety wrapper (planned) סביב [`utils/minimal-safe-scope-enforcement.js`](utils/minimal-safe-scope-enforcement.js).
- **Forbidden:** recompute decisions, override eligibility.

### Stage 8 — Language Render
- **Exact input:** `NarrativeContract` + factual slots.
- **Exact output:** parent-facing Hebrew strings.
- **Owner:** [`utils/parent-report-language/`](utils/parent-report-language/), [`utils/parent-report-ui-explain-he.js`](utils/parent-report-ui-explain-he.js), [`utils/detailed-report-parent-letter-he.js`](utils/detailed-report-parent-letter-he.js).
- **Forbidden:** create new claim tiers, reveal system tokens.

### Stage 9 — Report Composition
- **Exact input:** rendered strings + subject/executive aggregates.
- **Exact output:** detailed/short report payload.
- **Owner:** [`utils/detailed-parent-report.js`](utils/detailed-parent-report.js).
- **Forbidden:** semantic escalation of claims.

### Stage 10 — QA/Safety Gates
- **Exact input:** final payload + contract traces.
- **Exact output:** `pass|fail` + violations.
- **Owner:** [`utils/minimal-safe-scope-enforcement.js`](utils/minimal-safe-scope-enforcement.js), phase scripts.
- **Forbidden:** silent payload mutation; only block/report.

## 4. Canonical Contract Schemas

> סטטוס כל schema: `planned` ו־`not approved for implementation yet`, אלא אם צוין אחרת.

### 4.1 EvidenceContract (Phase 1 target)
- **Status:** `planned`, `not approved for implementation yet`.

```ts
type EvidenceStrength = "low" | "medium" | "strong";
type EvidenceBand = "E0" | "E1" | "E2" | "E3" | "E4";
type TrendState = "improving" | "stable" | "regressing" | "mixed" | "unknown";
type VarianceState = "low" | "medium" | "high";
type SignalQuality = "clean" | "noisy" | "contradictory";

interface EvidenceContract {
  contractVersion: "v1"; // required
  topicKey: string; // required
  subjectId: string; // required
  periodStartMs: number; // required
  periodEndMs: number; // required
  questionCount: number; // required, integer >= 0
  accuracyPct: number; // required, 0..100
  wrongCount: number; // required, integer >= 0
  responseSpeedMsMedian: number | null; // required
  repetitionRate01: number; // required, 0..1
  hintRate01: number; // required, 0..1
  retryRate01: number; // required, 0..1
  recencyScore01: number; // required, 0..1
  stability01: number; // required, 0..1
  confidence01: number; // required, 0..1
  varianceState: VarianceState; // required
  trendState: TrendState; // required
  evidenceStrength: EvidenceStrength; // required
  evidenceBand: EvidenceBand; // required
  signalQuality: SignalQuality; // required
  anchorEventIds: string[]; // required (may be empty only in E0)
  dataSufficiency: "insufficient" | "partial" | "sufficient"; // required
  modeDiff?: { speedGapMs?: number; accuracyGapPct?: number } | null; // optional
  errorConcentration?: { topPatternKey: string; share01: number } | null; // optional
}
```

- **Forbidden states:**
  - ratios מחוץ לטווחים (`0..1` / `0..100`).
  - `evidenceBand=E4` עם `dataSufficiency!="sufficient"`.
  - `signalQuality="contradictory"` יחד עם `evidenceStrength="strong"`.
- **Validation rules:**
  - `E0`: `questionCount < 4` or no anchors.
  - `E1`: `4 <= questionCount < 8`.
  - `E2`: `questionCount >= 8` with non-low evidence.
  - `E3`: `questionCount >= 12` and medium+ stability/confidence.
  - `E4`: `questionCount >= 12`, high stability, low variance, not contradictory.

### 4.2 DecisionContract
- **Status:** `planned`, `not approved for implementation yet`.

```ts
type DecisionTier = 0 | 1 | 2 | 3 | 4;
type ClaimClass =
  | "no_claim"
  | "descriptive_observation"
  | "gentle_pattern"
  | "stable_pattern"
  | "actionable_guidance";

interface DecisionContract {
  contractVersion: "v1";
  topicKey: string;
  subjectId: string;
  decisionTier: DecisionTier;
  allowedClaimClasses: ClaimClass[];
  forbiddenClaimClasses: ClaimClass[];
  cannotConcludeYet: boolean;
  gateReadiness: "insufficient" | "forming" | "ready";
  denialReasons: Array<
    | "low_sample"
    | "contradictory_signals"
    | "high_variance"
    | "weak_evidence"
    | "stale_data"
    | "cross_mode_mismatch"
  >;
  dev2ConfidenceLevel?: "insufficient_data" | "early_signal_only" | "moderate" | "high" | "contradictory";
  positiveAuthorityLevel?: "none" | "good" | "very_good" | "excellent";
}
```

- **Forbidden states:** Tier 4 עם `cannotConcludeYet=true`; contradictory עם Tier מעל 1.

### 4.3 ReadinessContract
- **Status:** `planned`, `not approved for implementation yet`.

```ts
type ReadinessState = "insufficient" | "emerging" | "unstable" | "ready";

interface ReadinessContract {
  contractVersion: "v1";
  topicKey: string;
  subjectId: string;
  readiness: ReadinessState;
  readinessReasonCodes: string[];
  maxAllowedTier: 0 | 1 | 2 | 3 | 4;
}
```

- **Forbidden states:** `readiness="insufficient"` with `maxAllowedTier > 1`.

### 4.4 ConfidenceContract
- **Status:** `planned`, `not approved for implementation yet`.

```ts
type ConfidenceBand = "low" | "medium" | "high";

interface ConfidenceContract {
  contractVersion: "v1";
  topicKey: string;
  subjectId: string;
  confidenceBand: ConfidenceBand;
  confidenceScore01: number; // 0..1
  confidenceDrivers: Array<
    | "sample_size"
    | "stability"
    | "recency"
    | "variance"
    | "mode_alignment"
    | "contradiction"
  >;
}
```

- **Forbidden states:** `confidenceBand="high"` with score מתחת 0.67.

### 4.5 RecommendationContract
- **Status:** `planned`, `not approved for implementation yet`.

```ts
type RecommendationIntensity = "RI0" | "RI1" | "RI2" | "RI3";
type RecommendationFamily =
  | "general_practice"
  | "accuracy_focus"
  | "speed_accuracy_balance"
  | "recurrence_break"
  | "independence_build"
  | "retention_consolidation";

interface RecommendationContract {
  contractVersion: "v1";
  topicKey: string;
  subjectId: string;
  eligible: boolean;
  intensity: RecommendationIntensity;
  family: RecommendationFamily | null;
  anchorEvidenceIds: string[];
  rationaleCodes: string[];
  forbiddenBecause: string[];
}
```

- **Forbidden states:** `eligible=true` with empty anchors; `RI2/RI3` under low readiness/confidence.

### 4.6 NarrativeContract
- **Status:** `planned`, `not approved for implementation yet`.

```ts
type WordingEnvelope = "WE0" | "WE1" | "WE2" | "WE3" | "WE4";
type HedgeLevel = "none" | "light" | "mandatory";

interface NarrativeContract {
  contractVersion: "v1";
  topicKey: string;
  subjectId: string;
  wordingEnvelope: WordingEnvelope;
  hedgeLevel: HedgeLevel;
  allowedTone: "parent_professional_warm";
  forbiddenPhrases: string[];
  requiredHedges: string[];
  allowedSections: Array<"summary" | "finding" | "recommendation" | "limitations">;
  recommendationIntensityCap: "RI0" | "RI1" | "RI2" | "RI3";
  textSlots: {
    observation: string;
    interpretation: string;
    action: string | null;
    uncertainty: string | null;
  };
}
```

- **Forbidden states:** WE0/WE1 wording ללא hedge כנדרש; action כאשר cap הוא RI0; system tokens בטקסט הורה.

## 5. Single Source of Truth Mapping

- **EvidenceContract**
  - **Built in:** wrapper `buildEvidenceContractV1` (planned) סביב [`utils/parent-report-row-diagnostics.js`](utils/parent-report-row-diagnostics.js).
  - **Consumed by:** decision/readiness/recommendation wrappers.
  - **Who may change:** Evidence layer owners בלבד.
  - **Who may not change:** language/UI modules.
- **DecisionContract**
  - **Built in:** DEv2 + decision gates wrappers.
  - **Consumed by:** readiness/confidence + recommendation eligibility.
  - **Who may change:** decision/gating owners בלבד.
  - **Who may not change:** wording modules.
- **Readiness/Confidence**
  - **Built in:** safety/governance wrapper.
  - **Consumed by:** recommendation contract + narrative contract.
  - **Who may change:** readiness policy owner בלבד.
  - **Who may not change:** render/composition modules.
- **RecommendationContract**
  - **Built in:** wrapper מעל `decideTopicNextStep`.
  - **Consumed by:** narrative builder בלבד.
  - **Who may change:** recommendation policy owner בלבד.
  - **Who may not change:** language layer.
- **NarrativeContract**
  - **Built in:** gateway יחיד לפני language render.
  - **Consumed by:** [`utils/parent-report-language/`](utils/parent-report-language/), [`utils/parent-report-ui-explain-he.js`](utils/parent-report-ui-explain-he.js), [`utils/detailed-report-parent-letter-he.js`](utils/detailed-report-parent-letter-he.js).
  - **Who may change:** language policy owner + contract owner.
  - **Who may not change:** decision/recommendation eligibility owners.

### Boundary Rules (Mandatory)
- **Decision vs wording boundary:** נגמר ב־`DecisionContract`; כל מה שאחריו לא משנה tier/claim class.
- **Eligibility vs phrasing boundary:** eligibility/intensity נקבעים ב־`RecommendationContract`; phrasing רק מממשת envelope.

## 6. File-Level Phase Plan (Phase 1–5)

### Phase 1 — Contracts Foundation (Evidence only)
- **Goal:** יצירת foundation קנונית של contracts בלי שינוי החלטות/שפה.
- **Files touched:**
  - `NEW` [`utils/contracts/parent-report-contracts-v1.js`](utils/contracts/parent-report-contracts-v1.js)
  - `NEW` [`utils/contracts/parent-report-contracts-v1.schema.json`](utils/contracts/parent-report-contracts-v1.schema.json)
  - `NEW` [`scripts/contracts-v1-selftest.mjs`](scripts/contracts-v1-selftest.mjs)
  - `EDIT minimal` [`utils/parent-report-row-diagnostics.js`](utils/parent-report-row-diagnostics.js)
  - `EDIT minimal` [`utils/parent-report-v2.js`](utils/parent-report-v2.js)
- **No-touch files:**
  - [`utils/parent-report-language/`](utils/parent-report-language/)
  - [`utils/parent-report-ui-explain-he.js`](utils/parent-report-ui-explain-he.js)
  - [`utils/detailed-report-parent-letter-he.js`](utils/detailed-report-parent-letter-he.js)
  - [`pages/learning/parent-report.js`](pages/learning/parent-report.js)
  - [`pages/learning/parent-report-detailed.js`](pages/learning/parent-report-detailed.js)
- **Type:** wrapper / extraction only.
- **Regression risk:** low.
- **Expected output artifact:** `contractsV1.evidence` trace attached to topic rows.

### Phase 2 — Decision + Readiness + Confidence Contracts
- **Goal:** לאחד tier/readiness/confidence ל-contract layer אחיד.
- **Files touched (planned):**
  - [`utils/diagnostic-engine-v2/output-gating.js`](utils/diagnostic-engine-v2/output-gating.js)
  - [`utils/parent-report-decision-gates.js`](utils/parent-report-decision-gates.js)
  - [`utils/minimal-safe-scope-enforcement.js`](utils/minimal-safe-scope-enforcement.js)
  - `NEW` `utils/contracts/decision-readiness-contract-v1.js`
- **No-touch:** language/templates/pages.
- **Risk:** medium.
- **Expected artifact:** `contractsV1.decision`, `contractsV1.readiness`, `contractsV1.confidence`.

### Phase 3 — Recommendation Contract Hardening
- **Goal:** eligibility/intensity + anchors enforcement.
- **Files touched (planned):**
  - [`utils/topic-next-step-engine.js`](utils/topic-next-step-engine.js)
  - `NEW` `utils/contracts/recommendation-contract-v1.js`
  - [`utils/minimal-safe-scope-enforcement.js`](utils/minimal-safe-scope-enforcement.js)
- **No-touch:** copy files and page rendering.
- **Risk:** medium-high.
- **Expected artifact:** `contractsV1.recommendation`.

### Phase 4 — Narrative Contract + Render Boundary
- **Goal:** gate-to-text hard binding דרך NarrativeContract.
- **Files touched (planned):**
  - `NEW` `utils/contracts/narrative-contract-v1.js`
  - [`utils/parent-report-ui-explain-he.js`](utils/parent-report-ui-explain-he.js)
  - [`utils/detailed-report-parent-letter-he.js`](utils/detailed-report-parent-letter-he.js)
  - [`utils/detailed-parent-report.js`](utils/detailed-parent-report.js)
- **No-touch:** UI layout/PDF/export.
- **Risk:** medium.
- **Expected artifact:** `contractsV1.narrative` + envelope-compliant output.

### Phase 5 — QA Hard Gates + CI
- **Goal:** חסימת merge על contract violations.
- **Files touched (planned):**
  - [`scripts/minimal-safe-scope-scenarios.mjs`](scripts/minimal-safe-scope-scenarios.mjs)
  - [`scripts/parent-report-phase6-suite.mjs`](scripts/parent-report-phase6-suite.mjs)
  - [`scripts/diagnostic-engine-v2-harness.mjs`](scripts/diagnostic-engine-v2-harness.mjs)
  - [`.github/workflows/parent-report-tests.yml`](.github/workflows/parent-report-tests.yml)
  - [`docs/full-test-matrix.md`](docs/full-test-matrix.md)
- **No-touch:** runtime recommendations/copy logic except test hooks.
- **Risk:** low product risk, medium process risk.
- **Expected artifact:** CI gate enforcing fail_overstated/fail_gate_text/fail_unsupported.

## 7. Approval Gates (Explicit)

- `Phase 1 requires approval before code` — **mandatory**.
- `Phases 2-5 are blocked until further explicit approval` — **mandatory**.
- `No implicit execution permission` — **mandatory**.
- אישור בצ'אט או אישור עקרוני למסלול **אינו** אישור לביצוע קוד.
- נקודת gate לפני קוד: אישור מפורש של “Phase 1 בלבד” כולל files/tests/acceptance.

## 8. Phase 1 Only (Highlighted)

> **Phase 1 is NOT approved yet.**

### Exact scope of Phase 1
- להוסיף `EvidenceContract` בלבד (ללא Decision/Readiness/Recommendation/Narrative implementation).
- לצרף `contractsV1.evidence` כ-trace metadata לפלט, ללא שינוי שפה הורית.

### Exact files (Phase 1 only)
- `NEW` [`utils/contracts/parent-report-contracts-v1.js`](utils/contracts/parent-report-contracts-v1.js)
- `NEW` [`utils/contracts/parent-report-contracts-v1.schema.json`](utils/contracts/parent-report-contracts-v1.schema.json)
- `NEW` [`scripts/contracts-v1-selftest.mjs`](scripts/contracts-v1-selftest.mjs)
- `EDIT minimal` [`utils/parent-report-row-diagnostics.js`](utils/parent-report-row-diagnostics.js)
- `EDIT minimal` [`utils/parent-report-v2.js`](utils/parent-report-v2.js)

### Exact deliverables
- Evidence schema + runtime validator.
- Builder function deterministic for each topic row.
- Trace attach in report pipeline.
- Selftest with positive/negative schema cases.

### Exact tests
- `npm run test:contracts-v1` (new).
- Existing non-regression suite must continue passing:
  - `npm run test:parent-report-phase1`
  - `npm run test:topic-next-step-phase2`
  - `npm run test:topic-next-step-engine-scenarios`
  - `npm run test:parent-report-phase6`
  - `npm run test:minimal-safe-scope`

### Exact acceptance criteria
- 100% topic rows in test matrix include valid `contractsV1.evidence`.
- 0 schema violations.
- 0 changes in parent-facing Hebrew outputs (`*He` fields unchanged).
- 0 changes in UI/PDF/export behavior.
- All existing tests remain green.

## 9. Rollback / Compatibility Section

### Feature flag plan
- Introduce flag: `PARENT_REPORT_CONTRACTS_V1`.
- Default state until approval: `off`.
- When on: attach contracts trace; legacy behavior remains functional.

### Dual path plan
- `legacyPath`: current production flow (authoritative until later approval).
- `contractsPath`: additive trace path under flag.
- No replacement of legacy decisioning in Phase 1.

### Comparison strategy
- Add snapshot comparison script for old vs new payload:
  - same `*He` outputs,
  - same executive/topic semantics,
  - only additive trace fields are allowed difference.

### Rollback trigger
- Any regression in language, decision output, or failing critical tests.
- Rollback action: set feature flag off and revert Phase-specific contract hooks.

## 10. Open Decisions / Pending Approval

- אישור `Phase 1 only` scope (כן/לא).
- אישור schema הסופי של `EvidenceContract` (threshold validations כולל E0-E4 rules).
- אישור מיקום trace בפלט (`contractsV1.evidence` exact nesting path).
- אישור `feature flag` naming and default behavior.
- אישור test gate חדש `test:contracts-v1`.
- אישור policy ש־`*He` fields must remain unchanged in Phase 1.
- אישור מפורש שאין מעבר ל־Phase 2 ללא gate חדש.

## 11. What Is Approved vs What Is Not

- **Approved in principle:** architecture direction and contract-first deterministic model.
- **Not approved for implementation yet:** כל שינוי קוד בכל Phase.
- **Current executable scope:** none.
- **Next decision required from product owner:** approve or reject `Phase 1 only`.

## 12. Explicit Prohibitions Until Approval

- אין להתחיל כתיבת קוד.
- אין יצירת patch לקוד runtime.
- אין שינוי קבצי UI/PDF/copy.
- אין קידום ל־Phase 2-5.
- אין לפרש מסמך זה כאישור ביצוע.