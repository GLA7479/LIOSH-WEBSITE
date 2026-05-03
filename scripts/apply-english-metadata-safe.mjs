#!/usr/bin/env node
/**
 * Apply safe English pool metadata from enrichment JSON (grammar / translation / sentence pools only).
 * npm run qa:english-metadata:apply-safe
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const suggestionsPath = join(ROOT, "reports", "question-metadata-qa", "english-enrichment-suggestions.json");
const reportDir = join(ROOT, "reports", "question-metadata-qa");
const reportJson = join(reportDir, "english-metadata-apply-report.json");
const reportMd = join(reportDir, "english-metadata-apply-report.md");

const PATHS = {
  grammar: join(ROOT, "data", "english-questions", "grammar-pools.js"),
  translation: join(ROOT, "data", "english-questions", "translation-pools.js"),
  sentence: join(ROOT, "data", "english-questions", "sentence-pools.js"),
};

function pickStr(v) {
  if (v === undefined || v === null) return "";
  return String(v).trim();
}

/**
 * @param {Record<string, unknown>} row
 */
function effectiveSkillForTaxonomy(row) {
  const params = row.params && typeof row.params === "object" ? /** @type {Record<string, unknown>} */ (row.params) : {};
  return (
    pickStr(row.diagnosticSkillId) ||
    pickStr(row.skillId) ||
    pickStr(params.diagnosticSkillId) ||
    pickStr(params.skillId) ||
    pickStr(row.conceptTag) ||
    pickStr(params.conceptTag) ||
    pickStr(row.patternFamily) ||
    ""
  );
}

/**
 * @param {string} fullObjectPath — `sourceFile::GRAMMAR_POOLS.be_basic[0]`
 */
function splitSuggestionPath(fullObjectPath) {
  const idx = fullObjectPath.indexOf("::");
  if (idx === -1) throw new Error(`Bad objectPath (missing ::): ${fullObjectPath}`);
  return {
    sourceFile: fullObjectPath.slice(0, idx),
    rel: fullObjectPath.slice(idx + 2),
  };
}

/** Pool bucket key aligned with `english-metadata-enrichment-suggestions.parseEnglishPoolBucketKey`. */
function parsePoolBucketFromRel(rel) {
  const m = String(rel).match(/^[A-Z_]+\.([a-zA-Z0-9_]+)\[\d+\]$/);
  return m ? m[1] : "";
}

/**
 * @param {Record<string, unknown>} poolClone — inner object (not wrapped by export name)
 * @param {string} rel — `GRAMMAR_POOLS.be_basic[0]`
 */
function getRowAtPath(poolClone, exportName, rel) {
  const prefix = `${exportName}.`;
  if (!rel.startsWith(prefix)) throw new Error(`Path ${rel} does not start with ${prefix}`);
  const rest = rel.slice(prefix.length);
  const m = rest.match(/^([a-zA-Z0-9_]+)\[(\d+)\]$/);
  if (!m) throw new Error(`Unsupported relative path ${rest}`);
  const bucket = m[1];
  const i = Number(m[2]);
  const arr = poolClone[bucket];
  if (!Array.isArray(arr) || !arr[i]) throw new Error(`Missing row at ${exportName}.${bucket}[${i}]`);
  return arr[i];
}

/**
 * @param {object} clones
 * @param {string} sourceFile
 * @param {string} rel
 */
function resolveRow(clones, sourceFile, rel) {
  if (sourceFile.includes("grammar-pools")) {
    return getRowAtPath(clones.grammar, "GRAMMAR_POOLS", rel);
  }
  if (sourceFile.includes("translation-pools")) {
    return getRowAtPath(clones.translation, "TRANSLATION_POOLS", rel);
  }
  if (sourceFile.includes("sentence-pools")) {
    return getRowAtPath(clones.sentence, "SENTENCE_POOLS", rel);
  }
  throw new Error(`Unknown English source file: ${sourceFile}`);
}

/**
 * @param {{ grammar: object, translation: object, sentence: object }} clones
 */
