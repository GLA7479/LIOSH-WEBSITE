---
name: Parent Copilot Polish Pass
overview: "Execute a focused Product Polish Pass for Parent Copilot v1 in two locked passes: Pass 1 improves chat usability/pacing (Areas C,D), then Pass 2 tightens follow-up utility and de-repetition (Areas B,A), while preserving all core boundaries and contracts."
todos:
  - id: pass1-area-c-chat-ux
    content: "Implement Area C in parent copilot UI files: stable panel layout, anchored input, controlled auto-scroll, compact history, compact quick-actions placement."
    status: completed
  - id: pass1-area-d-pacing
    content: "Implement Area D in panel: processing micro-state and short staged response flow without fake streaming."
    status: completed
  - id: pass2-area-b-followup
    content: "Implement Area B in followup engine/memory/index: strict value gate, stronger de-dup, and more specific follow-up selection with null-when-low-value policy."
    status: completed
  - id: pass2-area-a-derepetition
    content: "Implement Area A in planner/composer/coaching packs: anti-repeat pass, richer safe variation signals, and reduced intra-answer redundancy."
    status: completed
  - id: validate-and-report
    content: Run required tests, confirm boundaries unchanged, and produce required completion report format with PASS/FAIL checklist.
    status: completed
isProject: false
---

# Parent Copilot v1 Polish Pass (Locked)

## Scope Lock (Do Not Touch)
- Keep unchanged: contracts stack, TruthPacket ownership/boundaries, validator policy core, parent-only boundary, report engine/PDF, teacher surfaces, and overall page architecture.
- No redesign, no new phase, no broad rewrite, no new block types.
- Work only in the files explicitly allowed per area.

## Execution Order (Mandatory)
1. Pass 1: Area C + Area D
2. Pass 2: Area B + Area A

## Execution Locks (Mandatory)

### File boundary lock
- Do not modify any file outside the explicitly listed files for each area.
- If implementation appears to require any additional file, stop and report it instead of expanding scope.

### Pass gate
- Do not start Pass 2 until Pass 1 is completed and reported with PASS on its own acceptance checklist.
- If any Pass 1 acceptance item fails, fix Pass 1 first. Do not continue.

### Explicit validation commands
- Run and report exact results for:
  - `test:parent-copilot-phaseA`
  - `test:parent-copilot-phaseB`
  - `test:parent-copilot-phaseC`
  - parent-report regression checks currently used in project workflow
  - `next build`
- Do not describe tests generically. Report exact command outcomes.

### Quantified behavior rules
- Processing micro-pause must be short and deterministic: 250-450ms total UI delay.
- Compact history starts only after 4 completed assistant turns.
- Keep the newest assistant turn fully expanded.
- Keep the newest user turn fully expanded.
- Never collapse the currently active exchange.
- Follow-up text overlap block: suppress if strong wording overlap with either:
  - current answer content
  - either of the last 2 suggested follow-ups
- Family reuse block: do not reuse the same follow-up family within the next 2 turns unless no other eligible family exists.
- If no follow-up candidate clearly passes value gate, return `selected: null`.

### Definition of Done (Required)
- Implementation is done only if all are true:
  - No file outside allowed scope was changed.
  - Pass 1 chat panel remains usable after multiple turns.
  - Input stays visible and anchored.
  - Message area is the only main scroll region.
  - Auto-scroll does not force-jump a user reading older messages.
  - Processing micro-state appears before assistant answer.
  - No fake streaming/theater was added.
  - Follow-up can be omitted cleanly when low-value.
  - Answer repetition is reduced within-turn and across adjacent turns.
  - Contracts/boundaries/validator core remain unchanged.
  - Parent report page and PDF behavior remain unchanged.
  - All required tests pass.

### Required completion report
- Return exactly:
  1. Exact files changed
  2. Exact behavior changed by pass and area
  3. Explicit non-changes
  4. PASS/FAIL for each Definition of Done item
  5. Exact test commands run and their outcomes
  6. Real remaining risks only

