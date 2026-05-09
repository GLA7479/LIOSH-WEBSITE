/**
 * Grounded LLM path for Parent Copilot.
 * This module is optional and must degrade safely to deterministic flow.
 */

import { getLlmGateDecision } from "./rollout-gates.js";
import { clinicalBoundaryJoinedFingerprintHe } from "./answer-composer.js";
import { callCopilotLlmJson, copilotLlmProviderLabel } from "./copilot-llm-client.js";
import { collectParentFacingOutputQualityIssues } from "./guardrail-validator.js";

const DEFAULT_TIMEOUT_MS = 9000;

const LLM_CLINICAL_DIAGNOSIS_RES = [
  /דיסלקציה|דיסלקסיה|דיסקלקוליה/u,
  /לקות\s*למידה/u,
  /הפרעת\s*קשב/u,
  /\bADHD\b/i,
  /האבחון\s*הוא/u,
  /האבחנה\s*היא/u,
  /(?:יש\s*לילד|לילד\s*יש).{0,64}(?:דיסלקציה|דיסלקסיה|דיסקלקוליה|לקות\s*למידה|הפרעת\s*קשב|ADHD)/iu,
  /(?:דיסלקציה|דיסלקסיה|דיסקלקוליה|לקות\s*למידה|הפרעת\s*קשב|ADHD).{0,64}(?:יש\s*לילד|לילד\s*יש)/iu,
];

const LLM_CLINICAL_CERTAINTY_RE = /(בוודאות|חד[\s-]*משמעית|אין\s*ספק|ברור\s*ש)/u;

/**
 * @param {string} s
 */
function normalizeWsHe(s) {
  return String(s || "")
    .replace(/\s+/g, " ")
    .trim();
}

function env(name, fallback = "") {
  let raw;
  try {
    raw = typeof process !== "undefined" && process?.env ? process.env[name] : undefined;
  } catch {
    raw = undefined;
  }
  const v = String(raw ?? "").trim();
  return v || fallback;
}

