/**
 * Phase 4A — content-fix batch planning from remediation plan (reports only; no bank edits).
 */

import { readFileSync, existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT_DIR = join(ROOT, "reports", "curriculum-audit");

const INPUT = {
  remediation: join(OUT_DIR, "remediation-plan.json"),
  remediationMd: join(OUT_DIR, "remediation-plan.md"),
  inventory: join(OUT_DIR, "question-inventory.json"),
  coverage: join(OUT_DIR, "coverage-gaps-by-grade.json"),
  duplicates: join(OUT_DIR, "duplicates-review.json"),
  englishEarly: join(OUT_DIR, "english-early-grades-review.json"),
  geometry: join(OUT_DIR, "geometry-sequencing-review.json"),
};

const GEOMETRY_DEPTH_FLAGS = new Set([
  "geometry_volume_early",
  "geometry_diagonals_early",
  "geometry_advanced_angles_early_grade",
  "geometry_area_too_broad",
]);

function loadJson(path, label) {
  if (!existsSync(path)) throw new Error(`Missing ${path} (${label})`);
  return JSON.parse(readFileSync(path, "utf8"));
}

function countBy(arr, keyFn) {
  const o = {};
  for (const x of arr) {
    const k = keyFn(x);
    o[k] = (o[k] || 0) + 1;
  }
  return o;
}

function mapSourceType(questionType) {
  const t = String(questionType || "");
  if (t === "generator_sample") return "generator_sample";
  if (t.includes("static") || t === "static_bank_item") return "static_bank";
  return "unknown";
}

/** Advisory recommendation for English early formal rows — planning only. */
function englishEarlyRecommendation(row) {
  const pool = String(row.subtopic || "").toLowerCase();
  if (pool.includes("phase29") || pool.includes("g3")) return "move_to_grade_3_plus";
  if (/grammar|sentence/.test(String(row.topic || "").toLowerCase())) return "mark_enrichment";
  return "keep_as_exposure";
}

/** Advisory recommendation for geometry sequencing rows. */
function geometryRecommendation(item) {
  if (item.recommendedAction === "move_grade") return "move_grade";
  const fs = item.depthFlags || [];
  if (fs.some((f) => GEOMETRY_DEPTH_FLAGS.has(f))) {
    if (Number(item.gradeMin) <= 3) return "mark_enrichment";
    return "split_by_grade_depth";
  }
  return "keep_if_introductory";
}

function buildMarkdown(report) {
  const { generatedAt, validation, batches } = report;

  const lines = [
    `# Content fix batches (Phase 4A — planning only)`,
    ``,
    `- Generated: ${generatedAt}`,
    `- **No question banks were modified.** This document is for human review before any Phase 4B edits.`,
    ``,
    `## Validation summary`,
    ``,
    `- Total batch line-items (A cells + B/C/D rows; duplicates may appear in multiple D lists): ${validation.totalBatchRows}`,
    `- Unique inventory questionIds across B/C/D (deduped): ${validation.uniqueInventoryRowsTouchingBatches}`,
    `- Batch A coverage cells: ${validation.batchCounts.A}`,
    `- Batch B English early items: ${validation.batchCounts.B}`,
    `- Batch C geometry items: ${validation.batchCounts.C}`,
    `- Batch D static duplicate candidates: ${validation.batchCounts.D}`,
    `- Batch E excluded signal count (rows + duplicate-review groups): ${validation.batchCounts.E_excluded}`,
    `- Unknown sourceType (remediation total / deduped batch rows): ${validation.unknownSourceTypeCountRemediationTotal} / ${validation.unknownSourceTypeCountInDedupedBatches}`,
    `- Generator-only excluded from content edits: ${validation.generatorExcludedCount}`,
    ``,
    `### Totals by sourceType (inventory-linked batches)`,
    ``,
    ...Object.entries(validation.totalsBySourceType || {})
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, v]) => `- **${k}**: ${v}`),
    ``,
    `### Totals by recommendedAction (inventory-linked)`,
    ``,
    ...Object.entries(validation.totalsByRecommendedAction || {})
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, v]) => `- **${k}**: ${v}`),
    ``,
    `### Source files that would be touched if Phase 4B approved`,
    ``,
    ...validation.sourceFilesForPotentialEdits.map((f) => `- \`${f}\``),
    validation.sourceFilesForPotentialEdits.length === 0 ? `- _(none — coverage-only phase)_` : ``,
    ``,
    `---`,
    ``,
    `## A. Batch A — Coverage additions`,
    ``,
    ...batches.A.coverageCells.flatMap((cell) => [
      `### ${cell.label}`,
      ``,
      `- Current row count: **${cell.currentRowCount}**`,
      `- Target minimum (advisory): **${cell.targetMinimum}**`,
      `- Gap (new questions needed): **${cell.gapNeeded}**`,
      `- Severity: ${cell.severity}`,
      `- Recommended topic spread: ${cell.recommendedTopicSpread}`,
      `- Static vs generator: ${cell.staticVsGeneratorNote}`,
      ``,
    ]),
    `---`,
    ``,
    `## B. Batch B — English early-grade formal skills (grades 1–2, P0/P1)`,
    ``,
    `_Planning recommendations only — no edits yet._`,
    ``,
    ...batches.B.groups.map((g) =>
      [
        `### ${g.key}`,
        `- Rows: ${g.rows.length}`,
        `- Source files: ${[...new Set(g.rows.map((r) => r.sourceFile).filter(Boolean))].join(", ") || "—"}`,
        `- Suggested batch action: **${g.suggestedGroupAction}**`,
        ``,
        ...g.rows.slice(0, 15).map(
          (r) =>
            `- \`${r.questionId?.slice(0, 12)}…\` g${r.gradeMin} topic=${r.topic} subtopic=${r.subtopic || "—"} → *${r.planningRecommendation}*`
        ),
        g.rows.length > 15 ? `\n… ${g.rows.length - 15} more in JSON\n` : ``,
        ``,
      ].join("\n")
    ),
    `---`,
    ``,
    `## C. Batch C — Geometry sequencing`,
    ``,
    `### move_grade items`,
    ``,
    ...(batches.C.moveGradeItems.length
      ? batches.C.moveGradeItems.map(
          (r) =>
            `- \`${r.questionId}\` g${r.gradeMin}-${r.gradeMax} ${r.sourceFile} — ${(r.textPreview || "").slice(0, 100)}`
        )
      : [`- _(none)_`]),
    ``,
    `### Depth-flagged geometry (volume / diagonals / advanced angles / broad area)`,
    ``,
    ...batches.C.depthFlagGroups.map((g) =>
      [
        `#### Grade ${g.grade} — ${g.sourceFile}`,
        `- Items: ${g.rows.length}`,
        `- Advisory: ${g.advisory}`,
        ``,
        ...g.rows.slice(0, 10).map(
          (r) =>
            `- flags=[${(r.depthFlags || []).filter((f) => GEOMETRY_DEPTH_FLAGS.has(f)).join(", ")}] preview=${JSON.stringify((r.textPreview || "").slice(0, 80))}`
        ),
        ``,
      ].join("\n")
    ),
    `---`,
    ``,
    `## D. Batch D — Static duplicate cleanup candidates`,
    ``,
    `### D1 — Same-grade exact duplicates (static_bank)`,
    ``,
    ...batches.D.sameGrade.slice(0, 40).map(
      (r) =>
        `- ${r.sourceFile} — ${JSON.stringify((r.textPreview || "").slice(0, 90))} → *${r.planningRecommendation}*`
    ),
    batches.D.sameGrade.length > 40 ? `\n… ${batches.D.sameGrade.length - 40} more in JSON\n` : ``,
    ``,
    `### D2 — Cross-grade same stem (static_bank)`,
    ``,
    ...batches.D.crossGrade.slice(0, 40).map(
      (r) =>
        `- g${r.gradeMin}-${r.gradeMax} ${r.sourceFile} — ${JSON.stringify((r.textPreview || "").slice(0, 90))} → *${r.planningRecommendation}*`
    ),
    batches.D.crossGrade.length > 40 ? `\n… ${batches.D.crossGrade.length - 40} more in JSON\n` : ``,
    ``,
    `### D3 — Likely problem duplicates (cross-grade static clusters)`,
    ``,
    ...batches.D.likelyProblem.slice(0, 40).map(
      (r) =>
        `- ${r.sourceFile} — ${JSON.stringify((r.textPreview || "").slice(0, 90))} → *${r.planningRecommendation}*`
    ),
    batches.D.likelyProblem.length > 40 ? `\n… ${batches.D.likelyProblem.length - 40} more in JSON\n` : ``,
    ``,
    `---`,
    ``,
    `## E. Batch E — Do not touch (excluded from Phase 4B content edits)`,
    ``,
    ...batches.E.reasons.map((x) => `- ${x}`),
    ``,
    `- Excluded generator_sample remediation rows: **${batches.E.generatorSampleRowCount}**`,
    `- Duplicates-review generator collision groups: **${batches.E.duplicateReportGeneratorGroups}**`,
    `- Duplicates-review likely_intentional_variant groups: **${batches.E.intentionalVariantGroupsCount}**`,
    `- Unknown sourceType rows: **${batches.E.unknownSourceTypeRowCount}**`,
    ``,
  ];
  return lines.join("\n");
}

