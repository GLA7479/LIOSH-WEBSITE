# Adaptive Planner — Internal Preview Pack

_Non-live artifact. Not student-facing. Generated: **2026-05-03T19:27:36.334Z**_

## A. Executive summary

| Metric | Value |
|--------|-------|
| Total planner runs | 126 |
| safetyViolationCount | 0 |
| metadataExactMatchCount | 118 |
| metadataSkillSubskillMatchCount | 118 |
| metadataSubjectFallbackCount | 2 |
| metadataSubjectFallbackBaselineCount | 120 |
| afterAvailableQuestionMetadataMissingCount | 6 |
| needsHumanReviewCount | 6 |
| skillAlignmentCoverage | 0.937 |
| Planner status — ready / caution | 3 / 117 |
| englishSkillTaggingIncompleteCount | 6 |

### skillAlignmentBySource

```json
{
  "topic_mapping": 107,
  "taxonomy_bridge": 7,
  "unit_field": 4
}
```

## B. Planner action table

| Count | nextAction | plannerStatus | subject | skillAlignmentSource | metadataResolutionSource |
|------:|------------|---------------|---------|----------------------|--------------------------|
| 77 | pause_collect_more_data | caution | math | topic_mapping | metadataIndex |
| 24 | probe_skill | caution | math | topic_mapping | metadataIndex |
| 7 | pause_collect_more_data | caution | geometry | taxonomy_bridge | metadataIndex |
| 6 | pause_collect_more_data | needs_human_review | english | none | none |
| 2 | pause_collect_more_data | caution | hebrew | topic_mapping | metadataIndex |
| 2 | pause_collect_more_data | caution | moledet-geography | topic_mapping | metadataIndex |
| 2 | pause_collect_more_data | caution | science | topic_mapping | metadataIndex |
| 2 | pause_collect_more_data | caution | geometry | none | metadataIndex |
| 1 | practice_current | ready | math | unit_field | metadataIndex |
| 1 | pause_collect_more_data | caution | geometry | unit_field | metadataIndex |
| 1 | advance_skill | ready | math | unit_field | metadataIndex |
| 1 | advance_skill | ready | hebrew | unit_field | metadataIndex |

## C. Examples (slim rows — no question bodies)

### advance_skill

```json
[
  {
    "label": "fixture:real_like_strong_advance_with_metadata",
    "relativePath": "fixture:real_like_strong_advance_with_metadata",
    "focusUnitIndex": 0,
    "scenarioId": "fixture_advance_math",
    "subject": "math",
    "unitDisplayName": "שברים",
    "currentSkillId": "math_frac_add_sub",
    "currentSubskillId": "frac_add_sub",
    "skillAlignmentConfidence": "exact",
    "skillAlignmentSource": "unit_field",
    "skillAlignmentWarnings": [],
    "metadataResolutionSource": "metadataIndex",
    "metadataSubjectFallback": false,
    "metadataSkillOnlyFallback": false,
    "metaLen": 1,
    "skillTaggingIncomplete": false,
    "nextAction": "advance_skill",
    "plannerStatus": "ready",
    "targetDifficulty": "advanced",
    "questionCount": 4,
    "targetSkillId": "math_frac_add_sub",
    "targetSubskillId": "frac_add_sub",
    "requiresHumanReview": false,
    "reasonCodes": [
      "ADVANCE_STRONG_SIGNAL"
    ],
    "warnings": []
  },
  {
    "label": "fixture:real_like_advance_missing_metadata",
    "relativePath": "fixture:real_like_advance_missing_metadata",
    "focusUnitIndex": 0,
    "scenarioId": "fixture_advance_no_meta",
    "subject": "hebrew",
    "unitDisplayName": "הבנה",
    "currentSkillId": "main_idea",
    "currentSubskillId": "summary",
    "skillAlignmentConfidence": "exact",
    "skillAlignmentSource": "unit_field",
    "skillAlignmentWarnings": [],
    "metadataResolutionSource": "metadataIndex",
    "metadataSubjectFallback": false,
    "metadataSkillOnlyFallback": false,
    "metaLen": 1,
    "skillTaggingIncomplete": false,
    "nextAction": "advance_skill",
    "plannerStatus": "ready",
    "targetDifficulty": "advanced",
    "questionCount": 4,
    "targetSkillId": "main_idea",
    "targetSubskillId": "summary",
    "requiresHumanReview": false,
    "reasonCodes": [
      "ADVANCE_STRONG_SIGNAL"
    ],
    "warnings": []
  }
]
```

### practice_current

```json
[
  {
    "label": "fixture:real_like_remediate",
    "relativePath": "fixture:real_like_remediate",
    "focusUnitIndex": 0,
    "scenarioId": "fixture_remediate_math",
    "subject": "math",
    "unitDisplayName": "כפל",
    "currentSkillId": "math_mul",
    "currentSubskillId": "mul",
    "skillAlignmentConfidence": "exact",
    "skillAlignmentSource": "unit_field",
    "skillAlignmentWarnings": [],
    "metadataResolutionSource": "metadataIndex",
    "metadataSubjectFallback": false,
    "metadataSkillOnlyFallback": false,
    "metaLen": 1,
    "skillTaggingIncomplete": false,
    "nextAction": "practice_current",
    "plannerStatus": "ready",
    "targetDifficulty": "basic",
    "questionCount": 5,
    "targetSkillId": "math_mul",
    "targetSubskillId": "mul",
    "requiresHumanReview": false,
    "reasonCodes": [
      "REMEDIATE",
      "ERROR_TYPES_TARGETED_PRACTICE"
    ],
    "warnings": []
  }
]
```

### probe_skill

```json
[
  {
    "label": "reports\\learning-simulator\\deep\\per-student\\inconsistent_student_g5_30d.report.json#unit0",
    "relativePath": "reports\\learning-simulator\\deep\\per-student\\inconsistent_student_g5_30d.report.json",
    "focusUnitIndex": 0,
    "scenarioId": "inconsistent_student_g5_30d",
    "subject": "math",
    "unitDisplayName": "סדרות",
    "currentSkillId": "math_sequence",
    "currentSubskillId": "sequence",
    "skillAlignmentConfidence": "inferred_safe",
    "skillAlignmentSource": "topic_mapping",
    "skillAlignmentWarnings": [],
    "metadataResolutionSource": "metadataIndex",
    "metadataSubjectFallback": false,
    "metadataSkillOnlyFallback": false,
    "metaLen": 1,
    "skillTaggingIncomplete": false,
    "nextAction": "probe_skill",
    "plannerStatus": "caution",
    "targetDifficulty": "basic",
    "questionCount": 3,
    "targetSkillId": "math_sequence",
    "targetSubskillId": "sequence",
    "requiresHumanReview": false,
    "reasonCodes": [
      "THIN_DATA",
      "DO_NOT_CONCLUDE",
      "PROBE_INCONSISTENCY"
    ],
    "warnings": []
  },
  {
    "label": "reports\\learning-simulator\\deep\\per-student\\inconsistent_student_g5_30d.report.json#unit1",
    "relativePath": "reports\\learning-simulator\\deep\\per-student\\inconsistent_student_g5_30d.report.json",
    "focusUnitIndex": 1,
    "scenarioId": "inconsistent_student_g5_30d",
    "subject": "math",
    "unitDisplayName": "שברים",
    "currentSkillId": "math_frac_add_sub",
    "currentSubskillId": "frac_add_sub",
    "skillAlignmentConfidence": "inferred_safe",
    "skillAlignmentSource": "topic_mapping",
    "skillAlignmentWarnings": [],
    "metadataResolutionSource": "metadataIndex",
    "metadataSubjectFallback": false,
    "metadataSkillOnlyFallback": false,
    "metaLen": 1,
    "skillTaggingIncomplete": false,
    "nextAction": "probe_skill",
    "plannerStatus": "caution",
    "targetDifficulty": "basic",
    "questionCount": 3,
    "targetSkillId": "math_frac_add_sub",
    "targetSubskillId": "frac_add_sub",
    "requiresHumanReview": false,
    "reasonCodes": [
      "THIN_DATA",
      "DO_NOT_CONCLUDE",
      "PROBE_INCONSISTENCY"
    ],
    "warnings": []
  }
]
```

