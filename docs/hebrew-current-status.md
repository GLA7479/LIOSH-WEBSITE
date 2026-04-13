# Hebrew — Freeze & Final Handoff

מסמך סגירה לשלב עברית (א׳–ו׳) בריפו. **Freeze:** אין כאן משימות יישום; רק מצב נוכחי, גבולות, ו־backlog.

### True Done (אימות חוסם לפני merge)

- מסמך handoff מפורט: [`docs/hebrew-true-done-handoff.md`](hebrew-true-done-handoff.md)
- פקודה: `npm run verify:hebrew-true-done` — **חוסם** על: provenance + קובץ משרד + תור סגירה ריק + אין misleading / weak+high במטריצת g1/g2 + אין `internal_working_statement` ב־g1/g2 + כיסוי תתי־נושאים

**מצב סגירה:** עברית סגורה כ־**True Done** לפי ההגדרה הנוכחית. **החרגות שנשארות במפורש:** אודיו; כתיבה חופשית ארוכה. **שקיפות:** קישור למשרד הוא `file_bound_excerpt_linked` / `ministry_summary_verified` — בלי עוגן עמוד־עמוד לכל שורת מטריצה.

---

## A. מה נסגר

### Layer 1 — Alignment & baseline

- הוגדר **מסמך עבודה קנוני** למיפוי יעדים (ניסוח פנימי) מול runtime: `data/hebrew-official-alignment-matrix.json`.
- תיעוד שימוש והנחות: `docs/hebrew-alignment-matrix-readme.md`.
- **מה שופר בפועל:** שקיפות — איזה `mapped_subtopic_id` שייך לאיזה `runtime_topic`, מה מותר היום מול מה נדרש פדגוגית, `coverage_status` / `fallback_masking_risk`, ומקור live (`legacy` / `both` וכו').

### Layer 2 — Coverage / pool integrity (מול המטריצה)

- עבודת אודיט וסנכרון מול **מאגרים חיים** (ספירות, חורים, סיכוני fallback) לפי תהליך המתואר ב־README של המטריצה (שורות `missing` / `weak` / `misleading_due_to_fallback` וכו').
- **מה שופר בפועל:** יישור ציפיות בין המטריצה לבין מה שבאמת נטען ב־`generateQuestion`; צמצום אזורים שבהם המסמך היה מטעה ביחס לבריכות.

### Layer 3 — אותנטיות כתיבה מבוקרת (א׳–ב׳)

- **Typing ממוקד** רק בפריטים עם `preferredAnswerMode: "typing"` **וגם** תת־נושא מאושר, בתוך `utils/hebrew-question-generator.js` (גייט בזמן ריצה).
- **מה שופר בפועל:** חלק ממשימות הכתיבה ב־`g1.spell_word_choice`, `g2.sentence_wellformed`, `g2.punctuation_choice` הופכות ל־`answerMode: "typing"` עם `typingAcceptedAnswers` + נרמול איחוד; שאר g1/g2 נשארים `choice` אלא אם הופעל הסימון והתת־נושע המאושר.

---

## B. מה source of truth עכשיו

### מטריצת יישור (עבודה קנונית, לא מסמך משרד)

- **`data/hebrew-official-alignment-matrix.json`** — baseline למיפוי תתי־נושאים ליעדים (ניסוח פנימי), סטטוס כיסוי, והערות סיכון.
- **מפת תוכן לתת־נושאים:** `data/hebrew-g1-content-map.js`, `data/hebrew-g2-content-map.js` (וגם g3–g6 לפי כיתה).

### מקורות runtime החיים (שאלות שמגיעות למסך)

1. **`utils/hebrew-question-generator.js`** — מאגר legacy inline (`G*_EASY|MEDIUM|HARD_QUESTIONS`).
2. **`utils/hebrew-rich-question-bank.js`** — `HEBREW_RICH_POOL` דרך `filterRichHebrewPool` ומיזוג ב־`generateQuestion`.

**לא** source of truth ל־runtime:

- `data/hebrew-questions/g*.js` (ארכיון / לא מחובר ל־`generateQuestion` לפי הערות הקוד).
- `data/hebrew-curriculum.js` / `pages/learning/curriculum.js` — תצוגת תוכנית, לא generation.
- קבצי TXT של משרד החינוך בתיקיית הפרויקט — לא מחוברים ל־generation; יש **קטלוג**. מקור עברית־לשון למטריצה: **`hebrew-1-6.pdf`** + `official_provenance` (ראו `docs/hebrew-alignment-matrix-readme.md`).

### התנהגות answer-mode נוכחית (עיקרי)

- **g3–g6:** לוגיקה קיימת ב־`resolveAnswerMode` (למשל `writing` / `speaking` → `typing` וכו' לפי נושא ותבנית גזע).
- **g1–g2:** ברירת מחדל **`choice`**. **`typing`** רק אם:
  - `preferredAnswerMode === "typing"` על הפריט (raw), **ו־**
  - תת־הנושא המחושב (`resolveG1ItemSubtopicId` / `resolveG2ItemSubtopicId` עם אותו `topicKey` כמו בזמן ריצה) שייך ל־`G12_ALLOWED_TYPING_SUBTOPICS`:
    - `g1.spell_word_choice`
    - `g2.sentence_wellformed`
    - `g2.punctuation_choice`
- ל־typing: `acceptedAnswers` נבנים מ־`buildAcceptedAnswersUnion` על התשובה הנכונה + `typingAcceptedAnswers` מהפריט.

### Approved typing subset (Layer 3)

רק שלושת תתי־הנושאים למעלה, ורק פריטים שסומנו במפורש בבנק ב־`preferredAnswerMode: "typing"`. אין מתג ברמת topic ואין הרחבה אוטומטית לשאר הכתיבה.

---

## C. מה עדיין intentionally not solved

- **אודיו** במשימות עברית.
- **גרירה־ושחרור** כמצב משימה.
- **דיבור אותנטי** (הקלטה / תרגול דיבור מלא מעבר ל־MCQ קיים ב־speaking).
- **חיבור / כתיבה חופשית ארוכה** או פסקה פתוחה כמסלול עיקרי.
- **חיבור רשמי של משרד החינוך** כ־source שמזין את ה־runtime (אין pipeline מחובר ממסמכי TXT חיצוניים).

---

## D. מה עדיין חלש אבל לא חוסם

- **רצפת 18 פריטים** לתת־נושא בכיתות א׳–ב׳ (`EARLY_G12_SUBTOPIC_POOL_MIN`): חלק מהתתי־נושאים עדיין מתחת לרצפה או נשענים על **widening** (`widenHebrewG1PoolIfSmall` / `widenHebrewG2PoolIfSmall`) — התנהגות מכוונת, לא באג.
- **`g1.grammar_pos_roles`** במטריצה: `coverage_status: partial`, `fallback_masking_risk: medium` — כולל הערה על narrow fallback ב־grammar / רמה medium; לא סגור כחוסם אם אין דרישת מוצר חדשה.
- שורות במטריצה עם **`weak` / `partial`** אחרות — נשארות כמסמך עבודה; אין חובה לסגור לפני שחרור.
- **Polish (מומלץ בעתיד, לא חוסם):**
  - ב־**`g2.sentence_wellformed`**: ב־legacy, כל הפריטים המתויגים לתת־נושא זה מסומנים typing — אין ערבוב MCQ בתוך אותו תת־נושא באותו מאגר; אם תרצו גיוון, זה שינוי תוכן מכוון.
  - **ניסוחי פיסוק** (typing): חזרתיות בתבנית ״אחת מארבע: נקודה / סימן שאלה…״ בין פריטים.

**הערה:** שדות `notes` / `allowed_task_types_today` בחלק משורות ה־JSON עשויים לדבר עדיין על ״רק MCQ בכתיבה בא׳–ב׳״ — זה **עלול להיות מיושן** אחרי Layer 3 לתת־נושאי subset; עדכון המטריצה הוא משימת תחזוקה אופציונלית, לא חלק מה־freeze הזה.

---

## E. מה אסור לשנות בלי אישור חדש

- **UI עברית** (`pages/learning/hebrew-master.js` וכו') — ללא אישור מפורש.
- **דוח הורים** ומסלולי ניתוח הורה — ללא אישור.
- **עמוד curriculum** — ללא אישור.
- **שינוי answer-mode גס** (למשל להפוך כל writing בגיל מסוים ל־typing, או לבטל את גייט g1/g2) — ללא אישור.
- **הרחבת typing מעבר ל־approved subset** (תתי־נושאים נוספים או פריטים ללא סימון מפורש) — ללא אישור.

---

## F. Backlog — future only (לא לבצע מתוך מסמך זה)

- אינטגרציה של **מקור רשמי** (משרד החינוך) ל־pipeline / מטריצה חיה.
- מסלול **דיבור אותנטי** (הקלטה / משוב / תרגול ממושך).
- משימות **כתיבה עשירות יותר** (תוך שמירה על גבולות מוצר).
- משימות **תמונה / אודיו** כחלק מעברית.
- **ציון משופר** לתשובות פתוחות יותר.
- **איזון** בתוך `g2.sentence_wellformed` (חלק MCQ / חלק typing במאגר).
- **צמצום חזרתיות** בניסוחי שאלות הפיסוק (typing).

---

*נוצר במסגרת Freeze + Final Handoff — ללא שינויי קוד נלווים.*
