---
name: p0_parent_stack_remediation
overview: Implement only the audited P0 blockers for parent-report and parent-copilot, with minimal targeted edits, deterministic-path stability, and CI-enforced safety gates before any LLM enablement.
todos:
  - id: p0-scope-clarification
    content: Patch scope resolver to clarification-first for weak/ambiguous non-aggregate inputs and add phaseA regression tests.
    status: pending
  - id: p0-llm-gate-hardening
    content: Enforce deterministic-default LLM gating, strengthen async validator checks, and add async LLM CI suite.
    status: pending
  - id: p0-label-fallback-safety
    content: Replace raw step/intervention fallback strings with safe Hebrew defaults and add fallback safety tests.
    status: pending
  - id: p0-taxonomy-fallback-tighten
    content: Tighten weak taxonomy fallback assignment logic in diagnostic-engine-v2 and extend harness coverage.
    status: pending
  - id: p0-telemetry-persistence
    content: Add bounded telemetry persistence store with required trace fields and test suite; wire to CI.
    status: pending
  - id: p0-ci-wiring
    content: Add new P0 scripts to package.json and parent-report workflow while preserving current suite ordering.
    status: pending
isProject: false
---

# P0 Remediation Plan (Execution Only)

## 1. P0 implementation strategy

- Apply **targeted, minimal-surface patches** only in runtime policy files, diagnostics policy, label helpers, and CI/workflow scripts.
- Keep deterministic runtime semantics stable except where required by P0 behavior corrections.
- **Locked execution sequence (must follow):** `P0-1 -> P0-2 -> P0-3 -> P0-4 -> P0-5`.
- Introduce safety changes in this order to minimize churn:
  1) ambiguous scope clarification policy,
  2) LLM hard-disable policy + async test/CI guardrails,
  3) raw label fallback sanitization,
  4) taxonomy weak-fallback tightening,
  5) telemetry persistence + traceability fields.
- Preserve existing passing suites by adding **new narrow tests** first, then implementing code changes to satisfy them.
- No UI redesign, no broad refactor, no payload architecture rewrite.

### Locked clarifications before implementation

1. **Telemetry persistence scope (temporary):**
   - `localStorage` telemetry store is a **temporary internal/beta trace mechanism only** for P0.
   - It is **not** the final broad-rollout observability architecture.
   - Broad rollout still requires server-side/event-pipeline observability.

2. **LLM policy for P0 (OFF in practice):**
   - During this P0 phase, LLM path remains **OFF in practice**.
   - P0 work only hardens gates, validators, tests, and kill-switch behavior.
   - No experimental parent-facing enablement in this phase.

3. **Taxonomy weak-evidence replacement behavior (deterministic):**
   - When weak evidence criteria are met, runtime must produce:
     - `taxonomyId = null` (no taxonomy assignment),
     - explicit unclassified state (e.g. `unclassified_weak_evidence` in internal unit state),
     - probe/uncertainty-oriented output only (no strong diagnosis labeling).
   - This replaces ambiguous low-threshold taxonomy fallback.

---

## 2. File-by-file change plan

### P0-1: Scope ambiguity clarification-first (no executive fallback on ambiguity)
- Edit: [`utils/parent-copilot/scope-resolver.js`](utils/parent-copilot/scope-resolver.js)
  - Likely functions: `resolveScope`, `matchTopicFromUtterance`, `matchSubjectFromUtterance`
  - Change: replace low-confidence fallback `executive_fallback` branch with `clarification_required` when utterance lacks confident scope anchor.
  - Keep: selected-context success path, explicit aggregate-class executive path, existing anchor checks.
- Edit tests: [`scripts/parent-copilot-phaseA-suite.mjs`](scripts/parent-copilot-phaseA-suite.mjs)
  - Add cases that previously resolved to executive fallback and must now return clarification.
- Edit tests (if needed for matrix assumptions): [`scripts/parent-copilot-executive-answer-safe-matrix.mjs`](scripts/parent-copilot-executive-answer-safe-matrix.mjs)
  - Ensure executive semantic matrix still uses aggregate-class queries and remains resolved.

### P0-2: LLM disabled-by-policy OR strict enablement gate
- Edit: [`utils/parent-copilot/rollout-gates.js`](utils/parent-copilot/rollout-gates.js)
  - Likely functions: `canUseLlmPath`, `evaluateKpiGate`
  - Change: enforce hard default deterministic mode unless explicit enable gate + strict preconditions.
- Edit: [`utils/parent-copilot/llm-orchestrator.js`](utils/parent-copilot/llm-orchestrator.js)
  - Likely functions: `validateLlmDraft`, `buildGroundedPrompt`, `maybeGenerateGroundedLlmDraft`
  - Change: strengthen validation contract (block types + stricter per-block requirements + stronger hedge/forbidden checks); no free-form bypass.
