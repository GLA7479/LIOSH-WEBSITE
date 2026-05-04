# Product Quality Phase 7 — Parent Report Editorial Mapping Only

**Last updated:** 2026-05-05  
**Status:** Mapping only. **No Hebrew text, product files, report logic, Parent AI logic, Copilot text, or UI/design was changed.**

This phase identifies parent-facing wording / clarity decisions that require owner review. It does **not** propose replacement Hebrew wording. Where wording may need to change, this document says: **Owner exact wording required**.

## Sources Reviewed

- [`docs/product-quality-phase-4-parent-report-review.md`](product-quality-phase-4-parent-report-review.md)
- [`docs/PARENT_REPORT_EDITORIAL_SIGNOFF.md`](PARENT_REPORT_EDITORIAL_SIGNOFF.md)
- [`docs/product-quality-phase-1-audit.md`](product-quality-phase-1-audit.md)
- [`components/ParentReportImportantDisclaimer.js`](../components/ParentReportImportantDisclaimer.js)
- [`components/ParentReportInsight.jsx`](../components/ParentReportInsight.jsx)
- [`components/parent-report-short-contract-preview.jsx`](../components/parent-report-short-contract-preview.jsx)
- [`components/parent-report-contract-ui-blocks.jsx`](../components/parent-report-contract-ui-blocks.jsx)
- [`components/parent-copilot/parent-copilot-panel.jsx`](../components/parent-copilot/parent-copilot-panel.jsx)
- [`pages/learning/parent-report.js`](../pages/learning/parent-report.js)
- [`utils/parent-data-presence.js`](../utils/parent-data-presence.js)
- [`utils/parent-report-language/v2-parent-copy.js`](../utils/parent-report-language/v2-parent-copy.js)

Sample PDFs exist in `reports/parent-report-persona-corpus/`, `reports/overnight-parent-ai-audit/*/sample-pdfs/`, and `qa-visual-output/`, but this pass used them only as known artifact locations, not as a visual QA source.

---

## Editorial Decision Map

