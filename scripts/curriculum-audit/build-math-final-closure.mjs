/**
 * Math Final Closure Gate — coverage, curriculum placement, variety (Phase closure report).
 * Writes reports/curriculum-audit/math-final-closure.{json,md}
 */
import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT_DIR = join(ROOT, "reports", "curriculum-audit");

const modUrl = (rel) => pathToFileURL(join(ROOT, rel)).href;

const { GRADES } = await import(modUrl("utils/math-constants.js"));
const { getLevelConfig } = await import(modUrl("utils/math-storage.js"));
const { generateQuestion } = await import(modUrl("utils/math-question-generator.js"));
const { findTopicPlacement } = await import(modUrl("utils/curriculum-audit/israeli-primary-curriculum-map.js"));
const { MATH_OFFICIAL_SUBSECTION_CATALOG, mathGradeProgrammePdfUrl } = await import(
  modUrl("utils/curriculum-audit/math-official-subsection-catalog.js")
);

/** Rough map: generator operation → conservative normalized curriculum key */
const OP_TO_NORM = {
  addition: "math.addition_subtraction",
  subtraction: "math.addition_subtraction",
  multiplication: "math.multiplication_division",
  division: "math.multiplication_division",
  division_with_remainder: "math.multiplication_division",
  fractions: "math.fractions",
  percentages: "math.percentages",
  sequences: "math.patterns_sequences",
  decimals: "math.decimals",
  rounding: "math.estimation_rounding",
  divisibility: "math.divisibility_factors",
  prime_composite: "math.divisibility_factors",
  powers: "math.powers_and_scaling",
  ratio: "math.ratio_and_scale",
  order_of_operations: "math.equations_and_expressions",
  equations: "math.equations_and_expressions",
  compare: "math.number_sense",
  number_sense: "math.number_sense",
  factors_multiples: "math.divisibility_factors",
  estimation: "math.estimation_rounding",
  scale: "math.ratio_and_scale",
  word_problems: "math.word_problems",
  zero_one_properties: "math.equations_and_expressions",
  mixed: "math.mixed_operations",
};

const LEVELS = ["easy", "medium", "hard"];
const SAMPLES_PER_CELL = 36;
/** Stem normalization collapses numeric drills — stemPatternRatio is advisory */
const STEM_VARIETY_WEAK_THRESHOLD = 0.12;
/** Ops where many distinct `kind` values are expected (multi-branch generators) */
const OPS_EXPECT_RICH_KIND_MIX = new Set([
  "word_problems",
  "fractions",
  "decimals",
  "number_sense",
  "sequences",
  "mixed",
]);
const RICH_KIND_WEAK_BELOW = 4;

let rngState = 0x4d415448 >>> 0;
function runWithMathAuditSeed(seed, fn) {
  const orig = Math.random;
  rngState = (seed >>> 0) ^ 0x9e3779b9;
  Math.random = () => {
    rngState = (Math.imul(rngState, 1664525) + 1013904223) >>> 0;
    return rngState / 4294967296;
  };
  try {
    return fn();
  } finally {
    Math.random = orig;
  }
}

function normalizeStem(s) {
  return String(s || "")
    .replace(/\s+/g, " ")
    .replace(/\d+/g, "#")
    .trim()
    .slice(0, 400);
}

function bucketLabel(bucket) {
  if (!bucket) return "unknown";
  if (bucket === "coreTopics") return "core";
  if (bucket === "allowedTopics") return "allowed";
  if (bucket === "enrichmentTopics") return "enrichment";
  if (bucket === "notExpectedYet") return "not_yet";
  return bucket;
}

function curriculumRow(gradeNum, op) {
  const nk = OP_TO_NORM[op] || `math.${op}`;
  const hit = findTopicPlacement("math", gradeNum, nk);
  if (!hit) {
    return {
      normalizedKey: nk,
      placement: null,
      curriculumLabel: "unmapped",
      expectedLevel: null,
    };
  }
  return {
    normalizedKey: nk,
    placement: bucketLabel(hit.bucket),
    curriculumLabel: hit.def?.labelHe || nk,
    expectedLevel: hit.def?.expectedLevel || null,
  };
}

