/**
 * Adapter: parent-report V2 snapshot → strict allowlisted input for `buildParentReportAIExplanation`.
 * No raw banks, diagnostics blobs, or full history — only derived summary strings and counts.
 */

import { mapPlannerNextActionToHebrew } from "../../lib/learning-client/adaptive-planner-recommendation-view-model.js";
import {
  buildParentReportAIExplanation,
  buildStrictParentReportAIInput,
} from "./parent-report-ai-explainer.js";

const SUBJECT_KEYS = ["math", "geometry", "english", "science", "hebrew", "moledet-geography"];

const SUMMARY_Q = {
  math: "mathQuestions",
  geometry: "geometryQuestions",
  english: "englishQuestions",
  science: "scienceQuestions",
  hebrew: "hebrewQuestions",
  "moledet-geography": "moledetGeographyQuestions",
};

const SUMMARY_ACC = {
  math: "mathAccuracy",
  geometry: "geometryAccuracy",
  english: "englishAccuracy",
  science: "scienceAccuracy",
  hebrew: "hebrewAccuracy",
  "moledet-geography": "moledetGeographyAccuracy",
};

const MAP_FIELD = {
  math: "mathOperations",
  geometry: "geometryTopics",
  english: "englishTopics",
  science: "scienceTopics",
  hebrew: "hebrewTopics",
  "moledet-geography": "moledetGeographyTopics",
};

/** Mirrors runtime practice → engine decision (high level only; does not replace the adaptive planner). */
function inferEngineDecisionFromCounts(totalQuestions, accuracyPct) {
  const n = Math.max(0, Math.round(Number(totalQuestions) || 0));
  const acc = Math.min(100, Math.max(0, Number(accuracyPct) || 0));
  if (n < 2) return "insufficient_data";
  if (acc < 38 && n >= 6) return "remediate";
  if (acc >= 88 && n >= 16) return "advance";
  if (acc >= 72) return "maintain";
  return "review";
}

/**
 * @param {string} engineDecision
 * @returns {{ plannerNextAction: string, plannerTargetDifficulty: string, plannerQuestionCount: number }}
 */
function plannerShapeFromEngineDecision(engineDecision) {
  const e = String(engineDecision || "").toLowerCase();
  if (e === "insufficient_data") {
    return { plannerNextAction: "pause_collect_more_data", plannerTargetDifficulty: "standard", plannerQuestionCount: 3 };
  }
  if (e === "remediate") {
    return { plannerNextAction: "practice_current", plannerTargetDifficulty: "basic", plannerQuestionCount: 5 };
  }
  if (e === "advance") {
    return { plannerNextAction: "advance_skill", plannerTargetDifficulty: "advanced", plannerQuestionCount: 4 };
  }
  if (e === "maintain") {
    return { plannerNextAction: "maintain_skill", plannerTargetDifficulty: "standard", plannerQuestionCount: 4 };
  }
  if (e === "review") {
    return { plannerNextAction: "practice_current", plannerTargetDifficulty: "standard", plannerQuestionCount: 4 };
  }
  return { plannerNextAction: "maintain_skill", plannerTargetDifficulty: "standard", plannerQuestionCount: 4 };
}

/**
 * @param {Record<string, unknown>|null|undefined} report
 */
function pickPrimarySubjectKey(report) {
  const s = report?.summary;
  if (!s || typeof s !== "object") return "math";
  let best = "math";
  let bestQ = -1;
  for (const sid of SUBJECT_KEYS) {
    const k = SUMMARY_Q[sid];
    const q = Number(s[k]) || 0;
    if (q > bestQ) {
      bestQ = q;
      best = sid;
    }
  }
  return best;
}

/**
 * @param {Record<string, unknown>|null|undefined} report
 * @param {string} subjectKey
 */
function inferGradeFragment(report, subjectKey) {
  const mapName = MAP_FIELD[subjectKey];
  const m = mapName && report && typeof report === "object" ? report[mapName] : null;
  if (!m || typeof m !== "object") return "g3";
  const counts = {};
  for (const row of Object.values(m)) {
    if (!row || typeof row !== "object") continue;
    const g = String(row.gradeKey || "")
      .trim()
      .toLowerCase();
    if (!/^g[1-6]$/.test(g)) continue;
    const w = Number(row.questions) || 0;
    counts[g] = (counts[g] || 0) + w;
  }
  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return ranked.length ? ranked[0][0] : "g3";
}

/**
 * @param {string} band
 */
function accuracyBandFromPct(band) {
  const a = Number(band) || 0;
  if (a >= 85) return "high";
  if (a >= 70) return "moderate";
  if (a >= 50) return "mixed";
  return "low";
}

/**
 * @param {number} n
 */
function dataConfidenceFromCount(n) {
  const q = Number(n) || 0;
  if (q >= 40) return "strong";
  if (q >= 12) return "moderate";
  if (q >= 6) return "low";
  return "thin";
}

