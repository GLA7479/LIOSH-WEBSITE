# PHASE 11 — Dev Student Data Control Panel

סטטוס: תוכנית עבודה בלבד (ללא מימוש קוד בשלב זה).

## A. Understanding of the goal

### מה בונים
- עמוד Dev מוגן ליצירה/עדכון/איפוס/ייבוא/ייצוא נתוני למידה מדומים ב־browser storage של האפליקציה.
- אחרי Apply, הדוחות המקוריים מתעדכנים טבעית מהנתונים:
  - `/learning/parent-report`
  - `/learning/parent-report-detailed`
  - `/learning/parent-report-detailed?mode=summary`

### מה לא בונים
- לא מייצרים טקסט דוח.
- לא כותבים מסקנות דוח ישירות ל־storage.
- לא עוקפים את מנוע הדוחות או את ה־routes האמיתיים.

## B. Required naming (exact)

ההגדרות חייבות להיות בדיוק כך:

- **Page route:** `/learning/dev-student-simulator`
- **Login API:** `/api/dev-student-simulator/login`
- **Logout API:** `/api/dev-student-simulator/logout`
- **Env:**
  - `ENABLE_DEV_STUDENT_SIMULATOR=true`
  - `DEV_STUDENT_SIMULATOR_PASSWORD=...`

## C. Current storage/schema investigation plan (Phase 1 only)

לפני כל מימוש, סריקה מדויקת של:

1. `pages/learning/parent-report.js`
2. `pages/learning/parent-report-detailed.js`
3. `pages/learning/parent-report-detailed.renderable.jsx`
4. `components/parent-report-detailed-surface.jsx`
5. `utils/parent-report-v2.js`
6. `utils/detailed-parent-report.js`
7. `utils/progress-storage.js`
8. `utils/safe-local-storage.js`
9. `pages/learning/math-master.js`
10. `pages/learning/geometry-master.js`
11. `pages/learning/hebrew-master.js`
12. `pages/learning/english-master.js`
13. `pages/learning/science-master.js`
14. `pages/learning/moledet-geography-master.js`
15. רפרנס קיים (לידע בלבד):
   - `reports/parent-report-learning-simulations/deep-storage-schema.md`
   - `scripts/lib/deep-learning-sim-storage.mjs`

### מה חייב לצאת מהחקירה
- exact localStorage keys.
- exact object structures לכל key.
- exact subject/topic keys בפועל שהדוחות מזהים.
- exact fields required for reports.
- מיפוי מפורש: איזה שדות computed בזמן ריצה ואיזה persisted.

## D. Proposed file structure (for later implementation)

קבצים מתוכננים (לא יוצרים עכשיו):

1. Route:
- `pages/learning/dev-student-simulator.js`

2. API:
- `pages/api/dev-student-simulator/login.js`
- `pages/api/dev-student-simulator/logout.js`

3. Simulator core:
- `utils/dev-student-simulator/schema.js`
- `utils/dev-student-simulator/presets.js`
- `utils/dev-student-simulator/session-builder.js`
- `utils/dev-student-simulator/storage-writer.js`
- `utils/dev-student-simulator/validator.js`
- `utils/dev-student-simulator/import-export.js`
- `utils/dev-student-simulator/metadata.js`

4. Docs/proof:
- `reports/dev-student-simulator/schema-discovery.md`
- `reports/dev-student-simulator/proof-checklist.md`
- `scripts/dev-student-simulator-proof.mjs` (אם נדרש)

## E. Security plan (explicit)

1. **Server-side enforcement חובה**
- הגנת העמוד וה־API תהיה בצד שרת, לא רק UI client.

2. **Env flag off behavior**
- אם `ENABLE_DEV_STUDENT_SIMULATOR` כבוי:
  - ה־page וה־API מחזירים `404` או `403` (מדיניות אחידה לכל endpoints).

3. **Password secrecy**
- `DEV_STUDENT_SIMULATOR_PASSWORD` נבדק רק בצד שרת.
- לא לחשוף סיסמה ל־client code.
- לא להשתמש ב־`NEXT_PUBLIC_*` עבור סיסמה/סודות.

4. **Session cookie**
- cookie חתום (`signed`) + `httpOnly` + `SameSite` + `Secure` לפי סביבה + `maxAge` קצר.
- UI login לבדו **לא מספיק** בלי בדיקה server-side.

## F. Reset safety plan (explicit)

1. **לפני Apply**
- לבנות `touchedKeys` מדויק של כל keys שהסימולטור עומד לכתוב.
- לשמור backup snapshot של כל `touchedKeys` לפני כתיבה.
- לשמור metadata של סימולטור (כולל touchedKeys ו־backup reference/inline snapshot).

2. **בעת Reset**
- קודם לנסות restore של backup snapshot הקודם.
- אם אין backup זמין: להסיר רק keys שהסימולטור כתב, לפי metadata מפורש.
- **אסור** למחוק בצורה עיוורת את כל `mleo_*`.

