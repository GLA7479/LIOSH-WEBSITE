/**
 * Phase 4 (approved scope): NarrativeContract only.
 * Deterministic gate-to-text binding for parent-facing wording.
 */

export const NARRATIVE_CONTRACT_VERSION = "v1";

export const WORDING_ENVELOPES = Object.freeze(["WE0", "WE1", "WE2", "WE3", "WE4"]);
export const HEDGE_LEVELS = Object.freeze(["none", "light", "mandatory"]);
export const ALLOWED_SECTIONS = Object.freeze(["summary", "finding", "recommendation", "limitations"]);
export const RECOMMENDATION_INTENSITY = Object.freeze(["RI0", "RI1", "RI2", "RI3"]);

const RI_RANK = { RI0: 0, RI1: 1, RI2: 2, RI3: 3 };
const ENVELOPE_CAP = { WE0: "RI0", WE1: "RI1", WE2: "RI1", WE3: "RI2", WE4: "RI3" };
const ENVELOPE_HEDGE = { WE0: "mandatory", WE1: "mandatory", WE2: "light", WE3: "light", WE4: "none" };

const REQUIRED_HEDGES_BY_LEVEL = {
  none: [],
  light: ["נכון לעכשיו", "כדאי להמשיך לעקוב"],
  mandatory: ["בשלב זה", "עדיין מוקדם לקבוע"],
};

const FORBIDDEN_PHRASES = Object.freeze([
  "בטוח לחלוטין",
  "בוודאות מלאה",
  "ללא ספק בכלל",
  "חד משמעית",
]);

function normalizeTopicKey(v) {
  const s = String(v ?? "").trim();
  return s || "__unknown_topic__";
}

function normalizeSubjectId(v) {
  const s = String(v ?? "").trim();
  return s || "__unknown_subject__";
}

function normalizeDisplayName(v) {
  const s = String(v ?? "").trim();
  return s || "הנושא";
}

function normalizeReadiness(value) {
  const r = String(value || "").trim().toLowerCase();
  if (r === "ready") return "ready";
  if (r === "forming" || r === "partial" || r === "moderate") return "forming";
  return "insufficient";
}

function normalizeConfidenceBand(value) {
  const c = String(value || "").trim().toLowerCase();
  if (c === "high") return "high";
  if (c === "medium" || c === "moderate") return "medium";
  return "low";
}

function normalizeDecisionTier(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.max(0, Math.min(4, Math.round(n)));
}

function normalizeRecommendationIntensity(value) {
  const key = String(value || "").trim().toUpperCase();
  if (RECOMMENDATION_INTENSITY.includes(key)) return key;
  if (key === "LIGHT") return "RI1";
  if (key === "FOCUSED") return "RI2";
  if (key === "TARGETED") return "RI3";
  return "RI0";
}

function deriveCannotConcludeYet(input) {
  if (input?.cannotConcludeYet === true) return true;
  if (input?.suppressAggressiveStep === true) return true;
  if (input?.contractsV1?.decision?.cannotConcludeYet === true) return true;
  const forbidden = Array.isArray(input?.contractsV1?.recommendation?.forbiddenBecause)
    ? input.contractsV1.recommendation.forbiddenBecause
    : [];
  return forbidden.includes("cannot_conclude_yet");
}

function deriveRecommendationEligibility(input) {
  const rec = input?.contractsV1?.recommendation;
  if (rec && typeof rec === "object") return !!rec.eligible;
  return false;
}

