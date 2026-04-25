/**
 * Phase 7.14–7.15 — curriculum-spine v1 skill coverage audit (read-only).
 * Uses data/curriculum-spine/v1/skills.json + reports/question-audit/items.json
 * (geography_bank_item + spine_skill_id joins from Phase 7.15 audit hardening).
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

/** Moledet curriculum spine buckets → keys in geography-questions/g*.js question objects. */
const SPINE_BUCKET_BANK_TOPICS = {
  geography: ["geography", "maps"],
  citizenship: ["citizenship", "values", "community"],
  skills: ["homeland", "community", "values"],
};

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

function geoBankSumForBucket(gk, bucket, countsByGkTopic) {
  const topics = SPINE_BUCKET_BANK_TOPICS[bucket];
  if (!topics) return 0;
  let sum = 0;
  for (const t of topics) {
    sum += countsByGkTopic.get(`${gk}|${t}`) || 0;
  }
  return sum;
}

function buildGeoBankCountsFromItems(items) {
  /** @type {Map<string, number>} */
  const countsByGkTopic = new Map();
  /** @type {Map<string, string[]>} */
  const stemsByGkTopic = new Map();
  for (const r of items) {
    if (r.rowKind !== "geography_bank_item") continue;
    const gk = r.spine_grade_key || `g${r.minGrade}`;
    const bt = String(r.geography_bank_topic || r.topic || "");
    const k = `${gk}|${bt}`;
    countsByGkTopic.set(k, (countsByGkTopic.get(k) || 0) + 1);
    const st = String(r.stemText || "").trim();
    if (st) {
      if (!stemsByGkTopic.has(k)) stemsByGkTopic.set(k, []);
      stemsByGkTopic.get(k).push(st);
    }
  }
  return { countsByGkTopic, stemsByGkTopic };
}

