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

/** שורש קושי Phase 7 — מזהים לעומת תוויות UI */
export const ROOT_CAUSE_LABEL_HE = {
  knowledge_gap: "פער ידע מהותי",
  instruction_friction: "חיכוך הוראה / תלות בהכוונה",
  speed_pressure: "לחץ מהירות או מסלול תחרותי",
  careless_execution: "רשלנות ביצוע לצד שליטה סבירה",
  weak_independence: "עצמאות נמוכה בפתרון",
  early_stage_instability: "שלב מוקדם — תמונה עדיין לא יציבה",
  mixed_signal: "אותות מעורבים",
  insufficient_evidence: "אין די נתון לשורש קושי ברור",
  retention_fragility: "שבירות זיכרון / שימור (מוקדם)",
  language_load: "עומס שפה או ניסוח (מוקדם)",
  transition_gap: "פער מעבר בין רמות (מוקדם)",
};

/** סוג התערבות מומלץ Phase 7 */
export const INTERVENTION_TYPE_LABEL_HE = {
  stabilize_accuracy: "ייצוב דיוק לפני שינוי רמה",
  reduce_time_pressure: "הפחתת לחץ זמן ושמירה על דיוק",
  guided_to_independent_transition: "מעבר הדרגתי מהכוונה לעצמאות",
  clarify_instruction_pattern: "הבהרת ניסוח משימה וצעדים קטנים",
  target_core_skill_gap: "חיזוק ממוקד בפער מיומנות ליבה",
  monitor_before_escalation: "מעקב ותרגול מבוקר לפני החמרה",
};

/** Phase 9 — דפוס טעות דומיננטי (מזהה → עברית להורה) */
export const MISTAKE_PATTERN_LABEL_HE = {
  concept_confusion: "בלבול מושגי חוזר",
  procedure_break: "שבירה בסדר פעולות",
  instruction_misread: "טעות קריאה/הבנת משימה",
  speed_driven_error: "טעות מונעת ממהירות",
  careless_flip: "רשלנות / קפיצה בביצוע",
  support_dependent_success: "הצלחה התלויה בליווי",
  early_learning_noise: "רעש למידה מוקדמת",
  mixed_mistake_pattern: "תמהיל טעויות לא אחיד",
  insufficient_mistake_evidence: "אין די אות לדפוס טעות ברור",
};

/** Phase 9 — שלב למידה לאורך זמן */
export const LEARNING_STAGE_LABEL_HE = {
  early_acquisition: "רכישה מוקדמת",
  partial_stabilization: "ייצוב חלקי",
  stable_control: "שליטה יציבה",
  fragile_retention: "שימור שביר",
  regression_signal: "אות לרגרסיה זהירה",
  transfer_emerging: "העברה מתחילה להתגבש",
  insufficient_longitudinal_evidence: "אין די מידע לאורך זמן",
};

const PHASE8_DURATION_BAND_HE = {
  very_short: "משך קצר מאוד",
  short: "משך קצר",
  moderate: "משך בינוני",
};

const PHASE8_INTENSITY_HE = {
  light: "עומס קל",
  focused: "מיקוד",
  targeted: "יעדני",
};

const PHASE8_FORMAT_HE = {
  guided_practice: "תרגול מונחה",
  independent_practice: "תרגול עצמאי",
  mixed: "מונחה־עצמאי",
  observation_block: "צפייה ומדידה",
};

const PHASE8_PARENT_EFFORT_HE = {
  low: "מאמץ הורי נמוך",
  medium: "מאמץ הורי בינוני",
  high: "מאמץ הורי גבוה",
};

const PHASE8_PRACTICE_LOAD_HE = {
  minimal: "עומס תרגול מינימלי",
  light: "עומס תרגול קל",
  moderate: "עומס תרגול מתון",
};

/**
 * תגיות קצרות לשורת נושא / המלצה — Phase 8 (ללא טקסט ארוך).
 * @param {Record<string, unknown>|null|undefined} rowOrRec
 */
export function phase8TopicMetaChipsHe(rowOrRec) {
  const o = rowOrRec && typeof rowOrRec === "object" ? rowOrRec : {};
  const sig = o.topicEngineRowSignals && typeof o.topicEngineRowSignals === "object" ? o.topicEngineRowSignals : null;
  const src = sig || o;
  /** @type {string[]} */
  const chips = [];
  const dur = PHASE8_DURATION_BAND_HE[String(src.interventionDurationBand || "")];
  if (dur) chips.push(dur);
  const fmt = PHASE8_FORMAT_HE[String(src.interventionFormat || "")];
  if (fmt) chips.push(fmt);
  const inten = PHASE8_INTENSITY_HE[String(src.interventionIntensity || "")];
  if (inten && chips.length < 3) chips.push(inten);
  const load = PHASE8_PRACTICE_LOAD_HE[String(src.recommendedPracticeLoad || "")];
  if (load && chips.length < 3) chips.push(load);
  const eff = PHASE8_PARENT_EFFORT_HE[String(src.interventionParentEffort || "")];
  if (eff && chips.length < 3) chips.push(eff);
  return chips.slice(0, 3);
}

/**
 * שורת כיול תרגול קומפקטית לבית.
 * @param {Record<string, unknown>|null|undefined} rowOrRec
 */
export function phase8PracticeCalibrationLineHe(rowOrRec) {
  const o = rowOrRec && typeof rowOrRec === "object" ? rowOrRec : {};
  const sig = o.topicEngineRowSignals && typeof o.topicEngineRowSignals === "object" ? o.topicEngineRowSignals : null;
  const src = sig || o;
  const n = Number(src.recommendedSessionCount);
  const countOk = Number.isFinite(n) && n > 0;
  const len =
    src.recommendedSessionLengthBand === "very_short"
      ? "5–8 דק׳"
      : src.recommendedSessionLengthBand === "moderate"
        ? "עד ~15 דק׳"
        : "8–12 דק׳";
  if (!countOk) return "";
  return `${n} מפגשים קצרים בשבוע, כ־${len} כל אחד.`;
}

/**
 * שורה קצרה לדפוס טעות (Phase 9).
 * @param {Record<string, unknown>|null|undefined} rowOrRec
 */
export function mistakePatternLineHe(rowOrRec) {
  const o = rowOrRec && typeof rowOrRec === "object" ? rowOrRec : {};
  const sig = o.topicEngineRowSignals && typeof o.topicEngineRowSignals === "object" ? o.topicEngineRowSignals : null;
  const src = sig || o;
  const lab = String(src.dominantMistakePatternLabelHe || "").trim();
  const nar = String(src.mistakePatternNarrativeHe || "").trim();
  if (nar) return truncateHe(nar, 140);
  if (lab) return truncateHe(`דפוס טעויות: ${lab}.`, 120);
  return "";
}

