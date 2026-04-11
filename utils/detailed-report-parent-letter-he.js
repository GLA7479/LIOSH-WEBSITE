/**
 * שכבת ניסוח להורה בלבד — דוח מקיף (תצוגה בלבד).
 * ללא שם הילד, ללא פנייה לילד, ללא שפת מוצר/משחק גולמית.
 * לא משנה שדות payload; רק טקסטים שמוצגים לְהוֹרֶה.
 */

import { improvingDiagnosticsDisplayLabelHe } from "./learning-patterns-analysis";

/** תרגום והסרת ניסוח "הגדרות / משחק / כיתה" לשפה הורית ברורה */
export function rewriteParentRecommendationForDetailedHe(raw) {
  let s = String(raw || "")
    .trim()
    .replace(/\s+/g, " ");
  if (!s) return "";
  s = s.replace(/^על ([^,]+), אחרי מה שנאסף בטווח:\s*/u, "ב$1, לפי הנתונים בטווח: ");
  s = s.replace(/במשחק/g, "בתרגול");
  s = s.replace(/אם במשחק יש בחירת כיתה לפי נושא —/g, "אם ניתן להפריד רמת קושי לפי נושא —");
  s = s.replace(/אם אפשר לבחור כיתה נפרדת לפי נושא —/g, "אם ניתן להתאים רמת קושי נפרדת לפי נושא —");
  s = s.replace(
    /נשארים על אותה הגדרה ב«([^»]+)»\s*\([^)]*\)/g,
    "בנושא «$1» מומלץ להמשיך כרגע באותה רמת קושי"
  );
  s = s.replace(/נשארים על אותה כיתה ורמה/g, "להמשיך באותה רמת קושי");
  s = s.replace(/לתת לילד/g, "לסייע לילד");
  s = s.replace(/נשארים על רמה [^ ו]+ ומתמקדים/g, "נשארים על אותה רמת קושי ומתמקדים");
  s = s.replace(/2–3 סשנים קצרים/g, "שני־שלושה מפגשי תרגול קצרים");
  s = s.replace(/סשנים קצרים/g, "מפגשי תרגול קצרים");
  s = s.replace(/מומלץ לעלות רמת קושי אחת רק בנושא הזה בתרגול/g, "מומלץ להקשות מעט רק בנושא הזה");
  s = s.replace(/מומלץ לעלות רמת קושי אחת רק בנושא הזה במשחק/g, "מומלץ להקשות מעט רק בנושא הזה בתרגול");
  s = s.replace(/רק בנושא הזה במשחק/g, "רק בנושא הזה בתרגול");
  s = s.replace(
    /כדאי להתאמן עוד קצת ב«([^»]+)» באותה רמה — ואז נחליט על צעד הבא\./g,
    "מומלץ להמשיך בתרגול קצר בנושא «$1» באותה רמת קושי, ולעכב שינוי עד שיש עקביות."
  );
  s = s.replace(/\s+/g, " ").trim();
  return s;
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

/**
 * מכתב מקוצע — אותו מבנה, בלי שם וללא צעד בית מלא (נמנע כפילות מול סעיף "רעיונות לבית").
 */
export function buildSubjectParentLetterCompact(sp) {
  const full = buildSubjectParentLetter(sp, { compact: true });
  const mid = [full.goingWell, full.fragile].filter(Boolean).join(" ");
  return {
    opening: full.opening,
    middle: mid,
    homeAction: full.homeAction,
    closing: full.closing,
  };
}

/**
 * פסקאות להורה בלבד: מה בלט → איפה בטוח → איפה ליווי → הפניה לבית (ללא שכפול ההמלצה המלאה) → מה חשוב להמשך.
 */
