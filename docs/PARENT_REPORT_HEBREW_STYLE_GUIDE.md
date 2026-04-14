# Parent report — Hebrew style contract (mandatory)

Audience: **Israeli parent** reading a school/learning period report (screen + print/PDF).  
Not audience: internal QA, engine debugging, curriculum engineers (use separate UI/docs).

---

## 1. Every parent block should answer

1. **מה ראינו** — observable fact in plain Hebrew (counts, trend, consistency).  
2. **מה זה אומר** — one sentence of interpretation for home context.  
3. **מה כדאי לעשות עכשיו** — concrete action (what, how much, how often), without sounding like a system log.

If evidence is thin, say so honestly and still give **one small next step** (e.g. “שני תרגולים קצרים השבוע בנושא X”).

---

## 2. Good sentence profile

- Length: **short to medium** (prefer 1–2 clauses; max ~220 chars for dense UI rows unless spec says otherwise).
- Voice: **active verbs** (“תרגלו”, “כדאי לבחור”, “נשארים עם”).
- Tone: **professional + warm**, not clinical, not chatty.
- One domain term max per sentence; if used, **gloss immediately** in everyday Hebrew.

---

## 3. Forbidden in parent-facing text

Do **not** ship to parents (screen or PDF):

- ASCII **tokens / enums**: `insufficient_data`, `contradictory`, `probe`, `fallback`, `legacy`, priority codes `P1`–`P4`, snake_case ids.
- English words where a Hebrew paraphrase exists (“probe”, “fallback”).
- Labels that frame content as **internal telemetry** (e.g. “מערכת”, “שורות (מערכת)”) unless explicitly approved for a dev-only panel.
- Identical **verbatim** template repeats across subjects/topics in the same report (use controlled variants; see §5).

Implementation: `utils/parent-report-language/forbidden-terms.js` + `npm run test:parent-report-hebrew-language`.

---

## 4. Preferred replacements (examples, not exhaustive)

| Avoid (system-ish) | Prefer (parent-ish) |
|--------------------|---------------------|
| יחידות אבחון | נושאים שנבדקו / נושאים בטווח התקופה |
| נדרש probe | כדאי לאסוף עוד תרגול קצר לפני מסקנה חזקה |
| רמת ביטחון: insufficient_data | כרגע אין מספיק נתונים כדי לקבוע מסקנה יציבה |
| יחידות בעדיפות גבוהה (P4) | כמה נושאים דורשים תשומת לב מיוחדת השבוע |
| נדרש סבב ראיה נוסף | כדאי עוד סיבוב תרגול קצר לפני שינוי כיוון |
| איסוף ראיה | איסוף תרגול / מידע נוסף מהתרגולים |

---

## 5. Anti-repetition (controlled)

- Prefer **2–4 variants** per message family, chosen deterministically from a stable seed (e.g. `hash(topicName + subjectId)`), not `Math.random`.
- Do not vary **clinical meaning** — only surface form (syntax / order of clauses).
- Helpers: `utils/parent-report-language/variants.js`, topic narrative in `detailed-report-parent-letter-he.js`.

---

## 6. Separation of concerns (mandatory direction)

- **Analysis layer**: returns `state`, `flags`, `metrics`, stable `id`s / enums **for code**, not for parents.
- **Language layer**: maps those ids → Hebrew strings via **`utils/parent-report-language/`** (or `parent-report-ui-explain-he.js` for label maps).

Do not add new parent sentences inside engine modules except as an interim fallback; migrate to the language layer.

---

## 7. What not to change without explicit approval

- Thresholds, gating, priority policies in diagnostic / topic engines.
- Payload **key names** and required shapes (`phase6` contract).
- Charts, tables, page layout, navigation.
- Aggressive “shortening” that removes actionable guidance.

---

## 8. Verification

- `npm run test:parent-report-hebrew-language` — forbidden substring scan on golden strings + sample payload render.
- `npm run test:parent-report-phase6` — contract + SSR smoke.
- Manual: print PDF preview for one strong + one sparse player.

---

## 9. Pedagogy / math wording (display gloss)

טקסט שמגיע מטקסונומיות או ממפתחות פנימיים עשוי להכיל מונחים כמו «נשיאה» או «עם/בלי נשיאה» — להורה מעדיפים **העברה** / **עם העברה ובלי העברה** במקום סלנג פנימי.

- מימוש אחיד: `utils/parent-report-language/pedagogy-glossary-he.js` — `normalizePedagogyForParentReportHe`; ו־`utils/parent-report-language/parent-facing-normalize-he.js` — `normalizeParentFacingHe`, `glossTopicRecommendationHeFields`.
- נקודות יישום: `utils/parent-report-v2.js` (סיכומי יחידות), `utils/topic-next-step-engine.js` (פלט `buildTopicRecommendationRecord`), ופני שטח: `pr1ParentVisibleTextHe` / `topicStripParentClean` ב־`parent-report-detailed-surface.jsx`, `parentFacingEngineLine` ב־`parent-report-topic-explain-row.jsx`.

אין לשנות ספים או מפתחות במנוע בלי אישור; רק שכבת תצוגה.

---

## 10. מילון readability (עברית — אסור בטקסט הורה גלוי)

| אסור / מבלבל | מעדיף |
|--------------|--------|
| מאסטרי (מאסטרי יציב) | שליטה טובה ויציבה / שליטה טובה ועקבית בפתרון |
| טקסונומיה M-02 (או קוד לטיני דומה) | הסרה או ניסוח: «סוג הטעות שנבחר» / בלי קוד |
| probe / responseMs / retry / hint בתוך משפט עברי | «בדיקה קצרה» / «פרטי תרגול (זמן, ניסיונות חוזרים, רמזים)» |
| שליטה יציבה בנשיאה | שליטה טובה בהעברה בין עמודות (חיבור) |

מימוש אחיד: **`normalizeParentFacingHe`** + **`glossTopicRecommendationHeFields`** ב־[`utils/parent-report-language/parent-facing-normalize-he.js`](../utils/parent-report-language/parent-facing-normalize-he.js).  
בדיקה אוטומטית: `findReadabilityLeakSubstringsInString` ב־[`forbidden-terms.js`](../utils/parent-report-language/forbidden-terms.js) (ב־`npm run test:parent-report-hebrew-language`).
