---
name: Parent Copilot Product Plan
overview: Execution Blueprint Final for Parent Copilot v1 (parent-only), contract-bound to contractsV1, with teacher-ready architecture only.
todos:
  - id: lock-boundary
    content: Freeze v1 boundary (parent-only, contract-bound, no freeform inference).
    status: pending
  - id: lock-runtime-contracts
    content: Freeze runtime flow and all conversation contracts (response/follow-up/memory/validator).
    status: pending
  - id: lock-phase-a-files
    content: Approve exact Phase A file map (new/modified/no-touch) and wrapper strategy.
    status: pending
  - id: lock-phase-a-gates
    content: Approve acceptance criteria, QA gates, and rollout/flag policy.
    status: pending
isProject: false
---

# Parent Copilot — Execution Blueprint Final (Implementation-Grade)

## 1. Plan Header
- plan version: `v1.0.0-execution-blueprint-final`
- last updated: `2026-04-15`
- status: `awaiting final approval`
- implementation status: `not approved yet`
- v1 scope: `Parent Copilot only`
- future scope: `Teacher-ready architecture only`
- next approval target: `Phase A only`

## 1A. Approval Preconditions for Phase A
- Phase A is **not approved yet**.
- Approval requires this plan to remain locked with all three locks explicitly present:
  - Lock 1: clarifying question is not default behavior
  - Lock 2: quick actions are fully contract-bound + validator-compatible
  - Lock 3: `TruthPacketV1` defined and mandated as first implementation artifact
- No code execution may start before these locks are written and approved in this plan.

## 2. Locked Product Boundary

### In scope for v1
- contract-bound parent conversation
- report-grounded answers
- one smart follow-up per turn (or explicit none)
- quick actions
- short session memory only
- validator + deterministic fallback
- parent tone only

### Out of scope for v1
- teacher UI
- mixed parent/teacher chat
- cross-session memory
- freeform coaching outside contracts
- autonomous planning
- diagnosis-like inference
- broad personalization

### Forbidden behavior
- inventing diagnosis, severity, or recommendation class outside `contractsV1`
- recommending action when recommendation is ineligible/capped out
- contradicting readiness/confidence/narrative envelope
- returning generic template answer with no scoped anchor

## 3. Canonical Runtime Flow

### Runtime lock notes (mandatory)
- `TruthPacketV1` is the first implementation artifact in Phase A.
- `answer-composer`, `followup-engine`, UI shell wiring, and quick-action rendering are forbidden until `TruthPacketV1` schema + builder are implemented and consumed.

1. **report_context_select**
   - input: report payload + UI selection context
   - output: `selectedContextRef`
   - owner module: `utils/parent-copilot/scope-resolver.js`
   - forbidden: answer generation, contract mutation

2. **scope_resolution**
   - input: user utterance + `selectedContextRef`
   - output: `resolvedScope`
   - owner module: `utils/parent-copilot/scope-resolver.js`
   - forbidden: unresolved generic fallback without scope attempt; clarifying question as default

3. **intent_resolution**
   - input: utterance + resolved scope + session memory
   - output: `resolvedIntent`
   - owner module: `utils/parent-copilot/intent-resolver.js`
   - forbidden: intent outside locked taxonomy

4. **truth_packet_build**
   - input: resolved scope + report contracts
   - output: `truthPacket`
   - owner module: `utils/parent-copilot/truth-packet-v1.js`
   - forbidden: generating new inference beyond contracts

5. **conversation_state_read**
   - input: session id
   - output: `conversationState`
   - owner module: `utils/parent-copilot/session-memory.js`
   - forbidden: cross-session profile pull

6. **response_plan_build**
   - input: intent + truthPacket + conversationState
   - output: `responsePlan`
   - owner module: `utils/parent-copilot/conversation-planner.js`
   - forbidden: disallowed action family planning

7. **answer_generation**
   - input: responsePlan
   - output: `draftAnswer`
   - owner module: `utils/parent-copilot/answer-composer.js`
   - forbidden: claim not in `responsePlan.allowedClaims`

8. **guardrail_validation**
   - input: draftAnswer + truthPacket + policies
   - output: `validatorResult`
   - owner module: `utils/parent-copilot/guardrail-validator.js`
   - forbidden: hard fail pass-through

