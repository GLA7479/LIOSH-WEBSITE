# Parent report — Text Source Map (Hebrew / parent-facing)

Single inventory of **where parent-facing Hebrew originates** and **where it is shown**.  
Audience: **parent** (print/PDF and on-screen). Internal QA tools are out of scope unless they share strings.

Legend — **Layer**:

- **UI**: static JSX copy in pages/components.
- **Builder**: assembles `report` / detailed `payload` (`utils/*-parent-report*.js`, `parent-report-v2.js`).
- **Engine**: diagnostic / topic / row logic that emits or mutates prose (`diagnostic-engine-v2`, `topic-next-step-engine`, `parent-report-row-diagnostics`).
- **Helper**: label maps, sanitizers, explain lines (`parent-report-ui-explain-he.js`).
- **Template**: keyed parent copy (`utils/parent-report-language/*`).

Legend — **Kind**: `static` | `dynamic` | `mixed` (template + interpolated data).

---

## Short report — `pages/learning/parent-report.js`

| Text / field | Built in | Shown in | Kind | Layer |
|--------------|----------|-----------|------|--------|
| Page chrome (headings, buttons, loading) | `parent-report.js` | same | static | UI |
| `report.summary.*` (stats, totals) | `utils/parent-report-v2.js` | `parent-report.js` | dynamic | Builder |
| `report.summary.diagnosticOverviewHe` | `parent-report-v2.js` | `parent-report.js` | dynamic | Builder |
| Subject/topic display names | `math-report-generator.js`, `parent-report-v2.js` | `parent-report.js` | mixed | Builder + helper |
| `report.patternDiagnostics` blocks | `learning-patterns-analysis.js` / V2 path in `parent-report-v2.js` | `parent-report.js` | dynamic | Engine + builder |
| `report.analysis.recommendations` | `math-report-generator.js` | `parent-report.js` | dynamic | Builder (legacy) |
| Diagnostic explain / sanitization | `parent-report-ui-explain-he.js` | `parent-report.js` | mixed | Helper |
| Topic explain strip (“מה ראינו / …”) | `parent-report-topic-explain-row.jsx` + helpers | `parent-report.js` | mixed | UI + helper |
| Diagnostic source line (engine vs legacy) | `parent-report.js` (now also `short-report-source-label-he.js`) | `parent-report.js` | mixed | UI + Template |
| V2 insufficient-subject lines, tier labels, evidence fallbacks, זיכרון/ריסון אבחון | **`short-report-v2-copy.js`** (דרך `parent-report-v2.js`) | `parent-report.js` | static | **Template** + Builder |
| גלוס פדגוגי + readability | **`pedagogy-glossary-he.js`** + **`parent-facing-normalize-he.js`** (`normalizeParentFacingHe`) | builder + topic engine + detailed/topic UI + דוח מקוצר | mixed | **Template** + Helper |
| Disclaimer | `ParentReportImportantDisclaimer.js` | short (+ detailed) | static | UI |

---

## Detailed report — payload

| Payload section | Built in | Shown in | Kind | Layer |
|-----------------|----------|-----------|------|--------|
| `executiveSummary` (V2 path) | `detailed-parent-report.js` → **`v2-parent-copy.js`** | `parent-report-detailed-surface.jsx` | dynamic | Builder + **Template** |
| `executiveSummary` (legacy path) | `detailed-parent-report.js` (`buildExecutiveSummary`) | surface | dynamic | Builder |
| `crossSubjectInsights` (V2) | `detailed-parent-report.js` → **`v2-parent-copy.js`** | `parent-report-detailed.js` / surface | dynamic | Builder + **Template** |
| `homePlan.itemsHe` (V2) | `detailed-parent-report.js` (+ `rewriteParentRecommendationForDetailedHe`) | detailed page | dynamic | Builder + helper |
| `homePlan` empty fallback | **`v2-parent-copy.js`** | detailed page | static | **Template** |
| `nextPeriodGoals.itemsHe` (V2) | `detailed-parent-report.js` | detailed page | dynamic | Builder |
| `nextPeriodGoals` empty fallback | **`v2-parent-copy.js`** | detailed page | static | **Template** |
| `subjectProfiles[]` (V2) | `detailed-parent-report.js` (`buildSubjectProfilesFromV2`) + **`v2-parent-copy.js`**, **`confidence-parent-he.js`**, **`priority-parent-he.js`** | surface, letter | dynamic | Builder + **Template** |
| `overallSnapshot` | `detailed-parent-report.js` | detailed page | dynamic | Builder |
| `normalizeExecutiveSummary` | `parent-report-payload-normalize.js` | surface | mixed | Helper |

---

## Detailed report — UI surface

| UI label / row | Defined in | Notes | Layer |
|----------------|------------|-------|--------|
| Section titles (“סיכום לתקופה”, …) | `parent-report-detailed.js` | static | UI |
| `ExecutiveSummarySection`, bullets | `parent-report-detailed-surface.jsx` | consumes `payload` | UI |
| `SubjectPhase3Insights` row keys | **`surface-row-labels-he.js`** (re-exported) | parent-facing keys | **Template** + UI |
| `TopicRecommendationExplainStrip` (“מה ראינו…”) | `parent-report-detailed-surface.jsx` | static frame + dynamic body | UI |
| `pr1ParentVisibleTextHe`, `topicStripParentClean` | `parent-report-detailed-surface.jsx` | sanitizer + **pedagogy gloss** | Helper + **Template** |

