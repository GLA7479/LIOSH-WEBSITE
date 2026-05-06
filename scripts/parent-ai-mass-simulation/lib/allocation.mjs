/**
 * Globally distribute integer `limit` across `count` slots (fair remainder spread).
 * If limit < count, first `limit` slots receive 1 (others 0).
 */
export function allocateFair(limit, count) {
  if (count <= 0) return [];
  if (limit <= 0) return Array(count).fill(0);
  if (limit < count) {
    const out = Array(count).fill(0);
    for (let i = 0; i < limit; i++) out[i] = 1;
    return out;
  }
  const base = Math.floor(limit / count);
  let rem = limit % count;
  const out = [];
  for (let i = 0; i < count; i++) {
    let v = base;
    if (rem > 0) {
      v++;
      rem--;
    }
    out.push(v);
  }
  return out;
}
