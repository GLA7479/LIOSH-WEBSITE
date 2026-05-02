/**
 * נחשים וסולמות — לוח 1..100.
 * זריקת 6 נותנת תור נוסף לאותו שחקן, עד 3 פעמים ברצף (השש הרביעי ברצף — אחרי ההזזה התור עובר).
 * מפת סולמות/נחשים: מזהים ל־`MLEO-GAME/.../ov2SnakesBoardEdges.js` (OV2).
 */

export const CELL_START = 0;
export const CELL_GOAL = 100;

/** מפת סולמות: מ-index נמוך לגבוה (OV2) */
export const LADDERS = new Map([
  [2, 15],
  [7, 28],
  [22, 43],
  [27, 55],
  [41, 63],
  [50, 69],
  [57, 76],
  [65, 82],
  [68, 90],
  [71, 91],
]);

/** מפת נחשים: מ-index גבוה לנמוך (OV2) */
export const SNAKES = new Map([
  [99, 80],
  [94, 70],
  [89, 52],
  [86, 53],
  [74, 35],
  [62, 19],
  [56, 40],
  [49, 12],
  [45, 23],
  [16, 6],
]);

function applyJump(pos) {
  let p = pos;
  const seen = new Set();
  while (seen.has(p) === false) {
    seen.add(p);
    if (LADDERS.has(p)) {
      p = LADDERS.get(p);
      continue;
    }
    if (SNAKES.has(p)) {
      p = SNAKES.get(p);
      continue;
    }
    break;
  }
  return p;
}

/**
 * @param {number} playerCount
 * @returns {{ positions: number[] }}
 */
export function createInitialPositions(playerCount) {
  const n = Math.max(2, Math.min(4, Math.floor(playerCount)));
  return { positions: Array.from({ length: n }, () => CELL_START) };
}

/**
 * מזיז שחקן לפי זריקה; אם חורג מ-100 נשאר במקום.
 * `positions[i]` תואם ל־`activeSeats[i]` (לא למספר מושב ישירות).
 * @returns {{ positions: number[], reachedGoal: boolean }}
 */
export function moveAfterRoll(positions, activeSeats, turnSeat, roll) {
  const seats = Array.isArray(activeSeats) ? activeSeats : [];
  const idx = seats.indexOf(Number(turnSeat));
  if (idx < 0 || idx >= positions.length) {
    return { positions: positions.slice(), reachedGoal: false };
  }
  const next = positions.slice();
  const p = next[idx];
  let target;
  if (p === CELL_START) {
    target = Math.min(roll, CELL_GOAL);
  } else {
    if (p + roll > CELL_GOAL) {
      return { positions: next, reachedGoal: false };
    }
    target = p + roll;
  }
  target = applyJump(target);
  next[idx] = target;
  return { positions: next, reachedGoal: target === CELL_GOAL };
}

export function nextTurnSeat(activeSeats, turnSeat) {
  const seats = activeSeats.slice().sort((a, b) => a - b);
  const idx = seats.indexOf(turnSeat);
  if (idx < 0) return seats[0];
  return seats[(idx + 1) % seats.length];
}

/** כמה ששים רצופים כבר נוצלו לתור נוסף — מעל זה לא מקבלים תור נוסף */
export const MAX_CONSECUTIVE_SIX_BONUS = 3;

/**
 * @param {{ roll: number, activeSeats: number[], currentSeat: number, prevConsecutiveSixes: number }} args
 * @returns {{ nextSeat: number, consecutiveSixes: number }}
 */
export function resolveTurnAfterRoll({ roll, activeSeats, currentSeat, prevConsecutiveSixes }) {
  const r = Math.floor(Number(roll));
  const prev = Math.max(0, Math.floor(Number(prevConsecutiveSixes) || 0));

  if (r === 6 && prev < MAX_CONSECUTIVE_SIX_BONUS) {
    return { nextSeat: currentSeat, consecutiveSixes: prev + 1 };
  }
  const seats = Array.isArray(activeSeats) ? activeSeats.slice().sort((a, b) => a - b) : [];
  return {
    nextSeat: nextTurnSeat(seats, currentSeat),
    consecutiveSixes: 0,
  };
}
