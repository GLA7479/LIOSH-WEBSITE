# Product Quality Phase 18 — Math Probe Harness Planning

**Last updated:** 2026-05-05  
**Status:** Planning only — **no** edits to question text, Hebrew wording, answers, [`utils/math-question-generator.js`](../utils/math-question-generator.js), learning/UI/APIs, or audit scripts. Implementation awaits explicit approval.

## Why this phase exists

[`reports/question-audit/stage2.json`](../reports/question-audit/stage2.json) lists these **`kindsNotHitInRun`** for math (all five are probe **`params.kind`** values):

- `frac_probe_common_denominator_only`
- `math_probe_fraction_operation_gate`
- `math_probe_operation_word_choice`
- `math_probe_place_value`
- `math_probe_times_fact`

The plain audit samples [`generateQuestion`](../utils/math-question-generator.js) via [`sampleMathGenerator`](../scripts/audit-question-banks.mjs) with **`probeOpts` omitted** (no `pendingProbe`). **Diagnostic probe exercises are gated on `probeOpts.pendingProbe`**. Therefore those **`params.kind`** values **do not appear** in random audit sampling — **by design**, not because of invalid math content.

---

## 1. Implementation location

All five kinds are emitted only inside **`tryMathDiagnosticProbeExercise`** in [`utils/math-question-generator.js`](../utils/math-question-generator.js) (~744–1008). That helper runs **before** normal operation branches inside **`generateQuestion`** (~1072–1115): if it returns a question, that path **short-circuits** the rest of the generator.

**Session gate:** [`probeMatchesSession`](../utils/active-diagnostic-runtime/session-match.js) requires:

- `pendingProbe.expiresAfterQuestions > 0`
- `pendingProbe.gradeKey` / `pendingProbe.levelKey` match the generator call
- For non-`mixed` operation: `pendingProbe.topicId === operation` (string match)

**Probe payload shape:** see [`PendingDiagnosticProbe`](../utils/active-diagnostic-runtime/build-pending-probe.js) typedef (~10–28).

---

## 2. Activation: `suggestedQuestionType` ↔ `params.kind`

The gate **`pendingProbe.suggestedQuestionType`** (`st`) selects the branch. Implemented **`st`** strings (must match **exactly**):

| `params.kind` (output) | `suggestedQuestionType` (`st`) in `tryMathDiagnosticProbeExercise` |
|------------------------|-------------------------------------------------------------------|
| `frac_probe_common_denominator_only` | `fraction_common_denominator_only` |
| `math_probe_fraction_operation_gate` | `fraction_operation_gate` |
| `math_probe_place_value` | `place_value_digit_value` |
| `math_probe_times_fact` | `multiplication_fact_check` |
| `math_probe_operation_word_choice` | `operation_choice_word_problem` |

**Additional gating inside the helper**

- **Common subject:** `pendingProbe.subjectId === "math"` (see ~767).
- **Session match:** `probeMatchesSession(pendingProbe, gradeKey, levelKey, selectedOp)` — `selectedOp` is the **operation** passed into `generateQuestion` (after mixed resolution), not the UI “topic” name elsewhere.

---

## 3. Per-probe reference (the five kinds)

### 3.1 `frac_probe_common_denominator_only`

| Field | Value |
|-------|--------|
| **Where** | [`tryMathDiagnosticProbeExercise`](../utils/math-question-generator.js) `st === "fraction_common_denominator_only"` |
| **Activates** | `suggestedQuestionType: "fraction_common_denominator_only"`, `topicId: "fractions"`, matching `gradeKey` / `levelKey` |
| **Operation** | `generateQuestion(..., "fractions", ...)` — `fractions` (or `st` starting with `fraction_` with fraction config; see `fracCtxOk` ~776–788) |
| **Grade / level** | Needs `levelConfig.fractions` with `maxDen`; denominators from `densSmall` / `densBig` by grade (**g3–g4** small pool, else big). Example harness: **g5 easy** with fraction-capable level config (see self-test [`parent-report-phase1-selftest.mjs`](../scripts/parent-report-phase1-selftest.mjs) ~883–891). |
| **Misconception / signal** | LCD vs LCM confusion; **`expectedErrorTags`:** `wrong_lcm`, `adds_denominators_directly` |
| **Launch-critical?** | **Conditional** — yes only if active diagnostics / Parent AI claims depend on **fraction error probes** being exercised and scored. |
| **Safe harness force** | Call `generateQuestion(lc, "fractions", gradeKey, null, { pendingProbe, probeMetaHolder })` with minimal `pendingProbe` (§5). **Do not** set `__LIOSH_MATH_FORCE` — probes are orthogonal to that mechanism. |
| **Output shape** | Numeric **LCD** correct answer; `params.kind`, `den1`, `den2`, `lcd`, `patternFamily: "fraction_probe_common_denominator"`, `diagnosticSkillId` default `math_frac_common_denominator` |
| **Audit fields** | `topic=fractions`, `subtopic=params.kind`, `patternFamily`, `subtype` if present, `rowKind=math_generator_sample` or dedicated `math_probe_sample` if implemented |
| **Risk if untested** | Probe branch typos / regressions invisible to plain audit; diagnostic ledger quality unknown |

