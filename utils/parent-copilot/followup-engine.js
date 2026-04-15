/**
 * Phase B: scored follow-up ranking + Phase A memory consumption (dedup, scope, clicks).
 * Deterministic only — parent-only, contract-bound families from TruthPacket.
 */

const TEXT = {
  action_today: "רוצים לפרק לצעד קטן היום בבית לפי אותו נושא?",
  action_week: "רוצים לבנות יחד תוכנית קצרה לשבוע הקרוב סביב הנושא הזה?",
  avoid_now: "רוצים לזהות יחד מה כדאי להימנע ממנו בשבוע הקרוב?",
  advance_or_hold: "רוצים לבדוק יחד מתי כדאי לקדם ומתי לעצור באותו נושא?",
  explain_to_child: "רוצים ניסוח קצר להסבר לילד בלי לחץ?",
  ask_teacher: "רוצים ניסוח לשאלה ממוקדת למורה לפי מה שמופיע בדוח?",
  uncertainty_boundary: "רוצים לפרק מה עדיין לא ברור לפי הנתונים בדוח?",
};

/** @type {Record<string, Partial<Record<string, number>>>} */
const INTENT_FOLLOWUP_AFFINITY = {
  understand_observation: { action_today: 1, uncertainty_boundary: 2, advance_or_hold: 1 },
  understand_meaning: { uncertainty_boundary: 3, advance_or_hold: 2, action_week: 1, explain_to_child: 1 },
  action_today: { avoid_now: 3, explain_to_child: 2, ask_teacher: 1 },
  action_tomorrow: { avoid_now: 2, action_week: 2, explain_to_child: 1 },
  action_week: { avoid_now: 2, advance_or_hold: 2, explain_to_child: 1 },
  avoid_now: { action_week: 3, advance_or_hold: 2 },
  advance_or_hold: { uncertainty_boundary: 2, action_week: 2, explain_to_child: 1 },
  explain_to_child: { ask_teacher: 3, action_week: 1 },
  ask_teacher: { action_week: 2, advance_or_hold: 1 },
  uncertainty_boundary: { action_today: 1, explain_to_child: 2, ask_teacher: 1 },
};

/**
 * @param {string} text
 */
function hebrewTokens(text) {
  return String(text || "")
    .split(/\s+/)
    .map((t) => t.replace(/^[^\u0590-\u05FF]+|[^\u0590-\u05FF]+$/g, ""))
    .filter((t) => t.length >= 4);
}

/**
 * @param {string} a
 * @param {string} b
 */
function tokenOverlapCount(a, b) {
  const A = new Set(hebrewTokens(a));
  const B = new Set(hebrewTokens(b));
  let n = 0;
  for (const t of A) if (B.has(t)) n += 1;
  return n;
}

/**
 * @param {string[]} ranked
 * @param {string} family
 */
function deprioritizeFamily(ranked, family) {
  const out = ranked.filter((f) => f !== family);
  if (ranked.includes(family)) out.push(family);
  return out;
}

/**
 * @param {string[]} priorScopes
 * @param {string} scopeKey
 */
function sameScopeStreak(priorScopes, scopeKey) {
  if (!scopeKey) return 0;
  const ps = Array.isArray(priorScopes) ? priorScopes : [];
  let n = 0;
  for (let i = ps.length - 1; i >= 0; i--) {
    if (ps[i] === scopeKey) n += 1;
    else break;
  }
  return n;
}

/**
 * Phase B: score families for ordering (higher = better).
 * @param {string} family
 * @param {object} ctx
 */
function scoreFamilyPhaseB(family, ctx) {
  const {
    intent,
    prior,
    conv,
    recentTags,
    streak,
    scopeType,
  } = ctx;
  let s = INTENT_FOLLOWUP_AFFINITY[intent]?.[family] ?? 0;

  const recentSuggest = Array.isArray(conv.recentSuggestedFollowupTexts) ? conv.recentSuggestedFollowupTexts : [];
  const answerFp = Array.isArray(conv.answerSummaryFingerprints) ? conv.answerSummaryFingerprints : [];
  const t = TEXT[family] || "";

  for (const prev of recentSuggest) {
    const o = tokenOverlapCount(t, prev);
    if (o >= 2) s -= 8;
    else if (o >= 1) s -= 4;
  }
  for (const fp of answerFp.slice(-2)) {
    const o = tokenOverlapCount(t, fp);
    s -= o * 5;
  }

  if (prior.slice(-2).includes(family)) s -= 6;
  else if (prior.slice(-4).includes(family)) s -= 3;

  if (streak >= 2 && scopeType === "topic" && family === "action_today") s -= 4;
  if (streak >= 2 && scopeType === "executive" && family === "action_today") s -= 5;
  if (streak >= 3 && scopeType === "executive" && family === "action_today") s -= 10;

  if (intent !== "uncertainty_boundary") {
    if (recentTags.includes("surface:uncertainty") && family === "uncertainty_boundary") s -= 7;
    if (recentTags.includes("turn:validator_fail") && family === "uncertainty_boundary") s -= 6;
    if (recentTags.includes("turn:validator_fail") && family === "explain_to_child") s -= 3;
  }

  return s;
}

/**
 * @param {string[]} ranked
 * @param {object} ctx
 */
function rankFamiliesPhaseB(ranked, ctx) {
  const scored = ranked.map((f, i) => ({ f, score: scoreFamilyPhaseB(f, ctx), orig: i }));
  scored.sort((a, b) => b.score - a.score || a.orig - b.orig);
  return scored.map((x) => x.f);
}

