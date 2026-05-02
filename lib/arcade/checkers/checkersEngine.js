/**
 * דמקה אמריקאית פשוטה — לוח 8×8, רק משבצות כהות, חובה לבצע אכילה אם קיימת.
 * מושב 0 = שחור (מתחיל למעלה), מושב 1 = לבן (מתחיל למטה).
 */

export const EMPTY = 0;
export const BLACK_MAN = 1;
export const BLACK_KING = 2;
export const WHITE_MAN = 3;
export const WHITE_KING = 4;

/** @param {number} p */
export function pieceSeat(p) {
  if (p === BLACK_MAN || p === BLACK_KING) return 0;
  if (p === WHITE_MAN || p === WHITE_KING) return 1;
  return -1;
}

/** @param {number} p */
export function isKing(p) {
  return p === BLACK_KING || p === WHITE_KING;
}

/**
 * @returns {number[][]}
 */
export function createInitialBoard() {
  /** @type {number[][]} */
  const b = Array.from({ length: 8 }, () => Array(8).fill(EMPTY));
  for (let r = 0; r < 8; r += 1) {
    for (let c = 0; c < 8; c += 1) {
      if ((r + c) % 2 !== 1) continue;
      if (r < 3) b[r][c] = BLACK_MAN;
      else if (r > 4) b[r][c] = WHITE_MAN;
    }
  }
  return b;
}

/**
 * @param {number[][]} board
 * @param {number} r
 * @param {number} c
 */
export function inBounds(r, c) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

/**
 * @param {number[][]} board
 * @param {0|1} seat
 * @returns {boolean}
 */
export function hasAnyPiece(board, seat) {
  for (let r = 0; r < 8; r += 1) {
    for (let c = 0; c < 8; c += 1) {
      const p = board[r][c];
      if (p !== EMPTY && pieceSeat(p) === seat) return true;
    }
  }
  return false;
}

/**
 * כיוונים אלכסוניים למלך; לרגיל — רק קדימה לפי מושב.
 * @param {number} p
 * @param {0|1} ownerSeat
 */
function diagonalSteps(p, ownerSeat) {
  if (isKing(p)) {
    return [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ];
  }
  if (ownerSeat === 0) return [[1, -1], [1, 1]];
  return [[-1, -1], [-1, 1]];
}

/**
 * קפיצה אחת מאותו רגע — נחזיר יעד אם חוקי.
 * @param {number[][]} board
 * @param {number} r
 * @param {number} c
 * @param {number} dr
 * @param {number} dc
 */
function tryJump(board, r, c, dr, dc) {
  const p = board[r][c];
  if (p === EMPTY) return null;
  const midR = r + dr;
  const midC = c + dc;
  const landR = r + 2 * dr;
  const landC = c + 2 * dc;
  if (!inBounds(midR, midC) || !inBounds(landR, landC)) return null;
  if ((landR + landC) % 2 !== 1) return null;
  const mid = board[midR][midC];
  const dest = board[landR][landC];
  if (dest !== EMPTY) return null;
  if (mid === EMPTY || pieceSeat(mid) === pieceSeat(p)) return null;
  return { landR, landC, midR, midC };
}

/**
 * צעד רגיל (בלי אכילה)
 */
function tryStep(board, r, c, dr, dc) {
  const p = board[r][c];
  if (p === EMPTY) return null;
  const nr = r + dr;
  const nc = c + dc;
  if (!inBounds(nr, nc)) return null;
  if ((nr + nc) % 2 !== 1) return null;
  if (board[nr][nc] !== EMPTY) return null;
  return { nr, nc };
}

/**
 * כל קפיצות אפשריות למושב (או רק מ-mustFrom אם הוגדר אחרי קפיצה משרשרת)
 * @param {number[][]} board
 * @param {0|1} turnSeat
 * @param {{ r: number, c: number } | null} mustFrom
 */
export function listJumpTargets(board, turnSeat, mustFrom = null) {
  /** @type {{ fromR: number, fromC: number, toR: number, toC: number }[]} */
  const out = [];
  for (let r = 0; r < 8; r += 1) {
    for (let c = 0; c < 8; c += 1) {
      if (mustFrom && (r !== mustFrom.r || c !== mustFrom.c)) continue;
      const p = board[r][c];
      if (p === EMPTY || pieceSeat(p) !== turnSeat) continue;
      const steps = diagonalSteps(p, turnSeat);
      for (const [dr, dc] of steps) {
        const j = tryJump(board, r, c, dr, dc);
        if (j) out.push({ fromR: r, fromC: c, toR: j.landR, toC: j.landC });
      }
    }
  }
  return out;
}

/**
 * צעדים שקטים (רק אם אין אכילות באף מקום)
 */
export function listQuietMoves(board, turnSeat) {
  /** @type {{ fromR: number, fromC: number, toR: number, toC: number }[]} */
  const out = [];
  for (let r = 0; r < 8; r += 1) {
    for (let c = 0; c < 8; c += 1) {
      const p = board[r][c];
      if (p === EMPTY || pieceSeat(p) !== turnSeat) continue;
      const steps = diagonalSteps(p, turnSeat);
      for (const [dr, dc] of steps) {
        const s = tryStep(board, r, c, dr, dc);
        if (s) out.push({ fromR: r, fromC: c, toR: s.nr, toC: s.nc });
      }
    }
  }
  return out;
}

