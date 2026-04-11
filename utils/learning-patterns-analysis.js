import {
  MIN_PATTERN_FAMILY_FOR_DIAGNOSIS,
  MIN_MISTAKES_FOR_STRONG_RECOMMENDATION,
  normalizeMistakeEvent,
  mistakePatternClusterKey,
} from "./mistake-event";
import {
  weaknessLabelHe,
  sessionRowLabelHe,
  GENERIC_WEAKNESS_HE,
} from "./diagnostic-labels-he";

/**
 * === Subject narrative payload (patternDiagnostics.subjects[subjectId]) ===
 *
 * A) Shape (extends legacy fields; narrative is the source of truth for UI):
 * - subject, subjectLabelHe
 * - summaryHe: string | null
 * - topStrengths: Array<{ id, labelHe, questions, accuracy, confidence, needsPractice, excellent, tierHe }>
 * - topWeaknesses: Array<{ id, labelHe, mistakeCount, confidence, tierHe }>
 * - stableExcellence: Array<{ id, labelHe, questions, accuracy, confidence, needsPractice, excellent, tierHe }> — סף גבוה, נפרד מ־maintain
 * - maintain, improving: session bands + tierHe על כל שורה
 * - parentActionHe: string | null  (max 1 concrete home action)
 * - nextWeekGoalHe: string | null   (חיזוק + שימור when data allows)
 * - evidenceExamples: Array<{ type: "mistake"|"success", ... }>  (max 2; only moderate/high confidence)
 *
 * B) Ranking:
 * - Weaknesses: clusters by mistakePatternClusterKey, sort by mistakeCount desc → top 3 (≥ MIN_PATTERN_FAMILY).
 * - topStrengths: merge excellent-pool + strengths-pool (disjoint), sort by
 *   (excellent desc, accuracy desc, questions desc) → top 3.
 * - stableExcellence / maintain / improving: סריקת שורות דוח (ממוין דיוק) לדליים נפרדים — stableExcellence קודם (סף גבוה), אחר כך excellent/strengths/maintain/improving (ללא כפילויות).
 *
 * C) summaryHe: 1–2 Hebrew sentences — positives (stableExcellence, topStrengths, maintain), risks (topWeaknesses or improving),
 *    stability note if mistakeCount ≥ MIN_MISTAKES_FOR_STRONG_RECOMMENDATION, sparse-data note if needed.
 *
 * D) parentActionHe: one imperative block with duration + focus + method; prefers top weakness, else improving, else maintain.
 *    nextWeekGoalHe: optional "יעד לחיזוק" from top weakness or improving + "יעד לשימור" from topStrengths[0] or maintain[0]
 *    when questions ≥ 8 or excellent.
 *
 * E) UI: parent-report maps each tierHe to the card subtitle (not everything is "חולשה"; maintain → "עקביות"; stableExcellence → "הצטיינות היציבה").
 */

const SUBJECT_IDS = [
  "math",
  "geometry",
  "english",
  "science",
  "hebrew",
  "moledet-geography",
];

const REPORT_ROWS_KEY = {
  math: "mathOperations",
  geometry: "geometryTopics",
  english: "englishTopics",
  science: "scienceTopics",
  hebrew: "hebrewTopics",
  "moledet-geography": "moledetGeographyTopics",
};

const SUBJECT_LABEL_HE = {
  math: "חשבון",
  geometry: "גאומטריה",
  english: "אנגלית",
  science: "מדעים",
  hebrew: "עברית",
  "moledet-geography": "מולדת וגאוגרפיה",
};

/** Narrative caps (professional profile) */
const MAX_TOP_WEAKNESSES = 3;
const MAX_TOP_STRENGTHS = 3;
const MAX_MAINTAIN = 2;
const MAX_IMPROVING = 2;
/** עד כמה שורות "הצטיינות היציבה" (נפרד מ־maintain / חוזקות מובילות) */
const MAX_STABLE_EXCELLENCE = 3;
/** סף הצטיינות יציבה: לא מכריזים מהר — דיוק גבוה + מספיק שאלות בטווח */
const STABLE_EXCELLENCE_MIN_ACCURACY = 92;
const STABLE_EXCELLENCE_MIN_QUESTIONS = 22;
/** Internal pool before merge/rank */
const INTERNAL_SESSION_POOL = 12;

/** ברירת מחדל לשורת סשן בלי שם בעברית — בכרטיס "מגמת שיפור" מוצגת מילה קצרה */
const IMPROVING_GENERIC_PRACTICE_LABEL_ALIASES = new Set(["בנושא תרגול", "נושא בתרגול"]);

/**
 * תווית לתצוגה בכרטיסי "תחום במגמת שיפור" (ולדוחות ישנים במטמון).
 * @param {string|null|undefined} labelHe
 */
export function improvingDiagnosticsDisplayLabelHe(labelHe) {
  const lab = String(labelHe || "").trim();
  if (IMPROVING_GENERIC_PRACTICE_LABEL_ALIASES.has(lab)) return "תרגול";
  return lab;
}

/**
 * ניסוח קצר להורה מכל תווית חולשה — "בנושא חיבור" במקום "קושי נקודתי בחיבור" / "סביב הנושא …".
 * @param {string|null|undefined} labelHe
 */
function parentCopyTopicPhraseHe(labelHe) {
  const s = String(labelHe || "").trim();
  if (!s) return "בנושא שנבחר בתרגול";
  if (s === GENERIC_WEAKNESS_HE) return "בנושא שזוהה בתרגול";
  if (/^בנושא(\s|\/)/u.test(s)) return s;

  const tailed = [
    /^קושי נקודתי ב(.+)$/u,
    /^קושי חוזר \/ חולשה יציבה ב(.+)$/u,
    /^קושי חוזר ב(.+)$/u,
  ];
  for (const re of tailed) {
    const m = s.match(re);
    if (m) return `בנושא ${m[1].trim()}`;
  }

  const dePattern = s.replace(/^דפוס שגיאות:\s*/u, "").trim();
  if (dePattern && dePattern !== s) return `בנושא ${dePattern}`;

  if (s.startsWith("בלבול")) return `בנושא ${s}`;

  if (/^קושי\s+/u.test(s)) {
    const rest = s.replace(/^קושי\s+/u, "").trim();
    if (/^בנושא(\s|\/)/u.test(rest)) return rest;
    return `בנושא ${rest}`;
  }

  return `בנושא ${s}`;
}

