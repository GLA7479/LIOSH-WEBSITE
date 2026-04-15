---
name: r1 rollout readiness
overview: Define a strict non-P0 R1 plan to clear remaining blockers for broader parent rollout without implementing code. The plan formalizes stage gates, production-grade observability direction, classifier/hebrew robustness expansion, and a release decision matrix.
todos:
  - id: r1-gates-spec
    content: Define formal go/no-go gate specification and promotion criteria for each rollout stage.
    status: completed
  - id: r1-observability-architecture
    content: Design production-grade telemetry/observability target and migration path from temporary local trace store.
    status: completed
  - id: r1-robustness-expansion
    content: Expand classifier and Hebrew drift test coverage and CI enforcement for rollout-readiness.
    status: completed
  - id: r1-release-matrix
    content: Publish stage-by-stage release decision matrix and sign-off checklist.
    status: completed
isProject: false
---

# R1 Rollout-Readiness Hardening Plan

## 1. R1 objectives

- Establish formal, auditable go/no-go promotion gates for all rollout stages after P0.
- Replace temporary internal/beta trace assumptions with a production-grade observability plan (without changing parent-facing behavior yet).
- Expand deterministic robustness coverage for intent/scope/semantic classifiers and Hebrew quality drift detection.
- Produce a release decision matrix that binds technical evidence to promotion decisions for deterministic and async/LLM stages.

## 2. exact blockers carried over after P0

- **Approved/planned (spec exists in this canonical file)**
  - Formal rollout contract and promotion rules are now defined at specification level in:
    - `## 10. R1-1 and R1-1b locked operational rollout gate spec (approved)`
  - Production observability target design is now defined at specification level in:
    - `## 11. R1-2 locked production observability target design (approved)`
  - Classifier robustness expansion requirements are now defined at specification level in:
    - `## 9. R1-3 locked classifier robustness expansion spec (approved)`
  - Hebrew drift protection expansion requirements are now defined at specification level in:
    - `## 12. R1-4 locked Hebrew drift protection expansion spec (approved)`
  - Final release matrix wiring and sign-off workflow are now defined at specification level in:
    - `## 13. R1-5 locked release matrix wiring and sign-off checklist spec (approved)`
- **Implemented (code/runtime)**
  - P0 implementation is complete and remains the current runtime baseline.
  - R1 repo-local implementation wave is complete for R1-1/R1-1b/R1-2/R1-3/R1-4/R1-5 scope in this repository:
    - Stage gate scripts and release-matrix checklist are implemented and runnable.
    - Observability contract validation and telemetry-store query/summarization helpers are implemented repo-local.
    - Classifier robustness suites and Hebrew drift suites are implemented and wired.
    - CI stage-gate wiring is implemented in workflow/scripts.
- **Still pending execution (remaining blockers for broader rollout)**
  - External production observability platform dependencies (durable ingest/storage/query/alert infrastructure outside repo-local runtime) remain pending.
  - Organizational sign-off operations (named owner quorum execution in release governance process) remain pending operationalization outside code.
  - Provisional thresholds remain pending external calibration/finalization:
    - confirmed complaint-rate taxonomy/adjudication finalization,
    - shadow-grounding benchmark/rubric calibration.

## 3. file/system areas affected

- Rollout policy and env gates:
  - [utils/parent-copilot/rollout-gates.js](utils/parent-copilot/rollout-gates.js)
  - [utils/parent-copilot/llm-orchestrator.js](utils/parent-copilot/llm-orchestrator.js)
  - [utils/parent-copilot/index.js](utils/parent-copilot/index.js)
- Telemetry model and temporary persistence baseline:
  - [utils/parent-copilot/turn-telemetry.js](utils/parent-copilot/turn-telemetry.js)
  - [utils/parent-copilot/telemetry-store.js](utils/parent-copilot/telemetry-store.js)
- Classifier stack (deterministic path):
  - [utils/parent-copilot/intent-resolver.js](utils/parent-copilot/intent-resolver.js)
  - [utils/parent-copilot/scope-resolver.js](utils/parent-copilot/scope-resolver.js)
  - [utils/parent-copilot/semantic-question-class.js](utils/parent-copilot/semantic-question-class.js)
  - [utils/parent-copilot/semantic-aggregate-answers.js](utils/parent-copilot/semantic-aggregate-answers.js)
- Hebrew quality controls:
  - [utils/parent-report-language/parent-facing-normalize-he.js](utils/parent-report-language/parent-facing-normalize-he.js)
  - [utils/parent-copilot/guardrail-validator.js](utils/parent-copilot/guardrail-validator.js)
- Test and CI gate surfaces:
  - [scripts/parent-copilot-phaseA-suite.mjs](scripts/parent-copilot-phaseA-suite.mjs)
  - [scripts/parent-copilot-parent-language-semantic-suite.mjs](scripts/parent-copilot-parent-language-semantic-suite.mjs)
  - [scripts/parent-copilot-recommendation-semantic-suite.mjs](scripts/parent-copilot-recommendation-semantic-suite.mjs)
  - [scripts/parent-copilot-async-llm-gate-suite.mjs](scripts/parent-copilot-async-llm-gate-suite.mjs)
  - [scripts/parent-copilot-telemetry-trace-suite.mjs](scripts/parent-copilot-telemetry-trace-suite.mjs)
  - [scripts/parent-report-hebrew-language-selftest.mjs](scripts/parent-report-hebrew-language-selftest.mjs)
  - [package.json](package.json)
  - [.github/workflows/parent-report-tests.yml](.github/workflows/parent-report-tests.yml)

## 4. test/CI expansion required

- Create R1 test layers (new suites, no behavior change in this planning step):
  - **Classifier edge matrix suite**: ambiguous phrasing, mixed intents, scope anchor conflicts, noisy/short utterances, aggregate-vs-topic collisions.
  - **Semantic robustness suite**: paraphrase families per semantic class + adversarial near-miss queries.
  - **Hebrew drift suite**: lexical drift, repeated robotic patterns, forbidden/internal term leakage, hedge consistency under normalization.
  - **Observability contract suite**: required telemetry fields, schema stability, failure-safe write behavior, sampling/retention assumptions.
- CI expansion:
  - Add stage-oriented aggregate scripts in [package.json](package.json) (e.g., `test:parent-rollout-stage:*`).
  - Split current monolithic workflow in [.github/workflows/parent-report-tests.yml](.github/workflows/parent-report-tests.yml) into gate jobs with `needs` (policy/tests -> build) or equivalent strict sequencing.
  - Add explicit fail-fast release gate step that validates stage policy config + mandatory evidence artifacts before promotion.

## 5. rollout gates by stage

