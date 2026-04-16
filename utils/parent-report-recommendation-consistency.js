import { normalizeParentFacingHe } from "./parent-report-language/index.js";

function canonicalState(unit) {
  return unit?.canonicalState || null;
}

function actionState(unit) {
  return canonicalState(unit)?.actionState || "probe_only";
}

function isStrengthAction(unit) {
  const a = actionState(unit);
  return a === "maintain" || a === "expand_cautiously";
}

function positiveAuthorityLevel(unit) {
  return canonicalState(unit)?.evidence?.positiveAuthorityLevel || "none";
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
  const name = topicName(unit);

  if (cs?.recommendation?.allowed) {
    const family = cs.recommendation.family;
    if (family === "expand_cautiously") {
      return normalizeParentFacingHe(
        `ב${name} מומלץ להישאר בינתיים באותה רמה, ורק אם ההצלחה נמשכת גם בהמשך — להוסיף קושי קטן ומדוד.`
      );
    }
    if (family === "maintain") {
      return normalizeParentFacingHe(
        `ב${name} מומלץ להמשיך באותה רמה, ורק אם זה ממשיך להצליח באופן יציב — להוסיף מעט קושי.`
      );
    }
  }

  const action = actionState(unit);
  if (action === "withhold" || action === "probe_only") return null;
  const fallback = bestEffortText(
    unit?.intervention?.immediateActionHe || unit?.probe?.specificationHe || ""
  );
  return fallback || null;
}

export function resolveUnitNextGoalHe(unit) {
  const cs = canonicalState(unit);
  if (isStrengthAction(unit) && cs?.recommendation?.allowed) {
    const name = topicName(unit);
    return normalizeParentFacingHe(
      `לשבוע הקרוב ב${name}: להמשיך באותה רמה, ואם ההצלחה נשמרת — לנסות צעד אחד מעט מאתגר יותר.`
    );
  }
  const fallback = bestEffortText(
    unit?.probe?.objectiveHe || unit?.intervention?.shortPracticeHe || ""
  );
  return fallback || null;
}

export function resolveUnitHomeMethodHe(unit) {
  const cs = canonicalState(unit);
  if (isStrengthAction(unit) && cs?.recommendation?.allowed) {
    const name = topicName(unit);
    return normalizeParentFacingHe(
      `ב${name} עדיף תרגול קצר וקבוע באותה רמה, בלי לקפוץ מהר קדימה.`
    );
  }
  const fallback = bestEffortText(unit?.intervention?.shortPracticeHe || "");
  return fallback || null;
}

export function isStrongPositiveUnitForParentGuidance(unit) {
  return isStrengthAction(unit);
}
