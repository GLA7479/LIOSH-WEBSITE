#!/usr/bin/env node
/**
 * Post-apply verification for Hebrew rich pool.
 * npm run qa:hebrew-rich-metadata:verify
 */
import { execSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "reports", "question-metadata-qa");
const OUT_JSON = join(OUT_DIR, "hebrew-rich-post-apply-verification.json");
const OUT_MD = join(OUT_DIR, "hebrew-rich-post-apply-verification.md");

const EXPECTED_TOTAL = 54;

/**
 * @returns {Promise<object[]|null>}
 */
async function loadHebrewRichPoolFromGitHead() {
  try {
    execSync("git rev-parse HEAD", { cwd: ROOT, stdio: "pipe" });
  } catch {
    return null;
  }
  const dir = mkdtempSync(join(tmpdir(), "he-rich-git-head-"));
  try {
    const u = join(dir, "utils");
    mkdirSync(u, { recursive: true });
    const blobs = [
      ["hebrew-rich-question-bank.js", "utils/hebrew-rich-question-bank.js"],
      ["grade-gating.js", "utils/grade-gating.js"],
    ];
    for (const [fileName, gitPath] of blobs) {
      const txt = execSync(`git show HEAD:${gitPath}`, {
        cwd: ROOT,
        encoding: "utf8",
        maxBuffer: 32 * 1024 * 1024,
      });
      writeFileSync(join(u, fileName), txt, "utf8");
    }
    const href = pathToFileURL(join(u, "hebrew-rich-question-bank.js")).href;
    const mod = await import(`${href}?t=${Date.now()}`);
    return mod.HEBREW_RICH_POOL || null;
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
  const answers = Array.isArray(row.answers) ? row.answers.map((x) => String(x)) : null;
  const opts = Array.isArray(row.options) ? row.options.map((x) => String(x)) : null;
  return {
    question: String(row.question ?? row.stem ?? ""),
    answers,
    options: opts,
    correct: row.correct !== undefined && row.correct !== null ? Number(row.correct) : null,
    correctIndex: row.correctIndex !== undefined ? Number(row.correctIndex) : null,
    kind: row.kind ?? row.type ?? null,
  };
}

async function main() {
  const bankMod = await import(new URL("../utils/hebrew-rich-question-bank.js", import.meta.url).href);
  const items = bankMod.HEBREW_RICH_POOL;

  const scannerMod = await import(new URL("../utils/question-metadata-qa/question-metadata-scanner.js", import.meta.url).href);
  const { buildScanRecord } = scannerMod;

  const taxMod = await import(new URL("../utils/question-metadata-qa/question-metadata-taxonomy.js", import.meta.url).href);
  const { ALL_VALID_DIFFICULTY, ALL_VALID_COGNITIVE_LEVELS, HEBREW_RICH_SKILL_IDS, EXTENDED_EXPECTED_ERROR_TYPES } = taxMod;

  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const warnings = [];

  const n = items.length;
  if (n !== EXPECTED_TOTAL) {
    errors.push(`Expected ${EXPECTED_TOTAL} HEBREW_RICH_POOL rows, got ${n}`);
  }

  /** @type {Set<string>} */
  const ids = new Set();
  let completenessSum = 0;

  let metadataCoverage = {
    difficulty: 0,
    cognitiveLevel: 0,
    expectedErrorTypes: 0,
    prerequisiteRowsValid: 0,
  };

  let idx = 0;
  for (const row of items) {
    const id = row?.id != null ? String(row.id) : "";
    if (id) {
      if (ids.has(id)) errors.push(`Duplicate id: ${id}`);
      else ids.add(id);
    }

    const qtext = String(row.question ?? row.stem ?? "").trim();
    if (!qtext) errors.push(`Row #${idx}: empty question`);

    const choices = row.answers || row.options;
    if (!Array.isArray(choices) || choices.length === 0) {
      errors.push(`Row #${idx}: missing answers/options`);
    }

    if (row.correct === undefined || row.correct === null || !Number.isFinite(Number(row.correct))) {
      errors.push(`Row #${idx}: invalid correct index`);
    } else if (Array.isArray(choices) && Number(row.correct) >= choices.length) {
      errors.push(`Row #${idx}: correct out of range`);
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
      errors.push(`Row #${idx}: prerequisiteSkillIds must be array when present`);
    } else {
      const invalid = pr.filter((x) => !HEBREW_RICH_SKILL_IDS.has(String(x).trim()));
      if (invalid.length) errors.push(`Row #${idx}: invalid prerequisite ids`);
      else metadataCoverage.prerequisiteRowsValid += 1;
    }

    const rec = buildScanRecord(
      /** @type {Record<string, unknown>} */ (row),
      "utils/hebrew-rich-question-bank.js",
      `HEBREW_RICH_POOL[${idx}]`,
      "hebrew",
      idx
    );
    completenessSum += rec.metadataCompletenessScore || 0;

    const hardIssues = rec.issues.filter(
      (c) => !["missing_explanation", "implicit_id_only", "missing_prerequisite_skill_ids"].includes(c)
    );
    if (hardIssues.length > 0) {
      warnings.push(`Row #${idx}: ${hardIssues.join(";")}`);
    }

    idx += 1;
  }

  const avgScannerCompletenessScore = n ? Math.round((completenessSum / n) * 1000) / 1000 : 0;

  /** Git baseline */
  let baselineNote = "Loads git HEAD `utils/hebrew-rich-question-bank.js` + `grade-gating.js` into temp for import.";
  /** @type {{ index: number, field: string }[]} */
  const contentDiffs = [];
  let gitBaselineAvailable = false;

  const baselineItems = await loadHebrewRichPoolFromGitHead();
  if (baselineItems && baselineItems.length === n) {
    gitBaselineAvailable = true;
    for (let i = 0; i < n; i++) {
      const a = contentFingerprint(baselineItems[i]);
      const b = contentFingerprint(items[i]);
      if (!a || !b) continue;
      if (a.question !== b.question) contentDiffs.push({ index: i, field: "question" });
      if (JSON.stringify(a.answers) !== JSON.stringify(b.answers)) contentDiffs.push({ index: i, field: "answers" });
      if (JSON.stringify(a.options) !== JSON.stringify(b.options)) contentDiffs.push({ index: i, field: "options" });
      if (a.correct !== b.correct) contentDiffs.push({ index: i, field: "correct" });
      if (a.correctIndex !== b.correctIndex) contentDiffs.push({ index: i, field: "correctIndex" });
      if (a.kind !== b.kind) contentDiffs.push({ index: i, field: "kind/type" });
    }
  } else {
    baselineNote += " Could not load HEAD snapshot — structural checks only.";
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
    "# Hebrew rich pool — post-apply verification",
    "",
    ok ? "**PASS**" : "**FAIL**",
    "",
    `- Content diffs vs HEAD: ${contentDiffs.length}`,
    "",
    "## Errors",
    "",
    errors.length ? errors.map((e) => `- ${e}`).join("\n") : "_None._",
    "",
  ].join("\n");

  writeFileSync(OUT_MD, md, "utf8");

  console.log("");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`  Hebrew rich post-apply: ${ok ? "PASS" : "FAIL"}`);
  console.log(`  Rows: ${n} | Content diffs: ${contentDiffs.length} | Errors: ${errors.length}`);
  console.log(`  Report: ${OUT_JSON}`);
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("");

  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
