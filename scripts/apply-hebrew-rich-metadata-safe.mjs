#!/usr/bin/env node
/**
 * Apply safe Hebrew rich pool metadata from enrichment JSON.
 * npm run qa:hebrew-rich-metadata:apply-safe
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const bankPath = join(ROOT, "utils", "hebrew-rich-question-bank.js");
const suggestionsPath = join(ROOT, "reports", "question-metadata-qa", "hebrew-rich-enrichment-suggestions.json");
const reportDir = join(ROOT, "reports", "question-metadata-qa");
const reportJson = join(reportDir, "hebrew-rich-metadata-apply-report.json");
const reportMd = join(reportDir, "hebrew-rich-metadata-apply-report.md");

const EXPORT_MARKER = "export const HEBREW_RICH_POOL = ";

/**
 * @param {string} fullText
 * @param {string} marker — includes opening `[` via stringify later; marker ends before `[`
 */
function splitExportAndSuffix(fullText, marker) {
  const start = fullText.indexOf(marker);
  if (start === -1) throw new Error(`Missing marker: ${marker}`);
  const bracketStart = start + marker.length;
  if (fullText[bracketStart] !== "[") {
    throw new Error("Expected '[' immediately after HEBREW_RICH_POOL export marker");
  }
  let depth = 0;
  let i = bracketStart;
  for (; i < fullText.length; i++) {
    const c = fullText[i];
    if (c === "[") depth++;
    else if (c === "]") {
      depth--;
      if (depth === 0) {
        const suffix = fullText.slice(i + 1);
        return { prefix: fullText.slice(0, start), suffix };
      }
    }
  }
  throw new Error("Unclosed HEBREW_RICH_POOL array");
}

function parseIndexFromObjectPath(objectPath) {
  const m = String(objectPath || "").match(/HEBREW_RICH_POOL\[(\d+)\]/);
  return m ? parseInt(m[1], 10) : -1;
}

/**
 * @param {object[]} items
 */
async function scanHebrewRichStats(items) {
  const scannerMod = await import(new URL("../utils/question-metadata-qa/question-metadata-scanner.js", import.meta.url).href);
  const { buildScanRecord } = scannerMod;
  let sum = 0;
  /** @type {Record<string, number>} */
  const issueTotals = {};
  for (let i = 0; i < items.length; i++) {
    const rec = buildScanRecord(
      /** @type {Record<string, unknown>} */ (items[i]),
      "utils/hebrew-rich-question-bank.js",
      `HEBREW_RICH_POOL[${i}]`,
      "hebrew",
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
  const { HEBREW_RICH_SKILL_IDS } = taxMod;

  const fullText = readFileSync(bankPath, "utf8");
  const { prefix, suffix } = splitExportAndSuffix(fullText, EXPORT_MARKER);

  const bankMod = await import(new URL("../utils/hebrew-rich-question-bank.js", import.meta.url).href);
  const items = structuredClone(bankMod.HEBREW_RICH_POOL);

  const statsBefore = await scanHebrewRichStats(items);

  const sugRaw = readFileSync(suggestionsPath, "utf8");
  const payload = JSON.parse(sugRaw);
  const suggestions = payload.suggestions || [];

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
    throw new Error(`Bank length ${items.length} !== suggestions ${suggestions.length}`);
  }

  for (let si = 0; si < suggestions.length; si++) {
    const s = suggestions[si];
    const idx = parseIndexFromObjectPath(s.objectPath);
    if (idx < 0 || idx !== si) {
      skippedSuggestions.push({ index: si, questionId: s.questionId, reason: `objectPath_mismatch:${s.objectPath}` });
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
      let skipReason = "";

      if (conf !== "high" && conf !== "medium") {
        skipReason = "confidence_not_high_or_medium";
      } else {
        const invalid = prereqIds.filter((id) => !HEBREW_RICH_SKILL_IDS.has(id));
        if (invalid.length > 0) {
          skipReason = `invalid_prerequisite:${invalid.join(",")}`;
        } else if (conf === "high") {
          applyPrereq = true;
        } else if (conf === "medium") {
          const safeMediumEdge =
            prereqIds.length === 1 &&
            prereqIds[0] === "he_comp_explicit_detail" &&
            String(row.diagnosticSkillId || "") === "he_comp_inference_intro";
          if (safeMediumEdge) applyPrereq = true;
          else skipReason = "medium_prerequisite_skipped_non_standard_edge";
        } else {
          skipReason = "confidence_not_high_or_medium";
        }
      }

      if (applyPrereq) {
        row.prerequisiteSkillIds = [...prereqIds];
        fieldCounts.prerequisiteSkillIds += 1;
        prerequisiteSkillIdsApplied += 1;
        touchedThis = true;
      } else {
        prerequisiteSkillIdsSkipped += 1;
        prerequisiteSkipLog.push({ index: idx, questionId: s.questionId, reason: skipReason || "skipped" });
      }
    }

    if (touchedThis) rowsTouched += 1;
  }

  const statsAfter = await scanHebrewRichStats(items);

  const headerComment =
    "// Metadata enrichment (safe pass): difficulty, cognitiveLevel, expectedErrorTypes, prerequisiteSkillIds " +
    "(confidence/taxonomy-gated). See reports/question-metadata-qa/hebrew-rich-metadata-apply-report.json.\n";

  const outText = `${prefix}${headerComment}${EXPORT_MARKER}${JSON.stringify(items, null, 2)}${suffix}`;
  mkdirSync(reportDir, { recursive: true });
  writeFileSync(bankPath, outText, "utf8");

  const report = {
    version: 1,
    generatedAt: new Date().toISOString(),
    sourceSuggestions: suggestionsPath,
    targetBank: "utils/hebrew-rich-question-bank.js",
    rowsScanned: items.length,
    rowsTouched,
    fieldCounts,
    prerequisiteSkillIdsApplied,
    prerequisiteSkillIdsSkipped,
    prerequisiteSkipLog,
    skippedSuggestions,
    scannerSnapshot: { beforeApply: statsBefore, afterApply: statsAfter },
    intentionalStudentFacingChanges: {
      questionText: false,
      answers: false,
      options: false,
      note: "Apply script only adds metadata keys from enrichment suggestions.",
    },
  };

  writeFileSync(reportJson, JSON.stringify(report, null, 2), "utf8");

  const md = [
    "# Hebrew rich pool — safe apply report",
    "",
    `_Generated: ${report.generatedAt}_`,
    "",
    `- **Rows scanned:** ${report.rowsScanned}`,
    `- **Rows touched:** ${report.rowsTouched}`,
    `- **Prerequisite applied / skipped:** ${prerequisiteSkillIdsApplied} / ${prerequisiteSkillIdsSkipped}`,
    "",
    "## Prerequisite skips",
    "",
    prerequisiteSkipLog.length
      ? prerequisiteSkipLog.map((x) => `- ${x.index}: ${x.reason}`).join("\n")
      : "_None._",
    "",
  ].join("\n");

  writeFileSync(reportMd, md, "utf8");

  console.log(JSON.stringify(report, null, 2));
  console.log(`Wrote ${bankPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
