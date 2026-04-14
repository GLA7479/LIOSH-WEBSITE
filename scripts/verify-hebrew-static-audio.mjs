/**
 * אימות first-pass: static_url לפי hash על narration_plaintext (תוכן שאלה מלא), בלי registry pool.
 */
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function fail(msg) {
  console.error("verify-hebrew-static-audio:", msg);
  process.exit(1);
}

const bindMod = await import(pathToFileURL(path.join(root, "utils", "hebrew-audio-narration-binding.js")));
const { buildFirstPassNarrationPlaintext, narrationContentHash16 } = bindMod;

const attachMod = await import(pathToFileURL(path.join(root, "utils", "hebrew-audio-attach.js")));
const { attachHebrewAudioToQuestion } = attachMod;

function baseQuestion(over = {}) {
  return {
    exerciseText: "זוהי שאלת בדיקה עם טקסט ייחודי לאימות שמע מלא.",
    question: "זוהי שאלת בדיקה עם טקסט ייחודי לאימות שמע מלא.",
    answers: ["אפשרות א", "אפשרות ב"],
    correctAnswer: "אפשרות א",
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
if (stemL.task_mode !== "listen_and_choose") fail("expected listen_and_choose");
if (stemL.playback_kind !== "static_url") fail("expected static_url");
if (stemL.tts_text != null) fail("tts_text must be null");
if (stemL.audio_source !== "static_registry_bound") fail("expected static_registry_bound");
if (!stemL.narration_plaintext) fail("missing narration_plaintext");
if (!stemL.narration_plaintext.includes("זוהי שאלת בדיקה")) {
  fail("narration must include full question body");
}
if (!stemL.narration_plaintext.includes("אפשרות א")) fail("narration must include answers preview");
if (!String(stemL.stem_audio_url || "").startsWith("/audio/hebrew/gen/v1/")) fail("bad stem_audio_url");
if (!/^he\.gen\.v1\.[a-f0-9]{16}$/.test(stemL.audio_asset_id)) fail("bad audio_asset_id");
const h = narrationContentHash16(stemL.narration_plaintext);
if (!stemL.audio_asset_id.endsWith(h)) fail("audio_asset_id must match narration hash");

const qOral = structuredClone(baseQuestion({ topic: "comprehension" }));
if (!attachHebrewAudioToQuestion(qOral, { gradeKey: "g2", topic: "comprehension", sequenceIndex: 7 })) {
  fail("attach g2 comprehension seq7 expected true");
}
const stemO = qOral.params?.audioStem;
if (stemO.task_mode !== "oral_comprehension_mcq") fail("expected oral");
if (stemO.playback_kind !== "static_url") fail("oral static");
if (!stemO.narration_plaintext.includes("לפי מה ששמעתם")) fail("oral narration must include oral closing phrase");

const qG3 = structuredClone(baseQuestion());
if (!attachHebrewAudioToQuestion(qG3, { gradeKey: "g3", topic: "reading", sequenceIndex: 6 })) {
  fail("attach g3 expected true");
}
const stemG3 = qG3.params?.audioStem;
if (stemG3.playback_kind !== "tts") fail("g3 must stay browser TTS");
if (!stemG3.tts_text) fail("g3 needs tts_text");

console.log("verify-hebrew-static-audio: OK");