### pause_collect_more_data

```json
[
  {
    "label": "reports\\learning-simulator\\deep\\per-student\\declining_student_g4_90d.report.json#unit0",
    "relativePath": "reports\\learning-simulator\\deep\\per-student\\declining_student_g4_90d.report.json",
    "focusUnitIndex": 0,
    "scenarioId": "declining_student_g4_90d",
    "subject": "math",
    "unitDisplayName": "כפל",
    "currentSkillId": "math_mul",
    "currentSubskillId": "mul",
    "skillAlignmentConfidence": "inferred_safe",
    "skillAlignmentSource": "topic_mapping",
    "skillAlignmentWarnings": [],
    "metadataResolutionSource": "metadataIndex",
    "metadataSubjectFallback": false,
    "metadataSkillOnlyFallback": false,
    "metaLen": 1,
    "skillTaggingIncomplete": false,
    "nextAction": "pause_collect_more_data",
    "plannerStatus": "caution",
    "targetDifficulty": "basic",
    "questionCount": 3,
    "targetSkillId": "math_mul",
    "targetSubskillId": "mul",
    "requiresHumanReview": false,
    "reasonCodes": [
      "THIN_DATA",
      "DO_NOT_CONCLUDE"
    ],
    "warnings": []
  },
  {
    "label": "reports\\learning-simulator\\deep\\per-student\\declining_student_g4_90d.report.json#unit1",
    "relativePath": "reports\\learning-simulator\\deep\\per-student\\declining_student_g4_90d.report.json",
    "focusUnitIndex": 1,
    "scenarioId": "declining_student_g4_90d",
    "subject": "math",
    "unitDisplayName": "סימני התחלקות",
    "currentSkillId": "math_divisibility",
    "currentSubskillId": "divisibility",
    "skillAlignmentConfidence": "inferred_safe",
    "skillAlignmentSource": "topic_mapping",
    "skillAlignmentWarnings": [],
    "metadataResolutionSource": "metadataIndex",
    "metadataSubjectFallback": false,
    "metadataSkillOnlyFallback": false,
    "metaLen": 1,
    "skillTaggingIncomplete": false,
    "nextAction": "pause_collect_more_data",
    "plannerStatus": "caution",
    "targetDifficulty": "basic",
    "questionCount": 3,
    "targetSkillId": "math_divisibility",
    "targetSubskillId": "divisibility",
    "requiresHumanReview": false,
    "reasonCodes": [
      "THIN_DATA",
      "DO_NOT_CONCLUDE"
    ],
    "warnings": []
  }
]
```

### needs_human_review

```json
[
  {
    "label": "reports\\learning-simulator\\deep\\per-student\\weak_english_grammar_g4_30d.report.json#unit0",
    "relativePath": "reports\\learning-simulator\\deep\\per-student\\weak_english_grammar_g4_30d.report.json",
    "focusUnitIndex": 0,
    "scenarioId": "weak_english_grammar_g4_30d",
    "subject": "english",
    "unitDisplayName": "Grammar",
    "currentSkillId": "",
    "currentSubskillId": "",
    "skillAlignmentConfidence": "",
    "skillAlignmentSource": "",
    "skillAlignmentWarnings": [],
    "metadataResolutionSource": "",
    "metadataSubjectFallback": false,
    "metadataSkillOnlyFallback": false,
    "metaLen": 0,
    "skillTaggingIncomplete": true,
    "nextAction": "pause_collect_more_data",
    "plannerStatus": "needs_human_review",
    "targetDifficulty": "standard",
    "questionCount": 3,
    "targetSkillId": "",
    "targetSubskillId": "",
    "requiresHumanReview": true,
    "reasonCodes": [
      "ENGLISH_SKILL_TAGGING_INCOMPLETE"
    ],
    "warnings": [
      "availableQuestionMetadata_missing"
    ]
  },
  {
    "label": "reports\\learning-simulator\\reports\\per-student\\strong_all_subjects_g3_7d.report.json#unit9",
    "relativePath": "reports\\learning-simulator\\reports\\per-student\\strong_all_subjects_g3_7d.report.json",
    "focusUnitIndex": 9,
    "scenarioId": "strong_all_subjects_g3_7d",
    "subject": "english",
    "unitDisplayName": "Vocabulary",
    "currentSkillId": "",
    "currentSubskillId": "",
    "skillAlignmentConfidence": "",
    "skillAlignmentSource": "",
    "skillAlignmentWarnings": [],
    "metadataResolutionSource": "",
    "metadataSubjectFallback": false,
    "metadataSkillOnlyFallback": false,
    "metaLen": 0,
    "skillTaggingIncomplete": true,
    "nextAction": "pause_collect_more_data",
    "plannerStatus": "needs_human_review",
    "targetDifficulty": "standard",
    "questionCount": 3,
    "targetSkillId": "",
    "targetSubskillId": "",
    "requiresHumanReview": true,
    "reasonCodes": [
      "ENGLISH_SKILL_TAGGING_INCOMPLETE"
    ],
    "warnings": [
      "availableQuestionMetadata_missing"
    ]
  }
]
```

### Exact metadata match (no subject/skill-only fallback)

```json
[
  {
    "label": "reports\\learning-simulator\\deep\\per-student\\declining_student_g4_90d.report.json#unit0",
    "relativePath": "reports\\learning-simulator\\deep\\per-student\\declining_student_g4_90d.report.json",
    "focusUnitIndex": 0,
    "scenarioId": "declining_student_g4_90d",
    "subject": "math",
    "unitDisplayName": "כפל",
    "currentSkillId": "math_mul",
    "currentSubskillId": "mul",
    "skillAlignmentConfidence": "inferred_safe",
    "skillAlignmentSource": "topic_mapping",
    "skillAlignmentWarnings": [],
    "metadataResolutionSource": "metadataIndex",
    "metadataSubjectFallback": false,
    "metadataSkillOnlyFallback": false,
    "metaLen": 1,
    "skillTaggingIncomplete": false,
    "nextAction": "pause_collect_more_data",
    "plannerStatus": "caution",
    "targetDifficulty": "basic",
    "questionCount": 3,
    "targetSkillId": "math_mul",
    "targetSubskillId": "mul",
    "requiresHumanReview": false,
    "reasonCodes": [
      "THIN_DATA",
      "DO_NOT_CONCLUDE"
    ],
    "warnings": []
  },
  {
    "label": "reports\\learning-simulator\\deep\\per-student\\declining_student_g4_90d.report.json#unit1",
    "relativePath": "reports\\learning-simulator\\deep\\per-student\\declining_student_g4_90d.report.json",
    "focusUnitIndex": 1,
    "scenarioId": "declining_student_g4_90d",
    "subject": "math",
    "unitDisplayName": "סימני התחלקות",
    "currentSkillId": "math_divisibility",
    "currentSubskillId": "divisibility",
    "skillAlignmentConfidence": "inferred_safe",
    "skillAlignmentSource": "topic_mapping",
    "skillAlignmentWarnings": [],
    "metadataResolutionSource": "metadataIndex",
    "metadataSubjectFallback": false,
    "metadataSkillOnlyFallback": false,
    "metaLen": 1,
    "skillTaggingIncomplete": false,
    "nextAction": "pause_collect_more_data",
    "plannerStatus": "caution",
    "targetDifficulty": "basic",
    "questionCount": 3,
    "targetSkillId": "math_divisibility",
    "targetSubskillId": "divisibility",
    "requiresHumanReview": false,
    "reasonCodes": [
      "THIN_DATA",
      "DO_NOT_CONCLUDE"
    ],
    "warnings": []
  }
]
```

