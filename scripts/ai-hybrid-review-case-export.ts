/**
 * Export a single hybrid case for human review (stdout).
 * Usage:
 *   npx tsx scripts/ai-hybrid-review-case-export.ts --harness weak_sparse [--unit-index 0]
 *   npx tsx scripts/ai-hybrid-review-case-export.ts --player VisualQA --period week [--unit-index 0]
 */
import * as diagnosticEngine from "../utils/diagnostic-engine-v2/index.js";
import * as safeHybrid from "../utils/ai-hybrid-diagnostic/safe-build-hybrid-runtime.js";
import { buildHybridCaseReviewRecord } from "../utils/ai-hybrid-diagnostic/hybrid-review-record.js";
import { summarizeHybridRuntimeForReview } from "../utils/ai-hybrid-diagnostic/hybrid-review-summary.js";

const runDiagnosticEngineV2 = diagnosticEngine.runDiagnosticEngineV2;
const safeBuildHybridRuntimeForReport = safeHybrid.safeBuildHybridRuntimeForReport;

if (typeof runDiagnosticEngineV2 !== "function") {
  throw new Error("runDiagnosticEngineV2 not resolved");
}
if (typeof safeBuildHybridRuntimeForReport !== "function") {
  throw new Error("safeBuildHybridRuntimeForReport not resolved");
}

const START_MS = Date.UTC(2026, 3, 1, 0, 0, 0, 0);
const END_MS = Date.UTC(2026, 3, 14, 23, 59, 59, 999);

function row(displayName, questions, correct, wrong, accuracy, behaviorType = "knowledge_gap") {
  return {
    displayName,
    questions,
    correct,
    wrong,
    accuracy,
    modeKey: "learning",
    lastSessionMs: END_MS - 3600_000,
    needsPractice: accuracy < 85,
    confidence01: 0.5,
    dataSufficiencyLevel: questions >= 12 ? "medium" : "low",
    isEarlySignalOnly: questions < 8,
    behaviorProfile: { version: 1, dominantType: behaviorType, signals: {}, decisionTrace: [] },
  };
}

function wrongEvents(subject, bucketKey, count) {
  const out = [];
  for (let i = 0; i < count; i += 1) {
    out.push({
      subject,
      topic: bucketKey,
      operation: bucketKey,
      bucketKey,
      mode: "learning",
      grade: "g4",
      level: "medium",
      timestamp: START_MS + i * 3600_000 * 6,
      isCorrect: false,
      patternFamily: `pf:${i % 3}`,
      hintUsed: false,
      exerciseText: `${bucketKey} q${i}`,
      correctAnswer: 10,
      userAnswer: 3,
    });
  }
  return out;
}

const HARNESS_ALIASES: Record<string, string> = {
  weak_sparse: "weak_sparse_suppresses_hybrid",
  hybrid_attaches: "hybrid_attaches_per_unit",
};

const HARNESS_CASES: Record<
  string,
  { maps: Record<string, Record<string, object>>; raw: Record<string, unknown[]> }
> = {
  weak_sparse_suppresses_hybrid: {
    maps: {
      math: {
        "addition\u0001learning\u0001g4\u0001medium": row("חיבור", 4, 3, 1, 75),
      },
    },
    raw: { math: wrongEvents("math", "addition", 1) },
  },
  hybrid_attaches_per_unit: {
    maps: {
      geometry: {
        "perimeter\u0001learning": row("היקף", 20, 10, 10, 50, "knowledge_gap"),
      },
    },
    raw: { geometry: wrongEvents("geometry", "perimeter", 10) },
  },
};