/** לניסוח "מומלץ להתמקד…" — נקודתיים אחרי "בנושא" / "בנושא/ים" */
function parentCopyTopicPhraseForFocusHe(labelHe) {
  return parentCopyTopicPhraseHe(labelHe)
    .replace(/^בנושא\/ים\s+/u, "בנושא/ים: ")
    .replace(/^בנושא\s+/u, "בנושא: ");
}

/** משפט יעד לחיזוק מנקודת מבט של הצלחה, לא "לצמצם טעויות בדפוס" */
function successRateImprovementGoalHe(labelHe) {
  const ph = parentCopyTopicPhraseHe(labelHe);
  const core = ph
    .replace(/^בנושא\/ים\s+/u, "")
    .replace(/^בנושא\s+/u, "")
    .trim() || ph;
  if (!core) return "להעלות את אחוזי ההצלחה במקצוע";
  if (/^ב/u.test(core)) return `להעלות את אחוזי ההצלחה ${core}`;
  return `להעלות את אחוזי ההצלחה ב${core}`;
}

function recStrength(mistakeCount) {
  if (mistakeCount >= MIN_MISTAKES_FOR_STRONG_RECOMMENDATION) return "strong";
  if (mistakeCount >= MIN_PATTERN_FAMILY_FOR_DIAGNOSIS) return "moderate";
  return "tentative";
}

function rowConfidenceFromSessions(row) {
  const q = Number(row?.questions) || 0;
  if (q >= 24) return "high";
  if (q >= 10) return "moderate";
  return "low";
}

function formatSessionBand(subjectId, row, rowKey) {
  return {
    id: `${subjectId}:${String(rowKey).slice(0, 120)}`,
    labelHe: sessionRowLabelHe(subjectId, row),
    questions: Number(row?.questions) || 0,
    accuracy: Number(row?.accuracy) || 0,
    confidence: rowConfidenceFromSessions(row),
    needsPractice: !!row?.needsPractice,
    excellent: !!row?.excellent,
  };
}

function joinHebrewList(items) {
  const xs = (items || []).map((s) => String(s || "").trim()).filter(Boolean);
  if (!xs.length) return "";
  if (xs.length === 1) return xs[0];
  if (xs.length === 2) return `${xs[0]} ו${xs[1]}`;
  return `${xs.slice(0, -1).join(", ")} ו${xs[xs.length - 1]}`;
}

function strengthTierHe(row) {
  const q = Number(row?.questions) || 0;
  const acc = Number(row?.accuracy) || 0;
  if (row?.excellent && q >= 20 && acc >= 90) return "חוזקה יציבה";
  if (row?.excellent) return "חוזקה בולטת";
  if (acc >= 92 && q >= 14) return "חוזקה יציבה";
  return "חוזקה בולטת";
}

function weaknessTierHe(labelHe, mistakeCount, confidence) {
  const lab = String(labelHe || "").trim();
  if (!lab || lab === GENERIC_WEAKNESS_HE) return "תחום לחיזוק";
  if (mistakeCount >= MIN_MISTAKES_FOR_STRONG_RECOMMENDATION) {
    return "קושי חוזר";
  }
  if (mistakeCount >= MIN_PATTERN_FAMILY_FOR_DIAGNOSIS) {
    if (confidence === "high") return "קושי חוזר";
    return "קושי נקודתי";
  }
  return "תחום לחיזוק";
}

function buildTopStrengthsMerged(excellent, strengths, max) {
  const combined = [...(excellent || []), ...(strengths || [])];
  combined.sort((a, b) => {
    const ex = (x) => (x.excellent ? 1 : 0);
    if (ex(b) !== ex(a)) return ex(b) - ex(a);
    const acc = (x) => Number(x.accuracy) || 0;
    if (acc(b) !== acc(a)) return acc(b) - acc(a);
    return (Number(b.questions) || 0) - (Number(a.questions) || 0);
  });
  return combined.slice(0, max).map((row) => ({
    ...row,
    tierHe: strengthTierHe(row),
  }));
}

/**
 * מחלק שורות דוח ל־stableExcellence / excellent / strengths / maintain / improving (ללא כפילויות לפי מפתח שורה).
 * אוסף בריכה פנימית גדולה יותר לצורך דירוג לפני חיתוך ל־topStrengths וכו׳.
 */
