/**
 * Geometry Final Closure Gate — coverage, curriculum placement, variety (Phase closure report).
 * Writes reports/curriculum-audit/geometry-final-closure.{json,md}
 */
import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import {
  buildGeometryRuntimeVsPdfRows,
  compareGeometryOfficialCatalogToPdfSections,
  GEOMETRY_TOPIC_TO_NORM,
} from "./lib/geometry-catalog-pdf-compare.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT_DIR = join(ROOT, "reports", "curriculum-audit");

const modUrl = (rel) => pathToFileURL(join(ROOT, rel)).href;

const { GRADES } = await import(modUrl("utils/geometry-constants.js"));
const { getLevelForGrade } = await import(modUrl("utils/geometry-storage.js"));
const { generateQuestion } = await import(modUrl("utils/geometry-question-generator.js"));
const { findTopicPlacement } = await import(modUrl("utils/curriculum-audit/israeli-primary-curriculum-map.js"));
const { GEOMETRY_OFFICIAL_SUBSECTION_CATALOG, geometryGradeProgrammePdfUrl } = await import(
  modUrl("utils/curriculum-audit/geometry-official-subsection-catalog.js")
);

const LEVELS = ["easy", "medium", "hard"];
const SAMPLES_PER_CELL = 36;
const STEM_VARIETY_WEAK_THRESHOLD = 0.12;
/** Topics where many distinct generator `kind` values are typical */
const OPS_EXPECT_RICH_KIND_MIX = new Set(["mixed"]);
const RICH_KIND_WEAK_BELOW = 4;
/** Concept-/formula-heavy topics often reuse stem templates after digit stripping */
const STEM_COLLAPSE_EXEMPT_TOPICS = new Set(["pythagoras", "circles", "heights", "volume"]);

