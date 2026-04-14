/**
 * שמירת ארטיפקט הקלטה — localStorage + ניסיון סנכרון לשרת (Build 3).
 */

const STORAGE_KEY = "mleo_hebrew_audio_artifacts_v2";
const MAX_ITEMS = 80;
const MAX_B64_CHARS = 450_000;

function loadAll() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveAll(rows) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows.slice(-MAX_ITEMS)));
  } catch {
    /* quota */
  }
}

/**
 * @param {object} payload
 */
function syncArtifactToServer(row) {
  if (typeof window === "undefined") return;
  const body = JSON.stringify(row);
  fetch("/api/hebrew-audio-artifact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

export function appendAudioArtifact(payload) {
  const row = {
    ...payload,
    stored_at: new Date().toISOString(),
    schema_version: 2,
  };
  const all = loadAll();
  all.push(row);
  saveAll(all);
  syncArtifactToServer(row);
  return row;
}

export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => {
      const s = String(r.result || "");
      const idx = s.indexOf(",");
      resolve(idx >= 0 ? s.slice(idx + 1) : s);
    };
    r.onerror = () => reject(new Error("read_failed"));
    r.readAsDataURL(blob);
  });
}

export function estimateArtifactSizeChars(base64) {
  return String(base64 || "").length;
}

export function isWithinArtifactSizeLimit(base64) {
  return estimateArtifactSizeChars(base64) <= MAX_B64_CHARS;
}