function deriveEnvelope(input) {
  const readiness = normalizeReadiness(input?.contractsV1?.readiness?.readiness);
  const confidenceBand = normalizeConfidenceBand(input?.contractsV1?.confidence?.confidenceBand);
  const decisionTier = normalizeDecisionTier(input?.contractsV1?.decision?.decisionTier);
  const cannotConcludeYet = deriveCannotConcludeYet(input);
  const eligible = deriveRecommendationEligibility(input);
  const recIntensity = normalizeRecommendationIntensity(input?.contractsV1?.recommendation?.intensity);

  if (cannotConcludeYet || readiness === "insufficient" || confidenceBand === "low") return "WE0";
  if (readiness === "forming" || decisionTier <= 1) return "WE1";
  if (decisionTier <= 2 || confidenceBand === "medium") return "WE2";
  if (eligible && readiness === "ready" && confidenceBand === "high" && RI_RANK[recIntensity] >= 2) return "WE4";
  return "WE3";
}

function buildObservationSlot(displayName, q, acc) {
  if (q <= 0) return `ב${displayName} עדיין אין מספיק תרגול בטווח כדי לסכם תמונה יציבה.`;
  return `ב${displayName} נצפו ${q} שאלות, עם דיוק של כ־${acc}%.`;
}

function buildInterpretationSlot(envelope, cannotConcludeYet) {
  if (cannotConcludeYet || envelope === "WE0") {
    return "בשלב זה לא קובעים מסקנה יציבה, והכיוון עדיין בבדיקה.";
  }
  if (envelope === "WE1") return "יש סימנים התחלתיים, אך עדיין חסרה בשלות לקביעה חזקה.";
  if (envelope === "WE2") return "יש כיוון עבודה סביר, ועדיין נדרש אישור נוסף לפני מסקנה חזקה.";
  if (envelope === "WE3") return "הכיוון נראה עקבי יחסית בטווח הנוכחי, תוך המשך מעקב.";
  return "נראית עקביות טובה יחסית בטווח, ועדיין ממשיכים לאמת אותה לאורך זמן.";
}

function buildActionSlot(capIntensity, eligible) {
  if (!eligible || capIntensity === "RI0") return null;
  if (capIntensity === "RI1") return "מומלץ תרגול קצר וממוקד באותה רמה לפני שינוי.";
  if (capIntensity === "RI2") return "מומלץ חיזוק ממוקד ובדיקת עצמאות קצרה לפני קידום.";
  return "אפשר לשקול צעד התקדמות מדוד בנושא זה בלבד.";
}

function buildUncertaintySlot(hedgeLevel) {
  if (hedgeLevel === "mandatory") return "בשלב זה ועדיין מוקדם לקבוע סופית, לכן ממשיכים במעקב זהיר.";
  if (hedgeLevel === "light") return "נכון לעכשיו כדאי להמשיך לעקוב ולאמת את הכיוון בסבב הקרוב.";
  return null;
}

/**
 * @param {object} input
 */
export function buildNarrativeContractV1(input) {
  const topicKey = normalizeTopicKey(input?.topicKey || input?.topicRowKey);
  const subjectId = normalizeSubjectId(input?.subjectId);
  const displayName = normalizeDisplayName(input?.displayName);
  const q = Math.max(0, Number(input?.questions ?? input?.q) || 0);
  const acc = Math.max(0, Math.min(100, Math.round(Number(input?.accuracy) || 0)));
  const envelope = deriveEnvelope(input);
  const hedgeLevel = ENVELOPE_HEDGE[envelope] || "mandatory";
  const cannotConcludeYet = deriveCannotConcludeYet(input);
  const recommendationEligible = deriveRecommendationEligibility(input);
  const existingIntensity = normalizeRecommendationIntensity(input?.contractsV1?.recommendation?.intensity);
  const capIntensity = ENVELOPE_CAP[envelope] || "RI0";
  const cappedIntensity = RI_RANK[existingIntensity] > RI_RANK[capIntensity] ? capIntensity : existingIntensity;

  return {
    contractVersion: NARRATIVE_CONTRACT_VERSION,
    topicKey,
    subjectId,
    wordingEnvelope: envelope,
    hedgeLevel,
    allowedTone: "parent_professional_warm",
    forbiddenPhrases: [...FORBIDDEN_PHRASES],
    requiredHedges: [...(REQUIRED_HEDGES_BY_LEVEL[hedgeLevel] || [])],
    allowedSections: [...ALLOWED_SECTIONS],
    recommendationIntensityCap: capIntensity,
    textSlots: {
      observation: buildObservationSlot(displayName, q, acc),
      interpretation: buildInterpretationSlot(envelope, cannotConcludeYet),
      action: buildActionSlot(cappedIntensity, recommendationEligible),
      uncertainty: buildUncertaintySlot(hedgeLevel),
    },
  };
}

