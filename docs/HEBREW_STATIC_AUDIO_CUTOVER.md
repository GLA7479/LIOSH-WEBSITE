# Hebrew static audio — cutover gates

## First-pass envelope (Core v1)

- Grades: `g1`, `g2` בלבד  
- Topics: `reading`, `comprehension`  
- Task modes: `listen_and_choose`, `oral_comprehension_mcq`  
- **אין pool קבוע:** כל שאלה מקבלת `narration_plaintext` עם **תוכן השאלה + אפשרויות**, ו־`audio_asset_id = he.gen.v1.<sha16>` לפי hash על הטקסט המנורמל.  
- קובץ שמע: `public/audio/hebrew/gen/v1/<sha16>.mp3` — נוצר ב־**שרת** דרך [`pages/api/hebrew-audio-ensure.js`](../pages/api/hebrew-audio-ensure.js) (Edge neural `he-IL-HilaNeural`), **לא** `speechSynthesis` בדפדפן.

## API

- `POST /api/hebrew-audio-ensure` — גוף JSON: `{ "text": "<narration_plaintext>" }`  
- מחזיר `{ ok, hash16, url }` — הלקוח משמיע את `url` דרך `Audio()`.

## שדות stem (תוספת לחוזה)

- `narration_plaintext` — טקסט מלא להקראה (כולל גוף השאלה).  
- `audio_source`: `static_registry_bound` — first-pass מקושר לתוכן.

## מדיניות קבצים

- תיקיית `public/audio/hebrew/gen/v1/` — קבצים שנוצרו בזמן ריצה (ניתן ל־`.gitignore` בפרויקטים שלא רוצים לקמיט).

## בדיקת UI

- ראו [HEBREW_STATIC_FIRST_PASS_QA.md](./HEBREW_STATIC_FIRST_PASS_QA.md)

## `Hebrew static audio pass achieved` (מעודכן)

1. `narration_plaintext` כולל את גוף השאלה והאפשרויות.  
2. אין שימוש ב־`speechSynthesis` ב־first-pass כשהשמעה הצליחה.  
3. `npm run verify:hebrew-audio` ירוק.  
4. מטריצת דפדפנים ידנית — נגן משמיע MP3 מלא.
