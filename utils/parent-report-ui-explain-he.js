/**
 * תוויות עברית לתצוגת הורים — דוח מקוצר/מקיף (שלב 5 UI בלבד).
 * ממפה מזהים טכניים לטקסט קצר; לא ממציא תוכן פדגוגי.
 */

const BEHAVIOR_OR_DIAGNOSTIC_HE = {
  knowledge_gap: "פער ידע",
  speed_pressure: "לחץ מהירות",
  instruction_friction: "חיכוך הוראה / רמזים",
  careless_pattern: "רשלנות / אי־יציבות",
  fragile_success: "הצלחה שבירה",
  stable_mastery: "מאסטרי יציב",
  undetermined: "לא נקבע",
  mixed: "תמהיל",
  mixed_low_signal: "אות חלש",
  none_sparse: "דל נתון",
  none_observed: "ללא דפוס קושי בולט",
  fragile_success_cluster: "מקבץ הצלחה שבירה",
};

const CONF_BADGE_HE = {
  high: "ביטחון גבוה",
  medium: "ביטחון בינוני",
  low: "ביטחון נמוך",
};

const SUFF_BADGE_HE = {
  high: "נפח נתונים טוב",
  medium: "נפח בינוני",
  low: "נפח נמוך",
};

const RISK_FLAG_HE = {
  falsePromotionRisk: "סיכון קידום שווא",
  falseRemediationRisk: "סיכון טיפול יתר",
  speedOnlyRisk: "הטיה למהירות",
  hintDependenceRisk: "תלות ברמזים",
  insufficientEvidenceRisk: "ראיות חלקיות",
  recentTransitionRisk: "מגמה אחרונה עדינה",
};

const TREND_DIR_HE = {
  up: "עולה",
  down: "יורד",
  flat: "יציב",
  unknown: "לא חד",
};

/**
 * @param {string} text
 * @param {number} max
 */
export function truncateHe(text, max = 140) {
  const s = String(text || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!s) return "";
  if (s.length <= max) return s;
  return `${s.slice(0, Math.max(0, max - 1))}…`;
}

/**
 * מחליף מזהים טכניים בטקסט למשל מהמנוע (למשל פרופיל התנהגות).
 * @param {string} text
 */
export function sanitizeEngineSnippetHe(text) {
  let s = String(text || "");
  for (const [k, v] of Object.entries(BEHAVIOR_OR_DIAGNOSTIC_HE)) {
    s = s.replace(new RegExp(`\\b${k}\\b`, "g"), v);
  }
  s = s.replace(/\b(falsePromotionRisk|falseRemediationRisk|speedOnlyRisk|hintDependenceRisk|insufficientEvidenceRisk|recentTransitionRisk)\b/g, "");
  s = s.replace(/\s{2,}/g, " ").trim();
  return s;
}

export function diagnosticTypeLabelHe(id) {
  const k = String(id || "").trim();
  return BEHAVIOR_OR_DIAGNOSTIC_HE[k] || (k ? "אבחון" : "לא נקבע");
}

export function behaviorDominantLabelHe(id) {
  return diagnosticTypeLabelHe(id);
}

export function confidenceBadgeLabelHe(badge) {
  const b = String(badge || "").toLowerCase();
  return CONF_BADGE_HE[b] || CONF_BADGE_HE.medium;
}

export function sufficiencyBadgeLabelHe(badge) {
  const b = String(badge || "").toLowerCase();
  return SUFF_BADGE_HE[b] || SUFF_BADGE_HE.medium;
}

/**
 * @param {Record<string, boolean>|null|undefined} riskFlags
 * @param {number} maxLabels
 */
export function activeRiskFlagLabelsHe(riskFlags, maxLabels = 4) {
  if (!riskFlags || typeof riskFlags !== "object") return [];
  const out = [];
  for (const [key, val] of Object.entries(riskFlags)) {
    if (!val) continue;
    const lab = RISK_FLAG_HE[key];
    if (lab) out.push(lab);
    if (out.length >= maxLabels) break;
  }
  return out;
}

/**
 * שורת מגמה קצרה — עדיפות ל־summaryHe מהמנוע.
 * @param {Record<string, unknown>|null|undefined} trend
 */
export function trendCompactLineHe(trend) {
  const t = trend && typeof trend === "object" ? trend : null;
  if (!t) return "";
  const sum = String(t.summaryHe || "").trim();
  if (sum) return truncateHe(sum, 100);
  const ad = String(t.accuracyDirection || "unknown");
  const ind = String(t.independenceDirection || "unknown");
  const a = TREND_DIR_HE[ad] || ad;
  const i = TREND_DIR_HE[ind] || ind;
  return `דיוק ${a} · עצמאות ${i}`;
}

/**
 * @param {Array<{ detailHe?: string, phase?: string }>} trace
 * @param {number} maxItems
 */
export function formatDecisionTraceBulletsHe(trace, maxItems = 4) {
  if (!Array.isArray(trace) || !trace.length) return [];
  const withText = trace
    .map((e) => String(e?.detailHe || "").trim())
    .filter(Boolean);
  if (withText.length) return withText.slice(-maxItems);
  return trace
    .slice(-maxItems)
    .map((e) => {
      const ph = String(e?.phase || "").trim();
      return ph ? `שלב: ${ph}` : "";
    })
    .filter(Boolean);
}

/**
 * @param {Record<string, boolean>|null|undefined} majorRiskFlagsAcrossRows
 * @param {number} maxLabels
 */
export function subjectMajorRiskLabelsHe(majorRiskFlagsAcrossRows, maxLabels = 5) {
  return activeRiskFlagLabelsHe(majorRiskFlagsAcrossRows, maxLabels);
}
