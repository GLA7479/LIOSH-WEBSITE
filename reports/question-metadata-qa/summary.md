# Question metadata QA

- **Generated:** 2026-05-03T21:06:37.217Z
- **Gate decision:** `pass_with_advisory` — scanOutcome=`ok`, advisoryStatus=`WARN`
- **Blocking issues (policy):** 0 | **Advisory:** 15876 | **Exempt (catalog):** 878
- **Questions scanned:** 5756
- **High / medium risk:** 439 / 0
- **Duplicate declared IDs (cross-file):** 0
- **Skill buckets below 5 questions:** 299

## Blocking vs advisory (policy gate)

| Policy field | Value |
| --- | --- |
| gateDecision | pass_with_advisory |
| blockingIssueCount | 0 |
| advisoryIssueCount | 15876 |
| exemptedIssueCount | 878 |

### Top blocking codes

_None._

### Top advisory codes

| Code | Count |
| --- | ---: |
| missing_prerequisite_skill_ids | 5750 |
| implicit_id_only | 5373 |
| missing_explanation | 4753 |

### Known exemptions

English **missing_skillId** / **missing_subskillId** on grammar pools are deferred per safe-pass policy — see `utils/question-metadata-qa/question-metadata-gate-policy.js`.

## Subject readiness (rollup)

| Subject | Questions | Readiness | % skillId | % expl | High risk |
| --- | ---: | --- | ---: | ---: | ---: |
| science | 383 | strong | 100 | 100 | 0 |
| hebrew | 54 | strong | 100 | 0 | 0 |
| english | 670 | weak | 34.5 | 92.5 | 439 |
| moledet-geography | 3506 | strong | 100 | 0 | 0 |
| hebrew-archive | 1091 | strong | 100 | 0 | 0 |
| geometry | 52 | strong | 100 | 0 | 0 |

## Top issue codes (global)

| Code | Count |
| --- | ---: |
| missing_prerequisite_skill_ids | 5750 |
| implicit_id_only | 5373 |
| missing_explanation | 4753 |
| missing_skillId | 439 |
| missing_subskillId | 439 |

## Outputs

- `reports/question-metadata-qa/summary.json` — full payload
- `reports/question-metadata-qa/skill-coverage.json` — per-skill coverage
- `reports/question-metadata-qa/questions-with-issues.json` — questions with any issue (truncated)

## Load errors

_None._