/**
 * שורה קצרה לזיכרון למידה (Phase 9).
 * @param {Record<string, unknown>|null|undefined} rowOrRec
 */
export function learningMemoryLineHe(rowOrRec) {
  const o = rowOrRec && typeof rowOrRec === "object" ? rowOrRec : {};
  const sig = o.topicEngineRowSignals && typeof o.topicEngineRowSignals === "object" ? o.topicEngineRowSignals : null;
  const src = sig || o;
  const mem = String(src.memoryNarrativeHe || "").trim();
  const st = String(src.learningStageLabelHe || "").trim();
  if (mem) return truncateHe(mem, 150);
  if (st) return truncateHe(`מצב לאורך זמן: ${st}.`, 110);
  return "";
}

/**
 * שורת «חזרה לפני קידום» (Phase 9).
 * @param {Record<string, unknown>|null|undefined} rowOrRec
 */
export function reviewBeforeAdvanceLineHe(rowOrRec) {
  const o = rowOrRec && typeof rowOrRec === "object" ? rowOrRec : {};
  const sig = o.topicEngineRowSignals && typeof o.topicEngineRowSignals === "object" ? o.topicEngineRowSignals : null;
  const src = sig || o;
  const s = String(src.reviewBeforeAdvanceHe || "").trim();
  return s ? truncateHe(s, 160) : "";
}

/**
 * שורת מוכנות להעברה (Phase 9).
 * @param {Record<string, unknown>|null|undefined} rowOrRec
 */
export function transferReadinessLineHe(rowOrRec) {
  const o = rowOrRec && typeof rowOrRec === "object" ? rowOrRec : {};
  const sig = o.topicEngineRowSignals && typeof o.topicEngineRowSignals === "object" ? o.topicEngineRowSignals : null;
  const src = sig || o;
  const tr = String(src.transferReadiness || "").trim();
  if (!tr || tr === "unknown") return "";
  const map = {
    not_ready: "העברה לרמה קשה: לא עכשיו — חיזוק באותה רמה.",
    limited: "העברה: רק ניסויים זעירים באותו נושא.",
    emerging: "העברה: אפשר לנסות צעד קטן בתוך הנושא בלבד.",
    ready: "העברה: נראה מוכנות זהירה לצעד קטן הבא.",
  };
  return truncateHe(map[tr] || "", 130);
}

/** Phase 10 — תגובה להתערבות */
export const RESPONSE_TO_INTERVENTION_LABEL_HE = {
  not_enough_evidence: "אין עדיין די אות להעריך אם התמיכה עוזרת",
  early_positive_response: "סימנים ראשונים לשיפור — עדיין מוקדם לסגור",
  stalled_response: "התקדמות נתקעה — כדאי לדייק או לשנות כיוון",
  over_supported_progress: "הצלחה בעיקר עם ליווי — עדיין לא שליטה עצמאית",
  independence_growing: "עצמאות עולה יחסית לצד התקדמות",
  regression_under_support: "מגמה שלילית תחת התמיכה הנוכחית",
  mixed_response: "תגובה מעורבת — חלקים מתקדמים וחלקים נשארים תלויים",
};

export const SUPPORT_FIT_LABEL_HE = {
  good_fit: "התאמה טובה לתמיכה הנוכחית",
  partial_fit: "התאמה חלקית — כדאי לעקוב ולכוון",
  poor_fit: "התאמה חלשה — כדאי לבחון שינוי אסטרטגיה",
  unknown: "לא ברור עדיין אם ההתאמה טובה",
};

export const SUPPORT_ADJUSTMENT_NEED_LABEL_HE = {
  hold_course: "להמשיך באותו כיוון זהירותית",
  tighten_focus: "לדייק מיקוד ולהאט קצת",
  reduce_support: "להפחית תמיכה בהדרגה כשיש אות לעצמאות",
  increase_structure: "להוסיף מבנה קצר וברור יותר",
  change_strategy: "לשנות אסטרטגיה — מה שעשינו לא מספיק",
  monitor_only: "לצפות ולאסוף עוד אות לפני החלטה",
};

/** Phase 10 — רענון מסקנה */
export const FRESHNESS_STATE_LABEL_HE = {
  fresh: "המידע עדכני יחסית",
  recent_but_partial: "עדכני חלקית — עדיין חסרים פרטים",
  aging: "המידע מתחיל להתיישן",
  stale: "המידע פחות עדכני — לא להסתמך עליו לבד",
  unknown: "לא ברור עד כמה המידע רענן",
};

export const CONCLUSION_FRESHNESS_LABEL_HE = {
  high: "ביטחון במסקנה יחסית גבוה כרגע",
  medium: "ביטחון במסקנה בינוני",
  low: "ביטחון במסקנה נמוך — כדאי לעדכן תצפית",
  expired: "המסקנה כבר לא «טרייה» — כדאי לבדוק מחדש",
};

export const RECALIBRATION_NEED_LABEL_HE = {
  none: "אין צורך מיוחד בריענון כרגע",
  light_review: "מספיק סקירה קלה לפני שינוי מהותי",
  structured_recheck: "כדאי בדיקה מסודרת לפני החמרה או קידום",
  do_not_rely_yet: "עדיין לא כדאי להסתמך על המסקנה לבדה",
};

/** Phase 10 — כיוון התאמת תמיכה לשבוע הבא */
export const NEXT_SUPPORT_ADJUSTMENT_LABEL_HE = {
  continue_same_plan: "להמשיך באותה תוכנית תמיכה — בזהירות ובמעקב קצר",
  continue_and_reduce_support: "להמשיך ולהפחית מעט ליווי כשיש אות לעצמאות",
  continue_and_tighten_focus: "להמשיך אבל לדייק מיקוד ולקצר מפגש אם צריך",
  pause_and_observe: "לעצור רגע, לצפות ולאסוף עוד אות לפני שינוי",
  recheck_before_advancing: "לעשות סבב תצפית/בדיקה לפני העלאת קושי או קידום",
  switch_strategy: "לשנות אסטרטגיה — מה שעשינו לא מספיק כרגע",
};

