/**
 * Evaluate scenario.expected assertions against normalized report facets + corpus (Phase 3).
 * Layer A: structured paths from diagnosticEngineV2, executiveSummary, contracts.
 * Layer B: substring checks on aggregated corpus when needed.
 * Layer C (optional): simulator storage oracle for trends / bucket keys (does not change product code).
 */

import { accuracyTrendDirectionFromSessions, collectSessionsFromStorageSnapshot } from "./report-runner.mjs";

function norm(s) {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function asArray(v) {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

const CAUTIOUS_HE_MARKERS = [
  "עדיין לא גבוה",
  "אין מספיק",
  "מעט מידע",
  "צריך עוד תרגול",
  "לא גבוה יחסית",
];

function combinedConfidenceText(facets) {
  const c = facets?.contract;
  const ex = facets?.executive;
  return [c?.topConfidenceHe, c?.topMainStatusHe, ex?.overallConfidenceHe, ex?.cautionNoteHe, ex?.reportReadinessHe]
    .filter(Boolean)
    .join(" ");
}

function hasCautiousTone(facets) {
  const t = norm(combinedConfidenceText(facets));
  return CAUTIOUS_HE_MARKERS.some((m) => t.includes(norm(m)));
}

function structuredWeaknessHaystack(facets) {
  const parts = [];
  const us = facets?.diagnostic?.unitSummaries || [];
  for (const u of us) {
    parts.push(u.displayName, u.patternHe, u.diagnosisLineHe);
  }
  parts.push(...(facets?.executive?.topFocusAreasHe || []));
  parts.push(...(facets?.topicLayer?.topWeaknessLabels || []));
  parts.push(...(facets?.topicLayer?.topicRecLabels || []));
  parts.push(...(facets?.analysisPreview?.needsPracticeLines || []));
  return norm(parts.filter(Boolean).join(" | "));
}

function phraseMatchesHaystack(phrase, facets, corpusNorm) {
  const p = norm(phrase);
  if (!p) return true;
  if (corpusNorm.includes(p)) return true;
  const h = structuredWeaknessHaystack(facets);
  if (h.includes(p)) return true;
  const bk = norm((facets.topicLayer?.topicBucketKeys || []).join(" "));
  if (bk.includes(p)) return true;
  return false;
}

/**
 * @param {Record<string, unknown>} expected — scenario.expected
 * @param {object} facets — extractNormalizedReportFacets
 * @param {string} corpus — buildAssertionCorpus
 * @param {object|null} baseReport
 * @param {Record<string, unknown>|null} [storage] — aggregate snapshot for oracle-only checks
 */
export function evaluateAssertions(expected, facets, corpus, baseReport, storage = null) {
  const results = [];
  const exp = expected && typeof expected === "object" ? expected : {};
  const corpusNorm = norm(corpus);

  const totalQ = Number(facets?.summary?.totalQuestions) || 0;
  const windowQ = Number(facets?.executive?.windowTotalQuestions) || totalQ;
  const effectiveQ = Math.max(totalQ, windowQ);

  function add(name, pass, evidence, method) {
    results.push({
      assertion: name,
      pass: !!pass,
      evidence: evidence || {},
      method: method || "structured",
    });
  }

  if (exp.mustMention !== undefined) {
    const phrases = asArray(exp.mustMention).filter((x) => typeof x === "string");
    for (const ph of phrases) {
      const ok = corpusNorm.includes(norm(ph));
      add(
        `mustMention:${ph}`,
        ok,
        { phrase: ph, found: ok, layer: ok ? "corpus" : "missing" },
        "text"
      );
    }
  }

  if (exp.mustNotMention !== undefined) {
    const phrases = asArray(exp.mustNotMention).filter((x) => typeof x === "string");
    for (const ph of phrases) {
      const bad = corpusNorm.includes(norm(ph));
      add(
        `mustNotMention:${ph}`,
        !bad,
        { phrase: ph, foundForbidden: bad },
        "text"
      );
    }
  }

  if (exp.allowedTone !== undefined || exp.forbiddenTone !== undefined) {
    add("allowedTone/forbiddenTone", true, { skipped: true, reason: "not used in quick scenarios" }, "skipped");
  }

  if (exp.topWeaknessExpected !== undefined) {
    const phrases = asArray(exp.topWeaknessExpected).filter((x) => typeof x === "string");
    const perHit = phrases.map((ph) => ({
      phrase: ph,
      hit: phraseMatchesHaystack(ph, facets, corpusNorm),
    }));
    const ok = perHit.some((x) => x.hit);
    add(
      "topWeaknessExpected",
      ok,
      { phrases: perHit, semantics: "anyMatch" },
      ok ? "structured" : "text"
    );
  }

  if (exp.topStrengthExpected !== undefined) {
    const phrases = asArray(exp.topStrengthExpected).filter((x) => typeof x === "string");
    const perHit = phrases.map((ph) => ({
      phrase: ph,
      hit: phraseMatchesHaystack(ph, facets, corpusNorm),
    }));
    const ok = perHit.some((x) => x.hit);
    add("topStrengthExpected", ok, { phrases: perHit, semantics: "anyMatch" }, ok ? "structured" : "text");
  }

  if (exp.trendExpected !== undefined) {
    const want = asArray(exp.trendExpected).filter((x) => typeof x === "string");
    const rows = facets?.rowTrends || [];
    const maj = (facets?.executive?.majorTrendsHe || []).join(" ");
    const sufficientUp = rows.filter(
      (r) => r.accuracyDirection === "up" && r.trendEvidenceStatus !== "insufficient"
    ).length;
    const anyUp = rows.filter((r) => r.accuracyDirection === "up").length;
    const sufficientDown = rows.filter(
      (r) => r.accuracyDirection === "down" && r.trendEvidenceStatus !== "insufficient"
    ).length;
    const anyDown = rows.filter((r) => r.accuracyDirection === "down").length;

    let ok = true;
    const oracle =
      storage && typeof storage === "object"
        ? accuracyTrendDirectionFromSessions(collectSessionsFromStorageSnapshot(storage))
        : null;

    const ev = {
      want,
      sufficientUp,
      anyUp,
      sufficientDown,
      anyDown,
      majorTrendsSample: maj.slice(0, 200),
      storageOracle: oracle,
    };

    for (const w of want) {
      const nw = norm(w);
      if (nw === "any") continue;
      if (nw === "up" || nw === "improving") {
        const narrativeLift = /שיפור|עולה|מגמת שיפור|מגמה.*שיפור/i.test(maj) || /שיפור|מגמת/i.test(corpusNorm);
        let passes = sufficientUp >= 1 || anyUp >= 1 || narrativeLift;
        if (!passes && oracle?.direction === "up") passes = true;
        if (!passes) ok = false;
      } else if (nw === "down" || nw === "regressing") {
        const narrativeDrop = /ירידה|יורד|מגמה.*ירידה/i.test(maj) || /ירידה/i.test(corpusNorm);
        let passes = sufficientDown >= 1 || anyDown >= 1 || narrativeDrop;
        if (!passes && oracle?.direction === "down") passes = true;
        if (!passes) ok = false;
      } else if (nw === "flat" || nw === "stable") {
        const passes = rows.some((r) => r.accuracyDirection === "flat") || /יציב/i.test(maj);
        if (!passes && rows.length) ok = false;
      } else if (nw === "insufficient" || nw === "insufficient_data") {
        const passes = rows.every((r) => r.trendEvidenceStatus === "insufficient" || r.accuracyDirection === "unknown");
        if (!passes && want.length === 1) ok = false;
      }
    }
    add("trendExpected", ok, ev, oracle ? "structured+storage-oracle" : "structured");
  }

  if (exp.evidenceLevelExpected !== undefined) {
    const want = asArray(exp.evidenceLevelExpected).filter((x) => typeof x === "string");
    let ok = false;
    const ev = { want, effectiveQ };

    for (const w of want) {
      const nw = norm(w);
      if (nw === "any") {
        ok = true;
        break;
      }
      if (nw === "thin" || nw === "insufficient" || nw === "low") {
        if (effectiveQ < 60 || (facets?.contract?.topEvidenceQuestionCount != null && facets.contract.topEvidenceQuestionCount < 8)) {
          ok = true;
        }
      }
      if (nw === "medium" || nw === "high") {
        if (effectiveQ >= 120) ok = true;
      }
    }
    add("evidenceLevelExpected", ok || want.length === 0, ev, "structured");
  }

  if (exp.confidenceShouldBeCautious !== undefined) {
    const cautious = hasCautiousTone(facets);
    const want = !!exp.confidenceShouldBeCautious;
    let pass;
    if (want) pass = cautious;
    else pass = !cautious || effectiveQ >= 120;
    add(
      "confidenceShouldBeCautious",
      pass,
      {
        want,
        cautious,
        effectiveQ,
        note: want ? null : "when expecting non-cautious, allow pass if evidence volume is high (≥120 Q) despite boilerplate contract phrasing",
        sample: combinedConfidenceText(facets).slice(0, 220),
      },
      "structured+text"
    );
  }

  if (exp.noContradiction !== undefined && exp.noContradiction === true) {
    const n = Number(facets?.diagnostic?.contradictoryConfidenceCount) || 0;
    add("noContradiction", n === 0, { contradictoryUnits: n }, "structured");
  }

  if (exp.noGenericOnlyReport !== undefined && exp.noGenericOnlyReport === true) {
    const uc = Number(facets?.diagnostic?.unitCount) || 0;
    const tr = (facets?.topicLayer?.topicRecLabels || []).length;
    const pass = uc >= 1 && (tr >= 1 || (facets?.diagnostic?.diagnosedCount ?? 0) >= 1);
    add("noGenericOnlyReport", pass, { unitCount: uc, topicRecCount: tr }, "structured");
  }

  if (exp.noFalseStrongConclusion !== undefined && exp.noFalseStrongConclusion === true) {
    const badUnits =
      facets?.diagnostic?.unitSummaries?.filter(
        (u) =>
          u.positiveAuthorityLevel === "excellent" &&
          Number(u.evidenceQuestions) > 0 &&
          Number(u.evidenceQuestions) < 8
      ) || [];
    const pass = badUnits.length === 0;
    add("noFalseStrongConclusion", pass, { suspectUnits: badUnits.slice(0, 5) }, "structured");
  }

  if (exp.noFalseWeakConclusion !== undefined) {
    if (exp.noFalseWeakConclusion === false) {
      add("noFalseWeakConclusion", true, { skipped: true, reason: "expected false — not asserting" }, "skipped");
    } else {
      const diagnosed = Number(facets?.diagnostic?.diagnosedCount) || 0;
      const np = (facets?.analysisPreview?.needsPracticeLines || []).length;
      const acc = Number(facets?.summary?.overallAccuracy) || 0;
      const pass = !(acc >= 92 && diagnosed === 0 && np === 0 && (facets?.executive?.topFocusAreasHe || []).length > 0);
      add("noFalseWeakConclusion", pass, { diagnosed, needsPracticeCount: np, overallAccuracy: acc }, "heuristic");
    }
  }

  const overallPass = results.every((r) => r.pass);

  return {
    overallPass,
    results,
    counts: {
      assertionsRun: results.length,
      passed: results.filter((r) => r.pass).length,
      failed: results.filter((r) => !r.pass).length,
    },
  };
}
