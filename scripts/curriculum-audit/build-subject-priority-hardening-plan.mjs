/**
 * Owner subject-priority curriculum hardening plan (planning only — no bank edits).
 * Order: Math → Geometry → Hebrew → English → Science → Moledet/Geography.
 */
import { readFileSync, existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { OFFICIAL_CURRICULUM_SOURCE_REGISTRY } from "../../utils/curriculum-audit/official-curriculum-source-registry.js";
import { computeSubjectSourceProfile } from "../../utils/curriculum-audit/official-source-subject-profile.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT_DIR = join(ROOT, "reports", "curriculum-audit");
const INV_PATH = join(OUT_DIR, "question-inventory.json");
const BANK_VS_PATH = join(OUT_DIR, "bank-vs-official-spine.json");

/** @type {Array<{ key: string, label: string, inventoryKey: string, notes: string }>} */
export const OWNER_SUBJECT_PRIORITY = [
  { key: "math", label: "Math", inventoryKey: "math", notes: "" },
  { key: "geometry", label: "Geometry", inventoryKey: "geometry", notes: "Officially a strand within elementary math; product may separate." },
  { key: "hebrew", label: "Hebrew", inventoryKey: "hebrew", notes: "" },
  { key: "english", label: "English", inventoryKey: "english", notes: "Owner: defer early-grade item edits until explicit phase + approval." },
  { key: "science", label: "Science", inventoryKey: "science", notes: "Owner: do not add Science questions yet; planning/source only." },
  {
    key: "moledet-geography",
    label: "Moledet / Geography",
    inventoryKey: "moledet-geography",
    notes: "Lowest priority; official Moledet framing grades 2–4 — see spine/registry.",
  },
];

const GRADES = [1, 2, 3, 4, 5, 6];

function loadJson(path, label) {
  if (!existsSync(path)) {
    throw new Error(`Missing ${label}: ${path} — run npm run qa:curriculum-audit first.`);
  }
  return JSON.parse(readFileSync(path, "utf8"));
}

/**
 * Grades that have at least one registry row with sourceQualityLevel === exact_grade_topic_source
 * whose appliesToGrades includes that grade.
 */
function gradesWithExactGradeTopicSource(subjectKey) {
  const covered = new Set();
  for (const r of OFFICIAL_CURRICULUM_SOURCE_REGISTRY) {
    if (r.subject !== subjectKey) continue;
    if (r.sourceQualityLevel !== "exact_grade_topic_source") continue;
    const g = r.appliesToGrades;
    if (g === "all") GRADES.forEach((x) => covered.add(x));
    else if (Array.isArray(g)) g.forEach((x) => covered.add(x));
  }
  return covered;
}

function missingExactGradeTopicAnchors(subjectKey) {
  const covered = gradesWithExactGradeTopicSource(subjectKey);
  return GRADES.filter((g) => !covered.has(g));
}

function countQuestionsByGrade(records, subjectKey) {
  /** @type {Record<number, number>} */
  const byGrade = Object.fromEntries(GRADES.map((g) => [g, 0]));
  let total = 0;
  for (const rec of records) {
    if (rec.subject !== subjectKey) continue;
    total++;
    let gmin = Number(rec.gradeMin);
    let gmax = Number(rec.gradeMax);
    if (!Number.isFinite(gmin) || !Number.isFinite(gmax)) continue;
    gmin = Math.max(1, Math.min(6, gmin));
    gmax = Math.max(1, Math.min(6, gmax));
    if (gmin > gmax) [gmin, gmax] = [gmax, gmin];
    for (let g = gmin; g <= gmax; g++) {
      byGrade[g] = (byGrade[g] || 0) + 1;
    }
  }
  return { total, byGrade };
}

/**
 * Aggregate bank-vs-official rows for risk signals per subject.
 */
function aggregateRisks(rows, subjectKey) {
  const tagsToWatch = [
    "moladeta_grade_band_warning",
    "english_early_grade_grammar_scope",
    "english_early_grammar_core_internal",
    "geometry_early_depth_warning",
    "hebrew_mapping_low_confidence",
    "science_mapping_low_confidence",
    "exposure_vs_internal_core_mismatch",
    "enrichment_vs_internal_core_mismatch",
  ];
  /** @type {Record<string, number>} */
  const tagCounts = {};
  /** @type {Record<string, number>} */
  const primaryCounts = {};
  let needsPedagogyWeak = 0;
  let broadOrInternal = 0;
  let officialGradeTopicRows = 0;

  for (const r of rows) {
    if (r.subject !== subjectKey) continue;
    for (const t of r.tags || []) {
      if (tagsToWatch.includes(t)) tagCounts[t] = (tagCounts[t] || 0) + 1;
    }
    const p = r.primaryClassification || "";
    primaryCounts[p] = (primaryCounts[p] || 0) + 1;
    if (r.needsPedagogyReviewBecauseSourceWeak) needsPedagogyWeak++;
    if (r.broadOrInternalOnly) broadOrInternal++;
    if (r.officialGradeTopicAnchored) officialGradeTopicRows++;
  }

  const sortedTags = Object.entries(tagCounts)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);

  return {
    tagCounts,
    primaryCounts,
    sortedRiskTags: sortedTags,
    rowsNeedingPedagogyReviewBecauseSourceWeak: needsPedagogyWeak,
    broadOrInternalOnlyRows: broadOrInternal,
    officialGradeTopicAnchoredRows: officialGradeTopicRows,
  };
}

