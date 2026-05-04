# Product Quality Phase 23 — Homeland / Geography Factual Freshness + Ambiguity Review

**Last updated:** 2026-05-05  
**Status:** Documentation / planning — **no question text, Hebrew wording, answers, correct indices, topic keys, UI, reports, Parent AI, Copilot, APIs, or learning logic was changed.**

**Sources:** [`reports/question-audit/items.json`](../reports/question-audit/items.json), [`reports/question-audit/findings.json`](../reports/question-audit/findings.json), [`docs/product-quality-phase-8-subject-coverage-content-plan.md`](product-quality-phase-8-subject-coverage-content-plan.md), [`data/geography-questions/g1.js`](../data/geography-questions/g1.js) … [`g6.js`](../data/geography-questions/g6.js).

---

## 1. Scope and methodology

### 1.1 Audit inventory (full bank)

| Dimension | Distribution |
|-----------|----------------|
| **Total rows** (`subject === geography`) | **3506** |
| **Grade** | G1 **617**, G2 **634**, G3 **617**, G4 **554**, G5 **541**, G6 **543** |
| **Difficulty** | easy **1318**, medium **1101**, hard **1087** |
| **Topic / subtopic / `geography_bank_topic`** | homeland **620**, geography **584**, maps **583**, citizenship **575**, values **573**, community **571** |
| **patternFamily** | `moledet_geography_bank` (**3506**) |
| **Answer mode** | `mcq` (**3506**) |
| **Option count** | **4** (all rows) |

### 1.2 Findings.json cross-reference

- **`topicsSpanManyGrades`:** each of `geography::{homeland,geography,maps,citizenship,values,community}` spans **6** grades — **expected** for parallel banks per grade file.
- **`patternFamilyWideGradeSpan`:** **no** geography keys listed (unlike science/hebrew wide-span families).
- **Exact / near duplicate cross-grade lists:** **empty** for geography (same as Phase 8 narrative).

### 1.3 Mechanical scans (non-destructive)

| Scan | Result |
|------|--------|
| **Duplicate `stemHash`** within geography rows | **725** distinct hashes appear **more than once** (often same stem reused across easy/medium/hard or adjacent grades — **template / spiral** pattern). Max multiplicity observed: **20** rows sharing one hash. |
| **Keywords** (illustrative civic / map themes in `data/geography-questions/*.js`) | Multiple occurrences of **כנסת**, **ראש הממשלה**, **קנה מידה**, **גבול במפה**, cardinal-direction map items (**צפון** / **דרום** / …). |

### 1.4 Stratified human-style sample

**24** items reviewed in depth: **6** topics × **4** ladders (**G1 easy**, **G3 medium**, **G5 medium**, **G6 hard**), always **index `#0`** within each topic pool (first item in exported pool order). Correct answers were taken from the **source bank objects** (audit rows do not embed options).

---

## 2. Review matrix — stratified sample (`#0` per topic × ladder)

**Legend — issue types:** OK · factual freshness · place/name/date · map/scale/legend · civic terminology · grade/difficulty · distractor · duplicate/near-duplicate · owner wording.