---

### 3.2 `math_probe_fraction_operation_gate`

| Field | Value |
|-------|--------|
| **Where** | `st === "fraction_operation_gate"` |
| **Activates** | `suggestedQuestionType: "fraction_operation_gate"`, `topicId: "fractions"` |
| **Operation** | `fractions` with `fracCtxOk` |
| **Grade / level** | Same fraction context as §3.1 |
| **Misconception / signal** | Adding numerators when denominators already match vs wrong actions — **`operation_confusion`** |
| **Launch-critical?** | **Conditional** (diagnostic product claims). |
| **Output shape** | **MCQ text** (`isChoiceOnly: true`); `correctAnswer` Hebrew label string; four shuffled options |
| **Audit fields** | `answerMode` may surface as MCQ; record `params.kind`, `correctAnswer` hash only if policy allows |

---

### 3.3 `math_probe_place_value`

| Field | Value |
|-------|--------|
| **Where** | `st === "place_value_digit_value"` |
| **Activates** | `suggestedQuestionType: "place_value_digit_value"`, `topicId` must match **`number_sense`** or **`decimals`** |
| **Operation** | `generateQuestion(..., "number_sense", ...)` or `..., "decimals", ...` — **required** (~884) |
| **Grade / level** | Typically mid grades; uses integer **100–9999** |
| **Misconception / signal** | Digit vs place value — **`place_value_error`** |
| **Launch-critical?** | **Conditional** |
| **Output shape** | Numeric MCQ; `params.n`, `digitIndex`, `placeValue` |
| **Risk if untested** | Distractor pool edge cases (duplicate filtering ~904–911) |

---

### 3.4 `math_probe_times_fact`

| Field | Value |
|-------|--------|
| **Where** | `st === "multiplication_fact_check"` |
| **Activates** | `suggestedQuestionType: "multiplication_fact_check"`, `topicId: "multiplication"` |
| **Operation** | **`multiplication` only** (~928) |
| **Grade / level** | Any grade that includes multiplication in [`MATH_GRADES`](../utils/math-constants.js) |
| **Misconception / signal** | Fact fluency — **`multiplication_fact_gap`** |
| **Launch-critical?** | **Conditional** |
| **Output shape** | `a × b` stem; numeric MCQ; `params.a`, `params.b` |

---

### 3.5 `math_probe_operation_word_choice`

| Field | Value |
|-------|--------|
| **Where** | `st === "operation_choice_word_problem"` |
| **Activates** | `suggestedQuestionType: "operation_choice_word_problem"`, `topicId: "word_problems"` |
| **Operation** | **`word_problems` only** (~967) |
| **Misconception / signal** | Choosing **multiply** vs add for equal-groups structure — **`operation_confusion`** (`probeNumericDecoys` incl. sum-like vs product) |
| **Launch-critical?** | **Conditional** |
| **Output shape** | Hebrew MCQ labels; `correctAnswer` `"כפל"` |

---

## 4. Are these unreachable in normal audit “by design”?

**Yes.** [`sampleMathGenerator`](../scripts/audit-question-banks.mjs) invokes:

```text
genMath(lc, op, gk, null)
```

The fourth argument is **`mixedOps`**; **`probeOpts` is not passed** through this API — probes are never injected. So **`kindsNotHitInRun`** for probes reflects **audit harness limitations**, not necessarily broken math content.

