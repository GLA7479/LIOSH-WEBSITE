#!/usr/bin/env node
/**
 * Phase G — Parent AI feedback aggregation for human review only (no automatic learning).
 * Reads optional exported telemetry JSON or built-in synthetic fixture; writes summary reports.
 *
 * Usage:
 *   node scripts/parent-ai-feedback-aggregate.mjs
 *   node scripts/parent-ai-feedback-aggregate.mjs --fixture path/to/events.json
 * Env: PARENT_AI_TELEMETRY_JSON=/abs/path/to/export.json
 */

import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");

const DEFAULT_FIXTURE = join(REPO_ROOT, "scripts/fixtures/parent-ai-synthetic-telemetry-events.json");
const OPTIONAL_EXPORT = join(REPO_ROOT, "reports/parent-ai/telemetry-export.json");

export const REVIEW_BANNER = {
  reviewClass: "human_review_only",
  disclaimer:
    "This artifact is for human review only. It does not modify banks, taxonomies, diagnostics, planner output, or report text.",
  privacyNote:
    "No raw parent utterances are stored or repeated. Only utteranceLength and non-content metadata are used where present.",
};

/** Keys that must never appear in written report payloads (PII / content leakage). */
export const FORBIDDEN_REPORT_KEYS = new Set([
  "utterance",
  "utteranceText",
  "textHe",
  "answerBlocks",
  "playerName",
  "email",
  "phone",
  "rawQuestion",
]);

/**
 * @param {unknown} data
 * @returns {string[]}
 */
export function findForbiddenKeys(data, path = "") {
  /** @type {string[]} */
  const bad = [];
  if (data && typeof data === "object") {
    if (Array.isArray(data)) {
      data.forEach((x, i) => bad.push(...findForbiddenKeys(x, `${path}[${i}]`)));
    } else {
      for (const [k, v] of Object.entries(data)) {
        const p = path ? `${path}.${k}` : k;
        if (FORBIDDEN_REPORT_KEYS.has(k)) bad.push(p);
        bad.push(...findForbiddenKeys(v, p));
      }
    }
  }
  return bad;
}

/**
 * @param {unknown} raw
 * @returns {Array<Record<string, unknown>>}
 */
export function extractEventsArray(raw) {
  if (Array.isArray(raw)) return raw.filter((e) => e && typeof e === "object");
  if (raw && typeof raw === "object" && Array.isArray(raw.events)) {
    return raw.events.filter((e) => e && typeof e === "object");
  }
  return [];
}

/**
 * @param {string} fixturePath
 */
export function loadTelemetryEvents(fixturePath) {
  const p = String(fixturePath || "").trim();
  const pathToUse =
    p && existsSync(p)
      ? p
      : existsSync(OPTIONAL_EXPORT)
        ? OPTIONAL_EXPORT
        : DEFAULT_FIXTURE;
  const text = readFileSync(pathToUse, "utf8");
  const parsed = JSON.parse(text);
  return { events: extractEventsArray(parsed), sourcePath: pathToUse };
}

/**
 * @param {Array<Record<string, unknown>>} events
 */
