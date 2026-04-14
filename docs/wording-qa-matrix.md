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
| `math` | parent+detailed | sparse / fragile / mastery | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| `geometry` | parent+detailed | contradictory / mixed | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| `english` | parent+detailed | hints / recovery / transfer | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| `science` | parent+detailed | foundational / local | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| `hebrew` | parent+detailed | weak evidence / cannot-conclude | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| `moledet-geography` | parent+detailed | contradictory / sparse | pass | pass | pass | pass | pass | pass | pass | pass | pass |

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

## Signed gate

- Language reviewer: **Signed**
- Pedagogical reviewer: **Signed**
- Gate result: **PASS (blocking gate closed)**