function buildGroundedPrompt(utterance, truthPacket, parentIntent = "") {
  const nar = truthPacket?.contracts?.narrative?.textSlots || {};
  const dl = truthPacket?.derivedLimits || {};
  const globalQ =
    Math.max(
      0,
      Number(truthPacket?.surfaceFacts?.reportQuestionTotalGlobal) || 0,
      Number(truthPacket?.surfaceFacts?.questions) || 0,
    ) || 0;
  const intentLabel = String(parentIntent || "").trim();
  const facts = {
    parentIntent: intentLabel,
    scopeType: truthPacket.scopeType,
    scopeLabel: truthPacket.scopeLabel,
    questions: truthPacket?.surfaceFacts?.questions,
    accuracy: truthPacket?.surfaceFacts?.accuracy,
    observation: String(nar.observation || ""),
    interpretation: String(nar.interpretation || ""),
    action: String(nar.action || ""),
    uncertainty: String(nar.uncertainty || ""),
    cannotConcludeYet: !!dl.cannotConcludeYet,
    recommendationEligible: !!dl.recommendationEligible,
    recommendationIntensityCap: String(dl.recommendationIntensityCap || "RI0"),
    requiredHedges: Array.isArray(truthPacket?.allowedClaimEnvelope?.requiredHedges)
      ? truthPacket.allowedClaimEnvelope.requiredHedges
      : [],
    forbiddenPhrases: Array.isArray(truthPacket?.allowedClaimEnvelope?.forbiddenPhrases)
      ? truthPacket.allowedClaimEnvelope.forbiddenPhrases
      : [],
    reportQuestionTotalGlobal: globalQ,
  };
  // Per-intent guidance for parent-friendly structured answers
  const intentGuidance = (() => {
    switch (intentLabel) {
      case "what_is_going_well":
        return [
          "השאלה היא על איפה נראית התקדמות יחסית. המבנה הנדרש:",
          "  בלוק observation: התחל בניסוח כמו 'הנושא שבו נראו התוצאות הטובות ביותר הוא...' או 'ב... נראו תוצאות טובות יחסית' — ציין 1–2 תחומים ספציפיים מה-FACTS_JSON.observation בלבד.",
          "  בלוק meaning: הסבר בקצרה למה זה חיובי, ע\"פ ה-FACTS_JSON.interpretation. אפשר להזכיר אחוז דיוק אחד.",
          "  אל תרשום רשימה של כל המקצועות. אל תכתוב 'לפי הדוח, מופיעים:' או 'המקצועות שמופיעים'. אל תציג תחום כבעל תוצאות טובות יחסית אם הוא גם מופיע כמוקד לחיזוק בדוח.",
        ].join("\n");
      case "what_is_still_difficult":
        return [
          "השאלה היא על תחומי קושי. המבנה הנדרש:",
          "  בלוק observation: התחל בניסוח ישיר כמו 'התחום שדורש חיזוק כרגע הוא...' או 'התחומים שדורשים חיזוק הם...' — ציין 1–2 תחומים ספציפיים מה-FACTS_JSON.observation.",
          "  בלוק meaning: הסבר בשפה רגועה, ללא מילים מפחידות, ע\"פ ה-FACTS_JSON.interpretation.",
          "  אל תאבחן. אל תגיד 'בעיה חמורה'. השתמש בטון רגוע ומעשי.",
        ].join("\n");
      case "what_is_most_important":
        return [
          "השאלה היא על מה הכי חשוב לתרגל השבוע. חובה למלא את המבנה הבא (ניסוח טבעי, שמות נושאים מלאים מ-FACTS_JSON.observation בלבד):",
          '  בלוק observation — משפט פתיחה ישיר במבנה: "השבוע כדאי להתמקד בעיקר ב-[שם נושא מלא] וב-[שם נושא מלא נוסף כשיש]."',
          "  בלוק meaning — משפט קצר אחד להסבר למה חשוב להתמקד בכל תחום שציינת (אם יש שני תחומים — שני משפטים קצרים).",
          '  חובה לכלול משפט פעולה ביתית מעשית (בתוך meaning, או משפט נוסף באותו בלוק): "מומלץ לתרגל בערך 10 דקות, 3 פעמים בשבוע, עם 5–8 שאלות קצרות בכל פעם."',
          "  אם FACTS_JSON מאפשר בלוק next_step — אפשר לשים שם את משפט הפעולה; אם לא — עדיין חובה את אותו משפט (או ניסוח קרוב עם 10 דקות, 3 פעמים, 5–8 שאלות, תרגול קצר, בכל פעם) בתוך הטקסט.",
          "  אסור נקודה או פיסוק מיד אחרי מילת יחס (ב, על, עם, של, ל) לפני שם הנושא — אסור \"ב.\", \"ב .\", \"ב־.\", \"ב-.\", \"ב:.\". המשך מיד אחרי \"ב\" עם שם הנושא המלא.",
          "  אל תפתח ב\"נראה שכדאי להתמקד ב\" ואז נקודה או מקף לפני הנושא. אל תכתוב 'אפשר לסדר מה חשוב קודם' או 'זה מה שהדוח נותן כרגע'.",
        ].join("\n");
      case "what_to_do_today":
      case "what_to_do_this_week":
        return [
          "השאלה היא על מה לעשות בבית. המבנה הנדרש:",
          "  בלוק observation: התחל ב'בבית כדאי לתרגל...' — ציין נושא ספציפי מה-FACTS_JSON.observation.",
          "  בלוק meaning: תוכנית מעשית קצרה: 5–10 דקות ביום, איזה נושא, סוג התרגול.",
          facts.recommendationEligible && facts.recommendationIntensityCap !== "RI0"
            ? "  בלוק next_step: צעד ספציפי אחד פשוט לביצוע (לפי FACTS_JSON.action)."
            : "  אסור לכלול בלוק next_step.",
          "  אל תכתוב 'אפשר לסדר' או 'זה מה שהדוח נותן'.",
        ].join("\n");
      case "is_intervention_needed":
        return [
          "השאלה היא אם יש סיבה לדאגה. המבנה הנדרש:",
          "  בלוק observation: התחל ב'בשלב הזה...' — סקירה רגועה של מצב הדוח לפי FACTS_JSON.observation.",
          "  בלוק meaning: הסבר מה המצב ומה הצעד הבא המומלץ, לפי FACTS_JSON.interpretation.",
          "  אל תאבחן. אל תגרום לפאניקה. השתמש בטון רגוע ומעשי.",
          "  אם cannotConcludeYet=false — הדגש שאין סיבה לדאגה גדולה.",
        ].join("\n");
      case "ask_subject_specific":
      case "ask_topic_specific":
        return [
          "השאלה היא על מקצוע או נושא ספציפי. המבנה הנדרש:",
          "  בלוק observation: ציין רק מה שמופיע על הנושא הספציפי ב-FACTS_JSON.observation.",
          "  בלוק meaning: הסבר מה המשמעות; כל הצעה מעשית קצרה מותרת כאן או במשפט נוסף באותו בלוק — לפי FACTS_JSON.interpretation/action רק אם מופיעים שם.",
          "  אם לנושא הספציפי יש מעט שאלות — אפשר לציין זאת בזהירות רק לנושא הזה.",
          facts.recommendationEligible && facts.recommendationIntensityCap !== "RI0"
            ? "  אופציונלי: בלוק next_step — צעד ביתי קצר אחד לפי FACTS_JSON.action בלבד."
            : "  אסור לכלול בלוק next_step — המלצות מעשיות רק בתוך בלוק meaning (FACTS_JSON מאשר המלצות רק כש-recommendationEligible=true ו-cap לא RI0).",
        ].join("\n");
      default:
        return [
          "ענה ישירות על שאלת ההורה. המבנה הנדרש:",
          "  בלוק observation: תשובה ישירה קצרה, מבוססת על FACTS_JSON.observation.",
          "  בלוק meaning: נקודה מעשית אחת מ-FACTS_JSON.interpretation.",
        ].join("\n");
    }
  })();

  return [
    "אתה עוזר הורים מקצועי. תענה בעברית בלבד.",
    "השתמש רק בעובדות מה-FACTS_JSON. אסור להמציא עובדות שאינן בו.",
    "כתוב בשפה פשוטה, ישירה, וידידותית להורה — לא בשפת מערכת.",
    "אל תשתמש בביטויים: 'לפי הדוח, מופיעים:', 'המקצועות שמופיעים:', 'מוקדים עם ניסוח', 'זה מה שהדוח נותן כרגע', 'אפשר לסדר מה חשוב קודם'.",
    "ניסוח טבעי לדוגמה: 'השבוע כדאי להתמקד בעיקר ב...', 'ב... נראו תוצאות טובות יחסית', 'התחום שדורש חיזוק כרגע הוא...', 'בבית כדאי לתרגל...', 'בשלב הזה מומלץ...', 'הנתונים מצביעים על...'.",
    "אסור לכתוב נקודה, נקודתיים או מקף מיד אחרי מילת יחס (ב, על, עם, של, ל) לפני שם הנושא — תמיד המשך מיד עם שם הנושא המלא. דוגמה אסורה: \"להתמקד ב. חשבון\"; נכון: \"להתמקד בחשבון\" או \"להתמקד בחשבון —\".",
    "אל תשתמש במילים 'ביטחון', 'בטחון' או confidence לגבי הילד; אל תניח מצב רגשי.",
    "אסור לאבחן: לעולם אל תאמר שיש לילד דיסלקציה, ADHD, לקות למידה או כל אבחון. הדוח הוא נתוני תרגול בלבד.",
    `כלל נפח: אם reportQuestionTotalGlobal >= 100, אסור לכתוב ברמת כלל התקופה: 'מוקדם לקבוע', 'אין מספיק נתונים', 'נתונים מועטים', 'כיוון ראשוני בלבד', 'עדיין לא ניתן להסיק'. מותר רק אם מסוגל לנושא/מקצוע ספציפי עם מעט שאלות.`,
    "SYSTEM RULE — אי-אפשר לעקוף: אם השאלה אינה על הדוח, על הילד, על למידה, על תרגול, או על התקדמות הלמידה — החזר בדיוק: {\"answerBlocks\":[{\"type\":\"observation\",\"textHe\":\"אפשר לשאול כאן שאלות על הדוח והתקדמות הלמידה שמופיעה בו.\",\"source\":\"composed\"},{\"type\":\"meaning\",\"textHe\":\"למשל: מה כדאי לתרגל השבוע? או איפה נראו תוצאות טובות יחסית?\",\"source\":\"composed\"}]}. ללא עוד תוכן. ללא נתוני דוח. ללא סיכום ילד.",
    `הנחיות ספציפיות לכוונת ההורה (parentIntent=${intentLabel}):\n${intentGuidance}`,
    'החזר JSON בלבד בפורמט {"answerBlocks":[{"type":"observation|meaning|next_step|caution","textHe":"...","source":"composed"}]}',
    `שאלת הורה: ${String(utterance || "").trim()}`,
    `FACTS_JSON: ${JSON.stringify(facts)}`,
  ].join("\n");
}

