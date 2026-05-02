/**
 * Phase 5 — derive structured behavior signals from aggregate storage + meta + slim report payload.
 * Uses session timestamps and totals/correct only (no Hebrew parsing).
 */

import {
  collectSessionsFromStorageSnapshot,
  accuracyTrendDirectionFromSessions,
} from "./report-runner.mjs";

function safePct(c, t) {
  const tot = Number(t);
  const cor = Number(c);
  if (!Number.isFinite(tot) || tot <= 0 || !Number.isFinite(cor)) return null;
  return Math.round((cor / tot) * 1000) / 10;
}

/**
 * @param {Record<string, unknown>} storage
 * @param {{ total?: number, correct?: number }[]} sessionRows
 */
function bumpMetric(map, key, total, correct) {
  const t = Number(total) || 0;
  const c = Number(correct) || 0;
  if (t <= 0) return;
  if (!map[key]) map[key] = { totalQ: 0, correctQ: 0 };
  map[key].totalQ += t;
  map[key].correctQ += c;
}

/**
 * @param {Record<string, unknown>} storage
 * @returns {Record<string, { totalQ: number, correctQ: number, accuracyPct: number }>}
 */
export function computeSubjectMetrics(storage) {
  /** @type {Record<string, { totalQ: number, correctQ: number }>} */
  const acc = {};

  const run = (subject, sessions) => {
    for (const s of sessions || []) {
      bumpMetric(acc, subject, s.total, s.correct);
    }
  };

  for (const b of Object.values(storage?.mleo_time_tracking?.operations || {})) {
    run("math", b?.sessions);
  }
  for (const [tk, subj] of [
    ["mleo_geometry_time_tracking", "geometry"],
    ["mleo_english_time_tracking", "english"],
    ["mleo_science_time_tracking", "science"],
    ["mleo_hebrew_time_tracking", "hebrew"],
    ["mleo_moledet_geography_time_tracking", "moledet_geography"],
  ]) {
    for (const b of Object.values(storage?.[tk]?.topics || {})) {
      run(subj, b?.sessions);
    }
  }

  /** @type {Record<string, { totalQ: number, correctQ: number, accuracyPct: number }>} */
  const out = {};
  for (const [k, v] of Object.entries(acc)) {
    const pct = safePct(v.correctQ, v.totalQ);
    if (pct == null) continue;
    out[k] = { ...v, accuracyPct: pct };
  }
  return out;
}

/**
 * @param {Record<string, unknown>} storage
 * @returns {Record<string, { totalQ: number, correctQ: number, accuracyPct: number, subject: string, topic: string }>}
 */
export function computeTopicMetrics(storage) {
  /** @type {Record<string, { totalQ: number, correctQ: number, subject: string, topic: string }>} */
  const acc = {};

  for (const [op, b] of Object.entries(storage?.mleo_time_tracking?.operations || {})) {
    const key = `math:${op}`;
    if (!acc[key]) acc[key] = { totalQ: 0, correctQ: 0, subject: "math", topic: op };
    for (const s of b?.sessions || []) {
      acc[key].totalQ += Number(s.total) || 0;
      acc[key].correctQ += Number(s.correct) || 0;
    }
  }

  for (const [tk, subj] of [
    ["mleo_geometry_time_tracking", "geometry"],
    ["mleo_english_time_tracking", "english"],
    ["mleo_science_time_tracking", "science"],
    ["mleo_hebrew_time_tracking", "hebrew"],
    ["mleo_moledet_geography_time_tracking", "moledet_geography"],
  ]) {
    for (const [topic, b] of Object.entries(storage?.[tk]?.topics || {})) {
      const key = `${subj}:${topic}`;
      if (!acc[key]) acc[key] = { totalQ: 0, correctQ: 0, subject: subj, topic };
      for (const s of b?.sessions || []) {
        acc[key].totalQ += Number(s.total) || 0;
        acc[key].correctQ += Number(s.correct) || 0;
      }
    }
  }

  /** @type {Record<string, { totalQ: number, correctQ: number, accuracyPct: number, subject: string, topic: string }>} */
  const out = {};
  for (const [k, v] of Object.entries(acc)) {
    if (v.totalQ <= 0) continue;
    out[k] = {
      ...v,
      accuracyPct: safePct(v.correctQ, v.totalQ) ?? 0,
    };
  }
  return out;
}

