/**
 * שכבת ניסוח להורה בלבד — דוח מקיף (תצוגה בלבד).
 * קצר, חד, בלי שכבות משנה — ללא שינוי שדות payload מהמנוע.
 */

/** הסרת מירכאות צרפתיות / גוילמטים */
export function stripGuillemetsHe(s) {
  return String(s || "")
    .replace(/[\u00AB\u00BB«»]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function stripTechnicalNoiseHe(text) {
  return String(text || "")
    .replace(/\(pf:[^)]*\)/gi, "")
    .replace(/\(k:[^)]*\)/gi, "")
    .replace(/\(to:[^)]*\)/gi, "")
    .replace(/\(st:[^)]*\)/gi, "")
    .replace(/\(ct:[^)]*\)/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function displayTopicCoreHe(labelHe) {
  let t = stripGuillemetsHe(stripTechnicalNoiseHe(labelHe));
  t = t.replace(/^בנושא\s+/u, "").replace(/^הנושא\s+/u, "").trim();
  return t;
}

/**
 * ניסוח אחיד: "בנושא חיבור" או "בנושא של שטחים ויחידות שטח" (כשיש רווח בשם).
 */
export function displayTopicPhraseHe(labelHe) {
  const core = displayTopicCoreHe(labelHe);
  if (!core) return "";
  if (/\s/u.test(core)) return `בנושא של ${core}`;
  return `בנושא ${core}`;
}

/** תרגום והסרת ניסוח "הגדרות / משחק / כיתה" לשפה הורית ברורה */
export function rewriteParentRecommendationForDetailedHe(raw) {
  let s = stripGuillemetsHe(String(raw || ""));
  if (!s) return "";
  s = s.replace(/\s+/g, " ").trim();
  s = s.replace(/^על ([^,]+), אחרי מה שנאסף בטווח:\s*/u, "ב$1: ");
  s = s.replace(/במשחק/g, "בתרגול");
  s = s.replace(/אם במשחק יש בחירת כיתה לפי נושא —/g, "אם ניתן להפריד רמת קושי לפי נושא —");
  s = s.replace(/אם אפשר לבחור כיתה נפרדת לפי נושא —/g, "אם ניתן להתאים רמת קושי נפרדת לפי נושא —");
  s = s.replace(
    /אם ניתן להתאים רמת קושי נפרדת לפי נושא — ב(.+?) כדאי כיתה אחת נמוכה יותר\. בשאר הנושאים לא חייבים לשנות\./u,
    "בנושא $1 מומלץ לנסות רמה או כיתה יותר נמוכה ואז להתקדם בהדרגה."
  );
  s = s.replace(
    /נשארים על אותה הגדרה ב(?:«|")?([^»"]+)(?:»|")?\s*\([^)]*\)/gu,
    "בנושא $1 מומלץ להמשיך כרגע באותה רמת קושי"
  );
  s = s.replace(/נשארים על אותה כיתה ורמה/g, "להמשיך באותה רמת קושי");
  s = s.replace(/לתת לילד/g, "לסייע לילד");
  s = s.replace(/ולבנות הצלחות קטנות/g, "ולבנות את הנושא בהדרגה עם הילד");
  s = s.replace(/נשארים על רמה [^ ו]+ ומתמקדים/g, "נשארים על אותה רמת קושי ומתמקדים");
  s = s.replace(/2–3 סשנים קצרים/g, "שני־שלושה תרגולים קצרים");
  s = s.replace(/סשנים קצרים/g, "תרגולים קצרים");
  s = s.replace(/מפגשי תרגול קצרים/g, "תרגולים קצרים");
  s = s.replace(/מומלץ לעלות רמת קושי אחת רק בנושא הזה בתרגול/g, "מומלץ לעלות רמה רק בנושא הזה");
  s = s.replace(/מומלץ לעלות רמת קושי אחת רק בנושא הזה במשחק/g, "מומלץ לעלות רמה רק בנושא הזה בתרגול");
  s = s.replace(/מומלץ להקשות מעט רק בנושא הזה/g, "מומלץ לעלות רמה רק בנושא הזה");
  s = s.replace(/רק בנושא הזה במשחק/g, "רק בנושא הזה בתרגול");
  s = s.replace(
    /כדאי להתאמן עוד קצת ב(?:«|")?([^»"]+)(?:»|")? באותה רמה — ואז נחליט על צעד הבא\./gu,
    "מומלץ להמשיך בתרגול קצר בנושא $1 באותה רמת קושי, ולעכב שינוי עד שיש עקביות."
  );
  s = s.replace(/\s+/g, " ").trim();
  return stripGuillemetsHe(s);
}

