# Subject / Overall Readiness Policy v1

Eliminates **readiness inflation**: internal flags or heuristics must not surface as “מוכן” to parents unless **contract minima** are met.

**Current code references:**  
`utils/learning-patterns-analysis.js` (`subjectConclusionReadiness` from `wFrac`/`tFrac`),  
`utils/detailed-parent-report.js` (`buildCrossSubjectPhase7Fields`, `crossSubjectConclusionReadiness`, `subjectQuestionTotal`, `buildOverallConfidenceHe`).

---

## 1. Subject readiness (`subjectConclusionReadiness`)

### 1.1 Contract labels (parent-facing canonical)

| Label | Meaning |
|-------|---------|
| `not_ready` | Insufficient breadth/depth OR too many withheld rows. |
| `partial` | Some signal, mixed rows, or DEv2 `cannotConcludeYet` on any surfaced unit. |
| `ready` | All **mandatory minima** satisfied (below). |

### 1.2 Mandatory minima for **`ready`**

All must be true:

1. **Breadth:** At least **2** distinct rows with `questions >= 8`, OR **1** row with `questions >= 14` **and** `evidenceStrength !== "low"` (single-topic subject exception — product may disable).
2. **Withheld ceiling:** Fraction of rows with `conclusionStrength === "withheld"` **< 0.38** (aligns with current `wFrac` spirit in `learning-patterns-analysis.js`).
3. **Tentative + withheld:** Combined fraction **< 0.45** OR executive copy must show `partial` (not `ready`).
4. **Freshness:** If `freshnessState` / `conclusionFreshness` indicates stale/expired on **>50%** of weighted question volume, max label = `partial`.
5. **DEv2 path:** If any surfaced V2 unit has `outputGating.cannotConcludeYet`, subject display label **must not** read as fully ready without “חלקי מהמנוע” qualifier (implementation: force `partial` for parent copy).

### 1.3 Mapping from current code (migration note)

Until code is patched, implementers must:

- Compute a **`displayReadiness`** for UI from min(currentReadiness, contractReadiness).
- Log deviation when `displayReadiness < internalReadiness` for QA.

---

## 2. Overall / cross-subject readiness

### 2.1 `crossSubjectConclusionReadiness`

Current logic counts per-subject `subjectConclusionReadiness` (`not_ready` / `partial`). **Contract overlay:**

| Desired parent meaning | Minimum |
|--------------------------|---------|
| `ready` | At least **2** subjects each with `questionCount >= 12` (from `subjectCoverage`), AND `crossSubjectConclusionReadiness === "ready"` from Phase 7, AND `buildOverallConfidenceHe` unevenness qualifier not required OR explicitly appended to summary. |
| `partial` | Default when in doubt. |
| `not_ready` | Phase 7 not_ready OR fewer than 2 active subjects OR dominant subject has `< 12` questions. |

### 2.2 Overall confidence copy

`overallConfidenceHe` must stay in **PS1–PS2** unless overall `ready` per above; never PS3 for multi-subject summaries in v1.

### 2.3 Dominant root cause / risk labels

If `dominantCrossSubjectRootCause === "insufficient_evidence"` (or equivalent), cross-subject **diagnostic** lines use **PS0–PS1** only.

---

## 3. Explicit blockers

- Showing Hebrew equivalent of “המקצוע במצב מוכן” when breadth minima fail.
- `crossSubjectConclusionReadiness` displayed as fully ready with only one active subject above noise threshold.
- Hiding `partial` when DEv2 `cannotConcludeYet` is true for displayed units.

---

## 4. Sign-off

- [ ] Subject minima accepted  
- [ ] Overall coverage rules accepted  
- [ ] **Approved by:** _________________ **Date:** _________________
