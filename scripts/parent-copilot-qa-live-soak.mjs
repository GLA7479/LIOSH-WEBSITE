/**
 * Parent Copilot live QA soak — batched / resume over many turns (Gemini + OpenRouter + deterministic).
 *
 * Usage:
 *   npm run qa:parent-copilot:live-soak
 *   npm run qa:parent-copilot:live-soak-fast
 *   npm run qa:parent-copilot:live-soak-status
 *
 * Progress:
 *   reports/parent-copilot-qa-live-soak/<runId>/state.json
 *   reports/parent-copilot-qa-live-soak/latest-run.txt
 *
 * Exit 0: batch finished without **product** QA failures; auto mode also exits 0 when
 *   target completed, max batches reached, or max provider stops — state saved.
 * Exit 1: product QA failures accumulated, or crash.
 *
 * Auto loop: `--auto --pause-between-batches-ms 300000 --max-batches 12`
 *
 * Resume: `--resume` continues latest unless it is **complete** or **shorter than `--target-turns`**
 * (then starts a new run). Force new plan: `--new` / `--fresh`.
 */

import { mkdirSync, writeFileSync, existsSync, readFileSync, copyFileSync } from "fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  loadEnvLocalBestEffort,
  sleepMs,
  buildScenarios,
  buildStressLiveMatrix,
  extractRecord,
  validateTurn,
  configureEnvLive,
  turnShowsRateLimitOrOverload,
  minimalDiagnosticPayload,
} from "./parent-copilot-qa-mass-simulation.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SOAK_ROOT = path.join(ROOT, "reports", "parent-copilot-qa-live-soak");
const LATEST_RUN_FILE = path.join(SOAK_ROOT, "latest-run.txt");
const LATEST_MD = path.join(SOAK_ROOT, "latest.md");

const MAX_CONSEC_PROVIDER_SIGNALS = 4;

/** After provider-induced batch abort in --auto: random wait between these (ms). */
const PROVIDER_COOLDOWN_MIN_MS = 10 * 60 * 1000;
const PROVIDER_COOLDOWN_MAX_MS = 20 * 60 * 1000;

function randomProviderCooldownMs() {
  return (
    PROVIDER_COOLDOWN_MIN_MS +
    Math.floor(Math.random() * (PROVIDER_COOLDOWN_MAX_MS - PROVIDER_COOLDOWN_MIN_MS + 1))
  );
}

function isoNow() {
  return new Date().toISOString();
}

function parseSoakArgs(argv) {
  const rest = argv.slice(2);
  let statusOnly = false;
  let targetTurns = 120;
  let batchSize = 10;
  let delayMs = 20000;
  let resume = false;
  /** @type {string|null} */
  let runIdArg = null;
  let includeFallbackStress = false;
  let fallbackStressEvery = 10;
  let auto = false;
  let pauseBetweenBatchesMs = 300000;
  /** @type {number} */
  let maxBatches = Number.POSITIVE_INFINITY;
  let maxProviderStops = 32;
  let fresh = false;
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === "--status") statusOnly = true;
    else if (a === "--resume") resume = true;
    else if (a === "--new" || a === "--fresh") fresh = true;
    else if (a === "--auto") auto = true;
    else if (a === "--include-fallback-stress") includeFallbackStress = true;
    else if (a === "--target-turns") {
      const n = Number(rest[++i]);
      if (Number.isFinite(n) && n > 0) targetTurns = Math.floor(n);
    } else if (a === "--batch-size") {
      const n = Number(rest[++i]);
      if (Number.isFinite(n) && n > 0) batchSize = Math.floor(n);
    } else if (a === "--delay-ms") {
      const n = Number(rest[++i]);
      if (Number.isFinite(n) && n >= 0) delayMs = n;
    } else if (a === "--run-id") runIdArg = rest[++i] != null ? String(rest[i]).trim() : null;
    else if (a === "--fallback-stress-every") {
      const n = Number(rest[++i]);
      if (Number.isFinite(n) && n > 0) fallbackStressEvery = Math.floor(n);
    } else if (a === "--pause-between-batches-ms") {
      const n = Number(rest[++i]);
      if (Number.isFinite(n) && n >= 0) pauseBetweenBatchesMs = Math.floor(n);
    } else if (a === "--max-batches") {
      const n = Number(rest[++i]);
      if (Number.isFinite(n) && n > 0) maxBatches = Math.floor(n);
    } else if (a === "--max-provider-stops") {
      const n = Number(rest[++i]);
      if (Number.isFinite(n) && n > 0) maxProviderStops = Math.floor(n);
    }
  }
  const envBatch = Number(process.env.PARENT_COPILOT_SOAK_BATCH_SIZE);
  if (Number.isFinite(envBatch) && envBatch > 0) batchSize = Math.floor(envBatch);
  const envDelay = Number(process.env.PARENT_COPILOT_SOAK_DELAY_MS);
  if (Number.isFinite(envDelay) && envDelay >= 0) delayMs = envDelay;
  const envTarget = Number(process.env.PARENT_COPILOT_SOAK_TARGET_TURNS);
  if (Number.isFinite(envTarget) && envTarget > 0) targetTurns = Math.floor(envTarget);

  return {
    statusOnly,
    targetTurns,
    batchSize,
    delayMs,
    resume,
    runIdArg,
    includeFallbackStress,
    fallbackStressEvery,
    auto,
    pauseBetweenBatchesMs,
    maxBatches,
    maxProviderStops,
    fresh,
  };
}

