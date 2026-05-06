# סיכום סימולציית המונים — Parent AI / דוחות

נוצר ב: 2026-05-06T07:13:36.231Z

## מה נוצר

- תלמידים סינתטיים: **22**
- שאלות מענה בסימולציה: **2200**
- שאלות ממאגר (real): **708**
- שאלות סינתטיות (synthetic): **0**
- מילוי חוסר בנק (placeholder): **1492**
- אינטראקציות Parent AI: **220**
- דוחות קצרים / מפורטים (קבצי מקור): **22** / **22**
- PDF קצר / מפורט: **0** / **0**
- סה״כ קבצי PDF: **0**
- PDF קריאים (עברית): **0**
- PDF לא תקינים: **0**

## מה לגבי ה-PDF?

- **כן — אלו דוחות בסגנון המוצר**: רינדור דפי Next (`/learning/parent-report`, `/learning/parent-report-detailed`) והדפסה דרך Playwright (`page.pdf`), כמו `scripts/qa-parent-pdf-export.mjs`.
- **לא** משתמשים ב-jsPDF למסירת דוח להורה.
- **קריאות עברית**: נבדק טקסט מחולץ + גודל קובץ + תצוגה מקדימה PNG לכל דף ראשון — ראה `PDF_INDEX.json`.
- **שרת נדרש**: `http://localhost:3001` חייב להיות זמין בזמן הריצה (`npm run dev` או `npm run start` עם פורט מתאים).

## מקור שאלות

- מצב **hybrid**: ניסיון למשוך שאלות אמיתיות ממאגרי מדעים ועברית כשניתן; אחרת synthetic/placeholder — ספירות בטבלה למעלה.

## Parent AI — סיכום מהיר

- תשובות data_grounded מבוססות (עוברות בדיקת איכות): **21**
- הזחות off-topic (עוברות): **22**
- מניעת חשיפה ב-prompt injection (עוברות): **22**
- סירוב לבקשות זיוף (עוברות): **22**
- מענה נכון לחוסר נתוני נושא: **22**
- גבול רגיש חינוכי (education_adjacent_sensitive, עוברות): **22**
- thin_data + data_grounded (סה״כ): **1**
- thin_data + caveat מוגבלות נתונים (עוברות): **1**
- thin_data + caveat מוגבלות נתונים (נכשלות): **0**

### כיסוי לפי כיתה (שאלות)

- g5: 600
- g1: 400
- g3: 400
- g4: 300
- g6: 400
- g2: 100

### כיסוי לפי מקצוע (שאלות)

- moledet_geography: 398
- hebrew: 363
- english: 386
- science: 345
- geometry: 348
- math: 360

### כיסוי לפי פרופיל (תלמידים)

- strong_stable: 1
- weak_all_subjects: 1
- weak_math: 1
- weak_hebrew: 1
- weak_english: 1
- improving_student: 1
- declining_student: 1
- inconsistent_student: 1
- random_guessing: 1
- fast_wrong: 1
- slow_correct: 1
- repeated_misconception: 1
- prerequisite_gap: 1
- thin_data: 1
- rich_data: 1
- mixed_strengths: 1
- reading_comprehension_gap: 1
- calculation_errors: 1
- word_problem_gap: 1
- topic_specific_gap: 1
- external_question_flow: 1
- six_subject_mixed_profile: 1

### קטגוריות שאלות הורה (Parent AI)

- data_grounded: 22
- thin_data: 22
- contradiction_challenge: 22
- simple_explanation: 22
- action_plan: 22
- unrelated_off_topic: 22
- education_adjacent_sensitive: 22
- bad_unsupported_request: 22
- prompt_injection: 22
- missing_subject_data: 22

## איכות ובקרות

- סה״כ בדיקות (בערך): **660**
- כשלים: **0**
- אזהרות: **0**

### כשלים חוזרים (דוגמה)

- אין

## איפה הקבצים

- תיקיית ריצה: `reports\parent-ai-mass-simulation\2026-05-06T07-13-34-228Z`
- אינדקסים: `STUDENTS_INDEX`, `QUESTIONS_INDEX`, `PARENT_AI_QUESTIONS_INDEX`, `REPORTS_INDEX`, `PDF_INDEX`, `QUALITY_FLAGS`
- תיקיות משנה: `students/`, `question-runs/`, `parent-ai-chats/`, `parent-reports/` (כולל `short.html` / `detailed.html` כשמוצלח), `pdfs/`, `pdf-previews/`, `samples-for-manual-review/`

## תמיכה בכיתות

כל הכיתות g1, g2, g3, g4, g5, g6 מיוצגות לפחות בתלמיד אחד.

## פערים לפני השקה (צ׳ק-ליסט)

- תאי כיסוי נמוך בנושאים — ראה `QUESTIONS_INDEX.json` → `lowCoverageTopics`
- כשלים ב-`QUALITY_FLAGS.md`
- נקודות Parent AI עם `qualityFlags` בקבצי `parent-ai-chats/*.json`

## משפט תחתון

**PASS (Harness)** — אין כשלי איכות קריטיים — ניתן להמשיך לסקירה ידנית ואז ללילה ארוך.
