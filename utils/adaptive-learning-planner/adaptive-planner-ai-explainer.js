/**
 * Controlled AI explainer for adaptive planner: explains only the approved deterministic recommendation.
 * Planner remains source of truth; this module never chooses nextAction, difficulty, counts, or questions.
 */

import { mapPlannerNextActionToHebrew } from "../../lib/learning-client/adaptive-planner-recommendation-view-model.js";
import {
  validateAdaptivePlannerExplanationText,
  isAdaptivePlannerAIExplainerClientDisplayEnabled,
  PLANNER_AI_EXPLANATION_SECTION_LABEL_HE,
} from "../../lib/learning-client/adaptive-planner-explanation-validate.js";

export {
  validateAdaptivePlannerExplanationText,
  isAdaptivePlannerAIExplainerClientDisplayEnabled,
  PLANNER_AI_EXPLANATION_SECTION_LABEL_HE,
};

/** @param {Record<string, string | undefined>} [env] */
function envStr(name, env = typeof process !== "undefined" ? process.env : {}) {
  return String(env?.[name] ?? "").trim();
}

/**
 * Server-side: generate / validate explanations (API only).
 * @param {Record<string, string | undefined>} [env]
 */
export function isAdaptivePlannerAIExplainerServerEnabled(env = typeof process !== "undefined" ? process.env : {}) {
  const v = envStr("ENABLE_ADAPTIVE_PLANNER_AI_EXPLAINER", env).toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

/**
 * Deterministic Hebrew fallbacks (child-friendly, non-judgmental). No digits.
 * Used when AI is off, missing key, HTTP error, or AI output fails validation.
 * @param {string} nextAction
 */
export function getDeterministicPlannerExplanationFallback(nextAction) {
  const n = String(nextAction || "").toLowerCase().trim();
  if (n === "advance_skill") {
    return "המערכת הציעה לנסות שלב הבא כשמרגישים שהחומר יושב טוב.";
  }
  if (n === "maintain_skill") {
    return "המערכת ראתה שכדאי לתרגל עוד קצת באותה רמה כדי לבסס את ההבנה.";
  }
  if (n === "practice_current") {
    return "נבחר תרגול שיעזור לחזק את הבסיס לפני מעבר רחוק יותר.";
  }
  if (n === "review_prerequisite" || n === "probe_skill") {
    return "נבחר תרגול קצר שיעזור לחדד את מה שלמדנו לאחרונה.";
  }
  if (n === "pause_collect_more_data") {
    return "המערכת מציעה להמשיך לתרגל בהתאם למה שמתאים לך עכשיו.";
  }
  return "המערכת מציעה להמשיך לתרגל בהתאם למה שמתאים לך עכשיו.";
}

/**
 * Strict allowlisted input for explainer / model prompt. No diagnostics, history, or bank data.
 * @param {object} raw
 */
export function buildStrictPlannerExplainerInput(raw) {
  if (!raw || typeof raw !== "object") return null;
  const subject = String(raw.subject || "").trim().slice(0, 64);
  const grade = String(raw.grade != null ? raw.grade : "").trim().slice(0, 16);
  const nextAction = String(raw.nextAction || "").trim().slice(0, 48);
  const targetDifficulty = String(raw.targetDifficulty != null ? raw.targetDifficulty : "").trim().slice(0, 48);
  const qc = Number(raw.questionCount);
  const questionCount = Number.isFinite(qc) && qc >= 0 ? Math.min(9999, Math.round(qc)) : 0;
  const approvedHebrewRecommendationLine = String(raw.approvedHebrewRecommendationLine || "").trim().slice(0, 200);
  if (!nextAction || !approvedHebrewRecommendationLine) return null;
  return {
    subject,
    grade,
    nextAction,
    targetDifficulty,
    questionCount,
    approvedHebrewRecommendationLine,
  };
}

function buildModelPrompt(input) {
  /** Omit numeric questionCount from the model context to avoid digit leakage in output. */
  const payload = {
    subject: input.subject,
    grade: input.grade,
    planner_hint_next_action_kind: input.nextAction,
    planner_hint_difficulty_tier: input.targetDifficulty,
    approved_hebrew_recommendation_one_liner: input.approvedHebrewRecommendationLine,
  };
  return [
    "You write ONE or TWO very short sentences in Modern Hebrew for elementary students.",
    "Tone: calm, encouraging, non-judgmental. No blame, weakness, failure, predictions, parents, reports, medicine, psychology, or diagnoses.",
    "Do NOT mention scores, percentages, accuracy, algorithms, AI, systems, safety checks, metadata, diagnostics, or English planner labels.",
    "Do NOT use digits, bullet lists, markdown, emojis, or line breaks.",
    "Paraphrase only the meaning of approved_hebrew_recommendation_one_liner; do not invent new recommendations or difficulty.",
    'Return JSON only: {"text":"..."}',
    `CONTEXT_JSON: ${JSON.stringify(payload)}`,
  ].join("\n");
}

/**
 * @param {AbortSignal} [signal]
 */
async function callOpenAiChatHebrewExplanation(prompt, env, signal) {
  const key = envStr("ADAPTIVE_PLANNER_AI_EXPLAINER_API_KEY", env) || envStr("OPENAI_API_KEY", env);
  const model = envStr("ADAPTIVE_PLANNER_AI_EXPLAINER_MODEL", env) || "gpt-4o-mini";
  const base = (envStr("ADAPTIVE_PLANNER_AI_EXPLAINER_BASE_URL", env) || "https://api.openai.com/v1").replace(/\/$/, "");
  if (!key) return { ok: false, reason: "missing_api_key" };

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.25,
      max_tokens: 140,
      messages: [
        { role: "system", content: "You only output valid minified JSON with a Hebrew text field." },
        { role: "user", content: prompt },
      ],
    }),
    signal: signal || undefined,
  });
  if (!res.ok) return { ok: false, reason: `http_${res.status}` };
  let body;
  try {
    body = await res.json();
  } catch {
    return { ok: false, reason: "invalid_response_json" };
  }
  const content = body?.choices?.[0]?.message?.content;
  const raw = String(content || "").trim();
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  const slice = jsonMatch ? jsonMatch[0] : raw;
  let parsed;
  try {
    parsed = JSON.parse(slice);
  } catch {
    return { ok: false, reason: "invalid_model_json" };
  }
  const text = parsed?.text != null ? String(parsed.text) : "";
  return { ok: true, text };
}

