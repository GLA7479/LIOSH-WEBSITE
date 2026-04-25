---
name: Phase 7.16 weak coverage plan
overview: Add a read-only Node script that consumes the existing skill-coverage report, assigns each weak spine skill exactly one fix_type (deterministic, tie-broken by rule precedence), writes JSON + Markdown under reports/curriculum-spine/, and wires an npm script. No question banks, generators, UI, or parent-report code change.
todos:
  - id: add-audit-script
    content: Create scripts/audit-weak-coverage-action-plan.mjs per strict constraints (determinism, one fix_type, geo lock, meta, integrity checks)
    status: completed
  - id: wire-npm
    content: Add audit:weak-coverage-plan to package.json and script header run order
    status: completed
  - id: verify-pipeline
    content: Run build:curriculum-spine → audit:branches → audit:questions → audit:skill-coverage → audit:weak-coverage-plan; verify sums/lists; capture counts and P0/P1 for user
    status: completed
isProject: false
---

# Phase 7.16 — Weak coverage action plan (analysis only)

## Context

- **Input:** [`reports/curriculum-spine/skill-coverage.json`](reports/curriculum-spine/skill-coverage.json) — object with `skills[]`, `lists.weak_coverage_skill_ids`, and `summary.weak_by_subject`.
- **Producer (unchanged for 7.16):** [`scripts/audit-skill-coverage.mjs`](scripts/audit-skill-coverage.mjs) sets `coverage_class`, `mapping_note`, `primary_evidence_count`, and for math/geometry `evidence` entries.

## Design choice: separate report vs. extending skill-coverage rows

- **Default:** Only write [`reports/curriculum-spine/weak-coverage-action-plan.json`](reports/curriculum-spine/weak-coverage-action-plan.json) and [`reports/curriculum-spine/weak-coverage-action-plan.md`](reports/curriculum-spine/weak-coverage-action-plan.md).
- **Optional follow-up:** Add fields on `skill-coverage` rows in a later phase if desired.

---

## Strict constraints (implementation MUST comply)

### 1. Determinism

- Classification MUST be **fully deterministic**: no randomness, no reliance on object/map iteration order, no “first match wins” unless match order is itself a **fixed** function of stable keys (e.g. evaluate rules in the fixed `rules_priority_order` below).
- Same `skill-coverage.json` input MUST yield **byte-identical** JSON output (use stable key ordering in `JSON.stringify` if needed: sorted keys or deterministic object construction).
- When emitting lists (P0/P1/P2, subject breakdowns), sort `skill_id` **lexicographically** so output does not depend on source array order.

### 2. One-to-one mapping guarantee

- Every weak skill receives **exactly one** `fix_type`.
- **No** skill may be assigned multiple `fix_types`.
- If more than one rule would match, resolve by **fix_type precedence** (highest wins):

`content_add` > `harness_expand` > `mapping_refine` > `threshold_adjust` > `accept_as_broad`

- Implementation pattern: for each skill, compute the set of matching `fix_type`s from rules; if `|set| > 1`, choose the single type with **best** rank in the order above. If `|set| === 0`, use the explicit fallback (section 3).

### 3. Explicit fallback rule

If **no** classification rule matches:

| Field | Value |
|--------|--------|
| `fix_type` | `mapping_refine` |
| `priority` | `P2` |
| `weak_reason` | `unclassified_weak_mapping_note` |
| `recommended_action` | `add explicit classification rule in Phase 7.17` |

(Exact string literals as above.)

### 4. No free-text / fuzzy matching

- `mapping_note` checks MUST use **exact equality** (`===`) **or** `String.prototype.includes` **only** with **fixed, literal** substring constants defined in code (no user input, no regex on prose, no Levenshtein, no stemmers).
- Document each allowed `includes` substring in `meta.classification_rubric` (or adjacent `meta` field) as the canonical list.

### 5. Geography lock (Phase 7.16)

- **Every** weak row with `subject === "geography"` MUST be classified as:

| Field | Value |
|--------|--------|
| `fix_type` | `accept_as_broad` |
| `priority` | `P2` |

- **Do not** assign geography weak rows to `mapping_refine` (or any other `fix_type`) in this phase, regardless of `mapping_note` or bank sums.
- Narrative in MD may still describe “bucket vs line-level” product tradeoff; classification stays **locked** as above.

### 6. Output integrity (assert after classification)

Before writing JSON, **verify** (and **exit non-zero** if any check fails):