9. **deterministic_fallback_if_needed**
   - input: validatorResult + truthPacket
   - output: `safeAnswer`
   - owner module: `utils/parent-copilot/fallback-templates.js`
   - forbidden: returning invalid draft unchanged

10. **followup_selection**
    - input: validated answer + intent + state
    - output: `suggestedFollowUp` or `none`
    - owner module: `utils/parent-copilot/followup-engine.js`
    - forbidden: generic unrelated follow-up

11. **ui_payload_render**
    - input: final answer packet
    - output: `ParentCopilotResponseV1`
    - owner module: `utils/parent-copilot/render-adapter.js`
    - forbidden: PDF/layout mutation outside copilot shell

## 4. Exact Response Contract

```ts
type Audience = "parent" | "teacher";
type ScopeType = "topic" | "subject" | "executive";
type Intent =
  | "understand_observation"
  | "understand_meaning"
  | "action_today"
  | "action_tomorrow"
  | "action_week"
  | "avoid_now"
  | "advance_or_hold"
  | "explain_to_child"
  | "ask_teacher"
  | "uncertainty_boundary";

type AnswerBlockType =
  | "observation"
  | "meaning"
  | "next_step"
  | "caution"
  | "uncertainty_reason";

type ParentCopilotResponseV1 = {
  schemaVersion: "v1";
  audience: "parent"; // v1 lock
  resolutionStatus: "resolved" | "clarification_required";
  clarificationQuestionHe?: string;
  scopeType?: ScopeType;
  scopeId?: string;
  scopeLabel?: string;
  intent: Intent;
  answerBlocks: Array<{
    type: AnswerBlockType;
    textHe: string;
    source: "contract_slot" | "composed";
  }>;
  suggestedFollowUp: {
    kind: "question";
    family:
      | "action_today"
      | "action_week"
      | "avoid_now"
      | "advance_or_hold"
      | "explain_to_child"
      | "ask_teacher"
      | "uncertainty_boundary";
    textHe: string;
    reasonCode: string;
  } | null;
  quickActions: Array<{
    id:
      | "qa_action_today"
      | "qa_action_week"
      | "qa_avoid_now"
      | "qa_advance_or_hold"
      | "qa_explain_to_child"
      | "qa_ask_teacher";
    labelHe: string;
    enabled: boolean;
    sourceContract:
      | "contractsV1.recommendation"
      | "contractsV1.readiness"
      | "contractsV1.confidence"
      | "contractsV1.narrative"
      | "contractsV1.decision";
    validatorCompatible: boolean;
    disabledReasonCode?:
      | "ineligible_recommendation"
      | "cap_blocked"
      | "readiness_blocked"
      | "confidence_blocked"
      | "validator_blocked"
      | "scope_not_applicable";
  }>;
  validatorStatus: "pass" | "fail";
  validatorFailCodes: string[];
  fallbackUsed: boolean;
  contractSourcesUsed: Array<
    | "contractsV1.evidence"
    | "contractsV1.decision"
    | "contractsV1.readiness"
    | "contractsV1.confidence"
    | "contractsV1.recommendation"
    | "contractsV1.narrative"
  >;
  conversationStateDelta: {
    addedIntent: Intent;
    addedScope: string;
    addedFollowUpFamily?: string;
    repeatedPhraseHits: number;
  };
};
```

### Required fields
- all root fields are required except:
  - nullable `suggestedFollowUp`
  - branch-specific scope fields (`scopeType`, `scopeId`, `scopeLabel`)
  - `clarificationQuestionHe` (required only in clarification branch)

### Optional fields
- `clarificationQuestionHe` only when `resolutionStatus="clarification_required"`
- `quickActions[].disabledReasonCode` when `enabled=false`
- `conversationStateDelta.addedFollowUpFamily` when follow-up exists

### Branch-specific contract by `resolutionStatus`
- **Branch A — `resolutionStatus="resolved"`**
  - `scopeType` is required
  - `scopeId` is required and non-empty
  - `scopeLabel` is required and non-empty
  - `answerBlocks.length >= 2`
  - at least one of `observation|meaning` must exist
  - `contractSourcesUsed` must include `contractsV1.narrative`
  - `suggestedFollowUp` may be non-null (policy-dependent)
  - `quickActions` allowed, but only by contract-bound + validator-compatible policy