/**
 * @param {Record<string, unknown>|null|undefined} report
 */
function inferConsistencyBand(report) {
  const hybrid = report?.hybridRuntime;
  if (hybrid && typeof hybrid === "object") {
    const g = hybrid.guessingLikelihoodHigh === true || hybrid.guessHeavy === true;
    if (g) return "possibly_fast";
  }
  return "stable";
}

/**
 * Build short Hebrew snippets already shown elsewhere on the report (no new diagnostics).
 * @param {Record<string, unknown>} report
 */
function buildStrengthAndNeedsLines(report) {
  const ov = report.summary?.diagnosticOverviewHe && typeof report.summary.diagnosticOverviewHe === "object"
    ? report.summary.diagnosticOverviewHe
    : {};
  const partsS = [];
  if (ov.strongestAreaLineHe) partsS.push(String(ov.strongestAreaLineHe).trim());
  const rms = Array.isArray(report.rawMetricStrengthsHe)
    ? report.rawMetricStrengthsHe
    : Array.isArray(report.summary?.rawMetricStrengthsHe)
      ? report.summary.rawMetricStrengthsHe
      : [];
  for (const line of rms) {
    const t = String(line || "").trim();
    if (t) partsS.push(t);
    if (partsS.length >= 2) break;
  }
  const partsN = [];
  if (ov.mainFocusAreaLineHe) partsN.push(String(ov.mainFocusAreaLineHe).trim());
  if (Array.isArray(ov.requiresAttentionPreviewHe)) {
    for (const x of ov.requiresAttentionPreviewHe) {
      const t = String(x || "").trim();
      if (t) partsN.push(t);
      if (partsN.length >= 2) break;
    }
  }
  return {
    mainStrengths: partsS.join(" · ").slice(0, 280),
    mainPracticeNeeds: partsN.join(" · ").slice(0, 280),
  };
}

/**
 * Maps a `generateParentReportV2` snapshot to strict explainer input, or null if insufficient.
 * @param {Record<string, unknown>|null|undefined} report
 */
export function buildStrictParentReportAIInputFromParentReportV2(report) {
  if (!report || typeof report !== "object") return null;
  const subject = pickPrimarySubjectKey(report);
  const qk = SUMMARY_Q[subject];
  const ak = SUMMARY_ACC[subject];
  const s = report.summary && typeof report.summary === "object" ? report.summary : {};
  const nSubject = Math.max(0, Math.round(Number(s[qk]) || 0));
  const accSubject = Math.min(100, Math.max(0, Number(s[ak]) || 0));
  const totalQ = Math.max(0, Math.round(Number(s.totalQuestions) || 0));
  if (nSubject <= 0 && totalQ <= 0) return null;

  const nForEngine = nSubject > 0 ? nSubject : totalQ;
  const accForEngine = nSubject > 0 ? accSubject : Math.min(100, Math.max(0, Number(s.overallAccuracy) || 0));
  const engine = inferEngineDecisionFromCounts(nForEngine, accForEngine);
  const { plannerNextAction, plannerTargetDifficulty, plannerQuestionCount } = plannerShapeFromEngineDecision(engine);
  const recommendedNextStep = mapPlannerNextActionToHebrew(plannerNextAction);
  const grade = inferGradeFragment(report, subject);
  const { mainStrengths, mainPracticeNeeds } = buildStrengthAndNeedsLines(report);
  const nForConfidence = Math.max(nSubject, totalQ);
  const raw = {
    subject,
    grade,
    plannerNextAction,
    plannerTargetDifficulty,
    plannerQuestionCount,
    accuracyBand: accuracyBandFromPct(nSubject > 0 ? accSubject : Number(s.overallAccuracy) || 0),
    consistencyBand: inferConsistencyBand(report),
    dataConfidence: dataConfidenceFromCount(nForConfidence),
    mainStrengths,
    mainPracticeNeeds,
    recommendedNextStep,
  };
  return buildStrictParentReportAIInput(raw);
}

/**
 * Produces validated parent-facing explanation for attachment to the V2 report object.
 * @param {Record<string, unknown>} report
 * @param {{ env?: Record<string, string | undefined>, preferDeterministicOnly?: boolean }} [options]
 * @returns {Promise<{ parentAiExplanation: { ok: true, text: string, source: "deterministic_fallback"|"ai" } | null }>}
 */
export async function enrichParentReportWithParentAi(report, options = {}) {
  try {
    const strict = buildStrictParentReportAIInputFromParentReportV2(report);
    if (!strict) return { parentAiExplanation: null };
    const out = await buildParentReportAIExplanation(strict, {
      env: options.env || (typeof process !== "undefined" ? process.env : {}),
      preferDeterministicOnly: options.preferDeterministicOnly === true,
    });
    if (!out.ok || !out.text) return { parentAiExplanation: null };
    return { parentAiExplanation: { ok: true, text: out.text, source: out.source } };
  } catch {
    return { parentAiExplanation: null };
  }
}