### Subject metadata fallback

```json
[
  {
    "label": "reports\\learning-simulator\\reports\\per-student\\strong_all_subjects_g3_7d.report.json#unit6",
    "relativePath": "reports\\learning-simulator\\reports\\per-student\\strong_all_subjects_g3_7d.report.json",
    "focusUnitIndex": 6,
    "scenarioId": "strong_all_subjects_g3_7d",
    "subject": "geometry",
    "unitDisplayName": "היקף",
    "currentSkillId": "",
    "currentSubskillId": "",
    "skillAlignmentConfidence": "",
    "skillAlignmentSource": "",
    "skillAlignmentWarnings": [],
    "metadataResolutionSource": "metadataIndex",
    "metadataSubjectFallback": true,
    "metadataSkillOnlyFallback": false,
    "metaLen": 14,
    "skillTaggingIncomplete": false,
    "nextAction": "pause_collect_more_data",
    "plannerStatus": "caution",
    "targetDifficulty": "basic",
    "questionCount": 3,
    "targetSkillId": "",
    "targetSubskillId": "",
    "requiresHumanReview": false,
    "reasonCodes": [
      "THIN_DATA",
      "DO_NOT_CONCLUDE"
    ],
    "warnings": [
      "metadata_subject_fallback"
    ]
  },
  {
    "label": "reports\\learning-simulator\\reports\\per-student\\strong_all_subjects_g3_7d.report.json#unit7",
    "relativePath": "reports\\learning-simulator\\reports\\per-student\\strong_all_subjects_g3_7d.report.json",
    "focusUnitIndex": 7,
    "scenarioId": "strong_all_subjects_g3_7d",
    "subject": "geometry",
    "unitDisplayName": "מקבילות ומאונכות",
    "currentSkillId": "",
    "currentSubskillId": "",
    "skillAlignmentConfidence": "",
    "skillAlignmentSource": "",
    "skillAlignmentWarnings": [],
    "metadataResolutionSource": "metadataIndex",
    "metadataSubjectFallback": true,
    "metadataSkillOnlyFallback": false,
    "metaLen": 14,
    "skillTaggingIncomplete": false,
    "nextAction": "pause_collect_more_data",
    "plannerStatus": "caution",
    "targetDifficulty": "basic",
    "questionCount": 3,
    "targetSkillId": "",
    "targetSubskillId": "",
    "requiresHumanReview": false,
    "reasonCodes": [
      "THIN_DATA",
      "DO_NOT_CONCLUDE"
    ],
    "warnings": [
      "metadata_subject_fallback"
    ]
  }
]
```

### English skillTaggingIncomplete

```json
[
  {
    "label": "reports\\learning-simulator\\deep\\per-student\\weak_english_grammar_g4_30d.report.json#unit0",
    "relativePath": "reports\\learning-simulator\\deep\\per-student\\weak_english_grammar_g4_30d.report.json",
    "focusUnitIndex": 0,
    "scenarioId": "weak_english_grammar_g4_30d",
    "subject": "english",
    "unitDisplayName": "Grammar",
    "currentSkillId": "",
    "currentSubskillId": "",
    "skillAlignmentConfidence": "",
    "skillAlignmentSource": "",
    "skillAlignmentWarnings": [],
    "metadataResolutionSource": "",
    "metadataSubjectFallback": false,
    "metadataSkillOnlyFallback": false,
    "metaLen": 0,
    "skillTaggingIncomplete": true,
    "nextAction": "pause_collect_more_data",
    "plannerStatus": "needs_human_review",
    "targetDifficulty": "standard",
    "questionCount": 3,
    "targetSkillId": "",
    "targetSubskillId": "",
    "requiresHumanReview": true,
    "reasonCodes": [
      "ENGLISH_SKILL_TAGGING_INCOMPLETE"
    ],
    "warnings": [
      "availableQuestionMetadata_missing"
    ]
  },
  {
    "label": "reports\\learning-simulator\\reports\\per-student\\strong_all_subjects_g3_7d.report.json#unit9",
    "relativePath": "reports\\learning-simulator\\reports\\per-student\\strong_all_subjects_g3_7d.report.json",
    "focusUnitIndex": 9,
    "scenarioId": "strong_all_subjects_g3_7d",
    "subject": "english",
    "unitDisplayName": "Vocabulary",
    "currentSkillId": "",
    "currentSubskillId": "",
    "skillAlignmentConfidence": "",
    "skillAlignmentSource": "",
    "skillAlignmentWarnings": [],
    "metadataResolutionSource": "",
    "metadataSubjectFallback": false,
    "metadataSkillOnlyFallback": false,
    "metaLen": 0,
    "skillTaggingIncomplete": true,
    "nextAction": "pause_collect_more_data",
    "plannerStatus": "needs_human_review",
    "targetDifficulty": "standard",
    "questionCount": 3,
    "targetSkillId": "",
    "targetSubskillId": "",
    "requiresHumanReview": true,
    "reasonCodes": [
      "ENGLISH_SKILL_TAGGING_INCOMPLETE"
    ],
    "warnings": [
      "availableQuestionMetadata_missing"
    ]
  }
]
```

### Missing question metadata

```json
[
  {
    "label": "reports\\learning-simulator\\deep\\per-student\\weak_english_grammar_g4_30d.report.json#unit0",
    "relativePath": "reports\\learning-simulator\\deep\\per-student\\weak_english_grammar_g4_30d.report.json",
    "focusUnitIndex": 0,
    "scenarioId": "weak_english_grammar_g4_30d",
    "subject": "english",
    "unitDisplayName": "Grammar",
    "currentSkillId": "",
    "currentSubskillId": "",
    "skillAlignmentConfidence": "",
    "skillAlignmentSource": "",
    "skillAlignmentWarnings": [],
    "metadataResolutionSource": "",
    "metadataSubjectFallback": false,
    "metadataSkillOnlyFallback": false,
    "metaLen": 0,
    "skillTaggingIncomplete": true,
    "nextAction": "pause_collect_more_data",
    "plannerStatus": "needs_human_review",
    "targetDifficulty": "standard",
    "questionCount": 3,
    "targetSkillId": "",
    "targetSubskillId": "",
    "requiresHumanReview": true,
    "reasonCodes": [
      "ENGLISH_SKILL_TAGGING_INCOMPLETE"
    ],
    "warnings": [
      "availableQuestionMetadata_missing"
    ]
  },
  {
    "label": "reports\\learning-simulator\\reports\\per-student\\strong_all_subjects_g3_7d.report.json#unit9",
    "relativePath": "reports\\learning-simulator\\reports\\per-student\\strong_all_subjects_g3_7d.report.json",
    "focusUnitIndex": 9,
    "scenarioId": "strong_all_subjects_g3_7d",
    "subject": "english",
    "unitDisplayName": "Vocabulary",
    "currentSkillId": "",
    "currentSubskillId": "",
    "skillAlignmentConfidence": "",
    "skillAlignmentSource": "",
    "skillAlignmentWarnings": [],
    "metadataResolutionSource": "",
    "metadataSubjectFallback": false,
    "metadataSkillOnlyFallback": false,
    "metaLen": 0,
    "skillTaggingIncomplete": true,
    "nextAction": "pause_collect_more_data",
    "plannerStatus": "needs_human_review",
    "targetDifficulty": "standard",
    "questionCount": 3,
    "targetSkillId": "",
    "targetSubskillId": "",
    "requiresHumanReview": true,
    "reasonCodes": [
      "ENGLISH_SKILL_TAGGING_INCOMPLETE"
    ],
    "warnings": [
      "availableQuestionMetadata_missing"
    ]
  }
]
```

