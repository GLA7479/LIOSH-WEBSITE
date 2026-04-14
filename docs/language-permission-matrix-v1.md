# Language Permission Matrix v1

Binds **evidence band** (see `evidence-band-dictionary-v1.md`) to **allowed parent-facing Hebrew**.  
Goal: eliminate certainty drift, gate/text mismatch, and readiness inflation in copy.

---

## 1. Phrasing strength classes (PS0–PS3)

| Class | Description |
|-------|-------------|
| **PS0** | Pure observation: אין מספיק נתון / נאסוף עוד / מפגש קצר לתצפית |
| **PS1** | Early signal: אולי / נראה מוקדם / עדיין לא ברור / אינדיקציה ראשונית |
| **PS2** | Cautious directional: נראה שכדאי / ייתכן / במגמה זהירה / מומלץ בזהירות |
| **PS3** | Strong directional (topic only, gated): מומלץ בבירור / כדאי לפעול בכיוון — **never** “סגור” without E4 + gates |

---

## 2. Allowed matrix (by evidence band)

| Band | Headline / summary | Diagnosis / root cause | Recommendation | Risk / caution |
|------|---------------------|------------------------|----------------|----------------|
| **E0** | PS0 only | PS0 (or omit) | PS0 | PS0 |
| **E1** | PS0–PS1 | PS1 only | PS0–PS1 | PS1 |
| **E2** | PS1–PS2 | PS1–PS2 | PS1–PS2 | PS2 |
| **E3** | PS2 | PS2 | PS2 | PS2 |
| **E4** | PS2–PS3 | PS2–PS3 | PS2–PS3 | PS2 |

**Subject / overall:** cap at **PS2** unless `execution-readiness-bundle` marks an explicit E4 overall exception.

---

## 3. Forbidden phrases / patterns (by band)

Apply **all** rows for bands **≤** current (stricter wins).

| Pattern / keyword family | E0 | E1 | E2 | E3 | E4 |
|--------------------------|----|----|----|----|-----|
| “בטוח ש…”, “ודאי”, “מוכח” | ✗ | ✗ | ✗ | ✗ | ○ only if E4 + gate OK |
| “יציב לחלוטין”, “סגורנו”, “אין ספק” | ✗ | ✗ | ✗ | ✗ | ○ rare |
| “הבעיה היא …” (absolute root cause) | ✗ | ✗ | ○ cautious | ○ | ○ |
| “מאסטרי / שליטה מלאה” (without independence check) | ✗ | ✗ | ✗ | ○ if no hint risk | ○ |
| “קפיצת רמה / העלאת כיתה” as imperative | ✗ | ✗ | ✗ | ○ only if step allowed & not suppressed | ○ |
| Raw enums / internal IDs (`P1`, `insufficient_data`, English slugs) | ✗ | ✗ | ✗ | ✗ | ✗ |

---

## 4. Mandatory markers

| Band | Marker (example intent — final Hebrew in product copy) |
|------|-----------------------------------------------------------|
| E0–E1 | Must include “עדיין מוקדם” / “נתון חלקי” / “לא ננעל על מסקנה” (pick one per UX) |
| E2 | Must include conditional (“אם זה יחזור בשבועיים הקרובים…”) OR short-cycle follow-up |
| E3–E4 | Must still mention how to disconfirm (one line) unless gate says release track |

---

## 5. DEv2 confidence → max phrasing

| DEv2 `confidence.level` | Max PS |
|---------------------------|--------|
| `insufficient_data` | PS0 |
| `early_signal_only` | PS1 |
| `low` | PS1 |
| `moderate` | PS2 |
| `high` | PS3 (row only; subject/overall still capped by aggregation policy) |
| `contradictory` | PS0–PS1 |

---

## 6. Sign-off

- [ ] Forbidden list accepted  
- [ ] PS caps per band accepted  
- [ ] **Approved by:** _________________ **Date:** _________________
