/**
 * צילום לקוח — דמקה ארקייד
 */

import { getLegalMoves, boardToGrid } from "./checkersEngine";

/**
 * @param {unknown[][]} raw
 * @returns {number[][]}
 */
function parseBoard(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((row) =>
    Array.isArray(row) ? row.map((x) => (x != null ? Number(x) : 0)) : Array(8).fill(0),
  );
}

/**
 * @param {Record<string, unknown>|null} gameSession
 * @param {Array<Record<string, unknown>>} players
 * @param {string} viewerStudentId
 * @param {Record<string, unknown>|null} [room]
 */
export function buildCheckersClientSnapshot(gameSession, players, viewerStudentId, room = null) {
  if (!gameSession || typeof gameSession !== "object") return null;

  const state = /** @type {Record<string, unknown>} */ (
    gameSession.state && typeof gameSession.state === "object" ? gameSession.state : {}
  );
  const sessionStatus = String(gameSession.status || "");
  const phaseRaw = state.phase != null ? String(state.phase) : "";
  const phase =
    sessionStatus === "finished" || phaseRaw === "finished"
      ? "finished"
      : phaseRaw === "playing"
        ? "playing"
        : phaseRaw || "playing";

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

  const boardState = /** @type {Record<string, unknown>} */ (
    state.board && typeof state.board === "object" ? state.board : {}
  );
  const grid = parseBoard(/** @type {unknown[][]} */ (boardState.grid || boardState.cells || []));

  /** Pad to 8x8 */
  while (grid.length < 8) grid.push(Array(8).fill(0));
  for (let i = 0; i < 8; i += 1) {
    while (grid[i].length < 8) grid[i].push(0);
  }

  const ts = boardState.turnSeat;
  /** @type {null|0|1} */
  let turnSeat = null;
  if (ts !== null && ts !== undefined) {
    const t = Number(ts);
    if (t === 0 || t === 1) turnSeat = t;
  }

  const wRaw = state.winnerSeat;
  /** @type {null|0|1} */
  let winnerSeat = null;
  if (wRaw !== null && wRaw !== undefined && wRaw !== "null") {
    const w = Number(wRaw);
    if (w === 0 || w === 1) winnerSeat = w;
  }

  const mc = boardState.mustContinueFrom;
  /** @type {{ r: number, c: number } | null} */
  let mustContinueFrom = null;
  if (mc && typeof mc === "object" && mc !== null) {
    const mr = Number(/** @type {Record<string, unknown>} */ (mc).r);
    const mc_ = Number(/** @type {Record<string, unknown>} */ (mc).c);
    if (Number.isInteger(mr) && Number.isInteger(mc_)) mustContinueFrom = { r: mr, c: mc_ };
  }

  const playing = phase === "playing" && sessionStatus === "active";
  const myTurn = playing && mySeat != null && turnSeat != null && mySeat === turnSeat;

  /** @type {{ fromR: number, fromC: number, toR: number, toC: number }[]} */
  let legalMoves = [];
  if (playing && myTurn && turnSeat != null) {
    legalMoves = getLegalMoves(grid, /** @type {0|1} */ (turnSeat), mustContinueFrom);
  }

  const entryCost = room?.entry_cost != null ? Math.max(0, Math.floor(Number(room.entry_cost))) : 0;
  const prizePoolAmount =
    phase === "finished" && (winnerSeat === 0 || winnerSeat === 1) && entryCost > 0 ? entryCost * 2 : null;

  /** @type {number|null} */
  let mySettlementAmount = null;
  if (phase === "finished") {
    if (winnerSeat === 0 || winnerSeat === 1) {
      if (mySeat === winnerSeat && prizePoolAmount != null) mySettlementAmount = prizePoolAmount;
      else mySettlementAmount = 0;
    } else if (entryCost > 0) {
      mySettlementAmount = entryCost;
    } else {
      mySettlementAmount = 0;
    }
  }

  const lm = boardState.lastMove && typeof boardState.lastMove === "object" ? boardState.lastMove : null;

  return {
    revision: gameSession.revision != null ? Number(gameSession.revision) : 0,
    sessionId: String(gameSession.id ?? ""),
    roomId: String(gameSession.room_id ?? ""),
    phase,
    activeSeats: [0, 1],
    mySeat,
    turnSeat,
    winnerSeat,
    mustContinueFrom,
    board: {
      turnSeat,
      grid: boardToGrid(grid),
      mustContinueFrom,
      lastMove: lm,
    },
    legalMoves,
    canClientMove: myTurn && legalMoves.length > 0,
    boardViewReadOnly: !playing,
    prizePoolAmount,
    mySettlementAmount,
    entryCost,
  };
}
