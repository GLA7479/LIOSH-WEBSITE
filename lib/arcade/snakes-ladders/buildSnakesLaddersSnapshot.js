/**
 * צילום לקוח — נחשים וסולמות (ארקייד).
 */

/**
 * @param {Record<string, unknown>|null} gameSession
 * @param {Array<Record<string, unknown>>} players
 * @param {string} viewerStudentId
 */
export function buildSnakesLaddersClientSnapshot(gameSession, players, viewerStudentId) {
  if (!gameSession || typeof gameSession !== "object") return null;

  const state = /** @type {Record<string, unknown>} */ (
    gameSession.state && typeof gameSession.state === "object" ? gameSession.state : {}
  );
  const board = /** @type {Record<string, unknown>} */ (
    state.board && typeof state.board === "object" ? state.board : {}
  );
  const sessionStatus = String(gameSession.status || "");
  const phaseRaw = state.phase != null ? String(state.phase) : "";
  const phase =
    sessionStatus === "finished" || phaseRaw === "finished"
      ? "finished"
      : phaseRaw === "playing"
        ? "playing"
        : phaseRaw || "playing";

  /** @type {number|null} */
  let mySeat = null;
  const list = Array.isArray(players) ? players : [];
  let maxSeat = 0;
  for (const p of list) {
    const si = Number(p.seat_index);
    if (Number.isInteger(si) && si >= 0 && si <= 7) maxSeat = Math.max(maxSeat, si);
  }
  for (const p of list) {
    if (p.student_id === viewerStudentId) {
      const si = Number(p.seat_index);
      if (Number.isInteger(si) && si >= 0 && si <= 7) mySeat = si;
      break;
    }
  }

  const ts = board.turnSeat;
  /** @type {number|null} */
  let turnSeat = null;
  if (ts !== null && ts !== undefined) {
    const t = Number(ts);
    if (Number.isInteger(t) && t >= 0 && t <= 7) turnSeat = t;
  }

  const wRaw = state.winnerSeat;
  /** @type {number|null} */
  let winnerSeat = null;
  if (wRaw !== null && wRaw !== undefined && wRaw !== "null") {
    const w = Number(wRaw);
    if (Number.isInteger(w) && w >= 0 && w <= 7) winnerSeat = w;
  }

  const activeSeats = Array.isArray(board.activeSeats)
    ? board.activeSeats.map((x) => Number(x)).filter((n) => n >= 0 && n <= 7)
    : [];

  const positions = Array.isArray(board.positions) ? board.positions.map((x) => Number(x)) : [];
  const lastRollRaw = board.lastRoll;
  const lastRoll =
    lastRollRaw === null || lastRollRaw === undefined || lastRollRaw === "null"
      ? null
      : Number(lastRollRaw);

  const playing = phase === "playing" && sessionStatus === "active";
  const myTurn = playing && mySeat != null && turnSeat != null && mySeat === turnSeat;
  const canClientRoll = Boolean(myTurn);

  return {
    revision: gameSession.revision != null ? Number(gameSession.revision) : 0,
    sessionId: String(gameSession.id ?? ""),
    roomId: String(gameSession.room_id ?? ""),
    phase,
    mySeat,
    turnSeat,
    winnerSeat,
    board: {
      ...board,
      turnSeat,
      activeSeats,
      positions,
      lastRoll: Number.isFinite(lastRoll) && !Number.isNaN(lastRoll) ? lastRoll : null,
    },
    positions,
    lastRoll: Number.isFinite(lastRoll) && !Number.isNaN(lastRoll) ? lastRoll : null,
    activeSeats,
    canClientRoll,
    boardViewReadOnly: !playing,
  };
}
