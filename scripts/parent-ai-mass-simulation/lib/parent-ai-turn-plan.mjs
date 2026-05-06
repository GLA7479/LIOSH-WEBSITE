import { PARENT_QUESTION_CATEGORIES } from "./parent-questions-catalog.mjs";

/**
 * Category-balanced turn plan: try to include each catalog category at least once (when budget allows),
 * then fill with round-robin over full catalog.
 *
 * @param {number} totalTurns
 * @param {Array<{ category: string }>} catalogEntries
 * @param {{ balanced: boolean, categoryMin: number }} opts
 */
export function buildCategoryBalancedEntrySequence(totalTurns, catalogEntries, opts) {
  if (totalTurns <= 0) return [];
  if (!opts.balanced) {
    return Array.from({ length: totalTurns }, (_, i) => catalogEntries[i % catalogEntries.length]);
  }

  const byCat = {};
  for (const e of catalogEntries) {
    if (!byCat[e.category]) byCat[e.category] = [];
    byCat[e.category].push(e);
  }

  /** Preserve canonical category order for deterministic coverage */
  const cats = PARENT_QUESTION_CATEGORIES.filter((c) => byCat[c]?.length);

  const seq = [];
  const minPerCat = Math.max(1, Math.min(opts.categoryMin || 1, 20));

  for (let r = 0; r < minPerCat; r++) {
    for (const cat of cats) {
      if (seq.length >= totalTurns) break;
      const pool = byCat[cat];
      seq.push(pool[r % pool.length]);
    }
  }

  let idx = 0;
  while (seq.length < totalTurns) {
    seq.push(catalogEntries[idx % catalogEntries.length]);
    idx += 1;
  }

  return seq.slice(0, totalTurns);
}

export function coverageMissingCategories(usedCategories, totalTurns) {
  const set = new Set(usedCategories);
  const missing = PARENT_QUESTION_CATEGORIES.filter((c) => !set.has(c));
  return { missing, budgetTooLow: totalTurns < PARENT_QUESTION_CATEGORIES.length };
}
