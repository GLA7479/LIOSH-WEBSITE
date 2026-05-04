# Post-Simulation Next-Step Template

Use this template only after explicit confirmation that the running simulation has finished.

## Simulation Context
- Simulation finished at: `<fill timestamp>`
- Run folder: `<fill exact path>`
- Owner: `<fill>`
- Reviewer: `<fill>`

## Required Inputs To Analyze
- [ ] Analyze `FINAL_REPORT.md`
- [ ] Analyze `FINAL_REPORT.json`
- [ ] Analyze `MORNING_SUMMARY.md`
- [ ] Analyze logs

## Failure Classification
- [ ] Classify failures by severity (`critical`, `high`, `medium`, `low`)
- [ ] Classify failures by type:
  - product bug
  - test infrastructure bug
  - environment/config issue
  - flaky/non-reproducible

## Separation: Product Bugs vs Test Infra Bugs

### Product bugs
- [ ] List confirmed product defects
- [ ] Map each defect to impacted flow/route
- [ ] Assign owner and priority

### Test infra bugs
- [ ] List infra/test harness issues
- [ ] Confirm whether product behavior is actually unaffected
- [ ] Assign infra owner and retest plan

## Critical Blockers First
- [ ] Identify critical blockers
- [ ] Confirm blocker acceptance criteria
- [ ] Fix only blockers first
- [ ] Defer non-blocking polish to follow-up list

## Retest Sequence

### Targeted QA
- [ ] Re-run targeted QA only for fixed blockers
- [ ] Verify no regression in adjacent flows
- [ ] Record pass/fail evidence for each blocker

### Final QA
- [ ] Run final QA suite after blockers pass
- [ ] Confirm launch-readiness checklist closure
- [ ] Produce final go/no-go summary

## Deliverables
- [ ] Updated blocker tracker
- [ ] Updated launch readiness status
- [ ] Final remediation summary report
- [ ] Final decision note (`go` / `no-go`)

## Notes
- Keep this file as a reusable template.
- Do not backfill with current run data until simulation completion is confirmed.