- Edit: [`utils/parent-copilot/index.js`](utils/parent-copilot/index.js)
  - Likely function: `runParentCopilotTurnAsync`
  - Change: enrich telemetry reasons for LLM rejection; ensure deterministic fallback is preserved and explicit.
  - P0 enforcement: async path hardening is implemented, but rollout policy remains OFF in practice.
- Add tests: new script [`scripts/parent-copilot-async-llm-gate-suite.mjs`](scripts/parent-copilot-async-llm-gate-suite.mjs)
  - Cover disabled default, enable flag path, invalid JSON, invalid blocks, validator reject => deterministic response.
- CI wiring: [`package.json`](package.json), [`.github/workflows/parent-report-tests.yml`](.github/workflows/parent-report-tests.yml)

### P0-3: Remove raw string fallback leakage in labels
- Edit: [`utils/topic-next-step-phase2.js`](utils/topic-next-step-phase2.js)
  - Likely functions: `stepLabelHe`, intervention label mapping helper(s) around `INTERVENTION_TYPE_LABEL_HE` usage.
  - Change: replace `String(step)` / raw fallback with safe Hebrew default labels (non-internal, parent-safe).
- Optional guard edit (if surfaced elsewhere): [`utils/parent-report-ui-explain-he.js`](utils/parent-report-ui-explain-he.js)
  - Ensure unknown diagnosis/behavior fallback remains parent-safe and non-clinical/systemic.
- Add tests: extend [`scripts/parent-report-hebrew-language-selftest.mjs`](scripts/parent-report-hebrew-language-selftest.mjs) and/or add focused script [`scripts/parent-report-label-fallback-safety-suite.mjs`](scripts/parent-report-label-fallback-safety-suite.mjs)

### P0-4: Tighten taxonomy weak fallback criteria
- Edit: [`utils/diagnostic-engine-v2/run-diagnostic-engine-v2.js`](utils/diagnostic-engine-v2/run-diagnostic-engine-v2.js)
  - Likely function: `runDiagnosticEngineV2`
  - Change: replace weak fallback assignment with deterministic unclassified behavior:
    - no taxonomy id assignment under weak-evidence fallback conditions,
    - explicit unclassified marker on unit state,
    - probe/uncertainty-oriented output path.
- Edit (if policy split is preferred): [`utils/diagnostic-engine-v2/recurrence.js`](utils/diagnostic-engine-v2/recurrence.js)
  - Add helper for explicit fallback eligibility condition.
- Add tests: [`scripts/diagnostic-engine-v2-harness.mjs`](scripts/diagnostic-engine-v2-harness.mjs)
  - Add sparse/weak evidence scenario asserting:
    - no taxonomy id,
    - explicit unclassified state,
    - probe/uncertainty behavior.

### P0-5: Telemetry persistence and answer traceability
- Edit: [`utils/parent-copilot/turn-telemetry.js`](utils/parent-copilot/turn-telemetry.js)
  - Add stable trace fields for path diagnosis (classifier result, scope reason, fallback reason codes, generation-path branch outcomes).
- Edit: [`utils/parent-copilot/index.js`](utils/parent-copilot/index.js)
  - Persist telemetry event via minimal local trace store call after response finalization.
- Add new file: [`utils/parent-copilot/telemetry-store.js`](utils/parent-copilot/telemetry-store.js)
  - Browser-safe append/read ring buffer in localStorage with bounded size and schema version.
- Add tests: new script [`scripts/parent-copilot-telemetry-trace-suite.mjs`](scripts/parent-copilot-telemetry-trace-suite.mjs)
  - Validate trace persistence semantics, bounded retention, and required fields when fallback/clarification occur.

---

## 3. Exact behavior changes

### P0-1 Scope resolver
- Must change:
  - Non-anchored, non-aggregate ambiguous/weak utterances return `resolutionStatus: "clarification_required"` (not resolved executive fallback).
- Must NOT change:
  - Aggregate-class questions still resolve executive.
  - Valid selected topic/subject behavior.

### P0-2 LLM gating/validators
- Must change:
  - Default behavior remains deterministic unless explicit opt-in gates pass.
  - Async path rejects weak/underspecified model output and falls back deterministically with explicit telemetry reason.
- Must NOT change:
  - Sync deterministic `runParentCopilotTurn` behavior.
  - Existing validated deterministic answer composition contract.

### P0-3 Label fallbacks
- Must change:
  - Unknown `step`/`intervention` values map to safe Hebrew fallback text only.
- Must NOT change:
  - Known mappings and existing parent wording for valid enums.

### P0-4 Taxonomy fallback criteria
- Must change:
  - Prevent assigning taxonomy from weak fallback condition alone.
  - Weak evidence path must produce explicit unclassified state + probe/uncertainty-only wording.
- Must NOT change:
  - High-confidence, recurrence-backed taxonomy assignments.
  - Output gating contract shape.

### P0-5 Telemetry persistence
- Must change:
  - Every turn writes traceable telemetry record (bounded storage) with path reason fields.
  - Scope is temporary internal/beta trace solution only.
