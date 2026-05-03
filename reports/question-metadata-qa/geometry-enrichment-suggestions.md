# Geometry metadata — enrichment suggestions (proposal only)

_Generated: 2026-05-03T13:05:16.379Z_

## Scope

- **Geometry conceptual rows analyzed:** 52
- **Suggestions emitted:** 52
- **Prerequisite suggestions (non-empty):** 3
- **Sources:** `utils/geometry-conceptual-bank.js (GEOMETRY_CONCEPTUAL_ITEMS)`, `utils/geometry-question-generator.js (procedural — documented only)`

## Confidence distribution

| Level | Count |
| --- | ---: |
| high | 8 |
| medium | 44 |
| low | 0 |

## Review priority (queue)

| Priority | Count |
| --- | ---: |
| high | 0 |
| medium | 44 |
| low | 8 |

## Fields most often changed vs current scanner snapshot

| Field | Rows where suggestion differs |
| --- | ---: |
| difficulty | 52 |
| cognitiveLevel | 52 |
| expectedErrorTypes | 50 |
| prerequisiteSkillIds | 3 |

## Sample (first 15 ids)

| questionId | confidence | suggested difficulty | cognitive | prerequisites |
| --- | --- | --- | --- | --- |
| utils/geometry-conceptual-bank.js::GEOMETRY_CONCEPTUAL_ITEMS[0]::#0 | high | basic | recall |  |
| utils/geometry-conceptual-bank.js::GEOMETRY_CONCEPTUAL_ITEMS[1]::#1 | high | basic | recall |  |
| utils/geometry-conceptual-bank.js::GEOMETRY_CONCEPTUAL_ITEMS[2]::#2 | high | basic | recall |  |
| utils/geometry-conceptual-bank.js::GEOMETRY_CONCEPTUAL_ITEMS[3]::#3 | high | basic | recall |  |
| utils/geometry-conceptual-bank.js::GEOMETRY_CONCEPTUAL_ITEMS[4]::#4 | high | standard | application | geo_pv_area_vs_perimeter |
| utils/geometry-conceptual-bank.js::GEOMETRY_CONCEPTUAL_ITEMS[5]::#5 | high | standard | application | geo_pv_area_vs_perimeter |
| utils/geometry-conceptual-bank.js::GEOMETRY_CONCEPTUAL_ITEMS[6]::#6 | medium | advanced | analysis |  |
| utils/geometry-conceptual-bank.js::GEOMETRY_CONCEPTUAL_ITEMS[7]::#7 | medium | basic | understanding |  |
| utils/geometry-conceptual-bank.js::GEOMETRY_CONCEPTUAL_ITEMS[8]::#8 | medium | basic | understanding | tri_sum_180 |
| utils/geometry-conceptual-bank.js::GEOMETRY_CONCEPTUAL_ITEMS[9]::#9 | high | standard | understanding |  |
| utils/geometry-conceptual-bank.js::GEOMETRY_CONCEPTUAL_ITEMS[10]::#10 | high | standard | understanding |  |
| utils/geometry-conceptual-bank.js::GEOMETRY_CONCEPTUAL_ITEMS[11]::#11 | medium | advanced | understanding |  |
| utils/geometry-conceptual-bank.js::GEOMETRY_CONCEPTUAL_ITEMS[12]::#12 | medium | basic | recall |  |
| utils/geometry-conceptual-bank.js::GEOMETRY_CONCEPTUAL_ITEMS[13]::#13 | medium | basic | recall |  |
| utils/geometry-conceptual-bank.js::GEOMETRY_CONCEPTUAL_ITEMS[14]::#14 | medium | basic | recall |  |

## Outputs

- `reports/question-metadata-qa/geometry-enrichment-suggestions.json` — full payload