- `sum(counts_by_fix_type.values()) === total_weak`
- `sum(counts_by_priority.values()) === total_weak`
- The union of `p0_skill_ids`, `p1_skill_ids`, and `p2_skill_ids` equals the set of all weak `skill_id`s (same size as `total_weak`, no duplicates across lists).

### 7. `meta` block in `weak-coverage-action-plan.json`

Include at minimum:

```json
"meta": {
  "total_weak": <number>,
  "classification_version": "7.16_v1",
  "deterministic": true,
  "rules_priority_order": [
    "content_add",
    "harness_expand",
    "mapping_refine",
    "threshold_adjust",
    "accept_as_broad"
  ]
}
```

- Optionally extend `meta` with `classification_rubric` (threshold integers, exact `mapping_note` literals used, allowed `includes` substrings for science/Hebrew) for Phase 7.17 maintenance.

---

## New script: `scripts/audit-weak-coverage-action-plan.mjs`

1. **Load** `skill-coverage.json`; **exit 1** if missing or `skills` empty.
2. **Filter** weak rows; set `total_weak = weakRows.length`. Compare to `lists.weak_coverage_skill_ids.length`; **warn** on mismatch, still classify filtered set (document in `meta` if lengths differ).
3. **Per skill classification:** Apply **non-geography** rules using **only** `subject`, `skill_id`, `spine_layer`, `mapping_note` (exact / controlled `includes`), `primary_evidence_count`, and structured `evidence` (e.g. find `type === "math_generator_sample"` and read `count` — not string parsing of stems). Collect all matching `fix_type`s, then apply **section 2** precedence. **Geography:** override — always `accept_as_broad` + `P2` (section 5); geography must **not** participate in multi-rule resolution toward `mapping_refine`.
4. **`weak_reason` / `recommended_action`:** Deterministic templates from `(subject, fix_type, mapping_note, counts)` — no random choice among phrasings; one template per rule id.
5. **`priority` (non-geography):** Assign per final `fix_type` + subject rules already in plan (P0 science sparse grade, P1 harness + thin English topics, etc.) — must remain deterministic; document in rubric. **Geography:** always `P2` per lock.
6. **Subject summaries:** Built from classified rows; sort all id lists lexicographically.
7. **Aggregates:** `counts_by_fix_type`, `counts_by_priority`; run **section 6** integrity checks.
8. **`phase_7_17_recommendation`:** Deterministic ordered list (e.g. sort P0 ids, then by fix_type precedence).
9. **Console:** Log `ok`, paths, `total_weak`, counts, integrity pass.

### Example rule literals (must match [`audit-skill-coverage.mjs`](scripts/audit-skill-coverage.mjs) exactly)

- Math/geometry weak: `mapping_note === "harness_or_forced_only_no_audit_sample_hits"` → candidate `harness_expand`; `mapping_note === "low_sample_count"` → candidate `threshold_adjust`.
- Hebrew content_map weak: `mapping_note === "audit_hits_1_4_regenerate_questions_audit_if_zero_expected"` → split by `primary_evidence_count` into candidates for `content_add` vs `threshold_adjust` (exact integer thresholds in rubric).
- English: exact notes `thin_or_link_only`, `english_pool_activity_in_grade_span_shared_bank`, `grammar_pools_in_span_without_line_text_hit`, `single_curriculum_line_stem_hit`, `thin_wordlist_stem_token_match`; empty `mapping_note` for weak pools per pool classifier.
- Science weak: exact `includes` only for fixed substrings present in [`classifyScienceTopic`](scripts/audit-skill-coverage.mjs) notes, e.g. `topic_has_items_but_sparse_grade_tags_vs_spine_span`, `low_global_topic_count`.

**Geography:** ignore `mapping_note` for `fix_type`; still `accept_as_broad` + `P2`.

## `package.json`

Add `"audit:weak-coverage-plan": "tsx scripts/audit-weak-coverage-action-plan.mjs"`; document run **after** `audit:skill-coverage`.

## Run order (post-implementation verification)

1. `npm run build:curriculum-spine`
2. `npm run audit:branches`
3. `npm run audit:questions`
4. `npm run audit:skill-coverage`
5. `npm run audit:weak-coverage-plan`

**Return package:** files changed, `total_weak`, counts by `fix_type` / priority, exact P0/P1 (and P2 if requested), Phase 7.17 recommendation text, confirmation no content/generator/UI changes.

## Removed / superseded

- Prior plan text that suggested geography as optional `mapping_refine` or fallback geography → **superseded** by **Geography lock** (section 5).
- Prior fallback wording → **superseded** by **Explicit fallback rule** (section 3) with exact strings.
