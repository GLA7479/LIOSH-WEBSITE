# Parent Copilot (`utils/parent-copilot`)

Parent-facing Copilot for the parent report context. **Deterministic composition is the source of truth.** An optional LLM path may only refine wording **after** a full deterministic turn, and only when rollout gates allow it.

## Deterministic vs async flow

| API | Behavior |
|-----|----------|
| `runParentCopilotTurn` (sync) | Runs `runDeterministicCore` only. Telemetry `generationPath` is always `deterministic`. No LLM. |
| `runParentCopilotTurnAsync` | **Always** runs `runDeterministicCore` first (same core as sync). If the turn is not `resolved`, there is no truth packet, or the utterance is empty, returns immediately with `generationPath: "deterministic"`. If `core.intent === "clinical_boundary"`, LLM is skipped. Otherwise calls `maybeGenerateGroundedLlmDraft`; if gates disallow LLM or the draft fails validation, the response stays the deterministic baseline (or clinical-boundary handling per `index.js`). Only when gates are on **and** the LLM draft passes all checks does telemetry use `generationPath: "llm_grounded"`. |

## Rollout gates (LLM enablement)

Implemented in `rollout-gates.js` (`getLlmGateDecision`). **All** of the following must hold for `enabled === true` (otherwise `enabled === false` and `reasonCodes` list why):

| Condition | Env / constant | When LLM is blocked |
|-----------|----------------|---------------------|
| Kill switch | `PARENT_COPILOT_FORCE_DETERMINISTIC` | Must **not** be the string `true` (case-insensitive trim). If `true`, reason `force_deterministic`. |
| LLM master switch | `PARENT_COPILOT_LLM_ENABLED` | Must be `true`. Otherwise `llm_env_disabled`. |
| Experiment opt-in | `PARENT_COPILOT_LLM_EXPERIMENT` | Must be `true`. Otherwise `llm_experiment_flag_missing` (default practice: LLM off). |
| Rollout stage | `PARENT_COPILOT_ROLLOUT_STAGE` | Defaults to `internal` if unset. Must be exactly one of `internal`, `beta`, or `full`. Otherwise `rollout_stage_not_allowed`. |

**KPI gate (separate from LLM on/off):** `evaluateKpiGate` / `readKpiThresholds` use `PARENT_COPILOT_KPI_MIN_FLUENCY`, `PARENT_COPILOT_KPI_MIN_GROUNDEDNESS`, `PARENT_COPILOT_KPI_MAX_GENERICNESS`, `PARENT_COPILOT_KPI_MAX_FALLBACK_RATE`, `PARENT_COPILOT_KPI_MIN_CLARIFICATION_SUCCESS` — for rollout quality review, not for replacing `getLlmGateDecision`.

**When LLM is actually invoked** (only if `getLlmGateDecision().enabled`): `llm-orchestrator.js` also requires `PARENT_COPILOT_LLM_API_KEY` (and uses `PARENT_COPILOT_LLM_BASE_URL`, `PARENT_COPILOT_LLM_MODEL`, `PARENT_COPILOT_LLM_TIMEOUT_MS` with documented defaults in that module).

## `generationPath` (telemetry)

| Value | Meaning |
|-------|---------|
| `deterministic` | Answer blocks come from deterministic pipeline (including after failed or skipped LLM). |
| `llm_grounded` | LLM draft was accepted and passed final response validation (`runParentCopilotTurnAsync` success path only). |

## When the LLM runs / does not run

**Does not run** when:

- `getLlmGateDecision().enabled === false` (any gate reason above) — `maybeGenerateGroundedLlmDraft` returns without calling the network.
- Turn is not `resolved`, or missing `truthPacket` or utterance (async early return).
- `core.intent === "clinical_boundary"` (async skips LLM with `llm_skipped_clinical_boundary`).
- Provider error, timeout, invalid JSON, `validateLlmDraft` failure, or `validateAnswerDraft` / `validateParentCopilotResponseV1` failure on the LLM draft — falls back to deterministic behavior per `index.js`.

**May run** only when all gate conditions pass **and** the async path reaches `maybeGenerateGroundedLlmDraft` with a resolved turn and non-clinical-boundary intent.

## Forbidden claims (policy summary)

Authoritative enforcement is in `guardrail-validator.js` and (for LLM output) `llm-orchestrator.js` `validateLlmDraft`. In prose:

- **Clinical / diagnostic:** No dyslexia/dyscalculia/ADHD/learning-disability framing, no “the diagnosis is…”, no child-has-disorder patterns (see clinical regex sets in code).
- **Overconfidence:** No forbidden certainty phrasing where contracts require hedging; clinical-boundary turns have additional certainty restrictions.
- **Internal leakage:** No internal tokens (`truthPacket`, `contractsV1`, schema/telemetry paths, raw `RI0`–`RI3` codes, URLs, `JSON.stringify`, etc.) in parent-facing blocks — see `FORBIDDEN_PARENT_SURFACE_TOKENS` and related patterns in `guardrail-validator.js`.
- **Recommendations:** No `next_step` / imperative home practice when `recommendationEligible` is false or intensity cap is `RI0`, unless contracts allow.

## Fallback behavior

- **Validator fail (non-clinical):** `fallback-templates.js` — `buildDeterministicFallbackAnswer` uses narrative contract slots only.
- **Clinical guardrail failure:** Switch to clinical-boundary composed copy where applicable (`answer-composer.js` / `index.js`).
- **Severe failure after fallback attempt:** Emergency minimal blocks from narrative `textSlots`, or another deterministic fallback pass (`index.js`).

## Tests (examples)

```bash
npm run test:parent-copilot-async-llm-gate
npm run test:parent-copilot-phase4
npm run test:parent-copilot-phase5
npm run test:parent-copilot-executive-answer-safe-matrix
```

## Module map (high level)

- `index.js` — public entry: `runParentCopilotTurn`, `runParentCopilotTurnAsync`.
- `truth-packet-v1.js` — builds `TruthPacketV1` from report payload + scope.
- `rollout-gates.js` — LLM gate + KPI thresholds.
- `llm-orchestrator.js` — optional grounded LLM call + strict draft validation.
- `guardrail-validator.js` — draft and final response validation.
- `fallback-templates.js` — deterministic safe fallback text.
- `answer-composer.js`, `conversation-planner.js`, `render-adapter.js`, `turn-telemetry.js`, etc. — deterministic pipeline pieces.
