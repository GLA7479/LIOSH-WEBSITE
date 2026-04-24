---
name: Phase 7.7 Curriculum Analysis
overview: "Phase 7.7 is a read-only curriculum-grade analysis: synthesize the repo’s actual curriculum artifacts (per subject), gap and progression assessment against your stated grade-band cognitive model, deep question-quality sampling strategy, overlap resolution policy, and a prioritized fix plan—without code or content changes."
todos:
  - id: inventory-sources
    content: Inventory per-subject curriculum sources (JS maps, generators, audit outputs) and define master table columns + cognitive rubric
    status: cancelled
  - id: gap-matrix
    content: "Build gap matrix: declared curriculum vs item counts vs audit findings vs Hebrew alignment matrix; classify CRITICAL/IMPORTANT/MINOR"
    status: cancelled
  - id: progression-pass
    content: Run grade-band progression analysis (difficulty + cognitive rubric + overlap stems) and list violation types with examples
    status: cancelled
  - id: worst-80
    content: Define ranking heuristic and enumerate worst 20 questions per subject from audit/items + native IDs
    status: cancelled
  - id: overlap-policy
    content: Document overlap resolution policy (keep/merge/rewrite/delete) tied to audit taxonomies
    status: cancelled
  - id: fix-priority
    content: "Produce ordered backlog: spine first, then Hebrew alignment, geography/English structure, minor phrasing"
    status: cancelled
isProject: false
---

# Phase 7.7 — Full curriculum-grade system (analysis only)

## Ground truth in this repo (important constraint)

The codebase does **not** contain a single unified “ministry PDF → machine subtopic” spine for all five subjects. Coverage varies:

| Subject | Structured “curriculum” in repo | Subtopic / skill granularity |
|--------|----------------------------------|-------------------------------|
| **Science** | [`data/science-curriculum.js`](data/science-curriculum.js): per grade `topics[]` + rich `curriculum` blocks (`focus`, `skills`, `inquiry`, `technology`) | **Topic-level** only (e.g. `body`, `experiments`); no first-class subtopic IDs in that file |
| **Hebrew** | [`data/hebrew-curriculum.js`](data/hebrew-curriculum.js) (grade goals + six `topics` per grade) **plus** per-grade maps: [`data/hebrew-g1-content-map.js`](data/hebrew-g1-content-map.js) … [`data/hebrew-g6-content-map.js`](data/hebrew-g6-content-map.js) | **Subtopic IDs** (e.g. `g1.phoneme_awareness`) with weights/modes; closest to a full internal spine |
| **English** | [`data/english-curriculum.js`](data/english-curriculum.js): per grade `topics`, `wordLists`, `curriculum` | Mix of **topics** + **word list dimensions**; grammar as text arrays, not stable skill IDs |
| **Geography (Moledet)** | [`data/moledet-geography-curriculum.js`](data/moledet-geography-curriculum.js): per grade `topics` + nested `geography` / `citizenship` skill lists | Topic-level + bullet skills; question banks are nested JS objects under grade files ([`data/geography-questions/g1.js`](data/geography-questions/g1.js) etc.) without shared subtopic IDs |
| **Math** | **No** `data/math-curriculum.js` analogue found | Curriculum intent is **implicit** in [`utils/math-question-generator.js`](utils/math-question-generator.js) (kinds, grade gates, harness); mapping must be **derived** from generator + harness outputs ([`reports/question-audit/`](reports/question-audit/) when audits run) |

**Implication for deliverable A:** The “full map” is a **hybrid**: (1) authoritative where Hebrew content maps exist, (2) topic/goal-level for science/geography/English curriculum JS, (3) **reconstructed** for math from generator taxonomy + audits. Any claim of “complete ministry mapping” requires an **external** standard (PDF/TOC) not stored here—Phase 7.7 should treat that as a **Phase 8 data-ingestion** dependency, not something this analysis invents.

---

## A. Full curriculum map (deliverable structure)

Produce one **master table** (exportable later to CSV/JSON) with columns:

`subject | topic | subtopic_id (or null) | skill_label | minGrade | maxGrade | cognitive_level | evidence_ref`

**Rules for filling cells:**

