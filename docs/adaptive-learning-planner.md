# Adaptive Learning Planner (foundation)

## Purpose

The **Adaptive Learning Planner** is a **deterministic** layer that sits **after** the diagnostic engine and **before** any future runtime routing or UI. It turns engine-shaped signals (mastery, confidence, evidence quality, risk flags, prerequisites, error types, and optional question-metadata snapshots) into a **recommended next action** — without changing live student flows in this phase.

Relationship:

```text
Diagnostic Engine Output
        →
Adaptive Learning Planner  (this module)
        →
internal next-step recommendation (not wired to product yet)
```

The planner **does not** replace, override, or re-score the diagnostic engine. It **reads** `engineDecision` and other fields as **hints** and applies **policy rules** only.

## Input contract (`PlannerInput`)

Implemented in `utils/adaptive-learning-planner/adaptive-planner.js` (JSDoc on `planAdaptiveLearning`).

| Field | Role |
| ----- | ---- |
| `studentId` | Optional correlation id |
| `subject` | Required canonical subject id (e.g. `math`, `english`, `moledet-geography`) |
| `currentSkillId` / `currentSubskillId` | Current routing focus |
| `engineDecision` | `advance` \| `maintain` \| `remediate` \| `review` \| `insufficient_data` — from engine; **not** altered by planner |
| `mastery` | 0..1 numeric |
| `confidence` | 0..1 numeric or framework-style string (`high`, `medium`, …) |
| `dataQuality` | `thin` \| `moderate` \| `strong` |
| `riskFlags` | e.g. `guessing`, `inconsistency` |
| `doNotConclude` | Cautions from framework / reports (non-empty → conservative plan) |
| `detectedErrorTypes` | For remedial targeting |
| `prerequisiteSkillIds` | Ordered list; first used when policy allows prerequisite review |
| `recentAttempts` | Reserved |
| `availableQuestionMetadata` | Non-empty when bank metadata is known for the target path; **empty** blocks confident `advance` / `review` routing |
| `skillTaggingIncomplete` | When `true`, or **English** with empty `currentSkillId`, planner refuses confident routing (metadata QA exemption alignment) |
| `currentDifficultyHint` | Current difficulty tier (`intro` … `challenge`) |
| `prerequisiteSubskillIdHint` | Optional hint when reviewing prerequisite |

## Output contract

| Field | Meaning |
| ----- | ------- |
| `plannerStatus` | `ready` \| `caution` \| `insufficient_data` \| `needs_human_review` |
| `nextAction` | `practice_current` \| `review_prerequisite` \| `probe_skill` \| `advance_skill` \| `maintain_skill` \| `pause_collect_more_data` |
| `subject` | Echo |
| `targetSkillId` / `targetSubskillId` | Where to aim practice or review |
| `targetDifficulty` | Suggested tier (deterministic bump up/down) |
| `questionCount` | Small batch size (3–5) |
| `reasonCodes` | Stable machine codes (`REASON_CODES` in `adaptive-planner-contract.js`) |
| `studentSafeSummary` / `parentSafeSummary` | **Internal English placeholders** in v1 — **not** final parent-report Hebrew copy |
| `internalNotes` | Developer-facing |
| `mustNotSay` | Safety reminders for any future copy layer |
| `requiresHumanReview` | When metadata or English tagging blocks automation |

## Safety rules (enforced)

- No medical / learning-disability **diagnosis** language paths.
- No **permanent ability** labels.
- **Never overrides** `engineDecision`; planner only chooses pacing shape (e.g. still “practice” when engine says `remediate`).
- **Never advances** on **thin** evidence or when `doNotConclude` is non-empty.
- **Prerequisite review** only when confidence is sufficient and ids are non-empty.
- **English** rows without skill metadata (or `skillTaggingIncomplete`) → **`needs_human_review`**, no fine-grained routing.
- **`mustNotSay`** populated with baseline guardrails for any future LLM or copy integration (**this phase adds no LLM**).

## What is implemented now

- `utils/adaptive-learning-planner/` — contract, rules, core `planAdaptiveLearning`, fixtures, summary helpers.
- `npm run test:adaptive-planner` — deterministic selftest; writes `reports/adaptive-learning-planner/summary.{json,md}`.

## What is **not** live yet

- No student UI, parent report, question selection, or engine wiring.
- Summaries are **not** merged into Hebrew parent-report templates.

## Future integration points

- Map **diagnostic-framework-v1** / **diagnosticEngineV2** payloads into `PlannerInput` in a thin adapter (single place).
- Gate planner output behind the same **metadata QA** and **narrative safety** pipelines before any user-visible text.
- Optionally feed `availableQuestionMetadata` from scanned bank rows or runtime `buildQuestionSkillMetadataV1` output.

## Related docs

- `docs/question-metadata-qa.md` — metadata gate and English exemption context.
- `utils/learning-diagnostics/diagnostic-framework-v1.js` — evidence / recommendation vocabulary the planner aligns with conceptually.
