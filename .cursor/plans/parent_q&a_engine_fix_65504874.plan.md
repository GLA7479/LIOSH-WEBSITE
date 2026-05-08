---
name: Parent Q&A Engine Fix
overview: Rebuild the Parent Report Q&A engine with a deterministic question router that fires before any LLM call, correct per-intent answer contracts, an extended guardrail validator, and a comprehensive test suite.
todos:
  - id: router
    content: Create utils/parent-copilot/question-router.js — deterministic 12-intent router, returns deterministicResponse for off_topic without touching LLM
    status: completed
  - id: index-fixes
    content: Fix index.js — (A) off_topic early exit before scope resolution, (B) guard vague_summary_question override, (C) guard augmentPhaseEThinEvidenceDraft from boundary intents
    status: completed
  - id: composer-fix
    content: Fix answer-composer.js — update off-topic answer text to spec; add per-intent opening templates for ask_strengths, ask_weaknesses, ask_home_practice, ask_is_it_bad_or_concerning
    status: completed
  - id: validator-fix
    content: Fix guardrail-validator.js — (A) expand GLOBAL_SCARCITY_CONTRADICTION_RE to cover all 5 banned phrases with scoped-exception logic, (B) add off_topic contamination check, (C) add diagnostic wording check
    status: completed
  - id: stageA-fix
    content: Fix stage-a-freeform-interpretation.js — add missing off-topic patterns (מי ניצח, מי ראש הממשלה, general knowledge not about report); add patterns for ask_progress_trend and ask_data_limitations intents
    status: completed
  - id: llm-fix
    content: Fix llm-orchestrator.js — add intent to FACTS_JSON; harden off-topic instruction to hard system rule with exact fallback JSON
    status: completed
  - id: tests
    content: Replace/extend scripts/parent-copilot-qa-selftest.mjs with full-pipeline tests for all 9 scenario groups; each test verifies answer text, generationPath, and validator status
    status: completed
isProject: false
---

# Parent Report Q&A Engine — Focused Fix Plan

## Current Architecture Map

```
parent question
    ↓
interpretFreeformStageA()        ← stage-a-freeform-interpretation.js
    ↓ canonicalIntent (20 intents)
detectAggregateQuestionClass()   ← semantic-question-class.js
    ↓ may override to "explain_report"
resolveScope()                   ← scope-resolver.js
    ↓ executive | subject | topic | clarification_required
buildTruthPacketV1()             ← truth-packet-v1.js (1247 lines)
    ↓ full contracts + limits
composeAnswerDraft()             ← answer-composer.js
    ↓
augmentPhaseEThinEvidenceDraft() ← external-question-route.js  ← BUG: runs even on off_topic
    ↓
validateAnswerDraft()            ← guardrail-validator.js
    ↓
[optional] maybeGenerateGroundedLlmDraft() ← llm-orchestrator.js
    ↓
finalizeTurnResponse()           → JSON response
```

## Root Causes of Current Failures

**Off-topic bug:** `augmentPhaseEThinEvidenceDraft()` runs on off-topic drafts (line 680 of `index.js`) and can inject report data into the blocks. The `validateAnswerDraft` intentionally skips most checks for `off_topic_redirect`, so this contamination passes through undetected.

**Secondary off-topic bug:** The `vague_summary_question` override at lines 469-475 of `index.js` does not guard `off_topic_redirect` — if `detectAggregateQuestionClass` ever returns `vague_summary_question` for an off-topic question, intent gets forced to `explain_report`.

**Thin-data contradiction:** `GLOBAL_SCARCITY_CONTRADICTION_RE` in `guardrail-validator.js` (line 112) covers only one specific phrasing. Banned phrases like `מוקדם לקבוע`, `אין מספיק נתונים`, `נתונים מועטים`, `כיוון ראשוני בלבד`, `עדיין לא ניתן להסיק` are not checked.

**Off-topic answer text mismatch:** Current answer says "אני יכול לעזור רק בשאלות על הדוח..." but spec requires the neutral passive form.

**Test gap:** `scripts/parent-copilot-qa-selftest.mjs` only tests Stage A intent detection and the validator in isolation — never tests the full `runParentCopilotTurn` pipeline output.

## Files to Create / Change

