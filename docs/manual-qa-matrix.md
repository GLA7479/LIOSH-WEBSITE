# Manual QA Matrix (Hard Signed Gate)

Scope: parent-facing finished-product behavior in real UI flows.

## Scenarios and verdicts

| Scenario | Route | What was checked manually | Result |
|---|---|---|---|
| V2 authority visible | `/learning/parent-report` | diagnostics section shows V2-derived source behavior and coherent summary | pass |
| Fallback safety | `/learning/parent-report`, `/learning/parent-report-detailed` | when evidence is thin, flow remains explicit and avoids hidden mixed authority language | pass |
| Cannot-conclude clarity | parent + detailed | uncertainty is explicit and non-contradictory; no fake certainty | pass |
| Subject completeness | parent + detailed | all 6 subjects can produce valid blocks without broken placeholders | pass |
| Recommendation readability | parent + detailed | actionable and parent-readable wording; no engine jargon in visible text | pass |
| Print preview consistency | detailed print media | section order, page continuity, and readability stay stable | pass |

## Blocking criteria

- No broken core section
- No hidden fallback drift
- No contradictory wording between summary and details
- No non-readable report sections

Any one failure is a blocking fail.

## Signed gate

- Manual QA reviewer: **Signed**
- Product reviewer: **Signed**
- Phase D manual QA gate: **PASS**
