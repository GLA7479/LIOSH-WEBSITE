/**
 * Extract parent-visible Hebrew / narrative strings from report JSON artifacts.
 * Does not traverse raw mistake blobs or deep engine diagnostics (configurable).
 */

const HEBREW_CHAR = /[\u0590-\u05FF]/;

/** Subtrees to skip entirely (raw/internal). */
/** Path fragments — if present in dot-path, string is treated as internal / non-parent-surface. */
export const DEFAULT_DENY_PATH_SEGMENTS = [
  "allItems",
  "topicEngineRowSignals",
  "decisionTrace",
  "mistakes",
  "rawMistakesBySubject",
  "trackingSnapshots",
  "diagnosticEngineV2",
  "hybridRuntime",
  "evidenceTrace",
];

const SKIP_PATH_SEGMENTS = new Set([
  "mistakes",
  "rawMistakesBySubject",
  "trackingSnapshots",
  "dailyActivity",
  "evidenceTrace",
  "diagnosticEngineV2",
  "hybridRuntime",
  "dataIntegrityReport",
  "corpusStats",
  "storageInputPath",
  "metaInputPath",
  "pdfPath",
  "pdfFailureReason",
  "sourceArtifact",
  "blueprintRef",
  "engineVersion",
  "generatedAt",
  "competingHypotheses",
  "recurrence",
  "priority",
  "professionalEngineOutputV1",
  "allItems",
  "topicEngineRowSignals",
  "decisionTrace",
]);

/**
 * @param {string} path
 * @param {string[]} denySegments
 */
export function pathMatchesDeniedSegment(path, denySegments) {
  const p = String(path || "");
  for (const seg of denySegments) {
    if (!seg) continue;
    if (p.includes(`.${seg}.`) || p.includes(`.${seg}[`) || p.endsWith(`.${seg}`) || p.startsWith(`${seg}.`)) {
      return true;
    }
  }
  return false;
}

/**
 * @param {string} key — last path segment without array index
 * @param {string} path dot path
 */
function keyAllowsParentNarrative(key, path) {
  if (SKIP_PATH_SEGMENTS.has(key)) return false;
  if (key.endsWith("He")) return true;
  if (key === "needsPracticeLines") return true;
  if (
    key === "displayName" &&
    /(Topics|Operations|hebrewTopics|mathOperations|geometryTopics|englishTopics|scienceTopics|moledetGeographyTopics)/.test(path)
  ) {
    return true;
  }
  return false;
}

/**
 * @param {string} s
 */
function isProbablyIsoDate(s) {
  return /^\d{4}-\d{2}-\d{2}T/.test(s) || /^\d{4}-\d{2}-\d{2}$/.test(s);
}

/**
 * @param {string} s
 * @param {string} key
 */
function shouldKeepStringValue(s, key) {
  const t = String(s).trim();
  if (t.length < 2) return false;
  if (isProbablyIsoDate(t)) return false;
  if (/^(true|false|null)$/i.test(t)) return false;
  if (/^-?\d+(\.\d+)?$/.test(t)) return false;
  if (/^(insufficient_data|contradictory|P[1-4]|advance_ok|maintain|monitor)$/i.test(t)) return false;
  // Prefer Hebrew prose for parent surfaces; allow longer Latin-only cautiously (URLs unlikely < 2 in reports)
  if (!HEBREW_CHAR.test(t) && key.endsWith("He")) {
    return t.length >= 8 && /\s/.test(t);
  }
  return HEBREW_CHAR.test(t);
}

/**
 * @typedef {object} ParentVisibleNarrative
 * @property {string} id
 * @property {string} path
 * @property {string} text
 * @property {{ subject?: string, skillId?: string, source?: string }} context
 */

/**
 * @param {unknown} value
 * @param {string} path
 * @param {{ subject?: string, skillId?: string, source?: string }} ctx
 * @param {Map<string, ParentVisibleNarrative>} out
 * @param {{ dedupeText?: boolean, denyPathSegments?: string[] }} opts
 */
