# English · translation — תוכן MCQ לסגירת backlog

## מקור
`content-gap-backlog.json` — **15** פריטים: `english` + `translation`, כיתות **g2–g6**, כל רמה **easy / medium / hard**.

## למה הפול הקיים לא הספיק
רוב השורות ב־`TRANSLATION_POOLS` הן כרטיסיות (`en` + `he`) בלי `question` ו־`options`. ב־`question-generator-adapters.mjs`, `isEnglishMcqLike` דורש גזע טקסטואלי ומערך אפשרויות — ולכן תרגום flashcard לא נספר כבנק MCQ ל־Phase 4.

## מה נוסף
קטגוריה חדשה **`simulator_translation_mcq`** בקובץ `data/english-questions/translation-pools.js`: **5** שאלות MCQ (אחת לכל כיתה g2–g6).

האדפטר לא מסנן לפי רמת מטריצה עבור אנגלית — רק כיתה ונושא — ולכן כל שורה מכסה את **שלוש** רמות הקושי לאותה כיתה.

## תוצאה צפויה
- `english:translation` backlog: **0**
- סה״כ content backlog: **0**
- קטלוג: **covered** +15 (לאחר ריצת matrix-smoke עם הקטלוג המעודכן)

פרטים: `english-translation-content-audit.json`.