| poolKey (id) | File | Grade | Topic | Difficulty | Question summary (Hebrew) | Correct answer (text) | Issue type | Severity | Recommended action | Visible Hebrew change? | Owner approval? |
|--------------|------|-------|-------|------------|---------------------------|----------------------|------------|----------|-------------------|------------------------|-----------------|
| `G1_EASY_QUESTIONS:homeland#0` | `g1.js` | 1 | homeland | easy | מה היא ארץ ישראל? | הארץ שלנו | OK | low | keep | no | no |
| `G3_MEDIUM_QUESTIONS:homeland#0` | `g3.js` | 3 | homeland | medium | מה זה גאוגרפיה של ישראל? | המקומות, הנוף והאזורים בישראל | OK | low | keep | no | no |
| `G5_MEDIUM_QUESTIONS:homeland#0` | `g5.js` | 5 | homeland | medium | מה זה גאוגרפיה של ישראל? (זהה ל-G3 מבחינת ניסוח השאלה) | המקומות, הנוף והאקלים בישראל | duplicate/near-duplicate + factual consistency | medium | factual review needed (align definitions across grades) | maybe | yes |
| `G6_HARD_QUESTIONS:homeland#0` | `g6.js` | 6 | homeland | hard | מה זה אוכלוסייה מתקדמת? | אוכלוסייה מגוונת ומורכבת | grade/difficulty + distractor (vague “מתקדמת”) | medium | grade/difficulty review + distractor review | likely | yes |
| `G1_EASY_QUESTIONS:geography#0` | `g1.js` | 1 | geography | easy | מה זה מפה של הכיתה? | תרשים של הכיתה | OK | low | keep | no | no |
| `G3_MEDIUM_QUESTIONS:geography#0` | `g3.js` | 3 | geography | medium | מה הם יבשות? | אסיה, אירופה, אפריקה | OK | low | keep | no | no |
| `G5_MEDIUM_QUESTIONS:geography#0` | `g5.js` | 5 | geography | medium | מה הם משאבים? | מים, קרקע, אנרגיה | OK | low | keep | no | no |
| `G6_HARD_QUESTIONS:geography#0` | `g6.js` | 6 | geography | hard | מה זה סביבה מתקדמת? | סביבה מורכבת ומתקדמת | factual freshness + grade/difficulty (generic template) | medium | factual review needed | likely | yes |
| `G1_EASY_QUESTIONS:maps#0` | `g1.js` | 1 | maps | easy | מה זה מפה? | תרשים של מקום | OK | low | keep | no | no |
| `G3_MEDIUM_QUESTIONS:maps#0` | `g3.js` | 3 | maps | medium | מה זה מפות אזוריות? | מפות של אזורים | OK | low | keep | no | no |
| `G5_MEDIUM_QUESTIONS:maps#0` | `g5.js` | 5 | maps | medium | מה זה קואורדינטות מתקדמות? | קואורדינטות מפורטות | grade/difficulty (label “מתקדמות”) | medium | grade/difficulty review | likely | yes |
| `G6_HARD_QUESTIONS:maps#0` | `g6.js` | 6 | maps | hard | מה זה מפות מתקדמות? | מפות מורכבות ומתקדמות מאוד | factual freshness (vague) | medium | factual review needed | likely | yes |
| `G1_EASY_QUESTIONS:citizenship#0` | `g1.js` | 1 | citizenship | easy | מה זה כללי התנהגות? | חוקים איך להתנהג | OK | low | keep | no | no |
| `G3_MEDIUM_QUESTIONS:citizenship#0` | `g3.js` | 3 | citizenship | medium | מה הם עקרונות דמוקרטיים? | שוויון, חירות, בחירות | civic terminology | low | factual review needed (completeness of principles list) | maybe | yes |
| `G5_MEDIUM_QUESTIONS:citizenship#0` | `g5.js` | 5 | citizenship | medium | מה זה ממשל? | שלטון | civic terminology (underspecified) | medium | factual review needed | maybe | yes |
| `G6_HARD_QUESTIONS:citizenship#0` | `g6.js` | 6 | citizenship | hard | מה זה דמוקרטיה מתקדמת? | דמוקרטיה מורכבת ומתקדמת | civic terminology + vagueness | medium | owner exact wording required | yes | yes |
| `G1_EASY_QUESTIONS:values#0` | `g1.js` | 1 | values | easy | מה זה חג? | יום מיוחד | OK | low | keep | no | no |
| `G3_MEDIUM_QUESTIONS:values#0` | `g3.js` | 3 | values | medium | מה הם ערכים? | דברים חשובים | OK | low | keep | no | no |
| `G5_MEDIUM_QUESTIONS:values#0` | `g5.js` | 5 | values | medium | מה זה זהות אישית? | מי אני | OK | low | keep | no | no |
| `G6_HARD_QUESTIONS:values#0` | `g6.js` | 6 | values | hard | מה זה ערכים מתקדמים? | ערכים מורכבים ומתקדמים | grade/difficulty + vagueness | medium | owner exact wording required | likely | yes |
| `G1_EASY_QUESTIONS:community#0` | `g1.js` | 1 | community | easy | מה היא משפחה? | אבא, אמא, ילדים | OK | low | keep | no | no |
| `G3_MEDIUM_QUESTIONS:community#0` | `g3.js` | 3 | community | medium | מה זה מבנה חברתי? | המבנה של החברה | OK | low | keep | no | no |
| `G5_MEDIUM_QUESTIONS:community#0` | `g5.js` | 5 | community | medium | מה זה מניעת אסונות? | איך למנוע אסונות | OK | low | keep | no | no |
| `G6_HARD_QUESTIONS:community#0` | `g6.js` | 6 | community | hard | מה זה גאוגרפיה מתקדמת? | גאוגרפיה מורכבת ומתקדמת | duplicate/near-duplicate (phrase reused) + vagueness | medium | factual review + owner wording | likely | yes |

---

## 3. Supplementary thematic items (not full `#0` grid)