function strongestRisks(subjectKey, riskAgg, profile) {
  const lines = [];
  if (riskAgg.sortedRiskTags.length) {
    lines.push(
      ...riskAgg.sortedRiskTags.slice(0, 5).map(([t, n]) => `${t}: ${n} rows`)
    );
  }
  if (subjectKey === "moledet-geography" && riskAgg.primaryCounts["not_officially_anchored_grade_band"]) {
    lines.push(
      `not_officially_anchored_grade_band: ${riskAgg.primaryCounts["not_officially_anchored_grade_band"]} rows (grades outside 2–4 ministry framing)`
    );
  }
  if (riskAgg.broadOrInternalOnlyRows > 0) {
    lines.push(
      `broadOrInternalOnly (no exact grade-topic registry pin for that row grade): ${riskAgg.broadOrInternalOnlyRows} rows`
    );
  }
  if (profile.hasInternalGapRows) {
    lines.push("Registry lists internal_gap rows — per-grade official tables still incomplete.");
  }
  if (profile.sourceQuality !== "high") {
    lines.push(`Subject sourceQuality is "${profile.sourceQuality}" (no high-confidence registry ceiling yet).`);
  }
  if (!lines.length) lines.push("No dominant automated risk tags — still verify spine vs pedagogy before edits.");
  return lines;
}

function verifyBeforeContentEdits(subjectKey, profile, missingGrades, meta) {
  const items = [
    "Explicit owner approval for any bank change (add/edit/delete), per project rule.",
    "Cross-check intended changes against official spine + POP/PDF anchors for that grade/topic.",
    "Confirm normalized topic keys and bank-vs-official primary classification for affected rows.",
  ];
  if (subjectKey === "english") {
    items.push("Defer English grades 1–2 grammar scope changes until owner-approved English phase.");
  }
  if (subjectKey === "science") {
    items.push("Do not add new Science questions until owner lifts the ban; focus on mapping/registry first.");
  }
  if (missingGrades.length) {
    items.push(
      `Registry lacks exact_grade_topic_source rows for grade(s): ${missingGrades.join(", ")} — pin official PDFs/POP grade pages before claiming alignment.`
    );
  }
  if (meta.blockDuplicateDeletion) {
    items.push("Duplicate deletion deferred — treat duplicates-review as advisory only until owner approves.");
  }
  return items;
}

function readyForContentCorrection(subjectKey, profile, riskAgg) {
  /** Global owner gate + Phase 4B-0b: no high-confidence registry rows. */
  const reasonsNo = [];
  reasonsNo.push("Owner approval required before any question-bank edit.");
  reasonsNo.push("Registry has no high-confidence (high) anchor tier — source hardening incomplete.");
  if (profile.needsPedagogyReviewBecauseSourceWeak) {
    reasonsNo.push("Subject still flagged needsPedagogyReviewBecauseSourceWeak in registry profile.");
  }
  if (subjectKey === "english") {
    reasonsNo.push("Owner rule: do not edit English early-grade items yet.");
  }
  if (subjectKey === "science") {
    reasonsNo.push("Owner rule: do not add Science questions yet (and avoid content churn until approved).");
  }
  return {
    ready: false,
    reasonsNo,
  };
}

