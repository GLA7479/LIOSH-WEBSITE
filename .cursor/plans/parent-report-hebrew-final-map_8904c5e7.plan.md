---
name: parent-report-hebrew-final-map
overview: מיפוי מלא של מקורות הטקסט בדוח ההורים + תוכנית עבודה סופית לשיפור העברית, כולל הפרדה בין בעיות שפה/מנוע/UX והמלצת ארכיטקטורה לביצוע בטוח.
todos:
  - id: map-text-sources
    content: לבנות Text Source Map מלא (שדה טקסט → פונקציה מייצרת → קומפוננטה מציגה → קהל יעד).
    status: completed
  - id: define-hebrew-style-contract
    content: להגדיר Style Guide מחייב + רשימת מונחים אסורים/מוחלפים + כללי anti-repetition.
    status: completed
  - id: design-language-layer
    content: לתכנן שכבת templates keyed שמקבלת params בלבד (בלי לוגיקה עסקית).
    status: completed
  - id: migrate-critical-blocks
    content: להעביר תחילה executive summary, topic explain, subject letter למסלול ניסוח אחיד.
    status: completed
  - id: add-quality-guards
    content: להוסיף בדיקות snapshot/forbidden-terms ותסריטי QA לשפה.
    status: completed
  - id: final-editorial-pass
    content: לבצע pass סופי לאחידות טון וערך הורי בכל חלקי הדוח.
    status: completed
isProject: false
---

# מיפוי ותוכנית סופית לשיפור עברית בדוח הורים

## 1) Executive Summary
העברית בדוח ההורים נוצרת כיום מכמה שכבות במקביל (engine + builders + UI helpers), ולכן מתקבלת אי-אחידות: חלק מהטקסט טבעי והורי, וחלק נשמע טכני/מערכתי. הבעיה המרכזית אינה רק ניסוח נקודתי אלא ערבוב בין שכבת ניתוח לשכבת שפה. התוכנית המומלצת: להקים שכבת ניסוחים אחידה (template/language layer), להעביר אליה בהדרגה טקסטים הורים, ולהשאיר ב-engine רק החלטות ונתונים.

## 2) מיפוי מלא לפי אזורים וקבצים

### אזור A — מעטפת דוח קצר (כותרות, כפתורים, תוויות כלליות)
- קבצים:
  - [pages/learning/parent-report.js](pages/learning/parent-report.js)
  - [components/ParentReportImportantDisclaimer.js](components/ParentReportImportantDisclaimer.js)
- בניית טקסט:
  - טקסטים קבועים ב-JSX (כותרות, labels, כפתורי הדפסה/חזרה).
  - Disclaimer קבוע בקומפוננטה ייעודית.
- בעיות לשוניות:
  - חלק מהכותרות תקינות, אך משולבות לפעמים עם תתי-שורות טכניות.
- שינוי נדרש:
  - לשמר טקסטי UI תקינים; לוודא שכל טקסט הורי בדף הזה נמשך משכבת שפה אחידה ולא מפוזר inline.

### אזור B — מקור הנתונים והטקסט הדינמי לדוח הקצר
- קבצים:
  - [utils/parent-report-v2.js](utils/parent-report-v2.js)
  - [utils/math-report-generator.js](utils/math-report-generator.js)
- בניית טקסט:
  - `generateParentReportV2` מרכיב `summary`, `analysis`, `patternDiagnostics`, וכולל שדות טקסט כמו `diagnosticOverviewHe`, `insufficientDataSubjectsHe`.
  - שמות נושאים/תוויות נשלפים גם מ-generators נוספים.
- בעיות לשוניות:
  - טקסטים מערכתיים-למחצה בתוך שכבת חישוב.
  - ניסוחים כמו "יחידות אבחון", "לא זמין" מופיעים ישירות ונשמעים פחות הורי-שירותי.
- שינוי נדרש:
  - להוציא טקסטים הוריים מה-builder ל-renderer/template keyed.
  - להשאיר כאן רק facts (counts, flags, ids).

