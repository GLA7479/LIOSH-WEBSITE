/**
 * Validates server-side detailed payload rebuild from an aggregated report-data-shaped body (no HTTP / DB).
 */
import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

async function main() {
  const { buildDetailedPayloadFromAggregatedReportBody } = await import(
    pathToFileURL(join(ROOT, "lib/parent-server/db-input-to-detailed-report.server.js")).href
  );

  const emptySubjects = () => ({
    sessions: 0,
    answers: 0,
    correct: 0,
    wrong: 0,
    accuracy: 0,
    durationSeconds: 0,
    topics: {},
  });

  const reportBody = {
    ok: true,
    student: {
      id: "550e8400-e29b-41d4-a716-446655440000",
      full_name: "SnapshotQA",
      grade_level: "g3",
      is_active: true,
    },
    range: { from: "2026-01-01", to: "2026-01-07" },
    summary: {
      totalSessions: 1,
      completedSessions: 1,
      totalAnswers: 6,
      correctAnswers: 5,
      wrongAnswers: 1,
      accuracy: 83.33,
      totalDurationSeconds: 360,
    },
    subjects: {
      math: {
        sessions: 1,
        answers: 6,
        correct: 5,
        wrong: 1,
        accuracy: 83.33,
        durationSeconds: 360,
        topics: {
          addition: {
            answers: 6,
            correct: 5,
            wrong: 1,
            accuracy: 83.33,
            durationSeconds: 360,
          },
        },
      },
      geometry: emptySubjects(),
      english: emptySubjects(),
      hebrew: emptySubjects(),
      science: emptySubjects(),
      moledet_geography: emptySubjects(),
    },
    dailyActivity: [],
    recentMistakes: [],
    meta: { source: "supabase", version: "selftest" },
  };

  const detailed = await buildDetailedPayloadFromAggregatedReportBody(reportBody, "week");
  assert.ok(detailed && typeof detailed === "object");
  assert.equal(detailed.version, 2);
  assert.ok(Array.isArray(detailed.subjectProfiles));

  console.log("OK parent-copilot-server-snapshot-selftest");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
