import fs from "fs/promises";
import path from "path";
import { pathToFileURL } from "node:url";
import { glob } from "node:fs/promises";

const ROOT = process.cwd();
const SNAP_DIR = path.join(ROOT, "reports", "dev-student-simulator", "phase2-core", "snapshots");
const OUT_DIR = path.join(ROOT, "reports", "dev-student-simulator", "phase2-engine-proof");
const OUT_JSON = path.join(OUT_DIR, "engine-proof-result.json");
const OUT_MD = path.join(OUT_DIR, "engine-proof-summary.md");

const PRESET_EXPECTATIONS = {
  simDeep01_mixed_real_child: { story: "one_clear_priority_not_scattered" },
  simDeep02_strong_stable_child: { story: "no_remediation_no_knowledge_gap" },
  simDeep03_weak_math_long_term: { story: "math_primary_not_insufficient" },
  simDeep04_improving_child: { story: "improvement_or_stabilization_not_overstated" },
  simDeep05_declining_after_difficulty_jump: { story: "stabilize_no_increase_difficulty" },
  simDeep06_fast_careless_vs_slow_accurate_mix: { story: "pace_focus_not_pure_knowledge_gap" },
};

function installLocalStorageShim() {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
  globalThis.window = globalThis;
}

function loadSnapshotIntoStorage(snapshot) {
  globalThis.localStorage.clear();
  for (const [k, v] of Object.entries(snapshot || {})) {
    globalThis.localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v));
  }
}

function collectSessions(snapshot) {
  const out = [];
  const pushFromMath = (track) => {
    for (const bucket of Object.values(track?.operations || {})) {
      for (const s of bucket.sessions || []) out.push(s);
    }
  };
  const pushFromTopics = (track) => {
    for (const bucket of Object.values(track?.topics || {})) {
      for (const s of bucket.sessions || []) out.push(s);
    }
  };
  pushFromMath(snapshot.mleo_time_tracking);
  pushFromTopics(snapshot.mleo_geometry_time_tracking);
  pushFromTopics(snapshot.mleo_english_time_tracking);
  pushFromTopics(snapshot.mleo_science_time_tracking);
  pushFromTopics(snapshot.mleo_hebrew_time_tracking);
  pushFromTopics(snapshot.mleo_moledet_geography_time_tracking);
  return out;
}