These illustrate **map convention** and **civic** sensitivity; pulled from corpus search + audit `poolKey` resolution.

| poolKey | Issue type | Severity | Notes |
|---------|------------|----------|-------|
| `G2_EASY_QUESTIONS:geography#8` (stem **איפה למעלה במפה?**) | map / legend — assumes **north-up** convention | low | Standard in schools; still worth **factual review** if mixed-orientation maps appear elsewhere in product. |
| Items containing **קנה מידה** (several grades/topics) | map scale without diagram in stem | medium | **Answer key review** should confirm distractors do not introduce incompatible scale logic. |
| Items defining **כנסת** / **חבר כנסת** vs distractors mentioning **ראש הממשלה** | civic terminology | medium | Answer keys look pedagogically consistent in spot checks; **civic terminology review** recommended before political-sensitive edits. |

---

## 4. Aggregated risk tally (from Sections 2–3 only)

| Classification | Approximate count |
|----------------|-------------------|
| **OK** | **12** / 24 stratified samples |
| **Factual freshness concern** | **6** (mostly “מתקדם/מורכב” template answers at upper grades) |
| **Map / civic ambiguity concern** | **5** (includes map-direction convention + קנה מידה theme + civic definitions in samples) |
| **Answer / correct index defect** | **0** identified in this review (**no** automated key validator run — human documentary pass only) |
| **Duplicate / near-duplicate concern** | **2** explicit rows in sample table + **725** mechanical duplicate-hash clusters (**severity mostly low** — likely intentional repetition) |
| **Critical** | **0** |
| **High** | **0** |
| **Medium** | **12** (combined across types in the sample set) |

---

## 5. Recommended first fix batch (after owner approval — not executed here)

1. **Template pass (“מתקדם / מורכב”)** on **G6 hard** (and adjacent buckets): replace vague correct-option templates with **specific, teachable definitions** — requires **owner Hebrew wording**.  
2. **Cross-grade alignment** for repeated stems (example: **homeland** `מה זה גאוגרפיה של ישראל?` at G3 vs G5): reconcile **answer wording** with geography curriculum.  
3. **Map literacy spot-check:** items pairing **כיווני רוח** with **מפה** + **קנה מידה** items — **distractor review** + optional **add more questions later** for real map excerpts.

---

## 6. Confirmations (Phase 23)

| Confirmation | Status |
|--------------|--------|
| Question text changed | **No** |
| Answers / correct indices changed | **No** |
| Code / runtime changed | **No** |

---

## 7. References

- Coverage plan (section 2.6): [`docs/product-quality-phase-8-subject-coverage-content-plan.md`](product-quality-phase-8-subject-coverage-content-plan.md)  
- Audit index: [`reports/question-audit/items.json`](../reports/question-audit/items.json)

---

## 8. דוח סיכום (Phase 23)

1. **קבצים:** נוצר [`docs/product-quality-phase-23-homeland-geography-factual-review.md`](product-quality-phase-23-homeland-geography-factual-review.md); עודכנו [`docs/product-quality-phase-8-subject-coverage-content-plan.md`](product-quality-phase-8-subject-coverage-content-plan.md) ו-[`docs/product-quality-phase-1-audit.md`](product-quality-phase-1-audit.md).
2. **כמה נסקרו:** **3506** שורות ביקורת גאוגרפיה בקטלוג; **24** דגימות מובנות (טבלה מלאה) + סריקות מכניות (**725** קבוצות stem כפולים + מפתחות נושא).
3. **נושאים:** homeland, geography, maps, citizenship, values, community — כיתות **G1–G6**, קושי easy/medium/hard.
4. **סיווג OK בדגימה המובנית:** **12** פריטים.
5. **חשש רעננות עובדתית / ניסוח תבנית:** **6** בדגימה המובנית.
6. **חשש מפה / אזרחות / מונחים:** **5** בסעיפים 2–3 (כולל כיוונים על מפה וקנה מידה).
7. **חשש למפתח תשובה / אינדקס נכון:** **0** בהערכה זו (בלי כלי אימות אוטומטי).
8. **קריטי / גבוה:** **אין** בהערכת המסמך.
9. **שינוי ניסוח שאלות:** **לא**.
10. **שינוי תשובות / תשובה נכונה:** **לא**.
11. **אצווה ראשונה מומלצת:** מעבר תבניות “מתקדם” בכיתות גבוהות + יישור הגדרות חוזרות בין כיתות + ביקורת מפה/קנה מידה — כולו **אחרי אישור בעלים**.
