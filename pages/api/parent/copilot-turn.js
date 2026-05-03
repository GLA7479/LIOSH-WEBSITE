/**
 * Server-side Parent Copilot turn — runs `runParentCopilotTurnAsync` so LLM keys stay server-only.
 * Short parent report is often localStorage-backed; client sends the same detailed payload used by ParentCopilotShell.
 *
 * Does not mutate stored reports, banks, or planner output — same contract as client-side engine.
 */

import { runParentCopilotTurnAsync } from "../../../utils/parent-copilot/index.js";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "2mb",
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "object" && req.body ? req.body : {};
    const utterance = String(body.utterance || "").trim();
    const sessionId = String(body.sessionId || "").trim() || "default";
    const audience = String(body.audience || "parent").trim() || "parent";
    const payload = body.payload;

    if (!payload || typeof payload !== "object") {
      return res.status(400).json({ ok: false, error: "Missing payload" });
    }
    if (!utterance) {
      return res.status(400).json({ ok: false, error: "Missing utterance" });
    }

    const selectedContextRef = body.selectedContextRef ?? null;
    const clickedFollowupFamily = body.clickedFollowupFamily ?? null;

    const result = await runParentCopilotTurnAsync({
      audience,
      payload,
      utterance,
      sessionId,
      selectedContextRef,
      clickedFollowupFamily,
    });

    return res.status(200).json({ ok: true, result });
  } catch (e) {
    const msg = String(e?.message || e || "copilot_turn_failed");
    return res.status(500).json({ ok: false, error: msg });
  }
}
