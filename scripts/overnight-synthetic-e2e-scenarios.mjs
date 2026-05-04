#!/usr/bin/env node
/**
 * Synthetic student profiles → detailed report payload → Parent Copilot turns (deterministic).
 * Writes JSON/MD only; no product changes.
 *
 * Usage: node scripts/overnight-synthetic-e2e-scenarios.mjs --outDir <dir>
 */
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

let outDir = path.join(ROOT, "reports", "overnight-synthetic-e2e-temp");
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--outDir" && args[i + 1]) {
    outDir = path.resolve(args[++i]);
  }
}

function installBrowserGlobals() {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };
  globalThis.window = globalThis;
}

/** Minimal seeds — enough for generateDetailedParentReport to return non-null */
function applyProfileSeed(profileId) {
  const now = Date.now();
  const store = globalThis.localStorage;
  const set = (k, v) => store.setItem(k, typeof v === "string" ? v : JSON.stringify(v));

  set("mleo_player_name", `Synth_${profileId}`);

  const mathSessions = (spec) => {
    const { sessions } = spec;
    return {
      operations: {
        addition: { sessions },
      },
    };
  };

  switch (profileId) {
    case "strong-stable":
      set(
        "mleo_time_tracking",
        mathSessions({
          sessions: Array.from({ length: 6 }, (_, i) => ({
            timestamp: now - i * 7200000,
            total: 20,
            correct: 18,
            mode: "learning",
            grade: "g4",
            level: "medium",
            duration: 400,
          })),
        })
      );
      set("mleo_math_master_progress", { progress: { addition: { total: 200, correct: 180 } } });
      break;
    case "weak-but-improving":
      set(
        "mleo_time_tracking",
        mathSessions({
          sessions: [
            { timestamp: now - 5000000, total: 10, correct: 3, mode: "practice", grade: "g3", level: "easy", duration: 180 },
            { timestamp: now, total: 12, correct: 8, mode: "learning", grade: "g3", level: "medium", duration: 240 },
          ],
        })
      );
      set("mleo_math_master_progress", { progress: { addition: { total: 40, correct: 22 } } });
      break;
    case "declining-recent":
      set(
        "mleo_time_tracking",
        mathSessions({
          sessions: [
            { timestamp: now, total: 12, correct: 4, mode: "learning", grade: "g4", level: "medium", duration: 200 },
            { timestamp: now - 6000000, total: 14, correct: 11, mode: "learning", grade: "g4", level: "medium", duration: 260 },
          ],
        })
      );
      set("mleo_math_master_progress", { progress: { addition: { total: 80, correct: 48 } } });
      break;
    case "inconsistent-guessing":
      set(
        "mleo_time_tracking",
        mathSessions({
          sessions: [
            { timestamp: now, total: 8, correct: 2, mode: "learning", grade: "g3", level: "easy", duration: 90 },
            { timestamp: now - 800000, total: 8, correct: 7, mode: "learning", grade: "g3", level: "easy", duration: 400 },
          ],
        })
      );
      set("mleo_math_master_progress", { progress: { addition: { total: 50, correct: 28 } } });
      break;
    case "very-little-data":
      set(
        "mleo_time_tracking",
        mathSessions({
          sessions: [{ timestamp: now, total: 2, correct: 1, mode: "learning", grade: "g2", level: "easy", duration: 80 }],
        })
      );
      set("mleo_math_master_progress", { progress: { addition: { total: 2, correct: 1 } } });
      break;
    case "math-only":
      set(
        "mleo_time_tracking",
        mathSessions({
          sessions: [{ timestamp: now, total: 30, correct: 22, mode: "learning", grade: "g4", level: "medium", duration: 420 }],
        })
      );
      set("mleo_math_master_progress", { progress: { addition: { total: 120, correct: 90 } } });
      break;
    case "geometry-only":
      set("mleo_time_tracking", { operations: {} });
      set("mleo_math_master_progress", { progress: {} });
      set("mleo_geometry_time_tracking", {
        topics: {
          perimeter: {
            sessions: [{ timestamp: now, total: 25, correct: 19, mode: "learning", grade: "g4", level: "hard", duration: 380 }],
          },
        },
      });
      set("mleo_geometry_master_progress", { progress: { perimeter: { total: 100, correct: 76 } } });
      break;
    case "english-no-data":
      set(
        "mleo_time_tracking",
        mathSessions({
          sessions: [{ timestamp: now, total: 18, correct: 14, mode: "learning", grade: "g4", level: "medium", duration: 350 }],
        })
      );
      set("mleo_math_master_progress", { progress: { addition: { total: 90, correct: 70 } } });
      set("mleo_english_time_tracking", { topics: {} });
      set("mleo_english_master_progress", { progress: {} });
      break;
    case "six-subject-mixed":
      set(
        "mleo_time_tracking",
        mathSessions({
          sessions: [{ timestamp: now, total: 10, correct: 7, mode: "learning", grade: "g3", level: "medium", duration: 300 }],
        })
      );
      set("mleo_math_master_progress", { progress: { addition: { total: 40, correct: 28 } } });
      set("mleo_geometry_time_tracking", {
        topics: {
          angles: { sessions: [{ timestamp: now, total: 8, correct: 5, mode: "learning", grade: "g4", level: "medium", duration: 280 }] },
        },
      });
      set("mleo_geometry_master_progress", { progress: { angles: { total: 32, correct: 20 } } });
      ["english", "science", "hebrew"].forEach((s) => {
        set(`mleo_${s}_time_tracking`, { topics: { x: { sessions: [{ timestamp: now, total: 6, correct: 4, mode: "learning", grade: "g3", level: "easy", duration: 200 }] } } });
        set(`mleo_${s}_master_progress`, { progress: { x: { total: 24, correct: 16 } } });
      });
      set("mleo_moledet_geography_time_tracking", {
        topics: { map1: { sessions: [{ timestamp: now, total: 7, correct: 5, mode: "learning", grade: "g3", level: "easy", duration: 210 }] } },
      });
      set("mleo_moledet_geography_master_progress", { progress: { map1: { total: 28, correct: 20 } } });
      break;
    default:
      set(
        "mleo_time_tracking",
        mathSessions({
          sessions: [{ timestamp: now, total: 15, correct: 10, mode: "learning", grade: "g3", level: "medium", duration: 300 }],
        })
      );
      set("mleo_math_master_progress", { progress: { addition: { total: 60, correct: 42 } } });
  }

  set("mleo_mistakes", []);
  set("mleo_geometry_mistakes", []);
}

