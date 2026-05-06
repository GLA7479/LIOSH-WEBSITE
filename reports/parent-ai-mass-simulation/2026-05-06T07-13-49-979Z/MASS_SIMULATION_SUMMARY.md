# סיכום סימולציית המונים — Parent AI / דוחות

נוצר ב: 2026-05-06T07:15:11.840Z

## מה נוצר

- תלמידים סינתטיים: **30**
- שאלות מענה בסימולציה: **6000**
- שאלות ממאגר (real): **1939**
- שאלות סינתטיות (synthetic): **0**
- מילוי חוסר בנק (placeholder): **4061**
- אינטראקציות Parent AI: **300**
- דוחות קצרים / מפורטים (קבצי מקור): **30** / **30**
- PDF קצר / מפורט: **30** / **30**
- סה״כ קבצי PDF: **60**
- PDF קריאים (עברית): **60**
- PDF לא תקינים: **0**

## מה לגבי ה-PDF?

- **כן — אלו דוחות בסגנון המוצר**: רינדור דפי Next (`/learning/parent-report`, `/learning/parent-report-detailed`) והדפסה דרך Playwright (`page.pdf`), כמו `scripts/qa-parent-pdf-export.mjs`.
- **לא** משתמשים ב-jsPDF למסירת דוח להורה.
- **קריאות עברית**: נבדק טקסט מחולץ + גודל קובץ + תצוגה מקדימה PNG לכל דף ראשון — ראה `PDF_INDEX.json`.
- **שרת נדרש**: `http://localhost:3001` חייב להיות זמין בזמן הריצה (`npm run dev` או `npm run start` עם פורט מתאים).

## מקור שאלות

- מצב **hybrid**: ניסיון למשוך שאלות אמיתיות ממאגרי מדעים ועברית כשניתן; אחרת synthetic/placeholder — ספירות בטבלה למעלה.

## Parent AI — סיכום מהיר

- תשובות data_grounded מבוססות (עוברות בדיקת איכות): **29**
- הזחות off-topic (עוברות): **30**
- מניעת חשיפה ב-prompt injection (עוברות): **30**
- סירוב לבקשות זיוף (עוברות): **30**
- מענה נכון לחוסר נתוני נושא: **30**
- גבול רגיש חינוכי (education_adjacent_sensitive, עוברות): **30**
- thin_data + data_grounded (סה״כ): **1**
- thin_data + caveat מוגבלות נתונים (עוברות): **1**
- thin_data + caveat מוגבלות נתונים (נכשלות): **0**

### כיסוי לפי כיתה (שאלות)

- g5: 1800
- g1: 800
- g3: 1000
- g4: 600
- g6: 1200
- g2: 600

### כיסוי לפי מקצוע (שאלות)

- moledet_geography: 1019
- hebrew: 970
- english: 1000
- science: 969
- geometry: 992
- math: 1050

### כיסוי לפי פרופיל (תלמידים)

- strong_stable: 2
- weak_all_subjects: 2
- weak_math: 2
- weak_hebrew: 2
- weak_english: 2
- improving_student: 2
- declining_student: 2
- inconsistent_student: 2
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

- data_grounded: 30
- thin_data: 30
- contradiction_challenge: 30
- simple_explanation: 30
- action_plan: 30
- unrelated_off_topic: 30
- education_adjacent_sensitive: 30
- bad_unsupported_request: 30
- prompt_injection: 30
- missing_subject_data: 30

## איכות ובקרות

- סה״כ בדיקות (בערך): **1140**
- כשלים: **0**
- אזהרות: **0**

### כשלים חוזרים (דוגמה)

- אין

## איפה הקבצים

- תיקיית ריצה: `reports\parent-ai-mass-simulation\2026-05-06T07-13-49-979Z`
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
