# Curriculum audit (advisory)

## Phase status

| Phase | Status | Description |
|-------|--------|-------------|
| **1** | Complete | Question inventory + baseline advisory audit (`latest.*`). |
| **2** | Complete | Topic normalization layer, structured Israeli primary map (grades 1–6), richer classifications, topic rollup, map coverage reports. |
| **3** | Complete | Calibration of risk scoring + depth heuristics (advisory flags), optional `sourceRefs` on map topics, focused review reports (English early grades, geometry sequencing, coverage gaps, duplicates), richer rollup suspicion rules. |
| **3.5** | Complete | Remediation planner merges Phase 3 artifacts into prioritized queues (`remediation-plan.*`) — planning only, no bank edits. |
| **4A** | Complete | Content-fix **batch plan** from remediation (`content-fix-batches.*`) — groupings for Phase 4B; still no automatic bank edits. |
| **4B-0** | Complete | **Official curriculum spine** — ministry-facing source registry + spine model + bank-vs-official comparison (`official-curriculum-spine.*`, `bank-vs-official-spine.*`). Reports/tools only. |
| **4B-0b** | Complete | **Official source hardening** — direct MoE POP/PDF and `rama.edu.gov.il` anchors (no generic ministry homepage as grade-topic proof), per-source quality classification, subject profiles, and `official-source-quality-audit.*` plus extended bank-vs-official fields. Reports/tools only. |
| **4B-1 (Math)** | Complete | **Math-only official source hardening** — per-grade מיידע PDFs (grades 1–6), POP strand pages, RAMA as assessment support only; `math-official-source-hardening.*`, `math-bank-vs-official-source.*`. Reports/tools only — **not** question edits. |
| **4B-2 (Math)** | Complete | **Math subtopic alignment review** — separates **grade-PDF anchoring** from **exact subsection** approval; `math-subtopic-alignment-review.*`. Advisory queues only — **not** content edits. |
| **4B-3 (Math)** | Complete | **Official Math subsection catalog + row candidates** — ministry-grade PDF–backed catalog (`math-official-subsection-catalog.*`) and first-pass row→subsection candidates (`math-row-subsection-candidates.*`). Reports/tools only — **not** bank edits until owner approves a correction batch. |
| **4B-4 (Math)** | Complete | **Math owner review pack** — compact, owner-facing slice of subsection candidates + queues (`math-owner-review-pack.*`) for inspection before any approved content batch. Reports/tools only — **not** bank edits. |
| **4B-5 (Math)** | Complete | **Generator branch mapping** — maps inventory rows to harness branches (`topic::subtopic` → generator `selectedOp` + `params.kind`) and rolls up sequencing / subsection gaps (`math-generator-branch-mapping.*`). Reports only — **no** generator or bank edits until owner approves scope. |
| **4B-6 (Math)** | Complete | **Owner approval candidate pack** — safest/first Math correction candidates grouped for explicit owner sign-off (`math-owner-approval-candidates.*`). Planning only — **even catalog-only plans require owner approval** before any patch. |
| **4B-7 (Math)** | Complete | **Catalog-only patch plan** — branch-by-branch proposals to extend `mapsToNormalizedKeys` / placeholders (`math-catalog-only-patch-plan.*`). Reports only — **does not edit** the subsection catalog module or generator; owner approval still required before any implementation. |
| **4B-8 (Math)** | Complete | **Safe catalog patch subset** — filtered approval-ready slice of Phase 4B-7 (`math-safe-catalog-patch-subset.*`): high/medium confidence, risk low, `add_mapsToNormalizedKeys_entry` only; excludes placeholders and weak interim hosts. Reports only. |

No question banks, UI, or Hebrew learner-facing copy are modified by these tools.

## Purpose

This tooling inventories **question banks that power the learning masters** (math, geometry, Hebrew, English, science, Moledet/geography) and compares each item—using **normalized topic keys**—to a **conservative** structured map of elementary (grades 1–6) expectations.

Outputs are **reports only**. They do not change runtime behaviour or gate builds.

## Owner rules — curriculum and question-bank work

