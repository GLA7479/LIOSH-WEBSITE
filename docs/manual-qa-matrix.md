# Manual QA Matrix (Hard Signed Gate)

Scope: parent-facing finished-product behavior in real UI flows.

## Scenarios and verdicts

| Scenario | Route | What was checked manually | Result |
|---|---|---|---|
| V2 authority visible | `/learning/parent-report` | diagnostics section shows V2-derived source behavior and coherent summary | pass |
| Fallback safety | `/learning/parent-report`, `/learning/parent-report-detailed` | when evidence is thin, flow remains explicit and avoids hidden mixed authority language | pass |
| Cannot-conclude clarity | parent + detailed | uncertainty is explicit and non-contradictory; no fake certainty | pass |
| Subject completeness + key metrics visibility | parent + detailed | all 6 subjects can produce valid blocks without broken placeholders, and show question count + accuracy in subject headers | pass (pending user artifact confirmation for PDF view) |
| Recommendation readability | parent + detailed | actionable and parent-readable wording; no engine jargon in visible text | pass |
| Print preview consistency | detailed print media + PDF artifacts | section order, page continuity, and readability stay stable, with no card cutting at page bottoms | pending (artifact-first review, reopened after user fail report) |
| PDF readability gate | `qa-visual-output/parent-detailed-full.pdf`, `qa-visual-output/parent-detailed-summary.pdf` | text contrast, no washed-out cards, no giant blank regions, no clipping | pending (user validation required) |
| Topic metrics correctness | detailed cards | question/accuracy values in topic narratives reflect real data, not default zeros | pending (artifact-first review) |
| Topic wording naturalness | detailed cards | reduced repetitive template phrasing and non-robotic parent-facing language | pending (artifact-first review) |

## Blocking criteria

- No broken core section
- No hidden fallback drift
- No contradictory wording between summary and details
- No non-readable report sections
- No washed-out/blank-dominant PDF pages
- No default-zero topic metrics when evidence exists
- No repetitive robotic topic-card narrative

Any one failure is a blocking fail.

## Signed gate

- Manual QA reviewer: **Pending re-sign after PDF artifact confirmation**
- Product reviewer: **Pending re-sign after PDF artifact confirmation**
- Phase D manual QA gate: **REOPENED**
