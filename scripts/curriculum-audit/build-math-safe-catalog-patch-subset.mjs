/**
 * Phase 4B-8 — Safe catalog patch subset (reports-only; does NOT edit catalog source).
 */
import { readFileSync, existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve as pathResolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT_DIR = join(ROOT, "reports", "curriculum-audit");

const CATALOG_SOURCE_FILE = "utils/curriculum-audit/math-official-subsection-catalog.js";

const INPUTS = {
  patchPlan: join(OUT_DIR, "math-catalog-only-patch-plan.json"),
  approval: join(OUT_DIR, "math-owner-approval-candidates.json"),
  mapping: join(OUT_DIR, "math-generator-branch-mapping.json"),
  candidates: join(OUT_DIR, "math-row-subsection-candidates.json"),
  catalog: join(OUT_DIR, "math-official-subsection-catalog.json"),
};

const QA_AFTER_APPROVED_CATALOG_EDIT = [
  "npm run audit:curriculum:math-subsection-catalog",
  "npm run audit:curriculum:math-subsection-candidates",
  "npm run audit:curriculum:math-generator-branches",
  "npm run audit:curriculum:math-approval-candidates",
  "npm run audit:curriculum:math-catalog-patch-plan",
  "npm run audit:curriculum:math-safe-catalog-subset",
];

function loadJson(path, label) {
  if (!existsSync(path)) throw new Error(`Missing ${label}: ${path}`);
  return JSON.parse(readFileSync(path, "utf8"));
}

/** Returns exclusion reason string, or null if proposal qualifies for the safe subset. */
function getExclusionReason(p) {
  if (p.changeType === "propose_new_section_placeholder") {
    return "propose_new_section_placeholder";
  }
  if (p.changeType !== "add_mapsToNormalizedKeys_entry") {
    return "change_type_not_add_mapsToNormalizedKeys_entry";
  }

  const g = p.targetGrade;
  const nk = p.normalizedKeyToAdd;
  const sec = p.targetSectionKey;

  if (g === 1 && nk === "math.multiplication_division") {
    return "explicit_exclude_grade_1_multiplication_mapping";
  }

  if (sec === "g4_powers_ratio" && nk === "math.divisibility_factors") {
    return "weak_interim_host_g4_powers_ratio_divisibility_factors";
  }

  if (p.confidence !== "high" && p.confidence !== "medium") {
    return "confidence_not_high_or_medium";
  }
  if (p.riskLevel !== "low") {
    return "risk_level_not_low";
  }
  if (p.runtimeQuestionOutputChanges !== false) {
    return "runtime_question_output_changes_not_false";
  }
  if (p.generatorCodeChanges !== false) {
    return "generator_code_changes_not_false";
  }
  if (p.ownerApprovalRequired !== true) {
    return "owner_approval_required_not_true";
  }
  if (p.notImplemented !== true) {
    return "not_implemented_not_true";
  }

  return null;
}

function increment(map, key, by = 1) {
  map[key] = (map[key] || 0) + by;
}

export async function buildMathSafeCatalogPatchSubset(opts = {}) {
  const writeFiles = opts.writeFiles !== false;

  const patchPlan = loadJson(INPUTS.patchPlan, "math-catalog-only-patch-plan");
  loadJson(INPUTS.approval, "math-owner-approval-candidates");
  loadJson(INPUTS.mapping, "math-generator-branch-mapping");
  loadJson(INPUTS.candidates, "math-row-subsection-candidates");
  loadJson(INPUTS.catalog, "math-official-subsection-catalog");

  const branchPlans = patchPlan.branchPlans || [];

  /** @type {{ proposal: object, branchKey: string, branchPlan: object }[]} */
  const included = [];
  /** @type {{ proposal: object, branchKey: string, exclusionReason: string }[]} */
  const excluded = [];
  const exclusionReasonCounts = {};

  for (const bp of branchPlans) {
    const bk = bp.branchKey;
    for (const pr of bp.proposedCatalogChanges || []) {
      const reason = getExclusionReason(pr);
      if (reason) {
        excluded.push({ proposal: pr, branchKey: bk, exclusionReason: reason });
        increment(exclusionReasonCounts, reason);
      } else {
        included.push({ proposal: pr, branchKey: bk, branchPlan: bp });
      }
    }
  }

  const branchesWithSafe = new Set(included.map((x) => x.branchKey));
  let affectedRowsCovered = 0;
  for (const bp of branchPlans) {
    if (branchesWithSafe.has(bp.branchKey)) affectedRowsCovered += bp.affectedRowCount || 0;
  }

  const targetSectionRollup = {};
  for (const item of included) {
    const p = item.proposal;
    const key = `${p.targetGrade}::${p.targetSectionKey}`;
    if (!targetSectionRollup[key]) {
      targetSectionRollup[key] = {
        targetGrade: p.targetGrade,
        targetSectionKey: p.targetSectionKey,
        normalizedKeysToAdd: [],
        branchKeys: new Set(),
      };
    }
    targetSectionRollup[key].normalizedKeysToAdd.push(p.normalizedKeyToAdd);
    targetSectionRollup[key].branchKeys.add(item.branchKey);
  }

  for (const k of Object.keys(targetSectionRollup)) {
    const r = targetSectionRollup[k];
    r.normalizedKeysToAdd = [...new Set(r.normalizedKeysToAdd)].sort();
    r.branchKeys = [...r.branchKeys].sort();
  }

  const branchesIncludedDetail = [...branchesWithSafe].sort().map((bk) => {
    const bp = branchPlans.find((b) => b.branchKey === bk);
    const props = included.filter((i) => i.branchKey === bk).map((i) => i.proposal);
    return {
      branchKey: bk,
      affectedRowCount: bp?.affectedRowCount ?? 0,
      sampleQuestionPreviews: bp?.sampleQuestionPreviews || [],
      safeProposals: props,
    };
  });

  const payload = {
    generatedAt: new Date().toISOString(),
    phase: "4B-8-math-safe-catalog-patch-subset",
    meta: {
      ownerGate:
        "Subset of Phase 4B-7 patch plan — strict filters; does not edit catalog source or runtime assets.",
      inputs: INPUTS,
      futureCatalogEditFile: CATALOG_SOURCE_FILE,
      qaAfterApprovedCatalogEdit: QA_AFTER_APPROVED_CATALOG_EDIT,
    },
    executiveSummary: {
      title: "Math Phase 4B-8 — Safe catalog patch subset (approval-ready)",
      totalProposalsInPhase4B7: included.length + excluded.length,
      totalSafeProposalsIncluded: included.length,
      totalProposalsExcluded: excluded.length,
      excludedByReason: exclusionReasonCounts,
      distinctBranchesWithSafeProposals: branchesWithSafe.size,
      affectedRowCountSumForBranchesWithSafeProposals: affectedRowsCovered,
      note: "Counts reflect automated filters + explicit weak-host exclusions. Owner still approves before any `math-official-subsection-catalog.js` edit.",
    },
    safetyConfirmation: {
      noRuntimeQuestionStemOrAnswerChanges: true,
      noGeneratorSourceChanges: true,
      noQuestionBankChanges: true,
      noMetadataChanges: true,
      noUIChanges: true,
      thisReportDoesNotEditCatalogModule: true,
    },
    ownerDecisionTable: [
      {
        decision: "approve_safe_catalog_subset",
        meaning:
          "Owner authorizes implementing only the listed `add_mapsToNormalizedKeys_entry` rows (high/medium confidence, risk low) in `math-official-subsection-catalog.js` after PDF spot-check.",
      },
      {
        decision: "request_more_samples",
        meaning:
          "Defer implementation; gather more stems / PDF cross-check before narrowing further.",
      },
      {
        decision: "defer",
        meaning: "No catalog edit now; revisit after other curriculum work.",
      },
      {
        decision: "reject",
        meaning: "Do not apply these mappings; keep audit-only status quo.",
      },
    ],
    normalizedKeysByTargetSection: Object.values(targetSectionRollup).sort((a, b) => {
      if (a.targetGrade !== b.targetGrade) return a.targetGrade - b.targetGrade;
      return String(a.targetSectionKey).localeCompare(String(b.targetSectionKey));
    }),
    branchesIncluded: [...branchesWithSafe].sort(),
    branchesIncludedDetail,
    safeProposalsFlat: included.map((x) => ({
      branchKey: x.branchKey,
      affectedRowCount: x.branchPlan?.affectedRowCount,
      proposal: x.proposal,
    })),
    excludedProposalsDetail: excluded,
    exclusionSummaryByReason: Object.entries(exclusionReasonCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([reason, count]) => ({ reason, count })),
  };

  if (writeFiles) {
    await mkdir(OUT_DIR, { recursive: true });
    const jsonPath = join(OUT_DIR, "math-safe-catalog-patch-subset.json");
    const mdPath = join(OUT_DIR, "math-safe-catalog-patch-subset.md");
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
    `# Math safe catalog patch subset (Phase 4B-8)`,
    ``,
    `- Generated: ${p.generatedAt}`,
    ``,
    `## 1. Executive summary`,
    ``,
    `- **Phase 4B-7 proposals considered:** ${es.totalProposalsInPhase4B7}`,
    `- **Safe proposals included:** ${es.totalSafeProposalsIncluded}`,
    `- **Proposals excluded:** ${es.totalProposalsExcluded}`,
    `- **Branches with ≥1 safe proposal:** ${es.distinctBranchesWithSafeProposals}`,
    `- **Affected inventory rows (sum over included branches):** ${es.affectedRowCountSumForBranchesWithSafeProposals}`,
    ``,
    `${es.note}`,
    ``,
    `## 2. Excluded proposals by reason`,
    ``,
    ...p.exclusionSummaryByReason.map((r) => `- **${r.reason}:** ${r.count}`),
    ``,
    `## 3. Target grades and section keys`,
    ``,
    `| Grade | Section key | Keys to add | Contributing branches |`,
    `|-------|-------------|-------------|----------------------|`,
    ...(p.normalizedKeysByTargetSection.length
      ? p.normalizedKeysByTargetSection.map(
          (row) =>
            `| ${row.targetGrade} | \`${row.targetSectionKey}\` | ${row.normalizedKeysToAdd.map((k) => `\`${k}\``).join(", ")} | ${row.branchKeys.join(", ")} |`
        )
      : [`| — | — | _none_ | — |`]),
    ``,
    `## 4. Branches included (with previews and row counts)`,
    ``,
  ];

  for (const b of p.branchesIncludedDetail) {
    lines.push(`### ${b.branchKey}`, ``);
    lines.push(`- **Affected rows:** ${b.affectedRowCount}`);
    lines.push(`- **Sample previews:**`);
    for (const prev of (b.sampleQuestionPreviews || []).slice(0, 8)) {
      lines.push(`  - ${prev}`);
    }
    lines.push(``, `**Safe proposals:**`, ``);
    for (const pr of b.safeProposals) {
      lines.push(
        `- Grade **${pr.targetGrade}** → \`${pr.targetSectionKey}\` — add \`${pr.normalizedKeyToAdd}\` (${pr.confidence}, risk ${pr.riskLevel})`
      );
    }
    lines.push(``);
  }

  lines.push(
    `## 5. Safety confirmation`,
    ``,
    ...Object.entries(p.safetyConfirmation).map(([k, v]) => `- **${k}:** ${v}`),
    ``,
    `## 6. Future file edit (if owner approves)`,
    ``,
    `- \`${p.meta.futureCatalogEditFile}\``,
    ``,
    `## 7. QA commands after a future approved catalog edit`,
    ``,
    ...p.meta.qaAfterApprovedCatalogEdit.map((c) => `- \`${c}\``),
    ``,
    `## 8. Owner decision table`,
    ``,
    `| Decision | Meaning |`,
    `|----------|---------|`,
    ...p.ownerDecisionTable.map((r) => `| **${r.decision}** | ${r.meaning} |`),
    ``,
    `---`,
    `Machine-readable: **math-safe-catalog-patch-subset.json**`,
    ``
  );

  return lines.join("\n");
}

async function main() {
  await buildMathSafeCatalogPatchSubset({ writeFiles: true });
}

function isExecutedAsMainScript() {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    const self = fileURLToPath(import.meta.url);
    return pathResolve(entry) === pathResolve(self);
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