- **minGrade / maxGrade**
  - Hebrew subtopics: **exact** grade from map namespace (`g3.*` → min=max=3) unless item uses `gradeBand` / `minGrade`/`maxGrade` in [`utils/hebrew-rich-question-bank.js`](utils/hebrew-rich-question-bank.js) or legacy pools in [`utils/hebrew-question-generator.js`](utils/hebrew-question-generator.js).
  - Science: topic allowed per grade from [`SCIENCE_GRADES[g].topics`](data/science-curriculum.js); item-level range from question `grades[]` / metadata in [`data/science-questions.js`](data/science-questions.js) + phase3.
  - English: from [`ENGLISH_GRADES[g].topics`](data/english-curriculum.js) + pool gates in [`utils/grade-gating.js`](utils/grade-gating.js) (`ENGLISH_*_POOL_RANGE`).
  - Geography: grade implied by export (`G3_EASY_QUESTIONS`, …); cross-grade duplicate stems are a **data** phenomenon, not curriculum IDs.
  - Math: from generator branch + observed `minGrade`/`maxGrade` on generated rows in audit items (when available) or from static sample metadata in [`scripts/audit-question-banks.mjs`](scripts/audit-question-banks.mjs).

- **cognitive_level** (your four levels)  
  Assign **per row** using a **defined rubric** (documented in the analysis doc), e.g.:
  - Default tie-break: map product `easy|medium|hard` → recognition / understanding / application / reasoning **with explicit exceptions** (e.g. “word problems” bump +1 level).
  - Hebrew g1–g2 MCQ-heavy official matrix rows: often **recognition** even when labeled “hard” in product—flag as **metadata vs cognitive** mismatch (see alignment matrix [`data/hebrew-official-alignment-matrix.json`](data/hebrew-official-alignment-matrix.json)).

**Concrete example rows (illustrative pattern, not full exhaustive dump in this plan):**

- Science: `science | experiments | (none) | "תכנון ניסוי בסיסי" | 3 | 6 | application–reasoning | SCIENCE_GRADES.g3–g6 curriculum.skills + question stems`
- Hebrew: `hebrew | reading | g1.phoneme_awareness | "הבחנה פונולוגית" | 1 | 1 | recognition | HEBREW_G1_CONTENT_MAP`
- English: `english | grammar | (pool: present_simple) | "Present simple affirmative" | 3 | 4 | application | english-curriculum + ENGLISH_GRAMMAR_POOL_RANGE`

---

## B. Gaps per subject (CRITICAL / IMPORTANT / MINOR)

Use **three evidence channels** (all read-only):

1. **Declared curriculum** (files above) vs **question inventory** (counts by topic/subtopic from latest `audit:questions` / `items.json` when present).
2. **Audit findings** ([`reports/question-audit/findings.json`](reports/question-audit/findings.json), `stage2.json`): e.g. `patternFamilyWideGradeSpan`, `withinBandClassPairOverlaps`, `hebrewLegacySameStemThreeLevels`.
3. **Alignment / risk** for Hebrew: [`data/hebrew-official-alignment-matrix.json`](data/hebrew-official-alignment-matrix.json) (`coverage_status`, `required_task_types_pedagogically` vs `allowed_task_types_today`).

**Subject-specific gap themes (to validate with counts in the written analysis):**

- **Math:** No single curriculum file → **CRITICAL**: cannot prove ministry completeness; **IMPORTANT**: progression must be validated via generator + harness + difficulty ladders, not prose goals.
- **Hebrew:** Strongest subtopic spine → gaps are **IMPORTANT** where matrix says `partial` / `medium` fallback risk or pool narrowing fails (historical `narrowFallbackRateEasy` for grammar); **MINOR**: cosmetic overlap after Phase 7.6.
- **English:** Goals exist but **skill IDs weak** → **IMPORTANT**: harder to prove “skill mastered” vs “topic played”; watch for pool-gate-only items (already flagged in audit taxonomy).
- **Science:** Rich per-grade narrative but **no subtopic registry** in curriculum file → **IMPORTANT**: topic balance and “plants” drop in g4/g5 per [`SCIENCE_GRADES`](data/science-curriculum.js) vs item distribution.
- **Geography:** Large template reuse across grades → **IMPORTANT**: progression illusion; **MINOR** after ambiguous stem fixes unless new wording review.

---

## C. Progression violations (your G1–2 / G3–4 / G5–6 model)

**Method:** For each `subject::topic` (and `subtopic` where available), bucket grades 1–2, 3–4, 5–6 and compare:

