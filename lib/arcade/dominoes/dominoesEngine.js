/**
 * דומינו חסימה — זוג 6, שניים שחקנים, 7 קלפים כל אחד, 14 בחוץ.
 * סיום: יציאה מלאה (דומינו) או חסימה — סכום נקודות ביד נמוך מנצח; שוויון — תיקו.
 */

/** כל האבנים (a<=b) — 28 */
export function buildAllTiles() {
  /** @type {{ id: number, a: number, b: number }[]} */
  const out = [];
  for (let i = 0; i <= 6; i += 1) {
    for (let j = i; j <= 6; j += 1) {
      out.push({ id: out.length, a: i, b: j });
    }
  }
  return out;
}

export const ALL_TILES = buildAllTiles();

/**
 * @param {number[]} ids
 */
export function tilesByIdMap(ids) {
  /** @type {Map<number, { id: number, a: number, b: number }>} */
  const m = new Map();
  for (const t of ALL_TILES) {
    if (ids.includes(t.id)) m.set(t.id, t);
  }
  return m;
}

/**
 * @param {number[]} deck
 */
export function shuffleInPlace(deck) {
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/**
 * מחלק לשני שחקנים: 7+7, 14 נשארות בחוץ (לא בשימוש בחסימה).
 * @returns {{ hands: number[][], stock: number[] }}
 */
export function dealTwoPlayer() {
  const ids = ALL_TILES.map((t) => t.id);
  shuffleInPlace(ids);
  return {
    hands: [ids.slice(0, 7), ids.slice(7, 14)],
    stock: ids.slice(14, 28),
  };
}

/**
 * מי פותח: הכפול הגבוה ביותר; אין כפול — סכום הנקודות הגבוה ביותר.
 * @param {number[][]} hands
 */
export function chooseFirstSeat(hands) {
  let bestSeat = 0;
  let bestDouble = -1;
  let bestSum = -1;
  for (let seat = 0; seat < 2; seat += 1) {
    const h = hands[seat] || [];
    for (const tid of h) {
      const t = ALL_TILES[tid];
      if (!t) continue;
      if (t.a === t.b) {
        if (t.a > bestDouble) {
          bestDouble = t.a;
          bestSeat = seat;
        }
      }
    }
  }
  if (bestDouble >= 0) return /** @type {0|1} */ (bestSeat);

  for (let seat = 0; seat < 2; seat += 1) {
    const h = hands[seat] || [];
    for (const tid of h) {
      const t = ALL_TILES[tid];
      if (!t) continue;
      const s = t.a + t.b;
      if (s > bestSum) {
        bestSum = s;
        bestSeat = seat;
      }
    }
  }
  return /** @type {0|1} */ (bestSeat);
}

/**
 * @param {{ tileId: number, leftPip: number, rightPip: number }[]} chain
 */
export function chainOpenEnds(chain) {
  if (!chain.length) return null;
  return {
    left: chain[0].leftPip,
    right: chain[chain.length - 1].rightPip,
  };
}

/**
 * @param {number[]} handIds
 * @param {{ tileId: number, leftPip: number, rightPip: number }[]} chain
 */
export function enumerateLegalPlays(handIds, chain) {
  /** @type {{ tileId: number, side: 'left'|'right' }[]} */
  const out = [];
  const seen = new Set();
  for (const tileId of handIds) {
    const t = ALL_TILES[tileId];
    if (!t) continue;
    if (chain.length === 0) {
      const k = `${tileId}|start`;
      if (!seen.has(k)) {
        seen.add(k);
        out.push({ tileId, side: /** @type {'right'} */ ('right') });
      }
      continue;
    }
    const ends = chainOpenEnds(chain);
    if (!ends) continue;
    const { left, right } = ends;
    if (t.a === left || t.b === left) {
      const k = `${tileId}|L`;
      if (!seen.has(k)) {
        seen.add(k);
        out.push({ tileId, side: 'left' });
      }
    }
    if (t.a === right || t.b === right) {
      const k = `${tileId}|R`;
      if (!seen.has(k)) {
        seen.add(k);
        out.push({ tileId, side: 'right' });
      }
    }
  }
  return out;
}

/**
 * @param {{ tileId: number, leftPip: number, rightPip: number }[]} chain
 * @param {number} tileId
 * @param {'left'|'right'} side
 */
export function applyPlay(chain, tileId, side) {
  const t = ALL_TILES[tileId];
  if (!t) return { error: "bad_tile" };

  if (chain.length === 0) {
    return {
      chain: [{ tileId, leftPip: t.a, rightPip: t.b }],
    };
  }

  const ends = chainOpenEnds(chain);
  if (!ends) return { error: "bad_chain" };

  if (side === 'right') {
    const need = ends.right;
    if (t.a === need) {
      return { chain: [...chain, { tileId, leftPip: t.a, rightPip: t.b }] };
    }
    if (t.b === need) {
      return { chain: [...chain, { tileId, leftPip: t.b, rightPip: t.a }] };
    }
    return { error: "no_match" };
  }

  const needL = ends.left;
  if (t.a === needL) {
    return { chain: [{ tileId, leftPip: t.b, rightPip: t.a }, ...chain] };
  }
  if (t.b === needL) {
    return { chain: [{ tileId, leftPip: t.a, rightPip: t.b }, ...chain] };
  }
  return { error: "no_match" };
}

/**
 * @param {number[]} handIds
 */
export function pipSum(handIds) {
  let s = 0;
  for (const tid of handIds) {
    const t = ALL_TILES[tid];
    if (t) s += t.a + t.b;
  }
  return s;
}
