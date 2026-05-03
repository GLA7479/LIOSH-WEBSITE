#!/usr/bin/env node
/**
 * Scan real learning-simulator *.report.json artifacts, adapt to PlannerInput, run planAdaptiveLearning, validate safety.
 * npm run test:adaptive-planner:artifacts
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "reports", "adaptive-learning-planner");
const OUT_JSON = join(OUT_DIR, "artifact-summary.json");
const OUT_MD = join(OUT_DIR, "artifact-summary.md");

const plannerMod = await import(new URL("../utils/adaptive-learning-planner/adaptive-planner.js", import.meta.url).href);
const adapterMod = await import(
  new URL("../utils/adaptive-learning-planner/adaptive-planner-input-adapter.js", import.meta.url).href
);
const runnerMod = await import(
  new URL("../utils/adaptive-learning-planner/adaptive-planner-artifact-runner.js", import.meta.url).href
);
const metaCtxMod = await import(
  new URL("../utils/adaptive-learning-planner/adaptive-planner-metadata-context.js", import.meta.url).href
);

const { planAdaptiveLearning } = plannerMod;
const { buildPlannerInputFromDiagnosticPayload } = adapterMod;
const { collectReportArtifactPaths, listDiagnosticUnitIndices, runArtifactSafetyAssertions } = runnerMod;
const {
  buildPlannerQuestionMetadataIndex,
  runPlannerMetadataProviderSmokeChecks,
  validateLightEntriesNoForbiddenFields,
} = metaCtxMod;

/**
 * @param {string} rootAbs
 */
async function tryLoadMetadataIndexFromSnapshot(rootAbs) {
  const p = join(rootAbs, "reports", "adaptive-learning-planner", "metadata-index-snapshot.json");
  try {
    const raw = JSON.parse(await readFile(p, "utf8"));
    const entries = raw.entries;
    if (!Array.isArray(entries) || entries.length === 0) return null;
    const leaks = validateLightEntriesNoForbiddenFields(entries);
    if (leaks.length) {
      console.warn(
        `Adaptive planner: snapshot failed validation (${leaks.length} issue(s)) — rebuilding in-memory index. First: ${leaks[0]}`
      );
      return null;
    }
    return {
      entries,
      stats: {
        ...(raw.stats && typeof raw.stats === "object" ? raw.stats : {}),
        fromSnapshotFile: true,
        snapshotPath: "reports/adaptive-learning-planner/metadata-index-snapshot.json",
      },
      builtAt: raw.generatedAt || raw.builtAt || null,
      rootAbs,
    };
  } catch {
    return null;
  }
}

/** Real-like fixtures when reports are missing or for edge coverage */
const FIXTURE_PAYLOADS = [
  {
    _fixtureLabel: "real_like_remediate",
    scenarioId: "fixture_remediate_math",
    playerName: "Sim:fixture_remediate",
    diagnosticPrimarySource: "diagnosticEngineV2",
    facets: {
      diagnostic: {
        unitSummaries: [
          {
            subjectId: "math",
            displayName: "כפל",
            canonicalAction: "diagnose_only",
            positiveAuthorityLevel: "none",
            evidenceQuestions: 45,
            patternHe: "שגיאה בעמודת עשרות",
            skillId: "math_mul",
            subskillId: "mul",
            skillAlignmentConfidence: "exact",
            skillAlignmentSource: "unit_field",
            skillAlignmentWarnings: [],
          },
        ],
      },
      contract: { primarySubjectId: "math", topThinDowngraded: false },
      crossSubject: {},
      executive: {},
    },
  },
  {
    _fixtureLabel: "real_like_doNotConclude_thin",
    scenarioId: "fixture_thin_contract",
    facets: {
      diagnostic: {
        unitSummaries: [
          {
            subjectId: "geometry",
            displayName: "שטח",
            canonicalAction: "probe_only",
            positiveAuthorityLevel: "good",
            evidenceQuestions: 80,
            skillId: "geo_rect_area_plan",
            subskillId: "area_rectangle",
            skillAlignmentConfidence: "exact",
            skillAlignmentSource: "unit_field",
            skillAlignmentWarnings: [],
          },
        ],
      },
      contract: { primarySubjectId: "geometry", topThinDowngraded: true },
      crossSubject: { dataQualityNoteHe: "מעט נתונים" },
      executive: { reportReadinessHe: "התרגול בתקופה עדיין מצומצם" },
    },
  },
  {
    _fixtureLabel: "real_like_english_missing_skill_subskill",
    scenarioId: "fixture_english_untagged",
    facets: {
      diagnostic: {
        unitSummaries: [
          {
            subjectId: "english",
            displayName: "Grammar",
            canonicalAction: "diagnose_only",
            positiveAuthorityLevel: "good",
            evidenceQuestions: 60,
          },
        ],
      },
      contract: { primarySubjectId: "english", topThinDowngraded: false },
      crossSubject: {},
      executive: {},
      topicLayer: {
        topWeaknessLabels: [],
        topicRecLabels: [],
        topicBucketKeys: ["grammar"],
      },
    },
  },
  {
    _fixtureLabel: "real_like_strong_advance_with_metadata",
    scenarioId: "fixture_advance_math",
    facets: {
      diagnostic: {
        unitSummaries: [
          {
            subjectId: "math",
            displayName: "שברים",
            canonicalAction: "withhold",
            engineDecision: "advance",
            positiveAuthorityLevel: "very_good",
            evidenceQuestions: 200,
            skillId: "math_frac_add_sub",
            subskillId: "frac_add_sub",
            skillAlignmentConfidence: "exact",
            skillAlignmentSource: "unit_field",
            skillAlignmentWarnings: [],
          },
        ],
      },
      contract: { primarySubjectId: "math", topThinDowngraded: false },
      crossSubject: {},
      executive: {},
    },
  },
  {
    _fixtureLabel: "real_like_advance_missing_metadata",
    scenarioId: "fixture_advance_no_meta",
    facets: {
      diagnostic: {
        unitSummaries: [
          {
            subjectId: "hebrew",
            displayName: "הבנה",
            canonicalAction: "withhold",
            engineDecision: "advance",
            positiveAuthorityLevel: "very_good",
            evidenceQuestions: 150,
            skillId: "main_idea",
            subskillId: "summary",
            skillAlignmentConfidence: "exact",
            skillAlignmentSource: "unit_field",
            skillAlignmentWarnings: [],
          },
        ],
      },
      contract: { primarySubjectId: "hebrew", topThinDowngraded: false },
      crossSubject: {},
      executive: {},
    },
  },
];

