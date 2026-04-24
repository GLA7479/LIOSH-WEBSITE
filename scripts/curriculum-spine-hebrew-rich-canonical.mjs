/**
 * Phase 7.11 — Hebrew rich-bank rows for curriculum spine (data/build only).
 * Truth: utils/hebrew-rich-question-bank.js HEBREW_RICH_POOL (topic, patternFamily, subtype,
 * minGrade/maxGrade and/or gradeBand) aligned to utils/grade-gating.js band semantics (early/mid/late).
 * Links to content-map skills by topic + overlapping grade span (data/hebrew-g*-content-map.js).
 */

export const HEBREW_RICH_SPINE_SOURCE =
  "utils/hebrew-rich-question-bank.js HEBREW_RICH_POOL; gradeBand → grades via utils/grade-gating.js (early=g1–g2, mid=g3–g4, late=g5–g6); links overlap data/hebrew-g*-content-map.js spine rows";

/** Matches `gradeBandForKey` / `itemAllowedForGrade` band semantics. */
const BAND_TO_GRADES = {
  early: [1, 2],
  mid: [3, 4],
  late: [5, 6],
};

function clampGrade(n) {
  const x = Number(n);
  if (Number.isNaN(x)) return null;
  return Math.min(6, Math.max(1, x));
}

/**
 * @param {Record<string, unknown>} row
 * @returns {{ minGrade: number, maxGrade: number } | null}
 */
export function gradeSpanFromRichRow(row) {
  const lo0 = row?.minGrade;
  const hi0 = row?.maxGrade;
  if (lo0 != null && hi0 != null) {
    const lo = clampGrade(lo0);
    const hi = clampGrade(hi0);
    if (lo == null || hi == null) return null;
    if (lo > hi) return null;
    return { minGrade: lo, maxGrade: hi };
  }
  const band = row?.gradeBand;
  if (band === "early" || band === "mid" || band === "late") {
    const arr = BAND_TO_GRADES[band];
    return { minGrade: arr[0], maxGrade: arr[1] };
  }
  return null;
}

/**
 * @param {string} topic
 * @param {number} minG
 * @param {number} maxG
 * @param {Array<{ skill_id: string, topic: string, minGrade: number, maxGrade: number }>} contentRows
 */
function linkedContentMapSkillIds(topic, minG, maxG, contentRows) {
  const out = [];
  for (const r of contentRows) {
    if (r.topic !== topic) continue;
    if (r.minGrade <= maxG && r.maxGrade >= minG) out.push(r.skill_id);
  }
  return out;
}

/**
 * @param {Array<Record<string, unknown>>} richPool
 * @param {Array<{ skill_id: string, topic: string, minGrade: number, maxGrade: number }>} hebrewContentMapRows
 * @param {{ slug: (s: string) => string, cognitiveForGrade: (g: number) => string }} opts
 */
export function deriveHebrewRichBankSpine(richPool, hebrewContentMapRows, opts) {
  const { slug, cognitiveForGrade } = opts;
  /** @type {Map<string, { topic: string, patternFamily: string, subtype: string, grades: Set<number>, poolIndexes: number[] }>} */
  const buckets = new Map();
  const unmapped = [];
  const topicsInPool = new Set();

  for (let i = 0; i < richPool.length; i++) {
    const row = richPool[i];
    const topic = typeof row?.topic === "string" ? row.topic : "";
    if (!topic) {
      unmapped.push({ poolIndex: i, reason: "missing_topic" });
      continue;
    }
    topicsInPool.add(topic);
    const span = gradeSpanFromRichRow(row);
    if (!span) {
      unmapped.push({ poolIndex: i, topic, reason: "no_min_max_and_no_gradeBand" });
      continue;
    }
    const pf = String(row?.patternFamily ?? "").trim() || "unknown_pattern";
    const st = String(row?.subtype ?? "").trim() || "unknown_subtype";
    const key = `${topic}\0${pf}\0${st}`;
    if (!buckets.has(key)) {
      buckets.set(key, {
        topic,
        patternFamily: pf,
        subtype: st,
        grades: new Set(),
        poolIndexes: [],
      });
    }
    const b = buckets.get(key);
    b.poolIndexes.push(i);
    for (let g = span.minGrade; g <= span.maxGrade; g++) b.grades.add(g);
  }

  const topicsInContentMaps = new Set(hebrewContentMapRows.map((r) => r.topic));
  const orphanTopics = [...topicsInPool].filter((t) => !topicsInContentMaps.has(t));

  const extraGaps = [];
  if (unmapped.length) {
    extraGaps.push({
      severity: "important",
      subject: "hebrew",
      note: "Some HEBREW_RICH_POOL rows could not be mapped to a grade span (need minGrade+maxGrade or gradeBand early|mid|late).",
      unmapped_rich_pool_rows: unmapped,
    });
  }
  if (orphanTopics.length) {
    extraGaps.push({
      severity: "important",
      subject: "hebrew",
      note: "Rich-bank topic keys not present as content-map topic keys in any Hebrew grade map.",
      orphan_topics: orphanTopics,
    });
  }

  const skills = [];
  const sortedKeys = [...buckets.keys()].sort();

  for (const key of sortedKeys) {
    const b = buckets.get(key);
    const nums = [...b.grades].sort((x, y) => x - y);
    const minGrade = nums[0];
    const maxGrade = nums[nums.length - 1];
    const partPf = slug(b.patternFamily);
    const partSt = slug(b.subtype);
    const skill_id = `hebrew:rich:${b.topic}:${partPf}:${partSt}`.slice(0, 120);
    const linked_skill_ids = linkedContentMapSkillIds(b.topic, minGrade, maxGrade, hebrewContentMapRows);

    if (!linked_skill_ids.length) {
      extraGaps.push({
        severity: "important",
        subject: "hebrew",
        skill_id,
        note: `Rich-bank bucket "${b.topic}" / ${b.patternFamily} / ${b.subtype} has grades ${minGrade}–${maxGrade} but no overlapping Hebrew content-map skills were found (topic mismatch or empty maps).`,
      });
    }

    skills.push({
      schema_version: 1,
      skill_id,
      subject: "hebrew",
      topic: b.topic,
      subtopic: `rich:${partPf}:${partSt}`,
      minGrade,
      maxGrade,
      cognitive_level: cognitiveForGrade(maxGrade),
      description: `Hebrew rich-bank coverage: topic "${b.topic}", patternFamily "${b.patternFamily}", subtype "${b.subtype}"; ${b.poolIndexes.length} pool row(s); grades ${minGrade}–${maxGrade} (Phase 7.11).`,
      source: HEBREW_RICH_SPINE_SOURCE,
      spine_layer: "rich_bank",
      linked_skill_ids,
    });
  }

  return {
    skills,
    extraGaps,
    mappedPoolItemCount: richPool.length - unmapped.length,
    unmappedRichPoolRows: unmapped,
    richBucketCount: skills.length,
  };
}

export function countHebrewContentMapRows(hebrewMaps) {
  let n = 0;
  for (const [, cmap] of hebrewMaps) {
    for (const block of Object.values(cmap)) {
      const list = block?.subtopics;
      if (!Array.isArray(list)) continue;
      n += list.length;
    }
  }
  return n;
}
