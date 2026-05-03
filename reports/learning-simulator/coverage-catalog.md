# Coverage catalog (full matrix)

- Generated at: 2026-05-03T06:21:10.926Z
- Matrix snapshot: 2026-05-03T06:21:02.913Z
- Matrix rows: 819
- Quick scenarios: 10 · Deep scenarios: 12
- Unique cells touched (quick refs): 32
- Unique cells touched (deep refs): 34
- Unique cells touched (matrix smoke): 712

## coverageStatus counts

| Status | Count |
| --- | ---: |
| covered | 747 |
| sampled | 0 |
| unsupported_expected | 72 |
| unsupported_needs_content | 0 |
| unsupported_needs_adapter | 0 |
| unsupported_needs_generator | 0 |
| uncovered | 0 |

## Notes

- **covered** — cell is referenced by quick/deep fixtures **or** exercised by **matrix smoke** aggregate simulation, or both.
- **sampled** — Phase 4 passed and cell is supported, but no fixture ref and no matrix-smoke touch yet.
- **unsupported_*** — matrix flags and/or Phase 4 generator/bank classification.
- **uncovered** — integrity failures or unclassified gaps (should be zero for a green gate).

## Row sample (first 40 rows)

| cellKey | coverageStatus | quick | deep | smoke | audit |
| --- | --- | :---: | :---: | :---: | :---: |
| `g1\|english\|vocabulary\|easy` | covered |  |  | y | y |
| `g1\|english\|vocabulary\|hard` | covered |  |  | y | y |
| `g1\|english\|vocabulary\|medium` | covered |  |  | y | y |
| `g1\|geometry\|shapes_basic\|easy` | covered |  |  | y | y |
| `g1\|geometry\|transformations\|easy` | covered |  |  | y | y |
| `g1\|geometry\|shapes_basic\|hard` | covered |  |  | y | y |
| `g1\|geometry\|transformations\|hard` | covered |  |  | y | y |
| `g1\|geometry\|shapes_basic\|medium` | covered |  |  | y | y |
| `g1\|geometry\|transformations\|medium` | covered |  |  | y | y |
| `g1\|hebrew\|comprehension\|easy` | covered |  |  | y | y |
| `g1\|hebrew\|grammar\|easy` | covered |  |  | y | y |
| `g1\|hebrew\|mixed\|easy` | unsupported_expected |  |  |  | y |
| `g1\|hebrew\|reading\|easy` | covered |  |  | y | y |
| `g1\|hebrew\|speaking\|easy` | covered |  |  | y | y |
| `g1\|hebrew\|vocabulary\|easy` | covered |  |  | y | y |
| `g1\|hebrew\|writing\|easy` | covered |  |  | y | y |
| `g1\|hebrew\|comprehension\|hard` | covered |  |  | y | y |
| `g1\|hebrew\|grammar\|hard` | covered |  |  | y | y |
| `g1\|hebrew\|mixed\|hard` | unsupported_expected |  |  |  | y |
| `g1\|hebrew\|reading\|hard` | covered |  |  | y | y |
| `g1\|hebrew\|speaking\|hard` | covered |  |  | y | y |
| `g1\|hebrew\|vocabulary\|hard` | covered |  |  | y | y |
| `g1\|hebrew\|writing\|hard` | covered |  |  | y | y |
| `g1\|hebrew\|comprehension\|medium` | covered |  |  | y | y |
| `g1\|hebrew\|grammar\|medium` | covered |  |  | y | y |
| `g1\|hebrew\|mixed\|medium` | unsupported_expected |  |  |  | y |
| `g1\|hebrew\|reading\|medium` | covered |  |  | y | y |
| `g1\|hebrew\|speaking\|medium` | covered |  |  | y | y |
| `g1\|hebrew\|vocabulary\|medium` | covered |  |  | y | y |
| `g1\|hebrew\|writing\|medium` | covered |  |  | y | y |
| `g1\|math\|addition\|easy` | covered |  |  | y | y |
| `g1\|math\|compare\|easy` | covered |  |  | y | y |
| `g1\|math\|equations\|easy` | covered |  |  | y | y |
| `g1\|math\|mixed\|easy` | unsupported_expected |  |  |  | y |
| `g1\|math\|multiplication\|easy` | covered |  |  | y | y |
| `g1\|math\|number_sense\|easy` | covered |  |  | y | y |
| `g1\|math\|subtraction\|easy` | covered |  |  | y | y |
| `g1\|math\|word_problems\|easy` | covered |  |  | y | y |
| `g1\|math\|addition\|hard` | covered |  |  | y | y |
| `g1\|math\|compare\|hard` | covered |  |  | y | y |

Full row-level data: `C:/Users/ERAN YOSEF/Desktop/final projects/FINAL-WEB/LIOSH-WEB-TRY/reports/learning-simulator/coverage-catalog.json` (819 rows).
