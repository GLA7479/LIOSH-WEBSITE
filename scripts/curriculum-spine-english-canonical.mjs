/**
 * Phase 7.12 — unified English spine rows (curriculum topic access + merged prose + pools with linkage).
 * Truth: data/english-curriculum.js ENGLISH_GRADES; pool ranges from utils/grade-gating.js.
 */

export const ENGLISH_UNIFIED_SOURCE_CURRICULUM = "data/english-curriculum.js ENGLISH_GRADES";
export const ENGLISH_UNIFIED_SOURCE_POOLS =
  "utils/grade-gating.js ENGLISH_GRAMMAR_POOL_RANGE, ENGLISH_TRANSLATION_POOL_RANGE, ENGLISH_SENTENCE_POOL_RANGE";

function topicAccessSkillId(gk, topic) {
  return `english:${gk}:topic:${topic}`;
}

/**
 * Pool rows that overlap grade `g` and whose UI topic exists on that grade in curriculum.
 */
function poolSkillIdsForGradeTopic(gradeNum, topic, poolDescriptors) {
  const gk = `g${gradeNum}`;
  const out = [];
  for (const p of poolDescriptors) {
    if (p.topic !== topic) continue;
    if (gradeNum < p.minGrade || gradeNum > p.maxGrade) continue;
    out.push(p.skill_id);
  }
  return out;
}

function topicAccessRowsForPool(p, ENGLISH_GRADES) {
  const topic = p.topic;
  const linked = [];
  for (let g = p.minGrade; g <= p.maxGrade; g++) {
    const gk = `g${g}`;
    const row = ENGLISH_GRADES[gk];
    if (!row?.topics?.includes(topic)) continue;
    linked.push(topicAccessSkillId(gk, topic));
  }
  return linked;
}

function buildPoolDescriptors(ENGLISH_GRAMMAR_POOL_RANGE, ENGLISH_TRANSLATION_POOL_RANGE, ENGLISH_SENTENCE_POOL_RANGE) {
  /** @type {Array<{ skill_id: string, category: string, topic: string, poolKey: string, minGrade: number, maxGrade: number }>} */
  const list = [];
  for (const [poolKey, range] of Object.entries(ENGLISH_GRAMMAR_POOL_RANGE || {})) {
    list.push({
      skill_id: `english:pool:grammar:${poolKey}`,
      category: "grammar",
      topic: "grammar",
      poolKey,
      minGrade: range.minGrade,
      maxGrade: range.maxGrade,
    });
  }
  for (const [poolKey, range] of Object.entries(ENGLISH_TRANSLATION_POOL_RANGE || {})) {
    list.push({
      skill_id: `english:pool:translation:${poolKey}`,
      category: "translation",
      topic: "translation",
      poolKey,
      minGrade: range.minGrade,
      maxGrade: range.maxGrade,
    });
  }
  for (const [poolKey, range] of Object.entries(ENGLISH_SENTENCE_POOL_RANGE || {})) {
    list.push({
      skill_id: `english:pool:sentence:${poolKey}`,
      category: "sentence",
      topic: "sentences",
      poolKey,
      minGrade: range.minGrade,
      maxGrade: range.maxGrade,
    });
  }
  return list;
}

/**
 * @param {Record<string, unknown>} ENGLISH_GRADES
 * @param {Record<string, { minGrade: number, maxGrade: number }>} ENGLISH_GRAMMAR_POOL_RANGE
 * @param {Record<string, { minGrade: number, maxGrade: number }>} ENGLISH_TRANSLATION_POOL_RANGE
 * @param {Record<string, { minGrade: number, maxGrade: number }>} ENGLISH_SENTENCE_POOL_RANGE
 * @param {{ slug: (s: string) => string, cognitiveForGrade: (g: number) => string }} opts
 */