## Pass 1 — Area C (Chat UX/Layout/Scroll)
### Files
- [components/parent-copilot/parent-copilot-panel.jsx](components/parent-copilot/parent-copilot-panel.jsx)
- [components/parent-copilot/parent-copilot-quick-actions.jsx](components/parent-copilot/parent-copilot-quick-actions.jsx)
- [components/parent-copilot/parent-copilot-shell.jsx](components/parent-copilot/parent-copilot-shell.jsx)

### Changes
- Convert panel internals to stable chat layout: fixed-height container behavior, message region as sole scrollable/flexible section (`flex-1` + `overflow-auto`).
- Anchor input area at bottom so it remains visible and usable after many turns.
- Add controlled auto-scroll policy:
  - auto-scroll on new user send and new assistant reply,
  - avoid forced jumps when user is reading older messages away from bottom.
- Compact older assistant history (preview/collapsed treatment) while keeping latest exchange fully expanded.
- Keep quick actions compact and positioned near input without pushing feed height aggressively.

## Pass 1 — Area D (Response Pacing Feel)
### Files
- [components/parent-copilot/parent-copilot-panel.jsx](components/parent-copilot/parent-copilot-panel.jsx)

### Changes
- Add short, truthful processing micro-state row (e.g., "מעבד את הדוח…" / "בודק את ההקשר…").
- Submission flow becomes UI-staged:
  1) append user message,
  2) show processing row with short deterministic micro-pause,
  3) replace with assistant answer.
- Optional minimal progressive reveal only at UI layer (core answer first, follow-up/quick-actions after), without fake streaming or deceptive theater.

## Pass 2 — Area B (Follow-up Usefulness)
### Files
- [utils/parent-copilot/followup-engine.js](utils/parent-copilot/followup-engine.js)
- [utils/parent-copilot/session-memory.js](utils/parent-copilot/session-memory.js)
- [utils/parent-copilot/index.js](utils/parent-copilot/index.js)

### Changes
- Introduce stricter value gate before emitting follow-up:
  - low utility/low confidence candidate -> no follow-up (`selected: null`),
  - high overlap with recent suggested or current answer -> no follow-up,
  - already-satisfied answer states (clear next step/caution/sufficient coverage) -> no follow-up.
- Tighten memory de-dup/reuse suppression:
  - stronger short-window family reuse block,
  - stronger text-overlap suppression.
- Improve specificity of follow-up texts using existing context (intent/scope/current answer state), while staying inside existing follow-up families.

## Pass 2 — Area A (Answer Quality / De-repetition)
### Files
- [utils/parent-copilot/conversation-planner.js](utils/parent-copilot/conversation-planner.js)
- [utils/parent-copilot/answer-composer.js](utils/parent-copilot/answer-composer.js)
- [utils/parent-copilot/parent-coaching-packs.js](utils/parent-copilot/parent-coaching-packs.js)

### Changes
- Add anti-repeat pass before final answer block return:
  - suppress near-duplicate adjacent phrasing,
  - suppress composed blocks with high token overlap against immediately prior block,
  - reduce rapid reuse of same framing across adjacent turns.
- Expand planner variation signals (intent/scope/turn-index/continuity) only within existing contract-safe block types and structure.
- Expand coaching variation by intent/scope/position/continuity with angle variation (not just synonyms).
- Strengthen composer discipline:
  - reduce repeated claim restatement across meaning/next_step,
  - prioritize concise non-redundant phrasing.

## Validation and Completion
- Run relevant tests after each pass and final regression check for copilot suites and existing parent-report checks used in project workflow.
- Verify all Do-Not-Touch boundaries remain intact.

## Final Delivery Format (Required)
1. Exact files changed.
2. Exact behavior changed by Area C/D/B/A.
3. Explicit non-changes.
4. Acceptance checklist with PASS/FAIL per Definition of Done item.
5. Real risks/leftovers only (if any).