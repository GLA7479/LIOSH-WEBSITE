/**
 * TruthPacketV1 — **canonical owner of “what may be said”** for a Copilot turn for a given scope.
 *
 * **Ownership:** `buildTruthPacketV1` is the single builder; consumers (`answer-composer`, `conversation-planner`,
 * `guardrail-validator`, optional `llm-orchestrator`) read the packet — they must not invent facts outside it.
 *
 * **`allowedClaimEnvelope`:** Carries `requiredHedges`, `forbiddenPhrases`, and related narrative limits derived
 * from contracts. Deterministic composition and LLM drafts must respect it: required hedges must appear in parent
 * copy where applicable; forbidden phrases (including systemic clinical terms added for Copilot surfaces) must not.
 *
 * **What Copilot / LLM may say:** Only content grounded in the packet’s contracts (`narrative.textSlots`,
 * `derivedLimits`, recommendation eligibility, follow-up families). The LLM prompt is restricted to a JSON
 * “facts” projection of this packet; validators reject drafts that add diagnoses, forbidden phrases, ineligible
 * `next_step`, or missing hedges. See `./README.md` and `guardrail-validator.js` for policy detail.
 */

import {
  contractsFromTopicRow,
  listCopilotAnchoredTopicRows,
  readContractsSliceForScope,
  subjectLabelHe,
  SUBJECT_ORDER,
} from "./contract-reader.js";

/**
 * @param {unknown} payload
 * @param {string} subjectId
 * @param {string} topicRowKey
 */
function findDiagnosticUnitForIntelligence(payload, subjectId, topicRowKey) {
  const units = payload?.diagnosticEngineV2?.units;
  if (!Array.isArray(units)) return null;
  const sid = String(subjectId || "");
  const trk = String(topicRowKey || "");
  for (const u of units) {
    if (!u || typeof u !== "object") continue;
    if (String(u.subjectId || "") === sid && String(u.topicRowKey || "") === trk) return u;
  }
  return null;
}

/**
 * @param {object|null|undefined} unit
 */
function intelligenceV1DerivedSnapshotFromUnit(unit) {
  const iv = unit?.intelligenceV1;
  if (!iv || typeof iv !== "object") {
    return {
      weaknessLevel: "none",
      confidenceBand: "low",
      recurrence: false,
      hasPattern: false,
    };
  }
  const p = iv.patterns && typeof iv.patterns === "object" ? iv.patterns : {};
  const recurrence = !!p.recurrenceFull;
  const taxonomyId =
    p.taxonomyId != null && String(p.taxonomyId).trim() !== "" ? String(p.taxonomyId).trim() : null;
  const noPatternClaims = !!p.noPatternClaims;
  const weaknessLevel = String(iv.weakness?.level || "none");
  const confidenceBand = String(iv.confidence?.band || "low");
  const hasPattern =
    !!recurrence && !!taxonomyId && !noPatternClaims && weaknessLevel !== "none";
  return { weaknessLevel, confidenceBand, recurrence, hasPattern };
}

/**
 * Conservative rollup for executive scope (additive read-only).
 * @param {unknown} payload
 * @param {Array<{ subject: string; tr: object }>} allAnchored
 */
function rollupIntelligenceV1Executive(payload, allAnchored) {
  const wRank = (l) => (l === "stable" ? 2 : l === "tentative" ? 1 : 0);
  const cRank = (b) => (b === "high" ? 2 : b === "medium" ? 1 : 0);
  let weaknessRank = 0;
  let confRank = 2;
  let anyRec = false;
  let anyPat = false;
  for (const row of allAnchored || []) {
    const sid = String(row?.subject || "");
    const tr = row?.tr && typeof row.tr === "object" ? row.tr : {};
    const trk = String(tr.topicRowKey || tr.topicKey || "");
    const unit = findDiagnosticUnitForIntelligence(payload, sid, trk);
    const snap = intelligenceV1DerivedSnapshotFromUnit(unit);
    weaknessRank = Math.max(weaknessRank, wRank(snap.weaknessLevel));
    confRank = Math.min(confRank, cRank(snap.confidenceBand));
    if (snap.recurrence) anyRec = true;
    if (snap.hasPattern) anyPat = true;
  }
  const weaknessLevel = weaknessRank >= 2 ? "stable" : weaknessRank === 1 ? "tentative" : "none";
  const confidenceBand = confRank >= 2 ? "high" : confRank === 1 ? "medium" : "low";
  return { weaknessLevel, confidenceBand, recurrence: anyRec, hasPattern: anyPat };
}

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

