# Parent Report Release Gate Checklist

## Automated Checks Summary
- automated_release_gate: PASS
- product_contract_audit: PASS
- ui_binding_audit: PASS
- readability_audit: PASS
- short_vs_detailed_consistency: PASS
- skill_coverage_gate: PASS
- question_audit_gate: PASS

## Manual QA Checklist
- manual_browser_qa: BLOCKED
- Use `reports/parent-report-product-contract/manual-browser-qa-checklist.md`

## Pass / Fail Fields
- automated_release_gate: PASS
- manual_browser_qa: BLOCKED

## Known Risks
- Manual browser QA blocked: no interactive browser environment available in this agent runtime.
- Short report computes detailed contract for preview; monitor runtime cost on low-end devices.

## Launch / No-Launch Recommendation
- AUTOMATED PASS / MANUAL QA REQUIRED
