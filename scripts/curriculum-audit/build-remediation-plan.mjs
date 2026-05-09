/**
 * Phase 3.5 — synthesize Phase 3 reports into an actionable remediation plan (reports only).
 */

import { readFileSync, existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT_DIR = join(ROOT, "reports", "curriculum-audit");

const PATHS = {
  latest: join(OUT_DIR, "latest.json"),
  inventory: join(OUT_DIR, "question-inventory.json"),
  english: join(OUT_DIR, "english-early-grades-review.json"),
  geometry: join(OUT_DIR, "geometry-sequencing-review.json"),
  coverage: join(OUT_DIR, "coverage-gaps-by-grade.json"),
  duplicates: join(OUT_DIR, "duplicates-review.json"),
};

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

const SUBJECT_TIEBREAK_ORDER = {
  science: 0,
  english: 1,
  geometry: 2,
  hebrew: 3,
  math: 4,
  "moledet-geography": 5,
};

const DUPLICATE_CATEGORY_RANK = [
  "likely_problem_duplicates",
  "mixed_generator_and_static",
  "same_stem_across_grades",
  "static_bank_duplicates",
  "generator_sample_duplicates",
  "likely_intentional_variants",
];

function bandLabel(g) {
  if (g <= 2) return "early";
  if (g <= 4) return "mid";
  return "late";
}

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

function mapSourceType(questionType) {
  const t = String(questionType || "");
  if (t === "generator_sample") return "generator_sample";
  if (t.includes("static") || t === "static_bank_item") return "static_bank";
  return "unknown";
}

function primaryDuplicateCategory(cats) {
  if (!cats?.length) return null;
  for (const rank of DUPLICATE_CATEGORY_RANK) {
    if (cats.includes(rank)) return rank;
  }
  return cats[0];
}

function buildStemHashCategoryMap(dupReport) {
  /** @type {Map<string, string[]>} */
  const m = new Map();
  const categories = dupReport?.categories || {};
  for (const [catName, entries] of Object.entries(categories)) {
    if (!Array.isArray(entries)) continue;
    for (const e of entries) {
      if (!e?.stemHash || !e?.subject) continue;
      const k = `${e.subject}|${e.stemHash}`;
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(catName);
    }
  }
  for (const [, arr] of m) {
    arr.sort(
      (a, b) =>
        DUPLICATE_CATEGORY_RANK.indexOf(a) - DUPLICATE_CATEGORY_RANK.indexOf(b)
    );
  }
  return m;
}

function englishEarlyFormalRisk(classRow, rec) {
  if (rec.subject !== "english") return false;
  if (Number(rec.gradeMin) > 2) return false;
  const flags = classRow.depthFlags || [];
  return (
    flags.includes("english_grammar_early_grade") ||
    flags.includes("english_sentence_writing_early_grade") ||
    /grammar|sentence/i.test(String(rec.topic || ""))
  );
}

function assignPriorityAndAction(ctx) {
  const {
    classification,
    duplicateCategory,
    sourceType,
    subject,
    gradeMin,
    depthFlags,
    issueKind,
    severity,
    classRow,
    rec,
  } = ctx;

  if (issueKind === "coverage_gap") {
    if (severity === "critical_low" || severity === "empty") {
      return {
        priority: 0,
        recommendedAction: "add_more_questions",
        issueType: "coverage_critical",
        reason:
          "Inventory cell below advisory threshold — plan new items for this subject×grade before relying on runtime breadth.",
      };
    }
    if (subject === "science" && [2, 4].includes(Number(gradeMin))) {
      return {
        priority: 1,
        recommendedAction: "add_more_questions",
        issueType: "coverage_low",
        reason: "Science thin band — expand question pool for this grade.",
      };
    }
    if (subject === "hebrew" && Number(gradeMin) >= 3) {
      return {
        priority: 1,
        recommendedAction: "add_more_questions",
        issueType: "hebrew_upper_low_coverage",
        reason: "Hebrew upper-primary coverage below advisory floor.",
      };
    }
    return {
      priority: 2,
      recommendedAction: "add_more_questions",
      issueType: "coverage_low",
      reason: "Thin subject×grade cell — backlog content expansion.",
    };
  }

  if (classification === "too_advanced") {
    return {
      priority: 0,
      recommendedAction: "review_manually",
      issueType: "too_advanced",
      reason: "Depth/map sequencing suggests topic may be early for placement — pedagogy review.",
    };
  }

  if (classification === "unclear_topic" || classification === "missing_metadata") {
    return {
      priority: 0,
      recommendedAction: "review_manually",
      issueType: classification,
      reason: "Metadata/topic incomplete — blocks trustworthy routing.",
    };
  }

  if (englishEarlyFormalRisk(classRow, rec)) {
    return {
      priority: 0,
      recommendedAction: "mark_enrichment",
      issueType: "english_early_formal_skill",
      reason:
        "English grades 1–2 show grammar/sentence-heavy tagging — confirm exposure vs formal mastery; adjust map/metadata accordingly.",
    };
  }

  if (
    duplicateCategory === "likely_problem_duplicates" &&
    sourceType === "static_bank"
  ) {
    return {
      priority: 0,
      recommendedAction: "split_by_grade_depth",
      issueType: "duplicate_static_cross_grade",
      reason:
        "Same stem hash reused across grades in static banks — verify intentional spiral vs accidental duplicate.",
    };
  }

  if (
    duplicateCategory === "static_bank_duplicates" &&
    sourceType === "static_bank" &&
    Number(rec.gradeMin) === Number(rec.gradeMax)
  ) {
    return {
      priority: 2,
      recommendedAction: "remove_duplicate",
      issueType: "duplicate_static_same_grade",
      reason:
        "Exact stem hash collision within the same grade band in static banks — likely redundant copy.",
    };
  }

  if (
    duplicateCategory === "same_stem_across_grades" &&
    sourceType === "static_bank"
  ) {
    return {
      priority: 1,
      recommendedAction: "split_by_grade_depth",
      issueType: "duplicate_same_stem_across_grades",
      reason: "Cross-grade stem reuse — confirm difficulty progression or dedupe.",
    };
  }

  if (
    subject === "moledet-geography" &&
    (depthFlags || []).includes("moledet_values_homeland_repeated_across_grades")
  ) {
    return {
      priority: 1,
      recommendedAction: "review_manually",
      issueType: "moledet_spiral_or_duplicate",
      reason: "Values/homeland themes repeat across grades — verify spiral vs copy-paste.",
    };
  }

  if (
    subject === "geometry" &&
    (depthFlags || []).some((f) =>
      ["geometry_volume_early", "geometry_diagonals_early", "geometry_advanced_angles_early_grade"].includes(
        f
      )
    )
  ) {
    return {
      priority: 1,
      recommendedAction: "move_grade",
      issueType: "geometry_sequencing_risk",
      reason: "Geometry depth flags suggest sequencing mismatch — review grade placement.",
    };
  }

  if (duplicateCategory === "generator_sample_duplicates" || duplicateCategory === "likely_intentional_variants") {
    return {
      priority: 2,
      recommendedAction: "ignore_generator_sample",
      issueType: "generator_duplicate_benign",
      reason: "Deterministic generator sampling — not a static bank defect.",
    };
  }

  if (classification === "enrichment_only") {
    return {
      priority: 2,
      recommendedAction: "keep",
      issueType: "enrichment_only",
      reason: "Tagged enrichment — acceptable if pedagogy agrees.",
    };
  }

  if (classification === "aligned_low_confidence") {
    return {
      priority: 2,
      recommendedAction: "review_manually",
      issueType: "aligned_low_confidence",
      reason: "Lower-confidence alignment — schedule pedagogy review before full release.",
    };
  }

  if (classification === "needs_human_review") {
    return {
      priority: 1,
      recommendedAction: "review_manually",
      issueType: "needs_human_review",
      reason: (classRow.reasons || []).join("; ") || "Audit deferred human review.",
    };
  }

  return {
    priority: 2,
    recommendedAction: "review_manually",
    issueType: classification || "unknown",
    reason: (classRow.reasons || []).join("; ") || "Advisory review.",
  };
}

function tiebreakCompare(a, b, scoreEpsilon = 8) {
  const ra = a.riskScore ?? 0;
  const rb = b.riskScore ?? 0;
  if (Math.abs(ra - rb) > scoreEpsilon) return rb - ra;
  const oa = SUBJECT_TIEBREAK_ORDER[a.subject] ?? 99;
  const ob = SUBJECT_TIEBREAK_ORDER[b.subject] ?? 99;
  if (oa !== ob) return oa - ob;
  return rb - ra;
}

/** Overall queue: high score first, but cap dominant subjects so English/science/etc stay visible. */
function balancedOverallTop(items, limit = 25, maxPerSubject = 5) {
  const sorted = [...items].sort(tiebreakCompare);
  const counts = {};
  const out = [];
  const seen = new Set();
  for (const it of sorted) {
    const sub = it.subject || "?";
    counts[sub] = counts[sub] || 0;
    if (counts[sub] >= maxPerSubject) continue;
    counts[sub]++;
    out.push(it);
    seen.add(it.remediationId);
    if (out.length >= limit) break;
  }
  if (out.length < limit) {
    for (const it of sorted) {
      if (seen.has(it.remediationId)) continue;
      out.push(it);
      seen.add(it.remediationId);
      if (out.length >= limit) break;
    }
  }
  return out.slice(0, limit);
}

function buildRemediationMarkdown(report) {
  const {
    generatedAt,
    summary,
    queues,
    coverageActions,
    duplicateCleanup,
    generatorDoNotTouch,
  } = report;
  const q = queues || {};

  const fmtItem = (x, i) =>
    `${i + 1}. **P${x.priority}** score=${(x.riskScore ?? 0).toFixed(1)} [${x.issueType}] \`${x.remediationId}\` ${x.subject} g${x.gradeMin}-${x.gradeMax} — ${x.recommendedAction} — ${String(x.textPreview || "").slice(0, 90)}`;

  const section = (title, items) => [
    `## ${title}`,
    ``,
    ...items.slice(0, 25).map(fmtItem),
    ``,
  ];

  const lines = [
    `# Curriculum remediation plan (Phase 3.5)`,
    ``,
    `- Generated: ${generatedAt}`,
    `- Total items: ${summary.totalItems}`,
    `- **Top 25 overall** uses a **per-subject cap** (default 5) so moledet-heavy duplicates do not hide science/English work — see also raw-score reference section.`,
    `- This file is a **planning queue** only — it does not edit banks or UI.`,
    ``,
    `### Counts by priority`,
    ``,
    ...Object.entries(summary.countByPriority || {})
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([k, v]) => `- **P${k}**: ${v}`),
    ``,
    `### Counts by recommendedAction`,
    ``,
    ...Object.entries(summary.countByRecommendedAction || {})
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, v]) => `- **${k}**: ${v}`),
    ``,
    ...section("Top 25 overall (balanced / subject-capped)", q.overall || []),
    ...section("Top 25 overall — raw risk score order (reference)", q.overallUnbalancedReference || []),
    ...section("Top 25 English", q.english || []),
    ...section("Top 25 Hebrew", q.hebrew || []),
    ...section("Top 25 Math", q.math || []),
    ...section("Top 25 Geometry", q.geometry || []),
    ...section("Top 25 Science", q.science || []),
    ...section("Top 25 Moledet / Geography", q.moledetGeography || []),
    `## Coverage gap action list`,
    ``,
    ...coverageActions.map(
      (x) =>
        `- **P${x.priority}** ${x.subject} g${x.gradeMin}: ${x.recommendedAction} — ${x.reason} (rows≈${x.rowCountHint ?? "?"})`
    ),
    ``,
    `## Duplicate cleanup action list`,
    ``,
    `### Static bank / cross-grade (review or split)`,
    ``,
    ...duplicateCleanup.static.slice(0, 40).map(
      (x) =>
        `- **${x.duplicateCategory || "?"}** ${x.subject} hash=${String(x.stemHash || "").slice(0, 16)}… grades=${JSON.stringify([x.gradeMin, x.gradeMax])} → ${x.recommendedAction}`
    ),
    duplicateCleanup.static.length > 40 ? `\n… ${duplicateCleanup.static.length - 40} more in JSON\n` : ``,
    `### Generator / benign sampling`,
    ``,
    ...duplicateCleanup.generator.slice(0, 25).map(
      (x) =>
        `- **${x.duplicateCategory || "?"}** ${x.subject} rows=${x.rowCountHint ?? "?"} → ${x.recommendedAction}`
    ),
    duplicateCleanup.generator.length > 25 ? `\n… truncated\n` : ``,
    `## Do not touch yet (generator-only warnings)`,
    ``,
    ...generatorDoNotTouch.slice(0, 30).map(
      (x) =>
        `- ${x.subject} stem=${String(x.stemHash || "").slice(0, 14)}… (${x.duplicateCategory})`
    ),
    generatorDoNotTouch.length > 30 ? `\n… see remediation-plan.json\n` : ``,
    ``,
  ];
  return lines.join("\n");
}

