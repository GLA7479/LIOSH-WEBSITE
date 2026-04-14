# Decision Contract v1

**Purpose:** Define when the engine may assert what, at which analysis level (`row` | `topic` | `subject` | `overall`), and at which confidence tier.  
**Implementation reference (code today):** `utils/parent-report-row-diagnostics.js`, `utils/parent-report-diagnostic-restraint.js`, `utils/parent-report-decision-gates.js`, `utils/topic-next-step-config.js`, `utils/detailed-parent-report.js`, `utils/learning-patterns-analysis.js`, `utils/diagnostic-engine-v2/*`.

---

## 1. Definitions

### 1.1 Data units by level

| Level | Primary unit | Notes |
|-------|----------------|-------|
| **Row** | One report row (`topicRowKey` + metrics: `questions`, `correct`/`wrong`, `accuracy`, mistake aggregates, `lastSessionMs`, optional `trend`, `behaviorProfile`) | Math may be grade/level/mode-scoped row keys. |
| **Topic** | Same as row in this codebase — “topic” recommendations are built **per row** (`buildTopicRecommendationsForSubject`). Contract treats **topic display** as the parent-facing view of that row. |
| **Subject** | Aggregation across rows in one subject (`patternDiagnostics.subjects[sid]`, topic maps, phase fields on subject profile). |
| **Overall / report-wide** | Executive summary + cross-subject fields derived from all subjects (`buildExecutiveSummary`, `buildCrossSubjectPhase7Fields`, etc.). |

### 1.2 Confidence tiers (contract vocabulary)

Maps to existing signals; exact enums vary by layer.

| Tier | Meaning |
|------|---------|
| **E0 — Insufficient** | Not enough volume or contradictory / withheld. |
| **E1 — Early / weak signal** | Minimum volume for hints only; no stable diagnosis. |
| **E2 — Cautious** | Medium evidence or partial recurrence; conditional wording only. |
| **E3 — Stable** | Strong row evidence + volume + stability thresholds met. |
| **E4 — High** | E3 plus recurrence / gates / freshness where applicable; rare at subject/overall. |

---

## 2. Row-level contract (canonical)

### 2.1 Inputs

- `q` = `questions`
- `wrong`, `wrongRatio`, `mistakeEventCount` (resolved per row)
- `stability01`, `confidence01`, `recencyScore`
- `evidenceStrength` ∈ {`strong`,`medium`,`low`}
- `dataSufficiencyLevel` ∈ {`strong`,`medium`,`low`} (+ internal `thin`/`weak` strings where referenced in confidence policy)
- `isStablePattern`, `isEarlySignalOnly`
- `conclusionStrength` ∈ {`strong`,`moderate`,`tentative`,`withheld`} from diagnostic restraint
- `behaviorProfile.dominantType`, `trend` (optional)

### 2.2 Volume gates (aligned to code)

| Condition | Sufficiency | `suppressAggressiveStep` |
|-------------|---------------|---------------------------|
| `q <= 0` | low | yes |
| `q < 4` | low | yes |
| `q < 8` OR `evidenceStrength === "low"` OR `confidence01 < 0.22` | medium | yes |
| `evidenceStrength === "strong"` && `q >= 12` | strong | no |
| else | medium | if low evidence |

**Stable pattern (code):** `evidenceStrength === "strong"` && `q >= 14` && `stability01 >= 0.45` && `confidence01 >= 0.35`.

**Evidence strength (code):** composite score with `q` tiers (5/10/18), stability, confidence, recency, wrongRatio; `strong` requires `score >= 0.62 && q >= 8`; `medium` requires `score >= 0.38 && q >= 4`.

### 2.3 Topic-step thresholds (`DEFAULT_TOPIC_NEXT_STEP_CONFIG`)

| Action | Min `q` (code) |
|--------|----------------|
| Low-confidence floor | 7 |
| Step change (aggressive) | 14 |
| Advance level | 18 |
| Advance grade | 22 |
| Remediate band | 10 |

Aggressive steps must respect `suppressAggressiveStep` from sufficiency.

### 2.4 Diagnostic restraint → `conclusionStrength` (code)

- `q < 4` → insufficient path → often `withheld`
- `q < 8` → weak volume
- Low `evidenceStrength` or `dataSufficiencyLevel` weakens level and band
- Special cases: speed vs gap, hint dependence with high accuracy, fragile / knowledge_gap without support → downgrade to `tentative` / `weak`

---

## 3. Topic-level contract

**Rule:** Topic inherits **row** contract; parent-facing “topic” strings must not exceed the **minimum** of:

