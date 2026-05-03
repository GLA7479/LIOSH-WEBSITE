# Existing AI / System Intelligence — Mapping & Audit

**Scope:** Map and audit intelligence already in the LIOSH learning codebase.  
**Out of scope for this document:** UI/design changes, engine rewrites, new AI providers, product behavior changes.  
**Audience:** Engineering and curriculum governance; internal English documentation.

---

## 1. Existing AI / Intelligence Inventory

Legend — **Logic class**

| Class | Meaning |
|-------|---------|
| **Deterministic** | Same inputs → same outputs; rule/code tables |
| **Heuristic** | Scored/ranked rules with thresholds; not guaranteed optimal |
| **LLM / provider** | External model call (gated / optional in this repo) |

Below, paths are relative to the repository root unless noted.

### 1.1 Core diagnostic engine (V2)

| Location | Key symbols | What it does | Inputs | Outputs | Parent-visible? | Affects next question? | Class |
|----------|-------------|--------------|--------|---------|-----------------|------------------------|-------|
| `utils/diagnostic-engine-v2/run-diagnostic-engine-v2.js` | `runDiagnosticEngineV2` | Per-topic/bucket units: mistake aggregation, taxonomy match, recurrence, confidence, priority, gating | Period-bound `maps`, `rawMistakesBySubject`, `startMs`, `endMs` | `diagnosticEngineV2` with `units[]` (taxonomy, confidence, flags) | **Yes** (via report builders) | **No** (report-time) | Deterministic + heuristic |
| `utils/diagnostic-engine-v2/confidence-policy.js` | `resolveConfidenceLevel` | Maps row + events to confidence band | Events, row, recurrence, hint flags | `high` / `moderate` / `low` / `early_signal_only` / `insufficient_data` / `contradictory` | Indirect (labels/ explain) | No | Heuristic |
| `utils/diagnostic-engine-v2/output-gating.js` | (gating helpers) | Suppresses or weakens outputs when rules say “cannot conclude” | Engine row + policy | Gated fields / flags | Indirect | No | Deterministic |
| `utils/diagnostic-engine-v2/recurrence.js` | `passesRecurrenceRules`, `heavyHintLikelyInvalidatesPattern` | Recurrence and hint-invalidation | Wrong events, taxonomy row | Booleans | Internal | No | Deterministic |
| `utils/diagnostic-engine-v2/taxonomy-*.js` | Taxonomy rows per subject | Canonical hypotheses + `doNotConcludeHe` per taxonomy id | N/A (static) | `TAXONOMY_BY_ID` entries | Via sanitized parent copy only | No | Deterministic data |

### 1.2 Professional framework & rollup (`professionalFrameworkV1`)

| Location | Key symbols | What it does | Inputs | Outputs | Parent-visible? | Next question? | Class |
|----------|-------------|--------------|--------|---------|-------------------|----------------|-------|
| `utils/learning-diagnostics/diagnostic-framework-v1.js` | `enrichDiagnosticEngineV2WithProfessionalFrameworkV1` | Structured findings, probes, `doNotConclude`, skill/subskill linkage per unit + rollup | `diagnosticEngineV2`, subject maps, summary counts | Mutates engine with `professionalFrameworkV1` on units and rollup | Mostly internal JSON; Hebrew lines flow through builders | No | Deterministic + heuristic |
| `utils/learning-diagnostics/professional-engine-output-v1.js` | `enrichDiagnosticEngineV2WithProfessionalEngineV1` | Unifies misconception, mastery, calibration, reliability, cross-subject, dependency analysis, probe recommendations | Engine + maps + `summaryCounts` + mistake stream + window | `professionalEngineOutputV1` attached | Internal metrics feed narrative guards indirectly | No | Heuristic |

### 1.3 Satellite professional engines (learning-diagnostics)

