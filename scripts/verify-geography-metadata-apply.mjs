#!/usr/bin/env node
/**
 * Post-apply verification for Moledet/geography static banks (g1–g6).
 * npm run qa:geography-metadata:verify
 */
import { execSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "reports", "question-metadata-qa");
const OUT_JSON = join(OUT_DIR, "geography-post-apply-verification.json");
const OUT_MD = join(OUT_DIR, "geography-post-apply-verification.md");

const GIT_PATHS = [
  "data/geography-questions/g1.js",
  "data/geography-questions/g2.js",
  "data/geography-questions/g3.js",
  "data/geography-questions/g4.js",
  "data/geography-questions/g5.js",
  "data/geography-questions/g6.js",
];

/**
 * @returns {Promise<Map<string, object|null>|null>}
 */
async function loadFingerprintsFromGitHead() {
  let tmpRoot = "";
  try {
    execSync("git rev-parse HEAD", { cwd: ROOT, stdio: "pipe" });
  } catch {
    return null;
  }
  tmpRoot = mkdtempSync(join(tmpdir(), "geo-git-head-"));
  try {
    const dataDir = join(tmpRoot, "data", "geography-questions");
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

    const scannerMod = await import(new URL("../utils/question-metadata-qa/question-metadata-scanner.js", import.meta.url).href);
    const { scanQuestionBankModule } = scannerMod;

    const pickMod = await import(new URL("../utils/question-metadata-qa/geography-metadata-enrichment-suggestions.js", import.meta.url).href);
    const { getMoledetGeographyRawAtPath } = pickMod;

    /** @type {Map<string, object|null>} */
    const fps = new Map();

    for (const rel of GIT_PATHS) {
      const leaf = rel.split("/").pop();
      const subPath = `data/geography-questions/${leaf}`;
      const { records } = await scanQuestionBankModule(tmpRoot, subPath, "moledet-geography");
      const href = pathToFileURL(join(dataDir, leaf)).href;
      const mod = await import(`${href}?t=${Date.now()}`);
      for (const r of records) {
        const raw = getMoledetGeographyRawAtPath(mod, r.objectPath);
        fps.set(`${rel}::${r.objectPath}`, contentFingerprint(raw));
      }
    }
    return fps;
  } catch {
    return null;
  } finally {
    try {
      if (tmpRoot) rmSync(tmpRoot, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
}

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
    question: String(r.question ?? r.stem ?? ""),
    answers,
    options: opts,
    correct: correctStr,
    correctIndex: Number.isFinite(correctIdx) ? correctIdx : null,
    kind: r.kind ?? r.type ?? null,
  };
}

async function collectCurrentFingerprints() {
  const scannerMod = await import(new URL("../utils/question-metadata-qa/question-metadata-scanner.js", import.meta.url).href);
  const { scanQuestionBankModule } = scannerMod;
  const pickMod = await import(new URL("../utils/question-metadata-qa/geography-metadata-enrichment-suggestions.js", import.meta.url).href);
  const { getMoledetGeographyRawAtPath } = pickMod;

  /** @type {Map<string, object|null>} */
  const fps = new Map();

  for (const rel of GIT_PATHS) {
    const href = pathToFileURL(join(ROOT, rel)).href;
    const mod = await import(`${href}?t=${Date.now()}`);
    const { records } = await scanQuestionBankModule(ROOT, rel, "moledet-geography");
    for (const r of records) {
      const raw = getMoledetGeographyRawAtPath(mod, r.objectPath);
      fps.set(`${rel}::${r.objectPath}`, contentFingerprint(raw));
    }
  }
  return fps;
}

async function main() {
  const taxMod = await import(new URL("../utils/question-metadata-qa/question-metadata-taxonomy.js", import.meta.url).href);
  const {
    ALL_VALID_DIFFICULTY,
    ALL_VALID_COGNITIVE_LEVELS,
    MOLEDET_GEOGRAPHY_SKILL_IDS,
    EXTENDED_EXPECTED_ERROR_TYPES,
  } = taxMod;

  const scannerMod = await import(new URL("../utils/question-metadata-qa/question-metadata-scanner.js", import.meta.url).href);
  const { scanQuestionBankModule, buildScanRecord } = scannerMod;

  const pickMod = await import(new URL("../utils/question-metadata-qa/geography-metadata-enrichment-suggestions.js", import.meta.url).href);
  const { getMoledetGeographyRawAtPath } = pickMod;

  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const warnings = [];

  const headFps = await loadFingerprintsFromGitHead();
  if (!headFps) {
    warnings.push("Could not load git HEAD snapshots for student-facing diff (git unavailable or failed).");
  }

  const currentFps = await collectCurrentFingerprints();

  let gitCompareCompared = 0;
  let gitCompareSkippedNewPaths = 0;

  if (headFps) {
    for (const [k, curFp] of currentFps.entries()) {
      if (!headFps.has(k)) {
        gitCompareSkippedNewPaths += 1;
        continue;
      }
      const headFp = headFps.get(k);
      if (JSON.stringify(headFp) !== JSON.stringify(curFp)) {
        errors.push(`Student-facing fingerprint mismatch for ${k}`);
      }
      gitCompareCompared += 1;
    }
    for (const k of headFps.keys()) {
      if (!currentFps.has(k)) {
        warnings.push(`HEAD path ${k} missing in working tree scan`);
      }
    }
    if (gitCompareSkippedNewPaths > 0) {
      warnings.push(`Git compare skipped ${gitCompareSkippedNewPaths} paths not present in HEAD scan.`);
    }
    if (headFps.size !== currentFps.size) {
      warnings.push(`Fingerprint key count: HEAD ${headFps.size} vs current ${currentFps.size} — partial compare only.`);
    }
  }

  /** @type {Record<string, number>} */
  const rowsPerFile = {};
  let seq = 0;
  /** @type {Record<string, number>} */
  const metadataCoverage = {
    difficulty: 0,
    cognitiveLevel: 0,
    expectedErrorTypes: 0,
    skillRowsValid: 0,
    prereqRowsValid: 0,
  };

  for (const rel of GIT_PATHS) {
    const href = pathToFileURL(join(ROOT, rel)).href;
    const mod = await import(`${href}?t=${Date.now()}`);
    const { records } = await scanQuestionBankModule(ROOT, rel, "moledet-geography");
    rowsPerFile[rel] = records.length;

    for (const r of records) {
      const raw = getMoledetGeographyRawAtPath(mod, r.objectPath);
      if (!raw || typeof raw !== "object") {
        errors.push(`${rel} ${r.objectPath}: missing raw row`);
        continue;
      }
      const row = /** @type {Record<string, unknown>} */ (raw);

      const qtext = String(row.question ?? row.stem ?? "").trim();
      if (!qtext) errors.push(`${rel} ${r.objectPath}: empty question`);

      const choices = row.answers || row.options;
      if (!Array.isArray(choices) || choices.length === 0) {
        errors.push(`${rel} ${r.objectPath}: missing answers/options`);
      }

      if (row.correct === undefined || row.correct === null || !Number.isFinite(Number(row.correct))) {
        errors.push(`${rel} ${r.objectPath}: invalid correct index`);
      } else if (Array.isArray(choices) && Number(row.correct) >= choices.length) {
        errors.push(`${rel} ${r.objectPath}: correct out of range`);
      }

      const diff = String(row.difficulty || "").toLowerCase();
      if (!diff || !ALL_VALID_DIFFICULTY.has(diff)) {
        errors.push(`${rel} ${r.objectPath}: missing or invalid difficulty`);
      } else metadataCoverage.difficulty += 1;

      const cog = String(row.cognitiveLevel || "").toLowerCase();
      if (!cog || !ALL_VALID_COGNITIVE_LEVELS.has(cog)) {
        errors.push(`${rel} ${r.objectPath}: missing or invalid cognitiveLevel`);
      } else metadataCoverage.cognitiveLevel += 1;

      const et = row.expectedErrorTypes;
      if (!Array.isArray(et) || et.length === 0) {
        errors.push(`${rel} ${r.objectPath}: missing or empty expectedErrorTypes`);
      } else {
        metadataCoverage.expectedErrorTypes += 1;
        const bad = et.filter((t) => !EXTENDED_EXPECTED_ERROR_TYPES.has(String(t).trim()));
        if (bad.length) errors.push(`${rel} ${r.objectPath}: unknown expected error types: ${bad.join(",")}`);
      }

      const sk = String(row.skillId || "").trim();
      const sub = String(row.subtype || "").trim();
      if (!sk || !MOLEDET_GEOGRAPHY_SKILL_IDS.has(sk)) {
        errors.push(`${rel} ${r.objectPath}: missing or invalid skillId`);
      } else {
        metadataCoverage.skillRowsValid += 1;
        if (!sub) errors.push(`${rel} ${r.objectPath}: missing subtype (grade subskill)`);
      }

      const pr = row.prerequisiteSkillIds;
      if (pr === undefined || pr === null || (Array.isArray(pr) && pr.length === 0)) {
        metadataCoverage.prereqRowsValid += 1;
      } else {
        const bad = (Array.isArray(pr) ? pr : []).filter((p) => !MOLEDET_GEOGRAPHY_SKILL_IDS.has(String(p).trim()));
        if (bad.length) errors.push(`${rel} ${r.objectPath}: invalid prerequisiteSkillIds`);
        else metadataCoverage.prereqRowsValid += 1;
      }

      buildScanRecord(row, rel, r.objectPath, "moledet-geography", seq++);
    }
  }

  const ok = errors.length === 0;

  const payload = {
    version: 1,
    generatedAt: new Date().toISOString(),
    passed: ok,
    rowsPerFile,
    totalRows: Object.values(rowsPerFile).reduce((a, b) => a + b, 0),
    metadataCoverage,
    gitHeadComparison: headFps
      ? {
          attempted: true,
          headKeys: headFps.size,
          currentKeys: currentFps.size,
          compared: gitCompareCompared,
          skippedNewPaths: gitCompareSkippedNewPaths,
        }
      : { attempted: false },
    errors,
    warnings,
  };

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_JSON, JSON.stringify(payload, null, 2), "utf8");

  const md = [
    "# Moledet / geography — post-apply verification",
    "",
    `- **Generated:** ${payload.generatedAt}`,
    `- **Passed:** ${ok ? "yes" : "no"}`,
    `- **Total rows:** ${payload.totalRows}`,
    "",
    "## Rows per file",
    "",
    ...Object.entries(rowsPerFile).map(([f, n]) => `- ${f}: ${n}`),
    "",
    "## Metadata coverage counts",
    "",
    "```json",
    JSON.stringify(metadataCoverage, null, 2),
    "```",
    "",
    "## Git HEAD student-facing compare",
    "",
    headFps
      ? `_Compared ${gitCompareCompared} paths; skipped ${gitCompareSkippedNewPaths} new-only paths._`
      : "_Skipped._",
    "",
    "## Errors",
    "",
    errors.length ? errors.map((e) => `- ${e}`).join("\n") : "_None._",
    "",
    "## Warnings",
    "",
    warnings.length ? warnings.map((w) => `- ${w}`).join("\n") : "_None._",
    "",
  ].join("\n");

  writeFileSync(OUT_MD, md, "utf8");

  console.log("");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`  Moledet/geography verify — ${ok ? "PASS" : "FAIL"}`);
  console.log(`  Report: ${OUT_JSON}`);
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("");

  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
