/**
 * Phase 7.16 — Weak coverage action plan (read-only).
 * Reads reports/curriculum-spine/skill-coverage.json and writes
 * weak-coverage-action-plan.json + .md under reports/curriculum-spine/.
 *
 * Run after: npm run audit:skill-coverage
 *   (prefer full chain: build:curriculum-spine, audit:branches, audit:questions, audit:skill-coverage)
 *
 * npm run audit:weak-coverage-plan
 */
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "reports", "curriculum-spine");
const INPUT = join(OUT_DIR, "skill-coverage.json");
const OUT_JSON = join(OUT_DIR, "weak-coverage-action-plan.json");
const OUT_MD = join(OUT_DIR, "weak-coverage-action-plan.md");

/** Highest precedence first for tie-break when multiple rules match. */
const RULES_PRIORITY_ORDER = [
  "content_add",
  "harness_expand",
  "mapping_refine",
  "threshold_adjust",
  "accept_as_broad",
];

const FIX_RANK = Object.fromEntries(RULES_PRIORITY_ORDER.map((t, i) => [t, i]));

/** Exact mapping_note literals from audit-skill-coverage.mjs (weak paths). */
const NOTE_AUDIT_HITS_1_4 = "audit_hits_1_4_regenerate_questions_audit_if_zero_expected";
const NOTE_HARNESS_ONLY = "harness_or_forced_only_no_audit_sample_hits";
const NOTE_LOW_SAMPLE = "low_sample_count";
const NOTE_THIN_OR_LINK = "thin_or_link_only";
const NOTE_ENG_POOL_SHARED = "english_pool_activity_in_grade_span_shared_bank";
const NOTE_THIN_WORDLIST = "thin_wordlist_stem_token_match";
const NOTE_GRAMMAR_POOLS_NO_LINE = "grammar_pools_in_span_without_line_text_hit";
const NOTE_GRAMMAR_SINGLE_LINE = "single_curriculum_line_stem_hit";

/** Controlled includes() substrings for science weak notes only. */
const SCIENCE_SPARSE_SUB = "topic_has_items_but_sparse_grade_tags_vs_spine_span";
const SCIENCE_LOW_GLOBAL_SUB = "low_global_topic_count";

const FALLBACK = {
  fix_type: "mapping_refine",
  priority: "P2",
  weak_reason: "unclassified_weak_mapping_note",
  recommended_action: "add explicit classification rule in Phase 7.17",
};

function loadJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

/** Deterministic JSON: sort object keys recursively. */
function sortKeysDeep(value) {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  const out = {};
  for (const k of Object.keys(value).sort()) {
    out[k] = sortKeysDeep(value[k]);
  }
  return out;
}

/**
 * @param {Record<string, unknown>} row
 * @returns {Set<string>}
 */
function candidateFixTypes(row) {
  const subject = String(row.subject || "");
  const skillId = String(row.skill_id || "");
  const note = String(row.mapping_note || "");
  const pe = Number(row.primary_evidence_count) || 0;
  const layer = String(row.spine_layer || "");
  const out = new Set();

  if (subject === "geography") {
    return out;
  }

  if (subject === "science") {
    if (note.includes(SCIENCE_SPARSE_SUB) || note.includes(SCIENCE_LOW_GLOBAL_SUB)) {
      out.add("content_add");
    }
    return out;
  }

  if (subject === "hebrew" && layer === "content_map" && note === NOTE_AUDIT_HITS_1_4) {
    if (pe <= 2) out.add("content_add");
    if (pe >= 3) out.add("threshold_adjust");
    return out;
  }

  if (skillId.startsWith("math:kind:")) {
    if (note === NOTE_HARNESS_ONLY) out.add("harness_expand");
    if (note === NOTE_LOW_SAMPLE) out.add("threshold_adjust");
    return out;
  }

  if (skillId.startsWith("geometry:kind:")) {
    if (note === NOTE_HARNESS_ONLY) out.add("harness_expand");
    if (note === NOTE_LOW_SAMPLE) out.add("threshold_adjust");
    return out;
  }

  if (skillId.startsWith("english:pool:")) {
    if (note === "") {
      if (pe >= 1 && pe <= 3) out.add("content_add");
      if (pe >= 4 && pe <= 11) out.add("threshold_adjust");
    }
    return out;
  }

  if (layer === "vocabulary_wordlist") {
    if (note === NOTE_ENG_POOL_SHARED) out.add("mapping_refine");
    if (note === NOTE_THIN_WORDLIST) {
      if (pe <= 1) out.add("content_add");
      if (pe >= 2) out.add("threshold_adjust");
    }
    return out;
  }

  if (layer === "curriculum_grammar_line") {
    if (note === NOTE_GRAMMAR_POOLS_NO_LINE || note === NOTE_GRAMMAR_SINGLE_LINE) {
      out.add("mapping_refine");
    }
    return out;
  }

  if (layer === "curriculum_topic_access" && note === NOTE_THIN_OR_LINK) {
    out.add("mapping_refine");
    return out;
  }

  return out;
}

