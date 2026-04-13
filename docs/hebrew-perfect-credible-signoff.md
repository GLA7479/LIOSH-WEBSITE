# Hebrew Perfect Close — Credibility sign-off (g1/g2 only)

Use this checklist **after** operational `npm run verify:hebrew-true-done` passes.  
`Hebrew perfect close achieved` (credibility-grade) requires **both**:

1. `npm run verify:hebrew-true-done`
2. `npm run verify:hebrew-perfect-credible` (adds `hebrew-official-credibility-verify.mjs`)

## Preconditions

- `data/hebrew-official-row-review.json` exists and lists **every** g1/g2 row from `data/hebrew-official-alignment-matrix.json` (מפתח לוגי: `grade` + `mapped_subtopic_id` + `runtime_topic` — מפריד למשל שתי שורות עם אותו `g1.word_meaning_concrete`).
- Pipeline order:
  1. `npm run hebrew:official-extract-excerpts` (candidates only; each excerpt has `extraction_tier: heuristic_candidate`)
  2. `npm run hebrew:official-init-row-review` (seeds `proposed_*`, `review_status: needs_review`)
  3. Curator fills **each** row: `review_status: approved`, `support_type`, `official_objective_source`, `row_specific_rationale_he` (unique, ≥40 chars), `anchor_quality_class`, `excerpt_quality_class`, `runtime_coverage_adequacy_declared`, `reviewer_id`, `approved_at`, and approved excerpt span if different from proposed
  4. `npm run hebrew:official-bind-rows` (matrix binds **approved** only; others stay `file_bound_excerpt_pending`)

## Fail-fast (credibility verify)

Verification **fails** if any in-scope row:

- is not `review_status: approved`
- uses `anchor_quality_class: weak_generic` or `excerpt_quality_class: weak_support`
- violates source coherence (`ministry_excerpt_verbatim` ⇒ `direct_verbatim` + `direct`; `ministry_summary_verified` ⇒ `summary_supported`)
- reuses the same `row_specific_rationale_he` text on more than one row (anti-boilerplate)
- matrix provenance does not match review (`official_doc_excerpt_ref`, `official_section_anchor`, summary justification vs rationale for summary rows, `adequate` vs `runtime_coverage_adequacy_declared`)

## Policy reminders

- **`ministry_excerpt_verbatim`**: literal/near-literal span; curator marks `support_type: direct_verbatim`.
- **`ministry_summary_verified`**: pedagogical synthesis; curator marks `summary_supported`; matrix `summary_alignment_justification` must equal `row_specific_rationale_he`.
- **`confidence` in matrix** (from bind): `high` only for `direct_verbatim` + `direct` + `exact_span`; otherwise `medium`.
- **No `adequate` coverage** in matrix unless `runtime_coverage_adequacy_declared === true` on the approved review row.

## Explicit non-scope

- g3–g6, UI, parent-report artifacts, non-Hebrew changes — unchanged by this pass.
