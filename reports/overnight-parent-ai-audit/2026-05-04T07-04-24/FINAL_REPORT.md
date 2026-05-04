# FINAL_REPORT — Overnight Parent AI audit

## 1. Overall status

**FAIL**

## 2. Product vs infrastructure

- **Product-oriented failures (estimated):** 0
- **Infrastructure / test-runner failures:** 1
- **Parent AI core scripts passed:** yes (per configured IDs)
- **PDF failures likely infra:** no

## 3. Executive summary (Hebrew)

סיכום לילי אוטומטי (2026-05-04T07-04-24) [מצב smoke]: מצב כולל FAIL.
פקודות שעברו: 4, נכשלו: 1, timeout: 0, דולגו: 2.
כשלי מוצר (משוערים): 0; כשלי תשתית/רנר: 1.

## 4. Failure analysis (all fail/timeout)

[
  {
    "id": "f-pdf-export",
    "command": "qa:parent-pdf-export",
    "status": "fail",
    "category": "TEST_RUNNER_FAILURE",
    "blocksRelease": false,
    "likelyCause": "See log excerpt",
    "excerpt": "\n> leo-k-kids-site@1.0.0 qa:parent-pdf-export\n> tsx scripts/qa-parent-pdf-export.mjs\n\npage.waitForSelector: Timeout 90000ms exceeded.\nCall log:\n  - waiting for locator('.parent-report-parent-ai-insight')\n\n    at assertDetailedInsightAndCopilotPrintBehavior (C:\\Users\\ERAN YOSEF\\Desktop\\final projects\\FINAL-WEB\\LIOSH-WEB-TRY\\scripts\\qa-parent-pdf-export.mjs:120:14)\n    at main (C:\\Users\\ERAN YOSEF\\Desktop\\final projects\\FINAL-WEB\\LIOSH-WEB-TRY\\scripts\\qa-parent-pdf-export.mjs:184:9) {\n  name: 'TimeoutError'\n}\n",
    "logPath": "logs\\f-pdf-export.log",
    "priority": "medium"
  }
]

## 5. Command table

| id | command | status | category | ms | log |
|----|---------|--------|----------|-----|-----|
| build | build | skipped_smoke | ADVISORY_WARNING | 0 |  |
| b1 | test:parent-ai-context:consistency | pass |  | 591 | logs\b1.log |
| c-0 | test:parent-copilot-phase6 | pass |  | 770 | logs\c-0.log |
| e-ssr | tsx C:\Users\ERAN YOSEF\Desktop\final projects\FINAL-WEB\LIOSH-WEB-TRY\scripts\parent-report-pages-ssr.mjs | pass |  | 1155 | logs\e-ssr.log |
| f-pdf-export | qa:parent-pdf-export | fail | TEST_RUNNER_FAILURE | 97696 | logs\f-pdf-export.log |
| f-sample-pdfs | C:\Program Files\nodejs\node.exe C:\Users\ERAN YOSEF\Desktop\final projects\FINAL-WEB\LIOSH-WEB-TRY\scripts\overnight-parent-ai-sample-pdfs.mjs --outDir C:\Users\ERAN YOSEF\Desktop\final projects\FINAL-WEB\LIOSH-WEB-TRY\reports\overnight-parent-ai-audit\2026-05-04T07-04-24\sample-pdfs | pass |  | 3823 | logs\f-sample-pdfs.log |
| h-smoke-skip | h-smoke-skip | skipped_smoke | ADVISORY_WARNING | 0 |  |

## 6. Top actionable issues

[
  {
    "id": "f-pdf-export",
    "command": "qa:parent-pdf-export",
    "status": "fail",
    "category": "TEST_RUNNER_FAILURE",
    "blocksRelease": false,
    "likelyCause": "See log excerpt",
    "excerpt": "\n> leo-k-kids-site@1.0.0 qa:parent-pdf-export\n> tsx scripts/qa-parent-pdf-export.mjs\n\npage.waitForSelector: Timeout 90000ms exceeded.\nCall log:\n  - waiting for locator('.parent-report-parent-ai-insight')\n\n    at assertDetailedInsightAndCopilotPrintBehavior (C:\\Users\\ERAN YOSEF\\Desktop\\final projects\\FINAL-WEB\\LIOSH-WEB-TRY\\scripts\\qa-parent-pdf-export.mjs:120:14)\n    at main (C:\\Users\\ERAN YOSEF\\Desktop\\final projects\\FINAL-WEB\\LIOSH-WEB-TRY\\scripts\\qa-parent-pdf-export.mjs:184:9) {\n  name: 'TimeoutError'\n}\n",
    "logPath": "logs\\f-pdf-export.log",
    "priority": "medium"
  }
]

## 7. Recommended next fixes

1. Fix PRODUCT_FAILURE rows—review failing assertion/logic.
2. Fix ESM failures—suites now use `tsx` in package.json; re-run.
3. For DEV_SERVER_FAILURE—ensure port free; orchestrator waits for HTTP 200.
4. For PDF_GATE_FAILURE—set QA_BASE_URL to healthy Next dev before gates.

## Artifact index
- Output root: `C:\Users\ERAN YOSEF\Desktop\final projects\FINAL-WEB\LIOSH-WEB-TRY\reports\overnight-parent-ai-audit\2026-05-04T07-04-24`
- Logs: `C:\Users\ERAN YOSEF\Desktop\final projects\FINAL-WEB\LIOSH-WEB-TRY\reports\overnight-parent-ai-audit\2026-05-04T07-04-24\logs`
- PDF / sample-pdfs: `pdf/`, `sample-pdfs/`