| Location | Key symbols | Role | Inputs | Outputs | Parent-visible? | Next question? | Class |
|----------|-------------|------|--------|---------|-----------------|----------------|-------|
| `utils/learning-diagnostics/mastery-engine-v1.js` | `computeMasteryRollupV1` | Skill mastery bands / rollup | Maps, counts, misconception counts | Mastery items | Internal | No | Heuristic |
| `utils/learning-diagnostics/misconception-engine-v1.js` | `aggregateMisconceptionsForSubject` | Misconception typing from metadata + pace signals | Wrong events, subject | Items + `doNotConclude` strings | Internal | No | Heuristic |
| `utils/learning-diagnostics/dependency-engine-v1.js` | `analyzePrerequisiteGap` | Prerequisite / gap suspicion | Mastery context, subject, skill | Gap record + `doNotConclude` | Internal | No | Heuristic |
| `utils/learning-diagnostics/calibration-engine-v1.js` | `buildCalibrationV1` | Calibration vs grade expectations | Maps, summary, grade key | Calibration blob | Internal | No | Heuristic |
| `utils/learning-diagnostics/reliability-engine-v1.js` | `assessReliabilityV1` | **Guessing**, **inconsistency** across sessions/modes, trust level | Maps, mistakes, time window | `guessingLikelihood`, `inconsistencyLevel`, `dataTrustLevel`, … | Internal | No | Heuristic |
| `utils/learning-diagnostics/probe-engine-v1.js` | `buildProbeRecommendationsV1` | Suggested probes given thin data / gaps | Aggregated signals | Probe list | Internal suggestions; not automatic student routing | No | Heuristic |
| `utils/learning-diagnostics/cross-subject-engine-v1.js` | `detectCrossSubjectPatternsV1` | Cross-subject pattern hypotheses | Maps, summary | Patterns + `doNotConclude` | Internal | No | Heuristic |
| `utils/learning-diagnostics/question-skill-metadata-v1.js` | `buildQuestionSkillMetadataV1` | Normalizes per-question metadata for diagnostics | Question + context | Metadata object | Internal | No | Deterministic |

### 1.4 Parent report pipeline — row-level & topic steps

| Location | Key symbols | Role | Inputs | Outputs | Parent-visible? | Next question? | Class |
|----------|-------------|------|--------|---------|-----------------|----------------|-------|
| `utils/parent-report-row-diagnostics.js` | `computeRowDiagnosticSignals`, `computeConfidence01`, … | **Mastery/confidence/stability**, evidence strength, sufficiency, Hebrew quality lines | Row, mistakes, period end | Enriched row signals | **Yes** (via templates) | No | Heuristic |
| `utils/parent-report-row-trend.js` | Trend builders | Session-window trend signals | Rows, mistakes, window | `trend` on rows | **Yes** | No | Heuristic |
| `utils/parent-report-row-behavior.js` | `computeRowBehaviorProfile` | Behavior profiles (e.g. dominance types) | Row, mistakes, window | `behaviorProfile` | Indirect | No | Heuristic |
| `utils/parent-report-diagnostic-restraint.js` | `computeDiagnosticRestraint` | **Restraint level**, conclusion strength caps | q, accuracy, evidence, sufficiency, stability, risk flags | Restraint object | Drives cautious wording | No | Deterministic + heuristic |
| `utils/parent-report-confidence-aging.js` | `buildConfidenceAgingPhase10` | **Mastery/evidence decay / freshness** ("Phase 10") | Recency, q, evidence, conclusion strength | `confidenceDecayApplied`, freshness labels | Hebrew labels → parent | No | Heuristic |
| `utils/topic-next-step-engine.js` | `decideTopicNextStep`, `enrichReportMapsWithTopicStepHints` | **Recommendations** for topic row: next step, guards, Phase 2 risk flags, root-cause estimate | Row diagnostics, mistakes | `topicNextStep`, hints on maps | **Yes** | No | Heuristic |
| `utils/topic-next-step-phase2.js` | Phase 2 / 13 helpers | Risk flags, phase overlays | Row + derived signals | Flags, overlays | Partial | No | Heuristic |
| `utils/parent-report-root-cause.js` | `estimateRowRootCause`, narrative helpers | **Misconception-style** narrative framing (Hebrew) | Row + restraint | Root cause payload / lines | **Yes** | No | Heuristic |

### 1.5 System intelligence layer (report maps)

| Location | Key symbols | Role | Inputs | Outputs | Parent-visible? | Next question? | Class |
|----------|-------------|------|--------|---------|-----------------|----------------|-------|
| `utils/system-intelligence/consistency-engine.js` | `applyConsistencyGuards` | **Inconsistency** / cross-row consistency | Maps | Adjusted signals | Indirect | No | Heuristic |
| `utils/system-intelligence/dependency-engine.js` | `applyDependencyGuards` | Prerequisite-related guards | Maps | Guards | Indirect | No | Heuristic |
| `utils/system-intelligence/feedback-engine.js` | `attachFeedbackSignal` | Feedback-derived signals | Maps | Signals | Indirect | No | Heuristic |
| `utils/system-intelligence/time-decision-engine.js` | `applyTimeDecisionGuards` | Time / pacing decisions | Maps | Guards | Indirect | No | Heuristic |
| `utils/system-intelligence/feedback-decision-engine.js` | `applyFeedbackDecisionGuards` | Feedback decision guards | Maps | Guards | Indirect | No | Heuristic |
| `utils/system-intelligence/priority-engine.js` | `computeTopicPriority` | Topic prioritization | Maps | Priority | Indirect | No | Heuristic |
| `utils/system-intelligence/global-score.js` | `computeGlobalScore` | Global score composition | Maps | Score | May surface in summary | No | Heuristic |

### 1.6 Intelligence layer v1 (weakness patterns)