## D. Readiness by subject

| Subject | Runs | Exact | Fallback | Missing meta | needs_human_review | ready | caution | Recommended |
|---------|-----:|------:|---------:|-------------:|-------------------:|------:|--------:|-------------|
| math | 103 | 103 | 0 | 0 | 0 | 2 | 101 | **ready_for_internal_preview** |
| geometry | 10 | 8 | 2 | 0 | 0 | 0 | 10 | **ready_for_internal_preview** |
| english | 6 | 0 | 0 | 6 | 6 | 0 | 0 | **blocked_for_live_routing** |
| hebrew | 3 | 3 | 0 | 0 | 0 | 1 | 2 | **ready_for_internal_preview** |
| moledet-geography | 2 | 2 | 0 | 0 | 0 | 0 | 2 | **ready_for_internal_preview** |
| science | 2 | 2 | 0 | 0 | 0 | 0 | 2 | **ready_for_internal_preview** |

## E. Risk list (truncated)

### Subject fallback (sample)
```json
[
  {
    "label": "reports\\learning-simulator\\reports\\per-student\\strong_all_subjects_g3_7d.report.json#unit6",
    "relativePath": "reports\\learning-simulator\\reports\\per-student\\strong_all_subjects_g3_7d.report.json",
    "focusUnitIndex": 6,
    "scenarioId": "strong_all_subjects_g3_7d",
    "subject": "geometry",
    "unitDisplayName": "היקף",
    "currentSkillId": "",
    "currentSubskillId": "",
    "skillAlignmentConfidence": "",
    "skillAlignmentSource": "",
    "skillAlignmentWarnings": [],
    "metadataResolutionSource": "metadataIndex",
    "metadataSubjectFallback": true,
    "metadataSkillOnlyFallback": false,
    "metaLen": 14,
    "skillTaggingIncomplete": false,
    "nextAction": "pause_collect_more_data",
    "plannerStatus": "caution",
    "targetDifficulty": "basic",
    "questionCount": 3,
    "targetSkillId": "",
    "targetSubskillId": "",
    "requiresHumanReview": false,
    "reasonCodes": [
      "THIN_DATA",
      "DO_NOT_CONCLUDE"
    ],
    "warnings": [
      "metadata_subject_fallback"
    ]
  },
  {
    "label": "reports\\learning-simulator\\reports\\per-student\\strong_all_subjects_g3_7d.report.json#unit7",
    "relativePath": "reports\\learning-simulator\\reports\\per-student\\strong_all_subjects_g3_7d.report.json",
    "focusUnitIndex": 7,
    "scenarioId": "strong_all_subjects_g3_7d",
    "subject": "geometry",
    "unitDisplayName": "מקבילות ומאונכות",
    "currentSkillId": "",
    "currentSubskillId": "",
    "skillAlignmentConfidence": "",
    "skillAlignmentSource": "",
    "skillAlignmentWarnings": [],
    "metadataResolutionSource": "metadataIndex",
    "metadataSubjectFallback": true,
    "metadataSkillOnlyFallback": false,
    "metaLen": 14,
    "skillTaggingIncomplete": false,
    "nextAction": "pause_collect_more_data",
    "plannerStatus": "caution",
    "targetDifficulty": "basic",
    "questionCount": 3,
    "targetSkillId": "",
    "targetSubskillId": "",
    "requiresHumanReview": false,
    "reasonCodes": [
      "THIN_DATA",
      "DO_NOT_CONCLUDE"
    ],
    "warnings": [
      "metadata_subject_fallback"
    ]
  }
]
```

