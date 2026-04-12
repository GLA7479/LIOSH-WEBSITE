# Parent Report — QA / Calibration / Red-Team (Phase X)

Engineering record for trustworthiness review **without** a new engine depth phase. Companion: [`PARENT_REPORT_ENGINE.md`](./PARENT_REPORT_ENGINE.md), [`PARENT_REPORT.md`](./PARENT_REPORT.md).

---

## 1. Review dataset (synthetic scenarios)

| # | Scenario group | Fixture / construction | Conservative expectation | Parent priority | Overclaim risk | Tone |
|---|----------------|--------------------------|---------------------------|-----------------|----------------|------|
| 1 | Sparse data | `PARENT_REPORT_SCENARIOS.all_sparse` | Withhold strong conclusions | Monitor | High if assert mastery | Cautious |
| 2 | One dominant weak topic | `one_dominant_subject` | Local math focus | Stabilize / practice | Medium | Direct |
| 3 | Stable excellence | `stable_excellence` | Maintain, low drama | Maintain | Low | Calm |
| 4 | Fragile success | `fragile_success` | Not mastery; hints | Reduce hint reliance | **High** false promotion | Firm but calm |
| 5 | Knowledge gap | `knowledge_gap` | Remediate, not advance | Core remediation | Medium | Clear |
| 6 | Careless pattern | `careless_pattern` | Local habit | Targeted practice | Low | Practical |
| 7 | Instruction friction | `instruction_friction` | Load + clarity | Simplify task | Medium | Supportive |
| 8 | Speed-only | `speed_only_weakness` | **Stay local** (Phase 14) | Pace, not foundation | **High** if called foundational | Neutral |
| 9 | Positive acc / weak indep | `positive_trend_weak_independence` | **Not** release-ready | Independence probe | **High** if release language | Measured |
|10 | Cross-subject mixed | `mixed_signals_cross_subjects` | Split story by subject | Math maintain / geo act | Medium | Balanced |
|11 | High risk despite accuracy | `high_risk_despite_strengths` | Chips + restraint | Do not over-trust score | **High** | Explicit risks |
|12 | No exec richness | `no_exec_richness` | Short exec, no invention | Minimal | Low | Sparse OK |
|13 | Strong exec | `strong_executive_case` | Cross-subject ladder | Top 1–2 actions | Medium | Professional |
|14 | Legacy JSON diagnostics | `legacy_json_pattern_diagnostics` | Degrade safely | From payload | Medium | Compatible |
|15 | Gates weak | `runPhase13` baseWeak | Gates not ready | Evidence | Low | Technical-safe |
|16 | Gates pivot | `gPivot` | Pivot visible | Change tack | Medium | Decisive |
|17 | Release path healthy | `gReleaseForming` (engine ctx) | Release track **only** if independence + q + !stale | Controlled release | **High** if wrong | **Calibrated in code** |
|18 | Recheck stale | `gRecheck` | Recheck not pivot | Refresh observation | Low | Calm |
|19 | Phase 14 speed | `buildFoundationDependencyPhase14(speedCtx)` | Local | Local first | Low | Plain |
|20 | Phase 14 fragile | fragile ctx | Foundational when grounded | Foundation-first | Medium | Grounded |
|21 | Narrow row / stable subject | synthetic low `foundationScore` + stable peers | Subject leans local | Local | Medium | See `learning-patterns-analysis` refinement |
|22 | Broad instability | multiple rows fragile / persistent | Subject leans foundation | Base first | Medium | See aggregation |
|23 | Early positive RTI | `ctxHighAccNoSeq` | Continue, not celebrate | Prove direction | **High** premature release | **Gates** |
|24 | Misaligned + memory | Phase 12 pivot branch | Pivot or reset, not “keep” | Pivot | Medium | Clear |
|25 | No memory + misaligned stale | `buildPhase12ContinuationOverlay` stale | **No** pivot on stale alone | Collect evidence | **High** | **Calibrated** |
|26 | Light memory + release signals | overlay aligned + release_readiness | **No** `begin_controlled_release` | Refine | **High** | **Calibrated** |
|27 | weak_independence + release track | gates ctx + root | **No** `releaseGate=forming` | Block release | **High** | **Calibrated** |
|28 | transfer limited + release | gates + `transferReadiness: limited` | Pending, not forming | Wait | High | **Calibrated** |
|29 | Stale + release forming | sequence_ready + stale freshness | Downgrade to pending | Recheck | High | **Calibrated** |
|30 | Phase 15 compact strip | `runPhase15` + SSR | Single lines, no duplicate meaning | Same as engine | Low | Scannable |

*(Rows 21–30 combine named fixtures, phase6 harness ctx, and Phase 12/13/14 builders — total 30 review slots; expand to 40 by duplicating math/geometry variants from `parent-report-pipeline.mjs` as needed.)*

---

## 2. Contradictions found (pre-fix) and resolution

