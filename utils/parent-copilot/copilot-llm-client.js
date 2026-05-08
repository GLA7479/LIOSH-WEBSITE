/**
 * Parent Copilot Q&A LLM — OpenAI-compatible `/v1/responses` or Gemini `generateContent`.
 *
 * Env:
 *   PARENT_COPILOT_LLM_PROVIDER     "openai" | "gemini" (default "openai")
 *   PARENT_COPILOT_LLM_BASE_URL     OpenAI default https://api.openai.com/v1
 *   PARENT_COPILOT_LLM_MODEL
 *   PARENT_COPILOT_LLM_API_KEY      OpenAI key when provider=openai
 *   PARENT_COPILOT_LLM_TIMEOUT_MS
 *   GEMINI_API_KEY / GOOGLE_API_KEY when provider=gemini (or PARENT_COPILOT_LLM_API_KEY override)
 */

function envStr(name, fallback = "") {
  try {
    const v = typeof process !== "undefined" && process.env ? process.env[name] : undefined;
    return String(v ?? "").trim() || fallback;
  } catch {
    return fallback;
  }
}

function getProvider() {
  const v = envStr("PARENT_COPILOT_LLM_PROVIDER").toLowerCase();
  if (v === "gemini" || v === "google" || v === "google-gemini") return "gemini";
  return "openai";
}

function getGeminiApiKey() {
  return envStr("PARENT_COPILOT_LLM_API_KEY") || envStr("GEMINI_API_KEY") || envStr("GOOGLE_API_KEY");
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

function extractGeminiText(body) {
  if (!body || typeof body !== "object") return "";
  const candidates = Array.isArray(body.candidates) ? body.candidates : [];
  for (const c of candidates) {
    const parts = Array.isArray(c?.content?.parts) ? c.content.parts : [];
    const t = parts.map((p) => (typeof p?.text === "string" ? p.text : "")).join("");
    if (t) return t;
  }
  return "";
}

function extractOpenAiText(body) {
  if (!body || typeof body !== "object") return "";
  if (typeof body.output_text === "string") return body.output_text;
  const outputs = Array.isArray(body.output) ? body.output : [];
  for (const item of outputs) {
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const c of content) {
      if ((c?.type === "output_text" || c?.type === "text") && typeof c.text === "string") return c.text;
    }
  }
  const choice = Array.isArray(body.choices) ? body.choices[0] : null;
  if (choice?.message?.content) return String(choice.message.content);
  return "";
}

/**
 * @param {AbortSignal} signal — caller owns timeout via AbortController (see llm-orchestrator).
 * @param {string} prompt
 * @returns {Promise<{ ok: boolean; payload?: unknown; reason?: string; raw?: string }>}
 */
export async function callCopilotLlmJson(signal, prompt) {
  const provider = getProvider();

  try {
    if (provider === "gemini") {
      const apiKey = getGeminiApiKey();
      if (!apiKey) return { ok: false, reason: "missing_gemini_api_key" };
      const baseUrl = envStr("PARENT_COPILOT_LLM_BASE_URL", "https://generativelanguage.googleapis.com/v1beta").replace(
        /\/$/,
        "",
      );
      const model = envStr("PARENT_COPILOT_LLM_MODEL", "gemini-2.5-flash");
      const url = `${baseUrl}/models/${encodeURIComponent(model)}:generateContent`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 900,
            responseMimeType: "application/json",
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
        signal,
      });
      if (!res.ok) return { ok: false, reason: `http_${res.status}` };
      const body = await res.json();
      const raw = extractGeminiText(body);
      const parsed = safeJsonParse(String(raw || "").trim());
      if (!parsed.ok) return { ok: false, reason: "invalid_json_output", raw: String(raw || "") };
      return { ok: true, payload: parsed.value, raw: String(raw || "") };
    }

    const url = envStr("PARENT_COPILOT_LLM_BASE_URL", "https://api.openai.com/v1/responses");
    const apiKey = envStr("PARENT_COPILOT_LLM_API_KEY");
    const model = envStr("PARENT_COPILOT_LLM_MODEL", "gpt-4.1-mini");
    if (!apiKey) return { ok: false, reason: "missing_api_key" };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
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
    const maybeText = extractOpenAiText(body);
    const parsed = safeJsonParse(String(maybeText || "").trim());
    if (!parsed.ok) return { ok: false, reason: "invalid_json_output", raw: String(maybeText || "") };
    return { ok: true, payload: parsed.value, raw: String(maybeText || "") };
  } catch (e) {
    return { ok: false, reason: `network_or_abort:${String(e?.message || e)}` };
  }
}

export function copilotLlmProviderLabel() {
  return getProvider() === "gemini" ? "gemini" : "openai_compatible";
}
