---
name: Phase 5 Copilot Safety
overview: Phase 5 hardens Parent Copilot through documentation, explicit safety contracts (no LLM by default, gates unchanged), optional targeted tests for rollout gates and telemetry semantics—without changing parent report assembly, UI, content, or relaxing any gate. Deterministic `runDeterministicCore` + `guardrail-validator` remain authoritative; LLM is an optional post-pass only when env gates allow.
todos:
  - id: readme-parent-copilot
    content: "Add utils/parent-copilot/README.md: env flags, gates, deterministic vs async, forbidden claims summary, test commands"
    status: pending
  - id: jsdoc-index-entry
    content: Expand JSDoc on runParentCopilotTurn / runParentCopilotTurnAsync in index.js (LLM only when gates on; clinical_boundary skips LLM)
    status: pending
  - id: jsdoc-truth-packet-header
    content: "Expand truth-packet-v1.js file header: TruthPacket ownership, allowedClaimEnvelope for composer/LLM"
    status: pending
  - id: jsdoc-guardrail-categories
    content: "Optional: guardrail-validator.js module banner with fail-code categories + pointer to phase5 suite"
    status: pending
  - id: test-default-gate-telemetry
    content: "Add/extend selftest: default env getLlmGateDecision disabled; async turn generationPath deterministic"
    status: pending
  - id: regression-commands
    content: "Run: test:parent-copilot-async-llm-gate, phase4, phase5, executive-answer-safe-matrix (and phase6 if validator prose touched)"
    status: pending
isProject: false
---

# Phase 5 execution package — Copilot safety, documentation, tests

## 1. Current Copilot state

### Deterministic path (source of truth)

- **Entry:** [`runParentCopilotTurn`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/utils/parent-copilot/index.js) → always runs [`runDeterministicCore`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/utils/parent-copilot/index.js) (same core used by async).
- **Flow (resolved turns):** `resolveScope` → Stage A interpretation → [`buildTruthPacketV1`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/utils/parent-copilot/truth-packet-v1.js) → `planConversation` → [`composeAnswerDraft`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/utils/parent-copilot/answer-composer.js) (and aggregate / short-followup branches) → [`validateAnswerDraft`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/utils/parent-copilot/guardrail-validator.js) → on failure [`buildDeterministicFallbackAnswer`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/utils/parent-copilot/fallback-templates.js) or clinical-boundary draft / emergency slot extraction (see `packageParentResolvedEarlyTurn` and main resolved path in [`index.js`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/utils/parent-copilot/index.js)).
- **Final shape:** [`buildResolvedParentCopilotResponse`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/utils/parent-copilot/render-adapter.js) + [`validateParentCopilotResponseV1`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/utils/parent-copilot/guardrail-validator.js); telemetry via [`buildTurnTelemetry`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/utils/parent-copilot/turn-telemetry.js); [`finalizeTurnResponse`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/utils/parent-copilot/index.js) attaches telemetry and [`persistTelemetryBestEffort`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/utils/parent-copilot/telemetry-store.js).

### Async LLM path (optional overlay only)

- **Entry:** [`runParentCopilotTurnAsync`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/utils/parent-copilot/index.js): runs **deterministic core first**; only if `resolutionStatus === "resolved"`, truth packet exists, and utterance non-empty, may call [`maybeGenerateGroundedLlmDraft`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/utils/parent-copilot/llm-orchestrator.js).
- **Gate (hard off by default):** [`getLlmGateDecision`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/utils/parent-copilot/rollout-gates.js) requires **all** of: `PARENT_COPILOT_LLM_ENABLED=true`, `PARENT_COPILOT_LLM_EXPERIMENT=true`, `PARENT_COPILOT_FORCE_DETERMINISTIC` **not** true, `PARENT_COPILOT_ROLLOUT_STAGE` in `{internal,beta,full}`. If any fail, `maybeGenerateGroundedLlmDraft` returns immediately with `reason: "llm_disabled_by_rollout_gate"` and `gateReasonCodes` (no network).
- **LLM pipeline:** `buildGroundedPrompt` (FACTS_JSON from truth packet only) → `callOpenAiCompatible` → [`validateLlmDraft`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/utils/parent-copilot/llm-orchestrator.js) (clinical regex, hedges, forbidden phrases, `next_step` eligibility) → then **again** [`validateAnswerDraft`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/utils/parent-copilot/guardrail-validator.js) + [`validateParentCopilotResponseV1`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/utils/parent-copilot/guardrail-validator.js) on async success path in [`index.js`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/utils/parent-copilot/index.js).
- **UI wiring:** [`components/parent-copilot/parent-copilot-panel.jsx`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/components/parent-copilot/parent-copilot-panel.jsx) prefers `runParentCopilotTurnAsync` when defined (it always is). With gates off, behavior equals deterministic output; **no LLM network** (Phase 5 must not change this panel’s UX—document only).

