import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SNAP_DIR = join(ROOT, "reports", "parent-report-product-contract", "rendered-snapshots");
const OUT_DIR = join(ROOT, "reports", "parent-report-product-contract");
mkdirSync(OUT_DIR, { recursive: true });

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
const ALLOWED_REPEAT_LABELS = new Set(["מצב", "מיקוד", "למה", "סיכום להורה"]);

function cleanText(v) {
  return String(v || "").replace(/\s+/g, " ").trim();
}

function splitLines(txt) {
  return String(txt || "")
    .split(/\n+/)
    .map((x) => cleanText(x))
    .filter(Boolean);
}

function parseSectionsFromTxt(txt) {
  const lines = String(txt || "").split(/\r?\n/);
  const sections = [];
  let current = null;
  for (const raw of lines) {
    const line = cleanText(raw);
    if (!line) continue;
    if (line.startsWith("## ")) {
      current = { name: line.slice(3).trim(), lines: [] };
      sections.push(current);
      continue;
    }
    if (!current) continue;
    if (line.startsWith("- ")) current.lines.push(line.slice(2).trim());
  }
  return sections;
}

function sentenceList(text) {
  return cleanText(text)
    .split(/[.!?]\s+/)
    .map((x) => cleanText(x))
    .filter(Boolean);
}

function containsAny(text, arr) {
  return arr.some((w) => String(text || "").includes(w));
}

