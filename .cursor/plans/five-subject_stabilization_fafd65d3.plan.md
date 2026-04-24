---
name: Unified learning engine alignment
overview: "Learning Engine Contract: empty_pool קשיח, compareAnswers חובה לכל המקצועות, contentPoolLevel כאמת יחידה לניתוח/שמירה (uiLevel=כוונה), params בלבד — יישור 6 מקצועות; שלב 1 בלבד עד סיכום; בלי בנק מולדת/ניסוח/PDF/מבנה דוח."
todos:
  - id: spec-level-fields
    content: "הגדרת מפרט (JSDoc/קונטראקט) ל-uiLevel vs contentPoolLevel vs poolFallbackCode ב-params.snapshot"
    status: pending
  - id: util-answer-normalize
    content: "מודול answer-compare — compareAnswers בלבד; איסור === / לוגיקה מקבילה (חוץ מ-mcq_index + עברית דרך mode)"
    status: pending
  - id: empty-pool-hard-rule
    content: "מימוש EMPTY POOL RULE במולדת+מפעיל generateQuestion — מצב מבוקר, ללא שאלה מזויפת, UI reuse/skip בטוח"
    status: pending
  - id: level-source-of-truth
    content: "שמירת level קיים = contentPoolLevel כשקיים; uiLevel רק ב-params"
    status: pending
  - id: science-mcq-dup-warn
    content: "MCQ SAFETY — אזהרת dev על options כפולים במדעים"
    status: pending
  - id: phase1-stop-for-review
    content: "אחרי Phase 1 — עצירה ודוח למשתמש לפני Phase 2"
    status: pending
  - id: moledet-generator-fallback
    content: "moledet-geography-question-generator.js — הסרת G1 silent OR קוד fallback מפורש + contentPoolLevel; לא נוגעים ב-data/geography-questions"
    status: pending
  - id: moledet-master-answer-tracking
    content: "moledet-geography-master.js — isCorrect דרך compare אחיד; שמירת grade/level מ-params + responseMs/attempt אם קיים"
    status: pending
  - id: align-other-masters
    content: "math/geometry/hebrew/english/science-master — מעבר ל-compare אחיד + יישור שדות snapshot לפי המפרט"
    status: pending
  - id: hebrew-pool-level
    content: "hebrew-question-generator.js — תיעוד/שדות pool fallback כמו מולדת (ללא שינוי טקסט שאלות)"
    status: pending
  - id: science-adaptive-level
    content: "science-master.js — וידוא level בשגיאה/מטא תואם adaptiveLevelRef"
    status: pending
  - id: verify-copilot-truth
    content: "אימות truth-packet + דוח לשורות moledet-geography עם אותו איכות נתונים (ללא שינוי מבנה דוח)"
    status: pending
  - id: phase2-tests
    content: "בדיקות אוטומטיות/ידניות לפי מפרט השדות והשוואת תשובות"
    status: pending
  - id: cr-guardrails
    content: "CR — אין שינוי ב-data/geography-questions, parent-report מבנה, PDF, ניסוח עברי, UX"
    status: pending
isProject: false
---

# תוכנית יישור מלאה — מנוע למידה אחיד (6 מקצועות)

## גבולות חובה (לא משתנים בביצוע)

| אסור | פירוט |
|------|--------|
| תוכן שאלות מולדת/גאוגרפיה | אין עריכה ב־[`data/geography-questions/`](data/geography-questions/) |
| ניסוח עברי | אין שינוי במחרוזות UI/דוח; שדות טכניים בלבד (קודים באנגלית/snake_case או מספרים) |
| PDF / הדפסה | ללא שינוי ב־[`pages/learning/parent-report-detailed.js`](pages/learning/parent-report-detailed.js) (print) |
| מבנה דוח הורים | ללא שינוי ב־[`utils/parent-report-v2.js`](utils/parent-report-v2.js), [`utils/detailed-parent-report.js`](utils/detailed-parent-report.js) — רק **קלט** אחיד יותר מאותו מבנה session/mistake |
| UX / עיצוב / refactor רחב | שינויים נקודיים בקבצי master/generator/mistake-event בלבד |