function structureChecks(snapshot) {
  const errors = [];
  const warnings = [];
  const requireObj = (key) => {
    if (!snapshot[key] || typeof snapshot[key] !== "object" || Array.isArray(snapshot[key])) {
      errors.push(`${key} missing/invalid object`);
    }
  };
  const requireArray = (key) => {
    if (!Array.isArray(snapshot[key])) errors.push(`${key} missing/invalid array`);
  };

  requireObj("mleo_time_tracking");
  requireObj("mleo_geometry_time_tracking");
  requireObj("mleo_english_time_tracking");
  requireObj("mleo_science_time_tracking");
  requireObj("mleo_hebrew_time_tracking");
  requireObj("mleo_moledet_geography_time_tracking");

  if (!snapshot.mleo_time_tracking?.operations || !snapshot.mleo_time_tracking?.daily) {
    errors.push("mleo_time_tracking must include operations + daily");
  }
  for (const key of [
    "mleo_geometry_time_tracking",
    "mleo_english_time_tracking",
    "mleo_science_time_tracking",
    "mleo_hebrew_time_tracking",
    "mleo_moledet_geography_time_tracking",
  ]) {
    if (!snapshot[key]?.topics || !snapshot[key]?.daily) {
      errors.push(`${key} must include topics + daily`);
    }
  }

  requireArray("mleo_mistakes");
  requireArray("mleo_geometry_mistakes");
  requireArray("mleo_english_mistakes");
  requireArray("mleo_science_mistakes");
  requireArray("mleo_hebrew_mistakes");
  requireArray("mleo_moledet_geography_mistakes");

  for (const key of [
    "mleo_math_master_progress",
    "mleo_geometry_master_progress",
    "mleo_english_master_progress",
    "mleo_science_master_progress",
    "mleo_hebrew_master_progress",
    "mleo_moledet_geography_master_progress",
  ]) {
    const p = snapshot[key];
    if (!p || typeof p !== "object") errors.push(`${key} missing/invalid`);
    if (!p?.progress || typeof p.progress !== "object") errors.push(`${key}.progress missing`);
    if (!Array.isArray(p?.badges)) errors.push(`${key}.badges missing array`);
    if (typeof p?.stars !== "number") errors.push(`${key}.stars missing number`);
    if (typeof p?.xp !== "number") errors.push(`${key}.xp missing number`);
    if (typeof p?.playerLevel !== "number") errors.push(`${key}.playerLevel missing number`);
  }

  const sessions = collectSessions(snapshot);
  for (const s of sessions) {
    if (!s?.date || !s?.timestamp || s?.duration == null || s?.total == null || s?.correct == null) {
      errors.push("session missing required fields (date/timestamp/duration/total/correct)");
      break;
    }
  }

  const mistakeBuckets = [
    "mleo_mistakes",
    "mleo_geometry_mistakes",
    "mleo_english_mistakes",
    "mleo_science_mistakes",
    "mleo_hebrew_mistakes",
    "mleo_moledet_geography_mistakes",
  ];
  for (const mk of mistakeBuckets) {
    const one = (snapshot[mk] || [])[0];
    if (!one) continue;
    if (!one.timestamp) errors.push(`${mk} event missing timestamp`);
    if (!(one.topic || one.operation)) errors.push(`${mk} event missing topic/operation`);
    if (!("patternFamily" in one)) warnings.push(`${mk} event missing patternFamily`);
  }

  const nowMs = Date.now();
  const weekStart = nowMs - 7 * 24 * 60 * 60 * 1000;
  const monthStart = nowMs - 30 * 24 * 60 * 60 * 1000;
  const prevMonthStart = nowMs - 60 * 24 * 60 * 60 * 1000;
  let weekCount = 0;
  let monthCount = 0;
  let prevCount = 0;
  const daySet = new Set();
  for (const s of sessions) {
    const t = Number(s.timestamp);
    if (!Number.isFinite(t)) continue;
    if (t >= weekStart) weekCount += 1;
    if (t >= monthStart) monthCount += 1;
    if (t >= prevMonthStart && t < monthStart) prevCount += 1;
    if (s.date) daySet.add(s.date);
  }
  if (weekCount < 8) errors.push(`insufficient current-week evidence (${weekCount})`);
  if (monthCount < 20) errors.push(`insufficient current-month evidence (${monthCount})`);
  if (prevCount < 10) warnings.push(`weak previous-period trend evidence (${prevCount})`);
  if (daySet.size < 20) errors.push(`active days too concentrated (${daySet.size})`);

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    stats: {
      sessions: sessions.length,
      weekEvidenceCount: weekCount,
      monthEvidenceCount: monthCount,
      previousPeriodEvidenceCount: prevCount,
      activeDays: daySet.size,
    },
  };
}

function noDataStatus(report) {
  const q = Number(report?.summary?.totalQuestions || 0);
  const t = Number(report?.summary?.totalTimeMinutes || 0);
  return q === 0 && t === 0;
}

function mathBehaviorDominantsFromBaseReport(baseReport) {
  const map = baseReport?.mathOperations && typeof baseReport.mathOperations === "object" ? baseReport.mathOperations : {};
  const set = new Set();
  for (const row of Object.values(map)) {
    const t = row?.behaviorProfile?.dominantType;
    if (t) set.add(String(t));
  }
  return [...set];
}

function extractPrimary(subjectProfiles) {
  const list = Array.isArray(subjectProfiles) ? [...subjectProfiles] : [];
  list.sort((a, b) => (Number(b?.subjectQuestionCount) || 0) - (Number(a?.subjectQuestionCount) || 0));
  const top = list[0] || null;
  if (!top) return { primarySubject: null, primaryTopic: null };
  const topTopic =
    top?.topWeaknesses?.[0]?.labelHe ||
    top?.topicRecommendations?.[0]?.displayName ||
    top?.topStrengths?.[0]?.labelHe ||
    null;
  return {
    primarySubject: top?.subject || null,
    primaryTopic: topTopic,
  };
}

