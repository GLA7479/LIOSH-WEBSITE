# Execution Readiness Bundle v1

Single **go / no-go** package before any implementation PR that touches parent-report decisioning or copy.

---

## 1. Required approved artifacts (checklist)

| # | Artifact | Path |
|---|----------|------|
| 1 | Governance freeze | [governance-freeze-v1.md](governance-freeze-v1.md) |
| 2 | Decision contract | [decision-contract-v1.md](decision-contract-v1.md) |
| 3 | Evidence band dictionary | [evidence-band-dictionary-v1.md](evidence-band-dictionary-v1.md) |
| 4 | Language permission matrix | [language-permission-matrix-v1.md](language-permission-matrix-v1.md) |
| 5 | Gate-to-text binding | [gate-to-text-binding-v1.md](gate-to-text-binding-v1.md) |
| 6 | Subject/overall readiness | [subject-overall-readiness-policy-v1.md](subject-overall-readiness-policy-v1.md) |
| 7 | Recommendation intensity | [recommendation-intensity-contract-v1.md](recommendation-intensity-contract-v1.md) |
| 8 | This bundle | [execution-readiness-bundle-v1.md](execution-readiness-bundle-v1.md) |

Each document must have **sign-off** section completed (name + date) before green light.

---

## 2. Scenario proof matrix (minimum set)

Run outputs via `buildDetailedParentReportFromBaseReport` / fixtures in `tests/fixtures/parent-report-pipeline.mjs` (or equivalent harness). For each scenario, fill **verdict** column using rubric §3.

| ID | Scenario | Focus |
|----|----------|--------|
| S1 | `all_sparse` | E0 overall + subject |
| S2 | `one_dominant_subject` | topic strong vs gate mismatch risk |
| S3 | `mixed_signals_cross_subjects` | uneven subjects |
| S4 | `recent_transition_recent_difficulty_increase` | transition risk copy |
| S5 | `high_risk_despite_strengths` | false promotion / hint |
| S6 | `stable_excellence` | advance + gates |
| S7 | `fragile_success` | RI cap + PS cap |
| S8 | `knowledge_gap` | remediation language |
| S9 | `speed_only_weakness` | speed vs gap |
| S10 | `positive_trend_weak_independence` | improvement vs independence |
| S11 | `phase7_cross_subject_sparse_mixed` | overall partial |
| S12 | `strong_executive_case` | V2 executive path completeness |

**Optional:** extend with `grade_level_mismatch_math`, `no_exec_richness`.

---

## 3. Verdict rubric (pass / fail)

| Verdict | Definition |
|---------|------------|
| **valid** | Evidence band, gate cap, and language PS align. |
| **weak_ok** | Conservative; may be verbose but not overstated. |
| **fail_overstated** | PS or RI exceeds contract for actual signals. |
| **fail_unsupported** | Claim not traceable to payload fields. |
| **fail_generic** | RI≥2 without concrete anchor (anti-generic rule). |
| **fail_too_early** | E0–E1 band but decisive / stable wording. |
| **fail_gate_text** | Gate-to-text binding violation. |

**Pass criteria for implementation start:**

- Zero **fail_*** in S1–S12 after implementation (baseline: document known fails in PR until fixed).
- All artifacts signed.

**Baseline expectation:** Some scenarios may currently fail `fail_gate_text` or `fail_overstated`; first implementation PR must attach table “before → after”.

---

## 4. Regression commands (existing repo scripts)

```bash
npm run test:parent-report-phase1
npm run test:topic-next-step-phase2
npm run test:parent-report-phase6
```

CI: [.github/workflows/parent-report-tests.yml](../.github/workflows/parent-report-tests.yml)

---

## 5. Explicit blockers (no merge without resolution)

- Stable/final wording under partial / early evidence.
- Subject `ready` without subject-overall-readiness minima.
- Overall “ready” narrative without multi-subject coverage.
- RI above allowed band.
- Gate/text mismatch.

---

## 6. No silent scope expansion (execution)

Same as governance doc: no UI redesign, broad unapproved copy, refactor, heuristic rewrites outside these artifacts, PDF reopening without proven regression.

---

## 7. Green light (product)

**Execution approved:** ☐ Yes ☐ No  

**Approver:** __________________ **Date:** __________________  

**Notes / scope of first PR:** _______________________________________________

---

## 8. Engineering note

The todos **issue-green-light** is satisfied when this section is **filled by the product owner**. Until then, implementation PRs should remain in draft or use a feature flag if the team uses one.