export function aggregateParentAiFeedback(events) {
  const list = Array.isArray(events) ? events : [];
  const byIntent = {};
  const byResolution = {};
  const byGenerationPath = {};
  const byScopeType = {};
  let fallbackTurns = 0;
  /** @type {Record<string, number>} */
  const fallbackReasonCounts = {};
  /** @type {Record<string, number>} */
  const validatorFailCodeCounts = {};
  let validatorFailTurns = 0;
  let clarificationTurns = 0;
  /** @type {Record<string, number>} */
  const clarificationKeyCounts = {};
  /** @type {Record<string, number>} */
  const phaseERouteCounts = {};
  let externalPhaseE = 0;
  let practicePhaseE = 0;
  /** @type {Record<string, number>} */
  const utteranceLengthBuckets = { short: 0, medium: 0, long: 0 };

  for (const raw of list) {
    const e = raw && typeof raw === "object" ? raw : {};
    const intent = String(e.intent || "unknown");
    const res = String(e.resolutionStatus || "unknown");
    const gp = String(e.generationPath || "unknown");
    const st = e.scopeType == null ? "null" : String(e.scopeType);
    byIntent[intent] = (byIntent[intent] || 0) + 1;
    byResolution[res] = (byResolution[res] || 0) + 1;
    byGenerationPath[gp] = (byGenerationPath[gp] || 0) + 1;
    byScopeType[st] = (byScopeType[st] || 0) + 1;

    if (e.fallbackUsed) fallbackTurns += 1;
    const frc = Array.isArray(e.fallbackReasonCodes) ? e.fallbackReasonCodes : [];
    for (const c of frc) {
      const k = String(c || "").trim() || "(empty)";
      fallbackReasonCounts[k] = (fallbackReasonCounts[k] || 0) + 1;
    }

    const vfs = Array.isArray(e.validatorFailCodes) ? e.validatorFailCodes : [];
    if (vfs.length) validatorFailTurns += 1;
    for (const c of vfs) {
      const k = String(c || "").trim() || "(empty)";
      validatorFailCodeCounts[k] = (validatorFailCodeCounts[k] || 0) + 1;
    }

    const scopeReasonStr = String(e.scopeReason || "");

    if (res === "clarification_required") {
      clarificationTurns += 1;
      const ck = scopeReasonStr || "unknown_scope_reason";
      clarificationKeyCounts[ck] = (clarificationKeyCounts[ck] || 0) + 1;
    }

    if (scopeReasonStr.startsWith("phase_e:")) {
      phaseERouteCounts[scopeReasonStr] = (phaseERouteCounts[scopeReasonStr] || 0) + 1;
      if (
        scopeReasonStr.includes("external") ||
        scopeReasonStr.includes("resolved_external") ||
        scopeReasonStr.includes("general_education")
      )
        externalPhaseE += 1;
      if (scopeReasonStr.includes("practice")) practicePhaseE += 1;
    }

    const ul = Number(e.utteranceLength || 0);
    if (ul <= 48) utteranceLengthBuckets.short += 1;
    else if (ul <= 160) utteranceLengthBuckets.medium += 1;
    else utteranceLengthBuckets.long += 1;
  }

  const total = list.length;
  const uniqueSessions = new Set(list.map((e) => String(e.sessionId || ""))).size;

  /** Repeated clarification patterns (same scopeReason appearing >1). */
  const repeatedUnanswered = Object.entries(clarificationKeyCounts)
    .filter(([, n]) => n > 1)
    .map(([scopeReason, count]) => ({ scopeReason, count }))
    .sort((a, b) => b.count - a.count);

  return {
    meta: {
      ...REVIEW_BANNER,
      generatedAt: new Date().toISOString(),
      totalTurns: total,
      uniqueSessionCount: uniqueSessions,
    },
    turnsSummary: {
      totalTurns: total,
      uniqueSessionCount: uniqueSessions,
      byIntent,
      byResolutionStatus: byResolution,
      byGenerationPath,
      byScopeType,
      utteranceLengthBucketsOnly: utteranceLengthBuckets,
    },
    fallbacksSummary: {
      fallbackTurns,
      fallbackRate: total ? fallbackTurns / total : 0,
      byFallbackReasonCode: fallbackReasonCounts,
    },
    validatorFailures: {
      turnsWithValidatorFails: validatorFailTurns,
      rate: total ? validatorFailTurns / total : 0,
      byFailCode: validatorFailCodeCounts,
    },
    lowConfidenceAndUnresolved: {
      clarificationRequiredTurns: clarificationTurns,
      clarificationRate: total ? clarificationTurns / total : 0,
      validatorFailTurns,
      notes:
        "Persisted traces do not include numeric intent/score confidence; clarification and validator failure approximate 'unresolved / risky' turns.",
    },
    repeatedUnansweredTopics: {
      repeatedClarificationByScopeReason: repeatedUnanswered,
      notes:
        "Buckets use scopeReason only (no raw utterance). Topic labels are not recovered from telemetry.",
    },
    externalQuestionGaps: {
      phaseERouteCounts,
      estimatedExternalOrGeneralEducationTurns: externalPhaseE,
      notes:
        "phase_e:* scopeReason values indicate Phase E routing (external / catalog / practice). Review-only.",
    },
    practiceSuggestionsReview: {
      practicePhaseETurns: practicePhaseE,
      phaseERoutesTouchingPractice: Object.fromEntries(
        Object.entries(phaseERouteCounts).filter(([k]) => k.includes("practice")),
      ),
      notes: "Cross-check with reports/parent-ai/practice-suggestions/ manual queue if enabled in dev.",
    },
  };
}

/**
 * @param {string} dir
 * @param {string} baseName
 * @param {Record<string, unknown>} jsonPayload
 */
