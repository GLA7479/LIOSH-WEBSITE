/**
 * Thin OpenAI-compatible HTTP client for the parent-report AI narrative writer.
 *
 * Calls `${BASE_URL}/v1/responses` with `text.format = { type: "json_object" }` so the model
 * returns a JSON-parseable string. The validator in `validate-narrative-output.js` is the
 * authoritative gate; the client never trusts the model's structure.
 *
 * Env (all optional; default OFF without an API key):
 *   PARENT_REPORT_NARRATIVE_LLM_API_KEY  (falls back to OPENAI_API_KEY)
 *   PARENT_REPORT_NARRATIVE_LLM_BASE_URL  (default "https://api.openai.com/v1")
 *   PARENT_REPORT_NARRATIVE_LLM_MODEL     (default "gpt-4.1-mini")
 *   PARENT_REPORT_NARRATIVE_LLM_TIMEOUT_MS (default 25000)
 *   PARENT_REPORT_NARRATIVE_LLM_ENABLED  ("true" to enable; default false)
 *   PARENT_REPORT_NARRATIVE_FORCE_DETERMINISTIC ("true" to skip LLM)
 */

const DEFAULT_TIMEOUT_MS = 25_000;

function envStr(name, env) {
  return String(env?.[name] ?? "").trim();
}

function envBool(name, env) {
  const v = envStr(name, env).toLowerCase();
  return v === "true" || v === "1" || v === "yes" || v === "on";
}

export function isNarrativeLlmEnabled(env) {
  if (!env) env = typeof process !== "undefined" ? process.env : {};
  if (envBool("PARENT_REPORT_NARRATIVE_FORCE_DETERMINISTIC", env)) return false;
  const apiKey = envStr("PARENT_REPORT_NARRATIVE_LLM_API_KEY", env) || envStr("OPENAI_API_KEY", env);
  if (!apiKey) return false;
  if (!envBool("PARENT_REPORT_NARRATIVE_LLM_ENABLED", env)) return false;
  return true;
}

function safeJsonParse(text) {
  if (typeof text !== "string") return null;
  const trimmed = text.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function extractTextFromResponse(body) {
  if (!body || typeof body !== "object") return "";
  if (typeof body.output_text === "string") return body.output_text;
  const outputs = Array.isArray(body.output) ? body.output : [];
  for (const item of outputs) {
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const c of content) {
      if ((c?.type === "output_text" || c?.type === "text") && typeof c.text === "string") {
        return c.text;
      }
    }
  }
  const choice = Array.isArray(body.choices) ? body.choices[0] : null;
  if (choice && typeof choice.message?.content === "string") return choice.message.content;
  return "";
}

/**
 * @param {object} args
 * @param {string} args.prompt
 * @param {AbortSignal} [args.signal]
 * @param {Record<string,string|undefined>} [args.env]
 * @param {(args: { url: string, init: RequestInit }) => Promise<Response>} [args.fetchImpl]
 *   Inject for tests; defaults to global `fetch`.
 * @returns {Promise<{ ok: true, payload: unknown, raw: string } | { ok: false, reason: string, raw?: string }>}
 */
export async function callNarrativeLlm(args) {
  const env = args?.env || (typeof process !== "undefined" ? process.env : {});
  const apiKey = envStr("PARENT_REPORT_NARRATIVE_LLM_API_KEY", env) || envStr("OPENAI_API_KEY", env);
  if (!apiKey) return { ok: false, reason: "missing_api_key" };
  const baseUrl =
    (envStr("PARENT_REPORT_NARRATIVE_LLM_BASE_URL", env) || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = envStr("PARENT_REPORT_NARRATIVE_LLM_MODEL", env) || "gpt-4.1-mini";
  const timeoutMs = Number(envStr("PARENT_REPORT_NARRATIVE_LLM_TIMEOUT_MS", env)) || DEFAULT_TIMEOUT_MS;

  const url = `${baseUrl}/responses`;
  const init = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: args.prompt,
      temperature: 0.3,
      max_output_tokens: 700,
      text: { format: { type: "json_object" } },
    }),
    signal: args.signal,
  };

  const controller = args.signal ? null : new AbortController();
  const timer = controller ? setTimeout(() => controller.abort("timeout"), timeoutMs) : null;
  if (controller) init.signal = controller.signal;

  try {
    const fetchImpl = args.fetchImpl || ((req) => fetch(req.url, req.init));
    const res = await fetchImpl({ url, init });
    if (!res || typeof res.ok !== "boolean") {
      return { ok: false, reason: "invalid_response_object" };
    }
    if (!res.ok) {
      return { ok: false, reason: `http_${res.status}` };
    }
    const body = await res.json();
    const text = extractTextFromResponse(body);
    const parsed = safeJsonParse(String(text || "").trim());
    if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ok: false, reason: "invalid_json_output", raw: String(text || "") };
    }
    return { ok: true, payload: parsed, raw: String(text || "") };
  } catch (error) {
    return {
      ok: false,
      reason: `network_or_abort:${String(error?.message || error || "unknown")}`,
    };
  } finally {
    if (timer) clearTimeout(timer);
  }
}