### English untagged (sample)
```json
[
  {
    "label": "reports\\learning-simulator\\deep\\per-student\\weak_english_grammar_g4_30d.report.json#unit0",
    "relativePath": "reports\\learning-simulator\\deep\\per-student\\weak_english_grammar_g4_30d.report.json",
    "focusUnitIndex": 0,
    "scenarioId": "weak_english_grammar_g4_30d",
    "subject": "english",
    "unitDisplayName": "Grammar",
    "currentSkillId": "",
    "currentSubskillId": "",
    "skillAlignmentConfidence": "",
    "skillAlignmentSource": "",
    "skillAlignmentWarnings": [],
    "metadataResolutionSource": "",
    "metadataSubjectFallback": false,
    "metadataSkillOnlyFallback": false,
    "metaLen": 0,
    "skillTaggingIncomplete": true,
    "nextAction": "pause_collect_more_data",
    "plannerStatus": "needs_human_review",
    "targetDifficulty": "standard",
    "questionCount": 3,
    "targetSkillId": "",
    "targetSubskillId": "",
    "requiresHumanReview": true,
    "reasonCodes": [
      "ENGLISH_SKILL_TAGGING_INCOMPLETE"
    ],
    "warnings": [
      "availableQuestionMetadata_missing"
    ]
  },
  {
    "label": "reports\\learning-simulator\\reports\\per-student\\strong_all_subjects_g3_7d.report.json#unit9",
    "relativePath": "reports\\learning-simulator\\reports\\per-student\\strong_all_subjects_g3_7d.report.json",
    "focusUnitIndex": 9,
    "scenarioId": "strong_all_subjects_g3_7d",
    "subject": "english",
    "unitDisplayName": "Vocabulary",
    "currentSkillId": "",
    "currentSubskillId": "",
    "skillAlignmentConfidence": "",
    "skillAlignmentSource": "",
    "skillAlignmentWarnings": [],
    "metadataResolutionSource": "",
    "metadataSubjectFallback": false,
    "metadataSkillOnlyFallback": false,
    "metaLen": 0,
    "skillTaggingIncomplete": true,
    "nextAction": "pause_collect_more_data",
    "plannerStatus": "needs_human_review",
    "targetDifficulty": "standard",
    "questionCount": 3,
    "targetSkillId": "",
    "targetSubskillId": "",
    "requiresHumanReview": true,
    "reasonCodes": [
      "ENGLISH_SKILL_TAGGING_INCOMPLETE"
    ],
    "warnings": [
      "availableQuestionMetadata_missing"
    ]
  },
  {
    "label": "reports\\learning-simulator\\reports\\per-student\\strong_all_subjects_g3_7d.report.json#unit10",
    "relativePath": "reports\\learning-simulator\\reports\\per-student\\strong_all_subjects_g3_7d.report.json",
    "focusUnitIndex": 10,
    "scenarioId": "strong_all_subjects_g3_7d",
    "subject": "english",
    "unitDisplayName": "Writing",
    "currentSkillId": "",
    "currentSubskillId": "",
    "skillAlignmentConfidence": "",
    "skillAlignmentSource": "",
    "skillAlignmentWarnings": [],
    "metadataResolutionSource": "",
    "metadataSubjectFallback": false,
    "metadataSkillOnlyFallback": false,
    "metaLen": 0,
    "skillTaggingIncomplete": true,
    "nextAction": "pause_collect_more_data",
    "plannerStatus": "needs_human_review",
    "targetDifficulty": "standard",
    "questionCount": 3,
    "targetSkillId": "",
    "targetSubskillId": "",
    "requiresHumanReview": true,
    "reasonCodes": [
      "ENGLISH_SKILL_TAGGING_INCOMPLETE"
    ],
    "warnings": [
      "availableQuestionMetadata_missing"
    ]
  },
  {
    "label": "reports\\learning-simulator\\reports\\per-student\\strong_all_subjects_g3_7d.report.json#unit11",
    "relativePath": "reports\\learning-simulator\\reports\\per-student\\strong_all_subjects_g3_7d.report.json",
    "focusUnitIndex": 11,
    "scenarioId": "strong_all_subjects_g3_7d",
    "subject": "english",
    "unitDisplayName": "Sentence Building",
    "currentSkillId": "",
    "currentSubskillId": "",
    "skillAlignmentConfidence": "",
    "skillAlignmentSource": "",
    "skillAlignmentWarnings": [],
    "metadataResolutionSource": "",
    "metadataSubjectFallback": false,
    "metadataSkillOnlyFallback": false,
    "metaLen": 0,
    "skillTaggingIncomplete": true,
    "nextAction": "pause_collect_more_data",
    "plannerStatus": "needs_human_review",
    "targetDifficulty": "standard",
    "questionCount": 3,
    "targetSkillId": "",
    "targetSubskillId": "",
    "requiresHumanReview": true,
    "reasonCodes": [
      "ENGLISH_SKILL_TAGGING_INCOMPLETE"
    ],
    "warnings": [
      "availableQuestionMetadata_missing"
    ]
  },
  {
    "label": "reports\\learning-simulator\\reports\\per-student\\weak_english_grammar_g4_7d.report.json#unit0",
    "relativePath": "reports\\learning-simulator\\reports\\per-student\\weak_english_grammar_g4_7d.report.json",
    "focusUnitIndex": 0,
    "scenarioId": "weak_english_grammar_g4_7d",
    "subject": "english",
    "unitDisplayName": "Grammar",
    "currentSkillId": "",
    "currentSubskillId": "",
    "skillAlignmentConfidence": "",
    "skillAlignmentSource": "",
    "skillAlignmentWarnings": [],
    "metadataResolutionSource": "",
    "metadataSubjectFallback": false,
    "metadataSkillOnlyFallback": false,
    "metaLen": 0,
    "skillTaggingIncomplete": true,
    "nextAction": "pause_collect_more_data",
    "plannerStatus": "needs_human_review",
    "targetDifficulty": "standard",
    "questionCount": 3,
    "targetSkillId": "",
    "targetSubskillId": "",
    "requiresHumanReview": true,
    "reasonCodes": [
      "ENGLISH_SKILL_TAGGING_INCOMPLETE"
    ],
    "warnings": [
      "availableQuestionMetadata_missing"
    ]
  },
  {
    "label": "fixture:real_like_english_missing_skill_subskill",
    "relativePath": "fixture:real_like_english_missing_skill_subskill",
    "focusUnitIndex": 0,
    "scenarioId": "fixture_english_untagged",
    "subject": "english",
    "unitDisplayName": "Grammar",
    "currentSkillId": "",
    "currentSubskillId": "",
    "skillAlignmentConfidence": "",
    "skillAlignmentSource": "",
    "skillAlignmentWarnings": [],
    "metadataResolutionSource": "",
    "metadataSubjectFallback": false,
    "metadataSkillOnlyFallback": false,
    "metaLen": 0,
    "skillTaggingIncomplete": true,
    "nextAction": "pause_collect_more_data",
    "plannerStatus": "needs_human_review",
    "targetDifficulty": "standard",
    "questionCount": 3,
    "targetSkillId": "",
    "targetSubskillId": "",
    "requiresHumanReview": true,
    "reasonCodes": [
      "ENGLISH_SKILL_TAGGING_INCOMPLETE"
    ],
    "warnings": [
      "availableQuestionMetadata_missing"
    ]
  }
]
```

