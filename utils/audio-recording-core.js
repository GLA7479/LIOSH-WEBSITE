/**
 * Build 1 — הקלטה קצרה (MediaRecorder), ללא ניתוח דיבור.
 */

/**
 * @typedef {"ok"|"not_supported"|"permission_denied"|"failed"} RecordingStatus
 */

/**
 * @param {{ maxDurationMs: number, mimeType?: string }} opts
 * @returns {Promise<{ status: RecordingStatus, blob?: Blob, mimeType?: string, durationMs?: number }>}
 */
export async function recordShortUtterance(opts) {
  const { maxDurationMs, mimeType } = opts;
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return { status: "not_supported" };
  }
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (e) {
    const name = e && typeof e === "object" && "name" in e ? e.name : "";
    if (name === "NotAllowedError" || name === "SecurityError") {
      return { status: "permission_denied" };
    }
    return { status: "failed" };
  }

  const preferredTypes = [mimeType, "audio/webm;codecs=opus", "audio/webm", "audio/mp4"].filter(Boolean);

  let chosen = "";
  for (const t of preferredTypes) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported?.(t)) {
      chosen = t;
      break;
    }
  }
  if (!chosen && typeof MediaRecorder !== "undefined") {
    chosen = "audio/webm";
  }

  const chunks = [];
  let recorder;
  try {
    recorder = new MediaRecorder(stream, chosen ? { mimeType: chosen } : undefined);
  } catch {
    stream.getTracks().forEach((tr) => tr.stop());
    return { status: "failed" };
  }

  const started = Date.now();
  return await new Promise((resolve) => {
    let finished = false;
    const finish = (status, blob) => {
      if (finished) return;
      finished = true;
      stream.getTracks().forEach((tr) => tr.stop());
      const durationMs = Date.now() - started;
      if (status === "ok" && blob) {
        resolve({ status: "ok", blob, mimeType: blob.type || chosen, durationMs });
      } else {
        resolve({ status: status === "ok" ? "failed" : status });
      }
    };

    recorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) chunks.push(ev.data);
    };
    recorder.onerror = () => finish("failed");
    recorder.onstop = () => {
      try {
        const blob = new Blob(chunks, { type: chosen || "audio/webm" });
        finish("ok", blob);
      } catch {
        finish("failed");
      }
    };

    try {
      recorder.start(200);
    } catch {
      finish("failed");
      return;
    }

    setTimeout(() => {
      try {
        if (recorder.state !== "inactive") recorder.stop();
      } catch {
        finish("failed");
      }
    }, maxDurationMs);
  });
}