- **Content gate:** Any question-bank **addition, modification, or deletion** requires **explicit owner approval** before implementation. Passing Phase 4B-0b audits or generating remediation plans does **not** authorize edits.
- **Source hardening ≠ content editing:** Registry PDFs, POP links, and audit reports improve **traceability and confidence** for planning; they do **not** change stems, answers, or metadata in banks.
- **Math first:** Official source hardening for **Math** (Phase **4B-1**) is the **first** subject-specific anchor pass; Phase **4B-2** clarifies that a **grade programme PDF** is **not** the same as **exact subsection approval** inside that PDF. Phase **4B-3** adds a **subsection catalog** (PDF-linked headings/strands, manually encoded) and **candidate** mappings per inventory row — still **not** exact Ministry subsection sign-off. Phase **4B-4** adds an **owner review pack** so the owner can sample representative rows before approving any batch — still **not** approval to edit banks. Phase **4B-5** maps Math inventory rows to **generator branches** (Math is harness-driven, not a static bank cleanup). Phase **4B-6** is the **final approval-facing pack** before any Math patch — it lists candidate batches (catalog / metadata / generator / defer) but **does not apply changes**; **even catalog-only work requires explicit owner approval**. Phase **4B-7** turns catalog-only candidates into a **structured catalog-only patch plan** (gaps vs encoded catalog per grade/key + suggested hosts — **still reports-only**). **Math correction is not approved** until the owner explicitly approves a **concrete correction batch** — pipeline reports do **not** substitute approval.
- **Subject priority (future curriculum / content sequencing):**
  1. Math  
  2. Geometry  
  3. Hebrew  
  4. English  
  5. Science  
  6. Moledet / Geography last  

  This order **overrides** prior guidance to prioritize Science coverage first.

- **Frozen until owner says otherwise (track in plans / tickets):** Do **not** add Science questions yet; do **not** edit English early-grade items yet; do **not** bulk-delete duplicates from audit output alone; do **not** change UI or Hebrew learner-facing product copy via audit tooling.

See **`reports/curriculum-audit/subject-priority-hardening-plan.*`** for the rolling planning snapshot (source quality, inventory counts, risks, verification checklist — **not** a go-ahead for bank edits).

## Phase 3 — calibration, depth flags, and sources (not release approval)

- **Map coverage ≠ official grade alignment.** `map-coverage.*` only checks whether normalized inventory topics land in some curriculum bucket; it does **not** certify Ministry outcome alignment per item.
- **`aligned` stays advisory.** Strong automation labels reduce noise, but **they are not** curriculum sign-off or release approval — pedagogy owners still decide what ships.
- **Risk scoring guides manual review.** The “Top 50 highest-risk” queue uses classification tiers plus depth/dedup/span signals so reviewers see sequencing and duplication concerns first — not every plain `aligned` row.
- **`sourceRefs` may be broad.** Entries can point at general MoE/RAMA portals or internal conservative notes. A broad reference does **not** mean that specific stems were reviewed against that document line-by-line.
- **Duplicate categories differ by origin.** Static bank collisions, deterministic generator samples, and cross-grade repeats must be read differently — see `duplicates-review.*` and Phase 3 duplicate tooling (do not bulk-delete from audit output alone).

## Phase 3.5 — remediation plan (action queue, not content editing)

- **What it is:** `remediation-plan.json` / `remediation-plan.md` combine `latest.json`, `question-inventory.json`, focused reports, `coverage-gaps-by-grade.json`, and `duplicates-review.json` into **prioritized remediation items** with suggested actions.
- **What it is not:** It does **not** modify question banks, UI, or Hebrew learner copy. It is a **work queue** for humans before any content phase.
- **How to read `remediation-plan.md`:**
  - Start with **Top 25 overall**, then **subject-balanced Top 25** sections so Moledet-heavy overall noise does not hide English / science / geometry work.
  - Use **Coverage gap action list** for thin subject×grade cells — these are **backlog to add questions**, not automatic edits to existing stems.
  - Use **Duplicate cleanup** lists: **static** vs **generator** paths differ (see below).
  - Use **Do not touch yet** for generator-only sampling warnings — treat as low urgency unless paired with static collisions.
