/**
 * Phase 10.4 — Deep longitudinal learning simulations (6 students).
 * Writes storage JSON + manifest under reports/parent-report-learning-simulations/deep/
 */
import fs from "fs/promises";
import path from "path";
import {
  mulberry32,
  hashStringToSeed,
  buildStorageSnapshotFromSessions,
  pickDayIndex,
  tsFromDayIndex,
  summarizeSessions,
} from "./lib/deep-learning-sim-storage.mjs";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "reports", "parent-report-learning-simulations", "deep");
const SNAP = path.join(OUT, "snapshots");

const MATH_OPS = ["addition", "subtraction", "multiplication", "division", "fractions", "word_problems"];
const GEO_TOPICS = ["area", "perimeter", "shapes_basic", "angles", "volume"];
const HEB_TOPICS = ["reading", "comprehension", "grammar", "vocabulary", "writing"];
const ENG_TOPICS = ["vocabulary", "grammar", "translation", "sentences", "writing"];
const SCI_TOPICS = ["animals", "plants", "materials", "earth_space", "body", "environment", "experiments"];

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

function pickWeighted(rng, items, weights) {
  const s = weights.reduce((a, b) => a + b, 0);
  let u = rng() * s;
  for (let i = 0; i < items.length; i += 1) {
    u -= weights[i];
    if (u <= 0) return items[i];
  }
  return items[items.length - 1];
}

function allocateTotals(rng, nSessions, targetQ) {
  const out = [];
  let rem = targetQ;
  for (let i = 0; i < nSessions - 1; i += 1) {
    const rest = nSessions - i;
    const base = rem / rest;
    const jitter = 0.55 + rng() * 0.55;
    const t = Math.max(5, Math.min(42, Math.round(base * jitter)));
    out.push(t);
    rem -= t;
  }
  out.push(Math.max(10, rem));
  return out;
}

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

function buildSessionsForScenario(scenario, rng, anchorEndMs) {
  const { id, spanDays, targetSessions, targetQuestions, subjectWeights, accuracyFn, modeLevelFn } = scenario;
  const totals = allocateTotals(rng, targetSessions, targetQuestions);
  const sessions = [];
  const subjects = Object.keys(subjectWeights);
  const w = subjects.map((s) => subjectWeights[s]);
  const rr = { math: 0, geometry: 0, hebrew: 0, english: 0, science: 0 };
  function nextTopic(subj, arr) {
    const k = subj;
    const idx = rr[k] % arr.length;
    rr[k] += 1;
    return arr[idx];
  }

  for (let i = 0; i < targetSessions; i += 1) {
    const subj = pickWeighted(rng, subjects, w);
    let bucket;
    if (subj === "math") bucket = nextTopic("math", MATH_OPS);
    else if (subj === "geometry") bucket = nextTopic("geometry", GEO_TOPICS);
    else if (subj === "hebrew") bucket = nextTopic("hebrew", HEB_TOPICS);
    else if (subj === "english") bucket = nextTopic("english", ENG_TOPICS);
    else bucket = nextTopic("science", SCI_TOPICS);

    const dayIndex = pickDayIndex(spanDays, rng);
    const ts = tsFromDayIndex(anchorEndMs, spanDays, dayIndex, rng);
    const date = new Date(ts).toISOString().split("T")[0];
    const phase = clamp01(dayIndex / Math.max(1, spanDays - 1));
    const { grade, level, mode } = modeLevelFn({ scenario, subj, bucket, phase, rng, sessionIndex: i });
    const acc = accuracyFn({ scenario, subj, bucket, phase, rng, sessionIndex: i });
    const total = totals[i];
    const correct = Math.max(0, Math.min(total, Math.round(total * acc)));
    const duration =
      mode === "speed"
        ? Math.round((8 + rng() * 7) * 60)
        : subj === "geometry" && scenario.id === "simDeep01_mixed_real_child" && bucket === "area"
          ? Math.round((28 + rng() * 17) * 60)
          : Math.round((14 + rng() * 16) * 60);

    sessions.push({
      subject: subj,
      bucket,
      timestamp: ts,
      date,
      total,
      correct,
      duration,
      grade,
      level,
      mode,
    });
  }
  return sessions;
}

