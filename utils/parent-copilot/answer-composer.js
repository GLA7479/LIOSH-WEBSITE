/**
 * Composes draft answer blocks from TruthPacketV1 narrative slots only (+ composed glue).
 * Phase C: intent coaching packs, script variants, in-session personalization (no new facts).
 * Polish: adjacent composed de-dup by token overlap.
 */

import { narrativeSectionTextHe } from "../contracts/narrative-contract-v1.js";
import { coachingVariantIndex, applyParentCoachingPacks, pickUncertaintyReasonScript } from "./parent-coaching-packs.js";
import { parentDirectOpenerHe } from "./direct-answer-openers.js";
import { compactParentAnswerBlocks } from "./answer-compaction.js";

/** Fixed Copilot-only clinical boundary copy (Task C / Task G). */
export const CLINICAL_BOUNDARY_LINE_1_HE =
  "על סמך הדוח הזה אי אפשר לקבוע אבחנה או להצמיד תווית קלינית.";
export const CLINICAL_BOUNDARY_LINE_2_HE =
  "הדוח יכול להצביע על תחומים שדורשים חיזוק או המשך מעקב, אבל הוא לא מחליף אבחון מקצועי.";
export const CLINICAL_BOUNDARY_LINE_3_HE =
  "אם יש חשש אמיתי, נכון לשתף מורה או איש מקצוע במה שנראה בפועל, בלי להסיק אבחנה מתוך הדוח בלבד.";

/**
 * @returns {{ answerBlocks: Array<{ type: string; textHe: string; source: "composed" }> }}
 */
export function buildClinicalBoundaryAnswerDraft() {
  return {
    answerBlocks: [
      { type: "observation", textHe: CLINICAL_BOUNDARY_LINE_1_HE, source: "composed" },
      { type: "meaning", textHe: CLINICAL_BOUNDARY_LINE_2_HE, source: "composed" },
      { type: "caution", textHe: CLINICAL_BOUNDARY_LINE_3_HE, source: "composed" },
    ],
  };
}

/**
 * Normalized join of boundary blocks — matches `validateAnswerDraft` joined shape (single spaces between blocks).
 */
export function clinicalBoundaryJoinedFingerprintHe() {
  return [CLINICAL_BOUNDARY_LINE_1_HE, CLINICAL_BOUNDARY_LINE_2_HE, CLINICAL_BOUNDARY_LINE_3_HE].join(" ");
}

/**
 * @param {string} text
 */
function hebrewTokens4(text) {
  return String(text || "")
    .split(/\s+/)
    .map((t) => t.replace(/^[^\u0590-\u05FF]+|[^\u0590-\u05FF]+$/g, ""))
    .filter((t) => t.length >= 4);
}

/**
 * @param {string} a
 * @param {string} b
 */
function tokenOverlapCount4(a, b) {
  const A = new Set(hebrewTokens4(a));
  const B = new Set(hebrewTokens4(b));
  let n = 0;
  for (const t of A) if (B.has(t)) n += 1;
  return n;
}

/**
 * Avoid prepending the same required-hedge fragment when observation/meaning/caution already carry it.
 * Wording-layer only: does not remove hedges from the packet, only skips redundant prefix glue.
 * @param {string} hedge
 * @param {string} reason
 * @param {string} priorSlots
 */
function requiredHedgeAlreadyCoveredInDraft(hedge, reason, priorSlots) {
  const h = String(hedge || "").trim();
  if (!h) return true;
  const bucket = `${priorSlots} ${reason}`.replace(/\s+/g, " ").trim();
  if (!bucket) return false;
  if (bucket.includes(h)) return true;
  if (h === "עדיין מוקדם לקבוע" && (bucket.includes("מוקדם לקבוע") || bucket.includes("עדיין מוקדם"))) return true;
  return false;
}

/**
 * Drop adjacent composed blocks that repeat the same framing (high token overlap).
 * @param {Array<{ type: string; textHe: string; source: string }>} blocks
 */
function dedupeAdjacentOverlappingComposed(blocks) {
  /** @type {typeof blocks} */
  const out = [];
  for (const b of blocks) {
    const prev = out[out.length - 1];
    if (
      prev &&
      b.source === "composed" &&
      prev.source === "composed" &&
      tokenOverlapCount4(String(prev.textHe || ""), String(b.textHe || "")) >= 4
    ) {
      continue;
    }
    out.push(b);
  }
  return out;
}