**New files:**
- [`utils/parent-copilot/question-router.js`](utils/parent-copilot/question-router.js) — deterministic router outputting 12 product intents; off_topic exits immediately with no LLM flag

**Modified files (6 total):**
- [`utils/parent-copilot/index.js`](utils/parent-copilot/index.js) — insert router as first step; guard `augmentPhaseEThinEvidenceDraft` and `vague_summary_question` override from off_topic; guard off_topic in LLM async path
- [`utils/parent-copilot/answer-composer.js`](utils/parent-copilot/answer-composer.js) — fix off-topic response text; add per-intent answer templates for new contracts
- [`utils/parent-copilot/guardrail-validator.js`](utils/parent-copilot/guardrail-validator.js) — extend thin-data contradiction regex; add off-topic contamination check; add scoped-vs-global thin-data discrimination
- [`utils/parent-copilot/stage-a-freeform-interpretation.js`](utils/parent-copilot/stage-a-freeform-interpretation.js) — add missing off-topic patterns ("מי ראש הממשלה", "מי ניצח בכדורגל", general non-report patterns); add new product intents
- [`utils/parent-copilot/llm-orchestrator.js`](utils/parent-copilot/llm-orchestrator.js) — add intent to FACTS_JSON; tighten off-topic instruction to be a hard system rule, not a soft guideline
- [`scripts/parent-copilot-qa-selftest.mjs`](scripts/parent-copilot-qa-selftest.mjs) — replace minimal tests with full pipeline tests for all required scenarios

## Detailed Implementation

### 1. `question-router.js` (new)

Maps utterance → one of 12 canonical Q&A intents using deterministic regex tiers:

```
Tier 1 — Absolute: off_topic, unsafe_or_diagnostic_request
Tier 2 — Specific: ask_subject_specific, ask_topic_specific
Tier 3 — Action: ask_home_practice, ask_main_focus, ask_progress_trend
Tier 4 — Sentiment: ask_strengths, ask_weaknesses, ask_is_it_bad_or_concerning
Tier 5 — Meta: ask_explain_report, ask_data_limitations
Tier 6 — Default: unknown_report_question
```

Off-topic patterns to add (missing from stage-a):
- `מי ניצח|ניצח בכדורגל|ניצח במשחק`
- `מי ראש הממשלה|ראש ממשלה`
- `שאלות כלליות` (general knowledge not about the report)

Returns: `{ intent, requiresLlm: false, deterministicResponse?: string }`

For `off_topic` and `unsafe_or_diagnostic_request`: `requiresLlm: false`, `deterministicResponse` is already set.

### 2. `index.js` — Three targeted fixes

**Fix A — Off-topic early exit BEFORE scope resolution:**
```js
// After stageA, before resolveScope:
if (stageA.canonicalIntent === "off_topic_redirect") {
  return buildOffTopicTurnResponse(sessionId, priorRepeated, scopeMeta, utteranceStr);
}
```
This prevents `resolveScope`, `buildTruthPacketV1`, `composeAnswerDraft`, and `augmentPhaseEThinEvidenceDraft` from running at all.

**Fix B — Guard `vague_summary_question` override:**
```js
if (aggregateQuestionClass === "vague_summary_question" &&
    intent !== "clinical_boundary" &&
    intent !== "sensitive_education_choice" &&
    intent !== "off_topic_redirect") {   // ← add this guard
  intent = "explain_report";
}
```

**Fix C — Guard `augmentPhaseEThinEvidenceDraft` for boundary intents:**
```js
if (intent !== "off_topic_redirect" && intent !== "parent_policy_refusal") {
  draft = augmentPhaseEThinEvidenceDraft(draft, truthPacket);
}
```

### 3. `answer-composer.js` — Off-topic answer text fix

Change the `off_topic_redirect` block text from:
> "אני יכול לעזור רק בשאלות על הדוח..."

To:
> "אפשר לשאול כאן שאלות על הדוח והתקדמות הלמידה שמופיעה בו."
> "למשל: מה כדאי לתרגל השבוע? או במה הילד התחזק?"

### 4. `guardrail-validator.js` — Three validator additions

