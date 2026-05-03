#!/usr/bin/env node
/**
 * Apply safe geometry conceptual metadata from enrichment JSON only.
 * Does not change question text, options, correct answers, or row count.
 *
 * npm run qa:geometry-metadata:apply-safe
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const geometryPath = join(ROOT, "utils", "geometry-conceptual-bank.js");
const suggestionsPath = join(ROOT, "reports", "question-metadata-qa", "geometry-enrichment-suggestions.json");
const reportDir = join(ROOT, "reports", "question-metadata-qa");
const reportJson = join(reportDir, "geometry-metadata-apply-report.json");
const reportMd = join(reportDir, "geometry-metadata-apply-report.md");

const EXPORT_MARKER = "export const GEOMETRY_CONCEPTUAL_ITEMS = ";

/**
 * @param {string} objectPath
 */
function parseIndexFromObjectPath(objectPath) {
  const m = String(objectPath || "").match(/GEOMETRY_CONCEPTUAL_ITEMS\[(\d+)\]/);
  return m ? parseInt(m[1], 10) : -1;
}

/**
 * @param {object[]} items
 */
async function scanGeometryStats(items) {
  const scannerMod = await import(new URL("../utils/question-metadata-qa/question-metadata-scanner.js", import.meta.url).href);
  const { buildScanRecord } = scannerMod;
  let sum = 0;
  /** @type {Record<string, number>} */
  const issueTotals = {};
  for (let i = 0; i < items.length; i++) {
    const rec = buildScanRecord(
      /** @type {Record<string, unknown>} */ (items[i]),
      "utils/geometry-conceptual-bank.js",
      `GEOMETRY_CONCEPTUAL_ITEMS[${i}]`,
      "geometry",
      i
    );
    sum += rec.metadataCompletenessScore || 0;
    for (const iss of rec.issues || []) {
      issueTotals[iss] = (issueTotals[iss] || 0) + 1;
    }
  }
  return {
    avgCompletenessScore: items.length ? Math.round((sum / items.length) * 1000) / 1000 : 0,
    issueTotals,
    totalIssueOccurrences: Object.values(issueTotals).reduce((a, b) => a + b, 0),
  };
}

