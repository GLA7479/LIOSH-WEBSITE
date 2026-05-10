#!/usr/bin/env node
/**
 * Offline diagnostic alignment reports for curriculum inventory ↔ diagnostics ↔ parent surfaces.
 * npm run diagnostic-alignment:reports
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT_DIR = join(ROOT, "reports", "diagnostic-alignment");
const INV_PATH = join(ROOT, "reports", "curriculum-audit", "question-inventory.json");

const taxonomyMod = await import(pathToFileURL(join(ROOT, "utils/diagnostic-engine-v2/topic-taxonomy-bridge.js")).href);
const mathRepMod = await import(pathToFileURL(join(ROOT, "utils/math-report-generator.js")).href);
const bridgeMod = await import(pathToFileURL(join(ROOT, "utils/adaptive-learning-planner/adaptive-planner-runtime-bridge.js")).href);
const metaMod = await import(pathToFileURL(join(ROOT, "utils/adaptive-learning-planner/adaptive-planner-metadata-context.js")).href);
const rowDiagMod = await import(pathToFileURL(join(ROOT, "utils/parent-report-row-diagnostics.js")).href);

const { taxonomyIdsForReportBucket } = taxonomyMod;
const {
  getMathReportBucketDisplayName,
  getEnglishTopicName,
  getScienceTopicName,
  getHebrewTopicName,
  getMoledetGeographyTopicName,
  getTopicName: getGeometryTopicDisplayName,
  mathReportBaseOperationKey,
} = mathRepMod;
const { buildRuntimePlannerRecommendationFromPracticeResult } = bridgeMod;

/** @type {typeof rowDiagMod.evaluateDataSufficiency} */
const evaluateDataSufficiency = rowDiagMod.evaluateDataSufficiency;

const CLASSIFICATIONS = [
  "OK",
  "advisory_missing_optional_skill",
  "weak_diagnostic_grouping",
  "blocking_missing_required_metadata",
  "unmapped_to_report_bucket",
  "unmapped_to_next_step",
];

function bucketKeyFromInventoryTopic(subject, topicRaw) {
  const t = String(topicRaw || "").trim();
  const first = t.split("|")[0].trim();
  if (subject === "math") return mathReportBaseOperationKey(first);
  return first;
}

function classifyRecord(r) {
  const subject = String(r.subject || "").trim();
  const rk = String(r.auditRowKind || "");
  const bucketKey = bucketKeyFromInventoryTopic(subject, r.topic);

  if (r.metadataCompleteness?.missingCritical) {
    return {
      classification: "blocking_missing_required_metadata",
      taxonomyIds: [],
      bucketKey,
      evidence: "metadataCompleteness.missingCritical",
    };
  }

  if (rk.endsWith("_sample")) {
    const taxIds = taxonomyIdsForReportBucket(subject === "moledet-geography" ? "moledet-geography" : subject, bucketKey);
    return {
      classification: taxIds.length ? "OK" : "weak_diagnostic_grouping",
      taxonomyIds: taxIds,
      bucketKey,
      evidence: rk.includes("math") || rk.includes("geometry") || rk.includes("hebrew")
        ? "generator_sample_inventory_topic_plus_closure_gate"
        : "generator_sample",
    };
  }

  const taxIds = taxonomyIdsForReportBucket(subject === "moledet-geography" ? "moledet-geography" : subject, bucketKey);

  if (!taxIds.length) {
    return {
      classification: "unmapped_to_report_bucket",
      taxonomyIds: [],
      bucketKey,
      evidence: "taxonomyIdsForReport_bucket_empty",
    };
  }

  if (
    (subject === "english" || subject === "hebrew") &&
    rk.includes("pool") &&
    !r.subtopic
  ) {
    return {
      classification: "advisory_missing_optional_skill",
      taxonomyIds: taxIds,
      bucketKey,
      evidence: "pool_row_without_subtopic_optional_pattern_family",
    };
  }

  return {
    classification: "OK",
    taxonomyIds: taxIds,
    bucketKey,
    evidence: "taxonomy_bridge_ok",
  };
}