/** Phase 11 — מצב רצף תמיכה */
export const SUPPORT_SEQUENCE_STATE_LABEL_HE = {
  new_support_cycle: "מתחילים מחזור תמיכה חדש — עדיין מוקדם לסגור תמונה",
  early_sequence: "בתחילת רצף תמיכה — כדאי לעקוב בלי להעמיס",
  continuing_sequence: "ממשיכים ברצף תמיכה שנראה עקבי",
  sequence_ready_for_release: "נראה שאפשר להתחיל מעבר זהיר מתמיכה להצלחה עצמאית קצרה",
  sequence_stalled: "הרצף נתקע — כדאי לדייק מטרה או לשנות כלי",
  sequence_exhausted: "הרצף נראה מתיש — עדיף לא לחזור שוב על אותו סוג תרגול בלי בדיקה מחודשת",
  insufficient_sequence_evidence: "אין עדיין די אות לספר את סיפור הרצף בביטחון",
};

export const PRIOR_SUPPORT_PATTERN_LABEL_HE = {
  guided_repeat: "חזרה על תמיכה מונחית דומה לאורך זמן",
  guided_then_release: "מונחה ואז שחרור הדרגתי — כיוון בריא",
  review_hold_repeat: "חזרה על מעגל חזרה־החזקה",
  observe_then_retry: "תצפית ואז ניסיון נוסף",
  mixed_support_history: "תמהיל תמיכות לא אחיד",
  unknown: "לא ברור איך נראתה התמיכה קודם לפי הנתון",
};

export const STRATEGY_REPETITION_RISK_LABEL_HE = {
  low: "סיכון נמוך לחזרה מיותרת על אותה שיטה",
  moderate: "יש סיכון בינוני שחוזרים על אותו כיוון בלי שינוי",
  high: "יש סיכון גבוה שחוזרים על אותו סוג עזרה בלי תועלת נוספת",
  unknown: "לא ברור עדיין אם יש חזרה מסוכנת",
};

export const STRATEGY_FATIGUE_RISK_LABEL_HE = {
  low: "עומס אסטרטגי נמוך כרגע",
  moderate: "כדאי לשים לב שלא «נשחקים» על אותו טקסט",
  high: "יש סימנים לעייפות מאותו סוג תמיכה — כדאי לרענן",
  unknown: "לא ברור עדיין לגבי עייפות אסטרטגית",
};

export const NEXT_BEST_SEQUENCE_STEP_LABEL_HE = {
  continue_current_sequence: "להמשיך ברצף הנוכחי עוד קצת, עם מעקב",
  begin_release_step: "להתחיל צעד שחרור זהיר — לא לזרוק תמיכה פתאום",
  tighten_same_goal: "לדייק את אותה מטרה במקום להרחיב",
  switch_support_type: "להחליף סוג תמיכה — לא רק עוד אותה חזרה",
  reset_with_short_review: "איפוס קצר עם בדיקה מחודשת לפני דחיפה נוספת",
  observe_before_next_cycle: "לצפות ולאסוף אות לפני מחזור חדש",
};

/** Phase 11 — פעולת רצף לשבוע הבא (מנוע) */
export const NEXT_SUPPORT_SEQUENCE_ACTION_LABEL_HE = {
  continue_same_sequence: "להמשיך באותו רצף — בלי לשנות דרמטית",
  continue_with_tighter_target: "להמשיך ברצף אבל עם מטרה צרה יותר",
  begin_release_sequence: "להתחיל רצף שחרור מבוקר",
  pause_repeat_and_switch: "לעצור חזרות, לעבור לכיוון אחר",
  short_reset_then_retry: "איפוס קצר ואז ניסיון מחודש",
  observe_without_new_push: "לצפות בלי דחיפה חדשה עכשיו",
};

export const ADVICE_SIMILARITY_LEVEL_LABEL_HE = {
  clearly_new: "הכיוון נראה חדש יחסית לעומת מה שחזר עד כה",
  partly_repeated: "חלק מהעצה חוזרת על עצמה — כדאי לגוון קל",
  mostly_repeated: "רוב מה שנשמע כאן חוזר על עצמו — כדאי לשנות זווית",
  unknown: "לא ברור עדיין אם זו חזרה על עצמה",
};

export const ADVICE_NOVELTY_LABEL_HE = {
  high: "חידוש גבוה בניסוח ובפעולה",
  medium: "חידוש בינוני",
  low: "חידוש נמוך — נשמע דומה לפעמים קודמות",
  unknown: "לא ברור",
};

export const RECOMMENDATION_ROTATION_NEED_LABEL_HE = {
  none: "אין צורך מיוחד בסיבוב המלצה",
  light_variation: "מספיק גיוון קטן בניסוח או בצעד",
  meaningful_rotation: "כדאי לסובב משמעותית — לא אותו תרגיל מנטלי",
  do_not_repeat_yet: "עדיין לא כדאי לחזור שוב על אותו סוג תרגול בלי בדיקה",
};

/** Phase 12 — זיכרון המלצה */
export const RECOMMENDATION_MEMORY_STATE_LABEL_HE = {
  no_memory: "כרגע אין מספיק זיכרון תומך כדי להניח שהכיוון הקודם עדיין נכון",
  light_memory: "יש זיכרון חלש בלבד — בעיקר מהחלון הנוכחי",
  usable_memory: "יש זיכרון שימושי מספיק כדי להשוות המשך מול עבר קרוב",
  strong_memory: "יש כמה חלונות מגמה — אפשר לסמוך יותר על המשכיות",
};

export const PRIOR_RECOMMENDATION_SIGNATURE_LABEL_HE = {
  guided_accuracy_path: "קו ששאף לייצב דיוק בתרגול מונחה",
  review_hold_path: "קו של חזרה והחזקה לפני שינוי",
  release_transition_path: "קו של מעבר הדרגתי מתמיכה לעצמאות",
  observe_monitor_path: "קו של תצפית ואיסוף אות",
  mixed_prior_path: "תמהיל מסלולים — לא נקודה אחת ברורה",
  unknown: "לא ברור איזה מסלול תמיכה הופיע לפני",
};

export const SUPPORT_HISTORY_DEPTH_LABEL_HE = {
  single_window: "עומק היסטוריה: חלון אחד בלבד",
  short_history: "עומק היסטוריה: שני חלונות השוואה",
  multi_window: "עומק היסטוריה: כמה חלונות — בסיס חזק יותר",
  unknown: "עומק היסטוריה: לא ברור מהנתון",
};