| Location | Key symbols | Role | Inputs | Outputs | Parent-visible? | Next question? | Class |
|----------|-------------|------|--------|---------|-----------------|----------------|-------|
| `utils/intelligence-layer-v1/weakness-confidence-patterns.js` | `buildWeaknessConfidencePatternsV1` | **Weakness** pattern summary for unit/row | Row, mistakes, diagnostic unit | `intelligenceV1` on unit + row | Internal / explain | No | Heuristic |
| `utils/intelligence-layer-v1/intelligence-decision-guards.js` | `applyIntelligenceDecisionGuards` | Blocks aggressive **topic next-step** when confidence low / tentative weakness | Step string, `intelligenceV1` | Safer step | Affects **recommended** step text only (report), not live tutor | Deterministic |

### 1.7 Pattern analysis (legacy + V2 bridge)

| Location | Key symbols | Role | Inputs | Outputs | Parent-visible? | Next question? | Class |
|----------|-------------|------|--------|---------|-----------------|----------------|-------|
| `utils/learning-patterns-analysis.js` | `analyzeLearningPatterns`, phase synthesizers | Cross-topic **pattern diagnostics**, phase-3 style synthesis | Report + mistakes | `patternDiagnostics` / merged analysis | **Yes** when merged into report | No | Heuristic |

### 1.8 Fast diagnosis (deterministic Hebrew)

| Location | Key symbols | Role | Inputs | Outputs | Parent-visible? | Next question? | Class |
|----------|-------------|------|--------|---------|-----------------|----------------|-------|
| `utils/fast-diagnostic-engine/run-fast-diagnosis-for-unit.js` | Fast diagnosis runner | Short-cycle labels/tags | Unit + mistakes | Tags | Via engine attachment | No | Deterministic |
| `utils/fast-diagnostic-engine/infer-tags.js` | Tag inference | Maps signals to tags including **guessing** | Features | Tag list | Indirect | No | Heuristic |
| `utils/fast-diagnostic-engine/parent-copy-he.js` | Hebrew strings | **Deterministic Hebrew copy** for fast diagnosis | Tags | Hebrew snippets | **Yes** if surfaced | No | Deterministic |
| `utils/fast-diagnostic-engine/attach-fast-diagnosis.js` | `attachFastDiagnosisToDiagnosticEngineV2` | Attaches fast layer to V2 | Engine + mistakes + maps | Mutated engine | Indirect | No | Deterministic glue |

### 1.9 AI-hybrid diagnostic layer (not an LLM product path by itself)

| Location | Key symbols | Role | Inputs | Outputs | Parent-visible? | Next question? | Class |
|----------|-------------|------|--------|---------|-----------------|----------------|-------|
| `utils/ai-hybrid-diagnostic/hypothesis-ranker.js` | `rankHypotheses`, `buildDisagreement` | Ranks hypotheses vs V2; **disagreement** severity | Unit features, V2 snapshot | Ranking + disagreement | Internal reviewer UI / optional explanations | No | Heuristic |
| `utils/ai-hybrid-diagnostic/probe-intelligence.js` | `buildProbeIntelligence` | Suggested probe id / narrative shell | Hybrid context | Probe hints | Internal / explain-only paths | No | Heuristic |
| `utils/ai-hybrid-diagnostic/explanation-layer.js` | `buildHybridExplanations` | Template explanations | Validated features | Explanation blocks | Can be parent-facing in hybrid UX paths per gates | No | Deterministic templates |
| `utils/ai-hybrid-diagnostic/explanation-validator.js` | `validateExplanationOutput` | Validates explanation contracts | Text + authority | Pass/fail + reasons | N/A | No | Deterministic |
| `utils/ai-hybrid-diagnostic/authority-gate.js` | `resolveAuthorityGate` | Decides `assist` / `rank_only` / `explain_only` / `suppressed` | Signals | Mode + flags | Internal | No | Deterministic + heuristic |
| `utils/ai-hybrid-diagnostic/safe-build-hybrid-runtime.js` | `safeBuildHybridRuntimeForReport` | Safe wrapper; failures do not break report | Report inputs | `hybridRuntime` or null | Optional panel | No | Glue |

### 1.10 Parent report assembly & detailed narrative