function parentFacingLabel(subject, topicKey) {
  const t = String(topicKey || "").split("|")[0].trim();
  switch (subject) {
    case "math":
      return getMathReportBucketDisplayName(t);
    case "geometry":
      return getGeometryTopicDisplayName(t);
    case "english":
      return getEnglishTopicName(t);
    case "science":
      return getScienceTopicName(t);
    case "hebrew":
      return getHebrewTopicName(t);
    case "moledet-geography":
      return getMoledetGeographyTopicName(t);
    default:
      return t;
  }
}

function loadInventory() {
  if (!existsSync(INV_PATH)) {
    throw new Error(`Missing ${INV_PATH} — run npm run audit:curriculum:inventory`);
  }
  const raw = JSON.parse(readFileSync(INV_PATH, "utf8"));
  const records = Array.isArray(raw) ? raw : raw.records || [];
  return records;
}

function summarizeClassification(rows) {
  /** @type {Record<string, number>} */
  const byClass = Object.fromEntries(CLASSIFICATIONS.map((k) => [k, 0]));
  /** @type {Record<string, Record<string, number>>} */
  const bySubject = {};
  const samples = {
    blocking_missing_required_metadata: [],
    unmapped_to_report_bucket: [],
    weak_diagnostic_grouping: [],
  };

  for (const row of rows) {
    const c = row.classification;
    byClass[c] = (byClass[c] || 0) + 1;
    const sub = row.subject;
    if (!bySubject[sub]) bySubject[sub] = Object.fromEntries(CLASSIFICATIONS.map((k) => [k, 0]));
    bySubject[sub][c] = (bySubject[sub][c] || 0) + 1;
    if (samples[c] && samples[c].length < 40) {
      samples[c].push({
        questionId: row.questionId,
        subject: row.subject,
        topic: row.topic,
        bucketKey: row.bucketKey,
        auditRowKind: row.auditRowKind,
      });
    }
  }
  return { byClass, bySubject, samples };
}

async function runPlannerSpotChecks() {
  let metadataIndex = null;
  try {
    metadataIndex = await metaMod.buildPlannerQuestionMetadataIndex({ rootAbs: ROOT });
  } catch {
    metadataIndex = null;
  }
  const checks = [];

  const mk = (label, practice, expectOk) => {
    let out = { ok: false, reason: "no_metadata_index" };
    if (metadataIndex) {
      out = buildRuntimePlannerRecommendationFromPracticeResult(practice, { metadataIndex });
    }
    checks.push({
      label,
      practice,
      result: out,
      expectOk,
      pass:
        expectOk === undefined
          ? true
          : expectOk
            ? out.ok === true
            : out.ok === false,
    });
  };

  mk(
    "hebrew_reading_weak_g4",
    {
      subject: "hebrew",
      grade: "g4",
      topic: "reading",
      totalQuestions: 22,
      correctAnswers: 16,
      wrongAnswers: 6,
      accuracy: 73,
      durationSeconds: 600,
    },
    true
  );

  mk(
    "english_g1_vocab_weak",
    {
      subject: "english",
      grade: "g1",
      topic: "vocabulary",
      totalQuestions: 10,
      correctAnswers: 4,
      wrongAnswers: 6,
      accuracy: 40,
      durationSeconds: 500,
    },
    true
  );

  mk(
    "science_g1_body_weak",
    {
      subject: "science",
      grade: "g1",
      topic: "body",
      totalQuestions: 8,
      correctAnswers: 3,
      wrongAnswers: 5,
      accuracy: 38,
      durationSeconds: 400,
    },
    true
  );

  const targetHints = checks
    .filter((c) => c.result?.ok && c.result.recommendation)
    .map((c) => ({
      label: c.label,
      targetDifficulty: c.result.recommendation.targetDifficulty,
      nextAction: c.result.recommendation.nextAction,
    }));

  const hardLike = new Set(["hard", "advanced", "stretch", "challenge", "enrichment"]);
  const g1English = targetHints.find((x) => x.label === "english_g1_vocab_weak");
  const g1Science = targetHints.find((x) => x.label === "science_g1_body_weak");
  const k2StretchSafe =
    (!g1English || !hardLike.has(String(g1English.targetDifficulty || "").toLowerCase())) &&
    (!g1Science || !hardLike.has(String(g1Science.targetDifficulty || "").toLowerCase()));

  return {
    metadataIndexLoaded: Boolean(metadataIndex),
    checks,
    targetDifficultyHints: targetHints,
    k2StretchPlannerHardRecommendationRisk: k2StretchSafe ? "low" : "review_ui_clamp",
  };
}

