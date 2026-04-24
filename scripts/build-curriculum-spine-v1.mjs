/**
 * Builds data/curriculum-spine/v1/skills.json (+ gaps, conflicts) from existing
 * curriculum maps and audit branch extract. Does not modify questions or generators.
 *
 * Run: npx tsx scripts/build-curriculum-spine-v1.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "data", "curriculum-spine", "v1");

const u = (rel) => pathToFileURL(path.join(ROOT, rel)).href;

const { HEBREW_G1_CONTENT_MAP } = await import(u("data/hebrew-g1-content-map.js"));
const { HEBREW_G2_CONTENT_MAP } = await import(u("data/hebrew-g2-content-map.js"));
const { HEBREW_G3_CONTENT_MAP } = await import(u("data/hebrew-g3-content-map.js"));
const { HEBREW_G4_CONTENT_MAP } = await import(u("data/hebrew-g4-content-map.js"));
const { HEBREW_G5_CONTENT_MAP } = await import(u("data/hebrew-g5-content-map.js"));
const { HEBREW_G6_CONTENT_MAP } = await import(u("data/hebrew-g6-content-map.js"));
const { SCIENCE_GRADES } = await import(u("data/science-curriculum.js"));
const { SCIENCE_QUESTIONS } = await import(u("data/science-questions.js"));
const {
  deriveCanonicalScienceSpine,
  countLegacyScienceDraftRows,
} = await import(pathToFileURL(path.join(__dirname, "curriculum-spine-science-canonical.mjs")).href);
const { HEBREW_RICH_POOL } = await import(u("utils/hebrew-rich-question-bank.js"));
const {
  deriveHebrewRichBankSpine,
  countHebrewContentMapRows,
} = await import(pathToFileURL(path.join(__dirname, "curriculum-spine-hebrew-rich-canonical.mjs")).href);
const { ENGLISH_GRADES } = await import(u("data/english-curriculum.js"));
const {
  buildUnifiedEnglishSpine,
  countLegacyEnglishSpineRows,
} = await import(pathToFileURL(path.join(__dirname, "curriculum-spine-english-canonical.mjs")).href);
const { MOLEDET_GEOGRAPHY_GRADES } = await import(u("data/moledet-geography-curriculum.js"));
const { ENGLISH_GRAMMAR_POOL_RANGE, ENGLISH_TRANSLATION_POOL_RANGE, ENGLISH_SENTENCE_POOL_RANGE } =
  await import(u("utils/grade-gating.js"));

const branchesPath = path.join(ROOT, "reports", "question-audit", "declared-branches.json");
const branches = JSON.parse(fs.readFileSync(branchesPath, "utf8"));

const {
  MATH_KIND_GRADE_SPAN,
  geometryKindGradeSpan,
  MATH_GRADE_TRUTH,
  GEOMETRY_GRADE_TRUTH,
  MATH_KINDS_GENERATOR_CURRICULUM_MISMATCH,
} = await import(pathToFileURL(path.join(__dirname, "curriculum-spine-grade-bindings.mjs")).href);

const mathGeometryPlaceholderBefore =
  branches.math.kindLiterals.length + branches.geometry.kindLiterals.length;

function slug(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

function cognitiveForGrade(g) {
  if (g <= 2) return "recognition";
  if (g <= 4) return "application";
  return "reasoning";
}

function mathTopicForKind(kind) {
  const k = String(kind);
  if (/^wp_|_wp$|word|shop|coins|distance|time_sum|time_days|time_date|leftover|comparison|groups|unit_/.test(k))
    return "word_problems";
  if (/^frac_|mixed_to|perc_/.test(k)) return "fractions";
  if (/^dec_|round/.test(k)) return "decimals";
  if (/^div|divisibility|prime_|fm_/.test(k)) return "division_and_number_theory";
  if (/^mul|^zero_mul|^one_mul/.test(k)) return "multiplication";
  if (/^add|^sub|^eq_|^order_|^cmp|^zero_|^est_|^sequence|^ns_/.test(k)) return "number_sense_and_operations";
  if (/^power_|^ratio_|^scale_/.test(k)) return "ratio_scale_and_powers";
  return "general";
}

function geometryTopicForKind(kind) {
  const k = String(kind);
  if (/volume|prism|pyramid|cylinder|cone|sphere|solids/.test(k)) return "volume";
  if (/pythagoras|diagonal/.test(k)) return "pythagoras_and_diagonals";
  if (/circle|square_area|square_perimeter|rectangle|parallelogram|trapezoid|triangle|quadrilateral|shapes_basic|tiling|heights_/.test(k))
    return "area_and_shapes";
  if (/angle|parallel|perpendicular|rotation|symmetry|transform/.test(k)) return "angles_and_transformations";
  if (k === "no_question") return "meta";
  return "geometry_general";
}

/** @type {Array<Record<string, unknown>>} */
const skills = [];
/** @type {Array<Record<string, unknown>>} */
const gaps = [];
/** @type {Array<Record<string, unknown>>} */
const conflicts = [];

