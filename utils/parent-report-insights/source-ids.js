/**
 * Stable internal source references for grounding AI strengths/focusAreas to Insight Packet items.
 *
 * Format:
 *  - Subject scope: `subject:<subjectKey>`        e.g. `subject:math`
 *  - Topic   scope: `topic:<subjectKey>:<topicKey>` e.g. `topic:math:multiplication_table`
 *
 * `<subjectKey>` and `<topicKey>` are the raw English keys from the aggregator. They appear ONLY
 * inside `sourceId` strings and NEVER in user-visible Hebrew text (the renderer reads only
 * `displayNameHe`). The validator uses these strings to enforce that AI strengths/focus items
 * are grounded in the deterministic Insight Packet.
 */

const SAFE_KEY_PART = /^[a-z][a-z0-9_-]*$/i;

function normalizeKeyPart(value) {
  if (value == null) return "";
  const trimmed = String(value).trim().toLowerCase();
  return SAFE_KEY_PART.test(trimmed) ? trimmed : "";
}

export function buildSubjectSourceId(subjectKey) {
  const s = normalizeKeyPart(subjectKey);
  return s ? `subject:${s}` : "";
}

export function buildTopicSourceId(subjectKey, topicKey) {
  const s = normalizeKeyPart(subjectKey);
  const t = normalizeKeyPart(topicKey);
  if (!s || !t) return "";
  return `topic:${s}:${t}`;
}

export const SOURCE_ID_PATTERN =
  /^(subject:[a-z][a-z0-9_-]*|topic:[a-z][a-z0-9_-]*:[a-z][a-z0-9_-]*)$/;

export function isValidSourceId(id) {
  return typeof id === "string" && SOURCE_ID_PATTERN.test(id);
}

export function parseSourceId(id) {
  if (!isValidSourceId(id)) return null;
  if (id.startsWith("subject:")) {
    return { scope: "subject", subjectKey: id.slice("subject:".length), topicKey: null };
  }
  const rest = id.slice("topic:".length);
  const colonIdx = rest.indexOf(":");
  if (colonIdx <= 0) return null;
  return { scope: "topic", subjectKey: rest.slice(0, colonIdx), topicKey: rest.slice(colonIdx + 1) };
}