**Addition A — Expanded global thin-data contradiction regex** (replaces narrow current regex):
```js
const GLOBAL_SCARCITY_CONTRADICTION_RE = /(
  מוקדם\s+לקבוע |
  אין\s+מספיק\s+נתונים |
  נתונים\s+מועטים |
  כיוון\s+ראשוני\s+בלבד |
  עדיין\s+לא\s+ניתן\s+להסיק |
  יש\s+כרגע\s+מעט\s+נתוני\s+תרגול |
  ... (existing) ...
)/u
```

The key guard: only fail if the phrase is NOT scoped (i.e., not preceded by "ב[מקצוע/נושא] הזה", "ב[subject] בלבד").

**Addition B — Off-topic contamination check:**
```js
// For off_topic_redirect intent only:
const REPORT_DATA_CONTAMINATION_RE = /(
  \d+\s*שאלות |  // "484 שאלות"
  דיוק\s+של\s*\d+ |  // accuracy number
  \d+\s*%\s*(דיוק|הצלחה) |
  בדוח\s+יש\s+\d+ |  // "בדוח יש 484 שאלות"
  (\d{2,})\s*(?:שאלות|תשובות)  // high number + questions
)/u
if (intent === "off_topic_redirect" && REPORT_DATA_CONTAMINATION_RE.test(joined)) {
  failCodes.push("off_topic_report_data_contamination");
}
```

**Addition C — Answer addresses the question** (soft check):
If intent is `ask_strengths` and answer contains no strength-related Hebrew keywords, add a `soft_intent_mismatch` code (non-blocking, telemetry only).

### 5. `llm-orchestrator.js` — Prompt hardening

Change the off-topic instruction from a soft guideline to a structural rule:
```
SYSTEM RULE (non-negotiable): If the question is not directly about this student's learning report data, 
you MUST return exactly:
[{"type":"observation","textHe":"אפשר לשאול כאן שאלות על הדוח והתקדמות הלמידה שמופיעה בו.","source":"composed"},
{"type":"meaning","textHe":"למשל: מה כדאי לתרגל השבוע? או במה הילד התחזק?","source":"composed"}]
No other content. No report facts. No weather answer. No summary.
```

Also add `intent` to `FACTS_JSON` so the LLM knows what type of answer is expected.

### 6. `parent-copilot-qa-selftest.mjs` — Full pipeline tests

Replace current minimal test with tests that call `runParentCopilotTurn(input)` directly with a realistic mock payload (3-answer thin, 484-answer thick, subject-specific):

```
Test groups:
A. Off-topic (3 questions) — no LLM, no report data in answer, correct boundary text
B. Main focus (1 question) — specific focus areas, practical steps
C. Strengths (1) — grounded only, no hype
D. Weaknesses (1) — calm wording, no diagnosis
E. Home practice (1) — practical plan
F. High data (484 answers) — no global thin-data wording
G. Thin data (3 answers) — cautious "כיוון ראשוני"
H. Scoped thin data (high global, low topic) — caution only for topic
I. Diagnostic question — no diagnosis, practice-data disclaimer
```

Each test checks:
1. The returned `answerBlocks` text doesn't contain forbidden patterns
2. For off_topic: `telemetry.generationPath === "deterministic"`, no report data in answer
3. For high data: no global thin-data phrases
4. `validatorStatus === "pass"` (or known expected fail codes only)

## Sample Answer Contracts (for acceptance)

| Question | Expected answer shape |
|---|---|
| מה מזג האוויר? | 2 blocks, no report data, boundary text only |
| מה הכי חשוב לתרגל השבוע? | opener + 2-3 focus areas + 1-2 home actions |
| במה הוא חזק? | grounded strengths from report, no hype, no emotional lang |
| מה לעשות בבית? | numbered practical steps, scoped to report data |
| האם יש סיבה לדאגה? | calm, no diagnosis, practical next step |
| מה עם גאומטריה? | only geometry data; if thin, scope caution to geometry only |

## Acceptance Criteria

- `node scripts/parent-copilot-qa-selftest.mjs` passes all tests
- Off-topic questions: `generationPath === "deterministic"`, no report facts in answer text
- 484-answer report: no occurrence of "מוקדם לקבוע", "אין מספיק נתונים", "נתונים מועטים" in answers
- 3-answer report: answer contains "כיוון ראשוני" or equivalent caution
- Geometry question on 3-answer geometry / 484-answer global: caution scoped to geometry only
- ADHD question: answer contains "אי אפשר לקבוע אבחנה" or equivalent, no diagnosis
