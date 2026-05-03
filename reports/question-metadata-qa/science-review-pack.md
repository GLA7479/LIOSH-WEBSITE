# Science metadata — enrichment review pack

_Generated: 2026-05-03T12:36:07.575Z_
_Enrichment source: C:\Users\ERAN YOSEF\Desktop\final projects\FINAL-WEB\LIOSH-WEB-TRY\reports\question-metadata-qa\enrichment-suggestions.json_

## Summary

- **Science suggestions:** 383
- **Confidence — high / medium / low:** 3 / 47 / 333
- **Review priority — high / medium / low:** 333 / 47 / 3
- **Sequential prerequisite heuristic rows:** 333
- **Low confidence rows:** 333

## Checklist (human)

- **Approve as-is:** Use only for rows with confidence **high**, reviewPriority **low**, after spot-checking Hebrew stem alignment.
- **Edit metadata:** Adjust suggested subskill/cognitive/error/prerequisite ids in the bank JSON — **do not** change stems without curriculum approval.
- **Reject suggestion:** Discard automated suggestion when taxonomy mapping conflicts with classroom sequencing or engine routing.
- **Needs curriculum expert:** Required for all **low** confidence rows, sequential prerequisite chains, and any prerequisite graph change affecting reports.

## Top reasons among low-confidence suggestions

| Reason (truncated) | Count |
| --- | ---: |
| Prerequisite suggestion uses sequential-topic heuristic (SCIENCE_TOPIC_ORDER); treat as unverified pedagogy. | 333 |
| Overall confidence capped at low because inferred prerequisites are sequential guesses, not curriculum-approved links. | 333 |

## Grouped by skillId

| Skill | Count | Examples |
| --- | ---: | --- |
| animals | 51 | animals_1, animals_2, animals_3, animals_4, animals_5, animals_gapfix_hard_g12 |
| body | 47 | body_4, body_5, body_6, body_7, body_8, body_9 |
| earth_space | 66 | earth_1, earth_2, earth_3, earth_4, earth_5, earth_6 |
| environment | 65 | env_1, env_2, env_3, env_4, env_5, env_6 |
| experiments | 59 | exp_1, exp_2, exp_3, exp_4, exp_5, exp_6 |
| materials | 46 | materials_1, materials_2, materials_3, materials_4, materials_5, materials_6 |
| plants | 46 | plants_1, plants_2, plants_3, plants_4, plants_5, plants_6 |
| sci_body_fact_recall | 2 | body_1, body_2 |
| sci_respiration_concept | 1 | body_3 |

## Grouped by topic

| Topic | Count | Examples |
| --- | ---: | --- |
| animals | 51 | animals_1, animals_2, animals_3, animals_4, animals_5, animals_gapfix_hard_g12 |
| body | 50 | body_1, body_2, body_3, body_4, body_5, body_6 |
| earth_space | 66 | earth_1, earth_2, earth_3, earth_4, earth_5, earth_6 |
| environment | 65 | env_1, env_2, env_3, env_4, env_5, env_6 |
| experiments | 59 | exp_1, exp_2, exp_3, exp_4, exp_5, exp_6 |
| materials | 46 | materials_1, materials_2, materials_3, materials_4, materials_5, materials_6 |
| plants | 46 | plants_1, plants_2, plants_3, plants_4, plants_5, plants_6 |

## Taxonomy unknown expected-error tokens (global QA)

_Rows in questions-with-issues.json sample with taxonomy_unknown_expected_error_type: 7._
_Global QA count (summary.json top issues): 9._
_Unique unknown token values listed below: 3._

| Token | Occurrences | Example questionIds |
| --- | ---: | --- |
| grammar_pattern_error | 4 | 0, 1, 2, 3 |
| inference_error | 2 | 2, 3 |
| sequence_error | 1 | 4 |

## Outputs

- `reports/question-metadata-qa/science-review-pack.json`
