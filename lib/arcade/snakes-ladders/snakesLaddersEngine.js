/**
 * נחשים וסולמות — לוח 1..100, חוקים קלאסיים פשוטים (אין תור נוסף על 6).
 * מפות סולם/נחש נפוצות (מקורות שונים); ניתן להחליף ל-board OV2 כשיהיה זמין.
 */

export const CELL_START = 0;
export const CELL_GOAL = 100;

/** מפת סולמות: מ-index נמוך לגבוה */
export const LADDERS = new Map([
  [3, 22],
  [5, 8],
  [11, 26],
  [20, 29],
  [27, 53],
  [38, 57],
  [49, 86],
  [70, 91],
  [73, 93],
  [82, 100],
]);

/** מפת נחשים: מ-index גבוה לנמוך */
export const SNAKES = new Map([
  [17, 7],
  [54, 34],
  [62, 19],
  [64, 60],
  [87, 24],
  [93, 73],
  [95, 75],
  [99, 80],
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
 * @returns {{ positions: number[], reachedGoal: boolean }}
 */
export function moveAfterRoll(positions, turnSeat, roll) {
  const next = positions.slice();
  const p = next[turnSeat];
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
  next[turnSeat] = target;
  return { positions: next, reachedGoal: target === CELL_GOAL };
}

export function nextTurnSeat(activeSeats, turnSeat) {
  const seats = activeSeats.slice().sort((a, b) => a - b);
  const idx = seats.indexOf(turnSeat);
  if (idx < 0) return seats[0];
  return seats[(idx + 1) % seats.length];
}