| Location | Key symbols | Role | Inputs | Outputs | Parent-visible? | Next question? | Class |
|----------|-------------|------|--------|---------|-----------------|----------------|-------|
| `utils/parent-report-v2.js` | `generateParentReportV2` | **Main orchestrator**: maps → diagnostics → V2 engine → professional layers → intelligence v1 → fast diagnosis → hybrid runtime → integrity | Sessions, mistakes, period | Full V2 report object | **Yes** | No | Pipeline (deterministic orchestration + heuristic engines) |
| `utils/math-report-generator.js` | `generateRecommendations`, etc. | Legacy / subject recommendation helpers | Report fragments | Recommendations | **Yes** (where still wired) | No | Heuristic |
| `utils/detailed-parent-report.js` | `buildDetailedParentReportFromBaseReport`, builders | **Detailed report** sections: executive summary, home plan, goals, contracts | Base report | Detailed payload | **Yes** | No | Deterministic assembly + heuristic text |
| `utils/detailed-report-parent-letter-he.js` | `buildSubjectParentLetter`, `buildTopicRecommendationNarrative`, … | **Parent letter** Hebrew narratives per subject/topic | Subject profiles, topic rows | Hebrew blocks | **Yes** | No | Deterministic templates + data interpolation |
| `utils/parent-report-language/*` | `normalizeParentFacingHe`, `forbidden-terms`, tier labels | **Normalization, forbidden tokens, tier wording** | Raw strings + context | Sanitized Hebrew | **Yes** | No | Deterministic |
| `utils/parent-report-ui-explain-he.js` | Diagnostic explain strings | Short-report diagnostic explanation lines | Engine + settings | Hebrew lines | **Yes** | No | Deterministic / templated |
| `utils/parent-report-recommendation-consistency.js` | `resolveUnitNextGoalHe`, etc. | Cross-check **recommendation** consistency | Units | Resolved Hebrew | **Yes** | No | Deterministic |
| `utils/parent-copilot/*` | Truth packet, validators, orchestrator | **Parent Q&A** — deterministic core; optional LLM overlay | Question + report-derived truth | Answer blocks + telemetry | **Yes** (copilot) | No | **Hybrid:** deterministic default + **optional LLM** |

#### LLM / OpenAI usage (optional, gated)

| Location | Key symbols | Role | Inputs | Outputs | Parent-visible? | Class |
|----------|-------------|------|--------|---------|-----------------|-------|
| `utils/parent-copilot/llm-orchestrator.js` | `maybeGenerateGroundedLlmDraft`, `callOpenAiCompatible` | OpenAI-compatible HTTP call when env gates allow | Truth packet, prompts | Draft blocks or failure reason | **Yes** if accepted | **LLM** |
| `utils/parent-copilot/rollout-gates.js` | `getLlmGateDecision` | Env/feature gating for LLM | `process.env` | Enabled/disabled + reasons | Internal | Deterministic |

There are **no** LLM calls in the core student learning loop or in `generateParentReportV2` itself; LLM is isolated to **Parent Copilot** behind rollout gates and validators.

### 1.11 Active diagnostic runtime (in-session “adaptive” probes)

| Location | Key symbols | Role | Inputs | Outputs | Parent-visible? | Next question? | Class |
|----------|-------------|------|--------|---------|-----------------|----------------|-------|
| `utils/active-diagnostic-runtime/build-pending-probe.js` | `buildPendingProbeFromMistake` | After wrong answer, builds a **pending probe** spec | Normalized mistake + context | `PendingDiagnosticProbe` | Indirect (better targeting) | **Yes** — influences item selection in masters | Heuristic |
| `utils/active-diagnostic-runtime/select-with-probe.js` | Selection helpers | Prefers questions matching probe when possible | Question bank, probe | Filtered selection | No | **Yes** | Deterministic + heuristic |
| `utils/active-diagnosis-session-summary.js` | Session summary for reports | Surfaces pending probe in summaries | Diagnostic state | Summary fields | Can appear in debug/summary paths | No | Deterministic |

### 1.12 APIs & expert review artifacts

| Location | Key symbols | Role | Inputs | Outputs | Parent-visible? | Class |
|----------|-------------|------|--------|---------|-----------------|-------|
| `pages/api/learning-simulator/generate-expert-review-pack.js` | Next.js API | Builds expert review snapshot (admin token) | POST + env | JSON artifact | Internal admin | **N/A** |
| `utils/expert-review-pack-artifact-snapshot.js` | `buildExpertReviewPackSnapshot` | Aggregates QA artifacts for human expert review | Repo paths | Manifest + snapshot | Internal | Deterministic |

### 1.13 Prompt files

No dedicated `prompts/*.txt` hierarchy was found for the learning engine. Parent Copilot builds prompts **in code** (`llm-orchestrator.js`). Diagnostic and report Hebrew strings live primarily in `utils/parent-report-language/`, `utils/detailed-report-parent-letter-he.js`, templates in topic engines, and taxonomy `doNotConcludeHe` lists.

---

## 2. Decision Authority Map

### 2.1 Who decides what

