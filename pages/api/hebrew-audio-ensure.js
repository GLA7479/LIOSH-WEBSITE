/**
 * יוצר/מבטיח קובץ MP3 להקראת טקסט עברי (Edge neural TTS בשרת בלבד — לא בדפדפן המשתמש).
 * מפתח קובץ: sha256(normalize(text)) → public/audio/hebrew/gen/v1/<hash16>.mp3
 */
import fs from "node:fs";
import path from "node:path";

import { narrationContentHash16 } from "../../utils/hebrew-audio-narration-binding.js";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "256kb",
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  const text = String(req.body?.text ?? "").trim();
  if (!text || text.length > 2200) {
    return res.status(400).json({ ok: false, error: "invalid_text" });
  }

  const hash16 = narrationContentHash16(text);

  const dir = path.join(process.cwd(), "public", "audio", "hebrew", "gen", "v1");
  const filePath = path.join(dir, `${hash16}.mp3`);
  const url = `/audio/hebrew/gen/v1/${hash16}.mp3`;

  try {
    if (fs.existsSync(filePath)) {
      const st = fs.statSync(filePath);
      if (st.size > 500) {
        return res.status(200).json({ ok: true, hash16, url, cached: true });
      }
    }

    fs.mkdirSync(dir, { recursive: true });

    const { EdgeTTS } = await import("node-edge-tts");
    const tts = new EdgeTTS({
      voice: "he-IL-HilaNeural",
      lang: "he-IL",
      timeout: 120000,
    });
    await tts.ttsPromise(text, filePath);

    const st = fs.statSync(filePath);
    if (!st.size || st.size < 500) {
      try {
        fs.unlinkSync(filePath);
      } catch {
        /* ignore */
      }
      return res.status(500).json({ ok: false, error: "empty_audio" });
    }

    return res.status(200).json({ ok: true, hash16, url, cached: false });
  } catch (e) {
    console.error("hebrew-audio-ensure", e);
    return res.status(500).json({ ok: false, error: "tts_failed" });
  }
}
