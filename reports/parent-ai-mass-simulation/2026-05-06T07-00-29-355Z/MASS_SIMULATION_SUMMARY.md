# סיכום סימולציית המונים — Parent AI / דוחות

נוצר ב: 2026-05-06T07:07:16.137Z

## מה נוצר

- תלמידים סינתטיים: **150**
- שאלות מענה בסימולציה: **50100**
- שאלות ממאגר (real): **16652**
- שאלות סינתטיות (synthetic): **0**
- מילוי חוסר בנק (placeholder): **33448**
- אינטראקציות Parent AI: **1500**
- דוחות קצרים / מפורטים (קבצי מקור): **150** / **150**
- PDF קצר / מפורט: **150** / **150**
- סה״כ קבצי PDF: **300**
- PDF קריאים (עברית): **300**
- PDF לא תקינים: **0**

## מה לגבי ה-PDF?

- **כן — אלו דוחות בסגנון המוצר**: רינדור דפי Next (`/learning/parent-report`, `/learning/parent-report-detailed`) והדפסה דרך Playwright (`page.pdf`), כמו `scripts/qa-parent-pdf-export.mjs`.
- **לא** משתמשים ב-jsPDF למסירת דוח להורה.
- **קריאות עברית**: נבדק טקסט מחולץ + גודל קובץ + תצוגה מקדימה PNG לכל דף ראשון — ראה `PDF_INDEX.json`.
- **שרת נדרש**: `http://localhost:3001` חייב להיות זמין בזמן הריצה (`npm run dev` או `npm run start` עם פורט מתאים).

## מקור שאלות

- מצב **hybrid**: ניסיון למשוך שאלות אמיתיות ממאגרי מדעים ועברית כשניתן; אחרת synthetic/placeholder — ספירות בטבלה למעלה.

## Parent AI — סיכום מהיר

- תשובות data_grounded מבוססות (עוברות בדיקת איכות): **143**
- הזחות off-topic (עוברות): **150**
- מניעת חשיפה ב-prompt injection (עוברות): **150**
- סירוב לבקשות זיוף (עוברות): **150**
- מענה נכון לחוסר נתוני נושא: **150**
- גבול רגיש חינוכי (education_adjacent_sensitive, עוברות): **150**

### כיסוי לפי כיתה (שאלות)

- g5: 8016
- g1: 10020
- g3: 8684
- g4: 8684
- g6: 7348
- g2: 7348

### כיסוי לפי מקצוע (שאלות)

- moledet_geography: 8321
- hebrew: 8394
- english: 8360
- science: 8258
- geometry: 8360
- math: 8407

### כיסוי לפי פרופיל (תלמידים)

- strong_stable: 7
- weak_all_subjects: 7
- weak_math: 7
- weak_hebrew: 7
- weak_english: 7
- improving_student: 7
- declining_student: 7
- inconsistent_student: 7
- random_guessing: 7
- fast_wrong: 7
- slow_correct: 7
- repeated_misconception: 7
- prerequisite_gap: 7
- thin_data: 7
- rich_data: 7
- mixed_strengths: 7
- reading_comprehension_gap: 7
- calculation_errors: 7
- word_problem_gap: 6
- topic_specific_gap: 6
- external_question_flow: 6
- six_subject_mixed_profile: 6

### קטגוריות שאלות הורה (Parent AI)

- data_grounded: 150
- thin_data: 150
- contradiction_challenge: 150
- simple_explanation: 150
- action_plan: 150
- unrelated_off_topic: 150
- education_adjacent_sensitive: 150
- bad_unsupported_request: 150
- prompt_injection: 150
- missing_subject_data: 150

## איכות ובקרות

- סה״כ בדיקות (בערך): **5700**
- כשלים: **7**
- אזהרות: **0**

### כשלים חוזרים (דוגמה)

- `copilot_assert_thin_profile_acknowledges_limits`: 7

## איפה הקבצים

- תיקיית ריצה: `reports\parent-ai-mass-simulation\2026-05-06T07-00-29-355Z`
- אינדקסים: `STUDENTS_INDEX`, `QUESTIONS_INDEX`, `PARENT_AI_QUESTIONS_INDEX`, `REPORTS_INDEX`, `PDF_INDEX`, `QUALITY_FLAGS`
- תיקיות משנה: `students/`, `question-runs/`, `parent-ai-chats/`, `parent-reports/` (כולל `short.html` / `detailed.html` כשמוצלח), `pdfs/`, `pdf-previews/`, `samples-for-manual-review/`

## תמיכה בכיתות

כל הכיתות g1, g2, g3, g4, g5, g6 מיוצגות לפחות בתלמיד אחד.

## פערים לפני השקה (צ׳ק-ליסט)

- תאי כיסוי נמוך בנושאים — ראה `QUESTIONS_INDEX.json` → `lowCoverageTopics`
- כשלים ב-`QUALITY_FLAGS.md`
- נקודות Parent AI עם `qualityFlags` בקבצי `parent-ai-chats/*.json`

## משפט תחתון

**NEEDS_REVIEW** — יש כשלי איכות או PDF לא קריא — יש לפתור לפני ריצת המונים.