### Missing metadata (sample)
```json
[
  {
    "label": "reports\\learning-simulator\\deep\\per-student\\weak_english_grammar_g4_30d.report.json#unit0",
    "relativePath": "reports\\learning-simulator\\deep\\per-student\\weak_english_grammar_g4_30d.report.json",
    "focusUnitIndex": 0,
    "scenarioId": "weak_english_grammar_g4_30d",
    "subject": "english",
    "unitDisplayName": "Grammar",
    "currentSkillId": "",
    "currentSubskillId": "",
    "skillAlignmentConfidence": "",
    "skillAlignmentSource": "",
    "skillAlignmentWarnings": [],
    "metadataResolutionSource": "",
    "metadataSubjectFallback": false,
    "metadataSkillOnlyFallback": false,
    "metaLen": 0,
    "skillTaggingIncomplete": true,
    "nextAction": "pause_collect_more_data",
    "plannerStatus": "needs_human_review",
    "targetDifficulty": "standard",
    "questionCount": 3,
    "targetSkillId": "",
    "targetSubskillId": "",
    "requiresHumanReview": true,
    "reasonCodes": [
      "ENGLISH_SKILL_TAGGING_INCOMPLETE"
    ],
    "warnings": [
      "availableQuestionMetadata_missing"
    ]
  },
  {
    "label": "reports\\learning-simulator\\reports\\per-student\\strong_all_subjects_g3_7d.report.json#unit9",
    "relativePath": "reports\\learning-simulator\\reports\\per-student\\strong_all_subjects_g3_7d.report.json",
    "focusUnitIndex": 9,
    "scenarioId": "strong_all_subjects_g3_7d",
    "subject": "english",
    "unitDisplayName": "Vocabulary",
    "currentSkillId": "",
    "currentSubskillId": "",
    "skillAlignmentConfidence": "",
    "skillAlignmentSource": "",
    "skillAlignmentWarnings": [],
    "metadataResolutionSource": "",
    "metadataSubjectFallback": false,
    "metadataSkillOnlyFallback": false,
    "metaLen": 0,
    "skillTaggingIncomplete": true,
    "nextAction": "pause_collect_more_data",
    "plannerStatus": "needs_human_review",
    "targetDifficulty": "standard",
    "questionCount": 3,
    "targetSkillId": "",
    "targetSubskillId": "",
    "requiresHumanReview": true,
    "reasonCodes": [
      "ENGLISH_SKILL_TAGGING_INCOMPLETE"
    ],
    "warnings": [
      "availableQuestionMetadata_missing"
    ]
  },
  {
    "label": "reports\\learning-simulator\\reports\\per-student\\strong_all_subjects_g3_7d.report.json#unit10",
    "relativePath": "reports\\learning-simulator\\reports\\per-student\\strong_all_subjects_g3_7d.report.json",
    "focusUnitIndex": 10,
    "scenarioId": "strong_all_subjects_g3_7d",
    "subject": "english",
    "unitDisplayName": "Writing",
    "currentSkillId": "",
    "currentSubskillId": "",
    "skillAlignmentConfidence": "",
    "skillAlignmentSource": "",
    "skillAlignmentWarnings": [],
    "metadataResolutionSource": "",
    "metadataSubjectFallback": false,
    "metadataSkillOnlyFallback": false,
    "metaLen": 0,
    "skillTaggingIncomplete": true,
    "nextAction": "pause_collect_more_data",
    "plannerStatus": "needs_human_review",
    "targetDifficulty": "standard",
    "questionCount": 3,
    "targetSkillId": "",
    "targetSubskillId": "",
    "requiresHumanReview": true,
    "reasonCodes": [
      "ENGLISH_SKILL_TAGGING_INCOMPLETE"
    ],
    "warnings": [
      "availableQuestionMetadata_missing"
    ]
  },
  {
    "label": "reports\\learning-simulator\\reports\\per-student\\strong_all_subjects_g3_7d.report.json#unit11",
    "relativePath": "reports\\learning-simulator\\reports\\per-student\\strong_all_subjects_g3_7d.report.json",
    "focusUnitIndex": 11,
    "scenarioId": "strong_all_subjects_g3_7d",
    "subject": "english",
    "unitDisplayName": "Sentence Building",
    "currentSkillId": "",
    "currentSubskillId": "",
    "skillAlignmentConfidence": "",
    "skillAlignmentSource": "",
    "skillAlignmentWarnings": [],
    "metadataResolutionSource": "",
    "metadataSubjectFallback": false,
    "metadataSkillOnlyFallback": false,
    "metaLen": 0,
    "skillTaggingIncomplete": true,
    "nextAction": "pause_collect_more_data",
    "plannerStatus": "needs_human_review",
    "targetDifficulty": "standard",
    "questionCount": 3,
    "targetSkillId": "",
    "targetSubskillId": "",
    "requiresHumanReview": true,
    "reasonCodes": [
      "ENGLISH_SKILL_TAGGING_INCOMPLETE"
    ],
    "warnings": [
      "availableQuestionMetadata_missing"
    ]
  },
  {
    "label": "reports\\learning-simulator\\reports\\per-student\\weak_english_grammar_g4_7d.report.json#unit0",
    "relativePath": "reports\\learning-simulator\\reports\\per-student\\weak_english_grammar_g4_7d.report.json",
    "focusUnitIndex": 0,
    "scenarioId": "weak_english_grammar_g4_7d",
    "subject": "english",
    "unitDisplayName": "Grammar",
    "currentSkillId": "",
    "currentSubskillId": "",
    "skillAlignmentConfidence": "",
    "skillAlignmentSource": "",
    "skillAlignmentWarnings": [],
    "metadataResolutionSource": "",
    "metadataSubjectFallback": false,
    "metadataSkillOnlyFallback": false,
    "metaLen": 0,
    "skillTaggingIncomplete": true,
    "nextAction": "pause_collect_more_data",
    "plannerStatus": "needs_human_review",
    "targetDifficulty": "standard",
    "questionCount": 3,
    "targetSkillId": "",
    "targetSubskillId": "",
    "requiresHumanReview": true,
    "reasonCodes": [
      "ENGLISH_SKILL_TAGGING_INCOMPLETE"
    ],
    "warnings": [
      "availableQuestionMetadata_missing"
    ]
  },
  {
    "label": "fixture:real_like_english_missing_skill_subskill",
    "relativePath": "fixture:real_like_english_missing_skill_subskill",
    "focusUnitIndex": 0,
    "scenarioId": "fixture_english_untagged",
    "subject": "english",
    "unitDisplayName": "Grammar",
    "currentSkillId": "",
    "currentSubskillId": "",
    "skillAlignmentConfidence": "",
    "skillAlignmentSource": "",
    "skillAlignmentWarnings": [],
    "metadataResolutionSource": "",
    "metadataSubjectFallback": false,
    "metadataSkillOnlyFallback": false,
    "metaLen": 0,
    "skillTaggingIncomplete": true,
    "nextAction": "pause_collect_more_data",
    "plannerStatus": "needs_human_review",
    "targetDifficulty": "standard",
    "questionCount": 3,
    "targetSkillId": "",
    "targetSubskillId": "",
    "requiresHumanReview": true,
    "reasonCodes": [
      "ENGLISH_SKILL_TAGGING_INCOMPLETE"
    ],
    "warnings": [
      "availableQuestionMetadata_missing"
    ]
  }
]
```

