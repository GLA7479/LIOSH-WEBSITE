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
  } = p;

  const out = {
    diagnosisAllowed: false,
    confidenceOnly: false,
    probeOnly: false,
    interventionAllowed: false,
    cannotConcludeYet: false,
    humanReviewRecommended: priority === "P4",
    reasons: /** @type {string[]} */ ([]),
  };

  if (!hasTaxonomyMatch) {
    out.cannotConcludeYet = true;
    out.probeOnly = true;
    out.reasons.push("אין התאמת טקסונומיה מספקת לצבר");
    return out;
  }

  if (confidence === "contradictory" || counterEvidenceStrong) {
    out.cannotConcludeYet = true;
    out.probeOnly = true;
    out.reasons.push("ראיות סותרות או נגד־ראיה חזקה");
    return out;
  }

  if (weakEvidence) {
    out.cannotConcludeYet = true;
    out.confidenceOnly = true;
    out.probeOnly = true;
    out.reasons.push("ראיות חלשות: הסתמכות על ספירה מצטברת ללא רצף אירועים מספק");
    return out;
  }

  if (confidence === "insufficient_data") {
    out.cannotConcludeYet = true;
    out.confidenceOnly = true;
    out.probeOnly = true;
    out.reasons.push("נתונים לא מספיקים לפי מדיניות הביטחון");
    return out;
  }

  if (confidence === "early_signal_only") {
    out.probeOnly = true;
    out.confidenceOnly = true;
    out.reasons.push("אות מוקדם בלבד — נדרש probe או מעקב");
    return out;
  }

  if (confidence === "low") {
    out.probeOnly = true;
    out.confidenceOnly = true;
    out.reasons.push("ביטחון נמוך — probe לפני אבחנה מלאה");
    return out;
  }

  if (confidence === "moderate") {
    out.diagnosisAllowed = true;
    if (narrowSample || !recurrenceFull) {
      out.confidenceOnly = true;
      out.reasons.push("מדגם צר או חזרתיות חלקית — אבחנה מותנית בלבד");
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
        out.reasons.push("ביטחון גבוה ועדיפות מאשרות כיוון התערבות");
      } else if (recurrenceFull && confidence === "moderate" && (priority === "P3" || priority === "P4")) {
        out.interventionAllowed = true;
        out.reasons.push("ביטחון בינוני ועדיפות גבוהה — התערבות ממוקדת");
      }
    }
  }

  if (priority === "P4") {
    out.humanReviewRecommended = true;
    out.reasons.push("P4: מומלץ סקירה עם מבוגר/מורה לפי המסמך");
  }

  if (!out.diagnosisAllowed && !out.cannotConcludeYet) {
    out.diagnosisAllowed = confidence === "moderate" || confidence === "high";
  }

  return out;
}