/** Owner must cross-check MoE PDF vs catalog; listed here for closure appendix. */
function buildOwnerVerificationAppendix() {
  /** @type {object[]} */
  const byGrade = [];
  let lowCt = 0;
  let mediumCt = 0;
  for (let g = 1; g <= 6; g++) {
    const slot = MATH_OFFICIAL_SUBSECTION_CATALOG[`grade_${g}`];
    const pdfUrl = slot?.sourcePdf || mathGradeProgrammePdfUrl(g);
    const sections = slot?.sections || [];
    const pending = sections.filter((s) => s.confidence === "low" || s.confidence === "medium");
    for (const s of sections) {
      if (s.confidence === "low") lowCt++;
      else if (s.confidence === "medium") mediumCt++;
    }
    byGrade.push({
      grade: g,
      sourcePdfUrl: pdfUrl,
      sectionsNeedingOwnerPdfVerification: pending.map((s) => ({
        sectionKey: s.sectionKey,
        labelHe: s.labelHe,
        catalogConfidence: s.confidence,
        subsectionLabelsHe: s.subsectionLabelsHe || [],
        mapsToNormalizedKeys: s.mapsToNormalizedKeys || [],
        strand: s.strand,
        sourcePageHint: s.sourcePageHint || "",
        notes: s.notes || "",
      })),
      allSectionLabelsThisGrade: sections.map((s) => ({
        sectionKey: s.sectionKey,
        labelHe: s.labelHe,
        catalogConfidence: s.confidence,
      })),
    });
  }
  return {
    purpose:
      "Verify subsection headings / strands in this catalog against the official Ministry elementary math programme PDF for each grade (kita{n}.pdf). Medium/low confidence entries require explicit owner confirmation before catalog mappings gate release.",
    byGrade,
    counts: {
      catalogSectionsLowConfidence: lowCt,
      catalogSectionsMediumConfidence: mediumCt,
    },
  };
}

