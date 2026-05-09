/**
 * Phase 4B-0 / 4B-0b — Compare question inventory to official curriculum spine + source quality flags.
 */
import { readFileSync, existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { normalizeInventoryTopic } from "../../utils/curriculum-audit/curriculum-topic-normalizer.js";
import { findTopicPlacement } from "../../utils/curriculum-audit/israeli-primary-curriculum-map.js";
import {
  OFFICIAL_PRIMARY_CURRICULUM_SPINE,
  findOfficialTopicPlacement,
  OFFICIAL_SPINE_META,
} from "../../utils/curriculum-audit/official-primary-curriculum-spine.js";
import {
  getSubjectSourceProfile,
  exactGradeTopicRegistryCovers,
} from "../../utils/curriculum-audit/official-source-subject-profile.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT_DIR = join(ROOT, "reports", "curriculum-audit");
const INV_PATH = join(OUT_DIR, "question-inventory.json");
const SPINE_PATH = join(OUT_DIR, "official-curriculum-spine.json");

function loadJson(path, label) {
  if (!existsSync(path)) {
    throw new Error(`Missing ${label}: ${path}`);
  }
  return JSON.parse(readFileSync(path, "utf8"));
}

/**
 * @param {object} record
 * @param {string} normKey
 */
function classifyRow(record, normKey, norm) {
  const subject = record.subject || "";
  const gmin = Number(record.gradeMin);
  const gmax = Number(record.gradeMax);
  const internal = findTopicPlacement(subject, gmin, normKey);
  const official = findOfficialTopicPlacement(subject, gmin, normKey);
  const gradeSlot =
    OFFICIAL_PRIMARY_CURRICULUM_SPINE[subject]?.[`grade_${gmin}`] || null;

  /** @type {string[]} */
  const tags = [];

  if (subject === "moledet-geography" && (gmin < 2 || gmin > 4)) {
    tags.push("moladeta_grade_band_warning");
  }

  if (subject === "english" && gmin <= 2 && normKey.includes("english.grammar")) {
    tags.push("english_early_grade_grammar_scope");
    if (internal?.bucket === "coreTopics") tags.push("english_early_grammar_core_internal");
  }

  if (subject === "geometry" && gmin <= 2) {
    if (normKey.includes("pythagoras")) tags.push("geometry_early_depth_warning");
    /* Volume is allowed from grade 2 in POP geometry strand — warn only in grade 1. */
    if (normKey.includes("volume") && gmin <= 1) tags.push("geometry_early_depth_warning");
    if (normKey.includes("diagonal")) tags.push("geometry_early_depth_warning");
  }

  if (
    subject === "hebrew" &&
    (norm.normalizationConfidence === "low" ||
      normKey.includes("hebrew.unmapped"))
  ) {
    tags.push("hebrew_mapping_low_confidence");
  }

  if (
    subject === "science" &&
    (norm.normalizationConfidence === "low" || normKey.includes("science.unmapped"))
  ) {
    tags.push("science_mapping_low_confidence");
  }

  /* Primary classification */
  let primary = "unanchored";

  if (subject === "moledet-geography" && (gmin < 2 || gmin > 4)) {
    primary = "not_officially_anchored_grade_band";
  } else if (official?.bucket === "notExpectedYet") {
    primary = "topic_not_expected_at_this_grade";
  } else if (
    official &&
    ["coreTopics", "allowedTopics", "exposureOnlyTopics", "enrichmentTopics"].includes(
      official.bucket
    )
  ) {
    const low =
      gradeSlot?.confidence === "low" || official.topic.confidence === "low";
    if (low) primary = "officially_anchored_low_confidence";
    else primary = "officially_anchored";
  } else if (!official && internal) {
    primary = "internal_audit_map_only";
  }

  /* exposure vs internal core mismatch */
  if (
    official?.bucket === "exposureOnlyTopics" &&
    internal &&
    (internal.bucket === "coreTopics" || internal.bucket === "allowedTopics")
  ) {
    tags.push("exposure_vs_internal_core_mismatch");
  }

  if (
    official?.bucket === "enrichmentTopics" &&
    internal?.bucket === "coreTopics"
  ) {
    tags.push("enrichment_vs_internal_core_mismatch");
  }

  const prof = getSubjectSourceProfile(subject);
  const anchoredOk =
    primary === "officially_anchored" ||
    primary === "officially_anchored_low_confidence";

  const rowGradeExactTopic = exactGradeTopicRegistryCovers(subject, gmin);

  const officialGradeTopicAnchored =
    Boolean(rowGradeExactTopic && primary === "officially_anchored");

  const officialSubjectOnlyAnchored =
    Boolean(
      prof.hasExactSubjectCurriculumAnchor &&
        !rowGradeExactTopic &&
        primary === "officially_anchored"
    );

  /** Anchored in spine but no registry row with exact_grade_topic_source for this grade. */
  const broadOrInternalOnly = anchoredOk && !rowGradeExactTopic;

  const needsPedagogyReviewBecauseSourceWeak =
    Boolean(
      prof.needsPedagogyReviewBecauseSourceWeak ||
        gradeSlot?.confidence === "low" ||
        gradeSlot?.needsHumanPedagogyReview ||
        (primary === "officially_anchored" &&
          !rowGradeExactTopic &&
          prof.sourceQuality !== "high")
    );

  return {
    questionId: record.questionId,
    subject,
    gradeMin: gmin,
    gradeMax: gmax,
    normalizedTopicKey: normKey,
    normalizationConfidence: norm.normalizationConfidence,
    internalPlacement: internal
      ? { bucket: internal.bucket, key: internal.def?.key }
      : null,
    officialPlacement: official
      ? { bucket: official.bucket, key: official.topic?.key }
      : null,
    primaryClassification: primary,
    tags,
    preview: (record.textPreview || "").slice(0, 120),
    sourceQuality: prof.sourceQuality,
    officialGradeTopicAnchored,
    officialSubjectOnlyAnchored,
    broadOrInternalOnly,
    needsPedagogyReviewBecauseSourceWeak,
  };
}

function summarize(rows) {
  const byPrimary = {};
  const tagCounts = {};
  const sourceQualityHistogram = { high: 0, medium: 0, low: 0 };
  let officialGradeTopicAnchoredRows = 0;
  let officialSubjectOnlyAnchoredRows = 0;
  let broadOrInternalOnlyRows = 0;
  let needsPedagogyReviewBecauseSourceWeakRows = 0;

  for (const r of rows) {
    byPrimary[r.primaryClassification] = (byPrimary[r.primaryClassification] || 0) + 1;
    for (const t of r.tags || []) {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    }
    const sq = r.sourceQuality || "low";
    if (sourceQualityHistogram[sq] != null) sourceQualityHistogram[sq]++;
    if (r.officialGradeTopicAnchored) officialGradeTopicAnchoredRows++;
    if (r.officialSubjectOnlyAnchored) officialSubjectOnlyAnchoredRows++;
    if (r.broadOrInternalOnly) broadOrInternalOnlyRows++;
    if (r.needsPedagogyReviewBecauseSourceWeak)
      needsPedagogyReviewBecauseSourceWeakRows++;
  }

  return {
    byPrimary,
    tagCounts,
    sourceQualityHistogram,
    officialGradeTopicAnchoredRows,
    officialSubjectOnlyAnchoredRows,
    broadOrInternalOnlyRows,
    needsPedagogyReviewBecauseSourceWeakRows,
  };
}

function buildMarkdown(payload) {
  const { generatedAt, summary, meta, tagCounts, samples, sourceQualityRollup } = payload;
  return [
    `# Bank vs official curriculum spine (Phase 4B-0b)`,
    ``,
    `- Generated: ${generatedAt}`,
    `- Phase: ${meta.phase}`,
    ``,
    `## Source quality roll-up (Phase 4B-0b)`,
    ``,
    `| Metric | Count |`,
    `|--------|------:|`,
    `| Rows with subject sourceQuality **high** | ${sourceQualityRollup?.histogram?.high ?? "—"} |`,
    `| Rows with subject sourceQuality **medium** | ${sourceQualityRollup?.histogram?.medium ?? "—"} |`,
    `| Rows with subject sourceQuality **low** | ${sourceQualityRollup?.histogram?.low ?? "—"} |`,
    `| **officialGradeTopicAnchored** (strict) | ${sourceQualityRollup?.officialGradeTopicAnchoredRows ?? "—"} |`,
    `| **officialSubjectOnlyAnchored** | ${sourceQualityRollup?.officialSubjectOnlyAnchoredRows ?? "—"} |`,
    `| **broadOrInternalOnly** (anchored but weak registry) | ${sourceQualityRollup?.broadOrInternalOnlyRows ?? "—"} |`,
    `| **needsPedagogyReviewBecauseSourceWeak** | ${sourceQualityRollup?.needsPedagogyReviewBecauseSourceWeakRows ?? "—"} |`,
    ``,
    `## Summary counts (primary classification)`,
    ``,
    `| Classification | Count |`,
    `|----------------|------:|`,
    ...Object.entries(summary.byPrimary)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `| ${k} | ${v} |`),
    ``,
    `## Interpretation`,
    ``,
    `- **officially_anchored** — normalized topic appears in the official spine for this grade with non-low spine/topic confidence.`,
    `- **officially_anchored_low_confidence** — placed in spine but ministry anchors or spine slot still low-confidence.`,
    `- **internal_audit_map_only** — matches internal conservative map but not the official spine bucket search (review normalizer/spine keys).`,
    `- **topic_not_expected_at_this_grade** — topic sits in \`notExpectedYet\` for this grade on the official spine.`,
    `- **not_officially_anchored_grade_band** — Moladeta-focused band warning (grades outside ministry framing used in registry).`,
    `- **unanchored** — no official placement and no internal map placement.`,
    ``,
    `## Warning tag counts`,
    ``,
    `| Tag | Count |`,
    `|-----|------:|`,
    ...Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `| ${k} | ${v} |`),
    ``,
    `## Sample rows (first 40 per tag)`,
    ``,
    ...Object.entries(samples).flatMap(([tag, list]) => [
      `### ${tag}`,
      ``,
      `| Subject | gMin | Normalized key | Primary | Preview |`,
      `|---------|------|----------------|---------|---------|`,
      ...list.map(
        (r) =>
          `| ${r.subject} | ${r.gradeMin} | \`${r.normalizedTopicKey}\` | ${r.primaryClassification} | ${r.preview.replace(/\|/g, "/")} |`
      ),
      ``,
    ]),
  ].join("\n");
}

