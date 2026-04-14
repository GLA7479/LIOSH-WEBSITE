# Hebrew static audio — cutover gates

## First-pass envelope (Core v1)

- Grades: `g1`, `g2`
- Topics: `reading`, `comprehension`
- Task modes: `listen_and_choose`, `oral_comprehension_mcq`
- Pool: 4 slots per `(grade, topic, task_mode)` → `audio_asset_id` = `he.core.v1.<g>.<topic>.<mode>.p<0..3>`

## Registry

- File: [`data/hebrew-audio/he-core-v1.registry.json`](../data/hebrew-audio/he-core-v1.registry.json)
- Lookup: [`utils/hebrew-static-audio-registry.js`](../utils/hebrew-static-audio-registry.js)
- קבצי שמע (Core v1): תחת `public/audio/hebrew/core/v1/<grade>/<topic>/<task_mode>/` בשם  
  `<audio_asset_id>__<voice_id>__v<asset_version>.wav` — נוצרים/מתעדכנים עם  
  [`scripts/build-hebrew-core-v1-static-wavs.mjs`](../scripts/build-hebrew-core-v1-static-wavs.mjs) (טון דו-שלבי נשמע לכל slot; ניתן להחליף בקלטות דיבור בעברית באותם נתיבים ובאותו registry).

## Runtime

- [`utils/hebrew-audio-attach.js`](../utils/hebrew-audio-attach.js) sets `playback_kind: "static_url"` when a registry row exists; otherwise `audio_source: "tts_fallback"` (Hebrew browser TTS) for the same envelope.
- Stem field `audio_source`: `"static_registry"` | `"tts_fallback"` (telemetry / QA).

## Hard cutover (no Hebrew TTS fallback)

Set environment variable:

`NEXT_PUBLIC_HEBREW_STATIC_NO_TTS_FALLBACK=1`

When set, if a first-pass row has **no** registry match, `attachHebrewAudioToQuestion` returns `false` (no audio attach). Use only after registry coverage is 100% for the envelope.

## Verification

```bash
npm run verify:hebrew-static-audio
npm run verify:hebrew-audio
```

Browser: `נגן` on a first-pass question must play the WAV/MP3 via `Audio()` (no device Hebrew TTS required).

## `Hebrew static audio pass achieved`

1. Registry contains real clips (replace placeholder) per slot or expanded pool as product requires.
2. `sha256` in registry matches committed files (CI check).
3. `NEXT_PUBLIC_HEBREW_STATIC_NO_TTS_FALLBACK=1` in production build and attach still succeeds for all first-pass combinations used in the app.
4. Manual matrix: Chrome / Safari (iOS) / Android Chrome — audible play, no `speechSynthesis` use for first-pass stems (`audio_source === "static_registry"`).
5. `npm run verify:hebrew-audio` green.
