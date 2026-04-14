---
name: Hebrew Audio Final Completion Plan (Post Build 1)
overview: Finalize a Hebrew-only audio completion roadmap from existing Build 1 to full Hebrew audio close, while hardening shared platform capabilities that remain English-ready but not activated.
todos:
  - id: build2-hebrew-audio-breadth
    content: Plan Build 2 delivery for Hebrew phonological, richer listening, and read-aloud-short tasks with manual-first speaking boundaries.
    status: completed
  - id: build3-workflow-hardening
    content: Plan durable upload, review queue states, privacy retention, and moderation pipeline hardening.
    status: completed
  - id: final-scoring-boundaries
    content: Define final safe/borderline/manual-only scoring enforcement with explicit forbidden auto-score classes.
    status: completed
  - id: verification-suite-final
    content: Define full shared + Hebrew verification matrix and regression boundaries to gate freeze.
    status: completed
  - id: freeze-gates
    content: Define strict exit criteria for Hebrew audio close and English-ready shared platform status without English activation.
    status: completed
isProject: false
---

# Hebrew Audio Final Completion Plan (Post Build 1)

## A. Current state after Build 1

- **Already implemented (usable baseline)**
  - Shared audio contract and routing in [`utils/audio-task-contract.js`](utils/audio-task-contract.js).
  - Shared playback service in [`utils/audio-playback-core.js`](utils/audio-playback-core.js).
  - Shared short recording capture in [`utils/audio-recording-core.js`](utils/audio-recording-core.js).
  - Local artifact persistence in [`utils/audio-submission-store.js`](utils/audio-submission-store.js).
  - Hebrew Build 1 task attachment in [`utils/hebrew-audio-build1.js`](utils/hebrew-audio-build1.js).
  - Hebrew UI panel integration in [`components/HebrewAudioBuild1Panel.js`](components/HebrewAudioBuild1Panel.js) and [`pages/learning/hebrew-master.js`](pages/learning/hebrew-master.js).
- **Currently covered task families**
  - `listen_and_choose`
  - `oral_comprehension_mcq`
  - `guided_recording` (short, constrained)
- **Current weak/partial/missing areas**
  - Audio asset model is mostly TTS runtime-generated, not managed prompt packs per curriculum item.
  - Recording storage is local-only; no durable upload backend contract implementation.
  - Review flow is “reviewable artifact exists” but no operational review queue lifecycle.
  - No read-aloud progression beyond guided short recording.
  - No Hebrew phonological audio-specific task families (first sound/rhyme/syllable) as explicit end-state task set.
  - Browser/mobile resilience is partial (no complete compatibility hardening matrix).
  - Moderation/privacy retention policy is not fully productized.
- **Still manual-only**
  - Spoken tasks remain manual-review-first by design; no pronunciation scoring.
- **Not release-complete yet**
  - Missing hardened upload/review/retention/moderation pipeline and broader Hebrew audio curriculum coverage.

## B. Gap to full Hebrew audio close

- **Curriculum/task depth gap**
  - Add richer listening tasks beyond generic MCQ: oral discrimination, phonological listening, audio-driven grammar/vocabulary, short read-aloud progression.
- **Spoken progression gap**
  - Evolve from only guided short recording to staged speaking tasks (still constrained and manual-first where needed).
- **Operational workflow gap**
  - Add review queue states, reviewer actions, SLA/priority, disposition taxonomy.
- **Storage/privacy hardening gap**
  - Move from local-only artifact storage to secure upload + retention/deletion controls + audit metadata.
- **Safety/moderation gap**
  - Add moderation routing for harmful/inappropriate audio content and low-quality/corrupt artifacts.
- **Scoring policy gap**
  - Expand strict scoring boundaries: safe auto-score classes vs manual-first classes with clear refusal rules.
- **Platform hardening gap**
  - Mobile Safari/Android/browser permission reliability and fallback consistency across devices.

## C. Scope definition

### 1) In scope now (to reach full Hebrew close)

