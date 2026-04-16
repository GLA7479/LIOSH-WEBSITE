/**
 * Canonical owner: TruthPacketV1 builder. Downstream modules consume this object only.
 */

import {
  listAllAnchoredTopicRows,
  readContractsSliceForScope,
  subjectLabelHe,
  SUBJECT_ORDER,
} from "./contract-reader.js";

/**
 * @param {unknown} readinessRaw
 * @returns {"insufficient"|"forming"|"ready"|"emerging"}
 */
function mapReadinessForTruthPacket(readinessRaw) {
  const x = String(readinessRaw || "")
    .trim()
    .toLowerCase();
  if (x === "ready") return "ready";
  if (x === "emerging") return "emerging";
  if (x === "unstable") return "forming";
  if (x === "forming" || x === "partial" || x === "moderate") return "forming";
  return "insufficient";
}

/**
 * @param {unknown} band
 * @returns {"low"|"medium"|"high"}
 */
function mapConfidenceBand(band) {
  const c = String(band || "")
    .trim()
    .toLowerCase();
  if (c === "high") return "high";
  if (c === "medium" || c === "moderate") return "medium";
  return "low";
}

function readinessRank(v) {
  if (v === "ready") return 3;
  if (v === "emerging") return 2;
  if (v === "forming") return 1;
  return 0;
}

function confidenceRank(v) {
  if (v === "high") return 2;
  if (v === "medium") return 1;
  return 0;
}

/**
 * @param {string} s
 * @param {number} [max]
 */