/**
 * @param {ReturnType<typeof import("./conversation-planner.js").planConversation>} plan
 * @param {NonNullable<ReturnType<typeof import("./truth-packet-v1.js").buildTruthPacketV1>>} truthPacket
 * @param {null|{ intent?: string; continuityRepeat?: boolean; conversationState?: object; turnOrdinal?: number }} [coachingCtx]
 */
export function composeAnswerDraft(plan, truthPacket, coachingCtx = null) {
  const nar = truthPacket.contracts?.narrative;
  const slots = nar?.textSlots && typeof nar.textSlots === "object" ? nar.textSlots : {};
  const obs = String(slots.observation || narrativeSectionTextHe("summary", nar) || "").trim();
  const interp = String(slots.interpretation || narrativeSectionTextHe("finding", nar) || "").trim();
  const act = String(slots.action || narrativeSectionTextHe("recommendation", nar) || "").trim();
  const lim = String(slots.uncertainty || narrativeSectionTextHe("limitations", nar) || "").trim();

  const intentEarly = String(coachingCtx?.intent || plan.intent || "").trim();
  if (intentEarly === "clinical_boundary") {
    return buildClinicalBoundaryAnswerDraft();
  }

  const intent = String(coachingCtx?.intent || plan.intent || "");
  const conv = coachingCtx?.conversationState || null;
  const turnOrd =
    coachingCtx?.turnOrdinal != null
      ? Number(coachingCtx.turnOrdinal)
      : Number(conv?.priorIntents?.length) || 0;
  const scriptIx = conv ? coachingVariantIndex(conv, intent, turnOrd) : 0;

  /** @type {Array<{ type: string; textHe: string; source: "contract_slot"|"composed" }>} */
  const answerBlocks = [];

  for (const b of plan.blockPlan || []) {
    if (b === "observation" && obs) {
      answerBlocks.push({ type: "observation", textHe: obs, source: "contract_slot" });
    }
    if (b === "meaning" && interp) {
      answerBlocks.push({ type: "meaning", textHe: interp, source: "contract_slot" });
    }
    if (b === "next_step" && act) {
      answerBlocks.push({ type: "next_step", textHe: act, source: "contract_slot" });
    }
    if (b === "caution" && lim) {
      answerBlocks.push({ type: "caution", textHe: lim, source: "contract_slot" });
    }
    if (b === "uncertainty_reason") {
      const dl = truthPacket.derivedLimits || {};
      let reason = pickUncertaintyReasonScript(dl, intent, scriptIx);
      const hedges = Array.isArray(truthPacket.allowedClaimEnvelope?.requiredHedges)
        ? truthPacket.allowedClaimEnvelope.requiredHedges.map((h) => String(h || "").trim()).filter(Boolean)
        : [];
      const priorSlotsForHedgeDedup = [obs, interp, lim].filter(Boolean).join(" ");
      for (const h of hedges) {
        if (h && !requiredHedgeAlreadyCoveredInDraft(h, reason, priorSlotsForHedgeDedup)) {
          reason = `${h} — ${reason}`;
        }
      }
      answerBlocks.push({ type: "uncertainty_reason", textHe: reason, source: "composed" });
    }
  }

  if (answerBlocks.length < 2 && obs) {
    answerBlocks.unshift({ type: "observation", textHe: obs, source: "contract_slot" });
  }
  if (answerBlocks.length < 2 && interp) {
    answerBlocks.push({ type: "meaning", textHe: interp, source: "contract_slot" });
  }

  if (!coachingCtx || !intent) {
    return { answerBlocks };
  }

  const packed = applyParentCoachingPacks(answerBlocks, {
    intent,
    truthPacket,
    conversationState: coachingCtx.conversationState,
    continuityRepeat: !!coachingCtx.continuityRepeat,
    turnOrdinal: turnOrd,
    stripParentFacingMeta: true,
  });

  let composed = dedupeAdjacentOverlappingComposed(packed);
  const opener = parentDirectOpenerHe(intent, truthPacket);
  const firstObsIx = composed.findIndex((b) => b.type === "observation" && String(b.textHe || "").trim());
  if (opener && firstObsIx >= 0) {
    const cur = String(composed[firstObsIx].textHe || "").trim();
    composed[firstObsIx] = {
      ...composed[firstObsIx],
      textHe: cur.includes(opener.slice(0, 12)) ? cur : `${opener}\n\n${cur}`.trim(),
    };
  }

  composed = compactParentAnswerBlocks(composed, {
    scopeType: String(truthPacket?.scopeType || ""),
    maxBlocks: truthPacket?.scopeType === "executive" ? 4 : 5,
    maxTotalChars: truthPacket?.scopeType === "executive" ? 1900 : 2400,
  });

  return {
    answerBlocks: composed,
  };
}
