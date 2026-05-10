/**
 * English final closure — inventory, curriculum placement, pool gate, runtime vs official.
 * Writes reports/curriculum-audit/english-final-closure.{json,md}
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

const { ENGLISH_GRADES, ENGLISH_GRADE_ORDER } = await import(modUrl("data/english-curriculum.js"));
const { ENGLISH_TOPIC_TO_REP_NORM } = await import(modUrl("utils/english-grade-topic-policy.js"));
const { findTopicPlacement } = await import(modUrl("utils/curriculum-audit/israeli-primary-curriculum-map.js"));
const {
  buildEnglishRuntimeVsOfficialSummary,
  summarizeEnglishRegistry,
  englishRegistryRows,
} = await import(pathToFileURL(join(ROOT, "scripts/curriculum-audit/lib/english-catalog-source-compare.mjs")).href);
const { ENGLISH_OFFICIAL_SUBSECTION_CATALOG } = await import(modUrl("utils/curriculum-audit/english-official-subsection-catalog.js"));
const { GRAMMAR_POOLS, TRANSLATION_POOLS, SENTENCE_POOLS } = await import(modUrl("data/english-questions/index.js"));
const {
  englishPoolItemAllowedWithClassSplit,
} = await import(modUrl("utils/grade-gating.js"));

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

function stemForPoolItem(category, item) {
  if (category === "grammar") return String(item?.question || "");
  if (category === "translation") return String(item?.en || item?.question || "");
  return String(item?.template || item?.question || "");
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

function aggregateInventoryEnglish(records) {
  const en = records.filter((r) => r.subject === "english");
  /** @type {Map<string, number>} */
  const byGradeTopicDiff = new Map();
  /** @type {Map<string, number>} */
  const stemDupHits = new Map();
  let missingCritical = 0;

  for (const r of en) {
    if (r.metadataCompleteness?.missingCritical) missingCritical++;
    const gmin = r.gradeMin ?? r.grade;
    const gmax = r.gradeMax ?? r.grade;
    const diff = r.difficulty || "unknown";
    const topic = r.topic || "unknown";
    if (!Number.isFinite(gmin) || !Number.isFinite(gmax)) continue;
    for (let g = gmin; g <= gmax; g++) {
      const k = `g${g}|${topic}|${diff}`;
      byGradeTopicDiff.set(k, (byGradeTopicDiff.get(k) || 0) + 1);
    }
    if (r.stemHash) {
      stemDupHits.set(r.stemHash, (stemDupHits.get(r.stemHash) || 0) + 1);
    }
  }

  const duplicateStemHashes = [...stemDupHits.entries()].filter(([, c]) => c > 1).length;
  const thinBuckets = [...byGradeTopicDiff.entries()].filter(([, c]) => c < 3);

  return {
    englishRowCount: en.length,
    missingCriticalMetadataRows: missingCritical,
    countsByGradeTopicDifficulty: Object.fromEntries([...byGradeTopicDiff.entries()].slice(0, 500)),
    countsTruncated: byGradeTopicDiff.size > 500,
    duplicateStemHashCount: duplicateStemHashes,
    thinInventoryBuckets: thinBuckets.slice(0, 100),
    thinInventoryBucketCount: thinBuckets.length,
  };
}

function samplePoolVarietyForGrade(gradeKey) {
  /** @type {Record<string, ReturnType<typeof analyzeStemVariety>>} */
  const out = {};
  const poolsByCat = {
    grammar: GRAMMAR_POOLS,
    translation: TRANSLATION_POOLS,
    sentence: SENTENCE_POOLS,
  };
  for (const category of ["grammar", "translation", "sentence"]) {
    const pools = poolsByCat[category];
    /** @type {string[]} */
    const stems = [];
    for (const [poolKey, items] of Object.entries(pools)) {
      if (!Array.isArray(items)) continue;
      for (const item of items) {
        if (englishPoolItemAllowedWithClassSplit(category, poolKey, item, gradeKey)) {
          stems.push(stemForPoolItem(category, item));
        }
      }
    }
    out[category] = analyzeStemVariety(stems);
  }
  return out;
}

