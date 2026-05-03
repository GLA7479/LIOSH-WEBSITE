---
name: Professional Diagnostic V1
overview: Design and integrate a Professional Diagnostic Framework V1 (Math + Hebrew only) as a structured metadata layer on top of the existing engine, while preserving current engine/release stability and gates.
todos:
  - id: pd-audit
    content: Create framework-audit.md/json mapping current engine fields and explicit gaps
    status: completed
  - id: pd-framework-core
    content: Implement diagnostic-framework-v1 module with Math + Hebrew skills/subskills/error types and rules
    status: completed
  - id: pd-integration
    content: Attach framework metadata and structured findings into diagnostic engine internal outputs without changing parent-facing wording
    status: completed
  - id: pd-qa-command
    content: Add diagnostic-framework QA runner + npm command and assertions
    status: completed
  - id: pd-artifacts
    content: Generate framework-summary.md/json with coverage, integration, and remaining gaps
    status: completed
  - id: pd-verify
    content: Run diagnostic-framework, engine, quick, release, and build commands; capture PASS/FAIL
    status: completed
isProject: false
---

# Professional Diagnostic Framework V1 Plan

## Scope and Guardrails
- Implement only Math + Hebrew in this phase.
- Keep existing UI/Hebrew parent-facing text behavior unchanged.
- Do not rewrite `diagnosticEngineV2`; enrich it conservatively with structured framework metadata.
- Maintain current green baseline for `engine`, `quick`, `release`, and `build`.

## Current-State Audit Deliverables
- Produce a full map of the current pipeline and gaps from:
  - simulator sessions -> aggregate storage -> report maps -> `diagnosticEngineV2` units -> canonical decisions -> detailed report facets.
- Create artifacts:
  - `[reports/learning-simulator/professional-diagnostics/framework-audit.md](reports/learning-simulator/professional-diagnostics/framework-audit.md)`
  - `[reports/learning-simulator/professional-diagnostics/framework-audit.json](reports/learning-simulator/professional-diagnostics/framework-audit.json)`
- Audit must explicitly cover where current logic is mostly accuracy-driven, where evidence/confidence/why are weak, and where topic-vs-subject ambiguity can occur.

## Framework Module (V1)
- Add a new structured framework module at:
  - `[utils/learning-diagnostics/diagnostic-framework-v1.js](utils/learning-diagnostics/diagnostic-framework-v1.js)`
- Define V1 schema for supported subjects with:
  - `subjectId`, `skills`, `subskills`, `errorTypes`
  - `evidenceRules`, `confidenceRules`, `recommendationRules`, `doNotConcludeRules`, `redFlags`
- Implement subject packs only for:
  - Math: arithmetic/fractions/word-problems (+ number sense/place value if mapped)
  - Hebrew: comprehension (and grammar/language only where already supported by existing topics)
- Include explicit non-clinical constraints in framework metadata (teacher/professional discussion phrasing only).

## Conservative Integration Points
- Integrate as enrichment fields, not decision replacement, in this order:
  - Add framework lookup/derivation utilities mapped from existing `subjectId` + `bucketKey` + known taxonomy/topic signals.
  - Attach framework metadata to engine units in:
    - `[utils/diagnostic-engine-v2/run-diagnostic-engine-v2.js](utils/diagnostic-engine-v2/run-diagnostic-engine-v2.js)`
  - Expose structured `why/evidence/confidence/doNotConclude/nextActionType` fields on internal diagnostic objects used by simulator/report assertions.
  - Add safe pass-through to detailed/report facets if available, without changing parent-facing wording behavior.
- Keep canonical action semantics intact (`withhold`, `probe_only`, `diagnose_only`, `intervene`, `maintain`, `expand_cautiously`).

## Structured Explanation + Recommendation Layer
- Add internal finding payload shape (per finding) with:
  - `findingType`, `subjectId`, `topicId`, `skillId`
  - `evidenceLevel`, `confidence`, `basedOn`, `reasoning[]`, `doNotConclude[]`, `nextAction`
- Add recommendation action enum support:
  - `continue_current_level`, `advance_cautiously`, `targeted_practice`, `review_foundation`, `collect_more_data`, `slow_down_and_check`, `teacher_review_recommended`, `professional_review_consideration`
- Ensure thin/no-data behavior blocks strong conclusions.

## QA Command and Assertions
- Add new runner:
  - `[scripts/learning-simulator/run-diagnostic-framework-audit.mjs](scripts/learning-simulator/run-diagnostic-framework-audit.mjs)`
- Add npm command:
  - `qa:learning-simulator:diagnostic-framework`
- Assertions include:
  - Framework completeness for Math/Hebrew skills/subskills/error types
  - Thin-data capped evidence
  - Topic weakness remains topic-level unless broad evidence exists
  - Broad subject weakness requires cross-topic breadth
  - slow-correct not classified weak; fast-wrong treated as strategy/pace signal
  - no-data subjects not failed
  - each finding has `evidenceLevel`, structured `reasoning`, and typed `nextAction`
  - no clinical/medical diagnosis claims in conclusions

## Gate Wiring Strategy
- Phase this safely:
  - First implement command and run manually (must pass).
  - If runtime is stable and low risk, add into orchestrator immediately after `engineTruth`.
  - If not stable, keep manual-first and document clearly in summary.
- Do not weaken existing `engine`/`release` gates.

## Output Artifacts
- Generate:
  - `[reports/learning-simulator/professional-diagnostics/framework-summary.md](reports/learning-simulator/professional-diagnostics/framework-summary.md)`
  - `[reports/learning-simulator/professional-diagnostics/framework-summary.json](reports/learning-simulator/professional-diagnostics/framework-summary.json)`
- Summary includes what was added, Math/Hebrew coverage, integration points, checks status, and deferred next-phase items.

## Verification Sequence
- Run and record results for:
  - `npm run qa:learning-simulator:diagnostic-framework`
  - `npm run qa:learning-simulator:engine`
  - `npm run qa:learning-simulator:quick`
  - `npm run qa:learning-simulator:release`
  - `npm run build`
- Completion requires all PASS and no regression to existing engine truth guarantees.