- row evidence tier,
- gate readiness (see `gate-to-text-binding-v1.md` once approved),
- language band (see `language-permission-matrix-v1.md`).

**Recommendation step** must not contradict `suppressAggressiveStep` (cap to `maintain_and_strengthen` when suppressed).

---

## 4. Subject-level contract

### 4.1 Current code signals (must be documented honestly)

- `subjectConclusionReadiness` from `learning-patterns-analysis.js`: derived from fraction of rows with `withheld` / `tentative` `conclusionStrength` among analyzed rows (`wFrac`, `tFrac` thresholds ~0.38 / 0.45).
- Cross-subject Phase 7: `crossSubjectConclusionReadiness` from counts of per-subject `not_ready` / `partial` (`detailed-parent-report.js`).
- V2-only subject path (`buildSubjectProfilesFromV2`): readiness `partial` if any unit `cannotConcludeYet`.

### 4.2 Contract requirements (target enforcement — v1 policy intent)

Subject-level **ready** MUST NOT be used in parent copy unless **all** hold:

1. **Breadth:** At least **N** distinct active rows (contract default **N = 2**) with `q >= 8` each, **or** one row with `q >= 14` and `evidenceStrength >= medium` if single-topic subject is explicitly allowed by product.
2. **Depth:** No more than **38%** of weighted rows in `withheld` (aligns to existing `wFrac` spirit); tentative + withheld combined not dominant without `partial` readiness label on executive copy.
3. **Freshness:** Not stale per Phase 10 rules when subject-level “decision” language appears (see readiness policy doc).

Until code is updated, any implementation must **surface** `partial` / `not_ready` in UI when breadth fails even if internal field says `ready` — tracked in execution bundle.

---

## 5. Overall / report-wide contract

### 5.1 Current signals

- `crossSubjectConclusionReadiness` ∈ {`ready`,`partial`,`not_ready`} from Phase 7 aggregation.
- `overallConfidenceHe`, `reportReadinessHe`, `cautionNoteHe`, `mainHomeRecommendationHe`.
- `subjectCoverage`: per-subject `questionCount`; low-volume count uses `questionCount < 12` in `buildOverallConfidenceHe`.

### 5.2 Contract rules (v1)

| Overall assertion type | Allowed if |
|-------------------------|------------|
| “Balanced / confident across subjects” | `crossSubjectConclusionReadiness === "ready"` AND at least **2** subjects with `questionCount >= 12` AND unevenness rule in `buildOverallConfidenceHe` not triggered OR explicitly qualified in text. |
| Strong home plan / priority ladder | All subjects that ladder references meet subject **E2+** for referenced rows. |
| Dominant cross-subject root cause label | `dominantCrossSubjectRootCause` not `insufficient_evidence` OR label must include “חלקי / מוקדם” per language matrix. |

---

## 6. Conclusion-type matrix (summary)

Columns: **Earliest tier allowed** for a *parent-facing factual claim* of that type.

| Conclusion type | Row | Topic | Subject | Overall |
|-----------------|-----|-------|---------|---------|
| Strength (mastery) | E2 | E2 | E3 | E4 |
| Weakness | E1 | E2 | E2 | E2 |
| Persistent difficulty | E2 | E3 | E3 | E4 |
| Instability | E1 | E2 | E2 | E2 |
| Improvement | E1 | E2 | E3 | E3 |
| Deterioration | E1 | E2 | E3 | E3 |
| Mistake pattern | E1 | E2 | E3 | E3 |
| Speed vs accuracy | E2 | E2 | E3 | E3 |
| More practice needed | E0 | E0 | E0 | E0 |
| Support need | E1 | E2 | E2 | E2 |
| Advance / readiness to promote | E3 | E3 | E4 | E4 |
| Subject difficulty | E2 | — | E2 | E3 |
| Overall conclusion | — | — | — | E3 |

**Disallowed before E2 at row/topic:** stable/final root-cause claims, “יציב”, “סגור”, “בטוח”, promotion narratives.

---

## 7. Explicit blockers (approval stop)

Document fails review if:

1. Any tier allows decisive language below its definition.
2. Subject `ready` is described without breadth/depth minima.
3. Overall `ready` without multi-subject coverage definition.
4. Topic contract contradicts `suppressAggressiveStep` or gate binding.

---

## 8. Sign-off

- [ ] Row thresholds match `parent-report-row-diagnostics.js`  
- [ ] Topic step mins match `topic-next-step-config.js`  
- [ ] Subject/overall current vs target behavior distinguished  
- [ ] **Approved by:** _________________ **Date:** _________________