function buildOwnerCatalogAppendix() {
  const byGrade = [];
  let lowCt = 0;
  let mediumCt = 0;
  for (let g = 1; g <= 6; g++) {
    const slot = ENGLISH_OFFICIAL_SUBSECTION_CATALOG[`grade_${g}`];
    const sections = slot?.sections || [];
    for (const s of sections) {
      if (s.confidence === "low") lowCt++;
      else if (s.confidence === "medium") mediumCt++;
    }
    byGrade.push({
      grade: g,
      sourcePdf: slot?.sourcePdf || "",
      sourcePortalUrl: slot?.sourcePortalUrl || "",
      sectionKeys: sections.map((s) => s.sectionKey),
    });
  }
  return {
    purpose:
      "Cross-check subsection labels against owner PDF תוכנית משרד החינוך/english Curriculum2020.pdf before claiming full Ministry alignment.",
    byGrade,
    counts: { catalogSectionsLowConfidence: lowCt, catalogSectionsMediumConfidence: mediumCt },
  };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const inv = loadInventoryRecords();
  const invAgg = aggregateInventoryEnglish(inv.records);

  let runtimeVsPayload = null;
  try {
    runtimeVsPayload = buildEnglishRuntimeVsOfficialSummary(inv.records);
  } catch (e) {
    runtimeVsPayload = {
      summary: { rowsNeedingManualReview: -1 },
      error: String(e?.message || e),
    };
  }

  /** @type {object[]} */
  const gradeTopicRows = [];
  for (const gk of ENGLISH_GRADE_ORDER) {
    const g = Number(gk.replace("g", ""));
    const topics = (ENGLISH_GRADES[gk]?.topics || []).filter((t) => t !== "mixed");
    for (const topic of topics) {
      const nk = ENGLISH_TOPIC_TO_REP_NORM[topic];
      const hit = nk ? findTopicPlacement("english", g, nk) : null;
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

  /** @type {Record<string, ReturnType<typeof samplePoolVarietyForGrade>>} */
  const poolStemVarietyByGrade = {};
  for (const gk of ENGLISH_GRADE_ORDER) {
    poolStemVarietyByGrade[gk] = samplePoolVarietyForGrade(gk);
  }

  let runtimeGateSummary = null;
  const rgPath = join(OUT_DIR, "english-runtime-gate-export.json");
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
  const poolGateOk =
    existsSync(rgPath) && runtimeGateSummary?.gatePassed === true;

  const ownerSignedOff = process.env.ENGLISH_OWNER_CLOSURE_SIGNOFF === "1";

  const automatedInfrastructureClosed = inventoryCriticalOk && runtimeVsOk && poolGateOk;

  const remainingBlockers = [];
  if (!inventoryCriticalOk)
    remainingBlockers.push(`${invAgg.missingCriticalMetadataRows} English inventory rows with missingCritical metadata.`);
  if (!runtimeVsOk)
    remainingBlockers.push(
      `Runtime/inventory vs curriculum map: ${rvBad}/${rvTotal} rows need review (see english-runtime-vs-official-source).`
    );
  if (!poolGateOk)
    remainingBlockers.push(
      existsSync(rgPath)
        ? "English pool × grade gate failed — see english-runtime-gate-export.json."
        : "Missing english-runtime-gate-export.json — run npm run qa:english:runtime-gate before final closure."
    );

  const englishClosedForAutomatedDevelopmentStage =
    automatedInfrastructureClosed && remainingBlockers.length === 0;

  const payload = {
    generatedAt: new Date().toISOString(),
    phase: "english-final-closure",
    meta: {
      ownerSignoffEnv:
        "Set ENGLISH_OWNER_CLOSURE_SIGNOFF=1 only after owner cross-checks POP + Curriculum2020.pdf strands.",
      ownerCatalogVerificationSignedOff: ownerSignedOff,
      inventoryPath: inv.path,
      primaryOwnerPdf: "תוכנית משרד החינוך/english Curriculum2020.pdf",
      notes: [
        "Closure uses conservative israeli-primary-curriculum-map English strands — not a full PDF transcription.",
        "Pool stem variety aggregates all stems eligible per grade after grade-gating — advisory only.",
      ],
    },
    registrySummary: summarizeEnglishRegistry(englishRegistryRows()),
    ownerVerificationAppendix: buildOwnerCatalogAppendix(),
    inventory: {
      present: inventoryPresent,
      ...invAgg,
    },
    runtimeVsOfficialSummary: runtimeVsPayload?.summary ?? null,
    runtimeVsOfficialRowsNeedingReview: rvBad,
    gradeTopicAlignment: gradeTopicRows,
    poolStemVarietyByGrade,
    runtimeGateSummary,
    summary: {
      thinInventoryBucketCount: invAgg.thinInventoryBucketCount,
      duplicateStemHashCount: invAgg.duplicateStemHashCount,
    },
    closureQuestions: {
      inventoryCriticalMetadataGatePassed: inventoryCriticalOk,
      runtimeVsOfficialCatalogGatePassed: runtimeVsOk,
      englishPoolRuntimeGatePassed: poolGateOk,
      automatedInfrastructureClosed,
      englishClosedForAutomatedDevelopmentStage,
      fullOwnerMoEClosed: ownerSignedOff && englishClosedForAutomatedDevelopmentStage,
      remainingAutomatedBlockers: remainingBlockers.filter(Boolean),
    },
  };

  await writeFile(join(OUT_DIR, "english-final-closure.json"), JSON.stringify(payload, null, 2), "utf8");

  const md = [];
  md.push("# English — final closure report");
  md.push("");
  md.push(`Generated: ${payload.generatedAt}`);
  md.push("");
  md.push("## Verdict");
  md.push(`- **English closed for automated development stage:** ${englishClosedForAutomatedDevelopmentStage ? "yes" : "no"}`);
  md.push(`- **Full owner / Ministry signoff claimed:** ${payload.closureQuestions.fullOwnerMoEClosed ? "yes" : "no"} (requires env + automated gates)`);
  md.push("");
  md.push("## Registry (English sources)");
  md.push("```json");
  md.push(JSON.stringify(payload.registrySummary, null, 2));
  md.push("```");
  md.push("");
  md.push("## Inventory summary");
  md.push(`- Rows: ${payload.inventory.englishRowCount}`);
  md.push(`- Missing critical metadata: ${payload.inventory.missingCriticalMetadataRows}`);
  md.push(`- Thin buckets (<3 rows): ${payload.inventory.thinInventoryBucketCount}`);
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

  await writeFile(join(OUT_DIR, "english-final-closure.md"), md.join("\n"), "utf8");
  console.log("Wrote english-final-closure.{json,md}");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