/**
 * @param {string[]} ranked
 * @param {Set<string>} blocked
 * @param {string[]} prior
 * @param {number} hits
 */
function firstOpenFamily(ranked, blocked, prior, hits) {
  for (const fam of ranked) {
    if (blocked.has(fam)) continue;
    if (prior.slice(-2).includes(fam) && hits >= 1) continue;
    return fam;
  }
  return null;
}

/**
 * @param {object} input
 * @param {string} input.intent
 * @param {string} [input.scopeType]
 * @param {string} [input.scopeKey]
 * @param {string|null} [input.clickedFollowupFamilyThisTurn]
 * @param {object} input.truthPacket
 * @param {object} input.conversationState
 */
export function selectFollowUp(input) {
  const tp = input?.truthPacket || {};
  const conv = input?.conversationState || {};
  const intent = String(input?.intent || "");
  const scopeType = String(input?.scopeType || "");
  const scopeKey = String(input?.scopeKey || "").trim();
  const clickedThis = String(input?.clickedFollowupFamilyThisTurn || "").trim() || null;

  const families = Array.isArray(tp?.allowedFollowupFamilies) ? tp.allowedFollowupFamilies : [];
  const prior = Array.isArray(conv.priorFollowupFamilies) ? conv.priorFollowupFamilies : [];
  const hits = Number(conv.repeatedPhraseHits) || 0;
  const clicked = Array.isArray(conv.clickedFollowups) ? conv.clickedFollowups : [];
  const answered = Array.isArray(conv.answeredConstraints) ? conv.answeredConstraints : [];
  const priorScopes = Array.isArray(conv.priorScopes) ? conv.priorScopes : [];

  /** @type {string[]} */
  let ranked = [];
  for (const f of families) {
    if (!ranked.includes(f)) ranked.push(f);
  }

  const streak = sameScopeStreak(priorScopes, scopeKey);
  if (streak >= 2) {
    if (scopeType === "topic") ranked = deprioritizeFamily(ranked, "action_today");
    if (scopeType === "executive") ranked = deprioritizeFamily(ranked, "action_today");
  }

  const recentTags = answered
    .slice(-6)
    .join("|")
    .toLowerCase();
  if (intent !== "uncertainty_boundary") {
    if (recentTags.includes("surface:uncertainty")) ranked = deprioritizeFamily(ranked, "uncertainty_boundary");
    if (recentTags.includes("turn:validator_fail")) {
      ranked = deprioritizeFamily(ranked, "uncertainty_boundary");
      ranked = deprioritizeFamily(ranked, "explain_to_child");
    }
  }

  const ctx = { intent, prior, conv, recentTags, streak, scopeType };
  ranked = rankFamiliesPhaseB(ranked, ctx);

  function buildBlocked(softClicked) {
    const blocked = new Set();
    if (tp?.cannotConcludeYet) {
      blocked.add("action_today");
      blocked.add("action_week");
    }
    if (hits >= 2) {
      const last = prior[prior.length - 1];
      if (last) blocked.add(last);
    }
    if (intent.startsWith("action")) {
      blocked.add("action_today");
    }
    const lastClicked = clicked.length ? String(clicked[clicked.length - 1] || "").trim() : null;
    if (lastClicked && !softClicked.has("relax_last_clicked")) blocked.add(lastClicked);
    if (clickedThis && !softClicked.has("relax_this_click")) blocked.add(clickedThis);
    if (intent !== "uncertainty_boundary") {
      if (recentTags.includes("surface:uncertainty")) blocked.add("uncertainty_boundary");
      if (recentTags.includes("turn:validator_fail")) {
        blocked.add("uncertainty_boundary");
      }
    }
    if (streak >= 3 && scopeType === "executive") blocked.add("action_today");
    return blocked;
  }

  function reasonForChoice(family, hadRelax) {
    if (hadRelax) return "memory_fallback_relaxed";
    const base = scoreFamilyPhaseB(family, ctx);
    if (base >= 3) return "intent_affinity_rank";
    if (base <= -4) return "memory_dedup_diversify";
    return "advance_check_relevant";
  }

  const soft = new Set();
  let blocked = buildBlocked(soft);
  let chosen = firstOpenFamily(ranked, blocked, prior, hits);
  let relax = false;

  if (!chosen) {
    soft.add("relax_last_clicked");
    blocked = buildBlocked(soft);
    chosen = firstOpenFamily(ranked, blocked, prior, hits);
    relax = true;
  }
  if (!chosen) {
    soft.add("relax_this_click");
    blocked = buildBlocked(soft);
    chosen = firstOpenFamily(ranked, blocked, prior, hits);
    relax = true;
  }
  if (!chosen) {
    blocked = new Set();
    if (tp?.cannotConcludeYet) {
      blocked.add("action_today");
      blocked.add("action_week");
    }
    chosen = firstOpenFamily(ranked, blocked, prior, 0);
    relax = true;
  }

  if (!chosen) {
    return {
      selected: null,
      candidateFamiliesRanked: ranked,
      noneReasonCode: "no_useful_next_step",
    };
  }

  return {
    selected: {
      family: chosen,
      textHe: TEXT[chosen] || TEXT.uncertainty_boundary,
      reasonCode: reasonForChoice(chosen, relax),
    },
    candidateFamiliesRanked: ranked,
  };
}

export default { selectFollowUp };