function recommendedNextStep(entry, profile, missingGrades, riskAgg) {
  const k = entry.key;
  if (k === "math") {
    return "Add meyda/POP per-grade anchors for grades 1–5 to match grade 6 PDF pattern; then re-run source-quality + bank-vs-official; plan first content reviews only after owner approval.";
  }
  if (k === "geometry") {
    return "Trace geometry strand depth vs POP geometry page + math framework; resolve geometry_early_depth_warning rows; keep geometry as math strand unless product owner confirms separation.";
  }
  if (k === "hebrew") {
    return "Locate official grade pages (2–6) on POP; shrink internal_gap claims; map normalized keys to published strands before any stem edits.";
  }
  if (k === "english") {
    return "Harden English Curriculum 2020 POP/PDF links in registry; inventory english_early_grade_grammar_scope rows for a future owner-approved pass — no stem edits until then.";
  }
  if (k === "science") {
    return "Pin elementary Science & Technology POP sections and any per-grade outcome tables; Science question additions remain off-limits until owner says otherwise.";
  }
  return "Focus Moledet items on grades 2–4 alignment; document geography gaps for grades 1,5,6; lowest priority after other subjects.";
}

function buildMarkdown(payload) {
  const lines = [
    `# Subject-priority curriculum hardening plan`,
    ``,
    `- Generated: ${payload.generatedAt}`,
    `- Phase: ${payload.phase}`,
    ``,
    `## Owner rules (non-negotiable)`,
    ``,
    `- **Subject work order:** ${payload.ownerSubjectOrder.join(" → ")}`,
    `- **Content changes:** Any question-bank addition, edit, or deletion requires **explicit owner approval** before implementation.`,
    `- Science: **do not** add Science questions yet.`,
    `- English: **do not** edit early-grade items yet (owner phase).`,
    `- Duplicates: **do not** delete from audit output alone.`,
    `- UI and Hebrew learner-facing product copy: **no** changes via this track.`,
    ``,
    `## Per-subject plan (in owner order)`,
    ``,
  ];

  for (const s of payload.subjects) {
    lines.push(`### ${s.order}. ${s.label} (\`${s.key}\`)`, ``);
    lines.push(`| Field | Value |`);
    lines.push(`|-------|-------|`);
    lines.push(`| Official source quality (rollup) | **${s.currentOfficialSourceQuality}** (ceiling: ${s.confidenceAfterAuditCeiling}) |`);
    lines.push(`| Exact grade-topic registry coverage | Grades with anchor: ${s.gradesWithExactGradeTopicSource.length ? s.gradesWithExactGradeTopicSource.join(", ") : "—"} |`);
    lines.push(`| Missing exact grade-topic anchors (grades 1–6) | ${s.missingExactGradeTopicAnchors.length ? s.missingExactGradeTopicAnchors.join(", ") : "none listed"} |`);
    lines.push(`| Question count (inventory) | **${s.questionCounts.total}** |`);
    lines.push(`| By grade (row spans counted per grade) | ${Object.entries(s.questionCounts.byGrade).map(([g, n]) => `g${g}:${n}`).join(", ")} |`);
    lines.push(`| Ready for content correction | **${s.readyForContentCorrection ? "yes" : "no"}** |`);
    lines.push(`| Recommended next step | ${s.recommendedNextStep} |`);
    lines.push(``);
    lines.push(`**Strongest risks (automated)**`, ``);
    for (const r of s.strongestRisks) lines.push(`- ${r}`);
    lines.push(``);
    lines.push(`**Verify before any content edits**`, ``);
    for (const v of s.verifyBeforeContentEdits) lines.push(`- ${v}`);
    if (s.readyForContentCorrection === false && s.readinessReasonsNo?.length) {
      lines.push(``);
      lines.push(`**Why not ready**`, ``);
      for (const v of s.readinessReasonsNo) lines.push(`- ${v}`);
    }
    lines.push(``);
  }

  lines.push(`## Artifact`, ``, `- JSON: \`reports/curriculum-audit/subject-priority-hardening-plan.json\``, ``);
  return lines.join("\n");
}