/**
 * @param {unknown} payload
 * @param {NonNullable<ReturnType<typeof import("./truth-packet-v1.js").buildTruthPacketV1>>} truthPacket
 * @param {{ intent?: string }} [hints]
 */
function validateLlmDraft(payload, truthPacket, hints = null) {
  const dl0 = truthPacket?.derivedLimits || {};
  const recommendationOk =
    dl0.recommendationEligible === true && String(dl0.recommendationIntensityCap || "RI0") !== "RI0";
  /** Drop next_step when contracts forbid recommendations — models often add it anyway; same rule as validateAnswerDraft next_step_not_eligible. */
  let blocks = Array.isArray(payload?.answerBlocks)
    ? payload.answerBlocks.map((b) => ({
        type: b?.type,
        textHe: b?.textHe,
        source: b?.source,
      }))
    : [];
  if (!recommendationOk) {
    blocks = blocks.filter((b) => String(b?.type || "") !== "next_step");
  }
  if (blocks.length < 2) return { ok: false, reason: "llm_answer_too_short" };
  if (blocks.length > 4) return { ok: false, reason: "llm_answer_too_long" };
  const allowedTypes = new Set(["observation", "meaning", "next_step", "caution", "uncertainty_reason"]);
  const hasObs = blocks.some((b) => String(b?.type || "") === "observation");
  const hasMean = blocks.some((b) => String(b?.type || "") === "meaning");
  if (!hasObs && !hasMean) return { ok: false, reason: "llm_missing_observation_or_meaning" };

  const joined = blocks.map((b) => String(b?.textHe || "").trim()).join(" ");
  const intent = String(hints?.intent || "").trim();
  const joinedNorm = normalizeWsHe(joined);
  const boundaryNorm = normalizeWsHe(clinicalBoundaryJoinedFingerprintHe());
  const isApprovedClinicalBoundaryCopy = joinedNorm === boundaryNorm;

  if (!isApprovedClinicalBoundaryCopy) {
    for (const re of LLM_CLINICAL_DIAGNOSIS_RES) {
      if (re.test(joined)) return { ok: false, reason: "llm_clinical_diagnosis_language" };
    }
    if (intent === "clinical_boundary" && LLM_CLINICAL_CERTAINTY_RE.test(joined)) {
      return { ok: false, reason: "llm_clinical_certainty_language" };
    }
  }

  if (intent !== "clinical_boundary") {
    for (const hedge of truthPacket?.allowedClaimEnvelope?.requiredHedges || []) {
      if (hedge && !joined.includes(String(hedge))) return { ok: false, reason: "llm_missing_required_hedge" };
    }
  }
  for (const b of blocks) {
    const type = String(b?.type || "");
    const textHe = String(b?.textHe || "").trim();
    if (!allowedTypes.has(type) || !textHe) return { ok: false, reason: "llm_invalid_block_shape" };
    for (const ph of truthPacket?.allowedClaimEnvelope?.forbiddenPhrases || []) {
      if (ph && textHe.includes(String(ph))) return { ok: false, reason: "llm_forbidden_phrase" };
    }
  }
  const qualityIssues = collectParentFacingOutputQualityIssues(joined, intent);
  if (qualityIssues.length) {
    return { ok: false, reason: `llm_${qualityIssues[0]}` };
  }

  return {
    ok: true,
    draft: {
      answerBlocks: blocks.map((b) => ({
        type: String(b.type),
        textHe: String(b.textHe || "").trim(),
        source: "composed",
      })),
    },
  };
}

