/**
 * Lightweight question-metadata index for Adaptive Planner (offline).
 * Reuses question-metadata-qa scanners; does not load full question stems into planner payloads.
 */
import { join } from "node:path";

import {
  GEOMETRY_CONCEPTUAL_BANK,
  STATIC_QUESTION_BANK_MODULES,
} from "../question-metadata-qa/question-bank-discovery.js";
import { scanGeometryConceptualBank, scanQuestionBankModule } from "../question-metadata-qa/question-metadata-scanner.js";
import { buildMathGeneratorMetadataMap } from "../question-metadata-qa/math-generator-metadata-map.js";

/**
 * @typedef {object} PlannerQuestionMetadataLight
 * @property {string} sourceFile
 * @property {string} subject
 * @property {string} skillId
 * @property {string} subskillId
 * @property {string} difficulty
 * @property {string} cognitiveLevel
 * @property {string[]} expectedErrorTypes
 * @property {string[]} prerequisiteSkillIds
 * @property {string} questionType
 * @property {string} id
 */

/**
 * @param {object} r — scanner record
 * @returns {PlannerQuestionMetadataLight|null}
 */
export function scanRecordToPlannerLight(r) {
  if (!r || typeof r !== "object") return null;
  const id = String(r.declaredId || r.id || "").trim();
  const subject = String(r.subject || "").trim().toLowerCase();
  const skillId = String(r.skillId || "").trim();
  const subskillId = String(r.subskillId || "").trim();
  if (!id || !subject) return null;
  if (!skillId || !subskillId) return null;
  if (!isSafeMetadataId(id)) return null;
  return {
    sourceFile: String(r.sourceFile || "").replace(/\\/g, "/"),
    subject,
    skillId,
    subskillId,
    difficulty: String(r.difficulty || "").toLowerCase(),
    cognitiveLevel: String(r.cognitiveLevel || "").toLowerCase(),
    expectedErrorTypes: Array.isArray(r.expectedErrorTypes) ? r.expectedErrorTypes.map(String).slice(0, 8) : [],
    prerequisiteSkillIds: Array.isArray(r.prerequisiteSkillIds) ? r.prerequisiteSkillIds.map(String).slice(0, 8) : [],
    questionType: String(r.questionType || "").slice(0, 64),
    id,
  };
}

/** Disallow obvious free-text blobs in ids (heuristic) */
function isSafeMetadataId(id) {
  const s = String(id);
  if (s.length > 200) return false;
  if (/[\u0590-\u05FF]/.test(s) && s.length > 80) return false;
  return true;
}

/**
 * Map planner difficulty tier to bank-style hints for loose matching.
 * @param {string} d
 */
export function mapPlannerDifficultyToBankHints(d) {
  const x = String(d || "").toLowerCase();
  const hints = new Set();
  if (x === "intro" || x === "basic") {
    hints.add("easy");
    hints.add("basic");
  }
  if (x === "standard") {
    hints.add("easy");
    hints.add("medium");
    hints.add("standard");
  }
  if (x === "advanced" || x === "challenge") {
    hints.add("medium");
    hints.add("hard");
    hints.add("advanced");
  }
  return [...hints];
}

/**
 * @param {string} subject
 */
export function subjectAliasesForQuery(subject) {
  const s = String(subject || "").trim().toLowerCase();
  if (s === "hebrew") return new Set(["hebrew", "hebrew-archive"]);
  return new Set([s]);
}

/**
 * @param {object} options
 * @param {string} options.rootAbs
 * @param {boolean} [options.includeMathProceduralPlaceholders]
 */
