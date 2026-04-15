/**
 * In-session continuity (no cross-session persistence).
 * Phase A: priorScopes, clickedFollowups, answeredConstraints, phrase ledger, TTL.
 * Phase B: recent suggested follow-up texts + answer digests for ranking / de-dup.
 */

const store = new Map();

/** Blueprint: session reset after 60 minutes idle. */
export const PARENT_COPILOT_SESSION_IDLE_MS = 60 * 60 * 1000;

/** @type {number} */
const SESSION_TTL_MS = PARENT_COPILOT_SESSION_IDLE_MS;
const MAX_PRIOR_SCOPES = 16;
const MAX_CLICKED_FOLLOWUPS = 24;
const MAX_ANSWERED_CONSTRAINTS = 32;
const MAX_CLOSINGS = 6;
const MAX_LEDGER_KEYS = 48;
const MAX_RECENT_SUGGESTED_FOLLOWUP_TEXTS = 4;
const MAX_ANSWER_FINGERPRINTS = 5;

function key(sessionId) {
  return String(sessionId || "default");
}

function emptyState() {
  const now = Date.now();
  return {
    priorIntents: [],
    priorFollowupFamilies: [],
    priorScopes: [],
    clickedFollowups: [],
    answeredConstraints: [],
    repeatedPhraseHits: 0,
    lastClosings: [],
    phraseLedger: Object.create(null),
    recentSuggestedFollowupTexts: [],
    answerSummaryFingerprints: [],
    lastActivityMs: now,
    createdAtMs: now,
  };
}

/**
 * @param {string} text
 */
function tokenizeForLedger(text) {
  return String(text || "")
    .split(/\s+/)
    .map((t) => t.replace(/^[^\u0590-\u05FF]+|[^\u0590-\u05FF]+$/g, ""))
    .filter((t) => t.length >= 5);
}

/**
 * Phase B: compact fingerprint for overlap with follow-up strings.
 * @param {string} text
 */
export function fingerprintAnswerSummaryHe(text) {
  const parts = tokenizeForLedger(text);
  return parts.slice(0, 10).join(" ");
}

/**
 * @param {object} s
 */
function recomputeRepeatedPhraseHits(s) {
  let phrasePressure = 0;
  const ledger = s.phraseLedger && typeof s.phraseLedger === "object" ? s.phraseLedger : {};
  for (const n of Object.values(ledger)) {
    const c = Number(n) || 0;
    if (c >= 2) phrasePressure += c - 1;
  }
  const fam = Array.isArray(s.priorFollowupFamilies) ? s.priorFollowupFamilies : [];
  const lastTwo = fam.slice(-2);
  const followDup = lastTwo.length === 2 && lastTwo[0] === lastTwo[1] ? 1 : 0;
  s.repeatedPhraseHits = Math.min(50, phrasePressure + followDup);
}

/**
 * @param {string} sessionId
 */
export function getConversationState(sessionId) {
  const k = key(sessionId);
  if (!store.has(k)) {
    store.set(k, emptyState());
  }
  const s = store.get(k);
  const now = Date.now();
  if (now - (s.lastActivityMs || 0) > SESSION_TTL_MS) {
    const fresh = emptyState();
    store.set(k, fresh);
    return fresh;
  }
  s.lastActivityMs = now;
  return s;
}

/**
 * @param {string} sessionId
 * @param {{
 *   addedIntent?: string;
 *   addedFollowUpFamily?: string;
 *   addedScopeKey?: string;
 *   clickedFollowupFamily?: string;
 *   answeredConstraintTag?: string;
 *   closingSnippet?: string;
 *   suggestedFollowupTextHe?: string;
 *   assistantAnswerSummary?: string;
 * }} delta
 */
export function applyConversationStateDelta(sessionId, delta) {
  const s = getConversationState(sessionId);
  if (delta.addedIntent) s.priorIntents.push(delta.addedIntent);
  if (delta.addedFollowUpFamily) {
    s.priorFollowupFamilies.push(delta.addedFollowUpFamily);
  }
  if (delta.clickedFollowupFamily) {
    s.clickedFollowups.push(String(delta.clickedFollowupFamily).trim());
    while (s.clickedFollowups.length > MAX_CLICKED_FOLLOWUPS) s.clickedFollowups.shift();
  }
  if (delta.addedScopeKey) {
    const sk = String(delta.addedScopeKey).trim();
    if (sk) {
      s.priorScopes.push(sk);
      while (s.priorScopes.length > MAX_PRIOR_SCOPES) s.priorScopes.shift();
    }
  }
  if (delta.answeredConstraintTag != null && delta.answeredConstraintTag !== "") {
    const raw = String(delta.answeredConstraintTag).trim();
    const parts = raw
      .split(/[,;]+/)
      .map((x) => x.trim())
      .filter(Boolean);
    for (const t of parts.length ? parts : [raw]) {
      s.answeredConstraints.push(t);
      while (s.answeredConstraints.length > MAX_ANSWERED_CONSTRAINTS) s.answeredConstraints.shift();
    }
  }
  const clos = String(delta.closingSnippet || "").trim();
  if (clos) {
    s.lastClosings.push(clos);
    if (s.lastClosings.length > MAX_CLOSINGS) s.lastClosings.shift();
    if (!s.phraseLedger || typeof s.phraseLedger !== "object") s.phraseLedger = Object.create(null);
    for (const tok of tokenizeForLedger(clos)) {
      s.phraseLedger[tok] = (s.phraseLedger[tok] || 0) + 1;
    }
    const keys = Object.keys(s.phraseLedger);
    if (keys.length > MAX_LEDGER_KEYS) {
      keys.sort((a, b) => (s.phraseLedger[a] || 0) - (s.phraseLedger[b] || 0));
      for (let i = 0; i < keys.length - MAX_LEDGER_KEYS; i++) {
        delete s.phraseLedger[keys[i]];
      }
    }
  }
  const sug = String(delta.suggestedFollowupTextHe || "").trim();
  if (sug) {
    if (!Array.isArray(s.recentSuggestedFollowupTexts)) s.recentSuggestedFollowupTexts = [];
    s.recentSuggestedFollowupTexts.push(sug);
    while (s.recentSuggestedFollowupTexts.length > MAX_RECENT_SUGGESTED_FOLLOWUP_TEXTS) {
      s.recentSuggestedFollowupTexts.shift();
    }
  }
  const ans = String(delta.assistantAnswerSummary || "").trim();
  if (ans) {
    const fp = fingerprintAnswerSummaryHe(ans);
    if (fp) {
      if (!Array.isArray(s.answerSummaryFingerprints)) s.answerSummaryFingerprints = [];
      s.answerSummaryFingerprints.push(fp);
      while (s.answerSummaryFingerprints.length > MAX_ANSWER_FINGERPRINTS) s.answerSummaryFingerprints.shift();
    }
  }

  recomputeRepeatedPhraseHits(s);
}

/**
 * Test / dev only — clears one session bucket.
 * @param {string} sessionId
 */
export function resetParentCopilotSessionForTests(sessionId) {
  store.delete(key(sessionId));
}

export default {
  PARENT_COPILOT_SESSION_IDLE_MS,
  getConversationState,
  applyConversationStateDelta,
  resetParentCopilotSessionForTests,
};
