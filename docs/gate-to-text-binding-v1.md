# Gate-to-Text Binding v1

Ensures **parent-facing narrative never exceeds** gate and readiness signals.  
**Code reference:** `utils/parent-report-decision-gates.js` (`buildDecisionGatesPhase13`), topic record fields `gateState`, `gateReadiness`, `decisionGates.*`, row `conclusionStrength`, `dataSufficiencyLevel`, `evidenceStrength`.

---

## 1. Inputs (per topic row / recommendation record)

| Field | Role |
|-------|------|
| `gateState` | e.g. `gates_not_ready`, `continue_gate_active`, `release_gate_forming`, … |
| `gateReadiness` | `insufficient` \| `low` \| `moderate` \| `high` |
| `releaseGate`, `advanceGate`, `pivotGate`, `recheckGate` | levels `off` \| `pending` \| `forming` \| `blocked` |
| `conclusionStrength` | `withheld` \| `tentative` \| `moderate` \| `strong` |
| `dataSufficiencyLevel`, `evidenceStrength` | volume / quality |
| `weak` (internal to gates) | `q < 12` OR `evidenceStrength === "low"` OR `conclusionStrength` in `withheld` \| `tentative` |

---

## 2. Phrasing cap (`maxPS`)

Map to `language-permission-matrix-v1.md` **PS0–PS3**.

### 2.1 Base cap from `gateReadiness`

| gateReadiness | maxPS |
|---------------|-------|
| `insufficient` | PS1 |
| `low` | PS2 |
| `moderate` | PS2 |
| `high` | PS3 |

### 2.2 Downgrade rules (apply in order)

1. If `gateState === "gates_not_ready"` → **maxPS = min(maxPS, PS2)**.
2. If `weak === true` (gate module definition) → **maxPS = min(maxPS, PS1)**.
3. If `releaseGate` / `advanceGate` not in (`forming`,`pending`) AND narrative mentions שחרור / קידום / קפיצה → **maxPS = min(maxPS, PS1)** unless `gateReadiness >= moderate` and not `gates_not_ready`.
4. If `conclusionStrength === "tentative"` or `withheld` → **maxPS = min(maxPS, PS1)** for diagnosis lines; **PS2** allowed for generic “תרגול קצר” support lines only.

### 2.3 Final effective cap

`effectiveMaxPS = min(maxPS from gates, maxPS from evidence band per evidence-band-dictionary, DEv2 cap if present)`

---

## 3. Content-class binding

| Content class | Additional rule |
|---------------|-----------------|
| `whyThisRecommendationHe` | Must obey `effectiveMaxPS`; if `gateState === gates_not_ready`, **forbid** PS3 promotional clauses. |
| `recommendedParentActionHe` | Same; if `suppressAggressiveStep`, forbid imperative advance/drop language. |
| `interventionPlanHe` / `doNowHe` | If `weak`, only PS0–PS1 intensity for “חובה” wording. |
| Executive cross-subject lines | `min(gateReadiness across subjects referenced)` applies. |

---

## 4. Precedence when signals conflict

Order (first wins for **stricter** cap):

1. `cannotConcludeYet` (DEv2) → PS0–PS1 for diagnosis  
2. `weak` gate flag  
3. `conclusionStrength` withheld/tentative  
4. `dataSufficiencyLevel` / `evidenceStrength`  
5. `gateReadiness` / `gateState`  
6. Evidence band E-tier  

---

## 5. Explicit blockers

- Any **PS3** text while `gateReadiness === insufficient` OR `gates_not_ready` with `weak`.
- Any “שחרור / עצמאות מלאה / קפיצת כיתה” narrative when corresponding gate is `off` or `blocked`.

---

## 6. Sign-off

- [ ] Downgrade rules accepted  
- [ ] Precedence order accepted  
- [ ] **Approved by:** _________________ **Date:** _________________