export async function buildRemediationPlan(opts = {}) {
  const writeFiles = opts.writeFiles !== false;

  for (const [label, p] of Object.entries(PATHS)) {
    if (!existsSync(p)) {
      throw new Error(`Missing ${p} (${label}) — run npm run qa:curriculum-audit prerequisites first.`);
    }
  }

  const latest = JSON.parse(readFileSync(PATHS.latest, "utf8"));
  const inventory = JSON.parse(readFileSync(PATHS.inventory, "utf8"));
  const englishReport = JSON.parse(readFileSync(PATHS.english, "utf8"));
  const geometryReport = JSON.parse(readFileSync(PATHS.geometry, "utf8"));
  const coverageReport = JSON.parse(readFileSync(PATHS.coverage, "utf8"));
  const dupReport = JSON.parse(readFileSync(PATHS.duplicates, "utf8"));

  const records = inventory.records || [];
  const invById = new Map(records.map((r) => [r.questionId, r]));
  const stemCatMap = buildStemHashCategoryMap(dupReport);

  /** @type {object[]} */
  const items = [];

  const classifications = latest.classifications || [];
  for (const classRow of classifications) {
    const rec = invById.get(classRow.questionId);
    if (!rec) continue;

    const stemKey = rec.stemHash ? `${rec.subject}|${rec.stemHash}` : null;
    const dupCats = stemKey ? stemCatMap.get(stemKey) || [] : [];
    const duplicateCategory = primaryDuplicateCategory(dupCats);

    const riskScore = riskScorePhase3(rec, classRow);
    const sourceType = mapSourceType(rec.questionType);

    const { priority, recommendedAction, issueType, reason } = assignPriorityAndAction({
      classification: classRow.classification,
      duplicateCategory,
      sourceType,
      subject: rec.subject,
      gradeMin: rec.gradeMin,
      gradeMax: rec.gradeMax,
      depthFlags: classRow.depthFlags || [],
      issueKind: "inventory_row",
      classRow,
      rec,
    });

    items.push({
      remediationId: classRow.questionId,
      priority,
      subject: rec.subject,
      gradeMin: rec.gradeMin,
      gradeMax: rec.gradeMax,
      issueType,
      classification: classRow.classification,
      depthFlags: classRow.depthFlags || [],
      duplicateCategory,
      questionId: classRow.questionId,
      sourceFile: rec.sourceFile ?? null,
      sourceType,
      rawTopic: rec.topic ?? null,
      normalizedTopicKey: classRow.normalizedTopicKey ?? null,
      textPreview: rec.textPreview ?? null,
      recommendedAction,
      reason,
      riskScore,
      stemHash: rec.stemHash ?? null,
    });
  }

  const flagged = coverageReport.flaggedLowCoverageCells || [];
  for (const cell of flagged) {
    const g = Number(cell.grade);
    const sub = cell.subject;
    const sev = cell.severity || "low";
    const rowHint = cell.rowCount;

    const fakeRec = {
      subject: sub,
      gradeMin: g,
      gradeMax: g,
      questionType: null,
      metadataCompleteness: {},
    };
    const fakeRow = {
      classification: "coverage_gap",
      depthFlags: [],
      duplicatePeerCount: 0,
    };
    const rs =
      sev === "critical_low" || sev === "empty"
        ? 210
        : sev === "low"
          ? 130
          : 100;

    const { priority, recommendedAction, issueType, reason } = assignPriorityAndAction({
      classification: "coverage_gap",
      duplicateCategory: null,
      sourceType: "unknown",
      subject: sub,
      gradeMin: g,
      gradeMax: g,
      depthFlags: sub === "science" && rowHint < 40 ? ["science_grade_low_coverage"] : [],
      issueKind: "coverage_gap",
      severity: sev,
      classRow: { reasons: [] },
      rec: fakeRec,
    });

    items.push({
      remediationId: `coverage:${sub}:g${g}`,
      priority,
      subject: sub,
      gradeMin: g,
      gradeMax: g,
      issueType,
      classification: "coverage_gap",
      depthFlags: sub === "science" && rowHint < 40 ? ["science_grade_low_coverage"] : [],
      duplicateCategory: null,
      questionId: null,
      sourceFile: null,
      sourceType: "unknown",
      rawTopic: null,
      normalizedTopicKey: null,
      textPreview: null,
      recommendedAction,
      reason,
      riskScore: rs,
      rowCountHint: rowHint,
      stemHash: null,
    });
  }

  void englishReport;
  void geometryReport;

  const countByPriority = {};
  const countByRecommendedAction = {};
  for (const it of items) {
    countByPriority[it.priority] = (countByPriority[it.priority] || 0) + 1;
    countByRecommendedAction[it.recommendedAction] =
      (countByRecommendedAction[it.recommendedAction] || 0) + 1;
  }

  const questionLike = items.filter((x) => x.questionId);

  const bySubject = (sub) =>
    items.filter((x) => x.subject === sub).sort(tiebreakCompare);

  const queues = {
    overall: balancedOverallTop(items, 25, 5),
    overallUnbalanced: [...items].sort(tiebreakCompare).slice(0, 25),
    english: bySubject("english"),
    hebrew: bySubject("hebrew"),
    math: bySubject("math"),
    geometry: bySubject("geometry"),
    science: bySubject("science"),
    moledetGeography: bySubject("moledet-geography"),
  };

  const coverageActions = items.filter((x) => x.classification === "coverage_gap");

  const duplicateCleanup = {
    static: questionLike.filter(
      (x) =>
        x.duplicateCategory &&
        ["likely_problem_duplicates", "same_stem_across_grades", "static_bank_duplicates"].includes(
          x.duplicateCategory
        ) &&
        x.sourceType === "static_bank"
    ),
    generator: questionLike.filter(
      (x) =>
        x.duplicateCategory &&
        ["generator_sample_duplicates", "likely_intentional_variants"].includes(x.duplicateCategory)
    ),
  };

  const generatorDoNotTouch = dupReport.categories?.generator_sample_duplicates || [];

  const report = {
    generatedAt: new Date().toISOString(),
    inputs: {
      latestGeneratedAt: latest.generatedAt ?? null,
      inventoryGeneratedAt: inventory.generatedAt ?? null,
      coverageGeneratedAt: coverageReport.generatedAt ?? null,
      duplicatesGeneratedAt: dupReport.generatedAt ?? null,
    },
    summary: {
      totalItems: items.length,
      questionLinkedItems: questionLike.length,
      coverageSyntheticItems: coverageActions.length,
      note:
        "totalItems includes per-question rows plus one synthetic row per flagged coverage cell.",
      countByPriority,
      countByRecommendedAction,
    },
    queues: {
      overall: queues.overall,
      overallUnbalancedReference: queues.overallUnbalanced,
      english: queues.english.slice(0, 25),
      hebrew: queues.hebrew.slice(0, 25),
      math: queues.math.slice(0, 25),
      geometry: queues.geometry.slice(0, 25),
      science: queues.science.slice(0, 25),
      moledetGeography: queues.moledetGeography.slice(0, 25),
    },
    items,
    coverageActions,
    duplicateCleanup,
    generatorDoNotTouch,
    notes: {
      tiebreak:
        "When risk scores are within ~8 points, ordering prefers science → english → geometry → hebrew → math → moledet-geography.",
      englishEarlyGrammarPool:
        englishReport?.byPoolTopicCounts?.slice?.(0, 5) ?? null,
      geometryMatrixHint: geometryReport?.normalizedTopicCountsByGrade
        ? "See geometry-sequencing-review.json for grade×topic density."
        : null,
    },
  };

  if (writeFiles) {
    await mkdir(OUT_DIR, { recursive: true });
    await writeFile(join(OUT_DIR, "remediation-plan.json"), JSON.stringify(report, null, 2), "utf8");
    await writeFile(join(OUT_DIR, "remediation-plan.md"), buildRemediationMarkdown(report), "utf8");
    console.log(`Wrote remediation plan to ${OUT_DIR}/remediation-plan.{json,md}`);
  }

  return report;
}

function isMain() {
  try {
    return resolve(process.argv[1] || "") === resolve(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (isMain()) {
  buildRemediationPlan({ writeFiles: true }).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
