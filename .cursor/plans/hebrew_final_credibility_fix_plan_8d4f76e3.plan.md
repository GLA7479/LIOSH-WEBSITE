---
name: Hebrew Final Credibility Fix Plan
overview: Design a final credibility-focused pass that replaces heuristic row binding with reviewable, pedagogically defensible evidence for every in-scope g1/g2 row, with hard verification gates.
todos:
  - id: add-review-ledger-contract
    content: Define row-review artifact schema with approval markers, support type, quality classes, and row-specific rationale.
    status: completed
  - id: switch-binding-to-approved-only
    content: Plan binding workflow so matrix updates only from approved review rows, not heuristic candidates.
    status: completed
  - id: enforce-truthfulness-policy
    content: Define strict source-type and confidence rules tied to review outcomes and support classes.
    status: completed
  - id: add-credibility-verify-gates
    content: Specify hard verify checks for review status, uncertain rows, quality classes, and anti-generic justification.
    status: completed
  - id: perfect-close-signoff
    content: Define final g1/g2-only signoff checklist and fail-fast conditions for perfect close declaration.
    status: completed
isProject: false
---

# Hebrew Final Credibility Fix Plan

## A. Exact Credibility Gaps

- **Heuristic excerpt selection is non-defensible for pedagogy:** current extraction in [`scripts/hebrew-official-extract-excerpts.mjs`](scripts/hebrew-official-extract-excerpts.mjs) is primarily first-token match + broad fallback terms, which can select generic document context unrelated to the row objective.
- **False-binding risk is highest in abstract/linguistic micro-skills:** rows like phonological awareness, syllable structure, and nuanced grammar objectives are highly vulnerable because generic terms can match broad sections without objective-level support.
- **Anchor format is technical, not semantic:** `hebrew-1-6.pdf#chars=...` proves location consistency, but not pedagogical relevance.
- **Row justification is currently too generic:** fixed justification text does not establish row-specific alignment rationale.
- **`coverage_status` inflation risk:** auto-promoting g1/g2 rows to `adequate` in binding flow conflates traceability mechanics with pedagogical sufficiency.

## B. Exact Fix Strategy For Excerpt Quality (Chosen Approach)

Adopt a **curated-first binding model with mandatory row review** (not heuristic-first):

1. **Freeze heuristic as candidate generator only**
   - extraction script may propose candidate excerpts, but cannot produce final binding status.
2. **Introduce row-level review ledger**
   - create a curated review artifact where each in-scope row stores reviewer-selected excerpt, rationale, and approval state.
3. **Two-stage binding pipeline**
   - Stage 1: candidate generation (`proposed` rows)
   - Stage 2: reviewer confirmation (`approved` rows only) -> matrix binding
4. **Hard rule:** only approved rows can be considered credible binding; unapproved rows remain non-final and fail perfect-close verification.

Primary files to drive this approach:
- [`data/hebrew-official-excerpts.json`](data/hebrew-official-excerpts.json) (candidate pool)
- new curated review file (e.g. [`data/hebrew-official-row-review.json`](data/hebrew-official-row-review.json))
- [`scripts/hebrew-official-bind-rows.mjs`](scripts/hebrew-official-bind-rows.mjs) (bind only approved rows)

## C. Exact Policy For Official Source Truthfulness

- **`ministry_excerpt_verbatim` allowed only when all true:**
  - excerpt is direct quote or near-literal sentence span,
  - reviewer marks `support_type: direct_verbatim`,
  - row objective wording is demonstrably present in excerpt.
- **`ministry_summary_verified` allowed only when all true:**
  - row objective is pedagogical synthesis (not literal line),
  - reviewer provides row-specific justification (not template),
  - excerpt is semantically supportive and reviewer marks `support_type: summary_supported`.
- **Binding is invalid (must fail) when:**
  - excerpt is generic-only context,
  - justification is boilerplate/duplicate template,
  - row lacks explicit reviewer approval marker.
- **Manual review is mandatory when:**
  - objective is abstract (phonology, morphology, syntax nuance),
  - candidate excerpt confidence below threshold,
  - multiple competing excerpts exist.
- **`confidence` policy:**
  - `high` only for approved rows with `support_type: direct_verbatim` and high-quality anchor/excerpt class,
  - `medium` for approved summary-supported rows,
  - never `high` for heuristic-only or unreviewed rows.

## D. Exact Matrix Truth Policy

- **Prohibited:** promoting `coverage_status` to `adequate` solely because binding fields exist.
- **Required for `adequate`/`complete`:**
  - row has approved credible binding,
  - excerpt support class meets threshold,
  - coverage status is justified by runtime/product evidence, not provenance presence.
- **Justification policy:**
  - every `ministry_summary_verified` row must carry row-specific justification text referencing why this excerpt supports this exact objective.
  - duplicated generic justification across many rows is invalid.

## E. Exact Verification Upgrade Plan

Extend verification with credibility gates (in addition to existing consistency gates):

- **Review-state gate:** fail if any in-scope row is not `approved` in review ledger.
- **Uncertain-row gate:** fail if any row has `review_status` in `needs_review` / `rejected` / `ambiguous`.
- **Anchor-quality class gate:** require per-row `anchor_quality_class` (e.g. `exact_span`, `section_span`, `weak_generic`) and fail on weak classes.
- **Excerpt-quality class gate:** require per-row `excerpt_quality_class` (e.g. `direct`, `strong_support`, `weak_support`) and fail on weak support.
- **Manual approval marker gate:** require reviewer id/date + approval stamp for each in-scope row.
- **Objective-source integrity gate:**
  - `ministry_excerpt_verbatim` rows must have direct/verbatim class,
  - `ministry_summary_verified` rows must include non-generic row-specific justification.
- **Coverage truth gate:** fail if row is `adequate`/`complete` without approved credible evidence trail.

## F. Exact Final Pass Scope

This pass is restricted to:

- **Only** in-scope rows for **g1/g2** in [`data/hebrew-official-alignment-matrix.json`](data/hebrew-official-alignment-matrix.json)
- no g3–g6 expansion
- no UI files
- no parent-report files
- no non-Hebrew scope changes

## G. Exit Criteria (`Hebrew perfect close achieved`)

Declare only when all conditions hold:

- no in-scope row is heuristic-only
- every in-scope row has approved row-level review evidence
- no in-scope row has weak/ambiguous excerpt support class
- no generic copied justifications for summary-based rows
- no automatic `adequate` without row-specific credibility + runtime evidence
- all in-scope rows have policy-consistent `official_objective_source` and `confidence`
- verify fails on any non-credible row and currently passes cleanly

## Recommended First Artifact To Build First

- Build **[`data/hebrew-official-row-review.json`](data/hebrew-official-row-review.json)** first.
- Reason: it is the control plane that turns candidates into approved evidence and enables all credibility gates (review status, quality class, manual approval markers).