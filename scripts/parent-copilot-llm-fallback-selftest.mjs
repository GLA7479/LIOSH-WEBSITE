/**
 * Deterministic checks for grounded LLM primary vs fallback routing helpers.
 * Run: npm run test:parent-copilot-llm-fallback
 */

import {
  getCopilotLlmFallbackConfig,
  isTransientCopilotLlmFailure,
} from "../utils/parent-copilot/copilot-llm-client.js";

let failed = 0;
function ok(name, cond) {
  if (!cond) {
    failed += 1;
    process.stderr.write(`FAIL ${name}\n`);
  } else {
    process.stdout.write(`ok ${name}\n`);
  }
}

ok("transient http_429", isTransientCopilotLlmFailure({ ok: false, reason: "http_429" }));
ok("transient http_503", isTransientCopilotLlmFailure({ ok: false, reason: "http_503", httpStatus: 503 }));
ok("transient network timeout", isTransientCopilotLlmFailure({ ok: false, reason: "network_or_abort:timeout" }));
ok("not transient invalid_json", !isTransientCopilotLlmFailure({ ok: false, reason: "invalid_json_output" }));
ok("not transient missing key", !isTransientCopilotLlmFailure({ ok: false, reason: "missing_gemini_api_key" }));
ok("not transient http_401", !isTransientCopilotLlmFailure({ ok: false, reason: "http_401", httpStatus: 401 }));

const fbKeys = ["PARENT_COPILOT_LLM_FALLBACK_PROVIDER", "PARENT_COPILOT_LLM_FALLBACK_API_KEY", "PARENT_COPILOT_LLM_FALLBACK_MODEL"];
const prevFb = Object.fromEntries(fbKeys.map((k) => [k, process.env[k]]));
try {
  for (const k of fbKeys) delete process.env[k];
  ok("fallback config null when unset", getCopilotLlmFallbackConfig() === null);

  process.env.PARENT_COPILOT_LLM_FALLBACK_PROVIDER = "openrouter";
  process.env.PARENT_COPILOT_LLM_FALLBACK_API_KEY = "test-key";
  process.env.PARENT_COPILOT_LLM_FALLBACK_MODEL = "x/y";
  const cfg = getCopilotLlmFallbackConfig();
  ok("fallback openrouter has baseUrl", !!cfg && cfg.baseUrl.includes("openrouter"));
  ok("fallback telemetryLabel", !!cfg && cfg.telemetryLabel.startsWith("openrouter_chat:"));
} finally {
  for (const k of fbKeys) {
    if (prevFb[k] === undefined) delete process.env[k];
    else process.env[k] = prevFb[k];
  }
}

if (failed) {
  process.stderr.write(`\nparent-copilot-llm-fallback selftest: ${failed} failed\n`);
  process.exit(1);
}
process.stdout.write("\nparent-copilot-llm-fallback selftest: all passed\n");
