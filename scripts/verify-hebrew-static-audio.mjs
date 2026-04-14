/**
 * אימות Core v1 — static_url + קבצי WAV נשמעים (לא שקט) עבור first-pass.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function fail(msg) {
  console.error("verify-hebrew-static-audio:", msg);
  process.exit(1);
}

/** @param {Buffer} buf */
function maxAbsPcm16(buf) {
  let m = 0;
  for (let i = 44; i + 1 < buf.length; i += 2) {
    const v = Math.abs(buf.readInt16LE(i));
    if (v > m) m = v;
  }
  return m;
}

const regPath = path.join(root, "data", "hebrew-audio", "he-core-v1.registry.json");
const reg = JSON.parse(fs.readFileSync(regPath, "utf8"));
if (!Array.isArray(reg.entries) || reg.entries.length < 32) fail("registry entries expected >= 32");

const registryMod = await import(pathToFileURL(path.join(root, "utils", "hebrew-static-audio-registry.js")));
const { resolveHebrewStaticCoreV1, listHebrewStaticCoreV1RegistryEntries } = registryMod;

for (const e of listHebrewStaticCoreV1RegistryEntries()) {
  const r = resolveHebrewStaticCoreV1(e.audio_asset_id);
  if (!r || r.relative_url !== e.relative_url) fail("resolve mismatch " + e.audio_asset_id);
  if (!String(r.relative_url || "").startsWith("/")) fail("relative_url must start with /");
  if (String(r.relative_url).includes("placeholder")) fail("must not use silent placeholder: " + e.audio_asset_id);

  const abs = path.join(root, "public", r.relative_url.replace(/^\//, ""));
  if (!fs.existsSync(abs)) fail("missing file: " + abs);
  const buf = fs.readFileSync(abs);
  const h = crypto.createHash("sha256").update(buf).digest("hex");
  if (e.sha256 !== h) fail("sha256 mismatch for " + e.audio_asset_id);
  if (maxAbsPcm16(buf) < 2000) fail("expected non-silent audio for " + e.audio_asset_id);
}

const attachMod = await import(pathToFileURL(path.join(root, "utils", "hebrew-audio-attach.js")));
const { attachHebrewAudioToQuestion } = attachMod;

function baseQuestion(over = {}) {
  return {
    exerciseText: "בחרו את המילה הנכונה לדוגמה.",
    question: "בחרו את המילה הנכונה לדוגמה.",
    answers: ["א", "ב"],
    correctAnswer: "א",
    answerMode: "mcq",
    topic: "reading",
    ...over,
  };
}

const qListen = structuredClone(baseQuestion());
if (!attachHebrewAudioToQuestion(qListen, { gradeKey: "g1", topic: "reading", sequenceIndex: 6 })) {
  fail("attach g1 reading seq6 expected true");
}
const stemL = qListen.params?.audioStem;
if (!stemL) fail("missing stem");
if (stemL.task_mode !== "listen_and_choose") fail("expected listen_and_choose got " + stemL.task_mode);
if (stemL.playback_kind !== "static_url") fail("expected static_url got " + stemL.playback_kind);
const expectedL = resolveHebrewStaticCoreV1(stemL.audio_asset_id)?.relative_url;
if (stemL.stem_audio_url !== expectedL) fail("stem_audio_url must match registry");
if (stemL.tts_text != null) fail("tts_text should be null for static");
if (stemL.audio_source !== "static_registry") fail("expected audio_source static_registry");
if (!String(stemL.audio_asset_id || "").startsWith("he.core.v1.")) fail("expected core asset id");

const qOral = structuredClone(baseQuestion({ topic: "comprehension" }));
if (!attachHebrewAudioToQuestion(qOral, { gradeKey: "g2", topic: "comprehension", sequenceIndex: 7 })) {
  fail("attach g2 comprehension seq7 expected true");
}
const stemO = qOral.params?.audioStem;
if (stemO.task_mode !== "oral_comprehension_mcq") fail("expected oral");
if (stemO.playback_kind !== "static_url") fail("oral should be static in first pass");
if (stemO.audio_source !== "static_registry") fail("oral must be static_registry not tts_fallback");

const qG3 = structuredClone(baseQuestion());
if (!attachHebrewAudioToQuestion(qG3, { gradeKey: "g3", topic: "reading", sequenceIndex: 6 })) {
  fail("attach g3 expected true");
}
const stemG3 = qG3.params?.audioStem;
if (stemG3.playback_kind === "static_url") fail("g3 must not use static first-pass envelope");
if (stemG3.playback_kind !== "tts") fail("g3 expected tts");
if (!stemG3.tts_text) fail("g3 should have tts_text");

console.log("verify-hebrew-static-audio: OK");