export async function compareBankToOfficialSpine(opts = {}) {
  const writeFiles = opts.writeFiles !== false;
  const inventory = loadJson(INV_PATH, "question-inventory");
  if (!existsSync(SPINE_PATH)) {
    throw new Error(
      `Run npm run audit:curriculum:official-spine first (missing ${SPINE_PATH})`
    );
  }
  loadJson(SPINE_PATH, "official spine"); // validate exists & parse

  const records = inventory.records || [];
  const rows = [];

  for (const rec of records) {
    const norm = normalizeInventoryTopic({
      subject: rec.subject,
      topic: rec.topic,
      subtopic: rec.subtopic || "",
    });
    rows.push(classifyRow(rec, norm.normalizedTopicKey, norm));
  }

  const summarized = summarize(rows);
  const { byPrimary, tagCounts, ...sourceRollup } = summarized;

  /* Collect samples for tagged rows */
  const tagSamples = {};
  const interestingTags = [
    "moladeta_grade_band_warning",
    "english_early_grade_grammar_scope",
    "geometry_early_depth_warning",
    "hebrew_mapping_low_confidence",
    "science_mapping_low_confidence",
    "exposure_vs_internal_core_mismatch",
    "enrichment_vs_internal_core_mismatch",
  ];

  for (const tag of interestingTags) {
    tagSamples[tag] = rows.filter((r) => r.tags.includes(tag)).slice(0, 40);
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    meta: OFFICIAL_SPINE_META,
    inventoryRecordCount: records.length,
    comparedRows: rows.length,
    summary: {
      byPrimary,
      officiallyAnchoredCount: byPrimary.officially_anchored || 0,
      officiallyAnchoredLowConfidenceCount:
        byPrimary.officially_anchored_low_confidence || 0,
      internalAuditOnlyCount: byPrimary.internal_audit_map_only || 0,
      unanchoredCount: byPrimary.unanchored || 0,
      notOfficialGradeBandCount:
        byPrimary.not_officially_anchored_grade_band || 0,
      topicNotExpectedCount: byPrimary.topic_not_expected_at_this_grade || 0,
    },
    tagCounts,
    tagSamples,
    primaryClassificationHistogram: byPrimary,
    sourceQualityRollup: {
      histogram: summarized.sourceQualityHistogram,
      officialGradeTopicAnchoredRows: summarized.officialGradeTopicAnchoredRows,
      officialSubjectOnlyAnchoredRows: summarized.officialSubjectOnlyAnchoredRows,
      broadOrInternalOnlyRows: summarized.broadOrInternalOnlyRows,
      needsPedagogyReviewBecauseSourceWeakRows:
        summarized.needsPedagogyReviewBecauseSourceWeakRows,
    },
  };

  if (writeFiles) {
    await mkdir(OUT_DIR, { recursive: true });
    await writeFile(
      join(OUT_DIR, "bank-vs-official-spine.json"),
      JSON.stringify({ ...payload, rows }, null, 2),
      "utf8"
    );
    await writeFile(
      join(OUT_DIR, "bank-vs-official-spine.md"),
      buildMarkdown({
        generatedAt: payload.generatedAt,
        meta: payload.meta,
        tagCounts: payload.tagCounts,
        samples: tagSamples,
        summary: { byPrimary },
        sourceQualityRollup: payload.sourceQualityRollup,
      }),
      "utf8"
    );
    console.log(`Wrote ${OUT_DIR}/bank-vs-official-spine.{json,md}`);
  }

  return payload;
}

compareBankToOfficialSpine().catch((e) => {
  console.error(e);
  process.exit(1);
});
