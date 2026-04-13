---
name: Hebrew Perfect Close Plan
overview: Close the gap from operational True Done to Perfect Done by enforcing row-level official traceability and making official-source governance the hard source-of-truth pipeline for matrix + verification.
todos:
  - id: define-row-binding-contract
    content: Define strict row-level official provenance contract and conditional schema rules.
    status: completed
  - id: build-excerpt-registry
    content: Create canonical official excerpt dataset with stable IDs, anchors, and source-version metadata.
    status: completed
  - id: implement-binding-and-divergence
    content: Implement row-binding generator and divergence audit to keep matrix synchronized with official-source artifacts.
    status: completed
  - id: harden-final-verify
    content: Upgrade verify to fail on any missing/mismatched row-level traceability and unresolved in-scope partial/fallback debt.
    status: completed
  - id: final-freeze-criteria
    content: Publish perfect freeze criteria with only audio and long free writing excluded.
    status: completed
isProject: false
---

# Hebrew Final Perfection Plan

## A. Final Perfection Gaps

- **Row-level traceability is not complete:** in [`data/hebrew-official-alignment-matrix.json`](data/hebrew-official-alignment-matrix.json), `official_section_anchor` and `official_doc_excerpt_ref` are still `null` per in-scope row.
- **Official linkage is document-level, not row-level evidence:** rows are file-bound to `hebrew-1-6.pdf`, but there is no stable per-row excerpt artifact.
- **Provenance semantics are weaker than Perfect Done:** `official_objective_source` is mainly `ministry_summary_verified`; `ministry_excerpt_verbatim` is not systematically used for rows that can be quoted exactly.
- **Schema is not enforcing perfection-level conditions:** [`data/hebrew-official-provenance.schema.json`](data/hebrew-official-provenance.schema.json) does not currently require anchor/excerpt conditionally by status/source.
- **Verify is strong operationally but not yet perfection-hard on excerpt governance:** [`scripts/hebrew-true-done-verify.mjs`](scripts/hebrew-true-done-verify.mjs) fails on pending/closure/critical-coverage/internal-only, but does not yet fail on missing row-level anchor/excerpt integrity.

## B. Row-Level Official Binding Plan

- **Define binding contract per row** (for every in-scope row in matrix):
  - required non-null `official_section_anchor`
  - required non-null `official_doc_excerpt_ref`
  - explicit `confidence` policy (`medium` summary-only, `high` when anchor+excerpt validated)
  - explicit `official_objective_source` policy (`ministry_excerpt_verbatim` when direct quote is possible; `ministry_summary_verified` only when paraphrase is unavoidable and justified)
- **Create excerpt registry artifact** with stable IDs, each linked to:
  - `doc_id`, `doc_version/hash`, `section_anchor`, page range, excerpt text, normalization hash
  - row mapping metadata (`mapped_subtopic_id`, `grade`, `runtime_topic`)
- **Populate matrix binding fields** by script, not manual editing:
  - read excerpt registry
  - write `official_section_anchor`, `official_doc_excerpt_ref`, `official_objective_source`, `confidence`
  - reject rows missing eligible excerpt assignment
- **Binding policy rules:**
  - use `ministry_excerpt_verbatim` when objective can be traced to a clear direct excerpt span
  - allow `ministry_summary_verified` only with explicit justification field and still required excerpt ref to supporting section

## C. Official-Source Governed Pipeline Plan

```mermaid
flowchart LR
  officialPdf["Official PDF Source"] --> extractPass["Excerpt Extraction Pass"]
  extractPass --> excerptDataset["Row Excerpt Dataset"]
  excerptDataset --> matrixBind["Matrix Binding Script"]
  matrixBind --> matrixJson["Alignment Matrix"]
  matrixJson --> closureRules["Closure Rules Check"]
  closureRules --> verifyGates["Hard Verify Gates"]
```

- **New artifacts**
  - [`data/hebrew-official-excerpts.json`](data/hebrew-official-excerpts.json): canonical row-level excerpt dataset
  - [`data/hebrew-official-row-binding.json`](data/hebrew-official-row-binding.json): explicit row->excerpt mapping (if kept separate)
  - [`data/hebrew-official-source-version.json`](data/hebrew-official-source-version.json): source URL, checksum/hash, fetched_at
- **New scripts**
  - [`scripts/hebrew-official-extract-excerpts.mjs`](scripts/hebrew-official-extract-excerpts.mjs): build/update excerpt dataset from official source
  - [`scripts/hebrew-official-bind-rows.mjs`](scripts/hebrew-official-bind-rows.mjs): enforce matrix row-level fields from excerpt dataset
  - [`scripts/hebrew-official-divergence-audit.mjs`](scripts/hebrew-official-divergence-audit.mjs): detect drift between source version, excerpts, matrix
- **Sync guarantees**
  - matrix provenance fields become generated outputs from binding script
  - manual edits to bound fields fail validation unless regenerated
- **Divergence checks**
  - source hash mismatch vs expected version => fail
  - missing excerpt ID in registry => fail
  - anchor points outside known section/page ranges => fail

## D. Final Closure Queue (In-Scope Only)

- **Queue class 1 (must-close before freeze): traceability closure**
  - every in-scope row has non-null anchor + excerpt ref
  - every row has permitted source type and confidence per policy
- **Queue class 2 (must-close before freeze): pseudo-task/coverage consistency in-scope**
  - any row marked partial due to traceability absence is upgraded after binding
  - any row partial due to fallback/pseudo framing is either:
    - resolved in bank behavior/content within allowed scope, or
    - explicitly reclassified as out-of-scope only if it is audio or long free writing
- **Priority order**
  1. provenance completeness (anchor/excerpt/source type)
  2. verify hardening for provenance gates
  3. remaining in-scope partial closures tied to pseudo-task/fallback
  4. freeze documentation lock

## E. Hard Verify Plan

Extend [`scripts/hebrew-true-done-verify.mjs`](scripts/hebrew-true-done-verify.mjs) to fail on all perfection-level violations:

- any in-scope row missing `official_section_anchor`
- any in-scope row missing `official_doc_excerpt_ref`
- any row with `official_doc_excerpt_ref` not found in excerpt dataset
- any row with anchor/excerpt that mismatches declared `official_doc_id`/source version
- any row using `ministry_summary_verified` without supporting excerpt link + justification field
- any in-scope row still `partial` where reason is traceability or unresolved pseudo-task/fallback
- any in-scope row with `misleading_due_to_fallback` or `weak` (not only weak+high)
- any closure queue not empty for in-scope items
- any divergence between matrix provenance and generated binding outputs

## F. Perfect Freeze Definition

`Hebrew perfect close achieved` can be declared only when all are true:

- row-level provenance complete for all in-scope rows (anchor + excerpt ref + valid source type + confidence policy)
- official-source governed pipeline artifacts exist and are the generating authority for matrix binding fields
- verify gates enforce and pass all perfection checks (including divergence detection)
- no in-scope rows remain partial due to traceability/pseudo-task/fallback debt
- only residual exclusions documented are:
  - audio / שמע / הקלטה
  - long free writing
- freeze docs explicitly state row-level governance status and source-version pin

## G. Recommended First Artifact To Build First

- Build **[`data/hebrew-official-excerpts.json`](data/hebrew-official-excerpts.json)** first.
- Reason: every other perfection requirement (row binding, confidence policy, divergence audit, strict verify) depends on having canonical row-level excerpt IDs and anchors as source data.