| Layer | Decisions | Typical outputs | Shown to parents? | Drives next exercise in app? | Risk notes |
|-------|-----------|-----------------|-------------------|------------------------------|------------|
| **Diagnostic Engine V2** | Taxonomy choice (when allowed), confidence, priority, cannot-conclude style flags | `units[]` with taxonomy + confidence + gating | Yes — through **filtered** Hebrew builders | No | **Needs QA** — core educational inference |
| **Professional framework + professional engine output** | Structured findings, cross-subject hypotheses, probe suggestions, `doNotConclude` lists | JSON attached to engine | Mostly **internal**; wording via separate narrative | No | **Needs human expert review** for taxonomy/cross-subject claims |
| **Row diagnostics + topic-next-step** | Recommended pedagogical **step**, home-method hints, risk flags | `topicNextStep`, map hints | **Yes** | No | **Needs QA** — affects “what we recommend” |
| **Diagnostic restraint + confidence aging** | How strong language may be | `conclusionStrength`, decay flags | **Yes** | No | **Safe** when respected downstream |
| **System intelligence** | Consistency, dependency, priority, global score | Adjustments on maps | Partially in summaries | No | **Needs QA** |
| **Intelligence v1 guards** | Block aggressive step suggestions | Step rewrite | **Yes** (softer steps) | No | **Safe** (fail-closed toward maintain) |
| **Fast diagnosis** | Short tags / fast Hebrew | Tags, copy | If surfaced | No | **Safe** if copy stays within parent norms |
| **AI-hybrid layer** | Hypothesis rank vs V2, explanation contracts, suppression | `hybridRuntime`, explanations | Optional UI / internal reviewer | No | **Needs QA** — must stay subordinate to V2 authority |
| **Parent Copilot deterministic core** | Answer templates from truth packet | Blocks + citations | **Yes** | No | **Safe** relative to packet |
| **Parent Copilot LLM** | Optional rephrase | Draft blocks | **Yes** only after validators pass | No | **High risk** if gates misconfigured; mitigated by gates + clinical regex |

### 2.2 Decision classification (summary)

- **Safe:** Deterministic sanitizers (`normalizeParentFacingHe`), forbidden-term tests, intelligence v1 step guards (fail-closed), Copilot deterministic path, diagnostic restraint math when applied consistently.
- **Needs QA:** All heuristic engines (V2 priority, hybrid ranker, cross-subject, mastery/misconception), topic-next-step, reliability/guessing inference, report assertion suites.
- **Needs human expert review:** Taxonomy definitions, cross-subject educational hypotheses, calibration expectations, expert review packs for release sign-off.
- **High risk:** Optional LLM path without gates; strong clinical wording; any path that bypasses `doNotConclude` or thin-data handling; treating reliability scores as ground truth.

---

## 3. Parent Report AI / Narrative Audit

### 3.1 Where parent-facing Hebrew is generated

Primary references: `docs/PARENT_REPORT_TEXT_SOURCE_MAP.md`, `docs/PARENT_REPORT_HEBREW_STYLE_GUIDE.md`.

| Area | Source data | Engine / fields | Overstatement risk | `doNotConclude` respected? | Thin data | `mustNotSay`-style guards | Medical language | Explanation vs decision |
|------|-------------|-----------------|--------------------|----------------------------|-----------|---------------------------|------------------|-------------------------|
| Short report (`utils/parent-report-v2.js` + `pages/learning/parent-report.js`) | Maps, V2 units, patterns | `diagnosticEngineV2`, `patternDiagnostics`, summary | Medium — depends on restraint + normalization | Partial — via restraint + gating + language layer | Handled via sufficiency / early-signal copy | `forbidden-terms` + Hebrew tests | Style guide + taxonomy `doNotConcludeHe` | Mostly **explanation + suggested actions**; not medical diagnosis |
| Topic explain / next step (`topic-next-step-engine.js`, UI row components) | Row diagnostics | `topicNextStep`, `diagnosticRestraint` | Medium | Guards reduce aggression | `suppressAggressiveStep`, low-q paths | Tier / caution gating | Avoided by policy | Recommendations |
| Detailed report (`detailed-parent-report.js`, `detailed-report-parent-letter-he.js`) | Full V2 report | Executive summary, profiles, goals | Higher — long-form synthesis | Contract fields exist; must stay aligned | Fallback copy when sparse | Normalize + editorial docs | Style guide | Mix of observation + planning |
| Parent Copilot (`utils/parent-copilot/*`) | Truth packet from report | Structured metrics + eligibility | LLM could overstate if validators weak | Packet carries boundaries; LLM validated | Eligibility gates | Clinical regex / forbidden phrases in validators | Guardrails in `guardrail-validator.js` | **Explanation-first**; clinical routed to boundary branch |

**Assessment:** There is **no single centralized “parent narrative reviewer”** that proves every Hebrew sentence is entailed by engine JSON. Protection is **layered**: restraint engine, normalization, forbidden terms, contracts (`contractsV1`, narrative attachment in detailed build), and extensive QA scripts. Residual risk is **long-form synthesis** in detailed report and **optional LLM** if gates were enabled incorrectly.

