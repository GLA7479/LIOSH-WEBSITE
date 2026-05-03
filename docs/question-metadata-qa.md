# Question metadata QA

**Command:** `npm run qa:question-metadata` (uses `tsx` so project modules resolve the same way as other audits).

## What it scans

Static JS banks discovered under `utils/question-metadata-qa/question-bank-discovery.js`, including:

- `data/science-questions.js` (merged phase 3 content)
- `utils/hebrew-rich-question-bank.js`
- English grammar / translation / sentence pools
- `data/geography-questions/g*.js`
- Archive Hebrew MCQ files under `data/hebrew-questions/` (some grades may fail to load due to existing ESM cycles — reported in `loadErrors`)
- `utils/geometry-conceptual-bank.js` (`GEOMETRY_CONCEPTUAL_ITEMS`)

**Procedural sources** (math, geometry generator, live Hebrew generator, moledet generator) are **listed** in the report for coverage documentation; they are not expanded into static rows.

## What it reports

| Output | Purpose |
|--------|---------|
| `reports/question-metadata-qa/summary.json` | Gate, subject rollups, top issue codes, discovery list |
| `reports/question-metadata-qa/summary.md` | Human-readable summary |
| `reports/question-metadata-qa/questions-with-issues.json` | Questions with at least one issue (truncated) |
| `reports/question-metadata-qa/skill-coverage.json` | Per-`skillId` bucket stats |
| `reports/question-metadata-qa/enrichment-suggestions.{json,md}` | Science enrichment proposals (after `qa:question-metadata:suggestions`) |
| `reports/question-metadata-qa/science-review-pack.{json,md}` | Science-only review aggregation (after `qa:question-metadata:science-review-pack`) |

## Why it matters

The professional diagnostic engine and `buildQuestionSkillMetadataV1` need stable **skill / subskill / error / prerequisite** signals. Gaps here limit misconception routing, prerequisite chains, and cohort analytics — **without** changing Hebrew stems shown to students.

## Blocking vs advisory gate (release policy)

Policy lives in **`utils/question-metadata-qa/question-metadata-gate-policy.js`**.

| Outcome | Meaning |
| ------- | ------- |
| **`gateDecision: pass_with_advisory`** | Structural/taxonomy checks passed; curriculum/documentation gaps remain (`WARN` is normal). |
| **`gateDecision: fail_blocking_metadata`** | Blocking issue codes present (e.g. invalid difficulty, missing correct answer, taxonomy_unknown_*), duplicate declared IDs across files, or scanner/load failure. |
| **`scanOutcome: error`** | No rows parsed **or** one or more bank modules threw during load (`loadErrors`). |

**Exit codes**

- **Exit 1** if `scanOutcome !== ok` **or** `gateDecision === fail_blocking_metadata`.
- **Exit 0** if only advisory/exempt gaps remain (including English **missing_skillId** / **missing_subskillId** under the documented exemption).

**Summary fields** (`reports/question-metadata-qa/summary.json` → `gate`): `gateDecision`, `blockingIssueCount`, `advisoryIssueCount`, `exemptedIssueCount`, `blockingIssuesByCode`, `advisoryIssuesByCode`, `blockingFiles`, `knownExemptions`.

### Blocking (promoted checks)

Includes: **missing_subject**, **missing_correct_answer**, **missing_difficulty**, **invalid_difficulty**, **missing_cognitiveLevel**, **invalid_cognitive_level**, **missing_expected_error_types**, **expected_error_types_empty**, **taxonomy_unknown_***, **duplicate_declared_id_cross_file** (cross-file duplicate IDs).

### Advisory (remains non-blocking)

Includes: **implicit_id_only**, **missing_prerequisite_skill_ids**, **prerequisite_skill_ids_empty**, **missing_explanation**, low-volume skill diagnostics, engine support flags — plus **missing_skillId** / **missing_subskillId** only for **English** pools under the documented safe-pass exemption until curriculum tags those rows.

## Taxonomy validation (phase 2)

Canonical difficulty/cognitive labels and science skill/subskill allowlists live in **`utils/question-metadata-qa/question-metadata-taxonomy.js`**. The scanner adds optional issue codes such as `taxonomy_unknown_skillId`, `taxonomy_unknown_subskillId`, `taxonomy_unknown_expected_error_type`, and `taxonomy_unknown_prerequisite_skillId` (science prerequisite ids must reference registered science skills).

See **`docs/question-metadata-taxonomy.md`** for value lists and design notes.

## Enrichment suggestions (proposal-only)

**Command:** `npm run qa:question-metadata:suggestions`

- Writes **`reports/question-metadata-qa/enrichment-suggestions.json`** and **`.md`**.
- **Does not modify** any question source files.
- **Science-first:** emits one suggestion object per science row (`data/science-questions.js`) focusing on `subskillId`, `cognitiveLevel`, `expectedErrorTypes`, `prerequisiteSkillIds` (plus canonical difficulty mapping where relevant).
- Every row sets **`needsHumanReview: true`** — bulk-apply is discouraged until curriculum authors validate Hebrew pedagogy and engine routing.

**Why science first:** It already has strong `skillId`, difficulty, answers, and explanations; gaps are concentrated in diagnostic extensions (subskill, cognitive tier, error families, prerequisite graph).

### Confidence model (science suggestions)

Each suggestion includes **`confidence`** (`high` | `medium` | `low`), **`confidenceReasons[]`**, **`reviewPriority`** (`high` | `medium` | `low`), and **`sequentialPrereqHeuristic`** (boolean).

| Tier | Meaning |
|------|---------|
| **high** | Row has explicit structured params (`diagnosticSkillId`, `conceptTag`, `patternFamily`, or `expectedErrorTags`) and known skill id — suggestions ground in existing metadata. |
| **medium** | Deterministic `topic` → `skillId`, difficulty + answer + explanation present; prerequisite chain is **not** the sequential-topic guess (empty or deferred). Template fills for subskill/cognitive/errors still need a human skim. |
| **low** | Sequential-topic prerequisite heuristic applies, or row lacks core quality signals (difficulty / answer / explanation), or topic/skill mapping is outside the standard science allowlist. |

**Review priority** is the review-queue signal: **high** = inspect before any merge (includes all low-confidence and sequential-prerequisite rows); **low** = faster path for **high** confidence suggestions after spot-check.

**Low confidence is not auto-applied:** automation never writes banks; low-confidence rows need curriculum validation before metadata changes.

### Science review pack

**Command:** `npm run qa:question-metadata:science-review-pack`

Reads **`enrichment-suggestions.json`** (or regenerates suggestions in memory if that file is missing after running suggestions). Loads **`questions-with-issues.json`** to append **unknown expected-error tokens** (rows flagged `taxonomy_unknown_expected_error_type`) — lists token text with example `questionId` / file paths **without guessing replacements**.

The JSON/Markdown pack includes grouping by **`skillId`**, **`topic`**, suggested **`subskillId`**, prerequisite and expected-error histograms, low-confidence / high-review-priority lists, and a short **human checklist** (approve / edit / reject / curriculum expert).

**Approval before source edits:** Do not modify `data/science-questions.js` until reviewers accept suggestions for each cluster (especially sequential prerequisites and low-confidence rows).

## Related

- `docs/question-metadata-taxonomy.md` — controlled vocabulary
- `docs/UNIFIED_QUESTION_SCHEMA.md` — legacy shapes per subject
- `utils/learning-diagnostics/question-skill-metadata-v1.js` — runtime metadata merge
- `npm run qa:learning-simulator:question-skill-metadata` — matrix-cell sampling (different scope)
