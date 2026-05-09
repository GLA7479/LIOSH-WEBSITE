/**
 * Advisory curriculum audit: compares question inventory to Israeli primary skeleton map.
 * Does not gate builds or modify banks.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { generateQuestionInventory } from "./scan-question-inventory.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT_DIR = join(ROOT, "reports", "curriculum-audit");

async function loadCurriculumMapModule() {
  const href = pathToFileURL(
    join(ROOT, "utils/curriculum-audit/israeli-primary-curriculum-map.js")
  ).href;
  return import(href);
}

async function loadTopicNormalizer() {
  const href = pathToFileURL(
    join(ROOT, "utils/curriculum-audit/curriculum-topic-normalizer.js")
  ).href;
  return import(href);
}

async function loadDepthHeuristics() {
  const href = pathToFileURL(
    join(ROOT, "utils/curriculum-audit/curriculum-depth-heuristics.js")
  ).href;
  return import(href);
}

/**
 * @typedef {'aligned' | 'aligned_low_confidence' | 'too_easy' | 'too_advanced' | 'wrong_subject' | 'unclear_topic' | 'enrichment_only' | 'missing_metadata' | 'needs_human_review'} CurriculumClassification
 */

/**
 * @param {object} ctx
 * @param {(s: string, g: number) => object | null} ctx.getGradeEntry
 * @param {(s: string, g: number, k: string) => { bucket: string, def: object } | null} ctx.findTopicPlacement
 * @param {(i: object) => object} ctx.normalizeInventoryTopic
 */
function makeClassifyRecord(ctx) {
  const { getGradeEntry, findTopicPlacement, normalizeInventoryTopic } = ctx;

  /**
   * @param {object} rec
   * @returns {{ classification: CurriculumClassification, reasons: string[], detail?: object, norm?: object, placement?: object | null }}
   */
  return function classifyRecord(rec) {
    const mc = rec.metadataCompleteness || {};
    const reasons = [];

    if (!mc.hasGrade || rec.gradeMin == null || rec.gradeMax == null) {
      reasons.push("missing_or_invalid_grade_span");
      return { classification: "missing_metadata", reasons };
    }
    if (!mc.hasTopic || !String(rec.topic || "").trim()) {
      reasons.push("missing_topic");
      return { classification: "unclear_topic", reasons };
    }
    if (!mc.hasDifficulty) {
      reasons.push("missing_difficulty");
      return { classification: "missing_metadata", reasons };
    }

    const subject = rec.subject;
    const ROUTED_SUBJECTS = new Set([
      "math",
      "geometry",
      "hebrew",
      "english",
      "science",
      "moledet-geography",
    ]);
    if (!ROUTED_SUBJECTS.has(subject)) {
      reasons.push("unexpected_subject_label");
      return { classification: "wrong_subject", reasons };
    }

    const norm = normalizeInventoryTopic({
      subject,
      topic: rec.topic,
      subtopic: rec.subtopic,
    });

    const gradeEntry = getGradeEntry(subject, rec.gradeMin);
    if (!gradeEntry) {
      reasons.push("subject_not_in_curriculum_skeleton");
      return {
        classification: "needs_human_review",
        reasons,
        norm,
        placement: null,
      };
    }

    const placement = findTopicPlacement(subject, rec.gradeMin, norm.normalizedTopicKey);

    if (subject === "moledet-geography") {
      reasons.push("moledet_curriculum_band_low_confidence_deferred");
      return {
        classification: "needs_human_review",
        reasons,
        detail: { sourceNotes: gradeEntry.sourceNotes, placement },
        norm,
        placement,
      };
    }

    if (!placement) {
      if (norm.normalizationConfidence === "low") {
        reasons.push("normalizer_low_uncertain_topic_key");
      } else {
        reasons.push("no_curriculum_bucket_match_for_normalized_key");
      }
      return {
        classification: "needs_human_review",
        reasons,
        detail: { normalizedTopicKey: norm.normalizedTopicKey },
        norm,
        placement: null,
      };
    }

    const gc = gradeEntry.confidence;
    const tc = placement.def?.confidence || "medium";
    const diff = String(rec.difficulty || "").toLowerCase();

    if (placement.bucket === "notExpectedYet") {
      reasons.push("topic_marked_not_expected_yet_for_this_grade");
      return {
        classification: "too_advanced",
        reasons,
        norm,
        placement,
      };
    }

    if (placement.bucket === "enrichmentTopics") {
      reasons.push("topic_in_enrichment_bucket");
      return {
        classification: "enrichment_only",
        reasons,
        norm,
        placement,
      };
    }

    if (gc === "low") {
      reasons.push("grade_band_confidence_low_no_strong_alignment_claim");
      return {
        classification: "needs_human_review",
        reasons,
        detail: { placement },
        norm,
        placement,
      };
    }

    if (placement.bucket === "coreTopics") {
      if (norm.normalizationConfidence === "low") {
        reasons.push("normalizer_low_uncertain_while_bucket_matched");
        return {
          classification: "needs_human_review",
          reasons,
          norm,
          placement,
        };
      }

      if (rec.gradeMin >= 5 && diff === "easy") {
        reasons.push("possible_band_mislabel_easy_on_upper_grade");
        return {
          classification: "too_easy",
          reasons,
          norm,
          placement,
        };
      }

      const eligibleStrictAligned =
        norm.normalizationConfidence === "high" &&
        tc !== "low" &&
        gc !== "low";

      if (eligibleStrictAligned) {
        reasons.length = 0;
        reasons.push("core_match_explicit_conservative");
        return {
          classification: "aligned",
          reasons,
          norm,
          placement,
        };
      }

      reasons.length = 0;
      reasons.push("core_match_lower_confidence_not_plain_aligned");
      return {
        classification: "aligned_low_confidence",
        reasons,
        norm,
        placement,
      };
    }

    if (placement.bucket === "allowedTopics") {
      reasons.push("allowed_bucket_match_not_core");
      return {
        classification: "aligned_low_confidence",
        reasons,
        norm,
        placement,
      };
    }

    reasons.push("unexpected_placement_bucket");
    return {
      classification: "needs_human_review",
      reasons,
      norm,
      placement,
    };
  };
}