**Content vs coverage:** This is **primarily an audit / diagnostic coverage gap**. There is **no** Phase 18 finding that standard (non-probe) math items are wrong **because** probes are missing from `items.json`.

---

## 5. Recommended harness design

**Implemented:** Phase 19 standalone script — see [`docs/product-quality-phase-19-math-probe-harness.md`](product-quality-phase-19-math-probe-harness.md) and [`scripts/audit-math-probes.mjs`](../scripts/audit-math-probes.mjs) (corresponds to §5.2 **Option B**).

### 5.1 Minimal `pendingProbe` template (per run)

```javascript
{
  subjectId: "math",
  topicId: "<operation>", // must equal generateQuestion operation
  suggestedQuestionType: "<one of §2>",
  expiresAfterQuestions: 1,
  gradeKey: "<gk>",
  levelKey: "<easy|medium|hard>",
  diagnosticSkillId: null, // optional override
  reasonHe: "audit_harness",
  sourceHypothesisId: "audit_probe_harness",
  createdAt: Date.now(),
  priority: 1,
  dominantTag: null,
  probeAttemptIds: [],
}
```

Adjust **`topicId`** / **`suggestedQuestionType`** per §3.

### 5.2 Integration options (pick one after approval)

| Option | Description |
|--------|-------------|
| **A — Extend `audit-question-banks.mjs`** | Add `MATH_PROBE_AUDIT_SAMPLES` array (similar to existing `MATH_AUDIT_FORCE_PROBES` ~807+) calling `genMath(lc, op, gk, null, { pendingProbe, probeMetaHolder })` with deterministic seeds. Emits extra rows or a distinct `rowKind` e.g. `math_probe_sample`. |
| **B — Standalone script** | `scripts/math-probe-audit-sample.mjs` writes JSON/CSV for QA without bloating main audit row count. |
| **C — CI-only** | Run probe harness in GitHub Action; optional merge into harness JSON for [`stage2.json`](../reports/question-audit/stage2.json) regeneration. |

**Recommendation:** **A** if product wants **`items.json`** parity for probes; **B** if probes should **not** inflate **3942** math rows.

### 5.3 Expected output shape (verification)

For each probe call, assert:

- `q.params.kind` equals the target kind from §3.
- `probeMetaHolder.current.probeReason` matches internal reason string (~837–1002).
- Stem non-empty; `correctAnswer` type matches numeric vs Hebrew label.

### 5.4 Audit fields to record (if merged into main audit)

| Field | Notes |
|-------|------|
| `subject` | `math` |
| `topic` | operation (`fractions`, `multiplication`, …) |
| `subtopic` / `patternFamily` | from `params.kind` / `patternFamily` |
| `rowKind` | `math_generator_sample` **or** explicit `math_probe_sample` |
| `bankProvenance` | `generator_sample` |
| `spine_skill_id` / diagnostic ids | map from `params.diagnosticSkillId` if audit schema extended |

### 5.5 Risk if not tested before launch

| Risk | Severity |
|------|----------|
| Probe branch regressions undetected | Medium (engineering) |
| Misleading marketing / Parent AI if “diagnostic probes” claimed without E2E proof | Medium (product) |
| Learner-facing impact | **Low** if probes are rare / session-local only |

---

## 6. Alignment with Phase 8

[`docs/product-quality-phase-8-subject-coverage-content-plan.md`](product-quality-phase-8-subject-coverage-content-plan.md) §2.1 and priority list already recommend a **probe harness** when diagnostics are launch-critical. Phase 18 **narrows** that to a concrete contract (`pendingProbe` + `suggestedQuestionType`) and five stable **`params.kind`** targets.

---

## 7. Next step (explicit approval gate)

1. **Harness:** Phase 19 implemented **Option B** (standalone script). Optional: wire **`npm run audit:math-probes`** into CI.  
2. Product decision: are **diagnostic probes** launch-critical for messaging / Parent AI?  
3. Optional merge: Phase 18 **Option A** (inject probes into main [`audit-question-banks.mjs`](../scripts/audit-question-banks.mjs)) if **`items.json`** must list probe kinds — separate approval.

---

## Compliance

| Constraint | Phase 18 |
|------------|----------|
| Code / content changed | **No** |
| Docs added | **Yes** — this file + Phase 8 reference update |
