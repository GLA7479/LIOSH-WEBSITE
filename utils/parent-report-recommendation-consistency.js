import { normalizeParentFacingHe } from "./parent-report-language/index.js";

function canonicalState(unit) {
  return unit?.canonicalState || null;
}

function actionState(unit) {
  const cs = canonicalState(unit);
  if (cs) return cs.actionState;
  if (unit?.outputGating?._deprecated_positiveConclusionAllowed || unit?.outputGating?.positiveConclusionAllowed) {
    const r = unit?.outputGating?.contractsV1?.readiness?.readiness;
    if (r === "insufficient" || r === "cannot_conclude") return "probe_only";
    return "maintain";
  }
  return "probe_only";
}

function isStrengthAction(unit) {
  const a = actionState(unit);
  return a === "maintain" || a === "expand_cautiously";
}

function positiveAuthorityLevel(unit) {
  const csLevel = canonicalState(unit)?.evidence?.positiveAuthorityLevel;
  if (csLevel) return csLevel;
  return unit?.outputGating?.positiveAuthorityLevel || "none";
}

const STRONG_POSITIVE_BLOCKED_FAMILIES = [
  "reduced_complexity",
  "monitoring_only",
  "collect_signal",
  "remedial",
  "diagnose_only",
  "probe_only",
];

/**
 * Classify recommendation state from canonical state only.
 */
export function classifyParentRecommendationState(unit) {
  if (isStrengthAction(unit)) {
    const level = positiveAuthorityLevel(unit);
    const RANK = { excellent: 3, very_good: 2, good: 1, none: 0 };
    return {
      classId: "strong_positive_actionable",
      blockedFamilies: STRONG_POSITIVE_BLOCKED_FAMILIES,
      state: {
        actionState: actionState(unit),
        authorityRank: RANK[level] || 0,
        readiness: canonicalState(unit)?.assessment?.readiness || "insufficient",
        family: canonicalState(unit)?.recommendation?.family || "probe_only",
      },
    };
  }
  return {
    classId: "regular_flow",
    blockedFamilies: [],
    state: {
      actionState: actionState(unit),
      authorityRank: 0,
      readiness: canonicalState(unit)?.assessment?.readiness || "insufficient",
      family: canonicalState(unit)?.recommendation?.family || "probe_only",
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
  const cs = canonicalState(unit);
  const action = actionState(unit);
  const name = topicName(unit);

  if (cs?.recommendation?.allowed) {
    const family = cs.recommendation.family;
    if (family === "expand_cautiously") {
      return normalizeParentFacingHe(
        `ב${name} מומלץ לשמר את אותה רמת מורכבות, ולהוסיף הרחבה זהירה ומדודה רק אם העקביות נשמרת גם בסבב הבא.`
      );
    }
    if (family === "maintain") {
      return normalizeParentFacingHe(
        `ב${name} מומלץ להמשיך באותה רמת קושי, לשמר עקביות, ורק אחר כך לשקול הרחבה עדינה בתוך אותו עיקרון.`
      );
    }
  }

  if (!cs && isStrengthAction(unit)) {
    if (action === "expand_cautiously") {
      return normalizeParentFacingHe(
        `ב${name} מומלץ לשמר את אותה רמת מורכבות, ולהוסיף הרחבה זהירה ומדודה רק אם העקביות נשמרת גם בסבב הבא.`
      );
    }
    return normalizeParentFacingHe(
      `ב${name} מומלץ להמשיך באותה רמת קושי, לשמר עקביות, ורק אחר כך לשקול הרחבה עדינה בתוך אותו עיקרון.`
    );
  }

  if (action === "withhold") return null;
  const fallback = bestEffortText(
    unit?.intervention?.immediateActionHe || unit?.probe?.specificationHe || ""
  );
  return fallback || null;
}

export function resolveUnitNextGoalHe(unit) {
  const cs = canonicalState(unit);
  if (isStrengthAction(unit) && (cs?.recommendation?.allowed || !cs)) {
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
  const cs = canonicalState(unit);
  if (isStrengthAction(unit) && (cs?.recommendation?.allowed || !cs)) {
    const name = topicName(unit);
    return normalizeParentFacingHe(
      `ב${name} הדגש הוא שימור יציבות באותה רמה, עם תרגול קצר ועקבי והעשרה עדינה בלבד.`
    );
  }
  const fallback = bestEffortText(unit?.intervention?.shortPracticeHe || "");
  return fallback || null;
}

export function isStrongPositiveUnitForParentGuidance(unit) {
  return isStrengthAction(unit);
}