function bandLabel(g) {
  if (g <= 2) return "early";
  if (g <= 4) return "mid";
  return "late";
}

function stemNormalizeHint(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\d+/g, "#");
}

/** Phase 3: prioritize review queue topics — plain `aligned` stays low unless depth/dup/span signals exist. */
const RISK_CLASS_BASE = {
  missing_metadata: 100,
  unclear_topic: 96,
  needs_human_review: 88,
  aligned_low_confidence: 58,
  too_advanced: 54,
  too_easy: 50,
  enrichment_only: 44,
  wrong_subject: 40,
  aligned: 14,
};

const RISK_FLAG_WEIGHT = {
  english_grammar_early_grade: 24,
  english_sentence_writing_early_grade: 24,
  english_reading_comprehension_early_grade: 22,
  geometry_volume_early: 26,
  geometry_diagonals_early: 26,
  geometry_area_too_broad: 18,
  geometry_advanced_angles_early_grade: 24,
  math_fractions_depth_unclear: 16,
  math_percentages_too_early_grade: 22,
  hebrew_language_complexity_early_grade: 20,
  science_grade_low_coverage: 12,
  hebrew_upper_grade_low_coverage: 12,
  wide_grade_span_requires_review: 14,
  duplicate_across_grades_requires_review: 20,
  topic_shallow_cross_grade_spread: 16,
  moledet_values_homeland_repeated_across_grades: 10,
};

/**
 * @param {object} rec
 * @param {object} row classification row (includes classification, depthFlags, duplicatePeerCount)
 */