---

## קונטרקט מנוע למידה — חוקים קשיחים (חובה בביצוע)

### EMPTY POOL RULE (HARD REQUIREMENT)

If after all documented fallback steps **no questions** are available:

- Do **NOT** silently switch grade.
- Do **NOT** fabricate a question.
- Do **NOT** crash.

Instead, return a **controlled state**:

- `params.poolFallbackCode = 'empty_pool'`
- `params.contentPoolLevel = null` (or explicit nullable sentinel agreed in code comments)

Behavior:

- The UI must **reuse the last valid question** OR **skip safely** to the next tick without introducing new copy, layout, or flows (no UX redesign — same patterns other subjects use when a pool is temporarily empty, or hold position until a valid pool exists).

Data:

- Tracking / mistakes must reflect that **no valid pool existed** for that attempt window (no silent recovery).

No silent recovery is allowed.

### ANSWER COMPARE RULE

All subjects must use the **same** answer-comparison entry point: `compareAnswers(...)` from the shared module (e.g. [`utils/answer-compare.js`](utils/answer-compare.js)).

No subject may:

- implement its own parallel comparison logic long-term;
- bypass the shared utility for learner-facing correctness;
- use raw `===` between user and correct string **except** the internal **`mcq_index`** mode (index vs `correctIndex` only).

Any deviation (e.g. Hebrew strict niqqud path) must call **into** the shared module as an explicit `mode` / delegate, not duplicate rules. Deviations must be **justified in code comments** next to the call site.

### LEVEL SOURCE OF TRUTH RULE

The system treats **`params.contentPoolLevel`** as the **only** true pool level for:

- data written for analytics / mistakes / session meta (the persisted `level` key that downstream already reads should match `contentPoolLevel` when present — **without** changing parent-report file structure);
- diagnostics and AI consumption of level (read from `params` / persisted row fields that already exist);
- consistency checks inside learning code.

**`params.uiLevel`** (or equivalent) is **user intent only**.

If `contentPoolLevel !== uiLevel`:

- all **logic** (pool selection, reporting grain, diagnostic eligibility tied to level) must use **`contentPoolLevel`**;
- no component may use `uiLevel` alone for analysis or for overwriting stored pool level.

---

## בקרת ביצוע (מאושרת על ידי המוצר)

- After implementation: **Phase 1 only** until explicit approval for Phase 2+.
- After Phase 1 completes: **stop** — deliver diff + summary for human review before any Phase 2 work.

Approved kickoff phrase for executor:

```text
Everything approved.

Proceed with Phase 1 only.
Do not go beyond Phase 1.

Report back after completion.
```

---

## 1. רשימת פערים — מולדת/גאוגרפיה מול שאר המקצועות

