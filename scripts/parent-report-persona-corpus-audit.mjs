import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "reports", "parent-report-persona-corpus");
mkdirSync(OUT_DIR, { recursive: true });

const { PARENT_REPORT_PERSONA_CORPUS } = await import(
  pathToFileURL(join(ROOT, "tests", "fixtures", "parent-report-persona-corpus.mjs")).href
);

function cleanText(v) {
  return String(v || "").replace(/\s+/g, " ").trim();
}
function normalize(v) {
  return cleanText(v).toLowerCase();
}
function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}
function hasAny(text, words) {
  return words.some((w) => String(text || "").includes(w));
}
function inferFocus(topText) {
  if (/אין מספיק נתונים|נתונים חלקיים/.test(topText)) return "insufficient_data";
  if (/מהירות|קצב/.test(topText)) return "speed_behavior";
  if (/לשמר|להמשיך|יציב|שמירה/.test(topText)) return "strength_maintain";
  if (/גיאומטר|היקף|שטח/.test(topText)) return "weakness_geometry";
  if (/עברית|דקדוק|קריאה/.test(topText)) return "weakness_hebrew";
  if (/מתמט|חיבור|חיסור|שבר/.test(topText)) return "weakness_math";
  if (/ירידה|החמרה/.test(topText)) return "trend_down";
  if (/שיפור|משתפר/.test(topText)) return "trend_up";
  if (/יציב|שטוח/.test(topText)) return "trend_flat";
  return "mixed_priority";
}

const FORBIDDEN_INTERNAL_PARENT_TERMS = [
  "P1",
  "P2",
  "P3",
  "P4",
  "gate",
  "canonical",
  "actionState",
  "confidenceBand",
  "withhold",
  "probe_only",
  "decisionTier",
  "outputGating",
  "rowSignals",
];
const STRONG_TREND_WORDS = ["משתפר", "בירידה", "מגמה חיובית", "מגמה שלילית", "שיפור מבוסס", "ירידה מבוססת"];
const REMEDIATION_WORDS = ["פער ידע", "שיקום", "התערבות אגרסיבית", "remediate"];

const rows = [];
const summaryKeys = new Map();
const topContracts = [];
for (const p of PARENT_REPORT_PERSONA_CORPUS) {
  const short = readJson(join(OUT_DIR, "json", `${p.id}.short.json`));
  const detailed = readJson(join(OUT_DIR, "json", `${p.id}.detailed.json`));
  const top = detailed?.parentProductContractV1?.top || {};
  const subjects = detailed?.parentProductContractV1?.subjects || {};
  const subjectRows = Object.values(subjects);
  const topText = [
    top?.mainStatusHe,
    top?.mainPriorityHe,
    top?.doNowHe,
    top?.avoidNowHe,
    top?.confidenceHe,
    top?.evidenceSummaryHe,
  ]
    .map(cleanText)
    .join(" ");
  const shortTopPriority = cleanText(short?.parentProductContractPreview?.mainPriorityHe);
  const detailedTopPriority = cleanText(top?.mainPriorityHe);
  const primaryActionDuplicates = subjectRows.filter(
    (x) => normalize(x?.doNowHe) && normalize(x?.doNowHe) === normalize(detailedTopPriority)
  ).length;
  const primaryFocusInferred = inferFocus(topText);
  const strongDiagnosisWhenInsufficient =
    p.expectedPrimaryFocusType === "insufficient_data" && hasAny(topText, STRONG_TREND_WORDS);
  const strongHasRemediation =
    p.expectedPrimaryFocusType === "strength_maintain" && hasAny(topText, REMEDIATION_WORDS);
  const speedHasKnowledgeGap =
    p.expectedPrimaryFocusType === "speed_behavior" && /פער ידע|ידע חסר/.test(topText);
  const trendInsufficientHasStrongTrend =
    p.expectedPrimaryFocusType === "trend_insufficient" && hasAny(topText, STRONG_TREND_WORDS);
  const mixedPrimaryCount = subjectRows.filter((x) => cleanText(x?.mainPriorityHe)).length;
  const forbiddenTermHit = FORBIDDEN_INTERNAL_PARENT_TERMS.some((w) => topText.includes(w));

  const checks = {
    topContractExists: Boolean(cleanText(top?.mainStatusHe) || cleanText(top?.mainPriorityHe)),
    primaryFocusTypeMatchesExpected:
      p.expectedPrimaryFocusType === "mixed_priority"
        ? true
        : primaryFocusInferred === p.expectedPrimaryFocusType,
    doNowExists: Boolean(cleanText(top?.doNowHe)),
    avoidNowExists: Boolean(cleanText(top?.avoidNowHe)),
    insufficientNoStrongDiagnosis: !strongDiagnosisWhenInsufficient,
    strongNoRemediationWording: !strongHasRemediation,
    speedNoKnowledgeGapWording: !speedHasKnowledgeGap,
    trendInsufficientNoStrongTrendWording: !trendInsufficientHasStrongTrend,
    mixedCasesOnePrimaryFocus: p.expectedPrimaryFocusType !== "mixed_priority" || mixedPrimaryCount >= 1,
    noForbiddenInternalTerms: !forbiddenTermHit,
    noDuplicatePrimaryAction: primaryActionDuplicates === 0,
    shortDetailedMainPriorityAgree:
      !shortTopPriority || !detailedTopPriority || normalize(shortTopPriority) === normalize(detailedTopPriority),
  };
  const failedChecks = Object.entries(checks)
    .filter(([, pass]) => !pass)
    .map(([k]) => k);
  const topSummaryKey = normalize(`${top?.mainStatusHe || ""} | ${top?.mainPriorityHe || ""} | ${top?.doNowHe || ""}`);
  summaryKeys.set(topSummaryKey, [...(summaryKeys.get(topSummaryKey) || []), p.id]);
  topContracts.push({
    id: p.id,
    mainPriorityHe: cleanText(top?.mainPriorityHe),
    doNowHe: cleanText(top?.doNowHe),
    avoidNowHe: cleanText(top?.avoidNowHe),
    confidenceHe: cleanText(top?.confidenceHe),
    primarySubjectId: cleanText(top?.primarySubjectId || top?.subjectId || ""),
    topSummaryKey,
  });
  rows.push({
    personaId: p.id,
    category: p.category,
    expectedPrimaryFocusType: p.expectedPrimaryFocusType,
    inferredPrimaryFocusType: primaryFocusInferred,
    checks,
    failedChecks,
    status: failedChecks.length ? "FAIL" : "PASS",
    topContract: {
      mainStatusHe: cleanText(top?.mainStatusHe),
      mainPriorityHe: cleanText(top?.mainPriorityHe),
      doNowHe: cleanText(top?.doNowHe),
      avoidNowHe: cleanText(top?.avoidNowHe),
      confidenceHe: cleanText(top?.confidenceHe),
      trendEvidenceStatus: cleanText(top?.evidence?.trendEvidenceStatus),
    },
  });
}

