# FINAL_REPORT — Overnight Parent AI audit

## 1. Overall status

**FAIL**

## 2. Executive summary (Hebrew)

סיכום לילי אוטומטי (2026-05-04T00-17-26): מצב כולל FAIL.
פקודות שעברו: 24, נכשלו: 12, timeout: 0, לא קיימות בסקריפטים: 0.
פרטים מלאים בטבלה ובקובצי הלוג בתיקייה.

## 3. Command table

| id | command | status | ms | log |
|----|---------|--------|-----|-----|
| build | build | pass | 20346 | logs\build.log |
| b1 | test:parent-ai-context:consistency | pass | 849 | logs\b1.log |
| b2 | test:parent-report-ai:integration | pass | 952 | logs\b2.log |
| b3 | test:parent-report-ai:scenario-simulator | pass | 1050 | logs\b3.log |
| c-0 | test:parent-copilot-phase6 | pass | 999 | logs\c-0.log |
| c-1 | test:parent-copilot-observability-contract | pass | 994 | logs\c-1.log |
| c-2 | test:parent-copilot-parent-render | pass | 968 | logs\c-2.log |
| c-3 | test:parent-copilot-product-behavior | fail | 553 | logs\c-3.log |
| c-4 | test:parent-copilot-classifier-edge-matrix | pass | 451 | logs\c-4.log |
| c-5 | test:parent-copilot-scope-collision | pass | 508 | logs\c-5.log |
| c-6 | test:parent-copilot-semantic-nearmiss | pass | 419 | logs\c-6.log |
| c-7 | test:parent-copilot-broad-report-routing | fail | 479 | logs\c-7.log |
| c-8 | test:parent-copilot-recommendation-semantic | fail | 456 | logs\c-8.log |
| c-9 | test:parent-copilot-question-class-behavior | fail | 511 | logs\c-9.log |
| c-10 | test:parent-copilot-async-llm-gate | fail | 531 | logs\c-10.log |
| c-11 | test:parent-copilot-copilot-turn-api | pass | 453 | logs\c-11.log |
| d1 | test:parent-ai-phase-e:external | pass | 791 | logs\d1.log |
| d2 | test:parent-ai:simulations | pass | 1015 | logs\d2.log |
| d3 | test:parent-ai:feedback-aggregate | pass | 542 | logs\d3.log |
| d4 | test:parent-ai:assistant-qa | pass | 1015 | logs\d4.log |
| d5 | test:parent-ai:external-question | pass | 947 | logs\d5.log |
| d6 | test:parent-ai:bad-prompt | pass | 861 | logs\d6.log |
| d-manual | tsx C:\Users\ERAN YOSEF\Desktop\final projects\FINAL-WEB\LIOSH-WEB-TRY\scripts\parent-ai-manual-qa-matrix.mjs --outDir C:\Users\ERAN YOSEF\Desktop\final projects\FINAL-WEB\LIOSH-WEB-TRY\reports\overnight-parent-ai-audit\2026-05-04T00-17-26\manual-qa-matrix-output | fail | 1023 | logs\d-manual.log |
| e-ssr | tsx C:\Users\ERAN YOSEF\Desktop\final projects\FINAL-WEB\LIOSH-WEB-TRY\scripts\parent-report-pages-ssr.mjs | fail | 912 | logs\e-ssr.log |
| e-phase1 | test:parent-report-phase1 | pass | 1146 | logs\e-phase1.log |
| f-pdf-export | qa:parent-pdf-export | fail | 5694 | logs\f-pdf-export.log |
| f-sample-pdfs | node C:\Users\ERAN YOSEF\Desktop\final projects\FINAL-WEB\LIOSH-WEB-TRY\scripts\overnight-parent-ai-sample-pdfs.mjs --outDir C:\Users\ERAN YOSEF\Desktop\final projects\FINAL-WEB\LIOSH-WEB-TRY\reports\overnight-parent-ai-audit\2026-05-04T00-17-26\sample-pdfs | fail | 5826 | logs\f-sample-pdfs.log |
| f-ls-pdf-export | qa:learning-simulator:pdf-export | fail | 305347 | logs\f-ls-pdf-export.log |
| g1 | qa:question-metadata | pass | 1095 | logs\g1.log |
| g2 | test:adaptive-planner:artifacts | pass | 876 | logs\g2.log |
| g3 | test:adaptive-planner:runtime | pass | 764 | logs\g3.log |
| g4 | test:adaptive-planner:recommended-practice | pass | 646 | logs\g4.log |
| g5 | test:adaptive-planner:scenario-simulator | pass | 756 | logs\g5.log |
| h-quick | qa:learning-simulator:quick | pass | 11131 | logs\h-quick.log |
| h-full | qa:learning-simulator:full | fail | 651512 | logs\h-full.log |
| i-synthetic | tsx scripts/overnight-synthetic-e2e-scenarios.mjs --outDir C:\Users\ERAN YOSEF\Desktop\final projects\FINAL-WEB\LIOSH-WEB-TRY\reports\overnight-parent-ai-audit\2026-05-04T00-17-26\synthetic-e2e | fail | 1564 | logs\i-synthetic.log |

