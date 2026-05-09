/**
 * Phase 4B-5 — Map Math inventory rows to generator branches (topic=subtopic path).
 * Reports only — does not modify the generator or question banks.
 */
import { readFileSync, existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT_DIR = join(ROOT, "reports", "curriculum-audit");
const GENERATOR_PATH = join(ROOT, "utils", "math-question-generator.js");

const INPUTS = {
  ownerPack: join(OUT_DIR, "math-owner-review-pack.json"),
  candidates: join(OUT_DIR, "math-row-subsection-candidates.json"),
  catalog: join(OUT_DIR, "math-official-subsection-catalog.json"),
  inventory: join(OUT_DIR, "question-inventory.json"),
};

const SEQUENCING_CODES = [
  "equations_expressions_possibly_early",
  "fractions_depth_unclear_low_grade",
  "decimals_possibly_early",
  "word_problem_difficulty_mismatch_low_grade",
];

/** @typedef {'no_change'|'improve_metadata'|'improve_subsection_catalog'|'adjust_generator_grade_gate'|'split_generator_by_grade_depth'|'owner_manual_review_required'} FutureAction */

function loadJson(path, label) {
  if (!existsSync(path)) throw new Error(`Missing ${label}: ${path}`);
  return JSON.parse(readFileSync(path, "utf8"));
}

function harnessSlot(sourceFile) {
  const s = String(sourceFile || "");
  if (s.includes("#audit_force_sample")) return "audit_force_sample";
  if (s.includes("#sample")) return "sample";
  return "other";
}

function branchKey(topic, subtopic) {
  const t = String(topic || "").trim() || "_";
  const st = String(subtopic || "").trim() || "_";
  return `${t}::${st}`;
}

/**
 * Read-only scan of generator source for routing vocabulary (documentation).
 */
function analyzeGeneratorSource(absPath) {
  const text = readFileSync(absPath, "utf8");
  const selectedOps = new Set();
  let m;
  const reOp = /selectedOp\s*===\s*"([^"]+)"/g;
  while ((m = reOp.exec(text))) selectedOps.add(m[1]);
  const reElseIf = /\}\s*else if\s*\(\s*selectedOp\s*===\s*"([^"]+)"/g;
  while ((m = reElseIf.exec(text))) selectedOps.add(m[1]);

  const declaredKinds = new Set();
  const reKind = /\bkind:\s*"([^"]+)"/g;
  while ((m = reKind.exec(text))) {
    if (!m[1].includes("${") && !m[1].includes("\n")) declaredKinds.add(m[1]);
  }

  return {
    generatorPath: "utils/math-question-generator.js",
    selectedOpsReferenced: [...selectedOps].sort(),
    declaredParamKindsSample: [...declaredKinds].sort().slice(0, 200),
    declaredParamKindsTotal: declaredKinds.size,
  };
}

function increment(map, key, delta = 1) {
  map[key] = (map[key] || 0) + delta;
}

/**
 * @param {object[]} branchRows — enriched rows for one branch
 */