const unique = (arr) => new Set(arr.filter(Boolean)).size;
const suspiciouslySimilar = [...summaryKeys.entries()]
  .filter(([, ids]) => ids.length > 1)
  .map(([summaryKey, ids]) => ({ summaryKey, personas: ids }));
const identicalPct = rows.length
  ? Number((((suspiciouslySimilar.reduce((a, x) => a + x.personas.length, 0) / rows.length) * 100) || 0).toFixed(2))
  : 0;
const diversity = {
  uniqueMainPriorityHe: unique(topContracts.map((x) => x.mainPriorityHe)),
  uniqueDoNowHe: unique(topContracts.map((x) => x.doNowHe)),
  uniqueAvoidNowHe: unique(topContracts.map((x) => x.avoidNowHe)),
  uniqueConfidenceHe: unique(topContracts.map((x) => x.confidenceHe)),
  uniquePrimarySubjectIds: unique(topContracts.map((x) => x.primarySubjectId)),
  identicalTopContractPercentage: identicalPct,
  suspiciouslySimilarSummaries: suspiciouslySimilar,
  LOW_REPORT_VARIATION:
    unique(topContracts.map((x) => x.mainPriorityHe)) < 10 || identicalPct > 35 || suspiciouslySimilar.length > 8,
};

const failed = rows.filter((r) => r.status === "FAIL");
const result = {
  generatedAt: new Date().toISOString(),
  personaCount: rows.length,
  passCount: rows.length - failed.length,
  failCount: failed.length,
  personas: rows,
  diversity,
};
writeFileSync(join(OUT_DIR, "persona-corpus-audit.json"), JSON.stringify(result, null, 2), "utf8");

const md = [];
md.push("# Persona Corpus Audit");
md.push("");
md.push(`- personas: ${result.personaCount}`);
md.push(`- pass: ${result.passCount}`);
md.push(`- fail: ${result.failCount}`);
md.push(`- LOW_REPORT_VARIATION: ${diversity.LOW_REPORT_VARIATION ? "YES" : "NO"}`);
md.push("");
md.push("## Diversity");
md.push(`- unique mainPriorityHe: ${diversity.uniqueMainPriorityHe}`);
md.push(`- unique doNowHe: ${diversity.uniqueDoNowHe}`);
md.push(`- unique avoidNowHe: ${diversity.uniqueAvoidNowHe}`);
md.push(`- unique confidenceHe: ${diversity.uniqueConfidenceHe}`);
md.push(`- unique primary subject ids: ${diversity.uniquePrimarySubjectIds}`);
md.push(`- identical top-contract percentage: ${diversity.identicalTopContractPercentage}%`);
md.push("");
md.push("| Persona | Category | Expected focus | Inferred focus | Status | Failed checks |");
md.push("|---|---|---|---|---|---|");
for (const r of rows) {
  md.push(
    `| ${r.personaId} | ${r.category} | ${r.expectedPrimaryFocusType} | ${r.inferredPrimaryFocusType} | ${r.status} | ${r.failedChecks.join(", ") || "-"} |`
  );
}
md.push("");
md.push("## Suspiciously Similar Summaries");
if (!diversity.suspiciouslySimilarSummaries.length) {
  md.push("- none");
} else {
  for (const s of diversity.suspiciouslySimilarSummaries) {
    md.push(`- personas: ${s.personas.join(", ")}`);
  }
}
writeFileSync(join(OUT_DIR, "persona-corpus-audit.md"), md.join("\n"), "utf8");

if (failed.length) process.exitCode = 1;
console.log(
  JSON.stringify(
    {
      ok: failed.length === 0,
      personaCount: result.personaCount,
      passCount: result.passCount,
      failCount: result.failCount,
      LOW_REPORT_VARIATION: diversity.LOW_REPORT_VARIATION,
      out_json: join(OUT_DIR, "persona-corpus-audit.json"),
      out_md: join(OUT_DIR, "persona-corpus-audit.md"),
    },
    null,
    2
  )
);