export function buildSubjectParentLetter(sp, opts = {}) {
  const compact = !!opts.compact;
  const lab = sp.subjectLabelHe || "המקצוע";
  const w0 = sp.topWeaknesses?.[0];
  const ex0 = sp.excellence?.[0] || sp.topStrengths?.[0];
  const imp0 = sp.improving?.[0];

  let opening = "";
  if (w0) {
    const wlab = stripTechnicalNoiseHe(w0.labelHe);
    opening = `ב${lab} בלט בתקופה הזו בעיקר הנושא של ${wlab}. מומלץ לעבור עליו בבית בשיחה קצרה וממוקדת, בלי לחץ.`;
  } else if (ex0) {
    opening = `ב${lab} ניכרת יציבות טובה סביב ${ex0.labelHe} (דיוק כ־${ex0.accuracy}%). זה מקום שכדאי לחזק גם במילים — הערכה קצרה אחרי הצלחה תומכת בהמשך.`;
  } else if (imp0) {
    const il = improvingDiagnosticsDisplayLabelHe(imp0.labelHe);
    opening = `ב${lab} רואים התקדמות חלקית ב${il} (דיוק כ־${imp0.accuracy}%). זה שלב שכדאי ללוות בהדרגה.`;
  } else if (sp.summaryHe) {
    opening = takeFirstSentence(rewriteParentRecommendationForDetailedHe(sp.summaryHe)) || takeFirstSentence(sp.summaryHe);
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
    const bits = pool.slice(0, 3).map((r) => `${r.labelHe} (דיוק ${r.accuracy}%)`);
    goingWell = compact
      ? `איפה הילד נראה בטוח יותר: ${joinNaturalPhrases(bits)}.`
      : `איפה הילד נראה בטוח יותר: ${joinNaturalPhrases(bits)}. כדאי לשמור על תרגול רגוע וסדיר סביב אותם נושאים.`;
  } else {
    goingWell = `עדיין אין כאן תמונת חוזק ברורה מספיק — לעיתים זה קורה כשהטווח קצר או שהתרגול מפוזר.`;
  }

  const fragParts = [];
  const openingWasImprovingOnly = !w0 && !ex0 && !!imp0;
  if (imp0 && !openingWasImprovingOnly) {
    fragParts.push(
      `${improvingDiagnosticsDisplayLabelHe(imp0.labelHe)} (דיוק ${imp0.accuracy}%) — עדיין דורש חיזוק הדרגתי`
    );
  }
  const weakList = sp.topWeaknesses || [];
  const weakForFrag = w0 ? weakList.slice(1, 3) : weakList.slice(0, 2);
  for (const w of weakForFrag) {
    const labw = stripTechnicalNoiseHe(w.labelHe);
    const tail =
      typeof w.mistakeCount === "number" && w.mistakeCount >= 8
        ? " — הנושא חוזר מספיק פעמים כדי ששווה לעצור עליו"
        : "";
    fragParts.push(`${labw}${tail}`);
  }
  for (const s of (sp.subSkillInsightsHe || []).slice(0, 2)) {
    if (s?.lineHe) fragParts.push(stripTechnicalNoiseHe(s.lineHe));
  }
  let fragile = "";
  if (fragParts.length) {
    fragile = compact
      ? `איפה עדיין צריך ליווי: ${joinNaturalPhrases(fragParts)}.`
      : `איפה עדיין צריך ליווי: ${joinNaturalPhrases(fragParts)}.`;
  } else {
    fragile = `אין בשלב הזה ממצא אחד שמתפרץ מהנתונים — ממשיכים לעקוב כשיתווסף חומר.`;
  }

  /** אין כאן העתקה של parentActionHe — נמנע כפילות מול "רעיונות קצרים לבית" */
  const homeAction =
    "מה כדאי לעשות בבית: ההמלצה הממוקדת למקצוע הזה מופיעה בהמשך הדוח, תחת ״רעיונות קצרים לבית״.";

  let closing = "";
  if (sp.nextWeekGoalHe && String(sp.nextWeekGoalHe).trim()) {
    closing = takeFirstSentence(rewriteParentRecommendationForDetailedHe(sp.nextWeekGoalHe));
    if (!closing) closing = takeFirstSentence(sp.nextWeekGoalHe);
    if (closing && !/[.!?]$/.test(closing)) closing += ".";
  } else {
    closing = `מה חשוב לזכור להמשך: כשיימלא נתון על ${lab}, אפשר לחדד כאן את הכיוון — בלי לחץ ובלי קפיצות רמה מוקדמות.`;
  }

  return { opening, goingWell, fragile, homeAction, closing };
}

function stepHintForParentHe(tr) {
  const label = String(tr?.recommendedStepLabelHe || "").trim();
  const step = tr?.recommendedNextStep;
  if (step === "advance_level" || step === "advance_grade_topic_only") {
    return "הכיוון: להקשות מעט רק בנושא הזה, אחרי שהצלחה נראית יציבה.";
  }
  if (step === "maintain_and_strengthen") {
    return "הכיוון: להישאר ברמת הקושי הנוכחית ולחזק דיוק לפני שמשנים הגדרה.";
  }
  if (step === "remediate_same_level") {
    return "הכיוון: להישאר באותה רמת קושי ולחדד הבנה של הטעות.";
  }
  if (step === "drop_one_level_topic_only" || step === "drop_one_grade_topic_only") {
    return "הכיוון: לרדת לרמת קושי נוחה יותר בנושא הזה, ולבנות הצלחות קטנות.";
  }
  return label ? `הכיוון: ${label}.` : "";
}

/**
 * תיאור קצר להורה בלבד — בלי שורת תלמיד, בלי ניסוחים מטושטשים.
 */
export function buildTopicRecommendationNarrative(tr) {
  const name = String(tr?.displayName || "הנושא").trim();
  const q = Number(tr?.questions) || 0;
  const acc = Math.round(Number(tr?.accuracy) || 0);
  const m = Number(tr?.mistakeEventCount) || 0;
  let snap = `בנושא «${name}» נאספו בטווח ${q} תשובות; רמת הדיוק הכוללת סביב ${acc}%.`;
  if (m > 0) {
    snap += ` הופיעו ${m} טעויות — מומלץ לבחור דוגמה אחת, לקרוא שוב את ניסוח השאלה ולעבור צעד־צעד על הפתרון.`;
  } else {
    snap += ` אין צבר טעויות ברור — עדיין חשוב להחליט לפי רמת הדיוק ולא לעלות רמה בחיפזון.`;
  }
  const hint = stepHintForParentHe(tr);
  const homeRaw = tr?.recommendedParentActionHe ? String(tr.recommendedParentActionHe).trim() : "";
  const homeLine = rewriteParentRecommendationForDetailedHe(homeRaw);
  return {
    snapshot: `${snap} ${hint}`.trim(),
    homeLine,
  };
}
