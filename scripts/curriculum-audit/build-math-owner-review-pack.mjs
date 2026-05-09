/**
 * Phase 4B-4 — Math owner review pack (small, reviewable slice of subsection candidates).
 * Reports only — no question banks or UI.
 */
import { readFileSync, existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { MATH_OFFICIAL_SUBSECTION_CATALOG } from "../../utils/curriculum-audit/math-official-subsection-catalog.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT_DIR = join(ROOT, "reports", "curriculum-audit");

const PATHS = {
  candidates: join(OUT_DIR, "math-row-subsection-candidates.json"),
  catalog: join(OUT_DIR, "math-official-subsection-catalog.json"),
  inventory: join(OUT_DIR, "question-inventory.json"),
  subtopic: join(OUT_DIR, "math-subtopic-alignment-review.json"),
};

const SEQUENCING_CODES = [
  "equations_expressions_possibly_early",
  "fractions_depth_unclear_low_grade",
  "decimals_possibly_early",
  "word_problem_difficulty_mismatch_low_grade",
];

const BROAD_TOPIC_KEYS = new Set([
  "math.word_problems",
  "math.mixed_operations",
]);

/**
 * @typedef {'missing_catalog_coverage_grade_gap'|'missing_catalog_coverage_global'|'normalizer_mismatch'|'generated_topic_not_in_official_catalog'|'topic_too_broad'|'requires_human_mapping'} NoCandReason
 */

function loadJson(path, label) {
  if (!existsSync(path)) throw new Error(`Missing ${label}: ${path}`);
  return JSON.parse(readFileSync(path, "utf8"));
}

function buildCatalogKeyIndex() {
  /** @type {Record<number, Set<string>>} */
  const byGrade = {};
  const anyGrade = new Set();
  for (let g = 1; g <= 6; g++) {
    const slot = MATH_OFFICIAL_SUBSECTION_CATALOG[`grade_${g}`];
    const set = new Set();
    for (const sec of slot.sections || []) {
      for (const k of sec.mapsToNormalizedKeys || []) {
        set.add(k);
        anyGrade.add(k);
      }
    }
    byGrade[g] = set;
  }
  return { byGrade, anyGrade };
}

function isGeneratorLikeSource(sourceFile) {
  const s = String(sourceFile || "").toLowerCase();
  return s.includes("#sample") || s.includes("generator") || s.includes("harness");
}

/**
 * @param {object} row
 * @param {{ byGrade: Record<number, Set<string>>, anyGrade: Set<string> }} idx
 * @returns {NoCandReason}
 */
function likelyNoCandidateReason(row, idx) {
  const k = row.normalizedTopicKey || "";
  const g = Number(row.grade);
  if (k.includes(".unmapped") || k.includes("unmapped")) return "normalizer_mismatch";
  if (BROAD_TOPIC_KEYS.has(k)) return "topic_too_broad";
  if (!Number.isFinite(g) || g < 1 || g > 6) return "requires_human_mapping";

  const inThisGrade = idx.byGrade[g].has(k);
  const inSomeGrade = idx.anyGrade.has(k);
  if (inThisGrade) return "requires_human_mapping";

  if (isGeneratorLikeSource(row.sourceFile) && !inSomeGrade) {
    return "generated_topic_not_in_official_catalog";
  }
  if (!inSomeGrade) return "missing_catalog_coverage_global";
  return "missing_catalog_coverage_grade_gap";
}

/**
 * @param {string} code
 * @param {object} row
 */
function proposedSequencingDecision(code, row) {
  if (row.candidateConfidence === "none") return "needs_subsection_mapping";
  if (code === "equations_expressions_possibly_early" || code === "decimals_possibly_early") {
    return "needs_grade_check";
  }
  if (
    code === "fractions_depth_unclear_low_grade" ||
    code === "word_problem_difficulty_mismatch_low_grade"
  ) {
    return "needs_depth_check";
  }
  return "possible_future_edit_after_owner_approval";
}

function expandSequencingQueue(rows, code) {
  const out = [];
  for (const row of rows) {
    if (!(row.sequencingSuspicionCodes || []).includes(code)) continue;
    out.push({
      questionId: row.questionId,
      grade: row.grade,
      rawTopic: row.rawTopic,
      normalizedTopicKey: row.normalizedTopicKey,
      difficulty: row.difficulty,
      textPreview: row.textPreview,
      candidateSubsectionKeys: row.candidateSubsectionKeys,
      suspicionCode: code,
      sourceFile: row.sourceFile,
      proposedReviewDecision: proposedSequencingDecision(code, row),
    });
  }
  return out;
}

function gradeReadiness(total, noCand, highMed) {
  if (total === 0) return "not_ready";
  const noFrac = noCand / total;
  const strongFrac = highMed / total;
  if (noFrac >= 0.35 || strongFrac < 0.35) return "source_ready_but_needs_mapping";
  return "candidate_ready_for_manual_review";
}

function topKeys(counts, n = 12) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k, v]) => ({ key: k, count: v }));
}

