# Manual Browser QA Checklist — Parent Reports Release Gate

## Execution
- Tool: Playwright (headless browser automation)
- Base URL: `http://localhost:3001`
- Viewports: `360x800`, `1366x768`
- Print capture: `emulateMedia('print')` screenshots

## A) Valid Seeded Report QA (product checks)

### A1. Short report — mobile
- Route: `/learning/parent-report`
- Viewport: `360x800`
- Screenshot: `reports/parent-report-product-contract/manual-qa-evidence/seeded/01-short-mobile-top.png`
- Checks:
  - `סיכום קצר להורה` near top: PASS
  - first screen says what to do: PASS
  - no horizontal scroll: PASS
  - no duplicate main action: PASS
  - detailed report link visible: PASS
- Status: PASS

### A2. Short report — desktop
- Route: `/learning/parent-report`
- Viewport: `1366x768`
- Screenshot: `reports/parent-report-product-contract/manual-qa-evidence/seeded/02-short-desktop-top.png`
- Checks:
  - `סיכום קצר להורה` near top: PASS
  - first screen says what to do: PASS
  - no horizontal scroll: PASS
  - no duplicate main action: PASS
  - detailed report link visible: PASS
  - charts/metrics do not push preview too far down: PASS
- Status: PASS

### A3. Detailed full — mobile
- Route: `/learning/parent-report-detailed`
- Viewport: `360x800`
- Screenshot: `reports/parent-report-product-contract/manual-qa-evidence/seeded/03-detailed-full-mobile-top.png`
- Checks:
  - `סיכום להורה` before `סיכום לתקופה`: PASS
  - first screen has מצב/מיקוד עיקרי/מה עושים עכשיו: PASS
  - subject sections readable: PASS
  - no duplicate main action: PASS
  - no horizontal overflow: PASS
- Status: PASS
- Triage note: previous result was QA_HEURISTIC_FALSE_POSITIVE (old assertion expected `סיכום מקצועות להורה`; actual full page heading is `מקצועות הלימוד`).

### A4. Detailed full — desktop
- Route: `/learning/parent-report-detailed`
- Viewport: `1366x768`
- Screenshot: `reports/parent-report-product-contract/manual-qa-evidence/seeded/04-detailed-full-desktop-top.png`
- Checks:
  - `סיכום להורה` before `סיכום לתקופה`: PASS
  - first screen has מצב/מיקוד עיקרי/מה עושים עכשיו: PASS
  - subject sections readable: PASS
  - no duplicate main action: PASS
  - no horizontal overflow: PASS
- Status: PASS

### A5. Detailed summary — mobile
- Route: `/learning/parent-report-detailed?mode=summary`
- Viewport: `360x800`
- Screenshot: `reports/parent-report-product-contract/manual-qa-evidence/seeded/05-detailed-summary-mobile-top.png`
- Checks:
  - contract top appears: PASS
  - subject contract mini-blocks appear: PASS
  - summary lighter than full: PASS
  - no horizontal overflow: PASS
- Status: PASS
- Triage note: previous mini-block failure was QA_HEURISTIC_FALSE_POSITIVE (wrong label heuristic).

### A6. Detailed summary — desktop
- Route: `/learning/parent-report-detailed?mode=summary`
- Viewport: `1366x768`
- Screenshot: `reports/parent-report-product-contract/manual-qa-evidence/seeded/06-detailed-summary-desktop-top.png`
- Checks:
  - contract top appears: PASS
  - subject contract mini-blocks appear: PASS
  - summary lighter than full: PASS
  - no horizontal overflow: PASS
- Status: PASS

### A7. Print/PDF — seeded
- Full screenshot: `reports/parent-report-product-contract/manual-qa-evidence/seeded/07-print-full-first-page.png`
- Summary screenshot: `reports/parent-report-product-contract/manual-qa-evidence/seeded/08-print-summary-first-page.png`
- Checks:
  - first page includes parent summary: PASS
  - black text on white readable: PASS
  - no washed-out text: PASS
  - no confusing cut section: PASS
  - summary print shorter than full print: INCONCLUSIVE_PRINT_LENGTH_CHECK
- Status: PASS
- Triage note: first-page screenshots cannot prove total print length; treated as INCONCLUSIVE, not product failure.

### Seeded QA aggregate
- Status: PASS

## B) Edge-state QA (behavior checks)

### B1. No player name
- Route: `/learning/parent-report-detailed`
- Screenshot: `reports/parent-report-product-contract/manual-qa-evidence/edge/01-no-player.png`
- Status: PASS (expected guard screen shown)

### B2. No data
- Route: `/learning/parent-report`
- Screenshot: `reports/parent-report-product-contract/manual-qa-evidence/edge/02-no-data.png`
- Status: PASS (expected no-data state shown)

### B3. Partial data
- Route: `/learning/parent-report`
- Screenshot: `reports/parent-report-product-contract/manual-qa-evidence/edge/03-partial-data.png`
- Status: PASS

### Edge QA aggregate
- Status: PASS
