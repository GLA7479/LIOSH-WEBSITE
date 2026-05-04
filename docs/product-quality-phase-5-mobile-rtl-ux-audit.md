# Product Quality Phase 5 — Mobile + RTL + Basic UX Audit

**Last updated:** 2026-05-04 (Phase 6: **P5-01 / P5-02 / P5-03** implemented — see [§7](#7-phase-6-implementation-status-2026-05-04))  
**Status (original pass):** Static audit; **Phase 6** then applied **targeted code fixes** for P5-01–P5-03 only.  
**Method:** **Static review** of key pages/components + alignment with [`docs/mobile-rtl-manual-qa-checklist.md`](mobile-rtl-manual-qa-checklist.md) and context from [Phase 1](product-quality-phase-1-audit.md) / [Phase 4](product-quality-phase-4-parent-report-review.md). **No on-device run** was performed in Phase 5; **P5-04–P5-10** remain **pending real device QA**.

**Out of scope (per product rules):** security, coins, question banks, Hebrew rewrites, Parent AI / report logic changes, broad refactors, overnight QA.

---

## 1. Surfaces in scope (checklist mapping)

| Surface | Primary route(s) / component | Checklist section |
|---------|------------------------------|-------------------|
| Parent login | `/parent/login` | § Parent login |
| Parent dashboard | `/parent/dashboard` | § Parent dashboard |
| Student login | `/student/login` | § Student login |
| Student dashboard / home | `/student/home` (and related) | § Student dashboard |
| Practice + question + results | `/learning/*-master` flows | § Practice / Question answering / Results |
| Short parent report | `/learning/parent-report` | § Short report |
| Detailed parent report | `/learning/parent-report-detailed` | § Detailed report |
| PDF / print | Print triggers, mode toggles on detailed | § PDF buttons |
| Parent Copilot | Shell on report pages when enabled | § Parent Copilot |
| Modals / long text / tables / charts | Learning modals; report Recharts / tables | § UI Components |

---

## 2. Global findings (codebase-level)

| Topic | Observation | Suggested follow-up |
|-------|-------------|---------------------|
| **Viewport** | **Updated (Phase 6):** [`pages/_app.js`](../pages/_app.js) now uses `width=device-width, initial-scale=1` only — **pinch-zoom allowed**. | Owner UAT on smallest device after behavior change. |
| **RTL root** | **Updated (Phase 6):** [`components/Layout.js`](../components/Layout.js) sets `dir="rtl"` for `/parent/*`, `/student/login`, `/student/home*`, and `/learning` (hub). Learning masters still set their own `dir="rtl"`. **Loading states** for short/detailed parent report: `dir="rtl"` on spinners. | **Still** run manual RTL pass for **P5-04+** and edge routes (e.g. `/learning/curriculum`). |
| **Mobile shell** | [`styles/globals.css`](../styles/globals.css) defines `game-page-mobile`, `learning-master-fill`, `h-dvh` patterns to reduce iOS viewport/jank — mitigates scroll traps. | Confirm with checklist § Scrolling + § Landscape/portrait. |
| **Numeric placeholders** | Phase 1 / checklist already flag **`undefined` / `null` / `NaN` / `00000`** as hard-fail — applies to all surfaces. | Execute checklist **Hard-Fail** row during owner QA. |

---

## 3. Issue register (recommendations — no implementation in Phase 5)

| ID | Page / surface | Viewport (if known) | Issue summary | Severity | User impact | Suggested fix | Owner approval? | Timing |
|----|----------------|---------------------|---------------|----------|-------------|---------------|-----------------|--------|
| P5-01 | `/parent/login`, `/student/login`, Layout-backed Hebrew pages | 360–430 wide | ~~No explicit `dir="rtl"` on Layout~~ **→ Fixed (Phase 6)** via `dir="rtl"` on [`Layout.js`](../components/Layout.js) for Hebrew-primary routes; report loading shells updated. | **Medium** *(was)* | — | **Device QA** still recommended for alignment edge cases. | — | **Verify on device** |
| P5-02 | App-wide (`_app` Head) | All | ~~`user-scalable=no`~~ **→ Fixed (Phase 6):** zoom no longer blocked in viewport meta. | **Medium** *(was)* | — | Confirm no layout regressions when users zoom. | — | **Verify on device** |
| P5-03 | `/parent/login` | All | ~~English error prefixes~~ **→ Fixed (Phase 6):** Hebrew messages for client-not-ready, sign-up failure/success, login failure (**Supabase `error.message` may still be English**). | **Medium** *(was)* | — | Optional later: map common Supabase messages to Hebrew. | — | **Polish later** *(optional)* |
| P5-04 | Learning masters (`math-master`, etc.) | Portrait + landscape | Heavy **fixed / stacked** UI (`h-dvh`, modals, `z-[200]` overlays). Risk of **keyboard covering inputs** or **CTA hidden** on small phones if not fully covered by `useIOSViewportFix`. | **Medium** | Missed submits, frustration | Device pass per [`mobile-rtl-manual-qa-checklist.md`](mobile-rtl-manual-qa-checklist.md) § Modals / Scrolling | No for audit | owner review first |
| P5-05 | Short / detailed parent report | &lt; 390 wide | **Charts** (Recharts) + dense cards — labels may **overlap** or require horizontal scroll (see Phase 4 **P4-05**). | **Medium** | Hard to read trends on phone | Chart simplification / summary mode on narrow viewports — **layout** (later) | Yes | polish later |
| P5-06 | Detailed report print / PDF | Print | **Two display modes** (full vs תקציר) — risk of **missing** sections or tiny type in PDF output if not regression-tested. | **Medium** | Wrong artifact handed to teacher/school | Visual QA on exported PDFs (`qa-visual-output`, persona PDFs) | Yes | before launch *(artifact QA)* |
| P5-07 | Layout header mobile menu | Small phone | **Hamburger** control (`☰`) — verify **tap target ≥ ~44px** and menu scroll on long nav. | **Low** | Occasional mis-taps | Increase hit area / padding — layout polish | No | polish later |
| P5-08 | Student PIN field | Mobile | `inputMode="numeric"` present — good; confirm **PIN keypad** doesn’t conflict with RTL labels. | **Low** | Minor IME quirks | Keep checklist § Student login tests | No | owner review first |
| P5-09 | Parent Copilot panel | Mobile keyboard open | Chat **input + suggestions** may crowd viewport; risk per checklist § Parent Copilot. | **Medium** | Hard to read answers / tap chips | Sticky input patterns / reduce chrome on small screens — **layout** later | Yes | polish later |
| P5-10 | Tables in parent report | Narrow width | Wide **tabular** data may force **horizontal scroll** — acceptable if intentional; bad if accidental clipping. | **Low** | Horizontal panning fatigue | Sticky first column or card fallback — **layout** later | Yes | polish later |

---

## 4. Alignment with existing checklist

Use [`docs/mobile-rtl-manual-qa-checklist.md`](mobile-rtl-manual-qa-checklist.md) as the **authoritative execution list**. Phase 5 **does not replace** that checklist — it adds **risk-ranked** candidates from static review.

**Hard-fail gates** (from checklist): clipped primary CTA, broken RTL on critical flows, placeholder leaks, inaccessible login/report/copilot on mobile — **must be explicitly checked on hardware**.

---

## 5. Phase boundary (as of Phase 5 write-up)

| Item | Result |
|------|--------|
| Product code / CSS changed? | **No** *(Phase 5 only)* |
| Hebrew copy changed? | **No** *(Phase 5 only)* |

**Recommended next step:** Owner runs **one device matrix** (at minimum: **360×640 portrait**, **390×844 portrait**, **768×1024**) across flows in §1, logs failures with screenshot + route per checklist **Execution Notes**. After Phase 6, prioritize confirmation of **P5-01–P5-03** fixes + remaining **P5-04–P5-10**.

---

## 7. Phase 6 implementation status (2026-05-04)

| ID | Status | Notes |
|----|--------|------|
| **P5-01** | **Addressed in code** | [`components/Layout.js`](../components/Layout.js): `dir="rtl"` when pathname is under `/parent`, `/student/login`, `/student/home`, or equals `/learning`. [`pages/learning/parent-report.js`](../pages/learning/parent-report.js) + [`parent-report-detailed.js`](../pages/learning/parent-report-detailed.js): loading wrappers `dir="rtl"`. |
| **P5-02** | **Addressed in code** | [`pages/_app.js`](../pages/_app.js): viewport `width=device-width, initial-scale=1` (removed `maximum-scale` / `user-scalable=no`). |
| **P5-03** | **Addressed in code** | [`pages/parent/login.js`](../pages/parent/login.js): Hebrew strings for client-not-ready, sign-up error/success, login error prefix. |
| **P5-04 – P5-10** | **Pending manual device QA** | No code changes in Phase 6 — follow [`mobile-rtl-manual-qa-checklist.md`](mobile-rtl-manual-qa-checklist.md). |

**Build:** `npm run build` passed after changes (see [`product-quality-phase-6-focused-ux-fixes.md`](product-quality-phase-6-focused-ux-fixes.md)).

---

## 8. Reference — Phase 4 overlap

Mobile/PDF risks called out in [`docs/product-quality-phase-4-parent-report-review.md`](product-quality-phase-4-parent-report-review.md) (**P4-01** cognitive load, **P4-05** PDF/visual QA) **carry forward** here as parent-report mobile items (**P5-05**, **P5-06**).
