/**
 * שכבת ניסוח להורה בלבד — דוח מקיף (תצוגה בלבד).
 * ללא שם הילד, ללא פנייה לילד, ללא סימני « », ללא שפת מוצר גולמית.
 * לא משנה שדות payload; רק טקסטים שמוצגים לְהוֹרֶה.
 */

import { parentReliabilityVoiceHe, subjectLetterReliabilityOptionalHe } from "./parent-facing-reliability-he";

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

/** ליבת שם נושא בלי קידומת "בנושא" / מירכאות */
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

/** לקטע «איפה עדיין צריך ליווי»: «הנושא כפל» / «הנושא של …» */
function displayTopicPhraseDefiniteHe(labelHe) {
  const core = displayTopicCoreHe(labelHe);
  if (!core) return "";
  if (/\s/u.test(core)) return `הנושא של ${core}`;
  return `הנושא ${core}`;
}

/** תרגום והסרת ניסוח "הגדרות / משחק / כיתה" לשפה הורית ברורה */
export function rewriteParentRecommendationForDetailedHe(raw) {
  let s = stripGuillemetsHe(String(raw || ""));
  if (!s) return "";
  s = s.replace(/\s+/g, " ").trim();
  s = s.replace(/^על ([^,]+), אחרי מה שנאסף בטווח:\s*/u, "ב$1, לפי הנתונים בטווח: ");
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

function joinNaturalPhrases(parts) {
  const xs = parts.map((p) => String(p || "").trim()).filter(Boolean);
  if (!xs.length) return "";
  if (xs.length === 1) return xs[0];
  if (xs.length === 2) return `${xs[0]}; ${xs[1]}`;
  return `${xs.slice(0, -1).join("; ")}; ${xs[xs.length - 1]}`;
}

function takeFirstSentence(text) {
  const t = String(text || "").trim();
  if (!t) return "";
  const cut = t.split(/(?<=[.!?])\s+/)[0];
  return cut && cut.length <= 240 ? cut : t.slice(0, 200).trim() + (t.length > 200 ? "…" : "");
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

export function buildSubjectParentLetterCompact(sp) {
  const full = buildSubjectParentLetter(sp, { compact: true });
  const mid = [full.goingWell, full.reliabilityNoteHe, full.fragile].filter(Boolean).join(" ");
  return {
    opening: full.opening,
    middle: mid,
    homeAction: full.homeAction,
    closing: full.closing,
  };
}

export function buildSubjectParentLetter(sp, opts = {}) {
  const compact = !!opts.compact;
  const lab = sp.subjectLabelHe || "המקצוע";
  const w0 = sp.topWeaknesses?.[0];
  const ex0 = sp.excellence?.[0] || sp.topStrengths?.[0];
  const imp0 = sp.improving?.[0];

  let opening = "";
  if (w0) {
    opening = `ב${lab} בלט בתקופה הזו בעיקר ${displayTopicPhraseHe(w0.labelHe)}. מומלץ לעבור עליו בבית בשיחה קצרה וממוקדת, בלי לחץ.`;
  } else if (ex0) {
    opening = `ב${lab} ניכרת עקביות טובה סביב ${displayTopicPhraseHe(ex0.labelHe)} (דיוק כ־${ex0.accuracy}%). כדאי לחזק גם במילים — הערכה קצרה אחרי הצלחה תומכת בהמשך.`;
  } else if (imp0) {
    opening = `ב${lab} רואים התקדמות חלקית סביב ${displayTopicPhraseHe(imp0.labelHe)} (דיוק כ־${imp0.accuracy}%). זה שלב שכדאי ללוות בהדרגה.`;
  } else if (sp.summaryHe) {
    opening =
      takeFirstSentence(rewriteParentRecommendationForDetailedHe(sp.summaryHe)) ||
      takeFirstSentence(stripGuillemetsHe(sp.summaryHe));
  } else {
    opening = `עדיין נאסף מעט חומר על ${lab} בטווח שנבחר — ההערות כאן יתעדכנו כשיימלא נפח התרגול.`;
  }

  const pool = dedupeRowsByLabel([
    ...(Array.isArray(sp.excellence) ? sp.excellence : []),
    ...(Array.isArray(sp.topStrengths) ? sp.topStrengths : []),
    ...(Array.isArray(sp.maintain) ? sp.maintain : []),
  ]);
  let goingWell = "";
  if (pool.length) {
    const bits = pool.slice(0, 3).map((r) => `${displayTopicPhraseHe(r.labelHe)} (דיוק ${r.accuracy}%)`);
    goingWell = compact
      ? `איפה הילד נראה בטוח יותר: ${joinNaturalPhrases(bits)}.`
      : `איפה הילד נראה בטוח יותר: ${joinNaturalPhrases(bits)}. כדאי לשמור על תרגול רגוע וסדיר סביב אותם נושאים.`;
  } else {
    goingWell = `עדיין אין כאן תמונת חוזק ברורה מספיק — לעיתים זה קורה כשאין מספיק נתונים.`;
  }

  const fragParts = [];
  const openingWasImprovingOnly = !w0 && !ex0 && !!imp0;
  if (imp0 && !openingWasImprovingOnly) {
    fragParts.push(
      `${displayTopicPhraseDefiniteHe(imp0.labelHe)} (דיוק ${imp0.accuracy}%) — עדיין דורש חיזוק הדרגתי`
    );
  }
  const weakList = sp.topWeaknesses || [];
  const weakForFrag = w0 ? weakList.slice(1, 3) : weakList.slice(0, 2);
  for (const w of weakForFrag) {
    const phrase = displayTopicPhraseDefiniteHe(w.labelHe);
    const tail =
      typeof w.mistakeCount === "number" && w.mistakeCount >= 8
        ? " — הנושא חוזר מספיק פעמים לכן מומלץ לשים עליו דגש"
        : "";
    fragParts.push(`${phrase}${tail}`);
  }
  for (const s of (sp.subSkillInsightsHe || []).slice(0, 2)) {
    if (s?.lineHe) fragParts.push(stripGuillemetsHe(stripTechnicalNoiseHe(s.lineHe)));
  }
  let fragile = "";
  if (fragParts.length) {
    fragile = compact
      ? `איפה עדיין צריך ליווי: ${joinNaturalPhrases(fragParts)}.`
      : `איפה עדיין צריך ליווי: ${joinNaturalPhrases(fragParts)}.`;
  } else {
    fragile = `אין בשלב הזה ממצא אחד שמתפרץ מהנתונים — ממשיכים לעקוב כשיתווסף חומר.`;
  }

  const homeAction =
    "מה כדאי לעשות בבית: ההמלצה הממוקדת למקצוע הזה מופיעה בהמשך הדוח, תחת ״רעיונות קצרים לבית״.";

  let closing = "";
  if (sp.nextWeekGoalHe && String(sp.nextWeekGoalHe).trim()) {
    closing = takeFirstSentence(rewriteParentRecommendationForDetailedHe(sp.nextWeekGoalHe));
    if (!closing) closing = takeFirstSentence(stripGuillemetsHe(sp.nextWeekGoalHe));
    if (closing && !/[.!?]$/.test(closing)) closing += ".";
  } else {
    closing = `מה חשוב לזכור להמשך: כשיימלא נתון על ${lab}, אפשר לחדד כאן את ההמלצה — בלי לחץ ובלי קפיצות רמה מוקדמות.`;
  }

  const relRaw = subjectLetterReliabilityOptionalHe(sp);
  const reliabilityNoteHe = relRaw ? stripGuillemetsHe(relRaw) : null;

  return {
    opening: stripGuillemetsHe(opening),
    goingWell: stripGuillemetsHe(goingWell),
    reliabilityNoteHe,
    fragile: stripGuillemetsHe(fragile),
    homeAction,
    closing: stripGuillemetsHe(closing),
  };
}

function stepHintForParentHe(tr) {
  const label = stripGuillemetsHe(String(tr?.recommendedStepLabelHe || "").trim());
  const step = tr?.recommendedNextStep;
  if (step === "advance_level" || step === "advance_grade_topic_only") {
    return "המלצה: לעלות רמה רק בנושא הזה, אחרי שהצלחה נראית יציבה.";
  }
  if (step === "maintain_and_strengthen") {
    return "המלצה: להישאר ברמת הקושי הנוכחית ולחזק דיוק לפני שמעלים רמה.";
  }
  if (step === "remediate_same_level") {
    return "המלצה: להישאר באותה רמת קושי ולחדד הבנה של הטעות.";
  }
  if (step === "drop_one_level_topic_only" || step === "drop_one_grade_topic_only") {
    return "המלצה: לרדת לרמת קושי נוחה יותר בנושא הזה, ולבנות את הנושא בהדרגה עם הילד.";
  }
  return label ? `המלצה: ${label}.` : "";
}

export function buildTopicRecommendationNarrative(tr) {
  const nameRaw = String(tr?.displayName || "הנושא").trim();
  const core = displayTopicCoreHe(nameRaw) || stripGuillemetsHe(nameRaw);
  const q = Number(tr?.questions) || 0;
  const acc = Math.round(Number(tr?.accuracy) || 0);
  const m = Number(tr?.mistakeEventCount) || 0;
  let snap = `בנושא ${core} נדגמו ${q} שאלות; רמת הדיוק הכוללת היא סביב ${acc}%.`;
  if (m > 0) {
    snap += ` הופיעו ${m} טעויות — מומלץ לבחור דוגמה אחת, לקרוא שוב את ניסוח השאלה ולעבור צעד־צעד על הפתרון.`;
  } else {
    snap += ` אין צבר טעויות ברור — עדיין חשוב להחליט לפי רמת הדיוק ולא לעלות רמה בחיפזון.`;
  }
  const hint = stepHintForParentHe(tr);
  const homeRaw = tr?.recommendedParentActionHe ? String(tr.recommendedParentActionHe).trim() : "";
  const homeLine = rewriteParentRecommendationForDetailedHe(homeRaw);
  const reliabilityLineHe = stripGuillemetsHe(
    parentReliabilityVoiceHe({
      questions: tr?.questions,
      evidenceStrength: tr?.evidenceStrength,
      dataSufficiencyLevel: tr?.dataSufficiencyLevel,
      isEarlySignalOnly: tr?.isEarlySignalOnly,
      mistakeEventCount: tr?.mistakeEventCount,
      needsPractice: tr?.needsPractice,
      excellent: tr?.excellent,
      recommendedNextStep: tr?.recommendedNextStep,
    })
  );
  return {
    snapshot: stripGuillemetsHe(`${snap} ${hint}`.trim()),
    homeLine,
    reliabilityLineHe,
  };
}