const hebrewMaps = [
  ["g1", HEBREW_G1_CONTENT_MAP],
  ["g2", HEBREW_G2_CONTENT_MAP],
  ["g3", HEBREW_G3_CONTENT_MAP],
  ["g4", HEBREW_G4_CONTENT_MAP],
  ["g5", HEBREW_G5_CONTENT_MAP],
  ["g6", HEBREW_G6_CONTENT_MAP],
];

const hebrewContentMapRowCount = countHebrewContentMapRows(hebrewMaps);
/** @type {Array<{ skill_id: string, topic: string, minGrade: number, maxGrade: number }>} */
const hebrewContentMapIndex = [];

for (const [gKey, cmap] of hebrewMaps) {
  const g = parseInt(String(gKey).replace("g", ""), 10);
  for (const [topic, block] of Object.entries(cmap)) {
    const list = block?.subtopics;
    if (!Array.isArray(list)) continue;
    for (const st of list) {
      const sid = st.id;
      const row = {
        schema_version: 1,
        skill_id: `hebrew:${gKey}:${topic}:${sid}`,
        subject: "hebrew",
        topic,
        subtopic: sid,
        minGrade: g,
        maxGrade: g,
        cognitive_level: cognitiveForGrade(g),
        description: `Hebrew ${gKey} ${topic} — official content-map subtopic ${sid} (weights/modes in data/hebrew-${gKey}-content-map.js).`,
        source: `data/hebrew-${gKey}-content-map.js`,
        spine_layer: "content_map",
      };
      skills.push(row);
      hebrewContentMapIndex.push({
        skill_id: row.skill_id,
        topic: row.topic,
        minGrade: row.minGrade,
        maxGrade: row.maxGrade,
      });
    }
  }
}

const hebrewRichDerived = deriveHebrewRichBankSpine(HEBREW_RICH_POOL, hebrewContentMapIndex, {
  slug,
  cognitiveForGrade,
});
const usedRichSkillIds = new Set();
for (const row of hebrewRichDerived.skills) {
  if (usedRichSkillIds.has(row.skill_id)) {
    throw new Error(`[build-curriculum-spine] Duplicate Hebrew rich spine skill_id: ${row.skill_id}`);
  }
  usedRichSkillIds.add(row.skill_id);
  skills.push(row);
}
for (const g of hebrewRichDerived.extraGaps) {
  gaps.push(g);
}

