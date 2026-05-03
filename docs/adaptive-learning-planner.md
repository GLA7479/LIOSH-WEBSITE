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
- **English** rows without skill metadata (or `skillTaggingIncomplete`, after deterministic alignment attempts) → **`needs_human_review`**, no fine-grained routing.
- **`mustNotSay`** populated with baseline guardrails for any future LLM or copy integration (**this phase adds no LLM**).

## What is implemented now

- `utils/adaptive-learning-planner/` — contract, rules, core `planAdaptiveLearning`, fixtures, summary helpers.
- `npm run test:adaptive-planner` — deterministic selftest; writes `reports/adaptive-learning-planner/summary.{json,md}`.

## English diagnostic unit alignment (artifact-only)

For **internal planner artifacts**, English units can resolve to bank `(skillId, subskillId)` when all of the following hold (see `utils/adaptive-learning-planner/diagnostic-unit-skill-alignment.js`):

- The facet `displayName` is one of the known English master labels (`Grammar`, `Vocabulary`, `Writing`, `Sentence Building`).
- The mapped topic bucket appears in `facets.topicLayer.topicBucketKeys` (cross-check against the same keys used in parent-report `englishTopics` rows).
- The chosen pair exists in the **question metadata index** (no invented ids).

This path is **not** general free-text inference; unknown display names or bucket mismatches stay untagged. Product **student flow and engine decisions** are unchanged; the adapter only enriches planner inputs when building from saved report JSON.

### Geometry facet topic alignment (artifact-only)

When a geometry facet unit has no `skillId`/`subskillId` and no `G-xx` taxonomy bridge on the unit, alignment may still resolve from **Hebrew `displayName`** → `geometryTopics` bucket key, cross-checked against `facets.topicLayer.topicBucketKeys`, then to a **single** bank pair that exists in the metadata index (see `resolveGeometryTopicBucketKeyFromUnit` / `geometryTopicBucketToBankPair`). Unknown Hebrew titles or missing bucket keys leave the row unchanged (metadata subject fallback may still appear).

## What is **not** live yet

- No student UI, parent report, question selection, or engine wiring.
- Summaries are **not** merged into Hebrew parent-report templates.

## Future integration points

- Map **diagnostic-framework-v1** / **diagnosticEngineV2** payloads into `PlannerInput` in a thin adapter (single place).
- Gate planner output behind the same **metadata QA** and **narrative safety** pipelines before any user-visible text.
- Optionally feed `availableQuestionMetadata` from scanned bank rows or runtime `buildQuestionSkillMetadataV1` output.

## Internal Preview Pack (non-live)

**Purpose:** Summarize planner recommendations from real learning-simulator report artifacts (`artifact-summary.json` produced by `npm run test:adaptive-planner:artifacts`) in a **human-readable** Markdown + JSON pack. Used for engineering review only.

**Status:** **Not student-facing.** Does not change runtime, UI, question selection, parent Hebrew copy, or diagnostic decisions. No LLM calls.

**Outputs:**

- `reports/adaptive-learning-planner/preview-pack.json` — structured aggregates, action table, per-subject readiness, slim example rows (ids and planner fields only).
- `reports/adaptive-learning-planner/preview-pack.md` — executive summary, tables, examples, risk samples, and explicit “what can be previewed vs what must not go live yet”.

**How to read it:**

1. Run `npm run test:adaptive-planner:artifacts` (refreshes `artifact-summary.json`).
2. Run `npm run test:adaptive-planner:preview-pack` (regenerates the preview pack; **fails** if `safetyViolationCount > 0`, artifact summary is missing, required sections are absent, or leak patterns appear).
3. Open `preview-pack.md` for the narrative; use `preview-pack.json` for filtering in tools.

**Why it is not yet suitable as product output:** The planner still emits **internal English** placeholders for summaries in core code; the preview pack **does not** ship those strings to parents. English rows may still be `needs_human_review`; metadata gaps and subject fallbacks appear explicitly in the risk sections.

**Before live routing:** Drive down `metadataSubjectFallbackCount` and `afterAvailableQuestionMetadataMissingCount`, keep `safetyViolationCount` at **0** in artifact runs, and resolve English skill tagging for any subject intended for automated routing.

**Implementation:** `utils/adaptive-learning-planner/adaptive-planner-preview-pack.js` (`buildAdaptivePlannerPreviewPack`), CLI `scripts/adaptive-planner-preview-pack.mjs`.

## Related docs

- `docs/question-metadata-qa.md` — metadata gate and English exemption context.
- `utils/learning-diagnostics/diagnostic-framework-v1.js` — evidence / recommendation vocabulary the planner aligns with conceptually.
