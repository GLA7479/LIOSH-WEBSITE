# Question metadata taxonomy

**Purpose:** Give learning-engine code and QA tooling a **small, stable set of English identifiers** for `skillId`, `subskillId`, difficulty tiers, cognitive levels, expected-error families, and prerequisite links — without changing Hebrew stems shown to students.

**Version:** controlled by `TAXONOMY_VERSION` in `utils/question-metadata-qa/question-metadata-taxonomy.js`.

## Design principles

- **Expandable:** new subjects/skills are added explicitly to the taxonomy module rather than invented ad hoc in banks.
- **Not prescriptive for Hebrew UI:** labels and explanations for learners remain Hebrew in question sources.
- **Science-first strictness:** only `science` currently uses skill/subskill **allowlists** in QA validation; other subjects still benefit from global difficulty/cognitive/error-type checks where values exist.

## Canonical values (summary)

### Difficulty (recommended tier names)

`intro`, `basic`, `standard`, `advanced`, `challenge`

Legacy aliases still accepted in scans: `easy`, `medium`, `hard`, `low`, `high`.

### Cognitive levels

`recall`, `understanding`, `application`, `analysis`

Legacy aliases still accepted: `reasoning`, `multi_step`.

### Generic expected error types

See `GENERIC_EXPECTED_ERROR_TYPES` in `question-metadata-taxonomy.js` (e.g. `misconception`, `concept_confusion`, `prerequisite_gap`, …).

Bank-specific tags used today (e.g. science `fact_recall_gap`) are listed under **extended** sets so QA does not falsely flag them while taxonomy catches genuinely unknown tokens.

### Science skills / subskills

- **Topic-aligned skill ids:** match `topic` keys (`body`, `animals`, …) used by `data/science-questions.js` when explicit `diagnosticSkillId` is absent.
- **Diagnostic ids:** e.g. `sci_body_fact_recall`, `sci_respiration_concept`.
- **Suggested subskill ids** for enrichment (proposal-only): `sci_<topic>_general` when untagged, or `sci_sub_<conceptSlug>` when `params.conceptTag` exists — must align with allowlists before merge.

## Readiness rules (rolling summary)

Human-readable rubric strings live in `READINESS_RULES` in the taxonomy module; subject-level rollups still compute readiness in `question-metadata-summary.js`. Taxonomy does **not** replace those formulas — it informs validation and enrichment planning.

## Science enrichment confidence (cross-reference)

Automated science suggestions attach **confidence** and **reviewPriority** using rules in `science-enrichment-review-pack.js` (`classifyScienceConfidenceAndReview`). Low confidence usually means sequential-topic prerequisites or missing core row signals — **not** an instruction to auto-fill banks.

See **`docs/question-metadata-qa.md`** for the human review workflow and **`npm run qa:question-metadata:science-review-pack`** for grouped review artifacts.

## Related commands

- `npm run qa:question-metadata` — scans banks + taxonomy validation (advisory).
- `npm run qa:question-metadata:suggestions` — science enrichment proposals **JSON/MD only**.
- `npm run qa:question-metadata:science-review-pack` — science review pack **JSON/MD only** (includes unknown expected-error token listing from global QA output when available).
