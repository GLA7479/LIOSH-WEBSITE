/**
 * Moledet / geography static banks (`data/geography-questions/g*.js`).
 * Strands = top-level category keys under each G*_LEVEL_QUESTIONS object.
 */

/** @readonly */
export const MOLEDET_GEOGRAPHY_STRAND_KEYS = [
  "homeland",
  "community",
  "citizenship",
  "geography",
  "values",
  "maps",
];

export const MOLEDET_GEOGRAPHY_SKILL_IDS = new Set(
  MOLEDET_GEOGRAPHY_STRAND_KEYS.map((k) => `moledet_geo_${k}`)
);

export const MOLEDET_GEOGRAPHY_GRADE_SUBSKILL_IDS = new Set(["g1", "g2", "g3", "g4", "g5", "g6"]);

/** @returns {Record<string, Set<string>>} */
export function buildMoledetGeographySubskillAllowlistBySkill() {
  /** @type {Record<string, Set<string>>} */
  const m = {};
  for (const s of MOLEDET_GEOGRAPHY_SKILL_IDS) {
    m[s] = new Set(MOLEDET_GEOGRAPHY_GRADE_SUBSKILL_IDS);
  }
  return m;
}

export const MOLEDET_GEOGRAPHY_SUBSKILL_ALLOWLIST_BY_SKILL = buildMoledetGeographySubskillAllowlistBySkill();

/**
 * @param {string} strand — bucket key (homeland, maps, …)
 */
export function moledetGeographyStrandToSkillId(strand) {
  const k = String(strand).toLowerCase();
  if (!MOLEDET_GEOGRAPHY_STRAND_KEYS.includes(k)) return "";
  return `moledet_geo_${k}`;
}

/**
 * @param {string} exportName e.g. G4_MEDIUM_QUESTIONS
 * @returns {{ grade: number, band: "easy"|"medium"|"hard" } | null}
 */
export function parseMoledetGeographyExportName(exportName) {
  const m = String(exportName).match(/^G(\d)_(EASY|MEDIUM|HARD)_QUESTIONS$/);
  if (!m) return null;
  return { grade: Number(m[1]), band: /** @type {"easy"|"medium"|"hard"} */ (m[2].toLowerCase()) };
}

/**
 * @param {"easy"|"medium"|"hard"} band
 */
export function mapMoledetGeographyBandToDifficulty(band) {
  if (band === "easy") return "basic";
  if (band === "medium") return "standard";
  return "advanced";
}

/**
 * @param {string} objectPath e.g. G3_EASY_QUESTIONS.maps[2]
 */
export function parseMoledetGeographyObjectPath(objectPath) {
  const m = String(objectPath).match(/^([A-Z0-9_]+)\.([a-zA-Z0-9_]+)\[(\d+)\]$/);
  if (!m) return null;
  return { exportName: m[1], strand: m[2], index: Number(m[3]) };
}

/**
 * @param {string} relPath data/geography-questions/g4.js
 */
export function parseGradeFromMoledetGeographyFile(relPath) {
  const m = String(relPath).match(/g(\d)\.js$/i);
  return m ? Number(m[1]) : null;
}

/**
 * @param {string} strand
 */
export function inferMoledetGeographyCognitiveLevel(strand) {
  const s = String(strand).toLowerCase();
  if (s === "maps") return "application";
  if (s === "geography") return "understanding";
  if (s === "homeland") return "recall";
  return "understanding";
}

/**
 * @param {string} strand
 */
export function inferMoledetGeographyExpectedErrorTypes(strand) {
  const s = String(strand).toLowerCase();
  /** @type {string[]} */
  const out = [];
  if (s === "maps") {
    out.push("map_reading_error", "direction_confusion", "geography_concept_confusion", "careless_error");
  } else if (s === "geography") {
    out.push(
      "geography_concept_confusion",
      "place_identification_error",
      "vocabulary_confusion",
      "careless_error"
    );
  } else if (s === "homeland") {
    out.push("place_identification_error", "detail_recall_error", "vocabulary_confusion", "careless_error");
  } else if (s === "citizenship") {
    out.push("reading_comprehension_error", "concept_confusion", "careless_error");
  } else if (s === "community") {
    out.push("concept_confusion", "vocabulary_confusion", "careless_error");
  } else if (s === "values") {
    out.push("inference_error", "concept_confusion", "careless_error");
  } else {
    out.push("concept_confusion", "careless_error");
  }
  return [...new Set(out)];
}

/**
 * @param {object} record
 */
export function classifyMoledetGeographyConfidenceAndReview(record) {
  const op = String(record?.objectPath || "");
  const exportName = op.split(".")[0] || "";
  const exportMeta = exportName ? parseMoledetGeographyExportName(exportName) : null;
  const pathParsed = parseMoledetGeographyObjectPath(op);
  const ok = !!exportMeta && !!pathParsed;
  const reasons = ["Strand and difficulty band are explicit in export path and object path."];
  if (ok) return { confidence: "high", reviewPriority: "low", confidenceReasons: reasons };
  return {
    confidence: "low",
    reviewPriority: "high",
    confidenceReasons: ["Could not validate geography export/path pattern."],
  };
}

export function suggestMoledetGeographyPrerequisites() {
  return {
    ids: [],
    confidence: "low",
    reason: "Moledet/geography fast-track: skip automated prerequisite graph.",
  };
}