export function writeJsonMdPair(dir, baseName, jsonPayload) {
  mkdirSync(dir, { recursive: true });
  const safePayload = JSON.parse(JSON.stringify(jsonPayload));
  const forbidden = findForbiddenKeys(safePayload);
  if (forbidden.length) {
    throw new Error(`Refusing to write report: forbidden keys present: ${forbidden.join(", ")}`);
  }
  writeFileSync(join(dir, `${baseName}.json`), JSON.stringify(safePayload, null, 2), "utf8");
  writeFileSync(join(dir, `${baseName}.md`), renderMarkdown(baseName, safePayload), "utf8");
}

/**
 * @param {string} title
 * @param {Record<string, unknown>} payload
 */
function renderMarkdown(title, payload) {
  const lines = [];
  lines.push(`# ${title}`);
  lines.push("");
  lines.push("**Human review only — not an automatic change to the product.**");
  lines.push("");
  lines.push(REVIEW_BANNER.disclaimer);
  lines.push("");
  lines.push(`*${REVIEW_BANNER.privacyNote}*`);
  lines.push("");
  lines.push("```json");
  lines.push(JSON.stringify(payload, null, 2).slice(0, 12000));
  lines.push("```");
  lines.push("");
  return lines.join("\n");
}

/**
 * @param {{
 *   fixturePath?: string;
 *   feedbackDir?: string;
 *   improvementDir?: string;
 * }} opts
 */
export function runParentAiFeedbackAggregate(opts = {}) {
  const feedbackDir = opts.feedbackDir || join(REPO_ROOT, "reports/parent-ai/feedback");
  const improvementDir = opts.improvementDir || join(REPO_ROOT, "reports/parent-ai/improvement-suggestions");
  const { events, sourcePath } = loadTelemetryEvents(opts.fixturePath || "");

  const aggregated = aggregateParentAiFeedback(events);
  const envelope = {
    ...aggregated,
    input: {
      sourcePath,
      eventCount: events.length,
    },
  };

  writeJsonMdPair(feedbackDir, "turns-summary", { ...envelope.meta, ...aggregated.turnsSummary });
  writeJsonMdPair(feedbackDir, "fallbacks-summary", { ...envelope.meta, ...aggregated.fallbacksSummary });
  writeJsonMdPair(feedbackDir, "validator-failures", { ...envelope.meta, ...aggregated.validatorFailures });
  writeJsonMdPair(feedbackDir, "low-confidence", { ...envelope.meta, ...aggregated.lowConfidenceAndUnresolved });
  writeJsonMdPair(feedbackDir, "repeated-unanswered", { ...envelope.meta, ...aggregated.repeatedUnansweredTopics });
  writeJsonMdPair(improvementDir, "external-question-gaps", { ...envelope.meta, ...aggregated.externalQuestionGaps });
  writeJsonMdPair(improvementDir, "practice-suggestions-review", { ...envelope.meta, ...aggregated.practiceSuggestionsReview });

  writeFileSync(
    join(feedbackDir, "aggregate-run-meta.json"),
    JSON.stringify(
      {
        ...REVIEW_BANNER,
        generatedAt: envelope.meta.generatedAt,
        sourcePath,
        eventCount: events.length,
        outputs: [
          "turns-summary",
          "fallbacks-summary",
          "validator-failures",
          "low-confidence",
          "repeated-unanswered",
          "../improvement-suggestions/external-question-gaps",
          "../improvement-suggestions/practice-suggestions-review",
        ],
      },
      null,
      2,
    ),
    "utf8",
  );

  return { ok: true, sourcePath, feedbackDir, improvementDir, aggregated };
}

const argFixture = process.argv.find((a) => a.startsWith("--fixture="))
  ? process.argv.find((a) => a.startsWith("--fixture=")).split("=")[1]
  : process.argv.includes("--fixture")
    ? process.argv[process.argv.indexOf("--fixture") + 1]
    : "";

if (process.argv[1]?.includes("parent-ai-feedback-aggregate.mjs")) {
  try {
    const envFixture = process.env.PARENT_AI_TELEMETRY_JSON || "";
    const r = runParentAiFeedbackAggregate({ fixturePath: argFixture || envFixture });
    console.log(
      `parent-ai-feedback-aggregate: OK (${r.sourcePath} → ${r.feedbackDir} + ${r.improvementDir})`,
    );
    process.exit(0);
  } catch (e) {
    console.error("parent-ai-feedback-aggregate:", e?.message || e);
    process.exit(1);
  }
}