function analyzeVariety(stems, kinds, op) {
  const counts = new Map();
  for (const st of stems) {
    const k = normalizeStem(st);
    const h = createHash("sha1").update(k).digest("hex").slice(0, 16);
    counts.set(h, (counts.get(h) || 0) + 1);
  }
  const uniqueStemPatterns = counts.size;
  const total = stems.length;
  const stemRatio = total ? uniqueStemPatterns / total : 0;
  let maxRepeat = 0;
  for (const c of counts.values()) maxRepeat = Math.max(maxRepeat, c);
  const kindSet = new Set(kinds.filter(Boolean));
  const uniqueKinds = kindSet.size;
  const weakKindVariety =
    OPS_EXPECT_RICH_KIND_MIX.has(op) &&
    uniqueKinds < RICH_KIND_WEAK_BELOW &&
    kinds.filter(Boolean).length >= 18;
  const weakStemCollapse =
    stemRatio < STEM_VARIETY_WEAK_THRESHOLD &&
    total >= 18 &&
    uniqueKinds >= RICH_KIND_WEAK_BELOW;
  return {
    sampleCount: total,
    uniqueNormalizedStemPatterns: uniqueStemPatterns,
    stemPatternRatio: Math.round(stemRatio * 1000) / 1000,
    maxRepeatSameStemPattern: maxRepeat,
    uniqueKinds,
    weakKindVariety,
    /** Numeric drills often share stem patterns when digits are stripped — informational only */
    weakStemPatternCollapse: weakStemCollapse,
  };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  /** @type {object[]} */
  const gradeReports = [];
  /** @type {string[]} */
  const thinBranches = [];
  /** @type {string[]} */
  const weakVariety = [];

  for (let g = 1; g <= 6; g++) {
    const gk = `g${g}`;
    const uiTopics = (GRADES[gk]?.operations || []).filter((x) => x !== "mixed");
    const row = {
      grade: g,
      gradeKey: gk,
      uiTopics,
      topics: {},
      curriculumNotes: [],
    };

    for (const op of uiTopics) {
      const cRow = curriculumRow(g, op);
      if (cRow.placement === "not_yet") {
        row.curriculumNotes.push({
          op,
          warning: "Mapped strand marked notExpectedYet for this grade in conservative map — verify PDF.",
          normalizedKey: cRow.normalizedKey,
        });
      }

      const topicStats = {
        uiListed: true,
        curriculum: cRow,
        byDifficulty: {},
      };

      for (const lev of LEVELS) {
        const lc = getLevelConfig(g, lev);
        const stems = [];
        const kinds = [];
        const opsOut = [];
        for (let i = 0; i < SAMPLES_PER_CELL; i++) {
          const seed = 0x6d617468 + g * 9973 + op.split("").reduce((a, c) => a + c.charCodeAt(0), 0) * 131 + (lev === "easy" ? 11 : lev === "medium" ? 17 : 29) * 104729 + i * 65521;
          const q = runWithMathAuditSeed(seed, () => generateQuestion(lc, op, gk, null));
          const stem = q?.question ?? q?.exerciseText ?? "";
          stems.push(stem);
          kinds.push(q?.params?.kind ?? "");
          opsOut.push(q?.operation ?? op);
        }

        const variety = analyzeVariety(stems, kinds, op);
        const metaMismatch = opsOut.filter((o) => o && o !== op).length;
        topicStats.byDifficulty[lev] = {
          samples: SAMPLES_PER_CELL,
          variety,
          kindsObserved: [...new Set(kinds)].slice(0, 36),
          operationMismatchCount: metaMismatch,
        };

        if (variety.weakKindVariety) {
          weakVariety.push(`${gk}/${op}/${lev} kinds=${variety.uniqueKinds}`);
        }
        if (variety.weakStemPatternCollapse) {
          thinBranches.push(`${gk}/${op}/${lev} stemPatternRatio=${variety.stemPatternRatio}`);
        }
      }

      row.topics[op] = topicStats;
    }

    gradeReports.push(row);
  }

  /** @type {Record<string, unknown>} */
  let auditCrossRefs = {};
  try {
    const cand = JSON.parse(readFileSync(join(OUT_DIR, "math-row-subsection-candidates.json"), "utf8"));
    auditCrossRefs.mathRowSubsectionCandidatesSummary = cand.summary || null;
    auditCrossRefs.sequencingHistogram = cand.sequencingHistogram || null;
  } catch {
    auditCrossRefs.mathRowSubsectionCandidatesSummary = null;
  }

  const ownerVerificationAppendix = buildOwnerVerificationAppendix();
  const ownerPdfSignedOff = process.env.MATH_OWNER_CLOSURE_SIGNOFF === "1";

  const payload = {
    generatedAt: new Date().toISOString(),
    phase: "math-final-closure",
    auditCrossRefs,
    ownerVerificationAppendix,
    meta: {
      samplesPerTopicDifficulty: SAMPLES_PER_CELL,
      richKindMixExpectedOps: [...OPS_EXPECT_RICH_KIND_MIX],
      richKindWeakBelow: RICH_KIND_WEAK_BELOW,
      stemPatternWeakRatio: STEM_VARIETY_WEAK_THRESHOLD,
      stemNormalization: "digits→#, whitespace collapsed",
      ownerPdfVerificationSignedOff: ownerPdfSignedOff,
      ownerPdfSignoffEnv:
        "Set MATH_OWNER_CLOSURE_SIGNOFF=1 only after Ministry PDF subsection titles are cross-checked against this catalog.",
      notes: [
        "mixed operation is not expanded here — it aggregates enabled ops in the Math UI.",
        "Curriculum placement uses conservative israeli-primary-curriculum-map (advisory).",
      ],
    },
    summary: {
      grades: gradeReports.length,
      thinBranchWarnings: thinBranches.length,
      weakVarietyFlags: weakVariety.length,
    },
    thinBranches,
    weakVarietyBranches: weakVariety,
    grades: gradeReports,
    closureQuestions: {
      rationale:
        "Runtime + GRADES can be automated; PDF line match and catalog overlap are human gates until resolved.",
    },
  };

  const competing =
    Number(auditCrossRefs.mathRowSubsectionCandidatesSummary?.rowsWithCompetingCandidates) || 0;
  const seqMissing = Number(auditCrossRefs.sequencingHistogram?.missing_number_intro_review) || 0;

  payload.closureQuestions.automatedVarietyGatePassed =
    thinBranches.length === 0 && weakVariety.length === 0;
  payload.closureQuestions.isMathFullyClosedForDevelopmentStage =
    payload.closureQuestions.automatedVarietyGatePassed &&
    competing === 0 &&
    seqMissing === 0 &&
    ownerPdfSignedOff;
  payload.closureQuestions.remainingBlockers = [
    competing > 0
      ? `${competing} math inventory rows with competing subsection candidates (refine catalog maps or PDF IDs)`
      : null,
    seqMissing > 0
      ? `${seqMissing} inventory rows carry missing_number_intro_review (pedagogy/PDF confirmation — not suppressed)`
      : null,
    !ownerPdfSignedOff
      ? "Owner PDF verification pending — see ownerVerificationAppendix; export MATH_OWNER_CLOSURE_SIGNOFF=1 only after MoE kita PDF cross-check per grade."
      : null,
  ].filter(Boolean);

  const md = renderMarkdown(payload);
  await writeFile(join(OUT_DIR, "math-final-closure.json"), JSON.stringify(payload, null, 2), "utf8");
  await writeFile(join(OUT_DIR, "math-final-closure.md"), md, "utf8");
  console.log(`Wrote ${join(OUT_DIR, "math-final-closure.json")}`);
  console.log(`Wrote ${join(OUT_DIR, "math-final-closure.md")}`);
}

