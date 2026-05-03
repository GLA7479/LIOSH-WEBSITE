# Scenario: strong_all_subjects

**Disclaimer:** This is an internal educational diagnostic support review artifact. It is **not** a clinical or medical diagnosis. It is **not** a parent-facing report.

## 1. Scenario identity

- **Scenario id:** `strong_all_subjects`
- **Scenario type:** strong_profile
- **Subject(s):** math, hebrew, english, science, geometry, moledet-geography
- **Intended signal:** High volume all subjects; no false emerging at volume; readiness not thin-data.

## 2. Expected vs actual

- **Expected:** High volume all subjects; no false emerging at volume; readiness not thin-data.
- **Pass / fail (validation):** PASS
- **engineConfidence:** high
- **engineReadiness:** ready_for_internal_review

### skillFindings (framework) / subskillFindings

```json
{
  "skillFindings": [
    {
      "findingType": "topic_signal",
      "subjectId": "math",
      "topicId": "addition",
      "skillId": "arithmetic_operations",
      "evidenceLevel": "medium",
      "confidence": "medium",
      "basedOn": {
        "questionCount": 45,
        "accuracy": 93,
        "sessionsApprox": null,
        "trend": "unknown",
        "comparedToSubjectAverage": 0
      },
      "reasoning": [
        "Observed topic accuracy is approximately 93% over 45 questions in-window.",
        "Subject-level question volume in-window is approximately 45.",
        "Dominant behavior signal on the row: undetermined (informational, not a diagnosis)."
      ],
      "doNotConclude": [
        "Subject-wide weakness is not asserted from a single weak topic; other topics in this subject should show weakness across multiple skills."
      ],
      "nextAction": {
        "type": "targeted_practice"
      },
      "frameworkMeta": {
        "frameworkVersion": "1.1.0",
        "skillPackKey": "arithmetic_operations",
        "subskillsAvailable": [
          "addition",
          "subtraction",
          "multiplication",
          "division",
          "order_of_operations"
        ],
        "errorTypesConsidered": [
          "calculation_error"
        ]
      }
    },
    {
      "findingType": "topic_signal",
      "subjectId": "hebrew",
      "topicId": "comprehension",
      "skillId": "reading_comprehension",
      "evidenceLevel": "medium",
      "confidence": "medium",
      "basedOn": {
        "questionCount": 45,
        "accuracy": 91,
        "sessionsApprox": null,
        "trend": "unknown",
        "comparedToSubjectAverage": 0
      },
      "reasoning": [
        "Observed topic accuracy is approximately 91% over 45 questions in-window.",
        "Subject-level question volume in-window is approximately 45.",
        "Dominant behavior signal on the row: undetermined (informational, not a diagnosis)."
      ],
      "doNotConclude": [
        "אין הבנה",
        "Subject-wide weakness is not asserted from a single weak topic; other topics in this subject should show weakness across multiple skills."
      ],
      "nextAction": {
        "type": "targeted_practice"
      },
      "frameworkMeta": {
        "frameworkVersion": "1.1.0",
        "skillPackKey": "reading_comprehension",
        "subskillsAvailable": [
          "explicit_information",
          "inference",
          "main_idea",
          "sequence_of_events",
          "cause_and_effect",
          "vocabulary_in_context",
          "fact_vs_opinion",
          "understanding_instructions",
          "character_or_text_intent"
        ],
        "errorTypesConsidered": [
          "missed_explicit_information"
        ]
      }
    },
    {
      "findingType": "topic_signal",
      "subjectId": "english",
      "topicId": "grammar",
      "skillId": "grammar",
      "evidenceLevel": "medium",
      "confidence": "medium",
      "basedOn": {
        "questionCount": 45,
        "accuracy": 89,
        "sessionsApprox": null,
        "trend": "unknown",
        "comparedToSubjectAverage": 0
      },
      "reasoning": [
        "Observed topic accuracy is approximately 89% over 45 questions in-window.",
        "Subject-level question volume in-window is approximately 45.",
        "Dominant behavior signal on the row: undetermined (informational, not a diagnosis)."
      ],
      "doNotConclude": [
        "אין דקדוק",
        "Subject-wide weakness is not asserted from a single weak topic; other topics in this subject should show weakness across multiple skills."
      ],
      "nextAction": {
        "type": "targeted_practice"
      },
      "frameworkMeta": {
        "frameworkVersion": "1.1.0",
        "skillPackKey": "grammar",
        "subskillsAvailable": [
          "tense_agreement",
          "sentence_structure",
          "articles_prepositions",
          "word_order"
        ],
        "errorTypesConsidered": [
          "grammar_pattern_error"
        ]
      }
    },
    {
      "findingType": "topic_signal",
      "subjectId": "science",
      "topicId": "experiments",
      "skillId": "experiments",
      "evidenceLevel": "medium",
      "confidence": "medium",
      "basedOn": {
        "questionCount": 45,
        "accuracy": 91,
        "sessionsApprox": null,
        "trend": "unknown",
        "comparedToSubjectAverage": 0
      },
      "reasoning": [
        "Observed topic accuracy is approximately 91% over 45 questions in-window.",
        "Subject-level question volume in-window is approximately 45.",
        "Dominant behavior signal on the row: undetermined (informational, not a diagnosis)."
      ],
      "doNotConclude": [
        "אין חשיבה",
        "Subject-wide weakness is not asserted from a single weak topic; other topics in this subject should show weakness across multiple skills."
      ],
      "nextAction": {
        "type": "targeted_practice"
      },
      "frameworkMeta": {
        "frameworkVersion": "1.1.0",
        "skillPackKey": "experiments",
        "subskillsAvailable": [
          "variables",
          "hypothesis",
          "steps",
          "interpret_results"
        ],
        "errorTypesConsidered": [
          "cause_effect_confusion"
        ]
      }
    },
    {
      "findingType": "topic_signal",
      "subjectId": "geometry",
      "topicId": "area",
      "skillId": "area",
      "evidenceLevel": "medium",
      "confidence": "medium",
      "basedOn": {
        "questionCount": 45,
        "accuracy": 93,
        "sessionsApprox": null,
        "trend": "unknown",
        "comparedToSubjectAverage": 0
      },
      "reasoning": [
        "Observed topic accuracy is approximately 93% over 45 questions in-window.",
        "Subject-level question volume in-window is approximately 45.",
        "Dominant behavior signal on the row: undetermined (informational, not a diagnosis)."
      ],
      "doNotConclude": [
        "אין נוסחאות",
        "Subject-wide weakness is not asserted from a single weak topic; other topics in this subject should show weakness across multiple skills."
      ],
      "nextAction": {
        "type": "targeted_practice"
      },
      "frameworkMeta": {
        "frameworkVersion": "1.1.0",
        "skillPackKey": "area",
        "subskillsAvailable": [
          "area_formulas",
          "composite_figures",
          "units"
        ],
        "errorTypesConsidered": [
          "formula_selection_error"
        ]
      }
    },
    {
      "findingType": "topic_signal",
      "subjectId": "moledet-geography",
      "topicId": "maps",
      "skillId": "maps",
      "evidenceLevel": "medium",
      "confidence": "medium",
      "basedOn": {
        "questionCount": 45,
        "accuracy": 91,
        "sessionsApprox": null,
        "trend": "unknown",
        "comparedToSubjectAverage": 0
      },
      "reasoning": [
        "Observed topic accuracy is approximately 91% over 45 questions in-window.",
        "Subject-level question volume in-window is approximately 45.",
        "Dominant behavior signal on the row: undetermined (informational, not a diagnosis)."
      ],
      "doNotConclude": [
        "אין גאוגרפיה",
        "Subject-wide weakness is not asserted from a single weak topic; other topics in this subject should show weakness across multiple skills."
      ],
      "nextAction": {
        "type": "targeted_practice"
      },
      "frameworkMeta": {
        "frameworkVersion": "1.1.0",
        "skillPackKey": "maps",
        "subskillsAvailable": [
          "legend_scale",
          "coordinates_grid",
          "symbols"
        ],
        "errorTypesConsidered": [
          "map_reading_error"
        ]
      }
    }
  ],
  "subskillFindings": []
}
```

