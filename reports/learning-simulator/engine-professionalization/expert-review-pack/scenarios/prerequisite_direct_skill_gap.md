# Scenario: prerequisite_direct_skill_gap

**Disclaimer:** This is an internal educational diagnostic support review artifact. It is **not** a clinical or medical diagnosis. It is **not** a parent-facing report.

> This scenario file was produced in **artifact snapshot mode** (from `professional-engine-validation.json` only). It does not embed the full `professionalEngineV1` object. For the full replay pack (aggregates + engine JSON), run `npm run qa:learning-simulator:expert-review-pack` in a local/CI Node environment.

## 1. Scenario identity

- **Scenario id:** `prerequisite_direct_skill_gap`
- **Scenario type:** dependency
- **Subject(s) (inferred from validation snapshot):** math
- **Intended signal:** Strong prerequisites + weak fractions → direct focal skill hypothesis.

## 2. Expected vs actual (validation artifact)

- **Expected:** Strong prerequisites + weak fractions → direct focal skill hypothesis.
- **Pass / fail (validation):** PASS

### Validation snapshot (`actual`)

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