function normalizeForRepeat(line) {
  return cleanText(line)
    .replace(/^[-*]\s*/, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

const scenarioFiles = readdirSync(SNAP_DIR).filter((f) => f.endsWith(".txt") && f !== "index.md");
const perScenario = [];

for (const file of scenarioFiles) {
  const id = file.replace(/\.txt$/i, "");
  const txt = readFileSync(join(SNAP_DIR, file), "utf8");
  const text = cleanText(txt);
  const sections = parseSectionsFromTxt(txt);
  const topIndex = text.indexOf("סיכום להורה");
  const legacyIndex = text.indexOf("סיכום לתקופה");
  const first600 = text.slice(0, 600);
  const lines = splitLines(txt);
  const actionLikeCount = (() => {
    const topSection = sections.find((s) => s.name === "סיכום להורה");
    const execSection = sections.find((s) => s.name === "סיכום לתקופה");
    const candidates = [
      ...(topSection?.lines || []).filter((l) => /^מיקוד עיקרי:/.test(l)),
      ...(execSection?.lines || []).filter((l) => /^עדיפות ראשונה:|^פעולת בית מרכזית/.test(l)),
    ]
      .map((l) => cleanText(l.split(":").slice(1).join(":") || l))
      .filter(Boolean);
    return new Set(candidates.map(normalizeForRepeat)).size;
  })();
  const repeatedSentences = (() => {
    const map = new Map();
    for (const sec of sections) {
      sec.lines.forEach((line, idx) => {
        const n = normalizeForRepeat(line);
        if (!n || n.length < 12) return;
        const labelPrefix = cleanText(line.split(":")[0]);
        if (ALLOWED_REPEAT_LABELS.has(labelPrefix)) return;
        const arr = map.get(n) || [];
        arr.push({ section: sec.name, lineIndex: idx + 1, line });
        map.set(n, arr);
      });
    }
    const out = [];
    for (const entries of map.values()) {
      if (entries.length <= 1) continue;
      const allInSubjectSection = entries.every((e) => e.section === "סיכום מקצועות להורה");
      const onlyTopAndSubject = entries.every(
        (e) => e.section === "סיכום מקצועות להורה" || e.section === "סיכום להורה"
      );
      const startsWithSubjectLabel = /^(מה עושים עכשיו:|מה לא לעשות כרגע:|רמת ודאות:)/.test(
        entries[0].line
      );
      const duplicateType =
        (allInSubjectSection && startsWithSubjectLabel) ||
        (onlyTopAndSubject && /^(מה לא לעשות כרגע:|רמת ודאות:)/.test(entries[0].line))
          ? "acceptable_label"
          : "exact_duplicate";
      out.push({
        sentence: entries[0].line,
        count: entries.length,
        firstSeenNear: `${entries[0].section}#${entries[0].lineIndex}`,
        scenarioId: id,
        appearances: entries.map((x) => `${x.section}#${x.lineIndex}`),
        duplicateType,
      });
    }
    return out.sort((a, b) => b.count - a.count || a.sentence.localeCompare(b.sentence, "he"));
  })();
  const sectionDuplicateMap = sections.map((sec) => {
    const localMap = new Map();
    for (const line of sec.lines) {
      const n = normalizeForRepeat(line);
      if (!n || n.length < 12) continue;
      const labelPrefix = cleanText(line.split(":")[0]);
      if (ALLOWED_REPEAT_LABELS.has(labelPrefix)) continue;
      localMap.set(n, (localMap.get(n) || 0) + 1);
    }
    const repeatedLines = [];
    for (const [n, c] of localMap.entries()) {
      if (c > 1) repeatedLines.push({ line: n, count: c });
    }
    return { section: sec.name, repeatedLines };
  });
  const duplicates = repeatedSentences
    .filter((r) => r.duplicateType !== "acceptable_label")
    .reduce((acc, r) => acc + (r.count - 1), 0);
  const topStart = topIndex >= 0 ? text.slice(topIndex, Math.min(topIndex + 1200, text.length)) : "";
  const topLines = sentenceList(topStart);
  let consecutiveRecommendationLike = 0;
  let maxConsecutiveRecommendationLike = 0;
  for (const l of topLines) {
    const isRec = /מה עושים עכשיו|מיקוד|עדיפות|להמשיך|לא להעלות|להתמקד|לתרגל/.test(l);
    const hasLabel = /:/.test(l) || /מה עושים עכשיו|מיקוד|מצב|למה|רמת ודאות|בסיס הנתונים/.test(l);
    if (isRec && !hasLabel) {
      consecutiveRecommendationLike += 1;
      if (consecutiveRecommendationLike > maxConsecutiveRecommendationLike) {
        maxConsecutiveRecommendationLike = consecutiveRecommendationLike;
      }
    } else {
      consecutiveRecommendationLike = 0;
    }
  }
  const topPriorityMatch = (topStart.match(/מיקוד עיקרי\s*([^]+?)למה/) || [])[1] || "";
  const subjectArea = text.includes("סיכום מקצועות להורה")
    ? text.slice(text.indexOf("סיכום מקצועות להורה"))
    : "";
  const failureReasons = [];

  const result = {
    id,
    topSummaryBeforeLegacy: topIndex >= 0 && legacyIndex >= 0 && topIndex < legacyIndex,
    first600HasStatusPriorityAction:
      containsAny(first600, ["מצב"]) &&
      containsAny(first600, ["מיקוד עיקרי"]) &&
      containsAny(first600, ["מה עושים עכשיו"]),
    forbiddenInternalTermsCount: FORBIDDEN_TERMS.reduce(
      (acc, t) => (new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(text) ? acc + 1 : acc),
      0
    ),
    primaryActionCount: actionLikeCount,
    unsupportedTrendWording:
      id === "trend_insufficient" ? STRONG_TREND_WORDS.filter((w) => text.includes(w)) : [],
    stableMasteryTopHasRemediation:
      id === "strong_stable_mastery" ? REMEDIATION_WORDS.filter((w) => topStart.includes(w)).length > 0 : false,
    weakThinEvidenceStrongDiagnosis:
      id === "weak_thin_evidence" ? containsAny(topStart, ["חמור", "חד משמעית", "עמוק"]) : false,
    speedOnlyKnowledgeGapTone:
      id === "speed_issue_only_no_knowledge_gap" ? containsAny(topStart, ["פער ידע"]) : false,
    repeatedIdenticalSentences: duplicates,
    repeatedSentences,
    sectionDuplicateMap,
    maxConsecutiveRecommendationLikeLines: maxConsecutiveRecommendationLike,
    topSummaryLength: topStart.length,
    subjectDuplicatesTopActionWordForWord:
      !!cleanText(topPriorityMatch) && cleanText(subjectArea).includes(cleanText(topPriorityMatch)),
    failureReasons,
  };
  if (!result.topSummaryBeforeLegacy) failureReasons.push("top_summary_not_before_legacy");
  if (!result.first600HasStatusPriorityAction) failureReasons.push("first_screen_missing_status_priority_action");
  if (result.forbiddenInternalTermsCount > 0) failureReasons.push("forbidden_internal_terms_present");
  if (result.primaryActionCount > 1) failureReasons.push("multiple_primary_actions");
  if (result.unsupportedTrendWording.length > 0) failureReasons.push("unsupported_trend_wording");
  if (result.stableMasteryTopHasRemediation) failureReasons.push("stable_mastery_remediation_wording");
  if (result.weakThinEvidenceStrongDiagnosis) failureReasons.push("weak_thin_strong_diagnosis");
  if (result.speedOnlyKnowledgeGapTone) failureReasons.push("speed_only_sounds_like_knowledge_gap");
  if (result.repeatedIdenticalSentences > 2) failureReasons.push("repeated_sentence_density_high");
  if (result.maxConsecutiveRecommendationLikeLines > 3) failureReasons.push("too_many_unlabeled_recommendation_lines");
  if (result.topSummaryLength > 1200) failureReasons.push("top_summary_too_long");
  if (result.subjectDuplicatesTopActionWordForWord) failureReasons.push("subject_duplicates_top_action");
  perScenario.push(result);
}

const out = {
  generatedAt: new Date().toISOString(),
  scenarios: perScenario,
  summary: {
    total: perScenario.length,
    pass: perScenario.filter(
      (r) =>
        r.topSummaryBeforeLegacy &&
        r.first600HasStatusPriorityAction &&
        r.forbiddenInternalTermsCount === 0 &&
        r.primaryActionCount <= 1 &&
        r.unsupportedTrendWording.length === 0 &&
        !r.stableMasteryTopHasRemediation &&
        !r.weakThinEvidenceStrongDiagnosis &&
        !r.speedOnlyKnowledgeGapTone &&
        r.repeatedIdenticalSentences <= 2 &&
        r.maxConsecutiveRecommendationLikeLines <= 3 &&
        r.topSummaryLength <= 1200 &&
        !r.subjectDuplicatesTopActionWordForWord
    ).length,
  },
};
out.summary.fail = out.summary.total - out.summary.pass;

const md = `# Readability Audit

- Generated: ${out.generatedAt}
- Passed: ${out.summary.pass}/${out.summary.total}
- Failed: ${out.summary.fail}

## Scenario Results
${perScenario
  .map(
    (r) =>
      `- \`${r.id}\`: order=${r.topSummaryBeforeLegacy} first600=${r.first600HasStatusPriorityAction} forbidden=${r.forbiddenInternalTermsCount} primaryActionCount=${r.primaryActionCount} trendUnsupported=${r.unsupportedTrendWording.length} stableTopRemediation=${r.stableMasteryTopHasRemediation} weakThinStrong=${r.weakThinEvidenceStrongDiagnosis} speedKnowledgeGap=${r.speedOnlyKnowledgeGapTone} repeats=${r.repeatedIdenticalSentences} unlabeledRecMax=${r.maxConsecutiveRecommendationLikeLines} topLen=${r.topSummaryLength} subjectDupTopAction=${r.subjectDuplicatesTopActionWordForWord}`
  )
  .join("\n")}
`;

writeFileSync(join(OUT_DIR, "readability-audit.json"), JSON.stringify(out, null, 2), "utf8");
writeFileSync(join(OUT_DIR, "readability-audit.md"), md, "utf8");

console.log(
  JSON.stringify(
    {
      ok: out.summary.fail === 0,
      out_json: join(OUT_DIR, "readability-audit.json"),
      out_md: join(OUT_DIR, "readability-audit.md"),
      ...out.summary,
    },
    null,
    2
  )
);