---

## 4. Existing AI Safety Gaps

1. **Overconfident wording:** Long-form narrative builders can still produce strong tone if upstream `conclusionStrength` and aging metadata are inconsistent with thin `q`.
2. **Weak evidence → strong conclusion:** Partially mitigated by restraint + sufficiency; risk remains when multiple weak rows are synthesized in executive summary.
3. **Text vs engine contradiction:** No universal automated theorem that Hebrew strings equal JSON predicates; reliance on tests + manual editorial process (`docs/PARENT_REPORT_EDITORIAL_SIGNOFF.md`).
4. **Missing `doNotConclude` guard:** Taxonomies carry `doNotConcludeHe`; professional framework adds lists — but **not every narrative path asserts** a machine-readable link from sentence → guard list.
5. **`mustNotSay`:** Concept appears as **forbidden terms** + clinical validators (Copilot); not one unified field across all report builders.
6. **Observation vs diagnosis:** Policy docs draw the line; code enforcement is partial (mostly Copilot + style tests).
7. **Low performance vs disability:** Taxonomy `doNotConcludeHe` explicitly lists disability-framed phrases to avoid in taxonomy guidance; cross-subject engine adds English `doNotConclude` strings — **still relies on narrative discipline** for full parent surface.
8. **Recommendations without evidence:** Topic-next-step can suggest actions; guards reduce but do not eliminate mismatch if row metadata is wrong.
9. **Hidden assumptions:** Question metadata quality drives misconception and probe engines — sparse metadata → plausible but weak hypotheses (`run-engine-final-gate.mjs` lists this as known limitation).

---

## 5. Existing QA Coverage

Scripts referenced from `package.json` and `scripts/learning-simulator/run-orchestrator.mjs`.

| Script (`npm run …`) | What it checks | What it does **not** check | Protects parent conclusions? | Protects AI/narrative? |
|----------------------|----------------|----------------------------|------------------------------|-------------------------|
| `qa:learning-simulator:matrix` | Coverage matrix artifacts | Semantic correctness of prose | No | No |
| `qa:learning-simulator:schema` | Scenario/profile schema | Live UI | No | No |
| `qa:learning-simulator:aggregate` | Simulator aggregates | Full browser UX | Partial (data pipeline) | No |
| `qa:learning-simulator:reports` | Report assertions (Phase 3) | Every Hebrew clause | **Partial** | **Partial** |
| `qa:learning-simulator:engine` | Engine truth audit (aggregation ↔ V2 ↔ report model) | Narrative entailment | Indirect | No |
| `qa:learning-simulator:behavior` | Behavior checks (Phase 5) | Parent wording | No | No |
| `qa:learning-simulator:questions` | Question integrity (Phase 4) | Report narrative | No | No |
| `qa:learning-simulator:diagnostic-framework` | Professional framework contracts | All natural-language outputs | No | No |
| `qa:learning-simulator:framework-real-scenarios` | Real scenarios + `doNotConclude` presence | LLM | Partial | No |
| `qa:learning-simulator:engine-completion-summary` | Completion artifact | Human editorial | Meta | No |
| `qa:learning-simulator:question-skill-metadata` | Metadata QA | Student UX | No | No |
| `qa:learning-simulator:misconceptions` / `mastery` / `dependencies` / `calibration` / `reliability` / `probes` / `cross-subject` | Per-engine invariants | End-to-end pedagogy | No | No |
| `qa:learning-simulator:professional-engine-output` | Combined professional output shape | Hebrew | No | No |
| `qa:learning-simulator:professional-engine` | Professional validation suite | Narrative | Partial | No |
| `qa:learning-simulator:engine-final` | Layered gate → full release orchestrator | Editorial sign-off | Partial | No |
| `qa:learning-simulator:render` | Render release gate | Content quality | Partial (layout) | No |
| `qa:learning-simulator:pdf-export` | PDF/export gate | Wording semantics | Partial | No |
| `qa:learning-simulator:review-pack` | Parent report review pack artifact | LLM Copilot | Internal review | No |
| `qa:learning-simulator:release-summary` | Release readiness summary | Human judgment | Meta | No |
| `test:parent-report-hebrew-language` | Forbidden terms / style | Non-text regressions | **Yes** | **Yes (surface)** |
| `test:parent-report-phase6` | Bundle of SSR + text guards | Full pedagogy | Partial | Partial |
| `test:parent-copilot-*` (many) | Copilot routing, validators, LLM gates | Full report Hebrew | Copilot only | **Yes** for Copilot |
| `test:intelligence-layer-v1` | Intelligence guards | Reports | No | No |
| `test:diagnostic-engine-v2-harness` | V2 harness | Reports | Partial | No |
| `test:ai-hybrid-harness` | Hybrid harness | Parent report pages | Partial | Partial |

