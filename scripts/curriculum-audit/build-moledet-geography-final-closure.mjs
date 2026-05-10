/**
 * Moledet/Geography final closure — inventory, registry, runtime gate, thin buckets, stem variety.
 * Writes reports/curriculum-audit/moledet-geography-final-closure.{json,md}
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

const { MOLEDET_GEOGRAPHY_GRADES, MOLEDET_GEOGRAPHY_GRADE_ORDER } = await import(modUrl("data/moledet-geography-curriculum.js"));
const { MOLEDET_GEO_TOPIC_TO_NORM } = await import(modUrl("utils/moledet-geography-grade-topic-policy.js"));
const { findTopicPlacement } = await import(modUrl("utils/curriculum-audit/israeli-primary-curriculum-map.js"));
const {
  moledetGeographyRegistryRows,
  summarizeMoledetGeographyRegistry,
  buildMoledetGeographyRuntimeVsOfficialSummary,
} = await import(pathToFileURL(join(ROOT, "scripts/curriculum-audit/lib/moledet-geography-catalog-source-compare.mjs")).href);
const { summarizeMoledetGeoRuntimeThinForClosure } = await import(modUrl("utils/moledet-geography-runtime-coverage.js"));
const GEO = await import(modUrl("data/geography-questions/index.js"));

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

function aggregateInventoryGeography(records) {
  const geo = records.filter((r) => r.subject === "moledet-geography" || r.subject === "geography");
  /** @type {Map<string, number>} */
  const byGradeTopicDiff = new Map();
  /** @type {Map<string, number>} */
  const stemDupHits = new Map();
  let missingCritical = 0;

  for (const r of geo) {
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
    geographyRowCount: geo.length,
    missingCriticalMetadataRows: missingCritical,
    countsByGradeTopicDifficulty: Object.fromEntries([...byGradeTopicDiff.entries()].slice(0, 500)),
    countsTruncated: byGradeTopicDiff.size > 500,
    duplicateStemHashCount: duplicateStemHashes,
    thinInventoryBuckets: thinBuckets.slice(0, 120),
    thinInventoryBucketCount: thinBuckets.length,
  };
}

function poolExportName(gNum, uiLevel) {
  const L = uiLevel === "easy" ? "EASY" : uiLevel === "medium" ? "MEDIUM" : "HARD";
  return `G${gNum}_${L}_QUESTIONS`;
}

