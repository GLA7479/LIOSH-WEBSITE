---
name: AI Hybrid Review Complete
overview: Implement internal inspection surfaces and review tooling for AI-hybrid outputs, while keeping the parent-facing report unchanged and validating with full test/build rerun.
todos:
  - id: internal-reviewer-surfacing
    content: Implement internal-only readable hybridRuntime reviewer panel in detailed report flow.
    status: completed
  - id: review-case-export
    content: Add single-case review/export tooling that compares V2 vs hybrid decisions and disagreements.
    status: completed
  - id: shadow-summary
    content: Implement local shadow summary aggregation and surface it in reviewer outputs.
    status: completed
  - id: reviewer-usage-doc
    content: Add short reviewer usage guide for field meaning and review criteria.
    status: completed
  - id: verification-run
    content: Run required test/build commands and prepare exact A-G result report.
    status: completed
isProject: false
---

# AI-Hybrid Review-Complete Implementation Plan

## Goal
Deliver a review-focused internal inspection path for `hybridRuntime` inside the product/repo: readable per-unit reviewer surfacing, single-case comparison/export, shadow summary, and a concise reviewer usage guide, then re-run required verification commands.

## Scope and non-goals
- Keep normal parent-facing report behavior unchanged.
- Add reviewer surfaces behind explicit internal gating (not shown by default).
- Add concrete code tooling (UI + export path + summary), not closure/scope-only documentation.

## Implementation steps

1. Add internal reviewer surfacing (readable per-unit view)
- Extend the detailed report page flow in [pages/learning/parent-report-detailed.js](c:/Users/ERAN%20YOSEF/Desktop/final%20projects/FINAL-WEB/LIOSH-WEB-TRY/pages/learning/parent-report-detailed.js) with an internal-only panel (e.g., gated by explicit query/local toggle).
- Introduce a focused renderer component (new file under `components/`) that formats each unit into clear sections (not raw JSON):
  - `v2AuthoritySnapshot`
  - `aiAssist.mode`
  - `suppressionFlags`
  - top hypothesis
  - disagreement vs V2
  - suggested probe
  - explanation text/status
  - validator status
- Ensure panel is screen-only/internal and does not alter current parent narrative blocks.

2. Add single-case review/export tooling
- Add a reusable formatter/selector helper under `utils/ai-hybrid-diagnostic/` to build a compact review record per unit/case from `hybridRuntime` + V2 context.
- Add a script under `scripts/` to output one reviewable case in a clean structure (human-readable + machine-parseable), including:
  - V2 decision
  - hybrid decision
  - disagreement details
  - generated explanation
  - suggested probe
- Keep export path local/repo-only (no deploy/push behavior).

3. Add local shadow summary
- Add a summary utility in `utils/ai-hybrid-diagnostic/` (or extend existing module) that computes:
  - total units
  - counts by `assist` / `rank_only` / `explain_only` / `suppressed`
  - disagreement total
  - disagreement severity split
- Surface this summary in the internal reviewer panel and expose it in the export script output.

4. Add reviewer usage doc (short, practical)
- Create a concise reviewer guide in `docs/` (new file) describing:
  - meaning of each field
  - what to check during review
  - good vs bad vs suspicious patterns
  - correct case review workflow
- Keep it operational and reviewer-facing; avoid closure-paperwork framing.

5. Verify end-to-end
- Run required commands in sequence:
  - `npm run test:diagnostic-engine-v2-harness`
  - `npm run test:ai-hybrid-harness`
  - `npm run test:parent-report-phase6`
  - `npm run build`
- Capture exact pass/fail outputs and final changed-file list for report-back in the requested A→G format.