**Gap summary:** Strong **engine and schema** coverage; **Hebrew parent narrative entailment** is only partially enforced (style tests, spot assertions, not full semantic review).

---

## 6. AI / Intelligence Output Contract (recommended)

Proposed **internal** contract for intelligence layers (JSON-serializable). This does **not** change runtime today; it specifies governance.

```json
{
  "decision": "string — canonical enum id",
  "confidence": "high | medium | low | insufficient",
  "evidence": [{ "kind": "metric|event|taxonomy", "ref": "string", "weight": 0.0 }],
  "riskFlags": ["thin_sample", "guess_like_pace", "cross_subject_hypothesis", "..."],
  "doNotConclude": ["human-readable + machine ids"],
  "mustNotSay": ["parent-facing forbidden roots"],
  "needsHumanReview": false,
  "parentSafeSummary": "Hebrew — observation-only, hedged",
  "internalReasoningSummary": "English or Hebrew — engineer-facing",
  "suggestedNextStep": "pedagogical suggestion — must align with evidence tier",
  "authority": { "primaryEngine": "diagnosticEngineV2", "subordinate": ["professionalFrameworkV1", "hybridRuntime"] },
  "eligibility": { "parentFaceAllowed": true, "copilotAllowed": true, "llmAllowed": false }
}
```

| Field | Internal only | Safe for parent-facing |
|-------|---------------|-------------------------|
| `decision`, `confidence`, `evidence`, `riskFlags` | **Yes** (raw) | **No** — must pass through `parentSafeSummary` + restraint |
| `doNotConclude`, `mustNotSay` | Full lists internal | **Abbreviated** parent-safe “limitations” only |
| `needsHumanReview` | **Yes** | May show as soft “we recommend discussing with an educator” (policy-dependent) |
| `parentSafeSummary` | No — designed for parents | **Yes** |
| `internalReasoningSummary` | **Yes** | **No** |
| `suggestedNextStep` | Internal until validated | **Yes** when eligibility + intensity caps pass |
| `authority`, `eligibility` | **Yes** | **No** |

---

## 7. Existing vs Missing “AI / Intelligence Reviewer”

| Question | Answer |
|----------|--------|
| Do we already have a reviewer layer? | **Partially.** `ai-hybrid-diagnostic` provides **ranking + disagreement + explanation validators** subordinate to V2. Parent Copilot uses **validators + truth packet**. There is **no** single repo-wide “reviewer” service. |
| Only diagnostic logic? | **No** — also narrative builders, hybrid overlay, Copilot. |
| Only report narration? | **No** — strong diagnostic core exists. |
| Layer that checks engine conclusion vs evidence? | **Partially** — `reliability-engine`, restraint, `output-gating`, hybrid **disagreement**; no unified “entailment checker” for all surfaces. |
| Blocks unsafe parent text? | **Partially** — `normalizeParentFacingHe`, forbidden terms, Copilot clinical guards; **not** exhaustive for detailed report synthesis. |
| Marks `needs_human_review`? | **Expert review packs** and manifests (`requiresHumanExpertReview`); not consistently a field on every unit in parent JSON. |
| Suggests metadata fixes? | **Content gap** scripts / gap backlog; not automatic ticket generation. |
| Suggests probe questions? | **Yes** — `probe-engine-v1`, hybrid `probeIntelligence`, `buildPendingProbeFromMistake` in-session. |

---

## 8. Professional Readiness Score

| Area | Score | Explanation |
|------|-------|-------------|
| **Diagnostic engine** | **strong** | V2 + recurrence + gating + taxonomy coverage + harness tests + engine truth audit. |
| **AI / intelligence safety** | **medium** | Multiple guardrails; hybrid and Copilot are gated; risk is **surface area** and optional LLM. |
| **Parent report safety** | **medium** | Good normalization + style tests; **synthesis and entailment** not fully automated. |
| **Question metadata quality** | **weak** | Engines depend on rich metadata; QA acknowledges gaps (`question-skill-metadata`, content-gap scripts). |
| **Expert review readiness** | **medium** | Expert review pack + admin API + artifacts; still requires human process. |
| **Adaptive learning readiness** | **medium** | In-session probes + selection helpers exist; **not** a full closed-loop adaptive policy engine. |
| **Production readiness** | **medium** | Orchestrator + gates strong for **build + engine**; narrative and editorial gates rely on **human** review for final parent trust. |

Scores use: **strong / medium / weak / missing** per instructions.

---

## 9. Recommended Next Implementation Phase

**Recommended:** **Add / strengthen a parent narrative safety guard layer** — automated checks that **parent-facing Hebrew** (short + detailed generators) does not assert stronger claims than allowed by `diagnosticRestraint`, `dataSufficiencyLevel`, `doNotConclude`, and hybrid suppression flags for the same slice.