- Hebrew audio completion for g1–g6 across reading/comprehension/writing/grammar/vocabulary/speaking with bounded, product-safe task set.
- Shared platform hardening for playback, recording lifecycle, upload contract, review routing, privacy/retention, moderation hooks.
- Final Hebrew verification and freeze gates.

### 2) Still out of scope

- English product activation.
- Pronunciation scoring as product-grade pass/fail.
- Open free-form long spoken response as auto-scored product flow.
- Parent-report expansion.
- Other subjects.

### 3) Shared but not activated for English

- Locale-aware asset contract.
- Review queue and artifact lifecycle models.
- Scoring adapter interfaces and policy taxonomy.
- Browser/device compatibility and fallback framework.
- These become **English-ready infra**, but no English tasks/content rollout now.

## D. Exact execution plan by phases

### Build 2 — Hebrew audio breadth expansion

- **Build**
  - Add explicit Hebrew audio task packs: phonological listening, audio comprehension variants, audio grammar/vocabulary checks.
  - Add constrained read-aloud short word/short sentence tasks (manual-review-first for speech outputs).
  - Add structured artifact metadata enrichment (attempt context, prompt hash, replay count, device hints).
- **Do not build yet**
  - English task enablement, pronunciation product scoring, long open speech grading.
- **Risk**: medium-high (content quality and age-fit calibration).
- **Exit criteria**
  - New Hebrew task families available and stable for all target grade bands.
  - Routing rules enforced: no unsafe auto-score drift.

### Build 3 — Workflow and policy hardening

- **Build**
  - Durable upload path + retention/deletion policy implementation.
  - Review queue state machine (pending/reviewed/accepted/retry/rejected) and moderation flags.
  - Permission/fallback hardening with device-specific handling standards.
- **Do not build yet**
  - English content activation.
- **Risk**: high (operational load and compliance correctness).
- **Exit criteria**
  - Upload/review lifecycle works end-to-end with recoverable failures.
  - Privacy retention and moderation rules enforced in data flow.

### Final hardening

- **Build**
  - Scoring policy lock: safe auto-score only; borderline/manual-only paths validated.
  - Device/browser matrix pass; failure telemetry and alert thresholds.
  - Regression guardrails so non-audio Hebrew behavior remains stable.
- **Risk**: medium (edge-case regressions).
- **Exit criteria**
  - All verification gates pass repeatedly on release candidate.

### Final freeze

- **Build**
  - Freeze docs/runbooks/checklists for Hebrew audio close + English-ready shared platform status.
- **Risk**: low-medium.
- **Exit criteria**
  - Meets K-section freeze definitions with no critical open blockers.

## E. Exact grade/domain map for remaining scope

### g1/g2

- **reading**
  - Build 1 covered: basic listen-and-choose.
  - Add: first-sound hearing, rhyme discrimination, syllable-count-by-audio.
  - Priority 1: phonological listening MCQ.
  - Priority 2: short guided repeat/read token.
  - Manual-first: all recorded speech.
- **comprehension**
  - Covered: oral comprehension MCQ baseline.
  - Add: short narrative detail/sequence from audio.
  - P1: detail retrieval; P2: simple inference.
  - Manual-first: spoken explanations (if any) remain constrained/manual.
- **writing**
  - Covered: no dedicated audio-writing beyond baseline.
  - Add: simple dictation-to-choice/typed-constrained.
  - P1: dictated word/symbol choices; P2: short phrase.
  - Manual-first: spoken dictation playback response recording.
- **grammar**
  - Covered: minimal.
  - Add: punctuation/intonation recognition; sentence correctness by listening.
  - P1: punctuation-by-intonation MCQ; P2: agreement listening checks.
  - Manual-first: spoken grammar production.
- **vocabulary**
  - Covered: generic listen-and-choose.
  - Add: audio cue to meaning/word selection.
  - P1: word-meaning selection; P2: context cue from audio sentence.
  - Manual-first: spoken synonym generation.
- **speaking**
  - Covered: guided short recording.
  - Add: structured repeat-after-audio (still constrained).
  - P1: prompt repeat; P2: short prompted phrase.
  - Manual-first: all outputs.