function buildSessionBands(subjectId, report) {
  const rowsKey = REPORT_ROWS_KEY[subjectId];
  const map = rowsKey && report[rowsKey] ? report[rowsKey] : {};
  const entries = Object.entries(map || {})
    .map(([rowKey, row]) => ({ rowKey, row }))
    .sort((a, b) => {
      const acc = (x) => Number(x.row?.accuracy) || 0;
      const q = (x) => Number(x.row?.questions) || 0;
      return acc(b) - acc(a) || q(b) - q(a);
    });

  const used = new Set();
  const take = (predicate, max) => {
    const out = [];
    for (const { rowKey, row } of entries) {
      if (out.length >= max) break;
      if (!row || typeof row !== "object") continue;
      const q = Number(row.questions) || 0;
      if (q < 5) continue;
      if (used.has(rowKey)) continue;
      if (!predicate(row, q)) continue;
      used.add(rowKey);
      out.push(formatSessionBand(subjectId, row, rowKey));
    }
    return out;
  };

  const stableExcellenceRaw = take(
    (row, q) => {
      if (row.needsPractice) return false;
      const acc = Number(row.accuracy) || 0;
      if (acc < STABLE_EXCELLENCE_MIN_ACCURACY) return false;
      if (q < STABLE_EXCELLENCE_MIN_QUESTIONS) return false;
      return true;
    },
    MAX_STABLE_EXCELLENCE
  );

  const stableExcellenceOut = stableExcellenceRaw.map((r) => ({
    ...r,
    tierHe: "הצטיינות היציבה",
  }));

  const excellent = take(
    (row, q) => row.excellent && q >= 10,
    INTERNAL_SESSION_POOL
  );

  const strengths = take(
    (row, q) =>
      !row.excellent &&
      Number(row.accuracy) >= 87 &&
      q >= 8 &&
      !row.needsPractice,
    INTERNAL_SESSION_POOL
  );

  const maintain = take(
    (row, q) => {
      const acc = Number(row.accuracy) || 0;
      return !row.needsPractice && acc >= 80 && acc < 93 && q >= 6;
    },
    INTERNAL_SESSION_POOL
  );

  const improving = take(
    (row, q) => {
      const acc = Number(row.accuracy) || 0;
      if (row.needsPractice && acc >= 55 && acc < 78) return true;
      if (!row.excellent && acc >= 68 && acc <= 82 && q >= 6) return true;
      return false;
    },
    INTERNAL_SESSION_POOL
  );

  const topStrengths = buildTopStrengthsMerged(
    excellent,
    strengths,
    MAX_TOP_STRENGTHS
  );

  const excellentOut = topStrengths.filter((r) => r.excellent);
  const strengthsOut = topStrengths.filter((r) => !r.excellent);

  const maintainOut = maintain
    .slice(0, MAX_MAINTAIN)
    .map((r) => ({ ...r, tierHe: "עקביות" }));
  const improvingOut = improving
    .slice(0, MAX_IMPROVING)
    .map((r) => ({
      ...r,
      tierHe: "תחום במגמת שיפור",
      labelHe: improvingDiagnosticsDisplayLabelHe(r.labelHe),
    }));

  return {
    stableExcellence: stableExcellenceOut,
    excellent: excellentOut,
    strengths: strengthsOut,
    maintain: maintainOut,
    improving: improvingOut,
    topStrengths,
  };
}

function buildEvidenceMistakeFromEvent(ev, confidence) {
  if (!ev) return null;
  const ex = String(ev.exerciseText || "").trim();
  if (ex.length > 220) return null;
  if (!ex && ev.userAnswer == null) return null;
  if (confidence !== "high" && confidence !== "moderate") return null;
  return {
    exerciseText: ex || null,
    questionLabel: ev.questionLabel || null,
    correctAnswer: ev.correctAnswer ?? null,
    userAnswer: ev.userAnswer ?? null,
    confidence,
  };
}

function buildEvidenceSuccessFromPick(pick) {
  if (!pick) return null;
  if (pick.questions < 8) return null;
  const conf =
    pick.confidence === "high" || pick.questions >= 20 ? "high" : "moderate";
  return {
    titleHe: "חוזקה בתרגול",
    bodyHe: `בנושא ${pick.labelHe} רואים ביצועים טובים: כ־${pick.accuracy}% נכון מתוך ${pick.questions} שאלות בטווח התאריכים.`,
    confidence: conf,
  };
}

function buildSummaryHe(
  subjectLabelHe,
  stableExcellence,
  topStrengths,
  topWeaknesses,
  maintain,
  improving,
  wrongCount,
  mistakeEventCount,
  diagnosticSparseNoteHe
) {
  const label = subjectLabelHe || "המקצוע";
  const opening = `על ${label}, אחרי מה שנאסף בטווח:`;

  if (
    !stableExcellence.length &&
    !topStrengths.length &&
    !topWeaknesses.length &&
    !maintain.length &&
    !improving.length
  ) {
    if (diagnosticSparseNoteHe) return `${opening} ${diagnosticSparseNoteHe}`;
    if (wrongCount > 0 && !topWeaknesses.length) {
      return `${opening} יש כאן כמה טעויות בלי "סיפור" חוזר ברור — עדיף לא למהר למסקנות; נמשיך לאסוף תרגול בשקט.`;
    }
    if (mistakeEventCount >= 0 && mistakeEventCount < 5) {
      return `${opening} עדיין מעט חומר — ניסוח קצר יגיע כשיהיה יותר בסיס.`;
    }
    return null;
  }

  const parts = [];
  if (stableExcellence.length) {
    const exNames = joinHebrewList(stableExcellence.map((s) => s.labelHe));
    parts.push(
      stableExcellence.length > 1
        ? `ניכרת הצטיינות היציבה ב${exNames}.`
        : `ניכרת הצטיינות היציבה ב${stableExcellence[0].labelHe}.`
    );
  }
  if (topStrengths.length) {
    const names = joinHebrewList(topStrengths.map((s) => s.labelHe));
    parts.push(
      topStrengths.length > 1
        ? `רואים חוזקות בולטות ב${names}.`
        : `רואים חוזקה בולטת ב${names}.`
    );
  } else if (!stableExcellence.length && maintain.length) {
    parts.push(
      `רואים עקביות טובה ב־${joinHebrewList(maintain.map((m) => m.labelHe))}.`
    );
  } else if (stableExcellence.length && maintain.length) {
    parts.push(
      `ניכרת גם עקביות טובה ב־${joinHebrewList(maintain.map((m) => m.labelHe))}.`
    );
  }

  if (topWeaknesses.length) {
    const names = joinHebrewList(
      topWeaknesses.map((w) => parentCopyTopicPhraseHe(w.labelHe))
    );
    let s =
      topWeaknesses.length > 1
        ? `במקביל יש מספר תחומים שדורשים חיזוק: ${names}.`
        : `במקביל נדרש חיזוק ${parentCopyTopicPhraseHe(topWeaknesses[0].labelHe)}.`;
    if (
      topWeaknesses.some(
        (w) => w.mistakeCount >= MIN_MISTAKES_FOR_STRONG_RECOMMENDATION
      )
    ) {
      s += " זה חוזר מספיק פעמים כדי ששווה לגשת אליו מוקדם — בלי פאניקה, עם מבנה קטן.";
    }
    parts.push(s);
  } else if (wrongCount > 0) {
    parts.push(
      "הטעויות שיש עדיין לא מספרות סיפור אחד ברור — זה בסדר; נמשיך לעקוב."
    );
  }

  if (!topWeaknesses.length && improving.length) {
    parts.push(
      `רואים גם תחומים במגמת שיפור: ${joinHebrewList(improving.map((x) => x.labelHe))}.`
    );
  }

  const text = parts.join(" ").trim();
  return text || null;
}