### אזור C — אבחון/המלצות בדוח קצר
- קבצים:
  - [utils/learning-patterns-analysis.js](utils/learning-patterns-analysis.js)
  - [utils/parent-report-ui-explain-he.js](utils/parent-report-ui-explain-he.js)
  - [components/parent-report-topic-explain-row.jsx](components/parent-report-topic-explain-row.jsx)
- בניית טקסט:
  - `analyzeLearningPatterns` מייצר משפטים הורים.
  - helpers ממפים ids לטקסט עברי ומסננים trace טכני.
  - קומפוננטת explain מציגה שלישייה קבועה ("מה ראינו/מה זה אומר/כיוון עבודה").
- בעיות לשוניות:
  - חזרתיות מבנית גבוהה; טון זהה בין נושאים.
  - חלק מהמונחים נשארים "אנליטיים" במקום שפה הורית.
- שינוי נדרש:
  - לשמור את מבנה ה-3 שכבות, אבל לרענן ניסוחים ורוטציה חכמה עם anti-repetition rules.

### אזור D — מעטפת דוח מפורט
- קבצים:
  - [pages/learning/parent-report-detailed.js](pages/learning/parent-report-detailed.js)
  - [components/parent-report-detailed-surface.jsx](components/parent-report-detailed-surface.jsx)
- בניית טקסט:
  - Titles/sections קבועים ב-UI.
  - הזרקת תוכן דינמי מ-`payload`.
- בעיות לשוניות:
  - זליגת מונחי מערכת ל-UI (למשל שדות בסגנון "מערכת").
  - אחידות טון חלקית בין בלוקים שונים.
- שינוי נדרש:
  - להסיר/להמיר labels פנימיים במסך הורי.
  - להחיל style contract אחיד לכל section headers + bullet phrasing.

### אזור E — הרכבת payload מפורט ונרטיב חוצה מקצועות
- קבצים:
  - [utils/detailed-parent-report.js](utils/detailed-parent-report.js)
  - [utils/parent-report-payload-normalize.js](utils/parent-report-payload-normalize.js)
- בניית טקסט:
  - `buildDetailedParentReportFromBaseReport` ו-builder functions מייצרים `executiveSummary`, `crossSubjectInsights`, `homePlan`, `nextPeriodGoals`.
- בעיות לשוניות:
  - ערבוב חזק בין לוגיקה וטקסט (כולל ניסוחי החלטה/ראיה/probe).
  - חשיפה של enum/token (למשל `insufficient_data`) לטקסט משתמש.
- שינוי נדרש:
  - להפריד: builder יחזיר message keys + params, renderer יהפוך לעברית טבעית.

### אזור F — מכתבים/ניסוח הורי פר-מקצוע ונושא
- קבצים:
  - [utils/detailed-report-parent-letter-he.js](utils/detailed-report-parent-letter-he.js)
  - [utils/topic-next-step-engine.js](utils/topic-next-step-engine.js)
- בניית טקסט:
  - `buildSubjectParentLetter`, `buildTopicRecommendationNarrative`, `rewriteParentRecommendationForDetailedHe`.
  - חלק גדול של copy נבנה גם בתוך topic engine.
- בעיות לשוניות:
  - תבניות חוזרות עם וריאציה מינימלית (תחושת "template engine").
  - טקסטים ארוכים/זהירים מדי שיוצרים ריח רובוטי.
- שינוי נדרש:
  - לאחד generator ניסוחי לנושאים ומקצועות, עם style constraints ורמות verbosity.

### אזור G — מנוע אבחון V2 ושכבות החלטה
- קבצים:
  - [utils/diagnostic-engine-v2/run-diagnostic-engine-v2.js](utils/diagnostic-engine-v2/run-diagnostic-engine-v2.js)
  - [utils/diagnostic-engine-v2/taxonomy-hebrew.js](utils/diagnostic-engine-v2/taxonomy-hebrew.js)
  - [utils/topic-next-step-phase2.js](utils/topic-next-step-phase2.js)
  - [utils/parent-report-row-diagnostics.js](utils/parent-report-row-diagnostics.js)