- **Branch B — `resolutionStatus="clarification_required"`**
  - `scopeType`, `scopeId`, `scopeLabel` are optional and must not be consumed downstream
  - `clarificationQuestionHe` is required
  - `answerBlocks` must be an empty array
  - `contractSourcesUsed` must be an empty array
  - `suggestedFollowUp` must be `null`
  - `quickActions` must be an empty array
  - `fallbackUsed` must be `false`
  - no requirement to include `contractsV1.narrative`

### Validation rules
- `audience` must be `"parent"` in v1
- `resolutionStatus` must be set explicitly on every response
- if `resolutionStatus="resolved"`: `scopeType` is required
- if `resolutionStatus="resolved"`: `scopeId` and `scopeLabel` are required and non-empty
- if `resolutionStatus="resolved"`: `answerBlocks.length >= 2`
- if `resolutionStatus="resolved"`: at least one of `observation|meaning` present
- if `resolutionStatus="resolved"` and `fallbackUsed=true`: all blocks must be `source="contract_slot"`
- if `resolutionStatus="resolved"`: `contractSourcesUsed` must include `contractsV1.narrative`
- each quick action must include `sourceContract` and `validatorCompatible`
- if `resolutionStatus="resolved"`: quick action can be `enabled=true` only if contract state allows it and `validatorCompatible=true`
- clarifying question is allowed only when `resolutionStatus="clarification_required"`
- if `resolutionStatus="clarification_required"`: `suggestedFollowUp` must be `null` and `quickActions` must be empty
- if `resolutionStatus="clarification_required"`: `answerBlocks` and `contractSourcesUsed` must be empty arrays
- if `resolutionStatus="clarification_required"`: `fallbackUsed` must be `false`
- if `resolutionStatus="clarification_required"` and scope fields are present: they are informational only and must not drive any downstream logic

### Forbidden states
- `validatorStatus="pass"` with hard fail codes
- non-null follow-up with empty text
- `audience="teacher"` in Phase A runtime
- quick action enabled by heuristic only (no contract source)
- quick action `enabled=true` while `validatorCompatible=false`
- `resolutionStatus="clarification_required"` with missing `clarificationQuestionHe`
- `resolutionStatus="clarification_required"` together with non-empty `quickActions`
- `resolutionStatus="clarification_required"` together with non-null `suggestedFollowUp`
- `resolutionStatus="clarification_required"` together with non-empty `answerBlocks`
- `resolutionStatus="clarification_required"` together with non-empty `contractSourcesUsed`
- `resolutionStatus="clarification_required"` together with `fallbackUsed=true`
- `resolutionStatus="resolved"` with missing/empty `scopeId`
- `resolutionStatus="resolved"` with missing/empty `scopeLabel`
- consuming `scopeType|scopeId|scopeLabel` for downstream decisioning when `resolutionStatus="clarification_required"`

## 4A. Exact TruthPacketV1 Schema (Lock 3)

```ts
type TruthPacketV1 = {
  schemaVersion: "v1";
  audience: "parent";
  scopeType: "topic" | "subject" | "executive";
  scopeId: string;
  scopeLabel: string;
  contracts: {
    evidence: unknown;
    decision: unknown;
    readiness: unknown;
    confidence: unknown;
    recommendation: unknown;
    narrative: unknown;
  };
  derivedLimits: {
    cannotConcludeYet: boolean;
    recommendationEligible: boolean;
    recommendationIntensityCap: "RI0" | "RI1" | "RI2" | "RI3";
    readiness: "insufficient" | "forming" | "ready" | "emerging";
    confidenceBand: "low" | "medium" | "high";
  };
  surfaceFacts: {
    questions: number;
    accuracy: number;
    displayName: string;
    subjectLabelHe: string;
    relevantSummaryLines: string[];
  };
  allowedClaimEnvelope: {
    wordingEnvelope: "WE0" | "WE1" | "WE2" | "WE3" | "WE4";
    allowedSections: Array<"summary" | "finding" | "recommendation" | "limitations">;
    forbiddenPhrases: string[];
    requiredHedges: string[];
  };
  allowedFollowupFamilies: Array<
    | "action_today"
    | "action_week"
    | "avoid_now"
    | "advance_or_hold"
    | "explain_to_child"
    | "ask_teacher"
    | "uncertainty_boundary"
  >;
  forbiddenMoves: string[];
};
```