function clipHe(s, max = 140) {
  const t = String(s || "")
    .replace(/\s+/g, " ")
    .trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/**
 * Lines that read as aggregate counters / period totals — allowed only as **supporting** detail, never as the lead.
 * @param {string} line
 */
function looksLikeNumericOrCountLead(line) {
  const t = String(line || "").trim();
  if (t.length < 10) return false;
  if (/^(בדוח\s+התקופתי\s+נספרו|כ־\s*\d|בסך\s+הכל\s+כ־?\d)/u.test(t)) return true;
  if (/נספרו\s+כ|שאלות\s+בכלל\s+המקצועות|דיוק\s+הממוצע\s+המשוקלל|ממוצע\s+משוקלל/u.test(t)) return true;
  return false;
}

/**
 * Compact numeric context appended after named/meaning content.
 * @param {{ totalQ: number; avgAcc: number }} x
 */
function supportingNumericTail(x) {
  const bits = [];
  if (x.totalQ > 0) bits.push(`בסך הכל כ־${x.totalQ} שאלות במוקדים המעוגנים`);
  if (x.avgAcc > 0) bits.push(`דיוק משוקלל של כ־${x.avgAcc}%`);
  if (!bits.length) return "";
  return `ליד המידע המילולי: ${bits.join(", ")}.`;
}

/**
 * @param {string} base
 * @param {string} tail
 */
function appendDistinctSentence(base, tail) {
  const b = String(base || "").trim();
  const t = String(tail || "").trim();
  if (!t || b.includes(t)) return b;
  return b ? `${b} ${t}` : t;
}

/**
 * Executive truth slots shaped by **canonical parent intent** (Stage A class), not the literal question string.
 * Uses only anchored rows + executive summary trends already in the payload.
 * @param {{
 *   allAnchored: Array<{ subject: string; tr: object }>;
 *   trendLines: string[];
 *   totalQ: number;
 *   avgAcc: number;
 *   subjectDistinctCount: number;
 *   anyCannotConclude: boolean;
 *   uncertainRows: number;
 *   canonicalIntent: string;
 * }} x
 * @returns {{ observation: string; interpretation: string }}
 */
function buildExecutiveIntentNarrativeSlots(x) {
  const metas = x.allAnchored.map((row) => {
    const tr = row.tr;
    const cv = tr?.contractsV1 && typeof tr.contractsV1 === "object" ? tr.contractsV1 : {};
    const nar = cv.narrative && typeof cv.narrative === "object" ? cv.narrative : {};
    const slots = nar.textSlots && typeof nar.textSlots === "object" ? nar.textSlots : {};
    const obs = String(slots.observation || "").trim();
    const interp = String(slots.interpretation || "").trim();
    const unc = String(slots.uncertainty || "").trim();
    const cannot = cv.decision?.cannotConcludeYet === true;
    const acc = Math.max(0, Math.min(100, Math.round(Number(tr?.accuracy) || 0)));
    const q = Math.max(0, Number(tr?.questions ?? tr?.q) || 0);
    const dn = String(tr?.displayName || "").trim() || "נושא";
    const sid = String(row.subject || "");
    const readiness = mapReadinessForTruthPacket(cv.readiness?.readiness);
    const confidenceBand = mapConfidenceBand(cv.confidence?.confidenceBand);
    return { obs, interp, unc, cannot, acc, q, dn, sid, readiness, confidenceBand };
  });

  const trends = x.trendLines.filter(Boolean);
  const namedBits = metas
    .slice(0, 5)
    .map((m) => `${subjectLabelHe(m.sid)} — «${m.dn}»`)
    .join(" · ");

  const labelPair = (m) => `${subjectLabelHe(m.sid)} («${m.dn}»)`;

  const sparseExecutive = metas.length <= 1;

  const defaultObs =
    metas.length && metas[0].obs
      ? `לפי הדוח, הניסוח המעוגן הראשון הוא ב${labelPair(metas[0])}: ${clipHe(metas[0].obs, 170)}.`
      : namedBits
        ? `בדוח מופיעים ניסוחים מעוגנים: ${namedBits}.`
        : "בדוח יש כרגע מידע מעוגן; ככל שיוצגו ניסוחים נוספים, התמונה תתעבה.";

  const defaultInterpBase =
    (metas[0]?.interp && clipHe(metas[0].interp, 200)) ||
    (trends[0] && !looksLikeNumericOrCountLead(trends[0]) ? trends[0] : "") ||
    "מה שחסר בדוח הוא בעיקר רוחב של ניסוחים מעוגנים — לא בהכרח מספרים בפני עצמם.";
  const defaultInterp = appendDistinctSentence(defaultInterpBase, supportingNumericTail(x));

  const rankedWorstFirst = metas
    .filter((m) => m.q > 0)
    .slice()
    .sort((a, b) => {
      if (a.cannot !== b.cannot) return a.cannot ? -1 : 1;
      const rr = readinessRank(a.readiness) - readinessRank(b.readiness);
      if (rr !== 0) return rr;
      if (a.acc !== b.acc) return a.acc - b.acc;
      const oa = SUBJECT_ORDER.indexOf(a.sid);
      const ob = SUBJECT_ORDER.indexOf(b.sid);
      if (oa !== ob) return (oa < 0 ? 99 : oa) - (ob < 0 ? 99 : ob);
      return String(a.dn).localeCompare(String(b.dn), "he");
    });

  const rankedBestFirst = metas
    .filter((m) => m.q > 0)
    .slice()
    .sort((a, b) => {
      if (b.acc !== a.acc) return b.acc - a.acc;
      const oa = SUBJECT_ORDER.indexOf(a.sid);
      const ob = SUBJECT_ORDER.indexOf(b.sid);
      if (oa !== ob) return (oa < 0 ? 99 : oa) - (ob < 0 ? 99 : ob);
      return String(a.dn).localeCompare(String(b.dn), "he");
    });

  const intent = String(x.canonicalIntent || "unclear").trim() || "unclear";

  switch (intent) {
    case "what_is_most_important": {
      const hot = rankedWorstFirst.slice(0, 3);
      const obs =
        hot.length && hot.some((m) => m.cannot || m.readiness === "insufficient" || m.confidenceBand === "low")
          ? `לפי מה שמופיע בדוח, כדאי לפתוח תשומת לב ראשונה סביב מה שמסמן חוסר סגירה או ניסוח זהיר: ${hot.map((m) => `${labelPair(m)} — ${m.obs ? clipHe(m.obs, 78) : "יש ניסוח מעוגן"}`).join(" · ")}.`
          : `לפי הדוח אין כרגע מוקד «חריג» אחד חד — המקצועות והנושאים המעוגנים שמופיעים הם: ${namedBits || labelPair(metas[0])}.`;
      const interpParts = [];
      for (const m of hot.slice(0, 2)) {
        if (m.interp) interpParts.push(`ב${labelPair(m)} הדוח מתאר: ${clipHe(m.interp, 130)}`);
      }
      if (!interpParts.length && metas[0]?.interp) interpParts.push(clipHe(metas[0].interp, 180));
      const trendExtra = trends[1] && !looksLikeNumericOrCountLead(trends[1]) ? `שורת רקע מהסיכום התקופתי: ${trends[1]}` : "";
      let interp = appendDistinctSentence(interpParts.join(" · "), trendExtra);
      interp = appendDistinctSentence(interp, supportingNumericTail(x));
      if (!interp.trim()) interp = defaultInterp;
      return { observation: obs, interpretation: interp };
    }
    case "what_is_going_well": {
      const top = rankedBestFirst.slice(0, 2);
      const obs =
        top.length > 0
          ? `לפי הניסוחים המעוגנים בדוח, מה שנראה כרגע חזק יחסית: ${top.map((m) => `${labelPair(m)} — ${m.obs ? clipHe(m.obs, 95) : "ניסוח קצר מופיע בלי הרחבה"}`).join(" · ")}.`
          : defaultObs;
      const accNote =
        top.length > 0 ? `ליד המספרים: ${top.map((m) => `ב«${m.dn}» המדד מסתכם בכ־${m.acc}%`).join("; ")}.` : "";
      const interp0 = top[0]?.interp ? clipHe(top[0].interp, 180) : "";
      let interp = appendDistinctSentence(interp0, accNote);
      interp = appendDistinctSentence(interp, supportingNumericTail(x));
      if (!interp.trim()) interp = defaultInterp;
      return { observation: obs, interpretation: interp };
    }
    case "what_is_still_difficult": {
      const low = rankedWorstFirst.slice(0, 2);
      const obs =
        low.length > 0
          ? `מה שהדוח מתאר כרגע כדורש חיזוק או תשומת לב: ${low.map((m) => `${labelPair(m)} — ${m.obs ? clipHe(m.obs, 95) : "יש ניסוח מעוגן"}`).join(" · ")}.`
          : defaultObs;
      const accNote = low.length > 0 ? `ליד המדדים: ${low.map((m) => `ב«${m.dn}» כ־${m.acc}%`).join("; ")}.` : "";
      const interp0 = low[0]?.interp ? clipHe(low[0].interp, 190) : "";
      let interp = appendDistinctSentence(interp0, accNote);
      interp = appendDistinctSentence(interp, supportingNumericTail(x));
      if (!interp.trim()) interp = defaultInterp;
      return { observation: obs, interpretation: interp };
    }
    case "strength_vs_weakness_summary": {
      const best = rankedBestFirst[0];
      const worst = rankedWorstFirst[0];
      let obs = defaultObs;
      if (best && worst && (best.dn !== worst.dn || best.sid !== worst.sid)) {
        obs = `בהשוואה בתוך הדוח: הכי חזק — ${labelPair(best)} · הכי דורש חיזוק — ${labelPair(worst)}.`;
        obs = appendDistinctSentence(obs, `ליד המספרים: כ־${best.acc}% מול כ־${worst.acc}%.`);
      } else if (best) {
        obs = `לפי הדוח, הנקודה הבולטת ביותר במדדים היא ${labelPair(best)}.`;
        obs = appendDistinctSentence(obs, `ליד המספרים: כ־${best.acc}%.`);
      }
      const interpParts = [];
      if (best?.interp) interpParts.push(`בצד שמקבל חיזוק בניסוח: ${clipHe(best.interp, 125)}`);
      if (worst && worst !== best && worst.interp) interpParts.push(`בצד שדורש עבודה: ${clipHe(worst.interp, 125)}`);
      let interp = interpParts.join(" · ");
      if (trends[1] && !looksLikeNumericOrCountLead(trends[1])) {
        interp = appendDistinctSentence(interp, `שורת רקע מהסיכום התקופתי: ${trends[1]}`);
      }
      interp = appendDistinctSentence(interp, supportingNumericTail(x));
      if (!interp.trim()) interp = defaultInterp;
      return { observation: obs, interpretation: interp };
    }
    case "why_not_advance": {
      const blocked = metas.filter((m) => m.cannot);
      const obs =
        blocked.length > 0
          ? `בדוח יש נושאים שעדיין בלי בסיס מספיק להחלטת קידום, בהם: ${blocked.slice(0, 3).map(labelPair).join(" · ")}.`
          : `לפי הניסוחים המעוגנים, לא נחשפה עכשיו חסימת קידום חדה אצל כל הנקודות המדודות — עדיין חשוב לעקוב לפני שינוי רמה.`;
      const interp = blocked[0]?.unc
        ? clipHe(blocked[0].unc, 200)
        : trends[0] && !looksLikeNumericOrCountLead(trends[0])
          ? trends[0]
          : `כשמסלול הקידום לא מתעדכן, זה בדרך כלל משקף שחלק מהניסוחים עדיין לא סוגרים מספיק — במיוחד סביב: ${namedBits}.`;
      return { observation: obs, interpretation: appendDistinctSentence(interp, supportingNumericTail(x)) };
    }
    case "what_to_do_today":
    case "what_to_do_this_week": {
      const focus = rankedWorstFirst[0] || metas[0];
      const obs = focus
        ? `כשבוחרים צעד מעשי מתוך הדוח, הגיוני להתייחס קודם למה שמצביע על פער: ${labelPair(focus)}.`
        : defaultObs;
      let interp = metas[0]?.interp ? clipHe(metas[0].interp, 160) : defaultInterpBase;
      if (trends[1] && !looksLikeNumericOrCountLead(trends[1])) {
        interp = appendDistinctSentence(interp, `שורת רקע מהסיכום התקופתי: ${trends[1]}`);
      }
      interp = appendDistinctSentence(interp, supportingNumericTail(x));
      if (!interp.trim()) interp = defaultInterp;
      return { observation: obs, interpretation: interp };
    }
    case "how_to_tell_child": {
      const m = metas[0];
      if (!m) return { observation: defaultObs, interpretation: defaultInterp };
      const core = `אפשר לבחור משפט קצר שמתחיל ממה שממש מופיע בדוח ב${labelPair(m)}: ${
        m.obs ? `«${clipHe(m.obs, 150)}»` : "יש ניסוח מעוגן שאפשר לשייך לילד בשפה רכה."
      }`;
      const trendBack = trends[0] && !looksLikeNumericOrCountLead(trends[0]) ? `אם צריך הקשר רך: ${trends[0]}` : "";
      const obs = appendDistinctSentence(core, trendBack);
      let interp = m.interp ? `לצורך ניסוח להורה: ${clipHe(m.interp, 180)}` : "";
      interp = appendDistinctSentence(interp, supportingNumericTail(x));
      if (!interp.trim()) interp = defaultInterp;
      return { observation: obs, interpretation: interp };
    }
    case "question_for_teacher": {
      const ask = metas.filter((m) => m.cannot || m.confidenceBand === "low" || m.readiness === "insufficient").slice(0, 3);
      const obs =
        ask.length > 0
          ? `לפגישה או הודעה למורה, כדאי לשאול סביב המוקדים האלה מהדוח: ${ask.map(labelPair).join(" · ")}.`
          : `מהדוח כרגע אין מוקד שמחייב ניסוח «שאלה למורה» יוצא דופן — אפשר עדיין לשתף את ${namedBits || "הניסוחים המעוגנים"}.`;
      let interp = ask[0]?.unc || ask[0]?.interp ? clipHe(ask[0].unc || ask[0].interp, 200) : defaultInterpBase;
      interp = appendDistinctSentence(interp, supportingNumericTail(x));
      if (!interp.trim()) interp = defaultInterp;
      return { observation: obs, interpretation: interp };
    }
    case "is_intervention_needed": {
      const fragile = metas.filter((m) => m.cannot || m.confidenceBand === "low").length;
      const obs =
        fragile > 0
          ? `לפי ניסוחי הדוח, יש מוקדים עם ניסוח זהיר או שאינם סגורים לגמרי — זה מצמצם עד כמה אפשר לקבוע «סיפור אחד» חד מהדוח בלבד.`
          : `לפי ניסוחי הדוח, רוב המוקדים המעוגנים נראים יחסית יציבים לתקופה — בלי ללחוץ על תיוג בעיה כללית.`;
      const interpHead =
        x.anyCannotConclude || x.uncertainRows > 0
          ? `זה לא בהכרח אומר «בעיה חמורה», אלא בעיקר חוסר ודאות לגיטימי בניסוח — סביב: ${namedBits}.`
          : `לפי התמונה הכוללת מהדוח, אין כאן אות לדאגה גורפת — עדיין נכון להמשיך מעקב שגרתי.`;
      const interp = appendDistinctSentence(
        interpHead,
        `לצד זה, בדוח יש ${metas.length} ניסוחים מעוגנים; ${fragile > 0 ? `${fragile} מהם במצב עדין.` : "כולם בניסוח עקבי יחסית."}`,
      );
      return { observation: obs, interpretation: appendDistinctSentence(interp, supportingNumericTail(x)) };
    }
    case "clarify_term": {
      const m = metas[0];
      const obs = m
        ? `כדי להבין מונח מהדוח, הנה שורת עוגן מ«${m.dn}» ב${subjectLabelHe(m.sid)}: ${clipHe(m.obs, 200)}`
        : defaultObs;
      return {
        observation: obs,
        interpretation:
          "אם המילה שמבלבלת לא מופיעה בשורה הזו, אפשר לשאול עליה במילים אחרות — ננסה לאחזר את אותו ניסוח מהדוח בלבד.",
      };
    }
    case "explain_report": {
      let obs;
      if (sparseExecutive) {
        const m0 = metas[0];
        obs = m0
          ? `כרגע בדוח מופיע חומר מעוגן מצומצם: ב${labelPair(m0)}. ${m0.obs ? `מה שמנוסח שם: ${clipHe(m0.obs, 220)}` : "אין עדיין פסקת ניסוח ארוכה שמוצגת כאן."} התמונה הכוללת עדיין חלקית — עד שייאספו עוד נקודות עם ניסוח מעוגן.`
          : defaultObs;
      } else {
        const chunks = metas.slice(0, 4).map((m) => {
          const core = m.obs ? clipHe(m.obs, 95) : "ניסוח מעוגן קיים בלי פירוט ארוך";
          return `${labelPair(m)} — ${core}`;
        });
        obs = `לפי מה שמוצג עכשיו בדוח, אלה המקצועות והנושאים עם ניסוח מעוגן שאפשר להסתמך עליהם: ${chunks.join(" · ")}.`;
      }
      const interpParts = [];
      if (metas[0]?.interp) interpParts.push(clipHe(metas[0].interp, 200));
      if (metas[1]?.interp) interpParts.push(`במקביל, ב${labelPair(metas[1])}: ${clipHe(metas[1].interp, 170)}`);
      let interp = interpParts.join(" ");
      const narrTrend = trends.find((line) => line && !looksLikeNumericOrCountLead(line));
      if (narrTrend) interp = appendDistinctSentence(interp, `שורת רקע מהסיכום התקופתי שמלווה את הדוח: ${narrTrend}`);
      interp = appendDistinctSentence(interp, supportingNumericTail(x));
      if (!interp.trim()) interp = defaultInterp;
      return { observation: obs, interpretation: interp };
    }
    case "unclear":
    default: {
      let obs;
      if (sparseExecutive) {
        const m0 = metas[0];
        obs = m0
          ? `מה שמופיע בדוח כרגע הוא בעיקר ניסוח אחד מעוגן: ${labelPair(m0)}. ${m0.obs ? clipHe(m0.obs, 210) : "אין עדיין הרחבה נוספת מעבר לכותרת הנושא."} לכן התמונה מוגבלת למה שכבר הוכנס לטווח התקופה.`
          : defaultObs;
      } else {
        obs = `לפי רשימת המקורות המעוגנים בדוח, כרגע מופיעים: ${namedBits}. זה אומר שהתמונה בנויה ממקצועות ונושאים שכבר הוכנסו לטווח התקופה.`;
      }
      let interp = sparseExecutive
        ? "הדוח עדיין מסכם תקופה חלקית: ככל שיופיעו ניסוחים נוספים, אפשר יהיה לרכז תמונה עשירה יותר — בלי להסיק מעבר לנתוני התצוגה."
        : metas.some((m) => m.cannot || m.readiness === "insufficient" || m.confidenceBand === "low")
          ? "חלק מהמוקדים עדיין עם ניסוח זהיר או מוקדם לסגירה — זה מגביל כמה ברורה התמונה הכוללת."
          : "רוב המוקדים עם ניסוח יציב יחסית, כך שניתן לקרוא את הדוח כהדרגה של נקודות קונקרטיות ולא כציון כללי אחד.";
      interp = appendDistinctSentence(interp, supportingNumericTail(x));
      const narrTrendLead = trends.find((line) => line && !looksLikeNumericOrCountLead(line));
      if (narrTrendLead) {
        obs = appendDistinctSentence(obs, `שורת סיכום שמלווה את הדוח: ${narrTrendLead}`);
      }
      return { observation: obs, interpretation: interp };
    }
  }
}

/**
 * @param {unknown} narrative
 * @returns {keyof import("../contracts/narrative-contract-v1.js") extends never ? string : "WE0"|"WE1"|"WE2"|"WE3"|"WE4"}
 */
function wordingEnvelopeFromNarrative(narrative) {
  const w = String(narrative?.wordingEnvelope || "WE0").trim();
  if (["WE0", "WE1", "WE2", "WE3", "WE4"].includes(w)) return /** @type {const} */ (w);
  return "WE0";
}

/**
 * @param {unknown} payload
 * @param {{ scopeType: "topic"|"subject"|"executive"; scopeId: string; scopeLabel: string; canonicalIntent?: string }} scope
 * @returns {object|null}
 */
export function buildTruthPacketV1(payload, scope) {
  const allAnchored = listAllAnchoredTopicRows(payload);
  if (!allAnchored.length) return null;

  const es = payload?.executiveSummary && typeof payload.executiveSummary === "object" ? payload.executiveSummary : {};
  const trendLines = Array.isArray(es.majorTrendsHe) ? es.majorTrendsHe.map((x) => String(x || "").trim()).filter(Boolean) : [];

  let contracts;
  let topicRow;
  let subjectId = "";
  let q = 0;
  let acc = 0;
  let displayName = "הנושא";
  let readiness = "insufficient";
  let confidenceBand = "low";
  let cannotConcludeYet = false;
  let recommendationEligible = false;
  let recommendationIntensityCap = "RI0";
  let relevantSummaryLines = [];

  let topicStateId = null;
  let stateHash = null;

  if (scope.scopeType !== "executive") {
    const slice = readContractsSliceForScope(scope.scopeType, scope.scopeId, "", payload);
    if (!slice) return null;
    ({ contracts, topicRow, subjectId } = slice);

    const cs = topicRow?.canonicalState || slice.canonicalState || null;
    if (cs) {
      topicStateId = cs.topicStateId;
      stateHash = cs.stateHash;
      readiness = cs.assessment?.readiness || "insufficient";
      const cl = cs.assessment?.confidenceLevel;
      confidenceBand = cl === "high" ? "high" : cl === "moderate" ? "medium" : "low";
      cannotConcludeYet = !!cs.assessment?.cannotConcludeYet;
      recommendationEligible = !!cs.recommendation?.allowed;
      recommendationIntensityCap = cs.recommendation?.intensityCap || "RI0";
    } else {
      const narrative = contracts.narrative && typeof contracts.narrative === "object" ? contracts.narrative : {};
      const decision = contracts.decision && typeof contracts.decision === "object" ? contracts.decision : {};
      const readinessC = contracts.readiness && typeof contracts.readiness === "object" ? contracts.readiness : {};
      const confidenceC = contracts.confidence && typeof contracts.confidence === "object" ? contracts.confidence : {};
      const recommendation =
        contracts.recommendation && typeof contracts.recommendation === "object" ? contracts.recommendation : {};

      cannotConcludeYet = decision.cannotConcludeYet === true;
      recommendationEligible = recommendation.eligible === true;
      const capFromNarrative = String(narrative.recommendationIntensityCap || "RI0").toUpperCase();
      recommendationIntensityCap =
        capFromNarrative === "RI1" || capFromNarrative === "RI2" || capFromNarrative === "RI3"
          ? capFromNarrative
          : "RI0";

      readiness = mapReadinessForTruthPacket(readinessC.readiness);
      confidenceBand = mapConfidenceBand(confidenceC.confidenceBand);
    }

    q = Math.max(0, Number(topicRow?.questions ?? topicRow?.q) || 0);
    acc = Math.max(0, Math.min(100, Math.round(Number(topicRow?.accuracy) || 0)));
    const narrative = contracts.narrative && typeof contracts.narrative === "object" ? contracts.narrative : {};
    displayName = String(topicRow?.displayName || narrative?.topicKey || "הנושא").trim() || "הנושא";
    const obsLine = String(narrative?.textSlots?.observation || "").trim();
    relevantSummaryLines = obsLine ? [obsLine] : [displayName];
  } else {
    const anchor = allAnchored[0];
    subjectId = String(anchor.subject || "");
    const anchorContracts = readContractsSliceForScope("topic", String(anchor.tr?.topicRowKey || anchor.tr?.topicKey || ""), subjectId, payload);
    if (!anchorContracts) return null;

    let totalQ = 0;
    let weightedAcc = 0;
    let minReadiness = 3;
    let minConfidence = 2;
    let anyCannotConclude = false;
    let anyEligible = false;
    let minCapRank = 3;
    const capOrder = { RI0: 0, RI1: 1, RI2: 2, RI3: 3 };
    const subSet = new Set();
    let uncertainRows = 0;

    for (const row of allAnchored) {
      subSet.add(String(row.subject || ""));
      const tr = row.tr;
      const qx = Math.max(0, Number(tr?.questions ?? tr?.q) || 0);
      const ax = Math.max(0, Math.min(100, Math.round(Number(tr?.accuracy) || 0)));
      if (qx > 0) {
        totalQ += qx;
        weightedAcc += ax * qx;
      }
      const cv = tr?.contractsV1 && typeof tr.contractsV1 === "object" ? tr.contractsV1 : {};
      const rx = mapReadinessForTruthPacket(cv?.readiness?.readiness);
      const cx = mapConfidenceBand(cv?.confidence?.confidenceBand);
      minReadiness = Math.min(minReadiness, readinessRank(rx));
      minConfidence = Math.min(minConfidence, confidenceRank(cx));
      if (cv?.decision?.cannotConcludeYet === true) {
        anyCannotConclude = true;
        uncertainRows += 1;
      }
      if (cv?.recommendation?.eligible === true) anyEligible = true;
      const narx = cv?.narrative && typeof cv.narrative === "object" ? cv.narrative : {};
      const capFromNarrative = String(narx.recommendationIntensityCap || "RI0").toUpperCase();
      if (capFromNarrative in capOrder) minCapRank = Math.min(minCapRank, capOrder[capFromNarrative]);
    }

    const avgAcc = totalQ > 0 ? Math.round(weightedAcc / totalQ) : 0;
    q = totalQ;
    acc = avgAcc;
    displayName = "סיכום תקופתי";
    readiness = minReadiness >= 3 ? "ready" : minReadiness === 2 ? "emerging" : minReadiness === 1 ? "forming" : "insufficient";
    confidenceBand = minConfidence >= 2 ? "high" : minConfidence === 1 ? "medium" : "low";
    cannotConcludeYet = anyCannotConclude || totalQ <= 0;
    recommendationIntensityCap = minCapRank >= 3 ? "RI3" : minCapRank === 2 ? "RI2" : minCapRank === 1 ? "RI1" : "RI0";
    recommendationEligible = anyEligible && !cannotConcludeYet && confidenceBand !== "low";

    const trendsForSurface = trendLines.length
      ? trendLines.slice(0, 4)
      : [
          `בדוח התקופתי נספרו כ־${totalQ} שאלות בכלל המקצועות.`,
          totalQ > 0 ? `הדיוק הממוצע המשוקלל בתקופה הוא כ־${avgAcc}%.` : "עדיין חסר תרגול מצטבר לתמונה יציבה.",
        ];
    const uncertaintyLine =
      cannotConcludeYet || uncertainRows > 0
        ? "נכון לעכשיו עדיין יש תחומים בדוח שבהם מוקדם לקבוע מסקנה יציבה."
        : "נכון לעכשיו התמונה התקופתית עקבית יחסית, תוך המשך מעקב רגיל.";

    const narBase = anchorContracts.contracts?.narrative && typeof anchorContracts.contracts.narrative === "object"
      ? anchorContracts.contracts.narrative
      : {};
    const canon = String(scope?.canonicalIntent || "unclear").trim() || "unclear";
    const intentSlots = buildExecutiveIntentNarrativeSlots({
      allAnchored,
      trendLines: trendsForSurface,
      totalQ,
      avgAcc,
      subjectDistinctCount: subSet.size,
      anyCannotConclude,
      uncertainRows,
      canonicalIntent: canon,
    });
    const executiveNarrative = {
      ...narBase,
      topicKey: "executive",
      subjectId: "executive",
      textSlots: {
        observation: intentSlots.observation,
        interpretation: intentSlots.interpretation,
        action:
          recommendationEligible && recommendationIntensityCap !== "RI0"
            ? "אפשר לבחור צעד תמיכה אחד קצר לשבוע הקרוב ולבדוק מחדש אחרי עוד תרגול."
            : null,
        uncertainty: uncertaintyLine,
      },
    };
    contracts = {
      ...anchorContracts.contracts,
      narrative: executiveNarrative,
      decision: { ...(anchorContracts.contracts?.decision || {}), cannotConcludeYet, decisionTier: cannotConcludeYet ? 0 : 2 },
      readiness: { ...(anchorContracts.contracts?.readiness || {}), readiness },
      confidence: { ...(anchorContracts.contracts?.confidence || {}), confidenceBand },
      recommendation: {
        ...(anchorContracts.contracts?.recommendation || {}),
        eligible: recommendationEligible,
        intensity: recommendationIntensityCap,
      },
    };
    topicRow = { displayName, questions: totalQ, accuracy: avgAcc };
    relevantSummaryLines = trendsForSurface;
  }

  const narrative = contracts.narrative && typeof contracts.narrative === "object" ? contracts.narrative : {};
  const wordingEnvelope = wordingEnvelopeFromNarrative(narrative);
  const allowedSections = Array.isArray(narrative.allowedSections)
    ? narrative.allowedSections.filter((s) => ["summary", "finding", "recommendation", "limitations"].includes(String(s)))
    : ["summary", "finding", "recommendation", "limitations"];
  const forbiddenPhrases = Array.isArray(narrative.forbiddenPhrases) ? [...narrative.forbiddenPhrases] : [];
  const requiredHedges = Array.isArray(narrative.requiredHedges) ? [...narrative.requiredHedges] : [];

  /** @type {Array<"action_today"|"action_week"|"avoid_now"|"advance_or_hold"|"explain_to_child"|"ask_teacher"|"uncertainty_boundary">} */
  const allowedFollowupFamilies = [];
  if (cannotConcludeYet || confidenceBand === "low" || readiness === "insufficient") {
    allowedFollowupFamilies.push("uncertainty_boundary", "explain_to_child", "ask_teacher");
  }
  if (recommendationEligible && recommendationIntensityCap !== "RI0") {
    allowedFollowupFamilies.push("action_today", "action_week");
  }
  if (readiness === "forming" || readiness === "emerging" || readiness === "insufficient") {
    allowedFollowupFamilies.push("avoid_now");
  }
  allowedFollowupFamilies.push("advance_or_hold");
  const uniq = [...new Set(allowedFollowupFamilies)];

  const summaryLines =
    scope.scopeType === "executive"
      ? (relevantSummaryLines.length ? relevantSummaryLines.slice(0, 4) : [displayName])
      : (relevantSummaryLines.length ? relevantSummaryLines : [displayName]);

  const interpretationScopes = new Set([
    "recommendation",
    "confidence_uncertainty",
    "strengths",
    "weaknesses",
    "blocked_advance",
    "executive",
  ]);
  const rawInterp = String(scope?.interpretationScope || scope?.scopeClass || "").trim();
  const interpretationScope = interpretationScopes.has(rawInterp) ? rawInterp : "executive";

  return {
    schemaVersion: "v1",
    audience: "parent",
    scopeType: scope.scopeType,
    scopeId: scope.scopeId,
    scopeLabel: scope.scopeLabel,
    interpretationScope,
    topicStateId,
    stateHash,
    contracts,
    derivedLimits: {
      cannotConcludeYet,
      recommendationEligible,
      recommendationIntensityCap:
        recommendationIntensityCap === "RI0" ||
        recommendationIntensityCap === "RI1" ||
        recommendationIntensityCap === "RI2" ||
        recommendationIntensityCap === "RI3"
          ? recommendationIntensityCap
          : "RI0",
      readiness,
      confidenceBand,
    },
    surfaceFacts: {
      questions: q,
      accuracy: acc,
      displayName,
      subjectLabelHe: subjectLabelHe(subjectId),
      relevantSummaryLines: summaryLines,
    },
    allowedClaimEnvelope: {
      wordingEnvelope,
      allowedSections,
      forbiddenPhrases,
      requiredHedges,
    },
    allowedFollowupFamilies: uniq,
    forbiddenMoves: ["teacher_runtime", "non_contract_metrics", "cross_session_inference", "autonomous_planning"],
  };
}

export default { buildTruthPacketV1 };