export async function buildContentFixBatches(opts = {}) {
  const writeFiles = opts.writeFiles !== false;

  const remediation = loadJson(INPUT.remediation, "remediation-plan");
  const inventory = loadJson(INPUT.inventory, "question-inventory");
  const coverage = loadJson(INPUT.coverage, "coverage-gaps");
  const dupReport = loadJson(INPUT.duplicates, "duplicates-review");
  const englishEarly = loadJson(INPUT.englishEarly, "english-early-grades-review");
  const geometryReview = loadJson(INPUT.geometry, "geometry-sequencing-review");

  const items = remediation.items || [];
  const invById = new Map((inventory.records || []).map((r) => [r.questionId, r]));

  const matrix = coverage.matrixSubjectByGrade || {};

  /** @param {string} subject @param {number} grade */
  function cellSnapshot(subject, grade, label) {
    const current = matrix[subject]?.[String(grade)] ?? 0;
    const flagged = (coverage.flaggedLowCoverageCells || []).find(
      (c) => c.subject === subject && Number(c.grade) === grade
    );
    const target = flagged?.thresholdHint ?? (subject === "science" ? 50 : subject === "english" ? 40 : 100);
    const gap = Math.max(0, target - current);
    return {
      label,
      subject,
      grade,
      currentRowCount: current,
      targetMinimum: target,
      gapNeeded: gap,
      severity: flagged?.severity || "advisory",
      recommendedTopicSpread:
        subject === "science"
          ? "Balance life_science, materials_matter, earth_space, energy, inquiry strands per grade band (see science metadata docs)."
          : subject === "english"
            ? "Oral/listening + vocabulary exposure; defer heavy grammar pools until confirmed (see english-early-grades-review)."
            : subject === "hebrew"
              ? "Decoding, morphology, comprehension, writing spirals — align with Hebrew master strands."
              : "Mixed strands per curriculum owner.",
      staticVsGeneratorNote:
        "Typically add **new static bank items** for durable canon; use **generator expansion** only where product intentionally uses generated variants — confirm per master.",
    };
  }

  const batches = {
    A: {
      coverageCells: [
        cellSnapshot("science", 6, "Science grade 6 — critical"),
        cellSnapshot("science", 4, "Science grade 4 — low"),
        cellSnapshot("science", 2, "Science grade 2 — low"),
        cellSnapshot("english", 1, "English grade 1 — low"),
        ...[3, 4, 5, 6].map((g) =>
          cellSnapshot("hebrew", g, `Hebrew grade ${g} — low/advisory`)
        ),
      ],
    },
    B: { groups: [] },
    C: { moveGradeItems: [], depthFlagGroups: [] },
    D: { sameGrade: [], crossGrade: [], likelyProblem: [] },
    E: {
      reasons: [
        "**generator_sample** rows are harness/deterministic samples — not static bank defects; do not edit as duplicate cleanup.",
        "**likely_intentional_variants** in duplicates-review are usually benign template repetition.",
        "**unknown** sourceType requires tracing `questionType` in inventory before any edit.",
      ],
      generatorSampleRowCount: 0,
      duplicateReportGeneratorGroups: (dupReport.categories?.generator_sample_duplicates || []).length,
      unknownSourceTypeRowCount: 0,
    },
  };

  const englishFormal = [];
  for (const it of items) {
    if (!it.questionId) continue;
    if (it.issueType !== "english_early_formal_skill") continue;
    if (it.subject !== "english") continue;
    if (Number(it.gradeMin) > 2 || Number(it.gradeMax) > 2) continue;
    if (it.priority > 1) continue;
    const inv = invById.get(it.questionId) || {};
    if (mapSourceType(inv.questionType) === "generator_sample") continue;
    const planningRecommendation = englishEarlyRecommendation({
      topic: inv.topic || it.rawTopic,
      subtopic: inv.subtopic,
    });
    englishFormal.push({
      ...it,
      subtopic: inv.subtopic ?? null,
      topic: inv.topic ?? it.rawTopic,
      planningRecommendation,
      sourceFile: inv.sourceFile || it.sourceFile,
    });
  }

  const groupMap = new Map();
  for (const row of englishFormal) {
    const key = `${row.sourceFile || "?"} :: ${row.topic || "?"} :: ${row.subtopic || ""}`;
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key).push(row);
  }
  batches.B.groups = [...groupMap.entries()].map(([key, rows]) => ({
    key,
    rows,
    suggestedGroupAction: [...new Set(rows.map((r) => r.planningRecommendation))].join(" | ") || "review",
  }));

  const geometryItems = [];
  for (const it of items) {
    if (!it.questionId || it.subject !== "geometry") continue;
    const invG = invById.get(it.questionId) || {};
    if (mapSourceType(invG.questionType) === "generator_sample") continue;
    if (it.recommendedAction === "move_grade") {
      batches.C.moveGradeItems.push({ ...it, ...(invById.get(it.questionId) || {}) });
      geometryItems.push(it);
      continue;
    }
    const fs = it.depthFlags || [];
    if (fs.some((f) => GEOMETRY_DEPTH_FLAGS.has(f))) {
      geometryItems.push({
        ...it,
        ...invById.get(it.questionId),
        planningRecommendation: geometryRecommendation(it),
      });
    }
  }

  const geomByGradeFile = new Map();
  for (const r of geometryItems) {
    if (r.recommendedAction === "move_grade") continue;
    const inv = invById.get(r.questionId) || {};
    const g = Number(inv.gradeMin ?? r.gradeMin);
    const sf = inv.sourceFile || r.sourceFile || "?";
    const key = `${g}::${sf}`;
    if (!geomByGradeFile.has(key)) geomByGradeFile.set(key, []);
    geomByGradeFile.get(key).push({ ...r, ...inv, gradeMin: g });
  }
  batches.C.depthFlagGroups = [...geomByGradeFile.entries()].map(([k, rows]) => {
    const sep = k.indexOf("::");
    const grade = k.slice(0, sep);
    const sourceFile = k.slice(sep + 2);
    return {
      grade,
      sourceFile,
      rows,
      advisory: [...new Set(rows.map((x) => x.planningRecommendation || geometryRecommendation(x)))].join(
        " | "
      ),
    };
  });

  for (const it of items) {
    if (!it.questionId) continue;
    if (it.sourceType !== "static_bank") continue;
    const inv = invById.get(it.questionId) || {};
    const row = { ...it, ...inv, textPreview: inv.textPreview || it.textPreview };
    const ig = it.issueType || "";

    if (ig === "duplicate_static_same_grade") {
      batches.D.sameGrade.push({
        ...row,
        planningRecommendation: "remove_duplicate",
      });
      continue;
    }
    if (it.duplicateCategory === "likely_problem_duplicates") {
      batches.D.likelyProblem.push({
        ...row,
        planningRecommendation: "split_by_grade_depth_or_keep_as_intentional_spiral",
      });
    }
    if (ig === "duplicate_static_cross_grade" || it.duplicateCategory === "same_stem_across_grades") {
      batches.D.crossGrade.push({
        ...row,
        planningRecommendation: "split_by_grade_depth",
      });
    }
  }

  batches.E.generatorSampleRowCount = items.filter(
    (x) => x.questionId && x.sourceType === "generator_sample"
  ).length;
  batches.E.unknownSourceTypeRowCount = items.filter(
    (x) => x.questionId && x.sourceType === "unknown"
  ).length;
  batches.E.intentionalVariantGroupsCount =
    (dupReport.categories?.likely_intentional_variants || []).length;

  const inventoryLinkedBatches = [
    ...englishFormal,
    ...geometryItems.filter((x) => x.questionId),
    ...batches.D.sameGrade,
    ...batches.D.crossGrade,
    ...batches.D.likelyProblem,
  ];

  const dedupByQuestion = new Map();
  for (const x of inventoryLinkedBatches) {
    if (x.questionId) dedupByQuestion.set(x.questionId, x);
  }
  const dedupedInventoryRows = [...dedupByQuestion.values()];
  const uniqueInventoryIds = new Set(dedupedInventoryRows.map((x) => x.questionId));

  const rollupMap = new Map();
  for (const it of dedupedInventoryRows) {
    const key = JSON.stringify({
      priority: it.priority,
      recommendedAction: it.recommendedAction,
      subject: it.subject,
      gradeMin: it.gradeMin,
      sourceFile: it.sourceFile || "",
      sourceType: it.sourceType || "unknown",
      issueType: it.issueType || "",
    });
    rollupMap.set(key, (rollupMap.get(key) || 0) + 1);
  }
  const rollupsByDimensions = [...rollupMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 250)
    .map(([k, count]) => ({ ...JSON.parse(k), count }));

  const validation = {
    batchCounts: {
      A: batches.A.coverageCells.length,
      B: englishFormal.length,
      C: geometryItems.length,
      D: batches.D.sameGrade.length + batches.D.crossGrade.length + batches.D.likelyProblem.length,
      E_excluded:
        batches.E.generatorSampleRowCount +
        batches.E.unknownSourceTypeRowCount +
        batches.E.duplicateReportGeneratorGroups +
        batches.E.intentionalVariantGroupsCount,
    },
    totalBatchRows:
      batches.A.coverageCells.length +
      englishFormal.length +
      geometryItems.length +
      batches.D.sameGrade.length +
      batches.D.crossGrade.length +
      batches.D.likelyProblem.length,
    uniqueInventoryRowsTouchingBatches: uniqueInventoryIds.size,
    totalsBySourceType: countBy(dedupedInventoryRows, (x) => x.sourceType || "unknown"),
    totalsByRecommendedAction: countBy(
      dedupedInventoryRows,
      (x) => x.recommendedAction || "unknown"
    ),
    unknownSourceTypeCountRemediationTotal: batches.E.unknownSourceTypeRowCount,
    unknownSourceTypeCountInDedupedBatches: dedupedInventoryRows.filter((x) => x.sourceType === "unknown")
      .length,
    generatorExcludedCount: batches.E.generatorSampleRowCount,
    sourceFilesForPotentialEdits: [
      ...new Set(
        dedupedInventoryRows
          .filter((x) => x.sourceFile && String(x.sourceFile).trim())
          .map((x) => x.sourceFile)
      ),
    ].sort(),
  };

  const report = {
    generatedAt: new Date().toISOString(),
    rollupsByDimensions,
    inputs: {
      remediationGeneratedAt: remediation.generatedAt,
      coverageGeneratedAt: coverage.generatedAt,
      englishEarlyPools: englishEarly?.byPoolTopicCounts?.slice?.(0, 12) ?? null,
      geometryReviewHint: geometryReview?.normalizedTopicCountsByGrade ? "present" : null,
    },
    batches,
    validation,
    englishEarlyFormalSkillCount: englishFormal.length,
    geometrySequencingCount: geometryItems.length,
    staticDuplicateCandidateCount: new Set(
      [...batches.D.sameGrade, ...batches.D.crossGrade, ...batches.D.likelyProblem].map((x) => x.questionId)
    ).size,
    notes: [
      "Phase 4A is planning-only. Phase 4B would apply approved edits per batch.",
      "Do not edit generator_sample rows as duplicate cleanup.",
    ],
  };

  if (writeFiles) {
    await mkdir(OUT_DIR, { recursive: true });
    await writeFile(join(OUT_DIR, "content-fix-batches.json"), JSON.stringify(report, null, 2), "utf8");
    await writeFile(join(OUT_DIR, "content-fix-batches.md"), buildMarkdown(report), "utf8");
    console.log(`Wrote content fix batches to ${OUT_DIR}/content-fix-batches.{json,md}`);
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
  buildContentFixBatches({ writeFiles: true }).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