| # | Scenario | Conflicting signals | Why it matters | Winning layer | Fix (implemented) |
|---|----------|----------------------|----------------|----------------|-------------------|
| A | Release track + weak independence root | `releaseGate=forming` vs `rootCause=weak_independence` / flat indep | Parent sees “release forming” while topic still not independent | **Gates / readiness** | `releaseIndependenceHold` in `parent-report-decision-gates.js` blocks `forming` |
| B | Release track + stale conclusion | `releaseGate=forming` vs `stale` freshness | Release contradicts aging | **Aging + gates** | `if (stale && releaseGate === "forming") releaseGate = "pending"` |
| C | `begin_controlled_release` + light memory | Phase 12 continuation vs memory depth | Strong release language without memory | **Memory** | Require `usable_memory` \| `strong_memory` + `!evidenceStale` for branch; downgrade `light_memory` / stale after assignment in `topic-next-step-phase2.js` |
| D | Pivot + stale + misaligned + usable memory | Pivot vs “refresh first” | Pivot sounds drastic on stale window | **Aging first** | New branch: `evidenceStale && misaligned` → `do_not_repeat_without_new_evidence` before pivot |
| E | Gates lacked transfer readiness | Sequence RTI vs `transferReadiness` not in ctx | Engine could not see transfer | **Gates** | Pass `transferReadiness` from `memoryPhase9` into `buildDecisionGatesPhase13` (`topic-next-step-engine.js`) |
| F | Release forming on q=14 only | Minor sample vs release | Overreach | **Gates** | Raise release `forming` threshold from **q ≥ 14** to **q ≥ 16** (with existing indep/evidence rules) |

---

## 3. Threshold / precedence changes (exact)

| File | Rule | Before | After | Safer because |
|------|------|--------|-------|----------------|
| `parent-report-decision-gates.js` | Release `forming` | `q >= 14` + indepUp + ev≠low | `q >= 16` + same + `!releaseIndependenceHold` | Fewer premature release tracks on thin windows |
| `parent-report-decision-gates.js` | Release vs stale | Could stay `forming` when stale | `stale → pending` if was `forming` | Aligns with recheck narrative |
| `parent-report-decision-gates.js` | Independence hold | N/A | `weak_independence` / `transferReadiness` limited,not_ready / flat indep / indep trend down | Release never “forming” when independence story contradicts |
| `topic-next-step-phase2.js` `buildPhase12ContinuationOverlay` | Misaligned + stale | Could `pivot_from_prior_path` | `do_not_repeat_without_new_evidence` first | Under-claim pivot on expired view |
| `topic-next-step-phase2.js` | `begin_controlled_release` | Allowed with `light_memory`, no stale check | Requires `usable_memory`\|`strong_memory`, `!evidenceStale`; post-guard for `light_memory` | No strong continuation on weak memory |
| `topic-next-step-engine.js` | Phase 12 overlay input | No aging fields | Pass `freshnessState`, `conclusionFreshness` | Continuation logic sees stale |
| `topic-next-step-engine.js` | Gates input | No transfer | Pass `transferReadiness` | Gates align with memory phase |

---

## 4. Wording review (Hebrew)

| Location | Issue | Why it hurts | Replacement | Scope |
|----------|-------|--------------|-------------|-------|
| `DEPENDENCY_STATE_LABEL_HE.likely_foundational_block` | Stacked hedges («ייתכן» + vague) | Sounds tentative and robotic | Direct evidence-based line (see `parent-report-ui-explain-he.js`) | **Applied** |

Further wording nits (no code change yet): watch duplicate “ראיה / תצפית” in exec vs topic — mitigated by Phase 15 compact helpers + Phase 15 engine dedupe on `why`.

---

## 5. Red-team matrix (target failures → outcome)

| Attack | Intended failure | Result after pass |
|--------|-------------------|---------------------|
| Strong row masks weak subject | Exec over-celebrates | **Pass** subject aggregation + cross-risk flags |
| Weak row in stable subject | Foundation-first everywhere | **Pass** Phase 14 subject refinement + gates |
| Hints + high accuracy | Mastery wording | **Pass** fragile / hint risk + RTI |
| Strong memory + stale | Aggressive pivot | **Fixed** (stale + misaligned → do_not_repeat) |
| Mixed → false foundation | foundation_first thin | **Pass** Phase 14 score + Phase 15 thresholds |
| Speed-only → foundational | Wrong dependency | **Pass** `speed_only` path in foundation-dependency |
| Fragile retention → knowledge gap only | Wrong blocker label | Heuristic uses stage/retention (unchanged this pass) |
| Misaligned → follow-through blame | Wrong narrative | Outcome layer still primary; continuation softened when stale |
| Continuation when should pause | begin_controlled_release | **Fixed** memory + stale guards |
| Release without independence | forming release | **Fixed** gates hold + q + stale |

---

## 6. Hierarchy check

| Level | Role | Duplication risk | Status |
|-------|------|------------------|--------|
| Executive | What matters cross-subject, defer, foundation-first rollups | Repeating topic detail | Acceptable; lists are high-level |
| Subject | Dominant pattern, RTI, continuation, dependency narrative | Was dense | Phase 15 topic strip reduced noise; subject `SubjectPhase3Insights` unchanged this pass |
| Topic | Likely + support + evidence + foundation compact | Was stacked | **Phase 15** merged lines |

---

## 7. UI scan (compact surfaces)

| Surface | Finding | Tweak |
|---------|---------|-------|
| `TopicRecommendationExplainStrip` | Was very tall | **Phase 15** unified lines (prior pass) |
| `ParentReportTopicExplainRow` | Same | **Phase 15** unified lines |
| Executive order | Phase blocks order | No reorder this pass (no redesign) |

---

## 8. Regression tests

See `runQaCalibrationRedTeam` in `scripts/parent-report-phase6-suite.mjs`.

---

## 9. Pilot readiness judgment

**Verdict:** **Ready for freeze + pilot** with **optional** follow-up if real anonymized payloads show new contradictions (document them using section 2 table format).

Rationale: release/continuation paths are **more conservative** and aligned with aging/memory; Phase 15 UI already reduces repetition; remaining risk is **real-data vocabulary** (parent language tuning per cohort), not structural contradiction.
