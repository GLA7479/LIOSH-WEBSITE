# Wording QA Matrix (Finished Product Gate)

Scope: parent-facing language quality for `parent-report` and `parent-report-detailed`.

## Pass/fail criteria (blocking)

- no robotic phrasing
- no repeated template feel
- no fake certainty
- no system-internal tone
- clear parent action
- understandable by ordinary parent
- concise but concrete
- uncertainty phrased naturally

Any failure in one criterion is a blocking fail for finished product.

## Review matrix

| Subject | Route | Scenario family | Robotic | Repetitive | Fake certainty | System tone | Clear action | Parent clarity | Concise+concrete | Natural uncertainty | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `math` | parent+detailed | sparse / fragile / mastery | pass | **reopen** | pass | pass | pass | pass | pass | pass | **reopen** |
| `geometry` | parent+detailed | contradictory / mixed | pass | **reopen** | pass | pass | pass | pass | pass | pass | **reopen** |
| `english` | parent+detailed | hints / recovery / transfer | pass | **reopen** | pass | pass | pass | pass | pass | pass | **reopen** |
| `science` | parent+detailed | foundational / local | pass | **reopen** | pass | pass | pass | pass | pass | pass | **reopen** |
| `hebrew` | parent+detailed | weak evidence / cannot-conclude | pass | **reopen** | pass | pass | pass | pass | pass | pass | **reopen** |
| `moledet-geography` | parent+detailed | contradictory / sparse | pass | **reopen** | pass | pass | pass | pass | pass | pass | **reopen** |

## Evidence used

- Automated tone self-test: `npx tsx scripts/batch1-parent-topic-tone-selftest.mjs` (pass).
- Engine/detailed/report suites:
  - `npm run test:parent-report-phase1` (pass)
  - `npm run test:topic-next-step-phase2` (pass)
  - `npm run test:parent-report-phase6` (pass)
- Manual reading pass over parent-facing strings in:
  - `utils/parent-report-ui-explain-he.js`
  - `utils/detailed-report-parent-letter-he.js`
  - `utils/detailed-parent-report.js`
  - `pages/learning/parent-report.js`
  - `pages/learning/parent-report-detailed.js`
- Reopen trigger from product artifact:
  - repeated template sentence visibility in topic cards
  - repeated `0 שאלות / 0%` snapshots indicated wording + binding issue

## Current fix pass

- `utils/detailed-parent-report.js`: recommendation cards now carry real `questions/accuracy/mistakeEventCount` from unit evidence.
- `utils/detailed-report-parent-letter-he.js`: topic narrative rewritten to avoid repetitive boilerplate and to avoid synthetic zero-metric sentence.

## Signed gate

- Language reviewer: **Pending re-sign after artifact review**
- Pedagogical reviewer: **Pending re-sign after artifact review**
- Gate result: **REOPENED (blocking gate not closed)**
