# Product Quality Phase 5 — Mobile + RTL + Basic UX Audit

**Last updated:** 2026-05-04  
**Status:** **Audit and recommendations only** — no product code, CSS, layout, or Hebrew copy was changed.  
**Method:** **Static review** of key pages/components + alignment with [`docs/mobile-rtl-manual-qa-checklist.md`](mobile-rtl-manual-qa-checklist.md) and context from [Phase 1](product-quality-phase-1-audit.md) / [Phase 4](product-quality-phase-4-parent-report-review.md). **No on-device run** was performed in this pass; treat open items as **UAT to confirm**.

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
| **Viewport** | [`pages/_app.js`](../pages/_app.js) sets `maximum-scale=1, user-scalable=no` — helps layout stability but **disables pinch-zoom** (readability / a11y tradeoff). | Owner UAT on smallest target device; consider relaxing after launch if users request zoom. |
| **RTL root** | Learning masters (e.g. [`pages/learning/math-master.js`](../pages/learning/math-master.js)) set `dir="rtl"` on the main shell. **Layout-wrapped** pages (login, marketing) do **not** always set `dir="rtl"` on the content wrapper — Hebrew UI may inherit **LTR** document direction from browser default. | **Manual verify** parent/student login and dashboard in RTL on a real phone. |
| **Mobile shell** | [`styles/globals.css`](../styles/globals.css) defines `game-page-mobile`, `learning-master-fill`, `h-dvh` patterns to reduce iOS viewport/jank — mitigates scroll traps. | Confirm with checklist § Scrolling + § Landscape/portrait. |
| **Numeric placeholders** | Phase 1 / checklist already flag **`undefined` / `null` / `NaN` / `00000`** as hard-fail — applies to all surfaces. | Execute checklist **Hard-Fail** row during owner QA. |

---

## 3. Issue register (recommendations — no implementation in Phase 5)

| ID | Page / surface | Viewport (if known) | Issue summary | Severity | User impact | Suggested fix | Owner approval? | Timing |
|----|----------------|---------------------|---------------|----------|-------------|---------------|-----------------|--------|
| P5-01 | `/parent/login`, `/student/login`, Layout-backed Hebrew pages | 360–430 wide | **No explicit `dir="rtl"`** on main content wrapper (e.g. parent login uses [`Layout`](../components/Layout.js) + `max-w-md` column only). Mixed **Hebrew UI + default LTR** may affect punctuation, icon alignment, and focus order. | **Medium** | Awkward reading flow; possible **misaligned** controls | Add **`dir="rtl"`** at page root or Layout variant for Hebrew routes — **after** owner sign-off | Yes | before launch *(if UAT confirms)* |
| P5-02 | App-wide (`_app` Head) | All | **`user-scalable=no`** — users cannot pinch-zoom small text. | **Medium** | Low vision / long paragraphs harder to read | Revisit viewport meta policy (accessibility) — **CSS/copy scope later** | Yes | polish later *(or owner review first)* |
| P5-03 | `/parent/login` | All | Error path surfaces **English** strings (`Login failed: …`, `Sign up failed: …`, `Client not ready`) alongside Hebrew chrome. | **Medium** | Confusing / **non-localized** failure UX | Localize parent-visible errors to Hebrew — **copy** (requires approval) | Yes | before launch *(i18n consistency)* |
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

## 5. Phase boundary

| Item | Result |
|------|--------|
| Product code / CSS changed? | **No** |
| Hebrew copy changed? | **No** |

**Recommended next step:** Owner runs **one device matrix** (at minimum: **360×640 portrait**, **390×844 portrait**, **768×1024**) across flows in §1, logs failures with screenshot + route per checklist **Execution Notes**, then prioritizes **P5-01–P5-06** if confirmed.

---

## 6. Reference — Phase 4 overlap

Mobile/PDF risks called out in [`docs/product-quality-phase-4-parent-report-review.md`](product-quality-phase-4-parent-report-review.md) (**P4-01** cognitive load, **P4-05** PDF/visual QA) **carry forward** here as parent-report mobile items (**P5-05**, **P5-06**).
