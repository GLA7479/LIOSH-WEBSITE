#!/usr/bin/env node
/**
 * Question metadata coverage QA — advisory (does not fail on incomplete metadata).
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

  let advisoryLabel = "WARN";
  if (allRecords.length === 0) advisoryLabel = "FAIL";
  else if (highRisk === 0 && medRisk === 0 && duplicates.length === 0 && loadErrors.length === 0) advisoryLabel = "PASS";

  const gate = {
    scanOutcome: allRecords.length > 0 ? "ok" : "error",
    partialLoadErrors: loadErrors.length > 0 && allRecords.length > 0,
    advisoryStatus: advisoryLabel,
    exitPolicy:
      "Advisory: exit 0 unless scanOutcome is error (no records parsed successfully). Incomplete metadata does not fail.",
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

  const md = [
    "# Question metadata QA",
    "",
    `- **Generated:** ${payload.generatedAt}`,
    `- **Gate:** scanOutcome=\`${gate.scanOutcome}\`, advisoryStatus=\`${gate.advisoryStatus}\``,
    `- **Questions scanned:** ${allRecords.length}`,
    `- **High / medium risk:** ${highRisk} / ${medRisk}`,
    `- **Duplicate declared IDs (cross-file):** ${duplicates.length}`,
    `- **Skill buckets below ${MIN_QUESTIONS_PER_SKILL_FOR_DIAGNOSIS} questions:** ${skillLowVolume.length}`,
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

  console.log("");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`  Question metadata QA — scanOutcome: ${gate.scanOutcome}, advisory: ${gate.advisoryStatus}`);
  console.log(`  Questions scanned: ${allRecords.length} | High risk: ${highRisk} | Medium risk: ${medRisk}`);
  console.log(`  Reports: ${SUMMARY_JSON}`);
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("");

  process.exit(allRecords.length === 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
