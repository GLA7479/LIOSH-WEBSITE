/**
 * Parent-report AI narrative writer (entry).
 *
 * Pipeline:
 *  1. Build the strict `AiNarrativeInput` projection from the Insight Packet.
 *  2. Refuse to call the LLM if the projection exceeds the 4 KB budget.
 *  3. If the LLM is enabled (`PARENT_REPORT_NARRATIVE_LLM_ENABLED=true` and an API key is present)
 *     → call `/v1/responses` with `text.format=json_object`.
 *  4. Validate the LLM output with the 9-step `validateNarrativeOutput`.
 *  5. On any failure (LLM disabled, network, parse, validation), emit the deterministic fallback
 *     produced by `buildDeterministicFallbackNarrative(packet)`.
 *
 * Output shape (always):
 *   { ok: true,
 *     source: "ai" | "deterministic_fallback",
 *     reason?: string,
 *     structured: { summary, strengths[{textHe,sourceId}], focusAreas[{textHe,sourceId}],
 *                   homeTips: string[], cautionNote: string }
 *   }
 */

import {
  buildAiNarrativeInput,
  isAiNarrativeInputWithinBudget,
  MAX_PROMPT_INPUT_CHARS,
} from "../parent-report-insights/build-ai-narrative-input.js";
import { buildNarrativePrompt } from "./prompt.js";
import { callNarrativeLlm, isNarrativeLlmEnabled } from "./llm-client.js";
import { validateNarrativeOutput } from "./validate-narrative-output.js";
import { buildDeterministicFallbackNarrative } from "./deterministic-fallback.js";

function ensureFallback(packet, reason, diag) {
  const structured = buildDeterministicFallbackNarrative(packet);
  const out = {
    ok: true,
    source: "deterministic_fallback",
    reason: reason || "deterministic_default",
    structured,
  };
  if (diag) out._diag = diag;
  return out;
}

function isPacketReady(packet) {
  if (!packet || typeof packet !== "object") return false;
  if (packet.ok === false) return false;
  const totalQ = Number(packet?.overall?.totalQuestions) || 0;
  return totalQ >= 0;
}

function buildEngineSnapshotForGuard(packet) {
  const overall = packet?.overall || {};
  const dc = String(overall.dataConfidence || "thin").toLowerCase();
  const thin = dc === "thin" || dc === "low";
  return {
    thinData: thin,
    doNotConclude: thin,
    engineConfidence: dc === "strong" ? "high" : dc === "moderate" ? "medium" : "low",
    conclusionStrengthAllowed: dc === "strong" ? "moderate" : "minimal",
    recommendationTier: dc === "strong" ? "RI2" : dc === "moderate" ? "RI1" : "RI0",
    recommendationEligible: dc !== "thin",
    prerequisiteGapLevel: "none",
    guessingLikelihoodHigh: false,
    mustNotSay: [],
  };
}

/**
 * @param {object} packet — Insight Packet (full)
 * @param {object} [options]
 * @param {Record<string,string|undefined>} [options.env]
 * @param {boolean} [options.preferDeterministicOnly]
 * @param {AbortSignal} [options.signal]
 * @param {(args: { url: string, init: RequestInit }) => Promise<Response>} [options.fetchImpl] — for tests
 * @returns {Promise<{ ok: true, source: "ai"|"deterministic_fallback", reason?: string, structured: object }>}
 */
export async function buildParentReportAINarrative(packet, options = {}) {
  if (!isPacketReady(packet)) return ensureFallback(packet, "packet_not_ready");

  if (options?.preferDeterministicOnly === true) {
    return ensureFallback(packet, "prefer_deterministic_only");
  }

  const env = options?.env || (typeof process !== "undefined" ? process.env : {});
  if (!isNarrativeLlmEnabled(env)) return ensureFallback(packet, "llm_disabled_or_no_key");

  const aiInput = buildAiNarrativeInput(packet);
  if (!aiInput) return ensureFallback(packet, "ai_input_unavailable");
  if (!isAiNarrativeInputWithinBudget(aiInput)) {
    return ensureFallback(packet, `ai_input_over_budget_${MAX_PROMPT_INPUT_CHARS}`);
  }

  const prompt = buildNarrativePrompt(aiInput);

  const llmResult = await callNarrativeLlm({
    prompt,
    env,
    signal: options?.signal,
    fetchImpl: options?.fetchImpl,
  });
  if (!llmResult.ok) {
    return ensureFallback(packet, `llm_call_failed:${llmResult.reason}`, {
      stage: "llm",
      reason: llmResult.reason,
      httpErrorBody: llmResult.httpErrorBody || "",
      raw: llmResult.raw || "",
    });
  }

  const validation = validateNarrativeOutput(llmResult.payload, packet, {
    narrativeReportContext: { surface: "detailed" },
    engineSnapshot: buildEngineSnapshotForGuard(packet),
  });
  if (!validation.ok) {
    return ensureFallback(packet, `validation_failed:${validation.reason}`, {
      stage: "validation",
      reason: validation.reason,
      details: validation.details || null,
      payload: llmResult.payload || null,
      raw: llmResult.raw || "",
    });
  }

  return { ok: true, source: "ai", structured: validation.normalized };
}

export {
  buildAiNarrativeInput,
  buildDeterministicFallbackNarrative,
  validateNarrativeOutput,
  buildNarrativePrompt,
  isNarrativeLlmEnabled,
};