for (const kind of branches.math.kindLiterals) {
  const topic = mathTopicForKind(kind);
  const span = MATH_KIND_GRADE_SPAN[kind];
  if (!span) {
    throw new Error(
      `[build-curriculum-spine] Missing MATH_KIND_GRADE_SPAN for kind "${kind}" — extend scripts/curriculum-spine-grade-bindings.mjs`,
    );
  }
  skills.push({
    schema_version: 1,
    skill_id: `math:kind:${kind}`,
    subject: "math",
    topic,
    subtopic: kind,
    minGrade: span.minGrade,
    maxGrade: span.maxGrade,
    cognitive_level: "application",
    description: `Math generator kind "${kind}" (topic inferred as ${topic}). Grades ${span.minGrade}–${span.maxGrade} bound in Phase 7.9 from math constants + generator branches.`,
    source: `${MATH_GRADE_TRUTH}; reports/question-audit/declared-branches.json`,
  });
}

for (const kind of branches.geometry.kindLiterals) {
  const topic = geometryTopicForKind(kind);
  const span = geometryKindGradeSpan(kind);
  if (!span) {
    throw new Error(
      `[build-curriculum-spine] Missing geometryKindGradeSpan for kind "${kind}" — extend scripts/curriculum-spine-grade-bindings.mjs`,
    );
  }
  skills.push({
    schema_version: 1,
    skill_id: `geometry:kind:${kind}`,
    subject: "geometry",
    topic,
    subtopic: kind,
    minGrade: span.minGrade,
    maxGrade: span.maxGrade,
    cognitive_level: "application",
    description: `Geometry generator kind "${kind}" (topic inferred as ${topic}). Grades ${span.minGrade}–${span.maxGrade} bound in Phase 7.9 from geometry constants + topic/shape matrix.`,
    source: `${GEOMETRY_GRADE_TRUTH}; reports/question-audit/declared-branches.json`,
  });
}

const englishLegacyRowCount = countLegacyEnglishSpineRows(
  ENGLISH_GRADES,
  ENGLISH_GRAMMAR_POOL_RANGE,
  ENGLISH_TRANSLATION_POOL_RANGE,
  ENGLISH_SENTENCE_POOL_RANGE,
);
const englishUnified = buildUnifiedEnglishSpine(
  ENGLISH_GRADES,
  ENGLISH_GRAMMAR_POOL_RANGE,
  ENGLISH_TRANSLATION_POOL_RANGE,
  ENGLISH_SENTENCE_POOL_RANGE,
  { slug, cognitiveForGrade },
);
for (const row of englishUnified.skills) {
  skills.push(row);
}

const scienceRowCountBefore = countLegacyScienceDraftRows(SCIENCE_GRADES);
const scienceDerived = deriveCanonicalScienceSpine(SCIENCE_QUESTIONS, SCIENCE_GRADES, {
  cognitiveForGrade,
});
for (const row of scienceDerived.skills) {
  skills.push(row);
}
for (const g of scienceDerived.extraGaps) {
  gaps.push(g);
}

for (const [gk, row] of Object.entries(MOLEDET_GEOGRAPHY_GRADES)) {
  const g = parseInt(gk.replace("g", ""), 10);
  const cur = row.curriculum || {};
  const buckets = [
    ["geography", cur.geography || []],
    ["citizenship", cur.citizenship || []],
    ["skills", cur.skills || []],
  ];
  for (const [topic, arr] of buckets) {
    let i = 0;
    for (const line of arr) {
      const sub = `${topic}_${i++}_${slug(line)}`;
      skills.push({
        schema_version: 1,
        skill_id: `geography:${gk}:${topic}:${sub}`,
        subject: "geography",
        topic,
        subtopic: sub,
        minGrade: g,
        maxGrade: g,
        cognitive_level: cognitiveForGrade(g),
        description: String(line).slice(0, 220),
        source: "data/moledet-geography-curriculum.js",
      });
    }
  }
}

