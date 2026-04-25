# Parent Report Release Gate

- automated_release_gate: **PASS**
- manual_browser_qa: **BLOCKED**
- launch_recommendation: **AUTOMATED PASS / MANUAL QA REQUIRED**

## Automated Checks Summary
- [x] Product contract audit
- [x] UI binding audit
- [x] Readability audit
- [x] Short vs detailed consistency
- [x] Skill coverage gate
- [x] Question audit gate

## Check Details
### Product contract audit
- status: PASS
- details: `{"total":16,"passed":16,"failed":0}`
### UI binding audit
- status: PASS
- details: `{"topContractRendered":true,"duplicatePrimaryActionDetected":false,"forbiddenInternalTermsInRenderedUi":0,"trendGuardInRenderedUi":true,"pdfExportChecked":true}`
### Readability audit
- status: PASS
- details: `{"total":10,"pass":10,"fail":0,"forbiddenInternalTermsCount":0,"duplicatePrimaryActionExists":false,"unsupportedTrendWordingExists":false}`
### Short vs detailed consistency
- status: PASS
- details: `{"scenarioCount":10,"passCount":10,"failCount":0,"hasDetailedLink":true}`
### Skill coverage gate
- status: PASS
- details: `{"total":423,"weak":7,"zero":0,"uncertain":0}`
### Question audit gate
- status: PASS
- details: `{"exactDuplicateCrossGradeStaticBanksOnly":0,"mathKindsNotHitSample":0,"geoKindsNotHitSample":0,"criticalMisses":0}`

## Manual QA Checklist
- See `reports/parent-report-product-contract/manual-browser-qa-checklist.md`
- Mark each section Pass/Fail during browser execution.

## Known Risks
- Manual browser QA blocked: no interactive browser environment available in this agent runtime.
- Short report computes detailed contract for preview; monitor runtime cost on low-end devices.

## Launch / No-Launch Recommendation
- AUTOMATED PASS / MANUAL QA REQUIRED