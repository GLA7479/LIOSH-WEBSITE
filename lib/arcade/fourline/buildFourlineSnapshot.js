/**
 * Builds a client snapshot aligned with MLEO ov2_fourline_build_client_snapshot / normalizeOv2FourLineSnapshot.
 * No stakes, doubles, or timers in LIOSH Arcade-2.
 */

/**
 * @param {Record<string, unknown>|null} gameSession — arcade_game_sessions row
 * @param {Array<Record<string, unknown>>} players — arcade_room_players rows with seat_index
 * @param {string} viewerStudentId
 */
export function buildFourlineClientSnapshot(gameSession, players, viewerStudentId) {
  if (!gameSession || typeof gameSession !== "object") return null;

  const state = /** @type {Record<string, unknown>} */ (gameSession.state && typeof gameSession.state === "object" ? gameSession.state : {});
  const board = /** @type {Record<string, unknown>} */ (state.board && typeof state.board === "object" ? state.board : {});
  const cells = Array.isArray(board.cells) ? board.cells : [];
  const sessionStatus = String(gameSession.status || "");
  const phaseRaw = state.phase != null ? String(state.phase) : "";
  const phase =
    sessionStatus === "finished" || phaseRaw === "finished" ? "finished" : phaseRaw === "playing" ? "playing" : phaseRaw || "playing";

  /** @type {null|0|1} */
  let mySeat = null;
  const list = Array.isArray(players) ? players : [];
  for (const p of list) {
    if (p.student_id === viewerStudentId) {
      const si = Number(p.seat_index);
      if (si === 0 || si === 1) mySeat = /** @type {0|1} */ (si);
      break;
    }
  }

  const ws = state.winnerSeat;
  /** @type {null|0|1} */
  let winnerSeat = null;
  if (ws !== null && ws !== undefined && ws !== "null") {
    const w = Number(ws);
    if (w === 0 || w === 1) winnerSeat = w;
  }

  const ts = board.turnSeat;
  /** @type {null|number} */
  let turnSeat = null;
  if (ts !== null && ts !== undefined) {
    const t = Number(ts);
    if (t === 0 || t === 1) turnSeat = t;
  }

  const lm = board.lastMove && typeof board.lastMove === "object" ? board.lastMove : null;

  return {
    revision: gameSession.revision != null ? Number(gameSession.revision) : 0,
    sessionId: String(gameSession.id ?? ""),
    roomId: String(gameSession.room_id ?? ""),
    phase,
    activeSeats: [0, 1],
    mySeat,
    board: {
      turnSeat: turnSeat,
      cells,
      winner: board.winner != null ? board.winner : null,
      lastMove:
        lm && lm !== null
          ? {
              row: lm.row != null ? Number(lm.row) : null,
              col: lm.col != null ? Number(lm.col) : null,
            }
          : null,
    },
    cells,
    lastMove:
      lm && lm !== null
        ? {
            row: lm.row != null ? Number(lm.row) : null,
            col: lm.col != null ? Number(lm.col) : null,
          }
        : null,
    turnSeat,
    winnerSeat,
    stakeMultiplier: 1,
    doublesAccepted: 0,
    pendingDouble: null,
    canOfferDouble: false,
    mustRespondDouble: false,
    turnDeadline: null,
    missedTurns: null,
  };
}