### g3/g4

- **reading**: add short sentence read-aloud progression (manual-first).
- **comprehension**: expand to paragraph-level listening MCQ + light inference.
- **writing**: constrained dictation sentence components.
- **grammar**: tense/agreement/listening discrimination.
- **vocabulary**: context-clue listening tasks.
- **speaking**: short structured oral response with strict rubric/manual-first.

### g5/g6

- **reading**: read-aloud short paragraph segments (manual-first).
- **comprehension**: richer audio comprehension with multi-step prompts.
- **writing**: punctuation/structure from dictated short text.
- **grammar**: register and complex syntax listening discrimination.
- **vocabulary**: nuance/synonym in spoken context.
- **speaking**: guided monologue snippets, still constrained and manual-first.

## F. Final task taxonomy (post-completion target)

- `listen_and_choose`
  - Grades: g1–g6; Domains: reading/comprehension/vocabulary/grammar.
  - Type: shared.
  - Answer mode: MCQ.
  - Scoring: auto-score safe.
  - Review: none.
  - Risk: low.
- `oral_comprehension_mcq`
  - Grades: g1–g6; Domain: comprehension.
  - Type: shared.
  - Answer mode: MCQ.
  - Scoring: auto-score safe.
  - Review: none.
  - Risk: low-medium.
- `phonological_discrimination_he`
  - Grades: g1–g2; Domain: reading.
  - Type: Hebrew-specific.
  - Answer mode: MCQ/multi-choice.
  - Scoring: auto-score safe.
  - Review: none.
  - Risk: medium.
- `audio_grammar_choice_he`
  - Grades: g2–g6; Domain: grammar/writing.
  - Type: Hebrew-specific.
  - Answer mode: MCQ.
  - Scoring: auto-score safe.
  - Review: none.
  - Risk: medium.
- `guided_recording`
  - Grades: g1–g6; Domains: speaking/reading/writing support.
  - Type: shared.
  - Answer mode: short recording.
  - Scoring: manual-first.
  - Review: manual pending required.
  - Risk: medium-high.
- `read_aloud_short_he`
  - Grades: g2–g6; Domain: reading.
  - Type: Hebrew-specific on shared recording.
  - Answer mode: short recording.
  - Scoring: manual-first (optional transcript assist).
  - Review: required.
  - Risk: high.
- `structured_spoken_response_he`
  - Grades: g3–g6; Domain: speaking/comprehension.
  - Type: Hebrew-specific.
  - Answer mode: constrained recording.
  - Scoring: borderline/manual-first.
  - Review: required.
  - Risk: high.
- `english_ready_adapter_slots`
  - Grades/domains: future English.
  - Type: English-ready shared.
  - Answer mode: N/A now.
  - Scoring/review: not activated.
  - Risk: low now (design-only).

## G. Final architecture plan

- **Audio asset model**
  - Canonical registry keyed by subject/grade/domain/task/item with locale, transcript, duration, checksum, prompt version.
- **Playback model**
  - Shared controller with replay limits, fallback text, and capability checks.
- **Recording lifecycle**
  - Request permission -> capture bounded duration -> preview/confirm -> submit -> route (manual/auto) -> persist status.
- **Storage/upload model**
  - Transition from local artifact staging to durable server-backed storage + signed upload + artifact metadata index.
- **Review queue model**
  - States: `pending_manual_review`, `review_in_progress`, `accepted`, `needs_retry`, `rejected`.
- **STT usage policy**
  - Allowed only as assistive/transcript aid in constrained flows; not authoritative for final speaking grade.
- **Pronunciation policy**
  - Not product-grade in this cycle; explicitly non-blocking signal only (or disabled).
- **Fallback policy**
  - Mic denied/unsupported -> safe degraded path or skip with neutral progression where pedagogically acceptable.
- **Privacy/retention**
  - Explicit retention windows, deletion flow, metadata minimization, consent/audit markers.
- **Moderation**
  - Flag suspicious/unsafe artifacts for manual moderation pipeline before normal review closure.
