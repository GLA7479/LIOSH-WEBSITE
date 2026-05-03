/**
 * Load aggregate storage snapshots into a browser-like environment and run parent-report builders (Node).
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

import diagnosticUnitSkillAlignment from "../../../utils/adaptive-learning-planner/diagnostic-unit-skill-alignment.js";

const { buildFacetSkillAlignmentFields } = diagnosticUnitSkillAlignment;

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..", "..");

function ymdFromMs(ms) {
  const d = new Date(ms);
  if (!Number.isFinite(d.getTime())) return null;
  return d.toISOString().split("T")[0];
}

/**
 * Collect session timestamps from storage-shaped snapshot (same keys as product).
 * @param {Record<string, unknown>} storage
 */
export function collectSessionTimestampsMs(storage) {
  const ts = [];
  const pushArr = (sessions) => {
    for (const s of sessions || []) {
      const n = Number(s?.timestamp);
      if (Number.isFinite(n)) ts.push(n);
      else if (s?.date) {
        const t = new Date(String(s.date)).getTime();
        if (Number.isFinite(t)) ts.push(t);
      }
    }
  };
  const ops = storage?.mleo_time_tracking?.operations;
  if (ops && typeof ops === "object") {
    for (const b of Object.values(ops)) pushArr(b?.sessions);
  }
  const topicTracks = [
    storage?.mleo_geometry_time_tracking,
    storage?.mleo_english_time_tracking,
    storage?.mleo_science_time_tracking,
    storage?.mleo_hebrew_time_tracking,
    storage?.mleo_moledet_geography_time_tracking,
  ];
  for (const tr of topicTracks) {
    const topics = tr?.topics;
    if (topics && typeof topics === "object") {
      for (const b of Object.values(topics)) pushArr(b?.sessions);
    }
  }
  return ts.sort((a, b) => a - b);
}

/**
 * Custom period covering all stored sessions (aligns simulated data with report filter).
 * @param {Record<string, unknown>} storage
 */
export function deriveCustomPeriodFromStorage(storage) {
  const ts = collectSessionTimestampsMs(storage);
  if (!ts.length) {
    return { ok: false, startDate: null, endDate: null, error: "no session timestamps in storage" };
  }
  const startDate = ymdFromMs(ts[0]);
  const endDate = ymdFromMs(ts[ts.length - 1]);
  if (!startDate || !endDate) {
    return { ok: false, startDate: null, endDate: null, error: "could not derive YYYY-MM-DD" };
  }
  return { ok: true, startDate, endDate, minMs: ts[0], maxMs: ts[ts.length - 1] };
}

export function installLocalStorageShim() {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
  globalThis.window = globalThis;
  return store;
}

/**
 * @param {Record<string, unknown>} snapshot
 * @param {Map<string, string>} store
 */
export function loadSnapshotIntoLocalStorage(snapshot, store) {
  store.clear();
  for (const [k, v] of Object.entries(snapshot || {})) {
    store.set(k, typeof v === "string" ? v : JSON.stringify(v));
  }
}

/**
 * @param {object} baseReport — generateParentReportV2 output
 * @param {object|null} detailedReport — generateDetailedParentReport output
 * @param {{ scenarioId?: string }} [meta]
 */