- בניית טקסט:
  - בחלק מהמקומות כבר נוצרים `patternHe`, `probeHe`, labels ועקבות החלטה.
- בעיות לשוניות:
  - שכבת engine מייצרת copy במקום רק משמעות/מפתח.
- שינוי נדרש:
  - להפוך outputs ל-language-neutral (ids, states, evidence), ולהעביר ניסוח לשכבת language.

## 3) רשימת בעיות השפה (קטגוריות)
- עברית רובוטית:
  - משפטים בנויים לפי תבנית קשיחה שחוזרת בין מקצועות.
- חזרות:
  - חזרה על פתיחים/סגירות ועל שלישיות טקסט זהות.
- ניסוחים כלליים מדי:
  - "כדאי להמשיך לעקוב" ללא פעולה קונקרטית בזמן/היקף.
- ניסוחים לא ברורים:
  - מושגים כמו "ראיה", "סבב", "אותות מעורבים" בלי תרגום הורי פשוט.
- ניסוחים לא רלוונטיים להורה:
  - מדדי מערכת פנימיים במקום "מה עושים בבית השבוע".
- טון מערכתי/טכני:
  - מונחים כמו `probe`, `P4`, `insufficient_data`, "שורות (מערכת)".
- ערבוב שפת מנוע ושפת דוח:
  - אותה שכבה מחליטה וגם מנסחת.
- טקסט ללא ערך ישים:
  - משפטים שלא מסתיימים בהמלצה פרקטית, מדידה וקצרת טווח.

## 4) תוכנית עבודה סופית לפי שלבים

### שלב 1 — Audit/Map (סגירת מיפוי חוזי)
- מה עושים:
  - בונים inventory של כל שדה טקסט הורי: source function, consumer component, audience tag.
  - מסווגים כל שדה: static / dynamic / mixed.
- קבצים:
  - [docs/PARENT_REPORT.md](docs/PARENT_REPORT.md), [utils/parent-report-v2.js](utils/parent-report-v2.js), [utils/detailed-parent-report.js](utils/detailed-parent-report.js), [utils/parent-report-ui-explain-he.js](utils/parent-report-ui-explain-he.js), [utils/detailed-report-parent-letter-he.js](utils/detailed-report-parent-letter-he.js), [components/parent-report-detailed-surface.jsx](components/parent-report-detailed-surface.jsx)
- תוצאה צפויה:
  - Text Source Map מלא (שדה→מקור→שימוש).
- קריטריון הצלחה:
  - אין בלוק טקסט שמופיע ב-UI בלי owner ברור.

### שלב 2 — איחוד שפה וסגנון
- מה עושים:
  - יוצרים Style Contract לדוח הורים (tone, length, forbidden terms, concreteness rules).
  - מייצרים message key taxonomy לכל בלוק.
- קבצים:
  - [utils/parent-report-ui-explain-he.js](utils/parent-report-ui-explain-he.js), מסמך מדיניות חדש תחת docs (למשל `docs/PARENT_REPORT_HEBREW_STYLE_GUIDE.md`).
- תוצאה צפויה:
  - source-of-truth אחד לסגנון והמרות מונחים.
- קריטריון הצלחה:
  - כל ניסוח חדש עומד בכללי style guide בדיקה ידנית/אוטומטית.

### שלב 3 — החלפת תבניות בעייתיות
- מה עושים:
  - מחליפים תבניות טכניות/רובוטיות ב-templates הוריים keyed.
  - מוסיפים anti-repetition strategy (variant pools + guardrails).
- קבצים:
  - [utils/detailed-report-parent-letter-he.js](utils/detailed-report-parent-letter-he.js), [utils/detailed-parent-report.js](utils/detailed-parent-report.js), [utils/topic-next-step-engine.js](utils/topic-next-step-engine.js)
