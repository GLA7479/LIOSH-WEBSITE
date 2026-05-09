/**
 * Phase 4B-3 — Map Math inventory rows to catalog subsection candidates (advisory).
 */
import { readFileSync, existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { normalizeInventoryTopic } from "../../utils/curriculum-audit/curriculum-topic-normalizer.js";
import { MATH_OFFICIAL_SUBSECTION_CATALOG } from "../../utils/curriculum-audit/math-official-subsection-catalog.js";
import { mathSequencingSuspicions } from "../../utils/curriculum-audit/math-sequencing-heuristics.js";
import { exactGradeTopicRegistryCovers } from "../../utils/curriculum-audit/official-source-subject-profile.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT_DIR = join(ROOT, "reports", "curriculum-audit");
const INV_PATH = join(OUT_DIR, "question-inventory.json");

function loadJson(path, label) {
  if (!existsSync(path)) throw new Error(`Missing ${label}: ${path}`);
  return JSON.parse(readFileSync(path, "utf8"));
}

function matchingSections(grade, normalizedTopicKey) {
  const slot = MATH_OFFICIAL_SUBSECTION_CATALOG[`grade_${grade}`];
  if (!slot) return [];
  return slot.sections.filter((s) =>
    (s.mapsToNormalizedKeys || []).includes(normalizedTopicKey)
  );
}

/**
 * @param {object[]} sections
 * @returns {'high'|'medium'|'low'|'none'}
 */
function candidateConfidenceTier(sections) {
  if (!sections.length) return "none";
  if (sections.length > 1) return "low";
  const c = sections[0].confidence || "medium";
  if (c === "high") return "high";
  if (c === "medium") return "medium";
  return "low";
}

export async function buildMathRowSubsectionCandidates(opts = {}) {
  const writeFiles = opts.writeFiles !== false;
  const inventory = loadJson(INV_PATH, "question-inventory");
  const invRecords = (inventory.records || []).filter((r) => r.subject === "math");

  /** @type {object[]} */
  const rows = [];

  for (const rec of invRecords) {
    const gmin = Number(rec.gradeMin);
    const norm = normalizeInventoryTopic({
      subject: "math",
      topic: rec.topic,
      subtopic: rec.subtopic || "",
    });
    const normKey = norm.normalizedTopicKey;
    const seq = mathSequencingSuspicions(rec, normKey);
    const seqCodes = seq.map((s) => s.code);

    const sections = Number.isFinite(gmin) && gmin >= 1 && gmin <= 6
      ? matchingSections(gmin, normKey)
      : [];

    const candidateKeys = sections.map((s) => s.sectionKey);
    const tier = candidateConfidenceTier(sections);
    const competingCandidates = sections.length > 1;

    const gradePdfAnchored =
      Number.isFinite(gmin) && exactGradeTopicRegistryCovers("math", gmin);

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
      competingCandidates,
      sequencingSuspicionCodes: seqCodes,
      sequencingSuspicionsDetail: seq,
      gradePdfAnchored,
      needsManualReview,
      normalizationConfidence: norm.normalizationConfidence,
    });
  }

  const summary = {
    totalMathRows: rows.length,
    gradePdfAnchoredRows: rows.filter((r) => r.gradePdfAnchored).length,
    subsectionCandidateRows: rows.filter((r) => r.candidateConfidence !== "none").length,
    highConfidenceSubsectionCandidateRows: rows.filter((r) => r.candidateConfidence === "high")
      .length,
    mediumConfidenceSubsectionCandidateRows: rows.filter((r) => r.candidateConfidence === "medium")
      .length,
    lowConfidenceSubsectionCandidateRows: rows.filter((r) => r.candidateConfidence === "low").length,
    noSubsectionCandidateRows: rows.filter((r) => r.candidateConfidence === "none").length,
    stillNeedsManualReviewRows: rows.filter((r) => r.needsManualReview).length,
    rowsWithCompetingCandidates: rows.filter((r) => r.competingCandidates).length,
  };

  const byCode = (code) => rows.filter((r) => r.sequencingSuspicionCodes.includes(code));

  const payload = {
    generatedAt: new Date().toISOString(),
    phase: "4B-3-math-row-subsection-candidates",
    meta: {
      ownerGate:
        "No Math content edits until owner approves a concrete correction batch — candidates are not curriculum sign-off.",
      namingNote:
        "Do not treat catalog mapping as exact subsection approval; rows remain advisory until PDF cross-check.",
      exactSubsectionAnchoredTerminology:
        "Avoid exactSubsectionAnchored unless a human confirms stem ↔ PDF subsection — use candidateConfidence tiers only.",
    },
    summary,
    sequencingHistogram: rows.reduce((acc, r) => {
      for (const c of r.sequencingSuspicionCodes) acc[c] = (acc[c] || 0) + 1;
      return acc;
    }, {}),
    priorityQueues: {
      equationsExpressionsPossiblyEarly: byCode("equations_expressions_possibly_early").slice(
        0,
        40
      ),
      fractionsDepthUnclearLowGrade: byCode("fractions_depth_unclear_low_grade").slice(0, 40),
      decimalsPossiblyEarly: byCode("decimals_possibly_early").slice(0, 40),
      wordProblemDifficultyMismatchLowGrade: byCode(
        "word_problem_difficulty_mismatch_low_grade"
      ).slice(0, 40),
      noSubsectionCandidate: rows.filter((r) => r.candidateConfidence === "none").slice(0, 40),
      multipleCompetingCandidates: rows.filter((r) => r.competingCandidates).slice(0, 40),
    },
    rows,
  };

  if (writeFiles) {
    await mkdir(OUT_DIR, { recursive: true });
    const jsonPath = join(OUT_DIR, "math-row-subsection-candidates.json");
    const mdPath = join(OUT_DIR, "math-row-subsection-candidates.md");

    function sampleTable(list) {
      if (!list.length) return "_None_\n";
      const lines = [
        `| g | normalizedTopicKey | candidateConfidence | candidates | preview |`,
        `|--|-------------------|---------------------|------------|---------|`,
      ];
      for (const r of list) {
        lines.push(
          `| ${r.grade} | \`${r.normalizedTopicKey}\` | ${r.candidateConfidence} | ${(r.candidateSubsectionKeys || []).join("; ") || "—"} | ${(r.textPreview || "").slice(0, 56).replace(/\|/g, "/")}… |`
        );
      }
      return lines.join("\n");
    }

    const pq = payload.priorityQueues;
    const md = [
      `# Math row subsection candidates (Phase 4B-3)`,
      ``,
      `- Generated: ${payload.generatedAt}`,
      ``,
      `## Summary metrics`,
      ``,
      `| Metric | Count |`,
      `|--------|------:|`,
      `| Total Math rows | ${summary.totalMathRows} |`,
      `| **gradePdfAnchoredRows** | ${summary.gradePdfAnchoredRows} |`,
      `| **subsectionCandidateRows** (any candidate) | ${summary.subsectionCandidateRows} |`,
      `| **highConfidenceSubsectionCandidateRows** | ${summary.highConfidenceSubsectionCandidateRows} |`,
      `| **mediumConfidenceSubsectionCandidateRows** | ${summary.mediumConfidenceSubsectionCandidateRows} |`,
      `| **lowConfidenceSubsectionCandidateRows** | ${summary.lowConfidenceSubsectionCandidateRows} |`,
      `| **noSubsectionCandidateRows** | ${summary.noSubsectionCandidateRows} |`,
      `| **stillNeedsManualReviewRows** | ${summary.stillNeedsManualReviewRows} |`,
      `| Rows with **competing** subsection candidates | ${summary.rowsWithCompetingCandidates} |`,
      ``,
      `## Top sequencing review queues (samples)`,
      ``,
      `### equations_expressions_possibly_early (${byCode("equations_expressions_possibly_early").length} total)`,
      sampleTable(pq.equationsExpressionsPossiblyEarly),
      ``,
      `### fractions_depth_unclear_low_grade (${byCode("fractions_depth_unclear_low_grade").length} total)`,
      sampleTable(pq.fractionsDepthUnclearLowGrade),
      ``,
      `### decimals_possibly_early (${byCode("decimals_possibly_early").length} total)`,
      sampleTable(pq.decimalsPossiblyEarly),
      ``,
      `### word_problem_difficulty_mismatch_low_grade (${byCode("word_problem_difficulty_mismatch_low_grade").length} total)`,
      sampleTable(pq.wordProblemDifficultyMismatchLowGrade),
      ``,
      `### No subsection candidate (first 40)`,
      sampleTable(pq.noSubsectionCandidate),
      ``,
      `### Multiple competing candidates (first 40)`,
      sampleTable(pq.multipleCompetingCandidates),
      ``,
      `Full data: **math-row-subsection-candidates.json**`,
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
  await buildMathRowSubsectionCandidates({ writeFiles: true });
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
