# Render release gate

- Run id: render-gate-mopv0ubz
- Generated at: 2026-05-03T14:22:27.983Z
- **browserMode:** true
- **baseURL:** http://127.0.0.1:3001

## Summary

| Passed | Failed | Deferred checks | Total |
| ---: | ---: | ---: | ---: |
| 4 | 3 | 0 | 7 |

## Surfaces

| Surface | Status | Console err | Fatal err |
| --- | --- | ---: | ---: |
| /learning | ok | 0 | 0 |
| /learning/curriculum | ok | 0 | 0 |
| /learning/math-master | ok | 0 | 0 |
| /learning/science-master | ok | 0 | 0 |
| /learning/parent-report | failed | 0 | 0 |
| /learning/parent-report-detailed | failed | 0 | 0 |
| /learning/parent-report-detailed.renderable | failed | 0 | 0 |

## Deferred (informational)

- **pdf_export_binary:** In-page PDF/export uses html2pdf/jspdf from parent-report UI; binary output validation and print CSS are out of scope for this gate.
- **dev_db_report_preview_authenticated:** dev-db-report-preview requires parent bearer token / env; not opened in automated gate.

## Failures

```json
{
  "checkId": "parent_report_summary",
  "route": "/learning/parent-report",
  "errors": [
    "expectRendered returned false"
  ]
}
```

```json
{
  "checkId": "parent_report_detailed",
  "route": "/learning/parent-report-detailed",
  "errors": [
    "page.goto: Timeout 60000ms exceeded.\nCall log:\n  - navigating to \"http://127.0.0.1:3001/\", waiting until \"domcontentloaded\"\n"
  ]
}
```

```json
{
  "checkId": "parent_report_detailed_renderable",
  "route": "/learning/parent-report-detailed.renderable",
  "errors": [
    "page.goto: Timeout 60000ms exceeded.\nCall log:\n  - navigating to \"http://127.0.0.1:3001/\", waiting until \"domcontentloaded\"\n"
  ]
}
```


Full JSON: `C:/Users/ERAN YOSEF/Desktop/final projects/FINAL-WEB/LIOSH-WEB-TRY/reports/learning-simulator/render-release-gate.json`
