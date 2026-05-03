#!/usr/bin/env node
/**
 * Apply safe Moledet/geography static bank metadata (g1–g6).
 * npm run qa:geography-metadata:apply-safe
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const suggestionsPath = join(ROOT, "reports", "question-metadata-qa", "geography-enrichment-suggestions.json");
const reportDir = join(ROOT, "reports", "question-metadata-qa");
const reportJson = join(reportDir, "geography-metadata-apply-report.json");
const reportMd = join(reportDir, "geography-metadata-apply-report.md");

const REL_PATHS = [
  "data/geography-questions/g1.js",
  "data/geography-questions/g2.js",
  "data/geography-questions/g3.js",
  "data/geography-questions/g4.js",
  "data/geography-questions/g5.js",
  "data/geography-questions/g6.js",
];

function exportOrderForFile(relPath) {
  const m = relPath.match(/g(\d)\.js$/i);
  const g = m ? m[1] : "1";
  return [`G${g}_EASY_QUESTIONS`, `G${g}_MEDIUM_QUESTIONS`, `G${g}_HARD_QUESTIONS`];
}

function splitSuggestionPath(fullObjectPath) {
  const idx = fullObjectPath.indexOf("::");
  if (idx === -1) throw new Error(`Bad objectPath (missing ::): ${fullObjectPath}`);
  return {
    sourceFile: fullObjectPath.slice(0, idx),
    rel: fullObjectPath.slice(idx + 2),
  };
}

function getRowAtGeoPath(modPlain, objectPath) {
  const m = String(objectPath).match(/^([A-Z0-9_]+)\.([a-zA-Z0-9_]+)\[(\d+)\]$/);
  if (!m) return null;
  const root = modPlain[m[1]];
  if (!root || typeof root !== "object") return null;
  const arr = root[m[2]];
  if (!Array.isArray(arr)) return null;
  return arr[Number(m[3])] ?? null;
}

function extractSuffixAfterHardExport(fullText, gradeDigit) {
  const patterns = [`export const G${gradeDigit}_HARD_QUESTIONS`, `const G${gradeDigit}_HARD_QUESTIONS`];
  let start = -1;
  for (const p of patterns) {
    const i = fullText.indexOf(p);
    if (i >= 0) {
      start = i;
      break;
    }
  }
  if (start < 0) return "";
  const eq = fullText.indexOf("=", start);
  const braceStart = fullText.indexOf("{", eq);
  if (braceStart < 0) return "";
  let depth = 0;
  for (let i = braceStart; i < fullText.length; i += 1) {
    const c = fullText[i];
    if (c === "{") depth += 1;
    else if (c === "}") {
      depth -= 1;
      if (depth === 0) {
        let j = i + 1;
        while (j < fullText.length && /\s/.test(fullText[j])) j += 1;
        if (fullText[j] === ";") j += 1;
        return fullText.slice(j);
      }
    }
  }
  return "";
}

function extractBannerAndSuffix(fullText, relPath) {
  const m = relPath.match(/g(\d)\.js$/i);
  const gradeDigit = m ? m[1] : "1";
  const easyMarker = `export const G${gradeDigit}_EASY_QUESTIONS`;
  const easyIdx = fullText.indexOf(easyMarker);
  const banner = easyIdx >= 0 ? fullText.slice(0, easyIdx) : "";
  const suffix = extractSuffixAfterHardExport(fullText, gradeDigit);
  return { banner, suffix };
}

function serializeGeoModule(relPath, clonePlain) {
  const order = exportOrderForFile(relPath);
  let body = "";
  for (const name of order) {
    if (clonePlain[name] !== undefined) {
      body += `export const ${name} = ${JSON.stringify(clonePlain[name], null, 2)};\n\n`;
    }
  }
  return body;
}

async function scanGeoCompleteness(clonesByRel) {
  const scannerMod = await import(new URL("../utils/question-metadata-qa/question-metadata-scanner.js", import.meta.url).href);
  const { buildScanRecord } = scannerMod;
  let sum = 0;
  let n = 0;
  /** @type {Record<string, number>} */
  const issueTotals = {};
  for (const rel of REL_PATHS) {
    const plain = clonesByRel[rel];
    let idx = 0;
    for (const exportName of exportOrderForFile(rel)) {
      const block = plain[exportName];
      if (!block || typeof block !== "object") continue;
      for (const cat of Object.keys(block)) {
        const arr = block[cat];
        if (!Array.isArray(arr)) continue;
        for (let i = 0; i < arr.length; i += 1) {
          const raw = arr[i];
          if (!raw || typeof raw !== "object") continue;
          const objectPath = `${exportName}.${cat}[${i}]`;
          const rec = buildScanRecord(
            /** @type {Record<string, unknown>} */ (raw),
            rel,
            objectPath,
            "moledet-geography",
            idx++
          );
          sum += rec.metadataCompletenessScore || 0;
          n += 1;
          for (const iss of rec.issues || []) {
            issueTotals[iss] = (issueTotals[iss] || 0) + 1;
          }
        }
      }
    }
  }
  return {
    rows: n,
    avgCompletenessScore: n ? Math.round((sum / n) * 1000) / 1000 : 0,
    issueTotals,
    totalIssueOccurrences: Object.values(issueTotals).reduce((a, b) => a + b, 0),
  };
}

