/**
 * Canonical "mode" string for Parent Report session rows (shared across learning masters).
 * @param {string} mode - primary game mode (learning, practice, challenge, speed, …)
 * @param {string} [focusedPracticeMode] - normal | mistakes | graded (when mode === practice)
 */
export function reportModeFromGameState(mode, focusedPracticeMode = "normal") {
  const m = mode || "learning";
  if (m === "practice") {
    if (focusedPracticeMode === "mistakes") return "practice_mistakes";
    if (focusedPracticeMode === "graded") return "graded";
  }
  return m;
}
