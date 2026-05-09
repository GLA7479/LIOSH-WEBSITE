import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "reports", "parent-report-product-contract");
mkdirSync(OUT_DIR, { recursive: true });

const SCENARIO_IDS = [
  "new_user_no_data",
  "weak_enough_evidence",
  "weak_thin_evidence",
  "strong_stable_mastery",
  "strong_accuracy_fragile_success",
  "speed_issue_only_no_knowledge_gap",
  "multiple_subjects_one_clear_priority",
  "trend_insufficient",
  "trend_sufficient_up",
  "trend_sufficient_down",
];

const FORBIDDEN_TERMS = [
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
const REMEDIATION_WORDS = ["פער ידע", "remediate", "שיקום", "התערבות אגרסיבית"];
const INSUFFICIENT_WORDS = ["אין מספיק", "נתונים חלקיים", "עדיין אין מספיק", "בשלב זה אין מספיק"];

const { buildDetailedParentReportFromBaseReport } = await import(
  pathToFileURL(join(ROOT, "utils", "detailed-parent-report.js")).href
);
const { PARENT_REPORT_PRODUCT_SCENARIOS } = await import(
  pathToFileURL(join(ROOT, "tests", "fixtures", "parent-report-product-scenarios.mjs")).href
);

function cleanText(v) {
  return String(v || "").replace(/\s+/g, " ").trim();
}

function normalize(v) {
  return cleanText(v).toLowerCase();
}

function containsAny(text, words) {
  const t = String(text || "");
  return words.some((w) => t.includes(w));
}

function scenarioBaseReport(s) {
  if (s.type === "base_report") return s.buildBaseReport();
  return {
    playerName: "ShortConsistencyQA",
    period: "week",
    summary: {
      totalQuestions: 0,
      totalCorrect: 0,
      totalTimeMinutes: 0,
      overallAccuracy: 0,
      diagnosticOverviewHe: {
        mainFocusAreaLineHe: "",
        strongestAreaLineHe: "",
        readyForProgressPreviewHe: [],
        insufficientDataSubjectsHe: ["אין מספיק נתונים"],
      },
    },
    mathOperations: {},
    geometryTopics: {},
    englishTopics: {},
    scienceTopics: {},
    hebrewTopics: {},
    moledetGeographyTopics: {},
    mistakes: [],
    analysis: {},
  };
}

function shortLegacyLines(baseReport) {
  const overview = baseReport?.summary?.diagnosticOverviewHe || {};
  const out = [];
  if (overview.mainFocusAreaLineHe) out.push(`דורש תשומת לב כעת: ${overview.mainFocusAreaLineHe}`);
  if (overview.strongestAreaLineHe) out.push(`תוצאות טובות יחסית — כדאי לשמר: ${overview.strongestAreaLineHe}`);
  if (Array.isArray(overview.readyForProgressPreviewHe) && overview.readyForProgressPreviewHe.length) {
    out.push(`מוכנות להתקדמות נוספת: ${overview.readyForProgressPreviewHe.join(" · ")}`);
  }
  if (Array.isArray(overview.insufficientDataSubjectsHe) && overview.insufficientDataSubjectsHe.length) {
    out.push(`נתונים חלקיים במקצועות: ${overview.insufficientDataSubjectsHe.join(" · ")}`);
  }
  return out.map(cleanText).filter(Boolean);
}

function shortRecommendationLines(baseReport) {
  const lines = [];
  const legacy = Array.isArray(baseReport?.analysis?.recommendations)
    ? baseReport.analysis.recommendations
    : [];
  for (const r of legacy) {
    if (r?.message) lines.push(cleanText(r.message));
  }
  const subjects = Array.isArray(baseReport?.patternDiagnostics?.subjects)
    ? baseReport.patternDiagnostics.subjects
    : [];
  for (const s of subjects) {
    if (s?.parentActionHe) lines.push(cleanText(s.parentActionHe));
    if (s?.subjectDoNowHe) lines.push(cleanText(s.subjectDoNowHe));
    if (s?.summaryHe) lines.push(cleanText(s.summaryHe));
  }
  return lines.filter(Boolean);
}

function uniqueNonEmpty(lines) {
  return [...new Set((Array.isArray(lines) ? lines : []).map(cleanText).filter(Boolean))];
}

function stableOrMaintainDetailed(top) {
  const t = `${top?.mainStatusHe || ""} ${top?.mainPriorityHe || ""} ${top?.doNowHe || ""}`;
  return /שימור|יציב|יציבות|עקביות|להמשיך/.test(t) && !/פער ידע/.test(t);
}

function speedOnlyDetailed(top) {
  const t = `${top?.mainStatusHe || ""} ${top?.mainPriorityHe || ""} ${top?.doNowHe || ""}`;
  return /מהירות|קצב/.test(t) && !/פער ידע|ידע חסר/.test(t);
}

function evaluateConsistency({ topContract, shortLines, primaryActions, hasDetailedLink }) {
  const allText = shortLines.join("\n");
  const topPriority = cleanText(topContract?.mainPriorityHe);
  const trendInsufficient = String(topContract?.evidence?.trendEvidenceStatus || "") === "insufficient";
  const topLooksInsufficient = containsAny(
    `${topContract?.mainStatusHe || ""} ${topContract?.evidenceSummaryHe || ""}`,
    INSUFFICIENT_WORDS
  );
  const contradictions = [];

  if (topPriority && primaryActions.length) {
    const mismatch = primaryActions.some((x) => {
      const n = normalize(x);
      const p = normalize(topPriority);
      return p && n && !n.includes(p) && !p.includes(n);
    });
    if (mismatch) contradictions.push("different_primary_action");
  }
  if ((trendInsufficient || topLooksInsufficient) && containsAny(allText, STRONG_TREND_WORDS)) {
    contradictions.push("strong_diagnosis_on_insufficient");
  }
  if (stableOrMaintainDetailed(topContract) && containsAny(allText, REMEDIATION_WORDS)) {
    contradictions.push("remediation_on_stable_mastery");
  }
  if (speedOnlyDetailed(topContract) && /פער ידע|ידע חסר/.test(allText)) {
    contradictions.push("knowledge_gap_on_speed_only");
  }
  if (trendInsufficient && containsAny(allText, STRONG_TREND_WORDS)) {
    contradictions.push("strong_trend_word_on_insufficient");
  }
  if (FORBIDDEN_TERMS.some((w) => allText.includes(w))) {
    contradictions.push("forbidden_internal_term");
  }
  if (new Set(primaryActions.map(normalize).filter(Boolean)).size > 1) {
    contradictions.push("multiple_top_level_main_actions");
  }
  if (!hasDetailedLink) {
    contradictions.push("missing_detailed_report_link");
  }

  return {
    pass: contradictions.length === 0,
    contradictions,
  };
}

const shortReportSource = readFileSync(join(ROOT, "pages", "learning", "parent-report.js"), "utf8");
const hasDetailedLink = /\/learning\/parent-report-detailed/.test(shortReportSource);
const rows = [];

for (const id of SCENARIO_IDS) {
  const scenario = PARENT_REPORT_PRODUCT_SCENARIOS.find((s) => s.id === id);
  if (!scenario) continue;
  const base = scenarioBaseReport(scenario);
  const detailed = buildDetailedParentReportFromBaseReport(base, { period: "week" });
  const top = detailed?.parentProductContractV1?.top || null;
  const contractAvailableInShortReport = Boolean(
    cleanText(top?.mainStatusHe) || cleanText(top?.mainPriorityHe) || cleanText(top?.doNowHe)
  );

  const legacyLines = uniqueNonEmpty([...shortLegacyLines(base), ...shortRecommendationLines(base)]);
  const previewLines = contractAvailableInShortReport
    ? uniqueNonEmpty([
        `מצב: ${top?.mainStatusHe || ""}`,
        `מיקוד עיקרי: ${top?.mainPriorityHe || ""}`,
        `מה עושים עכשיו: ${top?.doNowHe || ""}`,
      ])
    : [];

  const beforeFixPrimary = uniqueNonEmpty([base?.summary?.diagnosticOverviewHe?.mainFocusAreaLineHe || ""]);
  const beforeFixEval = evaluateConsistency({
    topContract: top,
    shortLines: uniqueNonEmpty([...legacyLines]),
    primaryActions: beforeFixPrimary,
    hasDetailedLink,
  });

  const afterFixPrimary = contractAvailableInShortReport
    ? uniqueNonEmpty([top?.mainPriorityHe || ""])
    : beforeFixPrimary;
  const afterFixVisibleLines = contractAvailableInShortReport
    ? uniqueNonEmpty([...previewLines, ...legacyLines.filter((l) => !/^דורש תשומת לב כעת:/.test(l))])
    : uniqueNonEmpty([...legacyLines]);
  const afterFixEval = evaluateConsistency({
    topContract: top,
    shortLines: afterFixVisibleLines,
    primaryActions: afterFixPrimary,
    hasDetailedLink,
  });

  rows.push({
    scenarioId: id,
    contractAvailableInShortReport,
    detailedTop: {
      mainStatusHe: cleanText(top?.mainStatusHe),
      mainPriorityHe: cleanText(top?.mainPriorityHe),
      doNowHe: cleanText(top?.doNowHe),
      evidenceSummaryHe: cleanText(top?.evidenceSummaryHe),
      trendEvidenceStatus: cleanText(top?.evidence?.trendEvidenceStatus),
    },
    shortSnapshot: {
      topVisibleSummaryLines: afterFixVisibleLines,
      recommendationLines: legacyLines,
      trendDiagnosticLines: uniqueNonEmpty(shortLegacyLines(base)),
      primaryActions: afterFixPrimary,
    },
    beforeFix: beforeFixEval,
    afterFix: afterFixEval,
  });
}

const failCount = rows.filter((r) => !r.afterFix.pass).length;
const summary = {
  generatedAt: new Date().toISOString(),
  scenarioCount: rows.length,
  passCount: rows.length - failCount,
  failCount,
  hasDetailedLink,
  contractAvailableInShortReport: rows.map((r) => ({
    scenarioId: r.scenarioId,
    available: r.contractAvailableInShortReport,
  })),
};
const jsonOut = { summary, scenarios: rows };
writeFileSync(join(OUT_DIR, "short-vs-detailed-consistency.json"), JSON.stringify(jsonOut, null, 2), "utf8");

const mdLines = [];
mdLines.push("# Short vs Detailed Consistency Audit");
mdLines.push("");
mdLines.push(`- Scenarios: ${summary.scenarioCount}`);
mdLines.push(`- Pass: ${summary.passCount}`);
mdLines.push(`- Fail: ${summary.failCount}`);
mdLines.push(`- Detailed report link present in short report page: ${summary.hasDetailedLink ? "yes" : "no"}`);
mdLines.push("");
mdLines.push("| Scenario | Contract in short | Before fix | After fix |");
mdLines.push("|---|---:|---|---|");
for (const row of rows) {
  const b = row.beforeFix.pass ? "pass" : `fail (${row.beforeFix.contradictions.join(", ")})`;
  const a = row.afterFix.pass ? "pass" : `fail (${row.afterFix.contradictions.join(", ")})`;
  mdLines.push(
    `| ${row.scenarioId} | ${row.contractAvailableInShortReport ? "true" : "false"} | ${b} | ${a} |`
  );
}
mdLines.push("");
for (const row of rows) {
  mdLines.push(`## ${row.scenarioId}`);
  mdLines.push(`- Detailed top: ${row.detailedTop.mainPriorityHe || "n/a"}`);
  mdLines.push(
    `- Short top summary: ${
      row.shortSnapshot.topVisibleSummaryLines.length
        ? row.shortSnapshot.topVisibleSummaryLines.join(" | ")
        : "n/a"
    }`
  );
  mdLines.push(`- Before fix contradictions: ${row.beforeFix.contradictions.join(", ") || "none"}`);
  mdLines.push(`- After fix contradictions: ${row.afterFix.contradictions.join(", ") || "none"}`);
  mdLines.push("");
}
writeFileSync(join(OUT_DIR, "short-vs-detailed-consistency.md"), mdLines.join("\n"), "utf8");

if (failCount > 0) {
  console.error(`short-vs-detailed-consistency: failed ${failCount}/${rows.length} scenarios`);
  process.exit(1);
}

console.log(`short-vs-detailed-consistency: pass ${summary.passCount}/${summary.scenarioCount}`);
