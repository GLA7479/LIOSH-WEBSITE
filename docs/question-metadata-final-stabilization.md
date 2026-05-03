# Question metadata — final stabilization audit

**Phase:** Final Metadata Stabilization Audit (reporting only — no metadata edits in this phase).  
**Product constraint:** Hebrew UI and student-facing question copy unchanged by metadata passes.

**Scan reference:** `reports/question-metadata-qa/summary.json` — run `npm run qa:question-metadata` to refresh.

**Gate policy (post-stabilization):** Blocking vs advisory classification is enforced in **`utils/question-metadata-qa/question-metadata-gate-policy.js`** and surfaced as **`gate.gateDecision`** in `summary.json`. Release **`qa:learning-simulator:release-summary`** fails on blocking metadata or scan errors; advisory gaps (including exempt English skill gaps) do not fail CI.

---

## Executive snapshot

| Metric | Value (latest scan) |
| --- | ---: |
| Questions scanned (static banks + enumerated modules) | 5756 |
| Gate | `scanOutcome: ok`, `advisoryStatus: WARN` |
| Global high-risk rows | 439 |
| Global medium-risk rows | 0 |
| Duplicate declared IDs | 0 |

**Primary residual debt:** English grammar pools still contain **439** rows without declared **skillId** / **subskillId** (intentional **“safe”** English pass). All other listed subjects have **0** high-risk rows for core diagnostic tags at scan time.

---

## A. Subject completion table

Static scan subject ids follow `reports/question-metadata-qa/summary.json` → `subjectSummaries`. **“Hebrew”** in the scanner refers to the **Hebrew rich pool** file `utils/hebrew-rich-question-bank.js` (not the g1–g6 archive). **Math** is not a separate static subject row in the scanner; it is covered by **procedural** `utils/math-question-generator.js` and verified in **math generator** reports (see footnote).

| Subject / source | Rows scanned | Metadata applied (program) | Verify report | skillId | subskillId | difficulty | cognitiveLevel | expectedErrorTypes | prerequisiteSkillIds | correct | high-risk | Readiness |
| --- | ---: | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Science | 383 | Yes | `science-post-apply-verification.json` — **ok** | 100% | 100% | 100% | 100% | 100% | 0.3% | 100% | 0 | **Strong** |
| Geometry (conceptual bank) | 52 | Yes | `geometry-post-apply-verification.json` — **ok** | 100% | 100% | 100% | 100% | 100% | 5.8% | 100% | 0 | **Strong** |
| Hebrew rich pool | 54 | Yes | `hebrew-rich-post-apply-verification.json` — **ok** | 100% | 100% | 100% | 100% | 100% | 3.7% | 100% | 0 | **Strong** |
| English (3 pool files) | 670 | Partial (safe) | `english-post-apply-verification.json` — **ok** (known skill gaps) | 34.5% | 34.5% | 100% | 100% | 100% | 0% | 100% | **439** | **Weak** (skill gap) |
| Math generators | *See note* | Yes (runtime attach) | `math-generator-metadata-verification.json` — **ok** | *At generation* | *At generation* | *At generation* | *At generation* | *At generation* | *Policy* | *Struct valid* | *N/A static* | **Strong** (code path) |
| Hebrew archive g1–g6 | 1091 | Yes | `hebrew-archive-post-apply-verification.json` | 100% | 100% | 100% | 100% | 100% | 0% | 100% | 0 | **Strong** |
| Moledet / geography | 3506 | Yes | `geography-post-apply-verification.json` — **passed** | 100% | 100% | 100% | 100% | 100% | 0% | 100% | 0 | **Strong** |

**Note — Math:** The static metadata scanner does not assign a row count to every possible generated math item. Completeness is documented in `math-generator-metadata-apply-report.json` and structural integrity in `math-generator-metadata-verification.json` (synthetic trials, `ok: true`).

---

## B. Before / after summary (qualitative + scan)

