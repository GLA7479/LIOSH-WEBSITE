/**
 * Science final closure — inventory, curriculum placement, runtime gate, variety.
 * Writes reports/curriculum-audit/science-final-closure.{json,md}
 */
import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT_DIR = join(ROOT, "reports", "curriculum-audit");
const modUrl = (rel) => pathToFileURL(join(ROOT, rel)).href;

const { SCIENCE_GRADES, SCIENCE_GRADE_ORDER } = await import(modUrl("data/science-curriculum.js"));
const { SCIENCE_QUESTIONS } = await import(modUrl("data/science-questions.js"));
const { SCIENCE_TOPIC_TO_REP_NORM } = await import(modUrl("utils/science-grade-topic-policy.js"));
const { findTopicPlacement } = await import(modUrl("utils/curriculum-audit/israeli-primary-curriculum-map.js"));
const {
  buildScienceRuntimeVsOfficialSummary,
  summarizeScienceRegistry,
  scienceRegistryRows,
} = await import(pathToFileURL(join(ROOT, "scripts/curriculum-audit/lib/science-catalog-source-compare.mjs")).href);
const { SCIENCE_OFFICIAL_SUBSECTION_CATALOG } = await import(modUrl("utils/curriculum-audit/science-official-subsection-catalog.js"));
const { summarizeScienceRuntimeThinForClosure } = await import(modUrl("utils/science-runtime-coverage.js"));

function bucketLabel(bucket) {
  if (!bucket) return "unknown";
  if (bucket === "coreTopics") return "core";
  if (bucket === "allowedTopics") return "allowed";
  if (bucket === "enrichmentTopics") return "enrichment";
  if (bucket === "notExpectedYet") return "not_yet";
  return bucket;
}

function normalizeStem(s) {
  return String(s || "")
    .replace(/\s+/g, " ")
    .replace(/\d+/g, "#")
    .trim()
    .slice(0, 400);
}

function analyzeStemVariety(stems) {
  const counts = new Map();
  for (const st of stems) {
    const k = normalizeStem(st);
    const h = createHash("sha1").update(k).digest("hex").slice(0, 16);
    counts.set(h, (counts.get(h) || 0) + 1);
  }
  const unique = counts.size;
  const total = stems.length;
  const ratio = total ? unique / total : 0;
  let maxRepeat = 0;
  for (const c of counts.values()) maxRepeat = Math.max(maxRepeat, c);
  return {
    sampleCount: total,
    uniqueStemPatterns: unique,
    stemPatternRatio: Math.round(ratio * 1000) / 1000,
    maxRepeatSamePattern: maxRepeat,
  };
}

/** Normalize inventory difficulty: pipe-separated UI levels (audit artifact from multi-level spans) become separate bucket tallies. */
function normalizeInventoryDifficultyTokens(raw) {
  const s = String(raw ?? "").toLowerCase().trim();
  if (!s) return ["unknown"];
  const parts = s.includes("|") ? s.split("|").map((x) => x.trim()).filter(Boolean) : [s];
  const map = {
    basic: "easy",
    standard: "medium",
    advanced: "hard",
    intermediate: "medium",
    easy: "easy",
    medium: "medium",
    hard: "hard",
  };
  const levels = [];
  for (const p of parts) {
    const m = map[p] ?? p;
    if (m === "easy" || m === "medium" || m === "hard") levels.push(m);
    else levels.push("unknown");
  }
  return levels.length ? [...new Set(levels)] : ["unknown"];
}

function loadInventoryRecords() {
  const p = join(OUT_DIR, "question-inventory.json");
  if (!existsSync(p)) return { records: [], path: null };
  try {
    const raw = JSON.parse(readFileSync(p, "utf8"));
    const records = Array.isArray(raw) ? raw : raw?.records || [];
    return { records, path: p };
  } catch {
    return { records: [], path: p };
  }
}

