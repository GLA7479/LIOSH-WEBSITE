# Question metadata — enrichment suggestions (proposal only)

_Generated: 2026-05-03T12:34:57.122Z_

## Scope

- **Science questions analyzed:** 383
- **Suggestions emitted:** 383 (one row per science question)
- **Do not bulk-apply:** review each suggestion; semantics stay authoritative in Hebrew stems.

## Confidence distribution

| Level | Count |
| --- | ---: |
| high | 3 |
| medium | 47 |
| low | 333 |

## Review priority (queue)

| Priority | Count |
| --- | ---: |
| high | 333 |
| medium | 47 |
| low | 3 |

_Sequential prerequisite heuristic rows: 333_

## Fields most often changed vs current scanner snapshot

| Field | Questions where suggestion differs |
| --- | ---: |
| cognitiveLevel | 383 |
| difficulty | 383 |
| subskillId | 380 |
| expectedErrorTypes | 380 |
| prerequisiteSkillIds | 334 |

## Sample (first 15 ids)

| questionId | confidence | suggested subskillId | cognitive | prerequisites |
| --- | --- | --- | --- | --- |
| body_1 | high | science_body_heart_location | understanding |  |
| body_2 | high | science_body_sense_organs | understanding |  |
| body_3 | high | science_respiratory_gas_exchange | application | sci_body_fact_recall |
| body_4 | medium | sci_body_general | understanding |  |
| body_5 | medium | sci_body_general | analysis |  |
| body_6 | medium | sci_body_general | analysis |  |
| animals_1 | low | sci_animals_general | recall | body |
| animals_2 | low | sci_animals_general | understanding | body |
| animals_3 | low | sci_animals_general | understanding | body |
| animals_4 | low | sci_animals_general | analysis | body |
| animals_5 | low | sci_animals_general | analysis | body |
| animals_gapfix_hard_g12 | low | sci_animals_general | analysis | body |
| animals_gapfix_easy_g456 | low | sci_animals_general | recall | body |
| plants_1 | low | sci_plants_general | recall | animals |
| plants_2 | low | sci_plants_general | recall | animals |

## Outputs

- `reports/question-metadata-qa/enrichment-suggestions.json` — full payload
