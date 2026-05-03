# Scenario: mastery_decay_retention

**Disclaimer:** This is an internal educational diagnostic support review artifact. It is **not** a clinical or medical diagnosis. It is **not** a parent-facing report.

## 1. Scenario identity

- **Scenario id:** `mastery_decay_retention`
- **Scenario type:** retention
- **Subject(s):** math
- **Intended signal:** Old lastSessionMs on strong skill → retention_risk band.

## 2. Expected vs actual

- **Expected:** Old lastSessionMs on strong skill → retention_risk band.
- **Pass / fail (validation):** PASS
- **engineConfidence:** medium
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
        "questionCount": 28,
        "accuracy": 93,
        "sessionsApprox": null,
        "trend": "unknown",
        "comparedToSubjectAverage": 0
      },
      "reasoning": [
        "Observed topic accuracy is approximately 93% over 28 questions in-window.",
        "Subject-level question volume in-window is approximately 56.",
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
      "topicId": "subtraction",
      "skillId": "arithmetic_operations",
      "evidenceLevel": "medium",
      "confidence": "medium",
      "basedOn": {
        "questionCount": 28,
        "accuracy": 93,
        "sessionsApprox": null,
        "trend": "unknown",
        "comparedToSubjectAverage": 0
      },
      "reasoning": [
        "Observed topic accuracy is approximately 93% over 28 questions in-window.",
        "Subject-level question volume in-window is approximately 56.",
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

## 3. Raw / aggregate data summary

```json
{
  "summaryCounts": {
    "mathQuestions": 56,
    "hebrewQuestions": 0,
    "englishQuestions": 0,
    "scienceQuestions": 0,
    "geometryQuestions": 0,
    "moledetGeographyQuestions": 0,
    "mathAccuracy": 93,
    "hebrewAccuracy": null,
    "englishAccuracy": null,
    "scienceAccuracy": null,
    "geometryAccuracy": null,
    "moledetGeographyAccuracy": null,
    "totalQuestions": 56
  },
  "topicRows": [
    {
      "subjectId": "math",
      "rowKeyShort": "addition",
      "questions": 28,
      "correct": 26,
      "wrong": 2,
      "accuracy": 93,
      "displayName": "addition",
      "difficultyTier": "medium",
      "lastSessionMs": 1770022604703,
      "trend": null
    },
    {
      "subjectId": "math",
      "rowKeyShort": "subtraction",
      "questions": 28,
      "correct": 26,
      "wrong": 2,
      "accuracy": 93,
      "displayName": "subtraction",
      "difficultyTier": "hard",
      "lastSessionMs": 1770022604703,
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
  "reliabilityScore": 67,
  "dataTrustLevel": "moderate",
  "effortSignal": "neutral",
  "guessingLikelihood": 0,
  "inconsistencyLevel": "low",
  "accuracySpreadAcrossRows": 0,
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
    "gradeExpectation": 69,
    "difficultyAdjustedAccuracy": 79.1,
    "gradeRelativeBand": "aboveExpected",
    "belowExpected": false,
    "atExpected": false,
    "aboveExpected": true,
    "difficultyCoverage": 0,
    "challengeReadiness": "high",
    "flags": {
      "gradeMismatch": false,
      "missingDifficultyMetadata": false,
      "easyOnlyHighAccuracy": false,
      "hardQuestionSignal": true
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
    "masteryScore": 83.7,
    "masteryBand": "retention_risk",
    "confidence": "high",
    "evidenceLevel": "strong",
    "questionCount": 56,
    "recentAccuracy": 93,
    "weightedAccuracy": 93,
    "trend": "unknown",
    "consistency": "low",
    "lastPracticedAt": "2026-02-02T08:56:44.703Z",
    "retentionRisk": true,
    "easyOnlyProfile": false,
    "difficultyTiersObserved": [
      "medium",
      "hard"
    ],
    "recommendedState": "review_and_reassess"
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
      "probeReason": "Default maintenance probe—confirm stability.",
      "targetSubjectId": null,
      "targetSkillId": null,
      "targetSubskillId": null,
      "probeType": "targeted_skill",
      "recommendedQuestionTypes": [
        "mcq"
      ],
      "numberOfQuestions": 2,
      "successCriteria": "Meet or exceed recent accuracy band",
      "failureCriteria": "Accuracy drops materially",
      "nextDecisionAfterProbe": "Adjust practice plan"
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
      "questionCount": 28,
      "accuracy": 93,
      "sessionsApprox": null,
      "trend": "unknown",
      "comparedToSubjectAverage": 0
    },
    "reasoning": [
      "Observed topic accuracy is approximately 93% over 28 questions in-window.",
      "Subject-level question volume in-window is approximately 56.",
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
    "skillId": "arithmetic_operations",
    "subskillId": null,
    "topicId": "subtraction",
    "evidenceLevel": "medium",
    "confidence": "medium",
    "basedOn": {
      "questionCount": 28,
      "accuracy": 93,
      "sessionsApprox": null,
      "trend": "unknown",
      "comparedToSubjectAverage": 0
    },
    "reasoning": [
      "Observed topic accuracy is approximately 93% over 28 questions in-window.",
      "Subject-level question volume in-window is approximately 56.",
      "Dominant behavior signal on the row: undetermined (informational, not a diagnosis)."
    ],
    "doNotConclude": [
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
