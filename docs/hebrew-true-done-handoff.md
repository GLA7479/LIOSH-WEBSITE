# Hebrew — True Done handoff (א׳–ב׳ מול מטריצה)

מסמך סגירה לאחר **Final Completion Pass**: מקור משרד מחובר, תור סגירה ריק, אימות חוסם מלא, מטריצה מסונכרנת.

**אין לערוך** את קובץ התכנון תחת `.cursor/plans/`.

**Perfect Close (מעבר ל־True Done):** ראו [`docs/hebrew-perfect-close-handoff.md`](hebrew-perfect-close-handoff.md) — מיפוי שורה־שורה ל־excerpt מה־PDF, נעילת SHA256, ואימות divergence.

---

## 1. Evidence — פקודות חוסמות (חייבות לעבור)

| בדיקה | פקודה |
|--------|--------|
| אצווה מלאה | `npm run verify:hebrew-true-done` |

האצווה כוללת:

1. `scripts/hebrew-official-provenance-validate.mjs` — סכימה + קיום קבצים ב־`source_files_in_repo`
2. `scripts/audit-hebrew-g1-g2-hard.mjs` — חוסמים בלבד (אורך תשובות, מטא־דאטה, וכו׳)
3. `scripts/hebrew-subtopic-coverage-audit.mjs` — `zeroCoverage` חייב להיות ריק
4. **אין** `pending_hebrew_ministry_primary` בשום שורת מטריצה
5. **אין** פריטים ב־`priority_1` / `priority_2` ב־`data/hebrew-g12-closure-queue.json`
6. **אין** בשורות g1/g2: `misleading_due_to_fallback`, או `weak` עם `fallback_masking_risk: high`
7. **אין** `official_objective_source: internal_working_statement` בשורות g1/g2

**Windows:** סקריפט האימות משתמש בנתיבים יחסיים ל־`cwd` של הפרויקט (רווחים בנתיב משתמש).

---

## 2. מקור משרד החינוך (עברית / לשון)

| שדה | ערך |
|-----|-----|
| קובץ בריפו | `hebrew-1-6.pdf` (שורש הפרויקט) |
| URL קנוני (משרד החינוך / meyda) | `https://meyda.education.gov.il/files/Curriculum/hebrew-1-6.pdf` |
| שימוש במטריצה | כל שורה: `official_provenance.source_files_in_repo` מכיל את `hebrew-1-6.pdf`, `mapping_status: file_bound_excerpt_linked`, `official_objective_source: ministry_summary_verified`, `official_doc_id` = ה־URL לעיל |

תיאור קטלוג: `data/hebrew-ministry-source-catalog.json` (גרסה 2).

---

## 3. Out of scope (מפורש בלבד)

- **אודיו** במשימות עברית
- **כתיבה חופשית ארוכה** (פסקה פתוחה ומעלה)

כל יתר היעדים במטריצה נסגרו תחת ההגדרה הנוכחית (כולל הגבלות MCQ/typing בא׳–ב׳ כפי המתועד ב־matrix notes).

**סיכום סגירה (תיעוד):** עברית מוגדרת כ־**True Done** לפי ההגדרה הנוכחית. **החרגות מפורשות שנשארות:** אודיו; כתיבה חופשית ארוכה. **שקיפות קישור למשרד:** `file_bound_excerpt_linked` עם `ministry_summary_verified` — אין `official_section_anchor` עמוד־עמוד לכל שורה.

---

## 4. סקריפט סנכרון מטריצה (חד־פעמי / חוזר)

`npx tsx scripts/hebrew-matrix-bind-ministry-primary-and-sync.mjs` — מקשר provenance ומיישם תיקוני `coverage_status` לפי סגירת ה־Final Pass.

---

## 5. Freeze (אחרי סגירה)

**אין שינוי נוסף** בקוד runtime של עברית, ב־UI, בדוח הורים, בעמוד curriculum, או בהרחבת typing — ללא אישור מפורש. סעיף זה קובע גבול תחזוקה; השינויים שבוצעו בשלב ה־Final Pass לפני הסגירה מתועדים ב־git history בלבד.

*עודכן לאחר עמידה ב־`verify:hebrew-true-done`.*