export async function buildPlannerQuestionMetadataIndex(options) {
  const rootAbs = String(options?.rootAbs || "").trim();
  if (!rootAbs) throw new Error("buildPlannerQuestionMetadataIndex: rootAbs required");

  /** @type {PlannerQuestionMetadataLight[]} */
  const entries = [];
  /** @type {{ path: string, error: string }[]} */
  const loadErrors = [];

  for (const mod of STATIC_QUESTION_BANK_MODULES) {
    try {
      const { records } = await scanQuestionBankModule(rootAbs, mod.path, mod.subjectId);
      const canonicalSubject = String(mod.subjectId || "").toLowerCase();
      for (const r of records) {
        const light = scanRecordToPlannerLight({ ...r, subject: canonicalSubject });
        if (light) entries.push(light);
      }
    } catch (e) {
      loadErrors.push({ path: mod.path, error: String(e?.message || e) });
    }
  }

  try {
    const { records } = await scanGeometryConceptualBank(rootAbs);
    for (const r of records) {
      const light = scanRecordToPlannerLight({ ...r, subject: GEOMETRY_CONCEPTUAL_BANK.subjectId });
      if (light) entries.push(light);
    }
  } catch (e) {
    loadErrors.push({ path: GEOMETRY_CONCEPTUAL_BANK.path, error: String(e?.message || e) });
  }

  if (options?.includeMathProceduralPlaceholders !== false) {
    try {
      const map = buildMathGeneratorMetadataMap(join(rootAbs, "utils", "math-question-generator.js"));
      const genPath = map?.generator?.path || "utils/math-question-generator.js";
      const kinds = map?.discovery?.kindLiteralsDiscovered || [];
      const diags = map?.discovery?.diagnosticSkillIdStringsSample || [];
      for (const k of kinds) {
        const kid = `math:procedural:kind:${String(k).slice(0, 80)}`;
        entries.push({
          sourceFile: genPath,
          subject: "math",
          skillId: `math_${String(k).replace(/[^a-z0-9_]/gi, "_")}`,
          subskillId: String(k).slice(0, 120),
          difficulty: "standard",
          cognitiveLevel: "application",
          expectedErrorTypes: [],
          prerequisiteSkillIds: [],
          questionType: "procedural_placeholder",
          id: kid,
        });
      }
      for (const d of diags) {
        const ds = String(d).slice(0, 120);
        entries.push({
          sourceFile: genPath,
          subject: "math",
          skillId: ds,
          subskillId: ds,
          difficulty: "standard",
          cognitiveLevel: "application",
          expectedErrorTypes: [],
          prerequisiteSkillIds: [],
          questionType: "procedural_placeholder",
          id: `math:procedural:diag:${ds.replace(/[^a-z0-9_]/gi, "_")}`,
        });
      }
    } catch (e) {
      loadErrors.push({ path: "math-generator-metadata-map", error: String(e?.message || e) });
    }
  }

  /** @type {Record<string, number>} */
  const bySubject = {};
  for (const e of entries) {
    bySubject[e.subject] = (bySubject[e.subject] || 0) + 1;
  }

  const stats = {
    totalEntries: entries.length,
    bySubject,
    staticBankModulesAttempted: STATIC_QUESTION_BANK_MODULES.length,
    geometryConceptual: true,
    mathProceduralPlaceholdersIncluded: options?.includeMathProceduralPlaceholders !== false,
    loadErrors,
  };

  return {
    entries,
    stats,
    builtAt: new Date().toISOString(),
    rootAbs,
  };
}

/**
 * @param {object} index — from buildPlannerQuestionMetadataIndex
 * @param {object} query
 * @param {string} query.subject
 * @param {string} [query.skillId]
 * @param {string} [query.subskillId]
 * @param {string} [query.difficulty]
 * @param {string[]} [query.detectedErrorTypes]
 * @param {number} [query.limit]
 * @param {boolean} [query.allowSubjectFallback]
 */
export function getAvailableQuestionMetadataForPlanner(index, query) {
  /** @type {string[]} */
  const warnings = [];
  const limit = Math.min(40, Math.max(1, Number(query?.limit) || 12));
  const subjectRaw = String(query?.subject || "").trim().toLowerCase();
  const skillQ = String(query?.skillId || "").trim();
  const subQ = String(query?.subskillId || "").trim();
  const allowSubjectFallback = query?.allowSubjectFallback !== false;

  if (!subjectRaw) {
    warnings.push("metadata_query_missing_subject");
    return { candidates: [], warnings, subjectFallback: false, skillOnlyFallback: false };
  }

  if (subjectRaw === "english" && (!skillQ || !subQ)) {
    warnings.push("english_untagged_query_no_metadata");
    return { candidates: [], warnings, subjectFallback: false, skillOnlyFallback: false };
  }

  const aliases = subjectAliasesForQuery(subjectRaw);
  /** @param {PlannerQuestionMetadataLight} e */
  const subjectMatch = (e) => aliases.has(e.subject);

  let pool = index.entries.filter(subjectMatch);

  /** @type {PlannerQuestionMetadataLight[]} */
  let candidates = [];
  let subjectFallback = false;
  let skillOnlyFallback = false;

  if (skillQ && subQ) {
    candidates = pool.filter((e) => e.skillId === skillQ && e.subskillId === subQ);
  } else if (skillQ) {
    candidates = pool.filter((e) => e.skillId === skillQ);
    if (candidates.length) skillOnlyFallback = true;
  }

  const diffHints = mapPlannerDifficultyToBankHints(query?.difficulty);
  if (candidates.length && diffHints.length) {
    const narrowed = candidates.filter((e) => !e.difficulty || diffHints.includes(e.difficulty));
    if (narrowed.length) candidates = narrowed;
  }

  const errQ = Array.isArray(query?.detectedErrorTypes)
    ? query.detectedErrorTypes.map(String).filter(Boolean)
    : [];
  if (candidates.length && errQ.length) {
    const tagged = candidates.filter((e) => e.expectedErrorTypes.some((t) => errQ.some((q) => t.includes(q) || q.includes(t))));
    if (tagged.length) candidates = tagged;
  }

  candidates = dedupeById(candidates);
  candidates.sort((a, b) => a.id.localeCompare(b.id));

  if (!candidates.length && allowSubjectFallback) {
    const tagged = pool.filter((e) => e.skillId && e.subskillId);
    if (tagged.length) {
      candidates = dedupeById(tagged).sort((a, b) => a.id.localeCompare(b.id));
      subjectFallback = true;
      warnings.push("metadata_subject_fallback");
    }
  }

  if (!candidates.length) {
    if (skillQ || subQ) warnings.push("metadata_no_match_for_skill");
    else warnings.push("metadata_no_rows_for_subject");
  }

  return {
    candidates: candidates.slice(0, limit),
    warnings,
    subjectFallback,
    skillOnlyFallback,
  };
}