async function main() {
  const taxMod = await import(new URL("../utils/question-metadata-qa/question-metadata-taxonomy.js", import.meta.url).href);
  const { GEOMETRY_SKILL_IDS } = taxMod;

  const fullText = readFileSync(geometryPath, "utf8");
  const exportPos = fullText.indexOf(EXPORT_MARKER);
  if (exportPos === -1) {
    throw new Error(`Missing ${EXPORT_MARKER} in geometry-conceptual-bank.js`);
  }
  const prefix = fullText.slice(0, exportPos);

  const bankMod = await import(new URL("../utils/geometry-conceptual-bank.js", import.meta.url).href);
  const items = structuredClone(bankMod.GEOMETRY_CONCEPTUAL_ITEMS);

  const statsBefore = await scanGeometryStats(items);

  const sugRaw = readFileSync(suggestionsPath, "utf8");
  const payload = JSON.parse(sugRaw);
  const suggestions = payload.suggestions || [];

  /** @type {Record<string, number>} */
  const fieldCounts = {
    difficulty: 0,
    cognitiveLevel: 0,
    expectedErrorTypes: 0,
    prerequisiteSkillIds: 0,
  };
  let rowsTouched = 0;
  let prerequisiteSkillIdsApplied = 0;
  let prerequisiteSkillIdsSkipped = 0;
  /** @type {{ index: number, questionId?: string, reason: string }[]} */
  const prerequisiteSkipLog = [];
  /** @type {{ index: number, questionId?: string, reason: string }[]} */
  const skippedSuggestions = [];

  if (items.length !== suggestions.length) {
    throw new Error(`Bank length ${items.length} !== suggestions length ${suggestions.length}`);
  }

  for (let si = 0; si < suggestions.length; si++) {
    const s = suggestions[si];
    const idx = parseIndexFromObjectPath(s.objectPath);
    if (idx < 0 || idx !== si) {
      skippedSuggestions.push({ index: si, questionId: s.questionId, reason: `objectPath_index_mismatch_or_parse_fail:${s.objectPath}` });
      continue;
    }

    const suggested = s.suggested || {};
    const conf = s.confidence;

    const row = items[idx];
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

    const prereqIds = Array.isArray(suggested.prerequisiteSkillIds) ? suggested.prerequisiteSkillIds.map(String) : [];

    if (prereqIds.length > 0) {
      let applyPrereq = false;
      /** @type {string} */
      let skipReason = "";

      if (conf !== "high" && conf !== "medium") {
        skipReason = "confidence_not_high_or_medium";
      } else {
        const invalid = prereqIds.filter((id) => !GEOMETRY_SKILL_IDS.has(id));
        if (invalid.length > 0) {
          skipReason = `taxonomy_invalid_prerequisite:${invalid.join(",")}`;
        } else {
          applyPrereq = true;
        }
      }

      if (applyPrereq) {
        row.prerequisiteSkillIds = [...prereqIds];
        fieldCounts.prerequisiteSkillIds += 1;
        prerequisiteSkillIdsApplied += 1;
        touchedThis = true;
      } else {
        prerequisiteSkillIdsSkipped += 1;
        prerequisiteSkipLog.push({ index: idx, questionId: s.questionId, reason: skipReason || "unknown" });
      }
    }

    if (touchedThis) rowsTouched += 1;
  }

  const statsAfter = await scanGeometryStats(items);

  const headerComment =
    "// Metadata enrichment (safe pass): difficulty, cognitiveLevel, expectedErrorTypes, prerequisiteSkillIds " +
    "(confidence/taxonomy-gated). See reports/question-metadata-qa/geometry-metadata-apply-report.json.\n";

  const outText = `${prefix}${headerComment}${EXPORT_MARKER}${JSON.stringify(items, null, 2)};\n`;
  mkdirSync(reportDir, { recursive: true });
  writeFileSync(geometryPath, outText, "utf8");

  const report = {
    version: 1,
    generatedAt: new Date().toISOString(),
    sourceSuggestions: suggestionsPath,
    targetBank: "utils/geometry-conceptual-bank.js",
    rowsScanned: items.length,
    rowsTouched,
    fieldCounts,
    prerequisiteSkillIdsApplied,
    prerequisiteSkillIdsSkipped,
    prerequisiteSkipLog,
    skippedSuggestions,
    scannerSnapshot: {
      beforeApply: statsBefore,
      afterApply: statsAfter,
    },
    intentionalStudentFacingChanges: {
      questionText: false,
      options: false,
      correctAnswers: false,
      note: "Apply script only adds/updates metadata keys from enrichment suggestions; stems/options/correct fields were not programmatically modified.",
    },
    taxonomyNotes: {
      prerequisiteIdsValidatedAgainst: "GEOMETRY_SKILL_IDS",
      expectedErrorTypesValidatedAgainst: "EXTENDED_EXPECTED_ERROR_TYPES (via suggestions generator)",
    },
  };

  writeFileSync(reportJson, JSON.stringify(report, null, 2), "utf8");

  const md = [
    "# Geometry metadata — safe apply report",
    "",
    `_Generated: ${report.generatedAt}_`,
    "",
    "## Summary",
    "",
    `- **Rows scanned:** ${report.rowsScanned}`,
    `- **Rows touched:** ${report.rowsTouched}`,
    `- **Fields applied (counts):** difficulty ${fieldCounts.difficulty}, cognitiveLevel ${fieldCounts.cognitiveLevel}, expectedErrorTypes ${fieldCounts.expectedErrorTypes}, prerequisiteSkillIds ${fieldCounts.prerequisiteSkillIds}`,
    `- **Prerequisite skill ids applied:** ${prerequisiteSkillIdsApplied}`,
    `- **Prerequisite skill ids skipped:** ${prerequisiteSkillIdsSkipped}`,
    "",
    "## Scanner completeness (avg score)",
    "",
    `- **Before:** ${statsBefore.avgCompletenessScore}`,
    `- **After:** ${statsAfter.avgCompletenessScore}`,
    "",
    "## Student-facing fields",
    "",
    `- **Question text / options / answers intentionally changed:** ${report.intentionalStudentFacingChanges.questionText ? "yes" : "no"} (programmatic guarantee: metadata-only patch).`,
    "",
    "## Prerequisite skips",
    "",
    prerequisiteSkipLog.length
      ? prerequisiteSkipLog.map((x) => `- index ${x.index} (${x.questionId || "?"}): ${x.reason}`).join("\n")
      : "_None._",
    "",
    "## Other skipped suggestions",
    "",
    skippedSuggestions.length ? skippedSuggestions.map((x) => `- ${JSON.stringify(x)}`).join("\n") : "_None._",
    "",
    "## Outputs",
    "",
    "- `reports/question-metadata-qa/geometry-metadata-apply-report.json`",
    "",
  ].join("\n");

  writeFileSync(reportMd, md, "utf8");

  console.log(JSON.stringify(report, null, 2));
  console.log(`Wrote ${geometryPath}, ${reportJson}, ${reportMd}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