- תוצאה צפויה:
  - ירידה משמעותית בחזרתיות ובהדלפת jargon.
- קריטריון הצלחה:
  - במדגם דוחות, אין tokens טכניים ואין רצף משפטים זהה בין נושאים שונים.

### שלב 4 — שיפור ניסוח של כל בלוק בדוח
- מה עושים:
  - rewrite מלא לכל בלוק הורי: executive summary, subject letters, topic explain strips, home plan, goals.
  - כל טקסט חייב לכלול: מצב נוכחי + משמעות + פעולה ישימה.
- קבצים:
  - [components/parent-report-topic-explain-row.jsx](components/parent-report-topic-explain-row.jsx), [components/parent-report-detailed-surface.jsx](components/parent-report-detailed-surface.jsx), [utils/detailed-report-parent-letter-he.js](utils/detailed-report-parent-letter-he.js), [utils/parent-report-ui-explain-he.js](utils/parent-report-ui-explain-he.js)
- תוצאה צפויה:
  - דוח רציף, טבעי, הורי, קונקרטי.
- קריטריון הצלחה:
  - reviewer אנושי מדרג "טבעיות" ו"בהירות" מעל סף מוסכם בכל section.

### שלב 5 — בדיקות איכות
- מה עושים:
  - Snapshot tests לטקסטים מרכזיים + lint ניסוח (forbidden tokens/phrases).
  - QA על תרחישים חלשים/חזקים/אותות מעורבים.
- קבצים:
  - [scripts/parent-report-phase6-suite.mjs](scripts/parent-report-phase6-suite.mjs), [scripts/parent-report-pages-ssr.mjs](scripts/parent-report-pages-ssr.mjs), [tests/fixtures/parent-report-pipeline.mjs](tests/fixtures/parent-report-pipeline.mjs)
- תוצאה צפויה:
  - מנגנון שמונע רגרסיה לשפה רובוטית.
- קריטריון הצלחה:
  - כל הטסטים עוברים + בדיקות טקסט ייעודיות עוברות.

### שלב 6 — Pass סופי
- מה עושים:
  - עובר editorial אחרון, אחידות בין קצר/מפורט, חסימת מונחים פנימיים ב-parent surface.
- קבצים:
  - [pages/learning/parent-report.js](pages/learning/parent-report.js), [pages/learning/parent-report-detailed.js](pages/learning/parent-report-detailed.js), [components/parent-report-detailed-surface.jsx](components/parent-report-detailed-surface.jsx)
- תוצאה צפויה:
  - גרסה מקצועית אחידה לפרודקשן.
- קריטריון הצלחה:
  - signoff מוצר+תוכן; אין חשיפת terminology פנימי במסכים הוריים.

## 5) Style Guide עברי לדוח הורים
- משפט טוב בדוח:
  - קצר-בינוני, ברור, פועל אקטיבי, מונח הורי ולא טכני, כולל פעולה קונקרטית.
- מה אסור לכתוב:
  - tokens/ids (`P4`, `insufficient_data`, `probe`, `fallback`), ניסוחי מערכת ("שורות מערכת").
- מילים/ביטויים לצמצום/החלפה:
  - "נדרש סבב ראיה" → "כדאי לאסוף עוד תרגול קצר לפני החלטה".
  - "אותות מעורבים" → "התוצאות לא עקביות עדיין".
- איך כותבים מקצועי אבל פשוט:
  - מונח מקצועי אחד לכל משפט מקסימום, עם פירוש מיידי בשפה יומיומית.
- איך כותבים קונקרטי ולא גנרי:
  - לציין מה לעשות, כמה זמן/כמה פעמים, ובאיזה נושא.
- איך נמנעים מטון רובוטי:
  - גיוון תחבירי מבוקר, איסור על פתיחים חוזרים קבועים, הגבלת אורך.
- איך נמנעים מחזרות:
  - sentence-family variants + de-dup pass ברמת payload.
