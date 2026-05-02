# Content gap audit (`unsupported_needs_content`)

- Run id: content-gap-moox9two
- Generated at: 2026-05-02T22:37:40.392Z
- Total cells with **unsupported_needs_content**: **36**
- Unknown classifications: **0**

## Fixability summary

```json
{
  "cellsNeedingNewQuestionContent": 36,
  "cellsFixableByQAClassificationOnly": 0,
  "cellsRecommendUnsupportedExpected": 0,
  "requiresRuntimeChange": 0,
  "unknownCells": 0
}
```

## Counts by final gap category

- **missing_topic_bank_entries**: 21
- **needs_content_addition**: 15

## Counts by priority

- **P1**: 36

## Counts by subject

- science: 21
- english: 15

## Top topic keys (subject:topic)

- english:translation: 15
- science:earth_space: 5
- science:body: 4
- science:environment: 4
- science:materials: 4
- science:experiments: 3
- science:plants: 1

## Examples (first 12 cells)

| cellKey | category | priority | action |
| --- | --- | --- | --- |
| g1\|science\|body\|hard | missing_topic_bank_entries | P1 | Add MCQ rows to data/science-questions.js for this grade · topic · level… |
| g1\|science\|earth_space\|hard | missing_topic_bank_entries | P1 | Add MCQ rows to data/science-questions.js for this grade · topic · level… |
| g1\|science\|environment\|hard | missing_topic_bank_entries | P1 | Add MCQ rows to data/science-questions.js for this grade · topic · level… |
| g1\|science\|materials\|hard | missing_topic_bank_entries | P1 | Add MCQ rows to data/science-questions.js for this grade · topic · level… |
| g1\|science\|plants\|hard | missing_topic_bank_entries | P1 | Add MCQ rows to data/science-questions.js for this grade · topic · level… |
| g2\|english\|translation\|easy | needs_content_addition | P1 | Add MCQ-shaped English pool items for translation at this grade (or narr… |
| g2\|english\|translation\|hard | needs_content_addition | P1 | Add MCQ-shaped English pool items for translation at this grade (or narr… |
| g2\|english\|translation\|medium | needs_content_addition | P1 | Add MCQ-shaped English pool items for translation at this grade (or narr… |
| g2\|science\|body\|hard | missing_topic_bank_entries | P1 | Add MCQ rows to data/science-questions.js for this grade · topic · level… |
| g2\|science\|earth_space\|hard | missing_topic_bank_entries | P1 | Add MCQ rows to data/science-questions.js for this grade · topic · level… |
| g2\|science\|earth_space\|medium | missing_topic_bank_entries | P1 | Add MCQ rows to data/science-questions.js for this grade · topic · level… |
| g2\|science\|environment\|hard | missing_topic_bank_entries | P1 | Add MCQ rows to data/science-questions.js for this grade · topic · level… |

## What not to fix yet

- Do not add or edit question JSON in this audit step.
- Mixed/UI-only rows should be catalog **unsupported_expected**, not treated as missing banks.
- English translation gaps may be intentional if product uses flashcards only — confirm before adding MCQs.

Full JSON: `C:/Users/ERAN YOSEF/Desktop/final projects/FINAL-WEB/LIOSH-WEB-TRY/reports/learning-simulator/content-gap-audit.json`
