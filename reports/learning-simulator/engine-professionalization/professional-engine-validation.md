# Professional engine validation

- **Overall:** PASS
- **Scenarios:** 22

## strong_all_subjects

- **Result:** PASS
- **Expected:** High volume all subjects; no false emerging at volume; readiness not thin-data.
- **Snapshot:** ```json
{
  "engineConfidence": "high",
  "engineReadiness": "ready_for_internal_review",
  "reliabilityGuessing": 0,
  "reliabilityInconsistency": "low",
  "crossSubjectPatternCount": 0,
  "dependencyItems": 0,
  "masteryBandsSample": [
    "math/arithmetic_operations:near_mastery",
    "hebrew/reading_comprehension:near_mastery",
    "english/grammar:near_mastery",
    "science/experiments:near_mastery"
  ]
}
```

## weak_all_subjects

- **Result:** PASS
- **Expected:** Multiple weak skill bands across subjects.
- **Snapshot:** ```json
{
  "engineConfidence": "high",
  "engineReadiness": "ready_for_internal_review",
  "reliabilityGuessing": 0,
  "reliabilityInconsistency": "low",
  "crossSubjectPatternCount": 2,
  "dependencyItems": 6,
  "masteryBandsSample": [
    "math/arithmetic_operations:emerging",
    "hebrew/reading_comprehension:emerging",
    "english/grammar:emerging",
    "science/experiments:emerging"
  ]
}
```

## weak_math_fractions

- **Result:** PASS
- **Expected:** Fractions skill shows weakness band.
- **Snapshot:** ```json
{
  "engineConfidence": "medium",
  "engineReadiness": "ready_for_internal_review",
  "reliabilityGuessing": 0,
  "reliabilityInconsistency": "low",
  "crossSubjectPatternCount": 0,
  "dependencyItems": 1,
  "masteryBandsSample": [
    "math/fractions:emerging"
  ]
}
```

## weak_hebrew_comprehension

- **Result:** PASS
- **Expected:** Hebrew reading_comprehension mastery signal below threshold.
- **Snapshot:** ```json
{
  "engineConfidence": "low",
  "engineReadiness": "needs_more_data",
  "reliabilityGuessing": 0,
  "reliabilityInconsistency": "low",
  "crossSubjectPatternCount": 0,
  "dependencyItems": 1,
  "masteryBandsSample": [
    "hebrew/reading_comprehension:emerging"
  ]
}
```

## weak_english_grammar

- **Result:** PASS
- **Expected:** English grammar skill row present with weak accuracy.
- **Snapshot:** ```json
{
  "engineConfidence": "low",
  "engineReadiness": "needs_more_data",
  "reliabilityGuessing": 0,
  "reliabilityInconsistency": "low",
  "crossSubjectPatternCount": 0,
  "dependencyItems": 1,
  "masteryBandsSample": [
    "english/grammar:emerging"
  ]
}
```

## weak_science_experiments

- **Result:** PASS
- **Expected:** Science experiments bucket mapped to experiments skill.
- **Snapshot:** ```json
{
  "engineConfidence": "low",
  "engineReadiness": "needs_more_data",
  "reliabilityGuessing": 0,
  "reliabilityInconsistency": "low",
  "crossSubjectPatternCount": 0,
  "dependencyItems": 1,
  "masteryBandsSample": [
    "science/experiments:emerging"
  ]
}
```

## weak_geometry_area

- **Result:** PASS
- **Expected:** Geometry area weakness captured.
- **Snapshot:** ```json
{
  "engineConfidence": "medium",
  "engineReadiness": "ready_for_internal_review",
  "reliabilityGuessing": 0,
  "reliabilityInconsistency": "low",
  "crossSubjectPatternCount": 0,
  "dependencyItems": 1,
  "masteryBandsSample": [
    "geometry/area:emerging"
  ]
}
```

## weak_moledet_geography_maps

