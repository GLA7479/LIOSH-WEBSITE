# Curriculum audit (advisory)

## Phase status

| Phase | Status | Description |
|-------|--------|-------------|
| **1** | Complete | Question inventory + baseline advisory audit (`latest.*`). |
| **2** | Complete | Topic normalization layer, structured Israeli primary map (grades 1–6), richer classifications, topic rollup, map coverage reports. |
| **3** | Complete | Calibration of risk scoring + depth heuristics (advisory flags), optional `sourceRefs` on map topics, focused review reports (English early grades, geometry sequencing, coverage gaps, duplicates), richer rollup suspicion rules. |

No question banks, UI, or Hebrew learner-facing copy are modified by these tools.

## Purpose

This tooling inventories **question banks that power the learning masters** (math, geometry, Hebrew, English, science, Moledet/geography) and compares each item—using **normalized topic keys**—to a **conservative** structured map of elementary (grades 1–6) expectations.

Outputs are **reports only**. They do not change runtime behaviour or gate builds.

## Phase 3 — calibration, depth flags, and sources (not release approval)

- **Map coverage ≠ official grade alignment.** `map-coverage.*` only checks whether normalized inventory topics land in some curriculum bucket; it does **not** certify Ministry outcome alignment per item.
- **`aligned` stays advisory.** Strong automation labels reduce noise, but **they are not** curriculum sign-off or release approval — pedagogy owners still decide what ships.
- **Risk scoring guides manual review.** The “Top 50 highest-risk” queue uses classification tiers plus depth/dedup/span signals so reviewers see sequencing and duplication concerns first — not every plain `aligned` row.
- **`sourceRefs` may be broad.** Entries can point at general MoE/RAMA portals or internal conservative notes. A broad reference does **not** mean that specific stems were reviewed against that document line-by-line.
- **Duplicate categories differ by origin.** Static bank collisions, deterministic generator samples, and cross-grade repeats must be read differently — see `duplicates-review.*` and Phase 3 duplicate tooling (do not bulk-delete from audit output alone).

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

**Focused reports (Phase 3)**

```bash
npm run audit:curriculum:focused
npm run audit:curriculum:duplicates
```

**Full Phase 2+3 QA chain**

```bash
npm run qa:curriculum-audit
```

## Artifacts

| File | Contents |
|------|----------|
| `question-inventory.json` / `.md` | Flat inventory rows. |
| `latest.json` / `.md` | Per-question classifications, **depth flags**, aggregates + dedup hints. |
| `topic-rollup.json` / `.md` | Topic analysis and suspicion heuristics. |
| `map-coverage.json` / `.md` | Mapped vs unmapped statistics. |
| `english-early-grades-review.json` / `.md` | English grades 1–3 snapshot (Phase 3). |
| `geometry-sequencing-review.json` / `.md` | Geometry strand density by grade (Phase 3). |
| `coverage-gaps-by-grade.json` / `.md` | Thin subject×grade cells (Phase 3). |
| `duplicates-review.json` / `.md` | Generator vs static duplicates and cross-grade stems (Phase 3). |

## Manual review: high-risk topics

1. Open **`map-coverage.md`** — top unmapped high-volume normalized keys; fix normalizer or curriculum map entries first.
2. Open **`topic-rollup.md`** — “suspicious grade-topic” heuristics; validate against real pedagogy scope.
3. Open **`latest.md`** — top 50 risk queue (classification + **depth flags** + dup peers); prioritize `needs_human_review`, `aligned_low_confidence`, depth-flagged sequencing rows, then `too_advanced`.
4. Use **`english-early-grades-review.md`** and **`geometry-sequencing-review.md`** for strand sequencing checks (Phase 3).
5. Use **`coverage-gaps-by-grade.md`** and **`duplicates-review.md`** for thin cells and generator vs static collisions (Phase 3).
6. For English grades 1–2, confirm grammar items are tagged as enrichment/exposure in the map—not assumed as core reading comprehension.