- **Stage A: deterministic internal**
  - Required: existing deterministic suites pass, telemetry trace schema valid, no critical classifier regressions.
  - Blockers: any contract break, any deterministic fallback safety regression.
- **Stage B: deterministic beta**
  - Required: Stage A + expanded classifier/hebrew drift suites green for a full CI window; no increase in clarification/fallback anomalies beyond approved band.
  - Blockers: unresolved drift alerts, unstable scope/intent edge behavior.
- **Stage C: broad deterministic rollout**
  - Required: Stage B + production observability pipeline live (not temporary local-only), incident/debug playbook ready, release sign-off matrix complete.
  - Blockers: missing durable telemetry/searchability, missing on-call diagnostics.
- **Stage D: async/LLM shadow**
  - Required: Stage C + strict gate policy in [utils/parent-copilot/rollout-gates.js](utils/parent-copilot/rollout-gates.js), kill-switch verification, shadow-only non-user-visible evidence collection.
  - Blockers: gate bypass risk, validator instability.
- **Stage E: async/LLM limited beta**
  - Required: Stage D + KPI gate pass (groundedness/fallback/guardrail thresholds) and adjudicated failure taxonomy.
  - Blockers: unresolved hallucination/ungrounded classes, weak traceability for failures.
- **Stage F: async/LLM broad rollout**
  - Required: Stage E sustained stability window + executive release review with explicit GO.
  - Blockers: any red KPI trend, unresolved high-severity safety/language regression class.

## 6. risks if R1 is skipped

- Promotions remain non-auditable and decision quality depends on ad-hoc judgment.
- Production incidents become hard to triage due to temporary/local-only trace persistence.
- Long-tail classifier failures can surface at scale (mis-scoping, brittle semantic routing, avoidable clarification loops).
- Hebrew quality can drift silently over time, causing trust erosion despite passing core P0 checks.
- Async/LLM rollout pressure may outpace governance, increasing safety and product risk.

## 7. recommended execution order

1. **R1-1 Gate spec first**: define canonical stage policy, hard stop conditions, and evidence template.
2. **R1-2 Observability target design**: define production telemetry schema, ingestion/storage, retention, and query surfaces; map migration from temporary store.
3. **R1-3 Classifier robustness expansion**: add edge-case suites and failure taxonomy coverage for intent/scope/semantic layers.
4. **R1-4 Hebrew drift protection expansion**: add drift/quality suites and thresholded acceptance criteria.
5. **R1-5 CI and release matrix wiring**: enforce stage gates in CI and publish final release decision matrix with sign-off checklist.

## 8. definition of done for R1

- **Planning/spec readiness (already achieved in current file)**
  - One approved rollout policy specification defines GO/NO-GO criteria for all six stages (R1-1/R1-1b).
  - One approved production observability target design defines schema, ingestion/storage/retention, investigation workflow, and migration plan (R1-2).
  - One approved classifier robustness expansion specification defines failure classes, corpus/eval requirements, and rollout-relevant thresholds (R1-3).
  - One approved Hebrew drift protection expansion specification defines drift taxonomy, corpus/metrics, CI gating requirements, and rollout-relevant thresholds (R1-4).
  - One approved release matrix and sign-off workflow specification defines stage evidence bundles, owner quorum, exception handling, and rollback/re-review logic (R1-5).
- **Execution status (repo-local implementation)**
  - CI now enforces added stage-aware gate scripts and release-matrix checklist wiring in repository workflow.
  - Observability repo-local implementation is completed for telemetry contract checks, trace query/summarization helpers, and evidence artifact generation.
  - Classifier robustness suites (R1-3) and Hebrew drift suites (R1-4) exist, run, and are wired into stage-gate scripts.
  - Release matrix/sign-off checklist logic (R1-5) is implemented repo-local as executable checklist gating script.
- **Remaining non-repo completion criteria (external)**
  - Durable production observability platform rollout (beyond local trace/pipeline proxies) must be operationalized.
  - Organization-level sign-off workflow execution (owner quorum process outside code) must be operationalized in release operations.
  - Provisional threshold finalization dependencies must be closed (complaint taxonomy/adjudication, shadow-grounding calibration).
- **Final R1 closure criteria**
  - All approved R1 specs are documented and implemented repo-locally with evidence artifacts, and external dependencies are explicitly tracked until closed.
  - P0 behavior remains intact: no P0 reopening, no UI redesign, no broad refactor unless required by approved gate enforcement.

## 9. R1-3 locked classifier robustness expansion spec (approved)

### 9.1 R1-3 objectives

- Expand deterministic classifier robustness coverage so rollout decisions are based on measured behavior, not spot checks.
- Cover the full failure surface across intent classification, scope resolution, semantic question classification, aggregate-vs-topic collisions, ambiguous/noisy/short phrasing, and adversarial near-miss prompts.
- Produce auditable evidence compatible with R1-1b stage gates (especially S2 -> S3 and S4+ readiness dependencies).
- Keep scope strictly test/evaluation and policy-level (no runtime behavior change in this phase plan).

### 9.2 exact failure classes to cover

- **Intent failure classes**
  - Wrong intent among valid intents (semantic confusion).
  - Over-triggered clarification intent on answerable phrasing.
  - Under-triggered clarification (unsafe confidence on weak phrasing).
  - Ambiguous dual-intent phrasing mapped incorrectly.
  - Keyword-bait near-miss causing wrong intent.
- **Scope resolution failure classes**
  - Wrong scope type (`topic` vs `subject` vs `executive`).
  - Wrong scope target within correct type (wrong topic/subject id).
  - Missing-clarification when clarification is required.
  - Over-clarification when anchor evidence exists.
  - Empty/short utterance continuity handling regressions.
- **Semantic question classification failure classes**
  - Aggregate question misclassified as non-aggregate.
  - Non-aggregate question misclassified as aggregate.
  - Wrong aggregate subclass (strongest vs hardest vs trend summary).
  - Near-synonym phrasing drift causing class miss.
- **Aggregate-vs-topic collision classes**
  - Topic-anchored wording containing aggregate cues (collision).
  - Aggregate wording containing topic token bait (collision inversion).
  - Selected context conflicts with utterance-level aggregate signal.
- **Ambiguous/noisy/short phrasing classes**
  - 1-2 token utterances.
  - Typos, punctuation noise, mixed casing/spacing.
  - Incomplete Hebrew colloquial phrasing.
  - Follow-up style shorthand relying on prior-turn context.
- **Adversarial near-miss classes**
  - Prompt forms crafted to trigger wrong classifier branch.
  - Lexical bait terms intentionally inserted to hijack scope/intent.
  - Contradictory cues in same utterance.
  - Paraphrase forms designed to evade existing regex/rule triggers.

