# Manual Browser QA Checklist — Parent Detailed Report

## Preconditions
- Run app in dev mode.
- Ensure test player data exists (or use seeded scenarios).

## 1) Open detailed report (full mode)
1. Open `/learning/parent-report`.
2. Click to open detailed report (`/learning/parent-report-detailed`).
3. Confirm first major block is `סיכום להורה`.
4. Confirm `סיכום לתקופה` appears after `סיכום להורה`.
5. Confirm no competing top "main action" line appears above the contract block.

## 2) Open detailed report (summary mode)
1. Toggle to `תקציר להדפסה`.
2. Confirm top contract block still appears first.
3. Confirm subject contract mini-block appears in each subject card.
4. Confirm text is readable and not duplicated word-for-word from top action.

## 3) Print full report
1. Click `הדפס מלא`.
2. In print preview, confirm black text on white background.
3. Confirm contract summary appears before legacy summary.
4. Confirm no duplicate "main action" in first printed page.

## 4) Print summary report
1. Click `הדפס תקציר`.
2. Confirm contract summary appears and remains readable.
3. Confirm subject contract blocks are visible.
4. Confirm no horizontal clipping.

## 5) Mobile width (~360px)
1. Open browser responsive mode at 360px width.
2. Reload detailed report in full and summary modes.
3. Confirm no horizontal overflow (no sideways scroll on main content).
4. Confirm first screen clearly states what to do now.
5. Confirm subject blocks remain readable and separated.

## 6) Desktop width
1. Open at >=1280px width.
2. Confirm section order and spacing remain stable.
3. Confirm no contradictory recommendation lines between top and subject blocks.

## 7) Final contradiction checks
- `רעיונות קצרים לבית` does not contradict top `מה עושים עכשיו`.
- `כיוון לימים הבאים` does not override top action for current cycle.
- No internal terms (e.g., P1/P2/gate/canonical) visible.
- For trend-insufficient data, no strong trend wording.
- For stable mastery, no remediation wording in top contract area.
