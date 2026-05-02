# Unsupported / gap cells (classification)

- Generated at: 2026-05-02T21:51:04.283Z
- Cells in this report: 113
- coverageStatus **uncovered**: 0
- Classification **unknown_needs_review**: 0

## Counts by classification

| Classification | Count |
| --- | ---: |
| expected_runtime_gap | 0 |
| curriculum_only_not_runtime | 0 |
| missing_question_bank | 41 |
| missing_generator_adapter | 0 |
| missing_topic_adapter | 0 |
| mixed_or_ui_only_topic | 72 |
| unknown_needs_review | 0 |

## Examples per classification (up to 8 each)

### missing_question_bank

| grade | subject | topic | level | coverageStatus |
| --- | --- | --- | --- | --- |
| g1 | science | animals | hard | unsupported_needs_content |
| g1 | science | body | hard | unsupported_needs_content |
| g1 | science | earth_space | hard | unsupported_needs_content |
| g1 | science | environment | hard | unsupported_needs_content |
| g1 | science | materials | hard | unsupported_needs_content |
| g1 | science | plants | hard | unsupported_needs_content |
| g2 | english | translation | easy | unsupported_needs_content |
| g2 | english | translation | hard | unsupported_needs_content |

*Recommendation:* Add or extend MCQ bank JSON / English pools for this grade · topic · level band.

### mixed_or_ui_only_topic

| grade | subject | topic | level | coverageStatus |
| --- | --- | --- | --- | --- |
| g1 | hebrew | mixed | easy | unsupported_expected |
| g1 | hebrew | mixed | hard | unsupported_expected |
| g1 | hebrew | mixed | medium | unsupported_expected |
| g1 | math | mixed | easy | unsupported_expected |
| g1 | math | mixed | hard | unsupported_expected |
| g1 | math | mixed | medium | unsupported_expected |
| g1 | moledet_geography | mixed | easy | unsupported_expected |
| g1 | moledet_geography | mixed | hard | unsupported_expected |

*Recommendation:* Keep out of single-cell integrity; rely on mixed-session flows / UI tests instead of per-cell audits.

---

Full list: `C:/Users/ERAN YOSEF/Desktop/final projects/FINAL-WEB/LIOSH-WEB-TRY/reports/learning-simulator/unsupported-cells.json`