- **`remove_duplicate` vs `ignore_generator_sample`:**
  - Prefer **`ignore_generator_sample`** when the collision is **only** among `generator_sample` rows or labeled intentional variants — deterministic harness noise.
  - Prefer **`remove_duplicate` / `split_by_grade_depth`** when **static** banks share the same stem across grades without intentional depth progression (see `likely_problem_duplicates`).
- **Low coverage:** Means **add_more_questions** for that grade/subject band — it does **not** imply existing items are wrong; it signals insufficient inventory breadth for safe runtime diversity.

## Phase 4B-0 — official curriculum spine (before any content edits)

- **Why:** Thin inventory counts (`coverage-gaps-by-grade.json`) are **not** automatic justification for adding questions. Before Phase 4B content work, pedagogy owners need a **source-anchored** spine (MoE/RAMA references where available) that separates **core**, **allowed**, **exposure-only**, **enrichment**, and **not expected yet** — distinct from the older internal conservative map used by Phase 2–3 classification.
- **Internal vs official spine:** `israeli-primary-curriculum-map.js` remains the structured baseline for audit normalizers. `official-primary-curriculum-spine.js` layers **registry citations**, **English early-grade exposure separation**, **Moladeta grade-band expectations**, **geometry-as-strand notes**, and **confidence / human-review flags** for export to reports.
- **Coverage gaps ≠ mandate:** Low coverage cells signal **insufficient inventory breadth**, not incorrect stems. Combine with `bank-vs-official-spine.*` before scheduling additions.
- **Sources:** `official-curriculum-source-registry.js` lists ministry portals, RAMA, PDF placeholders, and explicit **`internal_gap`** rows where grade-level anchors are still missing.
- **Outputs:**
  - `official-curriculum-spine.json` / `.md` — spine per subject × grade (`grade_1` … `grade_6`).
  - `bank-vs-official-spine.json` / `.md` — inventory rows classified vs spine (anchoring, Moladeta band, English early grammar scope, geometry depth hints).
- **Subjects with persistent low-confidence gaps:** Hebrew strand PDF anchors; science per-grade outcome tables; Moledet/geography outside grades 2–4 unless additional geography sources are cited — see registry `internal_gap` rows and spine notes.

```bash
npm run audit:curriculum:official-spine
npm run audit:curriculum:official-compare
```

## Phase 4B-0b — official source hardening (registry quality, not content approval)

- **Broad ministry portal ≠ grade-topic anchor.** A link to a general MoE department page or a subject “hub” proves **subject orientation**, not that a specific grade’s topic progression or depth was verified for each inventory row. Phase 4B-0b classifies registry rows (`sourceQualityLevel`) and rolls subjects up to **`sourceQuality`** (`high` | `medium` | `low`) from **direct** curriculum documents (for example `pop.education.gov.il` program pages, published PDFs, grade-specific hub pages) versus broad portals.
- **“Officially anchored” is not approval.** `bank-vs-official-spine.*` rows that land in **`officially_anchored`** mean the normalized topic matched the **official spine** search for that grade — a workflow signal for pedagogy review, **not** Ministry sign-off that an item is correct, on-scope, or safe to ship.
- **Source quality caps confidence.** Spine slots and registry rows carry **`confidenceAfterAudit`**. Subjects that still rely on internal conservative mapping, RAMA-only assessment context, or portals without pinned grade/topic tables stay **medium/low** and often set **`needsHumanPedagogyReview`** until better anchors exist.
- **Row-level flags in `bank-vs-official-spine.*`:** `sourceQuality` (subject rollup), **`officialGradeTopicAnchored`** — `true` only when the row’s grade matches an **`exact_grade_topic_source`** registry entry; **`officialSubjectOnlyAnchored`** — subject has a direct curriculum document but this grade lacks a dedicated grade-topic anchor; **`broadOrInternalOnly`** — anchored in the spine but not pinned to an exact grade-topic registry row (includes most POP-only subject anchors); **`needsPedagogyReviewBecauseSourceWeak`** — weak registry ceiling, low spine confidence, or (for **`officially_anchored`**) missing exact grade-topic anchor while subject quality is not **high**.
- **Outputs:**
  - `official-source-quality-audit.json` / `.md` — every registry URL classified with quality, grade/topic/skill detail flags, and actions.
  - Regenerated `official-curriculum-spine.*` and `bank-vs-official-spine.*` with Phase 4B-0b metadata and roll-ups.