function riskScorePhase3(rec, row) {
  const c = row.classification;
  let s = RISK_CLASS_BASE[c] ?? 36;

  const mc = rec.metadataCompleteness || {};
  if (mc.missingCritical) s += 14;
  if (!mc.hasTopic) s += 12;
  if (!mc.hasGrade) s += 12;
  if (!mc.hasDifficulty) s += 8;

  const gmin = Number(rec.gradeMin);
  const gmax = Number(rec.gradeMax);
  const span = Number.isFinite(gmax) && Number.isFinite(gmin) ? gmax - gmin : 0;
  if (span >= 3) s += 20;
  else if (span >= 2) s += 14;
  else if (Number.isFinite(gmin) && Number.isFinite(gmax) && bandLabel(gmin) !== bandLabel(gmax)) {
    s += 8;
  }

  const dupPeers = row.duplicatePeerCount ?? 0;
  const genOnly = rec.questionType === "generator_sample";
  s += dupPeers * (genOnly ? 6 : 18);

  for (const f of row.depthFlags || []) {
    s += RISK_FLAG_WEIGHT[f] ?? 12;
  }

  if (c === "enrichment_only" && span >= 2) s += 12;

  const noDepth = !(row.depthFlags && row.depthFlags.length);
  const noDup = dupPeers === 0;
  const narrowSpan = span < 2;
  if (c === "aligned" && noDepth && noDup && narrowSpan && !mc.missingCritical) {
    s = Math.min(s, 30);
  }

  return s;
}

function buildMarkdown(report) {
  const {
    generatedAt,
    summary,
    countsByClassification,
    duplicateWarnings,
    sections,
    curriculumMapMeta,
  } = report;

  const lines = [
    `# Curriculum audit (latest)`,
    ``,
    `- Generated: ${generatedAt}`,
    `- Map: v${curriculumMapMeta.version} — ${curriculumMapMeta.scope}`,
    `- Disclaimer: ${curriculumMapMeta.disclaimer}`,
    ``,
    `## Totals`,
    ``,
    `- **Total questions:** ${summary.total}`,
    ``,
    `### By subject`,
    ``,
    ...Object.entries(summary.bySubject)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, v]) => `- ${k}: ${v}`),
    ``,
    `### By grade (primary gradeMin)`,
    ``,
    ...Object.entries(summary.byGrade)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([k, v]) => `- Grade ${k}: ${v}`),
    ``,
    `### By subject + grade`,
    ``,
    ...Object.entries(summary.bySubjectGrade)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, v]) => `- ${k}: ${v}`),
    ``,
    `### By topic (truncated to top 40 by volume)`,
    ``,
    ...summary.topicTop
      .slice(0, 40)
      .map(([k, v]) => `- ${k}: ${v}`),
    ``,
    `### Difficulty × grade (primary gradeMin)`,
    ``,
    ...Object.entries(summary.difficultyByGrade)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([g, o]) => `- Grade ${g}: ${JSON.stringify(o)}`),
    ``,
    `### Classification counts`,
    ``,
    ...Object.entries(countsByClassification)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, v]) => `- **${k}**: ${v}`),
    ``,
    `## Missing metadata`,
    ``,
    ...sections.missingMetadata.slice(0, 80).map((x) => `- \`${x.questionId}\` (${x.subject}) — ${x.reasons.join(", ")}`),
    sections.missingMetadata.length > 80
      ? `\n… ${sections.missingMetadata.length - 80} more in JSON\n`
      : ``,
    `## Grade span / mismatch candidates`,
    ``,
    `Wide spans or cross-band primary grades (advisory).`,
    ``,
    ...sections.gradeMismatch.slice(0, 80).map(
      (x) =>
        `- \`${x.questionId}\` grades ${x.gradeMin}–${x.gradeMax} (${x.subject} / ${x.topic})`
    ),
    ``,
    `## Too advanced (map-driven)`,
    ``,
    ...sections.tooAdvanced.slice(0, 60).map((x) => `- \`${x.questionId}\` — ${x.reasons.join(", ")}`),
    ``,
    `## Enrichment-only (map-driven)`,
    ``,
    ...sections.enrichmentOnly.slice(0, 60).map((x) => `- \`${x.questionId}\` — ${x.reasons.join(", ")}`),
    ``,
    `## Topics with few static questions (< ${summary.lowTopicThreshold})`,
    ``,
    ...sections.topicsWithFewQuestions.slice(0, 60).map((x) => `- ${x.key}: ${x.count}`),
    ``,
    `## Duplicate / near-duplicate warnings`,
    ``,
    ...duplicateWarnings.slice(0, 40).map(
      (w) =>
        `- **${w.kind}** subject=${w.subject} hash=${w.stemHash?.slice(0, 16)}… rows=${w.rowCount} grades=${JSON.stringify(w.gradeSpan)} preview=${JSON.stringify(w.preview?.slice(0, 80))}`
    ),
    duplicateWarnings.length > 40 ? `\n… truncated (see latest.json)\n` : ``,
    ``,
    `## Top 50 highest-risk manual review`,
    ``,
    ...sections.top50Risk.map((x, i) => {
      const flags =
        x.depthFlags && x.depthFlags.length ? x.depthFlags.join(", ") : "—";
      return `${i + 1}. score=${x.score.toFixed(1)} [${x.classification}] depth=${flags} \`${x.questionId}\` ${x.subject} g${x.gradeMin}-${x.gradeMax} ${x.topic} — ${x.reasons.join("; ")}`;
    }),
    ``,
  ];
  return lines.join("\n");
}