## G. Simulator UI plan

1. Login section (server-auth)
2. Preset selector
3. Student identity
4. Period controls
5. Subjects controls
6. Topics controls
7. Behavior profile controls
8. Validation panel (blocked/warning/pass)
9. Storage preview
10. Actions:
   - Apply to current browser
   - Reset simulated student
   - Export JSON
   - Import JSON
   - Copy storage snapshot
11. Links ל־real routes:
   - short report
   - detailed report
   - summary report

## H. Deep preset plan (first 6)

1. `simDeep01_mixed_real_child`
- 120 ימים, 70–90 sessions, 1200–1800 שאלות
- מקצועות: math, geometry, Hebrew, English, science
- expected: עדיפות הורית אחת ברורה
- must-not: המלצות הוריות מפוזרות

2. `simDeep02_strong_stable_child`
- 90–120 ימים, 60+ sessions, 1000+ שאלות
- מקצועות: math, English, Hebrew, science
- expected: שימור/הרחבה מבוקרת
- must-not: remediation או main story של knowledge-gap

3. `simDeep03_weak_math_long_term`
- 120–150 ימים, 60+ sessions, 900+ שאלות
- מקצועות: math, geometry, Hebrew, English
- expected: math primary
- must-not: insufficient evidence כ־main story

4. `simDeep04_improving_child`
- 120 ימים, 60+ sessions, 1000+ שאלות
- מקצועות: math, Hebrew, English, geometry
- expected: שיפור + ייצוב
- must-not: מסר שיפור מוגזם/לא מבוסס

5. `simDeep05_declining_after_difficulty_jump`
- 90–120 ימים, 50+ sessions, 800+ שאלות
- מקצועות: math, geometry, English, science
- expected: stabilize level, לא להעלות קושי
- must-not: מסקנה שמקדמת increase difficulty

6. `simDeep06_fast_careless_vs_slow_accurate_mix`
- 90–120 ימים, 50+ sessions, 800+ שאלות
- מקצועות: math, Hebrew, English, geometry
- expected: pace/checking focus
- must-not: pure knowledge-gap framing

## I. Validation rules

### Blocked
- ימים < 90
- sessions < 40
- שאלות < 600
- מקצועות פעילים < 4 (אלא אם מוגדר חריג מפורש)
- topic diversity נמוכה מדי
- date concentration לא סבירה
- topic keys לא מוכרים

### Warning
- trend evidence חלש
- נפח ראיות חלש בחלון שבוע
- time/mistakes distributions גבוליים

### Pass
- אין חסימות; אזהרות מוצגות ומאושרות.

## J. Apply/reset/import/export behavior

1. Apply to current browser
- validate -> backup touched keys -> write touched keys בלבד -> write simulator metadata.

2. Reset simulated student
- restore backup snapshot הקודם **או** remove only simulator-written tracked keys.
- never wipe all `mleo_*`.

3. Export JSON
- ייצוא של whitelist + metadata + version.

4. Import JSON
- schema validate + safety validate + apply flow עם backup.

5. Copy storage snapshot
- העתקת snapshot ללוח.

6. Open short/detailed/summary
- פתיחת ה־routes האמיתיים בלבד.

## K. Browser proof plan (story fidelity required)

לכל preset חייבים לבדוק גם fidelity של הסיפור, לא רק no-data:

1. strong stable
- אין remediation main story.
- אין knowledge-gap main story.

2. weak math
- math הוא primary.

3. improving
- הדוח מזהה improvement/stabilization.

4. declining after jump
- הדוח ממליץ stabilize level / no difficulty increase.

5. pace behavior
- דגש pace/checking, לא pure knowledge gap.

6. mixed realistic
- עדיפות הורית אחת ברורה, לא המלצות מפוזרות.

בנוסף:
- החלפת preset משנה את סיפור הדוח בפועל.
- reset מחזיר מצב נקי/בסיס.

## L. Phase gate (explicit hard stop)

1. **Phase 1 בלבד**: schema inspection + doc.
2. בסוף Phase 1:
- עוצרים ומחזירים exact discovered schema (keys, structures, subject/topic keys, required fields, computed vs persisted).
3. **לא ממשיכים ל־Phase 2** בלי אישור מפורש.

## M. Risks and open questions

- האם קיימים keys מדור קודם שנקראים בעקיפין בדוחות.
- האם כל subject/topic keys תואמים בין master pages ל־report engine.
- מהו מינימום evidence המדויק לכל period/report path.

## N. Acceptance criteria

- naming/env/api בדיוק כפי שהוגדרו בסעיף B.
- server-side blocking פעיל כשה־env כבוי.
- secret לא נחשף ללקוח/`NEXT_PUBLIC`.
- reset safety ממומש עם backup/metadata בלי wipe עיוור.
- phase gate נאכף (עצירה אחרי Phase 1 עד approval).
- browser proof כולל story fidelity לכל 6 presets.