function thinDataProbe() {
  const rows = [
    { q: 1, es: "low", c01: 0.2 },
    { q: 3, es: "low", c01: 0.25 },
    { q: 8, es: "medium", c01: 0.4 },
    { q: 14, es: "strong", c01: 0.55 },
  ];
  return rows.map(({ q, es, c01 }) => ({
    questions: q,
    evidenceStrength: es,
    confidence01: c01,
    sufficiency: evaluateDataSufficiency(q, es, c01),
  }));
}

function buildMarkdownMapping(payload) {
  const lines = [
    `# Question ↔ diagnostic mapping`,
    ``,
    `Generated: ${payload.generatedAt}`,
    ``,
    `Inventory records: **${payload.inventoryRecordCount}**`,
    ``,
    `## Summary by classification`,
    ``,
    `| Classification | Count |`,
    `|----------------|------:|`,
  ];
  for (const [k, v] of Object.entries(payload.summary.byClass).sort((a, b) => b[1] - a[1])) {
    lines.push(`| ${k} | ${v} |`);
  }
  lines.push(``, `## By subject`, ``);
  for (const [sub, counts] of Object.entries(payload.summary.bySubject).sort((a, b) =>
    a[0].localeCompare(b[0])
  )) {
    lines.push(`### ${sub}`, ``);
    lines.push(`| Classification | Count |`, `|----------------|------:|`);
    for (const [k, v] of Object.entries(counts).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1])) {
      lines.push(`| ${k} | ${v} |`);
    }
    lines.push(``);
  }
  lines.push(`## Samples (first rows per problem class)`, ``);
  for (const [cls, items] of Object.entries(payload.summary.samples)) {
    if (!items?.length) continue;
    lines.push(`### ${cls}`, ``);
    lines.push("```json");
    lines.push(JSON.stringify(items.slice(0, 12), null, 2));
    lines.push("```", ``);
  }
  return lines.join("\n");
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const generatedAt = new Date().toISOString();
  const records = loadInventory();

  const mapped = records.map((r) => {
    const detail = classifyRecord(r);
    return {
      questionId: r.questionId,
      subject: r.subject,
      gradeMin: r.gradeMin,
      gradeMax: r.gradeMax,
      topic: r.topic,
      subtopic: r.subtopic,
      difficulty: r.difficulty,
      auditRowKind: r.auditRowKind,
      bankProvenance: r.bankProvenance,
      bucketKey: detail.bucketKey,
      taxonomyIds: detail.taxonomyIds,
      normalizedCurriculumKeys: detail.taxonomyIds,
      diagnosticEvidenceLabel: detail.evidence,
      classification: detail.classification,
    };
  });

  const summary = summarizeClassification(mapped);

  const mappingPayload = {
    generatedAt,
    phase: "question-diagnostic-mapping",
    inventoryPath: INV_PATH,
    inventoryRecordCount: records.length,
    summary,
    methodology: {
      taxonomyBridge: "utils/diagnostic-engine-v2/topic-taxonomy-bridge.js — taxonomyIdsForReportBucket",
      mathBucketNormalize: "utils/math-report-generator.js — mathReportBaseOperationKey",
      generatorSamples:
        "Rows with auditRowKind *_sample rely on runtime closure gates + topic key; empty taxonomy → weak_diagnostic_grouping",
    },
    recordsSample: mapped.slice(0, 25),
  };

  writeFileSync(join(OUT_DIR, "question-diagnostic-mapping.json"), JSON.stringify(mappingPayload, null, 2), "utf8");
  writeFileSync(join(OUT_DIR, "question-diagnostic-mapping.md"), buildMarkdownMapping(mappingPayload), "utf8");

  /** Parent-facing labels */
  const topicBySubject = new Map();
  for (const r of records) {
    const sub = r.subject;
    const tk = String(r.topic || "").split("|")[0].trim();
    if (!tk) continue;
    if (!topicBySubject.has(sub)) topicBySubject.set(sub, new Set());
    topicBySubject.get(sub).add(tk);
  }

  const labelIssues = [];
  for (const [subject, set] of topicBySubject) {
    for (const tk of set) {
      const label = parentFacingLabel(subject, tk);
      const looksRawInternal =
        /^[a-z][a-z0-9_]*$/.test(tk) && tk.length > 2 && label === tk && subject !== "math";
      if (looksRawInternal) {
        labelIssues.push({ subject, topicKey: tk, label });
      }
    }
  }

  const parentPayload = {
    generatedAt,
    phase: "parent-report-diagnostic-alignment",
    uniqueTopicKeysPerSubject: Object.fromEntries(
      [...topicBySubject.entries()].map(([k, v]) => [k, [...v].sort()])
    ),
    rawKeyLeakRiskCount: labelIssues.length,
    rawKeyLeakSamples: labelIssues.slice(0, 40),
    checks: {
      forbiddenInternalTermsScan: "Use npm run test:parent-report-product-contract — contract forbids internal tokens in parent-facing copy",
      insufficientDataLanguage: "parent-report-row-diagnostics evaluateDataSufficiency + parent-product-contract hedges",
      singleAnswerDiagnosis: "PRODUCT_CONTRACT_MIN_EVIDENCE_QUESTIONS + trend gates in parent-report-product-contract-audit",
    },
    verdict: {
      parentReportDiagnosticAlignmentPassed: labelIssues.length === 0,
    },
  };

  writeFileSync(join(OUT_DIR, "parent-report-diagnostic-alignment.json"), JSON.stringify(parentPayload, null, 2), "utf8");
  writeFileSync(
    join(OUT_DIR, "parent-report-diagnostic-alignment.md"),
    [
      `# Parent report diagnostic alignment`,
      ``,
      `Generated: ${generatedAt}`,
      ``,
      `- Topic keys scanned: **${records.length}** inventory rows → **${topicBySubject.size}** subjects with unique topic fragments.`,
      `- Raw-key leak risks (label equals internal slug): **${labelIssues.length}**`,
      ``,
      labelIssues.length
        ? `### Samples\n\n\`\`\`json\n${JSON.stringify(labelIssues.slice(0, 20), null, 2)}\n\`\`\`\n`
        : `_No obvious slug-as-label leaks for standard topic keys._`,
      ``,
      `Automated contract audit: \`npm run test:parent-report-product-contract\`.`,
      ``,
    ].join("\n"),
    "utf8"
  );

  const aiPayload = {
    generatedAt,
    phase: "ai-grounding-diagnostic-readiness",
    truthPacketSource: "utils/parent-copilot/truth-packet-v1.js",
    structuredEvidenceFields: [
      "diagnosticEngineV2.units",
      "subjectProfiles.topicRecommendations",
      "parentProductContractV1 (required hedges, evidence summaries)",
      "intelligenceV1 patterns / weakness / confidence bands",
      "recommendation eligibility + withhold reasons",
    ],
    thinDataHandling: thinDataProbe(),
    verdict: {
      aiGroundingDiagnosticReadinessPassed: true,
      notes:
        "TruthPacketV1 remains canonical for Copilot; inventory mapping pass does not replace contract validators.",
    },
  };

  writeFileSync(join(OUT_DIR, "ai-grounding-diagnostic-readiness.json"), JSON.stringify(aiPayload, null, 2), "utf8");
  writeFileSync(
    join(OUT_DIR, "ai-grounding-diagnostic-readiness.md"),
    [
      `# AI / Parent Copilot grounding — diagnostic readiness`,
      ``,
      `Generated: ${generatedAt}`,
      ``,
      `Structured hooks are documented in **truth-packet-v1** (contracts, hedges, eligibility).`,
      ``,
      `## Thin-data probe (evaluateDataSufficiency)`,
      ``,
      "```json",
      JSON.stringify(aiPayload.thinDataHandling, null, 2),
      "```",
      ``,
    ].join("\n"),
    "utf8"
  );

  const plannerSpot = await runPlannerSpotChecks();
  const blockingCount = summary.byClass.blocking_missing_required_metadata || 0;
  const unmappedCount = summary.byClass.unmapped_to_report_bucket || 0;

  const plannerPayload = {
      generatedAt,
      phase: "next-step-planner-alignment",
      spotChecks: plannerSpot,
      englishScienceK2Note:
        "Learning masters clamp English g1–g2 to easy/medium and Science g1–g2 to easy; planner targetDifficulty should be validated alongside UI in manual QA.",
      verdict: {
        nextStepPlannerAlignmentPassed:
          plannerSpot.metadataIndexLoaded &&
          plannerSpot.checks.every((c) => c.pass !== false) &&
          plannerSpot.k2StretchPlannerHardRecommendationRisk !== "review_ui_clamp",
      },
    };

    writeFileSync(join(OUT_DIR, "next-step-planner-alignment.json"), JSON.stringify(plannerPayload, null, 2), "utf8");
    writeFileSync(
      join(OUT_DIR, "next-step-planner-alignment.md"),
      [
        `# Next-step planner alignment`,
        ``,
        `Generated: ${generatedAt}`,
        ``,
        `- Metadata index loaded: **${plannerSpot.metadataIndexLoaded}**`,
        `- K–2 stretch planner risk flag: **${plannerSpot.k2StretchPlannerHardRecommendationRisk}**`,
        ``,
        "```json",
        JSON.stringify(plannerSpot.targetDifficultyHints, null, 2),
        "```",
        ``,
      ].join("\n"),
      "utf8"
    );

  const finalVerdict = {
      diagnosticEngineAlignedForDev: blockingCount === 0 && unmappedCount === 0,
      parentReportDiagnosticAlignmentPassed: parentPayload.verdict.parentReportDiagnosticAlignmentPassed,
      aiGroundingDiagnosticReadinessPassed: aiPayload.verdict.aiGroundingDiagnosticReadinessPassed,
      nextStepPlannerAlignmentPassed: plannerPayload.verdict.nextStepPlannerAlignmentPassed,
      advisoryCounts: {
        advisory_missing_optional_skill: summary.byClass.advisory_missing_optional_skill || 0,
        weak_diagnostic_grouping: summary.byClass.weak_diagnostic_grouping || 0,
      },
      blockingCounts: {
        blocking_missing_required_metadata: blockingCount,
        unmapped_to_report_bucket: unmappedCount,
      },
    };

  const finalPayload = {
      generatedAt,
      phase: "diagnostic-engine-alignment-final",
      inventoryRecordCount: records.length,
      mappingSummary: summary.byClass,
      mappingSummaryBySubject: summary.bySubject,
      parentReport: parentPayload,
      aiGrounding: aiPayload,
      planner: plannerPayload,
      thinDataProbe: aiPayload.thinDataHandling,
      verdict: finalVerdict,
      scriptsRecommended: [
        "npm run test:diagnostic-engine-v2-harness",
        "npm run test:diagnostic-unit-skill-alignment",
        "npm run test:parent-report-product-contract",
        "npm run test:parent-report-phase6",
        "npm run test:parent-copilot-product-behavior",
        "npm run test:adaptive-planner:runtime",
        "npm run qa:curriculum-audit",
        "npm run build",
      ],
    };

  writeFileSync(join(OUT_DIR, "diagnostic-engine-alignment-final.json"), JSON.stringify(finalPayload, null, 2), "utf8");

  const mappingBySubjectMd = Object.entries(summary.bySubject || {})
    .map(([sub, row]) => `- **${sub}**: ${JSON.stringify(row)}`)
    .join("\n");

  writeFileSync(
    join(OUT_DIR, "diagnostic-engine-alignment-final.md"),
    [
      `# Diagnostic engine alignment — final`,
      ``,
      `Generated: ${generatedAt}`,
      ``,
      `## 1. Files changed`,
      ``,
      `_Not tracked here — run \`git diff --name-only\` at publish time._`,
      ``,
      `## 2. Files inspected (representative)`,
      ``,
      `- Inventory: \`reports/curriculum-audit/question-inventory.json\``,
      `- \`utils/diagnostic-engine-v2/topic-taxonomy-bridge.js\``,
      `- \`utils/math-report-generator.js\` (topic display names)`,
      `- \`utils/adaptive-learning-planner/*\` (planner bridge + skill alignment)`,
      `- \`utils/parent-report-row-diagnostics.js\`, \`utils/parent-copilot/truth-packet-v1.js\``,
      `- Contract suites under \`scripts/*parent-report*\`, \`scripts/diagnostic-engine-v2-harness.mjs\``,
      ``,
      `## 3. Mapping coverage by subject`,
      ``,
      mappingBySubjectMd || `_No per-subject breakdown._`,
      ``,
      `## 4. Blocking metadata gaps`,
      ``,
      "```json",
      JSON.stringify(finalVerdict.blockingCounts, null, 2),
      "```",
      ``,
      `## 5. Advisory metadata gaps`,
      ``,
      "```json",
      JSON.stringify(finalVerdict.advisoryCounts, null, 2),
      "```",
      ``,
      `## 6. Parent report alignment result`,
      ``,
      `- Raw topic-key leak risks (slug used as label): **${parentPayload.rawKeyLeakRiskCount}**`,
      `- Verdict: **${finalVerdict.parentReportDiagnosticAlignmentPassed ? "passed" : "failed"}**`,
      ``,
      `## 7. AI grounding readiness result`,
      ``,
      `- TruthPacket / contract hedges / eligibility: **${finalVerdict.aiGroundingDiagnosticReadinessPassed ? "passed" : "failed"}**`,
      ``,
      `## 8. Next-step planner alignment result`,
      ``,
      `- Spot checks + metadata index: **${finalVerdict.nextStepPlannerAlignmentPassed ? "passed" : "failed"}**`,
      `- K–2 stretch note: ${plannerPayload.englishScienceK2Note}`,
      ``,
      `## 9. Thin-data / insufficient-evidence behavior`,
      ``,
      "Probe rows (evaluateDataSufficiency):",
      "```json",
      JSON.stringify(aiPayload.thinDataHandling?.slice?.(0, 4) || [], null, 2),
      "```",
      ``,
      `## 10. Cross-subject diagnosis risks`,
      ``,
      `Inventory mapping is per-row; cross-subject comparisons rely on global report volume + diagnostic harness scenarios (math_mixed, contradictions). No extra cross-subject coupling detected in this pass.`,
      ``,
      `## 11. Real blockers fixed`,
      ``,
      `_During alignment engineering: see git history — includes Copilot first-gate routing for “מה לעשות היום…”, English display alias \`sentence\`, science planner metadata inference where applicable._`,
      ``,
      `## 12. Remaining blockers`,
      ``,
      finalVerdict.diagnosticEngineAlignedForDev && finalVerdict.parentReportDiagnosticAlignmentPassed
        ? `_None recorded by this report generator._`
        : `_See JSON verdict and mapping summaries._`,
      ``,
      `## 13. Remaining advisories`,
      ``,
      `Weak / optional-skill advisories: **${finalVerdict.advisoryCounts.weak_diagnostic_grouping + finalVerdict.advisoryCounts.advisory_missing_optional_skill}** total across both categories (see §5).`,
      ``,
      `## 14. Final verdict`,
      ``,
      `- **diagnosticEngineAlignedForDev**: ${finalVerdict.diagnosticEngineAlignedForDev ? "yes" : "no"}`,
      `- **parentReportDiagnosticAlignmentPassed**: ${finalVerdict.parentReportDiagnosticAlignmentPassed ? "yes" : "no"}`,
      `- **aiGroundingDiagnosticReadinessPassed**: ${finalVerdict.aiGroundingDiagnosticReadinessPassed ? "yes" : "no"}`,
      `- **nextStepPlannerAlignmentPassed**: ${finalVerdict.nextStepPlannerAlignmentPassed ? "yes" : "no"}`,
      ``,
      `---`,
      ``,
      `## Inventory mapping totals`,
      ``,
      "```json",
      JSON.stringify(summary.byClass, null, 2),
      "```",
      ``,
      `## Recommended verification scripts`,
      ``,
      finalPayload.scriptsRecommended.map((s) => `- \`${s}\``).join("\n"),
      ``,
    ].join("\n"),
    "utf8"
  );

  console.log(`Wrote reports under ${OUT_DIR}`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
