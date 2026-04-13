# Hebrew Official Alignment Matrix — README

## מה הקובץ `data/hebrew-official-alignment-matrix.json` מייצג

זהו **מסמך עבודה קנוני** ל־Layer 1: מיפוי יעדים לימודיים (ניסוח עבודה) לעומת מה שקיים בפועל ב־runtime, לפי:

- `mapped_subtopic_id` מתוך `data/hebrew-g1-content-map.js` ו־`data/hebrew-g2-content-map.js`
- `runtime_topic` הוא אותו מפתח נושא שמופיע ב־UI ובמנוע: `reading` / `comprehension` / `writing` / `grammar` / `vocabulary` / `speaking`

הקובץ **אינו** מחליף תוכנית רשמית של משרד החינוך; הוא baseline לעבודה משותפת לפני Layer 2, עם **מעקב מקור רשמי** בשורה (`official_provenance`) כשקיפות ולא כ־pipeline חי.

### מעקב משרד החינוך (traceability + מקור ראשי מחובר)

- **`official_provenance`** בכל שורה — מבנה לפי `data/hebrew-official-provenance.schema.json`.
- **מסמך עברית ראשי (א–ו):** `hebrew-1-6.pdf` בשורש הריפו — תואם לקובץ הרשמי ב־[meyda.education.gov.il/files/Curriculum/hebrew-1-6.pdf](https://meyda.education.gov.il/files/Curriculum/hebrew-1-6.pdf); `mapping_status` בשורות: `file_bound_excerpt_linked`, `official_objective_source: ministry_summary_verified`.
- **קטלוג:** `data/hebrew-ministry-source-catalog.json` (כולל סיווג קבצי TXT שאינם לשון עברית).
- **אימות:** `npm run audit:hebrew-official-provenance` / `npx tsx scripts/hebrew-official-provenance-validate.mjs`.
- **סנכרון מלא:** `npx tsx scripts/hebrew-matrix-bind-ministry-primary-and-sync.mjs` (אחרי שינויי מבנה). סקריפט הזרקה הישן: `scripts/hebrew-matrix-add-official-provenance.mjs`.

## מה נחשב source of truth ל־runtime (שאלות חיות)

רק מה שנגיש בפועל דרך:

- `utils/hebrew-question-generator.js` (מאגר legacy inline: `G*_EASY|MEDIUM|HARD_QUESTIONS`)
- `utils/hebrew-rich-question-bank.js` (`HEBREW_RICH_POOL` דרך `filterRichHebrewPool`)

כל שאר מאגרי הטקסט תחת `data/hebrew-questions/*` **אינם** source of truth ל־runtime כרגע, ולכן לא נכללים בספירות או בכיסוי.

## מה לא נחשב source of truth ל־runtime

- `data/hebrew-curriculum.js` ו־`pages/learning/curriculum.js` — תצוגת תוכנית ומטרות, לא מאגר שאלות
- קבצים תחת `תוכנית משרד החינוך קובצי TXT/` — **לא** מזינים generation; יש **קטלוג** (`data/hebrew-ministry-source-catalog.json`). מקור עברית־לשון ראשי למטריצה: **`hebrew-1-6.pdf`** (מקושר ב־`official_provenance` לכל שורה).
- `data/hebrew-questions/g*.js` — ארכיון/מקביל לפי הערות בקוד, לא נטען על ידי `generateQuestion`

## איך להשתמש בקובץ ב־Layer 2

1. לכל שורה: אמת `coverage_status` מול ספירת live (legacy/rich/union) ומול סיכון `fallback_masking_risk`.
2. עדיפות תיקון: שורות `missing` / `weak` / `misleading_due_to_fallback` עם `fallback_masking_risk=high`.
3. רק אחרי מילוי חורים ב־live banks, לעדכן שוב את השדות `coverage_status` ו־`fallback_masking_risk` כדי לשמר מסמך עבודה עדכני.

## הערת מוצר חשובה לגבי כיתות א׳–ב׳ (Layer 3)

- **ברירת מחדל:** `resolveAnswerMode` נותן **`choice`** לכיתות 1–2 — רוב g1/g2 נשארים MCQ.
- **חריג מבוקר (typing):** רק פריטים עם `preferredAnswerMode: "typing"` **ובתוך** תת־נושאים מאושרים (`G12_ALLOWED_TYPING_SUBTOPICS` — `g1.spell_word_choice`, `g1.copy_word`, `g2.sentence_wellformed`, `g2.punctuation_choice`) מקבלים `typing`.
- לכן `allowed_task_types_today` ו־`misleading_due_to_fallback` בשורות כתיבה/דיבור צריכים להתייחס ל־**subset** הזה, לא ל״רק MCQ תמיד ללא חריג״.

### אימות חוסם (True Done)

`npm run verify:hebrew-true-done` מריץ ברצף: אימות provenance (כולל קיום קבצים ב־`source_files_in_repo`), `audit-hebrew-g1-g2-hard`, ואודיט כיסוי תתי־נושאים (`zeroCoverage` חייב להיות ריק). **אחרי שלושת אלה — כשלון מפורש (`exit 1`)** אם מתקיים אחד מהבאים:

- יש שורת מטריצה עם `pending_hebrew_ministry_primary`
- ב־`data/hebrew-g12-closure-queue.json` יש פריטים ב־`priority_1` או ב־`priority_2`
- בשורות g1/g2: `misleading_due_to_fallback`, או `weak` עם `fallback_masking_risk: high`
- בשורות g1/g2: `official_objective_source: internal_working_statement`

אין שלב „תזכורת“ בלבד — אלה שערי **pass/fail**.
