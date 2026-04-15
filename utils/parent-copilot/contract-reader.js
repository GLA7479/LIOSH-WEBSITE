/**
 * Helper-only: contract slices from detailed-report payload rows.
 * Not a TruthPacketV1 owner (see truth-packet-v1.js).
 */

export const SUBJECT_ORDER = [
  "math",
  "geometry",
  "english",
  "science",
  "hebrew",
  "moledet-geography",
];

function shallowCopy(x) {
  if (x == null) return x;
  if (typeof x !== "object") return x;
  return { ...x };
}

/**
 * @param {unknown} tr
 */
export function contractsFromTopicRow(tr) {
  const cv = tr?.contractsV1 && typeof tr.contractsV1 === "object" ? tr.contractsV1 : {};
  return {
    evidence: shallowCopy(cv.evidence ?? null),
    decision: shallowCopy(cv.decision ?? null),
    readiness: shallowCopy(cv.readiness ?? null),
    confidence: shallowCopy(cv.confidence ?? null),
    recommendation: shallowCopy(cv.recommendation ?? null),
    narrative: shallowCopy(cv.narrative ?? null),
  };
}

/**
 * @param {unknown} payload
 * @returns {{ subject: string, tr: object } | null}
 */
export function findFirstAnchoredTopicRow(payload) {
  const profiles = Array.isArray(payload?.subjectProfiles) ? payload.subjectProfiles : [];
  const bySubject = Object.fromEntries(profiles.map((sp) => [String(sp?.subject || ""), sp]));
  for (const sid of SUBJECT_ORDER) {
    const sp = bySubject[sid];
    const list = Array.isArray(sp?.topicRecommendations) ? sp.topicRecommendations : [];
    for (const tr of list) {
      const nar = tr?.contractsV1?.narrative;
      if (nar && typeof nar === "object" && String(nar?.textSlots?.observation || "").trim()) {
        return { subject: sid, tr };
      }
    }
  }
  return null;
}

/**
 * @param {unknown} payload
 * @param {string} subjectId
 * @returns {{ subject: string, tr: object } | null}
 */
export function findFirstAnchoredTopicRowForSubject(payload, subjectId) {
  const sid = String(subjectId || "").trim();
  const profiles = Array.isArray(payload?.subjectProfiles) ? payload.subjectProfiles : [];
  const sp = profiles.find((p) => String(p?.subject || "") === sid);
  const list = Array.isArray(sp?.topicRecommendations) ? sp.topicRecommendations : [];
  for (const tr of list) {
    const nar = tr?.contractsV1?.narrative;
    if (nar && typeof nar === "object" && String(nar?.textSlots?.observation || "").trim()) {
      return { subject: sid, tr };
    }
  }
  return null;
}

/**
 * @param {unknown} payload
 * @param {string} topicRowKey
 * @param {string} [subjectIdHint]
 * @returns {{ subject: string, tr: object } | null}
 */
export function findTopicRowByKey(payload, topicRowKey, subjectIdHint = "") {
  const key = String(topicRowKey || "").trim();
  if (!key) return null;
  const hint = String(subjectIdHint || "").trim();
  if (hint) {
    const hit = findFirstAnchoredTopicRowForSubject(payload, hint);
    if (hit) {
      const k = String(hit.tr?.topicRowKey || hit.tr?.topicKey || "");
      if (k === key) return hit;
    }
  }
  const profiles = Array.isArray(payload?.subjectProfiles) ? payload.subjectProfiles : [];
  for (const sp of profiles) {
    const sid = String(sp?.subject || "");
    const list = Array.isArray(sp?.topicRecommendations) ? sp.topicRecommendations : [];
    for (const tr of list) {
      const k = String(tr?.topicRowKey || tr?.topicKey || "");
      if (k === key) {
        const nar = tr?.contractsV1?.narrative;
        if (nar && typeof nar === "object") return { subject: sid || hint, tr };
      }
    }
  }
  return null;
}

const SUBJECT_LABEL_HE = {
  math: "חשבון",
  geometry: "גאומטריה",
  english: "אנגלית",
  science: "מדעים",
  hebrew: "עברית",
  "moledet-geography": "מולדת וגיאוגרפיה",
};

export function subjectLabelHe(subjectId) {
  return SUBJECT_LABEL_HE[String(subjectId || "")] || "מקצוע";
}

/**
 * @param {"topic"|"subject"|"executive"} scopeType
 * @param {string} scopeId
 * @param {string} [subjectId]
 * @param {unknown} payload
 * @returns {{ subjectId: string, topicRow: object, contracts: ReturnType<typeof contractsFromTopicRow> } | null}
 */
export function readContractsSliceForScope(scopeType, scopeId, subjectId, payload) {
  if (!payload || typeof payload !== "object") return null;
  if (scopeType === "topic") {
    const hit = findTopicRowByKey(payload, scopeId, subjectId);
    if (!hit) return null;
    return { subjectId: hit.subject, topicRow: hit.tr, contracts: contractsFromTopicRow(hit.tr) };
  }
  if (scopeType === "subject") {
    const sid = String(scopeId || subjectId || "").trim();
    const hit = findFirstAnchoredTopicRowForSubject(payload, sid);
    if (!hit) return null;
    return { subjectId: hit.subject, topicRow: hit.tr, contracts: contractsFromTopicRow(hit.tr) };
  }
  const hit = findFirstAnchoredTopicRow(payload);
  if (!hit) return null;
  return { subjectId: hit.subject, topicRow: hit.tr, contracts: contractsFromTopicRow(hit.tr) };
}