function buildParentActionHe(
  subjectLabelHe,
  topWeaknesses,
  improving,
  maintain,
  topStrengths
) {
  const subj = subjectLabelHe || "המקצוע";
  const w0 = topWeaknesses[0];
  const i0 = improving[0];
  const m0 = maintain[0];
  const s0 = topStrengths[0];

  if (w0) {
    return `פעם־פעמיים בשבוע, רבע שעה בלבד: משימה אחת ב${subj} ${parentCopyTopicPhraseHe(w0.labelHe)} — קוראים יחד את הניסוח, אומרים בקול מה נתון ומה מבקשים, עושים טיוטה קטנה ורק אז כותבים נקי ומתיישרים עם הפתרון.`;
  }
  if (i0) {
    return `פעמיים בשבוע, רבע שעה: תרגול קצר ב${subj} ${parentCopyTopicPhraseHe(i0.labelHe)} (כרגע דיוק כ־${i0.accuracy}%) — מעודדים לנסח את כל הרעיון לפני שבודקים אם זה "נכון".`;
  }
  if (m0 || s0) {
    const pick = m0 || s0;
    return `פעם בשבוע, עשר דק׳ נעימות: לשמור על תרגול רגוע ב${subj} ${parentCopyTopicPhraseHe(pick.labelHe)} — המטרה היא להרגיש בבית, לא להאיץ.`;
  }
  return null;
}

function buildNextWeekGoalHe(topWeaknesses, improving, topStrengths, maintain, stableExcellence) {
  const goals = [];
  const w0 = topWeaknesses[0];
  if (w0) {
    goals.push(
      `לנסות שבוע אחד ${successRateImprovementGoalHe(w0.labelHe)} — מספיק שיפור באחוזי ההצלחה.`
    );
  } else if (improving[0]) {
    const labImp = improvingDiagnosticsDisplayLabelHe(improving[0].labelHe);
    goals.push(
      `שבועיים קצרים סביב ${labImp} — ${successRateImprovementGoalHe(improving[0].labelHe)} — שני מפגשים קטנים, לא מרתון.`
    );
  }

  const preserve =
    stableExcellence[0] ||
    topStrengths.find((t) => t.excellent || t.questions >= 8) ||
    maintain.find((m) => m.questions >= 8) ||
    topStrengths[0] ||
    maintain[0];
  if (preserve) {
    goals.push(
      `להמשיך בשגרה נינוחה ${parentCopyTopicPhraseHe(preserve.labelHe)} — כדי שהדיוק הטוב יישמר בשגרת התרגול.`
    );
  }

  if (!goals.length) return null;
  return goals.join(" ");
}

function buildEvidenceExamples(evidenceMistake, evidenceSuccess) {
  const out = [];
  if (evidenceMistake) {
    out.push({ type: "mistake", ...evidenceMistake });
  }
  if (evidenceSuccess) {
    out.push({
      type: "success",
      titleHe: evidenceSuccess.titleHe,
      bodyHe: evidenceSuccess.bodyHe,
      confidence: evidenceSuccess.confidence,
    });
  }
  return out.slice(0, 2);
}

/**
 * מקטעים מובנים לדוח מקיף — מבוסס על אותם דליים כמו הכרטיסים הקיימים, בלי טקסט דמה.
 */
function buildDiagnosticSectionsHe({
  stableExcellence,
  topStrengths,
  maintain,
  improving,
  topWeaknesses,
  insufficientData,
  diagnosticSparseNoteHe,
  parentActionHe,
  nextWeekGoalHe,
}) {
  const strongHe = [];
  for (const x of stableExcellence) {
    strongHe.push(`${x.labelHe} — דיוק כ־${x.accuracy}% (${x.questions} שאלות)`);
  }
  for (const x of topStrengths) {
    if (strongHe.length >= 6) break;
    strongHe.push(`${x.labelHe} — דיוק כ־${x.accuracy}% (${x.questions} שאלות)`);
  }

  const maintainHe = (maintain || []).map(
    (x) => `${x.labelHe} — דיוק ${x.accuracy}% (${x.questions} שאלות; מומלץ לשמר קצב)`
  );

  const improveHe = (improving || []).map(
    (x) =>
      `${improvingDiagnosticsDisplayLabelHe(x.labelHe)} — דיוק ${x.accuracy}% (${x.questions} שאלות)`
  );

  const urgentAttentionHe = topWeaknesses.map((w) =>
    `${w.labelHe}${
      typeof w.mistakeCount === "number" ? ` — כ־${w.mistakeCount} אירועי טעות דומים בטווח` : ""
    }`
  );

  const insufficientDataHe = [];
  if (diagnosticSparseNoteHe) insufficientDataHe.push(diagnosticSparseNoteHe);
  for (const u of insufficientData.slice(0, 5)) {
    insufficientDataHe.push(u.note || "נתונים חלקיים לדפוס מסוים.");
  }
  const insufficientDataNoteHe =
    insufficientData.length > 8
      ? "יש עוד אזורים עם טעויות מפוזרות שלא הגיעו לסף דפוס יציב — האבחון בהם נשאר חלקי."
      : null;
  if (insufficientDataNoteHe) insufficientDataHe.push(insufficientDataNoteHe);

  return {
    strongHe,
    maintainHe,
    improveHe,
    urgentAttentionHe,
    insufficientDataHe,
    concreteHomeActionHe: parentActionHe || null,
    nextShortGoalHe: nextWeekGoalHe || null,
  };
}