function takeFirstSentence(text) {
  const t = String(text || "").trim();
  if (!t) return "";
  const cut = t.split(/(?<=[.!?])\s+/)[0];
  return cut && cut.length <= 200 ? cut : t.slice(0, 160).trim() + (t.length > 160 ? "…" : "");
}

function dedupeRowsByLabel(rows) {
  const seen = new Set();
  const out = [];
  for (const r of rows || []) {
    const k = String(r?.labelHe || "").trim();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(r);
  }
  return out;
}

function topicDataSparse(sp) {
  const recs = Array.isArray(sp?.topicRecommendations) ? sp.topicRecommendations : [];
  if (!recs.length) return false;
  return recs.every((t) => t?.isEarlySignalOnly);
}

function majorRiskAny(sp) {
  const r = sp?.majorRiskFlagsAcrossRows;
  if (!r || typeof r !== "object") return false;
  return Object.values(r).some(Boolean);
}

/** משפט פתיחה אחד */
function buildSubjectOpeningLineHe(sp, lab) {
  const w0 = sp?.topWeaknesses?.[0];
  const ex0 = sp?.excellence?.[0] || sp?.topStrengths?.[0];
  const imp0 = sp?.improving?.[0];
  const sparse = topicDataSparse(sp);
  const domRisk = String(sp?.dominantLearningRiskLabelHe || "").trim();
  const domSucc = String(sp?.dominantSuccessPatternLabelHe || "").trim();
  const mr = majorRiskAny(sp);
  const readiness = String(sp?.subjectConclusionReadiness || "").trim();
  const domRc = String(sp?.dominantRootCauseLabelHe || "").trim();
  const pri = String(sp?.subjectPriorityLevel || "").trim();
  const priReason = String(sp?.subjectPriorityReasonHe || "").trim();

  if (pri === "immediate" && priReason) {
    const t = [
      stripGuillemetsHe(`${priReason} מומלץ לבחור משימה אחת השבוע ולדבוק בה.`),
      stripGuillemetsHe(`${priReason} עדיף צעד קטן וחוזר מאשר «לתקן הכל».`),
    ];
    return t[Math.abs(priReason.length + lab.length) % t.length];
  }
  if (pri === "monitor" && priReason) {
    const t = [
      stripGuillemetsHe(`${priReason} בשלב הזה עדיף לצמצם החלטות גדולות בבית.`),
      stripGuillemetsHe(`${priReason} נשארים עם תרגול קצר ומדיד לפני מסקנה חדה.`),
    ];
    return t[Math.abs((priReason + lab).length) % t.length];
  }
  if (pri === "maintain" && domSucc && ex0 && !mr) {
    const t = [
      stripGuillemetsHe(`ב${lab} אפשר לנוח קצת על הגז: ${domSucc} — שימור שגרה קצרה מספיק.`),
      stripGuillemetsHe(`ב${lab} המצב יציב יחסית (${domSucc}) — לא חובה להוסיף עומס; רק לעקוב בעדינות.`),
    ];
    return t[Math.abs((domSucc + lab).length) % t.length];
  }

  if (readiness === "not_ready" && domRc) {
    const templates = [
      `ב${lab} עדיין אין בשלות מספקת למסקנה חזקה — מה שכן בולט: ${domRc}. נמשיך לאסוף תרגול קצר לפני שינוי מהותי.`,
      `ב${lab} הנתון בטווח עדיין חלקי; הכיוון הסביר ביותר כרגע הוא ${domRc} — בלי לנעול תוכנית ארוכה.`,
    ];
    return stripGuillemetsHe(templates[Math.abs((lab + domRc).length) % templates.length]);
  }
  if (readiness === "partial" && domRc && w0) {
    return stripGuillemetsHe(
      `ב${lab} יש תמונה אמצעית: ${domRc} לצד ${displayTopicPhraseHe(w0.labelHe)} — כדאי לעקוב ולא לדרוס בהנחה חדה.`
    );
  }

  if (domSucc && sp?.dominantSuccessPattern === "stable_mastery" && ex0 && !mr) {
    return stripGuillemetsHe(
      `ב${lab} נראית עקביות טובה (${domSucc}) סביב ${displayTopicPhraseHe(ex0.labelHe)} — כדאי לשמר קצב רגוע.`
    );
  }
  if (mr && ex0) {
    const acc = Math.round(Number(ex0.accuracy) || 0);
    return stripGuillemetsHe(
      `ב${lab} יש גם חוזקות (למשל ${displayTopicPhraseHe(ex0.labelHe)}, כ־${acc}%) וגם אותות זהירות מהמנוע — לא מסכמים הכל כהצלחה מלאה.`
    );
  }
  if (domRisk && domRisk !== "דל נתון" && w0) {
    const pre = sparse ? "עדיין מוקדם לסגור סופית, אבל " : "";
    return stripGuillemetsHe(
      `${pre}ב${lab} התמונה המרכזית נוגעת ל־${domRisk} לצד ${displayTopicPhraseHe(w0.labelHe)}.`
    );
  }

  if (!w0 && !ex0 && !imp0 && sp.summaryHe && String(sp.summaryHe).trim()) {
    return (
      takeFirstSentence(rewriteParentRecommendationForDetailedHe(sp.summaryHe)) ||
      takeFirstSentence(stripGuillemetsHe(sp.summaryHe))
    );
  }
  if (w0) {
    const coreW = displayTopicCoreHe(w0.labelHe) || displayTopicPhraseHe(w0.labelHe);
    const pre = sparse ? "עדיין מוקדם לקבוע בביטחון, אבל " : "";
    return stripGuillemetsHe(`${pre}הנושא הבולט כרגע ב${lab} הוא ${coreW}.`);
  }
  if (ex0) {
    const acc = Math.round(Number(ex0.accuracy) || 0);
    return stripGuillemetsHe(`ב${lab} יש אחיזה טובה סביב ${displayTopicPhraseHe(ex0.labelHe)} (דיוק כ־${acc}%).`);
  }
  if (imp0) {
    const acc = Math.round(Number(imp0.accuracy) || 0);
    const pre = sparse ? "מסתמן ש" : "";
    return stripGuillemetsHe(`${pre}ב${lab} נראית התקדמות חלקית ב־${displayTopicPhraseHe(imp0.labelHe)} (דיוק כ־${acc}%).`);
  }
  return stripGuillemetsHe(`עדיין מוקדם לסכם לגבי ${lab} — מעט נתון בטווח שנבחר.`);
}

