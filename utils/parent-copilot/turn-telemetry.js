/**
 * Turn-level quality telemetry for Parent Copilot.
 * Pure helpers only (no side effects).
 */

/**
 * @param {Array<{ type?: string; textHe?: string; source?: string }>} answerBlocks
 * @param {NonNullable<ReturnType<typeof import("./truth-packet-v1.js").buildTruthPacketV1>> | null} truthPacket
 */
export function measureGroundedness(answerBlocks, truthPacket) {
  const blocks = Array.isArray(answerBlocks) ? answerBlocks : [];
  if (!blocks.length || !truthPacket) return { score: 0, coveredBlocks: 0, totalBlocks: blocks.length };

  const nar = truthPacket.contracts?.narrative?.textSlots || {};
  const slotBundle = [
    String(nar.observation || ""),
    String(nar.interpretation || ""),
    String(nar.action || ""),
    String(nar.uncertainty || ""),
  ]
    .filter(Boolean)
    .join(" ");

  const sfQ = Math.max(0, Math.round(Number(truthPacket.surfaceFacts?.questions ?? 0)));

  let covered = 0;
  for (const b of blocks) {
    const txt = String(b?.textHe || "").trim();
    if (!txt) continue;
    if (String(b?.source || "") === "contract_slot") {
      covered += 1;
      continue;
    }
    const firstChunk = txt.slice(0, Math.min(42, txt.length));
    if (firstChunk && slotBundle.includes(firstChunk)) {
      covered += 1;
      continue;
    }
    if (sfQ > 0 && /\d/.test(txt) && (txt.includes(String(sfQ)) || new RegExp(`${sfQ}\\s*שאלות`, "u").test(txt))) {
      covered += 1;
    }
  }
  const score = Math.round((covered / Math.max(1, blocks.length)) * 100);
  return { score, coveredBlocks: covered, totalBlocks: blocks.length };
}

/**
 * @param {Array<{ textHe?: string }>} answerBlocks
 */
export function measureGenericness(answerBlocks) {
  const blocks = Array.isArray(answerBlocks) ? answerBlocks : [];
  const text = blocks.map((b) => String(b?.textHe || "")).join(" ").trim();
  if (!text) return { score: 100, repeatedCueCount: 0 };
  const cues = ["נכון לעכשיו", "בשלב זה", "ממשיכים לעקוב", "עדיין מוקדם לקבוע", "כדאי להמשיך לעקוב"];
  let hits = 0;
  for (const cue of cues) {
    if (text.includes(cue)) hits += 1;
  }
  const uniqWords = new Set(text.split(/\s+/).filter((x) => x.length > 2));
  const lexicalRichness = uniqWords.size / Math.max(1, text.split(/\s+/).length);
  const score = Math.max(0, Math.min(100, Math.round(35 + hits * 12 + (1 - lexicalRichness) * 45)));
  return { score, repeatedCueCount: hits };
}

/**
 * @param {object} input
 * @param {string} input.intent
 * @param {number} input.intentConfidence
 * @param {string} input.intentReason
 * @param {number} input.scopeConfidence
 * @param {string} input.scopeReason
 * @param {Array<{ type?: string; textHe?: string; source?: string }>} input.answerBlocks
 * @param {boolean} input.fallbackUsed
 * @param {string[]} input.validatorFailCodes
 * @param {boolean} input.semanticAggregateSatisfied
 * @param {string} input.generationPath
 * @param {NonNullable<ReturnType<typeof import("./truth-packet-v1.js").buildTruthPacketV1>> | null} input.truthPacket
 */