### TruthPacketV1 implementation lock
- `TruthPacketV1 is the first implementation artifact of Phase A`.
- No independent truth building is allowed downstream.
- All downstream modules must consume the same `TruthPacketV1` instance:
  - `conversation-planner`
  - `answer-composer`
  - `followup-engine`
  - `guardrail-validator`
  - `render-adapter`

### Canonical ownership of TruthPacketV1
- Canonical owner and builder: `utils/parent-copilot/truth-packet-v1.js`
- Helper modules (internal dependency only, not owners):
  - `utils/parent-copilot/contract-reader.js`
  - `utils/parent-copilot/scope-resolver.js`
- Forbidden:
  - duplicate truth construction in any other module
  - treating `contract-reader.js` as a second truth-packet owner

## 5. Exact Follow-up Contract

### Input schema
```ts
type FollowupInputV1 = {
  audience: "parent";
  intent: Intent;
  scopeType: ScopeType;
  truthPacket: {
    cannotConcludeYet: boolean;
    readiness: "insufficient" | "forming" | "ready" | "emerging";
    confidenceBand: "low" | "medium" | "high";
    recommendationEligible: boolean;
    recommendationIntensityCap: "RI0" | "RI1" | "RI2" | "RI3";
  };
  conversationState: {
    priorIntents: Intent[];
    priorFollowupFamilies: string[];
    repeatedPhraseHits: number;
  };
};
```

### Output schema
```ts
type FollowupOutputV1 = {
  selected: {
    family:
      | "action_today"
      | "action_week"
      | "avoid_now"
      | "advance_or_hold"
      | "explain_to_child"
      | "ask_teacher"
      | "uncertainty_boundary";
    textHe: string;
    reasonCode:
      | "coverage_gap_today"
      | "coverage_gap_week"
      | "risk_prevention_needed"
      | "advance_check_relevant"
      | "communication_support_relevant"
      | "uncertainty_explain_needed";
  } | null;
  candidateFamiliesRanked: string[];
  noneReasonCode?: "no_useful_next_step" | "repetition_block" | "scope_closed";
};
```

### Policy matrix (selection)
- if `recommendationEligible=false` or cap `RI0`: prefer `avoid_now` or `uncertainty_boundary`
- if readiness in `ready|forming` and confidence not low: allow `action_today|action_week|advance_or_hold`
- if current intent is action: next prefer `explain_to_child` or `ask_teacher`
- if repetitive risk high: force family diversification

### Forbidden follow-ups by state
- certainty-escalation follow-up when `cannotConcludeYet=true`
- repeated same family if shown in last 2 turns and repetition score high
- topic-specific follow-up on executive scope without topic anchor

## 5A. Quick Actions Contract-Bound Policy (Lock 2)
- Every quick action/chip must be derived from contracts + validator only.
- Free heuristic enablement is forbidden.
- Quick action must be hidden/disabled when any relevant state blocks:
  - recommendation ineligible
  - intensity cap does not permit action family
  - readiness/confidence/state disallows action
  - validator marks incompatibility
- Every quick action must carry:
  - source contract basis (`sourceContract`)
  - explicit enable/disable reason code
  - validator compatibility bit
- Quick action rendering is rejected by validator if any required quick-action metadata is missing.

## 6. Intent-to-Scope Resolution Policy
- choose **topic** when user mentions topic or clicked topic card entry
- choose **subject** when question is subject-wide planning/action
- choose **executive** when question is global priority/overall status
- generic question with many topics:
  - answer at executive scope with one explicit anchor
  - suggest drill-down follow-up to one topic
- default scope order:
  - selected topic
  - current subject section
  - executive
- if selected context exists:
  - must answer from selected context (no clarifying question)
- if no selected context but executive fallback is available:
  - must answer from executive fallback (no clarifying question)
- clarifying question is allowed only when no reasonable scope exists at all
- clarifying question must never be default behavior in v1

