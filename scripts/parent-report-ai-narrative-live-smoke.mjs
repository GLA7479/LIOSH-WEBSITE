/**
 * Live smoke test for the parent-report AI narrative writer.
 *
 * Purpose:
 *   Verify the configured live LLM provider/model produces a structured narrative
 *   that passes our validator (Insight Packet → prompt → LLM → validate).
 *   Touches NO Supabase data and NO production user data.
 *
 * Required env (you must set these explicitly; the script refuses to call the LLM otherwise):
 *   PARENT_REPORT_NARRATIVE_LLM_PROVIDER=gemini
 *   PARENT_REPORT_NARRATIVE_LLM_MODEL=gemini-2.5-flash
 *   PARENT_REPORT_NARRATIVE_LLM_ENABLED=true
 *   GEMINI_API_KEY=...           (or PARENT_REPORT_NARRATIVE_LLM_API_KEY=...)
 *
 * Optional: PARENT_REPORT_NARRATIVE_LLM_BASE_URL, PARENT_REPORT_NARRATIVE_LLM_TIMEOUT_MS.
 *
 * Output:
 *   - Per-fixture line: provider/model, source (ai|deterministic_fallback), reason,
 *     summary preview, list lengths, caution preview.
 *   - Disk dump:        reports/parent-ai-narrative-live-smoke/<ISO>.json
 *   - Exit code:        0 only if every fixture returned source === "ai".
 *                       Non-zero if any fixture fell to deterministic_fallback OR threw.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildParentReportInsightPacket } from "../utils/parent-report-insights/index.js";
import {
  buildParentReportAINarrative,
  validateNarrativeOutput,
} from "../utils/parent-report-ai-narrative/index.js";
import { callNarrativeLlm } from "../utils/parent-report-ai-narrative/llm-client.js";

const FIXED_NOW = "2026-05-08T18:00:00.000Z";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPORT_ROOT = join(__dirname, "..", "reports", "parent-ai-narrative-live-smoke");

// ---------- Fixture builders (no DB; same shape as mocked self-test) ----------

function emptySubject() {
  return {
    sessions: 0, answers: 0, correct: 0, wrong: 0, accuracy: 0, durationSeconds: 0,
    hintsSum: 0, hintsCount: 0, timeMsSum: 0, timeMsCount: 0,
    correctSlowAnswers: 0, correctManyHintsAnswers: 0, wrongFastAnswers: 0,
    avgHintsPerQuestion: null, avgTimePerQuestionSec: null,
    modeCounts: { unknown: 0, learning: 0, review: 0, drill: 0 },
    levelCounts: { unknown: 0, easy: 0, medium: 0, hard: 0 },
    topics: {},
  };
}

function topic(answers, correct, opts = {}) {
  const wrong = Math.max(0, answers - correct);
  return {
    answers, correct, wrong,
    accuracy: answers > 0 ? Number(((correct / answers) * 100).toFixed(2)) : 0,
    durationSeconds: opts.durationSeconds || 0,
    hintsSum: opts.hintsSum || 0, hintsCount: opts.hintsCount || 0,
    timeMsSum: opts.timeMsSum || 0, timeMsCount: opts.timeMsCount || 0,
    correctSlowAnswers: opts.correctSlowAnswers || 0,
    correctManyHintsAnswers: opts.correctManyHintsAnswers || 0,
    wrongFastAnswers: opts.wrongFastAnswers || 0,
    avgHintsPerQuestion:
      (opts.hintsCount || 0) > 0
        ? Number(((opts.hintsSum || 0) / opts.hintsCount).toFixed(2))
        : null,
    avgTimePerQuestionSec:
      (opts.timeMsCount || 0) > 0
        ? Number(((opts.timeMsSum || 0) / opts.timeMsCount / 1000).toFixed(2))
        : null,
    modeCounts: { unknown: 0, learning: opts.learningCount || 0, review: 0, drill: 0 },
    levelCounts: { unknown: 0, easy: 0, medium: opts.mediumCount || 0, hard: 0 },
  };
}

function strongAggregate() {
  return {
    ok: true,
    student: { id: "smoke_strong", full_name: "ילד דוגמה", grade_level: "g4", is_active: true },
    range: { from: "2026-05-01", to: "2026-05-08" },
    summary: {
      totalSessions: 6, completedSessions: 6,
      totalAnswers: 60, correctAnswers: 54, wrongAnswers: 6,
      accuracy: 90, totalDurationSeconds: 1800,
      avgHintsPerQuestion: 0.5, avgTimePerQuestionSec: 30,
      modeCounts: { unknown: 0, learning: 60, review: 0, drill: 0 },
      levelCounts: { unknown: 0, easy: 0, medium: 60, hard: 0 },
      normalizedGradeLevel: "g4",
    },
    subjects: {
      math: {
        ...emptySubject(),
        sessions: 3, answers: 30, correct: 27, wrong: 3, accuracy: 90, durationSeconds: 900,
        hintsSum: 15, hintsCount: 30, timeMsSum: 900000, timeMsCount: 30,
        avgHintsPerQuestion: 0.5, avgTimePerQuestionSec: 30,
        modeCounts: { unknown: 0, learning: 30, review: 0, drill: 0 },
        levelCounts: { unknown: 0, easy: 0, medium: 30, hard: 0 },
        topics: { multiplication: topic(30, 27, { hintsSum: 15, hintsCount: 30, timeMsSum: 900000, timeMsCount: 30 }) },
      },
      hebrew: {
        ...emptySubject(),
        sessions: 3, answers: 30, correct: 27, wrong: 3, accuracy: 90, durationSeconds: 900,
        topics: { comprehension: topic(30, 27, { hintsSum: 15, hintsCount: 30, timeMsSum: 900000, timeMsCount: 30 }) },
      },
      geometry: emptySubject(),
      english: emptySubject(),
      science: emptySubject(),
      moledet_geography: emptySubject(),
    },
    dailyActivity: [],
    recentMistakes: [],
    meta: {
      source: "supabase", version: "phase-2d-c2", insightsVersion: "2026.05-insights",
      fallbackUsed: false, sessionDateField: "started_at", answerDateField: "answered_at",
      fluencyThresholds: { slowMs: 60000, fastMs: 6000, manyHints: 3 },
    },
  };
}

function thinAggregate() {
  const a = strongAggregate();
  a.student = { id: "smoke_thin", full_name: "ילדה דוגמה", grade_level: "g3", is_active: true };
  a.summary.totalAnswers = 4;
  a.summary.correctAnswers = 2;
  a.summary.wrongAnswers = 2;
  a.summary.accuracy = 50;
  a.summary.totalDurationSeconds = 240;
  a.subjects.math.answers = 4; a.subjects.math.correct = 2; a.subjects.math.wrong = 2; a.subjects.math.accuracy = 50;
  a.subjects.math.topics = { multiplication: topic(4, 2) };
  a.subjects.hebrew.answers = 0; a.subjects.hebrew.topics = {};
  return a;
}

function mixedAggregate() {
  const a = strongAggregate();
  a.student = { id: "smoke_mixed", full_name: "תלמיד מעורב", grade_level: "g5", is_active: true };
  // weak math, strong hebrew
  a.summary.totalAnswers = 50;
  a.summary.correctAnswers = 30;
  a.summary.wrongAnswers = 20;
  a.summary.accuracy = 60;
  a.subjects.math = {
    ...emptySubject(),
    sessions: 3, answers: 25, correct: 12, wrong: 13, accuracy: 48, durationSeconds: 800,
    hintsSum: 40, hintsCount: 25, timeMsSum: 1500000, timeMsCount: 25,
    avgHintsPerQuestion: 1.6, avgTimePerQuestionSec: 60,
    correctSlowAnswers: 4, correctManyHintsAnswers: 6, wrongFastAnswers: 2,
    modeCounts: { unknown: 0, learning: 25, review: 0, drill: 0 },
    levelCounts: { unknown: 0, easy: 0, medium: 25, hard: 0 },
    topics: { multiplication: topic(25, 12, { hintsSum: 40, hintsCount: 25, timeMsSum: 1500000, timeMsCount: 25, correctSlowAnswers: 4, correctManyHintsAnswers: 6, wrongFastAnswers: 2 }) },
  };
  a.subjects.hebrew = {
    ...emptySubject(),
    sessions: 3, answers: 25, correct: 23, wrong: 2, accuracy: 92, durationSeconds: 700,
    hintsSum: 5, hintsCount: 25, timeMsSum: 600000, timeMsCount: 25,
    avgHintsPerQuestion: 0.2, avgTimePerQuestionSec: 24,
    modeCounts: { unknown: 0, learning: 25, review: 0, drill: 0 },
    levelCounts: { unknown: 0, easy: 0, medium: 25, hard: 0 },
    topics: { comprehension: topic(25, 23, { hintsSum: 5, hintsCount: 25, timeMsSum: 600000, timeMsCount: 25 }) },
  };
  return a;
}

// ---------- Helpers ----------

function previewText(text, limit = 120) {
  const s = String(text || "").trim();
  if (!s) return "";
  if (s.length <= limit) return s;
  return s.slice(0, limit) + "…";
}

function summarizeStructured(structured) {
  if (!structured || typeof structured !== "object") return null;
  return {
    summaryPreview: previewText(structured.summary),
    strengthsCount: Array.isArray(structured.strengths) ? structured.strengths.length : 0,
    focusAreasCount: Array.isArray(structured.focusAreas) ? structured.focusAreas.length : 0,
    homeTipsCount: Array.isArray(structured.homeTips) ? structured.homeTips.length : 0,
    cautionPreview: previewText(structured.cautionNote, 80),
  };
}

async function ensureDir(path) {
  await mkdir(path, { recursive: true });
}

// ---------- Main ----------

async function main() {
  const env = process.env;
  const provider =
    String(env.PARENT_REPORT_NARRATIVE_LLM_PROVIDER || "openai").trim().toLowerCase();
  const model =
    String(env.PARENT_REPORT_NARRATIVE_LLM_MODEL || (provider === "gemini" ? "gemini-2.5-flash" : "gpt-4.1-mini")).trim();
  const enabled = String(env.PARENT_REPORT_NARRATIVE_LLM_ENABLED || "").toLowerCase() === "true";
  const apiKeyResolvable = Boolean(
    env.PARENT_REPORT_NARRATIVE_LLM_API_KEY ||
      (provider === "gemini" ? env.GEMINI_API_KEY || env.GOOGLE_API_KEY : env.OPENAI_API_KEY)
  );

  process.stdout.write("\n=== parent-report-ai-narrative :: live smoke ===\n");
  process.stdout.write(`provider:           ${provider}\n`);
  process.stdout.write(`model:              ${model}\n`);
  process.stdout.write(`LLM_ENABLED:        ${enabled}\n`);
  process.stdout.write(`api_key_resolvable: ${apiKeyResolvable}\n\n`);

  if (!enabled || !apiKeyResolvable) {
    process.stderr.write(
      "Refusing to run live smoke: PARENT_REPORT_NARRATIVE_LLM_ENABLED must be 'true' AND an API key must be set.\n" +
        "For Gemini set: GEMINI_API_KEY=... (or PARENT_REPORT_NARRATIVE_LLM_API_KEY=...).\n"
    );
    process.exit(1);
  }

  // ---- Diagnostic ping: surface the raw HTTP error if the provider rejects requests. ----
  process.stdout.write("--- diagnostic ping ---\n");
  try {
    const ping = await callNarrativeLlm({
      env,
      prompt:
        'Return ONLY this exact JSON, nothing else: {"summary":"שלום","strengths":[],"focus_areas":[],"home_tips":["א","ב"],"caution_note":""}',
    });
    if (ping.ok) {
      const rawPreview = previewText(ping.raw, 240);
      process.stdout.write(`ping ok=true raw_preview=${rawPreview}\n\n`);
    } else {
      process.stdout.write(`ping ok=false reason=${ping.reason}\n`);
      if (ping.httpErrorBody) {
        process.stdout.write(`ping httpErrorBody (first 800 chars):\n${ping.httpErrorBody}\n`);
      }
      process.stdout.write("\n");
    }
  } catch (err) {
    process.stdout.write(`ping THREW: ${err?.stack || String(err)}\n\n`);
  }

  const fixtures = [
    { id: "strong_g4", aggregate: strongAggregate() },
    { id: "thin_g3",   aggregate: thinAggregate() },
    { id: "mixed_g5",  aggregate: mixedAggregate() },
  ];

  await ensureDir(REPORT_ROOT);
  const startedAt = new Date().toISOString().replace(/[:.]/g, "-");
  const outFile = join(REPORT_ROOT, `${startedAt}.json`);

  const results = [];
  let okAi = 0;

  for (const fx of fixtures) {
    const packet = buildParentReportInsightPacket({ aggregate: fx.aggregate }, { now: FIXED_NOW });

    const t0 = Date.now();
    let result;
    let threw = null;
    try {
      result = await buildParentReportAINarrative(packet, { env });
    } catch (err) {
      threw = err?.stack || String(err);
    }
    const elapsedMs = Date.now() - t0;

    if (threw) {
      process.stderr.write(`[${fx.id}] THREW: ${threw}\n`);
      results.push({ id: fx.id, threw, elapsedMs });
      continue;
    }

    const validation = validateNarrativeOutput(result.structured, packet);
    const summary = summarizeStructured(result.structured);

    if (result.source === "ai") okAi += 1;

    process.stdout.write(`[${fx.id}] source=${result.source} reason=${result.reason || "-"} elapsed=${elapsedMs}ms\n`);
    if (summary) {
      process.stdout.write(`         summary:   ${summary.summaryPreview}\n`);
      process.stdout.write(`         counts:    strengths=${summary.strengthsCount} focus=${summary.focusAreasCount} tips=${summary.homeTipsCount}\n`);
      if (summary.cautionPreview) {
        process.stdout.write(`         caution:   ${summary.cautionPreview}\n`);
      }
    }
    process.stdout.write(`         validate:  ok=${validation.ok}${validation.ok ? "" : ` reason=${validation.reason}`}\n`);
    if (result._diag) {
      const d = result._diag;
      process.stdout.write(`         diag:      stage=${d.stage} reason=${d.reason || "-"}\n`);
      if (d.httpErrorBody) {
        process.stdout.write(`         httpErr:   ${previewText(d.httpErrorBody, 240)}\n`);
      }
      if (d.raw) {
        process.stdout.write(`         raw_LLM:   ${previewText(d.raw, 240)}\n`);
      }
    }
    process.stdout.write("\n");

    results.push({
      id: fx.id,
      packetMeta: {
        totalQuestions: packet?.overall?.totalQuestions ?? 0,
        accuracyBand: packet?.overall?.accuracyBand ?? null,
        dataConfidence: packet?.overall?.dataConfidence ?? null,
        thinDataWarnings: packet?.thinDataWarnings || [],
      },
      result: {
        source: result.source,
        reason: result.reason,
        elapsedMs,
        structured: result.structured,
        diag: result._diag || null,
      },
      validation: { ok: validation.ok, reason: validation.reason || null },
    });
  }

  const dump = {
    startedAt,
    provider,
    model,
    fixtureCount: fixtures.length,
    okAi,
    results,
  };

  await writeFile(outFile, JSON.stringify(dump, null, 2), "utf8");
  process.stdout.write(`Dump written to: ${outFile}\n`);

  if (okAi !== fixtures.length) {
    process.stderr.write(
      `\nFAIL: ${okAi}/${fixtures.length} fixtures reached source="ai". The rest fell to deterministic_fallback.\n` +
        `      See the per-fixture "reason" lines above and the JSON dump for details.\n`
    );
    process.exit(1);
  }

  process.stdout.write(`\nPASS: ${okAi}/${fixtures.length} fixtures returned source="ai" with validator ok.\n`);
}

main().catch((err) => {
  process.stderr.write(`UNEXPECTED ERROR: ${err?.stack || err}\n`);
  process.exit(2);
});