/**
 * Build student-safe explanation (AI optional, deterministic fallback when AI off or unusable).
 * @param {Record<string, unknown>} rawInput — fields for buildStrictPlannerExplainerInput
 * @param {{ env?: Record<string, string | undefined>, signal?: AbortSignal, preferDeterministicOnly?: boolean }} [options]
 * @returns {Promise<{ ok: true, text: string, source: "ai" | "deterministic_fallback" } | { ok: false, reason: string }>}
 */
export async function buildAdaptivePlannerAIExplanation(rawInput, options = {}) {
  const env = options.env || (typeof process !== "undefined" ? process.env : {});
  if (!isAdaptivePlannerAIExplainerServerEnabled(env)) {
    return { ok: false, reason: "explainer_disabled" };
  }

  const input = buildStrictPlannerExplainerInput(rawInput);
  if (!input) return { ok: false, reason: "invalid_input" };

  const fallback = getDeterministicPlannerExplanationFallback(input.nextAction);
  const fbValid = validateAdaptivePlannerExplanationText(fallback);
  if (!fbValid.ok) return { ok: false, reason: "fallback_invalid" };

  if (options.preferDeterministicOnly) {
    return { ok: true, text: fbValid.text, source: "deterministic_fallback" };
  }

  const prompt = buildModelPrompt(input);
  try {
    const ai = await callOpenAiChatHebrewExplanation(prompt, env, options.signal);
    if (ai.ok && ai.text) {
      const v = validateAdaptivePlannerExplanationText(ai.text);
      if (v.ok) return { ok: true, text: v.text, source: "ai" };
    }
  } catch {
    /* network / runtime */
  }

  return { ok: true, text: fbValid.text, source: "deterministic_fallback" };
}

/**
 * Server helper: approved Hebrew line from planner nextAction (same as student card).
 * @param {string} nextAction
 */
export function approvedHebrewRecommendationLineFromNextAction(nextAction) {
  return mapPlannerNextActionToHebrew(nextAction);
}