gaps.push({
  severity: "important",
  subject: "math",
  skill_ids: [...MATH_KINDS_GENERATOR_CURRICULUM_MISMATCH],
  note: "These kinds are only emitted on a g1-only path inside the `equations` branch (or via __LIOSH_MATH_FORCE), but `GRADES.g1.operations` in utils/math-constants.js does not list `equations`, so they do not appear under normal grade+op gating. Align GRADES or generator if they should be reachable.",
});
const ranges = [];
for (const row of skills) {
  if (row.subject !== "english") continue;
  if (!String(row.skill_id).includes(":pool:")) continue;
  ranges.push({
    skill_id: row.skill_id,
    minGrade: row.minGrade,
    maxGrade: row.maxGrade,
    subtopic: row.subtopic,
  });
}
for (let i = 0; i < ranges.length; i++) {
  for (let j = i + 1; j < ranges.length; j++) {
    const a = ranges[i];
    const b = ranges[j];
    if (a.subtopic !== b.subtopic) continue;
    if (a.minGrade <= b.maxGrade && b.minGrade <= a.maxGrade) {
      if (a.skill_id !== b.skill_id)
        conflicts.push({
          type: "duplicate_pool_key_different_skill_id_unlikely",
          a: a.skill_id,
          b: b.skill_id,
        });
    }
  }
}

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "skills.json"), JSON.stringify({ schema_version: 1, generatedAt: new Date().toISOString(), count: skills.length, skills }, null, 2), "utf8");
fs.writeFileSync(path.join(OUT, "gaps.json"), JSON.stringify({ schema_version: 1, generatedAt: new Date().toISOString(), count: gaps.length, gaps }, null, 2), "utf8");
fs.writeFileSync(
  path.join(OUT, "conflicts.json"),
  JSON.stringify({ schema_version: 1, generatedAt: new Date().toISOString(), count: conflicts.length, conflicts }, null, 2),
  "utf8"
);

const mathGeometryPlaceholderAfter = skills.filter(
  (s) =>
    (s.subject === "math" || s.subject === "geometry") &&
    s.minGrade === 1 &&
    s.maxGrade === 6,
).length;

console.log(
  JSON.stringify(
    {
      skills: skills.length,
      gaps: gaps.length,
      conflicts: conflicts.length,
      out: OUT,
      phase79_math_geometry_placeholder_rows: {
        before_all_math_and_geometry_kind_rows_were_1_to_6: mathGeometryPlaceholderBefore,
        after_count_min1_max6: mathGeometryPlaceholderAfter,
      },
      phase710_science_canonical: {
        science_spine_rows_before_draft_prose: scienceRowCountBefore,
        science_spine_rows_after_canonical_topics: scienceDerived.skills.length,
        science_question_topics_unmapped_to_curriculum: scienceDerived.unmappedQuestionTopics,
        science_curriculum_grade_topic_pairs_without_bank_items:
          scienceDerived.curriculumPairsWithoutQuestions.length,
      },
      phase711_hebrew_rich_reconciliation: {
        hebrew_content_map_rows: hebrewContentMapRowCount,
        hebrew_rich_bucket_rows: hebrewRichDerived.skills.length,
        hebrew_rows_total: hebrewContentMapRowCount + hebrewRichDerived.skills.length,
        rich_pool_items_mapped: hebrewRichDerived.mappedPoolItemCount,
        rich_pool_items_unmapped: hebrewRichDerived.unmappedRichPoolRows.length,
      },
      phase712_english_unification: {
        english_rows_before: englishLegacyRowCount,
        english_rows_after: englishUnified.stats.english_rows_total,
        topic_access_rows: englishUnified.stats.topic_access_rows,
        vocabulary_wordlist_merged_rows: englishUnified.stats.vocabulary_wordlist_merged_rows,
        curriculum_grammar_merged_rows: englishUnified.stats.curriculum_grammar_merged_rows,
        grammar_lines_deduped_across_multiple_grades:
          englishUnified.stats.grammar_lines_deduped_across_multiple_grades,
        pool_rows: englishUnified.stats.pool_rows,
      },
    },
    null,
    2,
  ),
);