/**
 * קפיצות קיימות בכל הלוח למושב
 */
export function anyJumpExists(board, turnSeat) {
  return listJumpTargets(board, turnSeat, null).length > 0;
}

/**
 * מהלכים חוקיים
 * @param {number[][]} board
 * @param {0|1} turnSeat
 * @param {{ r: number, c: number } | null} mustContinueFrom — חובה להמשיך מאותו כלי אחרי קפיצה
 */
export function getLegalMoves(board, turnSeat, mustContinueFrom = null) {
  const jumps = listJumpTargets(board, turnSeat, mustContinueFrom);
  if (mustContinueFrom) return jumps;
  if (anyJumpExists(board, turnSeat)) return jumps;
  return listQuietMoves(board, turnSeat);
}

/**
 * החלפת דגל המלך
 * @param {number[][]} board
 * @param {number} r
 * @param {number} c
 */
function maybePromote(board, r, c) {
  const p = board[r][c];
  if (p === BLACK_MAN && r === 7) board[r][c] = BLACK_KING;
  if (p === WHITE_MAN && r === 0) board[r][c] = WHITE_KING;
}

/**
 * ביצוע קפיצה אחת (כולל הסרת נאכל בדרך)
 * @param {number[][]} board
 * @param {number} fr
 * @param {number} fc
 * @param {number} tr
 * @param {number} tc
 */
export function applyJump(board, fr, fc, tr, tc) {
  const next = board.map((row) => row.slice());
  const p = next[fr][fc];
  if (p === EMPTY) return null;
  const dr = tr > fr ? 1 : -1;
  const dc = tc > fc ? 1 : -1;
  const midR = fr + dr;
  const midC = fc + dc;
  if (!inBounds(midR, midC) || next[midR][midC] === EMPTY) return null;
  next[midR][midC] = EMPTY;
  next[tr][tc] = p;
  next[fr][fc] = EMPTY;
  maybePromote(next, tr, tc);
  return next;
}

/**
 * צעד שקט
 */
export function applyQuiet(board, fr, fc, tr, tc) {
  const next = board.map((row) => row.slice());
  const p = next[fr][fc];
  if (p === EMPTY) return null;
  next[tr][tc] = p;
  next[fr][fc] = EMPTY;
  maybePromote(next, tr, tc);
  return next;
}

/**
 * האם יש קפיצה נוספת מאותו משבצת
 */
export function jumpsAvailableFrom(board, turnSeat, r, c) {
  const p = board[r][c];
  if (p === EMPTY || pieceSeat(p) !== turnSeat) return false;
  const steps = diagonalSteps(p, turnSeat);
  for (const [dr, dc] of steps) {
    if (tryJump(board, r, c, dr, dc)) return true;
  }
  return false;
}

/**
 * @param {number[][]} board
 * @param {0|1} opponentSeat
 */
export function hasLegalMove(board, opponentSeat) {
  if (!hasAnyPiece(board, opponentSeat)) return false;
  if (anyJumpExists(board, opponentSeat)) return true;
  return listQuietMoves(board, opponentSeat).length > 0;
}

/**
 * יישום מהלך מלא (בודק חוקיות מול רשימת מהלכים)
 * @param {number[][]} board
 * @param {0|1} turnSeat
 * @param {number} fr
 * @param {number} fc
 * @param {number} tr
 * @param {number} tc
 * @param {{ r: number, c: number } | null} mustContinueFrom
 */
export function applyTurn(board, turnSeat, fr, fc, tr, tc, mustContinueFrom = null) {
  const legal = getLegalMoves(board, turnSeat, mustContinueFrom);
  const ok = legal.some((m) => m.fromR === fr && m.fromC === fc && m.toR === tr && m.toC === tc);
  if (!ok) return { error: "illegal" };

  const isJump = Math.abs(tr - fr) === 2;
  let next;
  if (isJump) next = applyJump(board, fr, fc, tr, tc);
  else next = applyQuiet(board, fr, fc, tr, tc);
  if (!next) return { error: "illegal" };

  const opponent = /** @type {0|1} */ (1 - turnSeat);
  if (!hasAnyPiece(next, opponent)) {
    return { board: next, finished: true, winnerSeat: turnSeat, nextTurn: null, mustContinueFrom: null };
  }

  if (isJump && jumpsAvailableFrom(next, turnSeat, tr, tc)) {
    return {
      board: next,
      finished: false,
      winnerSeat: null,
      nextTurn: turnSeat,
      mustContinueFrom: { r: tr, c: tc },
    };
  }

  if (!hasLegalMove(next, opponent)) {
    return { board: next, finished: true, winnerSeat: turnSeat, nextTurn: null, mustContinueFrom: null };
  }

  return {
    board: next,
    finished: false,
    winnerSeat: null,
    nextTurn: opponent,
    mustContinueFrom: null,
  };
}

/**
 * לצילום לקוח — מטריצת מספרים
 * @param {number[][]} board
 */
export function boardToGrid(board) {
  return board.map((row) => row.slice());
}
