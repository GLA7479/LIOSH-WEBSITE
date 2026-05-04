# Parent Reports Review Pack

- נוצר ב־: 2026-05-03T00:34:50.838Z
- תיקייה: `reports/learning-simulator/parent-report-review-pack/`

## סקירה מהירה

- סה״כ דוחות: **14**
- קבצי JSON במערכת הקבצים: **14** · MD: **14**
- PDF תקינים בדיסק (≥10240 בתים, כותרת %PDF): **12**
- דוחות ללא PDF תקף בדיסק: **2** (כולל דילוג מתועד על מגמות ארוכות)

## מה לחפש בביקורת ידנית

- ניסוח בעברית: בהירות, טון מתאים לילד/הורה, ללא סימון פנימי (DEBUG וכו׳).
- המלצות: ספציפיות מספיקות מול חולשות שזוהו בנתונים.
- עקביות חוזק/חולשה: תלמיד חלש לא מוצג כחזק; תלמיד חזק לא כחלש.
- נפח נתונים דל (thin_data): זהירות בניסוח וביתר ביטחון.
- השוואת פרופילים: **fast_wrong** מול **slow_correct** — הבדל ברור בקצב ובדיוק.
- טבלאות/גרפים בממשק וב-PDF: קריאות, חיתוכים, כותרות.
- PDF: פיצול עמודים סביר, ללא חיתוך חמור של טבלאות.
- RTL: יישור טקסט, סדר עמודות, חפיפות.

## טבלת דוחות (סטטוס PDF)

| reviewId | profileType | grade | מיקוד מקצועות | PDF | סיבת כשל / הערה | scenarioId |
| --- | --- | --- | --- | --- | --- | --- |
| strong_all_g3 | strong_all_subjects | g3 | math, geometry, science, english, hebrew, moledet_geography | ok | — | strong_all_subjects_g3_7d |
| weak_all_g3_deep | weak_all_subjects | g3 | math, geometry, science, english, hebrew, moledet_geography | ok | — | weak_all_subjects_g3_30d |
| thin_data_g3 | thin_data | g3 | math | ok | — | thin_data_g3_1d |
| random_guessing_g3_deep | random_guessing | g3 | math, english, hebrew, science | ok | — | random_guessing_student_g3_30d |
| fast_wrong_synth | fast_wrong | g1 | math | ok | — | review_pack_fast_wrong_g1_math_s0 |
| slow_correct_synth | slow_correct | g2 | english | ok | — | review_pack_slow_correct_g2_english_s0 |
| improving_g4 | improving | g4 | math, english, science | failed | Documented skip: long-window trend reports (improving/declining) are often too heavy to hydrate export controls in Chromium headless within… | improving_student_g4_30d |
| declining_g4 | declining | g4 | math, geometry, hebrew | failed | Documented skip: long-window trend reports (improving/declining) are often too heavy to hydrate export controls in Chromium headless within… | declining_student_g4_30d |
| inconsistent_g5_deep | inconsistent | g5 | math, science, english | ok | — | inconsistent_student_g5_30d |
| weak_math_fractions_g5 | weak_math_or_fractions | g5 | math | ok | — | weak_math_fractions_g5_7d |
| weak_hebrew_comprehension_g3 | weak_hebrew_or_reading | g3 | hebrew | ok | — | weak_hebrew_comprehension_g3_7d |
| weak_english_g4 | weak_english | g4 | english | ok | — | weak_english_grammar_g4_7d |
| weak_science_g5 | weak_science | g5 | science | ok | — | weak_science_cause_effect_g5_7d |
| mixed_strengths_synth | mixed_strengths | g4 | hebrew, math | ok | — | review_pack_mixed_strengths_g4_mixed_s2 |

## מגבלות ייצוא PDF

הדף `/learning/parent-report?qa_pdf=file` משתמש באותו לוגיקת ייצוא כמו שאר האפליקציה; חבילת הביקורת רק מזריעה **localStorage** שונה לכל דוח ומפעילה את כפתור הייצוא — ללא שינוי במוצר.

בסביבות headless, דוחות עם עומס תצוגה גבוה במיוחד (למשל חלונות מגמה ארוכים כמו **improving** / **declining**) לפעמים לא מספיקים להידרדר עד כפתור הייצוא בזמן — במקרה כזה נשמרים **JSON ו-Markdown** המלאים, והביקורת נעשית מהם או מייצוא ידני מהדפדפן.

## Manual review checklist

- האם העברית ברורה וטבעית?
- האם הדוח גנרי מדי?
- האם ההמלצות ספציפיות מספיקות?
- האם תלמידים חלשים לא מוצגים כחזקים?
- האם תלמידים חזקים לא מוצגים כחלשים?
- האם נתון דל (thin-data) מטופל בזהירות?
- האם fast_wrong ו-slow_correct ברורים כשני פרופילים שונים?
- האם תרשימים/טבלאות קריאים?
- האם ה-PDF מפצל עמודים באופן סביר?
- האם יש בעיות RTL/פריסה ברורות?

## קבצים

- `manifest.json` — מפת כל הפריטים
- `reports/*.json` — payload מלא + מטא־דאטה
- `reports/*.md` — תקציר קריא לאדם
- `pdf/*.pdf` — ייצוא עבור הדפסה/שיתוף
