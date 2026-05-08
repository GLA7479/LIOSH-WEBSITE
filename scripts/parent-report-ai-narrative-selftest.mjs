/**
 * Lightweight self-test for `utils/parent-report-ai-narrative/`.
 *
 * Exercises:
 *  - Deterministic fallback shape (no API key, no network).
 *  - Validator rejection of:
 *      * structurally invalid output
 *      * raw-English-key in textHe
 *      * sourceId not in availableStrengthSourceIds / availableFocusSourceIds
 *      * same sourceId in both strengths and focusAreas
 *      * thin-data caution missing when thinDataWarnings non-empty
 *      * absolute / unsupported claim language
 *  - Acceptance of well-formed AI output via injected `fetchImpl` (no real network).
 *
 * Run: `node scripts/parent-report-ai-narrative-selftest.mjs`
 */

import { buildParentReportInsightPacket } from "../utils/parent-report-insights/index.js";
import {
  buildParentReportAINarrative,
  buildDeterministicFallbackNarrative,
  validateNarrativeOutput,
} from "../utils/parent-report-ai-narrative/index.js";

const FIXED_NOW = "2026-05-08T18:00:00.000Z";

let failures = 0;
let runs = 0;
function check(name, predicate, details) {
  runs += 1;
  if (predicate) return;
  failures += 1;
  process.stderr.write(`FAIL ${name}${details ? ` :: ${JSON.stringify(details)}` : ""}\n`);
}

// ---- Fixture aggregates (smaller copies of the insights selftest) ----

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
    avgHintsPerQuestion: opts.hintsCount > 0 ? Number(((opts.hintsSum || 0) / opts.hintsCount).toFixed(2)) : null,
    avgTimePerQuestionSec: opts.timeMsCount > 0 ? Number(((opts.timeMsSum || 0) / opts.timeMsCount / 1000).toFixed(2)) : null,
    modeCounts: { unknown: 0, learning: opts.learningCount || 0, review: 0, drill: 0 },
    levelCounts: { unknown: 0, easy: 0, medium: opts.mediumCount || 0, hard: 0 },
  };
}

