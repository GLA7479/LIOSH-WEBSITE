/**
 * Hebrew subtopic coverage audit — static counts + narrow fallback simulation.
 * Run: node scripts/hebrew-subtopic-coverage-audit.mjs
 */
const { filterRichHebrewPool } = await import(
  new URL("../utils/hebrew-rich-question-bank.js", import.meta.url).href
);
const { HEBREW_LEGACY_QUESTIONS_SNAPSHOT } = await import(
  new URL("../utils/hebrew-question-generator.js", import.meta.url).href
);
const { HEBREW_G1_CONTENT_MAP } = await import(
  new URL("../data/hebrew-g1-content-map.js", import.meta.url).href
);
const { HEBREW_G2_CONTENT_MAP } = await import(
  new URL("../data/hebrew-g2-content-map.js", import.meta.url).href
);
const { HEBREW_G3_CONTENT_MAP } = await import(
  new URL("../data/hebrew-g3-content-map.js", import.meta.url).href
);
const { HEBREW_G4_CONTENT_MAP } = await import(
  new URL("../data/hebrew-g4-content-map.js", import.meta.url).href
);
const { HEBREW_G5_CONTENT_MAP } = await import(
  new URL("../data/hebrew-g5-content-map.js", import.meta.url).href
);
const { HEBREW_G6_CONTENT_MAP } = await import(
  new URL("../data/hebrew-g6-content-map.js", import.meta.url).href
);
const g1 = await import(new URL("../utils/hebrew-g1-subtopic.js", import.meta.url).href);
const g2 = await import(new URL("../utils/hebrew-g2-subtopic.js", import.meta.url).href);
const gUp = await import(new URL("../utils/hebrew-g3456-subtopic.js", import.meta.url).href);

const TOPICS = ["reading", "comprehension", "writing", "grammar", "vocabulary", "speaking"];
const LEVELS = ["easy", "medium", "hard"];
const GRADES = ["g1", "g2", "g3", "g4", "g5", "g6"];

const MAPS = {
  g1: HEBREW_G1_CONTENT_MAP,
  g2: HEBREW_G2_CONTENT_MAP,
  g3: HEBREW_G3_CONTENT_MAP,
  g4: HEBREW_G4_CONTENT_MAP,
  g5: HEBREW_G5_CONTENT_MAP,
  g6: HEBREW_G6_CONTENT_MAP,
};

function mergeTopicPools(gradeKey, levelKey, topic, legacyList) {
  const richRows = filterRichHebrewPool(gradeKey, levelKey, topic);
  const fromRich = richRows.map(
    ({ grades: _g, gradeBand: _gb, allowedLevels: _al, levels: _l, topic: _tp, ...rest }) => ({
      ...rest,
      _fromRich: true,
    })
  );
  const base = Array.isArray(legacyList) ? [...legacyList] : [];
  return base.concat(fromRich);
}

function getLegacyList(gradeKey, levelKey, topic) {
  const key = `${String(gradeKey).toUpperCase()}_${String(levelKey).toUpperCase()}_QUESTIONS`;
  const pool = HEBREW_LEGACY_QUESTIONS_SNAPSHOT[key];
  if (!pool) return [];
  return pool[topic] || pool.reading || [];
}

function resolveRow(gradeKey, row, topicKey) {
  const g = String(gradeKey).toLowerCase();
  if (g === "g1") return g1.resolveG1ItemSubtopicId(row, topicKey);
  if (g === "g2") return g2.resolveG2ItemSubtopicId(row, topicKey);
  return gUp.resolveUpperGradeItemSubtopicId(g, row, topicKey);
}

function narrowLikeRuntime(gradeKey, merged, topicKey, pickedId) {
  const g = String(gradeKey).toLowerCase();
  if (g === "g1") return g1.narrowHebrewG1Pool(merged, topicKey, pickedId);
  if (g === "g2") return g2.narrowHebrewG2Pool(merged, topicKey, pickedId);
  return gUp.narrowHebrewUpperGradePool(g, merged, topicKey, pickedId);
}

function pickRandomSubtopicId(gradeKey, topicKey) {
  const map = MAPS[String(gradeKey).toLowerCase()];
  const list = map[topicKey]?.subtopics;
  if (!list?.length) return null;
  const total = list.reduce((s, x) => s + (Number(x.weight) > 0 ? Number(x.weight) : 1), 0);
  let r = Math.random() * total;
  for (const s of list) {
    const w = Number(s.weight) > 0 ? Number(s.weight) : 1;
    r -= w;
    if (r <= 0) return s.id;
  }
  return list[list.length - 1].id;
}

function auditGrade(gradeKey) {
  const out = { gradeKey, topics: {} };
  for (const topic of TOPICS) {
    const bySub = {};
    let explicit = 0;
    let inferred = 0;
    let totalRows = 0;
    const mergedByLevel = {};
    for (const lv of LEVELS) {
      const legacy = getLegacyList(gradeKey, lv, topic);
      mergedByLevel[lv] = mergeTopicPools(gradeKey, lv, topic, legacy);
    }
    const mergedUnion = [];
    const seen = new Set();
    for (const lv of LEVELS) {
      for (const row of mergedByLevel[lv]) {
        const q = String(row.question || "");
        const dedupe = `${lv}|${q}`;
        if (seen.has(dedupe)) continue;
        seen.add(dedupe);
        mergedUnion.push({ ...row, _lv: lv });
      }
    }
    for (const row of mergedUnion) {
      totalRows++;
      const sid = resolveRow(gradeKey, row, topic);
      bySub[sid] = (bySub[sid] || 0) + 1;
      const pref = `${String(gradeKey).toLowerCase()}.`;
      const hasExplicit =
        row.subtopicId != null && String(row.subtopicId).trim().startsWith(pref);
      if (hasExplicit) explicit++;
      else inferred++;
    }
    let simFallbacks = 0;
    const sims = 3000;
    const mergedEasy = mergedByLevel.easy;
    if (mergedEasy.length) {
      for (let i = 0; i < sims; i++) {
        const picked = pickRandomSubtopicId(gradeKey, topic);
        const narrowed = narrowLikeRuntime(gradeKey, mergedEasy, topic, picked);
        if (narrowed === mergedEasy) simFallbacks++;
      }
    }
    out.topics[topic] = {
      totalUniqueRows: mergedUnion.length,
      explicitTagged: explicit,
      inferredTagged: inferred,
      bySubtopic: bySub,
      narrowFallbackRateEasy: mergedEasy.length ? simFallbacks / sims : null,
    };
  }
  return out;
}

const report = {};
for (const g of GRADES) {
  report[g] = auditGrade(g);
}

const mapSubtopicIds = (gradeKey) => {
  const m = MAPS[gradeKey];
  const ids = new Set();
  for (const t of TOPICS) {
    for (const s of m[t]?.subtopics || []) ids.add(s.id);
  }
  return ids;
};

console.log(JSON.stringify({ report, zeroCoverage: summarizeZeros(report) }, null, 2));

function summarizeZeros(rep) {
  const issues = [];
  for (const g of GRADES) {
    const want = mapSubtopicIds(g);
    const have = new Set();
    for (const topic of TOPICS) {
      for (const k of Object.keys(rep[g].topics[topic].bySubtopic || {})) {
        if (rep[g].topics[topic].bySubtopic[k] > 0) have.add(k);
      }
    }
    for (const id of want) {
      if (!have.has(id)) issues.push({ grade: g, subtopicId: id, problem: "zero_resolved_rows_across_levels_union" });
    }
  }
  return issues;
}
