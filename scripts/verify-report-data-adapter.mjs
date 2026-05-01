import assert from "node:assert/strict";
import {
  buildReportInputFromDbData,
  compareDbReportInputToLocalSnapshot,
  REPORT_DB_SUBJECTS,
} from "../lib/learning-supabase/report-data-adapter.js";

function assertAllSubjectsPresent(subjectsObj) {
  for (const subject of REPORT_DB_SUBJECTS) {
    assert.ok(subjectsObj[subject], `missing subject ${subject}`);
  }
}

function run() {
  const sample = {
    student: {
      id: "student-1",
      full_name: "בדיקה",
      grade_level: "g4",
      is_active: true,
    },
    range: {
      from: "2026-04-01",
      to: "2026-04-30",
    },
    summary: {
      totalSessions: 3,
      completedSessions: 2,
      totalAnswers: 4,
      correctAnswers: 3,
      wrongAnswers: 1,
      totalDurationSeconds: 360,
    },
    subjects: {
      math: {
        sessions: 1,
        answers: 2,
        correct: 1,
        wrong: 1,
        durationSeconds: 120,
        topics: {
          addition: {
            answers: 2,
            correct: 1,
            wrong: 1,
            durationSeconds: 120,
          },
        },
      },
      science: {
        sessions: 2,
        answers: 2,
        correct: 2,
        wrong: 0,
        durationSeconds: 240,
        topics: {
          animals: {
            answers: 2,
            correct: 2,
            wrong: 0,
            durationSeconds: 240,
          },
        },
      },
    },
    dailyActivity: [
      { date: "2026-04-02", sessions: 1, answers: 2, correct: 1, wrong: 1, durationSeconds: 120 },
      { date: "2026-04-03", sessions: 2, answers: 2, correct: 2, wrong: 0, durationSeconds: 240 },
    ],
    recentMistakes: [
      {
        subject: "math",
        topic: "addition",
        questionId: "q1",
        prompt: "1+1",
        expectedAnswer: "2",
        userAnswer: "3",
        answeredAt: "2026-04-02T10:00:00.000Z",
      },
      {
        subject: "science",
        topic: "animals",
        questionId: "q2",
        prompt: "cat?",
        expectedAnswer: "mammal",
        userAnswer: "bird",
        answeredAt: "2026-04-03T10:00:00.000Z",
      },
    ],
    meta: {
      source: "supabase",
      version: "phase-2d-c2",
    },
  };

  const sampleClone = JSON.parse(JSON.stringify(sample));
  const out = buildReportInputFromDbData(sample, {
    period: "month",
    timezone: "UTC",
    includeDebug: true,
  });

  assert.equal(out.source, "supabase");
  assert.equal(out.version, "phase-2d-c3");
  assertAllSubjectsPresent(out.subjects);
  assert.equal(out.totals.answers, 4);
  assert.equal(out.totals.correct, 3);
  assert.equal(out.totals.wrong, 1);
  assert.equal(out.totals.accuracy, 75);
  assert.equal(out.subjects.math.total, 2);
  assert.equal(out.subjects.math.topics.addition.total, 2);
  assert.equal(out.subjects.math.topics.addition.accuracy, 50);
  assert.equal(out.subjects.science.topics.animals.accuracy, 100);
  assert.equal(out.recentMistakes.length, 2);
  assert.equal(out.subjects.math.mistakes.length, 1);
  assert.equal(out.subjects.science.mistakes.length, 1);
  assert.ok(out.debug);
  assert.deepEqual(sample, sampleClone, "input mutated");

  const emptyOut = buildReportInputFromDbData({});
  assertAllSubjectsPresent(emptyOut.subjects);
  assert.equal(emptyOut.totals.answers, 0);
  assert.equal(emptyOut.totals.accuracy, 0);
  assert.equal(Number.isNaN(emptyOut.totals.accuracy), false);

  const localSnapshot = {
    totals: {
      answers: 5,
      correct: 4,
      wrong: 1,
      accuracy: 80,
      durationSeconds: 420,
    },
    subjects: {
      math: { total: 3 },
      science: { total: 2 },
    },
  };
  const diff = compareDbReportInputToLocalSnapshot(out, localSnapshot);
  assert.equal(diff.totals.answersDelta, -1);
  assert.equal(diff.totals.correctDelta, -1);
  assert.equal(diff.totals.accuracyDelta, -5);

  console.log("PASS: report-data-adapter verification passed");
}

run();
