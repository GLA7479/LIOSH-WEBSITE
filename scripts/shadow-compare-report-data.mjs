import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import {
  buildReportInputFromDbData,
  compareDbReportInputToLocalSnapshot,
  REPORT_DB_SUBJECTS,
} from "../lib/learning-supabase/report-data-adapter.js";

function safeNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function normalizeAccuracy(correct, total) {
  const c = Math.max(0, safeNumber(correct));
  const t = Math.max(0, safeNumber(total));
  if (t <= 0) return 0;
  return Number(((c / t) * 100).toFixed(2));
}

function safeReadJson(absPath) {
  const raw = fs.readFileSync(absPath, "utf8");
  return JSON.parse(raw);
}

function parseArgs(argv) {
  const args = {
    mode: "sample",
    dbPath: "",
    localPath: "",
    period: "month",
    timezone: "UTC",
  };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--mode") args.mode = argv[i + 1] || args.mode;
    if (token === "--db") args.dbPath = argv[i + 1] || "";
    if (token === "--local") args.localPath = argv[i + 1] || "";
    if (token === "--period") args.period = argv[i + 1] || args.period;
    if (token === "--timezone") args.timezone = argv[i + 1] || args.timezone;
  }
  return args;
}

function sampleDbReportData() {
  return {
    ok: true,
    student: { id: "student-sample", full_name: "Sample Student", grade_level: "g4", is_active: true },
    range: { from: "2026-04-01", to: "2026-04-30" },
    summary: {
      totalSessions: 6,
      completedSessions: 5,
      totalAnswers: 20,
      correctAnswers: 14,
      wrongAnswers: 6,
      accuracy: 70,
      totalDurationSeconds: 1800,
    },
    subjects: {
      math: {
        sessions: 2,
        answers: 6,
        correct: 4,
        wrong: 2,
        accuracy: 66.67,
        durationSeconds: 600,
        topics: {
          addition: { answers: 4, correct: 3, wrong: 1, accuracy: 75, durationSeconds: 400 },
          subtraction: { answers: 2, correct: 1, wrong: 1, accuracy: 50, durationSeconds: 200 },
        },
      },
      science: {
        sessions: 2,
        answers: 5,
        correct: 4,
        wrong: 1,
        accuracy: 80,
        durationSeconds: 420,
        topics: {
          animals: { answers: 5, correct: 4, wrong: 1, accuracy: 80, durationSeconds: 420 },
        },
      },
      english: {
        sessions: 1,
        answers: 4,
        correct: 3,
        wrong: 1,
        accuracy: 75,
        durationSeconds: 360,
        topics: {
          vocabulary: { answers: 4, correct: 3, wrong: 1, accuracy: 75, durationSeconds: 360 },
        },
      },
      geometry: {
        sessions: 1,
        answers: 3,
        correct: 2,
        wrong: 1,
        accuracy: 66.67,
        durationSeconds: 240,
        topics: {
          angles: { answers: 3, correct: 2, wrong: 1, accuracy: 66.67, durationSeconds: 240 },
        },
      },
      hebrew: { sessions: 0, answers: 1, correct: 1, wrong: 0, accuracy: 100, durationSeconds: 90, topics: {} },
      moledet_geography: {
        sessions: 0,
        answers: 1,
        correct: 0,
        wrong: 1,
        accuracy: 0,
        durationSeconds: 90,
        topics: {},
      },
    },
    dailyActivity: [
      { date: "2026-04-02", sessions: 2, answers: 6, correct: 4, wrong: 2, durationSeconds: 600 },
      { date: "2026-04-03", sessions: 2, answers: 7, correct: 5, wrong: 2, durationSeconds: 600 },
      { date: "2026-04-04", sessions: 2, answers: 7, correct: 5, wrong: 2, durationSeconds: 600 },
    ],
    recentMistakes: [
      {
        subject: "math",
        topic: "subtraction",
        questionId: "m-2",
        prompt: "8-3",
        expectedAnswer: "5",
        userAnswer: "6",
        answeredAt: "2026-04-02T10:00:00.000Z",
      },
      {
        subject: "moledet_geography",
        topic: "geography",
        questionId: "mg-1",
        prompt: "Capital?",
        expectedAnswer: "Jerusalem",
        userAnswer: "Haifa",
        answeredAt: "2026-04-04T12:00:00.000Z",
      },
    ],
    meta: { source: "supabase", version: "phase-2d-c2", fallbackUsed: false },
  };
}

