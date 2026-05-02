#!/usr/bin/env node
/**
 * Phase 4 — generator/bank question integrity over coverage-matrix cells.
 * npm run qa:learning-simulator:questions
 *
 * Env:
 *   QUESTION_INTEGRITY_N — samples per cell (default 3)
 *   QUESTION_INTEGRITY_MAX_CELLS — cap rows scanned (optional)
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { generateForMatrixCell, SUPPORTED_SUBJECTS } from "./lib/question-generator-adapters.mjs";
import { normalizeQuestionPayload, runIntegrityChecks } from "./lib/question-integrity-checks.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const MATRIX_PATH = join(ROOT, "reports", "learning-simulator", "coverage-matrix.json");
const OUT_DIR = join(ROOT, "reports", "learning-simulator", "questions");

const N = Math.max(1, Math.min(20, Number(process.env.QUESTION_INTEGRITY_N || 3)));
const MAX_CELLS = process.env.QUESTION_INTEGRITY_MAX_CELLS
  ? Math.max(1, Number(process.env.QUESTION_INTEGRITY_MAX_CELLS))
  : null;

function cellKey(c) {
  return `${c.grade}|${c.subjectCanonical}|${c.topic}|${c.level}`;
}

function mdEscape(s) {
  return String(s ?? "").replace(/\|/g, "\\|");
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  let matrixRaw;
  try {
    matrixRaw = JSON.parse(await readFile(MATRIX_PATH, "utf8"));
  } catch (e) {
    console.error(`Missing ${MATRIX_PATH}. Run npm run qa:learning-simulator:matrix first.`);
    console.error(e);
    process.exit(1);
    return;
  }

  let rows = matrixRaw.rows || [];
  rows = rows.filter((r) => r.isRuntimeSupported !== false);
  if (MAX_CELLS != null && rows.length > MAX_CELLS) {
    rows = rows.slice(0, MAX_CELLS);
  }

  const unsupportedCells = [];
  const failures = [];
  const samples = [];

  let cellsScanned = 0;
  let cellsFullyPassed = 0;
  let cellsWithUnsupported = 0;
  let cellsWithIntegrityFailure = 0;
  let cellsSkippedSubject = 0;

  let questionsGenerated = 0;
  let checksPassed = 0;
  let checksFailed = 0;
  let warningCount = 0;

  /** @type {Record<string, number>} */
  const failuresBySubject = {};
  /** @type {Record<string, number>} */
  const failuresByTopic = {};

  for (const row of rows) {
    const cell = {
      grade: row.grade,
      subjectCanonical: row.subjectCanonical,
      level: row.level,
      topic: row.topic,
    };

    if (!SUPPORTED_SUBJECTS.includes(cell.subjectCanonical)) {
      cellsSkippedSubject += 1;
      unsupportedCells.push({
        ...cell,
        reason: `subject "${cell.subjectCanonical}" has no Phase 4 adapter`,
      });
      continue;
    }

    cellsScanned += 1;
    let unsupportedThisCell = false;
    let integrityFailThisCell = false;

    for (let i = 0; i < N; i += 1) {
      const gen = await generateForMatrixCell(cell, i);

      if (gen.unsupported) {
        unsupportedThisCell = true;
        unsupportedCells.push({
          cellKey: cellKey(cell),
          ...cell,
          reason: gen.reason || "unsupported",
          sampleIndex: i,
        });
        continue;
      }

      if (!gen.ok || !gen.raw) {
        integrityFailThisCell = true;
        checksFailed += 1;
        failures.push({
          cellKey: cellKey(cell),
          sampleIndex: i,
          seed: gen.seed,
          phase: "generation",
          error: gen.error || "generation_failed",
          matrixRow: row,
        });
        failuresBySubject[cell.subjectCanonical] = (failuresBySubject[cell.subjectCanonical] || 0) + 1;
        failuresByTopic[`${cell.subjectCanonical}:${cell.topic}`] =
          (failuresByTopic[`${cell.subjectCanonical}:${cell.topic}`] || 0) + 1;
        continue;
      }

      questionsGenerated += 1;
      const normalized = normalizeQuestionPayload(gen.raw);
      const ctx = {
        requestedTopic: cell.topic,
        resolvedTopic: gen.meta?.resolvedTopic ?? gen.raw?.topic ?? gen.raw?.operation,
        grade: cell.grade,
        level: cell.level,
        subject: cell.subjectCanonical,
        meta: gen.meta,
      };
      const chk = runIntegrityChecks(normalized, ctx);
      warningCount += chk.warnings.length;

      if (chk.pass) {
        checksPassed += 1;
        if (samples.length < 150) {
          samples.push({
            cellKey: cellKey(cell),
            sampleIndex: i,
            mode: gen.mode,
            subject: cell.subjectCanonical,
            stemPreview: String(normalized?.stem || "").slice(0, 220),
            seed: gen.seed,
          });
        }
      } else {
        integrityFailThisCell = true;
        checksFailed += 1;
        failures.push({
          cellKey: cellKey(cell),
          sampleIndex: i,
          seed: gen.seed,
          phase: "integrity",
          failures: chk.failures,
          warnings: chk.warnings,
          stemPreview: String(normalized?.stem || "").slice(0, 160),
          matrixRow: { grade: row.grade, topic: row.topic, level: row.level, subjectCanonical: row.subjectCanonical },
        });
        failuresBySubject[cell.subjectCanonical] = (failuresBySubject[cell.subjectCanonical] || 0) + 1;
        failuresByTopic[`${cell.subjectCanonical}:${cell.topic}`] =
          (failuresByTopic[`${cell.subjectCanonical}:${cell.topic}`] || 0) + 1;
      }
    }

    if (unsupportedThisCell) cellsWithUnsupported += 1;
    else if (integrityFailThisCell) cellsWithIntegrityFailure += 1;
    else cellsFullyPassed += 1;
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    generator: "question-integrity-phase4-v1",
    config: { samplesPerCell: N, maxCells: MAX_CELLS, matrixPath: MATRIX_PATH },
    counts: {
      matrixRowsInFile: matrixRaw.rowCount ?? rows.length,
      rowsAfterFilter: rows.length,
      cellsScanned,
      cellsSkippedSubject,
      cellsFullyPassed,
      cellsWithUnsupported,
      cellsWithIntegrityFailure,
      questionsGenerated,
      checksPassed,
      checksFailed,
      warningCount,
    },
    subjectsSupported: SUPPORTED_SUBJECTS,
    failuresBySubject,
    failuresByTopic,
  };

  await writeFile(join(OUT_DIR, "run-summary.json"), JSON.stringify(summary, null, 2), "utf8");
  await writeFile(join(OUT_DIR, "failures.json"), JSON.stringify({ failures, generatedAt: summary.generatedAt }, null, 2), "utf8");
  await writeFile(
    join(OUT_DIR, "unsupported-cells.json"),
    JSON.stringify({ unsupportedCells, generatedAt: summary.generatedAt }, null, 2),
    "utf8"
  );
  await writeFile(join(OUT_DIR, "sample-questions.json"), JSON.stringify({ samples, generatedAt: summary.generatedAt }, null, 2), "utf8");

  const md = [
    "# Question integrity (generator / bank)",
    "",
    `- Generated at: ${summary.generatedAt}`,
    `- Rows scanned (runtime-supported): ${summary.counts.rowsAfterFilter}`,
    `- Cells scanned (adapter subjects): ${summary.counts.cellsScanned}`,
    `- Cells fully passed (all ${N} samples): ${summary.counts.cellsFullyPassed}`,
    `- Cells with unsupported adapter/topic: ${summary.counts.cellsWithUnsupported}`,
    `- Cells with failures: ${summary.counts.cellsWithIntegrityFailure}`,
    `- Questions generated: ${summary.counts.questionsGenerated}`,
    `- Checks passed: ${summary.counts.checksPassed}`,
    `- Checks failed: ${summary.counts.checksFailed}`,
    `- Warnings: ${summary.counts.warningCount}`,
    "",
    "## Failures by subject",
    "",
    ...Object.entries(failuresBySubject)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `- ${mdEscape(k)}: ${v}`),
    "",
    "## Top failure topics",
    "",
    ...Object.entries(failuresByTopic)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map(([k, v]) => `- ${mdEscape(k)}: ${v}`),
    "",
  ].join("\n");

  await writeFile(join(OUT_DIR, "run-summary.md"), md, "utf8");

  console.log(
    JSON.stringify(
      {
        cellsScanned: summary.counts.cellsScanned,
        cellsFullyPassed: summary.counts.cellsFullyPassed,
        questionsGenerated: summary.counts.questionsGenerated,
        checksPassed: summary.counts.checksPassed,
        checksFailed: summary.counts.checksFailed,
        warnings: summary.counts.warningCount,
        unsupportedCells: summary.counts.cellsWithUnsupported,
      },
      null,
      2
    )
  );

  if (checksFailed > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
