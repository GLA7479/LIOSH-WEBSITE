/**
 * Shared layout vars for learning master pages (--head-h, --game-h).
 * Uses the game wrap's real inner height (after shell padding) instead of window.innerHeight
 * so --game-h matches the flex column and reduces clipping / dead bands on mobile.
 */
export const LEARNING_SHELL_MIN_GAME_H = 260;

/** Space for title + mode row + gaps below the stats strip (conservative). */
export const LEARNING_SHELL_BELOW_CONTROLS_EST = 200;

/**
 * @param {{ wrapRef: React.RefObject<HTMLElement | null>, headerRef: React.RefObject<HTMLElement | null>, controlsRef: React.RefObject<HTMLElement | null> }} refs
 */
export function applyLearningShellLayoutVars({ wrapRef, headerRef, controlsRef }) {
  if (typeof window === "undefined") return;
  const wrap = wrapRef?.current;
  if (!wrap) return;

  const headH = headerRef?.current?.offsetHeight ?? 56;
  document.documentElement.style.setProperty("--head-h", `${headH}px`);

  const controlsH = controlsRef?.current?.offsetHeight ?? 40;
  const avail = wrap.clientHeight;
  const used = headH + controlsH + LEARNING_SHELL_BELOW_CONTROLS_EST;
  const freeH = Math.max(LEARNING_SHELL_MIN_GAME_H, avail - used);
  document.documentElement.style.setProperty("--game-h", `${freeH}px`);
}