function buildSubSkillInsightsHe(topWeaknesses) {
  return topWeaknesses.slice(0, 4).map((w) => ({
    lineHe: w.labelHe,
    evidenceNoteHe:
      typeof w.mistakeCount === "number" && w.mistakeCount >= MIN_MISTAKES_FOR_STRONG_RECOMMENDATION
        ? "דפוס חוזר חזק בטווח התאריכים."
        : typeof w.mistakeCount === "number" && w.mistakeCount >= MIN_PATTERN_FAMILY_FOR_DIAGNOSIS
          ? "דפוס חוזר בינוני — מומלץ מעקב."
          : "אות ראשוני בלבד — עדיין מוקדם לסיכום חד־משמעי.",
  }));
}

/**
 * @param {Record<string, unknown>} report
 * @param {Record<string, unknown[]>} [rawMistakesBySubject]
 */
export function analyzeLearningPatterns(report, rawMistakesBySubject = {}) {
  const out = {
    version: 2,
    generatedAt: new Date().toISOString(),
    constants: {
      minMistakesPerPatternFamily: MIN_PATTERN_FAMILY_FOR_DIAGNOSIS,
      minMistakesForStrongRecommendation: MIN_MISTAKES_FOR_STRONG_RECOMMENDATION,
      maxWeaknesses: MAX_TOP_WEAKNESSES,
      maxStrengthRows: MAX_TOP_STRENGTHS,
      maxMaintain: MAX_MAINTAIN,
      maxImproving: MAX_IMPROVING,
      maxStableExcellence: MAX_STABLE_EXCELLENCE,
      stableExcellenceMinAccuracy: STABLE_EXCELLENCE_MIN_ACCURACY,
      stableExcellenceMinQuestions: STABLE_EXCELLENCE_MIN_QUESTIONS,
    },
    subjects: {},
  };

  if (!report || typeof report !== "object") return out;

  for (const sid of SUBJECT_IDS) {
    const rawList = Array.isArray(rawMistakesBySubject[sid])
      ? rawMistakesBySubject[sid]
      : [];
    const events = rawList.map((r) => normalizeMistakeEvent(r, sid));
    const wrong = events.filter((e) => !e.isCorrect);

    const clusters = {};
    wrong.forEach((ev) => {
      const key = mistakePatternClusterKey(ev);
      if (!clusters[key]) clusters[key] = [];
      clusters[key].push(ev);
    });

    const weaknessCandidates = [];
    const insufficientData = [];

    Object.entries(clusters).forEach(([, list]) => {
      const n = list.length;
      if (n < MIN_PATTERN_FAMILY_FOR_DIAGNOSIS) {
        if (insufficientData.length < 24) {
          insufficientData.push({
            mistakeCount: n,
            note: "פחות מ־5 טעויות באותו דפוס — לא מספיק לקביעת חולשה יציבה",
          });
        }
        return;
      }
      const sample = list[list.length - 1];
      const labelHe = weaknessLabelHe(sid, sample);
      const rs = recStrength(n);
      weaknessCandidates.push({
        labelHe,
        mistakeCount: n,
        confidence: rs === "strong" ? "high" : "moderate",
        sampleEvent: sample,
      });
    });

    weaknessCandidates.sort((a, b) => b.mistakeCount - a.mistakeCount);
    const topWeaknesses = weaknessCandidates.slice(0, MAX_TOP_WEAKNESSES).map((w, i) => {
      const lab = w.labelHe || GENERIC_WEAKNESS_HE;
      return {
        id: `${sid}:w:${i}`,
        labelHe: lab,
        mistakeCount: w.mistakeCount,
        confidence: w.confidence,
        tierHe: weaknessTierHe(lab, w.mistakeCount, w.confidence),
      };
    });

    const weaknesses = topWeaknesses.map((w) => ({ ...w }));

    const {
      stableExcellence,
      excellent,
      strengths,
      maintain,
      improving,
      topStrengths,
    } = buildSessionBands(sid, report);

    const studentRecommendationsImprove = [];
    const studentRecommendationsMaintain = [];
    const parentRecommendationsImprove = [];
    const parentRecommendationsMaintain = [];

    for (const w of topWeaknesses.slice(0, 2)) {
      const rs = recStrength(w.mistakeCount);
      studentRecommendationsImprove.push({
        id: `stu-imp:${w.id}`,
        textHe: `מומלץ להתמקד ${parentCopyTopicPhraseForFocusHe(w.labelHe)} (זוהו ${w.mistakeCount} טעויות דומות בטווח התאריכים). זוהה קושי חוזר`,
        strength: rs,
      });
    }

    const w0 = topWeaknesses[0];
    if (w0) {
      const rs = recStrength(w0.mistakeCount);
      parentRecommendationsImprove.push({
        id: `par-imp:${w0.id}`,
        textHe:
          rs === "strong"
            ? `יש דפוס חוזר ${parentCopyTopicPhraseHe(w0.labelHe)}. מומלץ לשבת יחד על דוגמה אחת ולבדוק את הלוגיקה צעד־אחר־צעד.`
            : `מתחיל להתגבש דפוס ${parentCopyTopicPhraseHe(w0.labelHe)}. מומלץ מעקב קל אחרי שבוע נוסף של תרגול ממוקד.`,
        strength: rs,
      });
    }

    const topPositive =
      stableExcellence[0] || topStrengths[0] || excellent[0] || strengths[0];
    if (topPositive) {
      const rs =
        topPositive.confidence === "high" || topPositive.questions >= 18
          ? "strong"
          : "moderate";
      studentRecommendationsMaintain.push({
        id: `stu-maint:${topPositive.id}`,
        textHe: `להמשיך לתרגל בנוחות בנושא ${topPositive.labelHe} — יש כאן עקביות (דיוק כ־${topPositive.accuracy}%).`,
        strength: rs,
      });
      parentRecommendationsMaintain.push({
        id: `par-maint:${topPositive.id}`,
        textHe: `מומלץ לעודד על ההתמדה בנושא ${topPositive.labelHe} — רואים הצלחה חוזרת; שימור הרגל חיובי חשוב לא פחות מתיקון טעויות.`,
        strength: rs,
      });
    }

    let diagnosticSparseNoteHe = null;
    if (!topWeaknesses.length && wrong.length > 0) {
      diagnosticSparseNoteHe =
        "יש טעויות בודדות אך בלי דפוס שחוזר מספיק פעמים — עדיין לא ניתן לקבוע חולשה יציבה.";
      if (!parentRecommendationsImprove.length) {
        parentRecommendationsImprove.push({
          id: `par-imp:${sid}:sparse`,
          textHe: diagnosticSparseNoteHe,
          strength: "tentative",
        });
      }
    }

    let evidenceMistake = null;
    const wTop = weaknessCandidates[0];
    if (wTop && wTop.sampleEvent) {
      evidenceMistake = buildEvidenceMistakeFromEvent(
        wTop.sampleEvent,
        wTop.confidence
      );
    }

    const evidenceSuccess = buildEvidenceSuccessFromPick(
      stableExcellence[0] || topStrengths[0]
    );
    const evidenceExamples = buildEvidenceExamples(evidenceMistake, evidenceSuccess);

    const summaryHe = buildSummaryHe(
      SUBJECT_LABEL_HE[sid],
      stableExcellence,
      topStrengths,
      topWeaknesses,
      maintain,
      improving,
      wrong.length,
      events.length,
      diagnosticSparseNoteHe
    );

    const parentActionHe = buildParentActionHe(
      SUBJECT_LABEL_HE[sid],
      topWeaknesses,
      improving,
      maintain,
      topStrengths
    );

    const nextWeekGoalHe = buildNextWeekGoalHe(
      topWeaknesses,
      improving,
      topStrengths,
      maintain,
      stableExcellence
    );

    const diagnosticSectionsHe = buildDiagnosticSectionsHe({
      stableExcellence,
      topStrengths,
      maintain,
      improving,
      topWeaknesses,
      insufficientData,
      diagnosticSparseNoteHe,
      parentActionHe,
      nextWeekGoalHe,
    });
    const subSkillInsightsHe = buildSubSkillInsightsHe(topWeaknesses);

    const hasAnySignal =
      stableExcellence.length > 0 ||
      topWeaknesses.length > 0 ||
      topStrengths.length > 0 ||
      maintain.length > 0 ||
      improving.length > 0 ||
      studentRecommendationsImprove.length > 0 ||
      studentRecommendationsMaintain.length > 0 ||
      parentRecommendationsImprove.length > 0 ||
      parentRecommendationsMaintain.length > 0 ||
      evidenceMistake != null ||
      evidenceSuccess != null ||
      !!summaryHe;

    out.subjects[sid] = {
      subject: sid,
      subjectLabelHe: SUBJECT_LABEL_HE[sid],
      mistakeEventCount: events.length,
      wrongCount: wrong.length,
      hasAnySignal,
      summaryHe,
      topStrengths,
      topWeaknesses,
      parentActionHe,
      nextWeekGoalHe,
      evidenceExamples,
      weaknesses,
      strengths,
      stableExcellence,
      excellent,
      maintain,
      improving,
      studentRecommendationsImprove,
      studentRecommendationsMaintain,
      parentRecommendationsImprove,
      parentRecommendationsMaintain,
      evidenceMistake,
      evidenceSuccess,
      insufficientData,
      diagnosticSparseNoteHe,
      diagnosticSectionsHe,
      subSkillInsightsHe,
    };
  }

  return out;
}

