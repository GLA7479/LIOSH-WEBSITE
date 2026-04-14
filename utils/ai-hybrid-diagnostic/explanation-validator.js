import { NUMERIC_GATES } from "./constants.js";

const FORBIDDEN_SUBSTRINGS = [
  "אבחון קליני",
  "ADHD",
  "מוגבל לומד",
  "לא יכול ללמוד",
  "תמיד ייכשל",
  "אין לו סיכוי",
  "אוטיזם",
  "דיסלקציה",
  "חוסר תקינות",
];

const UNCERTAINTY_MARKERS = [
  "אין די נתונים",
  "לא חד משמעי",
  "מידת הוודאות",
  "אי־ודאות",
  "אין מספיק ראיות",
  "לא ניתן לקבוע",
];

/**
 * @param {object} p
 * @param {string} p.text
 * @param {boolean} p.requireUncertainty
 * @param {string[]} p.evidenceRefs
 */
export function validateExplanationOutput({ text, requireUncertainty, evidenceRefs }) {
  const t = String(text || "");
  /** @type {string[]} */
  const reasonCodes = [];

  let forbiddenClaimPass = true;
  for (const sub of FORBIDDEN_SUBSTRINGS) {
    if (t.includes(sub)) {
      forbiddenClaimPass = false;
      reasonCodes.push(`forbidden_substring:${sub}`);
    }
  }

  const uncertaintyCompliancePass =
    !requireUncertainty || UNCERTAINTY_MARKERS.some((m) => t.includes(m));

  if (requireUncertainty && !uncertaintyCompliancePass) reasonCodes.push("missing_uncertainty_sentence");

  const evidenceLinkPass =
    Array.isArray(evidenceRefs) &&
    evidenceRefs.length > 0 &&
    evidenceRefs.every((r) => typeof r === "string" && (r.startsWith("evidence:") || r.startsWith("taxonomy:")));

  if (!evidenceLinkPass) reasonCodes.push("evidence_refs_invalid");

  const boundaryPass = forbiddenClaimPass;
  const overallPass =
    boundaryPass &&
    evidenceLinkPass &&
    uncertaintyCompliancePass &&
    forbiddenClaimPass;

  return {
    boundaryPass,
    evidenceLinkPass,
    uncertaintyCompliancePass,
    forbiddenClaimPass,
    overallPass,
    reasonCodes,
    gateRef: {
      ambiguityThreshold: NUMERIC_GATES.ambiguityUncertaintyLineThreshold,
      evidenceLinkPassMin: NUMERIC_GATES.explanationEvidenceLinkPassMin,
    },
  };
}
