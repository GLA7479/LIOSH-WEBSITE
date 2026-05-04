# FINAL_REPORT — Overnight Parent AI audit

## 1. Overall status

**FAIL**

## 2. Product vs infrastructure

- **Product-oriented failures (estimated):** 1
- **Infrastructure / test-runner failures:** 0
- **Parent AI core scripts passed:** yes (per configured IDs)
- **PDF failures likely infra:** no

## 3. Executive summary (Hebrew)

סיכום לילי אוטומטי (2026-05-04T18-38-35): מצב כולל FAIL.
פקודות שעברו: 35, נכשלו: 1, timeout: 0, דולגו: 0.
כשלי מוצר (משוערים): 1; כשלי תשתית/רנר: 0.

## 4. Failure analysis (all fail/timeout)

[
  {
    "id": "f-sample-pdfs",
    "command": "C:\\Program Files\\nodejs\\node.exe C:\\Users\\ERAN YOSEF\\Desktop\\final projects\\FINAL-WEB\\LIOSH-WEB-TRY\\scripts\\overnight-parent-ai-sample-pdfs.mjs --outDir C:\\Users\\ERAN YOSEF\\Desktop\\final projects\\FINAL-WEB\\LIOSH-WEB-TRY\\reports\\overnight-parent-ai-audit\\2026-05-04T18-38-35\\sample-pdfs",
    "status": "fail",
    "category": "PRODUCT_FAILURE",
    "blocksRelease": true,
    "likelyCause": "Assertion/test expectation — review product or fixture",
    "excerpt": "[overnight-sample-pdfs] skip insight assertions for strong-stable-detailed (timeout)\novernight-parent-ai-sample-pdfs: FAIL C:\\Users\\ERAN YOSEF\\Desktop\\final projects\\FINAL-WEB\\LIOSH-WEB-TRY\\reports\\overnight-parent-ai-audit\\2026-05-04T18-38-35\\sample-pdfs\n[validation] PDF too small (787 bytes): C:\\Users\\ERAN YOSEF\\Desktop\\final projects\\FINAL-WEB\\LIOSH-WEB-TRY\\reports\\overnight-parent-ai-audit\\2026-05-04T18-38-35\\sample-pdfs\\strong-stable__parent-report-detailed-full.pdf\nPDF missing expected Hebrew insight text (תובנה להורה): strong-stable__parent-report-detailed-full.pdf\n",
    "logPath": "logs\\f-sample-pdfs.log",
    "priority": "high"
  }
]

## 5. Command table