- **Result:** PASS
- **Expected:** Moledet maps skill weakness.
- **Snapshot:** ```json
{
  "engineConfidence": "medium",
  "engineReadiness": "ready_for_internal_review",
  "reliabilityGuessing": 0,
  "reliabilityInconsistency": "low",
  "crossSubjectPatternCount": 0,
  "dependencyItems": 1,
  "masteryBandsSample": [
    "moledet-geography/maps:emerging"
  ]
}
```

## thin_data

- **Result:** PASS
- **Expected:** Thin total volume → needs_more_data, low confidence, no mastered band.
- **Snapshot:** ```json
{
  "engineConfidence": "low",
  "engineReadiness": "needs_more_data",
  "reliabilityGuessing": 0,
  "reliabilityInconsistency": "high",
  "crossSubjectPatternCount": 0,
  "dependencyItems": 1,
  "masteryBandsSample": [
    "math/arithmetic_operations:emerging"
  ]
}
```

## random_guessing

- **Result:** PASS
- **Expected:** Fast wrong mistakes elevate guessing likelihood.
- **Snapshot:** ```json
{
  "engineConfidence": "low",
  "engineReadiness": "ready_for_internal_review",
  "reliabilityGuessing": 1,
  "reliabilityInconsistency": "medium",
  "crossSubjectPatternCount": 0,
  "dependencyItems": 1,
  "masteryBandsSample": [
    "math/arithmetic_operations:emerging"
  ]
}
```

## inconsistent

- **Result:** PASS
- **Expected:** Wide row accuracy spread triggers inconsistency signal.
- **Snapshot:** ```json
{
  "engineConfidence": "medium",
  "engineReadiness": "ready_for_internal_review",
  "reliabilityGuessing": 0,
  "reliabilityInconsistency": "medium",
  "crossSubjectPatternCount": 0,
  "dependencyItems": 1,
  "masteryBandsSample": [
    "math/arithmetic_operations:near_mastery",
    "math/fractions:emerging"
  ]
}
```

## fast_wrong

- **Result:** PASS
- **Expected:** Very fast wrong responses drive guessing / pace signal.
- **Snapshot:** ```json
{
  "engineConfidence": "low",
  "engineReadiness": "ready_for_internal_review",
  "reliabilityGuessing": 1,
  "reliabilityInconsistency": "medium",
  "crossSubjectPatternCount": 0,
  "dependencyItems": 1,
  "masteryBandsSample": [
    "math/arithmetic_operations:emerging"
  ]
}
```

## slow_correct

- **Result:** PASS
- **Expected:** Slow correct events must not be framed as weakness (reasoning includes safeguard).
- **Snapshot:** ```json
{
  "engineConfidence": "medium",
  "engineReadiness": "ready_for_internal_review",
  "reliabilityGuessing": 0,
  "reliabilityInconsistency": "low",
  "crossSubjectPatternCount": 0,
  "dependencyItems": 0,
  "masteryBandsSample": [
    "math/arithmetic_operations:near_mastery"
  ]
}
```

## improving

- **Result:** PASS
- **Expected:** Up trend on row propagates to mastery trend improving.
- **Snapshot:** ```json
{
  "engineConfidence": "low",
  "engineReadiness": "needs_more_data",
  "reliabilityGuessing": 0,
  "reliabilityInconsistency": "low",
  "crossSubjectPatternCount": 0,
  "dependencyItems": 1,
  "masteryBandsSample": [
    "math/word_problems:emerging"
  ]
}
```

## declining

- **Result:** PASS
- **Expected:** Down trend propagates.
- **Snapshot:** ```json
{
  "engineConfidence": "low",
  "engineReadiness": "needs_more_data",
  "reliabilityGuessing": 0,
  "reliabilityInconsistency": "low",
  "crossSubjectPatternCount": 0,
  "dependencyItems": 1,
  "masteryBandsSample": [
    "math/word_problems:emerging"
  ]
}
```