## 7. Intent Policy Matrix

- `understand_observation`
  - required contracts: evidence, narrative
  - allowed shape: observation + meaning
  - forbidden phrasing: certainty/diagnosis
  - allowed follow-ups: action_today, uncertainty_boundary
  - disallowed follow-ups: advance_or_hold when RI0/ineligible
  - no-action condition: recommendation ineligible
  - uncertainty escalation: confidence low

- `understand_meaning`
  - required: decision, readiness, confidence, narrative
  - allowed shape: observation + meaning + caution
  - forbidden: diagnostic labeling
  - allowed follow-ups: action_week, uncertainty_boundary

- `action_today` / `action_tomorrow` / `action_week`
  - required: recommendation, readiness, narrative
  - allowed shape: next_step + caution
  - forbidden: beyond cap intensity
  - allowed follow-ups: avoid_now, explain_to_child
  - no-action condition: RI0 or ineligible

- `avoid_now`
  - required: recommendation + narrative limitations
  - allowed shape: caution + uncertainty_reason
  - forbidden: new risk class invention
  - allowed follow-up: action_week

- `advance_or_hold`
  - required: decision, readiness, confidence, recommendation
  - allowed shape: meaning + uncertainty_reason
  - forbidden: promote-now certainty under low readiness
  - allowed follow-ups: uncertainty_boundary, action_week

- `explain_to_child`
  - required: narrative + recommendation constraints
  - allowed shape: short explanation + practical line
  - forbidden: clinical/labeling phrasing
  - allowed follow-up: ask_teacher

- `ask_teacher`
  - required: uncertainty boundary + scoped anchor
  - allowed shape: one teacher-question draft
  - forbidden: teacher diagnosis directives
  - allowed follow-up: action_week

- `uncertainty_boundary`
  - required: decision, readiness, confidence, narrative
  - allowed shape: what-not-clear + why + safe next step
  - forbidden: empty “monitor only” close
  - allowed follow-up: action_today or none

## 8. Anti-Generic Enforcement

### Generic-answer fail conditions
- no scoped anchor
- no contract-derived statement
- no actionable/no-action rationale
- filler-only closing

### Specificity minimum requirements
- one scope anchor
- one contract-grounded claim
- one concrete instruction or explicit no-action rationale

### Repetition fail conditions
- same closing template in 2 consecutive turns
- same 4+ token phrase repeated >2 times in last 3 turns

### Empty-closing fail conditions
- ends with broad “continue monitoring” phrase without target

### Filler blacklist
- `כדאי להמשיך לעקוב`
- `נראה בסדר באופן כללי`
- `הכול תלוי בהמשך`
- `נמשיך ונראה`

### Validator pass/fail scoring
- `specificityScore` pass if `>=70`
- `alignmentScore` pass if `>=85`
- any hard fail code -> fail

### Deterministic fallback trigger
- any hard fail, or specificity below threshold, or contract contradiction

## 9. Conversation Memory Contract

```ts
type ParentCopilotSessionMemoryV1 = {
  schemaVersion: "v1";
  sessionId: string;
  startedAtMs: number;
  updatedAtMs: number;
  priorIntents: Intent[];
  priorScopes: Array<{ scopeType: ScopeType; scopeId: string }>;
  priorFollowupsShown: string[];
  clickedFollowups: string[];
  repeatedPhraseLedger: Array<{ phrase: string; hitCount: number }>;
  answeredConstraints: string[];
};
```

### Limits
- max intents: 20
- max scopes: 20
- max phrase ledger items: 30

### TTL / boundary
- same-session only
- reset after 60 minutes idle or report leave

### Not stored
- cross-session memory
- unrelated personal details

### Memory effect on next answer
- demote repeated follow-up families
- avoid repeating already answered constraints unless user insists

## 10. Guardrail Validator Contract

```ts
type ValidatorFailCode =
  | "fail_contract_contradiction"
  | "fail_overclaiming"
  | "fail_beyond_recommendation_cap"
  | "fail_generic_answer"
  | "fail_missing_scoped_anchor"
  | "fail_repeated_phrasing"
  | "fail_invalid_followup"
  | "fail_wrong_audience_tone";

type ValidatorResultV1 = {
  status: "pass" | "fail";
  failCodes: ValidatorFailCode[];
  severity: "low" | "medium" | "high" | "critical";
  fallbackRequired: boolean;
};
```

