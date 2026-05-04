# Scenario: thin_data

**Disclaimer:** This is an internal educational diagnostic support review artifact. It is **not** a clinical or medical diagnosis. It is **not** a parent-facing report.

## 1. Scenario identity

- **Scenario id:** `thin_data`
- **Scenario type:** thin_data
- **Subject(s):** math
- **Intended signal:** Thin total volume → needs_more_data, low confidence, no mastered band.

## 2. Expected vs actual

- **Expected:** Thin total volume → needs_more_data, low confidence, no mastered band.
- **Pass / fail (validation):** PASS
- **engineConfidence:** low
- **engineReadiness:** needs_more_data

### skillFindings (framework) / subskillFindings

```json
{
  "skillFindings": [
    {
      "findingType": "insufficient_evidence_signal",
      "subjectId": "math",
      "topicId": "addition",
      "skillId": "arithmetic_operations",
      "evidenceLevel": "thin",
      "confidence": "very_low",
      "basedOn": {
        "questionCount": 3,
        "accuracy": 100,
        "sessionsApprox": null,
        "trend": "unknown",
        "comparedToSubjectAverage": 0
      },
      "reasoning": [
        "Observed topic accuracy is approximately 100% over 3 questions in-window.",
        "Subject-level question volume in-window is approximately 3.",
        "Dominant behavior signal on the row: undetermined (informational, not a diagnosis).",
        "Evidence is limited—interpretation should stay cautious."
      ],
      "doNotConclude": [
        "Subject-wide weakness is not asserted from a single weak topic; other topics in this subject should show weakness across multiple skills.",
        "Do not draw strong conclusions until more practice data is collected."
      ],
      "nextAction": {
        "type": "collect_more_data"
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
        "errorTypesConsidered": []
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

## 3. Raw / aggregate data summary

```json
{
  "summaryCounts": {
    "mathQuestions": 3,
    "hebrewQuestions": 0,
    "englishQuestions": 0,
    "scienceQuestions": 0,
    "geometryQuestions": 0,
    "moledetGeographyQuestions": 0,
    "mathAccuracy": 100,
    "hebrewAccuracy": null,
    "englishAccuracy": null,
    "scienceAccuracy": null,
    "geometryAccuracy": null,
    "moledetGeographyAccuracy": null,
    "totalQuestions": 3
  },
  "topicRows": [
    {
      "subjectId": "math",
      "rowKeyShort": "addition",
      "questions": 3,
      "correct": 3,
      "wrong": 0,
      "accuracy": 100,
      "displayName": "addition",
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
  "reliabilityScore": 13,
  "dataTrustLevel": "very_low",
  "effortSignal": "neutral",
  "guessingLikelihood": 0,
  "inconsistencyLevel": "high",
  "accuracySpreadAcrossRows": 0,
  "pacePattern": "mixed",
  "confidenceAdjustment": -0.22,
  "reasoning": [
    "Thin volume lowers trust in diagnostic conclusions.",
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
    "gradeExpectation": 55.75,
    "difficultyAdjustedAccuracy": 85,
    "gradeRelativeBand": "aboveExpected",
    "belowExpected": false,
    "atExpected": false,
    "aboveExpected": true,
    "difficultyCoverage": 0,
    "challengeReadiness": "low",
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
    "masteryScore": 80,
    "masteryBand": "emerging",
    "confidence": "very_low",
    "evidenceLevel": "thin",
    "questionCount": 3,
    "recentAccuracy": 100,
    "weightedAccuracy": 100,
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
      "probeReason": "Thin practice window—need more observations before stable interpretation.",
      "targetSubjectId": null,
      "targetSkillId": null,
      "targetSubskillId": null,
      "probeType": "collect_more_data",
      "recommendedQuestionTypes": [
        "mcq",
        "short_set"
      ],
      "numberOfQuestions": 8,
      "successCriteria": "Stable accuracy over at least two sessions",
      "failureCriteria": "Continued random/incorrect pattern without convergence",
      "nextDecisionAfterProbe": "Re-evaluate mastery and misconceptions"
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
    "findingType": "insufficient_evidence_signal",
    "subjectId": "math",
    "skillId": "arithmetic_operations",
    "subskillId": null,
    "topicId": "addition",
    "evidenceLevel": "thin",
    "confidence": "very_low",
    "basedOn": {
      "questionCount": 3,
      "accuracy": 100,
      "sessionsApprox": null,
      "trend": "unknown",
      "comparedToSubjectAverage": 0
    },
    "reasoning": [
      "Observed topic accuracy is approximately 100% over 3 questions in-window.",
      "Subject-level question volume in-window is approximately 3.",
      "Dominant behavior signal on the row: undetermined (informational, not a diagnosis).",
      "Evidence is limited—interpretation should stay cautious."
    ],
    "doNotConclude": [
      "Subject-wide weakness is not asserted from a single weak topic; other topics in this subject should show weakness across multiple skills.",
      "Do not draw strong conclusions until more practice data is collected."
    ],
    "nextAction": {
      "type": "collect_more_data"
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