### 9.3 test corpus design

- **Corpus partitions**
  - `gold_core`: canonical, unambiguous phrases (baseline sanity).
  - `edge_ambiguity`: ambiguous and underspecified phrasing.
  - `collision_set`: aggregate-vs-topic collision prompts.
  - `noisy_short`: short, typo/noise-heavy, colloquial prompts.
  - `adversarial_nearmiss`: crafted near-miss and bait prompts.
- **Coverage matrix dimensions**
  - intent x scope x semantic class.
  - with and without selected context.
  - with and without payload anchors.
  - deterministic-only vs async shadow classification readouts (comparability only).
- **Distribution targets**
  - At least 40% edge/adversarial samples.
  - Balanced class representation across aggregate subclasses and top intent families.
  - Separate holdout split (never used in iterative tuning).
- **Annotation rules**
  - Single canonical label per sample with explicit tie-break policy.
  - Rationale tag per label.
  - `clarification_required` treated as explicit target class where applicable.

### 9.4 labeled evaluation set requirements

- **Minimum labeled set sizes (hard requirement)**
  - Intent: >= 400 labeled utterances.
  - Scope: >= 300 labeled utterances.
  - Semantic class: >= 250 labeled utterances.
  - Collision subset: >= 150 dedicated samples.
  - Adversarial near-miss subset: >= 150 dedicated samples.
- **Quality requirements**
  - Dual annotation on >= 25% sample slice.
  - Inter-annotator agreement target: Cohen's kappa >= 0.85.
  - Disagreement adjudication log required for all conflicts.
- **Split policy**
  - 70% development eval and 30% locked holdout.
  - Holdout set frozen before final gate run.

### 9.5 CI/test expansion required

- Add dedicated R1-3 suites:
  - `classifier-edge-matrix-suite`
  - `scope-collision-suite`
  - `semantic-nearmiss-suite`
  - `short-noisy-phrasing-suite`
- Add one aggregate gate script:
  - `test:parent-rollout-stage:s2-classifier`
- CI wiring:
  - Run R1-3 suites in required stage gate job before promotion checks.
  - Persist machine-readable score artifact (JSON) per run.
  - Fail fast when labeled-set coverage minimums are not met.
- Deterministic regression suites remain mandatory and unchanged.

### 9.6 accuracy/robustness metrics to track

- **Primary accuracy**
  - Intent accuracy.
  - Scope accuracy.
  - Semantic class accuracy.
- **Robustness metrics**
  - Collision resolution accuracy (aggregate-vs-topic subset).
  - Adversarial near-miss accuracy.
  - Short/noisy phrasing accuracy.
  - Clarification precision/recall for weak/ambiguous prompts.
- **Stability metrics**
  - False clarification rate on answerable prompts.
  - False confident classification rate on ambiguous prompts.
  - Per-class worst-bin accuracy (prevents average-only masking).
- **Reporting requirements**
  - Macro + micro averages.
  - Per-class confusion matrix.
  - Delta vs prior approved baseline.

### 9.7 pass/fail thresholds for rollout relevance

- **Intent accuracy**
  - Pass: >= 97%
  - Fail: < 95%
  - Conditional band: 95.0-96.9%
- **Scope accuracy**
  - Pass: >= 98%
  - Fail: < 96%
  - Conditional band: 96.0-97.9%
- **Semantic class accuracy**
  - Pass: >= 96%
  - Fail: < 94%
  - Conditional band: 94.0-95.9%
- **Collision subset accuracy**
  - Pass: >= 95%
  - Fail: < 92%
- **Adversarial near-miss accuracy**
  - Pass: >= 94%
  - Fail: < 90%
- **Short/noisy subset accuracy**
  - Pass: >= 93%
  - Fail: < 89%
- **False confident classification on ambiguity**
  - Pass: <= 3%
  - Fail: > 6%
- **False clarification on answerable prompts**
  - Pass: <= 8%
  - Fail: > 12%

### 9.8 recommended execution order

1. Lock taxonomy of failure classes and annotation guidelines.
2. Build labeled corpus partitions and freeze holdout set.
3. Define evaluation harness specs and score artifact schema.
4. Define CI gate contract for R1-3 suites and stage promotion coupling.
5. Run pilot evaluation on baseline branch and produce first benchmark.
6. Calibrate threshold exception policy usage boundaries (without changing thresholds).
7. Publish final R1-3 gate package for S2/S3 decision board.

### 9.9 definition of done for R1-3

- Failure class catalog is complete and approved for all scoped classifier surfaces.
- Labeled evaluation sets meet minimum sizes, quality checks, and holdout freeze rules.
- CI gate design includes mandatory R1-3 suites and machine-readable score artifacts.
- All R1-3 metrics are defined with exact formulas and reporting format.
- Pass/fail thresholds are explicit and mapped to rollout decision impact.
- R1-3 evidence package is ready for stage gate use, with no code/runtime changes introduced in this planning step.

## 10. R1-1 and R1-1b locked operational rollout gate spec (approved)

### 10.1 stage list

- S1 deterministic internal
- S2 deterministic beta
- S3 broad deterministic rollout
- S4 async/LLM shadow
- S5 async/LLM limited beta
- S6 async/LLM broad rollout

### 10.2 stage-by-stage threshold table (operational)

- **S1 deterministic internal**
  - **Test integrity**
    - metric: required S1 suite pass rate
    - pass: 100%
    - fail: any required test fails
    - measure: CI status
    - window/sample: 1 full run per candidate commit
    - mitigation: not allowed for critical suites
    - exception approver: none
  - **Deterministic safety**
    - metric: `validatorStatus=fail` in deterministic resolved turns
    - pass: <= 1.0%
    - fail: > 2.0%
    - measure: turn telemetry validator status
    - window/sample: >= 300 resolved deterministic turns
    - mitigation: allowed with RCA + hotfix ticket
    - exception approver: Eng Lead
  - **Clarification stability**
    - metric: `clarification_required` rate on non-empty utterances
    - pass: <= 12%
    - fail: > 18%
    - measure: telemetry `resolutionStatus` + utterance length > 1
    - window/sample: >= 300 turns
    - mitigation: allowed
    - exception approver: Eng Lead + QA Lead
  - **Telemetry completeness**
    - metric: required trace fields presence
    - pass: 100% completeness
    - fail: < 100%
    - measure: schema completeness check
    - window/sample: >= 300 events
    - mitigation: not allowed
    - exception approver: none

