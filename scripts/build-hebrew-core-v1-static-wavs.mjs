/**
 * יוצר קבצי WAV נשמעים (לא שקט) לכל entry ב־Core v1 first-pass,
 * ומעדכן את data/hebrew-audio/he-core-v1.registry.json (נתיבים + sha256 + duration_ms).
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const regPath = path.join(root, "data", "hebrew-audio", "he-core-v1.registry.json");
const publicRoot = path.join(root, "public");

const SR = 22050;
const BITS = 16;
const CH = 1;

/** @param {Int16Array} pcm */
function writeWavMono16(filePath, pcm) {
  const dataSize = pcm.length * 2;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(CH, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE((SR * CH * BITS) / 8, 28);
  buf.writeUInt16LE((CH * BITS) / 8, 32);
  buf.writeUInt16LE(BITS, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < pcm.length; i++) {
    buf.writeInt16LE(pcm[i], 44 + i * 2);
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, buf);
  return buf;
}

/**
 * שני טונים קצרים + שקט — נשמע בבירור, ייחודי לפי id.
 * @param {string} assetId
 */
function pcmForAssetId(assetId) {
  const h = crypto.createHash("sha256").update(assetId).digest();
  const f1 = 320 + (h[0] % 180) * 2;
  const f2 = 420 + (h[1] % 200) * 2;
  const vol = 12000;
  const ms1 = 0.22;
  const ms2 = 0.26;
  const gap = 0.06;
  const n1 = Math.floor(SR * ms1);
  const nGap = Math.floor(SR * gap);
  const n2 = Math.floor(SR * ms2);
  const out = new Int16Array(n1 + nGap + n2);
  for (let i = 0; i < n1; i++) {
    const env = Math.sin((Math.PI * (i + 1)) / (n1 + 1));
    const t = i / SR;
    out[i] = Math.round(vol * env * Math.sin(2 * Math.PI * f1 * t));
  }
  for (let i = 0; i < n2; i++) {
    const env = Math.sin((Math.PI * (i + 1)) / (n2 + 1));
    const t = i / SR;
    out[n1 + nGap + i] = Math.round(vol * env * Math.sin(2 * Math.PI * f2 * t));
  }
  return out;
}

function maxAbsPcm(buf) {
  let m = 0;
  for (let i = 44; i + 1 < buf.length; i += 2) {
    const v = Math.abs(buf.readInt16LE(i));
    if (v > m) m = v;
  }
  return m;
}

const reg = JSON.parse(fs.readFileSync(regPath, "utf8"));
if (!Array.isArray(reg.entries)) {
  console.error("bad registry");
  process.exit(1);
}

for (const e of reg.entries) {
  const id = e.audio_asset_id;
  const g = e.grade;
  const t = e.topic;
  const mode = e.task_mode;
  const fname = `${id}__${e.voice_id || "voice_default"}__v${e.asset_version || 1}.wav`;
  const rel = `/audio/hebrew/core/v1/${g}/${t}/${mode}/${fname}`;
  const abs = path.join(publicRoot, rel.replace(/^\//, ""));
  const pcm = pcmForAssetId(id);
  const buf = writeWavMono16(abs, pcm);
  const sha = crypto.createHash("sha256").update(buf).digest("hex");
  const durMs = Math.round((pcm.length / SR) * 1000);
  e.relative_url = rel;
  e.duration_ms = durMs;
  e.sha256 = sha;
}

fs.writeFileSync(regPath, JSON.stringify(reg, null, 2));

const sample = fs.readFileSync(
  path.join(publicRoot, reg.entries[0].relative_url.replace(/^\//, ""))
);
if (maxAbsPcm(sample) < 2000) {
  console.error("sanity: expected non-silent peak");
  process.exit(1);
}

console.log("build-hebrew-core-v1-static-wavs: wrote", reg.entries.length, "wavs + registry");
