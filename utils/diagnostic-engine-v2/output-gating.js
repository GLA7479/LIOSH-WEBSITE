/**
 * שערי פלט — stage1 §11 (מימוש כללי לפי ביטחון + עדיפות + ראיות).
 */

/**
 * @param {object} p
 * @param {import("./confidence-policy.js").ConfidenceLevel} p.confidence
 * @param {import("./priority-policy.js").PriorityLevel} p.priority
 * @param {boolean} p.recurrenceFull
 * @param {boolean} p.counterEvidenceStrong
 * @param {boolean} p.hasTaxonomyMatch
 * @param {boolean} p.narrowSample
 * @param {boolean} [p.weakEvidence]
 * @param {boolean} [p.hintInvalidates]
 * @param {number} [p.questions]
 * @param {number} [p.accuracy]
 * @param {number} [p.wrong]
 * @param {boolean} [p.needsPractice]
 * @param {boolean} [p.stableMasteryTag]
 * @param {number} [p.wrongCountForRules]
 */
export function applyOutputGating(p) {
  const {
    confidence,
    priority,
    recurrenceFull,
    counterEvidenceStrong,
    hasTaxonomyMatch,
    narrowSample,
    weakEvidence = false,
    hintInvalidates = false,
    questions = 0,
    accuracy = 0,
    wrong = 0,
    needsPractice = false,
    stableMasteryTag = false,
    wrongCountForRules = 0,
  } = p;

  const q = Math.max(0, Number(questions) || 0);
  const accRaw = Number(accuracy);
  const accNum = Number.isFinite(accRaw) ? accRaw : 0;
  const w = Math.max(0, Number(wrong) || 0);
  const wrongRatio = q > 0 ? w / q : 0;

  const positiveAuthorityEligible =
    !!stableMasteryTag ||
    (q >= 10 && accNum >= 90 && wrongRatio <= 0.2 && !needsPractice);

  /** @type {"none" | "good" | "very_good" | "excellent"} */
  let positiveAuthorityLevel = "none";
  if (positiveAuthorityEligible) {
    if (q >= 20 && accNum >= 95 && wrongRatio <= 0.05) {
      positiveAuthorityLevel = "excellent";
    } else if (q >= 20 && accNum >= 90 && wrongRatio <= 0.15) {
      positiveAuthorityLevel = "very_good";
    } else {
      positiveAuthorityLevel = "good";
    }
  }

  const hardDeny =
    confidence === "contradictory" ||
    counterEvidenceStrong ||
    weakEvidence ||
    confidence === "insufficient_data" ||
    (hintInvalidates && confidence === "early_signal_only");

  const positiveConclusionAllowed = positiveAuthorityEligible && !hardDeny;

  const confStr = String(confidence || "");
  const additiveCautionAllowed =
    positiveConclusionAllowed &&
    (recurrenceFull || wrongCountForRules >= 2 || confStr === "moderate");

  /** @type {string[]} */
  const positiveAuthorityReasonCodes = [];
  if (!positiveAuthorityEligible) positiveAuthorityReasonCodes.push("below_positive_eligibility_floor");
  if (confidence === "contradictory") positiveAuthorityReasonCodes.push("contradictory");
  if (counterEvidenceStrong) positiveAuthorityReasonCodes.push("counter_evidence_strong");
  if (weakEvidence) positiveAuthorityReasonCodes.push("weak_evidence");
  if (confidence === "insufficient_data") positiveAuthorityReasonCodes.push("insufficient_data");
  if (hintInvalidates && confidence === "early_signal_only") {
    positiveAuthorityReasonCodes.push("early_signal_invalidated");
  }

  const reasons = /** @type {string[]} */ ([]);

  const base = () => ({
    diagnosisAllowed: false,
    confidenceOnly: false,
    probeOnly: false,
    interventionAllowed: false,
    cannotConcludeYet: hardDeny,
    humanReviewRecommended: priority === "P4",
    reasons,
    positiveAuthorityEligible,
    positiveAuthorityLevel,
    positiveConclusionAllowed,
    additiveCautionAllowed,
    positiveAuthorityReasonCodes,
  });

  if (hardDeny) {
    const out = base();
    out.cannotConcludeYet = true;
    if (confidence === "contradictory" || counterEvidenceStrong) {
      out.probeOnly = true;
      reasons.push("ראיות סותרות או נגד־ראיה חזקה");
    } else if (weakEvidence) {
      out.confidenceOnly = true;
      out.probeOnly = true;
      reasons.push("ראיות חלשות: הסתמכות על ספירה מצטברת ללא רצף אירועים מספק");
    } else if (confidence === "insufficient_data") {
      out.confidenceOnly = true;
      out.probeOnly = true;
      reasons.push("נתונים לא מספיקים לפי מדיניות הביטחון");
    } else if (hintInvalidates && confidence === "early_signal_only") {
      out.probeOnly = true;
      out.confidenceOnly = true;
      reasons.push("אות מוקדם בלבד — כדאי עוד תרגול קצר או מעקב לפני מסקנה חזקה");
    }
    return out;
  }

  const out = base();
  out.cannotConcludeYet = false;

  if (!hasTaxonomyMatch) {
    out.probeOnly = true;
    reasons.push("אין התאמת טקסונומיה מספקת לצבר");
    return out;
  }

  if (confidence === "early_signal_only") {
    out.probeOnly = true;
    out.confidenceOnly = true;
    reasons.push("אות מוקדם בלבד — כדאי עוד תרגול קצר או מעקב לפני מסקנה חזקה");
  }

  if (confidence === "low") {
    out.probeOnly = true;
    out.confidenceOnly = true;
    reasons.push("ביטחון נמוך — כדאי לאסוף עוד תרגול לפני אבחנה מלאה");
  }

  if (confidence === "moderate") {
    out.diagnosisAllowed = true;
    if (narrowSample || !recurrenceFull) {
      out.confidenceOnly = true;
      reasons.push("מדגם צר או חזרתיות חלקית — אבחנה מותנית בלבד");
    }
    if (recurrenceFull && !narrowSample) {
      out.confidenceOnly = false;
    }
  }

  if (confidence === "high" && recurrenceFull) {
    out.diagnosisAllowed = true;
    out.confidenceOnly = false;
  }

  if (confidence === "moderate" || confidence === "high") {
    if (priority === "P2" || priority === "P3" || priority === "P4") {
      if (recurrenceFull && !counterEvidenceStrong && confidence === "high") {
        out.interventionAllowed = true;
        reasons.push("ביטחון גבוה ועדיפות מאשרות כיוון התערבות");
      } else if (recurrenceFull && confidence === "moderate" && (priority === "P3" || priority === "P4")) {
        out.interventionAllowed = true;
        reasons.push("ביטחון בינוני ועדיפות גבוהה — התערבות ממוקדת");
      }
    }
  }

  if (priority === "P4") {
    out.humanReviewRecommended = true;
    reasons.push("P4: מומלץ סקירה עם מבוגר/מורה לפי המסמך");
  }

  if (!out.diagnosisAllowed && !out.cannotConcludeYet) {
    out.diagnosisAllowed = confidence === "moderate" || confidence === "high";
  }

  return out;
}