function buildAggregate(opts = {}) {
  const base = {
    ok: true,
    student: { id: "stu_1", full_name: "ילד דוגמה", grade_level: "g4", is_active: true },
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
      math: { ...emptySubject(),
        sessions: 3, answers: 30, correct: 27, wrong: 3, accuracy: 90, durationSeconds: 900,
        hintsSum: 15, hintsCount: 30, timeMsSum: 900000, timeMsCount: 30,
        avgHintsPerQuestion: 0.5, avgTimePerQuestionSec: 30,
        modeCounts: { unknown: 0, learning: 30, review: 0, drill: 0 },
        levelCounts: { unknown: 0, easy: 0, medium: 30, hard: 0 },
        topics: { multiplication: topic(30, 27, { hintsSum: 15, hintsCount: 30, timeMsSum: 900000, timeMsCount: 30 }) },
      },
      hebrew: { ...emptySubject(),
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
  if (opts.thin) {
    base.summary.totalAnswers = 4; base.summary.correctAnswers = 2; base.summary.wrongAnswers = 2;
    base.summary.accuracy = 50; base.summary.totalDurationSeconds = 240;
    base.subjects.math.answers = 4; base.subjects.math.correct = 2; base.subjects.math.wrong = 2; base.subjects.math.accuracy = 50;
    base.subjects.math.topics = { multiplication: topic(4, 2) };
    base.subjects.hebrew.answers = 0; base.subjects.hebrew.topics = {};
  }
  return base;
}

function strongPacket() {
  return buildParentReportInsightPacket({ aggregate: buildAggregate() }, { now: FIXED_NOW });
}

function thinPacket() {
  return buildParentReportInsightPacket({ aggregate: buildAggregate({ thin: true }) }, { now: FIXED_NOW });
}

// ---- Mocked fetch helpers ----

function mockFetch(payload, status = 200) {
  return async () => ({
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return payload;
    },
  });
}

function buildOpenAiResponseBody(content) {
  return {
    output_text: typeof content === "string" ? content : JSON.stringify(content),
  };
}

const TEST_ENV = {
  PARENT_REPORT_NARRATIVE_LLM_API_KEY: "test_key",
  PARENT_REPORT_NARRATIVE_LLM_ENABLED: "true",
};

// ---- Tests ----

async function testFallbackShapeMatchesValidator() {
  const packet = strongPacket();
  const fb = buildDeterministicFallbackNarrative(packet);
  check("fallback :: has all 5 fields",
    typeof fb.summary === "string" &&
    Array.isArray(fb.strengths) && Array.isArray(fb.focusAreas) &&
    Array.isArray(fb.homeTips) && typeof fb.cautionNote === "string");
  check("fallback :: passes own validator", validateNarrativeOutput(fb, packet).ok);
  check("fallback :: strengths each have textHe + sourceId",
    fb.strengths.every((s) => s.textHe && s.sourceId));
  check("fallback :: homeTips length 2-3", fb.homeTips.length >= 2 && fb.homeTips.length <= 3);

  const thin = thinPacket();
  const fbThin = buildDeterministicFallbackNarrative(thin);
  check("fallback :: thin packet produces non-empty cautionNote", fbThin.cautionNote.length > 0);
  check("fallback :: thin passes validator", validateNarrativeOutput(fbThin, thin).ok);
}

async function testWithoutKeyFallsBack() {
  const packet = strongPacket();
  const result = await buildParentReportAINarrative(packet, { env: {} });
  check("no_key :: result ok",
    result.ok === true && result.source === "deterministic_fallback");
  check("no_key :: structured present", result.structured && typeof result.structured.summary === "string");
}

async function testPreferDeterministicFallsBack() {
  const packet = strongPacket();
  const result = await buildParentReportAINarrative(packet, { env: TEST_ENV, preferDeterministicOnly: true });
  check("prefer_deterministic :: source is fallback", result.source === "deterministic_fallback");
}

async function testValidatorRejectsBadOutputs() {
  const packet = strongPacket();

  // Missing fields
  check("validator :: missing fields rejected",
    validateNarrativeOutput({ summary: "טקסט", strengths: [], focusAreas: [], homeTips: [] }, packet).ok === false);

  // homeTips count out of range
  check("validator :: homeTips count rejected",
    validateNarrativeOutput({
      summary: "טקסט בעברית.", strengths: [], focusAreas: [],
      homeTips: ["טיפ"], cautionNote: ""
    }, packet).ok === false);

  // Raw English key in textHe (mostly Hebrew so dominance passes; raw key embedded)
  const bad1 = {
    summary: "מהתרגול אפשר לראות תמונה כללית של הילד בתקופה זו.",
    strengths: [
      {
        textHe: "התרגול בנושא multiplication_table נראה מבוסס מאוד אצל הילד הזה כעת.",
        sourceId: packet.availableStrengthSourceIds[0] || "subject:math",
      },
    ],
    focusAreas: [],
    homeTips: ["לתרגל בבית בעדינות.", "לעודד שיח רגוע סביב למידה."],
    cautionNote: "",
  };
  const r1 = validateNarrativeOutput(bad1, packet);
  check("validator :: raw English key rejected", r1.ok === false && r1.reason === "raw_english_key_in_text", r1);

  // sourceId not grounded
  const bad2 = {
    summary: "מהתרגול אפשר לראות תמונה כללית בתקופה זו.",
    strengths: [{ textHe: "המקצוע יציב מאוד", sourceId: "subject:imaginary" }],
    focusAreas: [],
    homeTips: ["לתרגל קצת בכל יום.", "לעודד שיח רגוע."],
    cautionNote: "",
  };
  const r2 = validateNarrativeOutput(bad2, packet);
  check("validator :: ungrounded sourceId rejected",
    r2.ok === false && r2.reason === "contradiction_strength_source_id_not_grounded", r2);

  // Same sourceId in both lists
  const sId = packet.availableStrengthSourceIds[0] || "subject:math";
  // Force focus side to also include this id (rare test path)
  const packetForOverlap = { ...packet, availableFocusSourceIds: [sId, ...(packet.availableFocusSourceIds || [])] };
  const bad3 = {
    summary: "מהתרגול ניתן לראות תמונה ראשונית בתקופה זו.",
    strengths: [{ textHe: "התרגול יציב באופן עקבי", sourceId: sId }],
    focusAreas: [{ textHe: "כדאי להמשיך לחזק בעדינות", sourceId: sId }],
    homeTips: ["שגרת תרגול קצרה.", "שיח רגוע על למידה."],
    cautionNote: "",
  };
  const r3 = validateNarrativeOutput(bad3, packetForOverlap);
  check("validator :: same sourceId in both lists rejected",
    r3.ok === false && r3.reason === "contradiction_source_id_in_both_lists", r3);

  // Thin data without caution
  const thin = thinPacket();
  const bad4 = {
    summary: "מהתרגול ניתן לראות תמונה.",
    strengths: [], focusAreas: [],
    homeTips: ["לתרגל בבית קצת.", "לעודד שיח רגוע."],
    cautionNote: "",
  };
  const r4 = validateNarrativeOutput(bad4, thin);
  check("validator :: thin data missing caution rejected",
    r4.ok === false && r4.reason === "thin_data_missing_caution_note", r4);

  // Absolute claim
  const bad5 = {
    summary: "תמיד הילד מצליח בכל תרגול בלי בעיה.",
    strengths: [], focusAreas: [],
    homeTips: ["לתרגל בבית.", "לעודד שיח רגוע."],
    cautionNote: "",
  };
  const r5 = validateNarrativeOutput(bad5, packet);
  check("validator :: absolute claim rejected",
    r5.ok === false && r5.reason === "absolute_unsupported_claim", r5);
}

async function testValidAiOutputAccepted() {
  const packet = strongPacket();
  const wellFormed = {
    summary: "מהתרגול בתקופה הזו ניתן לראות תמונה יציבה ומעודדת — ילד דוגמה התקדם בקצב טוב.",
    strengths: packet.strengths.slice(0, 2).map((s) => ({
      textHe: `התרגול ב${s.displayNameHe} נראה יציב ומבוסס.`,
      sourceId: s.sourceId,
    })),
    focusAreas: [],
    homeTips: [
      "לקבוע זמן קצר וקבוע בבית לתרגול שגרתי.",
      "לעודד שיח רגוע על מה הצליח, ולא רק על תוצאה.",
      "להמשיך לעקוב לאורך זמן לפני הסקת מסקנות חזקות.",
    ],
    cautionNote: "",
  };
  const result = validateNarrativeOutput(wellFormed, packet);
  check("validator :: well-formed AI output accepted", result.ok === true, result);

  const fetchImpl = mockFetch(buildOpenAiResponseBody(wellFormed));
  const e2e = await buildParentReportAINarrative(packet, { env: TEST_ENV, fetchImpl });
  check("e2e :: source ai when LLM returns valid output", e2e.source === "ai", { source: e2e.source, reason: e2e.reason });
  check("e2e :: structured.summary preserved",
    typeof e2e.structured?.summary === "string" && e2e.structured.summary.length > 0);
}

async function testInvalidAiOutputFallsBack() {
  const packet = strongPacket();
  const badPayload = {
    summary: "תמיד הילד מצליח.",
    strengths: [],
    focusAreas: [],
    homeTips: ["לתרגל.", "לעודד."],
    cautionNote: "",
  };
  const fetchImpl = mockFetch(buildOpenAiResponseBody(badPayload));
  const result = await buildParentReportAINarrative(packet, { env: TEST_ENV, fetchImpl });
  check("e2e :: invalid output falls back",
    result.ok === true && result.source === "deterministic_fallback",
    { source: result.source, reason: result.reason });
}

async function testHttpErrorFallsBack() {
  const packet = strongPacket();
  const fetchImpl = mockFetch({}, 500);
  const result = await buildParentReportAINarrative(packet, { env: TEST_ENV, fetchImpl });
  check("e2e :: http_500 falls back to deterministic",
    result.source === "deterministic_fallback" && /llm_call_failed/.test(result.reason));
}

async function run() {
  await testFallbackShapeMatchesValidator();
  await testWithoutKeyFallsBack();
  await testPreferDeterministicFallsBack();
  await testValidatorRejectsBadOutputs();
  await testValidAiOutputAccepted();
  await testInvalidAiOutputFallsBack();
  await testHttpErrorFallsBack();
  process.stdout.write(`\nparent-report-ai-narrative selftest :: ${runs - failures}/${runs} passed\n`);
  if (failures > 0) process.exit(1);
}

run().catch((err) => {
  process.stderr.write(`UNEXPECTED ERROR: ${err?.stack || err}\n`);
  process.exit(2);
});
