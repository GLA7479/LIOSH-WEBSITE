# Render release gate — infrastructure audit

- Generated at: 2026-05-03T20:35:13.468Z

| Question | Answer |
| --- | --- |
| Playwright installed (package.json) | **yes** |
| playwright.config.ts | **yes** |

## E2E tests discovered

- `tests/e2e/active-diagnosis/learning-flows.spec.ts`

## Report / learning routes (reference)

### Parent/report

- `/learning/parent-report`
- `/learning/parent-report-detailed`
- `/learning/parent-report-detailed.renderable`
- `/learning/dev-db-report-preview`

### Learning entry

- `/learning`
- `/learning/curriculum`
- `/learning/math-master`
- `/learning/science-master`

## PDF / export

- Client-side: utils/math-report-generator exportReportToPDF used from pages/learning/parent-report.js (no dedicated /api/pdf route)

## Components / SSR

- components/parent-report-detailed-surface.jsx
- components/parent-report-short-contract-preview.jsx
- components/parent-report-contract-ui-blocks.jsx
- scripts/parent-report-pages-ssr.mjs (SSR smoke, no browser)

## Recommended minimal gate

- Playwright chromium against next dev for /learning/* + parent-report with seeded simulator storage
- Fallback: tsx scripts/parent-report-pages-ssr.mjs if browser unavailable

## Risks

- Dev server startup time; port conflicts
- Parent report depends on localStorage shape from aggregate simulator artifacts
- PDF generation is in-page (html2pdf/jspdf) — full PDF binary validation not in scope

JSON: `C:/Users/ERAN YOSEF/Desktop/final projects/FINAL-WEB/LIOSH-WEB-TRY/reports/learning-simulator/render-release-gate-audit.json`
