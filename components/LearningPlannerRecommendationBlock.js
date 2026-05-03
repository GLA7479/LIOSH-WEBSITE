/**
 * Compact planner recommendation for learning master lobby (RTL, existing shell styles).
 */

import {
  PLANNER_RECOMMENDED_PRACTICE_BUTTON_HE,
  shouldRenderPlannerRecommendedPracticeButton,
} from "../lib/learning-client/adaptive-planner-recommended-practice";

/**
 * @param {{
 *   model: { sectionTitle: string, actionLine: string, difficultyLabel: string, difficultyValue: string | null, questionLabel: string, questionValue: number, forPractice?: unknown } | null,
 *   onRecommendedPractice?: () => void,
 * }} props
 */
export default function LearningPlannerRecommendationBlock({ model, onRecommendedPractice }) {
  if (!model) return null;
  const showRecommendedBtn = shouldRenderPlannerRecommendedPracticeButton(model, onRecommendedPractice);

  return (
    <div
      className="bg-black/25 border border-white/15 rounded-lg px-2 py-2 mb-3 w-full max-w-lg shadow-sm"
      dir="rtl"
      data-testid="learning-planner-recommendation-block"
    >
      <div className="text-[10px] text-white/60 mb-1">{model.sectionTitle}</div>
      <p className="text-xs font-bold text-white leading-snug mb-2">{model.actionLine}</p>
      <div className="text-[10px] text-white/70 space-y-1">
        {model.difficultyValue ? (
          <div className="flex flex-wrap items-baseline gap-x-1 gap-y-0.5 justify-between">
            <span className="text-white/60 shrink-0">{model.difficultyLabel}</span>
            <span className="font-semibold text-white/90 tabular-nums" dir="ltr">
              {model.difficultyValue}
            </span>
          </div>
        ) : null}
        <div className="flex flex-wrap items-baseline gap-x-1 gap-y-0.5 justify-between">
          <span className="text-white/60 shrink-0">{model.questionLabel}</span>
          <span className="font-semibold text-emerald-200 tabular-nums" dir="ltr">
            {model.questionValue}
          </span>
        </div>
      </div>
      {showRecommendedBtn ? (
        <button
          type="button"
          data-testid="learning-planner-recommended-practice-btn"
          className="mt-2 h-9 w-full rounded-lg bg-emerald-500/80 hover:bg-emerald-500 font-bold text-xs text-white shadow-sm"
          onClick={() => {
            try {
              onRecommendedPractice?.();
            } catch {
              /* never throw into student UI */
            }
          }}
        >
          {PLANNER_RECOMMENDED_PRACTICE_BUTTON_HE}
        </button>
      ) : null}
    </div>
  );
}
