/**
 * Proposal-only English static pool metadata hints (does not write banks).
 */
import * as grammarMod from "../../data/english-questions/grammar-pools.js";
import * as sentenceMod from "../../data/english-questions/sentence-pools.js";
import * as translationMod from "../../data/english-questions/translation-pools.js";

import { buildScanRecord } from "./question-metadata-scanner.js";
import { collectAllEnglishRows } from "./english-pool-walker.js";
import { classifyEnglishConfidenceAndReview } from "./english-enrichment-review-pack.js";
import {
  EXTENDED_EXPECTED_ERROR_TYPES,
  inferEnglishCognitiveLevel,
  inferEnglishDifficultyFromGrade,
  mapDifficultyToCanonical,
} from "./question-metadata-taxonomy.js";

function pickStr(v) {
  if (v === undefined || v === null) return "";
  return String(v).trim();
}

/**
 * Pool bucket id from scanner objectPath (`GRAMMAR_POOLS.be_basic[3]` → `be_basic`).
 * @param {string} objectPath
 */
export function parseEnglishPoolBucketKey(objectPath) {
  const m = String(objectPath).match(/^[A-Z_]+\.([a-zA-Z0-9_]+)\[\d+\]$/);
  return m ? m[1] : "";
}

/**
 * @param {Record<string, unknown>} raw
 * @param {string} sourceFile
 */
function normalizeEnglishErrorTags(raw, sourceFile) {
  const fromArr = Array.isArray(raw.expectedErrorTypes)
    ? raw.expectedErrorTypes
    : Array.isArray(raw.expectedErrorTags)
      ? raw.expectedErrorTags
      : [];

  /** @type {string[]} */
  const out = [];
  for (const t of fromArr.map(String)) {
    const x = t.trim();
    if (!x) continue;
    out.push(EXTENDED_EXPECTED_ERROR_TYPES.has(x) ? x : "concept_confusion");
  }

  if (sourceFile.includes("grammar-pools")) {
    out.push("grammar_error", "grammar_pattern_error", "careless_error");
  } else if (sourceFile.includes("translation-pools")) {
    out.push("translation_error", "vocabulary_confusion", "reading_comprehension_error");
  } else if (sourceFile.includes("sentence-pools")) {
    out.push("grammar_error", "sentence_order_error", "careless_error");
  }

  const uniq = [...new Set(out)].filter(Boolean);
  return uniq.length ? uniq : ["grammar_error", "concept_confusion", "careless_error"];
}

function suggestEnglishPrerequisite() {
  return {
    ids: [],
    confidence: "medium",
    reason: "No automated prerequisite chain for English pools in this fast-track pass.",
  };
}

/**
 * Deterministic skill/subskill hints: diagnostic wins; pool bucket refines subtype via `subtype` on apply.
 * @param {Record<string, unknown>} raw
 * @param {object} record
 * @param {string} objectPath
 */
function suggestEnglishSkillSubskill(raw, record, objectPath) {
  const poolBucket = parseEnglishPoolBucketKey(objectPath);
  const diag = pickStr(raw.diagnosticSkillId);
  const explicitSkill = pickStr(raw.skillId);
  const skillId = diag || explicitSkill || pickStr(record.skillId);

  const subskillId = poolBucket || pickStr(record.subskillId) || "";

  return { skillId, subskillId, poolBucket };
}

/**
 * @param {Record<string, unknown>} raw
 * @param {object} record
 * @param {{ raw: Record<string, unknown>, objectPath: string, sourceFile: string, seqIndex: number }} rowCtx
 */
export function buildEnglishEnrichmentSuggestion(raw, record, rowCtx) {
  const { objectPath, sourceFile } = rowCtx;

  const baseDiff = pickStr(raw.difficulty) || inferEnglishDifficultyFromGrade(raw);
  const difficultyCanon = mapDifficultyToCanonical(baseDiff);

  const cognitiveLevel = inferEnglishCognitiveLevel(raw, baseDiff, sourceFile);

  const expectedErrorTypes = normalizeEnglishErrorTags(raw, sourceFile);
  const sk = suggestEnglishSkillSubskill(raw, record, objectPath);
  const prereq = suggestEnglishPrerequisite();
  const classification = classifyEnglishConfidenceAndReview(raw, record, prereq, sk.poolBucket);

  const suggested = {
    skillId: sk.skillId,
    subskillId: sk.subskillId,
    difficulty: difficultyCanon,
    cognitiveLevel,
    expectedErrorTypes,
    prerequisiteSkillIds: prereq.ids,
  };

  const current = {
    skillId: record.skillId,
    subskillId: record.subskillId,
    difficulty: record.difficulty,
    cognitiveLevel: record.cognitiveLevel,
    expectedErrorTypes: record.expectedErrorTypes || [],
    prerequisiteSkillIds: record.prerequisiteSkillIds || [],
  };

  const questionId = record.declaredId || record.id;

  return {
    questionId,
    sourceFile,
    subject: "english",
    objectPath: `${sourceFile}::${objectPath}`,
    current,
    suggested,
    confidence: classification.confidence,
    confidenceReasons: classification.confidenceReasons,
    reviewPriority: classification.reviewPriority,
    needsHumanReview: true,
  };
}

/**
 * @returns {{ suggestions: object[], englishRowCount: number, rowsBySourceFile: Record<string, number>, fieldHistogram: Record<string, number> }}
 */
export function generateEnglishSuggestions() {
  const rows = collectAllEnglishRows(grammarMod, translationMod, sentenceMod);
  /** @type {Record<string, number>} */
  const rowsBySourceFile = {};
  for (const r of rows) {
    rowsBySourceFile[r.sourceFile] = (rowsBySourceFile[r.sourceFile] || 0) + 1;
  }

  /** @type {object[]} */
  const suggestions = [];
  /** @type {Record<string, number>} */
  const fieldHistogram = {
    skillId: 0,
    subskillId: 0,
    difficulty: 0,
    cognitiveLevel: 0,
    expectedErrorTypes: 0,
    prerequisiteSkillIds: 0,
  };

  let i = 0;
  for (const row of rows) {
    const record = buildScanRecord(row.raw, row.sourceFile, row.objectPath, "english", i);
    const sug = buildEnglishEnrichmentSuggestion(row.raw, record, row);
    suggestions.push(sug);

    const cur = sug.current;
    const s = sug.suggested;
    if ((cur.skillId || "") !== (s.skillId || "")) fieldHistogram.skillId += 1;
    if ((cur.subskillId || "") !== (s.subskillId || "")) fieldHistogram.subskillId += 1;
    if ((cur.difficulty || "") !== (s.difficulty || "")) fieldHistogram.difficulty += 1;
    if ((cur.cognitiveLevel || "") !== (s.cognitiveLevel || "")) fieldHistogram.cognitiveLevel += 1;
    if ((cur.expectedErrorTypes || []).join(",") !== (s.expectedErrorTypes || []).join(","))
      fieldHistogram.expectedErrorTypes += 1;
    if ((cur.prerequisiteSkillIds || []).join(",") !== (s.prerequisiteSkillIds || []).join(","))
      fieldHistogram.prerequisiteSkillIds += 1;
    i += 1;
  }

  return { suggestions, englishRowCount: rows.length, rowsBySourceFile, fieldHistogram };
}