const SCENARIOS = [
  {
    id: "simDeep01_mixed_real_child",
    studentName: "Deep 01 — מעורב",
    spanDays: 120,
    targetSessions: 82,
    targetQuestions: 1550,
    minSubjects: 5,
    subjectException: null,
    trendPattern: "mixed",
    expectedBehavior:
      "עדיפות ראשית אחת ברורה; לשמר חוזקות; בלי המלצות מפוזרות שקולות מדי.",
    mustNot: ["שלוש פעולות בית שקולות", "remediation-heavy on English"],
    subjectWeights: {
      math: 0.26,
      geometry: 0.18,
      hebrew: 0.22,
      english: 0.18,
      science: 0.16,
    },
    accuracyFn: ({ subj, phase, rng }) => {
      if (subj === "math") return 0.48 + rng() * 0.08;
      if (subj === "english") return 0.9 + rng() * 0.04;
      if (subj === "hebrew") return Math.min(0.92, 0.52 + phase * 0.28 + rng() * 0.05);
      if (subj === "geometry") return 0.55 + rng() * 0.1;
      return 0.7 + rng() * 0.08;
    },
    modeLevelFn: ({ subj, bucket, rng }) => ({
      grade: "g4",
      level: subj === "geometry" && bucket === "area" ? "hard" : "medium",
      mode: subj === "geometry" && bucket === "area" ? "learning" : pick(rng, ["learning", "learning", "practice"]),
    }),
  },
  {
    id: "simDeep02_strong_stable_child",
    studentName: "Deep 02 — יציב חזק",
    spanDays: 105,
    targetSessions: 68,
    targetQuestions: 1150,
    minSubjects: 4,
    subjectException: "exactly four subjects per product brief (no moledet)",
    trendPattern: "stable_strong",
    expectedBehavior: "שימור / הרחבה מבוקרת; בלי שיקום; בלי טון של פער ידע.",
    mustNot: ["פער ידע", "שיקום אגרסיבי"],
    subjectWeights: { math: 0.3, english: 0.28, hebrew: 0.24, science: 0.18 },
    /* Slightly softer math so diagnostics/strength narrative can form; other subjects stay strong. */
    accuracyFn: ({ subj, rng }) => {
      if (subj === "math") return 0.78 + rng() * 0.09;
      if (subj === "english") return 0.9 + rng() * 0.05;
      return 0.86 + rng() * 0.08;
    },
    modeLevelFn: ({ rng }) => ({
      grade: "g5",
      level: pick(rng, ["medium", "medium", "hard"]),
      mode: "learning",
    }),
  },
  {
    id: "simDeep03_weak_math_long_term",
    studentName: "Deep 03 — חולשת חשבון ארוכה",
    spanDays: 135,
    targetSessions: 72,
    targetQuestions: 1050,
    minSubjects: 4,
    subjectException: null,
    trendPattern: "weak_math_persistent",
    expectedBehavior: "חשבון כמיקוד ראשי; תוכנית בית אפשרית; לא אין מספיק ראיות בראש הדוח.",
    mustNot: ["insufficient as top status for math"],
    subjectWeights: { math: 0.42, geometry: 0.18, hebrew: 0.22, english: 0.18 },
    accuracyFn: ({ subj, bucket, rng }) => {
      if (subj === "math") {
        const weakOps = ["fractions", "division", "word_problems"];
        const base = weakOps.includes(bucket) ? 0.38 : 0.5;
        return base + rng() * 0.1;
      }
      if (subj === "geometry") return 0.72 + rng() * 0.08;
      return 0.68 + rng() * 0.1;
    },
    modeLevelFn: ({ rng }) => ({ grade: "g4", level: "medium", mode: pick(rng, ["learning", "practice"]) }),
  },
  {
    id: "simDeep04_improving_child",
    studentName: "Deep 04 — משתפר לאורך זמן",
    spanDays: 120,
    targetSessions: 70,
    targetQuestions: 1180,
    minSubjects: 4,
    subjectException: null,
    trendPattern: "improving",
    expectedBehavior: "הכרה זהירה בשיפור; עדיין ייצוב; לא הפרזה במסר חיובי.",
    mustNot: ["overconfident mastery claim"],
    subjectWeights: { math: 0.32, hebrew: 0.28, english: 0.22, geometry: 0.18 },
    accuracyFn: ({ phase, rng }) => {
      const base = 0.46 + phase * 0.34;
      return Math.min(0.88, base + rng() * 0.06);
    },
    modeLevelFn: ({ rng }) => ({ grade: "g4", level: "medium", mode: "learning" }),
  },
  {
    id: "simDeep05_declining_after_difficulty_jump",
    studentName: "Deep 05 — ירידה אחרי קפיצת קושי",
    spanDays: 110,
    targetSessions: 62,
    targetQuestions: 920,
    minSubjects: 5,
    subjectException: null,
    trendPattern: "decline_post_jump",
    expectedBehavior: "ייצוב רמה; לא להעלות קושי; מגמה מספקת לזיהוי ירידה.",
    mustNot: ["push harder difficulty"],
    subjectWeights: { math: 0.28, geometry: 0.2, english: 0.2, hebrew: 0.17, science: 0.15 },
    accuracyFn: ({ phase, rng }) => {
      if (phase < 0.58) return 0.82 + rng() * 0.08;
      return 0.54 + rng() * 0.12;
    },
    modeLevelFn: ({ phase, rng }) => ({
      grade: "g5",
      level: phase < 0.58 ? pick(rng, ["easy", "medium"]) : "hard",
      mode: phase < 0.58 ? "learning" : pick(rng, ["learning", "challenge"]),
    }),
  },
  {
    id: "simDeep06_fast_careless_vs_slow_accurate_mix",
    studentName: "Deep 06 — קצב מעורב",
    spanDays: 100,
    targetSessions: 58,
    targetQuestions: 880,
    minSubjects: 4,
    subjectException: null,
    trendPattern: "pace_mixed",
    expectedBehavior: "דגש על בדיקה/קצב; לא לתייג הכל כפער ידע.",
    mustNot: ["pure knowledge gap framing for all topics"],
    subjectWeights: { math: 0.35, hebrew: 0.24, english: 0.2, geometry: 0.21 },
    accuracyFn: ({ subj, bucket, rng }) => {
      const fastTopic = subj === "math" && (bucket === "addition" || bucket === "subtraction");
      if (fastTopic) return 0.62 + rng() * 0.1;
      return 0.88 + rng() * 0.06;
    },
    modeLevelFn: ({ subj, bucket, rng }) => {
      const fastTopic = subj === "math" && (bucket === "addition" || bucket === "subtraction");
      if (fastTopic) return { grade: "g4", level: "medium", mode: "speed" };
      return { grade: "g4", level: "medium", mode: "learning" };
    },
  },
];

