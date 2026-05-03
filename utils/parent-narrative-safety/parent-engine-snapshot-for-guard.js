/**
 * Builds a minimal engine snapshot for validateParentNarrativeSafety from report-shaped JSON.
 * Best-effort only — uses diagnosticEngineV2 + professional layers when present.
 */

/** @param {unknown} root */
function unwrapBaseReport(root) {
  if (!root || typeof root !== "object") return /** @type {Record<string, unknown>} */ ({});
  const o = /** @type {Record<string, unknown>} */ (root);
  if (o.baseReport && typeof o.baseReport === "object") return /** @type {Record<string, unknown>} */ (o.baseReport);
  if (o.reportJson && typeof o.reportJson === "object") {
    const rj = /** @type {Record<string, unknown>} */ (o.reportJson);
    if (rj.baseReport && typeof rj.baseReport === "object") return /** @type {Record<string, unknown>} */ (rj.baseReport);
  }
  return o;
}

/**
 * Infer subject id from narrative dot-path (contracts preview keys).
 * @param {string} narrativePath
 */
export function inferSubjectIdFromNarrativePath(narrativePath) {
  const s = String(narrativePath || "");
  const m = s.match(/parentProductContractPreview\.([a-z0-9-]+)\./i);
  if (m) return m[1].toLowerCase();
  const m2 = s.match(/subjectProfiles\[(\d+)\]/);
  if (m2) return null;
  const m3 = s.match(/["']?subjectId["']?\s*:\s*["']([^"']+)["']/);
  return m3 ? m3[1] : null;
}

/**
 * @param {unknown} reportRoot — full artifact (may wrap baseReport / reportJson)
 * @param {string} [narrativePath] — dot path of the narrative being validated
 * @returns {Record<string, unknown>}
 */
export function deriveEngineSnapshotForGuard(reportRoot, narrativePath = "") {
  const base = unwrapBaseReport(reportRoot);
  const summary = base.summary && typeof base.summary === "object" ? base.summary : {};
  const totalQuestions = Number(summary.totalQuestions) || 0;

  const pe =
    base.professionalEngineOutputV1 && typeof base.professionalEngineOutputV1 === "object"
      ? base.professionalEngineOutputV1
      : reportRoot &&
          typeof reportRoot === "object" &&
          /** @type {Record<string, unknown>} */ (reportRoot).professionalEngineOutputV1 &&
          typeof /** @type {Record<string, unknown>} */ (reportRoot).professionalEngineOutputV1 === "object"
        ? /** @type {Record<string, unknown>} */ (
            /** @type {Record<string, unknown>} */ (reportRoot).professionalEngineOutputV1
          )
        : null;

  const dEngine =
    base.diagnosticEngineV2 && typeof base.diagnosticEngineV2 === "object"
      ? base.diagnosticEngineV2
      : reportRoot &&
          typeof reportRoot === "object" &&
          /** @type {Record<string, unknown>} */ (reportRoot).diagnosticEngineV2 &&
          typeof /** @type {Record<string, unknown>} */ (reportRoot).diagnosticEngineV2 === "object"
        ? /** @type {Record<string, unknown>} */ (/** @type {Record<string, unknown>} */ (reportRoot).diagnosticEngineV2)
        : null;

  /** @type {string[]} */
  const doNotConclude = [];

  const gpf = dEngine?.professionalFrameworkV1 && typeof dEngine.professionalFrameworkV1 === "object"
    ? dEngine.professionalFrameworkV1
    : null;
  if (gpf && Array.isArray(gpf.globalDoNotConclude)) {
    for (const x of gpf.globalDoNotConclude) doNotConclude.push(String(x));
  }

  const units = Array.isArray(dEngine?.units) ? dEngine.units : [];
  const subjectHint = inferSubjectIdFromNarrativePath(narrativePath);
  const unit =
    subjectHint && units.length
      ? units.find((u) => u && typeof u === "object" && String(u.subjectId || "").toLowerCase() === subjectHint)
      : units[0] || null;

  if (unit && typeof unit === "object") {
    const tax = unit.taxonomy && typeof unit.taxonomy === "object" ? unit.taxonomy : null;
    if (tax && Array.isArray(tax.doNotConcludeHe)) {
      for (const x of tax.doNotConcludeHe) doNotConclude.push(String(x));
    }
    const pf = unit.professionalFrameworkV1 && typeof unit.professionalFrameworkV1 === "object"
      ? unit.professionalFrameworkV1
      : null;
    const sf = pf?.structuredFinding && typeof pf.structuredFinding === "object" ? pf.structuredFinding : null;
    if (sf && Array.isArray(sf.doNotConclude)) {
      for (const x of sf.doNotConclude) doNotConclude.push(String(x));
    }
  }

  let engineConfidence = pe && typeof pe.engineConfidence === "string" ? String(pe.engineConfidence) : undefined;
  let dataSufficiencyLevel;

  if (unit && typeof unit === "object") {
    const rowSignals =
      unit.confidence && typeof unit.confidence === "object" && unit.confidence.rowSignals
        ? unit.confidence.rowSignals
        : null;
    if (rowSignals && typeof rowSignals === "object" && rowSignals.dataSufficiencyLevel != null) {
      dataSufficiencyLevel = String(rowSignals.dataSufficiencyLevel);
    }
    const lev =
      unit.confidence && typeof unit.confidence === "object" && unit.confidence.level != null
        ? String(unit.confidence.level)
        : "";
    if (lev === "low" || lev === "early_signal_only" || lev === "insufficient_data") {
      engineConfidence = "low";
    }
  }

  const rel = pe?.reliability && typeof pe.reliability === "object" ? pe.reliability : null;
  let guessingLikelihoodHigh = false;
  if (rel && Number(rel.guessingLikelihood) > 0.35) guessingLikelihoodHigh = true;
  if (rel && String(rel.inconsistencyLevel || "") === "high") {
    // does not directly map to guard field; keep conservative via thinData elsewhere
  }

  let thinData = totalQuestions > 0 && totalQuestions < 25;
  if (dataSufficiencyLevel && ["weak", "thin", "low", "insufficient"].includes(String(dataSufficiencyLevel).toLowerCase())) {
    thinData = true;
  }

  /** @type {Record<string, unknown>} */
  const snap = {
    questionCount: totalQuestions,
    thinData,
    dataSufficiencyLevel: dataSufficiencyLevel || undefined,
    engineConfidence: engineConfidence || undefined,
    conclusionStrengthAllowed: undefined,
    doNotConclude: [...new Set(doNotConclude.filter(Boolean))].slice(0, 48),
    cannotConclude: false,
    recommendationTier: "advance_ok",
    prerequisiteGapLevel: "none",
    guessingLikelihoodHigh,
  };

  if (snap.doNotConclude.length) snap.cannotConclude = false;

  return snap;
}
