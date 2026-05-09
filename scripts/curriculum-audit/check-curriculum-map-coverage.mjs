/**
 * Curriculum map coverage vs normalized inventory topics (Phase 2).
 */

import { readFileSync, existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT_DIR = join(ROOT, "reports", "curriculum-audit");
const INV_PATH = join(OUT_DIR, "question-inventory.json");

async function loadMap() {
  return import(
    pathToFileURL(join(ROOT, "utils/curriculum-audit/israeli-primary-curriculum-map.js")).href
  );
}

async function loadNormalizer() {
  return import(
    pathToFileURL(join(ROOT, "utils/curriculum-audit/curriculum-topic-normalizer.js")).href
  );
}

export async function runMapCoverageCheck(opts = {}) {
  const writeFiles = opts.writeFiles !== false;
  if (!existsSync(INV_PATH)) {
    throw new Error(`Missing ${INV_PATH} — run npm run audit:curriculum:inventory first.`);
  }

  const [{ findTopicPlacement, CURRICULUM_MAP_META }, { normalizeInventoryTopic }] =
    await Promise.all([loadMap(), loadNormalizer()]);

  const inventory = JSON.parse(readFileSync(INV_PATH, "utf8"));
  const records = inventory.records || [];

  let mappedRows = 0;
  let unmappedRows = 0;
  const bySubject = {};
  const unmappedKeyCounts = new Map();
  const mappedKeyCounts = new Map();

  /** @type {object[]} */
  const highRiskSamples = [];

  for (const rec of records) {
    const norm = normalizeInventoryTopic({
      subject: rec.subject,
      topic: rec.topic,
      subtopic: rec.subtopic,
    });
    const placement = findTopicPlacement(rec.subject, rec.gradeMin, norm.normalizedTopicKey);
    const isMapped = placement != null;

    if (isMapped) {
      mappedRows++;
      const mk = `${rec.subject}|${norm.normalizedTopicKey}`;
      mappedKeyCounts.set(mk, (mappedKeyCounts.get(mk) || 0) + 1);
    } else {
      unmappedRows++;
      const uk = `${rec.subject}|${norm.normalizedTopicKey}`;
      unmappedKeyCounts.set(uk, (unmappedKeyCounts.get(uk) || 0) + 1);
    }

    const sub = rec.subject;
    if (!bySubject[sub]) {
      bySubject[sub] = { mappedRows: 0, unmappedRows: 0, mappedKeys: new Set(), unmappedKeys: new Set() };
    }
    bySubject[sub].mappedRows += isMapped ? 1 : 0;
    bySubject[sub].unmappedRows += isMapped ? 0 : 1;
    if (isMapped) bySubject[sub].mappedKeys.add(norm.normalizedTopicKey);
    else bySubject[sub].unmappedKeys.add(norm.normalizedTopicKey);

    if (!isMapped || norm.normalizationConfidence === "low") {
      if (highRiskSamples.length < 400) {
        highRiskSamples.push({
          questionId: rec.questionId,
          subject: rec.subject,
          gradeMin: rec.gradeMin,
          rawTopic: rec.topic,
          normalizedTopicKey: norm.normalizedTopicKey,
          normalizationConfidence: norm.normalizationConfidence,
          mapped: isMapped,
        });
      }
    }
  }

  /** Distinct (subject, gradeMin, normalizedTopicKey) classification */
  const seen = new Set();
  let distinctMapped = 0;
  let distinctUnmapped = 0;
  for (const rec of records) {
    const norm = normalizeInventoryTopic({
      subject: rec.subject,
      topic: rec.topic,
      subtopic: rec.subtopic,
    });
    const dedupe = `${rec.subject}|${rec.gradeMin}|${norm.normalizedTopicKey}`;
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    const placement = findTopicPlacement(rec.subject, rec.gradeMin, norm.normalizedTopicKey);
    if (placement) distinctMapped++;
    else distinctUnmapped++;
  }

  const totalDistinctTriples = seen.size;
  const pctDistinctMapped =
    totalDistinctTriples === 0
      ? 0
      : Math.round((distinctMapped / totalDistinctTriples) * 10000) / 100;

  const topUnmapped = [...unmappedKeyCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 80)
    .map(([k, c]) => ({ key: k, rowCount: c }));

  const serializedBySubject = {};
  for (const [s, v] of Object.entries(bySubject)) {
    serializedBySubject[s] = {
      mappedRows: v.mappedRows,
      unmappedRows: v.unmappedRows,
      distinctMappedKeys: [...v.mappedKeys].sort(),
      distinctUnmappedKeys: [...v.unmappedKeys].sort(),
    };
  }

  const report = {
    generatedAt: new Date().toISOString(),
    curriculumMapMeta: CURRICULUM_MAP_META,
    summary: {
      totalInventoryRows: records.length,
      mappedRows,
      unmappedRows,
      percentRowsMapped:
        records.length === 0 ? 0 : Math.round((mappedRows / records.length) * 10000) / 100,
      distinctSubjectGradeTopicTriples: totalDistinctTriples,
      distinctMappedTriples: distinctMapped,
      distinctUnmappedTriples: distinctUnmapped,
      percentDistinctTriplesMapped: pctDistinctMapped,
    },
    bySubject: serializedBySubject,
    topUnmappedHighVolumeTopics: topUnmapped,
    highRiskTopicSamples: highRiskSamples.slice(0, 120),
    notes: [
      "Mapped = findTopicPlacement(subject, gradeMin, normalizedTopicKey) non-null.",
      "Prefix keys (e.g. english.grammar.* under english.grammar) count as mapped.",
    ],
  };

  if (writeFiles) {
    await mkdir(OUT_DIR, { recursive: true });
    await writeFile(join(OUT_DIR, "map-coverage.json"), JSON.stringify(report, null, 2), "utf8");
    await writeFile(join(OUT_DIR, "map-coverage.md"), coverageMarkdown(report), "utf8");
    console.log(`Wrote map coverage to ${OUT_DIR}/map-coverage.{json,md}`);
  }

  return report;
}

function coverageMarkdown(report) {
  const s = report.summary;
  const lines = [
    `# Curriculum map coverage`,
    ``,
    `- Generated: ${report.generatedAt}`,
    `- Map version: ${report.curriculumMapMeta.version} (phase ${report.curriculumMapMeta.phase ?? "?"})`,
    ``,
    `## Summary`,
    ``,
    `- Total inventory rows: ${s.totalInventoryRows}`,
    `- Rows mapped: ${s.mappedRows} (${s.percentRowsMapped}%)`,
    `- Rows unmapped: ${s.unmappedRows}`,
    `- Distinct (subject, grade, normalized topic) triples: ${s.distinctSubjectGradeTopicTriples}`,
    `- Distinct triples mapped: ${s.distinctMappedTriples} (${s.percentDistinctTriplesMapped}%)`,
    ``,
    `## Top unmapped high-volume keys`,
    ``,
    ...report.topUnmappedHighVolumeTopics.slice(0, 40).map((x) => `- ${x.key}: ${x.rowCount} rows`),
    ``,
    `## By subject`,
    ``,
    ...Object.entries(report.bySubject).map(
      ([k, v]) =>
        `- **${k}**: mapped rows ${v.mappedRows}, unmapped rows ${v.unmappedRows}; unmapped keys: ${v.distinctUnmappedKeys.length}`
    ),
  ];
  return lines.join("\n");
}

function isExecutedAsMainScript() {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    const self = fileURLToPath(import.meta.url);
    return resolve(entry) === resolve(self);
  } catch {
    return false;
  }
}

if (isExecutedAsMainScript()) {
  runMapCoverageCheck({ writeFiles: true }).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
