/**
 * Dump subject + topic visible text (simulated OLD UI vs NEW letter layer).
 * Seeds browser-like localStorage + window so generateParentReportV2 runs in Node.
 * Usage: node scripts/dump-detailed-report-sample.mjs
 */
const now = Date.now();
const store = new Map();

function seedVisualQA() {
  const set = (k, v) => store.set(k, typeof v === "string" ? v : JSON.stringify(v));
  set("mleo_player_name", "VisualQA");
  set("mleo_time_tracking", {
    operations: {
      addition: {
        sessions: [
          {
            timestamp: now,
            total: 18,
            correct: 16,
            mode: "learning",
            grade: "g3",
            level: "medium",
            duration: 420,
          },
          {
            timestamp: now - 60_000,
            total: 10,
            correct: 4,
            mode: "practice",
            grade: "g3",
            level: "easy",
            duration: 200,
          },
        ],
      },
    },
  });
  set("mleo_math_master_progress", { progress: { addition: { total: 200, correct: 150 } } });
  set("mleo_mistakes", []);
  set("mleo_geometry_time_tracking", {
    topics: {
      perimeter: {
        sessions: [
          {
            timestamp: now,
            total: 14,
            correct: 11,
            mode: "learning",
            grade: "g4",
            level: "hard",
            duration: 360,
          },
        ],
      },
    },
  });
  set("mleo_geometry_master_progress", { progress: { perimeter: { total: 50, correct: 40 } } });
  set("mleo_geometry_mistakes", []);
}

globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};
globalThis.window = globalThis;

seedVisualQA();

const { generateDetailedParentReport } = await import("../utils/detailed-parent-report.js");
const { buildSubjectParentLetter, buildTopicRecommendationNarrative } = await import(
  "../utils/detailed-report-parent-letter-he.js"
);

const player = process.argv[2] || "VisualQA";
const r = generateDetailedParentReport(player, "week");
if (!r) {
  console.log("null report");
  process.exit(1);
}

function oldSubjectVisible(sp) {
  const lines = [];
  if (sp.summaryHe) lines.push(sp.summaryHe);
  const sec = sp.diagnosticSectionsHe;
  if (sec && typeof sec === "object") {
    lines.push("מבט אבחוני לפי קטגוריות");
    for (const [k, arr] of Object.entries(sec)) {
      if (Array.isArray(arr) && arr.length) lines.push(`[${k}]`, ...arr.slice(0, 5));
    }
  }
  if (sp.subSkillInsightsHe && sp.subSkillInsightsHe.length) {
    lines.push("תת־מיומנויות (כשהנתון מאפשר)");
    lines.push(
      ...sp.subSkillInsightsHe.slice(0, 2).map((x) => `${x.lineHe} — ${x.evidenceNoteHe || ""}`)
    );
  }
  for (const label of ["excellence", "topStrengths", "maintain", "improving", "topWeaknesses"]) {
    const arr = sp[label];
    if (!Array.isArray(arr) || !arr.length) continue;
    const title =
      label === "excellence"
        ? "הצטיינות היציבה"
        : label === "topStrengths"
          ? "חוזקות מובילות"
          : label === "maintain"
            ? "מומלץ לשמר"
            : label === "improving"
              ? "נקודות לשיפור"
              : "תחומים הדורשים תשומת לב";
    lines.push(title);
    for (const row of arr.slice(0, 3)) {
      if (label === "topWeaknesses")
        lines.push(`${row.labelHe}${row.mistakeCount != null ? ` (${row.mistakeCount} טעויות דומות)` : ""}`);
      else lines.push(`${row.labelHe} — ${row.accuracy}% (${row.questions})`);
    }
  }
  if (sp.parentActionHe) {
    lines.push("פעולה לבית");
    lines.push(sp.parentActionHe);
  }
  if (sp.nextWeekGoalHe) {
    lines.push("יעד לשבוע");
    lines.push(sp.nextWeekGoalHe);
  }
  return lines.join("\n");
}

function oldTopicCard(tr) {
  const parts = [
    tr.displayName,
    tr.recommendedStepLabelHe,
    `שליטה ${tr.currentMastery}% · יציבות ${Math.round(tr.stability * 100)}% · ביטחון ${Math.round(tr.confidence * 100)}% · ${tr.questions} שאלות · דיוק ${tr.accuracy}%`,
  ];
  if (tr.recommendedEvidenceLevelHe) parts.push(tr.recommendedEvidenceLevelHe);
  if (tr.dataSufficiencyLabelHe) parts.push(tr.dataSufficiencyLabelHe);
  if (tr.isEarlySignalOnly) parts.push("אות מוקדם (לא דפוס יציב עדיין)");
  if (tr.recommendedStepReasonHe) parts.push(tr.recommendedStepReasonHe);
  if (tr.recommendedWhyNowHe) parts.push(tr.recommendedWhyNowHe);
  if (tr.recommendationStabilityNoteHe) parts.push(tr.recommendationStabilityNoteHe);
  parts.push("להורה:", tr.recommendedParentActionHe);
  parts.push("לתלמיד:", tr.recommendedStudentActionHe);
  return parts.filter(Boolean).join("\n");
}

function newSubjectVisible(sp) {
  const L = buildSubjectParentLetter(sp);
  return [L.opening, L.goingWell, L.fragile, L.homeAction, L.closing].filter(Boolean).join("\n\n");
}

function newTopicCard(tr) {
  const n = buildTopicRecommendationNarrative(tr);
  return [n.snapshot, n.homeLine].filter(Boolean).join("\n\n");
}

const name = r.periodInfo.playerName || player;
console.log("=== PLAYER", name, "===\n");

const math = r.subjectProfiles.find((x) => x.subject === "math");
const geom = r.subjectProfiles.find((x) => x.subject === "geometry");

for (const sp of [math, geom].filter(Boolean)) {
  console.log("######## SUBJECT:", sp.subjectLabelHe, "########\n--- BEFORE (visible stack) ---\n");
  console.log(oldSubjectVisible(sp));
  console.log("\n--- AFTER (letter only) ---\n");
  console.log(newSubjectVisible(sp));
  console.log("\n");
}

const topics = [];
for (const sp of r.subjectProfiles) {
  for (const tr of sp.topicRecommendations || []) {
    topics.push({ subject: sp.subjectLabelHe, tr });
    if (topics.length >= 3) break;
  }
  if (topics.length >= 3) break;
}

let ti = 0;
for (const { subject, tr } of topics) {
  ti++;
  console.log(`######## TOPIC ${ti} (${subject}: ${tr.displayName}) ########\n--- BEFORE ---\n`);
  console.log(oldTopicCard(tr));
  console.log("\n--- AFTER ---\n");
  console.log(newTopicCard(tr));
  console.log("\n");
}
