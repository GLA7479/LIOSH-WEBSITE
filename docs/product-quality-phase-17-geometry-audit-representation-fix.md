# Product Quality Phase 17 — Geometry Audit Representation Fix

**Last updated:** 2026-05-05  
**Status:** Complete — **audit script + regenerated `reports/question-audit/*` + documentation only**. No changes to question text, Hebrew wording, answers, `correctIndex`, grade ranges, topic keys, [`utils/geometry-question-generator.js`](../utils/geometry-question-generator.js) runtime behavior, [`utils/geometry-conceptual-bank.js`](../utils/geometry-conceptual-bank.js) content, UI, parent product reports, Parent AI, Copilot, APIs, or learning logic.

## Context (Phase 16)

Phase 16 found **1313** `geometry_generator_sample` rows with empty **`subtype`** even though **`subtopic`** already held the generator **`kind`**. That was a **reporting** gap, not missing identification of the question type.

## Code change

In [`scripts/audit-question-banks.mjs`](../scripts/audit-question-banks.mjs), function **`sampleGeometryGenerator`**, the audit row now sets:

```text
subtype: q.params?.subtype || kind || ""
```

where **`kind`** is `q.params?.kind` (same value as **`subtopic`**). **`params.subtype`** from the generator (e.g. conceptual bank rows, or `mid_band` / `late_band` on some branches) still **takes precedence** when present.

## Verification

| Check | Result |
|-------|--------|
| Command | `npx tsx scripts/audit-question-banks.mjs` |
| Exit code | **0** |
| Total audit rows | **12158** |
| Geometry rows | **2548** (unchanged) |
| Geometry rows with **empty** `subtype` | **0** (was **1313** on generator samples before Phase 17) |
| `geometry_conceptual` (**100** rows) | Unchanged source path in audit; still populated from static bank |
| Generator samples (**2448** rows) | **`subtype`** now mirrors **`kind`** when not set in `params` |
| Question content / answers | **Unchanged** |

## Relationship to Phase 16

[`docs/product-quality-phase-16-geometry-metadata-formula-risk-review.md`](product-quality-phase-16-geometry-metadata-formula-risk-review.md) document **Phase 16** inventory tables as **historical**; current audit JSON reflects **Phase 17** fill-in. Formula/diagram risk findings in Phase 16 are **unchanged** by this pass.

## Closing this pass

The **“missing subtype”** signal for **generated** geometry audit rows is **cleared** for dashboard/review purposes. This does **not** replace optional future work to add **`subtype`** at the **generator** `params` level (Phase 16 option **B**); it **only** aligns the **audit** export with the already-known **`kind`**.