export function extractNormalizedReportFacets(baseReport, detailedReport, meta = {}) {
  const base = baseReport || {};
  const detailed = detailedReport || {};
  const units = Array.isArray(base.diagnosticEngineV2?.units) ? base.diagnosticEngineV2.units : [];
  const exec = detailed.executiveSummary || {};
  const scenarioId = String(meta?.scenarioId || "").trim();

  const topicBucketKeys = [];
  for (const mapName of [
    "mathOperations",
    "geometryTopics",
    "englishTopics",
    "scienceTopics",
    "hebrewTopics",
    "moledetGeographyTopics",
  ]) {
    const m = base[mapName];
    if (!m || typeof m !== "object") continue;
    for (const rowKey of Object.keys(m)) {
      const topicPart = String(rowKey).split("\u0001")[0];
      if (topicPart) topicBucketKeys.push(topicPart);
    }
  }

  const unitSummaries = units.map((u) => {
    const alignCtx = {
      scenarioId,
      topicBucketKeys: topicBucketKeys.length ? topicBucketKeys : undefined,
    };
    const alignFields = buildFacetSkillAlignmentFields(u, alignCtx);
    return {
      subjectId: u.subjectId,
      displayName: u.displayName,
      priorityLevel: u?.priority?.level ?? null,
      diagnosisAllowed: !!u?.diagnosis?.allowed,
      patternHe: u?.taxonomy?.patternHe ?? null,
      diagnosisLineHe: u?.diagnosis?.lineHe ? String(u.diagnosis.lineHe).slice(0, 240) : null,
      canonicalAction: u?.canonicalState?.actionState ?? null,
      positiveAuthorityLevel: u?.canonicalState?.evidence?.positiveAuthorityLevel ?? null,
      evidenceQuestions: u?.canonicalState?.evidence?.questions ?? null,
      trendDirection: u?.trend?.accuracyDirection ?? null,
      trendEvidenceStatus: u?.trend?.trendEvidenceStatus ?? null,
      questionsFromTrace: u?.evidenceTrace?.find((e) => e?.type === "volume")?.value?.questions ?? null,
      conflictingConfidence: String(u?.confidence?.level || "").toLowerCase() === "contradictory",
      ...alignFields,
    };
  });

  const rowTrends = [];
  for (const mapName of ["mathOperations", "geometryTopics", "englishTopics", "scienceTopics", "hebrewTopics", "moledetGeographyTopics"]) {
    const m = base[mapName];
    if (!m || typeof m !== "object") continue;
    for (const [key, row] of Object.entries(m)) {
      const dir = row?.trend?.accuracyDirection;
      const st = row?.trend?.trendEvidenceStatus;
      if (dir && dir !== "unknown") {
        rowTrends.push({ map: mapName, key, accuracyDirection: dir, trendEvidenceStatus: st });
      }
    }
  }

  const subjects = Array.isArray(detailed.subjectProfiles) ? detailed.subjectProfiles : [];
  const topWeaknessLabels = [];
  const topicRecLabels = [];
  for (const sp of subjects) {
    for (const w of sp.topWeaknesses || []) {
      if (w?.labelHe) topWeaknessLabels.push(String(w.labelHe));
    }
    for (const tr of sp.topicRecommendations || []) {
      if (tr?.displayName) topicRecLabels.push(String(tr.displayName));
      if (tr?.labelHe) topicRecLabels.push(String(tr.labelHe));
    }
  }

  const contract = detailed.parentProductContractV1 || null;

  return {
    version: "report-facets-v1",
    summary: {
      totalQuestions: base.summary?.totalQuestions ?? null,
      overallAccuracy: base.summary?.overallAccuracy ?? null,
      totalTimeMinutes: base.summary?.totalTimeMinutes ?? null,
    },
    diagnostic: {
      unitCount: units.length,
      p4Count: units.filter((u) => String(u?.priority?.level || "") === "P4").length,
      diagnosedCount: units.filter((u) => u?.diagnosis?.allowed).length,
      contradictoryConfidenceCount: units.filter(
        (u) => String(u?.confidence?.level || "").toLowerCase() === "contradictory"
      ).length,
      unitSummaries,
    },
    analysisPreview: {
      needsPracticeLines: Array.isArray(base.analysis?.needsPractice) ? base.analysis.needsPractice : [],
    },
    executive: {
      windowTotalQuestions: exec.windowTotalQuestions ?? null,
      topFocusAreasHe: exec.topFocusAreasHe ?? [],
      topStrengthsAcrossHe: exec.topStrengthsAcrossHe ?? [],
      dominantCrossSubjectRiskLabelHe: exec.dominantCrossSubjectRiskLabelHe ?? "",
      dominantCrossSubjectSuccessPatternLabelHe: exec.dominantCrossSubjectSuccessPatternLabelHe ?? "",
      cautionNoteHe: exec.cautionNoteHe ?? "",
      overallConfidenceHe: exec.overallConfidenceHe ?? "",
      reportReadinessHe: exec.reportReadinessHe ?? "",
      majorTrendsHe: exec.majorTrendsHe ?? [],
    },
    crossSubject: detailed.crossSubjectInsights || null,
    rowTrends,
    topicLayer: {
      topWeaknessLabels,
      topicRecLabels,
      topicBucketKeys,
    },
    contract: contract
      ? {
          primarySubjectId: contract.primarySubjectId,
          topEvidenceQuestionCount: contract.top?.evidence?.questionCount ?? null,
          topThinDowngraded: !!contract.top?.evidence?.thinEvidenceDowngraded,
          topConfidenceHe: contract.top?.confidenceHe ?? "",
          topMainStatusHe: contract.top?.mainStatusHe ?? "",
        }
      : null,
    dataIntegrity: base.dataIntegrityReport ?? null,
  };
}

