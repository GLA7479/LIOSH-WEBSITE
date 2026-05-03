# Scenario: cross_subject_instruction_overlap

**Disclaimer:** This is an internal educational diagnostic support review artifact. It is **not** a clinical or medical diagnosis. It is **not** a parent-facing report.

## 1. Scenario identity

- **Scenario id:** `cross_subject_instruction_overlap`
- **Scenario type:** cross_subject
- **Subject(s):** math, hebrew
- **Intended signal:** Cross-subject pattern only when both subjects have volume + weakness.

## 2. Expected vs actual

- **Expected:** Cross-subject pattern only when both subjects have volume + weakness.
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
      "topicId": "word_problems",
      "skillId": "word_problems",
      "evidenceLevel": "limited",
      "confidence": "low",
      "basedOn": {
        "questionCount": 18,
        "accuracy": 33,
        "sessionsApprox": null,
        "trend": "unknown",
        "comparedToSubjectAverage": 0
      },
      "reasoning": [
        "Observed topic accuracy is approximately 33% over 18 questions in-window.",
        "Subject-level question volume in-window is approximately 18.",
        "Dominant behavior signal on the row: undetermined (informational, not a diagnosis).",
        "Evidence is limited—interpretation should stay cautious."
      ],
      "doNotConclude": [
        "אין הבנה",
        "Subject-wide weakness is not asserted from a single weak topic; other topics in this subject should show weakness across multiple skills.",
        "Do not draw strong conclusions until more practice data is collected."
      ],
      "nextAction": {
        "type": "targeted_practice"
      },
      "frameworkMeta": {
        "frameworkVersion": "1.1.0",
        "skillPackKey": "word_problems",
        "subskillsAvailable": [
          "identify_operation_from_text",
          "translate_text_to_equation",
          "multi_step_reasoning",
          "irrelevant_information",
          "reading_the_question"
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
      "evidenceLevel": "limited",
      "confidence": "low",
      "basedOn": {
        "questionCount": 18,
        "accuracy": 33,
        "sessionsApprox": null,
        "trend": "unknown",
        "comparedToSubjectAverage": 0
      },
      "reasoning": [
        "Observed topic accuracy is approximately 33% over 18 questions in-window.",
        "Subject-level question volume in-window is approximately 18.",
        "Dominant behavior signal on the row: undetermined (informational, not a diagnosis).",
        "Evidence is limited—interpretation should stay cautious."
      ],
      "doNotConclude": [
        "אין הבנה",
        "Subject-wide weakness is not asserted from a single weak topic; other topics in this subject should show weakness across multiple skills.",
        "Do not draw strong conclusions until more practice data is collected."
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
  "crossSubjectPatternCount": 1,
  "dependencyItems": 2,
  "masteryBandsSample": [
    "math/word_problems:emerging",
    "hebrew/reading_comprehension:emerging"
  ]
}
```

## 3. Raw / aggregate data summary

```json
{
  "summaryCounts": {
    "mathQuestions": 18,
    "hebrewQuestions": 18,
    "englishQuestions": 0,
    "scienceQuestions": 0,
    "geometryQuestions": 0,
    "moledetGeographyQuestions": 0,
    "mathAccuracy": 33,
    "hebrewAccuracy": 33,
    "englishAccuracy": null,
    "scienceAccuracy": null,
    "geometryAccuracy": null,
    "moledetGeographyAccuracy": null,
    "totalQuestions": 36
  },
  "topicRows": [
    {
      "subjectId": "math",
      "rowKeyShort": "word_problems",
      "questions": 18,
      "correct": 6,
      "wrong": 12,
      "accuracy": 33,
      "displayName": "word problems",
      "difficultyTier": null,
      "lastSessionMs": null,
      "trend": null
    },
    {
      "subjectId": "hebrew",
      "rowKeyShort": "comprehension",
      "questions": 18,
      "correct": 6,
      "wrong": 12,
      "accuracy": 33,
      "displayName": "comprehension",
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
    "gradeExpectation": 59.5,
    "difficultyAdjustedAccuracy": 28.1,
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
    "gradeExpectation": 59.5,
    "difficultyAdjustedAccuracy": 28.1,
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
    "skillId": "word_problems",
    "subskillId": "_rollup",
    "masteryScore": 26.4,
    "masteryBand": "emerging",
    "confidence": "low",
    "evidenceLevel": "medium",
    "questionCount": 18,
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
    "subjectId": "hebrew",
    "skillId": "reading_comprehension",
    "subskillId": "_rollup",
    "masteryScore": 26.4,
    "masteryBand": "emerging",
    "confidence": "low",
    "evidenceLevel": "medium",
    "questionCount": 18,
    "recentAccuracy": 33,
    "weightedAccuracy": 33,
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
      "skillId": "word_problems",
      "blockedSkillId": "word_problems",
      "suspectedPrerequisiteGap": true,
      "suspectedDirectSkillGap": false,
      "confidence": "low",
      "evidence": [
        "Prerequisite arithmetic_operations appears weak or unmeasured.",
        "Prerequisite fractions appears weak or unmeasured."
      ],
      "reasoning": [
        "Dependencies are educational hypotheses—verify with targeted probes.",
        "A weak advanced skill with weak prerequisites may indicate foundation gaps."
      ],
      "nextBestPrerequisiteToCheck": "arithmetic_operations",
      "doNotConclude": [
        "Do not label subject-wide failure from a single dependency edge.",
        "No clinical or medical conclusions."
      ]
    },
    {
      "skillId": "reading_comprehension",
      "blockedSkillId": "reading_comprehension",
      "suspectedPrerequisiteGap": true,
      "suspectedDirectSkillGap": false,
      "confidence": "low",
      "evidence": [
        "Prerequisite language_grammar appears weak or unmeasured."
      ],
      "reasoning": [
        "Dependencies are educational hypotheses—verify with targeted probes.",
        "A weak advanced skill with weak prerequisites may indicate foundation gaps."
      ],
      "nextBestPrerequisiteToCheck": "language_grammar",
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
      "probeReason": "Prerequisite strengths unclear relative to advanced skill.",
      "targetSubjectId": "math",
      "targetSkillId": "arithmetic_operations",
      "targetSubskillId": null,
      "probeType": "prerequisite_check",
      "recommendedQuestionTypes": [
        "mcq"
      ],
      "numberOfQuestions": 4,
      "successCriteria": "Prerequisite skill shows independent accuracy",
      "failureCriteria": "Prerequisite remains unstable",
      "nextDecisionAfterProbe": "Foundation review vs isolated advanced gap"
    }
  ]
}
```

### Cross-subject patterns

```json
{
  "version": "1.0.0",
  "patterns": [
    {
      "crossSubjectPattern": "instruction_or_reading_component_possible",
      "involvedSubjects": [
        "math",
        "hebrew"
      ],
      "evidence": [
        "Weak math word-problem row with concurrent Hebrew comprehension signal."
      ],
      "confidence": "low",
      "reasoning": [
        "Both subjects show limited accuracy with adequate volume—may share comprehension/instruction factors."
      ],
      "doNotConclude": [
        "Not a clinical diagnosis.",
        "Requires targeted probes in each subject before attributing shared cause."
      ],
      "nextProbe": {
        "probeType": "cross_subject_check",
        "subjects": [
          "math",
          "hebrew"
        ],
        "questionCount": 6
      }
    }
  ],
  "note": "Patterns require evidence in multiple subjects; thin single-subject data cannot trigger."
}
```

## 5. Evidence and reasoning (flattened)

```json
[
  {
    "findingType": "topic_signal",
    "subjectId": "math",
    "skillId": "word_problems",
    "subskillId": null,
    "topicId": "word_problems",
    "evidenceLevel": "limited",
    "confidence": "low",
    "basedOn": {
      "questionCount": 18,
      "accuracy": 33,
      "sessionsApprox": null,
      "trend": "unknown",
      "comparedToSubjectAverage": 0
    },
    "reasoning": [
      "Observed topic accuracy is approximately 33% over 18 questions in-window.",
      "Subject-level question volume in-window is approximately 18.",
      "Dominant behavior signal on the row: undetermined (informational, not a diagnosis).",
      "Evidence is limited—interpretation should stay cautious."
    ],
    "doNotConclude": [
      "אין הבנה",
      "Subject-wide weakness is not asserted from a single weak topic; other topics in this subject should show weakness across multiple skills.",
      "Do not draw strong conclusions until more practice data is collected."
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
    "evidenceLevel": "limited",
    "confidence": "low",
    "basedOn": {
      "questionCount": 18,
      "accuracy": 33,
      "sessionsApprox": null,
      "trend": "unknown",
      "comparedToSubjectAverage": 0
    },
    "reasoning": [
      "Observed topic accuracy is approximately 33% over 18 questions in-window.",
      "Subject-level question volume in-window is approximately 18.",
      "Dominant behavior signal on the row: undetermined (informational, not a diagnosis).",
      "Evidence is limited—interpretation should stay cautious."
    ],
    "doNotConclude": [
      "אין הבנה",
      "Subject-wide weakness is not asserted from a single weak topic; other topics in this subject should show weakness across multiple skills.",
      "Do not draw strong conclusions until more practice data is collected."
    ],
    "nextAction": {
      "type": "targeted_practice"
    }
  },
  {
    "findingType": "dependency_hypothesis",
    "subjectId": "math",
    "skillId": "word_problems",
    "subskillId": null,
    "evidenceLevel": "see_mastery",
    "confidence": "low",
    "basedOn": [
      "Prerequisite arithmetic_operations appears weak or unmeasured.",
      "Prerequisite fractions appears weak or unmeasured."
    ],
    "reasoning": [
      "Dependencies are educational hypotheses—verify with targeted probes.",
      "A weak advanced skill with weak prerequisites may indicate foundation gaps."
    ],
    "doNotConclude": [
      "Do not label subject-wide failure from a single dependency edge.",
      "No clinical or medical conclusions."
    ],
    "nextAction": {
      "type": "prerequisite_probe",
      "target": "arithmetic_operations"
    }
  },
  {
    "findingType": "dependency_hypothesis",
    "subjectId": "hebrew",
    "skillId": "reading_comprehension",
    "subskillId": null,
    "evidenceLevel": "see_mastery",
    "confidence": "low",
    "basedOn": [
      "Prerequisite language_grammar appears weak or unmeasured."
    ],
    "reasoning": [
      "Dependencies are educational hypotheses—verify with targeted probes.",
      "A weak advanced skill with weak prerequisites may indicate foundation gaps."
    ],
    "doNotConclude": [
      "Do not label subject-wide failure from a single dependency edge.",
      "No clinical or medical conclusions."
    ],
    "nextAction": {
      "type": "prerequisite_probe",
      "target": "language_grammar"
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