function pickFixType(candidates) {
  if (candidates.size === 0) return null;
  let best = null;
  let bestRank = Infinity;
  for (const t of candidates) {
    const r = FIX_RANK[t];
    if (r === undefined) continue;
    if (r < bestRank) {
      bestRank = r;
      best = t;
    }
  }
  return best;
}

/**
 * @param {Record<string, unknown>} row
 * @param {string} fixType
 */
function priorityFor(row, fixType) {
  if (String(row.subject) === "geography") return "P2";
  const pe = Number(row.primary_evidence_count) || 0;
  const note = String(row.mapping_note || "");
  const subj = String(row.subject || "");

  if (fixType === "content_add" && subj === "science") return "P0";
  if (fixType === "content_add" && subj === "hebrew" && pe === 1) return "P0";
  if (fixType === "harness_expand") return "P1";
  if (
    fixType === "mapping_refine" &&
    (note === NOTE_THIN_OR_LINK ||
      note === NOTE_GRAMMAR_POOLS_NO_LINE ||
      note === NOTE_GRAMMAR_SINGLE_LINE)
  ) {
    return "P1";
  }
  if (fixType === "content_add" && subj === "hebrew" && pe === 2) return "P1";
  return "P2";
}

/**
 * @param {Record<string, unknown>} row
 * @param {string} fixType
 * @param {boolean} usedFallback
 */
