/**
 * Canonical owner: TruthPacketV1 builder. Downstream modules consume this object only.
 */

import { listAllAnchoredTopicRows, readContractsSliceForScope, subjectLabelHe } from "./contract-reader.js";

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
 * @param {{ scopeType: "topic"|"subject"|"executive"; scopeId: string; scopeLabel: string }} scope
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
    const executiveNarrative = {
      ...narBase,
      topicKey: "executive",
      subjectId: "executive",
      textSlots: {
        observation: trendsForSurface[0] || "מבט תקופתי כולל לפי הנתונים הזמינים בדוח.",
        interpretation:
          trendsForSurface[1] ||
          `הסיכום מתבסס על ${subSet.size} מקצועות ובוחן תמונה כוללת של התקופה, לא נושא בודד.`,
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

  return {
    schemaVersion: "v1",
    audience: "parent",
    scopeType: scope.scopeType,
    scopeId: scope.scopeId,
    scopeLabel: scope.scopeLabel,
    interpretationScope: String(scope?.scopeClass || scope?.scopeType || "executive"),
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