### Validation checks
- contradiction with contracts
- overclaiming readiness/confidence
- recommendation beyond cap
- generic answer
- missing scope anchor
- repeated phrasing
- invalid follow-up family
- wrong audience tone

### Source of truth
- `contractsV1.*` on scoped report context
- locked tone/anti-generic policy in this plan

### Fallback behavior
- replace with deterministic contract-slot response
- keep scope/intent metadata
- mark `fallbackUsed=true` and include fail codes

## 11. Parent Tone Contract

### Tone goals
- natural, calm, clear, helpful, respectful

### Tone limits
- no patronizing or robotic tone
- no diagnosis language
- no false certainty

### Phrase blacklist
- `בוודאות מלאה`
- `חד משמעית`
- `ללא ספק בכלל`
- `יש לילד בעיה`
- `זו אבחנה ברורה`

### Allowed phrase families
- `מה רואים כרגע`
- `מה זה אומר בשלב זה`
- `מה נכון לעשות עכשיו`
- `ממה כדאי להימנע כרגע`

### Warm without fake rule
- one empathy line max + concrete guidance line

### Useful without template-like rule
- each answer must include scoped context + concrete next step/no-step

### Weak evidence style
- explicit caution + explicit missing evidence

### Strong evidence style
- clear actionable phrasing without absolutes

### No-action allowed style
- explicit “why no escalation now” + safe alternative

## 12. Dual-Audience Architecture — Locked

### Shared core
- contracts truth reader
- intent safety
- validator
- contradiction checks
- follow-up decision framework

### Separate surface
- wording templates
- answer framing
- follow-up matrix
- quick actions
- UI entry points

### Audience parameter
- architecture supports `audience = parent | teacher`
- **v1 runtime lock:** `audience=parent` only

### Teacher future path
- teacher layer will reuse shared core and add teacher-specific surface pack
- no teacher implementation in Phase A

## 13. Exact File-Level Plan for Phase A

### New files
- `utils/parent-copilot/truth-packet-v1.js`
- `utils/parent-copilot/contract-reader.js`
- `utils/parent-copilot/scope-resolver.js`
- `utils/parent-copilot/intent-resolver.js`
- `utils/parent-copilot/conversation-planner.js`
- `utils/parent-copilot/answer-composer.js`
- `utils/parent-copilot/followup-engine.js`
- `utils/parent-copilot/guardrail-validator.js`
- `utils/parent-copilot/fallback-templates.js`
- `utils/parent-copilot/session-memory.js`
- `utils/parent-copilot/render-adapter.js`
- `utils/parent-copilot/index.js`
- `components/parent-copilot/parent-copilot-shell.jsx`
- `components/parent-copilot/parent-copilot-panel.jsx`
- `components/parent-copilot/parent-copilot-quick-actions.jsx`
- `scripts/parent-copilot-phaseA-suite.mjs`

### Modified files
- `pages/learning/parent-report-detailed.js`
- `components/parent-report-detailed-surface.jsx`
- `package.json`
- `.github/workflows/parent-report-tests.yml`
- `docs/full-test-matrix.md`

### No-touch files
- `utils/contracts/parent-report-contracts-v1.js`
- `utils/contracts/decision-readiness-contract-v1.js`
- `utils/contracts/recommendation-contract-v1.js`
- `utils/contracts/narrative-contract-v1.js`
- `utils/minimal-safe-scope-enforcement.js`
- `utils/topic-next-step-engine.js`
- `utils/diagnostic-engine-v2/**`
- `pages/learning/parent-report.js`
- PDF/layout generation files

### Strategy
- wrapper-first modules under `utils/parent-copilot/*`
- minimal integration hooks only
- no broad rewrite

### TruthPacket ownership and consumption (Lock 3)
- `utils/parent-copilot/truth-packet-v1.js`
  - owns `TruthPacketV1` schema/runtime builder
  - is the single entry for truth packet construction
- `utils/parent-copilot/contract-reader.js`
  - helper-only dependency for normalized contract extraction
  - not a canonical owner of `TruthPacketV1`