| תחום | שאר המקצועות (מצב נוכחי) | מולדת/גאוגרפיה (פער) |
|------|---------------------------|------------------------|
| **בחירת שאלה / רמה** | עברית — מעבר רמה מאגר כשהמאגר ריק; מדעים — `assignedLevel` / adaptive; מתמטיקה — רמה מ־UI לגנרטור | [`utils/moledet-geography-question-generator.js`](utils/moledet-geography-question-generator.js): `questionsMap[key] \|\| G1_EASY_QUESTIONS` + fallback ל־`G1_EASY_QUESTIONS` כשאין שאלות — **שינוי רמת מאגר בלי תיעוד מפורש** |
| **בדיקת תשובה** | אנגלית/עברית — `normalize` מקומי; גאומטריה — מספר/מחרוזת; מתמטיקה — ענף מספר/מחרוזת; מדעים — אינדקס MCQ | [`pages/learning/moledet-geography-master.js`](pages/learning/moledet-geography-master.js): `answer === currentQuestion.correctAnswer` — **ללא trim / ניקוד / פסיק** |
| **שמירת טעות** | מדעים: `id`, `stem`, `grade`/`level` משויכים לשאלה; מולדת: אובייקט עשיר אבל **ללא `subject` מפורש** בשורה (מסתמך על מפתח אחסון) | מולדת: אין `responseMs` / `retryCount` / `firstTryCorrect` בדגימת הקוד (חיפוש ב־master — אפס התאמות); **אין מזהה שאלה יציב** (בנק ללא `id` — לא לתקן בבנק; ראו סעיף 7) |
| **מטא־רמה בדוח** | עברית — סיכון `level` מצב UI מול `params.levelKey` של המאגר | מולדת: בשגיאה נשמר `grade`/`level` מ־state ולא בהכרח `mgPrm.levelKey` / רמת המאגר בפועל |

**הערה:** [`utils/mistake-event.js`](utils/mistake-event.js) כבר מנרמל `isCorrect` מ־`userAnswer`/`correctAnswer` עם `trim` כשאין boolean — אבל **במשחק** מולדת מחושב נכון/לא נכון לפני השמירה עם `===`; אין אחידות בין “חוויית משחק” לבין “נירמול אירוע טעות”.

**Copilot:** [`utils/parent-copilot/contract-reader.js`](utils/parent-copilot/contract-reader.js) כבר כולל `"moledet-geography"` ב־`SUBJECT_ORDER`. הפער האפשרי הוא **איכות/עקביות שורות דוח** (נתונים חלקיים), לא החרגה מהרשימה.

---

## 2. סטנדרט אחיד — רמת שאלה (Level contract)

להגדיר במסמך קוד אחד (למשל הערות JSDoc בראש [`utils/mistake-event.js`](utils/mistake-event.js) או קובץ חדש **`utils/learning-session-contract.js`** — קובץ קטן בלבד):

| שדה | משמעות | נשמר ב |
|-----|---------|--------|
| `params.uiLevel` | בחירת המשתמש במסך (`easy` / `medium` / `hard`) — **כוונה בלבד** | `currentQuestion.params.uiLevel` + state UI |
| `params.contentPoolLevel` | רמת המאגר שממנה נבחרה השאלה בפועל — **אמת לניתוח ושמירה** | `currentQuestion.params.contentPoolLevel` |
| `params.poolFallbackCode` | קוד מכונה (`none`, `empty_pool`, `topic_to_homeland`, …) | `params` + העתקה ל־mistake `params` / `snapshot` |

**כלל:** אין `poolFallbackCode === 'none'` כאשר `contentPoolLevel !== uiLevel` בלי שהשדה השני מלא.

**דוח / AI (בלי שינוי קבצי דוח):** השדה **`level`** הקיים בשורת טעות/סשן (אם נשמר היום) יישאר בתאימות אחורית אך **חייב לקבל את ערך `contentPoolLevel`** כשהוא קיים — כך שמנוע הדוח הקיים ממשיך לקרוא את אותו מפתח בלי refactor למבנה. ה־`uiLevel` נשאר רק ב־`params`.

---

## 3. שכבת נירמול תשובות אחידה

**קובץ חדש (מוצע):** [`utils/answer-compare.js`](utils/answer-compare.js) (שם ניתן לדיון)

**פונקציות (ללא טקסט עברי):**

- `normalizeAnswerText(value, options)` — trim, רווחים מרובים, מירכאות יוניקוד, פיסוק קצה (כמו באנגלית), אופציה `lowerCaseAscii: true` לאנגלית בלבד
- `normalizeNumericToken(value)` — פסיק→נקודה, trim
- `compareAnswers({ mode, user, expected, acceptedList })` — מצבי: `exact_text` | `numeric_tolerance` | `mcq_index` | `hebrew_morph` (העברה ל־[`utils/hebrew-spelling-niqqud.js`](utils/hebrew-spelling-niqqud.js) רק כשהדגל קיים)

