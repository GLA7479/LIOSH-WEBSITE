/**
 * Phase 4B-2 — Math subtopic alignment review (planning only).
 * Distinguishes grade-PDF anchoring from exact subsection approval inside the PDF.
 */
import { readFileSync, existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { normalizeInventoryTopic } from "../../utils/curriculum-audit/curriculum-topic-normalizer.js";
import { mathGradePdfUrl } from "../../utils/curriculum-audit/math-official-source-map.js";
import { mathSequencingSuspicions } from "../../utils/curriculum-audit/math-sequencing-heuristics.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT_DIR = join(ROOT, "reports", "curriculum-audit");
const INV_PATH = join(OUT_DIR, "question-inventory.json");
const BANK_VS_PATH = join(OUT_DIR, "bank-vs-official-spine.json");

/** No automated inventory→PDF subsection IDs in registry yet. */
const HAS_EXACT_SUBSECTION_MAPPING = false;

function loadJson(path, label) {
  if (!existsSync(path)) {
    throw new Error(`Missing ${label}: ${path}`);
  }
  return JSON.parse(readFileSync(path, "utf8"));
}

function possibleGradeMismatch(invRecord, normKey, normConf, primary) {
  if (normConf === "low") return true;
  if (!["officially_anchored", "officially_anchored_low_confidence"].includes(primary || ""))
    return true;
  const gmin = Number(invRecord.gradeMin);
  const gmax = Number(invRecord.gradeMax);
  if (
    Number.isFinite(gmin) &&
    Number.isFinite(gmax) &&
    gmax - gmin >= 3 &&
    (normKey.includes("fractions") ||
      normKey.includes("percentages") ||
      normKey.includes("equations"))
  ) {
    return true;
  }
  return false;
}

function acceptablePendingManualReview(
  gradePdfAnchored,
  seqCodes,
  normConf,
  primary,
  possibleMismatch
) {
  return (
    gradePdfAnchored &&
    seqCodes.length === 0 &&
    normConf === "high" &&
    primary === "officially_anchored" &&
    !possibleMismatch
  );
}

function manualReviewPriority(row) {
  let score = 0;
  if (row.needsSubsectionReview) score += 1;
  score += (row.sequencingSuspicionCodes || []).length * 3;
  if (row.possibleGradeMismatch) score += 2;
  if (!row.gradePdfAnchored) score += 5;
  return score;
}

function groupBy(arr, keyFn) {
  /** @type {Record<string, typeof arr>} */
  const out = {};
  for (const x of arr) {
    const k = keyFn(x);
    if (!out[k]) out[k] = [];
    out[k].push(x);
  }
  return out;
}

export async function buildMathSubtopicAlignmentReview(opts = {}) {
  const writeFiles = opts.writeFiles !== false;
  const inventory = loadJson(INV_PATH, "question-inventory");
  const bankVs = loadJson(BANK_VS_PATH, "bank-vs-official-spine");
  const bRows = bankVs.rows || [];
  const byId = new Map(bRows.map((r) => [r.questionId, r]));

  const invRecords = (inventory.records || []).filter((r) => r.subject === "math");
  /** @type {object[]} */
  const rows = [];

  for (const rec of invRecords) {
    const b = byId.get(rec.questionId);
    const norm = normalizeInventoryTopic({
      subject: "math",
      topic: rec.topic,
      subtopic: rec.subtopic || "",
    });
    const normKey = norm.normalizedTopicKey;
    const primary = b?.primaryClassification || "missing_bank_vs_row";

    const gradePdfAnchored = Boolean(b?.officialGradeTopicAnchored);
    const exactSubsectionAnchored = HAS_EXACT_SUBSECTION_MAPPING ? false : false;
    const needsSubsectionReview =
      gradePdfAnchored && !exactSubsectionAnchored;

    const sequencing = mathSequencingSuspicions(rec, normKey);
    const seqCodes = sequencing.map((s) => s.code);

    const mismatch = possibleGradeMismatch(rec, normKey, norm.normalizationConfidence, primary);
    const acceptable = acceptablePendingManualReview(
      gradePdfAnchored,
      seqCodes,
      norm.normalizationConfidence,
      primary,
      mismatch
    );

    rows.push({
      questionId: rec.questionId,
      gradeMin: rec.gradeMin,
      gradeMax: rec.gradeMax,
      topic: rec.topic || "",
      subtopic: rec.subtopic || "",
      normalizedTopicKey: normKey,
      difficulty: rec.difficulty || "",
      sourceFile: rec.sourceFile || "",
      questionType: rec.questionType || "",
      primaryClassification: primary,
      gradePdfAnchored,
      exactSubsectionAnchored,
      needsSubsectionReview,
      sequencingSuspicionCodes: seqCodes,
      sequencingSuspicionsDetail: sequencing,
      possibleGradeMismatch: mismatch,
      acceptablePendingManualReview: acceptable,
      recommendedGradePdfUrl: mathGradePdfUrl(Number(rec.gradeMin) || 1),
      normalizationConfidence: norm.normalizationConfidence,
      preview: (rec.textPreview || "").slice(0, 120),
    });
  }

  const summary = {
    totalMathRows: rows.length,
    gradePdfAnchoredRows: rows.filter((r) => r.gradePdfAnchored).length,
    exactSubsectionAnchoredRows: rows.filter((r) => r.exactSubsectionAnchored).length,
    needsSubsectionReviewRows: rows.filter((r) => r.needsSubsectionReview).length,
    subjectOnlyAnchoredRows: rows.filter((r) =>
      Boolean(byId.get(r.questionId)?.officialSubjectOnlyAnchored)
    ).length,
    broadOrInternalRows: rows.filter((r) =>
      Boolean(byId.get(r.questionId)?.broadOrInternalOnly)
    ).length,
    acceptablePendingManualReviewRows: rows.filter((r) => r.acceptablePendingManualReview).length,
    possibleGradeMismatchRows: rows.filter((r) => r.possibleGradeMismatch).length,
  };

  /** @type {Record<string, number>} */
  const sequencingSuspicionHistogram = {};
  for (const r of rows) {
    for (const c of r.sequencingSuspicionCodes) {
      sequencingSuspicionHistogram[c] = (sequencingSuspicionHistogram[c] || 0) + 1;
    }
  }

  const sortedManual = [...rows]
    .map((r) => ({ ...r, _priority: manualReviewPriority(r) }))
    .sort((a, b) => b._priority - a._priority)
    .slice(0, 80)
    .map(({ _priority, ...rest }) => rest);

  const focusCodes = [
    "equations_expressions_possibly_early",
    "fractions_depth_unclear_low_grade",
    "decimals_possibly_early",
    "word_problem_difficulty_mismatch_low_grade",
  ];
  const focusCounts = Object.fromEntries(
    focusCodes.map((c) => [c, sequencingSuspicionHistogram[c] || 0])
  );

  const payload = {
    generatedAt: new Date().toISOString(),
    phase: "4B-2-math-subtopic-alignment",
    meta: {
      disclaimer:
        "gradePdfAnchored means an official grade programme PDF exists for that grade — not approval that the stem maps to a named subsection inside the PDF.",
      subsectionRule:
        "exactSubsectionAnchored requires automated or curated subsection IDs; currently disabled — all grade-PDF-anchored rows still need subsection review before content edits.",
      ownerGate: "No content correction until owner explicitly approves — this report is advisory.",
      hasAutomatedSubsectionMapping: HAS_EXACT_SUBSECTION_MAPPING,
    },
    summary,
    sequencingSuspicionHistogram,
    focusSuspicionCounts: focusCounts,
    groupByGrade: groupBy(rows, (r) => String(r.gradeMin)),
    groupByTopic: groupBy(rows, (r) => r.topic || "(empty)"),
    groupByNormalizedTopicKey: groupBy(rows, (r) => r.normalizedTopicKey),
    groupByDifficulty: groupBy(rows, (r) => String(r.difficulty || "(none)")),
    groupBySourceFile: groupBy(rows, (r) => r.sourceFile || "(unknown)"),
    groupBySuspicionCode: (() => {
      /** @type {Record<string, object[]>} */
      const m = {};
      for (const r of rows) {
        const codes =
          r.sequencingSuspicionCodes.length > 0 ? r.sequencingSuspicionCodes : ["(no_sequencing_flag)"];
        for (const c of codes) {
          if (!m[c]) m[c] = [];
          m[c].push({
            questionId: r.questionId,
            gradeMin: r.gradeMin,
            normalizedTopicKey: r.normalizedTopicKey,
            difficulty: r.difficulty,
            sourceFile: r.sourceFile,
          });
        }
      }
      return m;
    })(),
    topRowsForManualReview: sortedManual,
    rows,
  };

  if (writeFiles) {
    await mkdir(OUT_DIR, { recursive: true });
    const jsonPath = join(OUT_DIR, "math-subtopic-alignment-review.json");
    const mdPath = join(OUT_DIR, "math-subtopic-alignment-review.md");

    const md = [
      `# Math subtopic alignment review (Phase 4B-2)`,
      ``,
      `- Generated: ${payload.generatedAt}`,
      ``,
      `## Definitions`,
      ``,
      `- **Grade PDF anchored:** Official \`kita{n}.pdf\` exists for the row’s grade — **not** “exact subsection approved”.`,
      `- **Exact subsection anchored:** Automated mapping from inventory to a labelled subsection in the PDF — **currently ${HAS_EXACT_SUBSECTION_MAPPING ? "on" : "off"}** (all subsection work is manual).`,
      `- **Needs subsection review:** Grade-PDF anchored but no exact subsection mapping — **expected for essentially all rows** until subsection passes exist.`,
      ``,
      `## Summary`,
      ``,
      `| Metric | Count |`,
      `|--------|------:|`,
      `| Total Math rows | ${summary.totalMathRows} |`,
      `| **gradePdfAnchoredRows** | ${summary.gradePdfAnchoredRows} |`,
      `| **exactSubsectionAnchoredRows** | ${summary.exactSubsectionAnchoredRows} |`,
      `| **needsSubsectionReviewRows** | ${summary.needsSubsectionReviewRows} |`,
      `| **subjectOnlyAnchoredRows** | ${summary.subjectOnlyAnchoredRows} |`,
      `| **broadOrInternalRows** | ${summary.broadOrInternalRows} |`,
      `| acceptablePendingManualReview | ${summary.acceptablePendingManualReviewRows} |`,
      `| possibleGradeMismatch | ${summary.possibleGradeMismatchRows} |`,
      ``,
      `## Focus suspicion codes (owner priorities)`,
      ``,
      ...focusCodes.map(
        (c) =>
          `- **${c}:** ${focusCounts[c] ?? 0}`
      ),
      ``,
      `## Sequencing suspicion histogram`,
      ``,
      `| Code | Rows |`,
      `|------|-----:|`,
      ...Object.entries(sequencingSuspicionHistogram)
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) => `| ${k} | ${v} |`),
      ``,
      `## Top rows for manual review (priority heuristic)`,
      ``,
      `| Priority drivers | questionId | g | normalizedTopicKey | difficulty | codes |`,
      `|------------------|------------|---|-------------------|------------|-------|`,
      ...sortedManual.slice(0, 40).map((r) => {
        const drivers = [
          r.needsSubsectionReview ? "needs_subsection" : "",
          ...(r.sequencingSuspicionCodes || []),
          r.possibleGradeMismatch ? "grade_mismatch?" : "",
        ]
          .filter(Boolean)
          .join(", ");
        const qid =
          r.questionId.length > 14 ? `${r.questionId.slice(0, 14)}…` : r.questionId;
        return `| ${drivers.slice(0, 48)} | \`${qid}\` | ${r.gradeMin} | \`${r.normalizedTopicKey}\` | ${r.difficulty || "—"} | ${(r.sequencingSuspicionCodes || []).join("; ") || "—"} |`;
      }),
      ``,
      `Full JSON: **math-subtopic-alignment-review.json** (all rows + groupings).`,
      ``,
    ].join("\n");

    await writeFile(jsonPath, JSON.stringify(payload, null, 2), "utf8");
    await writeFile(mdPath, md, "utf8");
    console.log(`Wrote ${jsonPath}`);
    console.log(`Wrote ${mdPath}`);
  }

  return payload;
}

async function main() {
  await buildMathSubtopicAlignmentReview({ writeFiles: true });
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
