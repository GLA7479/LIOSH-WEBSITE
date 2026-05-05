# FINAL_REPORT — Overnight Parent AI audit

## 1. Overall status

**FAIL**

## 2. Product vs infrastructure

- **Product-oriented failures (estimated):** 0
- **Infrastructure / test-runner failures:** 1
- **Parent AI core scripts passed:** yes (per configured IDs)
- **PDF failures likely infra:** no

## 3. Executive summary (Hebrew)

סיכום לילי אוטומטי (2026-05-05T18-57-31): מצב כולל FAIL.
פקודות שעברו: 35, נכשלו: 0, timeout: 1, דולגו: 0.
כשלי מוצר (משוערים): 0; כשלי תשתית/רנר: 1.

## 4. Failure analysis (all fail/timeout)

[
  {
    "id": "f-sample-pdfs",
    "command": "C:\\Program Files\\nodejs\\node.exe C:\\Users\\ERAN YOSEF\\Desktop\\final projects\\FINAL-WEB\\LIOSH-WEB-TRY\\scripts\\overnight-parent-ai-sample-pdfs.mjs --outDir C:\\Users\\ERAN YOSEF\\Desktop\\final projects\\FINAL-WEB\\LIOSH-WEB-TRY\\reports\\overnight-parent-ai-audit\\2026-05-05T18-57-31\\sample-pdfs",
    "status": "timeout",
    "category": "TEST_RUNNER_FAILURE",
    "blocksRelease": false,
    "likelyCause": "See log excerpt",
    "excerpt": null,
    "logPath": "logs\\f-sample-pdfs.log",
    "priority": "medium"
  }
]

## 5. Command table

| id | command | status | category | ms | log |
|----|---------|--------|----------|-----|-----|
| build | build | pass |  | 30473 | logs\build.log |
| b1 | test:parent-ai-context:consistency | pass |  | 900 | logs\b1.log |
| b2 | test:parent-report-ai:integration | pass |  | 973 | logs\b2.log |
| b3 | test:parent-report-ai:scenario-simulator | pass |  | 735 | logs\b3.log |
| c-0 | test:parent-copilot-phase6 | pass |  | 930 | logs\c-0.log |
| c-1 | test:parent-copilot-observability-contract | pass |  | 850 | logs\c-1.log |
| c-2 | test:parent-copilot-parent-render | pass |  | 854 | logs\c-2.log |
| c-3 | test:parent-copilot-product-behavior | pass |  | 686 | logs\c-3.log |
| c-4 | test:parent-copilot-classifier-edge-matrix | pass |  | 570 | logs\c-4.log |
| c-5 | test:parent-copilot-scope-collision | pass |  | 575 | logs\c-5.log |
| c-6 | test:parent-copilot-semantic-nearmiss | pass |  | 561 | logs\c-6.log |
| c-7 | test:parent-copilot-broad-report-routing | pass |  | 719 | logs\c-7.log |
| c-8 | test:parent-copilot-recommendation-semantic | pass |  | 642 | logs\c-8.log |
| c-9 | test:parent-copilot-question-class-behavior | pass |  | 702 | logs\c-9.log |
| c-10 | test:parent-copilot-async-llm-gate | pass |  | 666 | logs\c-10.log |
| c-11 | test:parent-copilot-copilot-turn-api | pass |  | 1217 | logs\c-11.log |
| d1 | test:parent-ai-phase-e:external | pass |  | 665 | logs\d1.log |
| d2 | test:parent-ai:simulations | pass |  | 721 | logs\d2.log |
| d3 | test:parent-ai:feedback-aggregate | pass |  | 371 | logs\d3.log |
| d4 | test:parent-ai:assistant-qa | pass |  | 701 | logs\d4.log |
| d5 | test:parent-ai:external-question | pass |  | 699 | logs\d5.log |
| d6 | test:parent-ai:bad-prompt | pass |  | 686 | logs\d6.log |
| d-manual | tsx C:\Users\ERAN YOSEF\Desktop\final projects\FINAL-WEB\LIOSH-WEB-TRY\scripts\parent-ai-manual-qa-matrix.mjs --outDir C:\Users\ERAN YOSEF\Desktop\final projects\FINAL-WEB\LIOSH-WEB-TRY\reports\overnight-parent-ai-audit\2026-05-05T18-57-31\manual-qa-matrix-output | pass |  | 2163 | logs\d-manual.log |
| e-ssr | tsx C:\Users\ERAN YOSEF\Desktop\final projects\FINAL-WEB\LIOSH-WEB-TRY\scripts\parent-report-pages-ssr.mjs | pass |  | 1294 | logs\e-ssr.log |
| e-phase1 | test:parent-report-phase1 | pass |  | 1008 | logs\e-phase1.log |
| f-pdf-export | qa:parent-pdf-export | pass |  | 14216 | logs\f-pdf-export.log |
| f-sample-pdfs | C:\Program Files\nodejs\node.exe C:\Users\ERAN YOSEF\Desktop\final projects\FINAL-WEB\LIOSH-WEB-TRY\scripts\overnight-parent-ai-sample-pdfs.mjs --outDir C:\Users\ERAN YOSEF\Desktop\final projects\FINAL-WEB\LIOSH-WEB-TRY\reports\overnight-parent-ai-audit\2026-05-05T18-57-31\sample-pdfs | timeout | TEST_RUNNER_FAILURE | 1200304 | logs\f-sample-pdfs.log |
| f-ls-pdf-export | qa:learning-simulator:pdf-export | pass |  | 17093 | logs\f-ls-pdf-export.log |
| g1 | qa:question-metadata | pass |  | 2550 | logs\g1.log |
| g2 | test:adaptive-planner:artifacts | pass |  | 1253 | logs\g2.log |
| g3 | test:adaptive-planner:runtime | pass |  | 1299 | logs\g3.log |
| g4 | test:adaptive-planner:recommended-practice | pass |  | 1096 | logs\g4.log |
| g5 | test:adaptive-planner:scenario-simulator | pass |  | 1167 | logs\g5.log |
| h-quick | qa:learning-simulator:quick | pass |  | 16236 | logs\h-quick.log |
| h-full | qa:learning-simulator:full | pass |  | 532161 | logs\h-full.log |
| i-synthetic | tsx C:\Users\ERAN YOSEF\Desktop\final projects\FINAL-WEB\LIOSH-WEB-TRY\scripts\overnight-synthetic-e2e-scenarios.mjs --outDir C:\Users\ERAN YOSEF\Desktop\final projects\FINAL-WEB\LIOSH-WEB-TRY\reports\overnight-parent-ai-audit\2026-05-05T18-57-31\synthetic-e2e | pass |  | 3218 | logs\i-synthetic.log |