function validateDeep(scenario, sessions, summary) {
  const errs = [];
  const q = summary.totalQuestions;
  const nSess = sessions.length;
  const span = scenario.spanDays;
  const oldest = Math.min(...sessions.map((x) => x.timestamp));
  const newest = Math.max(...sessions.map((x) => x.timestamp));
  const spanActualDays = Math.ceil((newest - oldest) / (24 * 60 * 60 * 1000));
  const activeSubjects = new Set(sessions.map((s) => s.subject));

  if (q < 600) errs.push(`questions ${q} < 600`);
  if (nSess < 40) errs.push(`sessions ${nSess} < 40`);
  if (spanActualDays < 90) errs.push(`date span ${spanActualDays}d < 90d`);
  if (summary.activeDays < Math.min(40, Math.ceil(span * 0.22))) {
    errs.push(`activeDays ${summary.activeDays} too concentrated`);
  }
  if (activeSubjects.size < scenario.minSubjects) {
    errs.push(`active subjects ${activeSubjects.size} < ${scenario.minSubjects}`);
  }

  for (const subj of activeSubjects) {
    const topics = summary.topicsPerSubject[subj] || [];
    if (topics.length < 3) errs.push(`subject ${subj} has only ${topics.length} topics`);
  }

  for (const subj of activeSubjects) {
    const subs = sessions.filter((s) => s.subject === subj);
    const byB = {};
    for (const s of subs) byB[s.bucket] = (byB[s.bucket] || 0) + 1;
    const vals = Object.values(byB);
    const mx = vals.length ? Math.max(...vals) : 0;
    if (subs.length > 0 && mx > subs.length * 0.58) {
      errs.push(`subject ${subj}: topic concentration ${mx}/${subs.length} on one bucket`);
    }
  }

  return errs;
}