async function main() {
  const taxMod = await import(new URL("../utils/question-metadata-qa/question-metadata-taxonomy-geography.js", import.meta.url).href);
  const { MOLEDET_GEOGRAPHY_SKILL_IDS, MOLEDET_GEOGRAPHY_SUBSKILL_ALLOWLIST_BY_SKILL } = taxMod;

  /** @type {Record<string, Record<string, unknown>>} */
  const clonesByRel = {};
  for (const rel of REL_PATHS) {
    const href = pathToFileURL(join(ROOT, rel)).href;
    const mod = await import(`${href}?t=${Date.now()}`);
    /** @type {Record<string, unknown>} */
    const plain = {};
    for (const k of Object.keys(mod)) {
      if (k === "default" || typeof mod[k] === "function") continue;
      plain[k] = structuredClone(mod[k]);
    }
    clonesByRel[rel] = plain;
  }

  const statsBefore = await scanGeoCompleteness(clonesByRel);

  const sugRaw = readFileSync(suggestionsPath, "utf8");
  const payload = JSON.parse(sugRaw);
  const suggestions = payload.suggestions || [];

  const fieldCounts = {
    skillId: 0,
    subskillId: 0,
    difficulty: 0,
    cognitiveLevel: 0,
    expectedErrorTypes: 0,
    prerequisiteSkillIds: 0,
  };
  let rowsTouched = 0;
  let prerequisiteSkillIdsApplied = 0;
  let prerequisiteSkillIdsSkipped = 0;
  /** @type {{ objectPath?: string, reason: string }[]} */
  const prerequisiteSkipLog = [];
  /** @type {{ objectPath?: string, reason: string }[]} */
  const skippedSuggestions = [];

  for (const s of suggestions) {
    const conf = s.confidence;
    const fullPath = s.objectPath;
    const { sourceFile, rel } = splitSuggestionPath(fullPath);
    const suggested = s.suggested || {};
    const clone = clonesByRel[sourceFile];
    if (!clone) {
      skippedSuggestions.push({ objectPath: fullPath, reason: `missing_file:${sourceFile}` });
      continue;
    }

    const row = getRowAtGeoPath(clone, rel);
    if (!row || typeof row !== "object") {
      skippedSuggestions.push({ objectPath: fullPath, reason: "row_not_found" });
      continue;
    }

    if (conf !== "high") {
      skippedSuggestions.push({ objectPath: fullPath, reason: `confidence_${conf}` });
      continue;
    }

    let touchedThis = false;

    const sk = String(suggested.skillId || "").trim();
    const sub = String(suggested.subskillId || "").trim();
    if (sk && MOLEDET_GEOGRAPHY_SKILL_IDS.has(sk)) {
      const allow = MOLEDET_GEOGRAPHY_SUBSKILL_ALLOWLIST_BY_SKILL[sk];
      if (allow && sub && allow.has(sub)) {
        /** @type {Record<string, unknown>} */
        (row).skillId = sk;
        /** @type {Record<string, unknown>} */
        (row).subtype = sub;
        fieldCounts.skillId += 1;
        fieldCounts.subskillId += 1;
        touchedThis = true;
      }
    }

    if (suggested.difficulty) {
      /** @type {Record<string, unknown>} */
      (row).difficulty = suggested.difficulty;
      fieldCounts.difficulty += 1;
      touchedThis = true;
    }
    if (suggested.cognitiveLevel) {
      /** @type {Record<string, unknown>} */
      (row).cognitiveLevel = suggested.cognitiveLevel;
      fieldCounts.cognitiveLevel += 1;
      touchedThis = true;
    }
    if (Array.isArray(suggested.expectedErrorTypes) && suggested.expectedErrorTypes.length > 0) {
      /** @type {Record<string, unknown>} */
      (row).expectedErrorTypes = [...suggested.expectedErrorTypes];
      fieldCounts.expectedErrorTypes += 1;
      touchedThis = true;
    }

    const prereqIds = Array.isArray(suggested.prerequisiteSkillIds) ? suggested.prerequisiteSkillIds.map(String) : [];
    if (prereqIds.length > 0) {
      prerequisiteSkillIdsSkipped += 1;
      prerequisiteSkipLog.push({
        objectPath: fullPath,
        reason: "moledet_geography_policy_skip_automated_prereq",
      });
    }

    if (touchedThis) rowsTouched += 1;
  }

  const statsAfter = await scanGeoCompleteness(clonesByRel);

  const META =
    "// Metadata enrichment (safe pass): skillId, subtype (grade), difficulty, cognitiveLevel, expectedErrorTypes. " +
    "See reports/question-metadata-qa/geography-metadata-apply-report.json.\n";

  mkdirSync(reportDir, { recursive: true });

  for (const rel of REL_PATHS) {
    const abs = join(ROOT, rel);
    const original = readFileSync(abs, "utf8");
    const { banner, suffix } = extractBannerAndSuffix(original, rel);
    const body = serializeGeoModule(rel, clonesByRel[rel]);
    const tailOut = suffix.trim() ? (suffix.endsWith("\n") ? suffix : `${suffix}\n`) : "";
    writeFileSync(abs, `${banner}${META}${body}${tailOut}`, "utf8");
  }

  const report = {
    version: 1,
    generatedAt: new Date().toISOString(),
    sourceSuggestions: suggestionsPath,
    targets: REL_PATHS,
    rowsScanned: suggestions.length,
    rowsTouched,
    fieldCounts,
    prerequisiteSkillIdsApplied,
    prerequisiteSkillIdsSkipped,
    prerequisiteSkipLog,
    skippedSuggestions,
    scannerSnapshot: { before: statsBefore, after: statsAfter },
  };

  writeFileSync(reportJson, JSON.stringify(report, null, 2), "utf8");

  const md = [
    "# Moledet / geography — metadata apply (safe pass)",
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
  console.log("  Moledet/geography metadata apply-safe complete");
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