/**
 * @param {unknown} contract
 */
export function validateNarrativeContractV1(contract) {
  const c = contract && typeof contract === "object" ? contract : {};
  const errors = [];
  if (c.contractVersion !== NARRATIVE_CONTRACT_VERSION) errors.push("contractVersion must be v1");
  if (!String(c.topicKey || "").trim()) errors.push("topicKey is required");
  if (!String(c.subjectId || "").trim()) errors.push("subjectId is required");
  if (!WORDING_ENVELOPES.includes(String(c.wordingEnvelope || ""))) errors.push("wordingEnvelope invalid");
  if (!HEDGE_LEVELS.includes(String(c.hedgeLevel || ""))) errors.push("hedgeLevel invalid");
  if (c.allowedTone !== "parent_professional_warm") errors.push("allowedTone invalid");
  if (!Array.isArray(c.forbiddenPhrases)) errors.push("forbiddenPhrases must be array");
  if (!Array.isArray(c.requiredHedges)) errors.push("requiredHedges must be array");
  if (!Array.isArray(c.allowedSections)) errors.push("allowedSections must be array");
  if (!RECOMMENDATION_INTENSITY.includes(String(c.recommendationIntensityCap || ""))) {
    errors.push("recommendationIntensityCap invalid");
  }
  if (!c.textSlots || typeof c.textSlots !== "object") errors.push("textSlots must be object");
  if (!String(c?.textSlots?.observation || "").trim()) errors.push("textSlots.observation required");
  if (!String(c?.textSlots?.interpretation || "").trim()) errors.push("textSlots.interpretation required");
  if (String(c.hedgeLevel || "") === "mandatory" && !String(c?.textSlots?.uncertainty || "").trim()) {
    errors.push("mandatory hedge requires textSlots.uncertainty");
  }
  if (String(c.recommendationIntensityCap || "") === "RI0" && c?.textSlots?.action) {
    errors.push("RI0 cap forbids action text");
  }
  return { ok: errors.length === 0, errors };
}

/**
 * @param {"summary"|"finding"|"recommendation"|"limitations"} section
 * @param {any} narrativeContract
 */
export function narrativeSectionTextHe(section, narrativeContract) {
  const c = narrativeContract && typeof narrativeContract === "object" ? narrativeContract : null;
  if (!c || !c.textSlots) return "";
  if (section === "summary") return String(c.textSlots.observation || "").trim();
  if (section === "finding") return String(c.textSlots.interpretation || "").trim();
  if (section === "recommendation") return String(c.textSlots.action || "").trim();
  if (section === "limitations") return String(c.textSlots.uncertainty || "").trim();
  return "";
}

/**
 * @param {object} rec
 * @param {object} narrativeContract
 * @param {{ ok: boolean, errors: string[] }} [validation]
 */
export function applyNarrativeContractToRecord(rec, narrativeContract, validation = null) {
  const existingContracts =
    rec?.contractsV1 && typeof rec.contractsV1 === "object" ? rec.contractsV1 : {};
  const v =
    validation && typeof validation === "object"
      ? { ok: !!validation.ok, errors: Array.isArray(validation.errors) ? validation.errors : [] }
      : { ok: true, errors: [] };
  return {
    ...rec,
    contractsV1: {
      ...existingContracts,
      narrative: narrativeContract,
      narrativeValidation: v,
    },
  };
}
