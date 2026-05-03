# Scenario: random_guessing

**Disclaimer:** This is an internal educational diagnostic support review artifact. It is **not** a clinical or medical diagnosis. It is **not** a parent-facing report.

## 1. Scenario identity

- **Scenario id:** `random_guessing`
- **Scenario type:** reliability_pace
- **Subject(s):** math
- **Intended signal:** Fast wrong mistakes elevate guessing likelihood.

## 2. Expected vs actual

- **Expected:** Fast wrong mistakes elevate guessing likelihood.
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
      "topicId": "addition",
      "skillId": "arithmetic_operations",
      "evidenceLevel": "medium",
      "confidence": "medium",
      "basedOn": {
        "questionCount": 40,
        "accuracy": 30,
        "sessionsApprox": null,
        "trend": "unknown",
        "comparedToSubjectAverage": 0
      },
      "reasoning": [
        "Observed topic accuracy is approximately 30% over 40 questions in-window.",
        "Subject-level question volume in-window is approximately 40.",
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
  "reliabilityGuessing": 1,
  "reliabilityInconsistency": "medium",
  "crossSubjectPatternCount": 0,
  "dependencyItems": 1,
  "masteryBandsSample": [
    "math/arithmetic_operations:emerging"
  ]
}
```

## 3. Raw / aggregate data summary

```json
{
  "summaryCounts": {
    "mathQuestions": 40,
    "hebrewQuestions": 0,
    "englishQuestions": 0,
    "scienceQuestions": 0,
    "geometryQuestions": 0,
    "moledetGeographyQuestions": 0,
    "mathAccuracy": 30,
    "hebrewAccuracy": null,
    "englishAccuracy": null,
    "scienceAccuracy": null,
    "geometryAccuracy": null,
    "moledetGeographyAccuracy": null,
    "totalQuestions": 40
  },
  "topicRows": [
    {
      "subjectId": "math",
      "rowKeyShort": "addition",
      "questions": 40,
      "correct": 12,
      "wrong": 28,
      "accuracy": 30,
      "displayName": "addition",
      "difficultyTier": null,
      "lastSessionMs": null,
      "trend": null
    }
  ],
  "paceNote": "Raw mistake timestamps/responseMs (when present) feed reliability/guessing signals in the professional engine."
}
```

- **Raw mistake events per subject:** {"math":20,"hebrew":0,"english":0,"science":0,"geometry":0,"moledet-geography":0}

## 4. Professional engine output (high level)

- **Version:** 1.0.0
- **globalDoNotConclude (count):** 7

### Reliability

```json
{
  "version": "1.0.0",
  "reliabilityScore": 41,
  "dataTrustLevel": "very_low",
  "effortSignal": "fast_attempts_observed",
  "guessingLikelihood": 1,
  "inconsistencyLevel": "medium",
  "accuracySpreadAcrossRows": 0,
  "pacePattern": "fast_errors_dominate",
  "confidenceAdjustment": -0.15,
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
    "gradeExpectation": 65,
    "difficultyAdjustedAccuracy": 25.5,
    "gradeRelativeBand": "belowExpected",
    "belowExpected": true,
    "atExpected": false,
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
    "skillId": "arithmetic_operations",
    "subskillId": "_rollup",
    "masteryScore": 21.6,
    "masteryBand": "emerging",
    "confidence": "high",
    "evidenceLevel": "strong",
    "questionCount": 40,
    "recentAccuracy": 30,
    "weightedAccuracy": 30,
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
    "items": [
      {
        "subjectId": "math",
        "topicId": "addition",
        "skillId": "arithmetic_operations",
        "subskillId": "addition",
        "errorType": "fast_guessing_pattern",
        "suspectedMisconception": "Very fast incorrect response may reflect guessing or pacing strategy.",
        "confidence": "high",
        "basedOn": [
          "responseMs:2000",
          "answer_mismatch"
        ],
        "reasoning": [
          "Speed alone does not prove a specific misconception."
        ],
        "doNotConclude": [
          "This is a suspected learning pattern, not a confirmed diagnosis.",
          "Do not infer clinical or medical conditions.",
          "Do not treat fast wrong answers as proof of knowledge gaps without further evidence."
        ]
      },
      {
        "subjectId": "math",
        "topicId": "addition",
        "skillId": "arithmetic_operations",
        "subskillId": "addition",
        "errorType": "fast_guessing_pattern",
        "suspectedMisconception": "Very fast incorrect response may reflect guessing or pacing strategy.",
        "confidence": "high",
        "basedOn": [
          "responseMs:2100",
          "answer_mismatch"
        ],
        "reasoning": [
          "Speed alone does not prove a specific misconception."
        ],
        "doNotConclude": [
          "This is a suspected learning pattern, not a confirmed diagnosis.",
          "Do not infer clinical or medical conditions.",
          "Do not treat fast wrong answers as proof of knowledge gaps without further evidence."
        ]
      },
      {
        "subjectId": "math",
        "topicId": "addition",
        "skillId": "arithmetic_operations",
        "subskillId": "addition",
        "errorType": "fast_guessing_pattern",
        "suspectedMisconception": "Very fast incorrect response may reflect guessing or pacing strategy.",
        "confidence": "high",
        "basedOn": [
          "responseMs:2200",
          "answer_mismatch"
        ],
        "reasoning": [
          "Speed alone does not prove a specific misconception."
        ],
        "doNotConclude": [
          "This is a suspected learning pattern, not a confirmed diagnosis.",
          "Do not infer clinical or medical conditions.",
          "Do not treat fast wrong answers as proof of knowledge gaps without further evidence."
        ]
      },
      {
        "subjectId": "math",
        "topicId": "addition",
        "skillId": "arithmetic_operations",
        "subskillId": "addition",
        "errorType": "fast_guessing_pattern",
        "suspectedMisconception": "Very fast incorrect response may reflect guessing or pacing strategy.",
        "confidence": "high",
        "basedOn": [
          "responseMs:2000",
          "answer_mismatch"
        ],
        "reasoning": [
          "Speed alone does not prove a specific misconception."
        ],
        "doNotConclude": [
          "This is a suspected learning pattern, not a confirmed diagnosis.",
          "Do not infer clinical or medical conditions.",
          "Do not treat fast wrong answers as proof of knowledge gaps without further evidence."
        ]
      },
      {
        "subjectId": "math",
        "topicId": "addition",
        "skillId": "arithmetic_operations",
        "subskillId": "addition",
        "errorType": "fast_guessing_pattern",
        "suspectedMisconception": "Very fast incorrect response may reflect guessing or pacing strategy.",
        "confidence": "high",
        "basedOn": [
          "responseMs:2100",
          "answer_mismatch"
        ],
        "reasoning": [
          "Speed alone does not prove a specific misconception."
        ],
        "doNotConclude": [
          "This is a suspected learning pattern, not a confirmed diagnosis.",
          "Do not infer clinical or medical conditions.",
          "Do not treat fast wrong answers as proof of knowledge gaps without further evidence."
        ]
      },
      {
        "subjectId": "math",
        "topicId": "addition",
        "skillId": "arithmetic_operations",
        "subskillId": "addition",
        "errorType": "fast_guessing_pattern",
        "suspectedMisconception": "Very fast incorrect response may reflect guessing or pacing strategy.",
        "confidence": "high",
        "basedOn": [
          "responseMs:2200",
          "answer_mismatch"
        ],
        "reasoning": [
          "Speed alone does not prove a specific misconception."
        ],
        "doNotConclude": [
          "This is a suspected learning pattern, not a confirmed diagnosis.",
          "Do not infer clinical or medical conditions.",
          "Do not treat fast wrong answers as proof of knowledge gaps without further evidence."
        ]
      },
      {
        "subjectId": "math",
        "topicId": "addition",
        "skillId": "arithmetic_operations",
        "subskillId": "addition",
        "errorType": "fast_guessing_pattern",
        "suspectedMisconception": "Very fast incorrect response may reflect guessing or pacing strategy.",
        "confidence": "high",
        "basedOn": [
          "responseMs:2000",
          "answer_mismatch"
        ],
        "reasoning": [
          "Speed alone does not prove a specific misconception."
        ],
        "doNotConclude": [
          "This is a suspected learning pattern, not a confirmed diagnosis.",
          "Do not infer clinical or medical conditions.",
          "Do not treat fast wrong answers as proof of knowledge gaps without further evidence."
        ]
      },
      {
        "subjectId": "math",
        "topicId": "addition",
        "skillId": "arithmetic_operations",
        "subskillId": "addition",
        "errorType": "fast_guessing_pattern",
        "suspectedMisconception": "Very fast incorrect response may reflect guessing or pacing strategy.",
        "confidence": "high",
        "basedOn": [
          "responseMs:2100",
          "answer_mismatch"
        ],
        "reasoning": [
          "Speed alone does not prove a specific misconception."
        ],
        "doNotConclude": [
          "This is a suspected learning pattern, not a confirmed diagnosis.",
          "Do not infer clinical or medical conditions.",
          "Do not treat fast wrong answers as proof of knowledge gaps without further evidence."
        ]
      },
      {
        "subjectId": "math",
        "topicId": "addition",
        "skillId": "arithmetic_operations",
        "subskillId": "addition",
        "errorType": "fast_guessing_pattern",
        "suspectedMisconception": "Very fast incorrect response may reflect guessing or pacing strategy.",
        "confidence": "high",
        "basedOn": [
          "responseMs:2200",
          "answer_mismatch"
        ],
        "reasoning": [
          "Speed alone does not prove a specific misconception."
        ],
        "doNotConclude": [
          "This is a suspected learning pattern, not a confirmed diagnosis.",
          "Do not infer clinical or medical conditions.",
          "Do not treat fast wrong answers as proof of knowledge gaps without further evidence."
        ]
      },
      {
        "subjectId": "math",
        "topicId": "addition",
        "skillId": "arithmetic_operations",
        "subskillId": "addition",
        "errorType": "fast_guessing_pattern",
        "suspectedMisconception": "Very fast incorrect response may reflect guessing or pacing strategy.",
        "confidence": "high",
        "basedOn": [
          "responseMs:2000",
          "answer_mismatch"
        ],
        "reasoning": [
          "Speed alone does not prove a specific misconception."
        ],
        "doNotConclude": [
          "This is a suspected learning pattern, not a confirmed diagnosis.",
          "Do not infer clinical or medical conditions.",
          "Do not treat fast wrong answers as proof of knowledge gaps without further evidence."
        ]
      },
      {
        "subjectId": "math",
        "topicId": "addition",
        "skillId": "arithmetic_operations",
        "subskillId": "addition",
        "errorType": "fast_guessing_pattern",
        "suspectedMisconception": "Very fast incorrect response may reflect guessing or pacing strategy.",
        "confidence": "high",
        "basedOn": [
          "responseMs:2100",
          "answer_mismatch"
        ],
        "reasoning": [
          "Speed alone does not prove a specific misconception."
        ],
        "doNotConclude": [
          "This is a suspected learning pattern, not a confirmed diagnosis.",
          "Do not infer clinical or medical conditions.",
          "Do not treat fast wrong answers as proof of knowledge gaps without further evidence."
        ]
      },
      {
        "subjectId": "math",
        "topicId": "addition",
        "skillId": "arithmetic_operations",
        "subskillId": "addition",
        "errorType": "fast_guessing_pattern",
        "suspectedMisconception": "Very fast incorrect response may reflect guessing or pacing strategy.",
        "confidence": "high",
        "basedOn": [
          "responseMs:2200",
          "answer_mismatch"
        ],
        "reasoning": [
          "Speed alone does not prove a specific misconception."
        ],
        "doNotConclude": [
          "This is a suspected learning pattern, not a confirmed diagnosis.",
          "Do not infer clinical or medical conditions.",
          "Do not treat fast wrong answers as proof of knowledge gaps without further evidence."
        ]
      },
      {
        "subjectId": "math",
        "topicId": "addition",
        "skillId": "arithmetic_operations",
        "subskillId": "addition",
        "errorType": "fast_guessing_pattern",
        "suspectedMisconception": "Very fast incorrect response may reflect guessing or pacing strategy.",
        "confidence": "high",
        "basedOn": [
          "responseMs:2000",
          "answer_mismatch"
        ],
        "reasoning": [
          "Speed alone does not prove a specific misconception."
        ],
        "doNotConclude": [
          "This is a suspected learning pattern, not a confirmed diagnosis.",
          "Do not infer clinical or medical conditions.",
          "Do not treat fast wrong answers as proof of knowledge gaps without further evidence."
        ]
      },
      {
        "subjectId": "math",
        "topicId": "addition",
        "skillId": "arithmetic_operations",
        "subskillId": "addition",
        "errorType": "fast_guessing_pattern",
        "suspectedMisconception": "Very fast incorrect response may reflect guessing or pacing strategy.",
        "confidence": "high",
        "basedOn": [
          "responseMs:2100",
          "answer_mismatch"
        ],
        "reasoning": [
          "Speed alone does not prove a specific misconception."
        ],
        "doNotConclude": [
          "This is a suspected learning pattern, not a confirmed diagnosis.",
          "Do not infer clinical or medical conditions.",
          "Do not treat fast wrong answers as proof of knowledge gaps without further evidence."
        ]
      },
      {
        "subjectId": "math",
        "topicId": "addition",
        "skillId": "arithmetic_operations",
        "subskillId": "addition",
        "errorType": "fast_guessing_pattern",
        "suspectedMisconception": "Very fast incorrect response may reflect guessing or pacing strategy.",
        "confidence": "high",
        "basedOn": [
          "responseMs:2200",
          "answer_mismatch"
        ],
        "reasoning": [
          "Speed alone does not prove a specific misconception."
        ],
        "doNotConclude": [
          "This is a suspected learning pattern, not a confirmed diagnosis.",
          "Do not infer clinical or medical conditions.",
          "Do not treat fast wrong answers as proof of knowledge gaps without further evidence."
        ]
      },
      {
        "subjectId": "math",
        "topicId": "addition",
        "skillId": "arithmetic_operations",
        "subskillId": "addition",
        "errorType": "fast_guessing_pattern",
        "suspectedMisconception": "Very fast incorrect response may reflect guessing or pacing strategy.",
        "confidence": "high",
        "basedOn": [
          "responseMs:2000",
          "answer_mismatch"
        ],
        "reasoning": [
          "Speed alone does not prove a specific misconception."
        ],
        "doNotConclude": [
          "This is a suspected learning pattern, not a confirmed diagnosis.",
          "Do not infer clinical or medical conditions.",
          "Do not treat fast wrong answers as proof of knowledge gaps without further evidence."
        ]
      },
      {
        "subjectId": "math",
        "topicId": "addition",
        "skillId": "arithmetic_operations",
        "subskillId": "addition",
        "errorType": "fast_guessing_pattern",
        "suspectedMisconception": "Very fast incorrect response may reflect guessing or pacing strategy.",
        "confidence": "high",
        "basedOn": [
          "responseMs:2100",
          "answer_mismatch"
        ],
        "reasoning": [
          "Speed alone does not prove a specific misconception."
        ],
        "doNotConclude": [
          "This is a suspected learning pattern, not a confirmed diagnosis.",
          "Do not infer clinical or medical conditions.",
          "Do not treat fast wrong answers as proof of knowledge gaps without further evidence."
        ]
      },
      {
        "subjectId": "math",
        "topicId": "addition",
        "skillId": "arithmetic_operations",
        "subskillId": "addition",
        "errorType": "fast_guessing_pattern",
        "suspectedMisconception": "Very fast incorrect response may reflect guessing or pacing strategy.",
        "confidence": "high",
        "basedOn": [
          "responseMs:2200",
          "answer_mismatch"
        ],
        "reasoning": [
          "Speed alone does not prove a specific misconception."
        ],
        "doNotConclude": [
          "This is a suspected learning pattern, not a confirmed diagnosis.",
          "Do not infer clinical or medical conditions.",
          "Do not treat fast wrong answers as proof of knowledge gaps without further evidence."
        ]
      },
      {
        "subjectId": "math",
        "topicId": "addition",
        "skillId": "arithmetic_operations",
        "subskillId": "addition",
        "errorType": "fast_guessing_pattern",
        "suspectedMisconception": "Very fast incorrect response may reflect guessing or pacing strategy.",
        "confidence": "high",
        "basedOn": [
          "responseMs:2000",
          "answer_mismatch"
        ],
        "reasoning": [
          "Speed alone does not prove a specific misconception."
        ],
        "doNotConclude": [
          "This is a suspected learning pattern, not a confirmed diagnosis.",
          "Do not infer clinical or medical conditions.",
          "Do not treat fast wrong answers as proof of knowledge gaps without further evidence."
        ]
      },
      {
        "subjectId": "math",
        "topicId": "addition",
        "skillId": "arithmetic_operations",
        "subskillId": "addition",
        "errorType": "fast_guessing_pattern",
        "suspectedMisconception": "Very fast incorrect response may reflect guessing or pacing strategy.",
        "confidence": "high",
        "basedOn": [
          "responseMs:2100",
          "answer_mismatch"
        ],
        "reasoning": [
          "Speed alone does not prove a specific misconception."
        ],
        "doNotConclude": [
          "This is a suspected learning pattern, not a confirmed diagnosis.",
          "Do not infer clinical or medical conditions.",
          "Do not treat fast wrong answers as proof of knowledge gaps without further evidence."
        ]
      }
    ],
    "typeHistogram": {
      "fast_guessing_pattern": 20
    },
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
      "skillId": "arithmetic_operations",
      "blockedSkillId": "arithmetic_operations",
      "suspectedPrerequisiteGap": false,
      "suspectedDirectSkillGap": true,
      "confidence": "low",
      "evidence": [
        "No prerequisite edges defined—treat as focal skill signal until mapped."
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
      "probeReason": "Suspected misconception signal: fast_guessing_pattern",
      "targetSubjectId": "math",
      "targetSkillId": "arithmetic_operations",
      "targetSubskillId": null,
      "probeType": "misconception_confirmation",
      "recommendedQuestionTypes": [
        "mcq"
      ],
      "numberOfQuestions": 3,
      "successCriteria": "Consistent correct responses on parallel items",
      "failureCriteria": "Repeated same distractor selection",
      "nextDecisionAfterProbe": "Escalate practice specificity"
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
      "questionCount": 40,
      "accuracy": 30,
      "sessionsApprox": null,
      "trend": "unknown",
      "comparedToSubjectAverage": 0
    },
    "reasoning": [
      "Observed topic accuracy is approximately 30% over 40 questions in-window.",
      "Subject-level question volume in-window is approximately 40.",
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
    "skillId": "arithmetic_operations",
    "subskillId": null,
    "evidenceLevel": "see_mastery",
    "confidence": "low",
    "basedOn": [
      "No prerequisite edges defined—treat as focal skill signal until mapped."
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
