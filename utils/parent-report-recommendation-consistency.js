import { normalizeParentFacingHe } from "./parent-report-language/index.js";

const POSITIVE_LEVEL_RANK = { excellent: 3, very_good: 2, good: 1, none: 0 };
const READY_STATES = new Set(["ready", "forming"]);
const STRONG_POSITIVE_MIN_QUESTIONS = 18;
const STRONG_POSITIVE_MIN_ACCURACY = 88;
const STRONG_POSITIVE_MIN_AUTHORITY_RANK = 2; // very_good or excellent
const BLOCKED_FAMILY_MARKERS = [
  "reduced_complexity",
  "remedial_support_first",
  "collect_more_signal",
  "monitoring_only",
];

function readVolumeSignals(unit) {
  const trace = Array.isArray(unit?.evidenceTrace) ? unit.evidenceTrace : [];
  const volume = trace.find((x) => String(x?.type || "") === "volume")?.value || {};
  const questions = Number(volume?.questions);
  const accuracy = Number(volume?.accuracy);
  const q = Number.isFinite(questions) ? questions : 0;
  const acc = Number.isFinite(accuracy) ? accuracy : 0;
  return { q, acc };
}

function positiveAuthorityRank(unit) {
  const level = String(unit?.outputGating?.positiveAuthorityLevel || "none");
  return POSITIVE_LEVEL_RANK[level] || 0;
}

function readinessState(unit) {
  return String(unit?.outputGating?.contractsV1?.readiness?.readiness || "").trim().toLowerCase();
}

function evidenceSufficientForStrongPositive(unit) {
  const { q, acc } = readVolumeSignals(unit);
  return q >= STRONG_POSITIVE_MIN_QUESTIONS && acc >= STRONG_POSITIVE_MIN_ACCURACY;
}

function hasStrongPositiveShape(unit) {
  const positive = !!unit?.outputGating?.positiveConclusionAllowed;
  if (!positive) return false;
  const readiness = readinessState(unit);
  const levelOk = positiveAuthorityRank(unit) >= STRONG_POSITIVE_MIN_AUTHORITY_RANK;
  const metricsOk = evidenceSufficientForStrongPositive(unit);
  const readinessOk = READY_STATES.has(readiness) || readiness === "";
  return levelOk && metricsOk && readinessOk;
}

/**
 * Strong-positive recommendation class for parent-facing guidance.
 * This class explicitly blocks remedial/support-first recommendation families.
 */
export function classifyParentRecommendationState(unit) {
  if (hasStrongPositiveShape(unit)) {
    return {
      classId: "strong_positive_actionable",
      blockedFamilies: [...BLOCKED_FAMILY_MARKERS],
      state: {
        positiveConclusionAllowed: true,
        authorityRank: positiveAuthorityRank(unit),
        sufficientEvidence: evidenceSufficientForStrongPositive(unit),
        readiness: readinessState(unit) || "ready_or_forming_unspecified",
      },
    };
  }
  return {
    classId: "regular_flow",
    blockedFamilies: [],
    state: {
      positiveConclusionAllowed: !!unit?.outputGating?.positiveConclusionAllowed,
      authorityRank: positiveAuthorityRank(unit),
      sufficientEvidence: evidenceSufficientForStrongPositive(unit),
      readiness: readinessState(unit) || "unspecified",
    },
  };
}

function topicName(unit) {
  return String(unit?.displayName || "הנושא").trim() || "הנושא";
}

function bestEffortText(s) {
  const t = String(s || "").trim();
  return t ? normalizeParentFacingHe(t) : "";
}

export function resolveUnitParentActionHe(unit) {
  const cls = classifyParentRecommendationState(unit);
  if (cls.classId === "strong_positive_actionable") {
    const level = String(unit?.outputGating?.positiveAuthorityLevel || "none");
    const name = topicName(unit);
    if (level === "excellent") {
      return normalizeParentFacingHe(
        `ב${name} מומלץ לשמר את אותה רמת מורכבות, ולהוסיף הרחבה זהירה ומדודה רק אם העקביות נשמרת גם בסבב הבא.`
      );
    }
    return normalizeParentFacingHe(
      `ב${name} מומלץ להמשיך באותה רמת קושי, לשמר עקביות, ורק אחר כך לשקול הרחבה עדינה בתוך אותו עיקרון.`
    );
  }
  const fallback = bestEffortText(
    unit?.intervention?.immediateActionHe || unit?.probe?.specificationHe || ""
  );
  return fallback || null;
}

export function resolveUnitNextGoalHe(unit) {
  const cls = classifyParentRecommendationState(unit);
  if (cls.classId === "strong_positive_actionable") {
    const name = topicName(unit);
    return normalizeParentFacingHe(
      `לשבוע הקרוב ב${name}: לשמור על דיוק גבוה באותה מורכבות, ואם נשמרת יציבות — לנסות הרחבה קלה ומבוקרת.`
    );
  }
  const fallback = bestEffortText(
    unit?.probe?.objectiveHe || unit?.intervention?.shortPracticeHe || ""
  );
  return fallback || null;
}

export function resolveUnitHomeMethodHe(unit) {
  const cls = classifyParentRecommendationState(unit);
  if (cls.classId === "strong_positive_actionable") {
    const name = topicName(unit);
    return normalizeParentFacingHe(
      `ב${name} הדגש הוא שימור יציבות באותה רמה, עם תרגול קצר ועקבי והעשרה עדינה בלבד.`
    );
  }
  const fallback = bestEffortText(unit?.intervention?.shortPracticeHe || "");
  return fallback || null;
}

export function isStrongPositiveUnitForParentGuidance(unit) {
  return hasStrongPositiveShape(unit);
}

