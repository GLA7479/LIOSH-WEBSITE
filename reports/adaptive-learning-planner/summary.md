# Adaptive Learning Planner — selftest summary

- **Generated:** 2026-05-03T21:05:34.259Z
- **Cases:** 13 | **Passed:** 13 | **Failed:** 0

## Results

| Case | Pass | plannerStatus | nextAction |
| --- | --- | --- | --- |
| strong_mastery_advance | yes | ready | advance_skill |
| remediate_current_skill | yes | ready | practice_current |
| thin_data_pause | yes | caution | pause_collect_more_data |
| do_not_conclude_caution | yes | caution | pause_collect_more_data |
| prerequisite_review | yes | ready | review_prerequisite |
| guessing_probe | yes | caution | probe_skill |
| inconsistency_probe | yes | caution | probe_skill |
| engine_insufficient_data | yes | insufficient_data | pause_collect_more_data |
| missing_subject | yes | insufficient_data | pause_collect_more_data |
| missing_metadata_advance_blocked | yes | needs_human_review | pause_collect_more_data |
| english_missing_skill | yes | needs_human_review | pause_collect_more_data |
| english_skill_incomplete_flag | yes | needs_human_review | pause_collect_more_data |
| maintain_strong | yes | ready | maintain_skill |

See `docs/adaptive-learning-planner.md` for contract and safety rules.
