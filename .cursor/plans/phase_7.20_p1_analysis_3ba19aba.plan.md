---
name: Phase 7.20 P1 analysis
overview: "Read-only analysis of the seven remaining P1 weak skills: root causes from [scripts/audit-skill-coverage.mjs](scripts/audit-skill-coverage.js) and [reports/curriculum-spine/skill-coverage.json](reports/curriculum-spine/skill-coverage.json), classified as content vs harness/sample vs audit threshold vs acceptable limitation, with fix vs defer recommendations. No implementation."
todos:
  - id: en-grammar-line-map
    content: Refine grammar_line_id rules (and/or pool tags) so english:grammar:line:תארים_* receives matching rows for g3
    status: pending
  - id: math-audit-samples
    content: Add audit-only forced math_generator_sample emission for six kinds (dec_divide, dec_repeating, frac_half_reverse, frac_quarter_reverse, frac_to_mixed, wp_unit_cm_to_m)
    status: pending
  - id: verify-pipeline
    content: Re-run audit:questions, audit:skill-coverage, audit:weak-coverage-plan and required tests; confirm P1 count drops
    status: pending
isProject: false
---

# Phase 7.20 — Remaining P1 cleanup (plan only)

## Evidence sources

- Classifier for math/geometry kinds: [`classifyMathGeometry`](scripts/audit-skill-coverage.mjs) — adequate requires `sampleCount >= 6`; `1..5` → `low_sample_count`; `0` with harness hit → `harness_or_forced_only_no_audit_sample_hits`.
- Audit samples come from [`sampleMathGenerator`](scripts/audit-question-banks.mjs) calling `genMath` **without** `globalThis.__LIOSH_MATH_FORCE`; harness uses force in [`generator-deterministic-harness.mjs`](scripts/generator-deterministic-harness.mjs) only.
- English grammar lines: [`classifyEnglishGrammarLine`](scripts/audit-skill-coverage.mjs) — `grammar_line_id === skill_id` → adequate; else description substring; else many grammar rows → `grammar_pools_in_span_without_line_text_hit`.

## Per-skill analysis (table as list rows)

| # | Skill | Why still P1 | A/B/C/D | Recommended fix | Fix vs defer |
|---|--------|----------------|---------|-------------------|--------------|
| 1 | `english:grammar:line:תארים_בסיסיים_יידוע_a_an_the_ומילות_יחס_מקום_in_on_under` | `skill-coverage.json`: `coverage_class` weak, `mapping_note` **`grammar_pools_in_span_without_line_text_hit`**, `primary_evidence_count` **78** (many grammar rows in g3 span, but **no** row has `grammar_line_id` equal to this skill and the first 48 chars of the Hebrew curriculum `description` do not appear twice in stems). So the bank has g3 grammar activity, but the **deterministic `grammar_line_id` map** in [`audit-question-banks.mjs`](scripts/audit-question-banks.mjs) does not assign this spine id to the pools that actually carry a/an/the + prepositions content (e.g. much of g3 grammar may be mapped to `present_simple` line id instead). | **C** (audit mapping of pools → `grammar_line_id`); secondary **A** only if product audit shows true gap of a/an/the items. | **Mapping:** extend or split the fixed `grammarLineIdForEnglishGrammarPool` rules so the pool(s) that contain article/prep teaching for g3 emit `grammar_line_id` exactly equal to this `skill_id`; optionally add a small number of explicitly tagged pool items if the curriculum line is genuinely underrepresented. | **Fix** (low risk, aligns audit with curriculum intent). |
| 2 | `math:kind:dec_divide` | `primary_evidence_count` **0**, `harness_math_union` **true**, note **`harness_or_forced_only_no_audit_sample_hits`**. Random audit grid for g6/decimals rarely yields this exact `params.kind` without force; harness proves the kind exists. | **B** (audit sampling vs harness) | Emit additional deterministic `math_generator_sample` rows in the audit script (e.g. same `__LIOSH_MATH_FORCE` pattern as harness) **or** increase targeted sampling for g6/decimals — **not** user-facing generator changes. | **Fix** in audit layer; **defer** changing adequate threshold unless product wants rare kinds to be “harness-only adequate”. |
| 3 | `math:kind:dec_repeating` | Same pattern: **0** samples, harness hit, **`harness_or_forced_only_no_audit_sample_hits`**. | **B** | Same as row 2: forced or biased audit sampling for g6/hard/decimals until `subtopic` counts appear in `items.json`. | **Fix** (audit). |
| 4 | `math:kind:frac_half_reverse` | **0** samples, harness hit, **`harness_or_forced_only_no_audit_sample_hits`**. g2 fractions easy grid rarely hits reverse variant vs `frac_half`. | **B** | Audit-only forced samples for `frac_half_reverse` (already supported in generator under force). | **Fix** (audit). |
| 5 | `math:kind:frac_quarter_reverse` | Same as 4 for quarter reverse. | **B** | Audit-only forced samples for `frac_quarter_reverse`. | **Fix** (audit). |
| 6 | `math:kind:frac_to_mixed` | **0** samples, harness hit, **`harness_or_forced_only_no_audit_sample_hits`**. Unforced g5 fractions sampling rarely lands on the mixed-number branch. | **B** | Audit-only forced `frac_to_mixed` samples (harness already uses `__LIOSH_MATH_FORCE`); mirror in [`sampleMathGenerator`](scripts/audit-question-banks.mjs) post-pass or dedicated small loop. | **Fix** (audit). |
| 7 | `math:kind:wp_unit_cm_to_m` | **0** samples, harness hit, **`harness_or_forced_only_no_audit_sample_hits`**. Word-problems template mix makes this kind rare in the fixed-seed audit sweep. | **B** | Audit-only forced `wp_unit_cm_to_m` samples (harness path). | **Fix** (audit). |

## Weak-plan alignment (already encoded)

- Math rows with `harness_or_forced_only_no_audit_sample_hits` get candidate **`harness_expand`** in [`candidateFixTypes`](scripts/audit-weak-coverage-action-plan.mjs) (line ~98–101); grammar-line notes `grammar_pools_in_span_without_line_text_hit` / single-line hit → **`mapping_refine`** (lines ~127–131).

## Summary decisions

- **Normal user / product math content:** Not implicated for rows 2–7; issue is **audit evidence rows**, not missing generator kinds (harness shows kinds are reachable).
- **English תארים:** Primarily **mapping** between spine line and `grammar_line_id` / stem evidence, not “zero grammar for g3”.
- **Defer** as a set only if you explicitly accept **D** for all rare math kinds (document “adequate = harness-only for low-frequency kinds”) — that would be a **threshold / policy** change in `classifyMathGeometry`, not a content fix.

## Suggested Phase 7.20 implementation order (when you execute)

1. **English:** Adjust `grammarLineIdForEnglishGrammarPool` (and only if needed, minimal pool metadata) so g3 article/prep line gets `grammar_line_id` hits.
2. **Math:** Add a small, deterministic audit-only sampling pass (or extend `sampleMathGenerator`) that sets `__LIOSH_MATH_FORCE` per kind for the six kinds and pushes `math_generator_sample` rows — reuses existing harness contract and keeps gameplay unchanged when the global is unset in the app.

## Commands to re-verify after future implementation

`npm run audit:questions` → `npm run audit:skill-coverage` → `npm run audit:weak-coverage-plan` → `npm run test:answer-compare` → `npm run test:parent-report-phase6`.