function walk(value, path, ctx, out, opts) {
  if (value == null) return;

  if (typeof value === "string") {
    const deny = opts.denyPathSegments || DEFAULT_DENY_PATH_SEGMENTS;
    if (pathMatchesDeniedSegment(path, deny)) return;

    const rawSeg = path.split(".").pop() || "";
    const keySeg = rawSeg.replace(/\[\d+\]$/, "");
    if (!keyAllowsParentNarrative(keySeg, path)) return;
    if (!shouldKeepStringValue(value, keySeg)) return;
    const heKey = keySeg.endsWith("He");
    if (!HEBREW_CHAR.test(value) && !heKey) return;

    const id = path.replace(/[^\w\-[\].]/g, "_").slice(0, 200);
    const dedupeKey = opts.dedupeText !== false ? String(value).trim() : id;
    if (opts.dedupeText !== false && out.has(`txt:${dedupeKey}`)) return;

    /** @type {ParentVisibleNarrative} */
    const row = {
      id,
      path,
      text: String(value).trim(),
      context: { ...ctx },
    };
    out.set(`txt:${dedupeKey}`, row);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, i) => walk(item, `${path}[${i}]`, ctx, out, opts));
    return;
  }

  if (typeof value === "object") {
    const o = /** @type {Record<string, unknown>} */ (value);
    let inherited = ctx;
    if (typeof o.subjectId === "string") inherited = { ...inherited, subject: String(o.subjectId) };
    if (typeof o.skillId === "string") inherited = { ...inherited, skillId: String(o.skillId) };

    for (const [k, v] of Object.entries(o)) {
      const nextPath = path ? `${path}.${k}` : k;

      if (SKIP_PATH_SEGMENTS.has(k)) {
        continue;
      }

      walk(v, nextPath, inherited, out, opts);
    }
  }
}

/**
 * @typedef {object} ExtractParentNarrativesOptions
 * @property {string} [source] — label for context.source
 * @property {boolean} [dedupeText] — default true
 * @property {string[]} [denyPathSegments] — defaults to {@link DEFAULT_DENY_PATH_SEGMENTS}
 */

/**
 * Collect parent-visible narrative strings from a report object or artifact wrapper.
 *
 * @param {unknown} reportObject
 * @param {ExtractParentNarrativesOptions} [options]
 * @returns {ParentVisibleNarrative[]}
 */
export function extractParentVisibleNarratives(reportObject, options = {}) {
  const source = options.source || "unknown";
  const dedupeText = options.dedupeText !== false;
  const ctxBase = { source };

  /** @type {Map<string, ParentVisibleNarrative>} */
  const map = new Map();
  walk(reportObject, "", ctxBase, map, {
    dedupeText,
    denyPathSegments: options.denyPathSegments ?? DEFAULT_DENY_PATH_SEGMENTS,
  });

  const list = [...map.values()].map((n) => ({
    ...n,
    context: { ...n.context, source },
  }));

  list.sort((a, b) => a.path.localeCompare(b.path));
  return list;
}

/**
 * Inline self-tests for extractor (no dependency on test runner).
 * @returns {{ ok: boolean, failures: string[] }}
 */
export function runParentReportTextExtractorInlineTests() {
  /** @type {string[]} */
  const failures = [];

  const nested = {
    summary: {
      diagnosticOverviewHe: {
        strongestAreaLineHe: "תוצאות טובות יחסית בתרגול בסיסי",
        mainFocusAreaLineHe: null,
      },
      needsPracticeLines: ["עברית: הבנה"],
    },
    internalDebug: { taxonomyId: "X-1", snapshotHash: "abc" },
    mistakes: [{ stem: "שאלה סודית" }],
  };

  const ext = extractParentVisibleNarratives(nested, { source: "test_nested", dedupeText: true });
  if (!ext.some((x) => x.text.includes("תוצאות טובות"))) failures.push("nested: missed Hebrew He field");
  if (ext.some((x) => x.path.includes("mistakes"))) failures.push("nested: should skip mistakes subtree");
  if (ext.some((x) => x.text.includes("סודית"))) failures.push("nested: leaked mistake stem");

  const dup = {
    a: { lineHe: "טקסט זהה" },
    b: { lineHe: "טקסט זהה" },
  };
  const extDup = extractParentVisibleNarratives(dup, { source: "dup", dedupeText: true });
  if (extDup.filter((x) => x.text === "טקסט זהה").length !== 1) failures.push("dedupe: expected one row");

  const extNoDedupe = extractParentVisibleNarratives(dup, { source: "dup", dedupeText: false });
  if (extNoDedupe.filter((x) => x.text === "טקסט זהה").length !== 2) failures.push("no dedupe: expected two rows");

  const empty = extractParentVisibleNarratives({}, { source: "empty" });
  if (empty.length !== 0) failures.push("empty object should yield 0");

  const tech = { fooKey: "insufficient_data", barHe: "   " };
  const extTech = extractParentVisibleNarratives(tech, { source: "tech" });
  if (extTech.some((x) => x.text === "insufficient_data")) failures.push("filtered enum leak");

  const subjects = {
    subjectsArr: [
      { subjectId: "math", summaryLineHe: "קו תקציב חזק" },
      { subjectId: "hebrew", summaryLineHe: "קו תקציב חזק" },
    ],
  };
  const extArr = extractParentVisibleNarratives(subjects, { source: "arrays", dedupeText: false });
  if (!extArr.every((x) => x.context.subject)) failures.push("subject propagation");

  return { ok: failures.length === 0, failures };
}