function parseArgs(argv: string[]) {
  const out: {
    harness: string | null;
    player: string | null;
    period: string;
    unitIndex: number;
    unitKey: string | null;
    jsonOnly: boolean;
    help?: boolean;
  } = { harness: null, player: null, period: "week", unitIndex: 0, unitKey: null, jsonOnly: false };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--harness" && argv[i + 1]) {
      out.harness = argv[++i];
    } else if (a === "--player" && argv[i + 1]) {
      out.player = argv[++i];
    } else if (a === "--period" && argv[i + 1]) {
      out.period = argv[++i];
    } else if (a === "--unit-index" && argv[i + 1]) {
      out.unitIndex = Number(argv[++i]);
    } else if (a === "--unit-key" && argv[i + 1]) {
      out.unitKey = argv[++i];
    } else if (a === "--json-only") {
      out.jsonOnly = true;
    } else if (a === "--help" || a === "-h") {
      out.help = true;
    }
  }
  return out;
}

function seedVisualQALocalStorage() {
  const now = Date.now();
  const store = new Map<string, string>();
  const set = (k: string, v: unknown) => store.set(k, typeof v === "string" ? v : JSON.stringify(v));
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
  globalThis.localStorage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => store.set(k, String(v)),
    removeItem: (k: string) => store.delete(k),
  };
  globalThis.window = globalThis;
}

function printHuman(record: unknown, summary: unknown) {
  console.log("=== AI-Hybrid review export ===\n");
  console.log("--- Shadow summary (local) ---");
  console.log(JSON.stringify(summary, null, 2));
  console.log("\n--- Case comparison ---");
  console.log(JSON.stringify(record, null, 2));
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(`ai-hybrid-review-case-export.ts

  --harness <id>               weak_sparse | hybrid_attaches | full id (weak_sparse_suppresses_hybrid, hybrid_attaches_per_unit)
  --player <name>              load generateDetailedParentReport (needs browser-like storage)
  --period week|month|custom   with --player
  --unit-index N               default 0
  --unit-key <key>             optional; overrides index if found
  --json-only                  machine JSON only (record + summary)
`);
    return;
  }

  if (args.harness) {
    const hid = HARNESS_ALIASES[args.harness] || args.harness;
    const tc = HARNESS_CASES[hid];
    if (!tc) {
      console.error(`Unknown harness id: ${args.harness}`);
      process.exitCode = 1;
      return;
    }
    const diagnosticEngineV2 = runDiagnosticEngineV2({
      maps: tc.maps,
      rawMistakesBySubject: tc.raw,
      startMs: START_MS,
      endMs: END_MS,
    });
    const hr = safeBuildHybridRuntimeForReport({
      diagnosticEngineV2,
      maps: tc.maps,
      rawMistakesBySubject: tc.raw,
      startMs: START_MS,
      endMs: END_MS,
    });
    const summary = summarizeHybridRuntimeForReview(hr);
    const record = buildHybridCaseReviewRecord({
      hybridRuntime: hr,
      diagnosticEngineV2,
      unitIndex: args.unitIndex,
      unitKey: args.unitKey,
    });
    if (!record) {
      console.error("No review record (empty hybrid units?)");
      process.exitCode = 1;
      return;
    }
    if (args.jsonOnly) {
      console.log(JSON.stringify({ summary, record }, null, 2));
    } else {
      printHuman(record, summary);
    }
    return;
  }

  if (args.player) {
    seedVisualQALocalStorage();
    const { generateDetailedParentReport } = await import("../utils/detailed-parent-report.js");
    const payload = generateDetailedParentReport(args.player, args.period, null, null);
    if (!payload?.hybridRuntime) {
      console.error("No hybridRuntime on detailed payload (null or invalid). Try --harness mode.");
      process.exitCode = 1;
      return;
    }
    const summary = summarizeHybridRuntimeForReview(payload.hybridRuntime);
    const record = buildHybridCaseReviewRecord({
      hybridRuntime: payload.hybridRuntime,
      diagnosticEngineV2: payload.diagnosticEngineV2,
      unitIndex: args.unitIndex,
      unitKey: args.unitKey,
    });
    if (!record) {
      console.error("No review record.");
      process.exitCode = 1;
      return;
    }
    if (args.jsonOnly) {
      console.log(JSON.stringify({ summary, record }, null, 2));
    } else {
      printHuman(record, summary);
    }
    return;
  }

  console.error("Specify --harness <id> or --player <name>. Use --help.");
  process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