export const RECOMMENDATION_CARRYOVER_LABEL_HE = {
  not_visible: "לא רואים המשכיות ברורה מהכיוון הקודם",
  partly_visible: "אולי נמשך אותו קו — אבל לא חד־משמעי",
  clearly_visible: "יש סימנים לכך שאותו קו תמיכה נמשך גם לתקופה הנוכחית",
  unclear: "לא ברור אם זה אותו מסלול או שינוי קטן",
};

export const MEMORY_OF_PRIOR_SUPPORT_CONFIDENCE_LABEL_HE = {
  none: "אין בסיס לביטחון בזיכרון התמיכה",
  low: "ביטחון נמוך בזיכרון התמיכה",
  medium: "ביטחון בינוני — מספיק להשוואה זהירה",
  high: "ביטחון גבוה יחסית בהשוואת המשך מול עבר",
};

/** Phase 12 — מעקב אחרי תוצאה */
export const EXPECTED_OUTCOME_TYPE_LABEL_HE = {
  accuracy_stabilization: "ציפינו לייצוב דיוק",
  independence_growth: "ציפינו לצמיחת עצמאות",
  error_reduction: "ציפינו להפחתת טעויות חוזרות",
  retention_hold: "ציפינו לשימור והחזקה",
  release_readiness: "ציפינו לסימני מוכנות לשחרור זהיר",
  evidence_collection: "ציפינו בעיקר לאסוף אות",
  unknown: "לא ברור מה המטרה שהמסלול הקודם ניסה לשפר",
};

export const OBSERVED_OUTCOME_STATE_LABEL_HE = {
  clear_progress: "בפועל נראה שיפור ברור בכיוון הצפוי",
  partial_progress: "בפועל יש התקדמות חלקית",
  flat_response: "בפועל התמונה שטוחה יחסית",
  contradictory_response: "בפועל יש משיכה בכיוון שונה מהצפוי",
  not_observable_yet: "בפועל עדיין מוקדם מדי לראות תוצאה",
};

export const EXPECTED_VS_OBSERVED_MATCH_LABEL_HE = {
  aligned: "המטרה והמצב בפועל נראים מתואמים",
  partly_aligned: "יש חפיפה חלקית בין מה שציפינו למה שרואים",
  misaligned: "נראה שהמטרה של התרגול לא התיישרה עם מה שרואים עכשיו",
  not_enough_evidence: "אין עדיין די אות להשוואה בביטחון",
};

export const FOLLOW_THROUGH_SIGNAL_LABEL_HE = {
  likely_followed: "סביר שהכיוון בבית באמת נשמר",
  possibly_followed: "אולי נשמר כיוון — לא לנעול",
  unclear: "לא ברור אם זה באמת אותו מסלול בבית",
  not_inferable: "לא אפשר להסיק מעקב מהנתונים",
};

export const RECOMMENDATION_CONTINUATION_DECISION_LABEL_HE = {
  continue_with_same_core: "להמשיך באותו ליבה — כי הנראה בפועל תומך",
  continue_but_refine: "להמשיך באותו כיוון, אך בצורה מעט מדויקת יותר",
  begin_controlled_release: "להתחיל שחרור מבוקר — כשיש בסיס לכך",
  do_not_repeat_without_new_evidence: "עדיף לא לחזור שוב על אותו מסלול בלי ראיה חדשה",
  pivot_from_prior_path: "לפנות ממסלול קודם שנראה שלא הוביל",
  reset_and_rebuild_signal: "לאפס קצר ולבנות מחדש את האות לפני דחיפה",
};

export const OUTCOME_BASED_NEXT_MOVE_LABEL_HE = {
  keep_current_direction: "להישאר על הכיוון — עם מעקב",
  tighten_goal_definition: "לדייק מטרה — לא להרחיב",
  reduce_support_and_check_transfer: "להפחית תמיכה מעט ולבדוק העברה קצרה",
  collect_new_evidence_first: "לאסוף עוד אות לפני החלטה מהותית",
  switch_path_type: "להחליף סוג מסלול — לא רק עוד סיבוב",
  brief_reset_then_compare: "איפוס קצר ואז השוואה מחדש",
};

/** Phase 13 — שערי החלטה */
export const GATE_STATE_LABEL_HE = {
  gates_not_ready: "עדיין אין מספיק בסיס — ההחלטה הבאה צריכה להישאר זהירה",
  continue_gate_active: "הכיוון הנוכחי עדיין דורש הוכחה קצרה לפני שינוי",
  release_gate_forming: "מתקרבים לשחרור זהיר — עדיין חסר אות עצמאות קצר",
  pivot_gate_visible: "אם גם בסבב הבא נראה חזרתיות דומה בלי שיפור, כדאי לשקול מסלול מעט שונה",
  recheck_gate_visible: "כאן עדיין חסר מידע עדכני — נכון לאסוף סבב נוסף לפני החלטה",
  advance_gate_forming: "יש בסיס טוב — אבל עדיין לא לקפוץ רמה בלי יציבות ברורה",
  mixed_gate_state: "יש כמה דרישות במקביל — לעשות צעד אחד ברור לפני הכל",
};

export const GATE_READINESS_LABEL_HE = {
  low: "מוכנות שערים נמוכה — לא לנעול מסקנה חזקה",
  moderate: "מוכנות בינונית — אפשר לצמצם החלטה לצעד אחד",
  high: "מוכנות גבוהה יחסית — עדיין עם תנאים לפני שחרור או קידום",
  insufficient: "אין עדיין מספיק אות לשערים מדויקים",
};

export const GATE_LEVEL_LABEL_HE = {
  off: "לא רלוונטי כרגע",
  pending: "ממתין לאות קצר",
  forming: "נבנה בהדרגה",
  ready_watch: "כמעט שם — עדיין עם תנאי אחרון",
  blocked: "חסום כרגע עד שמתקדמים",
};

/** Phase 13 — יעדי ראיה לסבב הבא */
export const TARGET_EVIDENCE_TYPE_LABEL_HE = {
  accuracy_confirmation: "לוודא דיוק יציב בלי לחץ מיותר",
  independence_confirmation: "לראות הצלחה קצרה בלי הכוונה באמצע",
  retention_confirmation: "לראות שהחומר נשמר אחרי הפסקה קצרה",
  mistake_reduction_confirmation: "לראות פחות טעויות מאותו סוג",
  response_confirmation: "לראות איך הילד מגיב לאותו כיוון בבית",
  fresh_data_needed: "לאסוף נתון עדכני לפני סגירת תמונה",
  mixed_target: "לשלב שני סימנים קצרים — לא הכל בבת אחת",
};