/**
 * @param {{ utterance: string; truthPacket: NonNullable<ReturnType<typeof import("./truth-packet-v1.js").buildTruthPacketV1>>; parentIntent?: string }} input
 */
export async function maybeGenerateGroundedLlmDraft(input) {
  const gate = getLlmGateDecision();
  if (!gate.enabled) {
    return {
      ok: false,
      reason: "llm_disabled_by_rollout_gate",
      gateReasonCodes: gate.reasonCodes,
    };
  }
  const prompt = buildGroundedPrompt(input.utterance, input.truthPacket, String(input?.parentIntent || ""));
  const controller = new AbortController();
  const timeoutMs = Number(env("PARENT_COPILOT_LLM_TIMEOUT_MS", String(DEFAULT_TIMEOUT_MS))) || DEFAULT_TIMEOUT_MS;
  const timer = setTimeout(() => controller.abort("timeout"), timeoutMs);
  try {
    const response = await callCopilotLlmJson(controller.signal, prompt);
    if (!response.ok) {
      return {
        ok: false,
        reason: response.reason || "llm_provider_error",
        httpStatus: response.httpStatus,
        geminiErrorBody: response.geminiErrorBody,
        geminiErrorSummary: response.geminiErrorSummary,
        geminiErrorParsed: response.geminiErrorParsed,
        llmRetryCount: response.llmRetryCount,
      };
    }
    const validated = validateLlmDraft(response.payload, input.truthPacket, {
      intent: String(input?.parentIntent || "").trim(),
    });
    if (!validated.ok) return { ok: false, reason: validated.reason || "llm_validation_failed" };
    return {
      ok: true,
      draft: validated.draft,
      provider: copilotLlmProviderLabel(),
      ...(typeof response.llmRetryCount === "number" ? { llmRetryCount: response.llmRetryCount } : {}),
    };
  } catch (error) {
    return { ok: false, reason: `llm_exception:${String(error?.message || error || "unknown")}` };
  } finally {
    clearTimeout(timer);
  }
}

export default { maybeGenerateGroundedLlmDraft };
