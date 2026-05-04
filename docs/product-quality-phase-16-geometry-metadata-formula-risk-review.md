# Product Quality Phase 16 — Geometry Metadata + Formula/Diagram Risk Review

**Last updated:** 2026-05-05  
**Status:** Review complete — **documentation only**. No edits to question text, Hebrew wording, answers, `correctIndex`, grade ranges, topic keys, UI, parent-facing reports, Parent AI, Copilot, APIs, learning logic, or bank/generator source files.

## Sources

| Artifact | Use |
|----------|-----|
| [`reports/question-audit/items.json`](../reports/question-audit/items.json) | Row counts, `subtype`, `subtopic` (= generator `kind`), `patternFamily`, `stemHash`, grade/difficulty |
| [`reports/question-audit/findings.json`](../reports/question-audit/findings.json) | Duplicates, pattern-family spans, generator notes |
| [`reports/question-audit/stage2.json`](../reports/question-audit/stage2.json) | Weak separation, harness merge, generator branch notes |
| [`utils/geometry-question-generator.js`](../utils/geometry-question-generator.js) | Formula paths, story stems, `params.kind` / `patternFamily` |
| [`utils/geometry-conceptual-bank.js`](../utils/geometry-conceptual-bank.js) | Static conceptual items (`GEOMETRY_CONCEPTUAL_ITEMS`), `subtype` on rows |
| [`utils/geometry-constants.js`](../utils/geometry-constants.js) | Grade/topic configuration (referenced by generator) |

---

## Part A — Geometry metadata (`subtype`)

### A.1 Inventory (from latest audit JSON)

| Segment | Rows | Missing `subtype` |
|---------|------|---------------------|
| **All geometry** | **2548** | **1313** |
| `rowKind: geometry_conceptual` (static bank via [`collectGeometryConceptual`](../scripts/audit-question-banks.mjs)) | **100** | **0** |
| `rowKind: geometry_generator_sample` | **2448** | **1313** |

Among **generator** samples only:

| Segment | Rows |
|---------|------|
| Has **`subtype`** (non-empty) | **1135** |
| Missing **`subtype`** | **1313** |

### A.2 Interpretation: expected gap vs. bug

**Findings:**

1. **Static conceptual bank** — Each audited conceptual row sets `subtype` from `item.subtype` in [`geometry-conceptual-bank.js`](../utils/geometry-conceptual-bank.js) → **no missing subtype** in audit.

2. **Generator formula / numeric branches** — Most paths build `params` with **`kind`** and **`patternFamily`** but **do not** set `params.subtype`. The audit maps `q.params.kind` → **`subtopic`** ([`sampleGeometryGenerator`](../scripts/audit-question-banks.mjs) ~735–737). So **fine-grained classification already exists under `subtopic`**, not under `subtype`.

3. **Generator conceptual overlay** — When [`pickGeometryConceptualQuestion`](../utils/geometry-question-generator.js) wins the random branch, returned `params` include **`subtype`** from the conceptual row (e.g. `concept_measure_interpret`, `concept_angle_reason`, …).

4. **Partial `subtype` on formula topics** — Only explicit assignments in [`geometry-question-generator.js`](../utils/geometry-question-generator.js) (e.g. **parallel/perpendicular** and **triangles** classification with `mid_band` / `late_band`) populate **`subtype`** alongside **`kind`**.

**Conclusion:** **Missing `subtype` on ~1313 generator rows is primarily an audit taxonomy / generator-metadata convention**, not missing identification of the question type: **`subtopic` duplicates `kind`** for those rows. Treating empty **`subtype`** as “broken metadata” would **over-read** the signal.

