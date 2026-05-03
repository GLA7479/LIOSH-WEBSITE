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

## Why it matters

The professional diagnostic engine and `buildQuestionSkillMetadataV1` need stable **skill / subskill / error / prerequisite** signals. Gaps here limit misconception routing, prerequisite chains, and cohort analytics — **without** changing Hebrew stems shown to students.

## Advisory gate (phase 1)

- **Exit 0** if at least one bank parsed successfully.
- **Exit 1** only if **no** questions could be scanned (fatal scan).
- Incomplete metadata does **not** fail CI by design (`WARN` is normal until pools are enriched).

## Related

- `docs/UNIFIED_QUESTION_SCHEMA.md` — legacy shapes per subject
- `utils/learning-diagnostics/question-skill-metadata-v1.js` — runtime metadata merge
- `npm run qa:learning-simulator:question-skill-metadata` — matrix-cell sampling (different scope)