### Rollout gates

- [`rollout-gates.js`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/utils/parent-copilot/rollout-gates.js): `COPILOT_ROLLOUT_STAGE`, `readKpiThresholds`, `evaluateKpiGate` (KPI gate for rollout quality—separate from `getLlmGateDecision` LLM enablement).
- **Policy comment in code:** “P0 policy: keep LLM OFF in practice unless explicit experiment opt-in” (`llm_experiment_flag_missing`).

### Truth packet

- **Owner:** [`truth-packet-v1.js`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/utils/parent-copilot/truth-packet-v1.js) — `buildTruthPacketV1(payload, scope)`; includes `derivedLimits`, `contracts` (narrative slots, decision, readiness, confidence, recommendation), `allowedClaimEnvelope` (`requiredHedges`, `forbiddenPhrases` + systemic clinical forbidden list for topic/subject/executive), `allowedFollowupFamilies`, `interpretationScope`, etc.
- **Fallback builder:** `buildTruthPacketV1NoAnchoredFallback` when anchors missing (same file).

### Fallback behavior

- **Validator fail (non-clinical):** [`buildDeterministicFallbackAnswer`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/utils/parent-copilot/fallback-templates.js) — narrative contract slots only (`contract_slot` sources).
- **Clinical guardrail fail:** switch to [`buildClinicalBoundaryAnswerDraft`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/utils/parent-copilot/answer-composer.js) with `intent: "clinical_boundary"`.
- **Second-order fail:** emergency minimal blocks from narrative `textSlots`, else `buildDeterministicFallbackAnswer(..., ["emergency_fallback"])`.

### Existing tests (representative)

| Area | Command(s) |
|------|----------------|
| Async LLM gate / no network when disabled | `npm run test:parent-copilot-async-llm-gate` |
| Validator | `npm run test:parent-copilot-phase5` |
| Truth path | `npm run test:parent-copilot-phase4` |
| Hebrew robustness | `npm run test:parent-copilot-phase6` |
| Executive safety matrix | `npm run test:parent-copilot-executive-answer-safe-matrix` |
| Rollout stage bundles | `npm run test:parent-rollout-stage:s2-classifier`, `test:parent-rollout-stage:s3-observability` |
| Broad suites | Many `test:parent-copilot-*` entries in [`package.json`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/package.json) |

There is **no** `README.md` under [`utils/parent-copilot/`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/utils/parent-copilot) today—operator-facing documentation is a clear gap.

---

## 2. Exact gaps (file → risk → fix direction)

| # | File / function | Current behavior | Risk | Fix recommendation |
|---|-----------------|------------------|------|----------------------|
| G1 | [`rollout-gates.js`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/utils/parent-copilot/rollout-gates.js) `getLlmGateDecision` | Correctly disables LLM unless multiple env flags + stage | **Ops confusion** (which flags, order of precedence) | **A:** Add `README.md` in `utils/parent-copilot` listing env vars, default “all off”, and `reasonCodes` semantics; **no logic change**. |
| G2 | [`index.js`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/utils/parent-copilot/index.js) exports | Large surface; safety rules split across validator, orchestrator, truth packet | **Onboarding / review drift** | **A:** Module-level JSDoc on `runParentCopilotTurn` / `runParentCopilotTurnAsync` linking to gates + “deterministic first, LLM optional”. |
| G3 | [`guardrail-validator.js`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/utils/parent-copilot/guardrail-validator.js) vs [`llm-orchestrator.js`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/utils/parent-copilot/llm-orchestrator.js) | Duplicated clinical regex / similar policy | **Drift** if one side updated | **B:** Document “paired change list” in README; **C:** optional future refactor to shared `clinical-surface-patterns.js` (not required for Phase 5 if doc is clear). |
| G4 | [`truth-packet-v1.js`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/utils/parent-copilot/truth-packet-v1.js) header | Long file; envelope rules mid-file | **Consumers miss** `allowedClaimEnvelope` + systemic forbidden list | **A:** Extend file header JSDoc: what fields LLM/deterministic may use; what is forbidden to claim. |
| G5 | Telemetry / `generationPath` | Async path sets `deterministic` whenever LLM skipped or fails; `llm_grounded` only on full pass | **Analytics misread** if docs missing | **B:** Document in README + one assertion in tests that default env yields `generationPath === "deterministic"` from async. |
| G6 | [`parent-copilot-panel.jsx`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/components/parent-copilot/parent-copilot-panel.jsx) | Always uses async entry | None for safety if gates stay | **C:** Out of Phase 5 code scope (UI rule); **document** that async does not imply LLM. |

