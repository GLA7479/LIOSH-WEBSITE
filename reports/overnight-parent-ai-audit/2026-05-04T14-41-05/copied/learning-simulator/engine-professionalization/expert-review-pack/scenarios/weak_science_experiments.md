# Scenario: weak_science_experiments

**Disclaimer:** This is an internal educational diagnostic support review artifact. It is **not** a clinical or medical diagnosis. It is **not** a parent-facing report.

## 1. Scenario identity

- **Scenario id:** `weak_science_experiments`
- **Scenario type:** weak_topic_or_subject
- **Subject(s):** science
- **Intended signal:** Science experiments bucket mapped to experiments skill.

## 2. Expected vs actual

- **Expected:** Science experiments bucket mapped to experiments skill.
- **Pass / fail (validation):** PASS
- **engineConfidence:** low
- **engineReadiness:** needs_more_data

### skillFindings (framework) / subskillFindings

```json
{
  "skillFindings": [
    {
      "findingType": "topic_signal",
      "subjectId": "science",
      "topicId": "experiments",
      "skillId": "experiments",
      "evidenceLevel": "limited",
      "confidence": "low",
      "basedOn": {
        "questionCount": 24,
        "accuracy": 38,
        "sessionsApprox": null,
        "trend": "unknown",
        "comparedToSubjectAverage": 0
      },
      "reasoning": [
        "Observed topic accuracy is approximately 38% over 24 questions in-window.",
        "Subject-level question volume in-window is approximately 24.",
        "Dominant behavior signal on the row: undetermined (informational, not a diagnosis).",
        "Evidence is limited—interpretation should stay cautious."
      ],
      "doNotConclude": [
        "אין חשיבה",
        "Subject-wide weakness is not asserted from a single weak topic; other topics in this subject should show weakness across multiple skills.",
        "Do not draw strong conclusions until more practice data is collected."
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
  "reliabilityInconsistency": "low",
  "crossSubjectPatternCount": 0,
  "dependencyItems": 1,
  "masteryBandsSample": [
    "science/experiments:emerging"
  ]
}
```

## 3. Raw / aggregate data summary

```json
{
  "summaryCounts": {
    "mathQuestions": 0,
    "hebrewQuestions": 0,
    "englishQuestions": 0,
    "scienceQuestions": 24,
    "geometryQuestions": 0,
    "moledetGeographyQuestions": 0,
    "mathAccuracy": null,
    "hebrewAccuracy": null,
    "englishAccuracy": null,
    "scienceAccuracy": 38,
    "geometryAccuracy": null,
    "moledetGeographyAccuracy": null,
    "totalQuestions": 24
  },
  "topicRows": [
    {
      "subjectId": "science",
      "rowKeyShort": "experiments",
      "questions": 24,
      "correct": 9,
      "wrong": 15,
      "accuracy": 38,
      "displayName": "experiments",
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
  "reliabilityScore": 55,
  "dataTrustLevel": "low",
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
    "gradeExpectation": 61,
    "difficultyAdjustedAccuracy": 32.3,
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
    "subjectId": "science",
    "skillId": "experiments",
    "subskillId": "_rollup",
    "masteryScore": 30.4,
    "masteryBand": "emerging",
    "confidence": "medium",
    "evidenceLevel": "medium",
    "questionCount": 24,
    "recentAccuracy": 38,
    "weightedAccuracy": 38,
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
      "skillId": "experiments",
      "blockedSkillId": "experiments",
      "suspectedPrerequisiteGap": true,
      "suspectedDirectSkillGap": false,
      "confidence": "low",
      "evidence": [
        "Prerequisite observation appears weak or unmeasured.",
        "Prerequisite cause_and_effect appears weak or unmeasured."
      ],
      "reasoning": [
        "Dependencies are educational hypotheses—verify with targeted probes.",
        "A weak advanced skill with weak prerequisites may indicate foundation gaps."
      ],
      "nextBestPrerequisiteToCheck": "observation",
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
      "targetSubjectId": "science",
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
    },
    {
      "probeReason": "Prerequisite strengths unclear relative to advanced skill.",
      "targetSubjectId": "science",
      "targetSkillId": "observation",
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
  "patterns": [],
  "note": "Patterns require evidence in multiple subjects; thin single-subject data cannot trigger."
}
```

## 5. Evidence and reasoning (flattened)

```json
[
  {
    "findingType": "topic_signal",
    "subjectId": "science",
    "skillId": "experiments",
    "subskillId": null,
    "topicId": "experiments",
    "evidenceLevel": "limited",
    "confidence": "low",
    "basedOn": {
      "questionCount": 24,
      "accuracy": 38,
      "sessionsApprox": null,
      "trend": "unknown",
      "comparedToSubjectAverage": 0
    },
    "reasoning": [
      "Observed topic accuracy is approximately 38% over 24 questions in-window.",
      "Subject-level question volume in-window is approximately 24.",
      "Dominant behavior signal on the row: undetermined (informational, not a diagnosis).",
      "Evidence is limited—interpretation should stay cautious."
    ],
    "doNotConclude": [
      "אין חשיבה",
      "Subject-wide weakness is not asserted from a single weak topic; other topics in this subject should show weakness across multiple skills.",
      "Do not draw strong conclusions until more practice data is collected."
    ],
    "nextAction": {
      "type": "targeted_practice"
    }
  },
  {
    "findingType": "dependency_hypothesis",
    "subjectId": "science",
    "skillId": "experiments",
    "subskillId": null,
    "evidenceLevel": "see_mastery",
    "confidence": "low",
    "basedOn": [
      "Prerequisite observation appears weak or unmeasured.",
      "Prerequisite cause_and_effect appears weak or unmeasured."
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
      "target": "observation"
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
