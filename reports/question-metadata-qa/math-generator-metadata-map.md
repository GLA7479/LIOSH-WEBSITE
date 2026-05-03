# Math generator metadata map

_Generated: 2026-05-03T13:49:42.933Z_

## Generator

- **Path:** `utils/math-question-generator.js`
- **Kind literals found:** 96
- **Operations (union):** 24

## Safe apply strategy

Runtime: `attachProfessionalMathMetadata` merges subject/skillId/subskillId/difficulty/cognitiveLevel/expectedErrorTypes and fills params.diagnosticSkillId / subtype / patternFamily when missing.

- **Risk:** low

## proposedMappingSummary

```json
{
  "skillId": "Prefer params.diagnosticSkillId (probes / fractions); else `math_${kind}`; else `math_op_${selectedOp}`.",
  "subskillId": "params.subtype || patternFamily || kind || selectedOp",
  "difficulty": "mapMathLevelKeyToDifficulty(easy|medium|hard) → canonical basic|standard|advanced",
  "cognitiveLevel": "inferMathCognitiveLevel from probePower, kind prefix, word_problems, level",
  "expectedErrorTypes": "union of expectedErrorTags (filtered to taxonomy) + heuristics by kind/operation",
  "prerequisiteSkillIds": "empty in fast-track (curriculum graph not auto-inferred)"
}
```
