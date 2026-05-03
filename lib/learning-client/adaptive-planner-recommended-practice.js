/**
 * Deterministic bridge from student-safe planner view-model → existing session start options.
 * No question generation, no AI, no diagnostic engine duplication.
 */

/** @type {string} */
export const PLANNER_RECOMMENDED_PRACTICE_BUTTON_HE = "המשך לתרגול מומלץ";

/**
 * Map planner tier strings to tri-level UI used by learning masters (easy / medium / hard).
 * Returns null when unknown — callers keep current level.
 * @param {unknown} raw
 * @returns {"easy"|"medium"|"hard"|null}
 */
export function mapPlannerTargetDifficultyToTriLevel(raw) {
  const s = String(raw || "").trim().toLowerCase();
  if (!s) return null;
  if (s === "easy" || s === "medium" || s === "hard") return s;
  const easyLike = new Set([
    "intro",
    "beginner",
    "foundational",
    "remedial",
    "light",
    "novice",
    "foundation",
  ]);
  const mediumLike = new Set([
    "standard",
    "core",
    "developing",
    "intermediate",
    "typical",
    "on_level",
    "on-level",
  ]);
  const hardLike = new Set([
    "stretch",
    "advanced",
    "proficient",
    "challenge",
    "expert",
    "enrichment",
  ]);
  if (easyLike.has(s)) return "easy";
  if (mediumLike.has(s)) return "medium";
  if (hardLike.has(s)) return "hard";
  return null;
}

/**
 * @param {unknown} model — output of buildPlannerRecommendationViewModel
 * @returns {{ ok: true, source: string, startOptions: { recommended: true, targetDifficulty: string, questionCount: number, nextAction: string } } | { ok: false, reason: string }}
 */
export function buildRecommendedPracticeFromViewModel(model) {
  if (!model || typeof model !== "object") {
    return { ok: false, reason: "missing_view_model" };
  }
  const m = /** @type {Record<string, unknown>} */ (model);
  const fp = m.forPractice;
  if (!fp || typeof fp !== "object") {
    return { ok: false, reason: "missing_for_practice" };
  }
  const f = /** @type {Record<string, unknown>} */ (fp);
  const nextAction = f.nextAction != null ? String(f.nextAction).trim() : "";
  if (!nextAction) {
    return { ok: false, reason: "missing_next_action" };
  }
  const targetDifficulty = f.targetDifficulty != null ? String(f.targetDifficulty).trim() : "";
  const qc = Number(f.questionCount);
  const questionCount = Number.isFinite(qc) && qc >= 0 ? Math.round(qc) : 0;
  return {
    ok: true,
    source: "adaptive_planner_recommended_practice",
    startOptions: {
      recommended: true,
      targetDifficulty,
      questionCount,
      nextAction,
    },
  };
}

/**
 * Merge planner QA markers into session start clientMeta (debug / analytics only).
 * @param {Record<string, unknown>} baseClientMeta
 * @param {Record<string, unknown>} plannerMeta
 */
export function mergePlannerSessionClientMeta(baseClientMeta, plannerMeta) {
  if (!baseClientMeta || typeof baseClientMeta !== "object") return baseClientMeta;
  if (!plannerMeta || typeof plannerMeta !== "object") return baseClientMeta;
  const out = { ...baseClientMeta };
  if (plannerMeta.plannerRecommended === true) {
    out.plannerRecommended = true;
  }
  if (plannerMeta.plannerNextAction != null) {
    out.plannerNextAction = String(plannerMeta.plannerNextAction).slice(0, 64);
  }
  if (plannerMeta.plannerTargetDifficulty != null) {
    out.plannerTargetDifficulty = String(plannerMeta.plannerTargetDifficulty).slice(0, 64);
  }
  if (typeof plannerMeta.plannerQuestionCount === "number" && Number.isFinite(plannerMeta.plannerQuestionCount)) {
    out.plannerQuestionCount = Math.max(0, Math.min(1_000_000, Math.round(plannerMeta.plannerQuestionCount)));
  }
  return out;
}

/**
 * Pure rule for whether the recommended-practice affordance should show (deterministic tests).
 * @param {unknown} model
 * @param {unknown} onRecommendedPractice
 */
export function shouldRenderPlannerRecommendedPracticeButton(model, onRecommendedPractice) {
  if (typeof onRecommendedPractice !== "function") return false;
  const built = buildRecommendedPracticeFromViewModel(model);
  return built.ok === true;
}