- **S2 deterministic beta**
  - **Regression integrity**
    - metric: required S1+S2 suites
    - pass: 100% in 2 consecutive runs
    - fail: any failure in either run
    - measure: CI history
    - window/sample: 2 full consecutive runs
    - mitigation: only for minor flaky test, max 1 rerun
    - exception approver: Eng Lead + QA Lead
  - **Intent accuracy**
    - pass >= 97%, fail < 95%
    - measure: labeled offline eval
    - window/sample: >= 400 labeled utterances
    - mitigation: allowed in 95.0-96.9%
    - exception approver: Eng Lead + Product Lead
  - **Scope accuracy**
    - pass >= 98%, fail < 96%
    - measure: labeled offline eval
    - window/sample: >= 300 labeled utterances
    - mitigation: allowed in 96.0-97.9%
    - exception approver: Eng Lead + Product Lead
  - **Semantic class accuracy**
    - pass >= 96%, fail < 94%
    - measure: labeled offline eval
    - window/sample: >= 250 labeled utterances
    - mitigation: allowed in 94.0-95.9%
    - exception approver: Eng Lead + Product Lead
  - **Hebrew leakage guard**
    - metric: forbidden/internal token leakage in parent output
    - pass: 0 occurrences
    - fail: >= 1 occurrence
    - measure: Hebrew drift suite + sampled output scan
    - window/sample: >= 500 generated responses
    - mitigation: not allowed
    - exception approver: none

- **S3 broad deterministic rollout**
  - **Production readiness bundle**
    - metric: S2 gates + on-call runbook completeness
    - pass: binary complete
    - fail: any missing required checkpoint
    - measure: release checklist audit
    - window/sample: 1 release candidate review
    - mitigation: not allowed
    - exception approver: none
  - **Observability ingest success** (finalized in section 11)
    - pass: >= 99.7%
    - fail: < 99.3%
    - measure: accepted-to-durable success ratio
    - window/sample: rolling 7 days, >= 100,000 events
    - mitigation: allowed in 99.3-99.69% with incident action plan
    - exception approver: Eng Lead + Ops Lead
  - **Diagnostic trace retrieval latency** (finalized in section 11)
    - pass: P95 <= 2 minutes
    - fail: P95 > 5 minutes
    - measure: trace retrieval query timing
    - window/sample: rolling 7 days, >= 500 queries
    - mitigation: allowed in 2-5 minutes with mitigation timeline
    - exception approver: Ops Lead
  - **Deterministic fallback safety**
    - metric: critical invalid resolved responses in canary
    - pass: 0
    - fail: >= 1
    - measure: guardrail validation + incident logs
    - window/sample: 7-day canary, >= 5,000 turns
    - mitigation: not allowed
    - exception approver: none

- **S4 async/LLM shadow**
  - **Gate enforcement**
    - metric: LLM call attempted while gate disabled
    - pass: 0 occurrences
    - fail: >= 1 occurrence
    - measure: telemetry `llmAttempt` + gate reason codes
    - window/sample: >= 2,000 shadow-eligible turns
    - mitigation: not allowed
    - exception approver: none
  - **Kill-switch reliability**
    - metric: force deterministic effectiveness
    - pass: 100%
    - fail: < 100%
    - measure: CI + runtime drills
    - window/sample: 3 forced drills + CI
    - mitigation: not allowed
    - exception approver: none
  - **Shadow safety delta**
    - metric: net new critical class vs deterministic baseline
    - pass: 0 net new critical classes
    - fail: >= 1 net new critical class
    - measure: side-by-side adjudication
    - window/sample: >= 1,000 paired comparisons
    - mitigation: not allowed
    - exception approver: none
  - **Shadow grounding**
    - metric: mean groundedness score
    - pass: >= 85
    - fail: < 80
    - measure: telemetry + manual spot audit
    - window/sample: >= 1,000 shadow attempts
    - mitigation: allowed in 80-84.9 with remediation plan
    - exception approver: AI Safety Reviewer + Eng Lead

- **S5 async/LLM limited beta**
  - **Suite integrity**
    - metric: S1-S4 required tests
    - pass: 100% pass
    - fail: any failure
    - measure: CI
    - window/sample: 2 consecutive release runs
    - mitigation: not allowed
    - exception approver: none
  - **LLM guardrail hard-fail rate**
    - metric: `llm_draft_validator_fail` / LLM attempts
    - pass: <= 3.0%
    - fail: > 5.0%
    - measure: telemetry `llmAttempt.reason`
    - window/sample: >= 2,000 LLM attempts over 14 days
    - mitigation: allowed in 3.01-5.0% with capped exposure <= 10%
    - exception approver: Eng Lead + Product Lead
  - **LLM fallback rate**
    - pass: <= 15%
    - fail: > 22%
    - measure: path outcomes
    - window/sample: >= 2,000 LLM attempts over 14 days
    - mitigation: allowed in 15.01-22% with expansion hold
    - exception approver: Eng Lead
  - **Critical incident rate**
    - metric: critical safety/language incidents
    - pass: 0 per 10,000 turns
    - fail: >= 1 per 10,000 turns
    - measure: incident board classification
    - window/sample: >= 10,000 beta turns over 14 days
    - mitigation: not allowed
    - exception approver: none
  - **Confirmed complaint rate** (provisional; see section 10.7 + section 11)
    - pass: <= 0.5%
    - fail: > 1.0%
    - measure: validated support tickets/feedback
    - window/sample: >= 2,000 beta parent interactions
    - mitigation: allowed in 0.51-1.0% with corrective sprint
    - exception approver: Product Lead + Support Lead

- **S6 async/LLM broad rollout**
  - **Stability gate**
    - metric: S5 KPIs remain green
    - pass: all pass through full window
    - fail: any fail-threshold hit
    - measure: KPI dashboard + weekly gate review
    - window/sample: 28 consecutive days, >= 50,000 turns
    - mitigation: not allowed for critical metrics
    - exception approver: none
  - **Critical incident persistence**
    - metric: unresolved critical incidents > 24h
    - pass: 0
    - fail: >= 1
    - measure: incident SLA tracking
    - window/sample: continuous during 28-day window
    - mitigation: not allowed
    - exception approver: none
  - **Executive release gate**
    - metric: formal release board decision
    - pass: binary GO by required owners
    - fail: any NO-GO vote from required owner set
    - measure: signed release decision record
    - window/sample: final release review
    - mitigation: not allowed
    - exception approver: Executive release authority

### 10.3 KPI definitions