/** משפט אבחנה אחד — ממזג חוזק/חולשה בלי בלוקים נפרדים */
function buildSubjectDiagnosisLineHe(sp, lab) {
  const w0 = sp?.topWeaknesses?.[0];
  const domRc = String(sp?.dominantRootCauseLabelHe || "").trim();
  const restraintLine = String(sp?.subjectDiagnosticRestraintHe || "").trim();
  if (domRc && restraintLine) {
    const variants = [
      stripGuillemetsHe(`מה שאנחנו חושבים שקורה: ${domRc}. ${restraintLine}`),
      stripGuillemetsHe(`ניסוח זהיר לגבי ${lab}: ${domRc}. ${restraintLine}`),
    ];
    return variants[Math.abs(restraintLine.length) % variants.length];
  }
  const pool = dedupeRowsByLabel([
    ...(Array.isArray(sp.excellence) ? sp.excellence : []),
    ...(Array.isArray(sp.topStrengths) ? sp.topStrengths : []),
    ...(Array.isArray(sp.maintain) ? sp.maintain : []),
  ]);
  const s0 = pool[0];
  const imp0 = sp?.improving?.[0];
  const trendLine = takeFirstSentence(String(sp?.trendNarrativeHe || "").trim());
  const domRisk = String(sp?.dominantLearningRiskLabelHe || "").trim();
  const ibs = String(sp?.improvingButSupportedHe || "").trim();

  if (ibs) {
    return stripGuillemetsHe(ibs);
  }

  if (trendLine && domRisk && domRisk !== "דל נתון") {
    const base = stripGuillemetsHe(`${domRisk} — ${trendLine}`);
    if (w0 && s0) {
      return stripGuillemetsHe(
        `${base} בשאלות שנדגמו: ${displayTopicPhraseHe(s0.labelHe)} יש בסיס טוב לעומת זאת ${displayTopicPhraseHe(w0.labelHe)} נדרש חיזוק ממוקד.`
      );
    }
    if (w0) {
      return stripGuillemetsHe(`${base} נדרש חיזוק סביב ${displayTopicPhraseHe(w0.labelHe)}.`);
    }
    return base.length > 280 ? `${base.slice(0, 277)}…` : base;
  }

  if (w0 && s0) {
    const strong = (Number(w0.mistakeCount) || 0) >= 8;
    const tail = strong
      ? "נדרש חיזוק; הדפוס חוזר בעקביות."
      : "נדרש חיזוק — וכדאי להמשיך לעקוב בלי למהר למסקנה.";
    return stripGuillemetsHe(
      `בשאלות שנדגמו: ${displayTopicPhraseHe(s0.labelHe)} יש בסיס טוב לעומת זאת ${displayTopicPhraseHe(w0.labelHe)} ${tail}`
    );
  }
  if (w0) {
    const ws =
      (Number(w0.mistakeCount) || 0) >= 8
        ? "חזרה עקבית — מומלץ לשים על זה דגש"
        : "עדיין לא סגור כדפוס ארוך";
    return stripGuillemetsHe(`ההמלצה שלנו: ${displayTopicPhraseHe(w0.labelHe)} — ${ws}.`);
  }
  if (s0) {
    return stripGuillemetsHe(`הכיוון החזק: ${displayTopicPhraseHe(s0.labelHe)} — שווה לשמר עליו בתרגול קצר.`);
  }
  if (imp0 && !w0) {
    return stripGuillemetsHe(`יש תנועה ב־${displayTopicPhraseHe(imp0.labelHe)} — נשארים עם תרגול קצר ולא מקפיצים רמה.`);
  }
  return stripGuillemetsHe("התמונה עדיין לא מלאה — נמשיך לאסוף עוד קצת תרגול.");
}

