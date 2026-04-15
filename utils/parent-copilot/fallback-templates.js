/**
 * Deterministic safe answer when validator fails — contract_slot narrative only.
 */

import { narrativeSectionTextHe } from "../contracts/narrative-contract-v1.js";

/**
 * @param {NonNullable<ReturnType<typeof import("./truth-packet-v1.js").buildTruthPacketV1>>} truthPacket
 * @param {string[]} _failCodes
 */
export function buildDeterministicFallbackAnswer(truthPacket, _failCodes) {
  const nar = truthPacket.contracts?.narrative;
  const obs = String(narrativeSectionTextHe("summary", nar) || "").trim();
  const interp = String(narrativeSectionTextHe("finding", nar) || "").trim();
  const lim = String(narrativeSectionTextHe("limitations", nar) || "").trim();

  /** @type {Array<{ type: string; textHe: string; source: "contract_slot" }>} */
  const answerBlocks = [];
  if (obs) answerBlocks.push({ type: "observation", textHe: obs, source: "contract_slot" });
  if (interp) answerBlocks.push({ type: "meaning", textHe: interp, source: "contract_slot" });
  if (lim) answerBlocks.push({ type: "caution", textHe: lim, source: "contract_slot" });
  if (answerBlocks.length < 2) {
    if (!obs && interp) answerBlocks.unshift({ type: "observation", textHe: interp, source: "contract_slot" });
  }
  return { answerBlocks };
}
