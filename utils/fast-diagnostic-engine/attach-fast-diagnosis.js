import { filterMistakesForRow } from "../parent-report-row-trend.js";
import { runFastDiagnosisForUnit } from "./run-fast-diagnosis-for-unit.js";

/**
 * Attaches `fastDiagnosis` to each diagnosticEngineV2 unit (deterministic; no UI changes).
 *
 * @param {object} p
 * @param {{ units?: object[] }|null|undefined} p.diagnosticEngineV2
 * @param {Record<string, unknown[]>} p.rawMistakesBySubject
 * @param {Record<string, Record<string, unknown>>} p.maps
 * @param {number} p.startMs
 * @param {number} p.endMs
 */
export function attachFastDiagnosisToDiagnosticEngineV2(p) {
  const eng = p?.diagnosticEngineV2;
  const units = Array.isArray(eng?.units) ? eng.units : [];
  const maps = p?.maps && typeof p.maps === "object" ? p.maps : {};
  const rawMistakesBySubject = p?.rawMistakesBySubject && typeof p.rawMistakesBySubject === "object" ? p.rawMistakesBySubject : {};
  const startMs = Number(p?.startMs);
  const endMs = Number(p?.endMs);

  for (const u of units) {
    if (!u || typeof u !== "object") continue;
    const sid = String(u.subjectId || "");
    const trk = String(u.topicRowKey || "");
    const row = maps[sid]?.[trk];
    const rowSafe = row && typeof row === "object" ? row : {};
    const events =
      Number.isFinite(startMs) && Number.isFinite(endMs)
        ? filterMistakesForRow(sid, trk, rowSafe, rawMistakesBySubject[sid] || [], startMs, endMs)
        : [];
    try {
      u.fastDiagnosis = runFastDiagnosisForUnit({ unit: u, events, row: rowSafe });
    } catch {
      u.fastDiagnosis = null;
    }
  }
}