export function buildUnifiedEnglishSpine(
  ENGLISH_GRADES,
  ENGLISH_GRAMMAR_POOL_RANGE,
  ENGLISH_TRANSLATION_POOL_RANGE,
  ENGLISH_SENTENCE_POOL_RANGE,
  opts,
) {
  const { slug, cognitiveForGrade } = opts;
  const poolDescriptors = buildPoolDescriptors(
    ENGLISH_GRAMMAR_POOL_RANGE,
    ENGLISH_TRANSLATION_POOL_RANGE,
    ENGLISH_SENTENCE_POOL_RANGE,
  );

  /** @type {Array<Record<string, unknown>>} */
  const skills = [];

  for (const [gk, row] of Object.entries(ENGLISH_GRADES)) {
    const g = Number.parseInt(String(gk).replace(/^g/, ""), 10);
    for (const topic of row.topics || []) {
      const linked_skill_ids = poolSkillIdsForGradeTopic(g, topic, poolDescriptors);
      skills.push({
        schema_version: 1,
        skill_id: topicAccessSkillId(gk, topic),
        subject: "english",
        topic,
        subtopic: `${gk}_${topic}_access`,
        minGrade: g,
        maxGrade: g,
        cognitive_level: cognitiveForGrade(g),
        description: `English curriculum declares topic "${topic}" for ${gk} (${row.name}). Linked pools cover generator bank items allowed in this grade for this topic.`,
        source: ENGLISH_UNIFIED_SOURCE_CURRICULUM,
        spine_layer: "curriculum_topic_access",
        linked_skill_ids,
      });
    }
  }

  const wlToGrades = new Map();
  for (const [gk, row] of Object.entries(ENGLISH_GRADES)) {
    const g = Number.parseInt(String(gk).replace(/^g/, ""), 10);
    for (const wl of row.wordLists || []) {
      if (!wlToGrades.has(wl)) wlToGrades.set(wl, new Set());
      wlToGrades.get(wl).add(g);
    }
  }
  for (const [wl, grades] of [...wlToGrades.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0])))) {
    const nums = [...grades].sort((x, y) => x - y);
    const minGrade = nums[0];
    const maxGrade = nums[nums.length - 1];
    const linked_skill_ids = [];
    for (const n of nums) {
      const gk = `g${n}`;
      const row = ENGLISH_GRADES[gk];
      if (row?.topics?.includes("vocabulary")) {
        linked_skill_ids.push(topicAccessSkillId(gk, "vocabulary"));
      }
    }
    const part = slug(wl) || "wordlist";
    skills.push({
      schema_version: 1,
      skill_id: `english:vocabulary:wordlist:${part}`,
      subject: "english",
      topic: "vocabulary",
      subtopic: wl,
      minGrade,
      maxGrade,
      cognitive_level: "recognition",
      description: `Vocabulary word-list "${wl}" (grades ${minGrade}–${maxGrade}; merged across ENGLISH_GRADES where the list name appears).`,
      source: ENGLISH_UNIFIED_SOURCE_CURRICULUM,
      spine_layer: "vocabulary_wordlist",
      linked_skill_ids,
    });
  }

  const lineToGrades = new Map();
  for (const [gk, row] of Object.entries(ENGLISH_GRADES)) {
    const g = Number.parseInt(String(gk).replace(/^g/, ""), 10);
    const lines = row?.curriculum?.grammar;
    if (!Array.isArray(lines)) continue;
    for (const line of lines) {
      const key = String(line).trim();
      if (!key) continue;
      if (!lineToGrades.has(key)) lineToGrades.set(key, new Set());
      lineToGrades.get(key).add(g);
    }
  }

  const usedGrammarSlugs = new Set();
  for (const [line, grades] of [...lineToGrades.entries()].sort((a, b) => a[0].localeCompare(b[0], "he"))) {
    const nums = [...grades].sort((x, y) => x - y);
    const minGrade = nums[0];
    const maxGrade = nums[nums.length - 1];
    let base = slug(line) || "grammar_line";
    let sid = base;
    let n = 0;
    while (usedGrammarSlugs.has(sid)) {
      n += 1;
      sid = `${base}_${n}`;
    }
    usedGrammarSlugs.add(sid);
    const linked_skill_ids = [];
    for (const g of nums) {
      const gk = `g${g}`;
      const row = ENGLISH_GRADES[gk];
      if (row?.topics?.includes("grammar")) {
        linked_skill_ids.push(topicAccessSkillId(gk, "grammar"));
      }
    }
    skills.push({
      schema_version: 1,
      skill_id: `english:grammar:line:${sid}`,
      subject: "english",
      topic: "grammar",
      subtopic: sid,
      minGrade,
      maxGrade,
      cognitive_level: cognitiveForGrade(maxGrade),
      description:
        nums.length > 1
          ? `${String(line).slice(0, 200)} — merged identical curriculum grammar line across grades ${minGrade}–${maxGrade} (Phase 7.12).`
          : `${String(line).slice(0, 200)} — curriculum grammar line for grade ${minGrade} only.`,
      source: ENGLISH_UNIFIED_SOURCE_CURRICULUM,
      spine_layer: "curriculum_grammar_line",
      linked_skill_ids,
    });
  }

  for (const p of poolDescriptors) {
    const linked_skill_ids = topicAccessRowsForPool(p, ENGLISH_GRADES);
    const label =
      p.category === "grammar"
        ? "Grammar"
        : p.category === "translation"
          ? "Translation"
          : "Sentence";
    skills.push({
      schema_version: 1,
      skill_id: p.skill_id,
      subject: "english",
      topic: p.topic,
      subtopic: p.poolKey,
      minGrade: p.minGrade,
      maxGrade: p.maxGrade,
      cognitive_level: "application",
      description: `${label} pool "${p.poolKey}" (${p.minGrade}–${p.maxGrade}) — generator bank coverage; linked to per-grade topic access rows where that topic is declared.`,
      source: ENGLISH_UNIFIED_SOURCE_POOLS,
      spine_layer: "question_bank_pool",
      linked_skill_ids,
    });
  }

  let grammarLinesMergedMultiGrade = 0;
  for (const [, gset] of lineToGrades) {
    if (gset.size > 1) grammarLinesMergedMultiGrade += 1;
  }

  const topicAccessCount = skills.filter((s) => s.spine_layer === "curriculum_topic_access").length;
  const wordlistMergedCount = skills.filter((s) => s.spine_layer === "vocabulary_wordlist").length;
  const grammarMergedCount = skills.filter((s) => s.spine_layer === "curriculum_grammar_line").length;
  const poolCount = skills.filter((s) => s.spine_layer === "question_bank_pool").length;

  return {
    skills,
    poolDescriptors,
    stats: {
      topic_access_rows: topicAccessCount,
      vocabulary_wordlist_merged_rows: wordlistMergedCount,
      curriculum_grammar_merged_rows: grammarMergedCount,
      grammar_lines_deduped_across_multiple_grades: grammarLinesMergedMultiGrade,
      pool_rows: poolCount,
      english_rows_total: skills.length,
    },
  };
}

export function countLegacyEnglishSpineRows(ENGLISH_GRADES, grammarRange, translationRange, sentenceRange) {
  let n = 0;
  for (const row of Object.values(ENGLISH_GRADES)) {
    n += (row.topics || []).length;
    n += (row.wordLists || []).length;
    n += (row.curriculum?.grammar || []).length;
  }
  n += Object.keys(grammarRange || {}).length;
  n += Object.keys(translationRange || {}).length;
  n += Object.keys(sentenceRange || {}).length;
  return n;
}
