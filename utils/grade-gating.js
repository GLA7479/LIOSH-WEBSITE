/**
 * Grade gating — hard pool membership by gradeKey (g1–g6).
 * Bands: early = g1–g2, mid = g3–g4, late = g5–g6.
 */

export const GRADE_KEYS = ["g1", "g2", "g3", "g4", "g5", "g6"];

/**
 * @param {string|number|null|undefined} key
 * @returns {number|null} 1–6 or null
 */
export function parseGradeKey(key) {
  if (key == null) return null;
  if (typeof key === "number" && key >= 1 && key <= 6) return key;
  const s = String(key).toLowerCase().trim();
  const m = s.match(/^g([1-6])$/);
  return m ? parseInt(m[1], 10) : null;
}

/**
 * @param {string} gradeKey
 * @returns {number} 0-based index or -1
 */
export function gradeIndex(gradeKey) {
  const n = parseGradeKey(gradeKey);
  return n != null ? n - 1 : -1;
}

/**
 * @param {string} gradeKey
 * @returns {"early"|"mid"|"late"|null}
 */
export function gradeBandForKey(gradeKey) {
  const n = parseGradeKey(gradeKey);
  if (n == null) return null;
  if (n <= 2) return "early";
  if (n <= 4) return "mid";
  return "late";
}

/**
 * @param {string} gradeKey
 * @param {number} minG inclusive 1–6
 * @param {number} maxG inclusive 1–6
 */
export function gradeInRange(gradeKey, minG, maxG) {
  const n = parseGradeKey(gradeKey);
  if (n == null) return false;
  return n >= minG && n <= maxG;
}

/**
 * Item may define (first match wins):
 * - gradeBand: "early" | "mid" | "late"
 * - minGrade / maxGrade (inclusive, 1–6)
 * - grades: string[] e.g. ["g3","g4"] (legacy allow-list)
 * If none: allowed for all grades (use sparingly).
 */
export function itemAllowedForGrade(item, gradeKey) {
  if (!item || typeof item !== "object") return false;
  const n = parseGradeKey(gradeKey);
  if (n == null) return false;
  if (item.gradeBand) {
    const b = gradeBandForKey(gradeKey);
    return b === item.gradeBand;
  }
  if (item.minGrade != null || item.maxGrade != null) {
    const lo = item.minGrade ?? 1;
    const hi = item.maxGrade ?? 6;
    return n >= lo && n <= hi;
  }
  if (Array.isArray(item.grades) && item.grades.length > 0) {
    const want = `g${n}`;
    return item.grades.map((g) => String(g).toLowerCase()).includes(want);
  }
  return true;
}

export function assertGradeAllowed(item, gradeKey, label = "item") {
  if (!itemAllowedForGrade(item, gradeKey)) {
    console.warn(`[grade-gating] ${label} not allowed for ${gradeKey}`, item);
  }
}

/** @type {Record<string, { minGrade: number, maxGrade: number }>} */
export const ENGLISH_GRAMMAR_POOL_RANGE = {
  be_basic: { minGrade: 1, maxGrade: 2 },
  question_frames: { minGrade: 2, maxGrade: 3 },
  present_simple: { minGrade: 3, maxGrade: 4 },
  progressive: { minGrade: 4, maxGrade: 4 },
  quantifiers: { minGrade: 4, maxGrade: 5 },
  past_simple: { minGrade: 5, maxGrade: 5 },
  modals: { minGrade: 5, maxGrade: 6 },
  comparatives: { minGrade: 5, maxGrade: 6 },
  future_forms: { minGrade: 5, maxGrade: 5 },
  complex_tenses: { minGrade: 6, maxGrade: 6 },
  conditionals: { minGrade: 6, maxGrade: 6 },
};

/** @type {Record<string, { minGrade: number, maxGrade: number }>} */
export const ENGLISH_TRANSLATION_POOL_RANGE = {
  classroom: { minGrade: 1, maxGrade: 2 },
  routines: { minGrade: 2, maxGrade: 3 },
  hobbies: { minGrade: 3, maxGrade: 4 },
  community: { minGrade: 4, maxGrade: 5 },
  technology: { minGrade: 5, maxGrade: 6 },
  global: { minGrade: 5, maxGrade: 6 },
};

/** @type {Record<string, { minGrade: number, maxGrade: number }>} */
export const ENGLISH_SENTENCE_POOL_RANGE = {
  base: { minGrade: 1, maxGrade: 2 },
  routine: { minGrade: 2, maxGrade: 4 },
  descriptive: { minGrade: 3, maxGrade: 4 },
  narrative: { minGrade: 4, maxGrade: 5 },
  advanced: { minGrade: 5, maxGrade: 6 },
};

/**
 * @param {"grammar"|"translation"|"sentence"} category
 * @param {string} poolKey
 * @param {object} item
 * @param {string} gradeKey
 */
export function englishPoolItemAllowed(category, poolKey, item, gradeKey) {
  const n = parseGradeKey(gradeKey);
  if (n == null) return false;
  const hasItemGate =
    item.gradeBand != null ||
    item.minGrade != null ||
    item.maxGrade != null ||
    (Array.isArray(item.grades) && item.grades.length > 0);
  if (hasItemGate) return itemAllowedForGrade(item, gradeKey);
  const map =
    category === "grammar"
      ? ENGLISH_GRAMMAR_POOL_RANGE
      : category === "translation"
        ? ENGLISH_TRANSLATION_POOL_RANGE
        : ENGLISH_SENTENCE_POOL_RANGE;
  const r = map[poolKey];
  if (!r) return true;
  return n >= r.minGrade && n <= r.maxGrade;
}