---

## 3. Phase 5 proposed fixes (prioritized)

### A. Must do now

1. **Operator + engineer README** in [`utils/parent-copilot/README.md`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/utils/parent-copilot/README.md): deterministic vs async, env table, “LLM never on by default”, link to key modules, **explicit list of forbidden claim classes** (mirror validator + LLM clinical policy in prose only).
2. **Entry-point JSDoc** on `runParentCopilotTurn` and `runParentCopilotTurnAsync` in [`index.js`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/utils/parent-copilot/index.js): when LLM may run (all gates), when it returns base response, when `clinical_boundary` short-circuits LLM.
3. **Truth packet file header** expansion in [`truth-packet-v1.js`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/utils/parent-copilot/truth-packet-v1.js): contract ownership, `allowedClaimEnvelope` meaning for composer + LLM.
4. **Tests:** extend [`scripts/parent-copilot-async-llm-gate-suite.mjs`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/scripts/parent-copilot-async-llm-gate-suite.mjs) (or add `scripts/parent-copilot-rollout-gates-selftest.mjs`) to assert **default env** `getLlmGateDecision().enabled === false` and that `runParentCopilotTurnAsync` telemetry `generationPath` is `deterministic` for a minimal synthetic resolved turn (reuse patterns from existing suite).

### B. Should do now

5. **README subsection:** `evaluateKpiGate` vs `getLlmGateDecision` (different purposes—no merging of concepts).
6. **Validator module header** in [`guardrail-validator.js`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/utils/parent-copilot/guardrail-validator.js): single list of fail-code **categories** (clinical / recommendation boundary / internal leak / Hebrew normalization) with pointer to tests (`test:parent-copilot-phase5`, executive matrix).

### C. Defer

7. **Deduplicate** clinical regex between validator and LLM orchestrator into one shared module (touches two hot files—schedule Phase 5b after doc + tests land).
8. **New wrapper** around OpenAI / alternate provider (explicitly forbidden by your rules).
9. **UI** changes to expose `generationPath` or gate state to parents.

---

## 4. Per-fix detail (for implementation pass)

| Fix | Files | Functions / areas | Old behavior | New behavior | Tests | No-regression |
|-----|-------|-------------------|--------------|--------------|-------|----------------|
| A1 README | `utils/parent-copilot/README.md` (new) | N/A | No central doc | Single source for env + safety narrative | None required; optional link from repo root doc later | Run existing `test:parent-copilot-phase5` + `test:parent-copilot-async-llm-gate` |
| A2 JSDoc | `index.js` | `runParentCopilotTurn`, `runParentCopilotTurnAsync`, optionally `finalizeTurnResponse` | Partial inline comments | Explicit contract in JSDoc | Same | Same |
| A3 truth header | `truth-packet-v1.js` | file-level comment above `buildTruthPacketV1` | Brief | Envelope + consumer rules | Same | Same |
| A4 gate + async telemetry test | `scripts/parent-copilot-async-llm-gate-suite.mjs` or new script + `package.json` if new script | `getLlmGateDecision` import / async turn | Covered partially | Explicit default-env `generationPath` + `enabled` false | New assertions + `npm run test:parent-copilot-async-llm-gate` | Plus `test:parent-copilot-phase4` + `test:parent-copilot-phase5` |
| B1 KPI doc | `README.md` | `evaluateKpiGate` | Ambiguity | Clarified | N/A | N/A |
| B2 validator header | `guardrail-validator.js` | module banner | “Phase 5” one-liner | Richer category map | N/A | `npm run test:parent-copilot-phase5` |

---

## 5. Safety rules (define exactly)

**When Copilot may return a normal “resolved” answer**

