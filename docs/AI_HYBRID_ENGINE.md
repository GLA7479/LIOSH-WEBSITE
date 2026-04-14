# AI-Hybrid Diagnostic Engine (implementation)

This document describes **repo-local code**: runtime wiring, validators, and tooling. It does **not** assert completion of external program gates (expert gold labeling, multi-week shadow SLOs, human review sign-off, production rollout).

## Authority

- `diagnosticEngineV2` remains the hard authority for diagnosis eligibility, `cannotConcludeYet`, weak evidence, contradictions, and human-boundary outcomes.
- Hybrid output is attached as `hybridRuntime` on the parent report payload from `generateParentReportV2` (`utils/parent-report-v2.js`) and forwarded on detailed reports (`utils/detailed-parent-report.js`).
- **Runtime safety:** `generateParentReportV2` calls `safeBuildHybridRuntimeForReport` (`utils/ai-hybrid-diagnostic/safe-build-hybrid-runtime.js`). On throw, invalid shape, or version mismatch, `hybridRuntime` is set to `null` and the report still returns with V2 unchanged.
- **Detailed report:** `hybridRuntime` is passed through only when `isValidHybridRuntimePayload` succeeds; otherwise `null` (see `utils/ai-hybrid-diagnostic/validate-hybrid-runtime.js`).

## Modules

Core implementation lives under `utils/ai-hybrid-diagnostic/`:

- `safe-build-hybrid-runtime.js` — try/catch + shape validation; use from `parent-report-v2`.
- `validate-hybrid-runtime.js` — `isValidHybridRuntimePayload` for post-build and detailed-report guard.
- `extract-unit-features.js` — versioned feature vector per V2 unit + row.
- `authority-gate.js` — `assist` | `rank_only` | `explain_only` | `suppressed`.
- `hypothesis-ranker.js` — taxonomy-limited softmax ranking + disagreement object.
- `probe-intelligence.js` — next-best-probe style summary + uncertainty reduction estimate.
- `explanation-layer.js` + `explanation-validator.js` — deterministic Hebrew templates + hard validators + fallback.
- `learning-loop.js` — optional bounded priors in `localStorage` (no authority bypass).
- `governance.js`, `rollout-config.js`, `shadow-store.js` — consent, rollout stage, shadow ring buffer.

## Rollout

- Default rollout stage: `shadow` (see `rollout-config.js`).
- Override in browser: `localStorage.setItem("mleo_ai_hybrid_rollout_override", "shadow")` — value must be exactly `off`, `shadow`, or `live`.
- Build-time: `NEXT_PUBLIC_AI_HYBRID_ROLLOUT=shadow|live|off`.

## Tooling

- `npm run test:ai-hybrid-harness` — sanity harness (Node).
- `npm run ai-hybrid:generate-gold` — writes `data/ai-hybrid-gold/synthetic-gold-v1.jsonl` (gitignored).
- `npm run ai-hybrid:offline-eval` — smoke metrics when gold file exists.

## Implemented model strategy (code)

- **Hypothesis ranker:** softmax over taxonomy-bridge candidates only; logits combine recurrence pass, V2 chosen-id boost, wrong-rate, and bounded learning-loop prior (`taxonomyPriorBoost`). Disagreement vs V2 uses plan thresholds.
- **Probe intelligence:** rule baseline uncertainty reduction vs ambiguity; assist mode applies a capped uplift when calibration band is `well_calibrated`; P4 / `humanReviewRecommended` drives escalation flag.
- **Explanations:** deterministic Hebrew templates + `explanation-validator.js` (forbidden substrings, uncertainty sentence, evidence ref shape) with mandatory fallback text.
- **Learning loop:** read/write `mleo_ai_hybrid_learning_v1` for future longitudinal priors (bounded; never overrides gates).

## Rollout readiness (Phase H)

- Default `shadow` via `getAiHybridRolloutStage()`; switch to `live` only with `NEXT_PUBLIC_AI_HYBRID_ROLLOUT=live` or localStorage override key `mleo_ai_hybrid_rollout_override` set to `live` / `off` / `shadow`.
- Shadow ring buffer: `sessionStorage` key `mleo_hybrid_shadow_log_v1` (see `shadow-store.js`).
