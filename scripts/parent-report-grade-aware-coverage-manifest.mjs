/**
 * Taxonomy coverage manifest for grade-aware parent recommendations.
 * Enumerates every taxonomy id from the six subject taxonomy modules via the registry.
 * Writes JSON + Markdown under reports/. Exit 0.
 *
 * Run: node scripts/parent-report-grade-aware-coverage-manifest.mjs
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { ALL_TAXONOMY_ROWS } from "../utils/diagnostic-engine-v2/taxonomy-registry.js";
import { GRADE_AWARE_RECOMMENDATION_TEMPLATES } from "../utils/parent-report-language/grade-aware-recommendation-templates.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");
const reportsDir = join(repoRoot, "reports");

const GRADE_BANDS = ["g1_g2", "g3_g4", "g5_g6"];

const M01_PARTIAL_BUCKET_COVERAGE = ["compare", "number_sense", "estimation"];
const M01_MISSING_BUCKET_COVERAGE = ["zero_one_properties", "scale", "prime_composite"];

/**
 * @param {unknown} band
 * @returns {boolean}
 */
function bandHasNonEmptyActionAndGoal(band) {
  if (!band || typeof band !== "object") return false;
  const a = band.actionTextHe != null && String(band.actionTextHe).trim() !== "";
  const g = band.goalTextHe != null && String(band.goalTextHe).trim() !== "";
  return a && g;
}

/**
 * @param {unknown} band
 * @returns {boolean}
 */
function bandHasNullActionAndGoal(band) {
  if (!band || typeof band !== "object") return false;
  return band.actionTextHe == null && band.goalTextHe == null;
}

/**
 * @param {string} subjectId
 * @param {string} taxonomyId
 * @returns {{
 *   status: string;
 *   partialBucketCoverage?: string[];
 *   missingBucketCoverage?: string[];
 *   coveredGradeBands?: string[];
 *   missingGradeBands?: string[];
 * }}
 */
function coverageStatus(subjectId, taxonomyId) {
  const tpl = GRADE_AWARE_RECOMMENDATION_TEMPLATES[subjectId]?.[taxonomyId];
  if (!tpl || typeof tpl !== "object") return { status: "pending_manual_hebrew" };

  if (tpl.defaultBands != null && typeof tpl.defaultBands === "object") {
    if (subjectId === "math" && taxonomyId === "M-01") {
      return {
        status: "pending_manual_hebrew",
        partialBucketCoverage: [...M01_PARTIAL_BUCKET_COVERAGE],
        missingBucketCoverage: [...M01_MISSING_BUCKET_COVERAGE],
      };
    }
    if (subjectId === "math" && taxonomyId === "M-03") {
      const bo = tpl.bucketOverrides;
      if (!bo || typeof bo !== "object") return { status: "pending_manual_hebrew" };
      const required = ["multiplication", "factors_multiples", "powers"];
      for (const k of required) {
        if (!bo[k] || typeof bo[k] !== "object") return { status: "pending_manual_hebrew" };
      }
      return {
        status: "partially_covered_by_template",
        partialBucketCoverage: [...required],
        missingBucketCoverage: ["mixed"],
        coveredGradeBands: ["g3_g4", "g5_g6"],
        missingGradeBands: ["g1_g2"],
      };
    }
    if (subjectId === "math" && taxonomyId === "M-10") {
      const bo = tpl.bucketOverrides;
      if (!bo || typeof bo !== "object") return { status: "pending_manual_hebrew" };
      const required = ["multiplication", "division", "division_with_remainder", "ratio"];
      for (const k of required) {
        if (!bo[k] || typeof bo[k] !== "object") return { status: "pending_manual_hebrew" };
      }
      return {
        status: "partially_covered_by_template",
        partialBucketCoverage: [...required],
        missingBucketCoverage: [],
        coveredGradeBands: ["g3_g4", "g5_g6"],
        missingGradeBands: ["g1_g2"],
      };
    }
    if (subjectId === "math" && taxonomyId === "M-07") {
      const bo = tpl.bucketOverrides;
      if (!bo || !bo.word_problems || typeof bo.word_problems !== "object") return { status: "pending_manual_hebrew" };
      return {
        status: "partially_covered_by_template",
        partialBucketCoverage: ["word_problems"],
        missingBucketCoverage: [],
        coveredGradeBands: ["g3_g4", "g5_g6"],
        missingGradeBands: ["g1_g2"],
      };
    }
    if (subjectId === "math" && taxonomyId === "M-08") {
      const bo = tpl.bucketOverrides;
      if (!bo || typeof bo !== "object") return { status: "pending_manual_hebrew" };
      const required = ["word_problems", "sequences", "equations", "order_of_operations"];
      for (const k of required) {
        if (!bo[k] || typeof bo[k] !== "object") return { status: "pending_manual_hebrew" };
      }
      return {
        status: "partially_covered_by_template",
        partialBucketCoverage: [...required],
        missingBucketCoverage: [],
        coveredGradeBands: ["g3_g4", "g5_g6"],
        missingGradeBands: ["g1_g2"],
      };
    }
    return { status: "pending_manual_hebrew" };
  }

  if (
    subjectId === "math" &&
    (taxonomyId === "M-04" || taxonomyId === "M-05") &&
    bandHasNullActionAndGoal(tpl.g1_g2) &&
    bandHasNonEmptyActionAndGoal(tpl.g3_g4) &&
    bandHasNonEmptyActionAndGoal(tpl.g5_g6)
  ) {
    return {
      status: "partially_covered_by_template",
      coveredGradeBands: ["g3_g4", "g5_g6"],
      missingGradeBands: ["g1_g2"],
    };
  }

  for (const b of GRADE_BANDS) {
    const band = tpl[b];
    if (!band || typeof band !== "object") return { status: "pending_manual_hebrew" };
    const a = band.actionTextHe != null && String(band.actionTextHe).trim() !== "";
    const g = band.goalTextHe != null && String(band.goalTextHe).trim() !== "";
    if (!a || !g) return { status: "pending_manual_hebrew" };
  }
  return { status: "covered_by_template" };
}

