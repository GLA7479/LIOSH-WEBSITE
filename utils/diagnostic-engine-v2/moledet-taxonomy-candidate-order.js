/**
 * Phase 5-C2 — moledet-geography conflict buckets only: reorder taxonomy candidates from wrong-event
 * evidence. Never removes candidates. `bucketKey` selects the branch only; it is not concatenated
 * into the evidence haystack (avoids bucket name dominating every row).
 *
 * Bridge preserve order when evidence is missing, tied, or ambiguous:
 * - maps: MG-01, MG-02, MG-08
 * - geography: MG-01, MG-02, MG-05
 * - homeland: MG-04, MG-06
 */

/** @type {readonly string[]} */
const BRIDGE_MAPS = ["MG-01", "MG-02", "MG-08"];

/** @type {readonly string[]} */
const BRIDGE_GEOGRAPHY = ["MG-01", "MG-02", "MG-05"];

/** @type {readonly string[]} */
const BRIDGE_HOMELAND = ["MG-04", "MG-06"];

/** Longer / more specific phrases first where they subsume shorter tokens. */
const MG01_MAPS_GEO_INDICATORS = [
  "compare distances",
  "measuring distance",
  "relative distance",
  "units on map",
  "map units",
  "map scale",
  "scale bar",
  "distance",
  "scale",
  "ruler",
];

const MG02_MAPS_GEO_INDICATORS = [
  "absolute north",
  "spatial reference",
  "map rotation",
  "rotated map",
  "direction choice",
  "left/right",
  "orientation",
  "compass",
  "direction",
  "north",
];

const MG08_MAPS_INDICATORS = [
  "matching symbol to meaning",
  "landscape symbol",
  "map signs",
  "key reading",
  "map key",
  "symbols",
  "legend",
  "symbol",
  "icon",
];

const MG05_GEOGRAPHY_INDICATORS = [
  "geographic region",
  "climate zone",
  "climate map",
  "map key for climate",
  "zone reading",
  "color key",
  "climate",
  "region",
  "area on map",
];

const MG04_HOMELAND_INDICATORS = [
  "sequence cards",
  "historical sequence",
  "order of events",
  "event order",
  "chronology",
  "before/after",
  "before_after",
  "timeline",
];

const MG06_HOMELAND_INDICATORS = [
  "two explanations",
  "cause_effect",
  "inference from text/map",
  "inference_from_text",
  "inference",
  "settlement",
  "population",
  "explanation",
  "evidence",
  "reason",
];

/**
 * @param {unknown} ev
 * @returns {string}
 */
function haystackForWrong(ev) {
  if (!ev || typeof ev !== "object") return "";
  const e = /** @type {Record<string, unknown>} */ (ev);
  const parts = [];
  for (const k of ["patternFamily", "kind", "conceptTag", "diagnosticSkillId", "topicOrOperation"]) {
    if (e[k] != null && String(e[k]).trim()) parts.push(String(e[k]));
  }
  const params = e.params;
  if (params && typeof params === "object") {
    const p = /** @type {Record<string, unknown>} */ (params);
    for (const k of ["kind", "patternFamily", "operation", "conceptTag", "diagnosticSkillId", "semanticFamily"]) {
      if (p[k] != null && String(p[k]).trim()) parts.push(String(p[k]));
    }
    try {
      parts.push(JSON.stringify(p).toLowerCase());
    } catch {
      /* ignore */
    }
    const contract = p.contract;
    if (contract && typeof contract === "object") {
      try {
        parts.push(JSON.stringify(contract).toLowerCase());
      } catch {
        /* ignore */
      }
    }
  }
  return parts.join(" ").toLowerCase();
}

/**
 * @param {unknown} row
 * @returns {string}
 */
function rowGradeLevelHaystack(row) {
  const parts = [];
  if (row && typeof row === "object") {
    const r = /** @type {Record<string, unknown>} */ (row);
    for (const k of ["levelKey", "gradeKey"]) {
      if (r[k] != null && String(r[k]).trim()) parts.push(String(r[k]).toLowerCase());
    }
  }
  return parts.join(" ");
}

/**
 * @param {string} hay
 * @param {readonly string[]} phrases
 * @returns {number}
 */
function countIndicatorHits(hay, phrases) {
  let n = 0;
  for (const ph of phrases) {
    if (!ph) continue;
    if (hay.includes(ph)) n += 1;
  }
  return n;
}

/**
 * @param {unknown[]} wrongEvents
 * @param {unknown} [row]
 * @returns {{ "MG-01": number; "MG-02": number; "MG-08": number }}
 */
export function moledetMapsRoutingScores(wrongEvents, row) {
  const rowHay = rowGradeLevelHaystack(row);
  let s01 = 0;
  let s02 = 0;
  let s08 = 0;
  const list = Array.isArray(wrongEvents) ? wrongEvents : [];
  for (const ev of list) {
    const wh = `${rowHay} ${haystackForWrong(ev)}`.trim().toLowerCase();
    s01 += countIndicatorHits(wh, MG01_MAPS_GEO_INDICATORS);
    s02 += countIndicatorHits(wh, MG02_MAPS_GEO_INDICATORS);
    s08 += countIndicatorHits(wh, MG08_MAPS_INDICATORS);
  }
  return { "MG-01": s01, "MG-02": s02, "MG-08": s08 };
}

