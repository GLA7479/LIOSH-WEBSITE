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
import { foldUtteranceForHeMatch, normalizeFreeformParentUtteranceHe } from "./utterance-normalize-he.js";
import { interpretFreeformStageA } from "./stage-a-freeform-interpretation.js";

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
  const u = foldUtteranceForHeMatch(utterance);
  if (u.length < 2) return { best: null, ambiguous: false, candidates: [] };
  const rows = listTopicDisplayIndex(payload);
  /** @type {Array<{ subjectId: string; topicRowKey: string; displayName: string; score: number }>} */
  const hits = [];
  for (const row of rows) {
    const d = foldUtteranceForHeMatch(row.displayName);
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
  const u = foldUtteranceForHeMatch(utterance);
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
    const lf = foldUtteranceForHeMatch(label);
    if (lf.length >= 4) {
      if (u.includes(lf)) return id;
    } else if (lf.length >= 2) {
      if (u === lf || u.startsWith(`${lf} `) || u.endsWith(` ${lf}`) || u.includes(` ${lf} `)) {
        return id;
      }
    }
  }
  return null;
}

/**
 * @param {"executive"|"subject"|"topic"} entityScopeType
 * @param {ReturnType<typeof interpretFreeformStageA>} stageA
 */
function finalizeScopeClass(entityScopeType, stageA) {
  let sc = String(stageA.scopeClass || entityScopeType);
  if (entityScopeType === "topic") {
    if (sc === "executive" || sc === "subject") sc = "topic";
  } else if (entityScopeType === "subject") {
    if (sc === "executive" || sc === "topic") sc = "subject";
  } else if (entityScopeType === "executive") {
    if (sc === "topic" || sc === "subject") sc = "executive";
  }
  return sc;
}

/**
 * @param {object} scope
 * @param {string} entityScopeType
 * @param {ReturnType<typeof interpretFreeformStageA>} stageA
 */
function scopeWithClass(scope, entityScopeType, stageA) {
  return {
    ...scope,
    scopeClass: finalizeScopeClass(entityScopeType, stageA),
  };
}

/**
 * @param {object} input
 * @param {unknown} input.payload
 * @param {string} input.utterance
 * @param {null|{ scopeType?: string; scopeId?: string; subjectId?: string }} input.selectedContextRef
 * @param {ReturnType<typeof interpretFreeformStageA>} [input.stageA]
 * @returns {{
 *   resolutionStatus: "resolved"|"clarification_required";
 *   clarificationQuestionHe?: string;
 *   scope?: { scopeType: "topic"|"subject"|"executive"; scopeId: string; scopeLabel: string; scopeClass: string };
 *   stageA?: ReturnType<typeof interpretFreeformStageA>;
 * }}
 */
export function resolveScope(input) {
  const payload = input?.payload;
  const rawUtterance = String(input?.utterance || "");
  const normalizedUtterance = normalizeFreeformParentUtteranceHe(rawUtterance);
  const stageA =
    input?.stageA ||
    interpretFreeformStageA(rawUtterance, payload && typeof payload === "object" ? payload : null);
  const utterance = foldUtteranceForHeMatch(normalizedUtterance);
  const selected = input?.selectedContextRef && typeof input.selectedContextRef === "object" ? input.selectedContextRef : null;

  if (!payload || typeof payload !== "object") {
    return {
      resolutionStatus: "clarification_required",
      clarificationQuestionHe:
        "לא נטען דוח מקיף — לא ניתן לענות מתוך נתוני התקופה. רעננו את הדף או בחרו תקופה אחרת.",
      scopeConfidence: 0,
      scopeReason: "missing_payload",
      stageA,
    };
  }

  const aggregateClass = detectAggregateQuestionClass(normalizedUtterance);
  if (aggregateClass !== "none") {
    return {
      resolutionStatus: "resolved",
      scope: scopeWithClass(
        {
          scopeType: "executive",
          scopeId: "executive",
          scopeLabel: "הדוח בתקופה הנבחרה",
        },
        "executive",
        stageA
      ),
      scopeConfidence: 0.98,
      scopeReason: `aggregate_class:${aggregateClass}`,
      stageA,
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
        stageA,
      };
    }
    const label =
      String(hit?.tr?.displayName || "").trim() ||
      (subj ? `${subjectLabelHe(subj)} · נושא` : "נושא נבחר");
    return {
      resolutionStatus: "resolved",
      scope: scopeWithClass(
        {
          scopeType: "topic",
          scopeId: sid,
          scopeLabel: label,
        },
        "topic",
        stageA
      ),
      scopeConfidence: hit ? 0.99 : 0.35,
      scopeReason: hit ? "selected_context_topic" : "selected_context_topic_missing_anchor",
      stageA,
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
        stageA,
      };
    }
    return {
      resolutionStatus: "resolved",
      scope: scopeWithClass(
        {
          scopeType: "subject",
          scopeId: subjectId,
          scopeLabel: subjectLabelHe(subjectId),
        },
        "subject",
        stageA
      ),
      scopeConfidence: 0.9,
      scopeReason: "selected_context_subject",
      stageA,
    };
  }

  const topicMatch = matchTopicFromUtterance(utterance, payload);
  if (topicMatch.ambiguous) {
    return {
      resolutionStatus: "clarification_required",
      clarificationQuestionHe: "נראית התאמה ליותר מנושא אחד בדוח. נסחו שוב באופן ממוקד.",
      scopeConfidence: 0.25,
      scopeReason: "utterance_topic_ambiguous",
      stageA,
    };
  }
  if (topicMatch.best) {
    return {
      resolutionStatus: "resolved",
      scope: scopeWithClass(
        {
          scopeType: "topic",
          scopeId: topicMatch.best.topicRowKey,
          scopeLabel: topicMatch.best.displayName,
        },
        "topic",
        stageA
      ),
      scopeConfidence: 0.84,
      scopeReason: "utterance_topic_match",
      stageA,
    };
  }

  const subjectId = matchSubjectFromUtterance(utterance, payload);
  if (subjectId) {
    return {
      resolutionStatus: "resolved",
      scope: scopeWithClass(
        {
          scopeType: "subject",
          scopeId: subjectId,
          scopeLabel: subjectLabelHe(subjectId),
        },
        "subject",
        stageA
      ),
      scopeConfidence: 0.73,
      scopeReason: "utterance_subject_match",
      stageA,
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
      stageA,
    };
  }

  // Preserve deterministic continuity for empty input when payload is anchored.
  if (utterance.length < 2) {
    return {
      resolutionStatus: "resolved",
      scope: scopeWithClass(
        {
          scopeType: "executive",
          scopeId: "executive",
          scopeLabel: "הדוח בתקופה הנבחרה",
        },
        "executive",
        stageA
      ),
      scopeConfidence: 0.56,
      scopeReason: "executive_fallback_empty_utterance",
      stageA,
    };
  }

  return {
    resolutionStatus: "clarification_required",
    clarificationQuestionHe: "לא הצלחנו לזהות את מוקד השאלה. נסחו שוב בקצרה.",
    scopeConfidence: 0.18,
    scopeReason: "no_clear_scope_match",
    stageA,
  };
}

export default { resolveScope };
