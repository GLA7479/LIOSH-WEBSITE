# Content gap backlog (planning only)

This file lists the **41** real content gaps (`unsupported_needs_content`). No questions were added or edited.

- Generated: 2026-05-02T22:37:41.160Z
- Run id: content-backlog-moox9ui0
- Source audit: content-gap-moox9two

## Summary

- **Total backlog items:** 36

### By subject

- science: **21**
- english: **15**

### By grade

- g1: **5**
- g2: **9**
- g3: **3**
- g4: **3**
- g5: **8**
- g6: **8**

### By topic (subject:topic)

- english:translation: **15**
- science:earth_space: **5**
- science:body: **4**
- science:environment: **4**
- science:materials: **4**
- science:experiments: **3**
- science:plants: **1**

### By level

- easy: **15**
- hard: **15**
- medium: **6**

### By releaseRisk

- high: **21**
- medium: **15**

### Recommended order for later implementation

1. **Science** — batch by topic (`animals`, `body`, `earth_space`, …): extend `data/science-questions.js` so each matrix band has ≥1 MCQ row.
2. **English translation** — decide product stance (MCQ vs flashcards-only); then add MCQ-shaped rows to `data/english-questions/translation-pools.js` or adjust matrix expectations.

## Example items (first 8)

| backlogId | subject | grade | topic | level | target file | risk |
| --- | --- | --- | --- | --- | --- | --- |
| BG_g1__science__body__hard | science | g1 | body | hard | data/science-questions.js | high |
| BG_g1__science__earth_space__hard | science | g1 | earth_space | hard | data/science-questions.js | high |
| BG_g1__science__environment__hard | science | g1 | environment | hard | data/science-questions.js | high |
| BG_g1__science__materials__hard | science | g1 | materials | hard | data/science-questions.js | high |
| BG_g1__science__plants__hard | science | g1 | plants | hard | data/science-questions.js | high |
| BG_g2__english__translation__easy | english | g2 | translation | easy | data/english-questions/translation-pools.js | medium |
| BG_g2__english__translation__hard | english | g2 | translation | hard | data/english-questions/translation-pools.js | medium |
| BG_g2__english__translation__medium | english | g2 | translation | medium | data/english-questions/translation-pools.js | medium |

## Full list

See JSON: `C:/Users/ERAN YOSEF/Desktop/final projects/FINAL-WEB/LIOSH-WEB-TRY/reports/learning-simulator/content-gap-backlog.json` — every item includes backlogId, exactMissingReason, recommendedAction, canBeDeferred, notes.