const MAX_UNITS_PER_FILE = 12;

function countMap() {
  return new Map();
}

function bump(m, k) {
  m.set(k, (m.get(k) || 0) + 1);
}

/**
 * @param {object} summary
 */
function buildMarkdown(summary) {
  const lines = [
    `# Adaptive planner artifact summary`,
    ``,
    `Generated: **${summary.generatedAt}**`,
    ``,
    `## Scan`,
    ``,
    `- Artifact paths scanned: **${summary.artifactsScanned}**`,
    `- Sample paths: ${(summary.artifactPathSample || []).map((p) => `\`${p}\``).join(", ")}`,
    `- Candidate payloads (file × unit): **${summary.candidatePayloads}**`,
    `- Planner inputs built: **${summary.plannerInputsBuilt}**`,
    ``,
    `## Planner output — nextAction`,
    ``,
    ...[...Object.entries(summary.byNextAction || {})].map(([k, v]) => `- \`${k}\`: **${v}**`),
    ``,
    `## Planner output — plannerStatus`,
    ``,
    ...[...Object.entries(summary.byPlannerStatus || {})].map(([k, v]) => `- \`${k}\`: **${v}**`),
    ``,
    `## Adapter`,
    ``,
    `- Warnings total: **${summary.adapterWarningsTotal}** (by code below)`,
    ...Object.entries(summary.adapterWarningsByCode || {}).map(([k, v]) => `  - \`${k}\`: ${v}`),
    ``,
    `## Counts`,
    ``,
    `- Missing-field rows (adapter): **${summary.missingFieldRows}**`,
    `- Missing-field keys (aggregated): ${JSON.stringify(summary.missingFieldCounts || {})}`,
    `- needs_human_review outputs: **${summary.needsHumanReviewCount}**`,
    `- insufficient_data outputs: **${summary.insufficientDataCount}**`,
    `- English skillTaggingIncomplete inputs: **${summary.englishSkillTaggingIncompleteCount}**`,
    ``,
    `## Metadata index`,
    ``,
    `- \`availableQuestionMetadata_missing\` (baseline, no index): **${summary.baselineAvailableQuestionMetadataMissingCount ?? "n/a"}**`,
    `- \`availableQuestionMetadata_missing\` (after index): **${summary.afterAvailableQuestionMetadataMissingCount ?? "n/a"}**`,
    `- Inputs with metadata (len > 0): **${summary.inputsWithAvailableMetadata ?? "n/a"}**`,
    `- Average candidates per input (when len > 0): **${summary.averageCandidatesWhenPresent ?? "n/a"}**`,
    `- Subject fallback resolutions: **${summary.metadataSubjectFallbackCount ?? 0}**`,
    `- Subject fallback (baseline, no unit skill fields): **${summary.metadataSubjectFallbackBaselineCount ?? "n/a"}**`,
    `- Skill-only fallback resolutions: **${summary.metadataSkillOnlyFallbackCount ?? 0}**`,
    `- Metadata exact match (no subject/skill-only fallback): **${summary.metadataExactMatchCount ?? 0}**`,
    `- Skill+subskill query matches (same): **${summary.metadataSkillSubskillMatchCount ?? 0}**`,
    `- Units with facet skill alignment fields: **${summary.alignmentEnrichedUnitCount ?? 0}**`,
    `- \`skillAlignmentCoverage\` (runs with non-missing confidence / runs): **${summary.skillAlignmentCoverage ?? "n/a"}**`,
    `- \`skillAlignmentBySource\`: \`${JSON.stringify(summary.skillAlignmentBySource || {})}\``,
    `- \`skillAlignmentWarnings\` (total): **${summary.skillAlignmentWarningsTotal ?? 0}**`,
    `- Metadata index source: **${summary.metadataIndexSource || "unknown"}**`,
    summary.metadataSnapshotPath ? `- Snapshot path: \`${summary.metadataSnapshotPath}\`` : "",
    `- Index stats: \`${JSON.stringify(summary.metadataIndexStats || {})}\``,
    `- Subject coverage (runs): \`${JSON.stringify(summary.subjectCoverage || {})}\``,
    ``,
    `## Safety`,
    ``,
    `- Safety violations: **${summary.safetyViolationCount}**`,
    summary.safetyViolationCount
      ? `- First examples:\n${(summary.safetyExamples || []).map((s) => `  - ${s}`).join("\n")}`
      : `- All checks passed.`,
    ``,
    `## Examples (first ${(summary.examples || []).length})`,
    ``,
    ...(summary.examples || []).map(
      (e) =>
        `### ${e.label}\n- nextAction: \`${e.nextAction}\`  plannerStatus: \`${e.plannerStatus}\`\n- warnings: ${(e.warnings || []).join(", ") || "(none)"}\n`
    ),
  ];
  return lines.join("\n");
}

