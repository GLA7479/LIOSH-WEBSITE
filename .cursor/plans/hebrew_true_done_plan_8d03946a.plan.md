---
name: Hebrew True Done Plan
overview: Re-define Hebrew completion around official ministry alignment, closure of critical weak/partial areas, and authentic short task design (excluding audio and long free writing), then verify and freeze again.
todos:
  - id: phase1-official-source
    content: Define and integrate official ministry alignment source schema with traceability metadata for Hebrew mapping.
    status: completed
  - id: phase2-g12-core-closure
    content: Create and execute g1/g2 core subtopic closure queue for weak/misleading coverage and fallback masking reduction.
    status: completed
  - id: phase3-authentic-short-tasks
    content: Design constrained authentic short task patterns for writing/speaking/comprehension without audio or long free writing.
    status: completed
  - id: phase4-blocking-verification
    content: Establish blocking verification bundle (alignment, coverage, product-fit, regression) with explicit thresholds.
    status: completed
  - id: phase5-refreeze
    content: Publish new freeze handoff against the new Done definition with evidence links and residual out-of-scope only.
    status: completed
isProject: false
---

# Hebrew True Done Execution Plan

## A. Current Gap To True Done

- **Official alignment gap**
  - Current canonical matrix is internal-working alignment, not an official ministry-linked source: [data/hebrew-official-alignment-matrix.json](data/hebrew-official-alignment-matrix.json).
  - README explicitly frames it as non-official baseline: [docs/hebrew-alignment-matrix-readme.md](docs/hebrew-alignment-matrix-readme.md).
  - Runtime is still fed from live banks, not ministry-linked source: [utils/hebrew-question-generator.js](utils/hebrew-question-generator.js), [utils/hebrew-rich-question-bank.js](utils/hebrew-rich-question-bank.js).

- **Weak/partial still open (especially g1/g2 core)**
  - Matrix still marks substantial g1/g2 items as `weak` / `partial` / `misleading_due_to_fallback` (not yet closed by new Done definition): [data/hebrew-official-alignment-matrix.json](data/hebrew-official-alignment-matrix.json).
  - Notable g1 grammar risk cluster remains (e.g., `g1.grammar_cloze_deixis`, `g1.grammar_word_order`, `g1.grammar_connectors_time` high fallback risk).
  - g2 writing still has critical weak/misleading flags (`g2.punctuation_choice`, `g2.sentence_wellformed`, `g2.short_paragraph_choice`).

- **Fallback/widening still open**
  - Early-grade widening floor is still active and can mask subtopic precision: [utils/hebrew-g1-subtopic.js](utils/hebrew-g1-subtopic.js), [utils/hebrew-g2-subtopic.js](utils/hebrew-g2-subtopic.js).
  - Coverage audit exists but is not yet tied to hard exit gates for true Done: [scripts/hebrew-subtopic-coverage-audit.mjs](scripts/hebrew-subtopic-coverage-audit.mjs).

- **Pseudo-task gap still open**
  - Layer 3 introduced controlled typing subset, but broader authenticity target (short authentic writing/speaking/comprehension task patterns) is not fully systematized yet.
  - Speaking/comprehension are still heavily MCQ-framed in many paths; authenticity uplift is partial.

## B. New Execution Plan By Phases

### Phase 1 — Official Ministry Alignment

- Build a ministry-linked source pipeline (structured import + mapping) and promote it to canonical alignment source.
- Replace “internal phrasing only” status with traceable official objective references per grade/domain/subtopic.
- Add provenance fields (official doc id, section, extraction date, confidence).

### Phase 2 — Close Critical Weak/Partial Coverage

- Convert matrix findings into a closure queue prioritized by **g1/g2 core domains first**.
- For each queued subtopic: add/repair live bank items until target coverage threshold is met per level/topic.
- Eliminate `misleading_due_to_fallback` in critical g1/g2 domains by increasing true subtopic-resolved inventory.

### Phase 3 — Authentic Task Design (No Audio, No Long Free Writing)