### needs_human_review (sample)
```json
[
  {
    "label": "reports\\learning-simulator\\deep\\per-student\\weak_english_grammar_g4_30d.report.json#unit0",
    "relativePath": "reports\\learning-simulator\\deep\\per-student\\weak_english_grammar_g4_30d.report.json",
    "focusUnitIndex": 0,
    "scenarioId": "weak_english_grammar_g4_30d",
    "subject": "english",
    "unitDisplayName": "Grammar",
    "currentSkillId": "",
    "currentSubskillId": "",
    "skillAlignmentConfidence": "",
    "skillAlignmentSource": "",
    "skillAlignmentWarnings": [],
    "metadataResolutionSource": "",
    "metadataSubjectFallback": false,
    "metadataSkillOnlyFallback": false,
    "metaLen": 0,
    "skillTaggingIncomplete": true,
    "nextAction": "pause_collect_more_data",
    "plannerStatus": "needs_human_review",
    "targetDifficulty": "standard",
    "questionCount": 3,
    "targetSkillId": "",
    "targetSubskillId": "",
    "requiresHumanReview": true,
    "reasonCodes": [
      "ENGLISH_SKILL_TAGGING_INCOMPLETE"
    ],
    "warnings": [
      "availableQuestionMetadata_missing"
    ]
  },
  {
    "label": "reports\\learning-simulator\\reports\\per-student\\strong_all_subjects_g3_7d.report.json#unit9",
    "relativePath": "reports\\learning-simulator\\reports\\per-student\\strong_all_subjects_g3_7d.report.json",
    "focusUnitIndex": 9,
    "scenarioId": "strong_all_subjects_g3_7d",
    "subject": "english",
    "unitDisplayName": "Vocabulary",
    "currentSkillId": "",
    "currentSubskillId": "",
    "skillAlignmentConfidence": "",
    "skillAlignmentSource": "",
    "skillAlignmentWarnings": [],
    "metadataResolutionSource": "",
    "metadataSubjectFallback": false,
    "metadataSkillOnlyFallback": false,
    "metaLen": 0,
    "skillTaggingIncomplete": true,
    "nextAction": "pause_collect_more_data",
    "plannerStatus": "needs_human_review",
    "targetDifficulty": "standard",
    "questionCount": 3,
    "targetSkillId": "",
    "targetSubskillId": "",
    "requiresHumanReview": true,
    "reasonCodes": [
      "ENGLISH_SKILL_TAGGING_INCOMPLETE"
    ],
    "warnings": [
      "availableQuestionMetadata_missing"
    ]
  },
  {
    "label": "reports\\learning-simulator\\reports\\per-student\\strong_all_subjects_g3_7d.report.json#unit10",
    "relativePath": "reports\\learning-simulator\\reports\\per-student\\strong_all_subjects_g3_7d.report.json",
    "focusUnitIndex": 10,
    "scenarioId": "strong_all_subjects_g3_7d",
    "subject": "english",
    "unitDisplayName": "Writing",
    "currentSkillId": "",
    "currentSubskillId": "",
    "skillAlignmentConfidence": "",
    "skillAlignmentSource": "",
    "skillAlignmentWarnings": [],
    "metadataResolutionSource": "",
    "metadataSubjectFallback": false,
    "metadataSkillOnlyFallback": false,
    "metaLen": 0,
    "skillTaggingIncomplete": true,
    "nextAction": "pause_collect_more_data",
    "plannerStatus": "needs_human_review",
    "targetDifficulty": "standard",
    "questionCount": 3,
    "targetSkillId": "",
    "targetSubskillId": "",
    "requiresHumanReview": true,
    "reasonCodes": [
      "ENGLISH_SKILL_TAGGING_INCOMPLETE"
    ],
    "warnings": [
      "availableQuestionMetadata_missing"
    ]
  },
  {
    "label": "reports\\learning-simulator\\reports\\per-student\\strong_all_subjects_g3_7d.report.json#unit11",
    "relativePath": "reports\\learning-simulator\\reports\\per-student\\strong_all_subjects_g3_7d.report.json",
    "focusUnitIndex": 11,
    "scenarioId": "strong_all_subjects_g3_7d",
    "subject": "english",
    "unitDisplayName": "Sentence Building",
    "currentSkillId": "",
    "currentSubskillId": "",
    "skillAlignmentConfidence": "",
    "skillAlignmentSource": "",
    "skillAlignmentWarnings": [],
    "metadataResolutionSource": "",
    "metadataSubjectFallback": false,
    "metadataSkillOnlyFallback": false,
    "metaLen": 0,
    "skillTaggingIncomplete": true,
    "nextAction": "pause_collect_more_data",
    "plannerStatus": "needs_human_review",
    "targetDifficulty": "standard",
    "questionCount": 3,
    "targetSkillId": "",
    "targetSubskillId": "",
    "requiresHumanReview": true,
    "reasonCodes": [
      "ENGLISH_SKILL_TAGGING_INCOMPLETE"
    ],
    "warnings": [
      "availableQuestionMetadata_missing"
    ]
  },
  {
    "label": "reports\\learning-simulator\\reports\\per-student\\weak_english_grammar_g4_7d.report.json#unit0",
    "relativePath": "reports\\learning-simulator\\reports\\per-student\\weak_english_grammar_g4_7d.report.json",
    "focusUnitIndex": 0,
    "scenarioId": "weak_english_grammar_g4_7d",
    "subject": "english",
    "unitDisplayName": "Grammar",
    "currentSkillId": "",
    "currentSubskillId": "",
    "skillAlignmentConfidence": "",
    "skillAlignmentSource": "",
    "skillAlignmentWarnings": [],
    "metadataResolutionSource": "",
    "metadataSubjectFallback": false,
    "metadataSkillOnlyFallback": false,
    "metaLen": 0,
    "skillTaggingIncomplete": true,
    "nextAction": "pause_collect_more_data",
    "plannerStatus": "needs_human_review",
    "targetDifficulty": "standard",
    "questionCount": 3,
    "targetSkillId": "",
    "targetSubskillId": "",
    "requiresHumanReview": true,
    "reasonCodes": [
      "ENGLISH_SKILL_TAGGING_INCOMPLETE"
    ],
    "warnings": [
      "availableQuestionMetadata_missing"
    ]
  },
  {
    "label": "fixture:real_like_english_missing_skill_subskill",
    "relativePath": "fixture:real_like_english_missing_skill_subskill",
    "focusUnitIndex": 0,
    "scenarioId": "fixture_english_untagged",
    "subject": "english",
    "unitDisplayName": "Grammar",
    "currentSkillId": "",
    "currentSubskillId": "",
    "skillAlignmentConfidence": "",
    "skillAlignmentSource": "",
    "skillAlignmentWarnings": [],
    "metadataResolutionSource": "",
    "metadataSubjectFallback": false,
    "metadataSkillOnlyFallback": false,
    "metaLen": 0,
    "skillTaggingIncomplete": true,
    "nextAction": "pause_collect_more_data",
    "plannerStatus": "needs_human_review",
    "targetDifficulty": "standard",
    "questionCount": 3,
    "targetSkillId": "",
    "targetSubskillId": "",
    "requiresHumanReview": true,
    "reasonCodes": [
      "ENGLISH_SKILL_TAGGING_INCOMPLETE"
    ],
    "warnings": [
      "availableQuestionMetadata_missing"
    ]
  }
]
```