let rngState = 0x47454f4d >>> 0;
function runWithGeometryAuditSeed(seed, fn) {
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

function curriculumRow(gradeNum, topic) {
  const nk = GEOMETRY_TOPIC_TO_NORM[topic] || `geometry.${topic}`;
  const hit = findTopicPlacement("geometry", gradeNum, nk);
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

function buildOwnerVerificationAppendix() {
  /** @type {object[]} */
  const byGrade = [];
  let lowCt = 0;
  let mediumCt = 0;
  for (let g = 1; g <= 6; g++) {
    const slot = GEOMETRY_OFFICIAL_SUBSECTION_CATALOG[`grade_${g}`];
    const pdfUrl = slot?.sourcePdf || geometryGradeProgrammePdfUrl(g);
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
      "Verify geometry subsection hooks against the official Ministry elementary **math** programme PDF for each grade (kita{n}.pdf) where the geometry strand is embedded. Medium/low confidence entries require explicit owner confirmation before catalog mappings gate release.",
    byGrade,
    counts: {
      catalogSectionsLowConfidence: lowCt,
      catalogSectionsMediumConfidence: mediumCt,
    },
  };
}

function analyzeVariety(stems, kinds, topic) {
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
    OPS_EXPECT_RICH_KIND_MIX.has(topic) &&
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
    const uiTopics = (GRADES[gk]?.topics || []).filter((x) => x !== "mixed");
    const row = {
      grade: g,
      gradeKey: gk,
      uiTopics,
      topics: {},
      curriculumNotes: [],
    };

    for (const topic of uiTopics) {
      const cRow = curriculumRow(g, topic);
      if (cRow.placement === "not_yet") {
        row.curriculumNotes.push({
          topic,
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
        const lc = getLevelForGrade(lev, gk);
        const stems = [];
        const kinds = [];
        const topicsOut = [];
        for (let i = 0; i < SAMPLES_PER_CELL; i++) {
          const seed =
            0x67656f6d +
            g * 9973 +
            topic.split("").reduce((a, c) => a + c.charCodeAt(0), 0) * 131 +
            (lev === "easy" ? 11 : lev === "medium" ? 17 : 29) * 104729 +
            i * 65521;
          const q = runWithGeometryAuditSeed(seed, () => generateQuestion(lc, topic, gk, null));
          const stem = q?.question ?? q?.exerciseText ?? "";
          stems.push(stem);
          kinds.push(q?.params?.kind ?? "");
          topicsOut.push(q?.topic ?? topic);
        }

        const variety = analyzeVariety(stems, kinds, topic);
        const metaMismatch = topicsOut.filter((t) => t && t !== topic).length;
        topicStats.byDifficulty[lev] = {
          samples: SAMPLES_PER_CELL,
          variety,
          kindsObserved: [...new Set(kinds)].slice(0, 36),
          topicMismatchCount: metaMismatch,
        };

        if (variety.weakKindVariety) {
          weakVariety.push(`${gk}/${topic}/${lev} kinds=${variety.uniqueKinds}`);
        }
        if (variety.weakStemPatternCollapse && !STEM_COLLAPSE_EXEMPT_TOPICS.has(topic)) {
          thinBranches.push(`${gk}/${topic}/${lev} stemPatternRatio=${variety.stemPatternRatio}`);
        }
      }

      row.topics[topic] = topicStats;
    }

    gradeReports.push(row);
  }

  /** @type {Record<string, unknown>} */
  let auditCrossRefs = {};
  try {
    const cand = JSON.parse(readFileSync(join(OUT_DIR, "geometry-row-subsection-candidates.json"), "utf8"));
    auditCrossRefs.geometryRowSubsectionCandidatesSummary = cand.summary || null;
    auditCrossRefs.sequencingHistogram = cand.sequencingHistogram || null;
  } catch {
    auditCrossRefs.geometryRowSubsectionCandidatesSummary = null;
  }

  const ownerVerificationAppendix = buildOwnerVerificationAppendix();
  const ownerPdfSignedOff = process.env.GEOMETRY_OWNER_CLOSURE_SIGNOFF === "1";

  const payload = {
    generatedAt: new Date().toISOString(),
    phase: "geometry-final-closure",
    auditCrossRefs,
    ownerVerificationAppendix,
    meta: {
      samplesPerTopicDifficulty: SAMPLES_PER_CELL,
      richKindMixExpectedTopics: [...OPS_EXPECT_RICH_KIND_MIX],
      richKindWeakBelow: RICH_KIND_WEAK_BELOW,
      stemPatternWeakRatio: STEM_VARIETY_WEAK_THRESHOLD,
      stemNormalization: "digits→#, whitespace collapsed",
      ownerPdfVerificationSignedOff: ownerPdfSignedOff,
      ownerPdfSignoffEnv:
        "Set GEOMETRY_OWNER_CLOSURE_SIGNOFF=1 only after Ministry kita PDF geometry strand is cross-checked against this catalog.",
      notes: [
        "mixed topic is not expanded here — it aggregates enabled topics in the Geometry UI.",
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

  let pdfCatalogPayload = null;
  let catalogVsPdfPayload = null;
  let runtimeVsPdfPayload = null;
  const pdfCatPath = join(OUT_DIR, "geometry-pdf-section-catalog.json");
  const catVsPath = join(OUT_DIR, "geometry-catalog-vs-pdf-sections.json");
  try {
    if (existsSync(pdfCatPath)) {
      pdfCatalogPayload = JSON.parse(readFileSync(pdfCatPath, "utf8"));
    }
    if (existsSync(catVsPath)) {
      catalogVsPdfPayload = JSON.parse(readFileSync(catVsPath, "utf8"));
    } else if (pdfCatalogPayload?.meta?.allGradesDownloaded) {
      catalogVsPdfPayload = compareGeometryOfficialCatalogToPdfSections(
        pdfCatalogPayload,
        GEOMETRY_OFFICIAL_SUBSECTION_CATALOG
      );
      await writeFile(catVsPath, JSON.stringify(catalogVsPdfPayload, null, 2), "utf8");
    }
    if (pdfCatalogPayload && catalogVsPdfPayload) {
      runtimeVsPdfPayload = buildGeometryRuntimeVsPdfRows(
        { grades: gradeReports },
        catalogVsPdfPayload,
        pdfCatalogPayload
      );
      try {
        const candPath = join(OUT_DIR, "geometry-row-subsection-candidates.json");
        if (existsSync(candPath)) {
          runtimeVsPdfPayload.meta = {
            ...(runtimeVsPdfPayload.meta || {}),
            geometryRowSubsectionCandidatesSummary:
              JSON.parse(readFileSync(candPath, "utf8")).summary || null,
          };
        }
      } catch {
        /* ignore */
      }
      await writeFile(
        join(OUT_DIR, "geometry-runtime-vs-pdf-sections.json"),
        JSON.stringify(runtimeVsPdfPayload, null, 2),
        "utf8"
      );
      await writeFile(
        join(OUT_DIR, "geometry-runtime-vs-pdf-sections.md"),
        renderRuntimeVsPdfMarkdown(runtimeVsPdfPayload),
        "utf8"
      );
    }
  } catch (e) {
    payload.pdfVerificationException = String(e?.message || e);
  }

  const unresolvedTopicRows = (runtimeVsPdfPayload?.rows || []).filter(
    (r) => r.status === "missing" || r.status === "needs_manual_review"
  );

  payload.pdfSectionVerification = {
    geometryPdfSectionCatalogPresent: !!pdfCatalogPayload,
    allGradesPdfDownloaded: !!pdfCatalogPayload?.meta?.allGradesDownloaded,
    catalogSectionsMissingPdfSupport: catalogVsPdfPayload?.summary?.missing_pdf_support ?? null,
    siteTopicsMissingPdfSupport: runtimeVsPdfPayload?.summary?.siteTopicsMissingPdfSupport ?? null,
    generatedTopicsMissingPdfSupport:
      runtimeVsPdfPayload?.summary?.generatedTopicsMissingPdfSupport ?? null,
    unresolvedTopicRowCount: unresolvedTopicRows.length,
    unresolvedTopicRows,
  };
  payload.catalogVsPdfSectionsSummary = catalogVsPdfPayload?.summary || null;
  payload.runtimeVsPdfSectionsSummary = runtimeVsPdfPayload?.summary || null;

  const competing =
    Number(auditCrossRefs.geometryRowSubsectionCandidatesSummary?.rowsWithCompetingCandidates) || 0;

  const hist = auditCrossRefs.sequencingHistogram || {};
  const seqHigh =
    (hist.topic_not_in_product_grade || 0) + (hist.topic_too_early_for_spine || 0);

  const missCatalogPdf = Number(catalogVsPdfPayload?.summary?.missing_pdf_support ?? -1);
  const missSitePdf = Number(runtimeVsPdfPayload?.summary?.siteTopicsMissingPdfSupport ?? -1);
  const missGenPdf = Number(runtimeVsPdfPayload?.summary?.generatedTopicsMissingPdfSupport ?? -1);

  const pdfSectionGatePassed =
    !!pdfCatalogPayload &&
    !!pdfCatalogPayload.meta?.allGradesDownloaded &&
    !!catalogVsPdfPayload &&
    missCatalogPdf === 0 &&
    !!runtimeVsPdfPayload &&
    missSitePdf === 0 &&
    missGenPdf === 0 &&
    unresolvedTopicRows.length === 0;

  const sequencingGatePassed = seqHigh === 0;

  payload.closureQuestions.automatedVarietyGatePassed =
    thinBranches.length === 0 && weakVariety.length === 0;
  payload.closureQuestions.pdfSectionGatePassed = pdfSectionGatePassed;
  payload.closureQuestions.sequencingGatePassed = sequencingGatePassed;
  payload.closureQuestions.sequencingHighSeverityTotal = seqHigh;
  payload.closureQuestions.isGeometryFullyClosedForDevelopmentStage =
    payload.closureQuestions.automatedVarietyGatePassed &&
    competing === 0 &&
    sequencingGatePassed &&
    pdfSectionGatePassed &&
    ownerPdfSignedOff;

  payload.closureQuestions.remainingBlockers = [
    competing > 0
      ? `${competing} geometry inventory rows with competing subsection candidates (refine catalog maps or PDF IDs)`
      : null,
    !sequencingGatePassed
      ? `${seqHigh} inventory rows with topic_not_in_product_grade or topic_too_early_for_spine — see geometry-row-subsection-candidates.json`
      : null,
    !pdfCatalogPayload
      ? "Missing reports/curriculum-audit/geometry-pdf-section-catalog.json — run npm run audit:curriculum:geometry-pdf-section-catalog."
      : null,
    pdfCatalogPayload && !pdfCatalogPayload.meta?.allGradesDownloaded
      ? "One or more kita PDF downloads failed — see geometry-pdf-section-catalog.json byGrade[].downloadOk."
      : null,
    !catalogVsPdfPayload
      ? "Missing geometry-catalog-vs-pdf-sections — run catalog vs PDF step after PDF extraction."
      : null,
    missCatalogPdf > 0
      ? `${missCatalogPdf} official catalog subsection(s) classified missing_pdf_support vs extracted PDF text — refine utils/curriculum-audit/geometry-official-subsection-catalog.js or extraction heuristics.`
      : null,
    !runtimeVsPdfPayload
      ? "Could not build runtime-vs-PDF report — ensure PDF catalog and catalog-vs-PDF exist."
      : null,
    missSitePdf > 0
      ? `${missSitePdf} site-visible topic row(s) lack PDF support per heuristic — see geometry-runtime-vs-pdf-sections.json.`
      : null,
    missGenPdf > 0
      ? `${missGenPdf} generated topic row(s) lack PDF support — see geometry-runtime-vs-pdf-sections.json.`
      : null,
    unresolvedTopicRows.length > 0
      ? `${unresolvedTopicRows.length} unresolved topic rows (missing / needs_manual_review) — listed under pdfSectionVerification.unresolvedTopicRows.`
      : null,
    !ownerPdfSignedOff
      ? "Owner PDF verification pending — see ownerVerificationAppendix; export GEOMETRY_OWNER_CLOSURE_SIGNOFF=1 only after MoE kita PDF cross-check per grade."
      : null,
  ].filter(Boolean);

  const md = renderMarkdown(payload);
  await writeFile(join(OUT_DIR, "geometry-final-closure.json"), JSON.stringify(payload, null, 2), "utf8");
  await writeFile(join(OUT_DIR, "geometry-final-closure.md"), md, "utf8");
  console.log(`Wrote ${join(OUT_DIR, "geometry-final-closure.json")}`);
  console.log(`Wrote ${join(OUT_DIR, "geometry-final-closure.md")}`);
}

function renderRuntimeVsPdfMarkdown(payload) {
  const lines = [];
  lines.push("# Geometry runtime / UI topics vs PDF sections");
  lines.push("");
  lines.push(`Generated: ${payload.generatedAt}`);
  lines.push("");
  lines.push(`- Site topics missing PDF support: **${payload.summary.siteTopicsMissingPdfSupport}**`);
  lines.push(`- Generated topics missing PDF support: **${payload.summary.generatedTopicsMissingPdfSupport}**`);
  lines.push(`- Needs manual review: **${payload.summary.needsManualReview}**`);
  lines.push("");
  for (const r of payload.rows || []) {
    lines.push(
      `- **G${r.grade}** \`${r.topic}\` → ${r.normalizedKey} — **${r.status}** (PDF support: ${r.pdfNormKeySupport})`
    );
  }
  return lines.join("\n");
}

function renderMarkdown(p) {
  const lines = [];
  lines.push(`# Geometry Final Closure Report`);
  lines.push("");
  lines.push(`Generated: ${p.generatedAt}`);
  lines.push("");
  lines.push(`## Summary`);
  lines.push(`- Thin-branch warnings: **${p.summary.thinBranchWarnings}**`);
  lines.push(`- Weak variety flags (rich-kind topics): **${p.summary.weakVarietyFlags}**`);
  lines.push(`- Automated variety gate: **${p.closureQuestions.automatedVarietyGatePassed ? "pass" : "fail"}**`);
  lines.push(`- PDF section gate (catalog + runtime vs MoE PDF text): **${p.closureQuestions.pdfSectionGatePassed ? "pass" : "fail"}**`);
  lines.push(`- Sequencing gate (high-severity inventory rows): **${p.closureQuestions.sequencingGatePassed ? "pass" : "fail"}** (${p.closureQuestions.sequencingHighSeverityTotal ?? 0} rows)`);
  if (p.pdfSectionVerification) {
    const v = p.pdfSectionVerification;
    lines.push(`- PDF catalog on disk: **${v.geometryPdfSectionCatalogPresent ? "yes" : "no"}**`);
    lines.push(`- All kita PDFs downloaded: **${v.allGradesPdfDownloaded ? "yes" : "no"}**`);
    lines.push(`- Catalog sections missing_pdf_support: **${v.catalogSectionsMissingPdfSupport ?? "?"}**`);
    lines.push(`- Site topics missing PDF support: **${v.siteTopicsMissingPdfSupport ?? "?"}**`);
    lines.push(`- Generated topics missing PDF support: **${v.generatedTopicsMissingPdfSupport ?? "?"}**`);
    lines.push(`- Unresolved topic rows: **${v.unresolvedTopicRowCount ?? "?"}**`);
  }
  lines.push(
    `- Geometry closed for current dev stage: **${p.closureQuestions.isGeometryFullyClosedForDevelopmentStage ? "yes" : "no"}**`
  );
  if (p.auditCrossRefs?.geometryRowSubsectionCandidatesSummary) {
    const s = p.auditCrossRefs.geometryRowSubsectionCandidatesSummary;
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
        lines.push(`- ${n.topic}: ${n.warning}`);
      }
    }
    for (const [topic, t] of Object.entries(g.topics)) {
      lines.push(`- **${topic}** — placement *${t.curriculum?.placement || "?"}* (${t.curriculum?.normalizedKey || ""})`);
      for (const lev of LEVELS) {
        const b = t.byDifficulty[lev];
        const v = b?.variety;
        lines.push(
          `  - ${lev}: samples=${b?.samples}, uniqueKinds=${v?.uniqueKinds}, stemPatternRatio=${v?.stemPatternRatio}, weakKinds=${v?.weakKindVariety ? "yes" : "no"}, weakStemCollapse=${v?.weakStemPatternCollapse ? "yes" : "no"}, topicMismatch=${b?.topicMismatchCount}`
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
