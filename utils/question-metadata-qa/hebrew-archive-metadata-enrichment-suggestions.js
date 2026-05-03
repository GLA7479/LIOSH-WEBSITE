/**
 * Proposal-only metadata hints for parallel Hebrew archive banks (`data/hebrew-questions/g*.js`).
 */
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { scanQuestionBankModule } from "./question-metadata-scanner.js";
import {
  classifyHebrewArchiveConfidenceAndReview,
  hebrewArchiveCategoryToSkillId,
  inferHebrewArchiveCognitiveLevel,
  inferHebrewArchiveExpectedErrorTypes,
  mapHebrewArchiveBandToDifficulty,
  parseGradeFromHebrewArchiveFile,
  parseHebrewArchiveExportName,
  parseHebrewArchiveObjectPath,
  suggestHebrewArchivePrerequisites,
} from "./question-metadata-taxonomy-hebrew-archive.js";

export const HEBREW_ARCHIVE_REL_PATHS = [
  "data/hebrew-questions/g1.js",
  "data/hebrew-questions/g2.js",
  "data/hebrew-questions/g3.js",
  "data/hebrew-questions/g4.js",
  "data/hebrew-questions/g5.js",
  "data/hebrew-questions/g6.js",
];

/**
 * @param {Record<string, unknown>} mod
 * @param {string} objectPath
 */
export function getHebrewArchiveRawAtPath(mod, objectPath) {
  const p = parseHebrewArchiveObjectPath(objectPath);
  if (!p) return null;
  const root = mod[p.exportName];
  if (!root || typeof root !== "object") return null;
  const arr = root[p.category];
  if (!Array.isArray(arr)) return null;
  return arr[p.index] ?? null;
}

/**
 * @param {Record<string, unknown>} raw
 * @param {object} record
 * @param {string} sourceRel
 */
export function buildHebrewArchiveEnrichmentSuggestion(raw, record, sourceRel) {
  const prereq = suggestHebrewArchivePrerequisites();
  const parsedPath = parseHebrewArchiveObjectPath(record.objectPath);
  const exportMeta = parsedPath ? parseHebrewArchiveExportName(parsedPath.exportName) : null;
  const qtext = String(raw.question ?? raw.stem ?? raw.prompt ?? "");

  if (!parsedPath || !exportMeta) {
    const cls = classifyHebrewArchiveConfidenceAndReview(record, prereq);
    return {
      questionId: record.declaredId || record.id,
      sourceFile: sourceRel,
      subject: "hebrew-archive",
      objectPath: `${sourceRel}::${record.objectPath}`,
      current: {
        skillId: record.skillId,
        subskillId: record.subskillId,
        difficulty: record.difficulty,
        cognitiveLevel: record.cognitiveLevel,
        expectedErrorTypes: record.expectedErrorTypes || [],
        prerequisiteSkillIds: record.prerequisiteSkillIds || [],
      },
      suggested: {
        skillId: "",
        subskillId: "",
        difficulty: "standard",
        cognitiveLevel: "understanding",
        expectedErrorTypes: ["careless_error", "comprehension_gap"],
        prerequisiteSkillIds: [],
      },
      confidence: "low",
      confidenceReasons: ["Could not parse archive path or export band.", ...cls.confidenceReasons],
      reviewPriority: "high",
      needsHumanReview: true,
    };
  }

  const skillId = hebrewArchiveCategoryToSkillId(parsedPath.category);
  const g = parseGradeFromHebrewArchiveFile(sourceRel);
  const subskillId = g != null ? `g${g}` : "";

  const difficulty = mapHebrewArchiveBandToDifficulty(exportMeta.band);
  const cognitiveLevel = inferHebrewArchiveCognitiveLevel(parsedPath.category, qtext);
  const expectedErrorTypes = inferHebrewArchiveExpectedErrorTypes(parsedPath.category, qtext);

  const suggested = {
    skillId,
    subskillId,
    difficulty,
    cognitiveLevel,
    expectedErrorTypes,
    prerequisiteSkillIds: prereq.ids,
  };

  const cls = classifyHebrewArchiveConfidenceAndReview(record, prereq);

  return {
    questionId: record.declaredId || record.id,
    sourceFile: sourceRel,
    subject: "hebrew-archive",
    objectPath: `${sourceRel}::${record.objectPath}`,
    current: {
      skillId: record.skillId,
      subskillId: record.subskillId,
      difficulty: record.difficulty,
      cognitiveLevel: record.cognitiveLevel,
      expectedErrorTypes: record.expectedErrorTypes || [],
      prerequisiteSkillIds: record.prerequisiteSkillIds || [],
    },
    suggested,
    confidence: cls.confidence,
    confidenceReasons: cls.confidenceReasons,
    reviewPriority: cls.reviewPriority,
    needsHumanReview: true,
  };
}

/**
 * @param {string} rootAbs
 * @returns {Promise<{ suggestions: object[], rowCountByFile: Record<string, number>, archiveRowTotal: number, fieldHistogram: Record<string, number> }>}
 */
export async function generateHebrewArchiveSuggestions(rootAbs) {
  /** @type {object[]} */
  const suggestions = [];
  /** @type {Record<string, number>} */
  const rowCountByFile = {};
  /** @type {Record<string, number>} */
  const fieldHistogram = {
    skillId: 0,
    subskillId: 0,
    difficulty: 0,
    cognitiveLevel: 0,
    expectedErrorTypes: 0,
    prerequisiteSkillIds: 0,
  };

  for (const rel of HEBREW_ARCHIVE_REL_PATHS) {
    const url = pathToFileURL(join(rootAbs, rel)).href;
    const mod = await import(`${url}?t=${Date.now()}`);
    const { records } = await scanQuestionBankModule(rootAbs, rel, "hebrew-archive");
    rowCountByFile[rel] = records.length;

    for (const record of records) {
      const raw = /** @type {Record<string, unknown>} */ (
        getHebrewArchiveRawAtPath(mod, record.objectPath) || {}
      );
      const sug = buildHebrewArchiveEnrichmentSuggestion(raw, record, rel);
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
    }
  }

  const archiveRowTotal = Object.values(rowCountByFile).reduce((a, b) => a + b, 0);

  return { suggestions, rowCountByFile, archiveRowTotal, fieldHistogram };
}
