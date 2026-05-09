/**
 * Phase 4B-7 — Catalog-only patch plan (reports-only; does NOT edit catalog source).
 */
import { readFileSync, existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT_DIR = join(ROOT, "reports", "curriculum-audit");

const CATALOG_SOURCE_FILE = "utils/curriculum-audit/math-official-subsection-catalog.js";

const INPUTS = {
  approval: join(OUT_DIR, "math-owner-approval-candidates.json"),
  mapping: join(OUT_DIR, "math-generator-branch-mapping.json"),
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

/** Build Set of normalized keys that appear in any section for grade `g`. */
function keysAtGrade(catalogPayload, g) {
  const slot = catalogPayload.catalog?.[`grade_${g}`];
  const s = new Set();
  for (const sec of slot?.sections || []) {
    for (const k of sec.mapsToNormalizedKeys || []) s.add(k);
  }
  return s;
}

/**
 * Explicit placement hints for catalog gaps (grade × normalized key).
 * When absent, fallback is propose_new_section_placeholder.
 */
const HOST_HINTS = {
  "math.addition_subtraction|3": {
    targetSectionKey: "g3_numbers_large",
    confidence: "medium",
    riskLevel: "medium",
    rationale:
      "Grade 3 lacks a dedicated add/sub section; extending `g3_numbers_large` preserves number strand — validate vs PDF.",
    proposedCatalogOnlyChange: "add_mapsToNormalizedKeys_entry",
  },
  "math.addition_subtraction|4": {
    targetSectionKey: "g4_operations_fractions_decimals",
    confidence: "high",
    riskLevel: "low",
    rationale: "Mixed numeric operations strand already hosts fraction/decimal ops; add/subtraction mapping aligns with operational fluency.",
    proposedCatalogOnlyChange: "add_mapsToNormalizedKeys_entry",
  },
  "math.addition_subtraction|5": {
    targetSectionKey: "g5_fractions_operations",
    confidence: "high",
    riskLevel: "low",
    rationale: "Fraction operations section is the closest existing host for multi-digit add/sub context at grade 5.",
    proposedCatalogOnlyChange: "add_mapsToNormalizedKeys_entry",
  },
  "math.addition_subtraction|6": {
    targetSectionKey: "g6_mixed_review",
    confidence: "high",
    riskLevel: "low",
    rationale: "Mixed review bucket fits consolidated arithmetic mapping.",
    proposedCatalogOnlyChange: "add_mapsToNormalizedKeys_entry",
  },
  "math.multiplication_division|1": {
    type: "new_section",
    proposedSectionKeyStub: "g1_multiplication_intro_placeholder",
    confidence: "low",
    riskLevel: "medium",
    rationale:
      "Grade 1 catalogue has no multiplication_division host; prefer a new subsection label after PDF review rather than forcing an unrelated section.",
    proposedCatalogOnlyChange: "add_grade_specific_section_mapping",
  },
  "math.multiplication_division|4": {
    targetSectionKey: "g4_operations_fractions_decimals",
    confidence: "medium",
    riskLevel: "medium",
    rationale:
      "Operational band at grade 4; acceptable interim host until a finer subsection exists.",
    proposedCatalogOnlyChange: "add_mapsToNormalizedKeys_entry",
  },
  "math.multiplication_division|6": {
    targetSectionKey: "g6_mixed_review",
    confidence: "high",
    riskLevel: "low",
    rationale: "Mixed review supports consolidated multiplication/division audit mapping.",
    proposedCatalogOnlyChange: "add_mapsToNormalizedKeys_entry",
  },
  "math.estimation_rounding|4": {
    targetSectionKey: "g4_operations_fractions_decimals",
    confidence: "medium",
    riskLevel: "medium",
    rationale:
      "Rounding ties to decimal/fraction magnitude work at grade 4 — confirm against programme PDF.",
    proposedCatalogOnlyChange: "add_mapsToNormalizedKeys_entry",
  },
  "math.estimation_rounding|5": {
    targetSectionKey: "g5_decimals_percent",
    confidence: "high",
    riskLevel: "low",
    rationale: "Decimals/percent strand is the natural estimation host.",
    proposedCatalogOnlyChange: "add_mapsToNormalizedKeys_entry",
  },
  "math.estimation_rounding|6": {
    targetSectionKey: "g6_rational_numbers",
    confidence: "medium",
    riskLevel: "medium",
    rationale: "Rational number comparisons involve estimation — verify wording vs PDF.",
    proposedCatalogOnlyChange: "add_mapsToNormalizedKeys_entry",
  },
  "math.divisibility_factors|2": {
    type: "new_section",
    proposedSectionKeyStub: "g2_divisibility_intro_placeholder",
    confidence: "low",
    riskLevel: "high",
    rationale:
      "No divisibility slot exists at grade 2 in the encoded catalog; early divisibility samples may need a new subsection after pedagogy review.",
    proposedCatalogOnlyChange: "add_grade_specific_section_mapping",
  },
  "math.divisibility_factors|4": {
    targetSectionKey: "g4_powers_ratio",
    confidence: "low",
    riskLevel: "medium",
    rationale:
      "Interim host for prime/divisibility-adjacent mapping — weak fit; prefer owner PDF pass before editing.",
    proposedCatalogOnlyChange: "add_mapsToNormalizedKeys_entry",
  },
  "math.number_sense|4": {
    targetSectionKey: "g4_operations_fractions_decimals",
    confidence: "medium",
    riskLevel: "medium",
    rationale: "Numeric magnitude / fraction sense aligns with grade 4 operations band.",
    proposedCatalogOnlyChange: "add_mapsToNormalizedKeys_entry",
  },
  "math.number_sense|5": {
    targetSectionKey: "g5_decimals_percent",
    confidence: "medium",
    riskLevel: "medium",
    rationale: "Decimal sense overlaps number sense — confirm scope vs PDF.",
    proposedCatalogOnlyChange: "add_mapsToNormalizedKeys_entry",
  },
};

function baseProposalFlags() {
  return {
    ownerApprovalRequired: true,
    notImplemented: true,
    runtimeQuestionOutputChanges: false,
    generatorCodeChanges: false,
    catalogEditStillRequiresApproval: true,
    targetFile: CATALOG_SOURCE_FILE,
  };
}

function ownerDecisionFromProposal(p) {
  if (p.changeType === "propose_new_section_placeholder") return "request_more_samples";
  if (p.confidence === "low") return "request_more_samples";
  return "approve_catalog_edit";
}

function buildProposalForGap(grade, normKey) {
  const key = `${normKey}|${grade}`;
  const hint = HOST_HINTS[key];
  const base = baseProposalFlags();

  if (hint?.type === "new_section") {
    return {
      ...base,
      changeType: "propose_new_section_placeholder",
      proposedCatalogOnlyChange: hint.proposedCatalogOnlyChange || "add_grade_specific_section_mapping",
      targetGrade: grade,
      normalizedKeyToAdd: normKey,
      proposedSectionKeyStub: hint.proposedSectionKeyStub,
      confidence: hint.confidence,
      riskLevel: hint.riskLevel,
      rationale: hint.rationale,
      missingCatalogMappingReason:
        "Normalized key not present in any `mapsToNormalizedKeys` entry for this grade — no suitable existing section in encoded catalog.",
      ownerDecisionNeeded: ownerDecisionFromProposal({ changeType: "new_section", confidence: hint.confidence }),
      qaAfterApproval: [
        "npm run audit:curriculum:math-subsection-catalog",
        "npm run audit:curriculum:math-subsection-candidates",
        "npm run audit:curriculum:math-generator-branches",
        "npm run audit:curriculum:math-approval-candidates",
      ],
      safetyChecks: {
        noGeneratorCodeChange: true,
        noStudentFacingQuestionTextChange: true,
        noUIChange: true,
        noStaticBankChange: true,
        onlyAuditCatalogMappingAffected: true,
      },
    };
  }

  if (hint?.targetSectionKey) {
    return {
      ...base,
      changeType: "add_mapsToNormalizedKeys_entry",
      proposedCatalogOnlyChange: hint.proposedCatalogOnlyChange || "add_mapsToNormalizedKeys_entry",
      targetGrade: grade,
      targetSectionKey: hint.targetSectionKey,
      normalizedKeyToAdd: normKey,
      confidence: hint.confidence,
      riskLevel: hint.riskLevel,
      rationale: hint.rationale,
      missingCatalogMappingReason:
        "Key missing from all sections at this grade — extend `mapsToNormalizedKeys` on the listed section after PDF confirmation.",
      ownerDecisionNeeded: ownerDecisionFromProposal({
        changeType: "add_key",
        confidence: hint.confidence,
      }),
      qaAfterApproval: [
        "npm run audit:curriculum:math-subsection-catalog",
        "npm run audit:curriculum:math-subsection-candidates",
        "npm run audit:curriculum:math-generator-branches",
        "npm run audit:curriculum:math-approval-candidates",
      ],
      safetyChecks: {
        noGeneratorCodeChange: true,
        noStudentFacingQuestionTextChange: true,
        noUIChange: true,
        noStaticBankChange: true,
        onlyAuditCatalogMappingAffected: true,
      },
    };
  }

  return {
    ...base,
    changeType: "propose_new_section_placeholder",
    proposedCatalogOnlyChange: "add_grade_specific_section_mapping",
    targetGrade: grade,
    normalizedKeyToAdd: normKey,
    proposedSectionKeyStub: `g${grade}_custom_${String(normKey).replace(/^math\./, "").replace(/_/g, "")}`,
    confidence: "low",
    riskLevel: "high",
    rationale:
      "No curated host hint — owner should cross-check Ministry PDF before adding a subsection vs extending an existing row.",
    missingCatalogMappingReason: "Uncovered grade/key pair with no automated host recommendation.",
    ownerDecisionNeeded: "request_more_samples",
    qaAfterApproval: [
      "npm run audit:curriculum:math-subsection-catalog",
      "npm run audit:curriculum:math-subsection-candidates",
    ],
    safetyChecks: {
      noGeneratorCodeChange: true,
      noStudentFacingQuestionTextChange: true,
      noUIChange: true,
      noStaticBankChange: true,
      onlyAuditCatalogMappingAffected: true,
    },
  };
}

function computeGapsForBranch(branch, coverageByGrade) {
  const grades = branch.gradesAffected || [];
  const keys = branch.normalizedTopicKeys || [];
  const gaps = [];
  for (const g of grades) {
    const cov = coverageByGrade[g];
    if (!cov) continue;
    for (const k of keys) {
      if (!cov.has(k)) gaps.push({ grade: g, normalizedKey: k });
    }
  }
  return gaps;
}

function aggregateCandidateStatus(rowsForBranch) {
  let high = 0;
  let medium = 0;
  let low = 0;
  let none = 0;
  for (const r of rowsForBranch) {
    const t = r.candidateConfidence;
    if (t === "high") high++;
    else if (t === "medium") medium++;
    else if (t === "low") low++;
    else none++;
  }
  return { high, medium, low, none, total: rowsForBranch.length };
}

export async function buildMathCatalogOnlyPatchPlan(opts = {}) {
  const writeFiles = opts.writeFiles !== false;

  const approval = loadJson(INPUTS.approval, "math-owner-approval-candidates");
  const mappingPayload = loadJson(INPUTS.mapping, "math-generator-branch-mapping");
  const candidatesPayload = loadJson(INPUTS.candidates, "math-row-subsection-candidates");
  const catalogPayload = loadJson(INPUTS.catalog, "math-official-subsection-catalog");
  const inventoryPayload = loadJson(INPUTS.inventory, "question-inventory");

  const catalogBranches =
    approval.candidateBatches?.catalogOnly?.branches ||
    approval.candidateBatches?.catalogOnly ||
    [];

  const mappingByKey = new Map(
    (mappingPayload.branches || []).map((b) => [b.branchKey, b])
  );

  const invById = new Map(
    (inventoryPayload.records || []).filter((r) => r.subject === "math").map((r) => [r.questionId, r])
  );

  const rowsByBranch = new Map();
  for (const r of candidatesPayload.rows || []) {
    const inv = invById.get(r.questionId);
    const bk = branchKey(inv?.topic ?? r.rawTopic, inv?.subtopic ?? r.rawSubtopic);
    if (!rowsByBranch.has(bk)) rowsByBranch.set(bk, []);
    rowsByBranch.get(bk).push(r);
  }

  const coverageByGrade = {};
  for (let g = 1; g <= 6; g++) {
    coverageByGrade[g] = keysAtGrade(catalogPayload, g);
  }

  /** @type {object[]} */
  const branchPlans = [];
  let totalAffectedRows = 0;
  const affectedGrades = new Set();
  const affectedTopics = new Set();
  const changeTypeHistogram = {};

  for (const br of catalogBranches) {
    const bk = br.branchKey;
    totalAffectedRows += br.affectedRowCount || 0;
    for (const g of br.gradesAffected || []) affectedGrades.add(g);
    for (const t of br.topics || []) affectedTopics.add(t);

    const gaps = computeGapsForBranch(br, coverageByGrade);
    const proposals = gaps.map(({ grade, normalizedKey }) => buildProposalForGap(grade, normalizedKey));
    for (const p of proposals) increment(changeTypeHistogram, p.changeType);

    const rows = rowsByBranch.get(bk) || [];
    const candStats = aggregateCandidateStatus(rows);
    const mappingHit = mappingByKey.get(bk);

    branchPlans.push({
      branchKey: bk,
      affectedRowCount: br.affectedRowCount,
      gradesAffected: br.gradesAffected,
      rawTopics: br.topics || [],
      normalizedTopicKeys: br.normalizedTopicKeys || [],
      currentCandidateStatusSummary: candStats,
      suspicionCodes: br.suspicionCodes || [],
      noCandidateCount: br.noCandidateCount,
      competingCandidateCount: br.competingCandidateCount,
      sampleQuestionPreviews: br.sampleQuestionPreviews || mappingHit?.samplePreviews || [],
      currentCatalogSectionCandidatesObserved: br.candidateSubsectionKeysObserved || [],
      likelyRootCause: br.likelyRootCause,
      classificationRationale: br.classificationRationale,
      recommendedFutureAction: br.recommendedFutureAction,
      missingGradeKeyGaps: gaps,
      proposedCatalogChanges: proposals,
      catalogRiskLevelFromPhase4B6: br.catalogRiskLevel || null,
    });
  }

  branchPlans.sort((a, b) => (b.affectedRowCount || 0) - (a.affectedRowCount || 0));

  const proposedNewSections = [];
  const lowConfidenceProposals = [];
  for (const bp of branchPlans) {
    for (const p of bp.proposedCatalogChanges) {
      if (p.changeType === "propose_new_section_placeholder") proposedNewSections.push({ branchKey: bp.branchKey, proposal: p });
      if (p.confidence === "low") lowConfidenceProposals.push({ branchKey: bp.branchKey, proposal: p });
    }
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    phase: "4B-7-math-catalog-only-patch-plan",
    meta: {
      ownerGate:
        "Planning artifact only — does not edit utils/curriculum-audit/math-official-subsection-catalog.js or any runtime assets.",
      inputs: INPUTS,
      catalogSourceModulePath: CATALOG_SOURCE_FILE,
    },
    executiveSummary: {
      totalCatalogOnlyBranchesPlanned: catalogBranches.length,
      totalAffectedRows: totalAffectedRows,
      affectedGrades: [...affectedGrades].sort((a, b) => a - b),
      affectedTopics: [...affectedTopics].sort(),
      runtimeQuestionOutputChangesExpected: false,
      generatorCodeChangesExpected: false,
      ownerApprovalStillRequiredBeforeImplementation: true,
      proposedCatalogChangeTypes: changeTypeHistogram,
      note: "Extending audit-only catalog mappings does not alter generated stems; verify before any implementation.",
    },
    safetyChecksGlobal: {
      noGeneratorCodeChange: true,
      noStudentFacingQuestionTextChange: true,
      noUIChange: true,
      noStaticQuestionBankChange: true,
      onlyAuditCatalogReportMappingWouldChangeIfApproved:
        "Future approved edits would touch `math-official-subsection-catalog.js` for audit/traceability — not question banks or UI.",
    },
    recommendedFirstOwnerDecision: {
      title: "Safest first batch (still requires explicit sign-off)",
      steps: [
        "Approve **only** `add_mapsToNormalizedKeys_entry` rows with **high** confidence and **low** risk after spot-checking sample stems vs PDF.",
        "Defer **propose_new_section_placeholder** and **low** confidence hosts until more PDF-aligned subsection labels exist.",
      ],
    },
    highestImpactCatalogOnlyBranches: branchPlans.slice(0, 10).map((b) => ({
      branchKey: b.branchKey,
      affectedRowCount: b.affectedRowCount,
    })),
    proposedNewSectionPlaceholders: proposedNewSections,
    lowConfidenceProposals,
    branchPlans,
    ownerApprovalChecklist: {
      perPatchItems: [
        "Exact file later: `utils/curriculum-audit/math-official-subsection-catalog.js`",
        "Change type: see each `proposedCatalogChanges[].changeType`",
        "Safety: audit mapping only — see `safetyChecks` on each proposal",
        "QA after implementation (when owner approves): see `qaAfterApproval` per proposal",
      ],
    },
  };

  if (writeFiles) {
    await mkdir(OUT_DIR, { recursive: true });
    const jsonPath = join(OUT_DIR, "math-catalog-only-patch-plan.json");
    const mdPath = join(OUT_DIR, "math-catalog-only-patch-plan.md");
    await writeFile(jsonPath, JSON.stringify(payload, null, 2), "utf8");
    await writeFile(mdPath, markdownReport(payload), "utf8");
    console.log(`Wrote ${jsonPath}`);
    console.log(`Wrote ${mdPath}`);
  }

  return payload;
}

function increment(m, k, d = 1) {
  m[k] = (m[k] || 0) + d;
}

function markdownReport(p) {
  const es = p.executiveSummary;
  const lines = [
    `# Math catalog-only patch plan (Phase 4B-7)`,
    ``,
    `- Generated: ${p.generatedAt}`,
    ``,
    `## 1. Executive summary`,
    ``,
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Catalog-only branches planned | ${es.totalCatalogOnlyBranchesPlanned} |`,
    `| Total affected rows (inventory harness) | ${es.totalAffectedRows} |`,
    `| Affected grades | ${es.affectedGrades.join(", ")} |`,
    `| Runtime question output changes expected | **${es.runtimeQuestionOutputChangesExpected ? "yes" : "no"}** |`,
    `| Generator code changes expected | **${es.generatorCodeChangesExpected ? "yes" : "no"}** |`,
    `| Owner approval still required before edit | **${es.ownerApprovalStillRequiredBeforeImplementation ? "yes" : "no"}** |`,
    ``,
    `### Proposed change types (automated classification)`,
    ``,
    ...Object.entries(es.proposedCatalogChangeTypes || {}).map(([k, v]) => `- **${k}:** ${v}`),
    ``,
    `${es.note}`,
    ``,
    `## Safety checks (global)`,
    ``,
    ...Object.entries(p.safetyChecksGlobal || {}).map(([k, v]) => `- **${k}:** ${typeof v === "string" ? v : JSON.stringify(v)}`),
    ``,
    `## Recommended first owner decision`,
    ``,
    `- ${p.recommendedFirstOwnerDecision.title}`,
    ...p.recommendedFirstOwnerDecision.steps.map((s) => `- ${s}`),
    ``,
    `## Highest-impact branches`,
    ``,
    ...p.highestImpactCatalogOnlyBranches.map((b) => `- **${b.branchKey}** — ${b.affectedRowCount} rows`),
    ``,
    `## New section placeholders proposed`,
    ``,
    ...(p.proposedNewSectionPlaceholders.length
      ? p.proposedNewSectionPlaceholders.map(
          (x) =>
            `- **${x.branchKey}:** stub \`${x.proposal.proposedSectionKeyStub}\` (${x.proposal.targetGrade}) — ${x.proposal.rationale}`
        )
      : [`_None._`]),
    ``,
    `## Low-confidence proposals`,
    ``,
    ...(p.lowConfidenceProposals.length
      ? p.lowConfidenceProposals.map(
          (x) =>
            `- **${x.branchKey}** grade ${x.proposal.targetGrade} — \`${x.proposal.normalizedKeyToAdd}\` → ${x.proposal.changeType}`
        )
      : [`_None._`]),
    ``,
    `## Branch-by-branch plan`,
    ``,
  ];

  for (const bp of p.branchPlans) {
    lines.push(`### ${bp.branchKey}`, ``);
    lines.push(`- **Rows:** ${bp.affectedRowCount}`);
    lines.push(`- **Grades:** ${bp.gradesAffected.join(", ")}`);
    lines.push(`- **Normalized keys:** ${bp.normalizedTopicKeys.join(", ")}`);
    lines.push(`- **No-candidate / competing:** ${bp.noCandidateCount} / ${bp.competingCandidateCount}`);
    lines.push(
      `- **Candidate tier counts:** high ${bp.currentCandidateStatusSummary.high}, medium ${bp.currentCandidateStatusSummary.medium}, low ${bp.currentCandidateStatusSummary.low}, none ${bp.currentCandidateStatusSummary.none}`
    );
    lines.push(
      `- **Gaps (grade × key):** ${bp.missingGradeKeyGaps.map((g) => `g${g.grade}:${g.normalizedKey}`).join("; ") || "—"}`
    );
    lines.push(``, `#### Proposed catalog-only actions (not implemented)`, ``);
    for (const pr of bp.proposedCatalogChanges) {
      lines.push(`- **Grade ${pr.targetGrade}** · \`${pr.normalizedKeyToAdd}\` · ${pr.changeType}`);
      lines.push(`  - confidence: ${pr.confidence}, risk: ${pr.riskLevel}, owner decision: \`${pr.ownerDecisionNeeded}\``);
      if (pr.targetSectionKey) lines.push(`  - target section: \`${pr.targetSectionKey}\``);
      if (pr.proposedSectionKeyStub) lines.push(`  - new section stub: \`${pr.proposedSectionKeyStub}\``);
      lines.push(`  - ${pr.rationale}`);
    }
    lines.push(``);
  }

  lines.push(`---`, `Full machine-readable plan: **math-catalog-only-patch-plan.json**`, ``);
  return lines.join("\n");
}

async function main() {
  await buildMathCatalogOnlyPatchPlan({ writeFiles: true });
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
