/**
 * Phase 7.14 — curriculum-spine v1 skill coverage audit (read-only).
 * Uses data/curriculum-spine/v1/skills.json + reports/question-audit/items.json
 * and light static imports (science bank, geography pools, harness/stage2).
 *
 * Run: npm run audit:skill-coverage
 * (Prefer after: build:curriculum-spine, audit:branches, audit:questions)
 */
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "reports", "curriculum-spine");
const mod = (rel) => pathToFileURL(join(ROOT, rel)).href;

const { inferG1SubtopicIdFromStem } = await import(mod("utils/hebrew-g1-subtopic.js"));
const { inferG2SubtopicIdFromStem } = await import(mod("utils/hebrew-g2-subtopic.js"));
const { resolveUpperGradeItemSubtopicId } = await import(mod("utils/hebrew-g3456-subtopic.js"));
const { SCIENCE_QUESTIONS } = await import(mod("data/science-questions.js"));

const G1 = await import(mod("data/geography-questions/g1.js"));
const G2 = await import(mod("data/geography-questions/g2.js"));
const G3 = await import(mod("data/geography-questions/g3.js"));
const G4 = await import(mod("data/geography-questions/g4.js"));
const G5 = await import(mod("data/geography-questions/g5.js"));
const G6 = await import(mod("data/geography-questions/g6.js"));

const GEO_BY_NUM = { 1: G1, 2: G2, 3: G3, 4: G4, 5: G5, 6: G6 };