- Must NOT change:
  - Parent-facing message content.
  - Deterministic decision outputs.

---

## 4. Risk of each change

- **P0-1 Risk:** medium
  - Possible increase in clarification responses for borderline questions.
  - Mitigation: narrow rule to low-confidence/no-anchor only; preserve aggregate and selected-context priority.

- **P0-2 Risk:** low-to-medium
  - Async path may reject more model outputs, increasing deterministic fallback frequency.
  - Mitigation: explicit telemetry and targeted async tests.

- **P0-3 Risk:** low
  - Minimal behavior surface; primarily fallback wording safety.
  - Mitigation: regression tests for known mapped labels.

- **P0-4 Risk:** medium
  - Could reduce diagnosis coverage in sparse data scenarios.
  - Mitigation: ensure probe/intervention gating remains informative; add scenario tests.

- **P0-5 Risk:** low
  - Storage quota/serialization edge cases in browser contexts.
  - Mitigation: bounded ring buffer, best-effort writes, non-blocking failure handling.

---

## 5. Required tests per change

- **P0-1**
  - Add/extend scope tests in [`scripts/parent-copilot-phaseA-suite.mjs`](scripts/parent-copilot-phaseA-suite.mjs):
    - ambiguous utterance => clarification
    - weak utterance without anchor => clarification
    - aggregate utterance => resolved executive (unchanged)

- **P0-2**
  - New async suite [`scripts/parent-copilot-async-llm-gate-suite.mjs`](scripts/parent-copilot-async-llm-gate-suite.mjs):
    - LLM disabled default
    - enabled + invalid JSON
    - enabled + invalid shape
    - enabled + validator fail
    - enabled + valid output => accepted only if strict checks pass

- **P0-3**
  - Fallback label safety tests in [`scripts/parent-report-hebrew-language-selftest.mjs`](scripts/parent-report-hebrew-language-selftest.mjs) or dedicated suite:
    - unknown step key emits safe Hebrew fallback, not raw token
    - unknown intervention key emits safe Hebrew fallback

- **P0-4**
  - Extend [`scripts/diagnostic-engine-v2-harness.mjs`](scripts/diagnostic-engine-v2-harness.mjs):
    - weak evidence scenario must not force taxonomy id
    - strong recurrence scenario still assigns taxonomy

- **P0-5**
  - New telemetry trace suite [`scripts/parent-copilot-telemetry-trace-suite.mjs`](scripts/parent-copilot-telemetry-trace-suite.mjs):
    - writes trace event
    - includes reason fields (`scopeReason`, generation path, fallback reasons)
    - bounded retention behavior

---

## 6. CI updates required

- Update [`package.json`](package.json) scripts with:
  - `test:parent-copilot-async-llm-gate`
  - `test:parent-copilot-telemetry-trace`
  - (optional) `test:parent-report-label-fallback-safety` if separate file is used
- Update [`.github/workflows/parent-report-tests.yml`](.github/workflows/parent-report-tests.yml):
  - Run new P0 suites after existing copilot semantic suites and before `next build`.
- Keep existing suites unchanged and required.

---

## 7. Rollout/feature-flag policy

- **Immediate policy:** deterministic-only in all environments unless explicit temporary override for controlled internal validation.
- **P0 lock:** LLM path remains OFF in practice throughout this phase.
- Required enable preconditions for any async/LLM activation:
  1) async LLM suite passing in CI,
  2) strict validator pass-rate threshold agreed,
  3) telemetry trace persistence enabled,
  4) kill-switch (`PARENT_COPILOT_FORCE_DETERMINISTIC=true`) verified.
- Staged rollout:
  - Stage 0: internal deterministic-only
  - Stage 1: internal async shadow (no parent-visible override)
  - Stage 2: limited beta async visible

---

## 8. Definition of done for each P0 item

### P0-1 Done
- `scope-resolver` no longer returns executive fallback for weak non-aggregate/no-anchor utterances.
- New phaseA cases pass.
- Existing semantic matrix remains green.

### P0-2 Done
- Async path strictly gated and reject-safe.
- New async suite passes in CI.
- Deterministic fallback behavior unchanged on async failures.
- LLM remains OFF in practice for this phase (no parent-facing enablement).

### P0-3 Done
- No raw fallback strings for unknown step/intervention in parent-facing outputs.
- Label safety tests pass.

### P0-4 Done
- Weak taxonomy fallback branch replaced with deterministic unclassified behavior.
- Harness proves no taxonomy id assignment under weak evidence and probe/uncertainty-only output.
- Strong evidence assignments still pass.

### P0-5 Done
- Turn telemetry persists with required trace fields and bounded retention.
- Telemetry suite passes and does not alter parent response content.
- Documentation/comments explicitly mark telemetry store as temporary internal/beta trace solution.

---

Key implementation boundaries:
- No broad refactor
- No UI redesign
- No unrelated report surface edits
- Deterministic path remains stable
- Existing passing suites preserved