**אינטגרציה:**

- [`pages/learning/moledet-geography-master.js`](pages/learning/moledet-geography-master.js) — `mode: 'exact_text'` (או מספר אם בעתיד)
- [`pages/learning/english-master.js`](pages/learning/english-master.js) — העברת הלוגיקה הקיימת ל־util (התנהגות זהה)
- [`pages/learning/hebrew-master.js`](pages/learning/hebrew-master.js) — שימוש ב־util לשכבה המשותפת + קריאה לניקוד קשה כמו היום
- [`pages/learning/math-master.js`](pages/learning/math-master.js), [`geometry-master.js`](pages/learning/geometry-master.js) — ענף מספרי דרך אותו util
- [`science-master.js`](pages/learning/science-master.js) — MCQ נשאר אינדקס; אופציונלי בשלב 3: השוואת טקסט אם כפילות

**MCQ SAFETY RULE (מדעים וכל MCQ באינדקס)**

If duplicate option strings are detected on a question:

- **log warning** in development only (`process.env.NODE_ENV === 'development'` or existing project dev flag);
- do **not** rely on index-only correctness silently without that signal.

**סיכון:** בינוני — דורש רגרסיה על כל מקצוע; **שלב 1** יכול לכלול רק מולדת + טסט יחיד, ואז הרחבה.

---

## 4. DATA PIPELINE אחיד (שדות מינימום)

יעד: כל `mistake` / `snapshot` שעובר ל־[`normalizeMistakeEvent`](utils/mistake-event.js) יכיל לפחות (כשרלוונטי), **בלי מפתחות חדשים ברמה העליונה** של אובייקט הטעות ב־localStorage (מאושר):

- `subject` — **לא** להוסיף מפתח `subject` ברמה העליונה אם נאסר; במקום: לעבור תמיד דרך `normalizeMistakeEvent(raw, 'moledet-geography')` בשכבת הדוח (כבר קיים ב־parent-report לפי מפתח המקצוע) או לשמור `subject` רק בתוך **`params` / `snapshot`** אם הסכימה כבר תומכת — אחרת רק `normalize(..., subjectId)` בקריאה
- `topic` / `topicOrOperation` / `bucketKey` — כבר קיים במולדת
- `grade` — כבר קיים; ליישר עם `params.gradeKey` בתוך `params`
- `level` (שדה קיים בשורה) — כש־`params.contentPoolLevel` קיים: **הערך שנשמר ב־`level` חייב להיות `contentPoolLevel`** (אמת למאגר); **`params.uiLevel`** נשאר לכוונת משתמש בלבד (ראו LEVEL SOURCE OF TRUTH למעלה)
- `isCorrect` — אחרי `compareAnswers`
- `responseMs` / `retryCount` / `firstTryCorrect` — רק אם כבר מקובלים ב־`params` או בשדות ש־`normalizeMistakeEvent` כבר קורא; אחרת שלב 2
- `questionSource` — רק תחת `params.questionSource` (`bank` | `generated` | `mistake_replay`)

**מגבלה:** בנק מולדת ללא `id` — `params.questionFingerprint` **רק בשלב 2** (hash / מזהה יציב), בלי לגעת בבנק.

---

## 5. ביטול fallback שקט (מולדת + כל דומה)

**החלטת מוצר (מאושר):** מותרת **ירידת מאגר מדורגת בלבד** עם תיעוד מלא — ללא שינוי עיצוב/UX. אין מעבר “שקט” ל־G1 בלי `poolFallbackCode` ורשימת צעדים.

**קבצים:**

