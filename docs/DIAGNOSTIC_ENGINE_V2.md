# Diagnostic Engine V2 — ארכיטקטורה וחוזה פלט

**מקור אמת:** [stage1-scientific-blueprint-source-of-truth.md](./stage1-scientific-blueprint-source-of-truth.md)  
**גרסת מנוע:** `2.0.0` (שדה `engineVersion` בפלט)

## מיקום בקוד

- אורכסטרציה: [`utils/diagnostic-engine-v2/run-diagnostic-engine-v2.js`](../utils/diagnostic-engine-v2/run-diagnostic-engine-v2.js)
- טקסונומיה: [`utils/diagnostic-engine-v2/taxonomy-*.js`](../utils/diagnostic-engine-v2/)
- גשר נושא↔טקסונומיה: [`utils/diagnostic-engine-v2/topic-taxonomy-bridge.js`](../utils/diagnostic-engine-v2/topic-taxonomy-bridge.js)
- ביטחון / עדיפות / שערים: `confidence-policy.js`, `priority-policy.js`, `output-gating.js`
- אינטגרציה לדוח: [`utils/parent-report-v2.js`](../utils/parent-report-v2.js) — השדה `diagnosticEngineV2` על אובייקט הדוח; [`utils/detailed-parent-report.js`](../utils/detailed-parent-report.js) מעביר לדוח מקיף

## זרימת נתונים (end-to-end)

1. `generateParentReportV2` בונה `maps` ומעשיר שורות (diagnostics, trend, behavior, topic step).
2. `runDiagnosticEngineV2({ maps, rawMistakesBySubject, startMs, endMs })` רץ **אחרי** העשרה.
3. לכל `(subjectId, topicRowKey)`:
   - `filterMistakesForRow` → אירועים מנורמלים (`normalizeMistakeEvent` בתוך המסנן).
   - `taxonomyIdsForReportBucket(subjectId, bucketKey)` בוחר מועמדי טקסונומיה.
   - `passesRecurrenceRules` בוחן ספי חזרתיות לפי שורת הטקסונומיה.
   - `resolveConfidenceLevel` + `resolvePriority` + `applyOutputGating`.
   - `buildCompetingHypotheses`, `buildProbePlan`, `buildInterventionPlan` (לפי שערים).
4. הפלט נשמר ב־`report.diagnosticEngineV2` ומועתק לדוח מקיף כשקיים.

## חוזה פלט ברמה עליונה (`diagnosticEngineV2`)

| שדה | תיאור |
|-----|--------|
| `blueprintRef` | מחרוזת ייחוס למסמך |
| `engineVersion` | גרסת מנוע |
| `generatedAt` | ISO timestamp |
| `evidenceFoundation` | תיאור סכימת ראיות ושרשרת מיפוי |
| `units[]` | מערך יחידות אבחון (שורת דוח אחת) |
| `subjectRollup[]` | סיכום per מקצוע |
| `global` | דגלים גלובליים (למשל `humanReviewRecommended`) |

## מבנה `units[]` (יחידת אבחון)

כל איבור מייצג **צבר subskill בשורת דוח** (תואם blueprint §3):

- `unitKey`: `subjectId::topicRowKey`
- `evidenceTrace[]`: ראיות מובנות (נפח שאלות, אירועי טעות, רלוונטיות)
- `taxonomy`: מטא־דאטה משורת הטקסונומיה או `null`
- `recurrence`: `{ full, minWrongRequired, wrongCount }`
- `confidence`: `{ level, rowSignals }` — רמות: `high` \| `moderate` \| `low` \| `early_signal_only` \| `insufficient_data` \| `contradictory`
- `priority`: `{ level, breadth }` — `P1`–`P4`
- `competingHypotheses`: השערות + רמזי הבחנה
- `strengthProfile`: תגיות חוזק משורת התנהגות
- `outputGating`: תוצאת שערי הפלט (מותר/אסור diagnosis, probe, intervention, cannot conclude)
- `diagnosis` / `probe` / `intervention` / `explainability`: שכבות נפרדות לפי המסמך

## Out of scope (מכוון)

- אין כאן polish לניסוחי UI/PDF.
- אין הרצת probes אינטראקטיביים במוצר — רק **תכנון מובנה** (`probe` object).
- מיפוי bucket→טקסונומיה הוא **היוריסטיקה מוצרית**; הרחבה עתידית: מפתחות `conceptTag` / `patternFamily` מדויקים משאלות.

## שלב בדיקות

בדיקות מסודרות יוגדרו אחרי הקפאת פיצ׳רים; לבדיקה ידנית קצרה ניתן לטעון דוח V2 ולבדוק ש־`diagnosticEngineV2.units.length` תואם מספר שורות במפות.
