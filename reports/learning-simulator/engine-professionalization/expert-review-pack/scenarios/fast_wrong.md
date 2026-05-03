# Scenario: fast_wrong

**Disclaimer:** This is an internal educational diagnostic support review artifact. It is **not** a clinical or medical diagnosis. It is **not** a parent-facing report.

> This scenario file was produced in **artifact snapshot mode** (from `professional-engine-validation.json` only). It does not embed the full `professionalEngineV1` object. For the full replay pack (aggregates + engine JSON), run `npm run qa:learning-simulator:expert-review-pack` in a local/CI Node environment.

## 1. Scenario identity

- **Scenario id:** `fast_wrong`
- **Scenario type:** reliability_pace
- **Subject(s) (inferred from validation snapshot):** math
- **Intended signal:** Very fast wrong responses drive guessing / pace signal.

## 2. Expected vs actual (validation artifact)

- **Expected:** Very fast wrong responses drive guessing / pace signal.
- **Pass / fail (validation):** PASS

### Validation snapshot (`actual`)

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

## 3. Full engine output

Not embedded in artifact mode. Use local CLI expert-review-pack for complete `professionalEngineV1`, reliability, mastery tables, etc.

## 4. Limitations

- Subskill and misconception precision is limited until question pools carry dense expectedErrorTypes and prerequisiteSkillIds.
- Cross-subject patterns are hypotheses and require confirming probes per subject.

## 5. Reviewer fields (machine-readable)

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
