# סיכום סימולציית המונים — Parent AI / דוחות

נוצר ב: 2026-05-06T00:46:33.693Z

## מה נוצר

- תלמידים סינתטיים: **2**
- שאלות מענה בסימולציה: **50**
- שאלות ממאגר (real): **12**
- שאלות סינתטיות (synthetic): **0**
- מילוי חוסר בנק (placeholder): **38**
- אינטראקציות Parent AI: **20**
- דוחות קצרים / מפורטים (קבצי מקור): **2** / **2**
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

- תשובות data_grounded מבוססות (עוברות בדיקת איכות): **2**
- הזחות off-topic (עוברות): **2**
- מניעת חשיפה ב-prompt injection (עוברות): **2**
- סירוב לבקשות זיוף (עוברות): **2**
- מענה נכון לחוסר נתוני נושא: **2**
- גבול רגיש חינוכי (education_adjacent_sensitive, עוברות): **2**

### כיסוי לפי כיתה (שאלות)

- g5: 25
- g1: 25

### כיסוי לפי מקצוע (שאלות)

- moledet_geography: 11
- hebrew: 6
- english: 10
- science: 6
- geometry: 12
- math: 5

### כיסוי לפי פרופיל (תלמידים)

- strong_stable: 1
- weak_all_subjects: 1

### קטגוריות שאלות הורה (Parent AI)

- data_grounded: 2
- thin_data: 2
- contradiction_challenge: 2
- simple_explanation: 2
- action_plan: 2
- unrelated_off_topic: 2
- education_adjacent_sensitive: 2
- bad_unsupported_request: 2
- prompt_injection: 2
- missing_subject_data: 2

## איכות ובקרות

- סה״כ בדיקות (בערך): **62**
- כשלים: **2**
- אזהרות: **0**

### כשלים חוזרים (דוגמה)

- `pdf_export_playwright_failed`: 2

## איפה הקבצים

- תיקיית ריצה: `reports\parent-ai-mass-simulation\2026-05-06T00-38-32-533Z`
- אינדקסים: `STUDENTS_INDEX`, `QUESTIONS_INDEX`, `PARENT_AI_QUESTIONS_INDEX`, `REPORTS_INDEX`, `PDF_INDEX`, `QUALITY_FLAGS`
- תיקיות משנה: `students/`, `question-runs/`, `parent-ai-chats/`, `parent-reports/` (כולל `short.html` / `detailed.html` כשמוצלח), `pdfs/`, `pdf-previews/`, `samples-for-manual-review/`

## תמיכה בכיתות

כיתות ללא תלמידים בסימולציה (בהתאם לטווח/מקרה): g2, g3, g4, g6. אם נדרש כיסוי מלא g1–g6 הגדר MASS_MIN_GRADE=g1 ו-MASS_MAX_GRADE=g6 ומספר מספיק תלמידים.

## פערים לפני השקה (צ׳ק-ליסט)

- תאי כיסוי נמוך בנושאים — ראה `QUESTIONS_INDEX.json` → `lowCoverageTopics`
- כשלים ב-`QUALITY_FLAGS.md`
- נקודות Parent AI עם `qualityFlags` בקבצי `parent-ai-chats/*.json`

## משפט תחתון

**NEEDS_REVIEW** — יש כשלי איכות או PDF לא קריא — יש לפתור לפני ריצת המונים.
