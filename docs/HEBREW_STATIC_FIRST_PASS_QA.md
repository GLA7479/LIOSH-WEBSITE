# First-pass static audio — QA (g1–g2 בלבד)

## A. מעטפת static נוכחית (Core v1)

- כיתות: **g1**, **g2** בלבד  
- נושאים: **reading**, **comprehension**  
- מצבי משימה: **listen_and_choose**, **oral_comprehension_mcq**  
- **מזהה נכס:** `he.gen.v1.<sha256-16hex>` — נגזר מ־`narration_plaintext` (כיתה + נושא + **תוכן השאלה** + אפשרויות + משפט סיום).  
- **קבצים:** `/audio/hebrew/gen/v1/<sha16>.mp3` — נוצרים ב־`POST /api/hebrew-audio-ensure` לפני/במקביל לנגן.

## B. מה עדיין על TTS בדפדפן

- **g3–g6** וכל נושא/משימה שלא במעטפת למעלה.  
- כל שאלה עם `seq % 9 < 4` — בלי אודיו.

## C. איך לבדוק ב־UI שמע **מלא** (לא intro גנרי)

1. **g1 או g2** + **reading** או **comprehension**.  
2. פתחו DevTools → בדקו `currentQuestion.params.audioStem`:  
   - `narration_plaintext` — חייב להכיל את **אותו טקסט גוף** כמו ב־`exerciseText` / השאלה לפני ההרחבה עם רמז (או לפחות את המחרוזת המקורית מתוך השאלה).  
   - `playback_kind === "static_url"`  
   - `audio_source === "static_registry_bound"`  
3. לחצו **נגן** — בפעם הראשונה אפשר לראות "מכינים שמע…" ואז השמעה; ה־MP3 אמור להקריא את **כל** `narration_plaintext` (כולל גוף השאלה והאפשרויות).  
4. **לא** אמורה לרוץ `speechSynthesis` למסלול זה (בדיקה: השתקת קול מערכת עברית — עדיין צריך להישמע קובץ).

## D. UI test מומלץ לשאלה מלאה

- בחרו שאלה עם טקסט שאלה **ארוך ומזוהה** (מילה ייחודית).  
- ודאו שב־`narration_plaintext` מופיעה אותה מילה.  
- האזינו — אותה מילה חייבת להישמע בהקלטה.