---

## Topic / row / engine (feeds text into report)

| Source | Typical `*He` fields | Layer |
|--------|----------------------|--------|
| `utils/diagnostic-engine-v2/*` | `patternHe`, probe/intervention copy | Engine (Hebrew-capable) |
| `utils/parent-report-row-diagnostics.js` | row labels, trace `detailHe` | Engine + helper |
| `utils/topic-next-step-engine.js` | `parentHe`, `whyThisRecommendationHe`, …; יציאה עוברת **`glossTopicRecommendationHeFields`** (`parent-facing-normalize-he.js`) | Engine + **Template** (תצוגה) |
| `utils/topic-next-step-phase2.js` | guards merged into recommendation | Engine |
| `utils/detailed-report-parent-letter-he.js` | subject letter, topic narrative | Template + helper |

---

## Maintenance

When adding a **new parent-visible string**:

1. Add a row here (or extend the nearest section).
2. Prefer **`utils/parent-report-language/`** for new copy (keys + params).
3. Run `npm run test:parent-report-hebrew-language` and `npm run test:parent-report-phase6`.

---

## Subject letters — `utils/detailed-report-parent-letter-he.js`

| Output field | Built in | Shown in | Kind | Layer |
|--------------|----------|-----------|------|--------|
| `opening`, `diagnosisHe`, `homeAction`, `closing` | `buildSubjectParentLetter` / `buildSubjectParentLetterCompact` | `SubjectParentLetter` / `SubjectSummaryBlock` (full vs compact) | mixed | **Template** + helper |
| כל משפט לפני תצוגה | **`normalizeParentFacingHe`** (אחרי `stripGuillemetsHe` / `rewriteParentRecommendationForDetailedHe`) | אותם רכיבים | dynamic | **Template** |

---

## Topic narrative (כרטיס נושא בדוח מפורט)

| Field | Built in | Shown in | Kind | Layer |
|-------|----------|-----------|------|--------|
| `buildTopicRecommendationNarrative` → `snapshot`, `homeLine`, `cautionLineHe` | `detailed-report-parent-letter-he.js` | `parent-report-detailed.js` (כרטיס נושא) | mixed | **Template** |
| `tr.displayName`, `tr.recommendedStepLabelHe` | `topic-next-step-engine` + מפת נושאים | אותו כרטיס | mixed | Engine + UI |
| שדות `*He` בתוך `tr` / `topicEngineRowSignals` | `buildTopicRecommendationRecord` → **`glossTopicRecommendationHeFields`** | `TopicRecommendationExplainStrip`, שורות הסבר | dynamic | Engine + **Template** |

---

## נרמול שכבת שפה אחיד (`normalizeParentFacingHe`)

| פעולה | קובץ | הערות |
|--------|------|--------|
| פדגוגיה (נשיאה → העברה וכו') | [`pedagogy-glossary-he.js`](../utils/parent-report-language/pedagogy-glossary-he.js) | שלב ראשון בתוך `normalizeParentFacingHe` |
| ז'רגון הורה (מאסטרי, קודי M-, מזהי התנהגות באנגלית) | [`parent-facing-normalize-he.js`](../utils/parent-report-language/parent-facing-normalize-he.js) | כולל `glossTopicRecommendationHeFields` |
| סינון דוח מקוצר | [`shortReportDiagnosticsParentVisibleHe`](../utils/parent-report-ui-explain-he.js) | אחרי `sanitizeEngineSnippetHe` |
| פאזה 2 — למה ההמלצה | [`topic-next-step-phase2.js`](../utils/topic-next-step-phase2.js) | `diagnosticTypeLabelHe` במקום `behaviorType` גולמי |
| מנוע V2 — שורת אבחון | [`run-diagnostic-engine-v2.js`](../utils/diagnostic-engine-v2/run-diagnostic-engine-v2.js) | ללא «מזהה טקסונומיה …» במשפט ההורה |
| תוכנית probe ברירת מחדל | [`probe-layer.js`](../utils/diagnostic-engine-v2/probe-layer.js), [`intervention-layer.js`](../utils/diagnostic-engine-v2/intervention-layer.js) | ניסוח הורה בלי probe/מזהים לטיניים |
| שערי פלט (הודעות) | [`output-gating.js`](../utils/diagnostic-engine-v2/output-gating.js) | ללא המילה probe |

---

## QA — סריקות

| סוג | קובץ | פקודה |
|-----|------|--------|
| ASCII forbidden | `forbidden-terms.js` — `findForbiddenSubstringsInString` | `npm run test:parent-report-hebrew-language` |
| readability (מאסטרי, טקסונומיה, responseMs) | `findReadabilityLeakSubstringsInString` | אותה סוויטה |

See also: [`PARENT_REPORT.md`](./PARENT_REPORT.md), [`PARENT_REPORT_HEBREW_STYLE_GUIDE.md`](./PARENT_REPORT_HEBREW_STYLE_GUIDE.md), [`PARENT_REPORT_EDITORIAL_SIGNOFF.md`](./PARENT_REPORT_EDITORIAL_SIGNOFF.md).
