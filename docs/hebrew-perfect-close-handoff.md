# Hebrew — Perfect Close (governance + traceability)

מסמך **Perfect Close**: עברית נחשבת סגורה סופית רק כשמתקיימים כל התנאים להלן, מעבר ל־True Done התפעולי.

**החרגות מפורשות בלבד (לא בתוך הסקופ):**

- אודיו / שמע / הקלטה
- כתיבה חופשית ארוכה (פסקה פתוחה ומעלה)

---

## F. Perfect freeze definition — `Hebrew perfect close achieved`

ניתן לכתוב `Hebrew perfect close achieved` רק כאשר:

1. **מקור רשמי מנוטר:** `data/hebrew-official-source-version.json` מכיל `expected_pdf_sha256` שתואם ל־`hebrew-1-6.pdf` בדיסק (נבדק ב־`hebrew-official-provenance-validate`).
2. **רישום קטעים (מועמדים בלבד):** `data/hebrew-official-excerpts.json` קיים, `pdf_sha256` תואם; מזהה יציב לרשומה: `heb16.{grade}.{mapped_subtopic_id}.{runtime_topic}` (כולל topic כדי להפריד שורות מטריצה עם אותו subtopic); `extraction_tier: heuristic_candidate` — **אינה binding סופי** בלי אישור ביומן הסקירה.
3. **יומן סקירה שורה־שורה:** `data/hebrew-official-row-review.json` — לכל g1/g2 יש רשומה; רק `review_status: approved` עם `row_specific_rationale_he` ייחודי, מחלקות איכות לא חלשות, ו־`support_type`/`official_objective_source` עקביים מאפשרים **Perfect Close אמיתי** (ראו `docs/hebrew-perfect-credible-signoff.md`).
4. **מיפוי שורה־שורה במטריצה:** בכל שורת g1/g2 ב־`data/hebrew-official-alignment-matrix.json`:
   - **מקושר:** `mapping_status: file_bound_excerpt_linked`, עוגן `hebrew-1-6.pdf#chars=START-END`, `official_doc_excerpt_ref` תואם ליומן המאושר
   - **ממתין לסקירה:** `mapping_status: file_bound_excerpt_pending`, ללא excerpt — עד אישור ביומן
   - ל־`ministry_summary_verified`: `summary_alignment_justification` חייב להיות זהה ל־`row_specific_rationale_he` ביומן (אורך ≥ 40)
5. **אי־סטייה:** `data/hebrew-official-row-binding.json` תואם למטריצה; `scripts/hebrew-official-divergence-audit.mjs` עובר.
6. **כיסוי מטריצה (אמת):** אין `adequate`/`complete` בלי `runtime_coverage_adequacy_declared === true` ביומן ובלי binding מאושר; שורות לא מאושרות נשארות `partial` + pending.
7. **אימות חוסם:** `npm run verify:hebrew-true-done` עובר; ל־Perfect Close מלא — גם `npm run verify:hebrew-perfect-credible`.

**שקיפות:** עוגן התווים מוכיח מיקום בקובץ; **רלוונטיות פדגוגית** נקבעת רק דרך יומן הסקירה והטקסט הספציפי לשורה.

---

## Pipeline (סדר הרצה)

1. `npm run hebrew:official-extract-excerpts` — מועמדי קטעים + `hebrew-official-source-version.json`
2. `npm run hebrew:official-init-row-review` — יוצר/מאתחל `hebrew-official-row-review.json` (כולן `needs_review`)
3. סקירה ידנית ביומן — אישור שורה־שורה
4. `npm run hebrew:official-bind-rows` — מעדכן מטריצה + `hebrew-official-row-binding.json` לפי **approved בלבד**
5. `npm run verify:hebrew-true-done`
6. (Perfect Close credibility) `npm run verify:hebrew-perfect-credible`

---

## Artifacts

| קובץ | תפקיד |
|------|--------|
| `data/hebrew-official-excerpts.json` | רישום קטעים מועמדים (heuristic) לפי שורה |
| `data/hebrew-official-row-review.json` | יומן אישור שורה — מקור האמת ל־binding סופי |
| `data/hebrew-official-source-version.json` | נעילת גרסת PDF (SHA256) |
| `data/hebrew-official-row-binding.json` | צילום מיפוי לבדיקת divergence |

*עודכן במסגרת Hebrew Final Perfection — ללא שינוי קובץ תכנון תחת `.cursor/plans/`.*