- Distribution of `easy|medium|hard` (from audit rows).
- Stem hash reuse across bands (from `withinBandClassPairOverlaps` and near-dup metrics).
- Cognitive rubric assignment (Section A): flag **flat cognitive level** across bands for the same skill family.

**Known violation classes (from prior audits, to re-quantify in 7.7 doc):**

- **Same cognitive level across grades**: definitional MCQ templates repeated in legacy pools (Hebrew vocabulary “typed” family spanning g1–g6 — see `patternFamilyWideGradeSpan` in findings).
- **No difficulty increase**: identical stems in both grades of a band (partially reduced post–7.6; remainder in `withinBandPairs=37`).
- **Repeated cognitive level within grade across levels**: `hebrewLegacySameStemThreeLevels` entries in findings (grammar templates spanning easy/medium/hard).

---

## D. Worst questions list (20 per subject)

**No new code in Phase 7.7** — define a **repeatable selection algorithm** and run it **manually or with read-only scripts later** (outside this plan approval step):

**Ranking signals (weighted):**

1. Ambiguity / non-literal Hebrew homographs (geography history).
2. Exact duplicate stem (normalized) within same grade or cross-grade.
3. `correctIndex` / option-length integrity (science already validated post-dedupe; re-run on snapshot).
4. **Difficulty–cognitive mismatch**: easy label + reasoning stem.
5. Distractor quality heuristics: same length all options, “רק …” pattern overuse (Hebrew legacy style).

**Output:** For each subject, table of 20: `{id or hash, stem excerpt, grade, level, failure_tags[], suggested_action_bucket}`.

**Data sources:** `reports/question-audit/items.json` (8077 rows), plus subject-native IDs (`SCIENCE_QUESTIONS[].id`, geography `question` text, English/math row metadata).

---

## E. Overlap resolution plan (policy)

Leverage existing overlap taxonomy (`withinBandClassPairOverlaps`, cross-grade dupes):

| Situation | Strategy |
|-----------|----------|
| Same stem, **same** cognitive demand across adjacent grades | **Rewrite** one side with grade-scaffolded stem (Phase 7.6 pattern) or **split** rich-pool rows with `minGrade`/`maxGrade` |
| Same stem, **different** options but stem identical | **Rewrite** stem minimally to preserve stats; keep canonical **one** row if truly duplicate |
| Intentional band scaffold (reading/spelling) | **Keep**, document as `scaffold_duplicate` in curriculum map |
| Generator `kind` collision (math) | **Merge** pedagogically equivalent kinds in documentation first; code later |
| Geography cross-grade template | **Rewrite** per-grade surface form OR **merge** into shared “citizenship core” with explicit grade tag in stem |

**Delete** only when duplicate is **bit-exact** and **no** pedagogical delta (science dedupe policy already applied to main array).

---

## F. Fix priority plan (ordered backlog)

1. **CRITICAL — Spine**: Introduce (future phase) `curriculum-v2` schema: stable `skill_id`, `minGrade`, `maxGrade`, `cognitive_level`, `evidence_link` for all subjects; **math** and **science** need new source tables (ministry TOC ingestion or internal SME).
2. **IMPORTANT — Hebrew**: Close matrix gaps where `required_task_types_pedagogically` ⊄ product (`alignment-matrix` hot rows); reduce subtopic masking (`narrow` simulation per topic).
3. **IMPORTANT — Geography**: Grade-tagged stems + reduce template duplication counts.
4. **IMPORTANT — English**: Bind pools to explicit skills in curriculum export, not only `grade-gating`.
5. **MINOR — Aesthetic / phrasing**: Legacy “רק … / ללא …” distractor patterns; non-pedagogical stems.

---

## What Phase 7.7 **does not** do (per your rules)

- No edits to generators, questions, AI, parent-report, storage, answer-compare.
- No claim that the written “full map” equals the **entire** Israeli national curriculum without external documents; it equals **repo truth + explicit external gap list**.

---

## Suggested next step after you approve this plan

Produce the **written Phase 7.7 report** (markdown or PDF outside repo if you prefer) containing sections A–F filled with **tables and counts** from a read-only pass over `reports/question-audit/*` + curriculum JS files, and attach the **master curriculum table** as a machine-readable export in a follow-up phase when you allow file output.