- Required test pass rate = passed required suites / total required suites.
- Deterministic validator fail rate = deterministic resolved turns with `validator.status=fail` / all resolved deterministic turns.
- Clarification rate = turns with `resolutionStatus=clarification_required` and utterance length > 1 / all non-empty turns.
- Telemetry completeness = events with all mandatory fields / total events.
- Intent/scope/semantic accuracy = correct labeled predictions / total labeled samples.
- Hebrew leakage count = outputs containing forbidden/internal tokens.
- Telemetry ingest success = accepted telemetry events / emitted telemetry events.
- Diagnostic trace retrieval latency = P95 time to retrieve trace-level evidence by trace/query key.
- LLM gate bypass count = LLM attempts when gate should have blocked.
- Kill-switch effectiveness = blocked LLM attempts under force-deterministic / total eligible attempts under force-deterministic.
- LLM guardrail hard-fail rate = `llm_draft_validator_fail` / total LLM attempts.
- LLM fallback rate = attempts ending in deterministic fallback / total LLM attempts.
- Critical incident rate = critical incidents per 10,000 relevant turns.
- Confirmed complaint rate = validated quality complaints / total parent interactions.

### 10.4 severity definitions

- **Critical**
  - Safety/compliance breach, gate bypass, kill-switch failure, or observability gap that blocks RCA.
  - Rule: always blocking, no mitigation path for promotion.
- **Major**
  - Significant quality regression without critical safety breach.
  - Rule: blocking unless mitigation is explicitly allowed for that gate.
- **Minor**
  - Isolated non-systemic issue with low user impact.
  - Rule: non-blocking if tracked with owner and due date.

### 10.5 exception policy

- **No-exception gates**
  - Any critical incident threshold breach.
  - Gate bypass > 0.
  - Kill-switch effectiveness < 100%.
  - Hebrew forbidden/internal leakage > 0 for deterministic/beta release gates.
  - Required-suite failure in release candidate runs.
- **Exception-eligible gates**
  - Requires written RCA, containment plan, owner, due date, re-measurement date.
  - Exception validity: max 14 days or until next stage review (earlier wins).
  - Max concurrent active exceptions per stage: 2.
- **Approval hierarchy**
  - Technical exception: Eng + QA/Product as stage defines.
  - Safety-related exception: AI Safety reviewer mandatory.
  - No exception can override no-exception gates.

### 10.6 final operational gate checklist

- **Before stage review**
  - All required suites run for target stage.
  - KPI report produced for required window/sample.
  - Severity-classified issue list updated (critical/major/minor).
  - Exception log prepared (must be empty for no-exception gates).
- **At stage review**
  - Mark each gate: PASS / FAIL / EXCEPTION-APPROVED.
  - Verify no critical gate failed.
  - Verify exception count <= 2 and exception validity window.
- **Decision**
  - Promote only if all gates pass or have valid allowed exceptions.
  - Any no-exception gate fail => automatic NO-GO.
  - NO-GO requires immediate rollback trigger procedure and re-review scheduling.
- **Post-decision**
  - Signed decision record with required approvers.
  - Snapshot of metrics/tests used.
  - Explicit next-stage entry criteria and earliest re-evaluation date.

### 10.7 unresolved provisional thresholds carried from R1-1b

- Confirmed complaint rate thresholds (S5+) remain provisional until complaint taxonomy and support adjudication workflow are finalized.
- Shadow grounding thresholds remain provisional until calibrated human-judged benchmark set and rubric lock are complete.

## 11. R1-2 locked production observability target design (approved)

### 11.1 observability objectives

- Replace temporary `localStorage` turn traces with durable, queryable, auditable production observability for S3+.
- Preserve and extend P0 traceability fields: intent/scope reasons, generation path, fallback reasons, validator outcomes, and LLM gate outcomes.
- Support deterministic broad rollout (S3), async shadow (S4), and async limited/broad rollout (S5/S6).
- Enable fast incident triage with deterministic replay context while avoiding parent PII leakage.
- Provide SLO-backed telemetry quality and availability for rollout gate decisions.

### 11.2 required telemetry events and schema

- **Event families**
  - `copilot.turn.completed`
  - `copilot.turn.validation`
  - `copilot.turn.fallback`
  - `copilot.llm.attempt`
  - `copilot.pipeline.error`
  - `copilot.incident.annotation`
- **Canonical envelope**
  - `eventId`, `eventType`, `schemaVersion`, `eventTsUtc`, `receivedTsUtc`
  - `env`, `rolloutStage`, `service`, `buildVersion`, `gitSha`
  - `sessionIdHashed`, `requestId`, `traceId`, `turnId`
  - `privacyClass`, `samplingRate`
- **Required payload (turn completed)**
  - `resolutionStatus`, `generationPath`, `fallbackUsed`
  - `intent.value/reason/confidence`
  - `scope.type/id/reason/confidence`
  - `semanticAggregateSatisfied`
  - `validator.status`, `validator.failCodes`
  - `fallbackReasonCodes`
  - `quality.groundednessScore`, `quality.genericnessScore`
  - `latencyMs.total/validation/composition`
  - `llmAttempt` (nullable with `ok/reason/provider/gateReasonCodes`)
- **Schema governance**
  - Versioned schema registry; additive changes only within major.
  - Breaking change requires major bump + dual-parse migration window.
  - CI schema validation required for producers.

### 11.3 ingestion architecture

- Emitters -> Telemetry Ingest API -> Message bus/stream -> Consumers.
- **Ingest API**
  - Authenticated HTTPS ingest.
  - Idempotency by `eventId`.
  - Ack after auth + schema validation.
  - Batch ingest support + payload limits.
- **Stream layer**
  - Partition by service + date bucket.
  - Retry with exponential backoff.
  - DLQ for malformed/unprocessable events.
- **Data quality pipeline**
  - Real-time checks for schema-valid rate, completeness, late arrival, duplicate rate.

### 11.4 storage architecture

- **Hot store** (30 days): fast query/aggregation for incidents + KPI dashboards.
- **Warm store** (180 days): lower-cost queryable investigation history.
- **Cold archive** (400 days): immutable audit snapshots.
- **Data model**
  - Append-only partitioned events (`eventDate`, `env`, `rolloutStage`, `eventType`).
  - Materialized views for stage KPI rollups, gate decisions, incident correlation.
- **Privacy**
  - No raw parent text in standard telemetry.
  - Hashed/tokenized identifiers.
  - Restricted payload segregated and encrypted.

### 11.5 retention policy

- Turn/validation/fallback/llm-attempt events:
  - hot 30 days, warm 180 days, archive 400 days.
- Pipeline error + incident annotation:
  - hot 90 days, warm 365 days, archive 730 days.
- Aggregated KPI rollups retained for 24 months.
- Automated TTL enforcement with legal-hold override (security/compliance only).

### 11.6 query/investigation workflow

