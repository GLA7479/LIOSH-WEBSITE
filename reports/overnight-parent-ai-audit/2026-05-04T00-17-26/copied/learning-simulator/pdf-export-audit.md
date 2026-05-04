# PDF export — implementation audit

- Generated at: 2026-05-04T00:22:46.861Z

| Field | Value |
| --- | --- |
| pdfLibraryDetected | ^0.10.1 |
| exportIsClientSide | yes |
| exportIsServerSide | no |
| hasDedicatedPdfRoute | no |
| hasExportButton | yes |

## Mechanism

exportReportToPDF(report, options) in utils/math-report-generator.js. Default options.method is "print" → window.print() (no file download). With method "canvas", dynamic import of html2pdf.js/dist/html2pdf.js then html2pdf().set(opt).from(el).save() (jsPDF inside html2pdf options).

## Button / selectors

- pages/learning/parent-report.js — button with visible label containing ייצא ל-PDF
- QA file mode: query ?qa_pdf=file so click passes { method: "canvas" } (html2pdf path)

## Requires

- Auth/session: true (StudentAccessGate + mocked /api/student/me in gate)
- localStorage seed: true
- Built report object in page: true

## Playwright download testability

Yes when navigating to /learning/parent-report?qa_pdf=file with seeded aggregate storage + mocked /api/student/me; canvas path emits a browser download.

## Blocking issues

- Without ?qa_pdf=file, default UI uses print dialog — not capturable as Playwright download.

## Recommended gate

Playwright: open parent-report with ?qa_pdf=file, seed storage, click export, assert download + %PDF header + min size.

## Future

Optional dedicated /api PDF route if product moves generation server-side; keep client path tested via canvas.

## Evidence files

- utils/math-report-generator.js (exportReportToPDF)
- pages/learning/parent-report.js (export button)
- package.json (html2pdf.js dependency)

JSON: C:/Users/ERAN YOSEF/Desktop/final projects/FINAL-WEB/LIOSH-WEB-TRY/reports/learning-simulator/pdf-export-audit.json
