#!/usr/bin/env node
/**
 * Post-apply verification: geometry conceptual bank + optional git HEAD content diff.
 * npm run qa:geometry-metadata:verify
 */
import { execSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "reports", "question-metadata-qa");
const OUT_JSON = join(OUT_DIR, "geometry-post-apply-verification.json");
const OUT_MD = join(OUT_DIR, "geometry-post-apply-verification.md");

const EXPECTED_TOTAL = 52;

/**
 * @returns {Promise<object[]|null>}
 */
async function loadGeometryConceptualFromGitHead() {
  try {
    execSync("git rev-parse HEAD", { cwd: ROOT, stdio: "pipe" });
  } catch {
    return null;
  }
  const dir = mkdtempSync(join(tmpdir(), "geo-git-head-"));
  try {
    const u = join(dir, "utils");
    mkdirSync(u, { recursive: true });
    const blobs = [
      ["geometry-conceptual-bank.js", "utils/geometry-conceptual-bank.js"],
      ["grade-gating.js", "utils/grade-gating.js"],
      ["diagnostic-question-contract.js", "utils/diagnostic-question-contract.js"],
    ];
    for (const [fileName, gitPath] of blobs) {
      const txt = execSync(`git show HEAD:${gitPath}`, {
        cwd: ROOT,
        encoding: "utf8",
        maxBuffer: 32 * 1024 * 1024,
      });
      writeFileSync(join(u, fileName), txt, "utf8");
    }
    const href = pathToFileURL(join(u, "geometry-conceptual-bank.js")).href;
    const mod = await import(`${href}?t=${Date.now()}`);
    return mod.GEOMETRY_CONCEPTUAL_ITEMS || null;
  } catch {
    return null;
  } finally {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
}

/**
 * @param {unknown} row
 */
function contentFingerprint(row) {
  if (!row || typeof row !== "object") return null;
  const opts = Array.isArray(row.options) ? row.options.map((x) => String(x)) : null;
  return {
    question: String(row.question ?? ""),
    options: opts,
    correct: row.correct !== undefined && row.correct !== null ? String(row.correct) : "",
    kind: row.kind ?? null,
  };
}

async function main() {
  const bankMod = await import(new URL("../utils/geometry-conceptual-bank.js", import.meta.url).href);
  const items = bankMod.GEOMETRY_CONCEPTUAL_ITEMS;

  const scannerMod = await import(new URL("../utils/question-metadata-qa/question-metadata-scanner.js", import.meta.url).href);
  const { buildScanRecord } = scannerMod;

  const taxMod = await import(new URL("../utils/question-metadata-qa/question-metadata-taxonomy.js", import.meta.url).href);
  const { ALL_VALID_DIFFICULTY, ALL_VALID_COGNITIVE_LEVELS, GEOMETRY_SKILL_IDS, EXTENDED_EXPECTED_ERROR_TYPES } = taxMod;

  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const warnings = [];

  const n = items.length;
  if (n !== EXPECTED_TOTAL) {
    errors.push(`Expected ${EXPECTED_TOTAL} GEOMETRY_CONCEPTUAL_ITEMS, got ${n}`);
  }

  /** @type {Set<string>} */
  const questionTexts = new Set();
  /** @type {string[]} */
  const dupQuestions = [];

  let metadataCoverage = {
    difficulty: 0,
    cognitiveLevel: 0,
    expectedErrorTypes: 0,
    prerequisiteRowsValid: 0,
  };

  let completenessSum = 0;

  let idx = 0;
  for (const row of items) {
    const qtext = String(row.question ?? "").trim();
    if (!qtext) errors.push(`Row #${idx}: empty question`);
    else {
      if (questionTexts.has(qtext)) dupQuestions.push(`#${idx}`);
      questionTexts.add(qtext);
    }

    const opts = row.options;
    if (!Array.isArray(opts) || opts.length === 0) {
      errors.push(`Row #${idx}: missing or empty options`);
    } else if (opts.some((o) => String(o).trim() === "")) {
      errors.push(`Row #${idx}: empty option string`);
    }

    if (row.correct === undefined || row.correct === null || String(row.correct).trim() === "") {
      errors.push(`Row #${idx}: missing correct`);
    }

    const diff = String(row.difficulty || "").toLowerCase();
    if (!diff || !ALL_VALID_DIFFICULTY.has(diff)) {
      errors.push(`Row #${idx}: missing or invalid difficulty`);
    } else metadataCoverage.difficulty += 1;

    const cog = String(row.cognitiveLevel || "").toLowerCase();
    if (!cog || !ALL_VALID_COGNITIVE_LEVELS.has(cog)) {
      errors.push(`Row #${idx}: missing or invalid cognitiveLevel`);
    } else metadataCoverage.cognitiveLevel += 1;

    const et = row.expectedErrorTypes;
    if (!Array.isArray(et) || et.length === 0) {
      errors.push(`Row #${idx}: missing or empty expectedErrorTypes`);
    } else {
      metadataCoverage.expectedErrorTypes += 1;
      const bad = et.filter((t) => !EXTENDED_EXPECTED_ERROR_TYPES.has(String(t).trim()));
      if (bad.length) errors.push(`Row #${idx}: unknown expected error types: ${bad.join(",")}`);
    }

    const pr = row.prerequisiteSkillIds;
    if (pr === undefined || pr === null || (Array.isArray(pr) && pr.length === 0)) {
      metadataCoverage.prerequisiteRowsValid += 1;
    } else if (!Array.isArray(pr)) {
      errors.push(`Row #${idx}: prerequisiteSkillIds must be an array when present`);
    } else {
      const invalid = pr.filter((id) => !GEOMETRY_SKILL_IDS.has(String(id).trim()));
      if (invalid.length) errors.push(`Row #${idx}: invalid prerequisiteSkillIds: ${invalid.join(",")}`);
      else metadataCoverage.prerequisiteRowsValid += 1;
    }

    const rec = buildScanRecord(
      /** @type {Record<string, unknown>} */ (row),
      "utils/geometry-conceptual-bank.js",
      `GEOMETRY_CONCEPTUAL_ITEMS[${idx}]`,
      "geometry",
      idx
    );
    completenessSum += rec.metadataCompletenessScore || 0;

    const hardIssues = rec.issues.filter(
      (c) => !["missing_explanation", "implicit_id_only", "missing_prerequisite_skill_ids"].includes(c)
    );
    if (hardIssues.length > 0) {
      warnings.push(`Row #${idx}: scanner issues: ${hardIssues.join(";")}`);
    }

    idx += 1;
  }

  const avgScannerCompletenessScore = n ? Math.round((completenessSum / n) * 1000) / 1000 : 0;

  if (dupQuestions.length) {
    warnings.push(`Duplicate question stems (informational): ${dupQuestions.length} rows`);
  }

  /** Git baseline */
  let baselineNote =
    "Comparison loads `git show HEAD` snapshots of utils/geometry-conceptual-bank.js plus required relative imports into a temp folder.";
  /** @type {{ index: number, field: string, before: unknown, after: unknown }[]} */
  const contentDiffs = [];
  let gitBaselineAvailable = false;

  const baselineItems = await loadGeometryConceptualFromGitHead();

  if (baselineItems && Array.isArray(baselineItems)) {
    gitBaselineAvailable = true;
    if (baselineItems.length === n) {
      for (let i = 0; i < n; i++) {
        const cur = items[i];
        const prev = baselineItems[i];
        const a = contentFingerprint(prev);
        const b = contentFingerprint(cur);
        if (!a || !b) continue;
        if (a.question !== b.question) contentDiffs.push({ index: i, field: "question", before: a.question, after: b.question });
        if (JSON.stringify(a.options) !== JSON.stringify(b.options)) {
          contentDiffs.push({ index: i, field: "options", before: a.options, after: b.options });
        }
        if (a.correct !== b.correct) contentDiffs.push({ index: i, field: "correct", before: a.correct, after: b.correct });
        if (a.kind !== b.kind) contentDiffs.push({ index: i, field: "kind", before: a.kind, after: b.kind });
      }
    } else {
      baselineNote += ` HEAD baseline length ${baselineItems.length} vs current ${n} — skipped row-wise diff.`;
    }
  } else {
    baselineNote += " Could not import HEAD geometry module tree — structural checks still apply.";
  }

  const ok = errors.length === 0;
  const payload = {
    version: 1,
    generatedAt: new Date().toISOString(),
    ok,
    expectedTotal: EXPECTED_TOTAL,
    actualTotal: n,
    errors,
    warnings,
    metadataCoverage: {
      ...metadataCoverage,
      avgScannerCompletenessScore,
      pctDifficulty: n ? Math.round((metadataCoverage.difficulty / n) * 1000) / 10 : 0,
      pctCognitive: n ? Math.round((metadataCoverage.cognitiveLevel / n) * 1000) / 10 : 0,
      pctExpectedErrors: n ? Math.round((metadataCoverage.expectedErrorTypes / n) * 1000) / 10 : 0,
      pctPrerequisiteRowsValid: n ? Math.round((metadataCoverage.prerequisiteRowsValid / n) * 1000) / 10 : 0,
    },
    gitComparison: {
      baselineNote,
      gitBaselineAvailable,
      studentFacingContentDiffs: contentDiffs,
      contentDiffCount: contentDiffs.length,
    },
  };

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_JSON, JSON.stringify(payload, null, 2), "utf8");

  const md = [
    "# Geometry metadata — post-apply verification",
    "",
    `_Generated: ${payload.generatedAt}_`,
    "",
    "## Result",
    "",
    ok ? "**PASS** — no blocking integrity errors." : "**FAIL** — see errors below.",
    "",
    "## Counts",
    "",
    `- **GEOMETRY_CONCEPTUAL_ITEMS:** ${n} (expected ${EXPECTED_TOTAL})`,
    "",
    "## Metadata coverage",
    "",
    "| Check | Rows | % |",
    "| --- | ---: | ---: |",
    `| difficulty valid | ${metadataCoverage.difficulty} | ${payload.metadataCoverage.pctDifficulty} |`,
    `| cognitiveLevel valid | ${metadataCoverage.cognitiveLevel} | ${payload.metadataCoverage.pctCognitive} |`,
    `| expectedErrorTypes non-empty | ${metadataCoverage.expectedErrorTypes} | ${payload.metadataCoverage.pctExpectedErrors} |`,
    `| prerequisiteSkillIds valid (or empty) | ${metadataCoverage.prerequisiteRowsValid} | ${payload.metadataCoverage.pctPrerequisiteRowsValid} |`,
    `| Avg scanner completeness score | ${payload.metadataCoverage.avgScannerCompletenessScore} | — |`,
    "",
    "## Git baseline (student-facing)",
    "",
    baselineNote,
    "",
    `- **Git HEAD module loaded:** ${gitBaselineAvailable ? "yes" : "no"}`,
    `- **Content diffs (question / options / correct / kind):** ${contentDiffs.length}`,
    "",
    contentDiffs.length
      ? ["| index | field |", "| --- | --- |", ...contentDiffs.slice(0, 40).map((d) => `| ${d.index} | ${d.field} |`)].join("\n")
      : "_None._",
    "",
    "## Errors",
    "",
    errors.length ? errors.map((e) => `- ${e}`).join("\n") : "_None._",
    "",
    "## Warnings",
    "",
    warnings.length ? warnings.map((w) => `- ${w}`).join("\n") : "_None._",
    "",
    "## Outputs",
    "",
    "- `reports/question-metadata-qa/geometry-post-apply-verification.json`",
    "",
  ].join("\n");

  writeFileSync(OUT_MD, md, "utf8");

  console.log("");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`  Geometry post-apply verification: ${ok ? "PASS" : "FAIL"}`);
  console.log(`  Rows: ${n} | Content diffs vs HEAD: ${contentDiffs.length} | Errors: ${errors.length}`);
  console.log(`  Report: ${OUT_JSON}`);
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("");

  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
