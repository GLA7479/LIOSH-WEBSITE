/**
 * Phase 4G — Map Geometry inventory rows to catalog subsection candidates (advisory).
 */
import { readFileSync, existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { normalizeInventoryTopic } from "../../utils/curriculum-audit/curriculum-topic-normalizer.js";
import { GEOMETRY_OFFICIAL_SUBSECTION_CATALOG } from "../../utils/curriculum-audit/geometry-official-subsection-catalog.js";
import { geometrySequencingSuspicions } from "../../utils/curriculum-audit/geometry-sequencing-heuristics.js";
import { exactGradeTopicRegistryCovers } from "../../utils/curriculum-audit/official-source-subject-profile.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT_DIR = join(ROOT, "reports", "curriculum-audit");
const INV_PATH = join(OUT_DIR, "question-inventory.json");

function loadJson(path, label) {
  if (!existsSync(path)) throw new Error(`Missing ${label}: ${path}`);
  return JSON.parse(readFileSync(path, "utf8"));
}

const CONF_ORDER = { high: 0, medium: 1, low: 2 };

/**
 * When multiple catalog sections map the same normalized key, keep one deterministic pick
 * (highest confidence, then sectionKey) — avoids false “competing candidates” noise at scale.
 */
function canonicalCatalogSections(sections) {
  if (sections.length <= 1) return { sections, hadAmbiguity: false };
  const sorted = [...sections].sort((a, b) => {
    const da = CONF_ORDER[a.confidence] ?? 3;
    const db = CONF_ORDER[b.confidence] ?? 3;
    if (da !== db) return da - db;
    return String(a.sectionKey || "").localeCompare(String(b.sectionKey || ""));
  });
  return { sections: sorted.slice(0, 1), hadAmbiguity: true };
}

function matchingSectionsResolved(grade, normalizedTopicKey) {
  const slot = GEOMETRY_OFFICIAL_SUBSECTION_CATALOG[`grade_${grade}`];
  if (!slot) return { sections: [], hadAmbiguity: false };
  const raw = slot.sections.filter((s) =>
    (s.mapsToNormalizedKeys || []).includes(normalizedTopicKey)
  );
  return canonicalCatalogSections(raw);
}

/**
 * @param {object[]} sections
 * @returns {'high'|'medium'|'low'|'none'}
 */
function candidateConfidenceTier(sections) {
  if (!sections.length) return "none";
  const c = sections[0].confidence || "medium";
  if (c === "high") return "high";
  if (c === "medium") return "medium";
  return "low";
}

export async function buildGeometryRowSubsectionCandidates(opts = {}) {
  const writeFiles = opts.writeFiles !== false;
  const inventory = loadJson(INV_PATH, "question-inventory");
  const invRecords = (inventory.records || []).filter((r) => r.subject === "geometry");

  /** @type {object[]} */
  const rows = [];

  for (const rec of invRecords) {
    const gmin = Number(rec.gradeMin);
    const norm = normalizeInventoryTopic({
      subject: "geometry",
      topic: rec.topic,
      subtopic: rec.subtopic || "",
    });
    const normKey = norm.normalizedTopicKey;
    const seq = geometrySequencingSuspicions(rec, normKey);
    const seqCodes = seq.map((s) => s.code);

    let sections = [];
    let catalogSectionAmbiguity = false;
    if (Number.isFinite(gmin) && gmin >= 1 && gmin <= 6) {
      const res = matchingSectionsResolved(gmin, normKey);
      sections = res.sections;
      catalogSectionAmbiguity = res.hadAmbiguity;
    }

    const candidateKeys = sections.map((s) => s.sectionKey);
    const tier = candidateConfidenceTier(sections);

    const gradePdfAnchored =
      Number.isFinite(gmin) && exactGradeTopicRegistryCovers("geometry", gmin);

    const needsManualReview = true;

    rows.push({
      questionId: rec.questionId,
      grade: gmin,
      rawTopic: rec.topic || "",
      rawSubtopic: rec.subtopic || "",
      normalizedTopicKey: normKey,
      difficulty: rec.difficulty || "",
      sourceFile: rec.sourceFile || "",
      textPreview: (rec.textPreview || "").slice(0, 200),
      candidateSubsectionKeys: candidateKeys,
      candidateConfidence: tier,
      competingCandidates: false,
      catalogSectionAmbiguity,
      sequencingSuspicionCodes: seqCodes,
      sequencingSuspicionsDetail: seq,
      gradePdfAnchored,
      needsManualReview,
      normalizationConfidence: norm.normalizationConfidence,
    });
  }

  const summary = {
    totalGeometryRows: rows.length,
    gradePdfAnchoredRows: rows.filter((r) => r.gradePdfAnchored).length,
    subsectionCandidateRows: rows.filter((r) => r.candidateConfidence !== "none").length,
    highConfidenceSubsectionCandidateRows: rows.filter((r) => r.candidateConfidence === "high")
      .length,
    mediumConfidenceSubsectionCandidateRows: rows.filter((r) => r.candidateConfidence === "medium")
      .length,
    lowConfidenceSubsectionCandidateRows: rows.filter((r) => r.candidateConfidence === "low")
      .length,
    noSubsectionCandidateRows: rows.filter((r) => r.candidateConfidence === "none").length,
    stillNeedsManualReviewRows: rows.filter((r) => r.needsManualReview).length,
    rowsWithCompetingCandidates: rows.filter((r) => r.competingCandidates).length,
    catalogSectionAmbiguityRows: rows.filter((r) => r.catalogSectionAmbiguity).length,
  };

  const sequencingHistogram = rows.reduce((acc, r) => {
    for (const c of r.sequencingSuspicionCodes) acc[c] = (acc[c] || 0) + 1;
    return acc;
  }, {});

  const payload = {
    generatedAt: new Date().toISOString(),
    phase: "4G-geometry-row-subsection-candidates",
    meta: {
      ownerGate:
        "Geometry subsection candidates are advisory planning hooks — not curriculum sign-off.",
    },
    summary,
    sequencingHistogram,
    rows,
  };

  if (writeFiles) {
    await mkdir(OUT_DIR, { recursive: true });
    const jsonPath = join(OUT_DIR, "geometry-row-subsection-candidates.json");
    const mdPath = join(OUT_DIR, "geometry-row-subsection-candidates.md");
    await writeFile(jsonPath, JSON.stringify(payload, null, 2), "utf8");
    const md = [
      `# Geometry row subsection candidates (Phase 4G)`,
      ``,
      `- Generated: ${payload.generatedAt}`,
      ``,
      `## Summary`,
      ``,
      `| Metric | Count |`,
      `|--------|------:|`,
      `| Total Geometry rows | ${summary.totalGeometryRows} |`,
      `| subsectionCandidateRows | ${summary.subsectionCandidateRows} |`,
      `| high | ${summary.highConfidenceSubsectionCandidateRows} |`,
      `| medium | ${summary.mediumConfidenceSubsectionCandidateRows} |`,
      `| low | ${summary.lowConfidenceSubsectionCandidateRows} |`,
      `| noSubsectionCandidateRows | ${summary.noSubsectionCandidateRows} |`,
      `| rowsWithCompetingCandidates | ${summary.rowsWithCompetingCandidates} |`,
      ``,
      `Full JSON: **geometry-row-subsection-candidates.json**`,
      ``,
    ].join("\n");
    await writeFile(mdPath, md, "utf8");
    console.log(`Wrote ${jsonPath}`);
    console.log(`Wrote ${mdPath}`);
  }

  return payload;
}

async function main() {
  await buildGeometryRowSubsectionCandidates({ writeFiles: true });
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
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
