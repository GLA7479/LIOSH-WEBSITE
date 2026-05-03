/**
 * Deterministic view-model for student-safe planner recommendation UI (Hebrew copy is fixed constants only).
 */

/** @type {string} */
export const PLANNER_UI_SECTION_TITLE = "המלצת תרגול";

/** @type {string} */
export const PLANNER_UI_DIFFICULTY_LABEL = "רמת תרגול מומלצת";

/** @type {string} */
export const PLANNER_UI_QUESTION_COUNT_LABEL = "מספר שאלות מומלץ";

/** Approved Hebrew copy only — maps planner `nextAction` (NEXT_ACTIONS). */
const FALLBACK_ACTION_HE = "כדאי להמשיך לתרגל לפי ההתקדמות שלך";

/**
 * @param {unknown} nextAction
 */
export function mapPlannerNextActionToHebrew(nextAction) {
  const n = String(nextAction || "").toLowerCase().trim();
  if (n === "advance_skill") return "אפשר להתקדם לשלב הבא";
  if (n === "maintain_skill") return "כדאי להמשיך לתרגל באותה רמה";
  if (n === "practice_current") return "כדאי לחזק את הבסיס לפני שמתקדמים";
  if (n === "review_prerequisite") return "כדאי לבצע חזרה קצרה";
  if (n === "probe_skill") return "כדאי לבצע חזרה קצרה";
  if (n === "pause_collect_more_data") return FALLBACK_ACTION_HE;
  return FALLBACK_ACTION_HE;
}

/**
 * Student-safe gates: never surfaces reasonCodes, mustNotSay, diagnostics, or errors.
 * @param {unknown} apiPayload — JSON body from /api/learning/planner-recommendation
 * @returns {{ sectionTitle: string, actionLine: string, difficultyLabel: string, difficultyValue: string | null, questionLabel: string, questionValue: number, forPractice: { nextAction: string, targetDifficulty: string, questionCount: number } } | null}
 */
export function buildPlannerRecommendationViewModel(apiPayload) {
  if (!apiPayload || typeof apiPayload !== "object") return null;
  const root = /** @type {Record<string, unknown>} */ (apiPayload);
  if (root.ok !== true) return null;

  const diagnostics = root.diagnostics && typeof root.diagnostics === "object" ? root.diagnostics : {};
  const d = /** @type {Record<string, unknown>} */ (diagnostics);
  if (Number(d.safetyViolationCount) > 0) return null;
  if (d.metadataSubjectFallback === true) return null;

  const rec = root.recommendation && typeof root.recommendation === "object" ? root.recommendation : null;
  if (!rec) return null;

  const nextAction = rec.nextAction;
  const nextActionStr = nextAction != null ? String(nextAction).trim() : "";
  const targetDifficulty = rec.targetDifficulty != null ? String(rec.targetDifficulty).trim() : "";
  const qc = Number(rec.questionCount);
  const questionCount = Number.isFinite(qc) && qc >= 0 ? Math.round(qc) : 0;

  return {
    sectionTitle: PLANNER_UI_SECTION_TITLE,
    actionLine: mapPlannerNextActionToHebrew(nextAction),
    difficultyLabel: PLANNER_UI_DIFFICULTY_LABEL,
    difficultyValue: targetDifficulty || null,
    questionLabel: PLANNER_UI_QUESTION_COUNT_LABEL,
    questionValue: questionCount,
    /** Machine fields for recommended-practice adapter only — not rendered as free text. */
    forPractice: {
      nextAction: nextActionStr,
      targetDifficulty: targetDifficulty || "",
      questionCount,
    },
  };
}
