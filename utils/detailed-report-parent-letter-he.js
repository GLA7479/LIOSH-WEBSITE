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
  s = s.replace(/2–3 סשנים קצרים/g, "שני־שלושה מפגשי תרגול קצרים");
  s = s.replace(/סשנים קצרים/g, "מפגשי תרגול קצרים");
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

/** משפט פתיחה אחד */
function buildSubjectOpeningLineHe(sp, lab) {
  const w0 = sp?.topWeaknesses?.[0];
  const ex0 = sp?.excellence?.[0] || sp?.topStrengths?.[0];
  const imp0 = sp?.improving?.[0];
  const sparse = topicDataSparse(sp);

  if (!w0 && !ex0 && !imp0 && sp.summaryHe && String(sp.summaryHe).trim()) {
    return (
      takeFirstSentence(rewriteParentRecommendationForDetailedHe(sp.summaryHe)) ||
      takeFirstSentence(stripGuillemetsHe(sp.summaryHe))
    );
  }
  if (w0) {
    const t = displayTopicPhraseHe(w0.labelHe);
    const pre = sparse ? "עדיין מוקדם לקבוע בביטחון, אבל " : "";
    return stripGuillemetsHe(`${pre}ב${lab} הבולט כרגע הוא ${t}.`);
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
  const pool = dedupeRowsByLabel([
    ...(Array.isArray(sp.excellence) ? sp.excellence : []),
    ...(Array.isArray(sp.topStrengths) ? sp.topStrengths : []),
    ...(Array.isArray(sp.maintain) ? sp.maintain : []),
  ]);
  const s0 = pool[0];
  const imp0 = sp?.improving?.[0];

  if (w0 && s0) {
    const ws = (Number(w0.mistakeCount) || 0) >= 8 ? "הדפוס חוזר בטווח" : "כדאי לעקוב";
    return stripGuillemetsHe(
      `מצד אחד יש בסיס ב־${displayTopicPhraseHe(s0.labelHe)}; מצד שני נדרש חיזוק ב־${displayTopicPhraseHe(w0.labelHe)} — ${ws}.`
    );
  }
  if (w0) {
    const ws = (Number(w0.mistakeCount) || 0) >= 8 ? "זה חוזר מספיק כדי לתת דגש" : "עדיין לא סגור כדפוס ארוך";
    return stripGuillemetsHe(`המוקד לחיזוק: ${displayTopicPhraseHe(w0.labelHe)} — ${ws}.`);
  }
  if (s0) {
    return stripGuillemetsHe(`הכיוון החזק: ${displayTopicPhraseHe(s0.labelHe)} — שווה לשמר עליו בשגרה קצרה.`);
  }
  if (imp0 && !w0) {
    return stripGuillemetsHe(`יש תנועה ב־${displayTopicPhraseHe(imp0.labelHe)} — נשארים עם תרגול קצר ולא מקפיצים רמה.`);
  }
  return stripGuillemetsHe("התמונה עדיין לא מלאה — נמשיך לאסוף עוד קצת תרגול.");
}

function buildSubjectHomeLineHe(sp, lab) {
  const raw = sp?.parentActionHe && String(sp.parentActionHe).trim();
  if (raw) return rewriteParentRecommendationForDetailedHe(raw);
  return stripGuillemetsHe(`ב${lab}: שני מפגשים קצרים בשבוע, דגש על קריאת המשימה לפני תשובה.`);
}

function buildSubjectClosingLineHe(sp, lab) {
  const g = sp?.nextWeekGoalHe && String(sp.nextWeekGoalHe).trim();
  if (g) {
    let c = takeFirstSentence(rewriteParentRecommendationForDetailedHe(g));
    if (!c) c = takeFirstSentence(stripGuillemetsHe(g));
    if (c && !/[.!?]$/.test(c)) c += ".";
    return stripGuillemetsHe(c);
  }
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
  let snap = `ב${core}: ${q} שאלות, דיוק כ־${acc}%.`;
  if (m > 0) snap += ` ${m} טעויות בטווח.`;
  const early = !!tr?.isEarlySignalOnly || tr?.dataSufficiencyLevel === "low" || tr?.evidenceStrength === "low";
  if (early && q < 12) {
    snap = `עדיין מוקדם לסכם — ${snap}`;
  }
  const homeRaw = tr?.recommendedParentActionHe ? String(tr.recommendedParentActionHe).trim() : "";
  const homeLine = rewriteParentRecommendationForDetailedHe(homeRaw);
  return {
    snapshot: stripGuillemetsHe(snap),
    homeLine: stripGuillemetsHe(homeLine),
  };
}
