/**
 * Phase 5 — behavior assertions on oracle metrics + slim report facets (structured first).
 * Does not modify product code; failures include a likely-cause hint for triage.
 */

/** @typedef {'simulator_data' | 'behavior_oracle_threshold' | 'engine_report' | 'unknown'} LikelyCause */

/**
 * @param {string} assertionId
 * @param {boolean} pass
 * @param {object} expected
 * @param {object} actual
 * @param {LikelyCause} likelyCause
 * @param {object} [evidence]
 */
function row(assertionId, pass, expected, actual, likelyCause, evidence = {}) {
  return {
    assertionId,
    pass: !!pass,
    expected,
    actual,
    likelyCause,
    evidence,
  };
}

/**
 * When storage trend contradicts profile trendPolicy, data generation may be wrong.
 * When thresholds are arbitrary, flag oracle.
 * When metrics align but report.contract disagrees, flag engine/report pipeline.
 */

function worstRankAmongSubject(topicMetrics, subject, targetTopic, minQ = 12) {
  const keys = Object.keys(topicMetrics).filter((k) => k.startsWith(`${subject}:`));
  const rows = keys
    .map((k) => {
      const m = topicMetrics[k];
      const topic = k.split(":").slice(1).join(":");
      return { key: k, topic, accuracyPct: m.accuracyPct, totalQ: m.totalQ };
    })
    .filter((x) => x.totalQ >= minQ)
    .sort((a, b) => a.accuracyPct - b.accuracyPct);
  if (!rows.length) return { rank: null, ordered: [], targetRow: null };
  const targetRow = rows.find((r) => r.topic === targetTopic) || null;
  const rank = targetRow ? rows.findIndex((r) => r.topic === targetTopic) + 1 : null;
  return { rank, ordered: rows, targetRow };
}

/**
 * @param {object} scenario — QUICK_SCENARIOS entry
 * @param {object} oracle — computeBehaviorOracle(...)
 * @param {Record<string, unknown>|null} report
 */
