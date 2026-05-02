#!/usr/bin/env node
/**
 * Content gap audit — classify coverage-catalog cells with coverageStatus unsupported_needs_content.
 * npm run qa:learning-simulator:content-gaps
 *
 * Exit 1 only if a cell is unclassified (unknown), artifacts fail to write, or inputs are missing.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { COVERAGE_STATUS, cellKey } from "./lib/coverage-catalog-core.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT_DIR = join(ROOT, "reports", "learning-simulator");
const OUT_JSON = join(OUT_DIR, "content-gap-audit.json");
const OUT_MD = join(OUT_DIR, "content-gap-audit.md");

/** @typedef {"missing_question_bank"|"missing_topic_bank_entries"|"mixed_or_ui_only_topic"|"curriculum_runtime_mismatch"|"level_not_supported_for_topic"|"intentional_not_testable"|"needs_product_decision"|"needs_content_addition"} FinalGapCategory */
/** @typedef {"P0"|"P1"|"P2"|"P3"} Priority */

/**
 * @param {object} catalogRow
 * @param {object | null} matrixRow
 * @param {string} reason
 * @returns {{ category: FinalGapCategory, priority: Priority, evidenceFiles: string[], recommendedAction: string, canBeFixedByQAOnly: boolean, requiresNewQuestionContent: boolean, requiresRuntimeChange: boolean, shouldRemainUnsupportedExpected: boolean } | null}
 */
export function classifyContentGapCell(catalogRow, matrixRow, reason) {
  const r = String(reason || "").toLowerCase();
  const topic = String(catalogRow.topic || "");
  const sub = String(catalogRow.subject || "");

  const evidenceScience = [
    "data/science-curriculum.js",
    "data/science-questions.js",
    "scripts/learning-simulator/lib/question-generator-adapters.mjs",
  ];
  const evidenceEnglish = [
    "data/english-curriculum.js",
    "pages/learning/english-master.js",
    "scripts/learning-simulator/lib/question-generator-adapters.mjs",
  ];
  const evidenceMixed = [
    "scripts/learning-simulator/run-question-integrity.mjs",
    "scripts/learning-simulator/lib/coverage-matrix.mjs",
  ];

  if (topic === "mixed" || r.includes("intentionally multi-topic") || r.includes("not a single integrity cell")) {
    return {
      category: "mixed_or_ui_only_topic",
      priority: "P3",
      evidenceFiles: evidenceMixed,
      recommendedAction:
        "Keep matrix row for documentation; do not treat as missing single-topic MCQ bank. Covered by mixed-session / UI flows; catalog should classify as unsupported_expected (not content gap).",
      canBeFixedByQAOnly: true,
      requiresNewQuestionContent: false,
      requiresRuntimeChange: false,
      shouldRemainUnsupportedExpected: true,
    };
  }

  if (sub === "science" && r.includes("no science mcq bank")) {
    return {
      category: "missing_topic_bank_entries",
      priority: "P1",
      evidenceFiles: evidenceScience,
      recommendedAction:
        "Add MCQ rows to data/science-questions.js for this grade · topic · level band (minLevel/maxLevel + grades[]) so bank filter in question-generator-adapters returns candidates.",
      canBeFixedByQAOnly: false,
      requiresNewQuestionContent: true,
      requiresRuntimeChange: false,
      shouldRemainUnsupportedExpected: false,
    };
  }

  if (sub === "english" && (r.includes("no mcq-shaped english") || r.includes("pool rows"))) {
    return {
      category: "needs_content_addition",
      priority: "P1",
      evidenceFiles: evidenceEnglish,
      recommendedAction:
        "Add MCQ-shaped English pool items for translation at this grade (or narrow matrix level/topic if product intentionally excludes MCQ for this mode — needs product decision).",
      canBeFixedByQAOnly: false,
      requiresNewQuestionContent: true,
      requiresRuntimeChange: false,
      shouldRemainUnsupportedExpected: false,
    };
  }

  if (r.includes("bank items matched") || r.includes("pool rows")) {
    return {
      category: "missing_topic_bank_entries",
      priority: "P1",
      evidenceFiles: sub === "science" ? evidenceScience : evidenceEnglish,
      recommendedAction: "Extend bank/pool JSON so Phase 4 adapter finds at least one item for this matrix cell.",
      canBeFixedByQAOnly: false,
      requiresNewQuestionContent: true,
      requiresRuntimeChange: false,
      shouldRemainUnsupportedExpected: false,
    };
  }

  return null;
}