function buildSubjectHomeLineHe(sp, lab) {
  const homeDiag = sp?.recommendedHomeMethodHe && String(sp.recommendedHomeMethodHe).trim();
  if (homeDiag) return stripGuillemetsHe(rewriteParentRecommendationForDetailedHe(homeDiag));
  const imm = sp?.subjectImmediateActionHe && String(sp.subjectImmediateActionHe).trim();
  if (imm) return stripGuillemetsHe(rewriteParentRecommendationForDetailedHe(imm));
  const raw = sp?.parentActionHe && String(sp.parentActionHe).trim();
  if (raw) return rewriteParentRecommendationForDetailedHe(raw);
  return stripGuillemetsHe(`ב${lab}: שני מפגשים קצרים בשבוע, דגש על קריאת המשימה לפני תשובה.`);
}

function buildSubjectClosingLineHe(sp, lab) {
  const conf = String(sp?.confidenceSummaryHe || "").trim();
  const wnt = String(sp?.whatNotToDoHe || "").trim();
  const g = sp?.nextWeekGoalHe && String(sp.nextWeekGoalHe).trim();
  const doNow = String(sp?.subjectDoNowHe || "").trim();
  const avoidNow = String(sp?.subjectAvoidNowHe || "").trim();
  const memN = String(sp?.subjectMemoryNarrativeHe || "").trim();
  const parts = [];
  if (conf) parts.push(takeFirstSentence(conf));
  if (g) {
    let c = takeFirstSentence(rewriteParentRecommendationForDetailedHe(g));
    if (!c) c = takeFirstSentence(stripGuillemetsHe(g));
    if (c && !/[.!?]$/.test(c)) c += ".";
    parts.push(c);
  }
  if (wnt) parts.push(takeFirstSentence(wnt));
  if (doNow) {
    const d1 = takeFirstSentence(doNow);
    const dup =
      parts.some((p) => p.includes(d1.slice(0, Math.min(18, d1.length)))) ||
      (wnt && wnt.includes(d1.slice(0, Math.min(18, d1.length))));
    if (!dup) parts.push(d1);
  }
  if (avoidNow) {
    const a1 = takeFirstSentence(avoidNow);
    const dup =
      parts.some((p) => p.includes(a1.slice(0, Math.min(18, a1.length)))) ||
      (wnt && wnt.includes(a1.slice(0, Math.min(18, a1.length))));
    if (!dup) parts.push(a1);
  }
  if (memN) {
    const m1 = takeFirstSentence(memN);
    const dup = parts.some((p) => p.includes(m1.slice(0, Math.min(16, m1.length))));
    if (!dup && m1.length > 20) parts.push(m1);
  }
  if (parts.length) return stripGuillemetsHe(parts.join(" "));
  return stripGuillemetsHe(`להמשך: ב${lab} עדיף עקביות קצרה מאשר מפגש ארוך אחד.`);
}

export function buildSubjectParentLetterCompact(sp) {
  const full = buildSubjectParentLetter(sp, { compact: true });
  const lead = [full.opening, full.diagnosisHe].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  const leadMax = lead.length > 240 ? `${lead.slice(0, 237)}…` : lead;
  return {
    opening: leadMax,
    middle: null,
    homeAction: full.homeAction,
    closing: full.closing,
  };
}

