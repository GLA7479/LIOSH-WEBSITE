/**
 * Client snapshot for Ludo (Arcade foundation — no stakes / doubles / OV2 economy).
 */

import { listMovablePieces } from "./ludoEngine";

/**
 * @param {Record<string, unknown>|null} gameSession
 * @param {Array<Record<string, unknown>>} players
 * @param {string} viewerStudentId
 */
export function buildLudoClientSnapshot(gameSession, players, viewerStudentId) {
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
    sessionStatus === "finished" || phaseRaw === "finished" ? "finished" : phaseRaw === "playing" ? "playing" : phaseRaw || "playing";

  /** @type {number|null} */
  let mySeat = null;
  const list = Array.isArray(players) ? players : [];
  for (const p of list) {
    if (p.student_id === viewerStudentId) {
      const si = Number(p.seat_index);
      if (Number.isInteger(si) && si >= 0 && si <= 3) mySeat = si;
      break;
    }
  }

  const ts = board.turnSeat;
  /** @type {number|null} */
  let turnSeat = null;
  if (ts !== null && ts !== undefined) {
    const t = Number(ts);
    if (Number.isInteger(t) && t >= 0 && t <= 3) turnSeat = t;
  }

  const wRaw = state.winnerSeat != null ? state.winnerSeat : board.winner;
  /** @type {number|null} */
  let winnerSeat = null;
  if (wRaw !== null && wRaw !== undefined && wRaw !== "null") {
    const w = Number(wRaw);
    if (Number.isInteger(w) && w >= 0 && w <= 3) winnerSeat = w;
  }

  const activeSeats = Array.isArray(board.activeSeats)
    ? board.activeSeats.map((x) => Number(x)).filter((n) => n >= 0 && n <= 3)
    : [];

  const diceRaw = board.dice;
  const dice =
    diceRaw === null || diceRaw === undefined || diceRaw === "null" ? null : Number(diceRaw);
  const lastDiceRaw = board.lastDice;
  const lastDice =
    lastDiceRaw === null || lastDiceRaw === undefined || lastDiceRaw === "null" ? null : Number(lastDiceRaw);

  const boardForUi = {
    ...board,
    turnSeat,
    activeSeats: activeSeats.length ? activeSeats : board.activeSeats,
    dice: Number.isFinite(dice) && !Number.isNaN(dice) ? dice : null,
    lastDice: Number.isFinite(lastDice) && !Number.isNaN(lastDice) ? lastDice : null,
  };

  const playing = phase === "playing" && sessionStatus === "active";
  const myTurn = playing && mySeat != null && turnSeat != null && mySeat === turnSeat;
  const canClientRoll = Boolean(myTurn && boardForUi.dice == null);
  const canClientMovePiece = Boolean(myTurn && boardForUi.dice != null);

  let legalMovablePieceIndices = null;
  if (canClientMovePiece && turnSeat != null && boardForUi.dice != null) {
    legalMovablePieceIndices = listMovablePieces(boardForUi, turnSeat, boardForUi.dice);
  }

  return {
    revision: gameSession.revision != null ? Number(gameSession.revision) : 0,
    sessionId: String(gameSession.id ?? ""),
    roomId: String(gameSession.room_id ?? ""),
    phase,
    mySeat,
    turnSeat,
    winnerSeat,
    board: boardForUi,
    dice: boardForUi.dice,
    lastDice: boardForUi.lastDice,
    activeSeats: boardForUi.activeSeats || [],
    canClientRoll,
    canClientMovePiece,
    boardViewReadOnly: !playing,
    legalMovablePieceIndices,
  };
}