export const TARGET_OBSERVATION_WINDOW_LABEL_HE = {
  next_short_cycle: "בסבב קצר הבא (מפגש אחד־שניים)",
  next_two_cycles: "בשני סבבים קצרים",
  needs_fresh_baseline: "אחרי ריענון קצר של בסיס התצפית",
  unknown: "לא ברור עדיין כמה זמן נדרש",
};

/** Phase 13 — מיקוד החלטה לסבב הבא */
export const NEXT_CYCLE_DECISION_FOCUS_LABEL_HE = {
  prove_current_direction: "להוכיח שהכיוון הנוכחי באמת עוזר",
  check_independence_before_release: "לבדוק עצמאות קצרה לפני שחרור תמיכה",
  stabilize_before_advance: "לייצב לפני קפיצת רמה",
  test_if_path_is_working: "לבדוק אם המסלול עובד בפועל בסבב הבא",
  refresh_baseline_before_decision: "לרענן בסיס לפני החלטה מהותית",
  prepare_for_controlled_release: "להתכונן לשחרור מבוקר — לא לבד פתאום",
};

/** Phase 14 — תלות יסוד */
export const DEPENDENCY_STATE_LABEL_HE = {
  likely_local_issue: "נראה שהקושי נשאר מקומי יותר — אפשר לטפל בו במיקוד",
  /* QA wording: פחות «ייתכן» מוערם — ניסוח ישיר יותר */
  likely_foundational_block: "האותות כאן מצביעים על בסיס שעדיין לא התייצב במידה מספקת — לא רק נקודה צרה",
  mixed_dependency_signal: "יש תמונה מעורבת בין בסיס לנקודתי",
  insufficient_dependency_evidence: "אין עדיין מספיק ראיות לקבוע אם זה בסיס רחב או קושי נקודתי",
};

export const FOUNDATIONAL_BLOCKER_LABEL_HE = {
  accuracy_foundation_gap: "פער יסוד בדיוק/חזרה על טעויות דומות",
  procedure_automaticity_gap: "פער באוטומטיות וביצוע יציב",
  instruction_language_load: "עומס בהוראה ובניסוח משימה",
  independence_readiness_gap: "מוכנות לעבודה עצמאית עדיין לא בשלה",
  retention_instability: "שימור לא יציב — הבסיס «זז» מהר",
  unknown: "לא נקבע סוג בסיס ספציפי",
};

export const LIKELIHOOD_LOW_MOD_HIGH_HE = {
  low: "סבירות נמוכה",
  moderate: "סבירות בינונית",
  high: "סבירות גבוהה יחסית",
  unknown: "לא ברור עדיין",
};

/** Phase 14 — סדר התערבות */
export const INTERVENTION_ORDERING_LABEL_HE = {
  foundation_first: "קודם לייצב בסיס — ואז לחדד בנושא",
  local_support_first: "קודם תמיכה ממוקדת בנושא עצמו",
  parallel_light_support: "תמיכה קלה במקביל — בלי להרחיב הכל בבת אחת",
  gather_dependency_evidence_first: "לאסוף עוד אות לפני שמחליטים אם זה בסיס או מקומי",
};

/** Phase 14 — החלטת יסוד לסבב הבא */
export const FOUNDATION_DECISION_LABEL_HE = {
  stabilize_foundation_first: "לייצב יסוד לפני הרחבה או ליטוש נקודתי",
  treat_locally: "לטפל מקומית בנושא — בלי לפתוח סיפור רחב מיותר",
  run_parallel_light_support: "לשלב קלות: בסיס צר + מיקוד מקומי",
  collect_dependency_evidence_first: "לאסוף ראיה לפני שמשנים סדר עבודה",
};

export const NEXT_CYCLE_SUPPORT_LEVEL_LABEL_HE = {
  narrow_local: "תמיכה צרה וממוקדת בנושא",
  foundation_targeted: "תמיכה ממוקדת ביסוד שזוהה",
  blended_light: "תערובת קלה — לא עומס כפול",
  evidence_first: "תצפית קצרה לפני החלטה על רמת התמיכה",
};

/**
 * שורת תגובה להתערבות (Phase 10).
 * @param {Record<string, unknown>|null|undefined} rowOrRec
 */
export function responseToInterventionLineHe(rowOrRec) {
  const o = rowOrRec && typeof rowOrRec === "object" ? rowOrRec : {};
  const sig = o.topicEngineRowSignals && typeof o.topicEngineRowSignals === "object" ? o.topicEngineRowSignals : null;
  const src = sig || o;
  const s = String(src.responseToInterventionLabelHe || "").trim();
  if (s) return truncateHe(s, 150);
  const id = String(src.responseToIntervention || "").trim();
  const lab = RESPONSE_TO_INTERVENTION_LABEL_HE[id];
  return lab ? truncateHe(lab, 150) : "";
}

/**
 * שורת התאמת תמיכה / צעד הבא (Phase 10).
 * @param {Record<string, unknown>|null|undefined} rowOrRec
 */
export function supportAdjustmentLineHe(rowOrRec) {
  const o = rowOrRec && typeof rowOrRec === "object" ? rowOrRec : {};
  const sig = o.topicEngineRowSignals && typeof o.topicEngineRowSignals === "object" ? o.topicEngineRowSignals : null;
  const src = sig || o;
  const adj = String(src.nextSupportAdjustmentHe || "").trim();
  if (adj) return truncateHe(adj, 160);
  const need = String(src.supportAdjustmentNeedHe || "").trim();
  if (need) return truncateHe(need, 140);
  return "";
}

/**
 * שורת רענון / תוקף ראיות (Phase 10).
 * @param {Record<string, unknown>|null|undefined} rowOrRec
 */
export function freshnessLineHe(rowOrRec) {
  const o = rowOrRec && typeof rowOrRec === "object" ? rowOrRec : {};
  const sig = o.topicEngineRowSignals && typeof o.topicEngineRowSignals === "object" ? o.topicEngineRowSignals : null;
  const src = sig || o;
  const fs = String(src.freshnessStateLabelHe || "").trim();
  const cf = String(src.conclusionFreshnessLabelHe || "").trim();
  const parts = [fs, cf].filter(Boolean);
  if (!parts.length) return "";
  return truncateHe(parts.join(" · "), 160);
}

/**
 * שורת צורך בריענון מסקנה (Phase 10).
 * @param {Record<string, unknown>|null|undefined} rowOrRec
 */
export function recalibrationLineHe(rowOrRec) {
  const o = rowOrRec && typeof rowOrRec === "object" ? rowOrRec : {};
  const sig = o.topicEngineRowSignals && typeof o.topicEngineRowSignals === "object" ? o.topicEngineRowSignals : null;
  const src = sig || o;
  const s = String(src.recalibrationNeedHe || "").trim();
  return s ? truncateHe(s, 150) : "";
}