## mixed_strengths

- **Result:** PASS
- **Expected:** Math strong vs Hebrew weak separation.
- **Snapshot:** ```json
{
  "engineConfidence": "medium",
  "engineReadiness": "ready_for_internal_review",
  "reliabilityGuessing": 0,
  "reliabilityInconsistency": "medium",
  "crossSubjectPatternCount": 0,
  "dependencyItems": 1,
  "masteryBandsSample": [
    "math/arithmetic_operations:near_mastery",
    "hebrew/reading_comprehension:emerging"
  ]
}
```

## cross_subject_instruction_overlap

- **Result:** PASS
- **Expected:** Cross-subject pattern only when both subjects have volume + weakness.
- **Snapshot:** ```json
{
  "engineConfidence": "medium",
  "engineReadiness": "ready_for_internal_review",
  "reliabilityGuessing": 0,
  "reliabilityInconsistency": "low",
  "crossSubjectPatternCount": 1,
  "dependencyItems": 2,
  "masteryBandsSample": [
    "math/word_problems:emerging",
    "hebrew/reading_comprehension:emerging"
  ]
}
```

## prerequisite_gap

- **Result:** PASS
- **Expected:** Weak fractions with weak arithmetic prerequisite → prerequisite gap + probe target.
- **Snapshot:** ```json
{
  "engineConfidence": "medium",
  "engineReadiness": "ready_for_internal_review",
  "reliabilityGuessing": 0,
  "reliabilityInconsistency": "low",
  "crossSubjectPatternCount": 0,
  "dependencyItems": 2,
  "masteryBandsSample": [
    "math/fractions:emerging",
    "math/arithmetic_operations:emerging"
  ]
}
```

## prerequisite_direct_skill_gap

- **Result:** PASS
- **Expected:** Strong prerequisites + weak fractions → direct focal skill hypothesis.
- **Snapshot:** ```json
{
  "engineConfidence": "low",
  "engineReadiness": "ready_for_internal_review",
  "reliabilityGuessing": 0,
  "reliabilityInconsistency": "high",
  "crossSubjectPatternCount": 0,
  "dependencyItems": 1,
  "masteryBandsSample": [
    "math/fractions:emerging",
    "math/arithmetic_operations:near_mastery",
    "math/number_sense:near_mastery"
  ]
}
```

## misconception_repeat

- **Result:** PASS
- **Expected:** Repeated tagged misconceptions lift confidence and trigger misconception probe.
- **Snapshot:** ```json
{
  "engineConfidence": "low",
  "engineReadiness": "needs_more_data",
  "reliabilityGuessing": 0,
  "reliabilityInconsistency": "low",
  "crossSubjectPatternCount": 0,
  "dependencyItems": 1,
  "masteryBandsSample": [
    "math/fractions:emerging"
  ]
}
```

## mastery_decay_retention

- **Result:** PASS
- **Expected:** Old lastSessionMs on strong skill → retention_risk band.
- **Snapshot:** ```json
{
  "engineConfidence": "medium",
  "engineReadiness": "ready_for_internal_review",
  "reliabilityGuessing": 0,
  "reliabilityInconsistency": "low",
  "crossSubjectPatternCount": 0,
  "dependencyItems": 0,
  "masteryBandsSample": [
    "math/arithmetic_operations:retention_risk"
  ]
}
```

## difficulty_calibration_easy_only

- **Result:** PASS
- **Expected:** Easy-only high accuracy does not grant full mastery; calibration flags easy-only profile.
- **Snapshot:** ```json
{
  "engineConfidence": "medium",
  "engineReadiness": "ready_for_internal_review",
  "reliabilityGuessing": 0,
  "reliabilityInconsistency": "low",
  "crossSubjectPatternCount": 0,
  "dependencyItems": 0,
  "masteryBandsSample": [
    "math/arithmetic_operations:developing"
  ]
}
```

