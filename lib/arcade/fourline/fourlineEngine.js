/**
 * Connect-four mechanics ported from MLEO migrations (103_ov2_fourline_engine.sql).
 * Row 0 is top, row 5 bottom; index = row * 7 + col.
 */

export const FOURLINE_ROWS = 6;
export const FOURLINE_COLS = 7;
export const FOURLINE_CELLS = 42;

/** @returns {(null|0|1)[]} */
export function emptyBoardCells() {
  return Array(FOURLINE_CELLS).fill(null);
}

/**
 * @param {unknown} raw
 * @returns {(null|0|1)[]}
 */
export function parseCellsFromState(raw) {
  const a = Array.isArray(raw) ? raw : [];
  const out = /** @type {(null|0|1)[]} */ (Array(FOURLINE_CELLS).fill(null));
  for (let i = 0; i < FOURLINE_CELLS; i += 1) {
    const v = a[i];
    if (v === null || v === undefined) {
      out[i] = null;
      continue;
    }
    const n = Math.floor(Number(v));
    if (n === 0 || n === 1) out[i] = /** @type {0|1} */ (n);
    else out[i] = null;
  }
  return out;
}

/**
 * @param {(null|0|1)[]} cells
 * @param {number} idx
 */
function cellValue(cells, idx) {
  if (!cells || idx < 0 || idx >= FOURLINE_CELLS) return null;
  const v = cells[idx];
  return v === 0 || v === 1 ? v : null;
}

/**
 * @param {(null|0|1)[]} cells
 */
export function boardFull(cells) {
  if (!cells || cells.length < FOURLINE_CELLS) return false;
  for (let i = 0; i < FOURLINE_CELLS; i += 1) {
    if (cellValue(cells, i) === null) return false;
  }
  return true;
}

/**
 * @param {(null|0|1)[]} cells
 * @param {number} r
 * @param {number} c
 * @param {number} dr
 * @param {number} dc
 * @param {0|1} seat
 */
function countDir(cells, r, c, dr, dc, seat) {
  let n = 0;
  let rr = r + dr;
  let cc = c + dc;
  while (rr >= 0 && rr < FOURLINE_ROWS && cc >= 0 && cc < FOURLINE_COLS) {
    const idx = rr * FOURLINE_COLS + cc;
    const v = cellValue(cells, idx);
    if (v === null || v !== seat) break;
    n += 1;
    rr += dr;
    cc += dc;
  }
  return n;
}

/**
 * @param {(null|0|1)[]} cells
 * @param {number} r
 * @param {number} c
 * @param {0|1} seat
 */
export function hasFourConnected(cells, r, c, seat) {
  let t =
    1 + countDir(cells, r, c, 0, 1, seat) + countDir(cells, r, c, 0, -1, seat);
  if (t >= 4) return true;
  t = 1 + countDir(cells, r, c, 1, 0, seat) + countDir(cells, r, c, -1, 0, seat);
  if (t >= 4) return true;
  t = 1 + countDir(cells, r, c, 1, 1, seat) + countDir(cells, r, c, -1, -1, seat);
  if (t >= 4) return true;
  t = 1 + countDir(cells, r, c, 1, -1, seat) + countDir(cells, r, c, -1, 1, seat);
  return t >= 4;
}

/**
 * @param {(null|0|1)[]} cells
 * @param {number} col 0–6
 * @param {0|1} seat
 */
export function applyDrop(cells, col, seat) {
  if (!Number.isInteger(col) || col < 0 || col > FOURLINE_COLS - 1) {
    return { ok: false, error: "BAD_COLUMN", newCells: null, placedRow: null };
  }
  if (seat !== 0 && seat !== 1) {
    return { ok: false, error: "BAD_SEAT", newCells: null, placedRow: null };
  }
  const newCells = cells && cells.length >= FOURLINE_CELLS ? [...cells] : emptyBoardCells();
  let placedRow = /** @type {number|null} */ (null);
  for (let r = FOURLINE_ROWS - 1; r >= 0; r -= 1) {
    const idx = r * FOURLINE_COLS + col;
    if (cellValue(newCells, idx) === null) {
      newCells[idx] = seat;
      placedRow = r;
      return { ok: true, error: null, newCells, placedRow };
    }
  }
  return { ok: false, error: "COLUMN_FULL", newCells: null, placedRow: null };
}