| id | command | status | category | ms | log |
|----|---------|--------|----------|-----|-----|
| build | build | pass |  | 158731 | logs\build.log |
| b1 | test:parent-ai-context:consistency | pass |  | 1436 | logs\b1.log |
| b2 | test:parent-report-ai:integration | pass |  | 1242 | logs\b2.log |
| b3 | test:parent-report-ai:scenario-simulator | pass |  | 1427 | logs\b3.log |
| c-0 | test:parent-copilot-phase6 | pass |  | 2508 | logs\c-0.log |
| c-1 | test:parent-copilot-observability-contract | pass |  | 2621 | logs\c-1.log |
| c-2 | test:parent-copilot-parent-render | pass |  | 2327 | logs\c-2.log |
| c-3 | test:parent-copilot-product-behavior | pass |  | 1711 | logs\c-3.log |
| c-4 | test:parent-copilot-classifier-edge-matrix | pass |  | 2661 | logs\c-4.log |
| c-5 | test:parent-copilot-scope-collision | pass |  | 1436 | logs\c-5.log |
| c-6 | test:parent-copilot-semantic-nearmiss | pass |  | 2369 | logs\c-6.log |
| c-7 | test:parent-copilot-broad-report-routing | pass |  | 2769 | logs\c-7.log |
| c-8 | test:parent-copilot-recommendation-semantic | pass |  | 2885 | logs\c-8.log |
| c-9 | test:parent-copilot-question-class-behavior | pass |  | 1602 | logs\c-9.log |
| c-10 | test:parent-copilot-async-llm-gate | pass |  | 1107 | logs\c-10.log |
| c-11 | test:parent-copilot-copilot-turn-api | pass |  | 3537 | logs\c-11.log |
| d1 | test:parent-ai-phase-e:external | pass |  | 1057 | logs\d1.log |
| d2 | test:parent-ai:simulations | pass |  | 1800 | logs\d2.log |
| d3 | test:parent-ai:feedback-aggregate | pass |  | 1247 | logs\d3.log |
| d4 | test:parent-ai:assistant-qa | pass |  | 1775 | logs\d4.log |
| d5 | test:parent-ai:external-question | pass |  | 1113 | logs\d5.log |
| d6 | test:parent-ai:bad-prompt | pass |  | 2512 | logs\d6.log |
| d-manual | tsx C:\Users\ERAN YOSEF\Desktop\final projects\FINAL-WEB\LIOSH-WEB-TRY\scripts\parent-ai-manual-qa-matrix.mjs --outDir C:\Users\ERAN YOSEF\Desktop\final projects\FINAL-WEB\LIOSH-WEB-TRY\reports\overnight-parent-ai-audit\2026-05-04T18-38-35\manual-qa-matrix-output | pass |  | 3513 | logs\d-manual.log |
| e-ssr | tsx C:\Users\ERAN YOSEF\Desktop\final projects\FINAL-WEB\LIOSH-WEB-TRY\scripts\parent-report-pages-ssr.mjs | pass |  | 3366 | logs\e-ssr.log |
| e-phase1 | test:parent-report-phase1 | pass |  | 1498 | logs\e-phase1.log |
| f-pdf-export | qa:parent-pdf-export | pass |  | 30342 | logs\f-pdf-export.log |
| f-sample-pdfs | C:\Program Files\nodejs\node.exe C:\Users\ERAN YOSEF\Desktop\final projects\FINAL-WEB\LIOSH-WEB-TRY\scripts\overnight-parent-ai-sample-pdfs.mjs --outDir C:\Users\ERAN YOSEF\Desktop\final projects\FINAL-WEB\LIOSH-WEB-TRY\reports\overnight-parent-ai-audit\2026-05-04T18-38-35\sample-pdfs | fail | PRODUCT_FAILURE | 154727 | logs\f-sample-pdfs.log |
| f-ls-pdf-export | qa:learning-simulator:pdf-export | pass |  | 13567 | logs\f-ls-pdf-export.log |
| g1 | qa:question-metadata | pass |  | 1320 | logs\g1.log |
| g2 | test:adaptive-planner:artifacts | pass |  | 956 | logs\g2.log |
| g3 | test:adaptive-planner:runtime | pass |  | 805 | logs\g3.log |
| g4 | test:adaptive-planner:recommended-practice | pass |  | 647 | logs\g4.log |
| g5 | test:adaptive-planner:scenario-simulator | pass |  | 736 | logs\g5.log |
| h-quick | qa:learning-simulator:quick | pass |  | 9778 | logs\h-quick.log |
| h-full | qa:learning-simulator:full | pass |  | 472307 | logs\h-full.log |
| i-synthetic | tsx C:\Users\ERAN YOSEF\Desktop\final projects\FINAL-WEB\LIOSH-WEB-TRY\scripts\overnight-synthetic-e2e-scenarios.mjs --outDir C:\Users\ERAN YOSEF\Desktop\final projects\FINAL-WEB\LIOSH-WEB-TRY\reports\overnight-parent-ai-audit\2026-05-04T18-38-35\synthetic-e2e | pass |  | 3144 | logs\i-synthetic.log |

## 6. Top actionable issues