- [`utils/moledet-geography-question-generator.js`](utils/moledet-geography-question-generator.js) — הסרת `questionsMap[key] || G1_EASY_QUESTIONS`. סדר ברירת מחדל מוצע (לוגיקה בלבד):
  1. `(grade, level, topic)` כפי שנבחרו
  2. אותו `grade`+`level` עם נושא ברירת מחדל מאושר מראש (למשל `homeland` אם `topic` ריק או בלתי זמין) — `poolFallbackCode: 'topic_to_homeland'`
  3. רק אם עדיין ריק: יישום **מלא** של **EMPTY POOL RULE** למעלה — `empty_pool`, בלי שאלה מזויפת, בלי שינוי כיתה, בלי קריסה; UI: שימוש חוזר בשאלה אחרונה תקפה או דילוג בטוח ללא עיצוב מחדש
- הסרת fallback ל־`G1_EASY_QUESTIONS` כשאין שאלות — להחליף בצעדים מדורגים עם אותם קודים ב־`params` בלבד
- [`utils/hebrew-question-generator.js`](utils/hebrew-question-generator.js) — לולאת רמות חלופיות: לכל מעבר, `params.poolFallbackCode` + `params.contentPoolLevel` מפורשים (אותו עיקרון)

**דוח / AI:** כל קוד fallback ורמת מאגר בפועל נשמרים רק בתוך **`currentQuestion.params`** (ומועתקים ל־`mistake` דרך `snapshot`/`params` הקיימים) — בלי טקסט הורה חדש.

---

## 6. התאמה למנוע AI (דוח)

- אין שינוי ב־[`runDiagnosticEngineV2`](utils/diagnostic-engine-v2/run-diagnostic-engine-v2.js) כמבנה — רק **קלט אחיד** מ־`normalizeMistakeEvent` ומ־sessions עם `params` עקביים.
- לוודא ש־`wrongCount` / דיוק בשורות מולדת לא מנופחים בגלל `isCorrect` שגוי (תיקון השוואה במשחק).

---

## 7. Copilot

- כבר יש `"moledet-geography"` ב־`SUBJECT_ORDER`.
- **פעולה:** אימות ש־`listAllAnchoredTopicRows` מחזיר שורות גם כשיש נתונים חלשים — ללא שינוי מבנה; אם חסר narrative בגלל נתונים — זה כבר מצב כללי, לא ספציפי מולדת.

---

## 8. איפה שינוי קוד מדויק (מפת קבצים)

| אזור | קבצים |
|------|--------|
| סטנדרט רמה + fallback codes | [`utils/moledet-geography-question-generator.js`](utils/moledet-geography-question-generator.js), [`utils/hebrew-question-generator.js`](utils/hebrew-question-generator.js) |
| השוואת תשובה + מטא | [`pages/learning/moledet-geography-master.js`](pages/learning/moledet-geography-master.js) |
| השוואה אחידה | חדש: [`utils/answer-compare.js`](utils/answer-compare.js); עדכון: [`pages/learning/math-master.js`](pages/learning/math-master.js), [`geometry-master.js`](pages/learning/geometry-master.js), [`hebrew-master.js`](pages/learning/hebrew-master.js), [`english-master.js`](pages/learning/english-master.js) |
| רמת מדעים | [`pages/learning/science-master.js`](pages/learning/science-master.js) |
| נירמול אירוע (אופציונלי) | [`utils/mistake-event.js`](utils/mistake-event.js) — רק אם צריך לקרוא `params.poolFallbackCode` לשדות פנימיים מחושבים **בלי** לשנות פלט דוח |

---

## 9. רמת סיכון לשינוי

| שינוי | סיכון | סיבה |
|--------|--------|------|
| `answer-compare` + מולדת | בינוני | משנה ספירת נכון/לא נכון מול היסטוריה |
| הסרת `G1` fallback שקט + צעדים מדורגים | בינוני–גבוה | דורש טיפול נכון ב־`empty_pool`; **מדיניות מאושרת:** ירידה מדורגת מתועדת בלבד |
| איחוד מתמטיקה/גאומטריה לאותו util | בינוני | רגישות מספרית |
| מילוי `params` בלבד (ללא מפתחות top-level חדשים) | נמוך | תאימות לאחור |
| science adaptive level בשגיאה | נמוך | מתקן עקביות דוח |