/**
 * @param {unknown[]} wrongEvents
 * @param {unknown} [row]
 * @returns {{ "MG-01": number; "MG-02": number; "MG-05": number }}
 */
export function moledetGeographyRoutingScores(wrongEvents, row) {
  const rowHay = rowGradeLevelHaystack(row);
  let s01 = 0;
  let s02 = 0;
  let s05 = 0;
  const list = Array.isArray(wrongEvents) ? wrongEvents : [];
  for (const ev of list) {
    const wh = `${rowHay} ${haystackForWrong(ev)}`.trim().toLowerCase();
    s01 += countIndicatorHits(wh, MG01_MAPS_GEO_INDICATORS);
    s02 += countIndicatorHits(wh, MG02_MAPS_GEO_INDICATORS);
    s05 += countIndicatorHits(wh, MG05_GEOGRAPHY_INDICATORS);
  }
  return { "MG-01": s01, "MG-02": s02, "MG-05": s05 };
}

/**
 * @param {unknown[]} wrongEvents
 * @param {unknown} [row]
 * @returns {{ "MG-04": number; "MG-06": number }}
 */
export function moledetHomelandRoutingScores(wrongEvents, row) {
  const rowHay = rowGradeLevelHaystack(row);
  let s04 = 0;
  let s06 = 0;
  const list = Array.isArray(wrongEvents) ? wrongEvents : [];
  for (const ev of list) {
    const wh = `${rowHay} ${haystackForWrong(ev)}`.trim().toLowerCase();
    s04 += countIndicatorHits(wh, MG04_HOMELAND_INDICATORS);
    if (/\bdates\b/.test(wh)) s04 += 1;
    s06 += countIndicatorHits(wh, MG06_HOMELAND_INDICATORS);
    if (/\bcause\b/.test(wh)) s06 += 1;
    if (/\beffect\b/.test(wh)) s06 += 1;
    if (/\bwhy\b/.test(wh)) s06 += 1;
  }
  return { "MG-04": s04, "MG-06": s06 };
}

/**
 * @param {string[]} candidateIds
 * @param {readonly string[]} bridgeOrder
 * @param {Record<string, number>} scores
 * @returns {string[]}
 */
function reorderByUniqueWinner(candidateIds, bridgeOrder, scores) {
  if (!Array.isArray(candidateIds) || candidateIds.length === 0) return candidateIds ? [...candidateIds] : [];
  const present = bridgeOrder.filter((id) => candidateIds.includes(id));
  if (present.length === 0) return [...candidateIds];

  let maxS = 0;
  for (const id of present) {
    const v = scores[id] ?? 0;
    if (v > maxS) maxS = v;
  }
  if (maxS === 0) return [...candidateIds];

  const winners = present.filter((id) => (scores[id] ?? 0) === maxS);
  if (winners.length !== 1) return [...candidateIds];

  const w = winners[0];
  const rest = present.filter((id) => id !== w);
  const orderedCore = [w, ...rest];
  const extras = candidateIds.filter((id) => !bridgeOrder.includes(id));
  return [...orderedCore, ...extras];
}

/**
 * @param {string[]} candidateIds
 * @param {unknown[]} wrongEvents
 * @param {{ row?: unknown; bucketKey?: string }} [ctx]
 * @returns {string[]}
 */
export function orderMoledetTaxonomyCandidates(candidateIds, wrongEvents, ctx = {}) {
  if (!Array.isArray(candidateIds) || candidateIds.length === 0) return candidateIds ? [...candidateIds] : [];
  const bk = String(ctx.bucketKey || "").trim().toLowerCase();

  if (bk === "maps") {
    const need = ["MG-01", "MG-02", "MG-08"];
    if (need.every((id) => candidateIds.includes(id))) {
      const scores = moledetMapsRoutingScores(wrongEvents, ctx.row);
      return reorderByUniqueWinner(candidateIds, BRIDGE_MAPS, scores);
    }
    return [...candidateIds];
  }

  if (bk === "geography") {
    const need = ["MG-01", "MG-02", "MG-05"];
    if (need.every((id) => candidateIds.includes(id))) {
      const scores = moledetGeographyRoutingScores(wrongEvents, ctx.row);
      return reorderByUniqueWinner(candidateIds, BRIDGE_GEOGRAPHY, scores);
    }
    return [...candidateIds];
  }

  if (bk === "homeland") {
    if (candidateIds.includes("MG-04") && candidateIds.includes("MG-06")) {
      const scores = moledetHomelandRoutingScores(wrongEvents, ctx.row);
      return reorderByUniqueWinner(candidateIds, BRIDGE_HOMELAND, scores);
    }
    return [...candidateIds];
  }

  return [...candidateIds];
}