**Why not the other options first**

- **AI reviewer guard:** Partially exists (hybrid + Copilot). Extending hybrid does not cover PDF/detailed text holistically.
- **Metadata QA:** Already scripted; continue iterating in parallel but does not fix narrative overstating alone.
- **Adaptive planner guard:** Runtime adaptive logic is thinner than report narrative risk surface for “professionalism.”
- **Real student replay:** High value later for empirical validation; heavier infra.
- **Expert review workflow:** Already partially present; can attach **narrative guard artifacts** to the same workflow.

**Likely files to change (future work)**

- `utils/detailed-report-parent-letter-he.js`, `utils/detailed-parent-report.js`
- `utils/parent-report-language/parent-facing-normalize-he.js`, `forbidden-terms.js`
- `utils/topic-next-step-engine.js` (only if guard consumes shared predicates)
- Tests under `scripts/` or `tests/` mirroring `test:parent-report-hebrew-language` patterns

**Likely new files**

- `utils/parent-narrative-guard-v1.js` (pure functions: engine snapshot → allowed assertion tier → validate generated strings)
- `scripts/parent-narrative-gate.mjs` (CI gate)

**Likely npm scripts**

- `test:parent-narrative-guard` or `qa:parent-narrative-gate`

**Risks**

- False positives failing CI on acceptable editorial nuance.
- Maintenance cost when Hebrew templates drift.

**What should NOT be touched yet**

- **Diagnostic engine core** (`run-diagnostic-engine-v2.js`) unless a guard finds a true contract bug.
- **Student-facing master pages** (UI / selection UX).
- **New LLM providers** or enabling Copilot LLM in production by default.

---

## 10. Bottom Line

### What AI already exists?

- **No “general AI tutor”** in the learning loop. The product’s “intelligence” is **deterministic and heuristic code**: Diagnostic Engine V2, professional framework layers, row/topic diagnostics, system-intelligence passes, fast diagnosis, optional **AI-hybrid** overlay (ranking + explanations, subordinate to V2), in-session **probe** logic, and extensive **parent report** narrative assembly. **LLM usage exists only in Parent Copilot** (`llm-orchestrator.js`) and is **optional**, gated, and validated.

### What is missing for it to be professional?

- A **single, enforceable contract** that every parent-visible conclusion is **entailed** by evidence tiers and `doNotConclude` — today this is **partially** enforced through scattered tests and editorial process, not one automated reviewer for all Hebrew outputs.

### What is the safest next step?

- Implement a **parent narrative guard** (pure checks + CI) that compares **allowed assertion tier** from engine JSON to **generated strings** in short and detailed reports, without changing product copy in the same phase.

### What should not be built yet?

- A **new AI provider** or **replacement diagnostic engine**.
- **Fully automated** “learning disability” or clinical conclusions from app metrics alone.

---

### Git status summary (audit time)

- **Branch:** `main`, **up to date** with `origin/main`.
- **Working tree:** **clean** — nothing to commit.

### Files inspected (representative)

- `utils/parent-report-v2.js`
- `utils/diagnostic-engine-v2/run-diagnostic-engine-v2.js`, `confidence-policy.js`, `index.js`
- `utils/learning-diagnostics/diagnostic-framework-v1.js`, `professional-engine-output-v1.js`, `reliability-engine-v1.js`, `misconception-engine-v1.js`, `probe-engine-v1.js`, `dependency-engine-v1.js`, `cross-subject-engine-v1.js`, `mastery-engine-v1.js`, `calibration-engine-v1.js`, `question-skill-metadata-v1.js`
- `utils/topic-next-step-engine.js`, `utils/parent-report-diagnostic-restraint.js`, `utils/parent-report-confidence-aging.js`
- `utils/system-intelligence/*.js`
- `utils/intelligence-layer-v1/intelligence-decision-guards.js`, `weakness-confidence-patterns.js`
- `utils/ai-hybrid-diagnostic/index.js` + `docs/AI_HYBRID_REVIEWER.md`
- `utils/fast-diagnostic-engine/*`
- `utils/active-diagnostic-runtime/build-pending-probe.js`, `select-with-probe.js`
- `utils/parent-copilot/index.js`, `llm-orchestrator.js`, `rollout-gates.js`
- `utils/expert-review-pack-artifact-snapshot.js`, `pages/api/learning-simulator/generate-expert-review-pack.js`
- `scripts/learning-simulator/run-orchestrator.mjs`, `run-engine-final-gate.mjs`
- `package.json` (scripts section)
- `docs/PARENT_REPORT.md`, `docs/PARENT_REPORT_TEXT_SOURCE_MAP.md`, `docs/AI_HYBRID_REVIEWER.md`

**Policy reminder:** No product behavior changes were made to produce this document; implementation requires explicit approval.
