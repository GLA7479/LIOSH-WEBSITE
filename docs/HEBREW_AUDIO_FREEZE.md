# Hebrew audio close & English-ready shared platform — freeze gates

מסמך יציאה לפי תוכנית **Hebrew Audio Final Completion (Post Build 1)**. אין להפעיל מוצר אנגלית כאן — רק תשתית משותפת.

## K.1 `Hebrew audio close achieved`

כל אלה חייבים להתקיים:

1. **משפחות משימות** — סכמה 2 ב־[`utils/audio-task-contract.js`](../utils/audio-task-contract.js): `listen_and_choose`, `oral_comprehension_mcq`, `guided_recording`, `phonological_discrimination_he`, `audio_grammar_choice_he`, `read_aloud_short_he`, `structured_spoken_response_he`; צירוף ב־[`utils/hebrew-audio-attach.js`](../utils/hebrew-audio-attach.js).
2. **מחזור הקלטה** — הקלטה קצרה → שמירה מקומית + ניסיון סנכרון ל־[`pages/api/hebrew-audio-artifact.js`](../pages/api/hebrew-audio-artifact.js) עם מטא־דאטה ותור סקירה.
3. **מדיניות ציון** — [`utils/audio-scoring-policy.js`](../utils/audio-scoring-policy.js): אוטו־בטוח רק ל־MCQ אחרי האזנה; דיבור = ידני בראש; `borderline_transcript_assist` ללא ציון מוצר אוטומטי מלא.
4. **פרטיות / retention** — ברירת מחדל פיתוח: `retention_policy: dev_local_default_30d_advisory` במטא־ארטיפקט; מחיקת `data/_audio_store/` ו־`data/hebrew-audio-review-queue.json` לפי מדיניות ארגון לפני פרוד.
5. **מoderation** — שדה `moderation_flag` בשורת תור ([`utils/hebrew-audio-review-queue.js`](../utils/hebrew-audio-review-queue.js)); ניתוב ידני לפני סגירת סקירה.
6. **אימות** — `npm run verify:hebrew-audio-final` + `npm run verify:hebrew-audio-build1` ירוקים לפני freeze.

## K.2 `Shared audio platform English-ready`

1. חוזה **locale** בשדה `locale` (כיום `he-IL`; מוכן ל־packs נוספים).
2. ממשקי upload/review/scoring מופרדים מטקסט תוכן (מזהי `audio_asset_id`, `task_mode`).
3. **אין** הפעלת משימות אנגלית או מתאמי phonics אנגליים — רק נקודות הרחבה עתידיות (למשל `english_ready_adapter_slots` בתוכנית המקורית).

## אסור במחזור זה (מוצר)

- ציון הגייה כסמכות סופית.
- ציון דיבור חופשי ארוך כאוטומטי מלא.
- STT כציון סופי לדיבור.

## פקודות אימות

```bash
npm run verify:hebrew-audio-build1
npm run verify:hebrew-audio-final
```