- Deterministic draft **passes** [`validateAnswerDraft`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/utils/parent-copilot/guardrail-validator.js) for the active planner intent, and [`validateParentCopilotResponseV1`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/utils/parent-copilot/guardrail-validator.js) passes on the packaged response; **or** LLM draft passes both `validateLlmDraft` and the same validator/final checks (only if gates enabled).

**When it must use deterministic fallback (contract slots)**

- Deterministic composition fails validator and failure is **not** classified as clinical guardrail failure path that requires boundary draft (see `draftHasClinicalGuardrailFailure` in [`index.js`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/utils/parent-copilot/index.js)).

**When it must use clinical boundary copy**

- Clinical guardrail failures on composed or LLM draft (`CLINICAL_GUARDRAIL_FAIL_CODES` / LLM clinical reasons), subject to boundary draft validating.

**When LLM must not run**

- `getLlmGateDecision().enabled === false` (any of: `PARENT_COPILOT_FORCE_DETERMINISTIC`, missing `PARENT_COPILOT_LLM_ENABLED`, missing `PARENT_COPILOT_LLM_EXPERIMENT`, invalid `PARENT_COPILOT_ROLLOUT_STAGE`) — [`maybeGenerateGroundedLlmDraft`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/utils/parent-copilot/llm-orchestrator.js) returns without `fetch`.
- Async path early exit: `resolutionStatus !== "resolved"`, no `truthPacket`, or empty utterance ([`runParentCopilotTurnAsync`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/utils/parent-copilot/index.js)).
- `core.intent === "clinical_boundary"` → skip LLM with `llm_skipped_clinical_boundary`.
- Missing API key / HTTP error / timeout / invalid JSON / `validateLlmDraft` fail → stay on deterministic base or boundary per existing branches.

**Forbidden claims (non-exhaustive; code is authoritative)**

- **Clinical labels / diagnosis-style language:** dyslexia, dyscalculia, ADHD, learning disability, “the diagnosis is…”, child-has-disorder patterns (see `CLINICAL_DIAGNOSIS_SURFACE_RES` / `LLM_CLINICAL_DIAGNOSIS_RES` in [`guardrail-validator.js`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/utils/parent-copilot/guardrail-validator.js) and [`llm-orchestrator.js`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/utils/parent-copilot/llm-orchestrator.js)).
- **Over-certainty** on clinical-boundary class: `CLINICAL_CERTAINTY_RE` / `LLM_CLINICAL_CERTAINTY_RE`.
- **Truth violations:** missing required hedges, forbidden phrases from narrative + systemic list, raw `RI0–RI3` in parent text, imperatives when recommendation not eligible, premature conclusion when `cannotConcludeYet`, internal tokens (`truthPacket`, `contractsV1`, URLs, etc.) per `FORBIDDEN_PARENT_SURFACE_TOKENS` / `INTERNAL_DEV_PATTERNS` in validator.
- **`next_step` block** when `!recommendationEligible` or `recommendationIntensityCap === "RI0"` (validator + `validateLlmDraft`).

---

## 6. Test plan (exact commands)

**Minimum bar after any Phase 5 doc/test change**

```bash
npm run test:parent-copilot-async-llm-gate
npm run test:parent-copilot-phase4
npm run test:parent-copilot-phase5
npm run test:parent-copilot-executive-answer-safe-matrix
```

**Hebrew / robustness (should do if touching validator copy or Hebrew normalization docs)**

```bash
npm run test:parent-copilot-phase6
```

**Broader regression (optional CI-style bundle)**

```bash
npm run test:parent-copilot-product-behavior
npm run test:parent-copilot-observability-contract
```

**Rollout gate bundles (unchanged—prove gates not relaxed)**

```bash
npm run test:parent-rollout-stage:s2-classifier
npm run test:parent-rollout-stage:s3-observability
```

**Explicitly not required for Phase 5 unless code changes expand:** full matrix of all `test:parent-copilot-*` scripts (dozens); run selectively by area touched.

---

## Constraints checklist (Phase 5 execution)

- Do **not** set any default env that enables LLM; document opt-in only.
- Do **not** remove or loosen conditions in [`getLlmGateDecision`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/utils/parent-copilot/rollout-gates.js) or KPI thresholds without product sign-off.
- Do **not** change [`utils/parent-report-v2.js`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/utils/parent-report-v2.js) report assembly logic.
- Do **not** change UI components unless a separate approved task; Phase 5 = `utils/parent-copilot/*` + tests + docs under that folder.
- Do **not** add a second Copilot entry that bypasses [`index.js`](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/utils/parent-copilot/index.js).