1. Start with `requestId`/`traceId`/`sessionIdHashed` + time range.
2. Pull `copilot.turn.completed`.
3. Expand to sibling `validation`/`fallback`/`llm.attempt` by `turnId`/`traceId`.
4. Compare to stage baseline for same env + 24h window.
5. Classify severity and attach `incident.annotation`.
6. Produce RCA packet with evidence and gate impact.

- **Operational query requirements**
  - Trace retrieval P95 <= 2 minutes (finalized).
  - KPI dashboard refresh lag <= 5 minutes pass, > 10 minutes fail.
  - Incident evidence packet generation <= 10 minutes.

### 11.7 alerting and incident support requirements

- Alerts required for ingest failure breach, schema-invalid rate, missing-field rate, gate bypass indicators, and critical incident markers.
- Routing:
  - P1/P0 -> on-call engineering + product owner immediate.
  - P2 -> engineering channel + daily triage queue.
- Incident support:
  - 24/7 on-call for S3+.
  - Runbook mandatory (triage, rollback, communications).
  - Critical alert must be owner-assigned with evidence query within 15 minutes.

### 11.8 access model and ownership

- **Roles**
  - ObservabilityAdmin
  - CopilotEngineer
  - QA/ProductAnalyst
  - ExecutiveReviewer
- **Controls**
  - Least-privilege RBAC.
  - Production access requires named account + MFA.
  - Restricted fields require explicit entitlement.
- **Ownership**
  - Parent Copilot Eng Lead: signal correctness.
  - Observability/Infra Lead: pipeline reliability.
  - Product + QA release board: gate decision governance.

### 11.9 migration path from local trace store

- **M1 (shadow emit)**
  - Keep local trace store.
  - Add production pipeline emit in parallel.
  - Validate schema/field parity.
- **M2 (gate-read migration)**
  - Rollout decisions read from production observability only.
  - Local store remains internal debug fallback.
- **M3 (deprecate local for gates)**
  - Local store removed from release-gate evidence requirements.
  - Optional local diagnostic mode may remain behind internal flag.
- **Migration acceptance criteria**
  - 14-day parity window:
    - required field parity >= 99.9%
    - event count parity >= 99.5%
    - no critical missing trace joins for investigated incidents

### 11.10 thresholds finalized by R1-2 design

- **Finalized**
  - Telemetry ingest success (S3+):
    - pass >= 99.7%
    - fail < 99.3%
    - rolling 7 days, >= 100,000 events
  - Diagnostic trace retrieval latency (S3+):
    - pass P95 <= 2 minutes
    - fail P95 > 5 minutes
    - rolling 7 days, >= 500 queries
  - KPI dashboard freshness:
    - pass <= 5 minute lag
    - fail > 10 minute lag
    - rolling 7 days
- **Still provisional**
  - Confirmed complaint rate thresholds (pending support taxonomy/adjudication finalization).
  - Shadow grounding thresholds (pending calibrated human-judged benchmark finalization).

## 12. R1-4 locked Hebrew drift protection expansion spec (approved)

### 12.1 R1-4 objectives

- Protect parent-facing Hebrew quality against post-P0 drift beyond the specific leak/fallback fixes already completed.
- Define auditable drift classes, measurable quality metrics, and rollout-relevant thresholds for deterministic and async-related surfaces.
- Ensure Hebrew quality gates are enforceable in CI and release decisions (S2/S3 deterministic relevance; S4+ compatibility).
- Keep scope strictly planning/specification for R1-4 (no runtime wording changes in this planning step).

### 12.2 exact Hebrew drift classes to cover

- **Robotic phrasing drift**
  - Template-heavy repetitive constructions that reduce natural parent tone.
  - Mechanical connectors repeated across blocks/turns.
- **Internal/system wording leakage**
  - Internal tokens, enum keys, system labels, or technical jargon appearing in parent-facing text.
  - English/system code fragments leaking to Hebrew output.
- **Repetition drift**
  - High n-gram reuse within answer and across consecutive turns.
  - Redundant sentence openings and repeated caution blocks without informational gain.
- **Over-authoritative wording drift**
  - Deterministic/absolute claims beyond evidence envelope.
  - Diagnostic certainty language that violates hedge policy.
- **Insufficiency wording drift**
  - Under-specified insufficiency messages that are vague/empty.
  - Excessive insufficiency usage when sufficient evidence exists.
- **Normalization-induced semantic drift**
  - Meaning shift introduced by normalization layer.
  - Hedge/caution polarity changed by normalization substitutions.
- **Mixed-register drift**
  - Unstable tone register (too formal/too colloquial) across parent-facing outputs.
- **Cross-path consistency drift**
  - Different wording quality standards between deterministic answers, fallback answers, semantic aggregate answers, and async-shadow drafts.

### 12.3 test corpus/sample design

- **Corpus partitions**
  - `he_parent_gold`: approved high-quality parent-facing Hebrew references.
  - `he_drift_negative`: known bad patterns (robotic/leakage/over-authoritative/semantic drift).
  - `he_insufficiency_cases`: insufficient-data scenarios with expected wording constraints.
  - `he_normalization_pairs`: before/after normalization pairs with meaning-preservation labels.
  - `he_turn_repetition_sequences`: multi-turn sequences to evaluate repetition drift.
- **Sampling dimensions**
  - Deterministic path outputs.
  - Fallback path outputs.
  - Semantic aggregate outputs.
  - Async shadow outputs (evaluation-only for quality tracking).
- **Coverage minimums**
  - >= 600 total evaluated outputs per full gate run.
  - >= 120 outputs per partition.
  - >= 150 sequence-level turn samples for repetition checks.
- **Annotation protocol**
  - Dual annotation on >= 30% of corpus.
  - Mandatory adjudication on all critical/major disagreements.
  - Label each sample by drift class + severity + expected correction intent.

### 12.4 quality metrics to track

- **Roboticity score**
  - Percent of outputs exceeding repetitive-template threshold.
- **Leakage rate**
  - Internal/system token leakage occurrences per 1,000 outputs.
- **Repetition score**
  - Intra-turn and cross-turn repetition ratios (n-gram reuse and repeated lead phrases).
- **Authority safety rate**
  - Over-authoritative wording violations per 1,000 outputs.
- **Insufficiency precision/recall**
  - Precision: insufficiency phrasing only when evidence is actually insufficient.
  - Recall: insufficiency phrasing present when insufficiency is required.
- **Normalization semantic preservation rate**
  - Percentage of normalization pairs where meaning/hedge intent is preserved.
- **Parent fluency score (human-judged)**
  - Likert-based fluency/tone score normalized to 0-100.
- **Path consistency score**
  - Variance in quality metrics across deterministic/fallback/semantic/async-shadow paths.

### 12.5 CI/test expansion required