/**
 * Flatten Hebrew / English searchable text (assertion fallback / mustNotMention).
 */
export function buildAssertionCorpus(facets, baseReport, detailedReport) {
  const parts = [];
  const push = (x) => {
    if (x == null) return;
    if (Array.isArray(x)) {
      for (const y of x) push(y);
    } else if (typeof x === "string" && x.trim()) parts.push(x);
  };

  if (facets?.executive) {
    push(Object.values(facets.executive).flat());
  }
  if (facets?.diagnostic?.unitSummaries) {
    for (const u of facets.diagnostic.unitSummaries) {
      push([u.displayName, u.patternHe, u.diagnosisLineHe]);
    }
  }
  push(facets?.topicLayer?.topWeaknessLabels);
  push(facets?.topicLayer?.topicRecLabels);
  push(facets?.topicLayer?.topicBucketKeys);
  push(facets?.analysisPreview?.needsPracticeLines);
  if (facets?.contract) {
    push([facets.contract.topConfidenceHe, facets.contract.topMainStatusHe]);
  }

  const d = detailedReport || {};
  push(d.homePlan?.itemsHe);
  push(d.nextPeriodGoals?.itemsHe);

  const di = baseReport?.summary?.diagnosticOverviewHe;
  if (di && typeof di === "object") {
    push(Object.values(di).flat());
  }

  return parts
    .join("\n")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * parent-report-v2 clamps custom endDate to Date.now(); simulated anchors may be "in the future"
 * relative to the host clock — shift the clock forward only for this harness call (no product change).
 */
function runWithMinimumClock(minNowMs, fn) {
  const RealDate = Date;
  const floor = Math.max(Number(minNowMs) || 0, RealDate.now());
  class ShimDate extends RealDate {
    constructor(...args) {
      if (args.length === 0) super(floor);
      else super(...args);
    }
    static now() {
      return floor;
    }
  }
  ShimDate.parse = RealDate.parse;
  ShimDate.UTC = RealDate.UTC;

  const prev = globalThis.Date;
  globalThis.Date = ShimDate;
  try {
    return fn();
  } finally {
    globalThis.Date = prev;
  }
}

/**
 * @param {{ storage: Record<string, unknown>, scenario?: object }} opts
 * @returns {Promise<{ ok: boolean, error?: string, playerName: string, period: object, baseReport: object, detailedReport: object|null, facets: object, corpus: string }>}
 */
export async function buildReportsFromAggregateStorage(opts) {
  const storage = opts.storage || {};
  const playerName = String(storage.mleo_player_name || opts.scenario?.scenarioId || "Sim:unknown");

  const periodInfo = deriveCustomPeriodFromStorage(storage);
  if (!periodInfo.ok) {
    return {
      ok: false,
      error: periodInfo.error || "period derivation failed",
      playerName,
      period: null,
      baseReport: null,
      detailedReport: null,
      facets: null,
      corpus: "",
    };
  }

  const store = installLocalStorageShim();
  loadSnapshotIntoLocalStorage(storage, store);

  const detailedUrl = pathToFileURL(join(ROOT, "utils", "detailed-parent-report.js")).href;
  const { buildDetailedParentReportFromBaseReport } = await import(detailedUrl);
  const v2Url = pathToFileURL(join(ROOT, "utils", "parent-report-v2.js")).href;
  const { generateParentReportV2 } = await import(v2Url);

  const clockFloorMs = Math.max(Number(periodInfo.maxMs) || 0, Date.now()) + 24 * 60 * 60 * 1000;

  const baseReport = runWithMinimumClock(clockFloorMs, () =>
    generateParentReportV2(playerName, "custom", periodInfo.startDate, periodInfo.endDate)
  );
  const detailedReport = baseReport
    ? buildDetailedParentReportFromBaseReport(baseReport, { playerName, period: "custom" })
    : null;

  if (!baseReport || !detailedReport) {
    return {
      ok: false,
      error: "report builders returned null",
      playerName,
      period: periodInfo,
      baseReport,
      detailedReport,
      facets: null,
      corpus: "",
    };
  }

  const facets = extractNormalizedReportFacets(baseReport, detailedReport, {
    scenarioId: String(opts.scenario?.scenarioId || opts.scenario?.id || "").trim(),
  });
  const corpus = buildAssertionCorpus(facets, baseReport, detailedReport);

  return {
    ok: true,
    playerName,
    period: { mode: "custom", ...periodInfo },
    baseReport,
    detailedReport,
    facets,
    corpus,
  };
}

/**
 * Session-level accuracy trend from aggregate storage (simulator ground truth for oracle checks).
 * @param {Record<string, unknown>} storage
 */
export function collectSessionsFromStorageSnapshot(storage) {
  const out = [];
  const push = (sessions) => {
    for (const s of sessions || []) {
      const tot = Number(s.total);
      const cor = Number(s.correct);
      if (!Number.isFinite(tot) || tot <= 0 || !Number.isFinite(cor)) continue;
      const acc = cor / tot;
      const t = Number.isFinite(Number(s.timestamp))
        ? Number(s.timestamp)
        : new Date(String(s.date || "")).getTime();
      if (!Number.isFinite(t)) continue;
      out.push({ t, acc });
    }
  };
  for (const b of Object.values(storage?.mleo_time_tracking?.operations || {})) push(b?.sessions);
  for (const tk of [
    "mleo_geometry_time_tracking",
    "mleo_english_time_tracking",
    "mleo_science_time_tracking",
    "mleo_hebrew_time_tracking",
    "mleo_moledet_geography_time_tracking",
  ]) {
    for (const b of Object.values(storage[tk]?.topics || {})) push(b?.sessions);
  }
  return out.sort((a, b) => a.t - b.t);
}

/**
 * @param {{ t: number, acc: number }[]} rows
 */
export function accuracyTrendDirectionFromSessions(rows) {
  if (rows.length < 8) return { direction: "insufficient", earlyMean: null, lateMean: null, n: rows.length };
  const n = rows.length;
  const earlyN = Math.max(2, Math.ceil(n * 0.33));
  const lateN = Math.max(2, Math.ceil(n * 0.33));
  const early = rows.slice(0, earlyN);
  const late = rows.slice(Math.max(0, n - lateN));
  const mean = (arr) => arr.reduce((a, x) => a + x.acc, 0) / arr.length;
  const earlyMean = mean(early);
  const lateMean = mean(late);
  const delta = lateMean - earlyMean;
  let direction = "flat";
  if (delta > 0.035) direction = "up";
  else if (delta < -0.035) direction = "down";
  return { direction, earlyMean, lateMean, n: rows.length, delta };
}