/** Phase 11 — רצף תמיכה */
export function supportSequenceLineHe(rowOrRec) {
  const o = rowOrRec && typeof rowOrRec === "object" ? rowOrRec : {};
  const sig = o.topicEngineRowSignals && typeof o.topicEngineRowSignals === "object" ? o.topicEngineRowSignals : null;
  const src = sig || o;
  const nar = String(src.supportSequenceNarrativeHe || "").trim();
  if (nar) return truncateHe(nar, 160);
  const st = String(src.supportSequenceStateLabelHe || "").trim();
  return st ? truncateHe(st, 140) : "";
}

export function repetitionRiskLineHe(rowOrRec) {
  const o = rowOrRec && typeof rowOrRec === "object" ? rowOrRec : {};
  const sig = o.topicEngineRowSignals && typeof o.topicEngineRowSignals === "object" ? o.topicEngineRowSignals : null;
  const src = sig || o;
  const s = String(src.strategyRepetitionRiskHe || "").trim();
  if (!s || s === STRATEGY_REPETITION_RISK_LABEL_HE.unknown) return "";
  return truncateHe(s, 150);
}

export function fatigueRiskLineHe(rowOrRec) {
  const o = rowOrRec && typeof rowOrRec === "object" ? rowOrRec : {};
  const sig = o.topicEngineRowSignals && typeof o.topicEngineRowSignals === "object" ? o.topicEngineRowSignals : null;
  const src = sig || o;
  const s = String(src.strategyFatigueRiskHe || "").trim();
  if (!s || s === STRATEGY_FATIGUE_RISK_LABEL_HE.unknown) return "";
  return truncateHe(s, 150);
}

export function releaseReadinessLineHe(rowOrRec) {
  const o = rowOrRec && typeof rowOrRec === "object" ? rowOrRec : {};
  const sig = o.topicEngineRowSignals && typeof o.topicEngineRowSignals === "object" ? o.topicEngineRowSignals : null;
  const src = sig || o;
  const seq = String(src.supportSequenceState || "").trim();
  if (seq === "sequence_ready_for_release") {
    return truncateHe(
      "נראה שהילד מפיק תועלת מהתמיכה הנוכחית, אבל אפשר לנסות צעד שחרור קצר ומבוקר — עדיין לא לגמרי לבד.",
      170
    );
  }
  if (seq === "sequence_exhausted" || seq === "sequence_stalled") {
    return truncateHe("הרצף נראה תקוע או מתיש — כדאי לעצור רגע ולחדש כיוון לפני עוד אותו סוג תרגול.", 160);
  }
  return "";
}

export function sequenceActionLineHe(rowOrRec) {
  const o = rowOrRec && typeof rowOrRec === "object" ? rowOrRec : {};
  const sig = o.topicEngineRowSignals && typeof o.topicEngineRowSignals === "object" ? o.topicEngineRowSignals : null;
  const src = sig || o;
  const a = String(src.nextSupportSequenceActionHe || "").trim();
  return a ? truncateHe(a, 170) : "";
}

/** שורה אחת לחזרתיות + עייפות — רק כשיש תווית מעבר ל־unknown */
export function topicRepetitionFatigueCompactLineHe(rowOrRec) {
  const r = repetitionRiskLineHe(rowOrRec);
  const f = fatigueRiskLineHe(rowOrRec);
  if (r && f) return truncateHe(`${r} · ${f}`, 168);
  return r || f;
}

/**
 * שורת נושא לרצף: ניסוח רצף או שחרור זהיר כשאין ניסוח.
 * @param {Record<string, unknown>|null|undefined} rowOrRec
 */
export function topicSupportSequenceOrReleaseLineHe(rowOrRec) {
  const seq = supportSequenceLineHe(rowOrRec);
  if (seq) return seq;
  return releaseReadinessLineHe(rowOrRec);
}

/** Phase 12 — זיכרון המלצה / carryover */
export function recommendationMemoryLineHe(rowOrRec) {
  const o = rowOrRec && typeof rowOrRec === "object" ? rowOrRec : {};
  const sig = o.topicEngineRowSignals && typeof o.topicEngineRowSignals === "object" ? o.topicEngineRowSignals : null;
  const src = sig || o;
  const nar = String(src.recommendationMemoryNarrativeHe || "").trim();
  if (nar) return truncateHe(nar, 168);
  const st = String(src.recommendationMemoryStateLabelHe || "").trim();
  return st ? truncateHe(st, 150) : "";
}

export function outcomeTrackingLineHe(rowOrRec) {
  const o = rowOrRec && typeof rowOrRec === "object" ? rowOrRec : {};
  const sig = o.topicEngineRowSignals && typeof o.topicEngineRowSignals === "object" ? o.topicEngineRowSignals : null;
  const src = sig || o;
  const nar = String(src.outcomeTrackingNarrativeHe || "").trim();
  if (nar) return truncateHe(nar, 168);
  const m = String(src.expectedVsObservedMatchHe || "").trim();
  return m ? truncateHe(m, 155) : "";
}

export function continuationDecisionLineHe(rowOrRec) {
  const o = rowOrRec && typeof rowOrRec === "object" ? rowOrRec : {};
  const sig = o.topicEngineRowSignals && typeof o.topicEngineRowSignals === "object" ? o.topicEngineRowSignals : null;
  const src = sig || o;
  const s = String(src.recommendationContinuationDecisionHe || "").trim();
  return s ? truncateHe(s, 165) : "";
}

export function carryoverLineHe(rowOrRec) {
  const o = rowOrRec && typeof rowOrRec === "object" ? rowOrRec : {};
  const sig = o.topicEngineRowSignals && typeof o.topicEngineRowSignals === "object" ? o.topicEngineRowSignals : null;
  const src = sig || o;
  if (String(src.recommendationCarryover || "") === "not_visible") return "";
  const s = String(src.recommendationCarryoverLabelHe || "").trim();
  if (!s) return "";
  return truncateHe(s, 155);
}

export function freshEvidenceNeedLineHe(rowOrRec) {
  const o = rowOrRec && typeof rowOrRec === "object" ? rowOrRec : {};
  const sig = o.topicEngineRowSignals && typeof o.topicEngineRowSignals === "object" ? o.topicEngineRowSignals : null;
  const src = sig || o;
  const mem = String(src.recommendationMemoryState || "");
  const match = String(src.expectedVsObservedMatch || "");
  const s = String(src.whatNeedsFreshEvidenceNowHe || "").trim();
  if (!s) return "";
  if (mem === "no_memory" || mem === "light_memory" || match === "not_enough_evidence") return truncateHe(s, 165);
  return "";
}

