#!/usr/bin/env node
/**
 * Question metadata coverage QA — blocking gate for structural/taxonomy failures;
 * curriculum gaps remain advisory unless promoted in `question-metadata-gate-policy.js`.
 * npm run qa:question-metadata
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "reports", "question-metadata-qa");
const SUMMARY_JSON = join(OUT_DIR, "summary.json");
const SUMMARY_MD = join(OUT_DIR, "summary.md");
const QUESTIONS_ISSUES_JSON = join(OUT_DIR, "questions-with-issues.json");
const SKILL_COV_JSON = join(OUT_DIR, "skill-coverage.json");

function mdEscape(s) {
  return String(s ?? "").replace(/\|/g, "\\|");
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const discoveryMod = await import(new URL("../utils/question-metadata-qa/question-bank-discovery.js", import.meta.url).href);
  const STATIC_QUESTION_BANK_MODULES = discoveryMod.STATIC_QUESTION_BANK_MODULES;
  const GEOMETRY_CONCEPTUAL_BANK = discoveryMod.GEOMETRY_CONCEPTUAL_BANK;
  const PROCEDURAL_QUESTION_SOURCES = discoveryMod.PROCEDURAL_QUESTION_SOURCES;

  const summaryApi = await import(new URL("../utils/question-metadata-qa/question-metadata-summary.js", import.meta.url).href);
  const scannerApi = await import(new URL("../utils/question-metadata-qa/question-metadata-scanner.js", import.meta.url).href);
  const contractApi = await import(new URL("../utils/question-metadata-qa/question-metadata-contract.js", import.meta.url).href);
  const gatePolicy = await import(new URL("../utils/question-metadata-qa/question-metadata-gate-policy.js", import.meta.url).href);

  const buildDuplicateIdReport = summaryApi.buildDuplicateIdReport;
  const buildSkillSummaries = summaryApi.buildSkillSummaries;
  const buildSubjectSummaries = summaryApi.buildSubjectSummaries;
  const globalIssueTopN = summaryApi.globalIssueTopN;
  const scanGeometryConceptualBank = scannerApi.scanGeometryConceptualBank;
  const scanQuestionBankModule = scannerApi.scanQuestionBankModule;
  const ISSUE_CODES = contractApi.ISSUE_CODES;
  const MIN_QUESTIONS_PER_SKILL_FOR_DIAGNOSIS = contractApi.MIN_QUESTIONS_PER_SKILL_FOR_DIAGNOSIS;

  /** @type {{ path: string, error: string }[]} */
  const loadErrors = [];
  /** @type {object[]} */
  let allRecords = [];

  for (const mod of STATIC_QUESTION_BANK_MODULES) {
    try {
      const { records } = await scanQuestionBankModule(ROOT, mod.path, mod.subjectId);
      for (const r of records) {
        r.subject = mod.subjectId;
      }
      allRecords = allRecords.concat(records);
    } catch (e) {
      loadErrors.push({ path: mod.path, error: String(e?.message || e) });
    }
  }

  try {
    const { records } = await scanGeometryConceptualBank(ROOT);
    for (const r of records) {
      allRecords.push({ ...r, subject: GEOMETRY_CONCEPTUAL_BANK.subjectId });
    }
  } catch (e) {
    loadErrors.push({ path: GEOMETRY_CONCEPTUAL_BANK.path, error: String(e?.message || e) });
  }

  const duplicates = buildDuplicateIdReport(allRecords);
  const subjectSummaries = buildSubjectSummaries(allRecords);
  const skillSummaries = buildSkillSummaries(allRecords);
  const topIssues = globalIssueTopN(allRecords, 20);

  for (const dup of duplicates) {
    for (const sub of Object.keys(subjectSummaries)) {
      const files = subjectSummaries[sub].filePaths || [];
      const hit = dup.files.some((f) => files.includes(f));
      if (hit) subjectSummaries[sub].duplicateIdsInSubject += 1;
    }
  }

  const highRisk = allRecords.filter((r) => r.riskLevel === "high").length;
  const medRisk = allRecords.filter((r) => r.riskLevel === "medium").length;

  const skillLowVolume = skillSummaries.filter(
    (s) => !s.enoughQuestionsForReliableDiagnosis && s.skillId !== "__missing_skill__"
  );

  const gateRollup = gatePolicy.computeMetadataGateRollup({
    records: allRecords,
    loadErrors,
    duplicates,
    riskTotals: { highRiskCount: highRisk, mediumRiskCount: medRisk },
  });

  const parseOk = gateRollup.parseOk;
  const scanOutcome = parseOk ? "ok" : "error";

  let advisoryStatus = "WARN";
  if (scanOutcome !== "ok") advisoryStatus = "FAIL";
  else if (gateRollup.gateDecision === "pass_with_advisory") advisoryStatus = "WARN";
  else if (gateRollup.gateDecision === "pass") advisoryStatus = "PASS";

  const gate = {
    scanOutcome,
    partialLoadErrors: loadErrors.length > 0 && allRecords.length > 0,
    advisoryStatus,
    gateDecision: gateRollup.gateDecision,
    blockingIssueCount: gateRollup.blockingIssueCount,
    advisoryIssueCount: gateRollup.advisoryIssueCount,
    exemptedIssueCount: gateRollup.exemptedIssueCount,
    blockingIssuesByCode: gateRollup.blockingIssuesByCode,
    advisoryIssuesByCode: gateRollup.advisoryIssuesByCode,
    blockingFiles: gateRollup.blockingFiles,
    knownExemptions: gateRollup.knownExemptions,
    exitPolicy:
      "Exit 1 if scanOutcome is error (no records or load failures) or gateDecision is fail_blocking_metadata. Advisory gaps alone exit 0.",
    recordsParsed: allRecords.length,
    loadErrorsCount: loadErrors.length,
    proceduralSourcesDocumented: PROCEDURAL_QUESTION_SOURCES.length,
  };

  const payload = {
    version: 1,
    generatedAt: new Date().toISOString(),
    gate,
    discovery: {
      staticModulesScanned: STATIC_QUESTION_BANK_MODULES.length,
      geometryConceptual: GEOMETRY_CONCEPTUAL_BANK,
      proceduralSources: PROCEDURAL_QUESTION_SOURCES,
      bankPaths: STATIC_QUESTION_BANK_MODULES.map((m) => m.path),
    },
    totals: {
      questionsScanned: allRecords.length,
      highRiskCount: highRisk,
      mediumRiskCount: medRisk,
      duplicateDeclaredIds: duplicates.length,
      skillBucketsLowVolume: skillLowVolume.length,
      minQuestionsPerSkillThreshold: MIN_QUESTIONS_PER_SKILL_FOR_DIAGNOSIS,
    },
    topMissingMetadataFields: topIssues,
    subjectSummaries,
    duplicateIds: duplicates.slice(0, 80),
    loadErrors,
    issueCodeReference: ISSUE_CODES,
  };

  const withIssues = allRecords.filter((r) => (r.issues || []).length > 0);
  const questionsPayload = {
    version: 1,
    generatedAt: payload.generatedAt,
    count: withIssues.length,
    sampleLimitNote: "Full list truncated to 5000 rows for size",
    questions: withIssues.slice(0, 5000),
  };

  await writeFile(SUMMARY_JSON, JSON.stringify(payload, null, 2), "utf8");
  await writeFile(SKILL_COV_JSON, JSON.stringify({ version: 1, generatedAt: payload.generatedAt, skills: skillSummaries }, null, 2), "utf8");
  await writeFile(QUESTIONS_ISSUES_JSON, JSON.stringify(questionsPayload, null, 2), "utf8");

  const topBlocking = Object.entries(gate.blockingIssuesByCode || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);
  const topAdvisory = Object.entries(gate.advisoryIssuesByCode || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);

  const md = [
    "# Question metadata QA",
    "",
    `- **Generated:** ${payload.generatedAt}`,
    `- **Gate decision:** \`${gate.gateDecision}\` — scanOutcome=\`${gate.scanOutcome}\`, advisoryStatus=\`${gate.advisoryStatus}\``,
    `- **Blocking issues (policy):** ${gate.blockingIssueCount} | **Advisory:** ${gate.advisoryIssueCount} | **Exempt (catalog):** ${gate.exemptedIssueCount}`,
    `- **Questions scanned:** ${allRecords.length}`,
    `- **High / medium risk:** ${highRisk} / ${medRisk}`,
    `- **Duplicate declared IDs (cross-file):** ${duplicates.length}`,
    `- **Skill buckets below ${MIN_QUESTIONS_PER_SKILL_FOR_DIAGNOSIS} questions:** ${skillLowVolume.length}`,
    "",
    "## Blocking vs advisory (policy gate)",
    "",
    "| Policy field | Value |",
    "| --- | --- |",
    `| gateDecision | ${mdEscape(gate.gateDecision)} |`,
    `| blockingIssueCount | ${gate.blockingIssueCount} |`,
    `| advisoryIssueCount | ${gate.advisoryIssueCount} |`,
    `| exemptedIssueCount | ${gate.exemptedIssueCount} |`,
    "",
    "### Top blocking codes",
    "",
    topBlocking.length
      ? ["| Code | Count |", "| --- | ---: |", ...topBlocking.map(([c, n]) => `| ${mdEscape(c)} | ${n} |`)].join("\n")
      : "_None._",
    "",
    "### Top advisory codes",
    "",
    topAdvisory.length
      ? ["| Code | Count |", "| --- | ---: |", ...topAdvisory.map(([c, n]) => `| ${mdEscape(c)} | ${n} |`)].join("\n")
      : "_None._",
    "",
    "### Known exemptions",
    "",
    "English **missing_skillId** / **missing_subskillId** on grammar pools are deferred per safe-pass policy — see `utils/question-metadata-qa/question-metadata-gate-policy.js`.",
    "",
    "## Subject readiness (rollup)",
    "",
    "| Subject | Questions | Readiness | % skillId | % expl | High risk |",
    "| --- | ---: | --- | ---: | ---: | ---: |",
    ...Object.values(subjectSummaries).map((s) =>
      [
        `| ${mdEscape(s.subject)} | ${s.totalQuestions} | ${mdEscape(s.readinessScore)} | ${s.pctWithSkillId} | ${s.pctWithExplanation} | ${s.highRiskQuestionCount} |`,
      ].join("")
    ),
    "",
    "## Top issue codes (global)",
    "",
    "| Code | Count |",
    "| --- | ---: |",
    ...topIssues.map(([c, n]) => `| ${mdEscape(c)} | ${n} |`),
    "",
    "## Outputs",
    "",
    `- \`reports/question-metadata-qa/summary.json\` — full payload`,
    `- \`reports/question-metadata-qa/skill-coverage.json\` — per-skill coverage`,
    `- \`reports/question-metadata-qa/questions-with-issues.json\` — questions with any issue (truncated)`,
    "",
    "## Load errors",
    "",
    loadErrors.length ? loadErrors.map((e) => `- **${mdEscape(e.path)}:** ${mdEscape(e.error)}`).join("\n") : "_None._",
    "",
  ].join("\n");

  await writeFile(SUMMARY_MD, md, "utf8");

  const blockingFail = gate.gateDecision === "fail_blocking_metadata" || scanOutcome !== "ok";

  console.log("");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`  Question metadata QA — gateDecision: ${gate.gateDecision}`);
  console.log(`  scanOutcome: ${gate.scanOutcome} | advisoryStatus: ${gate.advisoryStatus}`);
  console.log(`  Blocking (policy): ${gate.blockingIssueCount} | Advisory: ${gate.advisoryIssueCount} | Exempt: ${gate.exemptedIssueCount}`);
  console.log(`  High risk: ${highRisk} | Medium risk: ${medRisk}`);
  console.log(`  Top blocking: ${topBlocking.map(([c, n]) => `${c}=${n}`).join(", ") || "—"}`);
  console.log(`  Top advisory: ${topAdvisory.map(([c, n]) => `${c}=${n}`).join(", ") || "—"}`);
  console.log(`  Reports: ${SUMMARY_JSON}`);
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("");

  process.exit(blockingFail ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