### Rows with adapter warnings (sample)
```json
[
  {
    "label": "reports\\learning-simulator\\deep\\per-student\\weak_english_grammar_g4_30d.report.json#unit0",
    "relativePath": "reports\\learning-simulator\\deep\\per-student\\weak_english_grammar_g4_30d.report.json",
    "focusUnitIndex": 0,
    "scenarioId": "weak_english_grammar_g4_30d",
    "subject": "english",
    "unitDisplayName": "Grammar",
    "currentSkillId": "",
    "currentSubskillId": "",
    "skillAlignmentConfidence": "",
    "skillAlignmentSource": "",
    "skillAlignmentWarnings": [],
    "metadataResolutionSource": "",
    "metadataSubjectFallback": false,
    "metadataSkillOnlyFallback": false,
    "metaLen": 0,
    "skillTaggingIncomplete": true,
    "nextAction": "pause_collect_more_data",
    "plannerStatus": "needs_human_review",
    "targetDifficulty": "standard",
    "questionCount": 3,
    "targetSkillId": "",
    "targetSubskillId": "",
    "requiresHumanReview": true,
    "reasonCodes": [
      "ENGLISH_SKILL_TAGGING_INCOMPLETE"
    ],
    "warnings": [
      "availableQuestionMetadata_missing"
    ]
  },
  {
    "label": "reports\\learning-simulator\\reports\\per-student\\strong_all_subjects_g3_7d.report.json#unit6",
    "relativePath": "reports\\learning-simulator\\reports\\per-student\\strong_all_subjects_g3_7d.report.json",
    "focusUnitIndex": 6,
    "scenarioId": "strong_all_subjects_g3_7d",
    "subject": "geometry",
    "unitDisplayName": "היקף",
    "currentSkillId": "",
    "currentSubskillId": "",
    "skillAlignmentConfidence": "",
    "skillAlignmentSource": "",
    "skillAlignmentWarnings": [],
    "metadataResolutionSource": "metadataIndex",
    "metadataSubjectFallback": true,
    "metadataSkillOnlyFallback": false,
    "metaLen": 14,
    "skillTaggingIncomplete": false,
    "nextAction": "pause_collect_more_data",
    "plannerStatus": "caution",
    "targetDifficulty": "basic",
    "questionCount": 3,
    "targetSkillId": "",
    "targetSubskillId": "",
    "requiresHumanReview": false,
    "reasonCodes": [
      "THIN_DATA",
      "DO_NOT_CONCLUDE"
    ],
    "warnings": [
      "metadata_subject_fallback"
    ]
  },
  {
    "label": "reports\\learning-simulator\\reports\\per-student\\strong_all_subjects_g3_7d.report.json#unit7",
    "relativePath": "reports\\learning-simulator\\reports\\per-student\\strong_all_subjects_g3_7d.report.json",
    "focusUnitIndex": 7,
    "scenarioId": "strong_all_subjects_g3_7d",
    "subject": "geometry",
    "unitDisplayName": "מקבילות ומאונכות",
    "currentSkillId": "",
    "currentSubskillId": "",
    "skillAlignmentConfidence": "",
    "skillAlignmentSource": "",
    "skillAlignmentWarnings": [],
    "metadataResolutionSource": "metadataIndex",
    "metadataSubjectFallback": true,
    "metadataSkillOnlyFallback": false,
    "metaLen": 14,
    "skillTaggingIncomplete": false,
    "nextAction": "pause_collect_more_data",
    "plannerStatus": "caution",
    "targetDifficulty": "basic",
    "questionCount": 3,
    "targetSkillId": "",
    "targetSubskillId": "",
    "requiresHumanReview": false,
    "reasonCodes": [
      "THIN_DATA",
      "DO_NOT_CONCLUDE"
    ],
    "warnings": [
      "metadata_subject_fallback"
    ]
  },
  {
    "label": "reports\\learning-simulator\\reports\\per-student\\strong_all_subjects_g3_7d.report.json#unit9",
    "relativePath": "reports\\learning-simulator\\reports\\per-student\\strong_all_subjects_g3_7d.report.json",
    "focusUnitIndex": 9,
    "scenarioId": "strong_all_subjects_g3_7d",
    "subject": "english",
    "unitDisplayName": "Vocabulary",
    "currentSkillId": "",
    "currentSubskillId": "",
    "skillAlignmentConfidence": "",
    "skillAlignmentSource": "",
    "skillAlignmentWarnings": [],
    "metadataResolutionSource": "",
    "metadataSubjectFallback": false,
    "metadataSkillOnlyFallback": false,
    "metaLen": 0,
    "skillTaggingIncomplete": true,
    "nextAction": "pause_collect_more_data",
    "plannerStatus": "needs_human_review",
    "targetDifficulty": "standard",
    "questionCount": 3,
    "targetSkillId": "",
    "targetSubskillId": "",
    "requiresHumanReview": true,
    "reasonCodes": [
      "ENGLISH_SKILL_TAGGING_INCOMPLETE"
    ],
    "warnings": [
      "availableQuestionMetadata_missing"
    ]
  },
  {
    "label": "reports\\learning-simulator\\reports\\per-student\\strong_all_subjects_g3_7d.report.json#unit10",
    "relativePath": "reports\\learning-simulator\\reports\\per-student\\strong_all_subjects_g3_7d.report.json",
    "focusUnitIndex": 10,
    "scenarioId": "strong_all_subjects_g3_7d",
    "subject": "english",
    "unitDisplayName": "Writing",
    "currentSkillId": "",
    "currentSubskillId": "",
    "skillAlignmentConfidence": "",
    "skillAlignmentSource": "",
    "skillAlignmentWarnings": [],
    "metadataResolutionSource": "",
    "metadataSubjectFallback": false,
    "metadataSkillOnlyFallback": false,
    "metaLen": 0,
    "skillTaggingIncomplete": true,
    "nextAction": "pause_collect_more_data",
    "plannerStatus": "needs_human_review",
    "targetDifficulty": "standard",
    "questionCount": 3,
    "targetSkillId": "",
    "targetSubskillId": "",
    "requiresHumanReview": true,
    "reasonCodes": [
      "ENGLISH_SKILL_TAGGING_INCOMPLETE"
    ],
    "warnings": [
      "availableQuestionMetadata_missing"
    ]
  },
  {
    "label": "reports\\learning-simulator\\reports\\per-student\\strong_all_subjects_g3_7d.report.json#unit11",
    "relativePath": "reports\\learning-simulator\\reports\\per-student\\strong_all_subjects_g3_7d.report.json",
    "focusUnitIndex": 11,
    "scenarioId": "strong_all_subjects_g3_7d",
    "subject": "english",
    "unitDisplayName": "Sentence Building",
    "currentSkillId": "",
    "currentSubskillId": "",
    "skillAlignmentConfidence": "",
    "skillAlignmentSource": "",
    "skillAlignmentWarnings": [],
    "metadataResolutionSource": "",
    "metadataSubjectFallback": false,
    "metadataSkillOnlyFallback": false,
    "metaLen": 0,
    "skillTaggingIncomplete": true,
    "nextAction": "pause_collect_more_data",
    "plannerStatus": "needs_human_review",
    "targetDifficulty": "standard",
    "questionCount": 3,
    "targetSkillId": "",
    "targetSubskillId": "",
    "requiresHumanReview": true,
    "reasonCodes": [
      "ENGLISH_SKILL_TAGGING_INCOMPLETE"
    ],
    "warnings": [
      "availableQuestionMetadata_missing"
    ]
  },
  {
    "label": "reports\\learning-simulator\\reports\\per-student\\weak_english_grammar_g4_7d.report.json#unit0",
    "relativePath": "reports\\learning-simulator\\reports\\per-student\\weak_english_grammar_g4_7d.report.json",
    "focusUnitIndex": 0,
    "scenarioId": "weak_english_grammar_g4_7d",
    "subject": "english",
    "unitDisplayName": "Grammar",
    "currentSkillId": "",
    "currentSubskillId": "",
    "skillAlignmentConfidence": "",
    "skillAlignmentSource": "",
    "skillAlignmentWarnings": [],
    "metadataResolutionSource": "",
    "metadataSubjectFallback": false,
    "metadataSkillOnlyFallback": false,
    "metaLen": 0,
    "skillTaggingIncomplete": true,
    "nextAction": "pause_collect_more_data",
    "plannerStatus": "needs_human_review",
    "targetDifficulty": "standard",
    "questionCount": 3,
    "targetSkillId": "",
    "targetSubskillId": "",
    "requiresHumanReview": true,
    "reasonCodes": [
      "ENGLISH_SKILL_TAGGING_INCOMPLETE"
    ],
    "warnings": [
      "availableQuestionMetadata_missing"
    ]
  },
  {
    "label": "fixture:real_like_english_missing_skill_subskill",
    "relativePath": "fixture:real_like_english_missing_skill_subskill",
    "focusUnitIndex": 0,
    "scenarioId": "fixture_english_untagged",
    "subject": "english",
    "unitDisplayName": "Grammar",
    "currentSkillId": "",
    "currentSubskillId": "",
    "skillAlignmentConfidence": "",
    "skillAlignmentSource": "",
    "skillAlignmentWarnings": [],
    "metadataResolutionSource": "",
    "metadataSubjectFallback": false,
    "metadataSkillOnlyFallback": false,
    "metaLen": 0,
    "skillTaggingIncomplete": true,
    "nextAction": "pause_collect_more_data",
    "plannerStatus": "needs_human_review",
    "targetDifficulty": "standard",
    "questionCount": 3,
    "targetSkillId": "",
    "targetSubskillId": "",
    "requiresHumanReview": true,
    "reasonCodes": [
      "ENGLISH_SKILL_TAGGING_INCOMPLETE"
    ],
    "warnings": [
      "availableQuestionMetadata_missing"
    ]
  }
]
```

## F. Recommendation

**Can preview internally now**
- Use preview-pack.md to review planner nextAction / plannerStatus mixes on real simulator report artifacts.
- Safe to use for internal planning discussions: no live routing, no bank or engine changes.

**Should not go live yet**
- Do not expose planner output as student-facing or parent-facing Hebrew product copy without a dedicated copy layer.
- English and missing-metadata rows still require human review before any automated routing.

**Must improve before live routing**
- Reduce metadataSubjectFallback and availableQuestionMetadata_missing for subjects targeted for automation.
- Raise skillAlignmentCoverage for subjects where topic_mapping is insufficient.
- Keep safetyViolationCount at 0 in artifact runs before enabling any live integration.