- איך שומרים אחידות:
  - כל משפט הורי עובר דרך אותה שכבת rendering keyed.

## 6) דוגמאות לפני/אחרי (מהמערכת)
- דוגמה 1:
  - לפני: "יחידות בעדיפות גבוהה (P4): 3."
  - למה לא טוב: מונח פנימי לא הורי.
  - אחרי: "יש 3 נושאים שכדאי לתת להם עדיפות בתרגול השבוע."
  - למה טוב יותר: ממיר metric לפעולה הורית ברורה.

- דוגמה 2:
  - לפני: "יש אותות מעורבים בכמה נושאים; נדרש probe לפני הסקה חזקה."
  - למה לא טוב: ערבוב אנגלית+ז'רגון מקצועי.
  - אחרי: "בכמה נושאים התמונה עדיין לא עקבית, ולכן נעדיף עוד תרגול קצר לפני מסקנה סופית."
  - למה טוב יותר: עברית טבעית, אותה משמעות, ללא jargon.

- דוגמה 3:
  - לפני: "רמת ביטחון: insufficient_data"
  - למה לא טוב: enum גולש לממשק.
  - אחרי: "כרגע אין מספיק מידע כדי לקבוע מסקנה יציבה בנושא הזה."
  - למה טוב יותר: משפט הורי מלא במקום קוד מערכת.

- דוגמה 4:
  - לפני: "שורות (מערכת): מאסטרי יציב · הצלחה שבירה"
  - למה לא טוב: framing פנימי ומונחים חדים.
  - אחרי: "בדפוסי העבודה האחרונים ראינו גם נקודות יציבות וגם מצבים שבהם ההצלחה עדיין רגישה."
  - למה טוב יותר: שפה אנושית ועדיין מדויקת מקצועית.

- דוגמה 5:
  - לפני: "עדיין לא סוגרים סופית לגבי ... כיוון סביר ..."
  - למה לא טוב: תבנית חוזרת ורובוטית.
  - אחרי: "בשלב הזה נראה ש... נמשיך לעקוב בשבוע הקרוב כדי לוודא שזה הכיוון הנכון."
  - למה טוב יותר: רצף דיבור טבעי ופחות תבניתי.

## 7) סיכונים ודברים שלא לגעת בהם בלי אישור
- לא משנים לוגיקת החלטה/thresholds בלי אפיון נפרד.
- לא משנים מבני payload חוזיים בלי עדכון fixtures/tests.
- לא מוחקים שדות קיימים שה-UI או QA תלויים בהם.
- לא נוגעים בגרפים/טבלאות/מבנה ניווט בלי אישור מפורש.
- לא מערבבים שיפור ניסוח עם refactor תפעולי גדול באותו PR.

## 8) הפרדה: בעיית שפה מול מנוע מול UX
- שפה בלבד:
  - wording רובוטי, חזרתיות, ז'רגון לא הורי, enums גולמיים.
- מנוע/לוגיקה:
  - confidence/priority thresholds, gating rules, recommendation decision logic.
- UX/תצוגה:
  - עומס טקסט, היררכיית section titles, placement של explain strips.
- משולב:
  - טקסטים שמיוצרים בתוך engine builders ומשפיעים גם על תוכן וגם על חוויית קריאה.

## 9) המלצה סופית לביצוע
- כן לבצע refactor לשכבת הניסוחים.
- כן לבנות template layer חדשה (keyed messages + params).
- כן לאחד generators של copy הורי (short+detailed) כדי למנוע drift.
- כן להפריד language layer מ-analysis layer בצורה הדרגתית ובטוחה.
- הדרך הבטוחה ביותר:
  1. להקפיא חוזה נתונים קיים,
  2. להוסיף language renderer חדש במקביל,
  3. להעביר בלוקים אחד-אחד עם snapshot tests,
  4. להשאיר fallback עד השלמת כיסוי,
  5. לבצע pass editorial סופי לפני הסרת legacy phrasing.