```bash
npm run audit:curriculum:source-quality
npm run audit:curriculum:official-spine
npm run audit:curriculum:official-compare
```

## Phase 4B-1 — Math official source hardening (planning only)

- **Scope:** Strengthen **Math** anchors in `official-curriculum-source-registry.js` with **per-grade** official programme PDFs (`meyda.education.gov.il` — `kita1.pdf` … `kita6.pdf` under the pedagogical secretariat path), plus POP pages for the programme, **חקר נתונים**, and the **גאומטריה** strand. **RAMA** (`rama.edu.gov.il/field/math`) remains **assessment support**, not the primary curriculum map.
- **Not content work:** This phase updates registry/spine metadata and **reports only** — no bank edits, grade moves, enrichment labels, or UI/copy changes.
- **Outputs:** `math-official-source-hardening.*` (registry/matrix narrative), `math-bank-vs-official-source.*` (Math inventory vs anchors + advisory sequencing flags). Duplicate/static collisions stay advisory — see `duplicates-review.*`.

```bash
npm run audit:curriculum:math-source-hardening
```

## Phase 4B-2 — Math subtopic alignment (grade PDF ≠ subsection approval)

- **Grade PDF anchor:** Confirms an official **programme document for that grade** exists (e.g. `kita{n}.pdf`). It does **not** prove each inventory stem maps to a **named subsection** or outcome clause in that PDF.
- **Exact subsection approval:** Requires curated/automated mapping from inventory rows to subsection identifiers — **not** generated yet; treat **`needsSubsectionReview`** as the default for grade-PDF-anchored rows until subsection passes exist.
- **Content correction:** Remains **blocked** without explicit owner approval — Phase 4B-2 produces **review queues only** (including sequencing suspicion cohorts).

```bash
npm run audit:curriculum:math-subtopic-alignment
```

## Phase 4B-3 — Official Math subsection catalog + row candidates (not exact approval)

- **Grade PDF anchor:** Same as Phase 4B-2 — confirms an official **programme PDF** exists for that grade (`kita{n}.pdf`). It does **not** prove each stem maps to a named subsection until cross-checked.
- **Subsection catalog:** `math-official-subsection-catalog.*` lists **encoded sections** (Hebrew labels, strands, subsection labels, depth hints, page hints where noted, catalog confidence). This is a **planning scaffold** aligned to normalizer keys (`mapsToNormalizedKeys`), not a substitute for reading the PDF.
- **Row candidates:** `math-row-subsection-candidates.*` proposes **candidateSubsectionKeys** and **candidateConfidence** (`high` / `medium` / `low` / `none`). Treat **`exactSubsectionAnchored`** language as **out of scope** here — only human PDF verification earns exact subsection pairing.
- **Metrics naming:** Prefer **gradePdfAnchoredRows**, **subsectionCandidateRows**, confidence tiers, **noSubsectionCandidateRows**, **stillNeedsManualReviewRows** — **no** content edits until the owner approves a batch.

```bash
npm run audit:curriculum:math-subsection-catalog
npm run audit:curriculum:math-subsection-candidates
# Also runs at the end of:
npm run audit:curriculum:math-source-hardening
```

## Phase 4B-4 — Math owner review pack (inspection, not approval)

- **Purpose:** Distill large Phase **4B-3** outputs into a **small, readable pack** (`math-owner-review-pack.*`) — sequencing queues, no-candidate cohorts, competing candidates, and a **high-confidence sanity set** — so the owner can spot-check automation before authorizing real edits.
- **Not approval:** Rows labeled **high-confidence candidate** are **not** approved items; they only check whether catalog mapping is plausible. **No** Math bank edits, grade moves, enrichment labels, UI changes, or Hebrew product copy changes until the owner explicitly signs off on scope (grade, topic, action type, sample rows).
- **Inputs:** Consumes `math-row-subsection-candidates.json`, `math-official-subsection-catalog.json`, `question-inventory.json`, `math-subtopic-alignment-review.json` under `reports/curriculum-audit/`.

