# Product Quality Phase 4 — Parent Report (Product Review)

**Last updated:** 2026-05-04  
**Status:** **Review and recommendations only** — no product code, report logic, Parent AI logic, or Hebrew copy was changed in this phase.  
**Scope:** Parent-facing report experience (clarity, length, tone, actionability, safety, weak-data handling, print/PDF) — **not** security, coins, or question banks.  
**Does not block:** Phase 3 (Hebrew bank owner map) or owner-run manual E2E (Phase 2B).

**Sources used (read-only):**  
- [`components/ParentReportImportantDisclaimer.js`](../components/ParentReportImportantDisclaimer.js)  
- [`components/ParentReportInsight.jsx`](../components/ParentReportInsight.jsx)  
- [`components/parent-report-short-contract-preview.jsx`](../components/parent-report-short-contract-preview.jsx)  
- [`components/parent-report-contract-ui-blocks.jsx`](../components/parent-report-contract-ui-blocks.jsx)  
- [`pages/learning/parent-report.js`](../pages/learning/parent-report.js) (diagnostics modes, insufficient data, print)  
- [`pages/learning/parent-report-detailed.js`](../pages/learning/parent-report-detailed.js) + [`components/parent-report-detailed-surface.jsx`](../components/parent-report-detailed-surface.jsx)  
- [`utils/parent-data-presence.js`](../utils/parent-data-presence.js), [`utils/parent-report-ui-explain-he.js`](../utils/parent-report-ui-explain-he.js) (tone / weak-data lines)  
- [`docs/PARENT_REPORT_TEXT_SOURCE_MAP.md`](../docs/PARENT_REPORT_TEXT_SOURCE_MAP.md), [`docs/PARENT_REPORT_EDITORIAL_SIGNOFF.md`](../docs/PARENT_REPORT_EDITORIAL_SIGNOFF.md)  
- [`docs/product-quality-phase-1-audit.md`](product-quality-phase-1-audit.md) §6  
- **Sample / overnight artifacts (available locally for visual review, not opened in this pass):** e.g. `reports/parent-report-persona-corpus/`, `reports/overnight-parent-ai-audit/*/sample-pdfs/`, `qa-visual-output/*.pdf`

---

## 1. Executive read — by surface

| Surface | Primary locations | Clarity (parent lens) | Length | Technical risk | Actionable? | Overclaim / scary? | Weak data OK? | Next steps clear? | Dev terms risk? | PDF/print |
|--------|-------------------|----------------------|--------|----------------|-------------|-------------------|--------------|------------------|-----------------|-----------|
| **Disclaimer** | `ParentReportImportantDisclaimer.js` | **Strong** — states tool vs professional judgment | Short | Low | N/A (legal/educational framing) | **Mitigated** — explicit non-diagnosis | N/A | Points to professional when needed | Low | Renders in print flow if included in page |
| **Short “contract” summary** | `parent-report-short-contract-preview.jsx` | **Good** — status / priority / do now in one block | Short | Low | **Yes** if `top.*He` populated | Depends on upstream copy | N/A | **Yes** when fields present | Low | `avoid-break` class supports print |
| **Short report (full page)** | `parent-report.js` | **Good–mixed** — many sections (cards, diagnostics, topic strips) | **Can feel long** on small screens | **Medium** — engine labels if any slip past normalization | **Mixed** — depends on data volume | Restraint + disclaimer help | **Yes** — `insufficient` mode + `insufficientDataSubjectsHe` + presence explainers | **Partial** — multiple CTAs and period selector | **Medium** — mitigated by `parent-report-language` + tests (see signoff doc) | Print styles present; owner should eyeball |
| **Diagnostics / recommendations block** | `parent-report.js` + `buildParentReportDiagnosticsView` | **Mixed** — `new` / `insufficient` / `legacy` modes | Variable | **Medium** — parent may not know what “legacy” means internally | **Yes** when rows exist | Wording generally cautious in templates | **Yes** — dedicated copy for “no stable picture yet” | Encourages more practice | Avoid surfacing engine keys in UI (per style guide) | Check print of empty vs full states |
| **Parent AI “תובנה להורה”** | `ParentReportInsight.jsx` + enrichment pipeline | **Clear when shown** | Short | Low if text normalized | **Yes** if `explanation.ok` | Guardrails in narrative safety stack (separate doc) | N/A | Complements, not replaces, report | **Low** in component (title fixed) | Appears in print if in DOM |
| **Detailed report** | `parent-report-detailed.js` + `parent-report-detailed-surface.jsx` | **Rich but dense** | **Often long** | **Medium–high** — many sections (executive, cross-subject, profiles, letters) | **Yes** for structured blocks | Same restraint stack as V2 | Fallback copy when sparse (`v2-parent-copy` patterns) | Home plan / goals when present | Tier/source labels need parent-facing gloss | **Two modes:** full vs **תקציר להדפסה** — owner must validate PDF parity |
| **What to do / what not to do** | `parent-report-contract-ui-blocks.jsx` (`doNowHe`, `avoidNowHe`); Copilot panel uses similar framing | **Strong conceptually** | Short per row | Low | **High value** when populated | “מה לא לעשות כרגע” reduces panic tactics | N/A | Direct | **Low** | Contract blocks use `avoid-break` |

