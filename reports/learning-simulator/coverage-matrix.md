# Learning simulator coverage matrix

- Generated at: 2026-05-02T20:06:12.731Z
- Total rows: 819
- Subjects: english, geometry, hebrew, math, moledet_geography, science

## Per-subject topic counts (distinct topic keys)

- **english**: 6 topics (grammar, mixed, sentences, translation, vocabulary, writing)
- **geometry**: 18 topics (angles, area, circles, diagonal, heights, mixed, parallel_perpendicular, perimeter, pythagoras, quadrilaterals, rotation, shapes_basic, solids, symmetry, tiling, transformations, triangles, volume)
- **hebrew**: 7 topics (comprehension, grammar, mixed, reading, speaking, vocabulary, writing)
- **math**: 24 topics (addition, compare, decimals, divisibility, division, division_with_remainder, equations, estimation, factors_multiples, fractions, mixed, multiplication, number_sense, order_of_operations, percentages, powers, prime_composite, ratio, rounding, scale, sequences, subtraction, word_problems, zero_one_properties)
- **moledet_geography**: 7 topics (citizenship, community, geography, homeland, maps, mixed, values)
- **science**: 7 topics (animals, body, earth_space, environment, experiments, materials, plants)

## Grades present

g1, g2, g3, g4, g5, g6

## Validation

- OK: true

## Self-test

- OK: true

## Warnings

- science: topic key `mixed` exists in science-master TOPICS but no SCIENCE_GRADES[g].topics includes it — treat as UI/selector edge unless curriculum adds it
- hebrew: topic `mixed` is runtime/UI selector (utils/hebrew-constants.js) — not listed in data/hebrew-curriculum.js per-grade topics
- moledet_geography: topic `mixed` is runtime selector (utils/moledet-geography-constants.js) — not in data/moledet-geography-curriculum.js topic arrays
- moledet_geography: naming aliases — storage/API often `moledet_geography`; routes/diagnostics often `moledet-geography`; spine may use `geography`

## Unsupported / failed imports

- (none)