export function buildTurnTelemetry(input) {
  const groundedness = measureGroundedness(input.answerBlocks, input.truthPacket);
  const genericness = measureGenericness(input.answerBlocks);
  const fallbackReasonCodes = Array.isArray(input.fallbackReasonCodes)
    ? input.fallbackReasonCodes
    : Array.isArray(input.validatorFailCodes) && input.fallbackUsed
      ? input.validatorFailCodes
      : [];
  const traceId = String(input.traceId || `pc_trace_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`);
  const resolutionStatus = String(input.resolutionStatus || "resolved");
  const scopeType = input.scopeType == null ? null : String(input.scopeType);
  const scopeId = input.scopeId == null ? null : String(input.scopeId);
  const llmAttempt =
    input.llmAttempt && typeof input.llmAttempt === "object"
      ? {
          ok: !!input.llmAttempt.ok,
          reason: String(input.llmAttempt.reason || ""),
          ...(input.llmAttempt.provider ? { provider: String(input.llmAttempt.provider) } : {}),
          ...(input.llmAttempt.httpStatus != null ? { httpStatus: Number(input.llmAttempt.httpStatus) } : {}),
          ...(typeof input.llmAttempt.geminiErrorSummary === "string" && input.llmAttempt.geminiErrorSummary
            ? { geminiErrorSummary: String(input.llmAttempt.geminiErrorSummary) }
            : {}),
          ...(typeof input.llmAttempt.geminiErrorBody === "string" && input.llmAttempt.geminiErrorBody
            ? { geminiErrorBody: String(input.llmAttempt.geminiErrorBody) }
            : {}),
          ...(typeof input.llmAttempt.llmRetryCount === "number" ? { llmRetryCount: input.llmAttempt.llmRetryCount } : {}),
          ...(typeof input.llmAttempt.primaryProvider === "string" && input.llmAttempt.primaryProvider.trim()
            ? { primaryProvider: String(input.llmAttempt.primaryProvider).trim() }
            : {}),
          ...(typeof input.llmAttempt.primaryReason === "string" && input.llmAttempt.primaryReason.trim()
            ? { primaryReason: String(input.llmAttempt.primaryReason).trim() }
            : {}),
          ...(typeof input.llmAttempt.fallbackProvider === "string" && input.llmAttempt.fallbackProvider.trim()
            ? { fallbackProvider: String(input.llmAttempt.fallbackProvider).trim() }
            : {}),
          ...(typeof input.llmAttempt.fallbackReason === "string" && input.llmAttempt.fallbackReason.trim()
            ? { fallbackReason: String(input.llmAttempt.fallbackReason).trim() }
            : {}),
          ...(typeof input.llmAttempt.finalProvider === "string" && input.llmAttempt.finalProvider.trim()
            ? { finalProvider: String(input.llmAttempt.finalProvider).trim() }
            : {}),
          ...(Array.isArray(input.llmAttempt.fallbackModels) && input.llmAttempt.fallbackModels.length
            ? { fallbackModels: [...input.llmAttempt.fallbackModels] }
            : {}),
          ...(Array.isArray(input.llmAttempt.fallbackAttempts) && input.llmAttempt.fallbackAttempts.length
            ? {
                fallbackAttempts: input.llmAttempt.fallbackAttempts.map((a) =>
                  a && typeof a === "object" ? { ...a } : a,
                ),
              }
            : {}),
          ...(typeof input.llmAttempt.invalidJsonRawPreview === "string" && input.llmAttempt.invalidJsonRawPreview.trim()
            ? { invalidJsonRawPreview: String(input.llmAttempt.invalidJsonRawPreview).slice(0, 3000) }
            : {}),
        }
      : null;
  return {
    schemaVersion: "v1",
    traceId,
    intent: {
      value: input.intent,
      confidence: Number(input.intentConfidence || 0),
      reason: String(input.intentReason || "unknown"),
    },
    scope: {
      confidence: Number(input.scopeConfidence || 0),
      reason: String(input.scopeReason || "unknown"),
    },
    generationPath: String(input.generationPath || "deterministic"),
    fallbackUsed: !!input.fallbackUsed,
    semanticAggregateSatisfied: !!input.semanticAggregateSatisfied,
    fallbackReasonCodes: [...new Set(fallbackReasonCodes.map((x) => String(x || "")).filter(Boolean))],
    trace: {
      resolutionStatus,
      scopeType,
      scopeId,
      branchOutcomes: {
        generationPath: String(input.generationPath || "deterministic"),
        fallbackUsed: !!input.fallbackUsed,
        semanticAggregateSatisfied: !!input.semanticAggregateSatisfied,
        llmAttempt,
      },
    },
    quality: {
      groundednessScore: groundedness.score,
      genericnessScore: genericness.score,
      groundedCoveredBlocks: groundedness.coveredBlocks,
      groundedTotalBlocks: groundedness.totalBlocks,
      repeatedCueCount: genericness.repeatedCueCount,
    },
    validator: {
      failCodes: Array.isArray(input.validatorFailCodes) ? [...input.validatorFailCodes] : [],
      status: Array.isArray(input.validatorFailCodes) && input.validatorFailCodes.length ? "fail" : "pass",
    },
    timestampMs: Date.now(),
  };
}

export default {
  buildTurnTelemetry,
  measureGroundedness,
  measureGenericness,
};