export function buildSubjectParentLetter(sp, opts = {}) {
  const compact = !!opts.compact;
  const lab = sp.subjectLabelHe || "המקצוע";
  const opening = buildSubjectOpeningLineHe(sp, lab);
  let diagnosisHe = buildSubjectDiagnosisLineHe(sp, lab);
  if (compact && diagnosisHe.length > 200) {
    diagnosisHe = `${diagnosisHe.slice(0, 197)}…`;
  }
  const homeAction = buildSubjectHomeLineHe(sp, lab);
  const closing = buildSubjectClosingLineHe(sp, lab);

  return {
    opening: stripGuillemetsHe(opening),
    diagnosisHe: stripGuillemetsHe(diagnosisHe),
    homeAction,
    closing: stripGuillemetsHe(closing),
    /** תאימות לאחור — ריקים */
    goingWell: "",
    fragile: "",
    reliabilityNoteHe: null,
  };
}

export function buildTopicRecommendationNarrative(tr) {
  const nameRaw = String(tr?.displayName || "הנושא").trim();
  const core = displayTopicCoreHe(nameRaw) || stripGuillemetsHe(nameRaw);
  const q = Number(tr?.questions) || 0;
  const acc = Math.round(Number(tr?.accuracy) || 0);
  const m = Number(tr?.mistakeEventCount) || 0;
  let snap = `נדגמו ${q} שאלות, דיוק כ־${acc}%.`;
  if (m > 0) snap += ` ${m} טעויות סה״כ.`;
  const early = !!tr?.isEarlySignalOnly || tr?.dataSufficiencyLevel === "low" || tr?.evidenceStrength === "low";
  if (early && q < 12) {
    snap = `עדיין מוקדם לסכם — ${snap}`;
  }
  const cs = String(tr?.conclusionStrength || "").trim();
  const rc = String(tr?.rootCauseLabelHe || "").trim();
  if (cs === "withheld" || cs === "tentative") {
    const alt = [
      `עדיין לא סוגרים סופית לגבי ${core}: ${snap} ${rc ? `הכיוון הסביר: ${rc}.` : ""}`,
      `ב${core} אנחנו בשלב איסוף — ${snap} ${rc ? `(${rc})` : ""}`,
    ];
    snap = stripGuillemetsHe(alt[Math.abs(q + acc) % alt.length]);
  } else if (rc) {
    snap = stripGuillemetsHe(`${snap} שורש קושי סביר: ${rc}.`);
  }
  const reasoning = String(tr?.recommendationReasoningHe || "").trim();
  const homeRaw = tr?.recommendedParentActionHe ? String(tr.recommendedParentActionHe).trim() : "";
  const homeLine = rewriteParentRecommendationForDetailedHe(homeRaw);
  const whyHold = String(tr?.whyNotAStrongerConclusionHe || "").trim();
  const homeAug =
    reasoning && q >= 10
      ? `${homeLine} ${takeFirstSentence(reasoning)}`
      : homeLine;
  return {
    snapshot: stripGuillemetsHe(snap),
    homeLine: stripGuillemetsHe(homeAug),
    cautionLineHe: whyHold ? stripGuillemetsHe(takeFirstSentence(whyHold)) : "",
  };
}

/** Phase 10–11 — שורות קצרות לניסוח הורי (ממופות מ־parent-report-ui-explain-he) */
export {
  responseToInterventionLineHe,
  supportAdjustmentLineHe,
  freshnessLineHe,
  recalibrationLineHe,
  supportSequenceLineHe,
  repetitionRiskLineHe,
  fatigueRiskLineHe,
  releaseReadinessLineHe,
  sequenceActionLineHe,
  topicRepetitionFatigueCompactLineHe,
  topicSupportSequenceOrReleaseLineHe,
  recommendationMemoryLineHe,
  outcomeTrackingLineHe,
  continuationDecisionLineHe,
  carryoverLineHe,
  freshEvidenceNeedLineHe,
  gateStateLineHe,
  decisionFocusLineHe,
  evidenceTargetLineHe,
  releaseGateLineHe,
  pivotTriggerLineHe,
  recheckTriggerLineHe,
  gateTriggerCompactLineHe,
  dependencyStateLineHe,
  foundationPriorityLineHe,
  interventionOrderingLineHe,
  foundationBeforeExpansionLineHe,
  downstreamSymptomLineHe,
  topicFreshnessUnifiedLineHe,
  topicGatesEvidenceDecisionCompactLineHe,
  topicFoundationDependencyCompactLineHe,
  topicMemoryOutcomeContinuationCompactLineHe,
  topicSequencingRepeatCompactLineHe,
  topicSupportFlowUnifiedLineHe,
} from "./parent-report-ui-explain-he.js";
