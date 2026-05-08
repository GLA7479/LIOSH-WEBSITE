/**
 * Trend signals: overall daily totals (date + answers + accuracyPct) and per-subject trend bands.
 *
 * Per-subject trend resolution priority:
 *  1. V2 deterministic engine via `v2Report.subjectProfiles[*].trendBucket | trend`.
 *  2. V2 hybridRuntime per-subject bucket if present.
 *  3. Fallback: `insufficient_data` if thin, else `stable`.
 *
 * The Insight Packet never invents an `improving` / `declining` band that the deterministic engine
 * did not assert. This is the "AI must not contradict deterministic" guarantee at the data layer.
 */

import { classifyDataConfidence } from "./derive-data-confidence.js";

const ALLOWED_TRENDS = new Set(["improving", "stable", "declining", "insufficient_data"]);

function readV2SubjectTrend(v2Report, subjectKey) {
  if (!v2Report || typeof v2Report !== "object") return null;
  const sk = String(subjectKey || "").trim().toLowerCase();
  if (!sk) return null;

  const profiles = Array.isArray(v2Report.subjectProfiles) ? v2Report.subjectProfiles : null;
  if (profiles) {
    for (const sp of profiles) {
      if (!sp || typeof sp !== "object") continue;
      const matchKey = String(sp.subject || sp.subjectKey || "").trim().toLowerCase();
      if (matchKey !== sk) continue;
      const candidate = String(sp.trendBucket || sp.trend || "").trim().toLowerCase();
      if (ALLOWED_TRENDS.has(candidate) && candidate !== "insufficient_data") return candidate;
    }
  }

  const hr = v2Report.hybridRuntime;
  if (hr && typeof hr === "object" && hr.subjectTrends && typeof hr.subjectTrends === "object") {
    const candidate = String(hr.subjectTrends[sk] || "").trim().toLowerCase();
    if (ALLOWED_TRENDS.has(candidate) && candidate !== "insufficient_data") return candidate;
  }
  return null;
}

export function deriveTrendSignals(aggregate, v2Report) {
  const dailyRaw = Array.isArray(aggregate?.dailyActivity) ? aggregate.dailyActivity : [];
  const dailyTotals = dailyRaw
    .map((d) => {
      const correct = Math.max(0, Math.round(Number(d?.correct) || 0));
      const wrong = Math.max(0, Math.round(Number(d?.wrong) || 0));
      const total = correct + wrong;
      const answers = Math.max(0, Math.round(Number(d?.answers) || total));
      const accuracyPct = total > 0 ? Number(((correct / total) * 100).toFixed(2)) : 0;
      return { date: String(d?.date || ""), answers, accuracyPct };
    })
    .filter((d) => d.date)
    .sort((a, b) => a.date.localeCompare(b.date));

  const subjectsObj = aggregate?.subjects && typeof aggregate.subjects === "object" ? aggregate.subjects : {};
  const subjectTrends = [];
  for (const subjectKey of Object.keys(subjectsObj).sort()) {
    const s = subjectsObj[subjectKey];
    if (!s) continue;
    const totalQ = Number(s.answers) || 0;
    if (classifyDataConfidence(totalQ) === "thin") {
      subjectTrends.push({ subjectKey, trend: "insufficient_data" });
      continue;
    }
    const v2Trend = readV2SubjectTrend(v2Report, subjectKey);
    subjectTrends.push({ subjectKey, trend: v2Trend || "stable" });
  }

  return { dailyTotals, subjectTrends };
}
