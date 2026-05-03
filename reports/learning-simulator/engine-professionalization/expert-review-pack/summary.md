# Expert Review Pack — summary

**Disclaimer:** This is an internal educational diagnostic support review artifact. It is **not** a clinical or medical diagnosis. It is **not** a parent-facing report.

- **Generated:** 2026-05-03T08:30:13.510Z
- **Status:** PASS
- **Scenario count:** 22
- **requiresHumanExpertReview:** true

## Engine final (if present)

```json
{
  "engineFinalStatus": "PASS",
  "engineTechnicallyComplete": true,
  "professionalReadiness": "internal_engine_and_release_gates_passed",
  "releaseStatus": "PASS",
  "knownLimitations": [
    "English difficulty tiers may not align perfectly with matrix level labels.",
    "Cross-subject patterns are heuristic and require confirming probes.",
    "Subskill and misconception precision is limited until question pools carry dense expectedErrorTypes and prerequisiteSkillIds."
  ]
}
```

## Limitations

- English difficulty tiers may not align perfectly with matrix level labels.
- Cross-subject patterns are heuristic and require confirming probes.
- Subskill and misconception precision is limited until question pools carry dense expectedErrorTypes and prerequisiteSkillIds.
- Cross-subject and dependency outputs are heuristic teaching hypotheses.
- Sparse expectedErrorTypes / prerequisiteSkillIds on generated questions limit fine-grained misconception and prerequisite mapping.

## Per scenario

- **strong_all_subjects** — PASS — confidence high — readiness ready_for_internal_review
- **weak_all_subjects** — PASS — confidence high — readiness ready_for_internal_review
- **weak_math_fractions** — PASS — confidence medium — readiness ready_for_internal_review
- **weak_hebrew_comprehension** — PASS — confidence low — readiness needs_more_data
- **weak_english_grammar** — PASS — confidence low — readiness needs_more_data
- **weak_science_experiments** — PASS — confidence low — readiness needs_more_data
- **weak_geometry_area** — PASS — confidence medium — readiness ready_for_internal_review
- **weak_moledet_geography_maps** — PASS — confidence medium — readiness ready_for_internal_review
- **thin_data** — PASS — confidence low — readiness needs_more_data
- **random_guessing** — PASS — confidence low — readiness ready_for_internal_review
- **inconsistent** — PASS — confidence medium — readiness ready_for_internal_review
- **fast_wrong** — PASS — confidence low — readiness ready_for_internal_review
- **slow_correct** — PASS — confidence medium — readiness ready_for_internal_review
- **improving** — PASS — confidence low — readiness needs_more_data
- **declining** — PASS — confidence low — readiness needs_more_data
- **mixed_strengths** — PASS — confidence medium — readiness ready_for_internal_review
- **cross_subject_instruction_overlap** — PASS — confidence medium — readiness ready_for_internal_review
- **prerequisite_gap** — PASS — confidence medium — readiness ready_for_internal_review
- **prerequisite_direct_skill_gap** — PASS — confidence low — readiness ready_for_internal_review
- **misconception_repeat** — PASS — confidence low — readiness needs_more_data
- **mastery_decay_retention** — PASS — confidence medium — readiness ready_for_internal_review
- **difficulty_calibration_easy_only** — PASS — confidence medium — readiness ready_for_internal_review
