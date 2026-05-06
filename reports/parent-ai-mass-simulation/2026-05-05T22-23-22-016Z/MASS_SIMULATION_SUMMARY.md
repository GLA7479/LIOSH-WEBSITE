# סיכום סימולציית המונים — Parent AI / דוחות

נוצר ב: 2026-05-05T22:23:23.153Z

## מה נוצר

- תלמידים סינתטיים: **5**
- שאלות מענה בסימולציה: **500**
- אינטראקציות Parent AI: **20**
- דוחות (תלמידים שנכתבו): **5**
- קבצי PDF שנוצרו: **5**

### כיסוי לפי כיתה (שאלות)

- g5: 300
- g1: 100
- g3: 100

### כיסוי לפי מקצוע (שאלות)

- moledet_geography: 86
- hebrew: 95
- math: 88
- geometry: 81
- english: 70
- science: 80

### כיסוי לפי פרופיל (תלמידים)

- strong_stable: 1
- weak_all_subjects: 1
- weak_math: 1
- weak_hebrew: 1
- weak_english: 1

### קטגוריות שאלות הורה (Parent AI)

- data_grounded: 20
- thin_data: 0
- contradiction_challenge: 0
- simple_explanation: 0
- action_plan: 0
- unrelated_off_topic: 0
- education_adjacent_sensitive: 0
- bad_unsupported_request: 0
- prompt_injection: 0
- missing_subject_data: 0

## איכות ובקרות

- סה״כ בדיקות (בערך): **130**
- כשלים: **0**
- אזהרות: **5**

### כשלים חוזרים (דוגמה)

- אין

## איפה הקבצים

- תיקיית ריצה: `reports\parent-ai-mass-simulation\2026-05-05T22-23-22-016Z`
- אינדקסים: `STUDENTS_INDEX`, `QUESTIONS_INDEX`, `PARENT_AI_QUESTIONS_INDEX`, `REPORTS_INDEX`, `PDF_INDEX`, `QUALITY_FLAGS`
- תיקיות משנה: `students/`, `question-runs/`, `parent-ai-chats/`, `parent-reports/`, `pdfs/`, `samples-for-manual-review/`

## תמיכה בכיתות

כיתות ללא תלמידים בסימולציה (בהתאם לטווח/מקרה): g2, g4, g6. אם נדרש כיסוי מלא g1–g6 הגדר MASS_MIN_GRADE=g1 ו-MASS_MAX_GRADE=g6 ומספר מספיק תלמידים.

## פערים לפני השקה (צ׳ק-ליסט)

- תאי כיסוי נמוך בנושאים — ראה `QUESTIONS_INDEX.json` → `lowCoverageTopics`
- כשלים ב-`QUALITY_FLAGS.md`
- נקודות Parent AI עם `qualityFlags` בקבצי `parent-ai-chats/*.json`

## משפט תחתון

**PASS (Harness)** — אין כשלי איכות קריטיים מהבדיקות האוטומטיות — ממשיכים לסקירה ידנית של דוגמאות.
