---
name: phase8-content-plan
overview: Create a documentation-only Phase 8 subject coverage and content improvement plan using existing question audit outputs, with no question-bank or Hebrew wording changes.
todos:
  - id: draft-phase8-doc
    content: Create `docs/product-quality-phase-8-subject-coverage-content-plan.md` with subject matrix, readiness statuses, priorities, and first patch recommendation.
    status: pending
  - id: update-phase1-ref
    content: Add a concise Phase 8 reference to `docs/product-quality-phase-1-audit.md`.
    status: pending
  - id: verify-doc-only
    content: "Review final docs for compliance: no Hebrew rewrites, no question-bank edits, no implementation changes."
    status: pending
isProject: false
---

# Product Quality Phase 8 Plan

## Scope
- Create `docs/product-quality-phase-8-subject-coverage-content-plan.md`.
- Update `docs/product-quality-phase-1-audit.md` with a short Phase 8 reference.
- Use only existing audit outputs and documentation:
  - `reports/question-audit/items.json`
  - `reports/question-audit/findings.json`
  - `reports/question-audit/stage2.json`
  - `docs/product-quality-phase-1-audit.md`
  - `docs/question-bank-professional-qa-plan.md`
  - `docs/product-quality-phase-3-hebrew-owner-review.md`

## Evidence To Include
- Subject totals from latest audit:
  - Math: 3942 rows, grades G1-G6, all sampled generator rows, balanced easy/medium/hard.
  - Geometry: 2548 rows, grades G1-G6, mixed conceptual bank + generator sample.
  - Hebrew: 927 rows, grades G1-G6, static banks, known owner-review duplicate/overlap items.
  - English: 852 rows, grades G1-G6, difficulty now complete, translation metadata fixed.
  - Science: 383 rows, direct bank, broad grade spans and mostly missing `patternFamily` metadata.
  - Homeland / Geography: 3506 rows, grades G1-G6, all static bank rows, balanced topic/difficulty coverage.
- Metadata risks from audit summaries:
  - English has 621 missing `subtype` rows, but difficulty is complete after Phase 1c.
  - Science has 380 missing `patternFamily` rows and 3 missing `subtype` rows.
  - Geometry has 1313 rows missing `subtype` in audit output, mostly generated/sample rows.
  - Hebrew has no missing `difficulty` / `patternFamily` / `subtype`, but known duplicate/overlap owner-review risks.
- Content risks already identified:
  - Hebrew: 2 legacy same-stem triple-level groups + 37 adjacent-band overlaps, with 11 owner-decision units from Phase 3.
  - Math: 5 probe-gated generator kinds not hit by plain sampling; not necessarily broken, but diagnostics coverage needs probe-aware harness if launch diagnostics matter.
  - English: 36 translation `difficulty` gaps fixed; remaining risk is subtype sparsity and answer/distractor review for translation items where `optionCount` is 0 in audit rows.
  - Science: direct bank is broad but metadata taxonomy is weak; factual/distractor review should be prioritized before any content expansion.
  - Geography: strongest by row volume and metadata consistency, but overrepresented broad topics should still get factual/date-sensitive review.

## Document Structure
- Executive summary and phase boundary: final plan before content edits, no bank changes.
- Subject coverage matrix for Math, Geometry, Hebrew, English, Science, Homeland/Geography:
  - active grades
  - topics and subtopics
  - counts by grade/topic/difficulty
  - missing metadata
  - weak / overrepresented / underrepresented coverage
  - duplicate clusters
  - answer-key and distractor-quality risks where detectable from audit fields
- Launch-readiness classification per subject:
  - `ready enough`
  - `needs focused fixes`
  - `needs owner review`
  - `not launch-ready yet`
- Ranked priority list:
  - Critical blockers
  - High-priority fixes
  - Medium improvements
  - Polish later
- First recommended content patch, documentation-only:
  - proposed small batch, likely metadata/review first rather than new question writing
  - for Hebrew: mark `Owner exact wording required`, no alternative Hebrew wording
- Phase 1 cross-link update.

## Proposed Launch-Readiness Direction
- Strongest subject: Homeland / Geography, based on 3506 static rows, G1-G6 coverage, full metadata fields, balanced difficulty.
- Weakest subject: Science, not because of count alone, but because `patternFamily` is mostly missing and direct-bank factual/distractor review is not yet documented.
- Hebrew status: `needs owner review`, not because metadata is missing, but because Phase 3 duplicate/overlap owner decisions are unresolved.
- Math / Geometry status: `ready enough` for generator coverage, with focused diagnostic/probe and subtype documentation improvements.
- English status: `needs focused fixes` or `ready enough with metadata follow-up`; difficulty blocker is closed, subtype/translation answer-mode audit remains.

## Verification
- No commands that regenerate artifacts are needed.
- Use only lightweight read-only summaries already gathered from `items.json`, `findings.json`, and `stage2.json`.
- Final answer will explicitly confirm:
  - no question content changed
  - no Hebrew wording changed
  - no alternative Hebrew wording generated
  - docs-only changes after approval