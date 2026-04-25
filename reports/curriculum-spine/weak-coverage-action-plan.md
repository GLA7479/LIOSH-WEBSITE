# Weak coverage action plan (Phase 7.16)

- **classification_version:** 7.16_v1
- **total_weak:** 115
- **deterministic:** true

## Integrity

- counts_by_fix_type sum equals total_weak
- counts_by_priority sum equals total_weak
- P0 ∪ P1 ∪ P2 equals all weak skill_ids (no duplicates)

## counts_by_fix_type

```json
{
  "content_add": 2,
  "harness_expand": 6,
  "mapping_refine": 16,
  "threshold_adjust": 32,
  "accept_as_broad": 59
}
```

## counts_by_priority

```json
{
  "P1": 7,
  "P2": 108
}
```

## P0 (exact)


## P1 (exact)

- english:grammar:line:תארים_בסיסיים_יידוע_a_an_the_ומילות_יחס_מקום_in_on_under
- math:kind:dec_divide
- math:kind:dec_repeating
- math:kind:frac_half_reverse
- math:kind:frac_quarter_reverse
- math:kind:frac_to_mixed
- math:kind:wp_unit_cm_to_m

## P2 count

- 108 skill_ids (see JSON p2_skill_ids)

## Phase 7.17 recommendation

```text
Phase_7_17_order:
1) Address_P0_true_content_gaps_in_order:
2) Expand_deterministic_harness_for_P1_math_geometry_kinds:
   - math:kind:dec_divide
   - math:kind:dec_repeating
   - math:kind:frac_half_reverse
   - math:kind:frac_quarter_reverse
   - math:kind:frac_to_mixed
   - math:kind:wp_unit_cm_to_m
3) Address_P1_mapping_and_borderline_hebrew:
   - english:grammar:line:תארים_בסיסיים_יידוע_a_an_the_ומילות_יחס_מקום_in_on_under
4) Defer_geography_bucket_weak_list_all_accept_as_broad_until_product_requires_line_level_proof
5) Schedule_threshold_and_mapping_refine_P2_items_after_P0_P1_burn_down
```

## Subject summaries (structured)

```json
{
  "hebrew": {
    "content_add_skill_ids_sorted": [],
    "threshold_adjust_skill_ids_sorted": [
      "hebrew:g1:grammar:g1.grammar_odd_category",
      "hebrew:g3:comprehension:g3.explicit_only",
      "hebrew:g3:grammar:g3.tense_system_intro",
      "hebrew:g3:speaking:g3.discussion_prompt_choice",
      "hebrew:g4:reading:g4.genre_mix",
      "hebrew:g4:speaking:g4.present_text_based_choice",
      "hebrew:g4:vocabulary:g4.idiom_light",
      "hebrew:g5:comprehension:g5.multiple_perspectives_light",
      "hebrew:g5:grammar:g5.verb_patterns",
      "hebrew:g5:reading:g5.multi_layer_read",
      "hebrew:g6:comprehension:g6.evidence_from_text",
      "hebrew:g6:grammar:g6.complex_syntax_spot",
      "hebrew:g6:reading:g6.compare_genres"
    ],
    "summary_md_hint": "Hebrew_weak_splits_real_content_add_1_2_hits_vs_threshold_adjust_3_4_borderline_under_current_gate"
  },
  "math": {
    "harness_expand_skill_ids_sorted": [
      "math:kind:dec_divide",
      "math:kind:dec_repeating",
      "math:kind:frac_half_reverse",
      "math:kind:frac_quarter_reverse",
      "math:kind:frac_to_mixed",
      "math:kind:wp_unit_cm_to_m"
    ],
    "threshold_adjust_low_sample_skill_ids_sorted": [
      "math:kind:dec_divide_10_100",
      "math:kind:dec_multiply",
      "math:kind:eq_add_simple",
      "math:kind:ns_counting_backward",
      "math:kind:wp_coins_spent",
      "math:kind:wp_time_date"
    ]
  },
  "geometry": {
    "harness_expand_skill_ids_sorted": [],
    "threshold_adjust_low_sample_skill_ids_sorted": [
      "geometry:kind:cone_volume",
      "geometry:kind:cylinder_volume",
      "geometry:kind:prism_volume_rectangular",
      "geometry:kind:prism_volume_triangle",
      "geometry:kind:pyramid_volume_rectangular",
      "geometry:kind:pyramid_volume_square"
    ]
  },
  "english": {
    "curriculum_topic_access_thin_or_link_only_sorted": [],
    "vocabulary_wordlist_shared_bank_proxy_sorted": [
      "english:vocabulary:wordlist:actions",
      "english:vocabulary:wordlist:body",
      "english:vocabulary:wordlist:colors",
      "english:vocabulary:wordlist:community",
      "english:vocabulary:wordlist:emotions",
      "english:vocabulary:wordlist:family",
      "english:vocabulary:wordlist:global_issues",
      "english:vocabulary:wordlist:health",
      "english:vocabulary:wordlist:history",
      "english:vocabulary:wordlist:house",
      "english:vocabulary:wordlist:numbers",
      "english:vocabulary:wordlist:sports",
      "english:vocabulary:wordlist:technology",
      "english:vocabulary:wordlist:travel",
      "english:vocabulary:wordlist:weather"
    ],
    "translation_pools_weak_sorted": [
      "english:pool:translation:classroom",
      "english:pool:translation:community",
      "english:pool:translation:global",
      "english:pool:translation:hobbies",
      "english:pool:translation:routines",
      "english:pool:translation:technology"
    ],
    "grammar_line_weak_sorted": [
      "english:grammar:line:תארים_בסיסיים_יידוע_a_an_the_ומילות_יחס_מקום_in_on_under"
    ]
  },
  "science": {
    "weak_skill_ids_sorted": []
  },
  "geography": {
    "all_weak_accept_as_broad_p2_count": 59,
    "note": "all_geography_weak_rows_locked_to_accept_as_broad_and_P2_in_phase_7_16"
  }
}
```

## Full classified rows

See `weak-coverage-action-plan.json` → `skills`.
