/**
 * QA helper: probe OpenRouter models with the Parent Copilot fallback shape (JSON mode).
 * Runs each candidate twice: strict (`provider.require_parameters: true`) vs relaxed (omit provider).
 *
 * Recommended env comes from **relaxed** passes only — free tiers often 404 when strict.
 *
 * Loads `.env.local` best-effort (never prints secrets).
 *
 * Usage:
 *   PARENT_COPILOT_LLM_FALLBACK_API_KEY=sk-or-... \
 *   PARENT_COPILOT_OPENROUTER_CANDIDATE_MODELS="openai/gpt-oss-120b:free,..." \
 *   npx tsx scripts/check-openrouter-free-fallback-models.mjs
 *
 * Optional:
 *   PARENT_COPILOT_LLM_FALLBACK_BASE_URL
 *   PARENT_COPILOT_OPENROUTER_HTTP_REFERER
 *   PARENT_COPILOT_OPENROUTER_X_TITLE
 *
 * Production fallback sets `PARENT_COPILOT_OPENROUTER_REQUIRE_PARAMETERS` (default false).
 * This script tests both modes explicitly and does not depend on that env for its runs.
 */

import { existsSync, readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

function loadEnvLocalBestEffort() {
  const p = resolve(ROOT, ".env.local");
  if (!existsSync(p)) return;
  const raw = readFileSync(p, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (process.env[k] === undefined || process.env[k] === "") {
      process.env[k] = v;
    }
  }
}

function envStr(name, fallback = "") {
  try {
    const v = process.env[name];
    return String(v ?? "").trim() || fallback;
  } catch {
    return fallback;
  }
}

function parseCandidateModels(raw) {
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Mirrors production fallback assistant extraction (chat completions). */
function extractOpenAiAssistantText(body) {
  if (!body || typeof body !== "object") return "";
  const choice = Array.isArray(body.choices) ? body.choices[0] : null;
  const mc = choice?.message?.content;
  if (typeof mc === "string") return mc;
  if (Array.isArray(mc)) {
    return mc.map((p) => (typeof p?.text === "string" ? p.text : "")).join("");
  }
  return "";
}

function safeJsonParse(raw) {
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch {
    const m = String(raw || "").match(/\{[\s\S]*\}/);
    if (!m) return { ok: false, value: null };
    try {
      return { ok: true, value: JSON.parse(m[0]) };
    } catch {
      return { ok: false, value: null };
    }
  }
}

function summarizeErrorBody(rawText, parsed) {
  if (parsed && typeof parsed === "object" && parsed.error) {
    const e = parsed.error;
    if (typeof e === "object" && e.message) return String(e.message);
    return JSON.stringify(parsed.error).slice(0, 500);
  }
  return String(rawText || "").slice(0, 800);
}

const OPENROUTER_JSON_SYSTEM_INSTRUCTION =
  "Return valid JSON only. No Markdown. No text outside JSON.";

const SMALL_JSON_USER_PROMPT = [
  "You are helping format a parent-facing Hebrew coaching reply.",
  'Return one JSON object only with shape:',
  '{"answerBlocks":[{"type":"observation","textHe":"משפט קצר בעברית","source":"composed"}]}',
  "Use a plausible short Hebrew sentence in textHe.",
].join(" ");

/**
 * @param {string} modelId
 * @param {AbortSignal} signal
 * @param {boolean} requireParameters strict OpenRouter routing (matches env true)
 */
async function probeModel(modelId, signal, requireParameters) {
  const baseUrl = envStr(
    "PARENT_COPILOT_LLM_FALLBACK_BASE_URL",
    "https://openrouter.ai/api/v1/chat/completions",
  ).replace(/\/$/, "");
  const apiKey = envStr("PARENT_COPILOT_LLM_FALLBACK_API_KEY");
  if (!apiKey) {
    return {
      model: modelId,
      mode: requireParameters ? "strict" : "relaxed",
      httpStatus: 0,
      ok: false,
      supportsJsonMode: false,
      failureReason: "missing_PARENT_COPILOT_LLM_FALLBACK_API_KEY",
      rawErrorSummary: "",
      parsedJsonOk: false,
    };
  }

  const payloadBody = {
    model: modelId,
    messages: [
      { role: "system", content: OPENROUTER_JSON_SYSTEM_INSTRUCTION },
      { role: "user", content: SMALL_JSON_USER_PROMPT },
    ],
    temperature: 0.2,
    max_tokens: 900,
    response_format: { type: "json_object" },
    ...(requireParameters ? { provider: { require_parameters: true } } : {}),
  };

  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("Authorization", `Bearer ${apiKey}`);
  const referer = envStr("PARENT_COPILOT_OPENROUTER_HTTP_REFERER", "https://localhost");
  const title = envStr("PARENT_COPILOT_OPENROUTER_X_TITLE", "LIOSH Parent Copilot");
  if (referer) headers.set("HTTP-Referer", referer);
  if (title) headers.set("X-Title", title);

  let httpStatus = 0;
  try {
    const res = await fetch(baseUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payloadBody),
      signal,
    });
    httpStatus = res.status;
    const rawText = await res.text();
    /** @type {unknown} */
    let body = null;
    try {
      body = JSON.parse(rawText);
    } catch {
      body = null;
    }

    if (!res.ok) {
      const summary = summarizeErrorBody(rawText, body);
      return {
        model: modelId,
        mode: requireParameters ? "strict" : "relaxed",
        httpStatus,
        ok: false,
        supportsJsonMode: false,
        failureReason: `http_${httpStatus}`,
        rawErrorSummary: summary,
        parsedJsonOk: false,
      };
    }

    const maybeText = extractOpenAiAssistantText(body || {});
    const trimmed = String(maybeText || "").trim();
    const parsed = safeJsonParse(trimmed);
    const parsedJsonOk = parsed.ok && parsed.value != null;
    const supportsJsonMode = parsedJsonOk;
    const hasAnswerBlocks =
      parsedJsonOk &&
      typeof parsed.value === "object" &&
      parsed.value !== null &&
      Array.isArray(/** @type {{ answerBlocks?: unknown }} */ (parsed.value).answerBlocks);

    const ok = parsedJsonOk && hasAnswerBlocks;
    return {
      model: modelId,
      mode: requireParameters ? "strict" : "relaxed",
      httpStatus,
      ok,
      supportsJsonMode,
      failureReason: ok ? "" : parsedJsonOk ? "json_shape_missing_answerBlocks" : "invalid_json_output",
      rawErrorSummary: ok ? "" : trimmed.slice(0, 400),
      parsedJsonOk,
    };
  } catch (e) {
    return {
      model: modelId,
      mode: requireParameters ? "strict" : "relaxed",
      httpStatus,
      ok: false,
      supportsJsonMode: false,
      failureReason: `network_or_abort:${String(e?.message || e)}`,
      rawErrorSummary: String(e?.message || e).slice(0, 400),
      parsedJsonOk: false,
    };
  }
}

