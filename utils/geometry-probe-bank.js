import {
  GEOMETRY_CONCEPTUAL_ITEMS,
  renderGeometryConceptualRowToQuestion,
} from "./geometry-conceptual-bank.js";
import { bankQuestionProbeMatch } from "./active-diagnostic-runtime/probe-match.js";
import { itemAllowedForGrade } from "./grade-gating.js";

/**
 * @param {Record<string, unknown>} row
 */
export function geometryConceptualRowId(row) {
  const pf = String(row.patternFamily || "?");
  const st = String(row.subtype || "?");
  const q = String(row.question || "").slice(0, 48);
  return `${pf}|${st}|${q}`;
}

/**
 * @param {object} p
 * @param {import("./active-diagnostic-runtime/build-pending-probe.js").PendingDiagnosticProbe|null} p.pendingProbe
 * @param {string} p.gradeKey
 * @param {string} p.levelKey
 * @param {string} p.topic
 * @param {Set<string>|string[]} p.recentIds
 * @param {() => number} [p.randomFn]
 */
export function pickGeometryProbeConceptual({
  pendingProbe,
  gradeKey,
  levelKey,
  topic,
  recentIds,
  randomFn = Math.random,
}) {
  const pb = pendingProbe;
  if (!pb || String(pb.subjectId || "") !== "geometry") {
    return { row: null, reason: "no_probe" };
  }
  const recentSet =
    recentIds instanceof Set ? recentIds : new Set(Array.isArray(recentIds) ? recentIds : []);

  const wantType = String(pb.suggestedQuestionType || "");

  /** @type {{ row: Record<string, unknown>, score: number }[]} */
  const ranked = [];
  for (const row of GEOMETRY_CONCEPTUAL_ITEMS) {
    if (!row.topics || !row.topics.includes(topic)) continue;
    if (!itemAllowedForGrade(row, gradeKey)) continue;
    if (row.levels && !row.levels.includes(levelKey)) continue;

    const rowSuggested =
      row.suggestedQuestionType != null
        ? String(row.suggestedQuestionType)
        : "";

    const synthetic = {
      id: geometryConceptualRowId(row),
      topic,
      params: {
        patternFamily: row.patternFamily,
        conceptTag: row.conceptTag,
        subtype: row.subtype,
        diagnosticSkillId: row.diagnosticSkillId,
        expectedErrorTags: row.expectedErrorTags,
        suggestedQuestionType: rowSuggested || undefined,
      },
      patternFamily: row.patternFamily,
      conceptTag: row.conceptTag,
      expectedErrorTags: row.expectedErrorTags,
    };
    const m = bankQuestionProbeMatch(synthetic, pb);
    let score = 0;
    if (m.matches) score = 2;
    else if (wantType && rowSuggested === wantType) score = 1;
    if (score === 0) continue;
    ranked.push({ row, score });
  }

  ranked.sort((a, b) => b.score - a.score);
  const topScore = ranked[0]?.score ?? 0;
  const candidates = ranked.filter((x) => x.score === topScore).map((x) => x.row);

  if (candidates.length === 0) {
    return { row: null, reason: "fallback_no_match" };
  }

  let pool = candidates.filter((r) => !recentSet.has(geometryConceptualRowId(r)));
  if (pool.length === 0) pool = candidates;

  const idx = Math.floor(randomFn() * pool.length);
  return { row: pool[idx], reason: "matched_probe_row" };
}

/**
 * Build finalized lesson question shape from conceptual row (same as pickGeometryConceptualQuestion output).
 * @param {Record<string, unknown>} row
 * @param {{ gradeKey: string, levelKey: string, topic: string }} ctx
 */
export function buildGeometryConceptQuestionFromRow(row, ctx) {
  const base = renderGeometryConceptualRowToQuestion(row, ctx);
  return {
    ...base,
    params: {
      ...base.params,
      _geometryProbeRowId: geometryConceptualRowId(row),
    },
  };
}