- **Mobile/browser support**
  - Device capability matrix, iOS Safari-specific permission sequencing, retry semantics.

## H. Final evaluation / scoring policy

- **Safe to auto-score**
  - MCQ after listening.
  - Strict constrained responses with deterministic expected answer sets.
- **Borderline**
  - Constrained spoken outputs with low-confidence transcript checks.
  - Must route to manual review when confidence or quality threshold is missed.
- **Manual-review-only**
  - Guided recordings, read-aloud recordings, structured spoken responses.
- **Forbidden as product-grade auto-score (this cycle)**
  - Pronunciation scoring as final authority.
  - Open free speech grading.
- **Future English-ready only (not active now)**
  - Pronunciation adapters and English phonics-specific evaluators remain disabled placeholders.

## I. Risks and blockers

- **Mic permissions denied** — Severity high, Likelihood high, Mitigation: strong pre-permission UX + skip/degraded paths.
- **Noisy environments / child speech variability** — Severity high, Likelihood high, Mitigation: short prompts, retries, manual review default for recordings.
- **Hebrew STT quality variance** — Severity high, Likelihood medium-high, Mitigation: STT assist-only + strict confidence gating.
- **False positive/negative scoring** — Severity high, Likelihood medium, Mitigation: conservative auto-score boundary and review escalation.
- **Review load growth** — Severity medium-high, Likelihood high, Mitigation: queue prioritization + SLA + sampling policy.
- **Storage/privacy compliance** — Severity high, Likelihood medium, Mitigation: retention/deletion controls and metadata minimization.
- **Moderation gaps** — Severity high, Likelihood medium, Mitigation: explicit moderation flags and triage workflow.
- **Mobile Safari / Android inconsistencies** — Severity medium-high, Likelihood medium-high, Mitigation: device-specific fallback matrix and QA gates.
- **UX complexity** — Severity medium, Likelihood medium, Mitigation: progressive disclosure and consistent audio interaction primitives.

## J. Verification plan

- **Shared platform checks**
  - Contract validation, playback limits, recording duration bounds, upload metadata integrity, routing correctness.
- **Hebrew-specific checks**
  - Task-pack correctness by grade/domain, transcript/prompt alignment, rubric consistency for manual review tasks.
- **Browser/mobile checks**
  - Chrome/Edge/Firefox/Safari + Android/iOS permission flows and error paths.
- **Permission/fallback checks**
  - Denied, blocked, unavailable mic scenarios and neutral progression behavior.
- **Recording quality checks**
  - Corrupt blob handling, oversize handling, duration enforcement, retry handling.
- **Scoring validation**
  - Auto-score only for safe classes; no accidental auto-score on manual-only tasks.
- **Review routing validation**
  - All recording-required tasks create reviewable artifacts and queue states correctly.
- **Regression boundaries**
  - Non-audio Hebrew flows remain stable; parent-report untouched; no cross-subject regressions.

## K. Freeze definition

- **`Hebrew audio close achieved` when all true**
  - Hebrew in-scope audio task families for all intended grade/domain slices are shipped.
  - Recording lifecycle (capture->persist->review status) is production-stable.
  - Scoring boundary policy is enforced in runtime and tests.
  - Privacy/retention/moderation gates pass.
  - Browser/mobile matrix passes for required support targets.
  - No critical open blockers in Hebrew audio verification suite.

- **`Shared audio platform English-ready` when all true**
  - Shared contracts/services are locale-agnostic and versioned.
  - Upload/review/routing/scoring interfaces can accept language packs without refactor.
  - English-specific adapters/content are not activated, but integration points are validated by contract tests.

## L. Recommended full execution pass

- **Pass 1 (Build 2):** add Hebrew task breadth (phonological/audio grammar/vocab/read-aloud short) on existing shared core.
- **Pass 2 (Build 3):** productionize upload/review/privacy/moderation lifecycle.
- **Pass 3 (Final hardening):** lock scoring boundaries, complete device matrix, run regression suite.
- **Pass 4 (Freeze):** run final verification pack and enforce freeze criteria before declaring close.