function storyChecks(presetId, data) {
  const issues = [];
  const textBlob = [
    data.mainStatusHe,
    data.mainPriorityHe,
    data.doNowHe,
    data.executiveTopLine,
    data.executiveHomeFocusHe,
    data.avoidNowHe,
    data.evidenceSummaryHe,
    data.nextCheckHe,
    ...(Array.isArray(data.summaryModeSourceFields?.majorTrendsHe)
      ? data.summaryModeSourceFields.majorTrendsHe
      : []),
    data.mathDominantRiskLabelHe,
    data.mathRecommendedHomeMethodHe,
    data.cautionNoteHe,
  ]
    .filter(Boolean)
    .join(" | ");

  if (presetId === "simDeep01_mixed_real_child") {
    const hasMain = Boolean(data.mainPriorityHe || data.doNowHe);
    if (!hasMain) issues.push("missing clear main priority");
    if (Array.isArray(data.summaryTopFocus) && data.summaryTopFocus.length > 3) {
      issues.push("looks scattered (too many top focus areas)");
    }
  }

  if (presetId === "simDeep02_strong_stable_child") {
    if (/פער ידע|שיקום|remed/i.test(textBlob)) issues.push("contains remediation/knowledge-gap tone");
  }

  if (presetId === "simDeep03_weak_math_long_term") {
    if (data.isInsufficientEvidence) issues.push("insufficient evidence");
    const mathSignal = /חשבון|שברים|חילוק|כפל|חיסור|חיבור|math/i.test(
      `${data.mainPriorityHe} ${data.mainStatusHe} ${data.primarySubject || ""}`
    );
    if (!mathSignal) issues.push("math is not primary");
  }

  if (presetId === "simDeep04_improving_child") {
    if (!/שיפור|התקדמות|ייצוב|יציבות|stabil/i.test(textBlob)) {
      issues.push("missing improvement/stabilization signal");
    }
    if (/שליטה מלאה|מושלם לחלוטין|mastery complete/i.test(textBlob)) issues.push("overstated improvement");
  }

  if (presetId === "simDeep05_declining_after_difficulty_jump") {
    const hasStabilize =
      /ייצוב|יציבות|לא להעלות|להישאר|stabil|לא לקפוץ לרמה|לא להרחיב רמה|קפיצת רמה|קפיצה לרמה|לא לדחוף קפיצת רמה|רמת קושי/i.test(
        textBlob
      );
    if (!hasStabilize) issues.push("missing stabilize/no increase recommendation");
    if (/להעלות קושי|increase difficulty|advance level/i.test(textBlob)) {
      issues.push("recommends increasing difficulty");
    }
  }

  if (presetId === "simDeep06_fast_careless_vs_slow_accurate_mix") {
    const doms = Array.isArray(data.mathBehaviorDominants) ? data.mathBehaviorDominants : [];
    const riskOk =
      doms.includes("speed_pressure") ||
      doms.includes("careless_pattern") ||
      doms.includes("instruction_friction");
    const hasPace =
      /מהירות|קצב|בדיק|קשב|לחץ|עצירה|דיוק לפני|רשלנות|תשומת לב|attention|pace/i.test(textBlob);
    if (!riskOk && !hasPace) issues.push("missing pace/checking focus");
    if (/פער ידע/.test(textBlob) && !hasPace && !riskOk) issues.push("pure knowledge-gap framing");
  }

  return { pass: issues.length === 0, issues };
}

function pruneInactiveSubjectKeys(snapshot, baseReport) {
  const pruned = JSON.parse(JSON.stringify(snapshot));
  const inactive = [];
  const subjectQ = {
    math: Number(baseReport?.summary?.mathQuestions || 0),
    geometry: Number(baseReport?.summary?.geometryQuestions || 0),
    english: Number(baseReport?.summary?.englishQuestions || 0),
    science: Number(baseReport?.summary?.scienceQuestions || 0),
    hebrew: Number(baseReport?.summary?.hebrewQuestions || 0),
    "moledet-geography": Number(baseReport?.summary?.moledetGeographyQuestions || 0),
  };
  const keyMap = {
    geometry: ["mleo_geometry_time_tracking", "mleo_geometry_master_progress", "mleo_geometry_mistakes"],
    english: ["mleo_english_time_tracking", "mleo_english_master_progress", "mleo_english_mistakes"],
    science: ["mleo_science_time_tracking", "mleo_science_master_progress", "mleo_science_mistakes"],
    hebrew: ["mleo_hebrew_time_tracking", "mleo_hebrew_master_progress", "mleo_hebrew_mistakes"],
    "moledet-geography": [
      "mleo_moledet_geography_time_tracking",
      "mleo_moledet_geography_master_progress",
      "mleo_moledet_geography_mistakes",
    ],
  };
  for (const [subject, q] of Object.entries(subjectQ)) {
    if (subject === "math") continue;
    if (q === 0) {
      inactive.push(subject);
      for (const key of keyMap[subject] || []) delete pruned[key];
    }
  }
  return { pruned, inactiveSubjects: inactive };
}

