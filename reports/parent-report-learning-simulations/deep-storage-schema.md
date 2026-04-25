# Deep longitudinal simulation — storage schema (Parent Report)

This document summarizes how **parent reports** read persisted learning data from `localStorage`, so deep simulators can write **realistic, schema-compatible** histories. Source of truth: `utils/parent-report-v2.js`, subject time-tracking utilities, and subject master pages.

## Keys read for reporting (per subject)

| Subject | Time tracking key | JSON container | Progress key | Mistakes key |
|--------|-------------------|----------------|--------------|--------------|
| Math | `mleo_time_tracking` | `operations` | `mleo_math_master_progress` | `mleo_mistakes` |
| Geometry | `mleo_geometry_time_tracking` | `topics` | `mleo_geometry_master_progress` | `mleo_geometry_mistakes` |
| English | `mleo_english_time_tracking` | `topics` | `mleo_english_master_progress` | `mleo_english_mistakes` |
| Science | `mleo_science_time_tracking` | `topics` | `mleo_science_master_progress` | `mleo_science_mistakes` |
| Hebrew | `mleo_hebrew_time_tracking` | `topics` | `mleo_hebrew_master_progress` | `mleo_hebrew_mistakes` |
| Moledet & geography | `mleo_moledet_geography_time_tracking` | `topics` | `mleo_moledet_geography_master_progress` | `mleo_moledet_geography_mistakes` |

**Player identity**

- `mleo_player_name` (string) — required; without it the report shows missing-player state.

**Optional / auxiliary**

- `mleo_daily_challenge`, `mleo_weekly_challenge` (math/hebrew/geo paths may share weekly)
- `mleo_science_daily_challenge`, `mleo_science_weekly_challenge`

## Time-tracking JSON shapes

### Math (`mleo_time_tracking`)

```json
{
  "operations": {
    "addition": {
      "total": 12345,
      "sessions": [ /* ... */ ],
      "byGrade": { "g4": 100 },
      "byLevel": { "medium": 100 }
    }
  },
  "daily": {
    "2026-01-10": {
      "total": 900,
      "operations": { "addition": 900 },
      "byGrade": { "g4": 900 },
      "byLevel": { "medium": 900 }
    }
  }
}
```

Writer reference: `trackOperationTime` in `utils/math-time-tracking.js`.

**Session fields used by the report** (must be present for question aggregation):

- `timestamp` (ms) **or** parseable `date` (YYYY-MM-DD) — filtering uses `timestamp` first.
- `total` — positive number of questions in the session.
- `correct` — number in `[0, total]` (required for counting; missing `correct` excludes the session from question totals).
- `duration` — seconds (time charts / minutes).
- `grade` (e.g. `g4`), `level` (`easy` | `medium` | `hard`), `mode` (e.g. `learning`, `speed`, `practice`).
- `operation` — base math operation key (e.g. `addition`, `word_problems`).

### Topic-based subjects (`mleo_*_time_tracking` except math)

Same idea as math, but bucket is `topics[topicKey]` and each session includes `topic`.

Writer references: `utils/english-time-tracking.js`, `utils/hebrew-time-tracking.js`, `utils/science-time-tracking.js`, `utils/moledet-geography-time-tracking.js`, `trackGeometryTopicTime` in `utils/math-time-tracking.js`.

## Progress objects (`*_master_progress`)

Shape (all subjects):

```json
{
  "progress": {
    "addition": { "total": 200, "correct": 150 },
    "area": { "total": 100, "correct": 70 }
  },
  "stars": 3,
  "playerLevel": 5,
  "xp": 1200,
  "badges": []
}
```

The report merges **sessions inside the selected window** with **legacy progress totals** in `buildMapFromBucket` (see `utils/parent-report-v2.js`). Deep simulators should keep `progress.*` roughly consistent with summed sessions to avoid confusing mismatches.

## Mistakes arrays

Each mistakes key holds a **JSON array** of objects. Normalization: `utils/mistake-event.js` (`normalizeMistakeEvent`).

Minimum useful fields for diagnostics / parent report:

- `subject` — `math` | `geometry` | `english` | `science` | `hebrew` | `moledet-geography`
- `topic` or `operation` (math uses `operation` as bucket key in `parent-report-v2` `mistakeKeyField`)
- `timestamp` (ms)
- `isCorrect`: `false` for wrong events
- `exerciseText`, `correctAnswer`, `userAnswer` (can be simple placeholders)
- `patternFamily` — repeated families help stable weakness signals (`MIN_PATTERN_FAMILY_FOR_DIAGNOSIS` in `mistake-event.js`)
- `responseMs` — used by pace / speed-pressure style analyses when present
- `hintUsed` — optional boolean

## Period filtering (week / month / custom)

`generateParentReportV2` / `generateDetailedParentReport`:

- **`week`**: last **7** days from “now” (`endDate = now`, `startDate = now - 7d`, start at local midnight).
- **`month`**: last **30** days (same pattern).
- **`custom`**: `customStartDate` 00:00:00 → `customEndDate` 23:59:59.999; `endDate` is clamped to **now** if the requested end is in the future.

Sessions are included if `parseSessionTime(session)` falls in `[startMs, endMs]` (see `utils/parent-report-v2.js` + `utils/parent-report-row-trend.js`).

**Implication for deep longitudinal sims:** most history can be old, but **enough sessions must fall in the last 7 and last 30 days** or week/month reports will look empty / “insufficient evidence” even with thousands of older questions.

## “Enough evidence” (subject-level)

In `utils/parent-report-v2.js`, each subject with **fewer than 8** counted questions in the selected window is listed in `diagnosticOverviewHe.insufficientDataSubjectsHe` (`INSUFFICIENT_SUBJECT_Q = 8`).

Sessions without valid `total`/`correct` **do not count** (`sumQuestionsCorrect`).

## Trend evidence

Row-level trends use `utils/parent-report-row-trend.js`:

- `MIN_TREND_POINTS = 3` valid sessions with both `total` and `correct` are needed for stable trend math.
- Contract layer references `PRODUCT_CONTRACT_MIN_TREND_POINTS` in `utils/contracts/parent-product-contract-v1.js`.

Trend windows compare **current** vs **previous** in-range session slices (see row-trend helpers).

## UI: custom date range

- **Detailed report** supports URL query: `/learning/parent-report-detailed?period=custom&start=YYYY-MM-DD&end=YYYY-MM-DD` (and optional `mode=summary`).
- **Short report** (`/learning/parent-report`) uses **client state** for custom dates: user selects “תאריכים מותאמים”, sets `<input type="date">`, clicks **“הצג”** — not reflected in the URL alone.

## Topic keys used in Phase 10.4 deep sims

**Math** (operation keys): `addition`, `subtraction`, `multiplication`, `division`, `fractions`, `word_problems` (labels from `utils/math-report-generator.js`).

**Geometry** (from `utils/geometry-constants.js` `TOPICS`): e.g. `area`, `perimeter`, `shapes_basic`, `angles`, `volume`.

**Hebrew** (from `utils/hebrew-constants.js` `TOPICS`): `reading`, `comprehension`, `grammar`, `vocabulary`, `writing` (plus `speaking` / `mixed` available in app).

**English** (from `pages/learning/english-master.js` / `data/english-curriculum.js`): `vocabulary`, `grammar`, `translation`, `sentences`, `writing` (reading-style work is represented by `translation` / comprehension-style pools in the app).

**Science** (from `data/science-curriculum.js` per grade): e.g. `animals`, `plants`, `materials`, `earth_space`, `body`, `environment`, `experiments` (no separate `energy` key in curriculum — energy-like content maps to `materials` / `experiments`).