function classifyBranch(branchRows) {
  const n = branchRows.length;
  if (n === 0) {
    return {
      likelyRootCause: "requires_human_review",
      recommendedFutureAction: /** @type {FutureAction} */ ("owner_manual_review_required"),
      rationale: "empty branch",
    };
  }

  let unmapped = 0;
  let noCand = 0;
  let competing = 0;
  const seqTotals = {};
  let high = 0;
  let medium = 0;
  let low = 0;

  for (const r of branchRows) {
    const nk = String(r.normalizedTopicKey || "");
    if (nk.includes("unmapped")) unmapped++;
    if (r.candidateConfidence === "none") noCand++;
    if (r.competingCandidates) competing++;
    if (r.candidateConfidence === "high") high++;
    if (r.candidateConfidence === "medium") medium++;
    if (r.candidateConfidence === "low") low++;
    for (const c of r.sequencingSuspicionCodes || []) increment(seqTotals, c);
  }

  const unmappedShare = unmapped / n;
  const noCandShare = noCand / n;
  const competingShare = competing / n;
  const seqCount = SEQUENCING_CODES.reduce((a, c) => a + (seqTotals[c] || 0), 0);
  const sequencingShare = seqCount / n;

  const topSeqCode = SEQUENCING_CODES.map((c) => ({ code: c, count: seqTotals[c] || 0 })).sort(
    (a, b) => b.count - a.count
  )[0];

  if (unmappedShare >= 0.15) {
    return {
      likelyRootCause: "normalizer_mismatch",
      recommendedFutureAction: /** @type {FutureAction} */ ("improve_metadata"),
      rationale: `${Math.round(unmappedShare * 100)}% rows use unmapped/low-confidence normalized keys — topic/subtopic labels vs normalizer.`,
    };
  }

  if (noCandShare >= 0.4) {
    return {
      likelyRootCause: "subsection_catalog_coverage_gap",
      recommendedFutureAction: /** @type {FutureAction} */ ("improve_subsection_catalog"),
      rationale: `${Math.round(noCandShare * 100)}% rows lack subsection candidates — extend catalog mapsToNormalizedKeys for affected grades.`,
    };
  }

  if (competingShare >= 0.15) {
    return {
      likelyRootCause: "subsection_catalog_coverage_gap",
      recommendedFutureAction: /** @type {FutureAction} */ ("owner_manual_review_required"),
      rationale: `${Math.round(competingShare * 100)}% rows hit overlapping catalog sections — refine maps or PDF-backed subsection IDs.`,
    };
  }

  if (sequencingShare > 0) {
    const code = topSeqCode?.code;
    if (code === "equations_expressions_possibly_early" || code === "decimals_possibly_early") {
      return {
        likelyRootCause: "real_generator_sequencing_issue",
        recommendedFutureAction: /** @type {FutureAction} */ ("adjust_generator_grade_gate"),
        rationale: `Sequencing flags (${code}) — compare harness grade/opAllow vs ministry PDF progression.`,
      };
    }
    if (code === "fractions_depth_unclear_low_grade") {
      return {
        likelyRootCause: "acceptable_spiral_practice",
        recommendedFutureAction: /** @type {FutureAction} */ ("split_generator_by_grade_depth"),
        rationale:
          "Fraction items in low grades may be intentional shallow spiral — split depth bands if stems exceed programme.",
      };
    }
    if (code === "word_problem_difficulty_mismatch_low_grade") {
      return {
        likelyRootCause: "metadata_topic_labeling_issue",
        recommendedFutureAction: /** @type {FutureAction} */ ("improve_metadata"),
        rationale: "Hard-labelled word problems in early grades — verify difficulty tagging vs stem.",
      };
    }
    return {
      likelyRootCause: "requires_human_review",
      recommendedFutureAction: /** @type {FutureAction} */ ("owner_manual_review_required"),
      rationale: "Mixed sequencing signals — manual review before generator changes.",
    };
  }

  if ((high + medium) / n >= 0.85 && noCand === 0 && competing === 0) {
    return {
      likelyRootCause: "acceptable_spiral_practice",
      recommendedFutureAction: /** @type {FutureAction} */ ("no_change"),
      rationale: "Strong subsection candidates and no sequencing flags in this branch sample.",
    };
  }

  return {
    likelyRootCause: "requires_human_review",
    recommendedFutureAction: /** @type {FutureAction} */ ("owner_manual_review_required"),
    rationale: "Default — inspect stems vs PDF before changing generator or catalog.",
  };
}

function pickPreviews(rows, limit = 6) {
  const out = [];
  const seen = new Set();
  for (const r of rows) {
    const p = String(r.textPreview || "").trim();
    if (!p || seen.has(p)) continue;
    seen.add(p);
    out.push(p.slice(0, 140));
    if (out.length >= limit) break;
  }
  return out;
}