- Add dedicated R1-4 suites:
  - `parent-hebrew-drift-suite`
  - `parent-hebrew-normalization-semantic-parity-suite`
  - `parent-hebrew-repetition-sequence-suite`
  - `parent-hebrew-authority-insufficiency-balance-suite`
- Add aggregate gate script:
  - `test:parent-rollout-stage:s2-hebrew-drift`
- CI wiring requirements:
  - Run Hebrew drift suites before rollout gate promotion checks.
  - Persist machine-readable quality artifact (JSON) with per-class drift outcomes.
  - Fail fast on any critical Hebrew drift class breach.
  - Preserve and continue running existing P0 Hebrew self-test suites unchanged.

### 12.6 pass/fail thresholds for rollout relevance

- **Roboticity drift rate**
  - pass: <= 6%
  - fail: > 10%
  - conditional: 6.01-10.0%
- **Internal/system leakage rate**
  - pass: 0 per 1,000 outputs
  - fail: >= 1 per 1,000 outputs
  - conditional: none (hard gate)
- **Repetition drift rate (sequence-level)**
  - pass: <= 8%
  - fail: > 12%
  - conditional: 8.01-12.0%
- **Over-authoritative violation rate**
  - pass: 0 critical; <= 2 major per 1,000 outputs
  - fail: >= 1 critical or > 5 major per 1,000 outputs
  - conditional: 2.01-5.0 major per 1,000 outputs with zero critical
- **Insufficiency precision**
  - pass: >= 95%
  - fail: < 90%
  - conditional: 90.0-94.9%
- **Insufficiency recall**
  - pass: >= 97%
  - fail: < 93%
  - conditional: 93.0-96.9%
- **Normalization semantic preservation**
  - pass: >= 99%
  - fail: < 97%
  - conditional: 97.0-98.9%
- **Parent fluency score**
  - pass: >= 85/100
  - fail: < 78/100
  - conditional: 78-84.9
- **Path consistency variance**
  - pass: max inter-path metric delta <= 5 points
  - fail: > 9 points
  - conditional: 5.01-9.0 points

### 12.7 recommended execution order

1. Lock drift taxonomy and severity rubric for all Hebrew drift classes.
2. Build and freeze R1-4 corpus partitions and annotation protocol.
3. Define metric formulas and artifact schema for CI-consumable drift reports.
4. Define CI gate contract for R1-4 suites and promotion coupling.
5. Run baseline dry evaluation and publish first Hebrew drift benchmark.
6. Calibrate conditional-band exception handling without changing hard fail criteria.
7. Publish final R1-4 gate package for stage decision board usage.

### 12.8 definition of done for R1-4

- Drift class catalog is complete and approved for roboticity, leakage, repetition, authority, insufficiency, and normalization semantic drift.
- Corpus design, coverage minimums, and annotation/adjudication rules are locked.
- CI gate design includes mandatory R1-4 suites and machine-readable quality artifacts.
- All Hebrew drift metrics are defined with explicit formulas and rollout-relevant thresholds.
- Pass/fail/conditional thresholds are explicit and linked to stage promotion logic.
- R1-4 evidence package is ready for gate use, with no code/runtime changes introduced in this planning step.

## 13. R1-5 locked release matrix wiring and sign-off checklist spec (approved)

### 13.1 R1-5 objectives

- Define one final stage-by-stage release decision matrix that operationally binds R1-1/R1-1b gates, R1-2 observability readiness, R1-3 classifier robustness evidence, and R1-4 Hebrew drift evidence.
- Define a deterministic sign-off workflow with explicit owners, artifacts, and decision states (GO/NO-GO/HOLD).
- Define uniform exception/waiver handling and re-review logic to prevent ad-hoc promotion decisions.
- Keep scope strictly planning/specification for R1-5 (no CI/runtime wiring implementation in this step).

### 13.2 release matrix by stage

- **S1 deterministic internal**
  - Decision purpose: internal readiness to enter deterministic beta gate process.
  - Must satisfy: S1 gate set from section 10.2 + baseline telemetry completeness requirements.
  - Decision states: GO, NO-GO, HOLD (HOLD allowed only for exception-eligible major items).
- **S2 deterministic beta**
  - Decision purpose: controlled beta validation readiness.
  - Must satisfy: S2 gate set from section 10.2 + R1-3 classifier evidence + R1-4 Hebrew drift evidence.
  - Decision states: GO, NO-GO, HOLD.
- **S3 broad deterministic rollout**
  - Decision purpose: broad deterministic release authorization.
  - Must satisfy: S3 gates + R1-2 observability readiness finalized thresholds + completed deterministic evidence bundle.
  - Decision states: GO, NO-GO (HOLD max 7 days only if no critical/no-exception gate breach).
- **S4 async/LLM shadow**
  - Decision purpose: non-parent-visible async shadow enablement.
  - Must satisfy: S4 gates + observability parity for async telemetry + shadow safety delta evidence.
  - Decision states: GO, NO-GO, HOLD.
- **S5 async/LLM limited beta**
  - Decision purpose: limited parent-visible async beta.
  - Must satisfy: S5 gates + adjudicated failure taxonomy + readiness review package.
  - Decision states: GO, NO-GO (HOLD allowed only once per release candidate).
- **S6 async/LLM broad rollout**
  - Decision purpose: broad async/LLM production release.
  - Must satisfy: S6 gates + sustained KPI window + executive final release review.
  - Decision states: GO, NO-GO (no HOLD at final board if critical items unresolved).

### 13.3 required evidence bundle per stage

- **Common evidence bundle (all stages)**
  - Current stage gate report (PASS/FAIL/EXCEPTION per gate).
  - CI artifact set for required suites.
  - Severity-classified open issues list (critical/major/minor).
  - Exception register snapshot (if any).
  - Diff-to-previous-stage summary.
- **Stage-specific additions**
  - **S1**: deterministic baseline regression evidence + telemetry completeness report.
  - **S2**: R1-3 classifier robustness report + R1-4 Hebrew drift report.
  - **S3**: R1-2 observability readiness report + on-call/runbook readiness checklist.
  - **S4**: async shadow comparison report (deterministic vs async outcomes) + gate bypass audit.
  - **S5**: limited beta KPI pack + incident adjudication board output + complaint analysis pack.
  - **S6**: 28-day sustained KPI report + executive decision packet + rollback readiness attestation.

### 13.4 sign-off workflow / owners

- **Workflow steps**
  1. Evidence assembly by engineering owner.
  2. Technical validation review (QA + engineering).
  3. Safety/language review (AI safety + language quality owner where relevant).
  4. Operations/observability readiness review (S3+ mandatory).
  5. Stage decision board vote and signed outcome.
