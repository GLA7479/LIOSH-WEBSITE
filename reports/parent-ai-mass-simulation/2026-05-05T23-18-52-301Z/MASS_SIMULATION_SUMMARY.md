# סיכום סימולציית המונים — Parent AI / דוחות

נוצר ב: 2026-05-06T00:06:57.746Z

## מה נוצר

- תלמידים סינתטיים: **12**
- שאלות מענה בסימולציה: **1200**
- שאלות ממאגר (real): **409**
- שאלות סינתטיות (synthetic): **0**
- מילוי חוסר בנק (placeholder): **791**
- אינטראקציות Parent AI: **120**
- דוחות קצרים / מפורטים (קבצי מקור): **12** / **12**
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

- תשובות data_grounded מבוססות (עוברות בדיקת איכות): **12**
- הזחות off-topic (עוברות): **12**
- מניעת חשיפה ב-prompt injection (עוברות): **12**
- סירוב לבקשות זיוף (עוברות): **12**
- מענה נכון לחוסר נתוני נושא: **12**
- גבול רגיש חינוכי (education_adjacent_sensitive, עוברות): **12**

### כיסוי לפי כיתה (שאלות)

- g5: 400
- g1: 100
- g3: 300
- g4: 300
- g6: 100

### כיסוי לפי מקצוע (שאלות)

- moledet_geography: 219
- hebrew: 220
- english: 200
- science: 189
- geometry: 188
- math: 184

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

### קטגוריות שאלות הורה (Parent AI)

- data_grounded: 12
- thin_data: 12
- contradiction_challenge: 12
- simple_explanation: 12
- action_plan: 12
- unrelated_off_topic: 12
- education_adjacent_sensitive: 12
- bad_unsupported_request: 12
- prompt_injection: 12
- missing_subject_data: 12

## איכות ובקרות

- סה״כ בדיקות (בערך): **372**
- כשלים: **12**
- אזהרות: **0**

### כשלים חוזרים (דוגמה)

- `pdf_export_playwright_failed`: 12

## איפה הקבצים

- תיקיית ריצה: `reports\parent-ai-mass-simulation\2026-05-05T23-18-52-301Z`
- אינדקסים: `STUDENTS_INDEX`, `QUESTIONS_INDEX`, `PARENT_AI_QUESTIONS_INDEX`, `REPORTS_INDEX`, `PDF_INDEX`, `QUALITY_FLAGS`
- תיקיות משנה: `students/`, `question-runs/`, `parent-ai-chats/`, `parent-reports/` (כולל `short.html` / `detailed.html` כשמוצלח), `pdfs/`, `pdf-previews/`, `samples-for-manual-review/`

## תמיכה בכיתות

כיתות ללא תלמידים בסימולציה (בהתאם לטווח/מקרה): g2. אם נדרש כיסוי מלא g1–g6 הגדר MASS_MIN_GRADE=g1 ו-MASS_MAX_GRADE=g6 ומספר מספיק תלמידים.

## פערים לפני השקה (צ׳ק-ליסט)

- תאי כיסוי נמוך בנושאים — ראה `QUESTIONS_INDEX.json` → `lowCoverageTopics`
- כשלים ב-`QUALITY_FLAGS.md`
- נקודות Parent AI עם `qualityFlags` בקבצי `parent-ai-chats/*.json`

## משפט תחתון

**NEEDS_REVIEW** — יש כשלי איכות או PDF לא קריא — יש לפתור לפני ריצת המונים.