/** @type {Record<string, RegExp>} */
const SUBJECT_ID_TO_PREFIX = {
  math: /^M-/,
  geometry: /^G-/,
  hebrew: /^H-/,
  english: /^E-/,
  science: /^S-/,
  "moledet-geography": /^MG-/,
};

function assertIdMatchesSubject(subjectId, id) {
  const re = SUBJECT_ID_TO_PREFIX[subjectId];
  if (!re) return `unknown subjectId ${subjectId}`;
  if (!re.test(id)) return `id ${id} does not match expected prefix for ${subjectId}`;
  return null;
}

const rows = ALL_TAXONOMY_ROWS.map((row) => {
  const mismatch = assertIdMatchesSubject(row.subjectId, row.id);
  const cov = coverageStatus(row.subjectId, row.id);
  /** @type {Record<string, unknown>} */
  const out = {
    subjectId: row.subjectId,
    taxonomyId: row.id,
    status: cov.status,
    idPrefixOk: mismatch === null,
    idPrefixNote: mismatch,
  };
  if (cov.partialBucketCoverage) out.partialBucketCoverage = cov.partialBucketCoverage;
  if (cov.missingBucketCoverage) out.missingBucketCoverage = cov.missingBucketCoverage;
  if (cov.coveredGradeBands) out.coveredGradeBands = cov.coveredGradeBands;
  if (cov.missingGradeBands) out.missingGradeBands = cov.missingGradeBands;
  return out;
});

const countBySubject = rows.reduce((acc, r) => {
  acc[r.subjectId] = (acc[r.subjectId] || 0) + 1;
  return acc;
}, /** @type {Record<string, number>} */ ({}));

const countByStatus = rows.reduce((acc, r) => {
  acc[r.status] = (acc[r.status] || 0) + 1;
  return acc;
}, /** @type {Record<string, number>} */ ({}));

const manifest = {
  generatedAt: new Date().toISOString(),
  phase: "2-D3",
  note:
    "covered_by_template = legacy flat entry with all grade bands non-empty actionTextHe and goalTextHe. partially_covered_by_template = null g1_g2 and/or partial bucket/grade coverage (math M-04, M-05; M-03, M-10; M-07 word_problems; M-08 word_problems/sequences/equations/order_of_operations). pending_manual_hebrew otherwise. Math M-01: partial bucketOverrides (compare, number_sense, estimation); missing zero_one_properties, scale, prime_composite until approved.",
  summary: {
    totalRows: rows.length,
    countBySubject,
    countByStatus,
  },
  rows,
};

mkdirSync(reportsDir, { recursive: true });

const jsonPath = join(reportsDir, "parent-report-grade-aware-coverage-manifest.json");
writeFileSync(jsonPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

const mdLines = [
  "# Grade-aware recommendation — taxonomy coverage manifest",
  "",
  `Generated: ${manifest.generatedAt} (Phase ${manifest.phase})`,
  "",
  "## Summary",
  "",
  `| Metric | Value |`,
  `|--------|-------|`,
  `| Total taxonomy rows | ${manifest.summary.totalRows} |`,
  "",
  "### Count by subjectId",
  "",
  `| subjectId | count |`,
  `|-----------|-------|`,
  ...Object.keys(countBySubject)
    .sort()
    .map((sid) => `| ${sid} | ${countBySubject[sid]} |`),
  "",
  "### Count by status",
  "",
  `| status | count |`,
  `|--------|-------|`,
  ...Object.keys(countByStatus)
    .sort()
    .map((st) => `| ${st} | ${countByStatus[st]} |`),
  "",
  "## Rows",
  "",
  `| subjectId | taxonomyId | status | idPrefixOk | partialBucketCoverage | missingBucketCoverage | coveredGradeBands | missingGradeBands |`,
  `|-----------|------------|--------|------------|-------------------------|----------------------|-------------------|-------------------|`,
  ...rows.map((r) => {
    const p = Array.isArray(r.partialBucketCoverage) ? r.partialBucketCoverage.join(", ") : "";
    const m = Array.isArray(r.missingBucketCoverage) ? r.missingBucketCoverage.join(", ") : "";
    const cgb = Array.isArray(r.coveredGradeBands) ? r.coveredGradeBands.join(", ") : "";
    const mgb = Array.isArray(r.missingGradeBands) ? r.missingGradeBands.join(", ") : "";
    return `| ${r.subjectId} | ${r.taxonomyId} | ${r.status} | ${r.idPrefixOk ? "yes" : "no"} | ${p} | ${m} | ${cgb} | ${mgb} |`;
  }),
  "",
];

const mdPath = join(reportsDir, "parent-report-grade-aware-coverage-manifest.md");
writeFileSync(mdPath, `${mdLines.join("\n")}\n`, "utf8");

process.stdout.write(`Wrote ${jsonPath}\n`);
process.stdout.write(`Wrote ${mdPath}\n`);
process.stdout.write(
  `Summary: total=${manifest.summary.totalRows} subjects=${Object.keys(countBySubject).length}\n`
);
