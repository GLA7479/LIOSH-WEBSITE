/**
 * צילום לקוח — שחמט ארקייד (מצב FEN + מהלכים חוקיים לפי chess.js)
 */

import { Chess } from "chess.js";

/**
 * @param {number} row — 0 = שורה עליונה (ריאלי 8), 7 = תחתונה (1)
 * @param {number} col — 0=a … 7=h
 */
export function squareFromRowCol(row, col) {
  const files = "abcdefgh";
  const rank = 8 - row;
  if (!files[col] || rank < 1 || rank > 8) return null;
  return `${files[col]}${rank}`;
}

/**
 * @param {string} sq
 * @returns {{ row: number, col: number } | null}
 */
export function rowColFromSquare(sq) {
  if (typeof sq !== "string" || sq.length < 2) return null;
  const files = "abcdefgh";
  const file = sq[0]?.toLowerCase();
  const rank = Number.parseInt(sq.slice(1), 10);
  const col = files.indexOf(file);
  if (col < 0 || !Number.isFinite(rank) || rank < 1 || rank > 8) return null;
  return { row: 8 - rank, col };
}

/**
 * @param {import("chess.js").Piece[][]} board
 * @returns {(null|{ type: string, color: 'w'|'b' })[][]}
 */
function pieceGridFromBoard(board) {
  /** @type {(null|{ type: string, color: 'w'|'b' })[][]} */
  const out = [];
  for (let r = 0; r < 8; r += 1) {
    /** @type {(null|{ type: string, color: 'w'|'b' })[]} */
    const row = [];
    for (let c = 0; c < 8; c += 1) {
      const cell = board[r]?.[c];
      row.push(cell ? { type: cell.type, color: cell.color } : null);
    }
    out.push(row);
  }
  return out;
}

/**
 * @param {Record<string, unknown>|null} gameSession
 * @param {Array<Record<string, unknown>>} players
 * @param {string} viewerStudentId
 * @param {Record<string, unknown>|null} [room]
 */
export function buildChessClientSnapshot(gameSession, players, viewerStudentId, room = null) {
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

  const ch = state.chess && typeof state.chess === "object" ? /** @type {Record<string, unknown>} */ (state.chess) : {};
  const fen = typeof ch.fen === "string" && ch.fen.length > 0 ? ch.fen : new Chess().fen();

  let game;
  try {
    game = new Chess(fen);
  } catch {
    game = new Chess();
  }

  const turnChar = game.turn();
  /** @type {null|0|1} */
  let turnSeat = turnChar === "w" ? 0 : turnChar === "b" ? 1 : null;

  const wRaw = state.winnerSeat;
  /** @type {null|0|1} */
  let winnerSeat = null;
  if (wRaw !== null && wRaw !== undefined && wRaw !== "null") {
    const w = Number(wRaw);
    if (w === 0 || w === 1) winnerSeat = w;
  }

  const playing = phase === "playing" && sessionStatus === "active";
  const myTurn =
    playing &&
    mySeat != null &&
    turnSeat != null &&
    mySeat === turnSeat &&
    String(gameSession.current_turn_student_id || "") === String(viewerStudentId);

  /** @type {{ from: string, to: string, promotion?: string }[]} */
  let legalMoves = [];
  if (playing && myTurn) {
    const verbose = game.moves({ verbose: true });
    for (const m of verbose) {
      legalMoves.push({
        from: String(m.from),
        to: String(m.to),
        promotion: m.promotion != null ? String(m.promotion) : undefined,
      });
    }
  }

  const lm = ch.lastMove && typeof ch.lastMove === "object" ? ch.lastMove : null;

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

  return {
    revision: gameSession.revision != null ? Number(gameSession.revision) : 0,
    sessionId: String(gameSession.id ?? ""),
    roomId: String(gameSession.room_id ?? ""),
    phase,
    fen: game.fen(),
    activeSeats: [0, 1],
    mySeat,
    turnSeat,
    winnerSeat,
    pieces: pieceGridFromBoard(game.board()),
    lastMove: lm,
    legalMoves,
    canClientMove: myTurn && legalMoves.length > 0,
    boardViewReadOnly: !playing,
    prizePoolAmount,
    mySettlementAmount,
    entryCost,
    inCheck: playing ? game.isCheck() : false,
  };
}
