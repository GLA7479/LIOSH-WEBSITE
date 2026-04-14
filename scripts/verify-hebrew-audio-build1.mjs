/**
 * אימות חוזה Build 1 (אודיו) — ללא דפדפן.
 */
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const contractPath = path.join(__dirname, "..", "utils", "audio-task-contract.js");
const AudioContract = await import(pathToFileURL(contractPath));

const { validateAudioStemV1, resolveScoreOrReviewRoute } = AudioContract;

function fail(msg) {
  console.error("verify-hebrew-audio-build1:", msg);
  process.exit(1);
}

const listen = {
  schema_version: 1,
  audio_asset_id: "he.test.listen.1",
  transcript: "טקסט לדוגמה להאזנה ובחירה",
  locale: "he-IL",
  task_mode: "listen_and_choose",
  recording_required: false,
  playback_kind: "tts",
  stem_audio_url: null,
  tts_text: "שלום לכולם",
  max_replays: 4,
  max_duration_sec: 15,
  scoring_policy: "mcq_after_audio_auto",
  fallback_mode: "degraded_skip",
  review_route: "none",
};

const guided = {
  schema_version: 1,
  audio_asset_id: "he.test.guided.1",
  transcript: "מילה",
  locale: "he-IL",
  task_mode: "guided_recording",
  recording_required: true,
  playback_kind: "tts",
  stem_audio_url: null,
  tts_text: "הקראו בקול: מילה",
  max_replays: 3,
  max_duration_sec: 12,
  scoring_policy: "guided_record_manual_review",
  fallback_mode: "degraded_skip",
  review_route: "manual_pending",
};

if (!validateAudioStemV1(listen)) fail("listen stem invalid");
if (!validateAudioStemV1(guided)) fail("guided stem invalid");

const rl = resolveScoreOrReviewRoute(listen);
if (!rl.autoScore || rl.manualReview) fail("listen route expected autoScore");

const rg = resolveScoreOrReviewRoute(guided);
if (rg.autoScore || !rg.manualReview) fail("guided route expected manualReview");

const bad = { ...listen, recording_required: true };
if (validateAudioStemV1(bad)) fail("expected invalid when listen+recording_required");

console.log("verify-hebrew-audio-build1: OK");
