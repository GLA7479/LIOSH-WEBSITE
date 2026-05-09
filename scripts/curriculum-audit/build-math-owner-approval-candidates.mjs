/**
 * Phase 4B-6 — Owner approval candidate pack (planning only; no generator/bank/catalog/metadata edits).
 */
import { readFileSync, existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT_DIR = join(ROOT, "reports", "curriculum-audit");

const INPUTS = {
  mapping: join(OUT_DIR, "math-generator-branch-mapping.json"),
  ownerPack: join(OUT_DIR, "math-owner-review-pack.json"),
  candidates: join(OUT_DIR, "math-row-subsection-candidates.json"),
  catalog: join(OUT_DIR, "math-official-subsection-catalog.json"),
  inventory: join(OUT_DIR, "question-inventory.json"),
};

function loadJson(path, label) {
  if (!existsSync(path)) throw new Error(`Missing ${label}: ${path}`);
  return JSON.parse(readFileSync(path, "utf8"));
}

function branchKey(topic, subtopic) {
  const t = String(topic || "").trim() || "_";
  const st = String(subtopic || "").trim() || "_";
  return `${t}::${st}`;
}

function increment(m, k, d = 1) {
  m[k] = (m[k] || 0) + d;
}

/**
 * @param {'improve_subsection_catalog'|'improve_metadata'|'adjust_generator_grade_gate'|'split_generator_by_grade_depth'|'owner_manual_review_required'|'no_change'} action
 */
function possibleEditType(action) {
  const map = {
    improve_subsection_catalog: "catalog_only",
    improve_metadata: "metadata_only",
    adjust_generator_grade_gate: "generator_grade_gate",
    split_generator_by_grade_depth: "generator_depth_split",
    owner_manual_review_required: "manual_review_only",
    no_change: "no_change",
  };
  return map[action] || "manual_review_only";
}

/**
 * @param {'improve_subsection_catalog'|'improve_metadata'|'adjust_generator_grade_gate'|'split_generator_by_grade_depth'|'owner_manual_review_required'|'no_change'} action
 */
function suggestedOwnerDecision(action) {
  if (action === "improve_subsection_catalog") return "approve_catalog_report_only";
  if (action === "improve_metadata") return "approve_metadata_patch_plan";
  if (action === "no_change") return "defer";
  if (action === "adjust_generator_grade_gate" || action === "split_generator_by_grade_depth") {
    return "request_more_samples";
  }
  return "request_more_samples";
}

function catalogRiskLevel(b) {
  const seq = b.sequencingSuspicionRowCount || 0;
  const n = b.affectedRowCount || 1;
  const seqShare = seq / n;
  const comp = b.competingCandidateCount || 0;
  if (comp > 0 || seqShare > 0.35) return "high";
  if (seqShare > 0.12 || (b.noCandidateCount || 0) / n > 0.6) return "medium";
  return "low";
}

function buildBranchEnrichment(candidatesRows, inventoryRecords) {
  const invById = new Map(
    (inventoryRecords || []).filter((r) => r.subject === "math").map((r) => [r.questionId, r])
  );
  /** @type {Map<string, { normalizedKeys: Set<string>, rawTopics: Set<string>, sources: Set<string> }>} */
  const byBk = new Map();

  for (const r of candidatesRows) {
    const inv = invById.get(r.questionId);
    const topic = inv?.topic ?? r.rawTopic ?? "";
    const sub = inv?.subtopic ?? r.rawSubtopic ?? "";
    const bk = branchKey(topic, sub);
    if (!byBk.has(bk)) {
      byBk.set(bk, {
        normalizedKeys: new Set(),
        rawTopics: new Set(),
        sources: new Set(),
      });
    }
    const a = byBk.get(bk);
    if (r.normalizedTopicKey) a.normalizedKeys.add(r.normalizedTopicKey);
    if (topic) a.rawTopics.add(topic);
    a.sources.add(r.sourceFile || "(unknown)");
  }
  return byBk;
}

function toApprovalRecord(branch, enrich) {
  const e = enrich.get(branch.branchKey) || {
    normalizedKeys: new Set(),
    rawTopics: new Set(),
    sources: new Set(),
  };
  const normalizedTopicKeys = [...e.normalizedKeys].sort();
  const topics = [...e.rawTopics].sort();
  const sources = [...e.sources].sort();
  const dominantSource =
    sources.length === 1
      ? sources[0]
      : sources.join(" | ") || "utils/math-question-generator.js#sample";

  const action = branch.recommendedFutureAction;
  const pet = possibleEditType(action);
  const sod = suggestedOwnerDecision(action);

  const rec = {
    branchKey: branch.branchKey,
    generatorBranchLabel: branch.generatorBranchLabel,
    recommendedFutureAction: action,
    likelyRootCause: branch.likelyRootCause,
    classificationRationale: branch.classificationRationale,
    affectedRowCount: branch.rowCount,
    gradesAffected: branch.gradesPresent || [],
    topics,
    normalizedTopicKeys,
    suspicionCodes: branch.suspicionCodesPresent || [],
    sequencingByCode: branch.sequencingByCode || {},
    sequencingSuspicionRowCount: branch.sequencingSuspicionRowCount ?? 0,
    noCandidateCount: branch.noSubsectionCandidateCount ?? 0,
    competingCandidateCount: branch.competingCandidatesCount ?? 0,
    candidateSubsectionKeysObserved: branch.candidateSubsectionKeysObserved || [],
    sampleQuestionPreviews: (branch.samplePreviews || []).slice(0, 10),
    sourceImpact: {
      inventorySourcePaths: sources,
      dominantLabel: dominantSource,
      note: "Future edits would flow through harness/generator/metadata/catalog per approved batch — not applied by this report.",
    },
    possibleEditType: pet,
    ownerApprovalRequired: true,
    suggestedOwnerDecision: sod,
  };

  if (pet === "catalog_only") {
    rec.catalogRiskLevel = catalogRiskLevel({
      sequencingSuspicionRowCount: rec.sequencingSuspicionRowCount,
      affectedRowCount: rec.affectedRowCount,
      competingCandidateCount: rec.competingCandidateCount,
      noCandidateCount: rec.noCandidateCount,
    });
  }

  return rec;
}

export async function buildMathOwnerApprovalCandidates(opts = {}) {
  const writeFiles = opts.writeFiles !== false;

  const mapping = loadJson(INPUTS.mapping, "math-generator-branch-mapping");
  const ownerPack = loadJson(INPUTS.ownerPack, "math-owner-review-pack");
  loadJson(INPUTS.catalog, "math-official-subsection-catalog");

  const candidatesPayload = loadJson(INPUTS.candidates, "math-row-subsection-candidates");
  const inventoryPayload = loadJson(INPUTS.inventory, "question-inventory");

  const candidatesRows = candidatesPayload.rows || [];
  const mappingBranches = mapping.branches || [];
  const enrich = buildBranchEnrichment(candidatesRows, inventoryPayload.records || []);

  const approvalBranches = mappingBranches.map((b) => toApprovalRecord(b, enrich));

  const byAction = (act) => approvalBranches.filter((b) => b.recommendedFutureAction === act);

  const groups = {
    catalogOnly: byAction("improve_subsection_catalog"),
    metadataOnly: byAction("improve_metadata"),
    gradeGate: byAction("adjust_generator_grade_gate"),
    splitByGradeDepth: byAction("split_generator_by_grade_depth"),
    manualReviewOnly: byAction("owner_manual_review_required"),
    noChange: byAction("no_change"),
  };

  const actionHistogram = mapping.summary?.recommendedFutureActionByBranch || {};
  const totalBranches = mapping.summary?.distinctBranches ?? approvalBranches.length;

  const branchesNeedingGeneratorChange =
    groups.gradeGate.length + groups.splitByGradeDepth.length;

  const highImpactThreshold = 80;
  const highestImpactBranches = [...approvalBranches]
    .sort((a, b) => b.affectedRowCount - a.affectedRowCount)
    .slice(0, 20)
    .map((b) => ({
      branchKey: b.branchKey,
      affectedRowCount: b.affectedRowCount,
      recommendedFutureAction: b.recommendedFutureAction,
      possibleEditType: b.possibleEditType,
    }));

  const recommendedFirstOwnerDecision = {
    summary:
      "Start with **catalog-only** batches if the owner wants traceability improvements without touching generator output: approve a written plan to extend `mapsToNormalizedKeys` / grade coverage in `math-official-subsection-catalog.js` (explicit approval still required — this pack does not apply changes).",
    secondStep:
      "Then consider **metadata-only** branches (`improve_metadata`) — topic/normalizer alignment without generator logic changes — again only after explicit approval.",
    deferGeneratorWork:
      "Defer **grade-gate** and **depth-split** items until sample stems are reviewed against MoE PDFs; automation labels them `request_more_samples`.",
    noImplementation:
      "This artifact does not modify generator code, question banks, subsection catalog, metadata, UI, or Hebrew copy.",
  };

  const payload = {
    generatedAt: new Date().toISOString(),
    phase: "4B-6-math-owner-approval-candidates",
    meta: {
      ownerGate:
        "No Math patches (generator, banks, catalog mappings, metadata, grade gates, UI, Hebrew copy) until the owner explicitly approves a scoped batch — including supposedly catalog-only work.",
      inputs: INPUTS,
      crossCheckExecutiveSummary: ownerPack.executiveSummary || null,
      mappingSummaryReference: mapping.summary || null,
    },
    executiveSummary: {
      totalGeneratorBranches: totalBranches,
      branchesByRecommendedFutureAction: actionHistogram,
      noChangeBranchCount: groups.noChange.length,
      ownerManualReviewBranchCount: groups.manualReviewOnly.length,
      catalogOnlyCandidateBranchCount: groups.catalogOnly.length,
      metadataOnlyCandidateBranchCount: groups.metadataOnly.length,
      gradeGateCandidateBranchCount: groups.gradeGate.length,
      splitByGradeDepthCandidateBranchCount: groups.splitByGradeDepth.length,
      branchesImplyingGeneratorCodeChange: branchesNeedingGeneratorChange,
      highImpactBranchPreview: highestImpactBranches.filter(
        (h) => h.affectedRowCount >= highImpactThreshold
      ),
      note: "Counts are branch-level planning buckets — not approved work items.",
    },
    candidateBatches: {
      catalogOnly: {
        title: "A. Catalog-only candidates (subsection mapping / coverage — no generator edit)",
        description:
          "Branches classified `improve_subsection_catalog`. Extending catalog `mapsToNormalizedKeys` changes **audit mapping only** until tied to product behavior — owner approval still required before any file edit.",
        branches: groups.catalogOnly,
      },
      metadataOnly: {
        title: "B. Metadata-only candidates (normalizer / labels — no generator logic)",
        description: "Branches classified `improve_metadata`. Planning only.",
        branches: groups.metadataOnly,
      },
      gradeGate: {
        title: "C. Grade-gate candidates (would require generator or harness gate changes if approved)",
        description:
          "Branches classified `adjust_generator_grade_gate`. High/Medium risk — review stems vs official grade PDF before any change.",
        branches: groups.gradeGate,
      },
      splitByGradeDepth: {
        title: "D. Split-by-grade-depth candidates",
        description:
          "Branches classified `split_generator_by_grade_depth`. Prefer splitting depth bands over bulk grade moves.",
        branches: groups.splitByGradeDepth,
      },
      manualReviewOnly: {
        title: "E. Manual-review-only candidates",
        description:
          "Branches classified `owner_manual_review_required`. The owner must decide: (1) whether stems are acceptable as-is, (2) whether to expand catalog maps vs change harness/generator, (3) whether sequencing flags are spiral practice vs defects — **no patch is implied** until you approve a scoped batch.",
        branches: groups.manualReviewOnly,
      },
      noChange: {
        title: "F. No-change candidates (summary)",
        description:
          "Branches classified `no_change` — lowest remediation priority under current heuristics. Full list omitted here; see `math-generator-branch-mapping.json`.",
        branchCount: groups.noChange.length,
        sampleBranchKeys: groups.noChange.slice(0, 12).map((b) => b.branchKey),
      },
    },
    allApprovalBranches: approvalBranches,
    recommendedFirstOwnerDecision,
    highestImpactBranches,
  };

  if (writeFiles) {
    await mkdir(OUT_DIR, { recursive: true });
    const jsonPath = join(OUT_DIR, "math-owner-approval-candidates.json");
    const mdPath = join(OUT_DIR, "math-owner-approval-candidates.md");
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
    `# Math owner approval candidates (Phase 4B-6)`,
    ``,
    `- Generated: ${p.generatedAt}`,
    ``,
    `## 1. Executive summary`,
    ``,
    `| Metric | Value |`,
    `|--------|------:|`,
    `| Total generator branches | ${es.totalGeneratorBranches} |`,
    `| No-change branches | ${es.noChangeBranchCount} |`,
    `| Owner manual-review branches | ${es.ownerManualReviewBranchCount} |`,
    `| Catalog-only candidate branches | ${es.catalogOnlyCandidateBranchCount} |`,
    `| Metadata-only candidate branches | ${es.metadataOnlyCandidateBranchCount} |`,
    `| Grade-gate candidate branches | ${es.gradeGateCandidateBranchCount} |`,
    `| Split-by-depth candidate branches | ${es.splitByGradeDepthCandidateBranchCount} |`,
    `| Branches implying future generator change (gate + depth) | ${es.branchesImplyingGeneratorCodeChange} |`,
    ``,
    `### Branches by recommended future action (from Phase 4B-5)`,
    ``,
    ...Object.entries(es.branchesByRecommendedFutureAction || {}).map(
      ([k, v]) => `- **${k}:** ${v}`
    ),
    ``,
    `${es.note}`,
    ``,
    `## Recommended first owner decision`,
    ``,
    `- **First:** ${p.recommendedFirstOwnerDecision.summary}`,
    `- **Second:** ${p.recommendedFirstOwnerDecision.secondStep}`,
    `- **Defer:** ${p.recommendedFirstOwnerDecision.deferGeneratorWork}`,
    `- **Scope:** ${p.recommendedFirstOwnerDecision.noImplementation}`,
    ``,
    `## Highest-impact branches (by row count)`,
    ``,
    `| Rows | branchKey | action | edit type |`,
    `|-----:|-----------|--------|-----------|`,
  ];

  for (const h of p.highestImpactBranches.slice(0, 15)) {
    lines.push(
      `| ${h.affectedRowCount} | \`${h.branchKey.slice(0, 52)}…\` | ${h.recommendedFutureAction} | ${h.possibleEditType} |`
    );
  }

  lines.push(``, `---`, ``);

  function branchTable(batch) {
    lines.push(`## ${batch.title}`, ``, batch.description, ``);
    if (!batch.branches || batch.branches.length === 0) {
      lines.push(`_None._`, ``);
      return;
    }
    for (const b of batch.branches) {
      lines.push(`### \`${b.branchKey}\``, ``);
      lines.push(`- **Likely root cause:** ${b.likelyRootCause}`);
      lines.push(`- **Affected rows:** ${b.affectedRowCount}`);
      lines.push(`- **Grades:** ${b.gradesAffected.join(", ")}`);
      lines.push(`- **Normalized keys:** ${b.normalizedTopicKeys.slice(0, 8).join(", ")}${b.normalizedTopicKeys.length > 8 ? " …" : ""}`);
      lines.push(`- **No-candidate / competing:** ${b.noCandidateCount} / ${b.competingCandidateCount}`);
      lines.push(`- **Suspicion codes:** ${(b.suspicionCodes || []).join(", ") || "—"}`);
      lines.push(`- **Possible edit type:** \`${b.possibleEditType}\``);
      lines.push(`- **Suggested owner decision:** \`${b.suggestedOwnerDecision}\``);
      lines.push(`- **Owner approval required:** ${b.ownerApprovalRequired}`);
      if (b.catalogRiskLevel) lines.push(`- **Catalog risk (advisory):** ${b.catalogRiskLevel}`);
      lines.push(`- **Sources:** ${b.sourceImpact.dominantLabel.slice(0, 120)}`);
      lines.push(`- **Preview:** ${(b.sampleQuestionPreviews[0] || "—").slice(0, 100)}…`);
      lines.push(``);
    }
  }

  branchTable(p.candidateBatches.catalogOnly);
  branchTable(p.candidateBatches.metadataOnly);
  branchTable(p.candidateBatches.gradeGate);
  branchTable(p.candidateBatches.splitByGradeDepth);
  branchTable(p.candidateBatches.manualReviewOnly);

  const nf = p.candidateBatches.noChange;
  lines.push(`## ${nf.title}`, ``, nf.description, ``, `- **Count:** ${nf.branchCount}`, ``);
  lines.push(`Sample keys: ${nf.sampleBranchKeys.map((k) => `\`${k}\``).join(", ")}`, ``);

  lines.push(`---`, `Full JSON: **math-owner-approval-candidates.json**`, ``);

  return lines.join("\n");
}

async function main() {
  await buildMathOwnerApprovalCandidates({ writeFiles: true });
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