- consumers (must consume packet, must not rebuild truth independently):
  - `utils/parent-copilot/conversation-planner.js`
  - `utils/parent-copilot/answer-composer.js`
  - `utils/parent-copilot/followup-engine.js`
  - `utils/parent-copilot/guardrail-validator.js`
  - `utils/parent-copilot/render-adapter.js`
- forbidden:
  - any independent truth derivation in consumer modules
  - UI module reading raw contracts directly for answer logic

## 14. Phase A Acceptance Criteria
- [ ] no generic answer on approved scenarios
- [ ] no contradiction with contracts
- [ ] minimum one scoped anchor per answer
- [ ] one valid follow-up or explicit none
- [ ] no recommendation/action beyond cap
- [ ] deterministic fallback works on validator fail
- [ ] no existing report layout change
- [ ] no PDF impact
- [ ] parent-only mode locked
- [ ] no clarifying question when selected context or executive fallback exists
- [ ] every quick action is contract-bound and validator-compatible
- [ ] `TruthPacketV1` implemented first and consumed by all downstream modules (no independent truth builds)
- [ ] clarifying response mode is contract-defined (`resolutionStatus`) and only allowed when no reasonable scope exists
- [ ] `resolutionStatus="clarification_required"` always has `clarificationQuestionHe`, no follow-up, and no quick actions
- [ ] `resolutionStatus="clarification_required"` always has empty `answerBlocks`, empty `contractSourcesUsed`, and `fallbackUsed=false`
- [ ] `resolutionStatus="resolved"` always has non-empty `scopeType/scopeId/scopeLabel`
- [ ] clarification branch does not require resolved scope and does not feed scope into downstream logic
- [ ] resolved branch enforces narrative-backed contract source requirements without leaking into clarification branch

## 15. Phase A QA Suite

### Mandatory scenario categories
- generic-answer tests
- contradiction tests
- weak-evidence restraint tests
- no-step-allowed tests
- follow-up relevance tests
- repeated-answer tests
- session continuity tests
- audience-lock tests
- clarifying-question suppression tests
- clarifying-response-contract tests (`resolutionStatus`, `clarificationQuestionHe`, empty answerBlocks, empty contractSourcesUsed, null follow-up, empty quickActions, fallbackUsed=false)
- scope-branch tests (`resolved` requires non-empty scope fields; clarification branch allows missing scope and blocks downstream scope consumption)
- resolved-branch-contract tests (`answerBlocks>=2`, `observation|meaning`, narrative in `contractSourcesUsed`)
- quick-action contract/validator compatibility tests
- truth-packet-first dependency tests
- truth-packet canonical-ownership tests (single owner path only)
- regression tests for existing report surfaces

### Expected pass/fail behavior
- any hard validator fail code => test fail
- fallback path must pass deterministic alignment checks
- audience lock breach => test fail

### Mandatory pre-release test gates
- `npm run test:parent-copilot-phaseA`
- `npm run test:parent-report-phase6`
- `npm run test:minimal-safe-scope`
- `npm run test:diagnostic-engine-v2-harness`

## 16. Rollout / Safety / Flag Plan
- feature flag: `parentCopilotV1Enabled`
- gate location: copilot mount path in `pages/learning/parent-report-detailed.js`
- parent-only entry gating: require `audience=parent`
- invalid response behavior: deterministic fallback + fail code logging
- rollback trigger: sustained validator hard-fail/contradiction rate above threshold
- comparison strategy: flag-on cohort vs report-only baseline (no report content mutation)

## 17. Phase B / C Boundaries
- **Phase B**
  - smarter follow-up ranking
  - improved memory-driven de-dup
  - richer continuity behavior
- **Phase C**
  - richer parent coaching packs
  - expanded script variants
  - deeper within-session personalization
- **Not in Phase A because**
  - Phase A is safety/boundary lock baseline

## 18. Final Recommendation
- Phase A is now defined hermetically enough to start implementation after approval.
- Approval now will authorize only:
  - parent-only runtime
  - locked contracts and validator/fallback flow
  - exact Phase A file map and mandatory QA/rollout gates
- Approval will not authorize:
  - teacher runtime/UI
  - cross-session memory
  - autonomous planning or scope expansion beyond Phase A
