# Scenario: prerequisite_direct_skill_gap

**Disclaimer:** This is an internal educational diagnostic support review artifact. It is **not** a clinical or medical diagnosis. It is **not** a parent-facing report.

## 1. Scenario identity

- **Scenario id:** `prerequisite_direct_skill_gap`
- **Scenario type:** dependency
- **Subject(s):** math
- **Intended signal:** Strong prerequisites + weak fractions → direct focal skill hypothesis.

## 2. Expected vs actual

- **Expected:** Strong prerequisites + weak fractions → direct focal skill hypothesis.
- **Pass / fail (validation):** PASS
- **engineConfidence:** low
- **engineReadiness:** ready_for_internal_review

### skillFindings (framework) / subskillFindings

```json
{
  "skillFindings": [
    {
      "findingType": "topic_signal",
      "subjectId": "math",
      "topicId": "fractions",
      "skillId": "fractions",
      "evidenceLevel": "limited",
      "confidence": "low",
      "basedOn": {
        "questionCount": 24,
        "accuracy": 33,
        "sessionsApprox": null,
        "trend": "unknown",
        "comparedToSubjectAverage": -45
      },
      "reasoning": [
        "Observed topic accuracy is approximately 33% over 24 questions in-window.",
        "Subject-level question volume in-window is approximately 89.",
        "Dominant behavior signal on the row: undetermined (informational, not a diagnosis).",
        "Evidence is limited—interpretation should stay cautious."
      ],
      "doNotConclude": [
        "אין שברים",
        "Subject-wide weakness is not asserted from a single weak topic; other topics in this subject should show weakness across multiple skills.",
        "Do not draw strong conclusions until more practice data is collected."
      ],
      "nextAction": {
        "type": "targeted_practice"
      },
      "frameworkMeta": {
        "frameworkVersion": "1.1.0",
        "skillPackKey": "fractions",
        "subskillsAvailable": [
          "numerator_denominator_understanding",
          "compare_fractions",
          "unlike_denominators",
          "equivalent_fractions",
          "add_fractions",
          "subtract_fractions",
          "simplify_fractions",
          "mixed_numbers",
          "fraction_word_problems"
        ],
        "errorTypesConsidered": [
          "calculation_error"
        ]
      }
    },
    {
      "findingType": "topic_signal",
      "subjectId": "math",
      "topicId": "addition",
      "skillId": "arithmetic_operations",
      "evidenceLevel": "medium",
      "confidence": "medium",
      "basedOn": {
        "questionCount": 35,
        "accuracy": 94,
        "sessionsApprox": null,
        "trend": "unknown",
        "comparedToSubjectAverage": 16
      },
      "reasoning": [
        "Observed topic accuracy is approximately 94% over 35 questions in-window.",
        "Subject-level question volume in-window is approximately 89.",
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
      "subjectId": "math",
      "topicId": "number_sense",
      "skillId": "number_sense",
      "evidenceLevel": "medium",
      "confidence": "medium",
      "basedOn": {
        "questionCount": 30,
        "accuracy": 93,
        "sessionsApprox": null,
        "trend": "unknown",
        "comparedToSubjectAverage": 15
      },
      "reasoning": [
        "Observed topic accuracy is approximately 93% over 30 questions in-window.",
        "Subject-level question volume in-window is approximately 89.",
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
        "skillPackKey": "number_sense",
        "subskillsAvailable": [
          "place_value",
          "rounding",
          "estimation",
          "number_line_reasoning"
        ],
        "errorTypesConsidered": [
          "calculation_error"
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

## 3. Raw / aggregate data summary

```json
{
  "summaryCounts": {
    "mathQuestions": 89,
    "hebrewQuestions": 0,
    "englishQuestions": 0,
    "scienceQuestions": 0,
    "geometryQuestions": 0,
    "moledetGeographyQuestions": 0,
    "mathAccuracy": 78,
    "hebrewAccuracy": null,
    "englishAccuracy": null,
    "scienceAccuracy": null,
    "geometryAccuracy": null,
    "moledetGeographyAccuracy": null,
    "totalQuestions": 89
  },
  "topicRows": [
    {
      "subjectId": "math",
      "rowKeyShort": "fractions",
      "questions": 24,
      "correct": 8,
      "wrong": 16,
      "accuracy": 33,
      "displayName": "fractions",
      "difficultyTier": null,
      "lastSessionMs": null,
      "trend": null
    },
    {
      "subjectId": "math",
      "rowKeyShort": "addition",
      "questions": 35,
      "correct": 33,
      "wrong": 2,
      "accuracy": 94,
      "displayName": "addition",
      "difficultyTier": null,
      "lastSessionMs": null,
      "trend": null
    },
    {
      "subjectId": "math",
      "rowKeyShort": "number_sense",
      "questions": 30,
      "correct": 28,
      "wrong": 2,
      "accuracy": 93,
      "displayName": "number_sense",
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
  "reliabilityScore": 61,
  "dataTrustLevel": "moderate",
  "effortSignal": "neutral",
  "guessingLikelihood": 0,
  "inconsistencyLevel": "high",
  "accuracySpreadAcrossRows": 61,
  "pacePattern": "mixed",
  "confidenceAdjustment": -0.12,
  "reasoning": [
    "Volume supports stronger reliability.",
    "Review pacing signals separately from knowledge gaps.",
    "Large accuracy spread across rows suggests unstable performance or mixed contexts."
  ]
}
```

### Calibration (subjects)

```json
[
  {
    "subjectId": "math",
    "gradeExpectation": 77.25,
    "difficultyAdjustedAccuracy": 66.3,
    "gradeRelativeBand": "atExpected",
    "belowExpected": false,
    "atExpected": true,
    "aboveExpected": false,
    "difficultyCoverage": 0,
    "challengeReadiness": "medium",
    "flags": {
      "gradeMismatch": false,
      "missingDifficultyMetadata": true,
      "easyOnlyHighAccuracy": false,
      "hardQuestionSignal": false
    }
  },
  {
    "subjectId": "hebrew",
    "gradeExpectation": null,
    "difficultyAdjustedAccuracy": null,
    "gradeRelativeBand": "atExpected",
    "belowExpected": false,
    "atExpected": true,
    "aboveExpected": false,
    "difficultyCoverage": 0,
    "challengeReadiness": "low",
    "flags": {
      "gradeMismatch": false,
      "missingDifficultyMetadata": false,
      "easyOnlyHighAccuracy": false,
      "hardQuestionSignal": false
    }
  },
  {
    "subjectId": "english",
    "gradeExpectation": null,
    "difficultyAdjustedAccuracy": null,
    "gradeRelativeBand": "atExpected",
    "belowExpected": false,
    "atExpected": true,
    "aboveExpected": false,
    "difficultyCoverage": 0,
    "challengeReadiness": "low",
    "flags": {
      "gradeMismatch": false,
      "missingDifficultyMetadata": false,
      "easyOnlyHighAccuracy": false,
      "hardQuestionSignal": false
    }
  },
  {
    "subjectId": "science",
    "gradeExpectation": null,
    "difficultyAdjustedAccuracy": null,
    "gradeRelativeBand": "atExpected",
    "belowExpected": false,
    "atExpected": true,
    "aboveExpected": false,
    "difficultyCoverage": 0,
    "challengeReadiness": "low",
    "flags": {
      "gradeMismatch": false,
      "missingDifficultyMetadata": false,
      "easyOnlyHighAccuracy": false,
      "hardQuestionSignal": false
    }
  },
  {
    "subjectId": "geometry",
    "gradeExpectation": null,
    "difficultyAdjustedAccuracy": null,
    "gradeRelativeBand": "atExpected",
    "belowExpected": false,
    "atExpected": true,
    "aboveExpected": false,
    "difficultyCoverage": 0,
    "challengeReadiness": "low",
    "flags": {
      "gradeMismatch": false,
      "missingDifficultyMetadata": false,
      "easyOnlyHighAccuracy": false,
      "hardQuestionSignal": false
    }
  },
  {
    "subjectId": "moledet-geography",
    "gradeExpectation": null,
    "difficultyAdjustedAccuracy": null,
    "gradeRelativeBand": "atExpected",
    "belowExpected": false,
    "atExpected": true,
    "aboveExpected": false,
    "difficultyCoverage": 0,
    "challengeReadiness": "low",
    "flags": {
      "gradeMismatch": false,
      "missingDifficultyMetadata": false,
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
    "skillId": "fractions",
    "subskillId": "_rollup",
    "masteryScore": 26.4,
    "masteryBand": "emerging",
    "confidence": "medium",
    "evidenceLevel": "medium",
    "questionCount": 24,
    "recentAccuracy": 33,
    "weightedAccuracy": 33,
    "trend": "unknown",
    "consistency": "low",
    "lastPracticedAt": null,
    "retentionRisk": false,
    "easyOnlyProfile": false,
    "difficultyTiersObserved": [],
    "recommendedState": "practice_targeted"
  },
  {
    "subjectId": "math",
    "skillId": "arithmetic_operations",
    "subskillId": "_rollup",
    "masteryScore": 75.2,
    "masteryBand": "near_mastery",
    "confidence": "medium",
    "evidenceLevel": "strong",
    "questionCount": 35,
    "recentAccuracy": 94,
    "weightedAccuracy": 94,
    "trend": "unknown",
    "consistency": "low",
    "lastPracticedAt": null,
    "retentionRisk": false,
    "easyOnlyProfile": false,
    "difficultyTiersObserved": [],
    "recommendedState": "practice_targeted"
  },
  {
    "subjectId": "math",
    "skillId": "number_sense",
    "subskillId": "_rollup",
    "masteryScore": 74.4,
    "masteryBand": "near_mastery",
    "confidence": "medium",
    "evidenceLevel": "strong",
    "questionCount": 30,
    "recentAccuracy": 93,
    "weightedAccuracy": 93,
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
  "items": [
    {
      "skillId": "fractions",
      "blockedSkillId": "fractions",
      "suspectedPrerequisiteGap": false,
      "suspectedDirectSkillGap": true,
      "confidence": "low",
      "evidence": [
        "Prerequisite skills look comparatively strong—focal skill gap is plausible."
      ],
      "reasoning": [
        "Dependencies are educational hypotheses—verify with targeted probes.",
        "A weak advanced skill with weak prerequisites may indicate foundation gaps."
      ],
      "nextBestPrerequisiteToCheck": null,
      "doNotConclude": [
        "Do not label subject-wide failure from a single dependency edge.",
        "No clinical or medical conclusions."
      ]
    }
  ]
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
    "skillId": "fractions",
    "subskillId": null,
    "topicId": "fractions",
    "evidenceLevel": "limited",
    "confidence": "low",
    "basedOn": {
      "questionCount": 24,
      "accuracy": 33,
      "sessionsApprox": null,
      "trend": "unknown",
      "comparedToSubjectAverage": -45
    },
    "reasoning": [
      "Observed topic accuracy is approximately 33% over 24 questions in-window.",
      "Subject-level question volume in-window is approximately 89.",
      "Dominant behavior signal on the row: undetermined (informational, not a diagnosis).",
      "Evidence is limited—interpretation should stay cautious."
    ],
    "doNotConclude": [
      "אין שברים",
      "Subject-wide weakness is not asserted from a single weak topic; other topics in this subject should show weakness across multiple skills.",
      "Do not draw strong conclusions until more practice data is collected."
    ],
    "nextAction": {
      "type": "targeted_practice"
    }
  },
  {
    "findingType": "topic_signal",
    "subjectId": "math",
    "skillId": "arithmetic_operations",
    "subskillId": null,
    "topicId": "addition",
    "evidenceLevel": "medium",
    "confidence": "medium",
    "basedOn": {
      "questionCount": 35,
      "accuracy": 94,
      "sessionsApprox": null,
      "trend": "unknown",
      "comparedToSubjectAverage": 16
    },
    "reasoning": [
      "Observed topic accuracy is approximately 94% over 35 questions in-window.",
      "Subject-level question volume in-window is approximately 89.",
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
    "subjectId": "math",
    "skillId": "number_sense",
    "subskillId": null,
    "topicId": "number_sense",
    "evidenceLevel": "medium",
    "confidence": "medium",
    "basedOn": {
      "questionCount": 30,
      "accuracy": 93,
      "sessionsApprox": null,
      "trend": "unknown",
      "comparedToSubjectAverage": 15
    },
    "reasoning": [
      "Observed topic accuracy is approximately 93% over 30 questions in-window.",
      "Subject-level question volume in-window is approximately 89.",
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
    "findingType": "dependency_hypothesis",
    "subjectId": "math",
    "skillId": "fractions",
    "subskillId": null,
    "evidenceLevel": "see_mastery",
    "confidence": "low",
    "basedOn": [
      "Prerequisite skills look comparatively strong—focal skill gap is plausible."
    ],
    "reasoning": [
      "Dependencies are educational hypotheses—verify with targeted probes.",
      "A weak advanced skill with weak prerequisites may indicate foundation gaps."
    ],
    "doNotConclude": [
      "Do not label subject-wide failure from a single dependency edge.",
      "No clinical or medical conclusions."
    ],
    "nextAction": null
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