function aggregateInventoryScience(records) {
  const sc = records.filter((r) => r.subject === "science");
  /** @type {Map<string, number>} */
  const byGradeTopicDiff = new Map();
  /** @type {Map<string, number>} */
  const stemDupHits = new Map();
  let missingCritical = 0;

  for (const r of sc) {
    if (r.metadataCompleteness?.missingCritical) missingCritical++;
    const gmin = r.gradeMin ?? r.grade;
    const gmax = r.gradeMax ?? r.grade;
    const diffRaw = r.difficulty || "unknown";
    const topic = String(r.topic || "unknown").split("|")[0].trim() || "unknown";
    if (!Number.isFinite(gmin) || !Number.isFinite(gmax)) continue;
    const diffTokens = normalizeInventoryDifficultyTokens(diffRaw);
    for (let g = gmin; g <= gmax; g++) {
      for (const dTok of diffTokens) {
        const k = `g${g}|${topic}|${dTok}`;
        byGradeTopicDiff.set(k, (byGradeTopicDiff.get(k) || 0) + 1);
      }
    }
    if (r.stemHash) {
      stemDupHits.set(r.stemHash, (stemDupHits.get(r.stemHash) || 0) + 1);
    }
  }

  const duplicateStemHashes = [...stemDupHits.entries()].filter(([, c]) => c > 1).length;
  const thinBuckets = [...byGradeTopicDiff.entries()].filter(([, c]) => c < 3);

  return {
    scienceRowCount: sc.length,
    missingCriticalMetadataRows: missingCritical,
    countsByGradeTopicDifficulty: Object.fromEntries([...byGradeTopicDiff.entries()].slice(0, 500)),
    countsTruncated: byGradeTopicDiff.size > 500,
    duplicateStemHashCount: duplicateStemHashes,
    thinInventoryBuckets: thinBuckets.slice(0, 100),
    thinInventoryBucketCount: thinBuckets.length,
  };
}

function stemVarietyByGradeAndTopic(gradeKey) {
  const topics = (SCIENCE_GRADES[gradeKey]?.topics || []).filter((t) => t !== "mixed");
  /** @type {Record<string, ReturnType<typeof analyzeStemVariety>>} */
  const out = {};
  for (const topic of topics) {
    const stems = [];
    for (const q of SCIENCE_QUESTIONS) {
      if (!q.grades?.includes(gradeKey)) continue;
      if (q.topic !== topic) continue;
      stems.push(String(q.stem || ""));
    }
    out[topic] = analyzeStemVariety(stems);
  }
  return out;
}

