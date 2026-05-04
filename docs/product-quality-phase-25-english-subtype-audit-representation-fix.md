# Product Quality Phase 25 — English Subtype Audit Representation Fix

**Last updated:** 2026-05-05  
**Status:** Implemented — audit script + regenerated [`reports/question-audit/`](../reports/question-audit/) only. **No** English question text, Hebrew wording, answers, indices, scoring, runtime, UI, Parent AI, Copilot, APIs, or [`data/english-questions/`](../data/english-questions/) bank files were modified.

**Upstream:** [**Phase 24**](product-quality-phase-24-english-subtype-metadata-review.md) concluded the **621** empty-**`subtype`** English rows were **not** a content defect; taxonomy already lived in **`subtopic`** (pool key) and **`patternFamily`**. Phase 25 applies the recommended **audit-only** default.

---

## 1. Goal

For **`english_pool_item`** rows, when the bank object omits **`subtype`**, the audit export sets **`subtype`** to the **pool key** (same value as **`subtopic`**). Rows that already define **`subtype`** in the bank keep that literal value.

---

## 2. Code change

**File:** [`scripts/audit-question-banks.mjs`](../scripts/audit-question-banks.mjs)

- Added **`englishAuditSubtype(item, poolKey)`**: returns trimmed **`item.subtype`** when non-empty; otherwise **`poolKey`**.
- **`collectEnglishPool`** — all three **`pushRow`** paths (question-frames G2/G3 split, G5/G6 split, default) now use **`subtype: englishAuditSubtype(item, poolKey)`** instead of **`item.subtype || ""`**.

**Runtime / product:** unchanged — the learning app does not consume this audit JSON as authoritative bank metadata for gameplay.

---

## 3. Regeneration

**Command:** `npx tsx scripts/audit-question-banks.mjs`  
**Result:** Exit code **0**; outputs written to [`reports/question-audit/`](../reports/question-audit/).

---

## 4. Verification (post-run)

| Check | Result |
|-------|--------|
| Total audit rows | **12157** (matches post–Phase 22 baseline; Phase 15 cited **12158** before Hebrew dedupe) |
| English rows (`subject === english`) | **852** |
| English rows with empty **`subtype`** (trim) | **0** |
| Translation phrase rows **`answerMode: runtime_translation`**, **`optionCount: runtime`** | **36** (unchanged behavior from **Phase 15**) |
| Question bank files under `data/english-questions/` | **Unmodified** (git diff should show no bank edits) |

---

## 5. Before / after — English `subtype` gap

| Metric | Before Phase 25 | After Phase 25 |
|--------|-----------------|----------------|
| English rows missing **`subtype`** | **621** | **0** |

---

## 6. Confirmations

| Area | Changed? |
|------|----------|
| English / Hebrew stems in banks | **No** |
| Answers, correct indices, scoring | **No** |
| Runtime learning logic (`pages/learning/*`, generators) | **No** |
| UI, Parent AI, Copilot, APIs | **No** |
| Question bank JSON/JS content | **No** |

---

## 7. Closure for this pass

**English audit `subtype` representation** can be treated as **closed** for the current product-quality pass: consumers of **`reports/question-audit/*`** no longer see **621** false “missing subtype” rows; **`subtype`** aligns with **pool identity** when the bank omitted the field, consistent with **Phase 24** analysis.

Optional later work (out of scope): mirror **`subtype`** into bank objects for parity with other subjects — **not** required for audit clarity after Phase 25.

---

## 8. דוח סיכום (Phase 25)

1. **קבצים ששונו:** [`scripts/audit-question-banks.mjs`](../scripts/audit-question-banks.mjs); יצירה מחדש של [`reports/question-audit/*`](../reports/question-audit/) (`items.json`, `items.csv`, `findings.json`, `stage2.json`, וכו׳); נוצר מסמך זה; עודכנו [`docs/product-quality-phase-24-english-subtype-metadata-review.md`](product-quality-phase-24-english-subtype-metadata-review.md), [`docs/product-quality-phase-8-subject-coverage-content-plan.md`](product-quality-phase-8-subject-coverage-content-plan.md), [`docs/product-quality-phase-1-audit.md`](product-quality-phase-1-audit.md).

2. **מה השתנה בייצוג האודיט:** עמודת **`subtype`** בשורות אנגלית (`english_pool_item`) מתמלאת מ-**`poolKey`** כשבבנק אין **`subtype`** — זהה ל-**`subtopic`** לאותה שורה.

3. **לפני / אחרי — חסרי subtype באנגלית:** **621** → **0**.

4. **תוכן אנגלית / עברית:** **לא** השתנה (לא נערכו קבצי בנק).

5. **תשובות / ציון / לוגיקת ריצה:** **לא** השתנו.

6. **פקודה:** `npx tsx scripts/audit-question-banks.mjs` — **הצליחה** (קוד יציאה **0**).

7. **סגירת נושא:** כן — למסגרת המעבר הנוכחית ניתן לסגור את פער ייצוג **`subtype`** באודיט האנגלי; לא נותרו שורות אנגלית עם **`subtype`** ריק מטעמה של ברירת המחדל החדשה.