- **Owner map**
  - Engineering owner: Parent Copilot Eng Lead.
  - QA owner: QA Lead.
  - Product owner: Product Lead.
  - Observability/ops owner (S3+): Observability/Infra Lead + Operations Lead.
  - Safety owner (S4+): AI Safety Reviewer.
  - Language quality owner (S2+): Hebrew quality reviewer.
  - Final authority:
    - S1-S5: Stage decision board (required owner set quorum).
    - S6: Executive release authority.
- **Quorum rule**
  - A stage decision is valid only if all required owners for that stage sign.
  - Missing mandatory signer => automatic NO-GO/HOLD (depending on stage rules).

### 13.5 exception and waiver handling

- Exception handling follows section 10.5 no-exception vs exception-eligible gate policy.
- **Waiver packet mandatory fields**
  - Gate ID, breached threshold, severity class, RCA summary, containment plan, owner, deadline, re-measurement window.
- **Waiver validity**
  - Max 14 days or until next stage review, whichever is earlier.
  - Max active waivers per stage: 2.
- **Non-waivable conditions**
  - Any no-exception gate breach (critical incidents, gate bypass, kill-switch failure, leakage hard gate, required suite failure).
- **Waiver approvers**
  - Technical quality waivers: Eng Lead + QA Lead (+ Product Lead where stage requires).
  - Safety-related waivers: AI Safety Reviewer mandatory co-approval.
  - Executive override is not allowed for no-exception gates.

### 13.6 re-review / rollback decision flow

- **Automatic NO-GO triggers**
  - Any no-exception gate failure.
  - Missing mandatory evidence artifact.
  - Missing mandatory signer/quorum.
- **HOLD triggers**
  - Conditional-band breach eligible for waiver with complete waiver packet.
  - Incomplete but recoverable evidence with no critical/no-exception breach.
- **Rollback flow (if post-promotion failure occurs)**
  1. Trigger immediate rollback policy from section 10 (force deterministic where applicable).
  2. Open incident record with severity classification.
  3. Freeze further stage promotions.
  4. Re-run required stage evidence window after corrective actions.
  5. Re-review at same stage; no automatic stage skip is allowed.
- **Re-review window**
  - Standard: within 5 business days after corrective action completion.
  - Critical rollback events: re-review only after incident board closure and explicit safety sign-off.

### 13.7 definition of done for R1-5

- Final release matrix exists in canonical form for S1-S6 with explicit decision states and stage requirements.
- Required evidence bundles are defined per stage with common and stage-specific artifacts.
- Sign-off workflow defines owner responsibilities, quorum, and final decision authority.
- Exception/waiver policy is operationally linked to R1-1b gate rules and no-exception boundaries.
- Re-review/rollback flow is explicit, auditable, and stage-locked (no skip logic).
- R1-5 package is ready for implementation wiring, with no code/runtime/UI changes introduced in this planning step.

## 14. R1 final implementation closure sync (repo-local)

### 14.1 implementation status

- R1-1/R1-1b/R1-2/R1-3/R1-4/R1-5 are implemented **repo-local** in executable scripts/wiring.
- Plan/spec sections remain the policy source; this section records implementation closure evidence.

### 14.2 files changed (R1 implementation wave)

- Runtime/contract:
  - `utils/parent-copilot/telemetry-store.js` (enhanced)
  - `utils/parent-copilot/telemetry-contract-v1.js` (new)
- CI/package wiring:
  - `package.json` (new stage and suite scripts)
  - `.github/workflows/parent-report-tests.yml` (new stage-gate/checklist steps)
- Shared rollout/helpers:
  - `scripts/rollout-artifacts-lib.mjs` (new)
  - `scripts/parent-copilot-test-fixtures.mjs` (new)
- R1-3 classifier robustness suites:
  - `scripts/parent-copilot-classifier-edge-matrix-suite.mjs` (new)
  - `scripts/parent-copilot-scope-collision-suite.mjs` (new)
  - `scripts/parent-copilot-semantic-nearmiss-suite.mjs` (new)
  - `scripts/parent-copilot-short-noisy-phrasing-suite.mjs` (new)
- R1-4 Hebrew drift suites:
  - `scripts/parent-hebrew-drift-suite.mjs` (new)
  - `scripts/parent-hebrew-normalization-semantic-parity-suite.mjs` (new)
  - `scripts/parent-hebrew-repetition-sequence-suite.mjs` (new)
  - `scripts/parent-hebrew-authority-insufficiency-balance-suite.mjs` (new)
- R1-2/R1-5 gate/checklist suites:
  - `scripts/parent-copilot-observability-contract-suite.mjs` (new)
  - `scripts/parent-rollout-stage-s2-classifier-gate.mjs` (new)
  - `scripts/parent-rollout-stage-s2-hebrew-drift-gate.mjs` (new)
  - `scripts/parent-rollout-stage-s3-observability-gate.mjs` (new)
  - `scripts/parent-rollout-release-matrix-checklist.mjs` (new)

### 14.3 suites added and validated

- Added runnable suite/gate entrypoints:
  - `test:parent-rollout-stage:s2-classifier`
  - `test:parent-rollout-stage:s2-hebrew-drift`
  - `test:parent-rollout-stage:s3-observability`
  - `test:parent-rollout-release-matrix`
  - plus all newly added underlying classifier/hebrew/observability suites.
- Executed and green in repo-local run:
  - S2 classifier stage gate
  - S2 Hebrew drift stage gate
  - S3 observability stage gate
  - release matrix checklist (S3 with required signoff env values)
  - regression suites: phaseA, async-llm-gate, telemetry-trace, parent-report-phase6, diagnostic-engine-v2-harness.

### 14.4 CI changes (implemented)

- Workflow now runs stage gates before build:
  - `test:parent-rollout-stage:s2-classifier`
  - `test:parent-rollout-stage:s2-hebrew-drift`
  - `test:parent-rollout-stage:s3-observability`
  - `test:parent-rollout-release-matrix` (with S3 signoff env variables in workflow).

### 14.5 observability repo-local implementation status

- Completed repo-local:
  - telemetry event contract validator (`telemetry-contract-v1`)
  - telemetry append validation + query + summarization helpers
  - observability contract suite + S3 observability gate script + artifact generation/check.
- Not completed in repo-local scope (external):
  - full production ingest/storage/query/alert infrastructure rollout.

### 14.6 remaining external blockers only

- Production observability platform operationalization outside this repo (durable services + ops SLO governance).
- Organizational sign-off workflow execution outside code (owner quorum process in release operations).
- Finalization of provisional thresholds that depend on external calibration/process:
  - complaint taxonomy/adjudication finalization,
  - shadow-grounding benchmark/rubric calibration.