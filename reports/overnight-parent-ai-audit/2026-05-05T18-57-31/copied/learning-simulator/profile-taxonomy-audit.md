# Profile taxonomy audit (simulator)

- Generated: 2026-05-05T19:20:19.310Z

## Base profile IDs

- `p_strong_all_subjects`
- `p_thin_data`
- `p_improving_student`
- `p_declining_student`
- `p_weak_math_fractions`
- `p_weak_hebrew_comprehension`
- `p_weak_english_grammar`
- `p_weak_science_experiments`
- `p_weak_geometry_area`
- `p_weak_moledet_maps`
- `p_weak_all_subjects`
- `p_random_guessing_student`
- `p_inconsistent_student`

## Fixture scenarios

- Quick: 10 scenarios
- Deep: 12 scenarios

## Grades / subjects touched (fixtures)

- Grades: g3, g4, g5
- Subjects: english, geometry, hebrew, math, moledet_geography, science

## Gaps / synthetic types

- No explicit `average_student` base profile — synthesized in stress harness.
- No dedicated `fast_wrong` / `slow_correct` — derived by mutating RT policies.
- No `subject_specific_strong` base profile — synthesized via topicStrengths in stress harness.

Full JSON: `C:/Users/ERAN YOSEF/Desktop/final projects/FINAL-WEB/LIOSH-WEB-TRY/reports/learning-simulator/profile-taxonomy-audit.json`
