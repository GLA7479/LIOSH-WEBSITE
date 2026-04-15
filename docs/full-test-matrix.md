# Full Test Matrix (Phase D Hard Gate)

## Automated suite

| Area | Command | Focus | Result |
|---|---|---|---|
| Authority + contracts | `npm run test:parent-report-phase1` | V2 primary flow, fallback contract | pass |
| Engine correctness | `npm run test:diagnostic-engine-v2-harness` | 6-subject diagnosis/confidence/priority/gating + decision/readiness/confidence chain checks | pass (16/16) |
| Next-step decision logic | `npm run test:topic-next-step-phase2` | continuation/pivot/release gate correctness | pass |
| Scenario regressions | `npm run test:topic-next-step-engine-scenarios` | sparse/contradictory/fragile/mastery/regression/recovery | pass (15/15) |
| End-to-end parent flow | `npm run test:parent-report-phase6` | parent+detailed pipeline + SSR + topic contract-chain + narrative consistency | pass |
| Hard gates matrix | `npm run test:minimal-safe-scope` | fail_overstated/fail_gate_text/fail_unsupported + cross-surface contradiction guards | pass (S1–S12) |
| Parent Copilot Phase A | `npm run test:parent-copilot-phaseA` | TruthPacketV1 + response contract + parent-only + clarification branch | pass |
| Production stability | `npm run build` | production compile/pages/routes integrity | pass |

## Coverage declaration

- sparse evidence: covered
- contradictory evidence: covered
- fragile success and hint-heavy behavior: covered
- mastery and transfer: covered
- regression and recovery: covered
- explicit fallback behavior: covered
- cannot-conclude behavior: covered
- recommendation without evidence anchors: blocked
- topic/subject/executive contradiction prevention: covered
- canonical contract-chain validation (evidence→decision→readiness→confidence→recommendation→narrative): covered

## Gate sign-off

- Engineering QA owner: **Signed**
- Product QA owner: **Signed**
- Phase D automated verification gate: **PASS**
- Hard gate fail codes enforced in CI path: **`fail_overstated` / `fail_gate_text` / `fail_unsupported`**