export function evaluateScenarioBehavior(scenario, oracle, report) {
  /** @type {ReturnType<typeof row>[]} */
  const assertions = [];
  const sid = scenario.scenarioId;
  const exp = scenario.expected && typeof scenario.expected === "object" ? scenario.expected : {};
  const rs = oracle.reportSignals;

  function add(...args) {
    assertions.push(row(...args));
  }

  const qTot = oracle.evidence.questionTotal;
  const overallPct = oracle.evidence.overallAccuracyPct;

  // --- strong_all_subjects_g3_7d ---
  if (sid === "strong_all_subjects_g3_7d") {
    add(
      "evidence_volume_high",
      qTot >= 320,
      { minQuestions: 320 },
      { questionTotal: qTot },
      qTot < 150 ? "simulator_data" : "behavior_oracle_threshold",
      { hint: "Aggregate should simulate rich multi-subject volume." }
    );
    add(
      "overall_accuracy_high",
      overallPct != null && overallPct >= 72,
      { minPct: 72 },
      { overallAccuracyPct: overallPct },
      overallPct != null && overallPct < 55 ? "simulator_data" : "behavior_oracle_threshold",
      {}
    );
    const subjects = Array.isArray(scenario.subjects) ? scenario.subjects : [];
    let subjOk = true;
    const subjActual = {};
    for (const sub of subjects) {
      const m = oracle.subjectMetrics[sub];
      const pct = m?.accuracyPct;
      subjActual[sub] = pct ?? null;
      if (pct != null && pct < 58) subjOk = false;
    }
    add(
      "per_subject_accuracy_not_collapsed",
      subjOk,
      { minPctPerSubjectWithData: 58 },
      subjActual,
      !subjOk ? "simulator_data" : "behavior_oracle_threshold",
      {}
    );
    const tr = oracle.trendOracle;
    const trendOk =
      tr.direction === "up" ||
      tr.direction === "flat" ||
      tr.direction === "insufficient" ||
      (tr.direction === "down" && (tr.delta ?? 0) > -0.06);
    add(
      "storage_trend_not_strongly_down",
      trendOk,
      { forbidStrongDecline: true },
      { direction: tr.direction, delta: tr.delta, n: tr.sessionSamples },
      tr.direction === "down" ? "simulator_data" : "behavior_oracle_threshold",
      {}
    );
    const alignQs = rs ? Math.abs((rs.totalQuestions || 0) - qTot) <= 5 : true;
    add(
      "report_total_questions_aligns_meta",
      alignQs,
      { maxAbsDelta: 5 },
      { metaQuestionTotal: qTot, reportTotalQuestions: rs?.totalQuestions ?? null },
      !alignQs ? "engine_report" : "behavior_oracle_threshold",
      {}
    );
    const accAlign =
      overallPct != null && rs
        ? Math.abs((rs.overallAccuracy || 0) - overallPct) <= 12
        : true;
    add(
      "report_overall_accuracy_bracket_matches_meta",
      accAlign,
      { maxAbsDeltaPct: 12 },
      { metaOverall: overallPct, reportOverall: rs?.overallAccuracy ?? null },
      !accAlign ? "engine_report" : "behavior_oracle_threshold",
      {}
    );
  }

  // --- thin_data_g3_1d ---
  if (sid === "thin_data_g3_1d") {
    add(
      "evidence_volume_low",
      qTot < 45,
      { maxQuestions: 45 },
      { questionTotal: qTot },
      qTot > 80 ? "simulator_data" : "behavior_oracle_threshold",
      {}
    );
    const cautious =
      rs &&
      (rs.contractTopThinDowngraded === true ||
        rs.contractTopEvidenceQuestionCount < 35 ||
        (exp.confidenceShouldBeCautious !== false && rs.contractTopEvidenceQuestionCount < 40));
    add(
      "thin_downgrade_or_low_evidence_contract",
      !!cautious,
      { thinDowngradeOrLowEvidence: true },
      rs
        ? {
            contractTopThinDowngraded: rs.contractTopThinDowngraded,
            contractTopEvidenceQuestionCount: rs.contractTopEvidenceQuestionCount,
          }
        : null,
      !cautious ? "engine_report" : "behavior_oracle_threshold",
      {}
    );
    const thinAlign = rs ? Math.abs((rs.totalQuestions || 0) - qTot) <= 3 : true;
    add(
      "report_questions_match_meta_thin",
      thinAlign,
      { maxAbsDelta: 3 },
      { metaQuestionTotal: qTot, reportTotalQuestions: rs?.totalQuestions ?? null },
      !thinAlign ? "engine_report" : "behavior_oracle_threshold",
      {}
    );
  }

  // --- improving_student_g4_30d ---
  if (sid === "improving_student_g4_30d") {
    const tr = oracle.trendOracle;
    add(
      "storage_trend_oracle_up",
      tr.direction === "up",
      { direction: "up" },
      { direction: tr.direction, delta: tr.delta, earlyMean: tr.earlyMean, lateMean: tr.lateMean, n: tr.sessionSamples },
      tr.direction !== "up" ? "simulator_data" : "behavior_oracle_threshold",
      { note: "Profile p_improving_student uses accuracy trend start→end; sessions should reflect rising accuracy." }
    );
  }

  // --- declining_student_g4_30d ---
  if (sid === "declining_student_g4_30d") {
    const tr = oracle.trendOracle;
    add(
      "storage_trend_oracle_down",
      tr.direction === "down",
      { direction: "down" },
      { direction: tr.direction, delta: tr.delta, earlyMean: tr.earlyMean, lateMean: tr.lateMean, n: tr.sessionSamples },
      tr.direction !== "down" ? "simulator_data" : "behavior_oracle_threshold",
      {}
    );
  }

  function weakTopicAssertions(subject, topic, label) {
    const key = `${subject}:${topic}`;
    const tm = oracle.topicMetrics[key];
    add(
      `${label}_topic_has_volume`,
      !!(tm && tm.totalQ >= 10),
      { minTopicQuestions: 10 },
      tm ? { totalQ: tm.totalQ, accuracyPct: tm.accuracyPct } : { missing: key },
      !tm ? "simulator_data" : "behavior_oracle_threshold",
      {}
    );
    const { rank, ordered } = worstRankAmongSubject(oracle.topicMetrics, subject, topic, 10);
    const nTopics = ordered.length;
    const rkOk =
      nTopics <= 1 ||
      rank === 1 ||
      (rank != null && rank <= Math.max(2, Math.ceil(nTopics / 2)));
    add(
      `${label}_topic_weak_among_subject`,
      rkOk,
      { maxWeakRank: Math.max(1, Math.ceil((ordered.length || 1) / 2)) },
      { rank, orderedTopicsByAccuracy: ordered.map((x) => ({ t: x.topic, acc: x.accuracyPct, q: x.totalQ })) },
      !rkOk ? "simulator_data" : "behavior_oracle_threshold",
      {}
    );
    const bk = rs?.topicBucketKeys || [];
    const reportHintsWeak =
      bk.length === 0 ||
      bk.includes(topic) ||
      bk[0] === topic ||
      (subject === "science" && topic === "experiments" && bk.includes("experiments"));
    add(
      `${label}_report_topic_bucket_alignment`,
      reportHintsWeak,
      { topicBucketKeysIncludesTarget: topic },
      { topicBucketKeys: bk },
      !reportHintsWeak ? "engine_report" : "behavior_oracle_threshold",
      { secondary: true }
    );
  }

  if (sid === "weak_math_fractions_g5_7d") weakTopicAssertions("math", "fractions", "fractions");

  if (sid === "weak_hebrew_comprehension_g3_7d") weakTopicAssertions("hebrew", "comprehension", "comprehension");

  if (sid === "weak_english_grammar_g4_7d") weakTopicAssertions("english", "grammar", "grammar");

  if (sid === "weak_science_cause_effect_g5_7d") weakTopicAssertions("science", "experiments", "experiments");

  if (sid === "weak_geometry_area_g5_7d") weakTopicAssertions("geometry", "area", "area");

  if (sid === "weak_moledet_geography_maps_g4_7d") weakTopicAssertions("moledet_geography", "maps", "maps");

  // Cross-cutting: contradictory diagnostic confidence flag should stay rare on large windows
  if (rs && oracle.evidence.questionTotal > 400) {
    add(
      "no_diagnostic_contradictory_confidence_spike",
      (rs.contradictoryConfidenceCount || 0) <= 8,
      { maxContradictions: 8 },
      { contradictoryConfidenceCount: rs.contradictoryConfidenceCount },
      (rs.contradictoryConfidenceCount || 0) > 8 ? "engine_report" : "behavior_oracle_threshold",
      { scope: "global_sanity" }
    );
  }

  const passed = assertions.every((a) => a.pass);
  return { assertions, passed, scenarioId: sid };
}

/**
 * Summarize likely causes from failed assertions.
 * @param {ReturnType<typeof row>[]} assertions
 */
export function summarizeFailureCauses(assertions) {
  const failed = assertions.filter((a) => !a.pass);
  const counts = { simulator_data: 0, behavior_oracle_threshold: 0, engine_report: 0, unknown: 0 };
  for (const f of failed) {
    const k = f.likelyCause;
    if (counts[k] !== undefined) counts[k] += 1;
    else counts.unknown += 1;
  }
  let dominant = "unknown";
  let best = -1;
  for (const [k, v] of Object.entries(counts)) {
    if (v > best) {
      best = v;
      dominant = k;
    }
  }
  return { failedCount: failed.length, counts, dominantLikelyCause: best > 0 ? dominant : "none" };
}