function bump(map, k) {
  map[k] = (map[k] || 0) + 1;
}

function mdEscape(s) {
  return String(s ?? "").replace(/\|/g, "\\|");
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const runId = `content-gap-${Date.now().toString(36)}`;
  const generatedAt = new Date().toISOString();

  let catalog;
  let matrix;
  try {
    catalog = JSON.parse(await readFile(join(OUT_DIR, "coverage-catalog.json"), "utf8"));
  } catch {
    console.error("Missing reports/learning-simulator/coverage-catalog.json — run npm run qa:learning-simulator:coverage first.");
    process.exit(1);
    return;
  }
  try {
    matrix = JSON.parse(await readFile(join(OUT_DIR, "coverage-matrix.json"), "utf8"));
  } catch {
    console.error("Missing coverage-matrix.json");
    process.exit(1);
    return;
  }
  /** @type {Map<string, object>} */
  const matrixByKey = new Map();
  for (const row of matrix.rows || []) {
    matrixByKey.set(cellKey(row), row);
  }

  const catalogRows = catalog.rows || [];
  const gapRows = catalogRows.filter((r) => r.coverageStatus === COVERAGE_STATUS.unsupported_needs_content);

  /** @type {object[]} */
  const cells = [];
  let unknownCount = 0;

  const countsBySubject = {};
  const countsByGrade = {};
  const countsByTopic = {};
  const countsByLevel = {};
  const countsByFinalGapCategory = {};
  const countsByPriority = {};

  let qaOnlyReclass = 0;
  let canReclassExpected = 0;

  for (const row of gapRows) {
    const ck = row.cellKey;
    const matrixRow = matrixByKey.get(ck) || null;
    const reason = String(row.phase4UnsupportedReason || "");

    const cls = classifyContentGapCell(row, matrixRow, reason);
    if (!cls) {
      unknownCount += 1;
      cells.push({
        grade: row.grade,
        subject: row.subject,
        level: row.level,
        topic: row.topic,
        cellKey: ck,
        currentCoverageStatus: row.coverageStatus,
        currentUnsupportedReason: reason,
        finalGapCategory: "unknown",
        evidenceFiles: [],
        recommendedAction: "Manual triage — extend classifyContentGapCell in run-content-gap-audit.mjs",
        canBeFixedByQAOnly: false,
        requiresNewQuestionContent: false,
        requiresRuntimeChange: false,
        shouldRemainUnsupportedExpected: false,
        priority: "P2",
      });
      continue;
    }

    if (cls.category === "mixed_or_ui_only_topic") {
      qaOnlyReclass += 1;
      canReclassExpected += 1;
    }

    bump(countsBySubject, row.subject);
    bump(countsByGrade, row.grade);
    bump(countsByTopic, `${row.subject}:${row.topic}`);
    bump(countsByLevel, row.level);
    bump(countsByFinalGapCategory, cls.category);
    bump(countsByPriority, cls.priority);

    cells.push({
      grade: row.grade,
      subject: row.subject,
      level: row.level,
      topic: row.topic,
      cellKey: ck,
      currentCoverageStatus: row.coverageStatus,
      currentUnsupportedReason: reason,
      finalGapCategory: cls.category,
      evidenceFiles: cls.evidenceFiles,
      recommendedAction: cls.recommendedAction,
      canBeFixedByQAOnly: cls.canBeFixedByQAOnly,
      requiresNewQuestionContent: cls.requiresNewQuestionContent,
      requiresRuntimeChange: cls.requiresRuntimeChange,
      shouldRemainUnsupportedExpected: cls.shouldRemainUnsupportedExpected,
      priority: cls.priority,
      matrixNotes: matrixRow?.notes || [],
      isGeneratorBackedRaw: matrixRow?.isGeneratorBacked ?? null,
    });
  }

  const fixabilitySummary = {
    cellsNeedingNewQuestionContent: cells.filter((c) => c.requiresNewQuestionContent).length,
    cellsFixableByQAClassificationOnly: qaOnlyReclass,
    cellsRecommendUnsupportedExpected: canReclassExpected,
    requiresRuntimeChange: cells.filter((c) => c.requiresRuntimeChange).length,
    unknownCells: unknownCount,
  };

  const payload = {
    runId,
    generatedAt,
    versions: { contentGapAudit: "1.0.0" },
    totalUnsupportedNeedsContent: gapRows.length,
    countsBySubject,
    countsByGrade,
    countsByTopic,
    countsByLevel,
    countsByFinalGapCategory,
    countsByPriority,
    fixabilitySummary,
    cells: cells.sort((a, b) => a.cellKey.localeCompare(b.cellKey)),
  };

  const topTopics = Object.entries(countsByTopic)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  const md = [
    "# Content gap audit (`unsupported_needs_content`)",
    "",
    `- Run id: ${runId}`,
    `- Generated at: ${generatedAt}`,
    `- Total cells with **unsupported_needs_content**: **${gapRows.length}**`,
    `- Unknown classifications: **${unknownCount}**`,
    "",
    "## Fixability summary",
    "",
    "```json",
    JSON.stringify(fixabilitySummary, null, 2),
    "```",
    "",
    "## Counts by final gap category",
    "",
    ...Object.entries(countsByFinalGapCategory)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `- **${mdEscape(k)}**: ${v}`),
    "",
    "## Counts by priority",
    "",
    ...Object.entries(countsByPriority)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `- **${mdEscape(k)}**: ${v}`),
    "",
    "## Counts by subject",
    "",
    ...Object.entries(countsBySubject)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `- ${mdEscape(k)}: ${v}`),
    "",
    "## Top topic keys (subject:topic)",
    "",
    ...topTopics.map(([k, v]) => `- ${mdEscape(k)}: ${v}`),
    "",
    "## Examples (first 12 cells)",
    "",
    "| cellKey | category | priority | action |",
    "| --- | --- | --- | --- |",
    ...cells.slice(0, 12).map((c) => {
      const act = c.recommendedAction.slice(0, 72).replace(/\|/g, "\\|");
      return `| ${mdEscape(c.cellKey)} | ${mdEscape(c.finalGapCategory)} | ${mdEscape(c.priority)} | ${act}${c.recommendedAction.length > 72 ? "…" : ""} |`;
    }),
    "",
    "## What not to fix yet",
    "",
    "- Do not add or edit question JSON in this audit step.",
    "- Mixed/UI-only rows should be catalog **unsupported_expected**, not treated as missing banks.",
    "- English translation gaps may be intentional if product uses flashcards only — confirm before adding MCQs.",
    "",
    `Full JSON: \`${OUT_JSON.replace(/\\/g, "/")}\``,
    "",
  ].join("\n");

  await writeFile(OUT_JSON, JSON.stringify(payload, null, 2), "utf8");
  await writeFile(OUT_MD, md, "utf8");

  console.log(JSON.stringify({ ok: unknownCount === 0, total: gapRows.length, unknown: unknownCount, outJson: OUT_JSON }, null, 2));

  if (unknownCount > 0) {
    console.error(`Content gap audit: FAIL — ${unknownCount} cell(s) could not be classified.`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