function weakReasonAndAction(row, fixType, usedFallback) {
  if (usedFallback) {
    return { weak_reason: FALLBACK.weak_reason, recommended_action: FALLBACK.recommended_action };
  }
  const skillId = String(row.skill_id || "");
  const note = String(row.mapping_note || "");
  const pe = Number(row.primary_evidence_count) || 0;
  const subj = String(row.subject || "");

  if (subj === "geography") {
    return {
      weak_reason:
        "geography_weak_bucket_has_bank_items_for_mapped_topics_without_curriculum_line_substring_hit",
      recommended_action:
        "accept_as_broad_bucket_coverage_in_phase_7_16_explicit_line_level_mapping_deferred",
    };
  }

  if (fixType === "content_add" && subj === "science") {
    return {
      weak_reason: "science_topic_weak_note_indicates_sparse_grade_tags_or_low_global_count",
      recommended_action:
        "add_or_retag_science_questions_so_topic_meets_grade_span_and_global_thresholds",
    };
  }

  if (fixType === "content_add" && subj === "hebrew") {
    return {
      weak_reason: `hebrew_content_map_audit_hits_1_to_2_count_${pe}`,
      recommended_action: "add_hebrew_bank_items_or_improve_spine_skill_id_join_for_this_content_map_skill",
    };
  }

  if (fixType === "threshold_adjust" && subj === "hebrew") {
    return {
      weak_reason: `hebrew_content_map_audit_hits_3_to_4_count_${pe}`,
      recommended_action:
        "revisit_adequate_threshold_for_hebrew_content_map_or_confirm_expected_low_density",
    };
  }

  if (fixType === "harness_expand") {
    return {
      weak_reason: "deterministic_generator_kind_in_harness_union_but_zero_math_geometry_audit_sample_rows",
      recommended_action:
        "expand_generator_deterministic_harness_combos_for_this_kind_to_increase_audit_sample_hits",
    };
  }

  if (fixType === "threshold_adjust" && (skillId.startsWith("math:kind:") || skillId.startsWith("geometry:kind:"))) {
    return {
      weak_reason: `generator_low_sample_count_${pe}_below_adequate_line`,
      recommended_action:
        "revisit_sample_adequacy_threshold_or_accept_low_frequency_kind_after_product_review",
    };
  }

  if (fixType === "content_add" && skillId.startsWith("english:pool:")) {
    return {
      weak_reason: `english_pool_item_count_${pe}_below_weak_gate_band_1_3`,
      recommended_action: "add_english_pool_items_for_this_pool_key_or_widen_grade_span_coverage",
    };
  }

  if (fixType === "threshold_adjust" && skillId.startsWith("english:pool:")) {
    return {
      weak_reason: `english_pool_item_count_${pe}_between_4_and_11_below_adequate_12`,
      recommended_action:
        "revisit_translation_pool_adequacy_threshold_or_add_items_until_count_reaches_12",
    };
  }

  if (fixType === "mapping_refine" && note === NOTE_ENG_POOL_SHARED) {
    return {
      weak_reason:
        "english_wordlist_grade_span_has_pool_activity_but_list_token_not_in_stems_shared_bank_proxy",
      recommended_action:
        "add_vocabulary_list_key_or_stem_token_joins_to_map_wordlists_to_pool_rows_phase_7_17",
    };
  }

  if (fixType === "content_add" && note === NOTE_THIN_WORDLIST) {
    return {
      weak_reason: `english_wordlist_thin_token_match_count_${pe}`,
      recommended_action: "add_targeted_vocabulary_items_or_stems_that_reference_the_list_subtopic",
    };
  }

  if (fixType === "threshold_adjust" && note === NOTE_THIN_WORDLIST) {
    return {
      weak_reason: `english_wordlist_token_match_borderline_count_${pe}`,
      recommended_action: "revisit_wordlist_adequacy_rule_or_add_more_list_specific_stems",
    };
  }

  if (fixType === "mapping_refine" && note === NOTE_THIN_OR_LINK) {
    return {
      weak_reason: "english_curriculum_topic_access_thin_or_link_only_no_adequate_pool_proxy_hits",
      recommended_action:
        "improve_grade_topic_pool_mapping_or_add_explicit_topic_tags_for_curriculum_access_nodes",
    };
  }

  if (fixType === "mapping_refine" && (note === NOTE_GRAMMAR_POOLS_NO_LINE || note === NOTE_GRAMMAR_SINGLE_LINE)) {
    return {
      weak_reason:
        note === NOTE_GRAMMAR_SINGLE_LINE
          ? "english_grammar_line_single_stem_hit_curriculum_description_match"
          : "english_grammar_pools_in_grade_span_without_curriculum_line_description_substring_hit",
      recommended_action:
        "add_grammar_line_id_join_or_align_pool_stems_with_official_curriculum_line_description_text",
    };
  }

  return {
    weak_reason: `classified_fix_type_${fixType}_subject_${subj}`,
    recommended_action: "review_skill_row_in_skill_coverage_json_and_phase_7_17_backlog",
  };
}

function phase717Recommendation(classified) {
  const p0 = classified.filter((c) => c.priority === "P0").map((c) => c.skill_id).sort();
  const p1 = classified.filter((c) => c.priority === "P1").map((c) => c.skill_id).sort();
  const harness = classified
    .filter((c) => c.fix_type === "harness_expand")
    .map((c) => c.skill_id)
    .sort();
  const lines = [];
  lines.push("Phase_7_17_order:");
  lines.push("1) Address_P0_true_content_gaps_in_order:");
  for (const id of p0) lines.push(`   - ${id}`);
  lines.push("2) Expand_deterministic_harness_for_P1_math_geometry_kinds:");
  for (const id of harness) lines.push(`   - ${id}`);
  lines.push("3) Address_P1_mapping_and_borderline_hebrew:");
  for (const id of p1) {
    if (!harness.includes(id)) lines.push(`   - ${id}`);
  }
  lines.push("4) Defer_geography_bucket_weak_list_all_accept_as_broad_until_product_requires_line_level_proof");
  lines.push("5) Schedule_threshold_and_mapping_refine_P2_items_after_P0_P1_burn_down");
  return lines.join("\n");
}