## 6. Top actionable issues

[
  {
    "id": "f-sample-pdfs",
    "command": "C:\\Program Files\\nodejs\\node.exe C:\\Users\\ERAN YOSEF\\Desktop\\final projects\\FINAL-WEB\\LIOSH-WEB-TRY\\scripts\\overnight-parent-ai-sample-pdfs.mjs --outDir C:\\Users\\ERAN YOSEF\\Desktop\\final projects\\FINAL-WEB\\LIOSH-WEB-TRY\\reports\\overnight-parent-ai-audit\\2026-05-05T18-57-31\\sample-pdfs",
    "status": "timeout",
    "category": "TEST_RUNNER_FAILURE",
    "blocksRelease": false,
    "likelyCause": "See log excerpt",
    "excerpt": null,
    "logPath": "logs\\f-sample-pdfs.log",
    "priority": "medium"
  }
]

## 7. Recommended next fixes

1. Fix PRODUCT_FAILURE rows—review failing assertion/logic.
2. Fix ESM failures—suites now use `tsx` in package.json; re-run.
3. For DEV_SERVER_FAILURE—ensure port free; orchestrator waits for HTTP 200.
4. For PDF_GATE_FAILURE—set QA_BASE_URL to healthy Next dev before gates.

## 8. Sample PDFs (overnight-parent-ai-sample-pdfs.mjs)

- **Summary file:** `sample-pdfs\sample-pdfs-summary.json` (exists: false)
- **Expected PDF count:** 10
- **Generated PDF count:** 0
- **summary.ok:** false
- **Failed profiles:** (none)
- **Generated files:** (see summary)
- **Validation errors:** (none)

## Artifact index
- Output root: `C:\Users\ERAN YOSEF\Desktop\final projects\FINAL-WEB\LIOSH-WEB-TRY\reports\overnight-parent-ai-audit\2026-05-05T18-57-31`
- Logs: `C:\Users\ERAN YOSEF\Desktop\final projects\FINAL-WEB\LIOSH-WEB-TRY\reports\overnight-parent-ai-audit\2026-05-05T18-57-31\logs`
- PDF / sample-pdfs: `pdf/`, `sample-pdfs/`
