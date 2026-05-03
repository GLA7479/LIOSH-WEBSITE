# Adaptive Planner — Internal Preview Pack

_Non-live artifact. Not student-facing. Generated: **2026-05-03T20:34:07.299Z**_

## A. Executive summary

| Metric | Value |
|--------|-------|
| Total planner runs | 126 |
| safetyViolationCount | 0 |
| metadataExactMatchCount | 126 |
| metadataSkillSubskillMatchCount | 126 |
| metadataSubjectFallbackCount | 0 |
| metadataSubjectFallbackBaselineCount | 117 |
| afterAvailableQuestionMetadataMissingCount | 0 |
| needsHumanReviewCount | 0 |
| skillAlignmentCoverage | 1 |
| Planner status — ready / caution | 4 / 122 |
| englishSkillTaggingIncompleteCount | 0 |

### skillAlignmentBySource

```json
{
  "topic_mapping": 115,
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
| 5 | pause_collect_more_data | caution | english | topic_mapping | metadataIndex |
| 2 | pause_collect_more_data | caution | hebrew | topic_mapping | metadataIndex |
| 2 | pause_collect_more_data | caution | moledet-geography | topic_mapping | metadataIndex |
| 2 | pause_collect_more_data | caution | science | topic_mapping | metadataIndex |
| 2 | pause_collect_more_data | caution | geometry | topic_mapping | metadataIndex |
| 1 | practice_current | ready | math | unit_field | metadataIndex |
| 1 | pause_collect_more_data | caution | geometry | unit_field | metadataIndex |
| 1 | practice_current | ready | english | topic_mapping | metadataIndex |
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
  },
  {
    "label": "fixture:real_like_english_missing_skill_subskill",
    "relativePath": "fixture:real_like_english_missing_skill_subskill",
    "focusUnitIndex": 0,
    "scenarioId": "fixture_english_untagged",
    "subject": "english",
    "unitDisplayName": "Grammar",
    "currentSkillId": "en_grammar_be_present",
    "currentSubskillId": "be_basic",
    "skillAlignmentConfidence": "inferred_safe",
    "skillAlignmentSource": "topic_mapping",
    "skillAlignmentWarnings": [],
    "metadataResolutionSource": "metadataIndex",
    "metadataSubjectFallback": false,
    "metadataSkillOnlyFallback": false,
    "metaLen": 4,
    "skillTaggingIncomplete": false,
    "nextAction": "practice_current",
    "plannerStatus": "ready",
    "targetDifficulty": "basic",
    "questionCount": 5,
    "targetSkillId": "en_grammar_be_present",
    "targetSubskillId": "be_basic",
    "requiresHumanReview": false,
    "reasonCodes": [
      "REMEDIATE"
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

_No matching rows in this artifact run._

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

_No matching rows in this artifact run._

### English skillTaggingIncomplete

_No matching rows in this artifact run._

### Missing question metadata

_No matching rows in this artifact run._

## D. Readiness by subject

| Subject | Runs | Exact | Fallback | Missing meta | needs_human_review | ready | caution | Recommended |
|---------|-----:|------:|---------:|-------------:|-------------------:|------:|--------:|-------------|
| math | 103 | 103 | 0 | 0 | 0 | 2 | 101 | **ready_for_internal_preview** |
| geometry | 10 | 10 | 0 | 0 | 0 | 0 | 10 | **ready_for_internal_preview** |
| english | 6 | 6 | 0 | 0 | 0 | 1 | 5 | **ready_for_internal_preview** |
| hebrew | 3 | 3 | 0 | 0 | 0 | 1 | 2 | **ready_for_internal_preview** |
| moledet-geography | 2 | 2 | 0 | 0 | 0 | 0 | 2 | **ready_for_internal_preview** |
| science | 2 | 2 | 0 | 0 | 0 | 0 | 2 | **ready_for_internal_preview** |

## E. Risk list (truncated)

### Subject fallback (sample)
```json
[]
```

### English untagged (sample)
```json
[]
```

### Missing metadata (sample)
```json
[]
```

### needs_human_review (sample)
```json
[]
```

### Rows with adapter warnings (sample)
```json
[]
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