async function scanEnglishClones(clones) {
  const walkerMod = await import(new URL("../utils/question-metadata-qa/english-pool-walker.js", import.meta.url).href);
  const grammarMod = { GRAMMAR_POOLS: clones.grammar };
  const translationMod = { TRANSLATION_POOLS: clones.translation };
  const sentenceMod = { SENTENCE_POOLS: clones.sentence };
  const rows = walkerMod.collectAllEnglishRows(grammarMod, translationMod, sentenceMod);
  const scannerMod = await import(new URL("../utils/question-metadata-qa/question-metadata-scanner.js", import.meta.url).href);
  const { buildScanRecord } = scannerMod;
  let sum = 0;
  /** @type {Record<string, number>} */
  const issueTotals = {};
  let i = 0;
  for (const r of rows) {
    const rec = buildScanRecord(r.raw, r.sourceFile, r.objectPath, "english", i++);
    sum += rec.metadataCompletenessScore || 0;
    for (const iss of rec.issues || []) {
      issueTotals[iss] = (issueTotals[iss] || 0) + 1;
    }
  }
  return {
    rowCount: rows.length,
    avgCompletenessScore: rows.length ? Math.round((sum / rows.length) * 1000) / 1000 : 0,
    issueTotals,
    totalIssueOccurrences: Object.values(issueTotals).reduce((a, b) => a + b, 0),
  };
}

