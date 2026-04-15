/**
 * Resolves conversational scope from payload + optional UI context + utterance (deterministic).
 * Does not build TruthPacketV1 (truth-packet-v1.js owns that).
 */

import {
  findFirstAnchoredTopicRowForSubject,
  findFirstAnchoredTopicRow,
  findTopicRowByKey,
  subjectLabelHe,
  SUBJECT_ORDER,
} from "./contract-reader.js";
import { detectAggregateQuestionClass } from "./semantic-question-class.js";

/**
 * @param {string} s
 */
function norm(s) {
  return String(s || "")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Collect topic rows with parent-visible display names (deterministic order).
 * @param {unknown} payload
 * @returns {Array<{ subjectId: string; topicRowKey: string; displayName: string }>}
 */
function listTopicDisplayIndex(payload) {
  /** @type {Array<{ subjectId: string; topicRowKey: string; displayName: string }>} */
  const out = [];
  const profiles = Array.isArray(payload?.subjectProfiles) ? payload.subjectProfiles : [];
  const bySubject = Object.fromEntries(profiles.map((sp) => [String(sp?.subject || ""), sp]));
  for (const sid of SUBJECT_ORDER) {
    const sp = bySubject[sid];
    const list = Array.isArray(sp?.topicRecommendations) ? sp.topicRecommendations : [];
    for (const tr of list) {
      const displayName = norm(tr?.displayName);
      const topicRowKey = String(tr?.topicRowKey || tr?.topicKey || "").trim();
      const nar = tr?.contractsV1?.narrative;
      const anchored = !!(nar && typeof nar === "object" && String(nar?.textSlots?.observation || "").trim());
      if (!topicRowKey || displayName.length < 2 || !anchored) continue;
      out.push({ subjectId: sid, topicRowKey, displayName });
    }
  }
  return out;
}

/**
 * @param {string} utterance
 * @param {unknown} payload
 * @returns {{
 *   best: { subjectId: string; topicRowKey: string; displayName: string; score: number } | null;
 *   ambiguous: boolean;
 *   candidates: Array<{ subjectId: string; topicRowKey: string; displayName: string; score: number }>;
 * }}
 */
function matchTopicFromUtterance(utterance, payload) {
  const u = norm(utterance);
  if (u.length < 2) return { best: null, ambiguous: false, candidates: [] };
  const rows = listTopicDisplayIndex(payload);
  /** @type {Array<{ subjectId: string; topicRowKey: string; displayName: string; score: number }>} */
  const hits = [];
  for (const row of rows) {
    const d = row.displayName;
    if (d.length < 2) continue;
    if (!u.includes(d)) continue;
    hits.push({ ...row, score: d.length });
  }
  if (!hits.length) return { best: null, ambiguous: false, candidates: [] };
  hits.sort((a, b) => b.score - a.score || SUBJECT_ORDER.indexOf(a.subjectId) - SUBJECT_ORDER.indexOf(b.subjectId));
  const best = hits[0] || null;
  const second = hits[1] || null;
  const ambiguous = !!(
    best &&
    second &&
    (best.score - second.score <= 2 || best.displayName.startsWith(second.displayName) || second.displayName.startsWith(best.displayName))
  );
  return { best, ambiguous, candidates: hits.slice(0, 3) };
}

/**
 * Match subject by approved Hebrew labels (longer labels first to reduce ambiguity).
 * @param {string} utterance
 * @param {unknown} payload
 * @returns {string | null} subjectId
 */
function matchSubjectFromUtterance(utterance, payload) {
  const u = norm(utterance);
  if (u.length < 2) return null;
  const profiles = Array.isArray(payload?.subjectProfiles) ? payload.subjectProfiles : [];
  const present = new Set(profiles.map((p) => String(p?.subject || "")).filter(Boolean));

  /** @type {Array<{ id: string; label: string }>} */
  const pairs = [];
  for (const sid of SUBJECT_ORDER) {
    if (!present.has(sid)) continue;
    const label = norm(subjectLabelHe(sid));
    if (label.length < 2) continue;
    pairs.push({ id: sid, label });
  }
  pairs.sort((a, b) => b.label.length - a.label.length);
  for (const { id, label } of pairs) {
    if (label.length >= 4) {
      if (u.includes(label)) return id;
    } else if (label.length >= 2) {
      if (u === label || u.startsWith(`${label} `) || u.endsWith(` ${label}`) || u.includes(` ${label} `)) {
        return id;
      }
    }
  }
  return null;
}

/**
 * @param {object} input
 * @param {unknown} input.payload
 * @param {string} input.utterance
 * @param {null|{ scopeType?: string; scopeId?: string; subjectId?: string }} input.selectedContextRef
 * @returns {{
 *   resolutionStatus: "resolved"|"clarification_required";
 *   clarificationQuestionHe?: string;
 *   scope?: { scopeType: "topic"|"subject"|"executive"; scopeId: string; scopeLabel: string };
 * }}
 */
export function resolveScope(input) {
  const payload = input?.payload;
  const utterance = norm(input?.utterance || "");
  const selected = input?.selectedContextRef && typeof input.selectedContextRef === "object" ? input.selectedContextRef : null;

  if (!payload || typeof payload !== "object") {
    return {
      resolutionStatus: "clarification_required",
      clarificationQuestionHe:
        "לא נטען דוח מקיף — לא ניתן לענות מתוך נתוני התקופה. רעננו את הדף או בחרו תקופה אחרת.",
      scopeConfidence: 0,
      scopeReason: "missing_payload",
    };
  }

  const aggregateClass = detectAggregateQuestionClass(utterance);
  if (aggregateClass !== "none") {
    return {
      resolutionStatus: "resolved",
      scope: {
        scopeType: "executive",
        scopeId: "executive",
        scopeLabel: "הדוח בתקופה הנבחרה",
      },
      scopeConfidence: 0.98,
      scopeReason: `aggregate_class:${aggregateClass}`,
    };
  }

  const st = String(selected?.scopeType || "").trim();
  const sid = String(selected?.scopeId || "").trim();
  const subj = String(selected?.subjectId || "").trim();

  if (st === "topic" && sid) {
    const hit = findTopicRowByKey(payload, sid, subj);
    if (!hit) {
      return {
        resolutionStatus: "clarification_required",
        clarificationQuestionHe: "הנושא שנבחר לא כולל כרגע ניסוח מעוגן בדוח. בחרו נושא אחר עם נתוני תרגול.",
        scopeConfidence: 0.2,
        scopeReason: "selected_context_topic_missing_anchor",
      };
    }
    const label =
      String(hit?.tr?.displayName || "").trim() ||
      (subj ? `${subjectLabelHe(subj)} · נושא` : "נושא נבחר");
    return {
      resolutionStatus: "resolved",
      scope: {
        scopeType: "topic",
        scopeId: sid,
        scopeLabel: label,
      },
      scopeConfidence: hit ? 0.99 : 0.35,
      scopeReason: hit ? "selected_context_topic" : "selected_context_topic_missing_anchor",
    };
  }
  if (st === "subject" && (sid || subj)) {
    const subjectId = sid || subj;
    const subjectHasAnchor = !!findFirstAnchoredTopicRowForSubject(payload, subjectId);
    if (!subjectHasAnchor) {
      return {
        resolutionStatus: "clarification_required",
        clarificationQuestionHe: "במקצוע שנבחר עדיין אין נושא מעוגן עם מספיק נתונים. בחרו מקצוע או נושא אחר.",
        scopeConfidence: 0.24,
        scopeReason: "selected_context_subject_missing_anchor",
      };
    }
    return {
      resolutionStatus: "resolved",
      scope: {
        scopeType: "subject",
        scopeId: subjectId,
        scopeLabel: subjectLabelHe(subjectId),
      },
      scopeConfidence: 0.9,
      scopeReason: "selected_context_subject",
    };
  }

  const topicMatch = matchTopicFromUtterance(utterance, payload);
  if (topicMatch.ambiguous) {
    return {
      resolutionStatus: "clarification_required",
      clarificationQuestionHe: `נראה שהשאלה מתייחסת לכמה נושאים (${topicMatch.candidates
        .map((x) => x.displayName)
        .join(" / ")}). כתבו את שם הנושא המדויק כדי שאענה רק עליו.`,
      scopeConfidence: 0.25,
      scopeReason: "utterance_topic_ambiguous",
    };
  }
  if (topicMatch.best) {
    return {
      resolutionStatus: "resolved",
      scope: {
        scopeType: "topic",
        scopeId: topicMatch.best.topicRowKey,
        scopeLabel: topicMatch.best.displayName,
      },
      scopeConfidence: 0.84,
      scopeReason: "utterance_topic_match",
    };
  }

  const subjectId = matchSubjectFromUtterance(utterance, payload);
  if (subjectId) {
    return {
      resolutionStatus: "resolved",
      scope: {
        scopeType: "subject",
        scopeId: subjectId,
        scopeLabel: subjectLabelHe(subjectId),
      },
      scopeConfidence: 0.73,
      scopeReason: "utterance_subject_match",
    };
  }

  const anchor = findFirstAnchoredTopicRow(payload);
  if (!anchor) {
    return {
      resolutionStatus: "clarification_required",
      clarificationQuestionHe:
        "אין כרגע נתוני נושא מספיקים בדוח כדי לבסס תשובה. נסו שוב אחרי שמופיעים נושאים עם תרגול בטווח התאריכים.",
      scopeConfidence: 0,
      scopeReason: "no_anchor_available",
    };
  }

  return {
    resolutionStatus: "resolved",
    scope: {
      scopeType: "executive",
      scopeId: "executive",
      scopeLabel: "הדוח בתקופה הנבחרה",
    },
    scopeConfidence: 0.56,
    scopeReason: "executive_fallback",
  };
}

export default { resolveScope };