function sampleLocalSnapshot() {
  return {
    source: "localStorage",
    version: "snapshot-v1",
    totals: {
      sessions: 6,
      completedSessions: 5,
      answers: 22,
      correct: 15,
      wrong: 7,
      accuracy: 68.18,
      durationSeconds: 1900,
    },
    subjects: {
      math: { total: 7, correct: 5, wrong: 2, accuracy: 71.43, durationSeconds: 610 },
      geometry: { total: 3, correct: 2, wrong: 1, accuracy: 66.67, durationSeconds: 250 },
      english: { total: 4, correct: 3, wrong: 1, accuracy: 75, durationSeconds: 360 },
      hebrew: { total: 2, correct: 1, wrong: 1, accuracy: 50, durationSeconds: 180 },
      science: { total: 5, correct: 4, wrong: 1, accuracy: 80, durationSeconds: 420 },
      moledet_geography: { total: 1, correct: 0, wrong: 1, accuracy: 0, durationSeconds: 80 },
    },
    recentMistakes: [
      { subject: "math", topic: "subtraction" },
      { subject: "hebrew", topic: "reading" },
      { subject: "moledet_geography", topic: "geography" },
    ],
  };
}

function normalizeLocalSnapshot(input) {
  const src = input && typeof input === "object" ? input : {};
  const totals = src.totals && typeof src.totals === "object" ? src.totals : {};
  const subjIn = src.subjects && typeof src.subjects === "object" ? src.subjects : {};
  const subjects = {};

  for (const subject of REPORT_DB_SUBJECTS) {
    const s = subjIn[subject] && typeof subjIn[subject] === "object" ? subjIn[subject] : {};
    const total = Math.max(0, Math.floor(safeNumber(s.total ?? s.answers)));
    const correct = Math.max(0, Math.floor(safeNumber(s.correct)));
    const wrong = Math.max(0, Math.floor(safeNumber(s.wrong)));
    subjects[subject] = {
      total,
      correct,
      wrong,
      accuracy: normalizeAccuracy(correct, total),
      durationSeconds: Math.max(0, Math.floor(safeNumber(s.durationSeconds))),
    };
  }

  const recentMistakes = Array.isArray(src.recentMistakes)
    ? src.recentMistakes
        .map(item => ({
          subject: typeof item?.subject === "string" ? item.subject : null,
          topic: typeof item?.topic === "string" ? item.topic : null,
        }))
        .filter(item => item.subject && REPORT_DB_SUBJECTS.includes(item.subject))
    : [];

  return {
    source: "localStorage",
    version: "snapshot-v1",
    totals: {
      sessions: Math.max(0, Math.floor(safeNumber(totals.sessions))),
      completedSessions: Math.max(0, Math.floor(safeNumber(totals.completedSessions))),
      answers: Math.max(0, Math.floor(safeNumber(totals.answers))),
      correct: Math.max(0, Math.floor(safeNumber(totals.correct))),
      wrong: Math.max(0, Math.floor(safeNumber(totals.wrong))),
      accuracy: normalizeAccuracy(totals.correct, totals.answers),
      durationSeconds: Math.max(0, Math.floor(safeNumber(totals.durationSeconds))),
    },
    subjects,
    recentMistakes,
  };
}

function buildSubjectComparisons(localSnapshot, dbInput) {
  const out = {};
  for (const subject of REPORT_DB_SUBJECTS) {
    const local = localSnapshot.subjects?.[subject] || {
      total: 0,
      correct: 0,
      wrong: 0,
      accuracy: 0,
      durationSeconds: 0,
    };
    const db = dbInput.subjects?.[subject] || {
      total: 0,
      correct: 0,
      wrong: 0,
      accuracy: 0,
      durationSeconds: 0,
      topics: {},
      mistakes: [],
    };
    const delta = {
      total: db.total - local.total,
      correct: db.correct - local.correct,
      wrong: db.wrong - local.wrong,
      accuracy: Number((db.accuracy - local.accuracy).toFixed(2)),
      durationSeconds: db.durationSeconds - local.durationSeconds,
      topicCoverageDelta:
        Object.keys(db.topics || {}).length -
        Object.keys((localSnapshot.subjects?.[subject]?.topics || {})).length,
      mistakeCountDelta: (db.mistakes || []).length - localSnapshot.recentMistakes.filter(m => m.subject === subject).length,
    };
    const status =
      local.total === 0 && db.total === 0
        ? "missing"
        : Math.abs(delta.total) > 5 || Math.abs(delta.accuracy) > 15
          ? "warn"
          : "ok";
    out[subject] = { local, db, delta, status };
  }
  return out;
}