function subjectSummaries(classified) {
  const by = (sub) => classified.filter((c) => c.subject === sub).sort((a, b) => a.skill_id.localeCompare(b.skill_id));
  const he = by("hebrew");
  const ma = by("math");
  const ge = by("geometry");
  const en = by("english");
  const sc = by("science");
  const gg = by("geography");

  const heContent = he.filter((c) => c.fix_type === "content_add").map((c) => c.skill_id);
  const heThresh = he.filter((c) => c.fix_type === "threshold_adjust").map((c) => c.skill_id);

  const mathHarness = ma.filter((c) => c.fix_type === "harness_expand").map((c) => c.skill_id);
  const mathThresh = ma.filter((c) => c.fix_type === "threshold_adjust").map((c) => c.skill_id);

  const geoHarness = ge.filter((c) => c.fix_type === "harness_expand").map((c) => c.skill_id);
  const geoThresh = ge.filter((c) => c.fix_type === "threshold_adjust").map((c) => c.skill_id);

  const enThinTopic = en.filter((c) => c.mapping_note === NOTE_THIN_OR_LINK).map((c) => c.skill_id);
  const enWordlistShared = en.filter((c) => c.mapping_note === NOTE_ENG_POOL_SHARED).map((c) => c.skill_id);
  const enPools = en.filter((c) => String(c.skill_id).startsWith("english:pool:")).map((c) => c.skill_id);
  const enGrammar = en.filter((c) => c.spine_layer === "curriculum_grammar_line").map((c) => c.skill_id);

  return {
    hebrew: {
      content_add_skill_ids_sorted: heContent.sort(),
      threshold_adjust_skill_ids_sorted: heThresh.sort(),
      summary_md_hint:
        "Hebrew_weak_splits_real_content_add_1_2_hits_vs_threshold_adjust_3_4_borderline_under_current_gate",
    },
    math: {
      harness_expand_skill_ids_sorted: mathHarness.sort(),
      threshold_adjust_low_sample_skill_ids_sorted: mathThresh.sort(),
    },
    geometry: {
      harness_expand_skill_ids_sorted: geoHarness.sort(),
      threshold_adjust_low_sample_skill_ids_sorted: geoThresh.sort(),
    },
    english: {
      curriculum_topic_access_thin_or_link_only_sorted: enThinTopic.sort(),
      vocabulary_wordlist_shared_bank_proxy_sorted: enWordlistShared.sort(),
      translation_pools_weak_sorted: enPools.sort(),
      grammar_line_weak_sorted: enGrammar.sort(),
    },
    science: {
      weak_skill_ids_sorted: sc.map((c) => c.skill_id).sort(),
    },
    geography: {
      all_weak_accept_as_broad_p2_count: gg.length,
      note: "all_geography_weak_rows_locked_to_accept_as_broad_and_P2_in_phase_7_16",
    },
  };
}

