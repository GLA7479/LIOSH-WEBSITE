/**
 * Unified internal professional engine payload (not parent-facing copy).
 */

import { normalizeMistakeEvent } from "../mistake-event.js";
import { aggregateMisconceptionsForSubject } from "./misconception-engine-v1.js";
import { computeMasteryRollupV1 } from "./mastery-engine-v1.js";
import { analyzePrerequisiteGap } from "./dependency-engine-v1.js";
import { buildCalibrationV1 } from "./calibration-engine-v1.js";
import { assessReliabilityV1 } from "./reliability-engine-v1.js";
import { buildProbeRecommendationsV1 } from "./probe-engine-v1.js";
import { detectCrossSubjectPatternsV1 } from "./cross-subject-engine-v1.js";

export const PROFESSIONAL_ENGINE_OUTPUT_V1 = "1.0.0";

const SUBJECTS = ["math", "hebrew", "english", "science", "geometry", "moledet-geography"];

/**
 * @param {object} diagnosticEngineV2
 * @param {Record<string, Record<string, unknown>>} maps
 * @param {Record<string, unknown>} summaryCounts
 * @param {object} opts
 * @param {Record<string, unknown[]>} opts.rawMistakesBySubject
 * @param {number} opts.startMs
 * @param {number} opts.endMs
 * @param {string|null} [opts.studentGradeKey]
 */
export function enrichDiagnosticEngineV2WithProfessionalEngineV1(
  diagnosticEngineV2,
  maps,
  summaryCounts = {},
  opts = {}
) {
  if (!diagnosticEngineV2 || typeof diagnosticEngineV2 !== "object") return diagnosticEngineV2;

  const rawMistakesBySubject = opts.rawMistakesBySubject || {};
  const startMs = Number(opts.startMs) || 0;
  const endMs = Number(opts.endMs) || Date.now();
  const studentGradeKey = opts.studentGradeKey ?? null;

  /** @type {Record<string, ReturnType<typeof aggregateMisconceptionsForSubject>>} */
  const misconceptions = {};
  for (const sid of SUBJECTS) {
    const raw = rawMistakesBySubject[sid] || [];
    const wrongs = [];
    for (const m of raw) {
      const ev = normalizeMistakeEvent(m, sid);
      const t = Number(ev.timestamp);
      if (Number.isFinite(t) && (t < startMs || t > endMs)) continue;
      if (!ev.isCorrect) wrongs.push(ev);
    }
    misconceptions[sid] = aggregateMisconceptionsForSubject(sid, wrongs);
  }

  const mastery = computeMasteryRollupV1(maps, summaryCounts);
  const calibration = buildCalibrationV1(maps, summaryCounts, studentGradeKey);
  const reliability = assessReliabilityV1(maps, rawMistakesBySubject, startMs, endMs);
  const crossSubjectPatterns = detectCrossSubjectPatternsV1(maps, summaryCounts);

  /** @type {object[]} */
  const dependencyItems = [];
  for (const m of mastery.items || []) {
    if (m.masteryBand === "emerging" || Number(m.masteryScore) < 55) {
      dependencyItems.push(analyzePrerequisiteGap({ mastery, subjectId: m.subjectId, skillId: m.skillId }));
    }
  }

  const totalQ = Number(summaryCounts.totalQuestions) || 0;
  const thin = totalQ < 25;
  const firstWeak = mastery.items.find((x) => Number(x.masteryScore) < 60);

  const probes = buildProbeRecommendationsV1({
    thinData: thin ? "true" : "false",
    volumeHint: thin ? "low" : "ok",
    targetSubjectId: firstWeak?.subjectId,
    targetSkillId: firstWeak?.skillId,
    prerequisiteUncertainty: dependencyItems.some((d) => d.suspectedPrerequisiteGap) ? "yes" : null,
    prerequisiteSkillId: dependencyItems[0]?.nextBestPrerequisiteToCheck,
  });

  const pf = diagnosticEngineV2.professionalFrameworkV1;
  const structured = Array.isArray(pf?.structuredFindings) ? pf.structuredFindings : [];

  let engineConfidence = "medium";
  if (thin || reliability.dataTrustLevel === "very_low") engineConfidence = "low";
  if (reliability.dataTrustLevel === "moderate" && totalQ >= 60) engineConfidence = "high";

  const globalDoNotConclude = [
    ...(pf?.globalDoNotConclude || []),
    "Educational diagnostic support only—not a medical or clinical assessment.",
    "Cross-subject patterns require confirming probes in each involved subject.",
  ];

  diagnosticEngineV2.professionalEngineV1 = {
    version: PROFESSIONAL_ENGINE_OUTPUT_V1,
    generatedAt: new Date().toISOString(),
    studentWindow: { startMs, endMs },
    subjects: SUBJECTS.filter((s) => getSubjectVolume(summaryCounts, s) > 0),
    skillFindings: structured,
    subskillFindings: [],
    misconceptions,
    mastery,
    dependencies: { version: "1.0.0", items: dependencyItems },
    reliability,
    calibration,
    probes,
    crossSubjectPatterns,
    globalDoNotConclude,
    engineConfidence,
    engineReadiness: thin ? "needs_more_data" : "ready_for_internal_review",
    limitations: [
      "English generator metadata varies by pool row coverage.",
      "Mastery aggregates by skill—subskill precision depends on future tagging density.",
    ],
  };

  return diagnosticEngineV2;
}

function getSubjectVolume(summaryCounts, sid) {
  const k = {
    math: "mathQuestions",
    hebrew: "hebrewQuestions",
    english: "englishQuestions",
    science: "scienceQuestions",
    geometry: "geometryQuestions",
    "moledet-geography": "moledetGeographyQuestions",
  }[sid];
  return Number(summaryCounts?.[k]) || 0;
}

/**
 * Build standalone output object (for QA / tooling without mutating engine).
 */
export function buildProfessionalEngineOutputV1(diagnosticEngineV2, maps, summaryCounts, opts) {
  const clone = {
    ...diagnosticEngineV2,
    units: diagnosticEngineV2?.units,
  };
  enrichDiagnosticEngineV2WithProfessionalEngineV1(clone, maps, summaryCounts, opts);
  return clone.professionalEngineV1;
}