function uniqueGaps(dbInput) {
  const gaps = [];
  if (dbInput?.gaps && typeof dbInput.gaps === "object") {
    for (const [key, value] of Object.entries(dbInput.gaps)) {
      gaps.push(`${key}:${value}`);
    }
  }
  return gaps;
}

function buildRecommendations(subjectComparisons) {
  const rec = [];
  for (const subject of REPORT_DB_SUBJECTS) {
    const s = subjectComparisons[subject];
    if (!s) continue;
    if (s.status === "warn") {
      rec.push(`review_${subject}_mapping`);
    }
    if (s.db.total === 0 && s.local.total > 0) {
      rec.push(`check_${subject}_db_write_coverage`);
    }
    if (s.db.mistakes?.length === 0 && s.local.total > 0 && s.local.wrong > 0) {
      rec.push(`inspect_${subject}_mistake_projection`);
    }
  }
  return Array.from(new Set(rec));
}

function requirePathForMode(mode, dbPath, localPath) {
  if (mode === "snapshot") {
    if (!dbPath || !localPath) {
      throw new Error("snapshot mode requires --db <path> and --local <path>");
    }
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  requirePathForMode(args.mode, args.dbPath, args.localPath);

  let dbReportData;
  let localSnapshotRaw;
  if (args.mode === "snapshot") {
    const absDb = path.resolve(process.cwd(), args.dbPath);
    const absLocal = path.resolve(process.cwd(), args.localPath);
    dbReportData = safeReadJson(absDb);
    localSnapshotRaw = safeReadJson(absLocal);
  } else {
    dbReportData = sampleDbReportData();
    localSnapshotRaw = sampleLocalSnapshot();
  }

  const dbInput = buildReportInputFromDbData(dbReportData, {
    period: args.period,
    timezone: args.timezone,
    includeDebug: true,
  });
  const localSnapshot = normalizeLocalSnapshot(localSnapshotRaw);

  const topDiff = compareDbReportInputToLocalSnapshot(dbInput, localSnapshot);
  const subjectComparisons = buildSubjectComparisons(localSnapshot, dbInput);

  const report = {
    ok: true,
    mode: args.mode,
    studentId: dbInput.student?.id || null,
    range: dbInput.range,
    totals: {
      local: localSnapshot.totals,
      db: dbInput.totals,
      delta: topDiff.totals,
    },
    subjectCoverage: topDiff.subjectCoverage,
    subjects: subjectComparisons,
    mistakes: {
      localCount: localSnapshot.recentMistakes.length,
      dbCount: dbInput.recentMistakes.length,
      localBySubject: REPORT_DB_SUBJECTS.reduce((acc, s) => {
        acc[s] = localSnapshot.recentMistakes.filter(m => m.subject === s).length;
        return acc;
      }, {}),
      dbBySubject: REPORT_DB_SUBJECTS.reduce((acc, s) => {
        acc[s] = (dbInput.subjects?.[s]?.mistakes || []).length;
        return acc;
      }, {}),
    },
    dailyActivity: {
      localAvailable: Array.isArray(localSnapshotRaw?.dailyActivity),
      dbCount: dbInput.dailyActivity.length,
    },
    gaps: uniqueGaps(dbInput),
    recommendations: buildRecommendations(subjectComparisons),
    meta: {
      source: "shadow-compare",
      version: "phase-2d-c4",
      comparedAt: new Date().toISOString(),
      comparedFields: [
        "totals",
        "subjectCoverage",
        "subjectCounts",
        "topicCoverage",
        "mistakes",
        "duration",
        "gaps",
      ],
    },
  };

  console.log(JSON.stringify(report, null, 2));
}

main();
