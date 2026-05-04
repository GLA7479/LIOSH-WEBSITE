# Product Quality Phase 6 — Focused Mobile / RTL UX Fixes

**Last updated:** 2026-05-04  
**Scope:** Implement **only** Phase 5 items **P5-01**, **P5-02**, **P5-03** — minimal-risk, **no** redesign, **no** changes to Parent AI, report recommendation logic, question banks, or broader CSS refactors.

---

## 1. Goals satisfied

| ID | Goal | Implementation summary |
|----|------|-------------------------|
| **P5-01** | Consistent RTL on Hebrew-primary flows | [`components/Layout.js`](../components/Layout.js): `dir="rtl"` when `pathname` matches `/parent/*`, `/student/login`, `/student/home*`, or `/learning` (hub only). Learning `*-master` pages unchanged (already RTL). [`pages/learning/parent-report.js`](../pages/learning/parent-report.js) + [`pages/learning/parent-report-detailed.js`](../pages/learning/parent-report-detailed.js): **loading** shells now include `dir="rtl"` (main report views already had RTL). |
| **P5-02** | Allow browser zoom | [`pages/_app.js`](../pages/_app.js): viewport meta set to `width=device-width, initial-scale=1` — removed `maximum-scale=1` and `user-scalable=no`. |
| **P5-03** | Hebrew parent-login errors | [`pages/parent/login.js`](../pages/parent/login.js): client-not-ready, sign-up success/error prefixes, login error prefix in Hebrew. **`error.message` from Supabase** may still appear in English when the API returns English — optional future mapping. |

---

## 2. Files touched

| File | Change |
|------|--------|
| [`components/Layout.js`](../components/Layout.js) | `layoutRtlHebrew` + `dir` on root wrapper |
| [`pages/_app.js`](../pages/_app.js) | Viewport meta |
| [`pages/parent/login.js`](../pages/parent/login.js) | Hebrew user-visible strings (auth flow) |
| [`pages/learning/parent-report.js`](../pages/learning/parent-report.js) | `dir="rtl"` on loading container |
| [`pages/learning/parent-report-detailed.js`](../pages/learning/parent-report-detailed.js) | `dir="rtl"` on loading container |
| [`docs/product-quality-phase-5-mobile-rtl-ux-audit.md`](product-quality-phase-5-mobile-rtl-ux-audit.md) | Status for P5-01–P5-10 |
| [`docs/product-quality-phase-1-audit.md`](product-quality-phase-1-audit.md) | Phase 6 pointer |

---

## 3. Explicitly not changed (Phase 6)

- **P5-04 – P5-10** — keyboard/modals, charts, Copilot layout, tables, hamburger tap targets, PDF regression — **manual QA only** ([`docs/mobile-rtl-manual-qa-checklist.md`](mobile-rtl-manual-qa-checklist.md)).
- **Security, coins, production lockdown, Parent AI logic, report generators.**

---

## 4. Verification

| Check | Result |
|-------|--------|
| `npm run build` | **Passed** (warnings unrelated — dynamic import in planner adapter) |
| Dedicated automated test for parent login / RTL | **None found** in repo scripts reviewed; rely on **manual checklist** + smoke on staging |

---

## 5. Recommended next steps

1. Owner: run **`docs/mobile-rtl-manual-qa-checklist.md`** on **360×640**, **390×844**, **tablet** — confirm RTL + zoom + Hebrew errors **feel** correct.  
2. Optional polish: Hebrew mapping for frequent Supabase **`error.message`** strings on parent login.  
3. Track **P5-04–P5-10** to closure per device evidence.