export async function buildMathGeneratorBranchMapping(opts = {}) {
  const writeFiles = opts.writeFiles !== false;

  const ownerPack = loadJson(INPUTS.ownerPack, "math-owner-review-pack");
  const candidatesPayload = loadJson(INPUTS.candidates, "math-row-subsection-candidates");
  loadJson(INPUTS.catalog, "math-official-subsection-catalog");
  const inventoryPayload = loadJson(INPUTS.inventory, "question-inventory");

  const generatorAnalysis = analyzeGeneratorSource(GENERATOR_PATH);

  const rows = candidatesPayload.rows || [];
  const invById = new Map(
    (inventoryPayload.records || []).filter((r) => r.subject === "math").map((r) => [r.questionId, r])
  );

  /** @type {Map<string, object[]>} */
  const byBranch = new Map();

  for (const r of rows) {
    const inv = invById.get(r.questionId);
    const topic = inv?.topic ?? r.rawTopic ?? "";
    const subtopic = inv?.subtopic ?? r.rawSubtopic ?? "";
    const bk = branchKey(topic, subtopic);
    const enriched = {
      ...r,
      inventoryTopic: topic,
      inventorySubtopic: subtopic,
      harnessSlot: harnessSlot(r.sourceFile || inv?.sourceFile),
    };
    if (!byBranch.has(bk)) byBranch.set(bk, []);
    byBranch.get(bk).push(enriched);
  }

  /** @type {object[]} */
  const branches = [];

  for (const [bk, branchRows] of [...byBranch.entries()].sort((a, b) => b[1].length - a[1].length)) {
    const [topic, subtopic] = bk.split("::");
    const grades = [...new Set(branchRows.map((x) => x.grade).filter(Number.isFinite))].sort(
      (a, b) => a - b
    );
    const harnessSlots = branchRows.reduce((acc, r) => {
      increment(acc, r.harnessSlot || "other");
      return acc;
    }, {});

    const sequencingByCode = {};
    for (const c of SEQUENCING_CODES) {
      sequencingByCode[c] = branchRows.filter((x) =>
        (x.sequencingSuspicionCodes || []).includes(c)
      ).length;
    }

    const noSubCount = branchRows.filter((x) => x.candidateConfidence === "none").length;
    const competingCount = branchRows.filter((x) => x.competingCandidates).length;

    const candKeySet = new Set();
    for (const x of branchRows) {
      for (const k of x.candidateSubsectionKeys || []) candKeySet.add(k);
    }

    const classification = classifyBranch(branchRows);

    branches.push({
      branchKey: bk,
      generatorBranchLabel: `${topic} / ${subtopic}`,
      inferredSelectedOp: topic,
      inferredParamsKind: subtopic === "_" ? "" : subtopic,
      harnessSlots,
      rowCount: branchRows.length,
      gradesPresent: grades,
      sequencingByCode,
      sequencingSuspicionRowCount: branchRows.filter(
        (x) => (x.sequencingSuspicionCodes || []).length > 0
      ).length,
      noSubsectionCandidateCount: noSubCount,
      competingCandidatesCount: competingCount,
      candidateSubsectionKeysObserved: [...candKeySet].sort(),
      samplePreviews: pickPreviews(branchRows, 8),
      suspicionCodesPresent: SEQUENCING_CODES.filter((c) => sequencingByCode[c] > 0),
      likelyRootCause: classification.likelyRootCause,
      recommendedFutureAction: classification.recommendedFutureAction,
      classificationRationale: classification.rationale,
    });
  }

  const branchesWithSequencing = branches.filter((b) => b.sequencingSuspicionRowCount > 0);
  const branchesNoCand = branches.filter((b) => b.noSubsectionCandidateCount > 0);
  const branchesCompeting = branches.filter((b) => b.competingCandidatesCount > 0);

  const safeNoChangeBranches = branches.filter(
    (b) =>
      b.recommendedFutureAction === "no_change" &&
      b.noSubsectionCandidateCount === 0 &&
      b.competingCandidatesCount === 0
  );

  const futureEditCandidates = branches.filter((b) => b.recommendedFutureAction !== "no_change");

  const ownerManualReviewBranches = branches.filter(
    (b) => b.recommendedFutureAction === "owner_manual_review_required"
  );

  const actionHistogram = branches.reduce((acc, b) => {
    increment(acc, b.recommendedFutureAction);
    return acc;
  }, {});

  const rootCauseHistogram = branches.reduce((acc, b) => {
    increment(acc, b.likelyRootCause);
    return acc;
  }, {});

  const sequencingByBranchTable = branchesWithSequencing
    .map((b) => ({
      branchKey: b.branchKey,
      generatorBranchLabel: b.generatorBranchLabel,
      rowCount: b.rowCount,
      sequencingByCode: b.sequencingByCode,
    }))
    .sort((a, b) => b.rowCount - a.rowCount);

  const suspicionTotalsFromCandidates = rows.reduce(
    (acc, r) => {
      for (const c of r.sequencingSuspicionCodes || []) increment(acc, c);
      return acc;
    },
    {}
  );

  const payload = {
    generatedAt: new Date().toISOString(),
    phase: "4B-5-math-generator-branch-mapping",
    meta: {
      ownerGate:
        "Math inventory is generator-driven (harness samples). Any future fix targets generator branches, metadata, or catalog mapping — not static bank rows. No edits applied by this report.",
      inputs: INPUTS,
      generatorSourceAnalyzed: generatorAnalysis.generatorPath,
      executiveCrossCheck: ownerPack.executiveSummary || null,
    },
    generatorSourceImpact: {
      note: "All Math rows originate from deterministic harness sampling of utils/math-question-generator.js — see inventory sourceFile (#sample / #audit_force_sample).",
      inventoryMathRows: (inventoryPayload.records || []).filter((r) => r.subject === "math").length,
      generatorAnalysis,
    },
    summary: {
      distinctBranches: branches.length,
      totalMathRows: rows.length,
      branchesWithSequencingSuspicion: branchesWithSequencing.length,
      branchesWithNoSubsectionCandidate: branchesNoCand.length,
      branchesWithCompetingCandidates: branchesCompeting.length,
      safeNoChangeBranchCount: safeNoChangeBranches.length,
      futureEditCandidateBranchCount: futureEditCandidates.length,
      ownerManualReviewBranchCount: ownerManualReviewBranches.length,
      recommendedFutureActionByBranch: actionHistogram,
      likelyRootCauseByBranch: rootCauseHistogram,
      globalSequencingCodeCounts: suspicionTotalsFromCandidates,
    },
    branches,
    priorityViews: {
      sequencingSuspicionBranches: sequencingByBranchTable,
      noSubsectionCandidateBranches: branchesNoCand
        .sort((a, b) => b.noSubsectionCandidateCount - a.noSubsectionCandidateCount)
        .map((b) => ({
          branchKey: b.branchKey,
          generatorBranchLabel: b.generatorBranchLabel,
          noSubsectionCandidateCount: b.noSubsectionCandidateCount,
          rowCount: b.rowCount,
          recommendedFutureAction: b.recommendedFutureAction,
          likelyRootCause: b.likelyRootCause,
        })),
      competingCandidateBranches: branchesCompeting
        .sort((a, b) => b.competingCandidatesCount - a.competingCandidatesCount)
        .map((b) => ({
          branchKey: b.branchKey,
          generatorBranchLabel: b.generatorBranchLabel,
          competingCandidatesCount: b.competingCandidatesCount,
          rowCount: b.rowCount,
          recommendedFutureAction: b.recommendedFutureAction,
        })),
      safeNoChangeBranches: safeNoChangeBranches.map((b) => ({
        branchKey: b.branchKey,
        generatorBranchLabel: b.generatorBranchLabel,
        rowCount: b.rowCount,
      })),
      futureEditCandidates: futureEditCandidates.map((b) => ({
        branchKey: b.branchKey,
        generatorBranchLabel: b.generatorBranchLabel,
        rowCount: b.rowCount,
        recommendedFutureAction: b.recommendedFutureAction,
        likelyRootCause: b.likelyRootCause,
      })),
      ownerManualReviewBranches: ownerManualReviewBranches.map((b) => ({
        branchKey: b.branchKey,
        generatorBranchLabel: b.generatorBranchLabel,
        rowCount: b.rowCount,
        classificationRationale: b.classificationRationale,
      })),
    },
    ownerDecisionChecklist: {
      purpose:
        "Approve explicit scope before any generator, catalog, or metadata change — this map is planning-only.",
      items: [
        "Confirm whether changes target harness sampling (audit-question-banks), generator gates (math-question-generator), topic normalization, or subsection catalog only.",
        "Review at least one sample row per branch before approving automation-led edits.",
        "Generator edits remain off-limits until owner approves Phase 4B-5 follow-up scope.",
      ],
    },
  };

  if (writeFiles) {
    await mkdir(OUT_DIR, { recursive: true });
    const jsonPath = join(OUT_DIR, "math-generator-branch-mapping.json");
    const mdPath = join(OUT_DIR, "math-generator-branch-mapping.md");
    await writeFile(jsonPath, JSON.stringify(payload, null, 2), "utf8");
    await writeFile(mdPath, markdownReport(payload), "utf8");
    console.log(`Wrote ${jsonPath}`);
    console.log(`Wrote ${mdPath}`);
  }

  return payload;
}