export async function buildMathOwnerReviewPack(opts = {}) {
  const writeFiles = opts.writeFiles !== false;
  const candidatesPayload = loadJson(PATHS.candidates, "math-row-subsection-candidates");
  loadJson(PATHS.catalog, "math-official-subsection-catalog");
  const inventoryPayload = loadJson(PATHS.inventory, "question-inventory");
  const subtopicPayload = loadJson(PATHS.subtopic, "math-subtopic-alignment-review");

  const rows = candidatesPayload.rows || [];
  const summary = candidatesPayload.summary || {};
  const idx = buildCatalogKeyIndex();

  const sequencingCounts = {};
  for (const code of SEQUENCING_CODES) {
    sequencingCounts[code] = rows.filter((r) =>
      (r.sequencingSuspicionCodes || []).includes(code)
    ).length;
  }

  const sequencingQueues = {};
  for (const code of SEQUENCING_CODES) {
    const full = expandSequencingQueue(rows, code);
    sequencingQueues[code] = {
      suspicionCode: code,
      count: full.length,
      samples: full.slice(0, 35),
    };
  }

  const noCandRows = rows.filter((r) => r.candidateConfidence === "none");
  const noCandWithReason = noCandRows.map((r) => ({
    questionId: r.questionId,
    grade: r.grade,
    rawTopic: r.rawTopic,
    normalizedTopicKey: r.normalizedTopicKey,
    sourceFile: r.sourceFile,
    difficulty: r.difficulty,
    textPreview: r.textPreview,
    likelyReason: likelyNoCandidateReason(r, idx),
    normalizationConfidence: r.normalizationConfidence,
  }));

  const reasonHistogram = noCandWithReason.reduce((acc, r) => {
    acc[r.likelyReason] = (acc[r.likelyReason] || 0) + 1;
    return acc;
  }, {});

  const noCandByGrade = {};
  const noCandByTopic = {};
  const noCandByNormKey = {};
  for (const r of noCandWithReason) {
    noCandByGrade[r.grade] = (noCandByGrade[r.grade] || 0) + 1;
    const rt = r.rawTopic || "(empty)";
    noCandByTopic[rt] = (noCandByTopic[rt] || 0) + 1;
    const nk = r.normalizedTopicKey || "(empty)";
    noCandByNormKey[nk] = (noCandByNormKey[nk] || 0) + 1;
  }

  const competingRows = rows.filter((r) => r.competingCandidates);
  const competingByGroup = {};
  for (const r of competingRows) {
    const key = `${r.grade}|${r.normalizedTopicKey}`;
    if (!competingByGroup[key]) {
      competingByGroup[key] = {
        grade: r.grade,
        normalizedTopicKey: r.normalizedTopicKey,
        rawTopic: r.rawTopic,
        candidateKeysSeen: new Set(),
        rows: [],
        ambiguity:
          "Multiple catalog sections list the same normalized topic key for this grade — PDF cross-check needed to pick one subsection.",
      };
    }
    const g = competingByGroup[key];
    for (const k of r.candidateSubsectionKeys || []) g.candidateKeysSeen.add(k);
    g.rows.push({
      questionId: r.questionId,
      difficulty: r.difficulty,
      sourceFile: r.sourceFile,
      textPreview: r.textPreview,
      candidateSubsectionKeys: r.candidateSubsectionKeys,
    });
  }

  const competingGroups = Object.values(competingByGroup).map((g) => ({
    grade: g.grade,
    normalizedTopicKey: g.normalizedTopicKey,
    rawTopic: g.rawTopic,
    ambiguity: g.ambiguity,
    distinctCandidateKeys: [...g.candidateKeysSeen].sort(),
    rowCount: g.rows.length,
    rows: g.rows,
  }));

  const highConfRows = rows.filter((r) => r.candidateConfidence === "high").map((r) => ({
    questionId: r.questionId,
    grade: r.grade,
    rawTopic: r.rawTopic,
    normalizedTopicKey: r.normalizedTopicKey,
    difficulty: r.difficulty,
    candidateSubsectionKeys: r.candidateSubsectionKeys,
    candidateConfidence: r.candidateConfidence,
    sourceFile: r.sourceFile,
    textPreview: r.textPreview,
    sequencingSuspicionCodes: r.sequencingSuspicionCodes,
    note:
      "Sanity-check row — high catalog tier only; not approved for content edits until owner verifies stem vs PDF.",
  }));

  /** @type {Record<number, object>} */
  const gradeStats = {};
  for (let g = 1; g <= 6; g++) {
    gradeStats[g] = {
      totalRows: 0,
      high: 0,
      medium: 0,
      low: 0,
      none: 0,
      suspicionCodes: {},
    };
  }
  for (const r of rows) {
    const g = Number(r.grade);
    if (!Number.isFinite(g) || g < 1 || g > 6) continue;
    const gs = gradeStats[g];
    gs.totalRows++;
    const tier = r.candidateConfidence;
    if (tier === "high") gs.high++;
    else if (tier === "medium") gs.medium++;
    else if (tier === "low") gs.low++;
    else gs.none++;
    for (const c of r.sequencingSuspicionCodes || []) {
      gs.suspicionCodes[c] = (gs.suspicionCodes[c] || 0) + 1;
    }
  }

  const gradeSummaries = {};
  for (let g = 1; g <= 6; g++) {
    const gs = gradeStats[g];
    const topicCounts = {};
    for (const r of rows) {
      if (Number(r.grade) !== g) continue;
      const k = r.normalizedTopicKey || "";
      topicCounts[k] = (topicCounts[k] || 0) + 1;
    }
    const highMed = gs.high + gs.medium;
    gradeSummaries[g] = {
      grade: g,
      totalRows: gs.totalRows,
      candidateTiers: {
        high: gs.high,
        medium: gs.medium,
        low: gs.low,
        none: gs.none,
      },
      topNormalizedTopicKeys: topKeys(topicCounts, 15),
      topSuspicionCodes: topKeys(gs.suspicionCodes, 12),
      readinessLevel: gradeReadiness(gs.totalRows, gs.none, highMed),
    };
  }

  const sourceFileImpact = {};
  for (const r of rows) {
    const sf = r.sourceFile || "(unknown)";
    sourceFileImpact[sf] = (sourceFileImpact[sf] || 0) + 1;
  }
  const sourceFilesSorted = Object.entries(sourceFileImpact)
    .sort((a, b) => b[1] - a[1])
    .map(([sourceFile, rowCount]) => ({ sourceFile, rowCount }));

  const inventoryMeta = {
    generatedAt: inventoryPayload.generatedAt || null,
    recordCount: (inventoryPayload.records || []).length,
  };

  const payload = {
    generatedAt: new Date().toISOString(),
    phase: "4B-4-math-owner-review-pack",
    meta: {
      ownerGate:
        "No Math question-bank edits, grade moves, enrichment labels, or copy changes until the owner explicitly approves a concrete batch — this pack is for inspection only.",
      notApproved:
        "High-confidence subsection candidates are a sanity check on automation, not curriculum or product approval.",
      inputs: PATHS,
      inventoryMeta,
      subtopicAlignmentSummary: subtopicPayload.summary || null,
      subtopicAlignmentMeta: subtopicPayload.meta || null,
    },
    executiveSummary: {
      totalMathRows: summary.totalMathRows ?? rows.length,
      highConfidenceSubsectionCandidateRows:
        summary.highConfidenceSubsectionCandidateRows ?? 0,
      mediumConfidenceSubsectionCandidateRows:
        summary.mediumConfidenceSubsectionCandidateRows ?? 0,
      lowConfidenceSubsectionCandidateRows:
        summary.lowConfidenceSubsectionCandidateRows ?? 0,
      noSubsectionCandidateRows: summary.noSubsectionCandidateRows ?? 0,
      stillNeedsManualReviewRows: summary.stillNeedsManualReviewRows ?? rows.length,
      contentEditsApproved: false,
      note: "All rows remain advisory; Phase 4B-4 does not authorize corrections.",
    },
    sequencingQueues,
    sequencingCounts,
    noSubsectionCandidate: {
      totalRows: noCandWithReason.length,
      summaryByLikelyReason: reasonHistogram,
      summaryByGrade: noCandByGrade,
      summaryByRawTopic: topKeys(noCandByTopic, 50),
      summaryByNormalizedKey: topKeys(noCandByNormKey, 50),
      rowsFull: noCandWithReason,
      markdownSampleLimit: 100,
    },
    competingCandidates: {
      totalRows: competingRows.length,
      groups: competingGroups,
    },
    highConfidenceSanitySet: {
      count: highConfRows.length,
      notApprovedDisclaimer:
        "These rows are not approved — verify each stem against the official grade PDF before any edit.",
      rows: highConfRows,
    },
    gradeSummaries,
    sourceFilesImpactPreview: {
      description:
        "Inventory source paths that would be touched if future edits are approved — listing does not imply edits are authorized.",
      uniqueSourceFileCount: sourceFilesSorted.length,
      byRowCount: sourceFilesSorted,
    },
    ownerDecisionChecklist: {
      purpose:
        "Before any content change, the owner must record explicit approval for scope — automation cannot substitute.",
      requiredApprovals: [
        "Target grade band (e.g. grade 3 only, or grades 1–2).",
        "Target topic / normalized key / subsection area.",
        "Action type: edit stem, move grade, mark enrichment/exposure, or leave unchanged.",
        "Sample questionIds reviewed from this pack or successor reports.",
        "Confirmation that duplication policy and generator-sample rules from audit docs still apply.",
      ],
      prohibitedWithoutApproval: [
        "Bulk edits from queue counts alone",
        "Deleting duplicates solely because they appear in duplicates-review",
        "UI or Hebrew learner-facing product copy changes via audit tooling",
      ],
    },
  };

  if (writeFiles) {
    await mkdir(OUT_DIR, { recursive: true });
    const jsonPath = join(OUT_DIR, "math-owner-review-pack.json");
    const mdPath = join(OUT_DIR, "math-owner-review-pack.md");
    await writeFile(jsonPath, JSON.stringify(payload, null, 2), "utf8");
    await writeFile(mdPath, markdownReport(payload), "utf8");
    console.log(`Wrote ${jsonPath}`);
    console.log(`Wrote ${mdPath}`);
  }

  return payload;
}

