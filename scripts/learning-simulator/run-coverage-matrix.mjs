#!/usr/bin/env node
/**
 * Phase 0 — coverage matrix discovery for qa:learning-simulator.
 * Run: npm run qa:learning-simulator:matrix
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { discoverAll } from "./lib/subject-topics-discovery.mjs";
import {
  buildMatrixRows,
  enrichDiscoveryWithCurriculumIndexes,
  validateMatrix,
  verifyMatrixSelfTest,
  buildMarkdownSummary,
} from "./lib/coverage-matrix.mjs";
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT_DIR = join(ROOT, "reports", "learning-simulator");
const OUT_JSON = join(OUT_DIR, "coverage-matrix.json");
const OUT_MD = join(OUT_DIR, "coverage-matrix.md");

function distinctTopicsPerSubject(rows) {
  const map = new Map();
  for (const r of rows) {
    if (!map.has(r.subjectCanonical)) map.set(r.subjectCanonical, new Set());
    map.get(r.subjectCanonical).add(r.topic);
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([subject, set]) => ({
      subject,
      count: set.size,
      topics: [...set].sort(),
    }));
}

function gradesPerSubject(rows) {
  const map = new Map();
  for (const r of rows) {
    if (!map.has(r.subjectCanonical)) map.set(r.subjectCanonical, new Set());
    map.get(r.subjectCanonical).add(r.grade);
  }
  const out = {};
  for (const [s, set] of map) {
    out[s] = [...set].sort();
  }
  return out;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  let discovery = await discoverAll();
  discovery = await enrichDiscoveryWithCurriculumIndexes(discovery);

  if (discovery._curriculumHebrew === null) {
    discovery.globalWarnings.push(
      "matrix: failed to import data/hebrew-curriculum.js — isCurriculumDeclared for Hebrew may be incomplete"
    );
  }
  if (discovery._curriculumMoledet === null) {
    discovery.globalWarnings.push(
      "matrix: failed to import data/moledet-geography-curriculum.js — isCurriculumDeclared for moledet_geography may be incomplete"
    );
  }

  const rows = buildMatrixRows(discovery);
  const validation = validateMatrix(discovery, rows);
  const selfTest = verifyMatrixSelfTest(rows);

  const topicCountsBySubject = distinctTopicsPerSubject(rows);
  const subjects = topicCountsBySubject.map((x) => x.subject);
  const gradesPresent = [...new Set(rows.map((r) => r.grade))].sort();

  const payload = {
    generatedAt: new Date().toISOString(),
    rowCount: rows.length,
    rows,
    summary: {
      subjects,
      gradesPresent,
      gradesPerSubject: gradesPerSubject(rows),
      topicCountsBySubject,
      validation,
      selfTest,
      globalWarnings: discovery.globalWarnings || [],
      unsupportedSubjects: discovery.unsupportedSubjects || [],
    },
  };

  await writeFile(OUT_JSON, JSON.stringify(payload, null, 2), "utf8");

  const md = buildMarkdownSummary({
    generatedAt: payload.generatedAt,
    rowCount: rows.length,
    subjects,
    topicCountsBySubject,
    gradesPresent,
    validation,
    selfTest,
    warnings: [...validation.warnings, ...(selfTest.ok ? [] : ["self-test failed"])],
    unsupportedSubjects: discovery.unsupportedSubjects,
  });
  await writeFile(OUT_MD, md, "utf8");

  console.log(
    JSON.stringify(
      {
        ok: validation.ok && selfTest.ok,
        rowCount: rows.length,
        outJson: OUT_JSON,
        outMd: OUT_MD,
        errors: validation.errors,
        selfTestFailures: selfTest.failures,
      },
      null,
      2
    )
  );

  if (!validation.ok || !selfTest.ok) {
    console.error("coverage-matrix: validation failed");
    if (validation.errors?.length) console.error(validation.errors.join("\n"));
    if (selfTest.failures?.length) console.error(selfTest.failures.join("\n"));
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