const QUESTIONS = [
  "מה כדאי לתרגל?",
  "למה זאת ההמלצה?",
  "מה לא כדאי לעשות עכשיו?",
  "האם אפשר לעלות רמה?",
  "האם הילד חלש?",
  "מה המצב במקצוע שאין בו נתונים?",
  "תן לי תרגול דומה.",
];

async function main() {
  fs.mkdirSync(outDir, { recursive: true });

  const { generateDetailedParentReport } = await import(pathToFileURL(path.join(ROOT, "utils/detailed-parent-report.js")).href);
  const { runParentCopilotTurn } = await import(pathToFileURL(path.join(ROOT, "utils/parent-copilot/index.js")).href);
  const { syntheticPayload } = await import(pathToFileURL(path.join(ROOT, "scripts/parent-copilot-test-fixtures.mjs")).href);

  const profiles = [
    "strong-stable",
    "weak-but-improving",
    "declining-recent",
    "inconsistent-guessing",
    "very-little-data",
    "math-only",
    "geometry-only",
    "english-no-data",
    "six-subject-mixed",
  ];

  const rows = [];
  const externalRows = [];

  for (const pid of profiles) {
    installBrowserGlobals();
    applyProfileSeed(pid);
    const detailed = generateDetailedParentReport(`Synth_${pid}`, "week", null, null);
    const payload = detailed || syntheticPayload();
    const turns = [];
    for (const q of QUESTIONS) {
      const res = runParentCopilotTurn({
        payload,
        utterance: q,
        sessionId: `synth-${pid}-${turns.length}`,
        audience: "parent",
      });
      turns.push({
        question: q,
        resolutionStatus: res.resolutionStatus,
        blocksPreview: (res.answerBlocks || []).map((b) => String(b.textHe || "").slice(0, 400)),
      });
    }
    rows.push({ profile: pid, hadDetailedPayload: Boolean(detailed), turns });
  }

  installBrowserGlobals();
  applyProfileSeed("strong-stable");
  const extPayload = syntheticPayload();
  const extUtterances = [
    "פתור: 2x+1=5",
    "תן לי חמש שאלות דומות",
    "מה האבחון של הילד?",
    "תגיד בדיוק מה לא בסדר עם הילד שלי",
  ];
  for (const u of extUtterances) {
    const res = runParentCopilotTurn({
      payload: extPayload,
      utterance: u,
      sessionId: `synth-external-${externalRows.length}`,
      audience: "parent",
    });
    externalRows.push({
      utterance: u,
      resolutionStatus: res.resolutionStatus,
      blocksPreview: (res.answerBlocks || []).map((b) => String(b.textHe || "").slice(0, 500)),
    });
  }

  const outJson = {
    generatedAt: new Date().toISOString(),
    profiles: rows,
    externalQuestionFlow: externalRows,
  };
  fs.writeFileSync(path.join(outDir, "synthetic-e2e-scenarios.json"), JSON.stringify(outJson, null, 2), "utf8");

  const md = [
    `# Synthetic E2E scenarios`,
    ``,
    `Generated: ${outJson.generatedAt}`,
    ``,
    ...rows.map((r) => [`## ${r.profile}`, r.hadDetailedPayload ? "(detailed payload ok)" : "(fallback fixture)", ``].join("\n")),
    `## External-style utterances (fixture payload)`,
    externalRows.map((e) => `- ${e.utterance.slice(0, 80)} → ${e.resolutionStatus}`).join("\n"),
  ].join("\n");
  fs.writeFileSync(path.join(outDir, "synthetic-e2e-scenarios.md"), md, "utf8");

  console.log("overnight-synthetic-e2e-scenarios OK", outDir);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