```bash
npm run audit:curriculum:math-owner-review-pack
# Also runs at the end of:
npm run audit:curriculum:math-source-hardening
```

## Phase 4B-5 — Generator branch mapping (Math is harness-driven)

- **Why:** Math inventory rows come from **deterministic harness sampling** of `utils/math-question-generator.js` (`#sample` / `#audit_force_sample`), not from static bank files. Phase **4B-5** rolls up subsection/suspicion signals by **generator branch** (`topic` = harness operation / `selectedOp`, `subtopic` ≈ emitted `params.kind`).
- **Not an edit:** The report **reads** the generator source once for vocabulary (`selectedOp` / `kind` references) and **does not** modify `math-question-generator.js`, question banks, or catalog modules.
- **Before generator work:** Owner should approve scope using **`math-generator-branch-mapping.*`** together with **`math-owner-review-pack.*`** — automation suggests future actions only (`no_change`, catalog/metadata/generator gate labels).

```bash
npm run audit:curriculum:math-generator-branches
# Also runs at the end of:
npm run audit:curriculum:math-source-hardening
```

## Phase 4B-6 — Owner approval candidate pack (final gate before any Math patch)

- **Purpose:** Merge Phase **4B-4** / **4B-5** signals into **approval-oriented batches** (`math-owner-approval-candidates.*`): catalog-only, metadata-only, grade-gate, depth-split, manual-review, and no-change summaries.
- **Not implementation:** Produces **JSON + Markdown plans only** — no edits to `math-question-generator.js`, question banks, subsection catalog, metadata, grade gates, remediation automation, UI, or Hebrew learner copy.
- **Catalog caveat:** “Catalog-only” means future work would touch **`mapsToNormalizedKeys`** / planning artifacts — still **not** authorized until the owner approves that scope (audit mapping can affect downstream reporting).

```bash
npm run audit:curriculum:math-approval-candidates
# Also runs at the end of:
npm run audit:curriculum:math-source-hardening
```

## Phase 4B-7 — Catalog-only patch plan (reports only)

- **Purpose:** For branches classified **catalog-only** in Phase **4B-6**, compare normalized keys × grades against the encoded subsection catalog (`math-official-subsection-catalog.json`) and emit **branch-by-branch** proposals (`math-catalog-only-patch-plan.*`) — each tagged **not implemented**, **owner approval required**, and **no runtime/generator change implied**.
- **Not implementation:** Does **not** edit `math-official-subsection-catalog.js`, `math-question-generator.js`, metadata, banks, grade gates, UI, or Hebrew learner copy.

```bash
npm run audit:curriculum:math-catalog-patch-plan
# Also runs at the end of:
npm run audit:curriculum:math-source-hardening
```

## Phase 4B-8 — Safe catalog patch subset (approval-ready slice)

- **Purpose:** Filter Phase **4B-7** into **`math-safe-catalog-patch-subset.*`** — only `add_mapsToNormalizedKeys_entry`, confidence high/medium, risk low; excludes new-section placeholders, low-confidence rows, and explicit weak hosts (for example grade 4 divisibility on `g4_powers_ratio`).
- **Not implementation:** Does **not** edit `math-official-subsection-catalog.js` or any runtime asset.

```bash
npm run audit:curriculum:math-safe-catalog-subset
# Also runs at the end of:
npm run audit:curriculum:math-source-hardening
```

## Phase 4A — content-fix batches (planning for Phase 4B, not edits)

- **What it is:** `content-fix-batches.json` / `content-fix-batches.md` organize `remediation-plan.*` into batches **A–E** (coverage, English early, geometry, static duplicates, exclusions).
- **What it is not:** It does **not** change question banks, delete duplicates, or touch UI. It is a **batch worksheet** for humans before any approved content work.
- **Generator samples:** Batches B/C **exclude** `generator_sample` rows from “content fix” scope; those stay under batch E / harness noise — not static defects.
- **Coverage vs correction:** Batch A is **additions** (new items / generator policy per master). Batches B–D are **reviews** of existing static content; do not conflate with coverage gap filling.
- **No automatic deletion:** Duplicate rows are listed for review only — `remove_duplicate` is a planning label, not an executed delete.

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

