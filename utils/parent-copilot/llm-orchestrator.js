/**
 * Grounded LLM path for Parent Copilot.
 * This module is optional and must degrade safely to deterministic flow.
 */

import { canUseLlmPath } from "./rollout-gates.js";

const DEFAULT_TIMEOUT_MS = 9000;

function env(name, fallback = "") {
  let raw;
  try {
    raw = typeof process !== "undefined" && process?.env ? process.env[name] : undefined;
  } catch {
    raw = undefined;
  }
  const v = String(raw ?? "").trim();
  return v || fallback;
}

function safeJsonParse(raw) {
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch {
    return { ok: false, value: null };
  }
}

function buildGroundedPrompt(utterance, truthPacket) {
  const nar = truthPacket?.contracts?.narrative?.textSlots || {};
  const dl = truthPacket?.derivedLimits || {};
  const facts = {
    scopeType: truthPacket.scopeType,
    scopeLabel: truthPacket.scopeLabel,
    questions: truthPacket?.surfaceFacts?.questions,
    accuracy: truthPacket?.surfaceFacts?.accuracy,
    observation: String(nar.observation || ""),
    interpretation: String(nar.interpretation || ""),
    action: String(nar.action || ""),
    uncertainty: String(nar.uncertainty || ""),
    cannotConcludeYet: !!dl.cannotConcludeYet,
    recommendationEligible: !!dl.recommendationEligible,
    recommendationIntensityCap: String(dl.recommendationIntensityCap || "RI0"),
    requiredHedges: Array.isArray(truthPacket?.allowedClaimEnvelope?.requiredHedges)
      ? truthPacket.allowedClaimEnvelope.requiredHedges
      : [],
    forbiddenPhrases: Array.isArray(truthPacket?.allowedClaimEnvelope?.forbiddenPhrases)
      ? truthPacket.allowedClaimEnvelope.forbiddenPhrases
      : [],
  };
  return [
    "אתה עוזר הורים מקצועי.",
    "השתמש רק בעובדות מה-JSON הבא. אסור להמציא עובדות.",
    "תענה בעברית בלבד, בטון מקצועי וחם, עם 2-3 בלוקים קצרים.",
    'החזר JSON בלבד בפורמט {"answerBlocks":[{"type":"observation|meaning|next_step|caution","textHe":"...","source":"composed"}]}',
    `שאלת הורה: ${String(utterance || "").trim()}`,
    `FACTS_JSON: ${JSON.stringify(facts)}`,
  ].join("\n");
}

/**
 * @param {AbortSignal} signal
 * @param {string} prompt
 */
async function callOpenAiCompatible(signal, prompt) {
  const url = env("PARENT_COPILOT_LLM_BASE_URL", "https://api.openai.com/v1/responses");
  const apiKey = env("PARENT_COPILOT_LLM_API_KEY");
  const model = env("PARENT_COPILOT_LLM_MODEL", "gpt-4.1-mini");
  if (!apiKey) return { ok: false, reason: "missing_api_key" };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: prompt,
      temperature: 0.2,
      max_output_tokens: 500,
      text: { format: { type: "text" } },
    }),
    signal,
  });
  if (!res.ok) return { ok: false, reason: `http_${res.status}` };
  const body = await res.json();
  const maybeText =
    body?.output_text ||
    body?.output?.[0]?.content?.find?.((x) => x.type === "output_text")?.text ||
    body?.choices?.[0]?.message?.content ||
    "";
  const parsed = safeJsonParse(String(maybeText || "").trim());
  if (!parsed.ok) return { ok: false, reason: "invalid_json_output", raw: maybeText };
  return { ok: true, payload: parsed.value };
}

function validateLlmDraft(payload, truthPacket) {
  const blocks = Array.isArray(payload?.answerBlocks) ? payload.answerBlocks : [];
  if (blocks.length < 2) return { ok: false, reason: "llm_answer_too_short" };
  const allowedTypes = new Set(["observation", "meaning", "next_step", "caution", "uncertainty_reason"]);
  for (const b of blocks) {
    const type = String(b?.type || "");
    const textHe = String(b?.textHe || "").trim();
    if (!allowedTypes.has(type) || !textHe) return { ok: false, reason: "llm_invalid_block_shape" };
    for (const ph of truthPacket?.allowedClaimEnvelope?.forbiddenPhrases || []) {
      if (ph && textHe.includes(String(ph))) return { ok: false, reason: "llm_forbidden_phrase" };
    }
  }
  return {
    ok: true,
    draft: {
      answerBlocks: blocks.map((b) => ({
        type: String(b.type),
        textHe: String(b.textHe || "").trim(),
        source: "composed",
      })),
    },
  };
}

/**
 * @param {{ utterance: string; truthPacket: NonNullable<ReturnType<typeof import("./truth-packet-v1.js").buildTruthPacketV1>>; }} input
 */
export async function maybeGenerateGroundedLlmDraft(input) {
  if (!canUseLlmPath()) return { ok: false, reason: "llm_disabled_by_rollout_gate" };
  const prompt = buildGroundedPrompt(input.utterance, input.truthPacket);
  const controller = new AbortController();
  const timeoutMs = Number(env("PARENT_COPILOT_LLM_TIMEOUT_MS", String(DEFAULT_TIMEOUT_MS))) || DEFAULT_TIMEOUT_MS;
  const timer = setTimeout(() => controller.abort("timeout"), timeoutMs);
  try {
    const response = await callOpenAiCompatible(controller.signal, prompt);
    if (!response.ok) return { ok: false, reason: response.reason || "llm_provider_error" };
    const validated = validateLlmDraft(response.payload, input.truthPacket);
    if (!validated.ok) return { ok: false, reason: validated.reason || "llm_validation_failed" };
    return { ok: true, draft: validated.draft, provider: "openai_compatible" };
  } catch (error) {
    return { ok: false, reason: `llm_exception:${String(error?.message || error || "unknown")}` };
  } finally {
    clearTimeout(timer);
  }
}

export default { maybeGenerateGroundedLlmDraft };
