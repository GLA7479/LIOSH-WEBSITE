/**
 * חדרי ארקייד במצב מצביע (דמקה / שחמט / דומינו / בינגו).
 */

/**
 * @param {string} roomId
 */
export async function fetchArcadePlaceholderBundle(roomId) {
  if (!roomId?.trim()) {
    return { ok: false, code: "bad_request", httpStatus: 0, error: "חסר מזהה חדר" };
  }
  try {
    const res = await fetch(`/api/arcade/rooms/${encodeURIComponent(roomId.trim())}/snapshot`, {
      credentials: "same-origin",
    });
    const body = await res.json().catch(() => ({}));
    if (!body?.ok) {
      return {
        ok: false,
        code: typeof body.code === "string" ? body.code : undefined,
        httpStatus: res.status,
        error: typeof body.error === "string" ? body.error : undefined,
      };
    }
    const arcadePlaceholder =
      body.arcadePlaceholder && typeof body.arcadePlaceholder === "object"
        ? /** @type {Record<string, unknown>} */ (body.arcadePlaceholder)
        : null;
    return {
      ok: true,
      arcadePlaceholder,
      room: body.room && typeof body.room === "object" ? /** @type {Record<string, unknown>} */ (body.room) : null,
      players: Array.isArray(body.players) ? body.players : [],
      gameSession: body.gameSession && typeof body.gameSession === "object" ? /** @type {Record<string, unknown>} */ (body.gameSession) : null,
    };
  } catch (e) {
    return {
      ok: false,
      code: "network",
      httpStatus: 0,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