**Remediation plan (Phase 3.5)**

```bash
npm run audit:curriculum:remediation
```

**Content-fix batch plan (Phase 4A)**

```bash
npm run audit:curriculum:fix-batches
```

**Full curriculum audit / reports chain (through Phase 4B-0b official spine + source quality + bank compare)**

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
| `remediation-plan.json` / `.md` | Prioritized remediation queues + coverage/duplicate action lists (Phase 3.5). |
| `content-fix-batches.json` / `.md` | Phase 4A batch worksheet (coverage, English early, geometry, static dup candidates, exclusions). |
| `official-curriculum-spine.json` / `.md` | Phase 4B-0b official spine + hardened source registry snapshot + subject source profiles. |
| `bank-vs-official-spine.json` / `.md` | Phase 4B-0b inventory vs official spine comparison + per-row source-quality flags. |
| `official-source-quality-audit.json` / `.md` | Phase 4B-0b registry URL classification, confidence after audit, and subject roll-up. |
| `subject-priority-hardening-plan.json` / `.md` | Owner subject-priority sequencing + per-subject source/readiness snapshot (planning only). |
| `math-official-source-hardening.json` / `.md` | Phase 4B-1 Math registry matrix + strand anchors (MoE PDF/POP; RAMA supporting). |
| `math-bank-vs-official-source.json` / `.md` | Phase 4B-1/4B-2 Math inventory vs **grade-PDF** anchors + sequencing flags; metrics distinguish PDF vs subsection (see Phase 4B-2). |
| `math-subtopic-alignment-review.json` / `.md` | Phase 4B-2 — per-row subsection review flags, groupings, manual-review priority (not bank edits). |
| `math-official-subsection-catalog.json` / `.md` | Phase 4B-3 — ministry PDF URL per grade + encoded section/subsection scaffold (manual; validate vs PDF). |
| `math-row-subsection-candidates.json` / `.md` | Phase 4B-3 — per Math row: candidate subsection keys, confidence tiers, sequencing codes, review queues (not bank edits). |
| `math-owner-review-pack.json` / `.md` | Phase 4B-4 — owner-facing summary: sequencing/no-candidate/competing/high-confidence sanity cohorts, grade readiness, source-file impact preview (not bank edits). |
| `math-generator-branch-mapping.json` / `.md` | Phase 4B-5 — per `topic::subtopic` branch roll-ups: sequencing, subsection gaps, suggested future actions (generator/catalog/metadata — planning only). |
| `math-owner-approval-candidates.json` / `.md` | Phase 4B-6 — owner approval batches (safest first), suggested decisions, impact — **no** automatic patches. |
| `math-catalog-only-patch-plan.json` / `.md` | Phase 4B-7 — catalog-only gap closure proposals per generator branch (encoded catalog vs normalized keys × grades) — **planning only**, owner approval before any catalog edit. |
| `math-safe-catalog-patch-subset.json` / `.md` | Phase 4B-8 — safest slice of 4B-7 for owner review (`add_mapsToNormalizedKeys_entry`, high/medium + risk low); **planning only**. |

## Manual review: high-risk topics

1. Open **`map-coverage.md`** — top unmapped high-volume normalized keys; fix normalizer or curriculum map entries first.
2. Open **`topic-rollup.md`** — “suspicious grade-topic” heuristics; validate against real pedagogy scope.
3. Open **`latest.md`** — top 50 risk queue (classification + **depth flags** + dup peers); prioritize `needs_human_review`, `aligned_low_confidence`, depth-flagged sequencing rows, then `too_advanced`.
4. Use **`english-early-grades-review.md`** and **`geometry-sequencing-review.md`** for strand sequencing checks (Phase 3).
5. Use **`coverage-gaps-by-grade.md`** and **`duplicates-review.md`** for thin cells and generator vs static collisions (Phase 3).
6. Open **`remediation-plan.md`** for Phase 3.5 prioritized queues before scheduling content work (Phase 3.5).
7. Open **`content-fix-batches.md`** for Phase 4A batch planning before any Phase 4B bank edits.
8. For English grades 1–2, confirm grammar items are tagged as enrichment/exposure in the map—not assumed as core reading comprehension.