function renderMarkdown(p) {
  const lines = [];
  lines.push(`# Math Final Closure Report`);
  lines.push("");
  lines.push(`Generated: ${p.generatedAt}`);
  lines.push("");
  lines.push(`## Summary`);
  lines.push(`- Thin-branch warnings: **${p.summary.thinBranchWarnings}**`);
  lines.push(`- Weak variety flags (rich-kind ops): **${p.summary.weakVarietyFlags}**`);
  lines.push(`- Automated variety gate: **${p.closureQuestions.automatedVarietyGatePassed ? "pass" : "fail"}**`);
  lines.push(
    `- Math closed for current dev stage: **${p.closureQuestions.isMathFullyClosedForDevelopmentStage ? "yes" : "no"}**`
  );
  if (p.auditCrossRefs?.mathRowSubsectionCandidatesSummary) {
    const s = p.auditCrossRefs.mathRowSubsectionCandidatesSummary;
    lines.push(`- Inventory competing candidates: **${s.rowsWithCompetingCandidates ?? "?"}**`);
    lines.push(`- Inventory no-subsection rows: **${s.noSubsectionCandidateRows ?? "?"}**`);
  }
  if (p.auditCrossRefs?.sequencingHistogram) {
    lines.push(`- Sequencing histogram: \`${JSON.stringify(p.auditCrossRefs.sequencingHistogram)}\``);
  }
  if (p.closureQuestions.remainingBlockers?.length) {
    lines.push(`### Remaining blockers`);
    for (const b of p.closureQuestions.remainingBlockers) lines.push(`- ${b}`);
  }
  lines.push("");
  lines.push(`## Owner / Ministry PDF verification appendix`);
  lines.push(`- Catalog low-confidence sections: **${p.ownerVerificationAppendix?.counts?.catalogSectionsLowConfidence ?? "?"}**`);
  lines.push(`- Catalog medium-confidence sections: **${p.ownerVerificationAppendix?.counts?.catalogSectionsMediumConfidence ?? "?"}**`);
  lines.push(`- Signed off via env: **${p.meta?.ownerPdfVerificationSignedOff ? "yes" : "no"}** (${p.meta?.ownerPdfSignoffEnv || ""})`);
  lines.push("");
  for (const block of p.ownerVerificationAppendix?.byGrade || []) {
    lines.push(`### Grade ${block.grade} — PDF: ${block.sourcePdfUrl}`);
    lines.push(`**Sections pending explicit PDF check (medium/low confidence):**`);
    if (!block.sectionsNeedingOwnerPdfVerification?.length) {
      lines.push(`- (none — all high confidence)`);
    } else {
      for (const s of block.sectionsNeedingOwnerPdfVerification) {
        lines.push(
          `- \`${s.sectionKey}\` — ${s.labelHe} *(confidence: ${s.catalogConfidence})* — subsections: ${(s.subsectionLabelsHe || []).join("; ") || "—"}`
        );
      }
    }
    lines.push("");
  }
  lines.push(`### Grade × topic × difficulty`);
  for (const g of p.grades) {
    lines.push(`#### כיתה ${g.grade} (${g.gradeKey})`);
    lines.push(`**UI topics:** ${g.uiTopics.join(", ")}`);
    if (g.curriculumNotes?.length) {
      lines.push(`*Curriculum warnings:*`);
      for (const n of g.curriculumNotes) {
        lines.push(`- ${n.op}: ${n.warning}`);
      }
    }
    for (const [op, t] of Object.entries(g.topics)) {
      lines.push(`- **${op}** — placement *${t.curriculum?.placement || "?"}* (${t.curriculum?.normalizedKey || ""})`);
      for (const lev of LEVELS) {
        const b = t.byDifficulty[lev];
        const v = b?.variety;
        lines.push(
          `  - ${lev}: samples=${b?.samples}, uniqueKinds=${v?.uniqueKinds}, stemPatternRatio=${v?.stemPatternRatio}, weakKinds=${v?.weakKindVariety ? "yes" : "no"}, weakStemCollapse=${v?.weakStemPatternCollapse ? "yes" : "no"}, opMismatch=${b?.operationMismatchCount}`
        );
      }
    }
    lines.push("");
  }
  if (p.thinBranches?.length) {
    lines.push(`## Thin branches`);
    for (const x of p.thinBranches) lines.push(`- ${x}`);
    lines.push("");
  }
  if (p.weakVarietyBranches?.length) {
    lines.push(`## Weak variety`);
    for (const x of p.weakVarietyBranches) lines.push(`- ${x}`);
  }
  return lines.join("\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