---

## 2. Issues & suggestions (decision map — no code edits here)

| ID | Location | Current behavior / text summary | Issue | Severity | Suggested improvement | Owner approval? | Change type | Timing |
|----|----------|----------------------------------|-------|----------|----------------------|-----------------|-------------|--------|
| P4-01 | Short report overall (`parent-report.js`) | Many sections (summary, subject cards, diagnostics, strips, optional AI) | Risk of **cognitive overload** on mobile / busy parents | **Medium** | Progressive disclosure or a clearer **single “start here”** band above the fold — **copy/layout suggestion only** | Yes | layout suggestion | polish later |
| P4-02 | Diagnostics modes (`new` / `insufficient` / `legacy`) | Different recommendation sources; parent sees one of several states | Parent may **not understand why** recommendations differ between visits | **Medium** | One neutral sentence explaining “מקור ההמלצות” when mode ≠ `new` — **copy suggestion only** | Yes | copy suggestion only | fix before launch *(if confusion observed in UAT)* |
| P4-03 | `insufficientDataSubjectsHe` + partial-data banner | Lists subjects with thin data in prose | Generally aligned with “early signal” framing per editorial doc | Low | Keep monitoring for wording that sounds like **system error** vs **early** — spot fixes | Yes | copy suggestion only | owner review first |
| P4-04 | Detailed report length (`parent-report-detailed-surface.jsx` + payload) | Executive summary + profiles + letters | **Long read**; risk of skimming past priorities | **Medium** | Emphasize **תקציר להדפסה** as default export for busy parents — **product guidance**, not code | Yes | layout suggestion | polish later |
| P4-05 | Print / PDF (`displayMode` full vs summary; `#parent-report-detailed-print`) | Two modes + site-rendered PDFs in `reports/**` | Risk of **missing sections** or tiny type in summary PDF vs expectation | **Medium** | Visual QA on **`qa-visual-output/`** and one overnight **`sample-pdfs`** pack — checklist only | Yes | PDF/print concern | fix before launch *(visual QA)* |
| P4-06 | `ParentReportInsight` | Hidden entirely when `!explanation.ok` | Parent **might not notice** AI was skipped (silent absence) | Low | Optional footnote when AI disabled/unavailable — **copy/layout suggestion** | Yes | copy suggestion only | polish later |
| P4-07 | Technical vocabulary | `parent-report-ui-explain-he.js`, glossary paths | Strong avoidance lists + tests exist (`test:parent-report-hebrew-language`) | Low ongoing | Continue **editorial signoff** gate before launch | Yes | owner decision | owner review first |
| P4-08 | Parent Copilot (`parent-copilot-panel.jsx` — “מה לא לעשות עכשיו?”) | Related **chat** surface, not the static report | Voice could diverge from report contract if prompts drift | **Medium** | Align editorial checklist across **report + Copilot** — process, not code in Phase 4 | Yes | owner decision | owner review first |
| P4-09 | Disclaimer | Strong non-diagnosis language | **Low risk** of overclaim — already explicit | Low | Maintain **single source** if ever edited (`ParentReportImportantDisclaimer`) | Yes | copy suggestion only | fix before launch *(if legal/education advisor requests tweak)* |

---

## 3. Positive findings (keep)

- **Disclaimer** clearly separates practice analytics from professional judgment and suggests consulting educators when needed — appropriate for parent anxiety and liability framing.  
- **Contract preview** (“מצב”, “מה חשוב קודם”, “מה עושים עכשיו”) matches how parents ask “what now?” — keep as anchor pattern.  
- **Avoid-now** rows (`avoidNowHe`) directly reduce harmful-intervention tone — good product behavior.  
- **Weak-data / insufficient** pathways are **first-class** (`deriveParentDataPresenceForDiagnosticsView`, insufficient subject lines) rather than empty charts — aligns with [`PARENT_REPORT_EDITORIAL_SIGNOFF.md`](../docs/PARENT_REPORT_EDITORIAL_SIGNOFF.md) §manual item 4.  
- **Artifact trail:** persona corpus PDFs + overnight `sample-pdfs` give **repeatable visual regression** material without code changes.

---

## 4. Recommended owner actions (no implementation in Phase 4)

1. Run **manual parent persona walkthrough** using existing PDFs under `reports/parent-report-persona-corpus/site-rendered/pdf/` (thin data, strong, mixed).  
2. Complete **[`docs/PARENT_REPORT_EDITORIAL_SIGNOFF.md`](../docs/PARENT_REPORT_EDITORIAL_SIGNOFF.md)** checklist when ready for launch (tests + human pass).  
3. Track **P4-02 / P4-05** as launch-critical **only if** UAT shows confusion or PDF defects — otherwise schedule as polish.

---

## 5. Phase boundary

| Item | Outcome |
|------|---------|
| Product code changed? | **No** |
| Hebrew copy in repo changed? | **No** |
| Report / AI logic changed? | **No** |

**Next engineering phase (separate approval):** address approved rows in §2 via targeted copy or layout PRs; re-run `npm run test:parent-report-hebrew-language` and visual PDF snapshot gates.
