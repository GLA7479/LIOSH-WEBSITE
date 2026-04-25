# Manual Browser QA Checklist — Parent Reports Release Gate

## Preconditions
- Run app in dev mode with real UI rendering.
- Use at least one player with data and one without data.
- Device targets: mobile 360px and desktop >=1280px.
- Execution context note: interactive browser QA is not available in this agent runtime.

## A. Short report — mobile 360px
- [ ] Open `/learning/parent-report`.
- [ ] Verify `סיכום קצר להורה` appears near top.
- [ ] Verify no horizontal scroll.
- [ ] Verify first screen clearly says what to do now.
- [ ] Verify no duplicate top action.
- [ ] Verify link to detailed report is visible.
- Status: BLOCKED
- Evidence / note: No interactive browser/devtools viewport available in agent runtime; cannot visually validate.
- Exact route tested: `/learning/parent-report`
- Viewport tested: `360x800` (required, not executable here)
- Screenshot path: N/A (blocked)

## B. Short report — desktop
- [ ] Open `/learning/parent-report` at >=1280px.
- [ ] Verify `סיכום קצר להורה` still appears near top.
- [ ] Verify no horizontal scroll.
- [ ] Verify no duplicate top action.
- [ ] Verify charts/metrics do not push contract preview too far down.
- Status: BLOCKED
- Evidence / note: No interactive browser/devtools desktop rendering available in agent runtime.
- Exact route tested: `/learning/parent-report`
- Viewport tested: `1366x768` (required, not executable here)
- Screenshot path: N/A (blocked)

## C. Detailed report full mode — mobile 360px
- [ ] Open `/learning/parent-report-detailed`.
- [ ] Verify `סיכום להורה` appears before `סיכום לתקופה`.
- [ ] Verify first screen has `מצב` / `מיקוד` / `מה עושים עכשיו`.
- [ ] Verify subject sections are readable.
- [ ] Verify no duplicate main action.
- [ ] Verify no horizontal overflow.
- Status: BLOCKED
- Evidence / note: Browser-like visual execution unavailable; cannot verify layout, order, and first-screen readability visually.
- Exact route tested: `/learning/parent-report-detailed`
- Viewport tested: `360x800` (required, not executable here)
- Screenshot path: N/A (blocked)

## D. Detailed report summary mode
- [ ] Open `/learning/parent-report-detailed?mode=summary`.
- [ ] Verify top contract appears.
- [ ] Verify subject contract mini-blocks appear.
- [ ] Verify summary mode is shorter than full mode.
- Status: BLOCKED
- Evidence / note: No interactive browser run available for visual comparison between full and summary mode.
- Exact route tested: `/learning/parent-report-detailed?mode=summary`
- Viewport tested: `360x800` and `1366x768` (required, not executable here)
- Screenshot path: N/A (blocked)

## E. Print / PDF
- [ ] Print full mode.
- [ ] Print summary mode.
- [ ] Verify black text on white.
- [ ] Verify first page includes parent summary.
- [ ] Verify no washed-out text.
- [ ] Verify no section is cut in a confusing way.
- Status: BLOCKED
- Evidence / note: Print preview/PDF visual validation requires browser print dialog; not available in current runtime.
- Exact route tested: `/learning/parent-report-detailed` and `/learning/parent-report-detailed?mode=summary`
- Viewport tested: Browser print preview (required, not executable here)
- Screenshot path: N/A (blocked)

## F. Edge cases
- [ ] No player name.
- [ ] No data.
- [ ] Partial data.
- [ ] Stable mastery case.
- [ ] Weak thin evidence case.
- [ ] Trend insufficient case.
- Status: BLOCKED
- Evidence / note: Requires interactive scenario switching and visual confirmation per route; not available in current runtime.
- Exact route tested: `/learning/parent-report` and `/learning/parent-report-detailed` (scenario-specific runs required)
- Viewport tested: `360x800` and `1366x768` (required, not executable here)
- Screenshot path: N/A (blocked)