/** Topic title for parents — drops internal «— סיכום תקופתי» suffix when present. */
function parentFacingTopicTitleHe(dn) {
  return String(dn || "")
    .replace(/\s*—\s*סיכום תקופתי\s*$/iu, "")
    .trim();
}

function isMisleadingZeroStableTrendLine(line) {
  return /נושאים שנשמרים טוב:\s*0\b/u.test(String(line || ""));
}

/**
 * Second executive trend line is sometimes a rollup artifact (0 «stable» rows). Suppress for rich windows.
 * @param {string} line
 * @param {number} totalQ
 */
function shouldAttachExecutiveSecondTrendLine(line, totalQ) {
  const tq = Math.max(0, Number(totalQ) || 0);
  /** Below ~full-window volume, extra «rollup» lines read like noise—especially for thin profiles. */
  if (tq < 88) return false;
  const s = String(line || "").trim();
  if (!s) return false;
  if (looksLikeNumericOrCountLead(s)) return false;
  if (tq >= 80 && isMisleadingZeroStableTrendLine(s)) return false;
  return true;
}

/**
 * Rank anchored topic rows for executive narratives (weak-first / strong-first).
 * @param {Array<{ subject: string; tr: object }>} allAnchored
 */
function buildAnchoredMetasForExecutive(allAnchored) {
  const metas = allAnchored.map((row) => {
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

  return { metas, rankedWorstFirst, rankedBestFirst };
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
 *   recommendationEligible?: boolean;
 *   recommendationIntensityCap?: string;
 * }} x
 * @returns {{ observation: string; interpretation: string; action?: string|null }}
 */
function buildExecutiveIntentNarrativeSlots(x) {
  const { metas, rankedWorstFirst, rankedBestFirst } = buildAnchoredMetasForExecutive(x.allAnchored);

  const trends = x.trendLines.filter(Boolean);
  const namedBits = metas
    .slice(0, 5)
    .map((m) => `${subjectLabelHe(m.sid)} — ${parentFacingTopicTitleHe(m.dn) || "נושא מהדוח"}`)
    .join(" · ");

  const labelPair = (m) => {
    const sub = subjectLabelHe(m.sid);
    const topic = parentFacingTopicTitleHe(m.dn);
    if (!topic || topic === sub) return sub;
    return `${sub} — ${topic}`;
  };

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
      const trendExtra =
        trends[1] && shouldAttachExecutiveSecondTrendLine(trends[1], x.totalQ)
          ? `נוסף מהדוח: ${trends[1]}`
          : "";
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
        top.length > 0
          ? `ליד המספרים: ${top.map((m) => `ב${parentFacingTopicTitleHe(m.dn)} המדד מסתכם בכ־${m.acc}%`).join("; ")}.`
          : "";
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
      const accNote =
        low.length > 0
          ? `ליד המדדים: ${low.map((m) => `ב${parentFacingTopicTitleHe(m.dn)} כ־${m.acc}%`).join("; ")}.`
          : "";
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
      if (trends[1] && shouldAttachExecutiveSecondTrendLine(trends[1], x.totalQ)) {
        interp = appendDistinctSentence(interp, `נוסף מהדוח: ${trends[1]}`);
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
      let interp = focus?.interp ? clipHe(focus.interp, 160) : defaultInterpBase;
      if (trends[1] && shouldAttachExecutiveSecondTrendLine(trends[1], x.totalQ)) {
        interp = appendDistinctSentence(interp, `נוסף מהדוח: ${trends[1]}`);
      }
      interp = appendDistinctSentence(interp, supportingNumericTail(x));
      if (!interp.trim()) interp = defaultInterp;
      const week = intent === "what_to_do_this_week";
      const thinPlan = x.totalQ < 90 || sparseExecutive;
      const allowRec =
        x.recommendationEligible === true && String(x.recommendationIntensityCap || "RI0") !== "RI0";
      /** @type {string|null} */
      let action = null;
      /** @type {string|null} */
      let stepsOnly = null;
      if (focus && !thinPlan) {
        const subjName = subjectLabelHe(focus.sid);
        const topicClean = parentFacingTopicTitleHe(focus.dn);
        const topicShort = clipHe(topicClean, 44);
        const stepAnchor =
          !topicClean || topicClean === subjName
            ? subjName
            : `${subjName} · ${topicShort}`;
        stepsOnly = week
          ? `1) לבחור את הנושא שדורש חיזוק ב${stepAnchor} ולחלק תרגול לשלושה חלונות קצרים בשבוע.\n2) בכל חלון לפתור 5–8 שאלות קצרות ולבדוק אם אותה טעות חוזרת.\n3) בסוף השבוע משפט אחד עם הילד — מה התקדם ומה עדיין צריך חיזוק.`
          : `1) מחר 10 דקות תרגול ממוקד ב${stepAnchor}.\n2) אחר כך 5–8 שאלות קצרות ולבדוק אם אותה טעות חוזרת.\n3) לסיים במשפט אחד עם הילד על מה ניסיתם יחד.`;
      } else if (thinPlan) {
        stepsOnly = week
          ? `1) לעשות השבוע עוד מספר סשנים קצרים של תרגול כדי שהדוח ייצב תמונה.\n2) לבחור נושא אחד שחוזר כקשה ולאזן חיזוק קצר מול לא להעמיס.\n3) בסוף השבוע לסכם במשפט אחד מה התקדם.`
          : `1) לעשות מחר שני סבבים קצרים של תרגול (כ־8–10 דקות כל אחד).\n2) לבחור נושא אחד שחוזר כקשה ולנסות שוב בקצב רגוע.\n3) לסיים במשפט אחד עם הילד מה הרגישם בבית.`;
      }
      if (stepsOnly) {
        if (allowRec) action = stepsOnly;
        else interp = appendDistinctSentence(interp, stepsOnly.replace(/\n/g, " "));
      }
      return { observation: obs, interpretation: interp, action };
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
          : `לפי התמונה הכוללת מהדוח, אין כאן אות לדאגה גורפת — עדיין נכון להמשיך בתרגול שגרתי ולבדוק שוב בהמשך.`;
      const interp = appendDistinctSentence(
        interpHead,
        `לצד זה, בדוח יש ${metas.length} ניסוחים מעוגנים; ${fragile > 0 ? `${fragile} מהם במצב עדין.` : "כולם בניסוח עקבי יחסית."}`,
      );
      return { observation: obs, interpretation: appendDistinctSentence(interp, supportingNumericTail(x)) };
    }
    case "clarify_term": {
      const m = metas[0];
      const obs = m
        ? `כדי להבין מונח מהדוח, הנה שורת עוגן מ${parentFacingTopicTitleHe(m.dn)} ב${subjectLabelHe(m.sid)}: ${clipHe(m.obs, 200)}`
        : defaultObs;
      return {
        observation: obs,
        interpretation:
          "אם המילה שמבלבלת לא מופיעה בשורה הזו, אפשר לשאול עליה במילים אחרות — ננסה לאחזר את אותו ניסוח מהדוח בלבד.",
      };
    }
    case "report_trust_question": {
      const w = rankedWorstFirst[0];
      const b = rankedBestFirst[0];
      const obs =
        w && b && (w.dn !== b.dn || w.sid !== b.sid)
          ? `בדוח כרגע רואים תמונה תקופתית מעוגנת במספרים: למשל ב${labelPair(w)} יש דיוק של כ־${w.acc}% על פני כ־${w.q} שאלות, לעומת ${labelPair(b)} עם כ־${b.acc}% על פני כ־${b.q} שאלות — זה משקף מה שנספר בתרגול בטווח, לא רגע בודד.`
          : w
            ? `בדוח כרגע רואים מה שנכתב כראיה מהתרגול ב${labelPair(w)} — בעיקר ניסוח מספרי על דיוק ועל נפח שאלות.`
            : defaultObs;
      const interp = appendDistinctSentence(
        "יכול להיות שבבית רואים הצלחה ברגע מסוים או בתשובה בודדת, בעוד שהדוח מתאר תבניות לאורך זמן ולא משווה ישירות לסיטואציה בבית.",
        "נבדוק שוב לפי עוד תרגול בטווח כדי לראות אם הקו נמשך או שהיה רגע חריג.",
      );
      return {
        observation: appendDistinctSentence(obs, supportingNumericTail(x)),
        interpretation: appendDistinctSentence(interp, supportingNumericTail(x)),
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
      const narrTrend = trends.find(
        (line) => line && !looksLikeNumericOrCountLead(line) && shouldAttachExecutiveSecondTrendLine(line, x.totalQ),
      );
      if (narrTrend) interp = appendDistinctSentence(interp, `נוסף מהדוח: ${narrTrend}`);
      interp = appendDistinctSentence(interp, supportingNumericTail(x));
      if (!interp.trim()) interp = defaultInterp;
      return { observation: obs, interpretation: interp };
    }
    case "simple_parent_explanation": {
      const best = rankedBestFirst[0];
      const worst = rankedWorstFirst[0];
      let obs;
      if (sparseExecutive || x.totalQ < 80) {
        obs =
          "יש כרגע לא הרבה תרגול שמופיע בדוח אצל הילד — התמונה כללית עדיין חלקית, וכדאי לצבור עוד קצת תרגול לפני מסקנה חדה.";
      } else if (best && worst && (best.sid !== worst.sid || best.dn !== worst.dn)) {
        obs = `בגדול: ב${subjectLabelHe(best.sid)} נראה יחסית יותר יציב לפי מה שנספר בדוח, וב${subjectLabelHe(worst.sid)} יש יותר מקום לחיזוק לפי אותו טווח.`;
      } else if (worst) {
        obs = `בגדול: הפער הבולט יותר לפי מה שנספר בדוח הוא סביב ${subjectLabelHe(worst.sid)} — שם כדאי לשים תשומת לב רגועה בבית.`;
      } else {
        obs =
          "בדוח יש נתונים מהתרגול על כמה מקצועות — אפשר להסתכל על זה כמו על תמונה כללית של מה שנעשה בתקופה, לא כמו ציון אחד.";
      }
      let interp = `במשפטים פשוטים: בסך הכל נספרו בערך ${x.totalQ} שאלות בטווח התקופה, והדיוק המשוקלל הוא בערך ${x.avgAcc}%.`;
      if (worst && worst.acc < 55) {
        interp += ` המקום שבו זה נראה פחות יציב הוא סביב ${subjectLabelHe(worst.sid)} — שם כדאי לחזק בקצב קצר וקבוע.`;
      } else if (best && best.acc >= 75) {
        interp += ` יש גם כיוון חזק יחסית ב${subjectLabelHe(best.sid)} — אפשר לבנות עליו ביטחון הדרגתי.`;
      }
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
      const narrTrendLead = trends.find(
        (line) => line && !looksLikeNumericOrCountLead(line) && shouldAttachExecutiveSecondTrendLine(line, x.totalQ),
      );
      if (narrTrendLead) {
        obs = appendDistinctSentence(obs, `נוסף מהדוח: ${narrTrendLead}`);
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
 * No anchored `topicRecommendations` rows (or missing contract slice): generic explanation only — no topic-level claims, no inferred evidence.
 * @param {{ scopeType: "topic"|"subject"|"executive"; scopeId: string; scopeLabel: string; canonicalIntent?: string; interpretationScope?: string; scopeClass?: string }} scope
 */
function buildTruthPacketV1NoAnchoredFallback(scope) {
  const s = scope && typeof scope === "object" ? scope : {};
  const scopeLabel = String(s.scopeLabel || "הדוח").trim() || "הדוח";
  const interpretationScopes = new Set([
    "recommendation",
    "confidence_uncertainty",
    "strengths",
    "weaknesses",
    "blocked_advance",
    "executive",
  ]);
  const rawInterp = String(s.interpretationScope || s.scopeClass || "").trim();
  const interpretationScope = interpretationScopes.has(rawInterp) ? rawInterp : "executive";

  const contracts = {
    narrative: {
      contractVersion: "v1",
      topicKey: "__no_anchor__",
      subjectId: "__no_anchor__",
      wordingEnvelope: "WE0",
      hedgeLevel: "mandatory",
      allowedTone: "parent_professional_warm",
      forbiddenPhrases: ["בטוח לחלוטין", "בוודאות מלאה", "ללא ספק בכלל", "חד משמעית"],
      requiredHedges: ["בשלב זה", "עדיין מוקדם לקבוע"],
      allowedSections: ["summary", "finding", "recommendation", "limitations"],
      recommendationIntensityCap: "RI0",
      textSlots: {
        observation:
          "כרגע אין מספיק נתוני תרגול מעוגנים בדוח כדי לקבוע חולשה מובהקת במקצוע מסוים, ולכן אי אפשר לבנות כאן תמונת קושי קונקרטית בוודאות.",
        interpretation:
          "לפי מעט הנתונים שכן מופיעים אפשר לדבר רק על סימנים ראשוניים, ולא להסיק מעבר למה שמוצג בפועל בדוח בתקופה הזו.",
        action: null,
        uncertainty:
          "כדאי לצבור עוד תרגול קצר לפני מסקנה: 10 דקות חזרה במקצוע אחד, אחר כך 5-8 שאלות בנושא נוסף, ואז לבדוק אם אותו דפוס חוזר גם ביומיים הבאים.",
      },
    },
    decision: {
      contractVersion: "v1",
      topicKey: "__no_anchor__",
      subjectId: "__no_anchor__",
      decisionTier: 0,
      cannotConcludeYet: true,
    },
    readiness: {
      contractVersion: "v1",
      topicKey: "__no_anchor__",
      subjectId: "__no_anchor__",
      readiness: "insufficient",
    },
    confidence: {
      contractVersion: "v1",
      topicKey: "__no_anchor__",
      subjectId: "__no_anchor__",
      confidenceBand: "low",
    },
    recommendation: {
      contractVersion: "v1",
      topicKey: "__no_anchor__",
      subjectId: "__no_anchor__",
      eligible: false,
      intensity: "RI0",
      forbiddenBecause: ["cannot_conclude_yet"],
    },
    evidence: null,
  };

  const narrative = contracts.narrative;
  const wordingEnvelope = wordingEnvelopeFromNarrative(narrative);
  const allowedSections = Array.isArray(narrative.allowedSections)
    ? narrative.allowedSections.filter((x) => ["summary", "finding", "recommendation", "limitations"].includes(String(x)))
    : ["summary", "finding", "recommendation", "limitations"];
  const forbiddenPhrases = Array.isArray(narrative.forbiddenPhrases) ? [...narrative.forbiddenPhrases] : [];
  const systemicCopilotClinicalForbidden = [
    "דיסלקציה",
    "דיסלקסיה",
    "דיסקלקוליה",
    "לקות למידה",
    "הפרעת קשב",
    "ADHD",
    "האבחון הוא",
    "האבחנה היא",
  ];
  for (const ph of systemicCopilotClinicalForbidden) {
    if (ph && !forbiddenPhrases.includes(ph)) forbiddenPhrases.push(ph);
  }
  const requiredHedges = Array.isArray(narrative.requiredHedges) ? [...narrative.requiredHedges] : [];

  const cannotConcludeYet = true;
  const recommendationEligible = false;
  const recommendationIntensityCap = "RI0";
  const readiness = "insufficient";
  const confidenceBand = "low";
  const anchorUncertaintyRows = 1;
  const intelligenceV1Snapshot = {
    weaknessLevel: "none",
    confidenceBand: "low",
    recurrence: false,
    hasPattern: false,
  };
  const q = 0;
  const acc = 0;
  const displayName = scopeLabel;
  const subjectId = "";
  const topicStateId = null;
  const stateHash = null;
  const relevantSummaryLines = [String(narrative.textSlots?.observation || "").trim()].filter(Boolean);

  const narTs = narrative.textSlots && typeof narrative.textSlots === "object" ? narrative.textSlots : {};
  const slotObs = String(narTs.observation || "").trim();
  const slotInterp = String(narTs.interpretation || "").trim();
  const slotUnc = String(narTs.uncertainty || "").trim();
  const narrativeCoreOk = slotObs.length >= 14 && (slotInterp.length >= 14 || slotUnc.length >= 14);
  const narrativeSignalsOpenPartial =
    /עדיין|זהיר|חלקי|מוקדם|לא\s+ברור|חוסר|בינוני|נדרש|חיזוק|פתוח|מוגבל|לא\s+סגור|מוקדם\s+ל|מצומצם|לא\s+אפשר\s+לקבוע|לא\s+להתקדם|לעצור|להמתין|דורש\s+חיזוק|תשומת\s+לב|אינם\s+סגורים|בלי\s+בסיס\s+מספיק|לא\s+סוגרים/u.test(
      `${slotInterp} ${slotUnc}`,
    );

  const allowedFollowupFamilies = [];
  if (cannotConcludeYet || confidenceBand === "low" || readiness === "insufficient") {
    allowedFollowupFamilies.push("uncertainty_boundary", "explain_to_child", "ask_teacher");
  }
  const avoidNowGrounded =
    narrativeCoreOk &&
    (cannotConcludeYet ||
      confidenceBand === "low" ||
      readiness === "insufficient" ||
      readiness === "forming" ||
      anchorUncertaintyRows > 0 ||
      (readiness === "emerging" && narrativeSignalsOpenPartial));
  if (avoidNowGrounded) {
    allowedFollowupFamilies.push("avoid_now");
  }
  const advanceHoldGrounded =
    narrativeCoreOk &&
    (cannotConcludeYet ||
      anchorUncertaintyRows > 0 ||
      !recommendationEligible ||
      String(recommendationIntensityCap || "RI0").toUpperCase() === "RI0" ||
      readiness === "insufficient" ||
      confidenceBand === "low" ||
      (readiness !== "ready" && narrativeSignalsOpenPartial));
  if (advanceHoldGrounded) {
    allowedFollowupFamilies.push("advance_or_hold");
  }
  let uniq = [...new Set(allowedFollowupFamilies)];
  if (!uniq.length) uniq = ["uncertainty_boundary"];

  const summaryLines =
    s.scopeType === "executive"
      ? (relevantSummaryLines.length ? relevantSummaryLines.slice(0, 4) : [displayName])
      : relevantSummaryLines.length
        ? relevantSummaryLines
        : [displayName];

  return {
    schemaVersion: "v1",
    audience: "parent",
    scopeType: s.scopeType,
    scopeId: s.scopeId,
    scopeLabel: s.scopeLabel,
    interpretationScope,
    topicStateId,
    stateHash,
    contracts,
    derivedLimits: {
      cannotConcludeYet,
      recommendationEligible,
      recommendationIntensityCap: "RI0",
      readiness,
      confidenceBand,
    },
    signals: {
      intelligenceV1: intelligenceV1Snapshot,
    },
    surfaceFacts: {
      questions: q,
      accuracy: acc,
      displayName,
      subjectLabelHe: subjectLabelHe(subjectId),
      weakFocusSubjectLabelHe: "",
      weakFocusTopicDisplayNameHe: "",
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
    debug: {
      intelligenceV1: intelligenceV1Snapshot,
    },
  };
}

/**
 * @param {unknown} payload
 * @param {{ scopeType: "topic"|"subject"|"executive"; scopeId: string; scopeLabel: string; canonicalIntent?: string }} scope
 * @returns {object|null}
 */
export function buildTruthPacketV1(payload, scope) {
  const allAnchored = listCopilotAnchoredTopicRows(payload);
  if (!allAnchored.length) return buildTruthPacketV1NoAnchoredFallback(scope);

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
  /** Anchored rows with cannotConclude (executive rollup) or subject/topic risk flag. */
  let anchorUncertaintyRows = 0;

  let intelligenceV1Snapshot = {
    weaknessLevel: "none",
    confidenceBand: "low",
    recurrence: false,
    hasPattern: false,
  };

  if (scope.scopeType !== "executive") {
    const slice = readContractsSliceForScope(scope.scopeType, scope.scopeId, "", payload);
    if (!slice) return buildTruthPacketV1NoAnchoredFallback(scope);
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
      cannotConcludeYet = true;
      recommendationEligible = false;
      recommendationIntensityCap = "RI0";
      readiness = "insufficient";
      confidenceBand = "low";
    }

    q = Math.max(0, Number(topicRow?.questions ?? topicRow?.q) || 0);
    acc = Math.max(0, Math.min(100, Math.round(Number(topicRow?.accuracy) || 0)));
    const narrative = contracts.narrative && typeof contracts.narrative === "object" ? contracts.narrative : {};
    displayName = String(topicRow?.displayName || narrative?.topicKey || "הנושא").trim() || "הנושא";
    const obsLine = String(narrative?.textSlots?.observation || "").trim();
    relevantSummaryLines = obsLine ? [obsLine] : [displayName];
    if (cannotConcludeYet || confidenceBand === "low" || readiness === "insufficient" || readiness === "forming") {
      anchorUncertaintyRows = 1;
    }
    const trkIv = String(
      topicRow?.topicRowKey || topicRow?.topicKey || scope.scopeId || ""
    );
    intelligenceV1Snapshot = intelligenceV1DerivedSnapshotFromUnit(
      findDiagnosticUnitForIntelligence(payload, subjectId, trkIv)
    );
  } else {
    const anchor = allAnchored[0];
    subjectId = String(anchor.subject || "");
    /** Synthetic aggregate rows are not guaranteed to round-trip via payload lookup. */
    let anchorContracts = null;
    if (anchor.tr?.__copilotSyntheticAggregate) {
      anchorContracts = {
        subjectId,
        topicRow: anchor.tr,
        contracts: contractsFromTopicRow(anchor.tr),
      };
    } else {
      anchorContracts = readContractsSliceForScope(
        "topic",
        String(anchor.tr?.topicRowKey || anchor.tr?.topicKey || ""),
        subjectId,
        payload,
      );
    }
    if (!anchorContracts) return buildTruthPacketV1NoAnchoredFallback(scope);

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
    let partialDataRowSignals = 0;

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
      if (rx === "forming" || rx === "insufficient" || cx === "low") partialDataRowSignals += 1;
      if (cv?.recommendation?.eligible === true) anyEligible = true;
      const narx = cv?.narrative && typeof cv.narrative === "object" ? cv.narrative : {};
      const capFromNarrative = String(narx.recommendationIntensityCap || "RI0").toUpperCase();
      if (capFromNarrative in capOrder) minCapRank = Math.min(minCapRank, capOrder[capFromNarrative]);
    }

    const avgAcc = totalQ > 0 ? Math.round(weightedAcc / totalQ) : 0;
    q = totalQ;
    acc = avgAcc;
    displayName = "מבט על התקופה";
    readiness = minReadiness >= 3 ? "ready" : minReadiness === 2 ? "emerging" : minReadiness === 1 ? "forming" : "insufficient";
    confidenceBand = minConfidence >= 2 ? "high" : minConfidence === 1 ? "medium" : "low";
    cannotConcludeYet = anyCannotConclude || totalQ <= 0;
    recommendationIntensityCap = minCapRank >= 3 ? "RI3" : minCapRank === 2 ? "RI2" : minCapRank === 1 ? "RI1" : "RI0";
    recommendationEligible = anyEligible && !cannotConcludeYet && confidenceBand !== "low";

    intelligenceV1Snapshot = rollupIntelligenceV1Executive(payload, allAnchored);

    const trendsForSurface = trendLines.length
      ? trendLines.slice(0, 4)
      : [
          `בדוח התקופתי נספרו כ־${totalQ} שאלות בכלל המקצועות.`,
          totalQ > 0 ? `הדיוק הממוצע המשוקלל בתקופה הוא כ־${avgAcc}%.` : "עדיין חסר תרגול מצטבר לתמונה יציבה.",
        ];
    let uncertaintyLine;
    if (totalQ >= 50 && avgAcc >= 65) {
      uncertaintyLine =
        uncertainRows > 2 || cannotConcludeYet
          ? "בדוח מופיע נפח תרגול משמעותי; חלק מהניסוחים עדיין זהירים — ייתכן שבבית זה נראה אחרת, ולכן נבדוק שוב לפי עוד תרגול ולא נקבע חיפוז מהיר מדי."
          : "לפי נפח השאלות והדיוק בטווח ניתן לדבר על כיוון כללי מהדוח; עדיין כדאי לעדכן שוב אחרי תרגול נוסף כי לפעמים בבית זה נראה שונה.";
    } else {
      uncertaintyLine =
        cannotConcludeYet || uncertainRows > 0
          ? "נכון לעכשיו עדיין יש תחומים בדוח שבהם מוקדם לקבוע תמונה ברורה מהתרגולים."
          : "נכון לעכשיו התמונה התקופתית עקבית יחסית, תוך המשך תרגול רגיל ובדיקה חוזרת בהמשך.";
    }

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
      recommendationEligible,
      recommendationIntensityCap,
    });
    const slotAction =
      intentSlots &&
      intentSlots.action != null &&
      String(intentSlots.action || "").trim().length > 0
        ? String(intentSlots.action || "").trim()
        : "";
    const executiveNarrative = {
      ...narBase,
      topicKey: "executive",
      subjectId: "executive",
      textSlots: {
        observation: intentSlots.observation,
        interpretation: intentSlots.interpretation,
        action: slotAction
          ? slotAction
          : recommendationEligible && recommendationIntensityCap !== "RI0"
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
    anchorUncertaintyRows = uncertainRows + partialDataRowSignals;
  }

  const narrative = contracts.narrative && typeof contracts.narrative === "object" ? contracts.narrative : {};
  const wordingEnvelope = wordingEnvelopeFromNarrative(narrative);
  const allowedSections = Array.isArray(narrative.allowedSections)
    ? narrative.allowedSections.filter((s) => ["summary", "finding", "recommendation", "limitations"].includes(String(s)))
    : ["summary", "finding", "recommendation", "limitations"];
  const forbiddenPhrases = Array.isArray(narrative.forbiddenPhrases) ? [...narrative.forbiddenPhrases] : [];
  /** Copilot-only systemic envelope: block clinical labeling in composed/LLM surfaces (additive). */
  const systemicCopilotClinicalForbidden = [
    "דיסלקציה",
    "דיסלקסיה",
    "דיסקלקוליה",
    "לקות למידה",
    "הפרעת קשב",
    "ADHD",
    "האבחון הוא",
    "האבחנה היא",
  ];
  if (scope.scopeType === "topic" || scope.scopeType === "subject" || scope.scopeType === "executive") {
    for (const ph of systemicCopilotClinicalForbidden) {
      if (ph && !forbiddenPhrases.includes(ph)) forbiddenPhrases.push(ph);
    }
  }
  const requiredHedges = Array.isArray(narrative.requiredHedges) ? [...narrative.requiredHedges] : [];

  const narTs = narrative.textSlots && typeof narrative.textSlots === "object" ? narrative.textSlots : {};
  const slotObs = String(narTs.observation || "").trim();
  const slotInterp = String(narTs.interpretation || "").trim();
  const slotUnc = String(narTs.uncertainty || "").trim();
  const narrativeCoreOk = slotObs.length >= 14 && (slotInterp.length >= 14 || slotUnc.length >= 14);
  const narrativeSignalsOpenPartial =
    /עדיין|זהיר|חלקי|מוקדם|לא\s+ברור|חוסר|בינוני|נדרש|חיזוק|פתוח|מוגבל|לא\s+סגור|מוקדם\s+ל|מצומצם|לא\s+אפשר\s+לקבוע|לא\s+להתקדם|לעצור|להמתין|דורש\s+חיזוק|תשומת\s+לב|אינם\s+סגורים|בלי\s+בסיס\s+מספיק|לא\s+סוגרים/u.test(
      `${slotInterp} ${slotUnc}`,
    );

  /** @type {Array<"action_today"|"action_week"|"avoid_now"|"advance_or_hold"|"explain_to_child"|"ask_teacher"|"uncertainty_boundary">} */
  const allowedFollowupFamilies = [];
  if (cannotConcludeYet || confidenceBand === "low" || readiness === "insufficient") {
    allowedFollowupFamilies.push("uncertainty_boundary", "explain_to_child", "ask_teacher");
  }
  if (recommendationEligible && recommendationIntensityCap !== "RI0") {
    allowedFollowupFamilies.push("action_today", "action_week");
  }
  /** Offer «מה להימנע» only when continuation can lean on real partial-risk signals, not «emerging» alone. */
  const avoidNowGrounded =
    narrativeCoreOk &&
    (cannotConcludeYet ||
      confidenceBand === "low" ||
      readiness === "insufficient" ||
      readiness === "forming" ||
      anchorUncertaintyRows > 0 ||
      (readiness === "emerging" && narrativeSignalsOpenPartial));
  if (avoidNowGrounded) {
    allowedFollowupFamilies.push("avoid_now");
  }
  /** Offer advance/hold only when the packet supports a non-generic tradeoff (risk rows, limits, or open partial copy). */
  const advanceHoldGrounded =
    narrativeCoreOk &&
    (cannotConcludeYet ||
      anchorUncertaintyRows > 0 ||
      !recommendationEligible ||
      String(recommendationIntensityCap || "RI0").toUpperCase() === "RI0" ||
      readiness === "insufficient" ||
      confidenceBand === "low" ||
      (readiness !== "ready" && narrativeSignalsOpenPartial));
  if (advanceHoldGrounded) {
    allowedFollowupFamilies.push("advance_or_hold");
  }
  let uniq = [...new Set(allowedFollowupFamilies)];
  if (!uniq.length) uniq = ["uncertainty_boundary"];

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

  let weakFocusSubjectLabelHe = subjectLabelHe(subjectId);
  let weakFocusTopicDisplayNameHe = "";
  if (scope.scopeType === "executive") {
    const { rankedWorstFirst } = buildAnchoredMetasForExecutive(allAnchored);
    const wf = rankedWorstFirst[0];
    if (wf) {
      weakFocusSubjectLabelHe = subjectLabelHe(wf.sid);
      weakFocusTopicDisplayNameHe = String(wf.dn || "").trim();
    }
  }

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
    signals: {
      intelligenceV1: intelligenceV1Snapshot,
    },
    surfaceFacts: {
      questions: q,
      accuracy: acc,
      displayName,
      subjectLabelHe: subjectLabelHe(subjectId),
      weakFocusSubjectLabelHe,
      weakFocusTopicDisplayNameHe,
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
    debug: {
      intelligenceV1: intelligenceV1Snapshot,
    },
  };
}

export default { buildTruthPacketV1 };