/** דוגמה סטטית לפי מבנה גרסה 2 */
export const EXAMPLE_PATTERN_DIAGNOSTICS_PAYLOAD = {
  version: 2,
  generatedAt: "2026-04-11T12:00:00.000Z",
  constants: {
    minMistakesPerPatternFamily: 5,
    minMistakesForStrongRecommendation: 10,
    maxWeaknesses: 3,
    maxStrengthRows: 3,
    maxMaintain: 2,
    maxImproving: 2,
    maxStableExcellence: 3,
    stableExcellenceMinAccuracy: 92,
    stableExcellenceMinQuestions: 22,
  },
  subjects: {
    math: {
      subject: "math",
      subjectLabelHe: "חשבון",
      mistakeEventCount: 12,
      wrongCount: 12,
      hasAnySignal: true,
      summaryHe:
        "תמונת המקצוע בחשבון: ניכרת הצטיינות היציבה בחיבור. במקביל נדרש חיזוק בנושא בהשוואת כמויות או מספרים.",
      stableExcellence: [
        {
          id: "math:addition:learning",
          labelHe: "חיבור",
          questions: 42,
          accuracy: 93,
          confidence: "high",
          needsPractice: false,
          excellent: true,
          tierHe: "הצטיינות היציבה",
        },
      ],
      topStrengths: [],
      topWeaknesses: [
        {
          id: "math:w:0",
          labelHe: "קושי בהשוואת כמויות או מספרים",
          mistakeCount: 7,
          confidence: "moderate",
          tierHe: "קושי נקודתי",
        },
      ],
      parentActionHe:
        "שלוש פעמים בשבוע, 15–20 דק׳ בכל מפגש: לבחור משימה אחת בחשבון בנושא בהשוואת כמויות או מספרים — לקרוא יחד את הניסוח, לנסח בקול מה נתון ומה מבקשים, לבצע צעד ראשון על דף טיוטה ורק אז לכתוב תשובה סופית ולבדוק מול הפתרון.",
      nextWeekGoalHe:
        "יעד לחיזוק: להעלות את אחוזי ההצלחה בהשוואת כמויות או מספרים (לפחות ניסיון אחד מוצלח יותר מהשבוע שעבר). יעד לשימור: להמשיך בשגרת תרגול נינוחה בנושא חיבור כדי לשמר את רמת הדיוק.",
      evidenceExamples: [
        {
          type: "mistake",
          exerciseText: "בכמה שקים המחיר של המחשב גבוה יותר?",
          questionLabel: null,
          correctAnswer: 120,
          userAnswer: 102,
          confidence: "moderate",
        },
        {
          type: "success",
          titleHe: "חוזקה בתרגול",
          bodyHe:
            "בנושא חיבור רואים ביצועים טובים: כ־93% נכון מתוך 42 שאלות בטווח התאריכים.",
          confidence: "high",
        },
      ],
      weaknesses: [
        {
          id: "math:w:0",
          labelHe: "קושי בהשוואת כמויות או מספרים",
          mistakeCount: 7,
          confidence: "moderate",
          tierHe: "קושי נקודתי",
        },
      ],
      strengths: [],
      excellent: [],
      maintain: [],
      improving: [],
      studentRecommendationsImprove: [
        {
          id: "stu-imp:math:w:0",
          textHe:
            "מומלץ להתמקד בנושא: בהשוואת כמויות או מספרים (זוהו 7 טעויות דומות בטווח התאריכים). זוהה קושי חוזר",
          strength: "moderate",
        },
      ],
      studentRecommendationsMaintain: [
        {
          id: "stu-maint:math:addition:learning",
          textHe:
            "להמשיך לתרגל בנוחות בנושא חיבור — יש כאן עקביות (דיוק כ־93%).",
          strength: "strong",
        },
      ],
      parentRecommendationsImprove: [
        {
          id: "par-imp:math:w:0",
          textHe:
            "מתחיל להתגבש דפוס בנושא בהשוואת כמויות או מספרים. מומלץ מעקב קל אחרי שבוע נוסף של תרגול ממוקד.",
          strength: "moderate",
        },
      ],
      parentRecommendationsMaintain: [
        {
          id: "par-maint:math:addition:learning",
          textHe:
            "מומלץ לעודד על ההתמדה בנושא חיבור — רואים הצלחה חוזרת; שימור הרגל חיובי חשוב לא פחות מתיקון טעויות.",
          strength: "strong",
        },
      ],
      evidenceMistake: {
        exerciseText: "בכמה שקים המחיר של המחשב גבוה יותר?",
        questionLabel: null,
        correctAnswer: 120,
        userAnswer: 102,
        confidence: "moderate",
      },
      evidenceSuccess: {
        titleHe: "חוזקה בתרגול",
        bodyHe:
          "בנושא חיבור רואים ביצועים טובים: כ־93% נכון מתוך 42 שאלות בטווח התאריכים.",
        confidence: "high",
      },
      insufficientData: [
        {
          mistakeCount: 2,
          note: "פחות מ־5 טעויות באותו דפוס — לא מספיק לקביעת חולשה יציבה",
        },
      ],
      diagnosticSparseNoteHe: null,
    },
    geometry: {
      subject: "geometry",
      subjectLabelHe: "גאומטריה",
      mistakeEventCount: 9,
      wrongCount: 9,
      hasAnySignal: true,
      summaryHe:
        "תמונת המקצוע בגאומטריה: במקביל נדרש חיזוק בנושא בלבול חוזר בין היקף לשטח.",
      topStrengths: [],
      stableExcellence: [],
      topWeaknesses: [
        {
          id: "geometry:w:0",
          labelHe: "בלבול חוזר בין היקף לשטח",
          mistakeCount: 6,
          confidence: "moderate",
          tierHe: "קושי נקודתי",
        },
      ],
      parentActionHe:
        "שלוש פעמים בשבוע, 15–20 דק׳ בכל מפגש: לבחור משימה אחת בגאומטריה בנושא בלבול חוזר בין היקף לשטח — לקרוא יחד את הניסוח, לנסח בקול מה נתון ומה מבקשים, לבצע צעד ראשון על דף טיוטה ורק אז לכתוב תשובה סופית ולבדוק מול הפתרון.",
      nextWeekGoalHe:
        "יעד לחיזוק: להעלות את אחוזי ההצלחה בלבול חוזר בין היקף לשטח (לפחות ניסיון אחד מוצלח יותר מהשבוע שעבר).",
      evidenceExamples: [
        {
          type: "mistake",
          exerciseText: "מה ההיקף של מלבן 5×3 ס״מ?",
          questionLabel: null,
          correctAnswer: "16 ס״מ",
          userAnswer: "15 ס״מ",
          confidence: "moderate",
        },
      ],
      weaknesses: [
        {
          id: "geometry:w:0",
          labelHe: "בלבול חוזר בין היקף לשטח",
          mistakeCount: 6,
          confidence: "moderate",
          tierHe: "קושי נקודתי",
        },
      ],
      strengths: [],
      excellent: [],
      maintain: [],
      improving: [],
      studentRecommendationsImprove: [
        {
          id: "stu-imp:geometry:w:0",
          textHe:
            "מומלץ להתמקד בנושא: בלבול חוזר בין היקף לשטח (זוהו 6 טעויות דומות בטווח התאריכים). זוהה קושי חוזר",
          strength: "moderate",
        },
      ],
      studentRecommendationsMaintain: [],
      parentRecommendationsImprove: [
        {
          id: "par-imp:geometry:w:0",
          textHe:
            "מתחיל להתגבש דפוס בנושא בלבול חוזר בין היקף לשטח. מומלץ מעקב קל אחרי שבוע נוסף של תרגול ממוקד.",
          strength: "moderate",
        },
      ],
      parentRecommendationsMaintain: [],
      evidenceMistake: {
        exerciseText: "מה ההיקף של מלבן 5×3 ס״מ?",
        questionLabel: null,
        correctAnswer: "16 ס״מ",
        userAnswer: "15 ס״מ",
        confidence: "moderate",
      },
      evidenceSuccess: null,
      insufficientData: [],
      diagnosticSparseNoteHe: null,
    },
    english: {
      subject: "english",
      subjectLabelHe: "אנגלית",
      mistakeEventCount: 0,
      wrongCount: 0,
      hasAnySignal: false,
      summaryHe: null,
      topStrengths: [],
      stableExcellence: [],
      topWeaknesses: [],
      parentActionHe: null,
      nextWeekGoalHe: null,
      evidenceExamples: [],
      weaknesses: [],
      strengths: [],
      excellent: [],
      maintain: [],
      improving: [],
      studentRecommendationsImprove: [],
      studentRecommendationsMaintain: [],
      parentRecommendationsImprove: [],
      parentRecommendationsMaintain: [],
      evidenceMistake: null,
      evidenceSuccess: null,
      insufficientData: [],
      diagnosticSparseNoteHe: null,
    },
    science: {
      subject: "science",
      subjectLabelHe: "מדעים",
      mistakeEventCount: 0,
      wrongCount: 0,
      hasAnySignal: false,
      summaryHe: null,
      topStrengths: [],
      stableExcellence: [],
      topWeaknesses: [],
      parentActionHe: null,
      nextWeekGoalHe: null,
      evidenceExamples: [],
      weaknesses: [],
      strengths: [],
      excellent: [],
      maintain: [],
      improving: [],
      studentRecommendationsImprove: [],
      studentRecommendationsMaintain: [],
      parentRecommendationsImprove: [],
      parentRecommendationsMaintain: [],
      evidenceMistake: null,
      evidenceSuccess: null,
      insufficientData: [],
      diagnosticSparseNoteHe: null,
    },
    hebrew: {
      subject: "hebrew",
      subjectLabelHe: "עברית",
      mistakeEventCount: 11,
      wrongCount: 11,
      hasAnySignal: true,
      summaryHe:
        "תמונת המקצוע בעברית: במקביל נדרש חיזוק בנושא במילות יחס ובמבנה משפט.",
      topStrengths: [],
      stableExcellence: [],
      topWeaknesses: [
        {
          id: "hebrew:w:0",
          labelHe: "קושי במילות יחס ובמבנה משפט",
          mistakeCount: 6,
          confidence: "moderate",
          tierHe: "קושי נקודתי",
        },
      ],
      parentActionHe:
        "שלוש פעמים בשבוע, 15–20 דק׳ בכל מפגש: לבחור משימה אחת בעברית בנושא במילות יחס ובמבנה משפט — לקרוא יחד את הניסוח, לנסח בקול מה נתון ומה מבקשים, לבצע צעד ראשון על דף טיוטה ורק אז לכתוב תשובה סופית ולבדוק מול הפתרון.",
      nextWeekGoalHe:
        "יעד לחיזוק: להעלות את אחוזי ההצלחה במילות יחס ובמבנה משפט (לפחות ניסיון אחד מוצלח יותר מהשבוע שעבר).",
      evidenceExamples: [
        {
          type: "mistake",
          exerciseText: "השלימו: הילדים שיחקו ___ הזמן בגן.",
          questionLabel: null,
          correctAnswer: "בְּ",
          userAnswer: "לְ",
          confidence: "moderate",
        },
      ],
      weaknesses: [
        {
          id: "hebrew:w:0",
          labelHe: "קושי במילות יחס ובמבנה משפט",
          mistakeCount: 6,
          confidence: "moderate",
          tierHe: "קושי נקודתי",
        },
      ],
      strengths: [],
      excellent: [],
      maintain: [],
      improving: [],
      studentRecommendationsImprove: [
        {
          id: "stu-imp:hebrew:w:0",
          textHe:
            "מומלץ להתמקד בנושא: במילות יחס ובמבנה משפט (זוהו 6 טעויות דומות בטווח התאריכים). זוהה קושי חוזר",
          strength: "moderate",
        },
      ],
      studentRecommendationsMaintain: [],
      parentRecommendationsImprove: [
        {
          id: "par-imp:hebrew:w:0",
          textHe:
            "מתחיל להתגבש דפוס בנושא במילות יחס ובמבנה משפט. מומלץ מעקב קל אחרי שבוע נוסף של תרגול ממוקד.",
          strength: "moderate",
        },
      ],
      parentRecommendationsMaintain: [],
      evidenceMistake: {
        exerciseText: "השלימו: הילדים שיחקו ___ הזמן בגן.",
        questionLabel: null,
        correctAnswer: "בְּ",
        userAnswer: "לְ",
        confidence: "moderate",
      },
      evidenceSuccess: null,
      insufficientData: [
        {
          mistakeCount: 3,
          note: "פחות מ־5 טעויות באותו דפוס — לא מספיק לקביעת חולשה יציבה",
        },
      ],
      diagnosticSparseNoteHe: null,
    },
    "moledet-geography": {
      subject: "moledet-geography",
      subjectLabelHe: "מולדת וגאוגרפיה",
      mistakeEventCount: 0,
      wrongCount: 0,
      hasAnySignal: false,
      summaryHe: null,
      topStrengths: [],
      stableExcellence: [],
      topWeaknesses: [],
      parentActionHe: null,
      nextWeekGoalHe: null,
      evidenceExamples: [],
      weaknesses: [],
      strengths: [],
      excellent: [],
      maintain: [],
      improving: [],
      studentRecommendationsImprove: [],
      studentRecommendationsMaintain: [],
      parentRecommendationsImprove: [],
      parentRecommendationsMaintain: [],
      evidenceMistake: null,
      evidenceSuccess: null,
      insufficientData: [],
      diagnosticSparseNoteHe: null,
    },
  },
};
