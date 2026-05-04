# Product Quality Phase 15 — English Translation Audit Representation Fix

**Last updated:** 2026-05-05  
**Status:** Complete — **audit script + regenerated `reports/question-audit/*` + docs only**. No changes to `translation-pools.js`, English/Hebrew strings, answers, scoring, runtime, UI, parent product reports, Parent AI, or Copilot.

## Goal

After **Phase 14**, translation **phrase** rows (no static `options` in the bank) were still emitted with **empty** `optionCount` and default **`answerMode: mcq`**, which read like a broken or zero-option MCQ. **Phase 15** fixes **audit representation only** so readers are not misled.

## Code change

In [`scripts/audit-question-banks.mjs`](../scripts/audit-question-banks.mjs), `collectEnglishPool` now uses `englishPoolAuditAnswerFields(category, item, opts)`:

| Bank shape | `optionCount` | `answerMode` |
|------------|---------------|--------------|
| Translation **phrase** row (no `options` / `answers` array) | `"runtime"` | `runtime_translation` |
| Translation row **with** static options (e.g. **`simulator_translation_mcq`**) | numeric count (e.g. **4**) | `mcq` (or item’s `answerMode` if set) |
| Non-translation English pools | unchanged | unchanged |

Runtime behavior in [`pages/learning/english-master.js`](../pages/learning/english-master.js) was **not** modified.

## Verification (post–audit run)

| Check | Result |
|-------|--------|
| Command | `npx tsx scripts/audit-question-banks.mjs` |
| Exit code | **0** |
| Total rows in [`reports/question-audit/items.json`](../reports/question-audit/items.json) | **12158** (unchanged) |
| English · topic `translation` · `answerMode` **`runtime_translation`** | **36** (phrase pools) |
| English · topic `translation` · static MCQ (`optionCount` **4**) | **5** (`simulator_translation_mcq`) |
| Question bank content | **Unchanged** |
| Answers / scoring / runtime | **Unchanged** |

## Relationship to Phase 14

[`docs/product-quality-phase-14-english-translation-model-review.md`](product-quality-phase-14-english-translation-model-review.md) documents **why** phrase rows had no static options. Phase 15 **implements** the recommended audit-field clarity (without changing any learner-facing content).

## Closing this pass

English **translation content** was not edited in Phase 15. **Audit representation** for translation phrase rows is now explicit; this product-quality **pass** on English translation audit clarity can be **closed** unless new translation bank work or a new audit schema is requested.
