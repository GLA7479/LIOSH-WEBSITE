import { str } from "./str-utils.js";

/**
 * Match a bank row or finalized question against an active probe (shared contract fields).
 * Reads `params` first, then top-level fields on `bankQuestion`.
 *
 * @param {Record<string, unknown>} bankQuestion
 * @param {import("./build-pending-probe.js").PendingDiagnosticProbe} probe
 * @returns {{ matches: boolean, reason: string }}
 */
export function bankQuestionProbeMatch(bankQuestion, probe) {
  const p =
    bankQuestion?.params && typeof bankQuestion.params === "object"
      ? bankQuestion.params
      : {};
  const skill = str(p.diagnosticSkillId ?? bankQuestion?.diagnosticSkillId);
  if (probe.diagnosticSkillId && skill === probe.diagnosticSkillId) {
    return { matches: true, reason: "matched_diagnosticSkillId" };
  }
  const dom = probe.dominantTag;
  const expected =
    Array.isArray(p.expectedErrorTags)
      ? p.expectedErrorTags
      : Array.isArray(bankQuestion?.expectedErrorTags)
        ? bankQuestion.expectedErrorTags
        : null;
  if (dom && Array.isArray(expected) && expected.includes(dom)) {
    return { matches: true, reason: "matched_expectedErrorTags" };
  }
  const pf = str(p.patternFamily ?? bankQuestion?.patternFamily);
  if (probe.patternFamily && pf === probe.patternFamily) {
    return { matches: true, reason: "matched_patternFamily" };
  }
  const ct = str(p.conceptTag ?? bankQuestion?.conceptTag);
  if (probe.conceptTag && ct === probe.conceptTag) {
    return { matches: true, reason: "matched_conceptTag" };
  }
  return { matches: false, reason: "no_match" };
}
