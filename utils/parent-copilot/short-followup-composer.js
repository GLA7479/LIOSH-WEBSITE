/**
 * Continuation turns: classify short parent replies by behavior class, then compose from last scope + contracts (no full replan).
 */

import { buildTruthPacketV1 } from "./truth-packet-v1.js";
import { classifyShortParentReplyClassHe } from "./conversational-reply-class-he.js";

/**
 * @param {{ utteranceStr: string; conv: object; payload: unknown }} ctx
 * @returns {null|{ truthPacket: object; plannerIntent: string; answerBlocks: Array<{ type: string; textHe: string; source: string }>; scopeMeta: object; replyClass: string }}
 */
export function tryBuildParentShortFollowupDraft(ctx) {
  const utteranceStr = String(ctx.utteranceStr || "").trim();
  const conv = ctx.conv || {};
  const payload = ctx.payload;

  const replyClass = classifyShortParentReplyClassHe(utteranceStr, { conv });
  if (!replyClass) return null;

  const fam = String(conv.lastOfferedFollowupFamily || "").trim();
  const scopes = Array.isArray(conv.priorScopes) ? conv.priorScopes : [];
  const scopeKey = scopes.length ? String(scopes[scopes.length - 1] || "").trim() : "";
  if (!fam || !scopeKey) return null;
  const colon = scopeKey.indexOf(":");
  if (colon < 1) return null;
  const scopeType = scopeKey.slice(0, colon);
  const scopeId = scopeKey.slice(colon + 1);
  if (!scopeType || !scopeId) return null;

  const scopeLabel =
    String(conv.lastScopeLabelHe || "").trim() || (scopeType === "executive" ? "הדוח בתקופה הנבחרה" : "נושא");

  const scope = {
    scopeType,
    scopeId,
    scopeLabel,
    interpretationScope: "executive",
    scopeClass: "executive",
    canonicalIntent: String(conv.lastPlannerIntent || "unclear").trim() || "unclear",
  };

  const truthPacket = buildTruthPacketV1(payload, scope);
  if (!truthPacket) return null;

  const slots =
    truthPacket.contracts?.narrative?.textSlots && typeof truthPacket.contracts.narrative.textSlots === "object"
      ? truthPacket.contracts.narrative.textSlots
      : {};
  const obs = String(slots.observation || "").trim();
  const interp = String(slots.interpretation || "").trim();
  const act = String(slots.action || "").trim();
  const dl = truthPacket.derivedLimits || {};

  let plannerIntent = String(conv.lastPlannerIntent || "unclear").trim() || "unclear";

  /** @type {Array<{ type: string; textHe: string; source: string }>} */
  let answerBlocks = [];

  switch (replyClass) {
    case "affirmation_continue":
      if (fam === "action_today" || fam === "action_week") {
        plannerIntent = fam === "action_week" ? "what_to_do_this_week" : "what_to_do_today";
        if (!dl.recommendationEligible || String(dl.recommendationIntensityCap || "RI0") === "RI0") {
          answerBlocks = [
            {
              type: "observation",
              textHe:
                "לפי מה שבדוח כרגע — אין עדיין בסיס חזק מספיק לצעד גדול; עדיף צעד זעיר מאוד אחרי עוד תרגול, או המתנה קצרה.",
              source: "composed",
            },
            { type: "meaning", textHe: interp ? interp.slice(0, 420) : obs.slice(0, 420), source: "composed" },
          ];
        } else {
          answerBlocks = [
            {
              type: "observation",
              textHe: "מצוין — מתחילים בצעד קטן שמתאים למה שמופיע בדוח, בלי להרחיב מעבר לניסוח הזה.",
              source: "composed",
            },
          ];
          if (act) answerBlocks.push({ type: "next_step", textHe: act.slice(0, 420), source: "composed" });
          else answerBlocks.push({ type: "meaning", textHe: interp.slice(0, 420), source: "composed" });
        }
      } else {
        answerBlocks = [
          {
            type: "observation",
            textHe: "מובן — נשארים עם אותו ניסוח מהדוח ומתקדמים בצעד קטן הבא כשמתאים.",
            source: "composed",
          },
          { type: "meaning", textHe: interp ? interp.slice(0, 420) : obs.slice(0, 420), source: "composed" },
        ];
      }
      break;

    case "rejection_not_now":
      answerBlocks = [
        {
          type: "observation",
          textHe: "בסדר — לא חייבים לקדם עכשיו. נשארים עם מה שהדוח מציג, בלי לחץ להחלטה מיידית.",
          source: "composed",
        },
        { type: "meaning", textHe: interp ? interp.slice(0, 420) : obs.slice(0, 420), source: "composed" },
      ];
      break;

    case "concern_reaction":
      plannerIntent = "is_intervention_needed";
      answerBlocks = [
        {
          type: "observation",
          textHe:
            dl.cannotConcludeYet || dl.confidenceBand === "low"
              ? "זה לא בהכרח «לא טוב» — זה בעיקר סימן שהדוח עדיין לא סוגר מספיק כדי לתייג מצב בצורה חדה."
              : "לפי מה שמופיע בדוח, אין כאן אות ל«לא טוב» גורף — עדיין מדובר בתמונה בתוך התקופה.",
          source: "composed",
        },
        { type: "meaning", textHe: interp ? interp.slice(0, 420) : obs.slice(0, 420), source: "composed" },
      ];
      break;

    case "confusion_simpler":
      plannerIntent = "clarify_term";
      answerBlocks = [
        {
          type: "observation",
          textHe: obs ? `במילים פשוטות: ${obs.slice(0, 420)}` : "אין כאן פסקה ארוכה להרחבה — אפשר לנסח במילה אחרת מה בדיוק לא ברור.",
          source: "composed",
        },
      ];
      if (interp) answerBlocks.push({ type: "meaning", textHe: interp.slice(0, 380), source: "composed" });
      break;

    case "clarify_previous": {
      plannerIntent = "clarify_term";
      const digest = String(conv.lastAssistantAnswerDigestHe || "").trim();
      const scopeBit = scopeLabel ? `בהקשר של «${scopeLabel}»` : "באותו הקשר";
      const tail = digest ? ` סיכום קצר של מה שהוצג: ${digest.slice(0, 220)}${digest.length > 220 ? "…" : ""}` : "";
      answerBlocks = [
        {
          type: "observation",
          textHe: `נשארים על אותו ניסוח מהדוח ${scopeBit}, בלי להוסיף עובדה חדשה מעבר למה שכבר מעוגן.${tail}`,
          source: "composed",
        },
      ];
      if (interp) answerBlocks.push({ type: "meaning", textHe: interp.slice(0, 380), source: "composed" });
      break;
    }

    case "brief_continue":
      answerBlocks = [
        {
          type: "observation",
          textHe: obs
            ? `ממשיכים מאותה נקודה של הדוח — בלי לפתוח תמונה חדשה: ${obs.slice(0, 360)}`
            : "ממשיכים מאותה נקודה של הדוח — בלי לפתוח תמונה חדשה מעבר למה שכבר הוצג.",
          source: "composed",
        },
      ];
      if (interp) answerBlocks.push({ type: "meaning", textHe: interp.slice(0, 400), source: "composed" });
      break;

    default:
      return null;
  }

  answerBlocks = answerBlocks.filter((b) => String(b.textHe || "").trim().length > 1);
  if (answerBlocks.length < 2) {
    const fill = interp || obs;
    if (fill) answerBlocks.push({ type: "meaning", textHe: fill.slice(0, 400), source: "composed" });
  }
  if (answerBlocks.length < 2) return null;

  const scopeMeta = {
    scopeConfidence: 0.88,
    scopeReason: "reply_class_continuity",
    intentConfidence: 0.75,
    intentReason: `reply_class:${replyClass}`,
  };

  return { truthPacket, plannerIntent, answerBlocks, scopeMeta, replyClass };
}

export default { tryBuildParentShortFollowupDraft };
