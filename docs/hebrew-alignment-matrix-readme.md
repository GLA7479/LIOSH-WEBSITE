# Hebrew Official Alignment Matrix — README

## מה הקובץ `data/hebrew-official-alignment-matrix.json` מייצג

זהו **מסמך עבודה קנוני** ל־Layer 1: מיפוי יעדים לימודיים (ניסוח עבודה) לעומת מה שקיים בפועל ב־runtime, לפי:

- `mapped_subtopic_id` מתוך `data/hebrew-g1-content-map.js` ו־`data/hebrew-g2-content-map.js`
- `runtime_topic` הוא אותו מפתח נושא שמופיע ב־UI ובמנוע: `reading` / `comprehension` / `writing` / `grammar` / `vocabulary` / `speaking`

הקובץ **אינו** מחליף תוכנית רשמית של משרד החינוך ואינו מצהיר על מסמך רשמי מחובר, אלא קובע baseline לעבודה המשותפת לפני Layer 2.

## מה נחשב source of truth ל־runtime (שאלות חיות)

רק מה שנגיש בפועל דרך:

- `utils/hebrew-question-generator.js` (מאגר legacy inline: `G*_EASY|MEDIUM|HARD_QUESTIONS`)
- `utils/hebrew-rich-question-bank.js` (`HEBREW_RICH_POOL` דרך `filterRichHebrewPool`)

כל שאר מאגרי הטקסט תחת `data/hebrew-questions/*` **אינם** source of truth ל־runtime כרגע, ולכן לא נכללים בספירות או בכיסוי.

## מה לא נחשב source of truth ל־runtime

- `data/hebrew-curriculum.js` ו־`pages/learning/curriculum.js` — תצוגת תוכנית ומטרות, לא מאגר שאלות
- קבצים תחת `תוכנית משרד החינוך קובצי TXT/` — לא מחוברים ל־generation כרגע
- `data/hebrew-questions/g*.js` — ארכיון/מקביל לפי הערות בקוד, לא נטען על ידי `generateQuestion`

## איך להשתמש בקובץ ב־Layer 2

1. לכל שורה: אמת `coverage_status` מול ספירת live (legacy/rich/union) ומול סיכון `fallback_masking_risk`.
2. עדיפות תיקון: שורות `missing` / `weak` / `misleading_due_to_fallback` עם `fallback_masking_risk=high`.
3. רק אחרי מילוי חורים ב־live banks, לעדכן שוב את השדות `coverage_status` ו־`fallback_masking_risk` כדי לשמר מסמך עבודה עדכני.

## הערת מוצר חשובה לגבי כיתות א׳–ב׳

ב־`utils/hebrew-question-generator.js`, פונקציית `resolveAnswerMode` מחזירה `choice` לכל כיתות 1–2, ולכן גם `writing` ו־`speaking` מתנהגים כ־MCQ במסך. זה משפיע על `allowed_task_types_today` בטבלה ועל `misleading_due_to_fallback` בשורות רלוונטיות.
