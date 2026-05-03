#!/usr/bin/env node
/**
 * Post-apply verification for English static pools.
 * npm run qa:english-metadata:verify
 */
import { execSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "reports", "question-metadata-qa");
const OUT_JSON = join(OUT_DIR, "english-post-apply-verification.json");
const OUT_MD = join(OUT_DIR, "english-post-apply-verification.md");

const GIT_PATHS = [
  "data/english-questions/grammar-pools.js",
  "data/english-questions/translation-pools.js",
  "data/english-questions/sentence-pools.js",
];

/**
 * @returns {Promise<object|null>}
 */
async function loadEnglishPoolsFromGitHead() {
  try {
    execSync("git rev-parse HEAD", { cwd: ROOT, stdio: "pipe" });
  } catch {
    return null;
  }
  const dir = mkdtempSync(join(tmpdir(), "en-pools-git-head-"));
  try {
    const dataDir = join(dir, "data", "english-questions");
    mkdirSync(dataDir, { recursive: true });
    for (const gitPath of GIT_PATHS) {
      const txt = execSync(`git show HEAD:${gitPath}`, {
        cwd: ROOT,
        encoding: "utf8",
        maxBuffer: 64 * 1024 * 1024,
      });
      const base = gitPath.split("/").pop();
      writeFileSync(join(dataDir, base), txt, "utf8");
    }

    const grammarHref = pathToFileURL(join(dataDir, "grammar-pools.js")).href;
    const translationHref = pathToFileURL(join(dataDir, "translation-pools.js")).href;
    const sentenceHref = pathToFileURL(join(dataDir, "sentence-pools.js")).href;

    const grammarMod = await import(`${grammarHref}?t=${Date.now()}`);
    const translationMod = await import(`${translationHref}?t=${Date.now()}`);
    const sentenceMod = await import(`${sentenceHref}?t=${Date.now()}`);

    const walkerMod = await import(new URL("../utils/question-metadata-qa/english-pool-walker.js", import.meta.url).href);
    return walkerMod.collectAllEnglishRows(grammarMod, translationMod, sentenceMod);
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
  const r = /** @type {Record<string, unknown>} */ (row);
  const answers = Array.isArray(r.answers) ? r.answers.map((x) => String(x)) : null;
  const opts = Array.isArray(r.options) ? r.options.map((x) => String(x)) : null;
  const correctStr =
    r.correct !== undefined && r.correct !== null && String(r.correct).trim() !== ""
      ? String(r.correct)
      : null;
  const correctIdx = r.correctIndex !== undefined ? Number(r.correctIndex) : null;
  return {
    question: String(r.question ?? r.stem ?? r.template ?? r.prompt ?? ""),
    en: r.en !== undefined && r.en !== null ? String(r.en) : null,
    he: r.he !== undefined && r.he !== null ? String(r.he) : null,
    answers,
    options: opts,
    correct: correctStr,
    correctIndex: Number.isFinite(correctIdx) ? correctIdx : null,
    kind: r.kind ?? r.type ?? null,
  };
}

function hasStem(row) {
  const r = /** @type {Record<string, unknown>} */ (row);
  return !!(r.question || r.stem || r.prompt || r.template);
}

function hasCorrectAnswer(row) {
  const r = /** @type {Record<string, unknown>} */ (row);
  if (r.correctIndex !== undefined && Number.isFinite(Number(r.correctIndex))) return true;
  if (r.correct !== undefined && r.correct !== null && String(r.correct).trim().length > 0) return true;
  if (r.correctAnswer !== undefined && r.correctAnswer !== null) return true;
  return false;
}

async function main() {
  const grammarBank = await import(new URL("../data/english-questions/grammar-pools.js", import.meta.url).href);
  const translationBank = await import(new URL("../data/english-questions/translation-pools.js", import.meta.url).href);
  const sentenceBank = await import(new URL("../data/english-questions/sentence-pools.js", import.meta.url).href);

  const walkerMod = await import(new URL("../utils/question-metadata-qa/english-pool-walker.js", import.meta.url).href);
  const rows = walkerMod.collectAllEnglishRows(grammarBank, translationBank, sentenceBank);

  const scannerMod = await import(new URL("../utils/question-metadata-qa/question-metadata-scanner.js", import.meta.url).href);
  const { buildScanRecord } = scannerMod;

  const taxMod = await import(new URL("../utils/question-metadata-qa/question-metadata-taxonomy.js", import.meta.url).href);
  const {
    ALL_VALID_DIFFICULTY,
    ALL_VALID_COGNITIVE_LEVELS,
    ENGLISH_SKILL_IDS,
    EXTENDED_EXPECTED_ERROR_TYPES,
  } = taxMod;

  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const warnings = [];

  const n = rows.length;

  /** @type {Set<string>} */
  const ids = new Set();
  let completenessSum = 0;

  const metadataCoverage = {
    difficulty: 0,
    cognitiveLevel: 0,
    expectedErrorTypes: 0,
    prerequisiteRowsValid: 0,
    skillPresent: 0,
    subskillPresent: 0,
  };

  let idx = 0;
  for (const wrap of rows) {
    const row = wrap.raw;
    const id = row?.id != null ? String(row.id) : "";
    if (id) {
      if (ids.has(id)) errors.push(`Duplicate id: ${id}`);
      else ids.add(id);
    }

    if (!hasStem(row)) {
      errors.push(`Row #${idx} (${wrap.sourceFile} ${wrap.objectPath}): empty stem`);
    }

    const choices = row.answers || row.options;
    if (!Array.isArray(choices) || choices.length === 0) {
      errors.push(`Row #${idx}: missing answers/options`);
    }

    if (!hasCorrectAnswer(row)) {
      errors.push(`Row #${idx}: missing correct answer`);
    } else if (row.correctIndex !== undefined && Number.isFinite(Number(row.correctIndex)) && Array.isArray(choices)) {
      if (Number(row.correctIndex) >= choices.length) errors.push(`Row #${idx}: correctIndex out of range`);
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

    const rec = buildScanRecord(
      /** @type {Record<string, unknown>} */ (row),
      wrap.sourceFile,
      wrap.objectPath,
      "english",
      idx
    );
    if (rec.skillId) metadataCoverage.skillPresent += 1;
    if (rec.subskillId) metadataCoverage.subskillPresent += 1;

    const pr = row.prerequisiteSkillIds;
    if (pr === undefined || pr === null || (Array.isArray(pr) && pr.length === 0)) {
      metadataCoverage.prerequisiteRowsValid += 1;
    } else if (!Array.isArray(pr)) {
      errors.push(`Row #${idx}: prerequisiteSkillIds must be array when present`);
    } else {
      const invalid = pr.filter((x) => !ENGLISH_SKILL_IDS.has(String(x).trim()));
      if (invalid.length) errors.push(`Row #${idx}: invalid prerequisite ids`);
      else metadataCoverage.prerequisiteRowsValid += 1;
    }

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
  let baselineNote = "Loads git HEAD English pool files into temp for import.";
  /** @type {{ index: number, field: string }[]} */
  const contentDiffs = [];
  let gitBaselineAvailable = false;

  const baselineRows = await loadEnglishPoolsFromGitHead();
  if (baselineRows && baselineRows.length === n) {
    gitBaselineAvailable = true;
    for (let i = 0; i < n; i++) {
      const a = contentFingerprint(baselineRows[i].raw);
      const b = contentFingerprint(rows[i].raw);
      if (!a || !b) continue;
      if (a.question !== b.question) contentDiffs.push({ index: i, field: "question/stem/template" });
      if (JSON.stringify(a.answers) !== JSON.stringify(b.answers)) contentDiffs.push({ index: i, field: "answers" });
      if (JSON.stringify(a.options) !== JSON.stringify(b.options)) contentDiffs.push({ index: i, field: "options" });
      if (a.en !== b.en) contentDiffs.push({ index: i, field: "en" });
      if (a.he !== b.he) contentDiffs.push({ index: i, field: "he" });
      if (a.correct !== b.correct) contentDiffs.push({ index: i, field: "correct" });
      if (a.correctIndex !== b.correctIndex) contentDiffs.push({ index: i, field: "correctIndex" });
      if (a.kind !== b.kind) contentDiffs.push({ index: i, field: "kind/type" });
    }
  } else {
    baselineNote += " Could not load HEAD snapshot — structural checks only.";
  }

  const ok = errors.length === 0 && contentDiffs.length === 0;
  const payload = {
    version: 1,
    generatedAt: new Date().toISOString(),
    ok,
    englishRowsTotal: n,
    errors,
    warnings,
    metadataCoverage: {
      ...metadataCoverage,
      pctSkillPresent: n ? Math.round((metadataCoverage.skillPresent / n) * 1000) / 10 : 0,
      pctSubskillPresent: n ? Math.round((metadataCoverage.subskillPresent / n) * 1000) / 10 : 0,
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
    "# English pools — post-apply verification",
    "",
    ok ? "**PASS**" : "**FAIL**",
    "",
    `- **Rows:** ${n}`,
    `- **Content diffs vs HEAD:** ${contentDiffs.length}`,
    `- **Errors:** ${errors.length}`,
    "",
    "## Errors",
    "",
    errors.length ? errors.map((e) => `- ${e}`).join("\n") : "_None._",
    "",
  ].join("\n");

  writeFileSync(OUT_MD, md, "utf8");

  console.log("");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`  English post-apply: ${ok ? "PASS" : "FAIL"}`);
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