function stemVarietyByGradeAndTopic(gradeKey) {
  const gNum = Number(gradeKey.replace("g", ""));
  const topics = (MOLEDET_GEOGRAPHY_GRADES[gradeKey]?.topics || []).filter((t) => t !== "mixed");
  /** @type {Record<string, ReturnType<typeof analyzeStemVariety>>} */
  const out = {};
  for (const topic of topics) {
    const stems = [];
    for (const lvl of ["easy", "medium", "hard"]) {
      const pool = GEO[poolExportName(gNum, lvl)];
      const arr = pool?.[topic];
      if (!Array.isArray(arr)) continue;
      for (const row of arr) {
        stems.push(String(row?.question ?? ""));
      }
    }
    out[topic] = analyzeStemVariety(stems);
  }
  return out;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const inv = loadInventoryRecords();
  const invAgg = aggregateInventoryGeography(inv.records);

  let runtimeVsPayload = null;
  try {
    runtimeVsPayload = buildMoledetGeographyRuntimeVsOfficialSummary(inv.records);
  } catch (e) {
    runtimeVsPayload = {
      summary: { rowsNeedingManualReview: -1 },
      error: String(e?.message || e),
    };
  }

  const runtimeThin = summarizeMoledetGeoRuntimeThinForClosure(GEO);

  /** @type {object[]} */
  const gradeTopicRows = [];
  for (const gk of MOLEDET_GEOGRAPHY_GRADE_ORDER) {
    const g = Number(gk.replace("g", ""));
    const topics = (MOLEDET_GEOGRAPHY_GRADES[gk]?.topics || []).filter((t) => t !== "mixed");
    for (const topic of topics) {
      const nk = MOLEDET_GEO_TOPIC_TO_NORM[topic];
      const hit = nk ? findTopicPlacement("moledet-geography", g, nk) : null;
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
  for (const gk of MOLEDET_GEOGRAPHY_GRADE_ORDER) {
    stemVarietyByGradeTopic[gk] = stemVarietyByGradeAndTopic(gk);
  }

  const rgPath = join(OUT_DIR, "moledet-geography-runtime-gate-export.json");
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
    (rvTotal === 0 || rvBad === 0 || rvBad <= Math.max(12, Math.ceil(rvTotal * 0.15)));

  const inventoryPresent = !!inv.path && inv.records.length > 0;
  const inventoryCriticalOk = invAgg.missingCriticalMetadataRows === 0;
  const poolGateOk = existsSync(rgPath) && runtimeGateSummary?.gatePassed === true;

  const ownerSignedOff = process.env.MOLEDET_GEOGRAPHY_OWNER_CLOSURE_SIGNOFF === "1";

  const regRows = moledetGeographyRegistryRows();
  const registrySummary = summarizeMoledetGeographyRegistry(regRows);

  const remainingBlockers = [];
  if (!inventoryCriticalOk)
    remainingBlockers.push(`${invAgg.missingCriticalMetadataRows} Geography inventory rows with missingCritical metadata.`);
  if (!runtimeVsOk)
    remainingBlockers.push(
      `Runtime/inventory vs curriculum map: ${rvBad}/${rvTotal} rows need review (see moledet-geography-runtime-vs-official-source).`
    );
  if (!poolGateOk)
    remainingBlockers.push(
      existsSync(rgPath)
        ? "Moledet/Geography runtime gate failed — see moledet-geography-runtime-gate-export.json."
        : "Missing moledet-geography-runtime-gate-export.json — run npm run qa:moledet-geography:runtime-gate before final closure."
    );
  if (runtimeThin.blockingThinRuntimeCount > 0) {
    remainingBlockers.push(
      `Moledet/Geography thin runtime buckets (grade × topic × UI level): ${runtimeThin.blockingThinRuntimeCount} blocking — see runtimeCoverage.blockingThinRuntimeBuckets.`
    );
  }

  const automatedInfrastructureClosed = inventoryCriticalOk && runtimeVsOk && poolGateOk;

  const moledetGeographyClosedForAutomatedDevelopmentStage =
    automatedInfrastructureClosed &&
    remainingBlockers.length === 0 &&
    runtimeThin.blockingThinRuntimeCount === 0;

  const payload = {
    generatedAt: new Date().toISOString(),
    phase: "moledet-geography-final-closure",
    meta: {
      ownerSignoffEnv:
        "Set MOLEDET_GEOGRAPHY_OWNER_CLOSURE_SIGNOFF=1 only after owner cross-checks POP + owner PDFs under תוכנית משרד החינוך/.",
      ownerCatalogVerificationSignedOff: ownerSignedOff,
      inventoryPath: inv.path,
      primaryOwnerPdfs: [
        "תוכנית משרד החינוך/homeland-curriculum.pdf",
        "תוכנית משרד החינוך/tochnit-vav.pdf",
        "תוכנית משרד החינוך/tohnit-geography-5-6.pdf",
      ],
      notes: [
        "Curriculum map confidence for moledet-geography remains advisory (moledet.bank.*).",
        "Stem variety is computed from static geography bank pools per grade/topic.",
      ],
    },
    registrySummary,
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
        "Thin = bank pool count < 3 per curriculum topic × grade × UI level (static pools). Empty pools are blocked by the runtime gate first.",
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
      moledetGeographyRuntimeGatePassed: poolGateOk,
      runtimeThinBucketsGatePassed: runtimeThin.blockingThinRuntimeCount === 0,
      automatedInfrastructureClosed,
      moledetGeographyClosedForAutomatedDevelopmentStage,
      fullOwnerMoEClosed: ownerSignedOff && moledetGeographyClosedForAutomatedDevelopmentStage,
      remainingAutomatedBlockers: remainingBlockers.filter(Boolean),
    },
  };

  await writeFile(join(OUT_DIR, "moledet-geography-final-closure.json"), JSON.stringify(payload, null, 2), "utf8");

  const md = [];
  md.push("# Moledet / Geography — final closure report");
  md.push("");
  md.push(`Generated: ${payload.generatedAt}`);
  md.push("");
  md.push("## Verdict");
  md.push(
    `- **Moledet/Geography closed for automated development stage:** ${moledetGeographyClosedForAutomatedDevelopmentStage ? "yes" : "no"}`
  );
  md.push(`- **Full owner / Ministry signoff claimed:** ${payload.closureQuestions.fullOwnerMoEClosed ? "yes" : "no"}`);
  md.push("");
  md.push("## Registry (Moledet/Geography sources)");
  md.push("```json");
  md.push(JSON.stringify(payload.registrySummary, null, 2));
  md.push("```");
  md.push("");
  md.push("## Inventory summary");
  md.push(`- Rows: ${payload.inventory.geographyRowCount}`);
  md.push(`- Missing critical metadata: ${payload.inventory.missingCriticalMetadataRows}`);
  md.push(`- Thin inventory buckets (<3 scanner rows): ${payload.inventory.thinInventoryBucketCount}`);
  md.push(`- **Blocking runtime thin buckets:** ${runtimeThin.blockingThinRuntimeCount}`);
  md.push("");
  md.push("## Runtime vs curriculum map");
  md.push(`- Rows needing review: ${rvBad} / ${rvTotal}`);
  md.push("");
  md.push("## Blockers");
  if (!remainingBlockers.length) md.push("- None recorded by automated closure.");
  else for (const b of remainingBlockers) md.push(`- ${b}`);
  md.push("");

  await writeFile(join(OUT_DIR, "moledet-geography-final-closure.md"), md.join("\n"), "utf8");
  console.log("Wrote moledet-geography-final-closure.{json,md}");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