/**
 * When `--resume` follows latest-run.txt, skip loading if that run is done or cannot satisfy the requested soak size.
 * @param {object|null} state
 * @param {number} requestedTargetTurns
 */
function shouldStartFreshInsteadOfResume(state, requestedTargetTurns) {
  if (!state || !Array.isArray(state.plan) || state.plan.length === 0) return true;
  const planLen = state.plan.length;
  const idx = Number(state.currentPlanIndex ?? 0);
  if (idx >= planLen) return true;

  const storedTarget = Number(state.targetTurns ?? planLen);
  const completed = Number(state.completedTurns ?? 0);

  if (
    requestedTargetTurns > storedTarget &&
    completed >= storedTarget &&
    idx >= Math.min(storedTarget, planLen)
  ) {
    return true;
  }
  return false;
}

function resolveRunDir(runId) {
  return path.join(SOAK_ROOT, runId);
}

function readLatestRunDir() {
  if (!existsSync(LATEST_RUN_FILE)) return null;
  const raw = readFileSync(LATEST_RUN_FILE, "utf8").trim();
  return raw || null;
}

/**
 * @param {unknown} res
 */
function extractRetryAfterSeconds(res) {
  const t = res?.telemetry?.llmAttempt;
  const body = typeof t?.geminiErrorBody === "string" ? t.geminiErrorBody : "";
  const summary = typeof t?.geminiErrorSummary === "string" ? t.geminiErrorSummary : "";
  const s = `${body}\n${summary}`;
  const m =
    s.match(/retry[^\d]{0,48}(\d+)\s*(?:s|sec|seconds)?/iu) ||
    s.match(/Retry-After[:\s]+(\d+)/iu) ||
    s.match(/retry\s*after[:\s]+(\d+)/iu);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

/**
 * Provider-side category for telemetry (not a product defect).
 * @param {unknown} res
 * @returns {string|null}
 */
function categorizeProviderFailure(res) {
  const t = res?.telemetry?.llmAttempt;
  if (!t || typeof t !== "object") return null;
  const ok = t.ok === true;
  const gen = String(res?.telemetry?.generationPath || "");
  if (ok && gen === "llm_grounded") return null;

  const hs = Number(t.httpStatus);
  const pr = String(t.primaryReason || "");
  const fr = String(t.fallbackReason || "");
  const reason = String(t.reason || "");
  const blob = `${reason} ${pr} ${fr}`;

  if (hs === 429 || pr === "http_429" || fr === "http_429") return "provider_429";
  if (/timeout|ETIMEDOUT|ECONNRESET|timed\s*out|deadline/i.test(blob)) return "provider_timeout";
  if (
    (Number.isFinite(hs) && hs >= 502 && hs <= 504) ||
    hs === 529 ||
    /overload|unavailable|503|529/i.test(blob)
  ) {
    return "provider_overload";
  }
  if (/llm_fallback_exhausted|exhausted_candidates|all_fallback/i.test(blob)) return "all_fallback_models_failed";
  return null;
}

/**
 * @param {ReturnType<typeof extractRecord>} record
 */
function bucketGenerationPath(record) {
  const gen = String(record.generationPath || "");
  const det = record.llmAttemptDetail || {};
  const finalProvider = String(det.finalProvider || "");
  const fp = finalProvider.toLowerCase();

  if (gen === "deterministic") return "deterministic";
  if (gen !== "llm_grounded") return "other";

  if (fp.includes("gemini") || fp.includes("google")) return "gemini_llm_grounded";
  if (finalProvider.includes("/")) return "openrouter_llm_grounded";
  const pr = String(det.primaryReason || "");
  const fr = String(det.fallbackReason || "");
  if (fr === "ok" && pr !== "ok" && pr) return "openrouter_llm_grounded";
  return "gemini_llm_grounded";
}

function applyPathBucket(state, bucket) {
  const c = state.pathBuckets || { gemini: 0, openrouter: 0, deterministic: 0, other: 0 };
  if (bucket === "gemini_llm_grounded") c.gemini += 1;
  else if (bucket === "openrouter_llm_grounded") c.openrouter += 1;
  else if (bucket === "deterministic") c.deterministic += 1;
  else c.other += 1;
  state.pathBuckets = c;
}

function printStatus() {
  const dir = readLatestRunDir();
  if (!dir || !existsSync(dir)) {
    process.stdout.write("No soak run found (missing latest-run.txt or directory).\n");
    process.exitCode = 0;
    return;
  }
  const statePath = path.join(dir, "state.json");
  if (!existsSync(statePath)) {
    process.stdout.write(`Run dir exists but no state.json: ${dir}\n`);
    process.exitCode = 0;
    return;
  }
  const st = JSON.parse(readFileSync(statePath, "utf8"));
  const pct =
    st.targetTurns > 0 ? Math.round((100 * (st.completedTurns || 0)) / st.targetTurns) : 0;
  process.stdout.write(`runId: ${st.runId}\n`);
  process.stdout.write(`completedTurns: ${st.completedTurns} / ${st.targetTurns} (${pct}%)\n`);
  process.stdout.write(`passed: ${st.passed}, failed (product): ${st.failed}\n`);
  process.stdout.write(`next plan index: ${st.currentPlanIndex}\n`);
  process.stdout.write(`providerFailureStreak: ${st.providerFailureStreak ?? 0}\n`);
  process.stdout.write(`aborted batches: ${(st.abortedBatches || []).length}\n`);
  process.stdout.write(`directory: ${dir}\n`);
  process.stdout.write(`Continue: npm run qa:parent-copilot:live-soak\n`);
  process.exitCode = 0;
}

function writeLatestPointers(runDir, runId) {
  mkdirSync(SOAK_ROOT, { recursive: true });
  writeFileSync(LATEST_RUN_FILE, `${runDir}\n`, "utf8");
  writeFileSync(
    path.join(SOAK_ROOT, "latest-run-id.txt"),
    `${runId}\n`,
    "utf8",
  );
}

function summarizeProviderFailures(state) {
  const turns = state.turns || [];
  let n = 0;
  for (const t of turns) {
    if (t.providerCategory) n += 1;
  }
  return n;
}

function buildSummaryMarkdown(state, batchMeta) {
  const pct =
    state.targetTurns > 0 ? Math.round((100 * (state.completedTurns || 0)) / state.targetTurns) : 0;
  const pb = state.pathBuckets || {};
  const aborted = state.abortedBatches || [];
  const npmContinue = `npm run qa:parent-copilot:live-soak`;

  let md = `# Parent Copilot live QA soak\n\n`;
  md += `- **runId:** ${state.runId}\n`;
  md += `- **targetTurns:** ${state.targetTurns}\n`;
  md += `- **completedTurns:** ${state.completedTurns}\n`;
  md += `- **Progress:** ${pct}%\n`;
  md += `- **passed (product):** ${state.passed}\n`;
  md += `- **failed (product):** ${state.failed}\n`;
  md += `- **Provider-classified turns:** ${summarizeProviderFailures(state)}\n`;
  md += `- **Gemini llm_grounded (bucket):** ${pb.gemini ?? 0}\n`;
  md += `- **OpenRouter llm_grounded (bucket):** ${pb.openrouter ?? 0}\n`;
  md += `- **Deterministic path:** ${pb.deterministic ?? 0}\n`;
  md += `- **Aborted batches:** ${aborted.length}\n`;
  if (batchMeta?.batchStoppedEarly) {
    md += `- **Last batch stopped early:** yes — ${batchMeta.reason || "provider_rate_limit_or_overload"}\n`;
  }
  md += `\n## Continue\n\n\`${npmContinue}\`\n`;
  md += `\n---\n_updated ${isoNow()}_\n`;
  return md;
}

function providerFailureTotal(state) {
  const c = state.providerFailureCounts || {};
  return Object.values(c).reduce((a, x) => a + (Number(x) || 0), 0);
}

/**
 * @param {object} p
 */
async function runSingleBatch(p) {
  const { state, args, stateFile, scenarios, runAsync, runId } = p;
  let consecutiveRateOrOverload = 0;
  let batchStoppedEarly = false;
  /** @type {string|null} */
  let batchStopReason = null;
  /** @type {number|null} */
  let lastRetryAfter = null;

  const startIndex = state.currentPlanIndex;
  const remainingPlan = state.plan.slice(startIndex);
  const turnsThisBatch = Math.min(args.batchSize, remainingPlan.length);

  if (remainingPlan.length === 0) {
    return {
      emptyPlan: true,
      batchStoppedEarly: false,
      batchStopReason: null,
      executed: 0,
      batchProviderEvents: [],
      globalStart: startIndex,
      lastRetryAfter: null,
    };
  }

  /** @type {object[]} */
  const batchProviderEvents = [];
  let executed = 0;
  const globalStart = startIndex;

  for (let b = 0; b < turnsThisBatch; b++) {
    const planIndex = startIndex + b;
    const row = state.plan[planIndex];
    if (!row) break;

    const scenarioDef = scenarios[row.scenario];
    const payload =
      row.group === "diagnostic" ? minimalDiagnosticPayload() : scenarioDef.payload;
    const sessionId = `soak-${runId}-${planIndex}`;

    if (row.stressFallback) {
      process.env.PARENT_COPILOT_LLM_SIMULATE_PRIMARY_TRANSIENT_FAILURE = "http_429";
    } else {
      delete process.env.PARENT_COPILOT_LLM_SIMULATE_PRIMARY_TRANSIENT_FAILURE;
    }

    /** @type {unknown} */
    let res;
    try {
      res = await runAsync({
        audience: "parent",
        payload,
        utterance: row.question,
        sessionId,
        selectedContextRef: null,
      });
    } finally {
      delete process.env.PARENT_COPILOT_LLM_SIMULATE_PRIMARY_TRANSIENT_FAILURE;
    }

    const record = extractRecord(res, row.scenario, row.group, row.question, "live");
    const failures = validateTurn({
      record,
      scenario: row.scenario,
      group: row.group,
      question: row.question,
      scenarioDef,
    });
    const pass = failures.length === 0;
    const providerCat = categorizeProviderFailure(res);
    const retryAfter = extractRetryAfterSeconds(res);

    const rateHit = turnShowsRateLimitOrOverload(res);
    const provSignal =
      rateHit || providerCat != null || (retryAfter != null && retryAfter > 60);

    if (provSignal) {
      state.providerFailureStreak = (state.providerFailureStreak || 0) + 1;
      if (providerCat && state.providerFailureCounts) {
        state.providerFailureCounts[providerCat] =
          (state.providerFailureCounts[providerCat] || 0) + 1;
      }
    } else {
      state.providerFailureStreak = 0;
    }

    if (rateHit) consecutiveRateOrOverload += 1;
    else consecutiveRateOrOverload = 0;

    const pathBucket = bucketGenerationPath(record);
    applyPathBucket(state, pathBucket);

    const turnRow = {
      index: planIndex,
      scenario: row.scenario,
      group: row.group,
      question: row.question,
      stressFallback: !!row.stressFallback,
      pass,
      failures,
      providerCategory: providerCat,
      generationPath: record.generationPath,
      validatorStatus: record.validatorStatus,
      llmAttemptDetail: record.llmAttemptDetail,
    };

    state.turns.push(turnRow);
    state.completedTurns = state.turns.length;
    state.currentPlanIndex = planIndex + 1;
    if (pass) state.passed += 1;
    else state.failed += 1;

    state.remaining = state.plan.slice(state.currentPlanIndex);
    state.updatedAt = isoNow();

    writeFileSync(stateFile, JSON.stringify(state, null, 2), "utf8");

    batchProviderEvents.push({
      sessionId,
      turnIndex: planIndex,
      scenario: row.scenario,
      group: row.group,
      question: row.question,
      stressFallback: !!row.stressFallback,
      generationPath: record.generationPath,
      llmAttempt: record.llmAttemptDetail,
      validatorStatus: record.validatorStatus,
      resolutionStatus: record.resolutionStatus,
      providerCategory: providerCat,
    });

    executed += 1;

    const stopForRetryAfter = retryAfter != null && retryAfter > 60;
    const stopForStreak =
      consecutiveRateOrOverload >= MAX_CONSEC_PROVIDER_SIGNALS ||
      (state.providerFailureStreak || 0) >= MAX_CONSEC_PROVIDER_SIGNALS;

    if (stopForRetryAfter || stopForStreak) {
      batchStoppedEarly = true;
      batchStopReason = "provider_rate_limit_or_overload";
      lastRetryAfter = retryAfter;
      state.abortedBatches = state.abortedBatches || [];
      state.abortedBatches.push({
        atPlanIndex: planIndex,
        at: isoNow(),
        batchStoppedEarly: true,
        reason: batchStopReason,
        retryAfterSeconds: retryAfter,
      });
      writeFileSync(stateFile, JSON.stringify(state, null, 2), "utf8");
      break;
    }

    if (b < turnsThisBatch - 1 && planIndex + 1 < state.plan.length) {
      await sleepMs(args.delayMs);
    }
  }

  return {
    emptyPlan: false,
    batchStoppedEarly,
    batchStopReason,
    executed,
    batchProviderEvents,
    globalStart,
    lastRetryAfter,
  };
}

/**
 * @param {object} ctx
 */
function writeBatchOutputs(ctx) {
  const {
    state,
    stateFile,
    runDir,
    runId,
    args,
    batchResult,
  } = ctx;
  const {
    batchStoppedEarly,
    batchStopReason,
    executed,
    batchProviderEvents,
    globalStart,
  } = batchResult;

  const failuresAll = state.turns.filter((t) => !t.pass).map((t) => ({
    scenario: t.scenario,
    group: t.group,
    question: t.question,
    failures: t.failures,
  }));

  writeFileSync(path.join(runDir, "failures.json"), JSON.stringify(failuresAll, null, 2), "utf8");

  state.providerEventsLog.push(...batchProviderEvents);
  writeFileSync(path.join(runDir, "provider-events.json"), JSON.stringify(state.providerEventsLog, null, 2), "utf8");
  writeFileSync(stateFile, JSON.stringify(state, null, 2), "utf8");

  let acceptedMd = `# Accepted turns (validator + QA harness pass)\n\n`;
  acceptedMd += `- **runId:** ${runId}\n`;
  state.turns
    .filter((t) => t.pass)
    .forEach((t, i) => {
      acceptedMd += `## ${i + 1}. [${t.group}] ${t.question}\n`;
      acceptedMd += `- scenario: ${t.scenario}\n\n`;
    });
  writeFileSync(path.join(runDir, "accepted-answers.md"), acceptedMd, "utf8");

  const batchMeta = {
    batchStoppedEarly,
    reason: batchStopReason,
  };
  const summaryJson = {
    runId,
    updatedAt: isoNow(),
    targetTurns: state.targetTurns,
    completedTurns: state.completedTurns,
    passed: state.passed,
    failed: state.failed,
    currentPlanIndex: state.currentPlanIndex,
    providerFailureStreak: state.providerFailureStreak,
    pathBuckets: state.pathBuckets,
    providerFailureCounts: state.providerFailureCounts || {},
    abortedBatches: state.abortedBatches,
    batch: {
      startedAtPlanIndex: globalStart,
      executedInBatch: executed,
      batchStoppedEarly,
      batchStopReason,
    },
    delayMs: args.delayMs,
    batchSize: args.batchSize,
    ...(args.auto
      ? {
          auto: true,
          pauseBetweenBatchesMs: args.pauseBetweenBatchesMs,
          maxBatches: Number.isFinite(args.maxBatches) ? args.maxBatches : null,
          maxProviderStops: args.maxProviderStops,
          autoBatchesRun: state.autoBatchesRun,
          autoProviderStopCount: state.autoProviderStopCount,
        }
      : {}),
  };

  writeFileSync(path.join(runDir, "summary.json"), JSON.stringify(summaryJson, null, 2), "utf8");

  const md = buildSummaryMarkdown(state, batchMeta);
  writeFileSync(path.join(runDir, "summary.md"), md, "utf8");
  mkdirSync(SOAK_ROOT, { recursive: true });
  copyFileSync(path.join(runDir, "summary.md"), LATEST_MD);
}

function printBatchProgressLine(ctx) {
  const { state, args, batchIndex, maxBatchesLabel, waitMs, waitReason } = ctx;
  const pct =
    state.targetTurns > 0 ? Math.round((100 * state.completedTurns) / state.targetTurns) : 0;
  const pf = providerFailureTotal(state);
  const nextAt = new Date(Date.now() + waitMs).toISOString();
  process.stdout.write("\n");
  process.stdout.write(`--- Batch ${batchIndex}${maxBatchesLabel ? ` / ${maxBatchesLabel}` : ""} ---\n`);
  process.stdout.write(
    `completedTurns / targetTurns: ${state.completedTurns} / ${state.targetTurns} (${pct}%)\n`,
  );
  process.stdout.write(`passed: ${state.passed}, failed (product): ${state.failed}\n`);
  process.stdout.write(`provider failure events (cumulative): ${pf}\n`);
  if (waitMs > 0) {
    process.stdout.write(
      `next batch pause (${waitReason || "between batches"}): ${waitMs} ms → resume ~ ${nextAt}\n`,
    );
  } else {
    process.stdout.write(`next batch: (no wait — exiting or complete)\n`);
  }
}

async function main() {
  loadEnvLocalBestEffort();
  const args = parseSoakArgs(process.argv);
  if (args.statusOnly) {
    printStatus();
    return;
  }

  configureEnvLive();

  /** @type {string} */
  let runId = args.runIdArg || "";
  /** Load existing state.json vs initialize a new plan */
  let loadExistingState = false;

  /** `--auto` or `--resume` + latest-run.txt: resume if incomplete, else new plan (unless `--fresh`). */
  const trySmartLatestPeek = (args.auto || args.resume) && !args.fresh && !args.runIdArg;

  if (args.fresh) {
    runId = args.runIdArg || `soak-${isoNow().replace(/[:.]/g, "-")}`;
    loadExistingState = false;
  } else if (args.runIdArg) {
    runId = args.runIdArg;
    loadExistingState = existsSync(path.join(resolveRunDir(runId), "state.json"));
  } else if (trySmartLatestPeek) {
    const fromLatest = readLatestRunDir();
    if (fromLatest && existsSync(path.join(fromLatest, "state.json"))) {
      const peek = JSON.parse(readFileSync(path.join(fromLatest, "state.json"), "utf8"));
      if (shouldStartFreshInsteadOfResume(peek, args.targetTurns)) {
        process.stdout.write(
          "Soak: starting a new run (latest saved run is complete or smaller than --target-turns).\n",
        );
        runId = `soak-${isoNow().replace(/[:.]/g, "-")}`;
        loadExistingState = false;
      } else {
        runId = path.basename(fromLatest);
        loadExistingState = true;
      }
    } else {
      runId = `soak-${isoNow().replace(/[:.]/g, "-")}`;
      loadExistingState = false;
    }
  } else {
    runId = `soak-${isoNow().replace(/[:.]/g, "-")}`;
    loadExistingState = false;
  }

  const runDir = resolveRunDir(runId);
  mkdirSync(runDir, { recursive: true });
  const stateFile = path.join(runDir, "state.json");

  /** @type {object} */
  let state;
  if (loadExistingState && existsSync(stateFile)) {
    state = JSON.parse(readFileSync(stateFile, "utf8"));
    if (!state.plan || !Array.isArray(state.plan)) {
      throw new Error("Invalid state: missing plan[]");
    }
    if (state.plan.length && state.targetTurns > state.plan.length) {
      state.targetTurns = state.plan.length;
      state.updatedAt = isoNow();
      writeFileSync(stateFile, JSON.stringify(state, null, 2), "utf8");
    }
  } else {
    const plan = buildStressLiveMatrix(args.targetTurns, {
      includeFallbackStress: args.includeFallbackStress,
      fallbackStressEvery: args.fallbackStressEvery,
      maxFallbackSlots: 5000,
    });
    state = {
      runId,
      createdAt: isoNow(),
      updatedAt: isoNow(),
      targetTurns: args.targetTurns,
      completedTurns: 0,
      passed: 0,
      failed: 0,
      currentPlanIndex: 0,
      providerFailureStreak: 0,
      plan,
      turns: [],
      remaining: plan,
      abortedBatches: [],
      includeFallbackStress: args.includeFallbackStress,
      fallbackStressEvery: args.fallbackStressEvery,
      delayMs: args.delayMs,
      batchSize: args.batchSize,
      pathBuckets: { gemini: 0, openrouter: 0, deterministic: 0, other: 0 },
      providerFailureCounts: {},
      providerEventsLog: [],
      autoProviderStopCount: 0,
      autoBatchesRun: 0,
    };
  }

  if (!state.providerEventsLog) state.providerEventsLog = [];
  if (state.autoProviderStopCount == null) state.autoProviderStopCount = 0;
  if (state.autoBatchesRun == null) state.autoBatchesRun = 0;

  writeLatestPointers(runDir, runId);

  const scenarios = buildScenarios();
  const parentCopilot = await import("../utils/parent-copilot/index.js");
  const runAsync = parentCopilot.runParentCopilotTurnAsync;

  const startIndex = state.currentPlanIndex;
  const remainingPlan = state.plan.slice(startIndex);

  if (remainingPlan.length === 0) {
    state.updatedAt = isoNow();
    state.remaining = [];
    writeFileSync(stateFile, JSON.stringify(state, null, 2), "utf8");
    const md = buildSummaryMarkdown(state, {});
    writeFileSync(path.join(runDir, "summary.md"), md, "utf8");
    mkdirSync(SOAK_ROOT, { recursive: true });
    copyFileSync(path.join(runDir, "summary.md"), LATEST_MD);
    const pct =
      state.targetTurns > 0 ? Math.round((100 * state.completedTurns) / state.targetTurns) : 0;
    process.stdout.write(`Soak already complete for runId ${runId} (${state.completedTurns}/${state.targetTurns}, ${pct}%).\n`);
    process.stdout.write(`Artifacts: ${runDir}\n`);
    process.exitCode = state.failed > 0 ? 1 : 0;
    return;
  }

  /** @type {"product_fail"|"target_complete"|"max_batches"|"max_provider_stops"|"batch_done"} */
  let exitReason = "batch_done";

  if (args.auto) {
    let batchIdx = state.autoBatchesRun || 0;
    let providerStops = state.autoProviderStopCount || 0;
    const maxBatchesLabel = Number.isFinite(args.maxBatches) ? String(args.maxBatches) : "∞";

    while (true) {
      if (state.failed > 0) {
        exitReason = "product_fail";
        break;
      }
      if (state.currentPlanIndex >= state.plan.length) {
        exitReason = "target_complete";
        state.autoExitReason = "target_complete";
        break;
      }
      if (batchIdx >= args.maxBatches) {
        exitReason = "max_batches";
        state.autoExitReason = "max_batches";
        state.updatedAt = isoNow();
        writeFileSync(stateFile, JSON.stringify(state, null, 2), "utf8");
        break;
      }

      batchIdx += 1;
      state.autoBatchesRun = batchIdx;

      const batchResult = await runSingleBatch({
        state,
        args,
        stateFile,
        scenarios,
        runAsync,
        runId,
      });

      if (batchResult.emptyPlan) break;

      writeBatchOutputs({
        state,
        stateFile,
        runDir,
        runId,
        args,
        batchResult,
      });

      if (state.failed > 0) {
        exitReason = "product_fail";
        printBatchProgressLine({
          state,
          args,
          batchIndex: batchIdx,
          maxBatchesLabel,
          waitMs: 0,
          waitReason: "",
        });
        break;
      }

      const targetDone = state.currentPlanIndex >= state.plan.length;
      let waitMs = 0;
      let waitReason = "";
      if (!targetDone && batchResult.batchStoppedEarly && batchResult.batchStopReason === "provider_rate_limit_or_overload") {
        providerStops += 1;
        state.autoProviderStopCount = providerStops;
        writeFileSync(stateFile, JSON.stringify(state, null, 2), "utf8");
        if (providerStops >= args.maxProviderStops) {
          exitReason = "max_provider_stops";
          state.autoExitReason = "max_provider_stops";
          printBatchProgressLine({
            state,
            args,
            batchIndex: batchIdx,
            maxBatchesLabel,
            waitMs: 0,
            waitReason: "",
          });
          process.stdout.write(
            `\nAuto soak: max provider stops (${args.maxProviderStops}) reached — state saved. Resume later.\n`,
          );
          break;
        }
        waitMs = randomProviderCooldownMs();
        waitReason = "provider cooldown (10–20 min jitter)";
      } else if (!targetDone) {
        waitMs = args.pauseBetweenBatchesMs;
        waitReason = "between batches";
      }

      printBatchProgressLine({
        state,
        args,
        batchIndex: batchIdx,
        maxBatchesLabel,
        waitMs: targetDone ? 0 : waitMs,
        waitReason: targetDone ? "" : waitReason,
      });

      if (targetDone) {
        exitReason = "target_complete";
        state.autoExitReason = "target_complete";
        break;
      }

      if (waitMs > 0) {
        await sleepMs(waitMs);
      }
    }

    const providerFailCount = summarizeProviderFailures(state);
    const pct =
      state.targetTurns > 0 ? Math.round((100 * state.completedTurns) / state.targetTurns) : 0;
    process.stdout.write("\n");
    process.stdout.write(buildSummaryMarkdown(state, {}));
    process.stdout.write("\n");
    process.stdout.write(`runId: ${runId}\n`);
    process.stdout.write(`completedTurns: ${state.completedTurns} / ${state.targetTurns} (${pct}%)\n`);
    process.stdout.write(`passed: ${state.passed}, failed (product): ${state.failed}\n`);
    process.stdout.write(`provider-classified turns: ${providerFailCount}\n`);
    process.stdout.write(`provider failure events (sum): ${providerFailureTotal(state)}\n`);
    process.stdout.write(`auto exit: ${exitReason}${state.autoExitReason ? ` (${state.autoExitReason})` : ""}\n`);
    process.stdout.write(`artifacts: ${runDir}\n`);

    const productFail = state.failed > 0;
    process.exitCode = productFail ? 1 : 0;
    return;
  }

  const batchResult = await runSingleBatch({
    state,
    args,
    stateFile,
    scenarios,
    runAsync,
    runId,
  });

  if (batchResult.emptyPlan) {
    state.updatedAt = isoNow();
    writeFileSync(stateFile, JSON.stringify(state, null, 2), "utf8");
    process.exitCode = state.failed > 0 ? 1 : 0;
    return;
  }

  writeBatchOutputs({
    state,
    stateFile,
    runDir,
    runId,
    args,
    batchResult,
  });

  const providerFailCount = summarizeProviderFailures(state);
  const pct =
    state.targetTurns > 0 ? Math.round((100 * state.completedTurns) / state.targetTurns) : 0;

  process.stdout.write(
    buildSummaryMarkdown(state, {
      batchStoppedEarly: batchResult.batchStoppedEarly,
      reason: batchResult.batchStopReason,
    }),
  );
  process.stdout.write("\n");
  process.stdout.write(`runId: ${runId}\n`);
  process.stdout.write(`completedTurns: ${state.completedTurns} / ${state.targetTurns} (${pct}%)\n`);
  process.stdout.write(`passed: ${state.passed}, failed (product): ${state.failed}\n`);
  process.stdout.write(`provider-classified turns: ${providerFailCount}\n`);
  process.stdout.write(`provider failure events (sum): ${providerFailureTotal(state)}\n`);
  process.stdout.write(`latest artifacts: ${runDir}\n`);
  process.stdout.write(`next: npm run qa:parent-copilot:live-soak\n`);

  const productFail = state.failed > 0;
  process.exitCode = productFail ? 1 : 0;
}

const __soakPath = fileURLToPath(import.meta.url);
const runsSoak = process.argv[1] && path.normalize(process.argv[1]) === path.normalize(__soakPath);

if (runsSoak) {
  main().catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
}
