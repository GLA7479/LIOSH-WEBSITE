# Science generator / QA matrix — audit

## Verdict: **adapter / matrix classification only**

| Question | Answer |
|----------|--------|
| Runtime exists? | Yes — `pages/learning/science-master.js`, curriculum `data/science-curriculum.js` |
| Questions / bank exist? | Yes — `data/science-questions.js`, loaded in Phase 4 via `question-generator-adapters.mjs` |
| Generator path for simulator? | Yes — `generateForMatrixCell` science branch filters MCQ bank by topic/grade/level |
| Root cause of “unsupported_needs_generator” in catalog | `coverage-matrix.mjs` set `isGeneratorBacked = false` whenever `generatorBacked.bank` was set (incorrect for science) |

## Recommended action (implemented in tooling)

- Matrix rows for bank-backed subjects use `isGeneratorBacked: "bank"`.
- Catalog treats `"bank"` like procedural/inline for eligibility and coverage counts.

No UI changes, no new science items, no copy edits.

See JSON: `reports/learning-simulator/science-generator-adapter-audit.json`