function markdownReport(p) {
  const es = p.executiveSummary;
  const lines = [
    `# Math owner review pack (Phase 4B-4)`,
    ``,
    `- Generated: ${p.generatedAt}`,
    ``,
    `## 1. Executive summary`,
    ``,
    `| Metric | Value |`,
    `|--------|------:|`,
    `| Total Math rows | ${es.totalMathRows} |`,
    `| High-confidence subsection candidates | ${es.highConfidenceSubsectionCandidateRows} |`,
    `| Medium-confidence subsection candidates | ${es.mediumConfidenceSubsectionCandidateRows} |`,
    `| Low-confidence subsection candidates | ${es.lowConfidenceSubsectionCandidateRows} |`,
    `| No subsection candidate | ${es.noSubsectionCandidateRows} |`,
    `| Still need manual review | ${es.stillNeedsManualReviewRows} |`,
    `| **Content edits approved** | **${es.contentEditsApproved ? "yes" : "no"}** |`,
    ``,
    `${es.note}`,
    ``,
    `### Phase 4B-2 alignment snapshot (reference)`,
    ``,
    `- needsSubsectionReviewRows: ${p.meta.subtopicAlignmentSummary?.needsSubsectionReviewRows ?? "—"}`,
    `- gradePdfAnchoredRows: ${p.meta.subtopicAlignmentSummary?.gradePdfAnchoredRows ?? "—"}`,
    `- exactSubsectionAnchoredRows: ${p.meta.subtopicAlignmentSummary?.exactSubsectionAnchoredRows ?? "—"}`,
    ``,
    `## 2.A Sequencing suspicion queues`,
    ``,
  ];

  for (const code of SEQUENCING_CODES) {
    const q = p.sequencingQueues[code];
    lines.push(`### \`${code}\` (${q.count} rows)`, ``);
    lines.push(
      `| questionId | g | rawTopic | normKey | diff | candidates | decision | sourceFile | preview |`,
      `|------------|--|----------|---------|------|------------|----------|------------|---------|`
    );
    for (const r of q.samples) {
      const prev = String(r.textPreview || "").replace(/\|/g, "/").slice(0, 40);
      const cands = (r.candidateSubsectionKeys || []).join("; ") || "—";
      const qid = r.questionId.length > 18 ? `${r.questionId.slice(0, 18)}…` : r.questionId;
      lines.push(
        `| \`${qid}\` | ${r.grade} | ${String(r.rawTopic).slice(0, 14)} | \`${r.normalizedTopicKey}\` | ${r.difficulty} | ${cands} | ${r.proposedReviewDecision} | ${String(r.sourceFile).slice(0, 32)}… | ${prev}… |`
      );
    }
    lines.push(``, `_Rows above share suspicion code \`${code}\` (see JSON for full sample fields: \`suspicionCode\`, \`textPreview\`)._`, ``);
  }

  lines.push(`## 2.B No subsection candidate (${p.noSubsectionCandidate.totalRows} rows)`, ``);
  lines.push(`### Likely reason counts`, ``);
  lines.push(`| Reason | Count |`);
  lines.push(`|--------|------:|`);
  for (const [reason, n] of Object.entries(p.noSubsectionCandidate.summaryByLikelyReason).sort(
    (a, b) => b[1] - a[1]
  )) {
    lines.push(`| ${reason} | ${n} |`);
  }
  lines.push(``, `### Top raw topics (no-candidate)`, ``);
  for (const t of p.noSubsectionCandidate.summaryByRawTopic.slice(0, 20)) {
    lines.push(`- \`${t.key}\`: ${t.count}`);
  }
  lines.push(``, `### Sample — first ${p.noSubsectionCandidate.markdownSampleLimit} rows (full list in JSON)`, ``);
  lines.push(
    `| g | rawTopic | normKey | likely reason | diff | sourceFile |`,
    `|---|---------|---------|---------------|------|------------|`
  );
  for (const r of p.noSubsectionCandidate.rowsFull.slice(0, p.noSubsectionCandidate.markdownSampleLimit)) {
    lines.push(
      `| ${r.grade} | ${String(r.rawTopic).slice(0, 24)} | \`${r.normalizedTopicKey}\` | ${r.likelyReason} | ${r.difficulty} | ${String(r.sourceFile).slice(0, 40)}… |`
    );
  }
  lines.push(``);

  lines.push(`## 2.C Competing candidates (${p.competingCandidates.totalRows} rows)`, ``);
  for (const grp of p.competingCandidates.groups) {
    lines.push(
      `### Grade ${grp.grade} — \`${grp.normalizedTopicKey}\` (${grp.rowCount} rows)`,
      ``,
      `${grp.ambiguity}`,
      ``,
      `Candidate keys overlap: ${grp.distinctCandidateKeys.map((k) => `\`${k}\``).join(", ")}`,
      ``
    );
    for (const rw of grp.rows.slice(0, 8)) {
      lines.push(
        `- \`${rw.questionId.slice(0, 14)}…\` · ${rw.difficulty} · ${(rw.textPreview || "").slice(0, 72)}…`
      );
    }
    if (grp.rows.length > 8) lines.push(`- _…${grp.rows.length - 8} more in JSON_`);
    lines.push(``);
  }

  lines.push(`## 2.D High-confidence candidate sanity set (${p.highConfidenceSanitySet.count} rows)`, ``);
  lines.push(p.highConfidenceSanitySet.notApprovedDisclaimer, ``);
  lines.push(`| g | normKey | candidates | sourceFile | preview |`);
  lines.push(`|---|---------|------------|------------|---------|`);
  for (const r of p.highConfidenceSanitySet.rows) {
    lines.push(
      `| ${r.grade} | \`${r.normalizedTopicKey}\` | ${(r.candidateSubsectionKeys || []).join("; ")} | ${String(r.sourceFile).slice(0, 48)}… | ${String(r.textPreview || "").replace(/\|/g, "/").slice(0, 52)}… |`
    );
  }
  lines.push(``);

  lines.push(`## 3. Grade-by-grade summary`, ``);
  for (let g = 1; g <= 6; g++) {
    const gs = p.gradeSummaries[g];
    lines.push(`### Grade ${g}`, ``);
    lines.push(`- **Total rows:** ${gs.totalRows}`);
    lines.push(
      `- **Candidates:** high ${gs.candidateTiers.high}, medium ${gs.candidateTiers.medium}, low ${gs.candidateTiers.low}, none ${gs.candidateTiers.none}`
    );
    lines.push(`- **Readiness:** \`${gs.readinessLevel}\``);
    lines.push(`- **Top topics:** ${gs.topNormalizedTopicKeys.slice(0, 8).map((t) => `\`${t.key}\`(${t.count})`).join(", ")}`);
    lines.push(
      `- **Top suspicion codes:** ${gs.topSuspicionCodes.length ? gs.topSuspicionCodes.map((t) => `\`${t.key}\`(${t.count})`).join(", ") : "—"}`
    );
    lines.push(``);
  }

  lines.push(`## 4. Source files impact preview`, ``);
  lines.push(p.sourceFilesImpactPreview.description, ``);
  lines.push(`| Rows | Source file |`, `|-----:|-------------|`);
  for (const { sourceFile, rowCount } of p.sourceFilesImpactPreview.byRowCount.slice(0, 45)) {
    lines.push(`| ${rowCount} | \`${sourceFile}\` |`);
  }
  if (p.sourceFilesImpactPreview.byRowCount.length > 45) {
    lines.push(`| … | _${p.sourceFilesImpactPreview.byRowCount.length - 45} more in JSON_ |`);
  }
  lines.push(``);

  lines.push(`## 5. Owner decision checklist`, ``);
  for (const item of p.ownerDecisionChecklist.requiredApprovals) {
    lines.push(`- [ ] ${item}`);
  }
  lines.push(``, `**Do not do without explicit approval:**`, ``);
  for (const x of p.ownerDecisionChecklist.prohibitedWithoutApproval) {
    lines.push(`- ${x}`);
  }
  lines.push(``, `---`, `Artifact: **math-owner-review-pack.json**`, ``);

  return lines.join("\n");
}

async function main() {
  await buildMathOwnerReviewPack({ writeFiles: true });
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
