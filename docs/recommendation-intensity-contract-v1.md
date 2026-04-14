# Recommendation Intensity Contract v1

Caps **how strong an action** the engine may recommend, tied to evidence band + gates + sufficiency.

**Code references:** `utils/topic-next-step-engine.js` (`decideTopicNextStep`, `applyAggressiveEvidenceCap`), `utils/topic-next-step-config.js`, `utils/parent-report-row-diagnostics.js` (`suppressAggressiveStep`), `utils/diagnostic-engine-v2/output-gating.js`.

---

## 1. Intensity levels (RI0–RI3)

| Level | Description |
|-------|-------------|
| **RI0** | Observe / collect only — no level/grade change, no heavy remediation imperative. |
| **RI1** | Light guided practice — short sessions, no structural change. |
| **RI2** | Focused remediation at same level — explicit skill loop, still no grade jump. |
| **RI3** | Structural change — advance level/grade, drop level/grade, or equivalent strong pivot. |

---

## 2. Allowed intensity by evidence band

| Evidence band | Max RI | Notes |
|---------------|--------|-------|
| E0 | RI0 | |
| E1 | RI0–RI1 | |
| E2 | RI2 | No RI3 unless gates + q mins satisfied |
| E3 | RI3 | Still respect `suppressAggressiveStep` |
| E4 | RI3 | Same as E3 unless policy adds extra human review flag |

---

## 3. Hard blocks (must match code behavior today + contract)

1. If `suppressAggressiveStep === true` → **max RI1** for steps that would be `advance_*` or `drop_*` (cap to `maintain_and_strengthen` per `applyAggressiveEvidenceCap`).
2. If `q < minQuestionsStepChange` (14) → **no RI3** step changes.
3. If `q < minQuestionsAdvanceLevel` (18) → **no** `advance_level`.
4. If `q < minQuestionsAdvanceGrade` (22) → **no** `advance_grade_topic_only`.
5. If DEv2 `interventionAllowed === false` → topic narrative must not imply intensive intervention (RI2+) for that unit.

---

## 4. Gate coupling

| Gate condition | Max RI |
|----------------|--------|
| `weak` in `buildDecisionGatesPhase13` | RI1 |
| `gates_not_ready` | RI2 for remediate-only; RI3 **blocked** |
| `releaseGate` forming + `gateReadiness >= moderate` | RI2 default; RI3 only for advance if `advanceGate` forming and not blocked |

---

## 5. Anti-generic rule (contract)

Any RI ≥ **RI2** line must include **at least one** of:

- concrete count from data (`N` questions, `M` mistakes), OR  
- named topic display string, OR  
- explicit “למה עכשיו” tied to `riskFlags` / `dominantMistakePattern` / `rootCause`.

Otherwise downgrade to **RI1** wording.

---

## 6. Explicit blockers

- RI3 when `dataSufficiencyLevel !== "strong"` or `suppressAggressiveStep`.
- RI3 promotional parent text when `gateReadiness === insufficient`.

---

## 7. Sign-off

- [ ] Intensity table accepted  
- [ ] Gate coupling accepted  
- [ ] **Approved by:** _________________ **Date:** _________________
