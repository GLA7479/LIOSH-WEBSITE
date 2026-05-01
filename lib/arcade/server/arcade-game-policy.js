/**
 * Controls whether arcade spends are allowed for games still in foundation/disabled state.
 * Production default: real students cannot spend coins on foundation-only or disabled games.
 */

export function allowFoundationArcadeActions() {
  return String(process.env.ARCADE_ALLOW_FOUNDATION_ACTIONS || "").trim() === "true";
}

/**
 * @param {Record<string, unknown>} gameRow — row from arcade_games (snake_case fields from PostgREST)
 */
export function assertGameAllowsArcadeSpend(gameRow) {
  if (!gameRow || typeof gameRow !== "object") {
    return { error: { code: "unknown_game", message: "משחק לא קיים" } };
  }

  if (allowFoundationArcadeActions()) {
    return { ok: true };
  }

  const enabled = gameRow.enabled === true;
  const foundationOnly = gameRow.foundation_only === true;

  if (!enabled || foundationOnly) {
    return {
      error: {
        code: "game_not_active",
        message: "המשחק עדיין לא פעיל",
      },
    };
  }

  return { ok: true };
}