### Validation artifact snapshot

```json
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

## 3. Raw / aggregate data summary

```json
{
  "summaryCounts": {
    "mathQuestions": 45,
    "hebrewQuestions": 45,
    "englishQuestions": 45,
    "scienceQuestions": 45,
    "geometryQuestions": 45,
    "moledetGeographyQuestions": 45,
    "mathAccuracy": 93,
    "hebrewAccuracy": 91,
    "englishAccuracy": 89,
    "scienceAccuracy": 91,
    "geometryAccuracy": 93,
    "moledetGeographyAccuracy": 91,
    "totalQuestions": 270
  },
  "topicRows": [
    {
      "subjectId": "math",
      "rowKeyShort": "addition",
      "questions": 45,
      "correct": 42,
      "wrong": 3,
      "accuracy": 93,
      "displayName": "addition",
      "difficultyTier": null,
      "lastSessionMs": null,
      "trend": null
    },
    {
      "subjectId": "hebrew",
      "rowKeyShort": "comprehension",
      "questions": 45,
      "correct": 41,
      "wrong": 4,
      "accuracy": 91,
      "displayName": "comprehension",
      "difficultyTier": null,
      "lastSessionMs": null,
      "trend": null
    },
    {
      "subjectId": "english",
      "rowKeyShort": "grammar",
      "questions": 45,
      "correct": 40,
      "wrong": 5,
      "accuracy": 89,
      "displayName": "grammar",
      "difficultyTier": null,
      "lastSessionMs": null,
      "trend": null
    },
    {
      "subjectId": "science",
      "rowKeyShort": "experiments",
      "questions": 45,
      "correct": 41,
      "wrong": 4,
      "accuracy": 91,
      "displayName": "experiments",
      "difficultyTier": null,
      "lastSessionMs": null,
      "trend": null
    },
    {
      "subjectId": "geometry",
      "rowKeyShort": "area",
      "questions": 45,
      "correct": 42,
      "wrong": 3,
      "accuracy": 93,
      "displayName": "area",
      "difficultyTier": null,
      "lastSessionMs": null,
      "trend": null
    },
    {
      "subjectId": "moledet-geography",
      "rowKeyShort": "maps",
      "questions": 45,
      "correct": 41,
      "wrong": 4,
      "accuracy": 91,
      "displayName": "maps",
      "difficultyTier": null,
      "lastSessionMs": null,
      "trend": null
    }
  ],
  "paceNote": "Raw mistake timestamps/responseMs (when present) feed reliability/guessing signals in the professional engine."
}
```

- **Raw mistake events per subject:** {"math":0,"hebrew":0,"english":0,"science":0,"geometry":0,"moledet-geography":0}

## 4. Professional engine output (high level)

- **Version:** 1.0.0
- **globalDoNotConclude (count):** 7

### Reliability

```json
{
  "version": "1.0.0",
  "reliabilityScore": 75,
  "dataTrustLevel": "high",
  "effortSignal": "neutral",
  "guessingLikelihood": 0,
  "inconsistencyLevel": "low",
  "accuracySpreadAcrossRows": 4,
  "pacePattern": "mixed",
  "confidenceAdjustment": 0,
  "reasoning": [
    "Volume supports stronger reliability.",
    "Review pacing signals separately from knowledge gaps.",
    "Row-level accuracy is relatively consistent."
  ]
}
```

### Calibration (subjects)

```json
[
  {
    "subjectId": "math",
    "gradeExpectation": 66.25,
    "difficultyAdjustedAccuracy": 79.1,
    "gradeRelativeBand": "aboveExpected",
    "belowExpected": false,
    "atExpected": false,
    "aboveExpected": true,
    "difficultyCoverage": 0,
    "challengeReadiness": "high",
    "flags": {
      "gradeMismatch": false,
      "missingDifficultyMetadata": true,
      "easyOnlyHighAccuracy": false,
      "hardQuestionSignal": false
    }
  },
  {
    "subjectId": "hebrew",
    "gradeExpectation": 66.25,
    "difficultyAdjustedAccuracy": 77.4,
    "gradeRelativeBand": "aboveExpected",
    "belowExpected": false,
    "atExpected": false,
    "aboveExpected": true,
    "difficultyCoverage": 0,
    "challengeReadiness": "high",
    "flags": {
      "gradeMismatch": false,
      "missingDifficultyMetadata": true,
      "easyOnlyHighAccuracy": false,
      "hardQuestionSignal": false
    }
  },
  {
    "subjectId": "english",
    "gradeExpectation": 66.25,
    "difficultyAdjustedAccuracy": 75.6,
    "gradeRelativeBand": "aboveExpected",
    "belowExpected": false,
    "atExpected": false,
    "aboveExpected": true,
    "difficultyCoverage": 0,
    "challengeReadiness": "high",
    "flags": {
      "gradeMismatch": false,
      "missingDifficultyMetadata": true,
      "easyOnlyHighAccuracy": false,
      "hardQuestionSignal": false
    }
  },
  {
    "subjectId": "science",
    "gradeExpectation": 66.25,
    "difficultyAdjustedAccuracy": 77.4,
    "gradeRelativeBand": "aboveExpected",
    "belowExpected": false,
    "atExpected": false,
    "aboveExpected": true,
    "difficultyCoverage": 0,
    "challengeReadiness": "high",
    "flags": {
      "gradeMismatch": false,
      "missingDifficultyMetadata": true,
      "easyOnlyHighAccuracy": false,
      "hardQuestionSignal": false
    }
  },
  {
    "subjectId": "geometry",
    "gradeExpectation": 66.25,
    "difficultyAdjustedAccuracy": 79.1,
    "gradeRelativeBand": "aboveExpected",
    "belowExpected": false,
    "atExpected": false,
    "aboveExpected": true,
    "difficultyCoverage": 0,
    "challengeReadiness": "high",
    "flags": {
      "gradeMismatch": false,
      "missingDifficultyMetadata": true,
      "easyOnlyHighAccuracy": false,
      "hardQuestionSignal": false
    }
  },
  {
    "subjectId": "moledet-geography",
    "gradeExpectation": 66.25,
    "difficultyAdjustedAccuracy": 77.4,
    "gradeRelativeBand": "aboveExpected",
    "belowExpected": false,
    "atExpected": false,
    "aboveExpected": true,
    "difficultyCoverage": 0,
    "challengeReadiness": "high",
    "flags": {
      "gradeMismatch": false,
      "missingDifficultyMetadata": true,
      "easyOnlyHighAccuracy": false,
      "hardQuestionSignal": false
    }
  }
]
```

### Mastery items

```json
[
  {
    "subjectId": "math",
    "skillId": "arithmetic_operations",
    "subskillId": "_rollup",
    "masteryScore": 74.4,
    "masteryBand": "near_mastery",
    "confidence": "high",
    "evidenceLevel": "strong",
    "questionCount": 45,
    "recentAccuracy": 93,
    "weightedAccuracy": 93,
    "trend": "unknown",
    "consistency": "low",
    "lastPracticedAt": null,
    "retentionRisk": false,
    "easyOnlyProfile": false,
    "difficultyTiersObserved": [],
    "recommendedState": "practice_targeted"
  },
  {
    "subjectId": "hebrew",
    "skillId": "reading_comprehension",
    "subskillId": "_rollup",
    "masteryScore": 72.8,
    "masteryBand": "near_mastery",
    "confidence": "high",
    "evidenceLevel": "strong",
    "questionCount": 45,
    "recentAccuracy": 91,
    "weightedAccuracy": 91,
    "trend": "unknown",
    "consistency": "low",
    "lastPracticedAt": null,
    "retentionRisk": false,
    "easyOnlyProfile": false,
    "difficultyTiersObserved": [],
    "recommendedState": "practice_targeted"
  },
  {
    "subjectId": "english",
    "skillId": "grammar",
    "subskillId": "_rollup",
    "masteryScore": 71.2,
    "masteryBand": "near_mastery",
    "confidence": "high",
    "evidenceLevel": "strong",
    "questionCount": 45,
    "recentAccuracy": 89,
    "weightedAccuracy": 89,
    "trend": "unknown",
    "consistency": "low",
    "lastPracticedAt": null,
    "retentionRisk": false,
    "easyOnlyProfile": false,
    "difficultyTiersObserved": [],
    "recommendedState": "practice_targeted"
  },
  {
    "subjectId": "science",
    "skillId": "experiments",
    "subskillId": "_rollup",
    "masteryScore": 72.8,
    "masteryBand": "near_mastery",
    "confidence": "high",
    "evidenceLevel": "strong",
    "questionCount": 45,
    "recentAccuracy": 91,
    "weightedAccuracy": 91,
    "trend": "unknown",
    "consistency": "low",
    "lastPracticedAt": null,
    "retentionRisk": false,
    "easyOnlyProfile": false,
    "difficultyTiersObserved": [],
    "recommendedState": "practice_targeted"
  },
  {
    "subjectId": "geometry",
    "skillId": "area",
    "subskillId": "_rollup",
    "masteryScore": 74.4,
    "masteryBand": "near_mastery",
    "confidence": "high",
    "evidenceLevel": "strong",
    "questionCount": 45,
    "recentAccuracy": 93,
    "weightedAccuracy": 93,
    "trend": "unknown",
    "consistency": "low",
    "lastPracticedAt": null,
    "retentionRisk": false,
    "easyOnlyProfile": false,
    "difficultyTiersObserved": [],
    "recommendedState": "practice_targeted"
  },
  {
    "subjectId": "moledet-geography",
    "skillId": "maps",
    "subskillId": "_rollup",
    "masteryScore": 72.8,
    "masteryBand": "near_mastery",
    "confidence": "high",
    "evidenceLevel": "strong",
    "questionCount": 45,
    "recentAccuracy": 91,
    "weightedAccuracy": 91,
    "trend": "unknown",
    "consistency": "low",
    "lastPracticedAt": null,
    "retentionRisk": false,
    "easyOnlyProfile": false,
    "difficultyTiersObserved": [],
    "recommendedState": "practice_targeted"
  }
]
```

### Misconceptions

```json
{
  "math": {
    "items": [],
    "typeHistogram": {},
    "version": "1.0.0"
  },
  "hebrew": {
    "items": [],
    "typeHistogram": {},
    "version": "1.0.0"
  },
  "english": {
    "items": [],
    "typeHistogram": {},
    "version": "1.0.0"
  },
  "science": {
    "items": [],
    "typeHistogram": {},
    "version": "1.0.0"
  },
  "geometry": {
    "items": [],
    "typeHistogram": {},
    "version": "1.0.0"
  },
  "moledet-geography": {
    "items": [],
    "typeHistogram": {},
    "version": "1.0.0"
  }
}
```

### Dependencies

```json
{
  "version": "1.0.0",
  "items": []
}
```

### Probes

```json
{
  "version": "1.0.0",
  "probeTypesEnum": [
    "collect_more_data",
    "targeted_skill",
    "prerequisite_check",
    "difficulty_sweep",
    "misconception_confirmation",
    "cross_subject_check",
    "challenge_advance"
  ],
  "recommendationTypeEnum": [
    "continue_current_level",
    "advance_cautiously",
    "targeted_practice",
    "review_foundation",
    "collect_more_data",
    "slow_down_and_check",
    "teacher_review_recommended",
    "professional_review_consideration"
  ],
  "probes": [
    {
      "probeReason": "Strong observed mastery with adequate volume—optional challenge probe to confirm transfer.",
      "targetSubjectId": "math",
      "targetSkillId": "arithmetic_operations",
      "targetSubskillId": null,
      "probeType": "challenge_advance",
      "recommendedQuestionTypes": [
        "mcq",
        "multi_step"
      ],
      "numberOfQuestions": 3,
      "successCriteria": "Maintains accuracy on harder parallel items",
      "failureCriteria": "Breakdown on increased complexity",
      "nextDecisionAfterProbe": "Adjust level or add scaffolded practice"
    }
  ]
}
```

### Cross-subject patterns

```json
{
  "version": "1.0.0",
  "patterns": [],
  "note": "Patterns require evidence in multiple subjects; thin single-subject data cannot trigger."
}
```

## 5. Evidence and reasoning (flattened)

```json
[
  {
    "findingType": "topic_signal",
    "subjectId": "math",
    "skillId": "arithmetic_operations",
    "subskillId": null,
    "topicId": "addition",
    "evidenceLevel": "medium",
    "confidence": "medium",
    "basedOn": {
      "questionCount": 45,
      "accuracy": 93,
      "sessionsApprox": null,
      "trend": "unknown",
      "comparedToSubjectAverage": 0
    },
    "reasoning": [
      "Observed topic accuracy is approximately 93% over 45 questions in-window.",
      "Subject-level question volume in-window is approximately 45.",
      "Dominant behavior signal on the row: undetermined (informational, not a diagnosis)."
    ],
    "doNotConclude": [
      "Subject-wide weakness is not asserted from a single weak topic; other topics in this subject should show weakness across multiple skills."
    ],
    "nextAction": {
      "type": "targeted_practice"
    }
  },
  {
    "findingType": "topic_signal",
    "subjectId": "hebrew",
    "skillId": "reading_comprehension",
    "subskillId": null,
    "topicId": "comprehension",
    "evidenceLevel": "medium",
    "confidence": "medium",
    "basedOn": {
      "questionCount": 45,
      "accuracy": 91,
      "sessionsApprox": null,
      "trend": "unknown",
      "comparedToSubjectAverage": 0
    },
    "reasoning": [
      "Observed topic accuracy is approximately 91% over 45 questions in-window.",
      "Subject-level question volume in-window is approximately 45.",
      "Dominant behavior signal on the row: undetermined (informational, not a diagnosis)."
    ],
    "doNotConclude": [
      "אין הבנה",
      "Subject-wide weakness is not asserted from a single weak topic; other topics in this subject should show weakness across multiple skills."
    ],
    "nextAction": {
      "type": "targeted_practice"
    }
  },
  {
    "findingType": "topic_signal",
    "subjectId": "english",
    "skillId": "grammar",
    "subskillId": null,
    "topicId": "grammar",
    "evidenceLevel": "medium",
    "confidence": "medium",
    "basedOn": {
      "questionCount": 45,
      "accuracy": 89,
      "sessionsApprox": null,
      "trend": "unknown",
      "comparedToSubjectAverage": 0
    },
    "reasoning": [
      "Observed topic accuracy is approximately 89% over 45 questions in-window.",
      "Subject-level question volume in-window is approximately 45.",
      "Dominant behavior signal on the row: undetermined (informational, not a diagnosis)."
    ],
    "doNotConclude": [
      "אין דקדוק",
      "Subject-wide weakness is not asserted from a single weak topic; other topics in this subject should show weakness across multiple skills."
    ],
    "nextAction": {
      "type": "targeted_practice"
    }
  },
  {
    "findingType": "topic_signal",
    "subjectId": "science",
    "skillId": "experiments",
    "subskillId": null,
    "topicId": "experiments",
    "evidenceLevel": "medium",
    "confidence": "medium",
    "basedOn": {
      "questionCount": 45,
      "accuracy": 91,
      "sessionsApprox": null,
      "trend": "unknown",
      "comparedToSubjectAverage": 0
    },
    "reasoning": [
      "Observed topic accuracy is approximately 91% over 45 questions in-window.",
      "Subject-level question volume in-window is approximately 45.",
      "Dominant behavior signal on the row: undetermined (informational, not a diagnosis)."
    ],
    "doNotConclude": [
      "אין חשיבה",
      "Subject-wide weakness is not asserted from a single weak topic; other topics in this subject should show weakness across multiple skills."
    ],
    "nextAction": {
      "type": "targeted_practice"
    }
  },
  {
    "findingType": "topic_signal",
    "subjectId": "geometry",
    "skillId": "area",
    "subskillId": null,
    "topicId": "area",
    "evidenceLevel": "medium",
    "confidence": "medium",
    "basedOn": {
      "questionCount": 45,
      "accuracy": 93,
      "sessionsApprox": null,
      "trend": "unknown",
      "comparedToSubjectAverage": 0
    },
    "reasoning": [
      "Observed topic accuracy is approximately 93% over 45 questions in-window.",
      "Subject-level question volume in-window is approximately 45.",
      "Dominant behavior signal on the row: undetermined (informational, not a diagnosis)."
    ],
    "doNotConclude": [
      "אין נוסחאות",
      "Subject-wide weakness is not asserted from a single weak topic; other topics in this subject should show weakness across multiple skills."
    ],
    "nextAction": {
      "type": "targeted_practice"
    }
  },
  {
    "findingType": "topic_signal",
    "subjectId": "moledet-geography",
    "skillId": "maps",
    "subskillId": null,
    "topicId": "maps",
    "evidenceLevel": "medium",
    "confidence": "medium",
    "basedOn": {
      "questionCount": 45,
      "accuracy": 91,
      "sessionsApprox": null,
      "trend": "unknown",
      "comparedToSubjectAverage": 0
    },
    "reasoning": [
      "Observed topic accuracy is approximately 91% over 45 questions in-window.",
      "Subject-level question volume in-window is approximately 45.",
      "Dominant behavior signal on the row: undetermined (informational, not a diagnosis)."
    ],
    "doNotConclude": [
      "אין גאוגרפיה",
      "Subject-wide weakness is not asserted from a single weak topic; other topics in this subject should show weakness across multiple skills."
    ],
    "nextAction": {
      "type": "targeted_practice"
    }
  }
]
```

## 6. Limitations

- English generator metadata varies by pool row coverage.
- Subskill and misconception precision is limited until question pools/generators carry dense expectedErrorTypes and prerequisiteSkillIds.
- Mastery aggregates by skill—full diagnostic precision depends on difficultyTier (or equivalent) on topic rows where available.
- Subskill and misconception precision is limited until question pools carry dense expectedErrorTypes and prerequisiteSkillIds.
- Cross-subject patterns are hypotheses and require confirming probes per subject.

## 7. Reviewer fields (machine-readable)

```json
{
  "agreesWithEngine": null,
  "concernLevel": null,
  "notes": "",
  "suggestedCorrection": "",
  "needsEngineChange": null,
  "needsQuestionMetadataChange": null,
  "needsExpertRuleChange": null
}
```

## Human reviewer notes

- **Agree with engine conclusion:** 
- **Concern level:** 
- **Notes:** 
- **Suggested correction:** 
- **Needs engine change:** 
- **Needs metadata change:** 
- **Needs expert rule change:** 