export async function buildSubjectPriorityHardeningPlan(opts = {}) {
  const writeFiles = opts.writeFiles !== false;
  const inventory = loadJson(INV_PATH, "question-inventory");
  const records = inventory.records || [];
  let bankRows = [];
  if (existsSync(BANK_VS_PATH)) {
    const bankVs = loadJson(BANK_VS_PATH, "bank-vs-official");
    bankRows = bankVs.rows || bankVs.comparedRows || [];
  }

  /** @type {object[]} */
  const subjects = [];

  OWNER_SUBJECT_PRIORITY.forEach((entry, index) => {
    const subjectKey = entry.inventoryKey;
    const profile = computeSubjectSourceProfile(subjectKey);
    const missing = missingExactGradeTopicAnchors(subjectKey);
    const coveredGrades = GRADES.filter((g) => !missing.includes(g));
    const qc = countQuestionsByGrade(records, subjectKey);
    const risks = aggregateRisks(bankRows, subjectKey);
    const readiness = readyForContentCorrection(subjectKey, profile, risks);

    subjects.push({
      order: index + 1,
      key: entry.key,
      label: entry.label,
      inventoryKey: subjectKey,
      priorityNotes: entry.notes || null,
      currentOfficialSourceQuality: profile.sourceQuality,
      confidenceAfterAuditCeiling: profile.confidenceAfterAuditCeiling,
      hasExactGradeTopicAnchorInRegistry: profile.hasExactGradeTopicAnchor,
      hasExactSubjectCurriculumAnchor: profile.hasExactSubjectCurriculumAnchor,
      hasInternalGapRows: profile.hasInternalGapRows,
      gradesWithExactGradeTopicSource: coveredGrades,
      missingExactGradeTopicAnchors: missing,
      questionCounts: {
        total: qc.total,
        byGrade: qc.byGrade,
      },
      bankVsAggregate: {
        primaryClassificationCounts: risks.primaryCounts,
        riskTagCounts: risks.tagCounts,
        officialGradeTopicAnchoredRowCount: risks.officialGradeTopicAnchoredRows,
        broadOrInternalOnlyRowCount: risks.broadOrInternalOnlyRows,
        needsPedagogyReviewBecauseSourceWeakRowCount: risks.rowsNeedingPedagogyReviewBecauseSourceWeak,
      },
      strongestRisks: strongestRisks(subjectKey, risks, profile),
      verifyBeforeContentEdits: verifyBeforeContentEdits(subjectKey, profile, missing, {
        blockDuplicateDeletion: true,
      }),
      readyForContentCorrection: readiness.ready,
      readinessReasonsNo: readiness.reasonsNo,
      recommendedNextStep: recommendedNextStep(entry, profile, missing, risks),
    });
  });

  const payload = {
    generatedAt: new Date().toISOString(),
    phase: "subject-priority-hardening-plan",
    ownerSubjectOrder: OWNER_SUBJECT_PRIORITY.map((e) => e.label),
    ownerSubjectKeys: OWNER_SUBJECT_PRIORITY.map((e) => e.key),
    globalRules: {
      contentEditRequiresExplicitOwnerApproval: true,
      doNotAddScienceQuestionsYet: true,
      doNotEditEnglishEarlyGradeItemsYet: true,
      doNotDeleteDuplicatesFromAuditAlone: true,
      noUiChanges: true,
      noHebrewProductCopyChanges: true,
      scienceOverridesPriorCoverageDirection: true,
    },
    subjects,
  };

  if (writeFiles) {
    await mkdir(OUT_DIR, { recursive: true });
    const jsonPath = join(OUT_DIR, "subject-priority-hardening-plan.json");
    const mdPath = join(OUT_DIR, "subject-priority-hardening-plan.md");
    await writeFile(jsonPath, JSON.stringify(payload, null, 2), "utf8");
    await writeFile(mdPath, buildMarkdown(payload), "utf8");
    console.log(`Wrote ${jsonPath}`);
    console.log(`Wrote ${mdPath}`);
  }

  return payload;
}

async function main() {
  await buildSubjectPriorityHardeningPlan({ writeFiles: true });
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
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