async function main() {
  await fs.mkdir(SNAP, { recursive: true });
  const anchorEndMs = Date.now();
  const manifest = [];

  for (const scenario of SCENARIOS) {
    const rng = mulberry32(hashStringToSeed(scenario.id + String(anchorEndMs)));
    const sessions = buildSessionsForScenario(scenario, rng, anchorEndMs);
    const summary = summarizeSessions(sessions, anchorEndMs, scenario.spanDays);
    const oldest = Math.min(...sessions.map((x) => x.timestamp));
    const newest = Math.max(...sessions.map((x) => x.timestamp));
    const errs = validateDeep(scenario, sessions, summary);
    if (errs.length) {
      console.error(`Validation failed for ${scenario.id}:`, errs);
      process.exit(1);
    }

    const storage = buildStorageSnapshotFromSessions(sessions, scenario.studentName);
    const startYmd = new Date(oldest).toISOString().split("T")[0];
    const endYmd = new Date(newest).toISOString().split("T")[0];

    const snapPath = path.join(SNAP, `${scenario.id}.storage.json`);
    await fs.writeFile(snapPath, JSON.stringify(storage, null, 2), "utf8");

    manifest.push({
      id: scenario.id,
      studentName: scenario.studentName,
      simulatedDateRange: { start: startYmd, end: endYmd },
      anchorEndMs,
      totalDays: scenario.spanDays,
      activeDays: summary.activeDays,
      totalSessions: sessions.length,
      totalQuestions: summary.totalQuestions,
      totalCorrect: summary.totalCorrect,
      totalTimeMinutes: summary.totalTimeMinutes,
      subjects: summary.subjects.sort(),
      topicsPerSubject: summary.topicsPerSubject,
      accuracyBySubject: summary.accuracyBySubject,
      trendPattern: scenario.trendPattern,
      expectedReportBehavior: scenario.expectedBehavior,
      mustNotHappen: scenario.mustNot,
      subjectCountNote: scenario.subjectException,
      snapshotPath: path.relative(ROOT, snapPath).replace(/\\/g, "/"),
    });
  }

  await fs.writeFile(
    path.join(OUT, "deep-simulations-manifest.json"),
    JSON.stringify({ generatedAt: new Date().toISOString(), anchorEndMs, simulations: manifest }, null, 2),
    "utf8"
  );

  const md = [
    "# Deep learning simulations manifest",
    "",
    "| ID | Name | Days | Active days | Sessions | Questions | Correct | Minutes | Subjects | Trend |",
    "|---|---|---:|---:|---:|---:|---:|---:|---|---|",
    ...manifest.map(
      (m) =>
        `| ${m.id} | ${m.studentName} | ${m.totalDays} | ${m.activeDays} | ${m.totalSessions} | ${m.totalQuestions} | ${m.totalCorrect} | ${m.totalTimeMinutes} | ${m.subjects.join(", ")} | ${m.trendPattern} |`
    ),
    "",
  ].join("\n");
  await fs.writeFile(path.join(OUT, "deep-simulations-manifest.md"), md, "utf8");

  console.log(JSON.stringify({ ok: true, count: manifest.length, out: path.relative(ROOT, OUT) }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
