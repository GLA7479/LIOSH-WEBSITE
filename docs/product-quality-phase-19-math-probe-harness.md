# Product Quality Phase 19 — Math Probe Harness Implementation

**Last updated:** 2026-05-05  
**Status:** Implemented — **standalone harness script + reports only**. No edits to [`utils/math-question-generator.js`](../utils/math-question-generator.js), question stems, answers, normal generator paths, UI, parent reports, Parent AI, Copilot, APIs, or question banks.

## Purpose

Execute [**Phase 18**](product-quality-phase-18-math-probe-harness-plan.md) **Option B**–style workflow: a **separate script** injects synthetic **`pendingProbe`** objects and calls **`generateQuestion`** so all five diagnostic **`params.kind`** values are exercised and validated.

## Artifacts

| Output | Path |
|--------|------|
| Machine-readable summary | [`reports/math-probe-audit/summary.json`](../reports/math-probe-audit/summary.json) |
| Human summary | [`reports/math-probe-audit/summary.md`](../reports/math-probe-audit/summary.md) |
| Script | [`scripts/audit-math-probes.mjs`](../scripts/audit-math-probes.mjs) |
| npm script | `npm run audit:math-probes` → `tsx scripts/audit-math-probes.mjs` |

## How to run

```bash
npx tsx scripts/audit-math-probes.mjs
```

or:

```bash
npm run audit:math-probes
```

Use **`tsx`** (same as [`scripts/audit-question-banks.mjs`](../scripts/audit-question-banks.mjs)) so extensionless imports inside `utils/` resolve. Plain `node` may fail on Windows with `ERR_MODULE_NOT_FOUND` / `ERR_UNSUPPORTED_ESM_URL_SCHEME`.

## What the script does

For each of the five probes, the script:

1. Builds a minimal **`pendingProbe`** (`subjectId: "math"`, matching **`topicId`** / **`gradeKey`** / **`levelKey`**, **`suggestedQuestionType`** per Phase 18 §2, **`expiresAfterQuestions: 1`**).
2. Loads [`getLevelConfig`](../utils/math-storage.js) for the chosen grade/level.
3. Calls **`generateQuestion(lc, operation, gradeKey, null, { pendingProbe, probeMetaHolder })`**.
4. Asserts:
   - non-empty question text;
   - **`params.kind`** equals the expected probe kind;
   - **`correctAnswer`** present and not **`NaN`** (numeric);
   - **`answers`** length ≥ 2 for these probes (all emit MCQ lists in practice);
   - no **`NaN`** in **`params`** (shallow cycle check);
   - **`probeMetaHolder.current.probeReason`** set.

**Cases (stable IDs in `summary.json`):**

| id | Expected `params.kind` | Operation | Grade / level | `suggestedQuestionType` |
|----|------------------------|-----------|---------------|-------------------------|
| `frac_lcd` | `frac_probe_common_denominator_only` | `fractions` | g5 easy | `fraction_common_denominator_only` |
| `frac_gate` | `math_probe_fraction_operation_gate` | `fractions` | g5 easy | `fraction_operation_gate` |
| `place_value` | `math_probe_place_value` | `number_sense` | g3 easy | `place_value_digit_value` |
| `times_fact` | `math_probe_times_fact` | `multiplication` | g3 easy | `multiplication_fact_check` |
| `wp_operation` | `math_probe_operation_word_choice` | `word_problems` | g3 easy | `operation_choice_word_problem` |

## Relationship to main question audit

[`reports/question-audit/items.json`](../reports/question-audit/items.json) is **unchanged** by Phase 19. Probe rows still do not need to appear in the bulk audit unless you later merge harness output into [`scripts/audit-question-banks.mjs`](../scripts/audit-question-banks.mjs) (Phase 18 Option **A**).

Re-running **`npx tsx scripts/audit-question-banks.mjs`** is **optional** for Phase 19; it does not consume the new harness.

## Compliance

| Item | Changed |
|------|---------|
| Math generator source | **No** |
| Stems / answers / `correctIndex` in banks | **No** |
| Learning UI / APIs | **No** |

---

*Cross-reference:* [`docs/product-quality-phase-8-subject-coverage-content-plan.md`](product-quality-phase-8-subject-coverage-content-plan.md) §2.1 Math.