[
  {
    "id": "f-sample-pdfs",
    "command": "C:\\Program Files\\nodejs\\node.exe C:\\Users\\ERAN YOSEF\\Desktop\\final projects\\FINAL-WEB\\LIOSH-WEB-TRY\\scripts\\overnight-parent-ai-sample-pdfs.mjs --outDir C:\\Users\\ERAN YOSEF\\Desktop\\final projects\\FINAL-WEB\\LIOSH-WEB-TRY\\reports\\overnight-parent-ai-audit\\2026-05-04T18-38-35\\sample-pdfs",
    "status": "fail",
    "category": "PRODUCT_FAILURE",
    "blocksRelease": true,
    "likelyCause": "Assertion/test expectation — review product or fixture",
    "excerpt": "[overnight-sample-pdfs] skip insight assertions for strong-stable-detailed (timeout)\novernight-parent-ai-sample-pdfs: FAIL C:\\Users\\ERAN YOSEF\\Desktop\\final projects\\FINAL-WEB\\LIOSH-WEB-TRY\\reports\\overnight-parent-ai-audit\\2026-05-04T18-38-35\\sample-pdfs\n[validation] PDF too small (787 bytes): C:\\Users\\ERAN YOSEF\\Desktop\\final projects\\FINAL-WEB\\LIOSH-WEB-TRY\\reports\\overnight-parent-ai-audit\\2026-05-04T18-38-35\\sample-pdfs\\strong-stable__parent-report-detailed-full.pdf\nPDF missing expected Hebrew insight text (תובנה להורה): strong-stable__parent-report-detailed-full.pdf\n",
    "logPath": "logs\\f-sample-pdfs.log",
    "priority": "high"
  }
]

## 7. Recommended next fixes

1. Fix PRODUCT_FAILURE rows—review failing assertion/logic.
2. Fix ESM failures—suites now use `tsx` in package.json; re-run.
3. For DEV_SERVER_FAILURE—ensure port free; orchestrator waits for HTTP 200.
4. For PDF_GATE_FAILURE—set QA_BASE_URL to healthy Next dev before gates.

## 8. Sample PDFs (overnight-parent-ai-sample-pdfs.mjs)

- **Summary file:** `sample-pdfs\sample-pdfs-summary.json` (exists: true)
- **Expected PDF count:** 10
- **Generated PDF count:** 10
- **summary.ok:** false
- **Failed profiles:** (none)
- **Generated files:** strong-stable__parent-report-detailed-full.pdf, strong-stable__parent-report-short.pdf, weak-but-improving__parent-report-detailed-full.pdf, weak-but-improving__parent-report-short.pdf, very-little-data__parent-report-detailed-full.pdf, very-little-data__parent-report-short.pdf, six-subject-mixed__parent-report-detailed-full.pdf, six-subject-mixed__parent-report-short.pdf, external-question-flow-report-surface__parent-report-detailed-full.pdf, external-question-flow-report-surface__parent-report-short.pdf
- **Validation errors:** [
  "PDF too small (787 bytes): C:\\Users\\ERAN YOSEF\\Desktop\\final projects\\FINAL-WEB\\LIOSH-WEB-TRY\\reports\\overnight-parent-ai-audit\\2026-05-04T18-38-35\\sample-pdfs\\strong-stable__parent-report-detailed-full.pdf",
  "PDF missing expected Hebrew insight text (תובנה להורה): strong-stable__parent-report-detailed-full.pdf"
]

## Artifact index
- Output root: `C:\Users\ERAN YOSEF\Desktop\final projects\FINAL-WEB\LIOSH-WEB-TRY\reports\overnight-parent-ai-audit\2026-05-04T18-38-35`
- Logs: `C:\Users\ERAN YOSEF\Desktop\final projects\FINAL-WEB\LIOSH-WEB-TRY\reports\overnight-parent-ai-audit\2026-05-04T18-38-35\logs`
- PDF / sample-pdfs: `pdf/`, `sample-pdfs/`