function buildOwnerCatalogAppendix() {
  const byGrade = [];
  let lowCt = 0;
  let mediumCt = 0;
  for (let g = 1; g <= 6; g++) {
    const slot = SCIENCE_OFFICIAL_SUBSECTION_CATALOG[`grade_${g}`];
    const sections = slot?.sections || [];
    for (const s of sections) {
      if (s.confidence === "low") lowCt++;
      else if (s.confidence === "medium") mediumCt++;
    }
    byGrade.push({
      grade: g,
      sourceDoc: slot?.sourceDoc || "",
      sourcePortalUrl: slot?.sourcePortalUrl || "",
      sectionKeys: sections.map((s) => s.sectionKey),
    });
  }
  return {
    purpose:
      "Cross-check subsection labels against owner DOCX תוכנית משרד החינוך/science Curriculum2016.docx before claiming full Ministry alignment.",
    byGrade,
    counts: { catalogSectionsLowConfidence: lowCt, catalogSectionsMediumConfidence: mediumCt },
  };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const inv = loadInventoryRecords();
  const invAgg = aggregateInventoryScience(inv.records);
  const runtimeThin = summarizeScienceRuntimeThinForClosure(SCIENCE_QUESTIONS);

  let runtimeVsPayload = null;
  try {
    runtimeVsPayload = buildScienceRuntimeVsOfficialSummary(inv.records);
  } catch (e) {
    runtimeVsPayload = {
      summary: { rowsNeedingManualReview: -1 },
      error: String(e?.message || e),
    };
  }

  /** @type {object[]} */
  const gradeTopicRows = [];
  for (const gk of SCIENCE_GRADE_ORDER) {
    const g = Number(gk.replace("g", ""));
    const topics = (SCIENCE_GRADES[gk]?.topics || []).filter((t) => t !== "mixed");
    for (const topic of topics) {
      const nk = SCIENCE_TOPIC_TO_REP_NORM[topic];
      const hit = nk ? findTopicPlacement("science", g, nk) : null;
      gradeTopicRows.push({
        gradeKey: gk,
        grade: g,
        uiTopic: topic,
        representativeNormalizedKey: nk || null,
        curriculumPlacement: hit ? bucketLabel(hit.bucket) : "unmapped",
        curriculumLabelHe: hit?.def?.labelHe || "",
      });
    }
  }

  /** @type {Record<string, Record<string, ReturnType<typeof analyzeStemVariety>>>} */
  const stemVarietyByGradeTopic = {};
  for (const gk of SCIENCE_GRADE_ORDER) {
    stemVarietyByGradeTopic[gk] = stemVarietyByGradeAndTopic(gk);
  }

  const rgPath = join(OUT_DIR, "science-runtime-gate-export.json");
  let runtimeGateSummary = null;
  try {
    if (existsSync(rgPath)) {
      runtimeGateSummary = JSON.parse(readFileSync(rgPath, "utf8"))?.summary ?? null;
    }
  } catch {
    runtimeGateSummary = null;
  }

  const rvTotal = Number(runtimeVsPayload?.summary?.rowsTotal ?? 0);
  const rvBad = Number(runtimeVsPayload?.summary?.rowsNeedingManualReview ?? -1);
  const rvRatio = rvTotal > 0 ? rvBad / rvTotal : 0;
  const runtimeVsOk =
    runtimeVsPayload?.summary &&
    rvBad >= 0 &&
    (rvTotal === 0 || rvBad === 0 || rvBad <= Math.max(8, Math.ceil(rvTotal * 0.12)));

  const inventoryPresent = !!inv.path && inv.records.length > 0;
  const inventoryCriticalOk = invAgg.missingCriticalMetadataRows === 0;
  const poolGateOk = existsSync(rgPath) && runtimeGateSummary?.gatePassed === true;

  const ownerSignedOff = process.env.SCIENCE_OWNER_CLOSURE_SIGNOFF === "1";

  const remainingBlockers = [];
  if (!inventoryCriticalOk)
    remainingBlockers.push(`${invAgg.missingCriticalMetadataRows} Science inventory rows with missingCritical metadata.`);
  if (!runtimeVsOk)
    remainingBlockers.push(
      `Runtime/inventory vs curriculum map: ${rvBad}/${rvTotal} rows need review (see science-runtime-vs-official-source).`
    );
  if (!poolGateOk)
    remainingBlockers.push(
      existsSync(rgPath)
        ? "Science question × grade gate failed — see science-runtime-gate-export.json."
        : "Missing science-runtime-gate-export.json — run npm run qa:science:runtime-gate before final closure."
    );
  if (runtimeThin.blockingThinRuntimeCount > 0) {
    remainingBlockers.push(
      `Science runtime thin buckets (visible UI × topic × level, count < 3): ${runtimeThin.blockingThinRuntimeCount} blocking — see runtimeCoverage.blockingThinRuntimeBuckets.`
    );
  }

  const automatedInfrastructureClosed = inventoryCriticalOk && runtimeVsOk && poolGateOk;

  const scienceClosedForAutomatedDevelopmentStage =
    automatedInfrastructureClosed &&
    remainingBlockers.length === 0 &&
    runtimeThin.blockingThinRuntimeCount === 0;

  const payload = {
    generatedAt: new Date().toISOString(),
    phase: "science-final-closure",
    meta: {
      ownerSignoffEnv:
        "Set SCIENCE_OWNER_CLOSURE_SIGNOFF=1 only after owner cross-checks POP + science Curriculum2016.docx.",
      ownerCatalogVerificationSignedOff: ownerSignedOff,
      inventoryPath: inv.path,
      primaryOwnerDoc: "תוכנית משרד החינוך/science Curriculum2016.docx",
      notes: [
        "Closure uses conservative israeli-primary-curriculum-map Science strands — not an automated DOCX parse.",
        "Stem variety is computed from SCIENCE_QUESTIONS rows eligible per grade/topic — advisory only.",
      ],
    },
    registrySummary: summarizeScienceRegistry(scienceRegistryRows()),
    ownerVerificationAppendix: buildOwnerCatalogAppendix(),
    inventory: {
      present: inventoryPresent,
      ...invAgg,
    },
    runtimeVsOfficialSummary: runtimeVsPayload?.summary ?? null,
    runtimeVsOfficialRowsNeedingReview: rvBad,
    gradeTopicAlignment: gradeTopicRows,
    stemVarietyByGradeTopic,
    runtimeGateSummary,
    runtimeCoverage: {
      policyNote:
        "Thin = runtime pool count in (0,3) per curriculum topic × grade × UI level (science-master levelAllowed). Grade 1–2 medium/hard may be advisory (stretch band).",
      thinRuntimeBucketCount: runtimeThin.thinRuntimeBuckets.length,
      blockingThinRuntimeCount: runtimeThin.blockingThinRuntimeCount,
      advisoryThinRuntimeCount: runtimeThin.advisoryThinRuntimeCount,
      thinRuntimeBuckets: runtimeThin.thinRuntimeBuckets,
      blockingThinRuntimeBuckets: runtimeThin.blockingThinRuntimeBuckets,
    },
    summary: {
      thinInventoryBucketCount: invAgg.thinInventoryBucketCount,
      duplicateStemHashCount: invAgg.duplicateStemHashCount,
      runtimeVsMismatchRatio: rvTotal ? Math.round(rvRatio * 1000) / 1000 : 0,
      blockingThinRuntimeCount: runtimeThin.blockingThinRuntimeCount,
    },
    closureQuestions: {
      inventoryCriticalMetadataGatePassed: inventoryCriticalOk,
      runtimeVsOfficialCatalogGatePassed: runtimeVsOk,
      scienceQuestionRuntimeGatePassed: poolGateOk,
      runtimeThinBucketsGatePassed: runtimeThin.blockingThinRuntimeCount === 0,
      automatedInfrastructureClosed,
      scienceClosedForAutomatedDevelopmentStage,
      fullOwnerMoEClosed: ownerSignedOff && scienceClosedForAutomatedDevelopmentStage,
      remainingAutomatedBlockers: remainingBlockers.filter(Boolean),
    },
  };

  await writeFile(join(OUT_DIR, "science-final-closure.json"), JSON.stringify(payload, null, 2), "utf8");

  const md = [];
  md.push("# Science — final closure report");
  md.push("");
  md.push(`Generated: ${payload.generatedAt}`);
  md.push("");
  md.push("## Verdict");
  md.push(`- **Science closed for automated development stage:** ${scienceClosedForAutomatedDevelopmentStage ? "yes" : "no"}`);
  md.push(`- **Full owner / Ministry signoff claimed:** ${payload.closureQuestions.fullOwnerMoEClosed ? "yes" : "no"}`);
  md.push("");
  md.push("## Registry (Science sources)");
  md.push("```json");
  md.push(JSON.stringify(payload.registrySummary, null, 2));
  md.push("```");
  md.push("");
  md.push("## Inventory summary");
  md.push(`- Rows: ${payload.inventory.scienceRowCount}`);
  md.push(`- Missing critical metadata: ${payload.inventory.missingCriticalMetadataRows}`);
  md.push(`- Thin inventory buckets (<3 scanner rows per grade/topic/difficulty): ${payload.inventory.thinInventoryBucketCount}`);
  md.push(`- **Blocking runtime thin buckets (<3 effective pool items):** ${runtimeThin.blockingThinRuntimeCount}`);
  md.push("");
  md.push("## Runtime vs curriculum map");
  md.push(`- Rows needing review: ${rvBad} / ${rvTotal}`);
  md.push("");
  md.push("## Grade × UI topic alignment");
  md.push("| Grade | Topic | Placement | Normalized key |");
  md.push("|------|-------|-----------|----------------|");
  for (const r of gradeTopicRows) {
    md.push(`| ${r.gradeKey} | ${r.uiTopic} | ${r.curriculumPlacement} | ${r.representativeNormalizedKey || "—"} |`);
  }
  md.push("");
  md.push("## Blockers");
  if (!remainingBlockers.length) md.push("- None recorded by automated closure.");
  else for (const b of remainingBlockers) md.push(`- ${b}`);
  md.push("");

  await writeFile(join(OUT_DIR, "science-final-closure.md"), md.join("\n"), "utf8");
  console.log("Wrote science-final-closure.{json,md}");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