- **High-risk reduction:** The corpus **highRiskCount** is now **439**, concentrated in **English** low-confidence / untagged pool rows. Earlier upgrade phases removed large high-risk mass from **Hebrew archive**, **Moledet/geography**, and other subjects that previously lacked **skillId**, **difficulty**, **cognitiveLevel**, and **expectedErrorTypes**.
- **Core metadata coverage:** For every **scanned** subject except the **English** partial cohort, **skillId**, **subskillId**, **difficulty**, **cognitiveLevel**, and **expectedErrorTypes** are at **100%** where the subject line in `summary.json` shows **readinessScore: strong** and **highRiskQuestionCount: 0**.
- **Subjects in a strong / safer state:** Science, geometry conceptual bank, Hebrew rich pool, Hebrew archive, Moledet/geography, and math generator integration.
- **English:** **“Safe”** apply left **231** rows with tags and **439** rows **without** **skillId**/**subskillId** by design — those **439** drive global high-risk.
- **QA / build:** Per project state at audit: **question-metadata** advisory **WARN** (expected), **learning-simulator:quick** and **build** re-run in this phase; full suite optional and may be environment-sensitive (browser render gate).

---

## C. Remaining gaps (cross-corpus)

| Gap | Scale (from `summary.json` top issues) | Notes |
| --- | ---: | --- |
| `missing_prerequisite_skill_ids` | 5750 | Advisory; no explicit DAG in data for most items. |
| `implicit_id_only` | 5373 | Many rows use scanner-synthesized paths, not author **id** fields. |
| `missing_explanation` | 4753 | Explanations not in scope of metadata-only passes. |
| `missing_skillId` / `missing_subskillId` | 439 each | **All attributable to English** partial tagging. |
| English low-confidence / untagged | 439 rows | Aligns with **highRiskCount**. |
| Procedural sources | Documented, not fully enumerated as static rows | Math / Hebrew live merge / geometry procedural — metadata at generation or merge time. |

---

## D. Risk classification

| Gap type | Classification |
| --- | --- |
| Missing **prerequisiteSkillIds** | **Advisory** now; **review before adaptive sequencing** if used for ordering. |
| **implicit_id_only** | **Advisory**; **safe to ignore** for diagnosis unless deduping across exports. |
| **missing_explanation** | **Advisory**; **should not block** release metadata gate; **never auto-fill** from LLM without editorial policy. |
| English **439** untagged **skillId** | **Should be reviewed** before relying on English for fine-grained adaptive planner; **should become blocking** if English must match other subjects’ bar. |
| Invalid taxonomy / malformed answers | **Should be blocking** in CI once corpus is clean enough. |
| Low-volume **skill** buckets | **Advisory** (299 buckets below threshold per scan) — reliability warning, not necessarily blocking. |

---

## E. Recommendations — blocking vs advisory

### Candidate **blocking** gates (release / CI) once policy is agreed

- **Missing `difficulty`** on static bank rows.
- **Missing `cognitiveLevel`** on static bank rows.
- **Missing or empty `expectedErrorTypes`** where taxonomy requires non-empty lists.
- **Malformed / missing correct answer** wiring for MCQ-style rows.
- **`taxonomy_unknown_*`** (unknown skill, subskill, error type, prerequisite id).

### Should remain **advisory**

- **`prerequisiteSkillIds`** until an explicit curriculum graph exists.
- **`missing_explanation`** (content investment; pedagogy).
- **`implicit_id_only`** until stable declared IDs are adopted corpus-wide.
- **English** rows still awaiting human-confirmed **skillId**/**subskillId** (do not auto-infer unsafely).

---

## F. Next development phase recommendation

**Recommended first:** **(1) Promote selected metadata QA checks to blocking in full/release**, scoped per subject — begin with subjects already at **100%** core tags, then add English once the **439** rows are resolved or explicitly exempted.

**Why before planner/dashboard/replay:** Adaptive planner, teacher dashboards, and replay tooling assume trustworthy tags and stable identifiers. Shipping them first on a partially tagged English cohort shifts complexity into product logic and hides data debt.

**Order after that:** **(2) Adaptive Learning Planner** — consumes difficulty, cognitive level, and skill buckets once English gap is closed or scoped out. **(3) Admin/Teacher Dashboard** — operational visibility. **(4) Real Student Replay** — depends on consistent IDs and logging contracts.

---

## Source artifacts

| Artifact | Path |
| --- | --- |
| Rollup | `reports/question-metadata-qa/summary.json`, `summary.md` |
| Skill buckets | `reports/question-metadata-qa/skill-coverage.json` |
| Issues sample | `reports/question-metadata-qa/questions-with-issues.json` |
| Machine-readable audit | `reports/question-metadata-qa/final-stabilization-summary.json` |
| Subject verify / apply | `reports/question-metadata-qa/*-post-apply-verification.json`, `*-metadata-apply-report.json` |

---

## Revision history

| Date | Notes |
| --- | --- |
| 2026-05-03 | Initial final stabilization audit document. |