function buildMarkdown(meta, countsByFix, countsByPri, p0, p1, p2, classified, summaries, phase717) {
  const lines = [];
  lines.push("# Weak coverage action plan (Phase 7.16)");
  lines.push("");
  lines.push(`- **classification_version:** ${meta.classification_version}`);
  lines.push(`- **total_weak:** ${meta.total_weak}`);
  lines.push(`- **deterministic:** ${meta.deterministic}`);
  lines.push("");
  lines.push("## Integrity");
  lines.push("");
  lines.push("- counts_by_fix_type sum equals total_weak");
  lines.push("- counts_by_priority sum equals total_weak");
  lines.push("- P0 ∪ P1 ∪ P2 equals all weak skill_ids (no duplicates)");
  lines.push("");
  lines.push("## counts_by_fix_type");
  lines.push("");
  lines.push("```json");
  lines.push(JSON.stringify(countsByFix, null, 2));
  lines.push("```");
  lines.push("");
  lines.push("## counts_by_priority");
  lines.push("");
  lines.push("```json");
  lines.push(JSON.stringify(countsByPri, null, 2));
  lines.push("```");
  lines.push("");
  lines.push("## P0 (exact)");
  lines.push("");
  for (const id of p0) lines.push(`- ${id}`);
  lines.push("");
  lines.push("## P1 (exact)");
  lines.push("");
  for (const id of p1) lines.push(`- ${id}`);
  lines.push("");
  lines.push("## P2 count");
  lines.push("");
  lines.push(`- ${p2.length} skill_ids (see JSON p2_skill_ids)`);
  lines.push("");
  lines.push("## Phase 7.17 recommendation");
  lines.push("");
  lines.push("```text");
  lines.push(phase717);
  lines.push("```");
  lines.push("");
  lines.push("## Subject summaries (structured)");
  lines.push("");
  lines.push("```json");
  lines.push(JSON.stringify(summaries, null, 2));
  lines.push("```");
  lines.push("");
  lines.push("## Full classified rows");
  lines.push("");
  lines.push("See `weak-coverage-action-plan.json` → `skills`.");
  lines.push("");
  return lines.join("\n");
}

mkdirSync(OUT_DIR, { recursive: true });

let detail;
try {
  detail = loadJson(INPUT);
} catch (e) {
  console.error("[audit:weak-coverage-plan] Missing or invalid skill-coverage.json — run npm run audit:skill-coverage");
  process.exit(1);
}

const skills = Array.isArray(detail.skills) ? detail.skills : [];
if (skills.length === 0) {
  console.error("[audit:weak-coverage-plan] skills[] empty");
  process.exit(1);
}

const weakRows = skills.filter((s) => s.coverage_class === "weak");
const listWeak = Array.isArray(detail.lists?.weak_coverage_skill_ids)
  ? detail.lists.weak_coverage_skill_ids
  : [];
if (listWeak.length !== weakRows.length) {
  console.warn(
    `[audit:weak-coverage-plan] weak row count ${weakRows.length} != lists.weak_coverage_skill_ids ${listWeak.length}`,
  );
}

const classified = [];
for (const row of weakRows) {
  const skillId = String(row.skill_id || "");
  const subject = String(row.subject || "");

  let fixType;
  let usedFallback = false;

  if (subject === "geography") {
    fixType = "accept_as_broad";
  } else {
    const candidates = candidateFixTypes(row);
    const picked = pickFixType(candidates);
    if (picked === null) {
      fixType = FALLBACK.fix_type;
      usedFallback = true;
    } else {
      fixType = picked;
    }
  }

  const priority = subject === "geography" ? "P2" : priorityFor({ ...row, subject }, fixType);
  const { weak_reason, recommended_action } = weakReasonAndAction(
    { ...row, subject },
    fixType,
    usedFallback && subject !== "geography",
  );

  classified.push({
    skill_id: skillId,
    subject,
    topic: row.topic ?? "",
    spine_layer: row.spine_layer ?? "",
    minGrade: row.minGrade,
    maxGrade: row.maxGrade,
    source_kind: row.source_kind ?? "",
    coverage_class: row.coverage_class,
    primary_evidence_count: row.primary_evidence_count,
    mapping_note: row.mapping_note ?? "",
    fix_type: fixType,
    priority,
    weak_reason,
    recommended_action,
  });
}

classified.sort((a, b) => a.skill_id.localeCompare(b.skill_id));

const countsByFixType = {};
const countsByPriority = {};
for (const t of RULES_PRIORITY_ORDER) countsByFixType[t] = 0;
for (const c of classified) {
  countsByFixType[c.fix_type] = (countsByFixType[c.fix_type] || 0) + 1;
  countsByPriority[c.priority] = (countsByPriority[c.priority] || 0) + 1;
}

const totalWeak = classified.length;
const sumFix = RULES_PRIORITY_ORDER.reduce((s, t) => s + (countsByFixType[t] || 0), 0);
const sumPri = (countsByPriority.P0 || 0) + (countsByPriority.P1 || 0) + (countsByPriority.P2 || 0);

