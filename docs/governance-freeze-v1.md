# Governance Freeze v1

**Status:** Policy artifact — implementation follows only after explicit product approval.  
**Related:** Parent Report Decision-Contract Master Plan (do not edit that plan file from implementation work).

---

## 1. Immutable assumptions (locked)

| Assumption | Rule |
|------------|------|
| PDF / print | **Out of scope** for this workstream. Treated as verified; no reopening without a **new** regression proven from current code or generated output evidence. |
| Execution order | **Policy and artifacts first**, then code. No production code changes until `execution-readiness-bundle-v1.md` is satisfied and product owner gives green light. |
| Plan file | The Cursor plan file for the master plan is **not** modified as part of “implementing” this bundle; only the artifacts listed in the plan are created/updated here. |

---

## 2. Scope boundaries

### In scope

- Decision contract alignment across `row` → `topic` → `subject` → `overall`.
- Evidence bands, language permission matrix, gate-to-text binding.
- Subject/overall readiness rules (anti-inflation).
- Recommendation intensity caps tied to evidence/gates.
- Validation / scenario proof rubric and execution readiness bundle.

### Explicitly out of scope (unless re-approved)

- UI redesign or layout refactors.
- Broad Hebrew copy rewrite not driven by approved policy tables.
- Architectural refactor of the report pipeline unrelated to contract enforcement.
- Replacing core heuristics outside the approved contract documents.
- PDF QA reopening without proven regression.

---

## 3. Authority and checkpoints

| Checkpoint | Artifact | Blocks |
|------------|----------|--------|
| P0 | `governance-freeze-v1.md` (this file) | Phase 1 |
| P1 | `decision-contract-v1.md` | Phases 2–3 |
| P2 | `evidence-band-dictionary-v1.md` + `language-permission-matrix-v1.md` | Narrative-bound implementation |
| P3 | `gate-to-text-binding-v1.md` | Phases 4–5 |
| P4 | `subject-overall-readiness-policy-v1.md` | Subject/overall aggregation changes |
| P5 | `recommendation-intensity-contract-v1.md` | Phase 6 lock |
| P6 | `execution-readiness-bundle-v1.md` | Any coding |

**Approval definition:** Product owner explicitly marks the artifact version as approved (e.g. in PR description, release notes, or internal sign-off doc).

**Rework:** Any blocker from the master plan’s “Explicit Blocker List” in an artifact review sends the phase back until resolved.

---

## 4. No silent scope expansion

The following require a **new** explicit approval if proposed mid-execution:

- UI redesign.
- Copy changes beyond what the approved language matrix and gate binding allow.
- Refactors that move logic across packages without mapping to contract phases.
- Changing numeric thresholds globally without updating `decision-contract-v1.md` and dependents.
- Reopening PDF scope.

---

## 5. Document map (artifacts)

| Phase | File |
|-------|------|
| 0 | `docs/governance-freeze-v1.md` |
| 1 | `docs/decision-contract-v1.md` |
| 2 | `docs/evidence-band-dictionary-v1.md`, `docs/language-permission-matrix-v1.md` |
| 3 | `docs/gate-to-text-binding-v1.md` |
| 4 | `docs/subject-overall-readiness-policy-v1.md` |
| 5 | `docs/recommendation-intensity-contract-v1.md` |
| 6 | `docs/execution-readiness-bundle-v1.md` |

---

## 6. Sign-off (template)

- [ ] Assumptions read and accepted  
- [ ] Out-of-scope list accepted  
- [ ] Checkpoint order accepted  
- [ ] **Approved by:** _________________ **Date:** _________________