| Issue id | Location / file | Current existing text / behavior | Problem summary | Why it may confuse a parent | Severity | Owner decision needed | Recommended timing | Exact owner action needed |
|----------|-----------------|----------------------------------|-----------------|-----------------------------|----------|-----------------------|--------------------|---------------------------|
| P7-01 | `components/ParentReportImportantDisclaimer.js` | `הבהרה חשובה`; `הדוח, ההמלצות והתובנות במסמך זה נגזרות מתוך נתוני התרגול והשימוש במערכת.`; `כלי עזר לימודי`; `ואינם מהווים אבחון חינוכי, דידקטי או מקצועי...`; `מומלץ להיוועץ במורה או באיש מקצוע מתאים.` | Disclaimer is strong and protective, but it is also a prominent trust-framing section. | A parent may interpret the report as either too authoritative or too limited depending on how this section is read. | Medium | Yes | Owner decision first | **Approve keeping current wording** or **owner must provide exact replacement wording**. |
| P7-02 | `components/ParentReportInsight.jsx` | Label: `תובנה להורה`; behavior: component returns `null` when `!explanation?.ok || !explanation?.text`. | AI insight appears only when valid text exists; absence is silent. | Parent may not know whether insight is intentionally absent, unavailable, or omitted due to lack of data. | Low | Yes | Polish later | **Owner must decide whether this explanation is needed**. If yes: **Owner exact wording required**. |
| P7-03 | `components/parent-report-short-contract-preview.jsx` | `סיכום קצר להורה`; labels: `מצב`, `מה חשוב קודם`, `מה עושים עכשיו`. | Short contract labels are compact and helpful, but depend heavily on downstream text quality. | If the generated lines are long or nuanced, short labels may feel like a firm verdict rather than a guided next step. | Medium | Yes | Owner decision first | **Approve keeping current wording** or **owner must provide exact replacement wording** for labels only. |
| P7-04 | `components/parent-report-contract-ui-blocks.jsx` | Labels include `מה לא לעשות כרגע`, `כמה אפשר לסמוך על זה`, `על מה זה נשען`, `בדיקה הבאה`. | This is valuable parent guidance, but label tone and confidence framing are high-impact. | Parents may treat `מה לא לעשות כרגע` as a hard prohibition, or `כמה אפשר לסמוך על זה` as a statistical guarantee. | Medium | Yes | Owner decision first | **Approve keeping current wording** or **owner must provide exact replacement wording**. |
| P7-05 | `pages/learning/parent-report.js` | Section heading: `💡 המלצות`; source line uses `diagnosticSourceLabelHe`; modes include `new`, `insufficient`, `legacy`. | Recommendation source / state may change internally, but parent sees one recommendation block. | If content changes between visits, parent may not understand whether the child changed or the evidence/source changed. | High | Yes | Before launch | **Owner must decide whether this explanation is needed**. If yes: **Owner exact wording required**. |
| P7-06 | `pages/learning/parent-report.js` | `נתונים חלקיים במקצועות: {subjects}` | Partial-data line is concise but may read like missing system data rather than normal low-volume learning evidence. | Parent may think something is broken or that the child did something wrong. | Medium | Yes | Owner decision first | **Approve keeping current wording** or **owner must provide exact replacement wording**. |
| P7-07 | `utils/parent-data-presence.js` | `אין עדיין תרגול בטווח שנבחר.` | Clear no-data message. Decision is whether it is sufficient as a stand-alone explanation. | Parent may not know what time range or action would make the report useful. | Low | Yes | Polish later | **Owner must decide whether this explanation is needed** beyond the existing line. If yes: **Owner exact wording required**. |
| P7-08 | `utils/parent-data-presence.js` | `יש נתוני תרגול בטווח, אך עדיין לא ניתן לסגור תמונה ברורה מהתרגולים — כדאי להמשיך בתרגול ולעקוב שוב לאחר מכן.` | Weak-data wording is cautious but repeated variants exist across files. | Similar but not identical weak-data messages may feel inconsistent across short/detailed report surfaces. | Medium | Yes | Owner decision first | **Approve keeping current wording** across all weak-data variants or **owner must provide exact replacement wording**. |
| P7-09 | `utils/parent-data-presence.js` | `קיימים נתונים, אך דרוש עוד תרגול כדי לחזק את הכיוון שנראה מהתרגולים.` | Confidence wording implies a “direction” already exists even when data is still weak. | Parent may over-interpret early signals as a diagnosis or stable trend. | Medium | Yes | Before launch | **Approve keeping current wording** or **owner must provide exact replacement wording**. |
| P7-10 | `utils/parent-data-presence.js` | `יש נתוני תרגול בטווח, אבל עדיין אין תמונה יציבה מהתרגולים על פני המקצועות — כדאי להמשיך בתרגול ולעקוב שוב לאחר מכן.` | Another weak-data variant with cross-subject framing. | Parent may not know whether the issue is low volume, mixed results, or subject coverage. | Medium | Yes | Owner decision first | **Owner must decide whether this explanation is needed** in this form. If not: **owner must provide exact replacement wording**. |
| P7-11 | `utils/parent-report-language/v2-parent-copy.js` | `נושאים שנשמרים טוב: ${stable} מתוך מה שנבדק. ב־${actionable} נושאים יש בסיס לשיחה ממוקדת בבית. ב־${uncertain} נושאים עדיין אין תמונה ברורה.` | Dense summary line mixes strength, actionability, and uncertainty in one sentence. | Parent may miss which part is the key action vs background context. | Medium | Yes | Polish later | **Owner must decide whether this section stays** as a dense line or needs owner-supplied exact wording. |
| P7-12 | `utils/parent-report-language/v2-parent-copy.js` | `יש נושאים שכדאי לשים עליהם לב השבוע — אפשר לתאם עם המורה או עם מטפל אם זה רלוונטי.` | Mentions professional help path. It is cautious, but high-sensitivity. | Parent may feel alarmed if “מטפל” appears without enough context. | High | Yes | Before launch | **Approve keeping current wording** or **owner must provide exact replacement wording**. |
| P7-13 | `utils/parent-report-language/v2-parent-copy.js` | `התרגול בתקופה עדיין מצומצם — כדאי לקרוא את הסיכום בעיון ולהמשיך לאסוף תרגול.` | Report-readiness line is cautious. Decision is whether it is enough to prevent over-reading the report. | Parent may still rely on low-volume report as conclusive. | Medium | Yes | Owner decision first | **Approve keeping current wording** or **owner must provide exact replacement wording**. |
| P7-14 | `utils/parent-report-language/v2-parent-copy.js` | `אין כרגע פעולה ביתית חד-משמעית — השבוע כדאי תרגול קצר וממוקד כדי להבהיר את הכיוון.` | Empty home-plan fallback is actionable but may sound like no recommendation exists. | Parent may leave without a clear “what now” if the report otherwise looks detailed. | Medium | Yes | Owner decision first | **Owner must decide whether this explanation is needed** in this section. If changed: **Owner exact wording required**. |
| P7-15 | `utils/parent-report-language/v2-parent-copy.js` | `היעד לשבוע הקרוב: יותר תרגול עקבי ורגוע, ואז אפשר לקבוע יעד קידום ברור.` | Next-goal fallback is broad. | Parent may not understand what “consistent and calm practice” means operationally in the app context. | Low | Yes | Polish later | **Approve keeping current wording** or **owner must provide exact replacement wording**. |
| P7-16 | `pages/learning/parent-report.js`, `pages/learning/parent-report-detailed.js` | Detailed page modes include `דוח מלא` and `תקציר להדפסה`; Phase 4 notes PDF/print parity risk. | Print/PDF wording and mode labels may not set correct expectations about what appears in each artifact. | Parent may export the wrong version for teacher/school sharing. | Medium | Yes | Before launch | **Owner must decide whether this section stays** as-is and whether the current mode labels are approved. If not: **Owner exact wording required**. |
| P7-17 | `components/parent-copilot/parent-copilot-panel.jsx` | Preset prompts: `מה לעשות היום בבית?`, `מה לעשות השבוע?`, `מה לא לעשות עכשיו?`, `להתקדם או להמתין?`, `איך להסביר לילד?`, `שאלה למורה` | Copilot quick actions overlap with report contract labels but are not necessarily editorially signed with the same rubric. | Parent may perceive Copilot answers as the same authority level as the report, even though interaction context differs. | Medium | Yes | Owner decision first | **Owner must decide whether this explanation is needed** and whether quick action labels stay aligned with report labels. |
| P7-18 | `docs/PARENT_REPORT_EDITORIAL_SIGNOFF.md` | Manual signoff asks for `אחידות — אותה מילה לאותו מושג (חיזוק / תרגול / העברה)` and `נתונים דלים`. | Signoff criteria exist, but this mapping needs owner ownership for each flagged item. | Without explicit owner approval, future small edits may drift across report / Copilot / PDF. | High | Yes | Before launch | **Approve keeping current wording** item-by-item or **owner must provide exact replacement wording** where not approved. |

