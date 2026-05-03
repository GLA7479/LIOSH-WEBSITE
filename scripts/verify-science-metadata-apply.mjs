#!/usr/bin/env node
/**
 * Post-apply verification: science bank structural integrity + optional git baseline content diff.
 * npm run qa:science-metadata:verify
 */
import { execSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "reports", "question-metadata-qa");
const OUT_JSON = join(OUT_DIR, "science-post-apply-verification.json");
const OUT_MD = join(OUT_DIR, "science-post-apply-verification.md");

const EXPECTED_TOTAL = 383;

/**
 * Load SCIENCE_QUESTIONS exactly as exported from git HEAD (both data files together).
 * @returns {Promise<object[]|null>}
 */
async function loadScienceQuestionsFromGitHead() {
  try {
    execSync("git rev-parse HEAD", { cwd: ROOT, stdio: "pipe" });
  } catch {
    return null;
  }
  const dir = mkdtempSync(join(tmpdir(), "sci-git-head-"));
  try {
    const dataDir = join(dir, "data");
    mkdirSync(dataDir, { recursive: true });
    const main = execSync("git show HEAD:data/science-questions.js", {
      cwd: ROOT,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    });
    const phase = execSync("git show HEAD:data/science-questions-phase3.js", {
      cwd: ROOT,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    });
    writeFileSync(join(dataDir, "science-questions.js"), main, "utf8");
    writeFileSync(join(dataDir, "science-questions-phase3.js"), phase, "utf8");
    const href = pathToFileURL(join(dataDir, "science-questions.js")).href;
    const mod = await import(`${href}?t=${Date.now()}`);
    return mod.SCIENCE_QUESTIONS || null;
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
 * @param {unknown} q
 */
function contentFingerprint(q) {
  if (!q || typeof q !== "object") return null;
  const opts = Array.isArray(q.options) ? q.options.map((x) => String(x)) : null;
  return {
    stem: String(q.stem ?? q.question ?? ""),
    options: opts,
    correctIndex: q.correctIndex,
    type: q.type ?? null,
  };
}

/**
 * @param {object[]} questions
 */
function byIdMap(questions) {
  /** @type {Map<string, object>} */
  const m = new Map();
  for (const q of questions) {
    const id = q?.id != null ? String(q.id) : "";
    if (id) m.set(id, q);
  }
  return m;
}

async function main() {
  const { SCIENCE_QUESTIONS } = await import(new URL("../data/science-questions.js", import.meta.url).href);

  const scannerMod = await import(new URL("../utils/question-metadata-qa/question-metadata-scanner.js", import.meta.url).href);
  const { buildScanRecord } = scannerMod;

  const taxMod = await import(new URL("../utils/question-metadata-qa/question-metadata-taxonomy.js", import.meta.url).href);
  const { ALL_VALID_DIFFICULTY, ALL_VALID_COGNITIVE_LEVELS } = taxMod;

  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const warnings = [];

  const n = SCIENCE_QUESTIONS.length;
  if (n !== EXPECTED_TOTAL) {
    errors.push(`Expected ${EXPECTED_TOTAL} SCIENCE_QUESTIONS, got ${n}`);
  }

  /** @type {Set<string>} */
  const ids = new Set();
  /** @type {string[]} */
  const dupIds = [];

  let metadataCoverage = {
    cognitiveLevel: 0,
    expectedErrorTypes: 0,
    canonicalDifficulty: 0,
    scannerSubskillResolved: 0,
  };

  let idx = 0;
  for (const q of SCIENCE_QUESTIONS) {
    const id = q?.id != null ? String(q.id) : "";
    if (!id) errors.push(`Row #${idx}: missing id`);
    else if (ids.has(id)) dupIds.push(id);
    else ids.add(id);

    const stem = String(q.stem ?? q.question ?? "").trim();
    if (!stem) errors.push(`${id || `#${idx}`}: empty stem`);

    const t = String(q.type || "").toLowerCase();
    const opts = q.options;
    if (t === "mcq" || t === "true_false") {
      if (!Array.isArray(opts) || opts.length === 0) {
        errors.push(`${id}: missing or empty options for type ${t}`);
      } else {
        const emptyOpt = opts.some((o) => String(o).trim() === "");
        if (emptyOpt) errors.push(`${id}: empty option string`);
      }
    }

    if (q.correctIndex === undefined || q.correctIndex === null) {
      errors.push(`${id}: missing correctIndex`);
    } else {
      const ci = Number(q.correctIndex);
      if (!Number.isInteger(ci) || ci < 0) errors.push(`${id}: invalid correctIndex ${q.correctIndex}`);
      else if (Array.isArray(opts) && ci >= opts.length) {
        errors.push(`${id}: correctIndex ${ci} out of range (${opts.length} options)`);
      }
    }

    const params = q.params;
    if (!params || typeof params !== "object" || Array.isArray(params)) {
      errors.push(`${id}: missing or malformed params`);
    } else {
      const cog = String(params.cognitiveLevel || "").toLowerCase();
      if (!cog || !ALL_VALID_COGNITIVE_LEVELS.has(cog)) {
        errors.push(`${id}: missing or invalid params.cognitiveLevel`);
      } else metadataCoverage.cognitiveLevel += 1;

      const et = params.expectedErrorTypes;
      if (!Array.isArray(et) || et.length === 0) {
        errors.push(`${id}: missing or empty params.expectedErrorTypes`);
      } else metadataCoverage.expectedErrorTypes += 1;

      const diff = String(params.difficulty || "").toLowerCase();
      if (!diff || !ALL_VALID_DIFFICULTY.has(diff)) {
        errors.push(`${id}: missing or invalid params.difficulty (canonical)`);
      } else metadataCoverage.canonicalDifficulty += 1;
    }

    const rec = buildScanRecord(
      /** @type {Record<string, unknown>} */ (q),
      "data/science-questions.js",
      id || `row_${idx}`,
      "science",
      idx
    );
    if (!rec.subskillId) {
      errors.push(`${id}: scanner subskillId empty`);
    } else metadataCoverage.scannerSubskillResolved += 1;

    idx += 1;
  }

  if (dupIds.length) errors.push(`Duplicate ids: ${[...new Set(dupIds)].join(", ")}`);

  /** Git baseline content comparison */
  let baselineNote =
    "Exact pre-apply snapshot not stored separately; comparison uses `git show HEAD` when available.";
  /** @type {{ id: string, field: string, before: unknown, after: unknown }[]} */
  const contentDiffs = [];
  let gitBaselineAvailable = false;

  const baselineQuestions = await loadScienceQuestionsFromGitHead();

  if (baselineQuestions && Array.isArray(baselineQuestions)) {
    gitBaselineAvailable = true;
    const baseline = baselineQuestions;
    if (baseline.length === n) {
      const curMap = byIdMap(SCIENCE_QUESTIONS);
      const baseMap = byIdMap(baseline);
      for (const [id, cur] of curMap.entries()) {
        const prev = baseMap.get(id);
        if (!prev) {
          contentDiffs.push({ id, field: "__missing_in_baseline__", before: null, after: "present" });
          continue;
        }
        const a = contentFingerprint(prev);
        const b = contentFingerprint(cur);
        if (!a || !b) continue;
        if (a.stem !== b.stem) contentDiffs.push({ id, field: "stem", before: a.stem, after: b.stem });
        if (JSON.stringify(a.options) !== JSON.stringify(b.options)) {
          contentDiffs.push({ id, field: "options", before: a.options, after: b.options });
        }
        if (a.correctIndex !== b.correctIndex) {
          contentDiffs.push({ id, field: "correctIndex", before: a.correctIndex, after: b.correctIndex });
        }
        if (a.type !== b.type) contentDiffs.push({ id, field: "type", before: a.type, after: b.type });
      }
      for (const id of baseMap.keys()) {
        if (!curMap.has(id)) contentDiffs.push({ id, field: "__missing_in_current__", before: "present", after: null });
      }
    } else {
      baselineNote += ` HEAD baseline length ${baseline.length} vs current ${n} — skipped id-wise diff.`;
    }
  } else {
    baselineNote +=
      " Could not load paired git HEAD blobs for data/science-questions.js and data/science-questions-phase3.js. Structural checks still apply.";
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
      pctCognitive: n ? Math.round((metadataCoverage.cognitiveLevel / n) * 1000) / 10 : 0,
      pctExpectedErrors: n ? Math.round((metadataCoverage.expectedErrorTypes / n) * 1000) / 10 : 0,
      pctDifficulty: n ? Math.round((metadataCoverage.canonicalDifficulty / n) * 1000) / 10 : 0,
      pctSubskill: n ? Math.round((metadataCoverage.scannerSubskillResolved / n) * 1000) / 10 : 0,
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
    "# Science metadata — post-apply verification",
    "",
    `_Generated: ${payload.generatedAt}_`,
    "",
    "## Result",
    "",
    ok ? "**PASS** — no structural integrity errors." : "**FAIL** — see errors below.",
    "",
    "## Counts",
    "",
    `- **SCIENCE_QUESTIONS:** ${n} (expected ${EXPECTED_TOTAL})`,
    "",
    "## Metadata coverage (sample validation)",
    "",
    "| Field | Rows passing | % |",
    "| --- | ---: | ---: |",
    `| params.cognitiveLevel | ${metadataCoverage.cognitiveLevel} | ${payload.metadataCoverage.pctCognitive} |`,
    `| params.expectedErrorTypes | ${metadataCoverage.expectedErrorTypes} | ${payload.metadataCoverage.pctExpectedErrors} |`,
    `| params.difficulty | ${metadataCoverage.canonicalDifficulty} | ${payload.metadataCoverage.pctDifficulty} |`,
    `| scanner subskillId | ${metadataCoverage.scannerSubskillResolved} | ${payload.metadataCoverage.pctSubskill} |`,
    "",
    "## Git baseline comparison (student-facing)",
    "",
    baselineNote,
    "",
    `- **Git HEAD modules loaded:** ${gitBaselineAvailable ? "yes" : "no"}`,
    `- **Content diffs (stem / options / correctIndex / type):** ${contentDiffs.length}`,
    "",
    contentDiffs.length
      ? ["| id | field |", "| --- | --- |", ...contentDiffs.slice(0, 40).map((d) => `| ${d.id} | ${d.field} |`)].join("\n")
      : "_None._",
    "",
    "## Errors",
    "",
    errors.length ? errors.map((e) => `- ${e}`).join("\n") : "_None._",
    "",
    "## Outputs",
    "",
    "- `reports/question-metadata-qa/science-post-apply-verification.json`",
    "",
  ].join("\n");

  writeFileSync(OUT_MD, md, "utf8");

  console.log("");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`  Science post-apply verification: ${ok ? "PASS" : "FAIL"}`);
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