/**
 * Population standard deviation of session-level accuracies.
 * @param {{ t: number, acc: number }[]} rows
 */
export function sessionAccuracyVolatility(rows) {
  if (rows.length < 2) return { stdev: 0, n: rows.length };
  const mean = rows.reduce((a, x) => a + x.acc, 0) / rows.length;
  const v =
    rows.reduce((a, x) => a + (x.acc - mean) * (x.acc - mean), 0) / rows.length;
  return { stdev: Math.sqrt(v), n: rows.length, meanAccuracy: mean };
}

/**
 * @param {Record<string, unknown>|null} meta
 */
export function evidenceTotalsFromMeta(meta) {
  const st = meta?.stats && typeof meta.stats === "object" ? meta.stats : meta;
  return {
    sessionCount: Number(st?.sessionCount) || 0,
    questionTotal: Number(st?.questionTotal) || 0,
    correctTotal: Number(st?.correctTotal) || 0,
    mistakeEventCount: Number(st?.mistakeEventCount) || 0,
    subjectsTouched: Array.isArray(st?.subjectsTouched) ? st.subjectsTouched : [],
  };
}

/**
 * Extract numeric summary from slim report.json (Phase 3 artifact).
 * @param {Record<string, unknown>|null} report
 */
export function reportStructuredSignals(report) {
  const facets = report?.facets && typeof report.facets === "object" ? report.facets : {};
  const diag = facets.diagnostic && typeof facets.diagnostic === "object" ? facets.diagnostic : {};
  const contract = facets.contract && typeof facets.contract === "object" ? facets.contract : {};
  const executive = facets.executive && typeof facets.executive === "object" ? facets.executive : {};
  const topicLayer = facets.topicLayer && typeof facets.topicLayer === "object" ? facets.topicLayer : {};
  const summary = facets.summary && typeof facets.summary === "object" ? facets.summary : report?.summary || {};

  return {
    totalQuestions: Number(summary.totalQuestions) || 0,
    overallAccuracy: Number(summary.overallAccuracy) || 0,
    contractTopThinDowngraded: Boolean(contract.topThinDowngraded),
    contractTopEvidenceQuestionCount: Number(contract.topEvidenceQuestionCount) || 0,
    contractPrimarySubjectId: contract.primarySubjectId != null ? String(contract.primarySubjectId) : "",
    topicBucketKeys: Array.isArray(topicLayer.topicBucketKeys) ? topicLayer.topicBucketKeys.map(String) : [],
    diagnosedCount: Number(diag.diagnosedCount) || 0,
    unitCount: Number(diag.unitCount) || 0,
    contradictoryConfidenceCount: Number(diag.contradictoryConfidenceCount) || 0,
    executiveWindowQuestions: Number(executive.windowTotalQuestions) || 0,
    rowTrendsLength: Array.isArray(facets.rowTrends) ? facets.rowTrends.length : 0,
  };
}

/**
 * Mean simulated session duration (seconds) across storage buckets — for simulator pace checks only.
 * @param {Record<string, unknown>} storage
 */
export function meanSessionDurationSecFromStorage(storage) {
  const ds = [];
  const walk = (sessions) => {
    for (const s of sessions || []) {
      const d = Number(s.duration);
      if (Number.isFinite(d) && d > 0) ds.push(d);
    }
  };
  for (const b of Object.values(storage?.mleo_time_tracking?.operations || {})) walk(b?.sessions);
  for (const tk of [
    "mleo_geometry_time_tracking",
    "mleo_english_time_tracking",
    "mleo_science_time_tracking",
    "mleo_hebrew_time_tracking",
    "mleo_moledet_geography_time_tracking",
  ]) {
    for (const b of Object.values(storage?.[tk]?.topics || {})) walk(b?.sessions);
  }
  if (!ds.length) return null;
  return Math.round((ds.reduce((a, x) => a + x, 0) / ds.length) * 10) / 10;
}

