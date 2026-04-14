import { HYBRID_RUNTIME_VERSION } from "./constants.js";

const ASSIST_MODES = new Set(["assist", "rank_only", "explain_only", "suppressed"]);
const DISAGREE_SEVERITY = new Set(["none", "low", "medium", "high"]);
const DISAGREE_ACTION = new Set(["retain_v2", "surface_review", "suppress_ai"]);
const CALIBRATION_BAND = new Set(["well_calibrated", "borderline", "uncalibrated"]);
const EXPLANATION_STATUS = new Set(["ok", "fallback", "failed"]);
const EXPOSURE_MODES = new Set(["off", "shadow", "live"]);

/**
 * @param {unknown} u
 */
function isValidHybridUnit(u) {
  if (!u || typeof u !== "object") return false;
  if (typeof u.unitKey !== "string" || !u.unitKey) return false;
  const snap = u.v2AuthoritySnapshot;
  if (!snap || typeof snap !== "object" || typeof snap.snapshotHash !== "string") return false;
  const aa = u.aiAssist;
  if (!aa || typeof aa !== "object") return false;
  if (typeof aa.eligible !== "boolean") return false;
  if (typeof aa.mode !== "string" || !ASSIST_MODES.has(aa.mode)) return false;
  if (!Array.isArray(aa.suppressionFlags)) return false;
  const hr = u.hypothesisRanking;
  if (!hr || typeof hr !== "object") return false;
  if (!Array.isArray(hr.candidates)) return false;
  if (typeof hr.top1Id !== "string") return false;
  if (!Number.isFinite(Number(hr.top1Probability))) return false;
  if (typeof hr.calibrationBand !== "string" || !CALIBRATION_BAND.has(hr.calibrationBand)) return false;
  if (!Number.isFinite(Number(hr.ambiguityScore))) return false;
  const d = u.disagreement;
  if (!d || typeof d !== "object") return false;
  if (typeof d.hasDisagreement !== "boolean") return false;
  if (typeof d.severity !== "string" || !DISAGREE_SEVERITY.has(d.severity)) return false;
  if (typeof d.v2TopId !== "string") return false;
  if (typeof d.aiTopId !== "string") return false;
  if (!Number.isFinite(Number(d.probabilityGap))) return false;
  if (!Number.isFinite(Number(d.ambiguityScore))) return false;
  if (!Array.isArray(d.reasonCodes)) return false;
  if (typeof d.action !== "string" || !DISAGREE_ACTION.has(d.action)) return false;
  const p = u.probeIntelligence;
  if (!p || typeof p !== "object") return false;
  if (typeof p.suggestedProbeId !== "string") return false;
  if (!Number.isFinite(Number(p.uncertaintyReductionEstimate))) return false;
  if (typeof p.stoppingRuleMet !== "boolean") return false;
  if (typeof p.escalationRuleTriggered !== "boolean") return false;
  const ec = u.explanationContract;
  if (!ec || typeof ec !== "object") return false;
  if (typeof ec.inputBundleId !== "string") return false;
  if (typeof ec.outputStatus !== "string" || !EXPLANATION_STATUS.has(ec.outputStatus)) return false;
  if (typeof ec.validatorPass !== "boolean") return false;
  if (typeof ec.failureReason !== "string") return false;
  const ex = u.explanations;
  if (!ex || typeof ex !== "object") return false;
  const par = ex.parent;
  const tea = ex.teacher;
  if (!par || typeof par !== "object" || typeof par.text !== "string") return false;
  if (!tea || typeof tea !== "object" || typeof tea.text !== "string") return false;
  const ev = u.explanationValidator;
  if (!ev || typeof ev !== "object" || typeof ev.overallPass !== "boolean") return false;
  if (!u.features || typeof u.features !== "object") return false;
  return true;
}

/**
 * @param {unknown} x
 * @param {{ expectedUnitCount: number }} [ctx]
 */
export function isValidHybridRuntimePayload(x, ctx = undefined) {
  if (x == null) return false;
  if (typeof x !== "object") return false;
  if (typeof x.hybridRuntimeVersion !== "string" || x.hybridRuntimeVersion !== HYBRID_RUNTIME_VERSION) return false;
  if (typeof x.generatedAt !== "string" || !x.generatedAt) return false;
  if (typeof x.exposureMode !== "string" || !EXPOSURE_MODES.has(x.exposureMode)) return false;
  if (!x.governance || typeof x.governance !== "object") return false;
  if (typeof x.governance.consentState !== "string") return false;
  if (!Array.isArray(x.units)) return false;
  if (!x.rollup || typeof x.rollup !== "object") return false;
  const uc = Number(x.rollup.unitCount);
  if (!Number.isFinite(uc) || uc < 0) return false;
  if (uc !== x.units.length) return false;
  const sc = Number(x.rollup.suppressedCount);
  const dc = Number(x.rollup.disagreementCount);
  if (!Number.isFinite(sc) || !Number.isFinite(dc)) return false;
  if (ctx != null && Number.isFinite(ctx.expectedUnitCount) && ctx.expectedUnitCount !== x.units.length) {
    return false;
  }
  if (!x.shadow || typeof x.shadow !== "object") return false;
  if (typeof x.shadow.logKey !== "string") return false;
  if (!Number.isFinite(Number(x.shadow.entriesSampled))) return false;
  for (const u of x.units) {
    if (!isValidHybridUnit(u)) return false;
  }
  return true;
}
