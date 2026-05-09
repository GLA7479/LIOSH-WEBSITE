# Curriculum audit (advisory)

## Phase status

| Phase | Status | Description |
|-------|--------|-------------|
| **1** | Complete | Question inventory + baseline advisory audit (`latest.*`). |
| **2** | Complete | Topic normalization layer, structured Israeli primary map (grades 1–6), richer classifications, topic rollup, map coverage reports. |

No question banks, UI, or Hebrew learner-facing copy are modified by these tools.

## Purpose

This tooling inventories **question banks that power the learning masters** (math, geometry, Hebrew, English, science, Moledet/geography) and compares each item—using **normalized topic keys**—to a **conservative** structured map of elementary (grades 1–6) expectations.

Outputs are **reports only**. They do not change runtime behaviour or gate builds.

## Topic normalization (Phase 2)

Module: `utils/curriculum-audit/curriculum-topic-normalizer.js`

For each inventory row, the audit derives:

- `rawTopic` / `rawSubtopic` (unchanged from inventory)
- `normalizedTopicKey` — stable internal key (e.g. `math.fractions`, `geometry.area`, `english.grammar.*`)
- `normalizedTopicLabelHe` — conservative Hebrew label for reports (not product UI copy)
- `normalizationConfidence` — `high` | `medium` | `low`

Subjects use different strand/skill/domain logic (math strands, geometry facets, Hebrew skills, English pool categories, science domains, Moledet bank prefixes). Unknown labels fall back to `*.unmapped.*` with **low** confidence.

## Why low confidence does not become plain `aligned`

Classifications include **`aligned`** only when:

- The normalized topic key matches a **core** curriculum bucket for that grade,
- Grade-band map confidence is **not** `low`,
- Topic-definition confidence is **not** `low`,
- Normalizer confidence is **high**,

and Moledet/geography is excluded from strong alignment (deferred low-confidence band).

Otherwise the audit prefers **`aligned_low_confidence`** or **`needs_human_review`** so pedagogy owners—not automation—own release-blocking decisions.

## What it checks

- **Coverage inventory**: subject, grade span, topic/subtopic, difficulty, stable `questionId`, previews, metadata completeness.
- **Curriculum comparison** using `utils/curriculum-audit/israeli-primary-curriculum-map.js` (structured topic objects per grade).
- **Classifications**: `aligned`, `aligned_low_confidence`, `too_easy`, `too_advanced`, `wrong_subject`, `unclear_topic`, `enrichment_only`, `missing_metadata`, `needs_human_review`.
- **Topic rollup** (`topic-rollup.*`): raw vs normalized topics, difficulty distributions, examples, heuristic “suspicious grade” flags.
- **Map coverage** (`map-coverage.*`): mapped vs unmapped rows and distinct triples.

## What it does not claim

- It is **not** a certified Ministry of Education syllabus audit.
- Hebrew archive files under `data/hebrew-questions/*.js` are **not** scanned (not loaded by `generateQuestion`).

## How to run

**Inventory only**

```bash
npm run audit:curriculum:inventory
```

**Full audit** (inventory + classifications)

```bash
npm run audit:curriculum
```

**Topic rollup** (requires `question-inventory.json`)

```bash
npm run audit:curriculum:rollup
```

**Map coverage** (requires `question-inventory.json`)

```bash
npm run audit:curriculum:map-coverage
```

**Full Phase 2 QA chain**

```bash
npm run qa:curriculum-audit
```

## Artifacts

| File | Contents |
|------|----------|
| `question-inventory.json` / `.md` | Flat inventory rows. |
| `latest.json` / `.md` | Per-question classifications + aggregates + dedup hints. |
| `topic-rollup.json` / `.md` | Topic analysis and suspicion heuristics. |
| `map-coverage.json` / `.md` | Mapped vs unmapped statistics. |

## Manual review: high-risk topics

1. Open **`map-coverage.md`** — top unmapped high-volume normalized keys; fix normalizer or curriculum map entries first.
2. Open **`topic-rollup.md`** — “suspicious grade-topic” heuristics; validate against real pedagogy scope.
3. Open **`latest.md`** — top 50 risk queue; prioritize `needs_human_review`, `too_advanced`, and `unclear_topic`.
4. For English grades 1–2, confirm grammar items are tagged as enrichment/exposure in the map—not assumed as core reading comprehension.