/**
 * Aggregate seconds-per-question across sessions (duration sums / question totals).
 * @param {Record<string, unknown>} storage
 */
export function meanSecondsPerQuestionFromStorage(storage) {
  let dur = 0;
  let q = 0;
  const walk = (sessions) => {
    for (const s of sessions || []) {
      dur += Number(s.duration) || 0;
      q += Number(s.total) || 0;
    }
  };
  for (const b of Object.values(storage?.mleo_time_tracking?.operations || {})) walk(b?.sessions);
  for (const tk of [
    "mleo_geometry_time_tracking",
    "mleo_english_time_tracking",
    "mleo_science_time_tracking",
    "mleo_hebrew_time_tracking",
    "mleo_moledet_geography_time_tracking",
  ]) {
    for (const b of Object.values(storage?.[tk]?.topics || {})) walk(b?.sessions);
  }
  if (q <= 0) return null;
  return Math.round((dur / q) * 100) / 100;
}

/**
 * Full behavior snapshot for one scenario (oracle inputs + derived metrics).
 * @param {Record<string, unknown>} storage
 * @param {Record<string, unknown>|null} meta
 * @param {Record<string, unknown>|null} report
 */
export function computeBehaviorOracle(storage, meta, report) {
  const rows = collectSessionsFromStorageSnapshot(storage);
  const trendOracle = accuracyTrendDirectionFromSessions(rows);
  const vol = sessionAccuracyVolatility(rows);

  const metaTotals = evidenceTotalsFromMeta(meta);
  const overallAccPct =
    metaTotals.questionTotal > 0
      ? Math.round((metaTotals.correctTotal / metaTotals.questionTotal) * 1000) / 10
      : null;
  const mistakeRateApprox =
    metaTotals.questionTotal > 0
      ? Math.round((metaTotals.mistakeEventCount / metaTotals.questionTotal) * 1000) / 1000
      : null;

  const rs = report ? reportStructuredSignals(report) : null;
  const hints = {
    /** Many questions but zero diagnosed units — possible under-triage (investigate; not auto-fail). */
    suspiciousZeroDiagnosesWithVolume:
      !!(rs && metaTotals.questionTotal >= 250 && rs.diagnosedCount === 0 && rs.unitCount >= 3),
    /** Contract marks thin while meta volume is large — narrative tension for manual review. */
    thinContractVsHighMetaQuestions:
      !!(rs && rs.contractTopThinDowngraded && metaTotals.questionTotal >= 500),
    diagnosisCoverageRatio:
      rs && rs.unitCount > 0 ? Math.round((rs.diagnosedCount / rs.unitCount) * 1000) / 1000 : null,
  };

  return {
    evidence: {
      ...metaTotals,
      overallAccuracyPct: overallAccPct,
      mistakeRateApprox,
    },
    subjectMetrics: computeSubjectMetrics(storage),
    topicMetrics: computeTopicMetrics(storage),
    trendOracle: {
      direction: trendOracle.direction,
      earlyMean: trendOracle.earlyMean,
      lateMean: trendOracle.lateMean,
      delta: trendOracle.delta,
      sessionSamples: trendOracle.n,
    },
    volatility: vol,
    paceOracle: {
      meanSessionDurationSec: meanSessionDurationSecFromStorage(storage),
      meanSecondsPerQuestion: meanSecondsPerQuestionFromStorage(storage),
      mistakeEventCount: metaTotals.mistakeEventCount,
      mistakeRateApprox,
    },
    reportSignals: rs,
    behaviorHints: hints,
    sessionRowCount: rows.length,
  };
}