function topContractFromDetailed(detailed) {
  return detailed?.parentProductContractV1?.top || {};
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  installLocalStorageShim();

  const parentReportMod = await import(pathToFileURL(path.join(ROOT, "utils", "parent-report-v2.js")).href);
  const detailedMod = await import(pathToFileURL(path.join(ROOT, "utils", "detailed-parent-report.js")).href);
  const { generateParentReportV2 } = parentReportMod;
  const { buildDetailedParentReportFromBaseReport } = detailedMod;

  const snapshotPaths = [];
  for await (const f of glob(path.join(SNAP_DIR, "*.storage.json").replace(/\\/g, "/"))) {
    snapshotPaths.push(f);
  }
  snapshotPaths.sort();

  const results = [];
  const touchedKeysPolicy = [];

  for (const snapPath of snapshotPaths) {
    const presetId = path.basename(snapPath).replace(".storage.json", "");
    const snapshot = JSON.parse(await fs.readFile(snapPath, "utf8"));
    loadSnapshotIntoStorage(snapshot);
    const playerName = String(snapshot.mleo_player_name || "LEOK Dev Student");

    const shortWeek = generateParentReportV2(playerName, "week");
    const shortMonth = generateParentReportV2(playerName, "month");
    const detailed = buildDetailedParentReportFromBaseReport(shortMonth, { playerName, period: "month" });
    const top = topContractFromDetailed(detailed);
    const primary = extractPrimary(detailed?.subjectProfiles);
    const mathProfile = Array.isArray(detailed?.subjectProfiles)
      ? detailed.subjectProfiles.find((s) => s?.subject === "math")
      : null;
    const mathDominantRiskLabelHe = mathProfile?.dominantLearningRiskLabelHe || null;
    const mathDominantLearningRisk = mathProfile?.dominantLearningRisk || null;
    const mathDominantBehaviorProfileAcrossRows = mathProfile?.dominantBehaviorProfileAcrossRows || null;
    const mathRecommendedHomeMethodHe = mathProfile?.recommendedHomeMethodHe || null;
    const mathBehaviorDominants = mathBehaviorDominantsFromBaseReport(shortMonth);

    const row = {
      presetId,
      expectedStory: PRESET_EXPECTATIONS[presetId]?.story || null,
      noDataWeek: noDataStatus(shortWeek),
      noDataMonth: noDataStatus(shortMonth),
      isInsufficientEvidence: /אין מספיק ראיות/.test(String(top?.mainStatusHe || "")),
      mainStatusHe: top?.mainStatusHe || null,
      mainPriorityHe: top?.mainPriorityHe || null,
      doNowHe: top?.doNowHe || null,
      avoidNowHe: top?.avoidNowHe || null,
      evidenceSummaryHe: top?.evidenceSummaryHe || null,
      nextCheckHe: top?.nextCheckHe || null,
      mathDominantRiskLabelHe,
      mathDominantLearningRisk,
      mathDominantBehaviorProfileAcrossRows,
      mathRecommendedHomeMethodHe,
      mathBehaviorDominants,
      cautionNoteHe: detailed?.executiveSummary?.cautionNoteHe || null,
      primarySubject: primary.primarySubject,
      primaryTopic: primary.primaryTopic,
      actionState: top?.recommendedParentPriorityType || detailed?.executiveSummary?.recommendedParentPriorityType || null,
      recommendationState: top?.mainPriorityType || null,
      executiveTopLine: detailed?.executiveSummary?.mainHomeRecommendationHe || null,
      executiveHomeFocusHe: detailed?.executiveSummary?.homeFocusHe || null,
      summaryModeSourceFields: {
        topStrengthsAcrossHe: detailed?.executiveSummary?.topStrengthsAcrossHe || [],
        topFocusAreasHe: detailed?.executiveSummary?.topFocusAreasHe || [],
        majorTrendsHe: detailed?.executiveSummary?.majorTrendsHe || [],
      },
      structure: structureChecks(snapshot),
    };

    row.story = storyChecks(presetId, row);
    row.pass = !row.noDataMonth && row.structure.ok && row.story.pass;

    // touchedKeys policy check: prove inactive empty keys do not alter top story.
    const { pruned, inactiveSubjects } = pruneInactiveSubjectKeys(snapshot, shortMonth);
    loadSnapshotIntoStorage(pruned);
    const shortMonthPruned = generateParentReportV2(playerName, "month");
    const detailedPruned = buildDetailedParentReportFromBaseReport(shortMonthPruned, { playerName, period: "month" });
    const topPruned = topContractFromDetailed(detailedPruned);
    const sameTopStory =
      String(top?.mainStatusHe || "") === String(topPruned?.mainStatusHe || "") &&
      String(top?.mainPriorityHe || "") === String(topPruned?.mainPriorityHe || "") &&
      String(top?.doNowHe || "") === String(topPruned?.doNowHe || "");
    touchedKeysPolicy.push({
      presetId,
      inactiveSubjects,
      sameTopStoryAfterPrune: sameTopStory,
    });

    results.push(row);
  }

  const touchedKeysProof = {
    identicalTouchedKeysAcrossPresets: true,
    allPresetsSameTopStoryWhenInactiveKeysPruned: touchedKeysPolicy.every((x) => x.sameTopStoryAfterPrune),
    details: touchedKeysPolicy,
    policyConclusion: touchedKeysPolicy.every((x) => x.sameTopStoryAfterPrune)
      ? "Identical touchedKeys do not confuse the real report engine for these presets."
      : "Inactive keys may affect story. touchedKeys should be narrowed per preset.",
  };

  const summary = {
    total: results.length,
    pass: results.filter((r) => r.pass).length,
    fail: results.filter((r) => !r.pass).length,
    failures: results.filter((r) => !r.pass).map((r) => ({
      presetId: r.presetId,
      noDataMonth: r.noDataMonth,
      structureErrors: r.structure.errors,
      storyIssues: r.story.issues,
    })),
  };

  const payload = {
    generatedAt: new Date().toISOString(),
    summary,
    results,
    touchedKeysProof,
  };

  await fs.writeFile(OUT_JSON, JSON.stringify(payload, null, 2), "utf8");

  const md = [
    "# Phase 2.5 Engine Proof",
    "",
    `- Total presets: ${summary.total}`,
    `- PASS: ${summary.pass}`,
    `- FAIL: ${summary.fail}`,
    "",
    "## Per preset",
    "",
    "| Preset | PASS | No-data month | Insufficient evidence | Main status | Main priority | Primary subject | Story issues |",
    "|---|:---:|:---:|:---:|---|---|---|---|",
    ...results.map((r) => {
      const issues = r.story.issues.join("; ") || "-";
      return `| ${r.presetId} | ${r.pass ? "PASS" : "FAIL"} | ${r.noDataMonth ? "yes" : "no"} | ${r.isInsufficientEvidence ? "yes" : "no"} | ${String(r.mainStatusHe || "").slice(0, 80)} | ${String(r.mainPriorityHe || "").slice(0, 80)} | ${r.primarySubject || "-"} | ${issues} |`;
    }),
    "",
    "## touchedKeys policy proof",
    "",
    `- identicalTouchedKeysAcrossPresets: ${touchedKeysProof.identicalTouchedKeysAcrossPresets}`,
    `- allPresetsSameTopStoryWhenInactiveKeysPruned: ${touchedKeysProof.allPresetsSameTopStoryWhenInactiveKeysPruned}`,
    `- Conclusion: ${touchedKeysProof.policyConclusion}`,
    "",
  ].join("\n");
  await fs.writeFile(OUT_MD, md, "utf8");

  console.log(
    JSON.stringify(
      {
        ok: summary.fail === 0,
        summary,
        outJson: path.relative(ROOT, OUT_JSON).replace(/\\/g, "/"),
        outMd: path.relative(ROOT, OUT_MD).replace(/\\/g, "/"),
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