function sleepMs(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function printRow(row) {
  process.stdout.write(`  mode: ${row.mode} (require_parameters=${row.mode === "strict"})\n`);
  process.stdout.write(`  httpStatus: ${row.httpStatus}\n`);
  process.stdout.write(`  ok (shape): ${row.ok}\n`);
  process.stdout.write(`  supportsJsonMode (parsed JSON): ${row.supportsJsonMode}\n`);
  process.stdout.write(`  parsedJsonOk: ${row.parsedJsonOk}\n`);
  if (row.failureReason) process.stdout.write(`  failureReason: ${row.failureReason}\n`);
  if (row.rawErrorSummary) process.stdout.write(`  rawErrorSummary: ${row.rawErrorSummary}\n`);
  process.stdout.write("\n");
}

async function main() {
  loadEnvLocalBestEffort();

  const rawList = envStr("PARENT_COPILOT_OPENROUTER_CANDIDATE_MODELS");
  const models = parseCandidateModels(rawList);

  if (!models.length) {
    process.stderr.write(
      "Set PARENT_COPILOT_OPENROUTER_CANDIDATE_MODELS to a comma-separated list of OpenRouter model IDs.\n",
    );
    process.stderr.write(
      "Example: openai/gpt-oss-120b:free,nvidia/nemotron-3-nano-30b-a3b:free\n",
    );
    process.exitCode = 1;
    return;
  }

  process.stdout.write("OpenRouter probe — same JSON-mode shape as Parent Copilot fallback\n");
  process.stdout.write(`Candidates: ${models.length}\n`);
  process.stdout.write(`Base URL: ${envStr("PARENT_COPILOT_LLM_FALLBACK_BASE_URL", "https://openrouter.ai/api/v1/chat/completions")}\n`);
  process.stdout.write(
    "Each model is tested twice: STRICT (require_parameters=true) then RELAXED (omit provider).\n\n",
  );

  /** @type {Awaited<ReturnType<typeof probeModel>>[]} */
  const strictRows = [];
  /** @type {Awaited<ReturnType<typeof probeModel>>[]} */
  const relaxedRows = [];

  const controller = new AbortController();
  const abortTimer = setTimeout(
    () => controller.abort("overall_timeout"),
    180000 * Math.max(1, models.length),
  );

  try {
    process.stdout.write("========== STRICT (provider.require_parameters = true) ==========\n\n");
    for (let i = 0; i < models.length; i++) {
      const m = models[i];
      process.stdout.write(`--- [strict ${i + 1}/${models.length}] ${m} ---\n`);
      const row = await probeModel(m, controller.signal, true);
      strictRows.push(row);
      printRow(row);
      if (i < models.length - 1) await sleepMs(750);
    }

    process.stdout.write("\n========== RELAXED (omit provider — matches default production fallback) ==========\n\n");
    for (let i = 0; i < models.length; i++) {
      const m = models[i];
      process.stdout.write(`--- [relaxed ${i + 1}/${models.length}] ${m} ---\n`);
      const row = await probeModel(m, controller.signal, false);
      relaxedRows.push(row);
      printRow(row);
      if (i < models.length - 1) await sleepMs(750);
    }
  } finally {
    clearTimeout(abortTimer);
  }

  process.stdout.write("========== Summary ==========\n");
  process.stdout.write("STRICT:\n");
  for (const row of strictRows) {
    process.stdout.write(
      `  [${row.ok ? "PASS" : "FAIL"}] ${row.model} http=${row.httpStatus} ${row.failureReason || ""}\n`,
    );
  }
  process.stdout.write("RELAXED (used for recommendation):\n");
  const passedRelaxed = [];
  for (const row of relaxedRows) {
    process.stdout.write(
      `  [${row.ok ? "PASS" : "FAIL"}] ${row.model} http=${row.httpStatus} ${row.failureReason || ""}\n`,
    );
    if (row.ok) passedRelaxed.push(row.model);
  }

  process.stdout.write("\n--- Recommended env (RELAXED mode only — parseable JSON + answerBlocks[]) ---\n");
  if (passedRelaxed.length) {
    process.stdout.write(`PARENT_COPILOT_OPENROUTER_REQUIRE_PARAMETERS=false\n`);
    process.stdout.write(`PARENT_COPILOT_LLM_FALLBACK_MODELS=${passedRelaxed.join(",")}\n`);
    process.stdout.write(`\nPARENT_COPILOT_LLM_FALLBACK_MODEL=${passedRelaxed[0]}\n`);
  } else {
    process.stdout.write("(none passed relaxed probe — check API key, quotas, or candidates)\n");
    process.stdout.write("Hint: production uses PARENT_COPILOT_OPENROUTER_REQUIRE_PARAMETERS=false by default.\n");
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
