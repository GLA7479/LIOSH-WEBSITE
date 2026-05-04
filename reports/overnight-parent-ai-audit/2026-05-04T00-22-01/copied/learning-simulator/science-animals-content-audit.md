# Science · animals — content audit (gap-fix step)

מקור התאים החסרים: `reports/learning-simulator/content-gap-backlog.json` (נושא `science`, תת-נושא `animals` בלבד).

## תאים חסרים (5)

| cellKey | grade | level |
|---------|-------|-------|
| `g1\|science\|animals\|hard` | g1 | hard |
| `g2\|science\|animals\|hard` | g2 | hard |
| `g4\|science\|animals\|easy` | g4 | easy |
| `g5\|science\|animals\|easy` | g5 | easy |
| `g6\|science\|animals\|easy` | g6 | easy |

**exactMissingReason (משותף):** no science MCQ bank items matched grade/topic/level band  

**targetFileToEditLater:** `data/science-questions.js`

## כיסוי קיים לפני התיקון

- שאלות `animals` קיימות כיסו בעיקר **easy** ל-g1+g2, **medium** לחלק מהכיתות, ו-**hard** ל-g5/g6 בלבד — בלי חפיפה ל-**g1/g2 + hard** וללא **easy** ל-g4–g6 במקבץ MCQ מתאים.

## תוספות מתוכננות (מינימום)

1. **`animals_gapfix_hard_g12`** — `grades`: g1+g2, `minLevel`/`maxLevel`: hard, MCQ → מכסה את שני תאי ה-hard לכיתות א׳–ב׳.
2. **`animals_gapfix_easy_g456`** — `grades`: g4+g5+g6, `minLevel`/`maxLevel`: easy, MCQ → מכסה את שלוש תאי ה-easy לכיתות ד׳–ו׳.

## סיכונים

- שינוי עתידי במסנן הבנק או בדרגות הקושי במטריצה יחייב אימות מחדש.
- ניסוח פדגוגי: לוודא התאמת גיל עם צוות תוכן בעת סקירה.

## צמצום צפוי ב-backlog

- `science:animals`: 5 → 0  
- סה״כ פריטי content backlog: 41 → 36 (בהנחה שאין שינויים מקבילים)

פרטים מלאים: `science-animals-content-audit.json`.
