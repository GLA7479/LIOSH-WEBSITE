# Parent Copilot Rollout and KPI Gates

This document defines staged rollout for the grounded LLM path and the KPI gates that must pass before moving to the next stage.

## Rollout stages

- `internal`: LLM path can run only for internal validation traffic.
- `beta`: partial external rollout (small parent cohort).
- `full`: full rollout.

Set stage via:

- `PARENT_COPILOT_ROLLOUT_STAGE=internal|beta|full`

## Feature flags

- `PARENT_COPILOT_LLM_ENABLED=true` enables optional grounded LLM path.
- `PARENT_COPILOT_FORCE_DETERMINISTIC=true` hard-disables LLM and forces deterministic path.

## KPI thresholds (default values)

- `PARENT_COPILOT_KPI_MIN_FLUENCY=75`
- `PARENT_COPILOT_KPI_MIN_GROUNDEDNESS=85`
- `PARENT_COPILOT_KPI_MAX_GENERICNESS=42`
- `PARENT_COPILOT_KPI_MAX_FALLBACK_RATE=0.2`
- `PARENT_COPILOT_KPI_MIN_CLARIFICATION_SUCCESS=0.6`

When KPI checks fail, rollout should not be advanced and traffic should fall back to deterministic answers.

## LLM provider settings

- `PARENT_COPILOT_LLM_BASE_URL` (default: `https://api.openai.com/v1/responses`)
- `PARENT_COPILOT_LLM_API_KEY`
- `PARENT_COPILOT_LLM_MODEL` (default: `gpt-4.1-mini`)
- `PARENT_COPILOT_LLM_TIMEOUT_MS` (default: `9000`)