/** Phase 13 — שערים ומיקוד סבב הבא */
export function gateStateLineHe(rowOrRec) {
  const o = rowOrRec && typeof rowOrRec === "object" ? rowOrRec : {};
  const sig = o.topicEngineRowSignals && typeof o.topicEngineRowSignals === "object" ? o.topicEngineRowSignals : null;
  const src = sig || o;
  const nar = String(src.gateNarrativeHe || "").trim();
  if (nar) return truncateHe(nar, 170);
  const st = String(src.gateStateLabelHe || "").trim();
  return st ? truncateHe(st, 155) : "";
}

export function decisionFocusLineHe(rowOrRec) {
  const o = rowOrRec && typeof rowOrRec === "object" ? rowOrRec : {};
  const sig = o.topicEngineRowSignals && typeof o.topicEngineRowSignals === "object" ? o.topicEngineRowSignals : null;
  const src = sig || o;
  const s = String(src.nextCycleDecisionFocusHe || "").trim();
  return s ? truncateHe(s, 165) : "";
}

export function evidenceTargetLineHe(rowOrRec) {
  const o = rowOrRec && typeof rowOrRec === "object" ? rowOrRec : {};
  const sig = o.topicEngineRowSignals && typeof o.topicEngineRowSignals === "object" ? o.topicEngineRowSignals : null;
  const src = sig || o;
  const nar = String(src.evidenceTargetNarrativeHe || "").trim();
  if (nar) return truncateHe(nar, 168);
  const t = String(src.targetEvidenceTypeLabelHe || "").trim();
  const w = String(src.targetObservationWindowLabelHe || "").trim();
  if (t && w) return truncateHe(`${t} · ${w}`, 168);
  return t ? truncateHe(t, 155) : "";
}

export function releaseGateLineHe(rowOrRec) {
  const o = rowOrRec && typeof rowOrRec === "object" ? rowOrRec : {};
  const sig = o.topicEngineRowSignals && typeof o.topicEngineRowSignals === "object" ? o.topicEngineRowSignals : null;
  const src = sig || o;
  const rg = String(src.releaseGate || "");
  if (rg !== "forming" && rg !== "pending" && rg !== "ready_watch") return "";
  const w = String(src.whatWouldJustifyReleaseHe || "").trim();
  if (w) return truncateHe(w, 168);
  return truncateHe(
    "כרגע הכיוון נראה סביר, אבל לפני שחרור תמיכה צריך לראות גם הצלחה קצרה יותר בלי הכוונה באמצע.",
    168
  );
}

export function pivotTriggerLineHe(rowOrRec) {
  const o = rowOrRec && typeof rowOrRec === "object" ? rowOrRec : {};
  const sig = o.topicEngineRowSignals && typeof o.topicEngineRowSignals === "object" ? o.topicEngineRowSignals : null;
  const src = sig || o;
  const pg = String(src.pivotGate || "");
  if (pg !== "forming" && pg !== "pending") return "";
  const t = String(src.whatWouldTriggerPivotHe || "").trim();
  return t ? truncateHe(t, 168) : truncateHe(GATE_STATE_LABEL_HE.pivot_gate_visible, 140);
}

export function recheckTriggerLineHe(rowOrRec) {
  const o = rowOrRec && typeof rowOrRec === "object" ? rowOrRec : {};
  const sig = o.topicEngineRowSignals && typeof o.topicEngineRowSignals === "object" ? o.topicEngineRowSignals : null;
  const src = sig || o;
  const rc = String(src.recheckGate || "");
  if (rc !== "forming" && rc !== "pending") return "";
  const t = String(src.whatWouldTriggerRecheckHe || "").trim();
  return t ? truncateHe(t, 165) : "";
}

/** שורת טריגר אחת: עדיפות לריענון, אחר כך pivot, אחר כך שחרור */
export function gateTriggerCompactLineHe(rowOrRec) {
  const rec = recheckTriggerLineHe(rowOrRec);
  if (rec) return rec;
  const piv = pivotTriggerLineHe(rowOrRec);
  if (piv) return piv;
  const rel = releaseGateLineHe(rowOrRec);
  return rel || "";
}

/** Phase 14 — תלות יסוד / סדר תמיכה */
export function dependencyStateLineHe(rowOrRec) {
  const o = rowOrRec && typeof rowOrRec === "object" ? rowOrRec : {};
  const sig = o.topicEngineRowSignals && typeof o.topicEngineRowSignals === "object" ? o.topicEngineRowSignals : null;
  const src = sig || o;
  const nar = String(src.foundationDependencyNarrativeHe || "").trim();
  if (nar) return truncateHe(nar, 170);
  const st = String(src.dependencyStateLabelHe || "").trim();
  return st ? truncateHe(st, 155) : "";
}

export function foundationPriorityLineHe(rowOrRec) {
  const o = rowOrRec && typeof rowOrRec === "object" ? rowOrRec : {};
  const sig = o.topicEngineRowSignals && typeof o.topicEngineRowSignals === "object" ? o.topicEngineRowSignals : null;
  const src = sig || o;
  if (!src.shouldTreatAsFoundationFirst && String(src.foundationDecision || "") !== "stabilize_foundation_first")
    return "";
  const w = String(src.whyFoundationFirstHe || "").trim();
  if (w) return truncateHe(w, 168);
  return truncateHe(FOUNDATION_DECISION_LABEL_HE.stabilize_foundation_first, 130);
}

export function interventionOrderingLineHe(rowOrRec) {
  const o = rowOrRec && typeof rowOrRec === "object" ? rowOrRec : {};
  const sig = o.topicEngineRowSignals && typeof o.topicEngineRowSignals === "object" ? o.topicEngineRowSignals : null;
  const src = sig || o;
  const s = String(src.interventionOrderingHe || "").trim();
  return s ? truncateHe(s, 165) : "";
}

export function foundationBeforeExpansionLineHe(rowOrRec) {
  const o = rowOrRec && typeof rowOrRec === "object" ? rowOrRec : {};
  const sig = o.topicEngineRowSignals && typeof o.topicEngineRowSignals === "object" ? o.topicEngineRowSignals : null;
  const src = sig || o;
  if (!src.foundationBeforeExpansion) return "";
  const t = String(src.foundationBeforeExpansionHe || "").trim();
  return t ? truncateHe(t, 168) : "";
}

