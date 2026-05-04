# FINAL_REPORT — Overnight Parent AI audit

## 1. Overall status

**PASS_WITH_WARNINGS**

## 2. Product vs infrastructure

- **Product-oriented failures (estimated):** 0
- **Infrastructure / test-runner failures:** 0
- **Parent AI core scripts passed:** yes (per configured IDs)
- **PDF failures likely infra:** no

## 3. Executive summary (Hebrew)

סיכום לילי אוטומטי (2026-05-04T07-06-46) [מצב smoke]: מצב כולל PASS_WITH_WARNINGS.
פקודות שעברו: 4, נכשלו: 0, timeout: 0, דולגו: 3.
כשלי מוצר (משוערים): 0; כשלי תשתית/רנר: 0.

## 4. Failure analysis (all fail/timeout)

[]

## 5. Command table

| id | command | status | category | ms | log |
|----|---------|--------|----------|-----|-----|
| build | build | skipped_smoke | ADVISORY_WARNING | 0 |  |
| b1 | test:parent-ai-context:consistency | pass |  | 881 | logs\b1.log |
| c-0 | test:parent-copilot-phase6 | pass |  | 1128 | logs\c-0.log |
| e-ssr | tsx C:\Users\ERAN YOSEF\Desktop\final projects\FINAL-WEB\LIOSH-WEB-TRY\scripts\parent-report-pages-ssr.mjs | pass |  | 2380 | logs\e-ssr.log |
| f-pdf-export | qa:parent-pdf-export | skipped_smoke | ADVISORY_WARNING | 0 |  |
| f-sample-pdfs | C:\Program Files\nodejs\node.exe C:\Users\ERAN YOSEF\Desktop\final projects\FINAL-WEB\LIOSH-WEB-TRY\scripts\overnight-parent-ai-sample-pdfs.mjs --outDir C:\Users\ERAN YOSEF\Desktop\final projects\FINAL-WEB\LIOSH-WEB-TRY\reports\overnight-parent-ai-audit\2026-05-04T07-06-46\sample-pdfs | pass |  | 3559 | logs\f-sample-pdfs.log |
| h-smoke-skip | h-smoke-skip | skipped_smoke | ADVISORY_WARNING | 0 |  |

## 6. Top actionable issues

[]

## 7. Recommended next fixes

1. Fix PRODUCT_FAILURE rows—review failing assertion/logic.
2. Fix ESM failures—suites now use `tsx` in package.json; re-run.
3. For DEV_SERVER_FAILURE—ensure port free; orchestrator waits for HTTP 200.
4. For PDF_GATE_FAILURE—set QA_BASE_URL to healthy Next dev before gates.

## Artifact index
- Output root: `C:\Users\ERAN YOSEF\Desktop\final projects\FINAL-WEB\LIOSH-WEB-TRY\reports\overnight-parent-ai-audit\2026-05-04T07-06-46`
- Logs: `C:\Users\ERAN YOSEF\Desktop\final projects\FINAL-WEB\LIOSH-WEB-TRY\reports\overnight-parent-ai-audit\2026-05-04T07-06-46\logs`
- PDF / sample-pdfs: `pdf/`, `sample-pdfs/`