async function main() {
  const generatedAt = new Date().toISOString();
  let metadataIndex = await tryLoadMetadataIndexFromSnapshot(ROOT);
  let metadataIndexSource = "snapshot_file";
  if (!metadataIndex) {
    metadataIndexSource = "in_memory_scan";
    metadataIndex = await buildPlannerQuestionMetadataIndex({ rootAbs: ROOT });
  } else {
    console.log(`Adaptive planner: using metadata index snapshot (${metadataIndex.entries.length} entries)`);
  }
  const smoke = runPlannerMetadataProviderSmokeChecks(metadataIndex);
  if (smoke.errors.length) {
    console.error("Metadata provider smoke checks failed:", smoke.errors);
    process.exit(1);
  }

  const paths = await collectReportArtifactPaths(ROOT);
  /** @type {{ label: string, report: object, focusUnitIndex: number, fileAbs: string|null, metaOpts?: object }[]} */
  const tasks = [];

  for (const abs of paths) {
    let report;
    try {
      report = JSON.parse(await readFile(abs, "utf8"));
    } catch {
      continue;
    }
    const indices = listDiagnosticUnitIndices(report);
    const slice = indices.length ? indices.slice(0, MAX_UNITS_PER_FILE) : [0];
    for (const idx of slice) {
      const rel = relative(ROOT, abs);
      const label = indices.length ? `${rel}#unit${idx}` : rel;
      tasks.push({ label, report, focusUnitIndex: idx, fileAbs: abs });
    }
  }

  for (const fx of FIXTURE_PAYLOADS) {
    tasks.push({
      label: `fixture:${fx._fixtureLabel}`,
      report: fx,
      focusUnitIndex: 0,
      fileAbs: null,
      metaOpts: {},
    });
  }

  let baselineAvailableQuestionMetadataMissingCount = 0;
  for (const t of tasks) {
    const { warnings } = buildPlannerInputFromDiagnosticPayload(t.report, { focusUnitIndex: t.focusUnitIndex });
    if (warnings.includes("availableQuestionMetadata_missing")) baselineAvailableQuestionMetadataMissingCount += 1;
  }

  /** @type {object[]} */
  const rows = [];
  const byNextAction = countMap();
  const byPlannerStatus = countMap();
  const adapterWarningsByCode = countMap();
  const missingFieldCounts = countMap();
  let adapterWarningsTotal = 0;
  let missingFieldRows = 0;
  let needsHumanReviewCount = 0;
  let insufficientDataCount = 0;
  let englishSkillTaggingIncompleteCount = 0;
  let afterAvailableQuestionMetadataMissingCount = 0;
  let inputsWithAvailableMetadata = 0;
  let totalCandidatesWhenPresent = 0;
  let metadataSubjectFallbackCount = 0;
  let metadataSubjectFallbackBaselineCount = 0;
  let metadataSkillOnlyFallbackCount = 0;
  let metadataExactMatchCount = 0;
  let metadataSkillSubskillMatchCount = 0;
  let alignmentEnrichedUnitCount = 0;
  const skillAlignmentBySource = countMap();
  let skillAlignmentWarningsTotal = 0;
  const subjectCoverage = countMap();
  /** @type {string[]} */
  const safetyViolations = [];

  for (const t of tasks) {
    const { sourceInfo: siBase } = buildPlannerInputFromDiagnosticPayload(
      {
        ...t.report,
        facets: {
          ...t.report.facets,
          diagnostic: {
            ...t.report.facets?.diagnostic,
            unitSummaries: (t.report.facets?.diagnostic?.unitSummaries || []).map((row, j) =>
              j === (t.focusUnitIndex ?? 0)
                ? {
                    ...row,
                    skillId: undefined,
                    subskillId: undefined,
                    skillAlignmentConfidence: undefined,
                    skillAlignmentSource: undefined,
                    skillAlignmentWarnings: undefined,
                  }
                : row
            ),
          },
        },
      },
      { focusUnitIndex: t.focusUnitIndex, metadataIndex, metadataQueryLimit: 14 }
    );
    if (siBase?.metadataResolution?.subjectFallback) metadataSubjectFallbackBaselineCount += 1;
  }

  /**
   * @param {string} label
   * @param {object} report
   * @param {number} focusUnitIndex
   * @param {object} [metaOpts]
   * @param {string|null} fileAbs — source file for real artifacts (fixtures: null)
   */
  async function runOne(label, report, focusUnitIndex, metaOpts, fileAbs = null) {
    const { input, warnings, missingFields, sourceInfo } = buildPlannerInputFromDiagnosticPayload(report, {
      focusUnitIndex,
      availableQuestionMetadata: metaOpts?.availableQuestionMetadata,
      metadataIndex,
      metadataQueryLimit: 14,
    });
    for (const w of warnings) {
      adapterWarningsTotal += 1;
      bump(adapterWarningsByCode, w);
    }
    if (missingFields.length) {
      missingFieldRows += 1;
      for (const m of missingFields) bump(missingFieldCounts, m);
    }
    if (input.skillTaggingIncomplete && String(input.subject || "").toLowerCase() === "english") {
      englishSkillTaggingIncompleteCount += 1;
    }
    if (warnings.includes("availableQuestionMetadata_missing")) afterAvailableQuestionMetadataMissingCount += 1;
    const metaLen = (input.availableQuestionMetadata || []).length;
    if (metaLen > 0) {
      inputsWithAvailableMetadata += 1;
      totalCandidatesWhenPresent += metaLen;
    }
    bump(subjectCoverage, String(input.subject || "unknown"));
    const mr = sourceInfo?.metadataResolution;
    if (mr?.subjectFallback) metadataSubjectFallbackCount += 1;
    if (mr?.skillOnlyFallback) metadataSkillOnlyFallbackCount += 1;
    if (metaLen > 0 && mr && !mr.subjectFallback && !mr.skillOnlyFallback) {
      metadataExactMatchCount += 1;
      metadataSkillSubskillMatchCount += 1;
    }
    const ac = String(sourceInfo?.skillAlignmentConfidence || "").toLowerCase();
    if (ac && ac !== "missing") {
      alignmentEnrichedUnitCount += 1;
      bump(skillAlignmentBySource, String(sourceInfo?.skillAlignmentSource || "unknown"));
    }
    const aw = sourceInfo?.skillAlignmentWarnings;
    if (Array.isArray(aw)) skillAlignmentWarningsTotal += aw.length;
    const out = planAdaptiveLearning(input);
    bump(byNextAction, out.nextAction);
    bump(byPlannerStatus, out.plannerStatus);
    if (out.plannerStatus === "needs_human_review") needsHumanReviewCount += 1;
    if (out.plannerStatus === "insufficient_data") insufficientDataCount += 1;
    const v = runArtifactSafetyAssertions(input, out);
    for (const x of v) safetyViolations.push(`${label}: ${x}`);
    rows.push({
      label,
      relativePath: fileAbs ? relative(ROOT, fileAbs) : label,
      focusUnitIndex,
      sourceInfo,
      warnings,
      missingFields,
      inputSnapshot: {
        subject: input.subject,
        engineDecision: input.engineDecision,
        dataQuality: input.dataQuality,
        skillTaggingIncomplete: input.skillTaggingIncomplete,
        doNotConcludeLen: (input.doNotConclude || []).length,
        metaLen: (input.availableQuestionMetadata || []).length,
        metadataCandidateCount: sourceInfo?.metadataResolution?.candidateCount ?? 0,
        metadataSubjectFallback: !!sourceInfo?.metadataResolution?.subjectFallback,
        metadataSkillOnlyFallback: !!sourceInfo?.metadataResolution?.skillOnlyFallback,
        currentSkillId: input.currentSkillId || "",
        currentSubskillId: input.currentSubskillId || "",
      },
      output: {
        plannerStatus: out.plannerStatus,
        nextAction: out.nextAction,
        reasonCodes: out.reasonCodes,
        targetDifficulty: out.targetDifficulty,
        questionCount: out.questionCount,
        targetSkillId: out.targetSkillId || "",
        targetSubskillId: out.targetSubskillId || "",
        requiresHumanReview: !!out.requiresHumanReview,
      },
    });
  }

  for (const t of tasks) {
    await runOne(t.label, t.report, t.focusUnitIndex, t.metaOpts || {}, t.fileAbs);
  }

  const byNextActionObj = Object.fromEntries(byNextAction);
  const byPlannerStatusObj = Object.fromEntries(byPlannerStatus);
  const adapterWarnObj = Object.fromEntries(adapterWarningsByCode);

  const examples = rows.slice(0, 5).map((r) => ({
    label: r.label,
    nextAction: r.output.nextAction,
    plannerStatus: r.output.plannerStatus,
    warnings: r.warnings,
  }));

  const averageCandidatesWhenPresent =
    inputsWithAvailableMetadata > 0 ? Math.round((totalCandidatesWhenPresent / inputsWithAvailableMetadata) * 1000) / 1000 : 0;

  const skillAlignmentCoverage =
    rows.length > 0 ? Math.round((alignmentEnrichedUnitCount / rows.length) * 1000) / 1000 : 0;

  const summary = {
    generatedAt,
    metadataIndexSource,
    metadataSnapshotPath:
      metadataIndexSource === "snapshot_file" ? "reports/adaptive-learning-planner/metadata-index-snapshot.json" : null,
    artifactsScanned: paths.length,
    artifactPathSample: paths.slice(0, 24).map((p) => relative(ROOT, p)),
    candidatePayloads: rows.length,
    plannerInputsBuilt: rows.length,
    byNextAction: byNextActionObj,
    byPlannerStatus: byPlannerStatusObj,
    adapterWarningsTotal,
    adapterWarningsByCode: adapterWarnObj,
    missingFieldCounts: Object.fromEntries(missingFieldCounts),
    missingFieldRows,
    needsHumanReviewCount,
    insufficientDataCount,
    englishSkillTaggingIncompleteCount,
    baselineAvailableQuestionMetadataMissingCount,
    afterAvailableQuestionMetadataMissingCount,
    inputsWithAvailableMetadata,
    averageCandidatesWhenPresent,
    metadataSubjectFallbackCount,
    metadataSubjectFallbackBaselineCount,
    metadataSkillOnlyFallbackCount,
    metadataExactMatchCount,
    metadataSkillSubskillMatchCount,
    alignmentEnrichedUnitCount,
    skillAlignmentCoverage,
    skillAlignmentBySource: Object.fromEntries(skillAlignmentBySource),
    skillAlignmentWarningsTotal,
    metadataIndexStats: metadataIndex.stats,
    subjectCoverage: Object.fromEntries(subjectCoverage),
    safetyViolationCount: safetyViolations.length,
    safetyExamples: safetyViolations.slice(0, 12),
    examples,
    rows,
  };

  const ser = JSON.stringify(summary);
  if (/\b"stem"\s*:/i.test(ser) || /\b"question"\s*:/i.test(ser) || /\b"prompt"\s*:/i.test(ser)) {
    console.error("Artifact summary leak check: forbidden question-text keys in JSON output");
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(OUT_JSON, JSON.stringify(summary, null, 2), "utf8");
  await writeFile(OUT_MD, buildMarkdown(summary), "utf8");

  if (safetyViolations.length) {
    console.error(`Adaptive planner artifact safety: ${safetyViolations.length} violation(s)`);
    for (const s of safetyViolations.slice(0, 20)) console.error(`  - ${s}`);
    process.exit(1);
  }
  console.log(`OK — ${rows.length} planner runs; wrote ${relative(ROOT, OUT_JSON)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