/**
 * @param {PlannerQuestionMetadataLight[]} arr
 */
function dedupeById(arr) {
  const seen = new Set();
  const out = [];
  for (const e of arr) {
    if (seen.has(e.id)) continue;
    seen.add(e.id);
    out.push(e);
  }
  return out;
}

/**
 * @param {object} index
 */
/** Keys that must never appear on lightweight planner / snapshot rows (full content leak guard). */
export const FORBIDDEN_LEAK_KEYS = [
  "question",
  "stem",
  "prompt",
  "options",
  "answers",
  "correctAnswer",
  "correctIndex",
];

export function assertPlannerMetadataLightShape(obj) {
  const allowed = new Set([
    "sourceFile",
    "subject",
    "skillId",
    "subskillId",
    "difficulty",
    "cognitiveLevel",
    "expectedErrorTypes",
    "prerequisiteSkillIds",
    "questionType",
    "id",
  ]);
  if (!obj || typeof obj !== "object") return "not_object";
  const keys = Object.keys(obj);
  for (const k of keys) {
    if (!allowed.has(k)) return `unexpected_key:${k}`;
  }
  return null;
}

/**
 * @param {object[]} entries
 * @returns {string[]} violation messages
 */
export function validateLightEntriesNoForbiddenFields(entries) {
  /** @type {string[]} */
  const hits = [];
  if (!Array.isArray(entries)) return ["entries_not_array"];
  for (let i = 0; i < entries.length; i += 1) {
    const e = entries[i];
    for (const k of FORBIDDEN_LEAK_KEYS) {
      if (e && typeof e === "object" && Object.prototype.hasOwnProperty.call(e, k)) {
        hits.push(`row_${i}_forbidden_key:${k}`);
      }
    }
    const shape = assertPlannerMetadataLightShape(e);
    if (shape) hits.push(`row_${i}_shape:${shape}`);
  }
  return hits;
}

/**
 * @param {string} jsonString — full serialized snapshot or summary
 */
export function assertSerializedMetadataLeakFree(jsonString) {
  const patterns = [
    /"stem"\s*:/i,
    /"question"\s*:/i,
    /"prompt"\s*:/i,
    /"options"\s*:/i,
    /"answers"\s*:/i,
    /"correctAnswer"\s*:/i,
    /"correctIndex"\s*:/i,
  ];
  for (const p of patterns) {
    if (p.test(jsonString)) return false;
  }
  return true;
}

/**
 * Offline smoke checks for CI / artifact runner (throws on failure).
 * @param {Awaited<ReturnType<typeof buildPlannerQuestionMetadataIndex>>} index
 */
export function runPlannerMetadataProviderSmokeChecks(index) {
  /** @type {string[]} */
  const errors = [];

  const science = index.entries.find((e) => e.subject === "science");
  if (science) {
    const r = getAvailableQuestionMetadataForPlanner(index, {
      subject: "science",
      skillId: science.skillId,
      subskillId: science.subskillId,
      limit: 6,
      allowSubjectFallback: false,
    });
    if (!r.candidates.length) errors.push("science_exact_match_expected_nonzero_candidates");
  }

  const rBad = getAvailableQuestionMetadataForPlanner(index, {
    subject: "math",
    skillId: "__nonexistent_planner_skill__",
    subskillId: "__nonexistent_planner_sub__",
    limit: 5,
    allowSubjectFallback: false,
  });
  if (rBad.candidates.length) errors.push("unknown_skill_should_return_empty");
  if (!rBad.warnings.includes("metadata_no_match_for_skill")) {
    errors.push("unknown_skill_should_warn_metadata_no_match_for_skill");
  }

  const rEn = getAvailableQuestionMetadataForPlanner(index, {
    subject: "english",
    limit: 8,
  });
  if (rEn.candidates.length) errors.push("english_untagged_query_must_return_empty");
  if (!rEn.warnings.includes("english_untagged_query_no_metadata")) {
    errors.push("english_untagged_should_warn");
  }

  const rFb = getAvailableQuestionMetadataForPlanner(index, {
    subject: "geometry",
    skillId: "__bad_geometry_skill__",
    subskillId: "__bad_geometry_sub__",
    limit: 4,
    allowSubjectFallback: true,
  });
  if (rFb.candidates.length && !rFb.subjectFallback) {
    errors.push("subject_fallback_should_set_subjectFallback_when_bad_skill");
  }

  const sample = index.entries.slice(0, 600);
  for (const e of sample) {
    const bad = assertPlannerMetadataLightShape(e);
    if (bad) errors.push(`light_shape:${bad}`);
    const ser = JSON.stringify(e);
    if (/"(stem|question|prompt|template)"/i.test(ser)) errors.push("forbidden_question_text_key_in_light_record");
  }

  return { errors };
}