export async function runCurriculumAudit(opts = {}) {
  const writeFiles = opts.writeFiles !== false;
  const mapMod = await loadCurriculumMapModule();
  const normMod = await loadTopicNormalizer();
  const depthMod = await loadDepthHeuristics();
  const { CURRICULUM_MAP_META, getGradeEntry, findTopicPlacement } = mapMod;
  const { normalizeInventoryTopic } = normMod;
  const { analyzeCurriculumDepth, mergeDepthFlagsIntoClassification } = depthMod;
  const classifyRecord = makeClassifyRecord({
    getGradeEntry,
    findTopicPlacement,
    normalizeInventoryTopic,
  });

  const inventory = await generateQuestionInventory({ writeFiles });

  const scienceByGrade = Object.fromEntries([1, 2, 3, 4, 5, 6].map((g) => [g, 0]));
  const hebrewByGrade = Object.fromEntries([1, 2, 3, 4, 5, 6].map((g) => [g, 0]));
  for (const rec of inventory.records) {
    if (rec.subject === "science") {
      for (let g = Number(rec.gradeMin); g <= Number(rec.gradeMax); g++) {
        if (g >= 1 && g <= 6) scienceByGrade[g] += 1;
      }
    }
    if (rec.subject === "hebrew") {
      for (let g = Number(rec.gradeMin); g <= Number(rec.gradeMax); g++) {
        if (g >= 1 && g <= 6) hebrewByGrade[g] += 1;
      }
    }
  }

  /** @type {Map<string, Set<number>>} */
  const normKeyGrades = new Map();
  for (const rec of inventory.records) {
    const norm = normalizeInventoryTopic({
      subject: rec.subject,
      topic: rec.topic,
      subtopic: rec.subtopic,
    });
    const nkKey = `${rec.subject}|${norm.normalizedTopicKey}`;
    if (!normKeyGrades.has(nkKey)) normKeyGrades.set(nkKey, new Set());
    for (let g = Number(rec.gradeMin); g <= Number(rec.gradeMax); g++) {
      if (g >= 1 && g <= 6) normKeyGrades.get(nkKey).add(g);
    }
  }
  const normKeyGradesLookup = Object.fromEntries(normKeyGrades);

  const stemHashGroups = new Map();
  for (const rec of inventory.records) {
    const h = rec.stemHash;
    if (!h) continue;
    const k = `${rec.subject}|${h}`;
    if (!stemHashGroups.has(k)) stemHashGroups.set(k, []);
    stemHashGroups.get(k).push(rec);
  }

  const duplicateCollisionCount = new Map();
  for (const rec of inventory.records) {
    const h = rec.stemHash;
    if (!h) continue;
    const k = `${rec.subject}|${h}`;
    duplicateCollisionCount.set(k, (duplicateCollisionCount.get(k) || 0) + 1);
  }
  function duplicatePeerCountForQuestionId(id) {
    const rec = inventory.records.find((r) => r.questionId === id);
    const h = rec?.stemHash;
    if (!h || !rec?.subject) return 0;
    const k = `${rec.subject}|${h}`;
    const n = duplicateCollisionCount.get(k) || 0;
    return Math.max(0, n - 1);
  }

  /** @type {Array<object>} */
  const classifications = [];
  const countsByClassification = {};

  for (const rec of inventory.records) {
    const cls = classifyRecord(rec);
    const norm =
      cls.norm ||
      normalizeInventoryTopic({
        subject: rec.subject,
        topic: rec.topic,
        subtopic: rec.subtopic,
      });
    const dupPeers = duplicatePeerCountForQuestionId(rec.questionId);
    const depth = analyzeCurriculumDepth(rec, norm, {
      coverageContext: { scienceByGrade, hebrewByGrade },
      normKeyGrades: normKeyGradesLookup,
      duplicatePeerCount: dupPeers,
    });
    const merged = mergeDepthFlagsIntoClassification(
      cls.classification,
      cls.reasons,
      depth,
      cls.placement,
      rec
    );
    classifications.push({
      questionId: rec.questionId,
      subject: rec.subject,
      gradeMin: rec.gradeMin,
      gradeMax: rec.gradeMax,
      topic: rec.topic,
      subtopic: rec.subtopic,
      difficulty: rec.difficulty,
      normalizedTopicKey: norm.normalizedTopicKey,
      normalizationConfidence: norm.normalizationConfidence,
      normalizedTopicLabelHe: norm.normalizedTopicLabelHe,
      placementBucket: cls.placement?.bucket ?? null,
      mappedCurriculumKey: cls.placement?.def?.key ?? null,
      classification: merged.classification,
      reasons: merged.reasons,
      detail: cls.detail,
      questionType: rec.questionType,
      sourceFile: rec.sourceFile,
      depthFlags: depth.depthFlags,
      depthNotes: depth.notes,
      depthAdjusted: merged.depthAdjusted,
      duplicatePeerCount: dupPeers,
    });
    const ck = merged.classification;
    countsByClassification[ck] = (countsByClassification[ck] || 0) + 1;
  }

  const total = inventory.records.length;
  const bySubject = {};
  const byGrade = {};
  const bySubjectGrade = {};
  const byTopic = {};
  const difficultyByGrade = {};

  for (const rec of inventory.records) {
    bySubject[rec.subject] = (bySubject[rec.subject] || 0) + 1;
    const g = String(rec.gradeMin ?? "?");
    byGrade[g] = (byGrade[g] || 0) + 1;
    const sg = `${rec.subject} / g${rec.gradeMin}`;
    bySubjectGrade[sg] = (bySubjectGrade[sg] || 0) + 1;
    const tk = `${rec.subject} :: ${rec.topic || "?"}`;
    byTopic[tk] = (byTopic[tk] || 0) + 1;
    if (!difficultyByGrade[g]) difficultyByGrade[g] = {};
    const d = rec.difficulty || "unknown";
    difficultyByGrade[g][d] = (difficultyByGrade[g][d] || 0) + 1;
  }

  const topicTop = Object.entries(byTopic).sort((a, b) => b[1] - a[1]);

  /** @type {Array<object>} */
  const duplicateWarnings = [];
  for (const [, list] of stemHashGroups) {
    if (list.length < 2) continue;
    const grades = new Set();
    for (const r of list) {
      for (let g = Number(r.gradeMin); g <= Number(r.gradeMax); g++) grades.add(g);
    }
    const gmin = Math.min(...grades);
    const gmax = Math.max(...grades);
    duplicateWarnings.push({
      kind: "exact_stem_hash_collision",
      subject: list[0].subject,
      stemHash: list[0].stemHash,
      rowCount: list.length,
      gradeSpan: [gmin, gmax],
      preview: list[0].textPreview,
    });
  }

  const normGroups = new Map();
  for (const rec of inventory.records) {
    if (String(rec.questionType) === "generator_sample") continue;
    const n = stemNormalizeHint(rec.textPreview);
    if (n.length < 12) continue;
    const k = `${rec.subject}|${n}`;
    if (!normGroups.has(k)) normGroups.set(k, []);
    normGroups.get(k).push(rec);
  }
  for (const [, list] of normGroups) {
    if (list.length < 2) continue;
    const hashes = new Set(list.map((r) => r.stemHash).filter(Boolean));
    if (hashes.size < 2) continue;
    duplicateWarnings.push({
      kind: "near_duplicate_normalized_text",
      subject: list[0].subject,
      rowCount: list.length,
      distinctStemHashes: hashes.size,
      preview: list[0].textPreview?.slice(0, 120),
    });
  }

  duplicateWarnings.sort((a, b) => (b.rowCount || 0) - (a.rowCount || 0));

  const missingMetadata = classifications.filter(
    (x) => x.classification === "missing_metadata"
  );
  const gradeMismatch = inventory.records
    .filter((r) => Number(r.gradeMax) - Number(r.gradeMin) >= 2)
    .map((r) => ({
      questionId: r.questionId,
      subject: r.subject,
      topic: r.topic,
      gradeMin: r.gradeMin,
      gradeMax: r.gradeMax,
    }));
  const tooAdvanced = classifications.filter((x) => x.classification === "too_advanced");
  const enrichmentOnly = classifications.filter((x) => x.classification === "enrichment_only");

  const LOW_TOPIC_THRESHOLD = 5;
  const staticTopicCounts = new Map();
  for (const rec of inventory.records) {
    if (rec.questionType === "generator_sample") continue;
    const key = `${rec.subject} :: ${rec.topic || "?"}`;
    staticTopicCounts.set(key, (staticTopicCounts.get(key) || 0) + 1);
  }
  const topicsWithFewQuestions = [...staticTopicCounts.entries()]
    .filter(([, c]) => c < LOW_TOPIC_THRESHOLD)
    .sort((a, b) => a[1] - b[1])
    .map(([key, count]) => ({ key, count }));

  const scored = classifications.map((c) => {
    const rec = inventory.records.find((r) => r.questionId === c.questionId);
    const score = riskScorePhase3(rec, c);
    return {
      questionId: c.questionId,
      score,
      classification: c.classification,
      reasons: c.reasons,
      depthFlags: c.depthFlags,
      subject: rec?.subject,
      gradeMin: rec?.gradeMin,
      gradeMax: rec?.gradeMax,
      topic: rec?.topic,
    };
  });
  scored.sort((a, b) => b.score - a.score);
  const top50Risk = scored.slice(0, 50);

  const report = {
    generatedAt: new Date().toISOString(),
    curriculumMapMeta: CURRICULUM_MAP_META,
    inventoryGeneratedAt: inventory.generatedAt,
    summary: {
      total,
      bySubject,
      byGrade,
      bySubjectGrade,
      byTopic,
      topicTop,
      difficultyByGrade,
      lowTopicThreshold: LOW_TOPIC_THRESHOLD,
    },
    countsByClassification,
    classifications,
    duplicateWarnings,
    sections: {
      missingMetadata,
      gradeMismatch,
      tooAdvanced,
      enrichmentOnly,
      topicsWithFewQuestions,
      top50Risk,
    },
  };

  if (writeFiles) {
    await mkdir(OUT_DIR, { recursive: true });
    await writeFile(join(OUT_DIR, "latest.json"), JSON.stringify(report, null, 2), "utf8");
    await writeFile(join(OUT_DIR, "latest.md"), buildMarkdown(report), "utf8");
    console.log(`Wrote curriculum audit to ${OUT_DIR}/latest.{json,md}`);
  }

  return report;
}

function isExecutedAsMainScript() {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    const self = fileURLToPath(import.meta.url);
    return resolve(entry) === resolve(self);
  } catch {
    return false;
  }
}

if (isExecutedAsMainScript()) {
  runCurriculumAudit({ writeFiles: true }).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
