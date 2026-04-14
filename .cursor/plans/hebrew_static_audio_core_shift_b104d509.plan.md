---
name: Hebrew Static Audio Core Shift
overview: Focused execution plan to move core Hebrew listening task modes from browser TTS to static audio URLs, with minimal scope and quick validation.
todos:
  - id: define-static-audio-scope
    content: Lock first-pass Hebrew task modes and grade/topic envelope for static audio rollout.
    status: completed
  - id: create-registry-contract
    content: Define registry schema and path mapping from audio_asset_id to static_url assets.
    status: completed
  - id: runtime-switch-with-fallback
    content: Plan attach/runtime switch to static_url-first with temporary measured TTS fallback.
    status: completed
  - id: verification-and-cutover-gates
    content: Define browser+script verification and objective cutover criteria to disable Hebrew TTS for covered scope.
    status: completed
isProject: false
---

# Hebrew Static Audio Core Shift

## A. scope
- Migrate these Hebrew task modes first from `playback_kind: "tts"` to `"static_url"`: `listen_and_choose`, `oral_comprehension_mcq`, `phonological_discrimination_he`, `audio_grammar_choice_he`.
- Keep recording/manual-review modes (`guided_recording`, `read_aloud_short_he`, `structured_spoken_response_he`) out of first pass for prompt audio generation complexity; they can keep current behavior temporarily.
- No English changes, no parent-report changes, no new product scope.

## B. asset strategy
- Store files under `public/audio/hebrew/core/v1/<grade>/<topic>/<task_mode>/`.
- Filename format: `<audio_asset_id>__<voice_id>__v<asset_version>.mp3` (ASCII only).
- Add registry file `data/hebrew-audio/he-core-v1.registry.json` with per-item metadata:
  - `audio_asset_id` (primary key)
  - `locale` (`he-IL`)
  - `voice_id` (production narrator id)
  - `asset_version`
  - `task_mode`, `grade`, `topic`
  - `relative_url` (maps to `public/...`)
  - `duration_ms`
  - `sha256`
- `audio_asset_id` stays the runtime lookup key; runtime never guesses paths without registry.

## C. runtime change
- In [utils/hebrew-audio-attach.js](utils/hebrew-audio-attach.js):
  - For in-scope Hebrew core modes, resolve registry by `audio_asset_id`.
  - If found: emit stem with `playback_kind: "static_url"`, `stem_audio_url` from registry, `tts_text: null`.
  - If not found (temporary rollout window only): fallback to `tts` + explicit telemetry marker `audio_source: "tts_fallback"`.
- In [utils/audio-task-contract.js](utils/audio-task-contract.js): keep current schema valid (`static_url` already supported); optionally require non-empty `stem_audio_url` for Hebrew core modes once cutover is complete.
- In [utils/audio-playback-core.js](utils/audio-playback-core.js): keep static URL path as primary and preserve current hard error behavior.
- Hard block Hebrew TTS only after registry coverage reaches pass threshold (section F), by removing fallback for in-scope modes.
- Build safety: keep schema versioning and non-core mode behavior unchanged to avoid breaking Build 1/2/3 flows.

## D. minimal first pass
- First pass scope (highest value / lowest asset count):
  - Grades `g1-g2`
  - Topics `reading`, `comprehension`
  - Modes `listen_and_choose`, `oral_comprehension_mcq`
- Why: most frequent listening interactions and no recording-side dependencies.
- Defer `phonological_discrimination_he` and `audio_grammar_choice_he` to pass 1.5 after the pipeline proves stable.

## E. verification
- Add/update verification script (`scripts/verify-hebrew-audio-final.mjs` or dedicated `verify-hebrew-static-audio.mjs`):
  - Assert in-scope stems resolve to `playback_kind: "static_url"` with valid URLs.
  - Assert static playback path is exercised and does not call TTS for covered assets.
  - Assert fallback marker appears only when registry miss is intentional during rollout.
- Browser checks (desktop + mobile):
  - Chrome + Safari (iOS) + Android Chrome.
  - For a covered item, `נגן` must produce audible output from file playback.
  - Disconnect/disable Hebrew system voice: covered static items must still play.
- Pass condition for test run:
  - 100% of sampled covered items audible via static URL.
  - 0 silent-success events.
  - 0 dependency on `speechSynthesis` for covered items.

## F. exit criteria
- Declare `Hebrew static audio pass achieved` when all are true:
  - Registry coverage for first-pass scope is 100% (`g1-g2`, `reading/comprehension`, two core modes).
  - Runtime emits `static_url` for covered scope with no TTS fallback in production flag state.
  - Manual browser matrix passes on required devices/browsers.
  - Verify script passes in CI/local consistently.
  - No regressions in non-covered modes and no English behavior changes.

## Key files leveraged
- [utils/hebrew-audio-attach.js](utils/hebrew-audio-attach.js)
- [utils/audio-task-contract.js](utils/audio-task-contract.js)
- [utils/audio-playback-core.js](utils/audio-playback-core.js)
- [scripts/verify-hebrew-audio-final.mjs](scripts/verify-hebrew-audio-final.mjs)
- New registry target: `data/hebrew-audio/he-core-v1.registry.json`
- New asset root: `public/audio/hebrew/core/v1/`