function slug(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

function inferHebrewSubtopicIdFromStem(gk, topic, stem) {
  const g = String(gk).toLowerCase();
  const st = String(stem || "");
  if (g === "g1") return inferG1SubtopicIdFromStem(st, topic);
  if (g === "g2") return inferG2SubtopicIdFromStem(st, topic);
  if (g === "g3" || g === "g4" || g === "g5" || g === "g6") {
    return resolveUpperGradeItemSubtopicId(g, { question: st }, topic);
  }
  return null;
}

function buildGeographyCorpus() {
  /** @type {Map<number, string[]>} */
  const byG = new Map();
  for (let g = 1; g <= 6; g++) {
    const pack = GEO_BY_NUM[g];
    const texts = [];
    const names = [
      `G${g}_EASY_QUESTIONS`,
      `G${g}_MEDIUM_QUESTIONS`,
      `G${g}_HARD_QUESTIONS`,
    ];
    for (const nm of names) {
      const obj = pack[nm];
      if (!obj || typeof obj !== "object") continue;
      for (const arr of Object.values(obj)) {
        if (!Array.isArray(arr)) continue;
        for (const row of arr) {
          const q = row?.question ?? row?.prompt ?? "";
          if (String(q).trim()) texts.push(String(q).trim());
        }
      }
    }
    byG.set(g, texts);
  }
  return byG;
}

function geographySnippetHit(gradeNum, description, corpusByG) {
  const d = String(description || "").replace(/\s+/g, " ").trim();
  if (d.length < 12) return false;
  const snippet = d.slice(0, 48).trim();
  const corpus = corpusByG.get(gradeNum) || [];
  if (!corpus.length) return false;
  return corpus.some((t) => t.includes(snippet) || snippet.includes(t.slice(0, 24)));
}

function loadJson(path, fallback) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

function harnessMathKinds() {
  const h = loadJson(join(ROOT, "reports", "question-audit", "harness-math.json"), {});
  const out = new Set();
  for (const k of h.mathForcedKinds || []) out.add(String(k));
  for (const v of Object.values(h.combos || {})) {
    for (const k of v.kinds || []) out.add(String(k));
  }
  return out;
}

function harnessGeoKinds() {
  const out = new Set();
  for (const fn of ["harness-geometry.json", "harness-geometry-conceptual.json"]) {
    const h = loadJson(join(ROOT, "reports", "question-audit", fn), {});
    for (const k of h.geoForcedKinds || []) out.add(String(k));
    for (const v of Object.values(h.combos || {})) {
      for (const kind of v.kinds || []) out.add(String(kind));
    }
  }
  return out;
}

function scienceTopicCounts() {
  const byTopic = new Map();
  const byPair = new Map();
  for (const q of SCIENCE_QUESTIONS || []) {
    const t = q?.topic;
    if (typeof t !== "string" || !t.trim()) continue;
    const grades = Array.isArray(q.grades) ? q.grades : [];
    byTopic.set(t, (byTopic.get(t) || 0) + 1);
    for (const gk of grades) {
      const k = `${gk}|${t}`;
      byPair.set(k, (byPair.get(k) || 0) + 1);
    }
  }
  return { byTopic, byPair };
}

function buildItemIndexes(items) {
  const mathKindSamples = new Map();
  const geoKindSamples = new Map();
  const hebrewBySkillId = new Map();
  const englishPoolCounts = new Map();
  const englishTopicHits = new Map();

  for (const r of items) {
    const rk = String(r.rowKind || "");
    if (rk === "math_generator_sample" && r.subtopic) {
      const k = String(r.subtopic);
      mathKindSamples.set(k, (mathKindSamples.get(k) || 0) + 1);
    }
    if (rk === "geometry_generator_sample" && r.subtopic) {
      const k = String(r.subtopic);
      geoKindSamples.set(k, (geoKindSamples.get(k) || 0) + 1);
    }
    if (r.subject === "hebrew" && (rk === "hebrew_legacy" || rk === "hebrew_rich")) {
      const g = Number(r.minGrade);
      if (g >= 1 && g <= 6 && r.topic) {
        const gk = `g${g}`;
        const sid = inferHebrewSubtopicIdFromStem(gk, String(r.topic), r.stemText || "");
        if (sid) {
          const full = `hebrew:${gk}:${r.topic}:${sid}`;
          hebrewBySkillId.set(full, (hebrewBySkillId.get(full) || 0) + 1);
        }
      }
    }
    if (r.subject === "english" && rk === "english_pool_item") {
      const cat = String(r.topic || "");
      const poolKey = String(r.subtopic || "");
      const sid = `english:pool:${cat}:${poolKey}`;
      englishPoolCounts.set(sid, (englishPoolCounts.get(sid) || 0) + 1);
      const gLo = Number(r.minGrade) || 1;
      const gHi = Number(r.maxGrade) || 6;
      for (let g = gLo; g <= gHi; g++) {
        const key = `g${g}|${cat}`;
        englishTopicHits.set(key, (englishTopicHits.get(key) || 0) + 1);
      }
    }
  }

  return { mathKindSamples, geoKindSamples, hebrewBySkillId, englishPoolCounts, englishTopicHits };
}

function sourceKindForSkill(skill) {
  const lid = String(skill.skill_id || "");
  const layer = String(skill.spine_layer || "");
  if (lid.startsWith("math:kind:") || lid.startsWith("geometry:kind:")) return "deterministic_generator";
  if (lid.startsWith("science:topic:")) return "static_bank";
  if (lid.startsWith("hebrew:rich:") || layer === "rich_bank") return "static_bank";
  if (lid.startsWith("english:pool:")) return "static_bank";
  if (lid.startsWith("geography:")) return "static_bank";
  if (layer === "content_map") return "static_bank_curriculum_map";
  if (
    layer === "curriculum_topic_access" ||
    layer === "vocabulary_wordlist" ||
    layer === "curriculum_grammar_line"
  )
    return "curriculum_structure";
  return "mixed_or_unknown";
}

function classifyMathGeometry(kind, sampleCount, harnessKinds, declaredMiss) {
  const inHarness = harnessKinds.has(kind);
  const missed = declaredMiss.includes(kind);
  if (sampleCount >= 6) return { cls: "adequate", note: "generator_samples>=6" };
  if (sampleCount >= 1) return { cls: "weak", note: "low_sample_count" };
  if (inHarness && sampleCount === 0)
    return { cls: "weak", note: "harness_or_forced_only_no_audit_sample_hits" };
  if (missed) return { cls: "zero", note: "declared_kind_not_observed_in_stage2_union_samples_harness" };
  if (sampleCount === 0)
    return { cls: "uncertain", note: "no_samples_and_not_in_harness_union_check_branch_extract" };
  return { cls: "adequate", note: "" };
}

function classifyHebrewContentMap(skillId, count) {
  if (count >= 5) return { cls: "adequate", note: "inferred_subtopic_item_hits>=5" };
  if (count >= 1) return { cls: "weak", note: "inferred_subtopic_stem_heuristic_1_4" };
  return { cls: "zero", note: "no_items_mapped_to_this_content_map_id" };
}

function classifyHebrewRich(skill, items) {
  const st = String(skill.subtopic || "");
  if (!st.startsWith("rich:")) return { cls: "uncertain", count: 0, note: "unexpected_subtopic" };
  const rest = st.slice("rich:".length);
  const idx = rest.indexOf(":");
  const pf = idx === -1 ? rest : rest.slice(0, idx);
  const sub = idx === -1 ? "" : rest.slice(idx + 1);
  let n = 0;
  const topic = String(skill.topic || "");
  for (const r of items) {
    if (r.subject !== "hebrew" || r.rowKind !== "hebrew_rich") continue;
    if (String(r.topic) !== topic) continue;
    if (String(r.patternFamily || "") !== pf) continue;
    if (sub && String(r.subtype || "") !== sub) continue;
    n += 1;
  }
  if (n >= 1) return { cls: "adequate", count: n, note: "rich_pool_rows_in_audit" };
  return { cls: "zero", count: 0, note: "no_matching_hebrew_rich_rows" };
}

function classifyScienceTopic(topic, minG, maxG, science) {
  const total = science.byTopic.get(topic) || 0;
  let spanMin = 0;
  for (let g = minG; g <= maxG; g++) {
    const c = science.byPair.get(`g${g}|${topic}`) || 0;
    if (c > 0) spanMin = c;
  }
  const pairHits = [];
  for (let g = minG; g <= maxG; g++) {
    const c = science.byPair.get(`g${g}|${topic}`) || 0;
    pairHits.push({ grade: `g${g}`, count: c });
  }
  if (total === 0) return { cls: "zero", count: 0, detail: { total, pairHits } };
  const minPair = Math.min(...pairHits.map((p) => p.count));
  if (minPair === 0)
    return {
      cls: "weak",
      count: total,
      note: "topic_has_items_but_sparse_grade_tags_vs_spine_span",
      detail: { total, pairHits },
    };
  if (total < 8) return { cls: "weak", count: total, note: "low_global_topic_count", detail: { total, pairHits } };
  return { cls: "adequate", count: total, detail: { total, pairHits } };
}

function classifyEnglishPool(skillId, poolCount) {
  if (poolCount >= 12) return { cls: "adequate", count: poolCount };
  if (poolCount >= 1) return { cls: "weak", count: poolCount };
  return { cls: "zero", count: 0 };
}

function classifyEnglishStructural(skill, englishTopicHits) {
  const m = /^english:(g[1-6]):topic:(.+)$/.exec(String(skill.skill_id || ""));
  if (!m) return { cls: "uncertain", count: 0, note: "not_topic_access_pattern" };
  const gk = m[1];
  const topic = m[2];
  const n = englishTopicHits.get(`${gk}|${topic}`) || 0;
  const linked = Array.isArray(skill.linked_skill_ids) ? skill.linked_skill_ids.length : 0;
  if (n >= 3) return { cls: "adequate", count: n, note: "english_pool_items_touching_grade_topic", linked };
  if (n >= 1 || linked > 0) return { cls: "weak", count: n, note: "thin_or_link_only", linked };
  return { cls: "zero", count: 0, note: "no_pool_items_in_span", linked };
}

function classifyEnglishWordlistGrammar(skill) {
  return {
    cls: "uncertain",
    count: 0,
    note:
      skill.spine_layer === "vocabulary_wordlist"
        ? "wordlist_spine_not_joined_to_per_item_audit_rows"
        : "grammar_line_spine_not_joined_to_pool_keys_without_nlp",
  };
}

mkdirSync(OUT_DIR, { recursive: true });

const spinePath = join(ROOT, "data", "curriculum-spine", "v1", "skills.json");
const spine = loadJson(spinePath, null);
if (!spine?.skills?.length) {
  console.error("[audit:skill-coverage] Missing or empty skills.json — run npm run build:curriculum-spine");
  process.exit(1);
}

const itemsPath = join(ROOT, "reports", "question-audit", "items.json");
const items = loadJson(itemsPath, []);
if (!Array.isArray(items) || items.length === 0) {
  console.warn("[audit:skill-coverage] items.json missing or empty — run npm run audit:questions");
}

const idx = buildItemIndexes(items);
const harnessMath = harnessMathKinds();
const harnessGeo = harnessGeoKinds();
const stage2 = loadJson(join(ROOT, "reports", "question-audit", "stage2.json"), {});
const mathMissed = stage2?.generatorBranchCoverage?.math?.kindsNotHitInRun || [];
const geoMissed = stage2?.generatorBranchCoverage?.geometry?.kindsNotHitInRun || [];
const science = scienceTopicCounts();
const geoCorpus = buildGeographyCorpus();

/** @type {Array<Record<string, unknown>>} */
const rows = [];

for (const skill of spine.skills) {
  const skill_id = String(skill.skill_id || "");
  const subject = String(skill.subject || "?");
  const sk = sourceKindForSkill(skill);
  let coverage_class = "uncertain";
  let primaryCount = 0;
  const evidence = [];
  let mappingNote = "";

  if (skill_id.startsWith("math:kind:")) {
    const kind = skill_id.replace(/^math:kind:/, "");
    const sc = idx.mathKindSamples.get(kind) || 0;
    const r = classifyMathGeometry(kind, sc, harnessMath, mathMissed);
    coverage_class = r.cls;
    primaryCount = sc;
    evidence.push({ type: "math_generator_sample", count: sc });
    if (harnessMath.has(kind)) evidence.push({ type: "harness_math_union", hit: true });
    mappingNote = r.note || "";
  } else if (skill_id.startsWith("geometry:kind:")) {
    const kind = skill_id.replace(/^geometry:kind:/, "");
    if (kind === "no_question") {
      coverage_class = "adequate";
      primaryCount = 0;
      mappingNote = "meta_sentinel_kind_by_design_not_positive_generator_output";
    } else {
    const sc = idx.geoKindSamples.get(kind) || 0;
    const r = classifyMathGeometry(kind, sc, harnessGeo, geoMissed);
    coverage_class = r.cls;
    primaryCount = sc;
    evidence.push({ type: "geometry_generator_sample", count: sc });
    mappingNote = r.note || "";
    }
  } else if (skill_id.startsWith("science:topic:")) {
    const topic = skill_id.replace(/^science:topic:/, "");
    const minG = Number(skill.minGrade) || 1;
    const maxG = Number(skill.maxGrade) || 6;
    const r = classifyScienceTopic(topic, minG, maxG, science);
    coverage_class = r.cls;
    primaryCount = r.count;
    evidence.push({ type: "science_question_bank", ...r.detail });
    mappingNote = r.note || "";
  } else if (skill_id.startsWith("hebrew:rich:") || skill.spine_layer === "rich_bank") {
    const r = classifyHebrewRich(skill, items);
    coverage_class = r.cls;
    primaryCount = r.count;
    mappingNote = r.note || "";
  } else if (skill_id.startsWith("hebrew:") && skill.spine_layer === "content_map") {
    const c = idx.hebrewBySkillId.get(skill_id) || 0;
    const r = classifyHebrewContentMap(skill_id, c);
    coverage_class = r.cls;
    primaryCount = c;
    mappingNote = `${r.note};mapping=stem_subtopic_inference`;
  } else if (skill_id.startsWith("english:pool:")) {
    const c = idx.englishPoolCounts.get(skill_id) || 0;
    const r = classifyEnglishPool(skill_id, c);
    coverage_class = r.cls;
    primaryCount = c;
    mappingNote = r.note || "";
  } else if (skill.spine_layer === "curriculum_topic_access") {
    const r = classifyEnglishStructural(skill, idx.englishTopicHits);
    coverage_class = r.cls;
    primaryCount = r.count;
    mappingNote = r.note || "";
  } else if (skill.spine_layer === "vocabulary_wordlist" || skill.spine_layer === "curriculum_grammar_line") {
    const r = classifyEnglishWordlistGrammar(skill);
    coverage_class = r.cls;
    mappingNote = r.note;
  } else if (skill_id.startsWith("geography:")) {
    const g = Number(skill.minGrade) || 1;
    const hit = geographySnippetHit(g, skill.description, geoCorpus);
    primaryCount = hit ? 1 : 0;
    coverage_class = hit ? "weak" : "zero";
    mappingNote = hit
      ? "description_snippet_found_in_geography_question_corpus_heuristic"
      : "no_description_snippet_match_in_geography_corpus_heuristic";
  } else {
    coverage_class = "uncertain";
    mappingNote = "unclassified_spine_pattern";
  }

  rows.push({
    skill_id,
    subject,
    topic: skill.topic ?? "",
    spine_layer: skill.spine_layer ?? "",
    minGrade: skill.minGrade,
    maxGrade: skill.maxGrade,
    source_kind: sk,
    coverage_class,
    primary_evidence_count: primaryCount,
    evidence,
    mapping_note: mappingNote,
  });
}

const zero = rows.filter((r) => r.coverage_class === "zero");
const weak = rows.filter((r) => r.coverage_class === "weak");
const adequate = rows.filter((r) => r.coverage_class === "adequate");
const uncertain = rows.filter((r) => r.coverage_class === "uncertain");
const uncertainMappingCount = uncertain.length;
const hebrewContentMapStemInference = rows.filter(
  (r) => String(r.skill_id).startsWith("hebrew:") && r.spine_layer === "content_map",
).length;

function bySubject(list) {
  const m = {};
  for (const r of list) {
    m[r.subject] = (m[r.subject] || 0) + 1;
  }
  return m;
}

function countsBySubjectGradeTopic(allRows) {
  const bySubject = {};
  for (const r of allRows) {
    const s = r.subject || "?";
    const g = `${Number(r.minGrade) || "?"}-${Number(r.maxGrade) || "?"}`;
    const t = String(r.topic || "_none");
    if (!bySubject[s]) bySubject[s] = { total: 0, by_grade_span: {}, by_topic: {} };
    bySubject[s].total += 1;
    bySubject[s].by_grade_span[g] = (bySubject[s].by_grade_span[g] || 0) + 1;
    bySubject[s].by_topic[t] = (bySubject[s].by_topic[t] || 0) + 1;
  }
  return bySubject;
}

const bySourceKind = {};
for (const r of rows) {
  const k = r.source_kind || "?";
  if (!bySourceKind[k]) bySourceKind[k] = { total: 0, adequate: 0, weak: 0, zero: 0, uncertain: 0 };
  bySourceKind[k].total += 1;
  bySourceKind[k][r.coverage_class] = (bySourceKind[k][r.coverage_class] || 0) + 1;
}

const summary = {
  generatedAt: new Date().toISOString(),
  spinePath,
  itemsPath,
  itemsRowCount: items.length,
  total_skills_checked: rows.length,
  spine_skill_rows_by_source_kind: bySourceKind,
  coverage_class_counts: {
    zero: zero.length,
    weak: weak.length,
    adequate: adequate.length,
    uncertain: uncertain.length,
  },
  uncertain_mapping_count: uncertainMappingCount,
  hebrew_content_map_rows_using_stem_inference: hebrewContentMapStemInference,
  zero_by_subject: bySubject(zero),
  weak_by_subject: bySubject(weak),
  adequate_by_subject: bySubject(adequate),
  uncertain_by_subject: bySubject(uncertain),
  coverage_rows_by_subject_grade_topic: countsBySubjectGradeTopic(rows),
  per_skill_id_detail_file: "reports/curriculum-spine/skill-coverage.json",
  methodology: {
    math_geometry:
      "Counts math_generator_sample / geometry_generator_sample in items.json; union with harness JSON kinds; stage2 kindsNotHitInRun for zero hints.",
    hebrew_content_map:
      "Per-item stem inference to content-map id (inferG1/G2/upper resolve); heuristic — mis-bucketing possible.",
    science: "SCIENCE_QUESTIONS counts by topic and by grade|topic pair vs spine min/max grade.",
    english_pool: "english_pool_item rows keyed as english:pool:{topic}:{subtopic}.",
    english_curriculum_layers:
      "Topic access uses pool item counts for grade|topic; wordlists/grammar lines marked uncertain (no stable join).",
    geography:
      "First-48-char description substring match against flattened geography question corpus for that grade — high uncertainty.",
  },
  recommended_next_fixes: [
    "Add explicit skill_id or subtopicId fields to Hebrew audit rows (or export content-map join from generator) to remove stem-inference uncertainty for hebrew:* content_map skills.",
    "Join english:vocabulary:wordlist:* and english:grammar:line:* spine rows to english_pool_item or generator metadata with stable keys.",
    "Replace geography description substring heuristic with explicit curriculum-line ↔ question-bank keys in data (or emit geography rows into question-audit items.json).",
    "For math/geometry kinds listed as zero, run harness with expanded op/grade combos or narrow declared-branches regex if kinds are dead code.",
  ],
};

const detailOut = {
  schema_version: 1,
  summary,
  skills: rows,
  lists: {
    zero_coverage_skill_ids: zero.map((r) => r.skill_id),
    weak_coverage_skill_ids: weak.map((r) => r.skill_id),
    uncertain_coverage_skill_ids: uncertain.map((r) => r.skill_id),
  },
};

writeFileSync(join(OUT_DIR, "skill-coverage.json"), JSON.stringify(detailOut, null, 2), "utf8");
writeFileSync(join(OUT_DIR, "skill-coverage-summary.json"), JSON.stringify(summary, null, 2), "utf8");

const md = `# Skill coverage audit (Phase 7.14)

- **Generated:** ${summary.generatedAt}
- **Skills checked:** ${summary.total_skills_checked}
- **Zero / weak / adequate / uncertain:** ${summary.coverage_class_counts.zero} / ${summary.coverage_class_counts.weak} / ${summary.coverage_class_counts.adequate} / ${summary.coverage_class_counts.uncertain}
- **Uncertain (coverage class):** ${summary.uncertain_mapping_count}
- **Hebrew content-map rows (stem inference used in audit):** ${summary.hebrew_content_map_rows_using_stem_inference}

## By subject (zero)

\`\`\`json
${JSON.stringify(summary.zero_by_subject, null, 2)}
\`\`\`

## Recommended next fixes

${summary.recommended_next_fixes.map((x) => `- ${x}`).join("\n")}
`;

writeFileSync(join(OUT_DIR, "skill-coverage-summary.md"), md, "utf8");

console.log(
  JSON.stringify(
    {
      ok: true,
      out: OUT_DIR,
      total_skills_checked: summary.total_skills_checked,
      zero: zero.length,
      weak: weak.length,
      adequate: adequate.length,
      uncertain: uncertain.length,
      uncertain_mapping_count: uncertainMappingCount,
    },
    null,
    2,
  ),
);