## 4. Main failures (top 10)

[
  {
    "id": "c-3",
    "cmd": "test:parent-copilot-product-behavior",
    "status": "fail"
  },
  {
    "id": "c-7",
    "cmd": "test:parent-copilot-broad-report-routing",
    "status": "fail"
  },
  {
    "id": "c-8",
    "cmd": "test:parent-copilot-recommendation-semantic",
    "status": "fail"
  },
  {
    "id": "c-9",
    "cmd": "test:parent-copilot-question-class-behavior",
    "status": "fail"
  },
  {
    "id": "c-10",
    "cmd": "test:parent-copilot-async-llm-gate",
    "status": "fail"
  },
  {
    "id": "d-manual",
    "cmd": "tsx C:\\Users\\ERAN YOSEF\\Desktop\\final projects\\FINAL-WEB\\LIOSH-WEB-TRY\\scripts\\parent-ai-manual-qa-matrix.mjs --outDir C:\\Users\\ERAN YOSEF\\Desktop\\final projects\\FINAL-WEB\\LIOSH-WEB-TRY\\reports\\overnight-parent-ai-audit\\2026-05-04T00-17-26\\manual-qa-matrix-output",
    "status": "fail"
  },
  {
    "id": "e-ssr",
    "cmd": "tsx C:\\Users\\ERAN YOSEF\\Desktop\\final projects\\FINAL-WEB\\LIOSH-WEB-TRY\\scripts\\parent-report-pages-ssr.mjs",
    "status": "fail"
  },
  {
    "id": "f-pdf-export",
    "cmd": "qa:parent-pdf-export",
    "status": "fail"
  },
  {
    "id": "f-sample-pdfs",
    "cmd": "node C:\\Users\\ERAN YOSEF\\Desktop\\final projects\\FINAL-WEB\\LIOSH-WEB-TRY\\scripts\\overnight-parent-ai-sample-pdfs.mjs --outDir C:\\Users\\ERAN YOSEF\\Desktop\\final projects\\FINAL-WEB\\LIOSH-WEB-TRY\\reports\\overnight-parent-ai-audit\\2026-05-04T00-17-26\\sample-pdfs",
    "status": "fail"
  },
  {
    "id": "f-ls-pdf-export",
    "cmd": "qa:learning-simulator:pdf-export",
    "status": "fail"
  }
]

## 5. Parent AI summary
- Insight / report AI tests: see phase B logs and `parent-ai-core-summary.json`.
- Detailed Copilot suites: phase C and `parent-copilot-summary.json`.
- PDF gates: phase F; profile PDFs under `sample-pdfs/`.
- External / simulations / feedback: phase D.

## 6. Safety summary (synthetic checks)
- Manual matrix + Phase F simulators cover hedging, external framing, practice disclaimer.
- Review `manual-qa-matrix-output/` and `synthetic-e2e/` for heuristic failures.

## 7. Data / privacy
- No production telemetry; secrets redacted in logs.

## 8. Engine / planner / metadata
- Phase G commands and logs (`g1`–`g5`).

## 9. Learning simulator
- Phase H + copied `reports/learning-simulator` snapshot.

## 10. Remaining work / priorities
- Investigate any **fail** or **timeout** rows first; then warnings from skipped scripts.
- PDF timeouts often mean dev server not ready — re-run with `QA_BASE_URL`.

## 11. Recommended next tasks (first pass)
1. Fix failing npm scripts with exit code ≠ 0.
2. Re-run timed-out steps with higher timeout or healthier machine.
3. Verify PDF artifacts under `pdf/` and `sample-pdfs/`.
4. Triage learning-simulator output under `copied/learning-simulator/`.
5. Close gaps in question-metadata / planner if G phase failed.

## Artifact index
- Output root: `C:\Users\ERAN YOSEF\Desktop\final projects\FINAL-WEB\LIOSH-WEB-TRY\reports\overnight-parent-ai-audit\2026-05-04T00-17-26`
- Logs: `C:\Users\ERAN YOSEF\Desktop\final projects\FINAL-WEB\LIOSH-WEB-TRY\reports\overnight-parent-ai-audit\2026-05-04T00-17-26\logs`, merged: `parent-ai-core.log`, `parent-copilot-all.log`, `build.log`
- Copied reports: `copied/`
- PDF artifacts: `pdf/`, `sample-pdfs/` (profile PDFs named `*__parent-report-*.pdf`)
- Synthetic: `synthetic-e2e/`, manual matrix: `manual-qa-matrix-output/`
