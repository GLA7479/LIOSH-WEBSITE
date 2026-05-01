import process from "node:process";
import {
  buildReportInputFromDbData,
  REPORT_DB_SUBJECTS,
} from "../lib/learning-supabase/report-data-adapter.js";

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--baseUrl") out.baseUrl = argv[i + 1];
    if (token === "--token") out.token = argv[i + 1];
    if (token === "--studentId") out.studentId = argv[i + 1];
    if (token === "--from") out.from = argv[i + 1];
    if (token === "--to") out.to = argv[i + 1];
    if (token === "--period") out.period = argv[i + 1];
    if (token === "--timezone") out.timezone = argv[i + 1];
  }
  return out;
}

function safeString(value, maxLen = 200) {
  if (value == null) return "";
  const text = String(value).trim();
  if (!text) return "";
  return text.length > maxLen ? text.slice(0, maxLen) : text;
}

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function ensureRequired(name, value) {
  if (!value) throw new Error(`Missing required value: ${name}`);
}

function isValidIsoDate(raw) {
  const text = safeString(raw, 10);
  if (!text) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const d = new Date(`${text}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return false;
  return d.toISOString().slice(0, 10) === text;
}

function validateAdapterOutput(input, requestedStudentId) {
  if (!input || typeof input !== "object") {
    throw new Error("Adapter output is not an object");
  }
  if (input.source !== "supabase") {
    throw new Error("Adapter output source must be 'supabase'");
  }
  if (safeString(input.student?.id, 80) !== safeString(requestedStudentId, 80)) {
    throw new Error("Adapter output student.id does not match requested studentId");
  }
  if (!input.range?.from || !input.range?.to) {
    throw new Error("Adapter output range missing from/to");
  }
  if (!input.gaps || typeof input.gaps !== "object") {
    throw new Error("Adapter output gaps missing");
  }
  if (!input.totals || typeof input.totals !== "object") {
    throw new Error("Adapter output totals missing");
  }
  const fields = ["sessions", "completedSessions", "answers", "correct", "wrong", "accuracy", "durationSeconds"];
  for (const field of fields) {
    if (!Number.isFinite(Number(input.totals[field]))) {
      throw new Error(`Adapter output totals.${field} is not numeric`);
    }
  }
  if (Number.isNaN(Number(input.totals.accuracy))) {
    throw new Error("Adapter output totals.accuracy is NaN");
  }
  if (!input.subjects || typeof input.subjects !== "object") {
    throw new Error("Adapter output subjects missing");
  }
  for (const subject of REPORT_DB_SUBJECTS) {
    if (!input.subjects[subject]) {
      throw new Error(`Adapter output missing subject: ${subject}`);
    }
  }
  if (!Array.isArray(input.recentMistakes)) {
    throw new Error("Adapter output recentMistakes is not array");
  }
  if (input.recentMistakes.length > 20) {
    throw new Error("Adapter output recentMistakes exceeds cap (20)");
  }
}

async function main() {
  const cli = parseArgs(process.argv.slice(2));
  const baseUrl = safeString(cli.baseUrl || process.env.REPORT_API_BASE_URL || "http://localhost:3001", 400);
  const token = safeString(cli.token || process.env.REPORT_PARENT_BEARER_TOKEN, 4000);
  const studentId = safeString(cli.studentId || process.env.REPORT_STUDENT_ID, 80);
  const from = safeString(cli.from || process.env.REPORT_FROM, 10);
  const to = safeString(cli.to || process.env.REPORT_TO, 10);
  const period = safeString(cli.period || process.env.REPORT_PERIOD || "custom", 40);
  const timezone = safeString(cli.timezone || process.env.REPORT_TIMEZONE || "UTC", 80);

  ensureRequired("REPORT_PARENT_BEARER_TOKEN or --token", token);
  ensureRequired("REPORT_STUDENT_ID or --studentId", studentId);
  if (from && !isValidIsoDate(from)) {
    throw new Error("Invalid REPORT_FROM / --from. Expected YYYY-MM-DD");
  }
  if (to && !isValidIsoDate(to)) {
    throw new Error("Invalid REPORT_TO / --to. Expected YYYY-MM-DD");
  }

  const qs = new URLSearchParams();
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  const query = qs.toString();
  const url = `${baseUrl}/api/parent/students/${encodeURIComponent(studentId)}/report-data${query ? `?${query}` : ""}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok || body?.ok !== true) {
    throw new Error(`Report-data API request failed with status ${response.status}`);
  }

  const dbInput = buildReportInputFromDbData(body, {
    period,
    timezone,
    includeDebug: true,
  });
  validateAdapterOutput(dbInput, studentId);

  const subjectsWithData = REPORT_DB_SUBJECTS.filter(
    subject => safeNumber(dbInput.subjects?.[subject]?.total) > 0
  );

  const output = {
    ok: true,
    mode: "real-api",
    studentId: dbInput.student.id,
    range: dbInput.range,
    totals: {
      sessions: safeNumber(dbInput.totals.sessions),
      answers: safeNumber(dbInput.totals.answers),
      correct: safeNumber(dbInput.totals.correct),
      wrong: safeNumber(dbInput.totals.wrong),
      accuracy: safeNumber(dbInput.totals.accuracy),
    },
    subjectsWithData,
    allSubjectsPresent: REPORT_DB_SUBJECTS.every(subject => Boolean(dbInput.subjects?.[subject])),
    recentMistakesCount: Array.isArray(dbInput.recentMistakes) ? dbInput.recentMistakes.length : 0,
    gaps: dbInput.gaps,
    meta: {
      source: "verify-real-report-data-adapter",
      version: "phase-2d-c4.5",
      comparedAt: new Date().toISOString(),
    },
  };

  console.log(JSON.stringify(output, null, 2));
}

main().catch(error => {
  console.error(`FAIL: ${error.message}`);
  process.exitCode = 1;
});