function geographyCurriculumLineHit(description, gk, bucket, stemsByGkTopic) {
  const snip = String(description || "").replace(/\s+/g, " ").trim().slice(0, 32);
  if (snip.length < 4) return false;
  const topics = SPINE_BUCKET_BANK_TOPICS[bucket] || [];
  for (const t of topics) {
    const stems = stemsByGkTopic.get(`${gk}|${t}`) || [];
    if (stems.some((s) => s.includes(snip) || snip.length >= 8 && snip.includes(s.slice(0, 18)))) return true;
  }
  return false;
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
      const spineId = typeof r.spine_skill_id === "string" ? r.spine_skill_id.trim() : "";
      if (spineId.startsWith("hebrew:")) {
        hebrewBySkillId.set(spineId, (hebrewBySkillId.get(spineId) || 0) + 1);
      } else {
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
  if (count >= 5) return { cls: "adequate", note: "audit_spine_skill_id_or_inferred_hits>=5" };
  if (count >= 1) return { cls: "weak", note: "audit_hits_1_4_regenerate_questions_audit_if_zero_expected" };
  return { cls: "zero", note: "no_audit_rows_for_this_content_map_skill_id" };
}

function classifyHebrewRich(skill, items) {
  let nSpine = 0;
  const st = String(skill.subtopic || "");
  if (!st.startsWith("rich:")) return { cls: "uncertain", count: 0, note: "unexpected_subtopic" };
  const rest = st.slice("rich:".length);
  const idx = rest.indexOf(":");
  const pf = idx === -1 ? rest : rest.slice(0, idx);
  const sub = idx === -1 ? "" : rest.slice(idx + 1);
  const topic = String(skill.topic || "");
  let nPf = 0;
  for (const r of items) {
    if (r.subject !== "hebrew" || r.rowKind !== "hebrew_rich") continue;
    if (r.spine_skill_id && String(r.spine_skill_id) === skill.skill_id) {
      nSpine += 1;
      continue;
    }
    if (String(r.topic) !== topic) continue;
    if (String(r.patternFamily || "") !== pf) continue;
    if (sub && String(r.subtype || "") !== sub) continue;
    nPf += 1;
  }
  if (nSpine >= 1) return { cls: "adequate", count: nSpine, note: "hebrew_rich_spine_skill_id_join" };
  if (nPf >= 1) return { cls: "adequate", count: nPf, note: "rich_pool_rows_pattern_fallback" };
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

function englishTopicAccessPoolHits(gk, topic, englishTopicHits) {
  const g = (cat) => englishTopicHits.get(`${gk}|${cat}`) || 0;
  if (topic === "vocabulary") return g("translation") + g("sentence") + g("grammar");
  if (topic === "writing" || topic === "mixed") return g("grammar") + g("translation") + g("sentence");
  if (topic === "sentences") return g("sentence");
  return g(topic);
}

function classifyEnglishStructural(skill, englishTopicHits) {
  const m = /^english:(g[1-6]):topic:(.+)$/.exec(String(skill.skill_id || ""));
  if (!m) return { cls: "uncertain", count: 0, note: "not_topic_access_pattern" };
  const gk = m[1];
  const topic = m[2];
  const sid = String(skill.skill_id || "");
  if (sid.includes("topic:sentences")) {
    const poolSentence = englishTopicHits.get(`${gk}|sentence`) || 0;
    if (poolSentence >= 1) {
      return {
        cls: "adequate",
        count: poolSentence,
        note: "sentence_pool_proxy_coverage",
      };
    }
  }
  const n = englishTopicAccessPoolHits(gk, topic, englishTopicHits);
  const linked = Array.isArray(skill.linked_skill_ids) ? skill.linked_skill_ids.length : 0;
  if (n >= 3) return { cls: "adequate", count: n, note: "english_pool_items_mapped_topic_or_pool_proxy", linked };
  if (n >= 1 || linked > 0) return { cls: "weak", count: n, note: "thin_or_link_only", linked };
  return { cls: "zero", count: 0, note: "no_pool_items_in_span", linked };
}

function classifyEnglishWordlist(skill, items) {
  const minG = Number(skill.minGrade) || 1;
  const maxG = Number(skill.maxGrade) || 6;
  const wl = String(skill.subtopic || "").trim();
  let poolSpan = 0;
  let nameHits = 0;
  for (const r of items) {
    if (r.subject !== "english" || r.rowKind !== "english_pool_item") continue;
    if (!(Number(r.minGrade) <= maxG && Number(r.maxGrade) >= minG)) continue;
    poolSpan += 1;
    const stem = String(r.stemText || "").toLowerCase();
    if (wl && stem.includes(wl.toLowerCase())) nameHits += 1;
  }
  if (nameHits >= 3) return { cls: "adequate", count: nameHits, note: "wordlist_subtopic_token_in_pool_stems" };
  if (nameHits >= 1) return { cls: "weak", count: nameHits, note: "thin_wordlist_stem_token_match" };
  if (poolSpan >= 1)
    return { cls: "weak", count: poolSpan, note: "english_pool_activity_in_grade_span_shared_bank" };
  return { cls: "zero", count: 0, note: "no_english_pool_rows_in_grade_span" };
}

function classifyEnglishGrammarLine(skill, items) {
  const skillId = String(skill.skill_id || "");
  const minG = Number(skill.minGrade) || 1;
  const maxG = Number(skill.maxGrade) || 6;
  const desc = String(skill.description || "").trim().slice(0, 48);
  let gHits = 0;
  let idLineHits = 0;
  let descLineHits = 0;
  for (const r of items) {
    if (r.subject !== "english" || r.rowKind !== "english_pool_item") continue;
    if (String(r.topic) !== "grammar") continue;
    if (!(Number(r.minGrade) <= maxG && Number(r.maxGrade) >= minG)) continue;
    gHits += 1;
    if (String(r.grammar_line_id || "") === skillId) idLineHits += 1;
    else if (desc.length >= 6 && String(r.stemText).includes(desc)) descLineHits += 1;
  }
  if (idLineHits >= 1)
    return { cls: "adequate", count: idLineHits, note: "grammar_line_id_spine_match" };
  if (descLineHits >= 2)
    return { cls: "adequate", count: descLineHits, note: "grammar_line_description_in_pool_stems" };
  if (descLineHits === 1) return { cls: "weak", count: 1, note: "single_curriculum_line_stem_hit" };
  if (gHits >= 1) return { cls: "weak", count: gHits, note: "grammar_pools_in_span_without_line_text_hit" };
  return { cls: "uncertain", count: 0, note: "no_grammar_pool_rows_in_grade_span" };
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
const geoBank = buildGeoBankCountsFromItems(items);
const harnessMath = harnessMathKinds();
const harnessGeo = harnessGeoKinds();
const stage2 = loadJson(join(ROOT, "reports", "question-audit", "stage2.json"), {});
const mathMissed = stage2?.generatorBranchCoverage?.math?.kindsNotHitInRun || [];
const geoMissed = stage2?.generatorBranchCoverage?.geometry?.kindsNotHitInRun || [];
const science = scienceTopicCounts();

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
    mappingNote = r.note;
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
  } else if (skill.spine_layer === "vocabulary_wordlist") {
    const r = classifyEnglishWordlist(skill, items);
    coverage_class = r.cls;
    primaryCount = r.count;
    mappingNote = r.note || "";
  } else if (skill.spine_layer === "curriculum_grammar_line") {
    const r = classifyEnglishGrammarLine(skill, items);
    coverage_class = r.cls;
    primaryCount = r.count;
    mappingNote = r.note || "";
  } else if (skill_id.startsWith("geography:")) {
    const parts = skill_id.split(":");
    const gk = parts[1] || "g1";
    const bucket = parts[2] || "geography";
    const bankSum = geoBankSumForBucket(gk, bucket, geoBank.countsByGkTopic);
    primaryCount = bankSum;
    const lineHit = geographyCurriculumLineHit(
      skill.description,
      gk,
      bucket,
      geoBank.stemsByGkTopic,
    );
    if (bankSum === 0) {
      coverage_class = "zero";
      mappingNote = "no_geography_bank_items_for_mapped_topics_in_this_grade";
    } else if (lineHit) {
      coverage_class = "adequate";
      mappingNote = "curriculum_line_text_hit_in_geography_bank_stems_explicit_topics";
    } else {
      coverage_class = "weak";
      mappingNote =
        "geography_bank_items_present_for_spine_bucket_shared_pool_line_match_not_required";
    }
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
const hebrewContentMapRows = rows.filter(
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
  phase_7_14_baseline_counts: {
    note: "Snapshot before Phase 7.15 audit join hardening (same 423 spine skills).",
    zero: 88,
    weak: 60,
    adequate: 244,
    uncertain: 31,
  },
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
  hebrew_content_map_spine_rows: hebrewContentMapRows,
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
      "Primary: audit row spine_skill_id (Phase 7.15) from resolveG1/G2/upper on legacy items; fallback stem inference only if spine_skill_id absent.",
    geography:
      "Explicit geography_bank_item rows per question + SPINE_BUCKET_BANK_TOPICS join to moledet curriculum buckets; line-hit upgrades weak→adequate when curriculum description substring appears in bank stems.",
    english_wordlist_grammar:
      "Wordlists: pool activity in grade span + subtopic token in stems. Grammar lines: grammar pool span + optional description substring in stems.",
    science: "SCIENCE_QUESTIONS counts by topic and by grade|topic pair vs spine min/max grade.",
    english_pool: "english_pool_item rows keyed as english:pool:{topic}:{subtopic}.",
    english_curriculum_layers:
      "Topic access uses pool item counts for grade|topic; wordlists/grammar lines use Phase 7.15 pool-span joins (see english_wordlist_grammar).",
  },
  recommended_next_fixes: [
    "Optional: tag english_pool_item rows with vocabulary_list_key / grammar_line_id for exact wordlist/grammar-line joins (Phase 7.15 uses heuristics).",
    "Optional: per-curriculum-line spine_skill_id on geography bank rows to upgrade weak→adequate without substring heuristics.",
    "Triage any remaining zero Hebrew content_map rows (true bank gaps vs. resolver edge cases).",
    "Triage remaining weak math kinds — expand harness further or accept low-frequency kinds.",
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

const md = `# Skill coverage audit (Phase 7.15)

- **Generated:** ${summary.generatedAt}
- **Phase 7.14 baseline (pre-join hardening):** zero ${summary.phase_7_14_baseline_counts.zero}, weak ${summary.phase_7_14_baseline_counts.weak}, adequate ${summary.phase_7_14_baseline_counts.adequate}, uncertain ${summary.phase_7_14_baseline_counts.uncertain}
- **Skills checked:** ${summary.total_skills_checked}
- **Zero / weak / adequate / uncertain:** ${summary.coverage_class_counts.zero} / ${summary.coverage_class_counts.weak} / ${summary.coverage_class_counts.adequate} / ${summary.coverage_class_counts.uncertain}
- **Uncertain (coverage class):** ${summary.uncertain_mapping_count}
- **Hebrew content-map spine rows:** ${summary.hebrew_content_map_spine_rows}

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