export function downstreamSymptomLineHe(rowOrRec) {
  const o = rowOrRec && typeof rowOrRec === "object" ? rowOrRec : {};
  const sig = o.topicEngineRowSignals && typeof o.topicEngineRowSignals === "object" ? o.topicEngineRowSignals : null;
  const src = sig || o;
  const d = String(src.downstreamSymptomLikelihood || "");
  if (d !== "high" && d !== "moderate") return "";
  const sym = String(src.whyThisMayBeSymptomNotCoreHe || "").trim();
  if (sym) return truncateHe(sym, 165);
  const h = String(src.downstreamSymptomLikelihoodHe || "").trim();
  return h ? truncateHe(h, 140) : "";
}

/* -------------------------------------------------------------------------- */
/* Phase 15 — קומפקט UI: סדר עדיפות הוראתי אחיד, בלי כפילויות בין שכבות     */
/* עדיפות תוכן: (1) מה נראה (2) תמיכה (3) מה עדיין חסר (4) מה לדחות        */
/* (5) יסוד/מקומי — כאן רק מאחדים שורות מקבילות שמקורן באותם שדות מנוע.      */
/* -------------------------------------------------------------------------- */

/** @param {string} hay @param {string} needle */
function pr15HayContainsProbe(hay, needle, minProbe = 16) {
  const H = String(hay || "");
  const N = String(needle || "").trim();
  if (!H || !N) return false;
  const probe = N.slice(0, Math.min(Math.max(minProbe, 12), N.length));
  return probe.length >= 10 && H.includes(probe);
}

/**
 * עדכניות + ריענון + «ראיה טרייה» בשורה אחת (לא שלוש שורות זהירות כמעט זהות).
 * קדימות: freshness > fresh-evidence (מסונן) > recalibration.
 */
export function topicFreshnessUnifiedLineHe(rowOrRec) {
  const fr = freshnessLineHe(rowOrRec);
  if (fr) return fr;
  const fe = freshEvidenceNeedLineHe(rowOrRec);
  const rec = recalibrationLineHe(rowOrRec);
  if (fe && rec && !pr15HayContainsProbe(fe, rec, 14) && !pr15HayContainsProbe(rec, fe, 14)) {
    return truncateHe(`${fe} · ${rec}`, 195);
  }
  if (fe) return fe;
  return rec || "";
}

/**
 * התאמת תמיכה / צעד ברצף / ניסוח רצף — שורה אחת; קדימות ל-adjustment כי הוא מכסה לעיתים את הרצף.
 */
export function topicSupportFlowUnifiedLineHe(rowOrRec) {
  const adj = supportAdjustmentLineHe(rowOrRec);
  if (adj) return adj;
  const seqA = sequenceActionLineHe(rowOrRec);
  if (seqA) return seqA;
  return topicSupportSequenceOrReleaseLineHe(rowOrRec);
}

/** רצף + חזרתיות — מיזוג כשהטקסט חופף; אחרת « · » */
export function topicSequencingRepeatCompactLineHe(rowOrRec) {
  const flow = topicSupportFlowUnifiedLineHe(rowOrRec);
  const rep = topicRepetitionFatigueCompactLineHe(rowOrRec);
  if (!rep) return flow;
  if (!flow) return rep;
  if (pr15HayContainsProbe(flow, rep, 14) || pr15HayContainsProbe(rep, flow, 14)) return flow;
  return truncateHe(`${flow} · ${rep}`, 200);
}

/** זיכרון המלצה + תוצאה + המשך — בלי לשכפל משפטים כמעט זהים */
export function topicMemoryOutcomeContinuationCompactLineHe(rowOrRec) {
  const mem = recommendationMemoryLineHe(rowOrRec);
  const out = outcomeTrackingLineHe(rowOrRec);
  const cont = continuationDecisionLineHe(rowOrRec);
  const parts = [];
  let acc = "";
  if (mem) {
    parts.push(mem);
    acc = mem;
  }
  if (out && !pr15HayContainsProbe(acc, out, 18)) {
    parts.push(out);
    acc = parts.join(" ");
  }
  if (cont && !pr15HayContainsProbe(acc, cont, 18)) parts.push(cont);
  return parts.length ? truncateHe(parts.join(" · "), 210) : "";
}

/**
 * שער + מיקוד סבב + יעד ראיה + טריגר — שורה אחת כשהשדות חוזרים על אותה כוונה.
 * קדימות: gate narrative > focus > evidence target > trigger (רק אם מוסיף מידע).
 */
export function topicGatesEvidenceDecisionCompactLineHe(rowOrRec) {
  const gate = gateStateLineHe(rowOrRec);
  const focus = decisionFocusLineHe(rowOrRec);
  const ev = evidenceTargetLineHe(rowOrRec);
  const trig = gateTriggerCompactLineHe(rowOrRec);
  const parts = [];
  let acc = "";
  if (gate) {
    parts.push(gate);
    acc = gate;
  }
  if (focus && !pr15HayContainsProbe(acc, focus, 14)) {
    parts.push(focus);
    acc = parts.join(" ");
  }
  if (ev && !pr15HayContainsProbe(acc, ev, 18)) {
    parts.push(ev);
    acc = parts.join(" ");
  }
  if (trig && !pr15HayContainsProbe(acc, trig, 18)) parts.push(trig);
  return parts.length ? truncateHe(parts.join(" · "), 215) : "";
}

/** יסוד/מקומי + סדר התערבות + לפני הרחבה + תסמין משנה — מניעת כפילות בין שורות Phase 14 */
export function topicFoundationDependencyCompactLineHe(rowOrRec) {
  const dep = dependencyStateLineHe(rowOrRec);
  const ord = interventionOrderingLineHe(rowOrRec);
  const fbe = foundationBeforeExpansionLineHe(rowOrRec);
  const dss = downstreamSymptomLineHe(rowOrRec);
  const parts = [];
  let acc = "";
  if (dep) {
    parts.push(dep);
    acc = dep;
  }
  if (ord && !pr15HayContainsProbe(acc, ord, 12)) {
    parts.push(ord);
    acc = parts.join(" ");
  }
  if (fbe && !pr15HayContainsProbe(acc, fbe, 16)) {
    parts.push(fbe);
    acc = parts.join(" ");
  }
  if (dss && !pr15HayContainsProbe(acc, dss, 16)) parts.push(dss);
  return parts.length ? truncateHe(parts.join(" · "), 220) : "";
}