function markdownReport(p) {
  const s = p.summary;
  const lines = [
    `# Math generator branch mapping (Phase 4B-5)`,
    ``,
    `- Generated: ${p.generatedAt}`,
    ``,
    `## 1. Executive summary`,
    ``,
    `- **Math rows (candidates report):** ${s.totalMathRows}`,
    `- **Distinct generator branches** (\`topic::subtopic\` from harness): **${s.distinctBranches}**`,
    `- **Branches with sequencing suspicion:** ${s.branchesWithSequencingSuspicion}`,
    `- **Branches touching no-subsection-candidate rows:** ${s.branchesWithNoSubsectionCandidate}`,
    `- **Branches with competing candidates:** ${s.branchesWithCompetingCandidates}`,
    `- **Branches classified \`no_change\` (safe cohort):** ${s.safeNoChangeBranchCount}`,
    `- **Branches flagged for future edit / review:** ${s.futureEditCandidateBranchCount}`,
    `- **Owner manual review branches:** ${s.ownerManualReviewBranchCount}`,
    ``,
    `_Inventory is generator-driven — corrections would target generator branches, metadata, or catalog mapping (not static question banks)._`,
    ``,
    `## 2. Generator source impact`,
    ``,
    `- File: \`${p.generatorSourceImpact.generatorAnalysis.generatorPath}\``,
    `- \`selectedOp\` strings referenced in source (partial): ${p.generatorSourceImpact.generatorAnalysis.selectedOpsReferenced.slice(0, 24).join(", ")}${p.generatorSourceImpact.generatorAnalysis.selectedOpsReferenced.length > 24 ? ", …" : ""}`,
    `- Approximate \`kind:\` literals parsed: **${p.generatorSourceImpact.generatorAnalysis.declaredParamKindsTotal}** (sample listed in JSON).`,
    ``,
    `## 3. Branches producing sequencing suspicions`,
    ``,
    `| Branch | Rows | eq_early | frac_low | dec_early | wp_diff_low |`,
    `|--------|-----:|---------:|---------:|----------:|--------------:|`,
  ];

  for (const b of p.priorityViews.sequencingSuspicionBranches.slice(0, 40)) {
    lines.push(
      `| \`${b.branchKey.slice(0, 42)}…\` | ${b.rowCount} | ${b.sequencingByCode.equations_expressions_possibly_early || 0} | ${b.sequencingByCode.fractions_depth_unclear_low_grade || 0} | ${b.sequencingByCode.decimals_possibly_early || 0} | ${b.sequencingByCode.word_problem_difficulty_mismatch_low_grade || 0} |`
    );
  }
  if (p.priorityViews.sequencingSuspicionBranches.length > 40) {
    lines.push(`_…${p.priorityViews.sequencingSuspicionBranches.length - 40} additional branches in JSON._`);
  }

  lines.push(
    ``,
    `## 4. Branches producing no-subsection-candidate rows`,
    ``,
    `| Branch | no-cand | rows | root cause (auto) | suggested action |`,
    `|--------|--------:|-----:|--------------------|------------------|`
  );
  for (const b of p.priorityViews.noSubsectionCandidateBranches.slice(0, 35)) {
    const full = p.branches.find((x) => x.branchKey === b.branchKey);
    lines.push(
      `| \`${b.branchKey.slice(0, 36)}…\` | ${b.noSubsectionCandidateCount} | ${b.rowCount} | ${full?.likelyRootCause ?? "—"} | ${b.recommendedFutureAction} |`
    );
  }

  lines.push(
    ``,
    `## 5. Branches producing competing candidates`,
    ``,
    `| Branch | competing | rows | suggested action |`,
    `|--------|----------:|-----:|------------------|`
  );
  for (const b of p.priorityViews.competingCandidateBranches) {
    lines.push(
      `| \`${b.branchKey.slice(0, 40)}…\` | ${b.competingCandidatesCount} | ${b.rowCount} | ${b.recommendedFutureAction} |`
    );
  }

  lines.push(
    ``,
    `## 6. Safe no-change candidates`,
    ``,
    `_Branches where automation suggests \`no_change\` and no no-candidate/competing rows._`,
    ``
  );
  for (const b of p.priorityViews.safeNoChangeBranches.slice(0, 30)) {
    lines.push(`- **${b.generatorBranchLabel}** (\`${b.branchKey}\`) — ${b.rowCount} rows`);
  }
  if (p.priorityViews.safeNoChangeBranches.length === 0) {
    lines.push(`_None — see JSON for tuned thresholds._`);
  }

  lines.push(
    ``,
    `## 7. Future edit candidates (owner approval required before implementation)`,
    ``,
    `| Branch | rows | action | root cause |`,
    `|--------|-----:|--------|------------|`
  );
  for (const b of p.priorityViews.futureEditCandidates.slice(0, 45)) {
    lines.push(
      `| \`${b.branchKey.slice(0, 38)}…\` | ${b.rowCount} | ${b.recommendedFutureAction} | ${b.likelyRootCause} |`
    );
  }

  lines.push(
    ``,
    `## 8. Owner decision checklist`,
    ``,
    ...p.ownerDecisionChecklist.items.map((x) => `- [ ] ${x}`),
    ``,
    `---`,
    `Full branch detail: **math-generator-branch-mapping.json**`,
    ``
  );

  return lines.join("\n");
}

async function main() {
  await buildMathGeneratorBranchMapping({ writeFiles: true });
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
