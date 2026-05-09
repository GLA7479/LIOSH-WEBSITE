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

function sleepMs(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Best-effort summary for Google Generative Language API JSON errors (quota, rate limit, overload). */
function summarizeGeminiHttpError(parsed, httpStatus) {
  if (!parsed || typeof parsed !== "object") return `HTTP ${httpStatus} (non-JSON or empty body)`;
  const err = parsed.error;
  if (!err || typeof err !== "object") {
    try {
      return `HTTP ${httpStatus}: ${JSON.stringify(parsed).slice(0, 500)}`;
    } catch {
      return `HTTP ${httpStatus}`;
    }
  }
  const bits = [];
  if (err.status) bits.push(`API status: ${err.status}`);
  if (err.code != null) bits.push(`code: ${err.code}`);
  if (err.message) bits.push(String(err.message));
  const details = Array.isArray(err.details) ? err.details : [];
  for (const d of details.slice(0, 3)) {
    if (d && typeof d === "object" && d["@type"]) bits.push(`detail: ${d["@type"]}`);
    if (d && typeof d === "object" && d.reason) bits.push(`reason: ${d.reason}`);
  }
  return bits.length ? bits.join(" · ") : `HTTP ${httpStatus}`;
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
 * @returns {Promise<{ ok: boolean; payload?: unknown; reason?: string; raw?: string; httpStatus?: number; geminiErrorBody?: string; geminiErrorSummary?: string; geminiErrorParsed?: unknown; llmRetryCount?: number }>}
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
      const maxAttempts = 3;
      const backoffMs = [2000, 5000];

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
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
        const rawText = await res.text();
        let parsedBody = null;
        try {
          parsedBody = JSON.parse(rawText);
        } catch {
          parsedBody = null;
        }

        if (res.ok) {
          const body = parsedBody && typeof parsedBody === "object" ? parsedBody : {};
          const raw = extractGeminiText(body);
          const parsed = safeJsonParse(String(raw || "").trim());
          if (!parsed.ok) {
            return {
              ok: false,
              reason: "invalid_json_output",
              raw: String(raw || ""),
              httpStatus: res.status,
              llmRetryCount: attempt,
            };
          }
          return {
            ok: true,
            payload: parsed.value,
            raw: String(raw || ""),
            llmRetryCount: attempt,
          };
        }

        const is429 = res.status === 429;
        const canRetry = is429 && attempt < maxAttempts - 1;
        if (canRetry) {
          await sleepMs(backoffMs[attempt] ?? backoffMs[backoffMs.length - 1]);
          continue;
        }

        const summary = summarizeGeminiHttpError(parsedBody, res.status);
        return {
          ok: false,
          reason: `http_${res.status}`,
          httpStatus: res.status,
          geminiErrorBody: rawText,
          geminiErrorSummary: summary,
          geminiErrorParsed: parsedBody,
          llmRetryCount: attempt,
        };
      }
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
