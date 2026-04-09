# Unified question item — internal target schema (prep only)

This document is a **developer prep note** for a future shared content model. **No runtime code depends on this file.** Subjects today use different shapes (see “Current sources”).

## Minimum common fields (recommended)

| Field | Type | Notes |
|--------|------|--------|
| `id` | `string` | Stable unique id (e.g. `science_body_1`, `en_grammar_be_basic_03`). Required for analytics, versioning, and dedup. |
| `subject` | `string` | One of: `math`, `geometry`, `english`, `science`, `hebrew`, `moledet-geography` (align with routes / reporting). |
| `topic` | `string` | Subject-specific topic key (e.g. science `body`, english `grammar`, hebrew `reading`). |
| `difficulty` | `string` | Suggest: `easy` \| `medium` \| `hard`. If a range is needed, use `minDifficulty` / `maxDifficulty` instead (maps from science today). |
| `prompt` | `string` | The question text shown to the learner (replaces `stem`, `question`, or generator-only text for static banks). |
| `choices` | `string[]` | Ordered options for MCQ (replaces `options` / `answers`). |
| `correct` | `number \| string` | **Either** index into `choices` **or** the exact correct choice string—pick one convention per codebase and document it. Science today uses index as `correctIndex`; English uses string `correct`; Hebrew/Geography use index as `correct`. |
| `explanation` | `string` | Post-answer feedback (required for serious content; science + english often have it; hebrew/geography banks often rely on generic topic hints instead). |
| `tags` | `string[]` | Optional curriculum / skill tags, e.g. `["g3", "vocabulary", "ministry-2024"]`. |

Optional extensions (not in the minimum set): `type` (`mcq` \| `true_false` \| …), `theoryLines` (science), `grades` (`g1`–`g6` bands), media `href`s, `locale`, `distractorNotes`.

## Current sources (as implemented today)

- **Science** — `data/science-questions.js`: `id`, `topic`, `grades`, `minLevel`, `maxLevel`, `type`, `stem`, `options`, `correctIndex`, `explanation`, `theoryLines`.
- **English pools** — `data/english-questions/*.js`: e.g. `question`, `options`, `correct` (string), `explanation`.
- **Hebrew** — `data/hebrew-questions/*.js`: `question`, `answers`, `correct` (index).
- **Geography / Moledet** — `data/geography-questions/*.js`: same pattern as Hebrew (`question`, `answers`, `correct` index).
- **Math / geometry** — procedural items from `utils/math-question-generator.js`, `utils/geometry-question-generator.js`: no single static row; a unified model would serialize `prompt`, `choices` (if MCQ), `correct`, `explanation` **after** generation or store templates + params separately.

## Migration stance

Adopt the minimum schema **incrementally** (e.g. new banks + adapters for old shapes). Do not break existing pages until each subject has a thin mapping layer.