async function main() {
  const taxMod = await import(new URL("../utils/question-metadata-qa/question-metadata-taxonomy-english.js", import.meta.url).href);
  const { ENGLISH_SKILL_IDS, ENGLISH_SUBSKILL_ALLOWLIST_BY_SKILL } = taxMod;

  const grammarBank = await import(new URL("../data/english-questions/grammar-pools.js", import.meta.url).href);
  const translationBank = await import(new URL("../data/english-questions/translation-pools.js", import.meta.url).href);
  const sentenceBank = await import(new URL("../data/english-questions/sentence-pools.js", import.meta.url).href);

  const clones = {
    grammar: structuredClone(grammarBank.GRAMMAR_POOLS),
    translation: structuredClone(translationBank.TRANSLATION_POOLS),
    sentence: structuredClone(sentenceBank.SENTENCE_POOLS),
  };

  const statsBefore = await scanEnglishClones(clones);

  const sugRaw = readFileSync(suggestionsPath, "utf8");
  const payload = JSON.parse(sugRaw);
  const suggestions = payload.suggestions || [];

  /** @type {Record<string, number>} */
  const fieldCounts = {
    skillId: 0,
    subtype: 0,
    difficulty: 0,
    cognitiveLevel: 0,
    expectedErrorTypes: 0,
    prerequisiteSkillIds: 0,
  };
  let rowsTouched = 0;
  let prerequisiteSkillIdsApplied = 0;
  let prerequisiteSkillIdsSkipped = 0;
  /** @type {{ questionId?: string, reason: string }[]} */
  const prerequisiteSkipLog = [];

  for (const s of suggestions) {
    const suggested = s.suggested || {};
    const conf = s.confidence;
    const fullPath = s.objectPath;
    const { sourceFile, rel } = splitSuggestionPath(fullPath);

    /** @type {Record<string, unknown>} */
    const row = resolveRow(clones, sourceFile, rel);

    let touchedThis = false;

    if (suggested.difficulty) {
      row.difficulty = suggested.difficulty;
      fieldCounts.difficulty += 1;
      touchedThis = true;
    }
    if (suggested.cognitiveLevel) {
      row.cognitiveLevel = suggested.cognitiveLevel;
      fieldCounts.cognitiveLevel += 1;
      touchedThis = true;
    }
    if (Array.isArray(suggested.expectedErrorTypes) && suggested.expectedErrorTypes.length > 0) {
      row.expectedErrorTypes = [...suggested.expectedErrorTypes];
      fieldCounts.expectedErrorTypes += 1;
      touchedThis = true;
    }

    const diag = pickStr(row.diagnosticSkillId);
    const skillSug = pickStr(suggested.skillId);
    if (!diag && skillSug && (conf === "high" || conf === "medium")) {
      row.skillId = skillSug;
      fieldCounts.skillId += 1;
      touchedThis = true;
    }

    const subSug = pickStr(suggested.subskillId);
    const bucket = parsePoolBucketFromRel(rel);
    if (subSug && bucket && subSug === bucket && (conf === "high" || conf === "medium")) {
      const sk = effectiveSkillForTaxonomy(row);
      const allow = ENGLISH_SUBSKILL_ALLOWLIST_BY_SKILL[sk];
      if (allow && allow.has(subSug) && !pickStr(row.subtype)) {
        row.subtype = subSug;
        fieldCounts.subtype += 1;
        touchedThis = true;
      }
    }

    const prereqIds = Array.isArray(suggested.prerequisiteSkillIds) ? suggested.prerequisiteSkillIds.map(String) : [];
    if (prereqIds.length > 0) {
      let applyPrereq = false;
      let skipReason = "";
      if (conf !== "high" && conf !== "medium") {
        skipReason = "confidence_not_high_or_medium";
      } else {
        const invalid = prereqIds.filter((id) => !ENGLISH_SKILL_IDS.has(id));
        if (invalid.length > 0) skipReason = `invalid_prerequisite:${invalid.join(",")}`;
        else applyPrereq = true;
      }
      if (applyPrereq) {
        row.prerequisiteSkillIds = [...prereqIds];
        fieldCounts.prerequisiteSkillIds += 1;
        prerequisiteSkillIdsApplied += 1;
        touchedThis = true;
      } else {
        prerequisiteSkillIdsSkipped += 1;
        prerequisiteSkipLog.push({ questionId: s.questionId, reason: skipReason || "skipped" });
      }
    }

    if (touchedThis) rowsTouched += 1;
  }

  const statsAfter = await scanEnglishClones(clones);

  const header =
    "// Metadata enrichment (safe pass): difficulty, cognitiveLevel, expectedErrorTypes, skillId (when no diagnostic), " +
    "subtype (pool bucket when taxonomy-valid), prerequisiteSkillIds (gated). " +
    "See reports/question-metadata-qa/english-metadata-apply-report.json.\n";

  mkdirSync(reportDir, { recursive: true });
  writeFileSync(PATHS.grammar, `${header}export const GRAMMAR_POOLS = ${JSON.stringify(clones.grammar, null, 2)};\n`, "utf8");
  writeFileSync(
    PATHS.translation,
    `${header}export const TRANSLATION_POOLS = ${JSON.stringify(clones.translation, null, 2)};\n`,
    "utf8"
  );
  writeFileSync(PATHS.sentence, `${header}export const SENTENCE_POOLS = ${JSON.stringify(clones.sentence, null, 2)};\n`, "utf8");

  const report = {
    version: 1,
    generatedAt: new Date().toISOString(),
    sourceSuggestions: suggestionsPath,
    targets: [
      "data/english-questions/grammar-pools.js",
      "data/english-questions/translation-pools.js",
      "data/english-questions/sentence-pools.js",
    ],
    rowsScanned: suggestions.length,
    rowsTouched,
    fieldCounts,
    prerequisiteSkillIdsApplied,
    prerequisiteSkillIdsSkipped,
    prerequisiteSkipLog,
    scannerSnapshot: { before: statsBefore, after: statsAfter },
  };

  writeFileSync(reportJson, JSON.stringify(report, null, 2), "utf8");

  const md = [
    "# English pools — metadata apply (safe pass)",
    "",
    `- **Generated:** ${report.generatedAt}`,
    `- **Rows touched:** ${rowsTouched} / ${suggestions.length}`,
    `- **Avg completeness:** ${statsBefore.avgCompletenessScore} → ${statsAfter.avgCompletenessScore}`,
    "",
    "## Field counts",
    "",
    "```json",
    JSON.stringify(fieldCounts, null, 2),
    "```",
    "",
    "## Prerequisite skill ids",
    "",
    `- Applied: ${prerequisiteSkillIdsApplied}`,
    `- Skipped: ${prerequisiteSkillIdsSkipped}`,
    "",
  ].join("\n");

  writeFileSync(reportMd, md, "utf8");

  console.log("");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  English metadata apply-safe complete");
  console.log(`  Rows: ${suggestions.length} | Touched: ${rowsTouched}`);
  console.log(`  Avg completeness: ${statsBefore.avgCompletenessScore} → ${statsAfter.avgCompletenessScore}`);
  console.log(`  Report: ${reportJson}`);
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