### A.3 Recommended metadata strategy (do not implement yet)

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A — Audit consumer rule** | For `geometry_generator_sample`, treat **`subtopic`** as the canonical fine tag when **`subtype`** is empty. | Zero code churn; matches current data | Two columns for one concept |
| **B — Generator parity** | Set `params.subtype = params.kind` (or a mapped taxonomy id) for all formula branches. | Uniform columns in CSV/JSON | Touches generator params contract; needs regression discipline |
| **C — Audit-only denormalize** | In [`audit-question-banks.mjs`](scripts/audit-question-banks.mjs), emit derived **`subtypeDisplay`** or fill empty **`subtype`** from **`kind`** for samples only. | Keeps runtime unchanged | Audit-only duplication |

**Recommendation:** Prefer **A** short-term for dashboards/reviews; plan **B** or **C** when implementing a formal geometry taxonomy (aligned with [`stage2.json`](../reports/question-audit/stage2.json) harness kind lists).

---

## Part B — Formula / diagram / wording risk review

**Method:** Representative sampling across audit topics (stems from `items.json`) plus generator structure review. **Not** a full manual read of **2548** stems.

### B.1 Cross-topic risk summary

| Topic (audit `topic`) | Rows (audit) | Dominant risk themes | Overall posture |
|----------------------|---------------|------------------------|-----------------|
| area | 366 | Formula vs grid-count stems (`early` band); story contexts (`late`) | Mostly **OK**; watch grid/visual alignment |
| perimeter | 288 | Conceptual “measure vs fence” vs numeric perimeter | **OK** / **wording precision** on conceptual rows |
| volume | 222 | Prism/cube formulas; unit cube language | **OK**; formula assumptions explicit in stem |
| angles | 226 | Triangle sum; inference stems | **OK** |
| circles | 73 | diameter/radius relationships | **OK** |
| triangles | 76 | Classification MCQ (numeric indices) | **Wording precision** (mapping 1/2/3) |
| quadrilaterals | 152 | Classification by properties | **OK** |
| symmetry | 76 | Mirror vs rotation language | **OK** |
| transformations | 148 | Translation/reflection indices | **Wording precision** index schemes |
| pythagoras | 74 | Right-triangle hypotenuse/leg | **Formula assumption** (right triangle) |
| parallel_perpendicular | 152 | Parallel vs perpendicular indices | **Wording precision** |
| solids | 152 | Faces/edges/cube counts (conceptual) | **OK** |
| diagonal | 148 | Diagonal formulas (square/rectangle/parallelogram) | **Diagram assumption** if learners expect a figure |
| heights | 74 | Height from area/base | **Formula assumption** |
| tiling | 36 | Angle fit tiling | **OK** / medium **conceptual** |
| rotation | 55 | Rotation concepts | **OK** |

Other geometry topics present in audit counts include **shapes_basic**, **parallel_perpendicular** (above), **transformations**, etc.; same principles apply.

### B.2 Issue register (thematic rows)

Each row is a **review theme** (not every audit row). **Hebrew text changes** would only apply if an owner later approves copy edits—none proposed here.