---

## Priority Summary

### High-priority owner decisions

- **P7-05:** Recommendation source / state explanation (`new` / `insufficient` / `legacy`) before launch.
- **P7-12:** Professional-help wording sensitivity.
- **P7-18:** Owner signoff responsibility and cross-surface terminology discipline.

### Medium-priority owner decisions

- **P7-01:** Disclaimer trust boundary.
- **P7-03 / P7-04:** Contract labels and confidence framing.
- **P7-06 / P7-08 / P7-09 / P7-10 / P7-13 / P7-14:** Weak-data and low-confidence wording variants.
- **P7-11:** Dense summary line in detailed report language.
- **P7-16:** Print/PDF mode expectation.
- **P7-17:** Copilot/report wording consistency.

### Low-priority owner decisions

- **P7-02:** Silent absence of Parent AI insight.
- **P7-07:** No-data line sufficiency.
- **P7-15:** Broad next-goal fallback.

---

## Phase Boundary

| Check | Result |
|-------|--------|
| Product code changed? | **No** |
| Hebrew product copy changed? | **No** |
| Alternative Hebrew wording generated? | **No** |
| Report / Parent AI / Copilot logic changed? | **No** |

## Recommended Next Step

Owner should review **P7-01–P7-18** and mark each row as:

- approve keeping current wording
- owner must provide exact replacement wording
- owner must decide whether this section stays
- owner must decide whether this explanation is needed

Only after owner decisions should a separate implementation phase modify product copy or report UI.