---

## 10. שלב 1 — בטוח בלבד (מומלץ לביצוע ראשון)

1. **`params` בלבד במולדת:** להוסיף/למלא `params.uiLevel`, `params.contentPoolLevel`, `params.poolFallbackCode`, `params.gradeKey` (כפי שמגיע מהגנרטור) על `currentQuestion` ולהעתיק ל־`mistake` דרך **`currentQuestion.params`** (ללא מפתחות חדשים ברמה העליונה של הטעות).
2. **`handleAnswer`** במולדת → **`compareAnswers` בלבד** (ANSWER COMPARE RULE) — מצב טקסט כמו אנגלית; **בלי** שינוי טקסט שאלות.
3. **`science-master`**: יישור `level` בשגיאה ל־`getAssignedLevelForQuestion()` + **`params.contentPoolLevel`**; אימות **MCQ SAFETY RULE** (אזהרת dev בלבד על כפילויות).
4. **תיעוד fallback במולדת:** להחליף את `|| G1_EASY_QUESTIONS` בצעדים מדורגים + **EMPTY POOL RULE** במלואו (סעיף “קונטרקט” + סעיף 5).
5. **מודול `answer-compare`:** להקים את ה־util + לחבר **לפחות** מולדת + מקצוע אחד נוסף כפיילוט אם היקף Phase 1 מאפשר; אחרת מולדת בלבד — אך **לא** להשאיר `===` במולדת אחרי שלב 1.

**לא בשלב 1:** הרחבת מפתחות top-level ב־JSON טעויות; שינוי מבנה דוח; `questionFingerprint`; איחוד מלא של כל ה־masters אם סיכון היקף — אז בשלב 2 לאחר סיכום שלב 1.

**אחרי שלב 1:** עצירה ודוח למשתמש לפני שלב 2.

---

## 11. שלב 2 — אימות

- טסטים יחידים ל־`answer-compare` + רגרסיה מולדת/אנגלית.
- הרצת [`npm run audit:questions`](package.json) אם רלוונטי.
- בדיקת דוח מקומי: מולדת מופיעה עם אותו מבנה שורות כמו מקצוע אחר (ללא שינוי UI).

---

## 12. שלב 3 — עמוק (רק אם חייב)

- הסרת/החלפת fallback מולדת לאחר מדיניות מוצר.
- איחוד מלא של מתמטיקה/גאומטריה/עברית ל־util.
- מילוי `responseMs` בכל ה־masters.

---

## 13. מה אסור לגעת בו (חזרה)

- [`data/geography-questions/**`](data/geography-questions/) — תוכן/ניסוח
- מבנה דוח, PDF, ניסוח עברי, עיצוב, UX
- Refactor רחב של `parent-report-v2` / `detailed-parent-report`

---

## החלטות מוצר (מאושרות)

- **מאגר ריק / אין שאלה:** ירידה מדורגת מתועדת (`poolFallbackCode`), כולל מעבר נושא ל־`homeland` כשמוגדר — **לא** קפיצה שקטה לכיתה אחרת; אם אין מאגר — חלים **EMPTY POOL RULE** וסעיף 5 במלואם.
- **צורת אחסון טעויות:** **לא** להוסיף מפתחות חדשים ברמה העליונה של אובייקט הטעות ב־localStorage; כל מטא־רמה וסטיית מאגר רק תחת **`params` / `snapshot`** הקיימים.
- **חוקי קשיחים נוספים:** ראו סעיף **«קונטרקט מנוע למידה — חוקים קשיחים»** למעלה (ANSWER COMPARE, LEVEL SOURCE OF TRUTH).