| # | Example identifier (audit) | Source | Topic | Subtype / kind | Grade band (example) | Difficulty (example) | Issue type | Severity | Recommended action | Hebrew text change? |
|---|----------------------------|--------|-------|----------------|------------------------|------------------------|------------|----------|----------------------|---------------------|
| 1 | Example `stemHash` **`84b69f8e47e24c1ecd99e3d1`** (`subtopic=rectangle_area`, `patternFamily=area_rectangle_early_easy`) | `geometry_generator_sample` | area | *(empty subtype)* `subtopic=rectangle_area` | G3–G6 samples | easy–hard | **Metadata** — empty `subtype` while `subtopic` populated | Low | **add subtype metadata** (optional) or document rule **A** | No |
| 2 | Grid-based stems (“על רשת”, “משבצות”) vs pure formula stems (“בלי רמז חזותי”) | `geometry-question-generator.js` area branch | area | `square_area` / `rectangle_area` | varies | varies | **Diagram/visual dependency** — learner may expect a figure when stem says “רשת” | Medium | **diagram assumption review** in product QA on actual UI | Maybe (only if UI never shows grid) |
| 3 | Story problems (`story_*` kinds, `late` band) | same file | area / perimeter / volume / circles | `story_rectangle_area`, etc. | G5–G6 | varies | **Wording precision** — narrative + numeric consistency | Medium | **answer key review** on sampled stories | Owner review if copy tightened |
| 4 | Conceptual rows (`concept_*` kinds) with filled `subtype` | conceptual bank + generator path | multiple | e.g. `concept_measure_interpret` | varies | varies | **OK** for taxonomy | Low | **keep** | No |
| 5 | Numeric index stems `(1 = …, 2 = …)` for transformations / parallel / triangles | `geometry-question-generator.js` | transformations, parallel_perpendicular, triangles | `transformations`, `parallel_perpendicular`, `triangles` | varies | varies | **Wording precision** — learners must map Hebrew labels to indices | Medium | **owner exact wording required** if simplifying prompts | Yes **only with owner text** |
| 6 | `pythagoras_hyp` / `pythagoras_leg` | `geometry-question-generator.js` | pythagoras | kind in `subtopic` | G5–G6 | varies | **Formula assumption concern** — must remain right-triangle contexts | Medium | **formula assumption review** on samples | No |
| 7 | Diagonal kinds (`diagonal_square`, …) | same | diagonal | kind in `subtopic` | varies | varies | **Diagram/visual dependency** — formulas reference shapes not drawn in stem text alone | Medium | **diagram assumption review** | No |
| 8 | Distractors for numeric MCQ | generator answer construction | formula topics | various | varies | varies | Plausible wrong formulas / rounding — **answer-key concern** if distractor equals correct under alternate reading | Medium | **answer key review** on high-stakes grades | No |
| 9 | `findings.json` — `patternFamilyWideGradeSpan` includes `geometry::area` (small **conceptual** slice) | audit analytics | area | `plan_then_compute` dominant | span note | — | **Duplicate/near-duplicate concern** at taxonomy level (wide PF span) | Low | Monitor; not a stem duplicate | No |
| 10 | `stage2.withinBandOverlapCount` (global **37**) — Hebrew-heavy; geometry overlap not isolated here | stage2 | — | — | — | Adjacent-band overlap heuristic | Low | **keep** unless Hebrew owner scope expands | N/A |

**Critical / high severity:** **None** identified from this documentation pass (no evidence of systematically wrong `correctAnswer` without content review).

---

## Part C — Generator coverage note

[`stage2.json`](../reports/question-audit/stage2.json) reports **`geoKindsMissedInRun`: 0** — all declared harness geometry kinds were hit in the deterministic sample run. **`kindsHitButNotInStaticRegex`** lists many **`concept_*`** / **`story_*`** strings — these are **taxonomy regex drift** signals for tooling, not learner-facing defects.

---

## Part D — Recommended first Geometry patch (future implementation phase)

**Do not implement as part of Phase 16.**

1. **Metadata-only (safest):** Choose strategy **A**, **B**, or **C** from §A.3; if **B**, add `subtype` parallel to `kind` for formula branches only after test harness passes.

2. **Quality pass:** Spot-check **story** (`story_*`) and **grid** stems in the live UI for **diagram/visual** alignment.

3. **Answer-key spot-check:** Sample one **numeric** and one **index-mapping** question per major topic for grades **ה׳–ו׳**.

---

## Compliance checklist (Phase 16)

| Rule | Met |
|------|-----|
| Question text unchanged | Yes — review only |
| Hebrew wording unchanged | Yes |
| Answers / `correctIndex` unchanged | Yes |
| Grade ranges / topic keys unchanged | Yes |
| UI / reports / Parent AI / Copilot / APIs / learning logic unchanged | Yes |

---

*Cross-reference:* [`docs/product-quality-phase-8-subject-coverage-content-plan.md`](product-quality-phase-8-subject-coverage-content-plan.md) §2.2 Geometry.