const p0List = classified.filter((c) => c.priority === "P0").map((c) => c.skill_id).sort();
const p1List = classified.filter((c) => c.priority === "P1").map((c) => c.skill_id).sort();
const p2List = classified.filter((c) => c.priority === "P2").map((c) => c.skill_id).sort();

const allIds = new Set(classified.map((c) => c.skill_id));
const union = new Set([...p0List, ...p1List, ...p2List]);
let integrityOk = true;
if (sumFix !== totalWeak) {
  console.error(`[audit:weak-coverage-plan] INTEGRITY FAIL: sum counts_by_fix_type ${sumFix} != total_weak ${totalWeak}`);
  integrityOk = false;
}
if (sumPri !== totalWeak) {
  console.error(`[audit:weak-coverage-plan] INTEGRITY FAIL: sum counts_by_priority ${sumPri} != total_weak ${totalWeak}`);
  integrityOk = false;
}
if (union.size !== totalWeak || union.size !== p0List.length + p1List.length + p2List.length) {
  console.error("[audit:weak-coverage-plan] INTEGRITY FAIL: P0/P1/P2 union mismatch or duplicate priorities");
  integrityOk = false;
}
for (const id of allIds) {
  if (!union.has(id)) {
    console.error(`[audit:weak-coverage-plan] INTEGRITY FAIL: missing ${id} from priority lists`);
    integrityOk = false;
  }
}

if (!integrityOk) process.exit(1);

const phase717 = phase717Recommendation(classified);
const summaries = subjectSummaries(classified);

const classificationRubric = {
  rules_priority_order: [...RULES_PRIORITY_ORDER],
  geography_lock: { fix_type: "accept_as_broad", priority: "P2" },
  fallback: { ...FALLBACK },
  science_note_includes_literals: [SCIENCE_SPARSE_SUB, SCIENCE_LOW_GLOBAL_SUB],
  exact_mapping_notes: [
    NOTE_AUDIT_HITS_1_4,
    NOTE_HARNESS_ONLY,
    NOTE_LOW_SAMPLE,
    NOTE_THIN_OR_LINK,
    NOTE_ENG_POOL_SHARED,
    NOTE_THIN_WORDLIST,
    NOTE_GRAMMAR_POOLS_NO_LINE,
    NOTE_GRAMMAR_SINGLE_LINE,
  ],
  hebrew_content_map: { content_add_primary_lte: 2, threshold_adjust_primary_gte: 3 },
  english_pool_weak_empty_note: { content_add_primary_1_to_3: true, threshold_adjust_primary_4_to_11: true },
  english_wordlist_thin: { content_add_primary_lte: 1, threshold_adjust_primary_gte: 2 },
};

const meta = {
  total_weak: totalWeak,
  classification_version: "7.16_v1",
  deterministic: true,
  rules_priority_order: [...RULES_PRIORITY_ORDER],
  weak_list_length_mismatch: listWeak.length !== weakRows.length ? { list: listWeak.length, rows: weakRows.length } : null,
  classification_rubric: classificationRubric,
  integrity_checks_passed: true,
  input: "reports/curriculum-spine/skill-coverage.json",
};

const outObj = sortKeysDeep({
  meta,
  counts_by_fix_type: countsByFixType,
  counts_by_priority: countsByPriority,
  p0_skill_ids: p0List,
  p1_skill_ids: p1List,
  p2_skill_ids: p2List,
  phase_7_17_recommendation: phase717,
  subject_summaries: summaries,
  skills: classified,
});

writeFileSync(OUT_JSON, JSON.stringify(outObj, null, 2) + "\n", "utf8");
writeFileSync(
  OUT_MD,
  buildMarkdown(meta, countsByFixType, countsByPriority, p0List, p1List, p2List, classified, summaries, phase717),
  "utf8",
);

console.log(
  JSON.stringify(
    {
      ok: true,
      out_json: OUT_JSON,
      out_md: OUT_MD,
      total_weak: totalWeak,
      counts_by_fix_type: countsByFixType,
      counts_by_priority: countsByPriority,
      p0_count: p0List.length,
      p1_count: p1List.length,
      integrity_checks_passed: true,
    },
    null,
    2,
  ),
);