- Introduce short authentic task patterns for writing/speaking/comprehension using existing UI surfaces.
- Keep responses constrained (single word, short sentence, targeted correction, micro-completion).
- Standardize grading contracts (`acceptedAnswers`, normalization policy, bounded ambiguity).

### Phase 4 — Full Verification Gate

- Run matrix-to-runtime consistency audit, subtopic coverage audit, and g1/g2 product-fit verification as blocking checks.
- Add explicit pass/fail gates for:
  - official objective traceability,
  - no critical weak/misleading in in-scope g1/g2 core,
  - no unauthorized typing expansion,
  - no regression in existing runtime behavior.

### Phase 5 — Freeze (New)

- Publish a new handoff/freeze doc tied to the new Done definition.
- Record exact passed checks, unresolved items (only out-of-scope), and non-regression attestations.
- Require explicit approval before reopening Hebrew runtime areas.

## C. Exact Scope By Grade And Domain

### g1–g2 must-close scope (priority order)

- **Priority 1 (must close first)**
  - `reading`, `comprehension`, `writing`, `grammar` core subtopics with current weak/high-risk fallback markers.
  - Remove critical `misleading_due_to_fallback` where user can be routed to non-representative pools.
  - Ensure authentic short task designs are present in writing/comprehension/speaking paths (without audio/free-writing).

- **Priority 2 (close immediately after P1)**
  - `vocabulary` and remaining g1/g2 subtopics still marked partial where pedagogically core.
  - Balance task-type variety to reduce pseudo-task concentration while preserving constraints.

### g3–g6 scope in this plan

- Keep in-scope for alignment consistency and non-regression.
- Primary objective: do not degrade while g1/g2 closure is executed.
- Secondary objective: adopt official-source traceability fields uniformly.

### Outside scope (only explicit exclusions)

- audio
- long free writing

## D. Exact Not In Scope

- **Audio-based tasks and grading**.
- **Long-form free writing** (paragraph-length open responses and beyond).

Everything else remains in scope and cannot be deferred by default.

## E. Exit Criteria Per Phase

### Phase 1 exit

- **Done when**
  - Official-source dataset exists with traceable references per mapped subtopic.
  - Matrix references official source metadata, not only internal phrasing.
- **Verify by**
  - Schema/consistency checks + spot audit across g1/g2 domains.
- **Must not break**
  - Runtime generation paths and existing topic routing.

### Phase 2 exit

- **Done when**
  - No critical g1/g2 core subtopic remains `weak` or `misleading_due_to_fallback`.
  - Coverage floor and per-level availability targets are met for critical domains.
- **Verify by**
  - Coverage audit with hard thresholds and failure on violations.
- **Must not break**
  - UI contracts, parent-report data flow, curriculum page behavior.

### Phase 3 exit

- **Done when**
  - Each in-scope g1/g2 core domain has at least one authentic short task pattern beyond pure pseudo-MCQ framing.
  - Grading is deterministic enough (`acceptedAnswers`/normalization defined, ambiguity controlled).
- **Verify by**
  - Task-shape audit + sample generation review per subtopic + targeted e2e product-fit checks.
- **Must not break**
  - Existing answer-mode safety boundaries and approved constraints.

### Phase 4 exit

- **Done when**
  - All verification suites pass as blockers (alignment, coverage, product-fit, regression).
- **Verify by**
  - CI-style audit bundle with explicit pass/fail report artifact.
- **Must not break**
  - Any non-Hebrew runtime paths, UI, parent report, curriculum.

### Phase 5 exit

- **Done when**
  - New freeze doc states achieved Done criteria and residual out-of-scope list (only audio + long free writing).
- **Verify by**
  - Final checklist sign-off with links to audit outputs.
- **Must not break**
  - No post-freeze silent scope expansion without new approval.

## F. Recommended First Implementation Pass

- **Start with Phase 1 + Phase 2 scaffolding together**:
  - implement official-source traceability schema and ingestion baseline,
  - immediately wire it into a g1/g2 critical-subtopic closure queue,
  - and attach hard coverage/fallback gates from day one.

This gives a measurable spine for all subsequent authenticity work and prevents repeating “partial alignment / partial closure” loops.