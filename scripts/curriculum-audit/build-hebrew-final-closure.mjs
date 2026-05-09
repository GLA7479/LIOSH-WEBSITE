/**
 * Hebrew Final Closure — coverage, curriculum placement, variety, text complexity.
 * Writes reports/curriculum-audit/hebrew-final-closure.{json,md}
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

const { HEBREW_OFFICIAL_SUBSECTION_CATALOG } = await import(modUrl("utils/curriculum-audit/hebrew-official-subsection-catalog.js"));
const {
  HEBREW_TOPIC_TO_NORM,
  buildHebrewRuntimeVsOfficialSummary,
} = await import(pathToFileURL(join(ROOT, "scripts/curriculum-audit/lib/hebrew-catalog-source-compare.mjs")).href);
const { normalizeInventoryTopic } = await import(modUrl("utils/curriculum-audit/curriculum-topic-normalizer.js"));

const { GRADES } = await import(modUrl("utils/hebrew-constants.js"));
const { getLevelForGrade } = await import(modUrl("utils/hebrew-storage.js"));
const { generateQuestion } = await import(modUrl("utils/hebrew-question-generator.js"));
const { findTopicPlacement } = await import(modUrl("utils/curriculum-audit/israeli-primary-curriculum-map.js"));

const LEVELS = ["easy", "medium", "hard"];
const SAMPLES_PER_CELL = 36;
const STEM_VARIETY_WEAK_THRESHOLD = 0.12;
const OPS_EXPECT_RICH_KIND_MIX = new Set(["mixed"]);
const RICH_KIND_WEAK_BELOW = 4;
const STEM_COLLAPSE_EXEMPT_TOPICS = new Set(["reading", "vocabulary"]);

/** Advisory: upper grades comprehension stems shorter than this median may be "shallow". */
const SHALLOW_COMP_MEDIAN_CHARS = { g3: 45, g4: 55, g5: 60, g6: 65 };

let rngState = 0x484252 >>> 0;
function runWithHebrewAuditSeed(seed, fn) {
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
  const nk = HEBREW_TOPIC_TO_NORM[topic] || `hebrew.${topic}`;
  const hit = findTopicPlacement("hebrew", gradeNum, nk);
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

function median(nums) {
  if (!nums.length) return 0;
  const a = [...nums].sort((x, y) => x - y);
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
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

function aggregateInventoryHebrew(records) {
  const he = records.filter((r) => r.subject === "hebrew");
  /** @type {Map<string, number>} */
  const byGradeTopicDiff = new Map();
  /** @type {Map<string, number>} */
  const stemDupHits = new Map();
  let missingCritical = 0;

  for (const r of he) {
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

  const skillCounts = {};
  for (const r of he) {
    const n = normalizeInventoryTopic({
      subject: "hebrew",
      topic: r.topic,
      subtopic: r.subtopic || "",
    });
    const key = n.normalizedTopicKey;
    skillCounts[key] = (skillCounts[key] || 0) + 1;
  }

  return {
    hebrewRowCount: he.length,
    missingCriticalMetadataRows: missingCritical,
    countsByGradeTopicDifficulty: Object.fromEntries([...byGradeTopicDiff.entries()].slice(0, 400)),
    countsByGradeTopicDifficultyTruncated: byGradeTopicDiff.size > 400,
    normalizedSkillHistogram: skillCounts,
    duplicateStemHashCount: duplicateStemHashes,
    thinInventoryBuckets: thinBuckets.slice(0, 80),
    thinInventoryBucketCount: thinBuckets.length,
  };
}

function buildOwnerCatalogAppendix() {
  const byGrade = [];
  let lowCt = 0;
  let mediumCt = 0;
  for (let g = 1; g <= 6; g++) {
    const slot = HEBREW_OFFICIAL_SUBSECTION_CATALOG[`grade_${g}`];
    const sections = slot?.sections || [];
    for (const s of sections) {
      if (s.confidence === "low") lowCt++;
      else if (s.confidence === "medium") mediumCt++;
    }
    byGrade.push({
      grade: g,
      sourcePortalUrl: slot?.sourcePortalUrl || "",
      sections: sections.map((s) => ({
        sectionKey: s.sectionKey,
        labelHe: s.labelHe,
        catalogConfidence: s.confidence,
        mapsToNormalizedKeys: s.mapsToNormalizedKeys || [],
      })),
    });
  }
  return {
    purpose:
      "קטלוג מיומנויות פנימי מול מסגרת POP — ללא PDF כיתתי מלא כמו במתמטיקה; רמות ביטחון נמוכות/בינוניות דורשות אימות בעלים.",
    byGrade,
    counts: {
      catalogSectionsLowConfidence: lowCt,
      catalogSectionsMediumConfidence: mediumCt,
    },
  };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const inv = loadInventoryRecords();
  const invAgg = aggregateInventoryHebrew(inv.records);

  let runtimeVsPayload = null;
  try {
    runtimeVsPayload = buildHebrewRuntimeVsOfficialSummary(inv.records);
  } catch (e) {
    runtimeVsPayload = { summary: { rowsNeedingManualReview: -1 }, error: String(e?.message || e) };
  }

  /** @type {object[]} */
  const gradeReports = [];
  /** @type {string[]} */
  const thinBranches = [];
  /** @type {string[]} */
  const weakVariety = [];
  /** @type {string[]} */
  const shallowComprehension = [];
  /** @type {object[]} */
  const textComplexityByGrade = [];

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
          warning: "Mapped strand marked notExpectedYet for this grade in conservative map.",
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
        const lens = [];
        for (let i = 0; i < SAMPLES_PER_CELL; i++) {
          const seed =
            0x686272 +
            g * 9973 +
            topic.split("").reduce((a, c) => a + c.charCodeAt(0), 0) * 131 +
            (lev === "easy" ? 11 : lev === "medium" ? 17 : 29) * 104729 +
            i * 65521;
          const q = runWithHebrewAuditSeed(seed, () => generateQuestion(lc, topic, gk, null));
          const stem = q?.question ?? q?.exerciseText ?? "";
          stems.push(stem);
          kinds.push(q?.params?.kind ?? "");
          topicsOut.push(q?.topic ?? topic);
          lens.push(String(stem).length);
        }

        const variety = analyzeVariety(stems, kinds, topic);
        const metaMismatch = topicsOut.filter((t) => t && t !== topic).length;
        topicStats.byDifficulty[lev] = {
          samples: SAMPLES_PER_CELL,
          variety,
          kindsObserved: [...new Set(kinds)].slice(0, 36),
          topicMismatchCount: metaMismatch,
          medianStemChars: Math.round(median(lens)),
        };

        if (variety.weakKindVariety) {
          weakVariety.push(`${gk}/${topic}/${lev} kinds=${variety.uniqueKinds}`);
        }
        if (variety.weakStemPatternCollapse && !STEM_COLLAPSE_EXEMPT_TOPICS.has(topic)) {
          thinBranches.push(`${gk}/${topic}/${lev} stemPatternRatio=${variety.stemPatternRatio}`);
        }

        if (topic === "comprehension" && g >= 3) {
          const med = median(lens);
          const thr = SHALLOW_COMP_MEDIAN_CHARS[`g${g}`] ?? 50;
          if (med < thr) {
            shallowComprehension.push(`${gk}/${lev} medianChars=${med} (advisory<thr ${thr})`);
          }
        }
      }

      row.topics[topic] = topicStats;
    }

    textComplexityByGrade.push({
      grade: g,
      gradeKey: gk,
      comprehensionMedianCharsByDifficulty: {
        easy: row.topics.comprehension?.byDifficulty?.easy?.medianStemChars ?? null,
        medium: row.topics.comprehension?.byDifficulty?.medium?.medianStemChars ?? null,
        hard: row.topics.comprehension?.byDifficulty?.hard?.medianStemChars ?? null,
      },
    });

    gradeReports.push(row);
  }

  const ownerAppendix = buildOwnerCatalogAppendix();
  const ownerSignedOff = process.env.HEBREW_OWNER_CLOSURE_SIGNOFF === "1";

  const internalGapDocumented = true;
  const rvTotal = Number(runtimeVsPayload?.summary?.rowsTotal ?? 0);
  const rvBad = Number(runtimeVsPayload?.summary?.rowsNeedingManualReview ?? -1);
  const rvRatio = rvTotal > 0 ? rvBad / rvTotal : 0;
  const runtimeVsOk =
    runtimeVsPayload?.summary &&
    rvBad >= 0 &&
    (rvTotal === 0 || rvBad === 0 || rvBad <= 3 || rvRatio <= 0.05);

  const inventoryPresent = !!inv.path && inv.records.length > 0;
  const inventoryCriticalOk = invAgg.missingCriticalMetadataRows === 0;

  const payload = {
    generatedAt: new Date().toISOString(),
    phase: "hebrew-final-closure",
    meta: {
      samplesPerTopicDifficulty: SAMPLES_PER_CELL,
      richKindMixExpectedTopics: [...OPS_EXPECT_RICH_KIND_MIX],
      richKindWeakBelow: RICH_KIND_WEAK_BELOW,
      stemPatternWeakRatio: STEM_VARIETY_WEAK_THRESHOLD,
      stemNormalization: "digits→#, whitespace collapsed",
      ownerCatalogVerificationSignedOff: ownerSignedOff,
      ownerSignoffEnv:
        "Set HEBREW_OWNER_CLOSURE_SIGNOFF=1 only after POP / מיידע cross-check for Hebrew strands per grade (owner).",
      inventoryPath: inv.path,
      notes: [
        "mixed topic excluded from per-topic sampling — same pattern as geometry closure.",
        "Hebrew has no kita PDF extraction in this repo — PDF alignment is manual/advisory.",
      ],
    },
    ownerVerificationAppendix: ownerAppendix,
    inventory: {
      present: inventoryPresent,
      ...invAgg,
    },
    runtimeVsOfficialSummary: runtimeVsPayload?.summary ?? null,
    textComplexityByGrade,
    shallowComprehensionAdvisory: shallowComprehension,
    summary: {
      grades: gradeReports.length,
      thinBranchWarnings: thinBranches.length,
      weakVarietyFlags: weakVariety.length,
      shallowComprehensionAdvisoryCount: shallowComprehension.length,
    },
    thinBranches,
    weakVarietyBranches: weakVariety,
    grades: gradeReports,
    closureQuestions: {
      automatedVarietyGatePassed: thinBranches.length === 0 && weakVariety.length === 0,
      inventoryPresentGatePassed: inventoryPresent,
      inventoryCriticalMetadataGatePassed: !inventoryPresent || inventoryCriticalOk,
      officialInternalGapDocumentedGatePassed: internalGapDocumented,
      runtimeVsOfficialCatalogGatePassed: runtimeVsOk,
      ownerCatalogSignoffGatePassed: ownerSignedOff,
      runtimeVsOfficialMismatchRatio: rvTotal ? Math.round(rvRatio * 1000) / 1000 : 0,
      isHebrewClosedForAutomatedDevelopmentStage:
        thinBranches.length === 0 &&
        weakVariety.length === 0 &&
        (!inventoryPresent || inventoryCriticalOk) &&
        runtimeVsOk,
      isHebrewFullyClosedIncludingOwnerSignoff:
        thinBranches.length === 0 &&
        weakVariety.length === 0 &&
        (!inventoryPresent || inventoryCriticalOk) &&
        runtimeVsOk &&
        ownerSignedOff,
      remainingAutomatedBlockers: [
        thinBranches.length || weakVariety.length
          ? "Variety / thin-branch warnings in automated sampling — see thinBranches / weakVarietyBranches."
          : null,
        !inventoryPresent ? "Missing question-inventory.json — run npm run audit:curriculum:inventory." : null,
        inventoryPresent && !inventoryCriticalOk
          ? `${invAgg.missingCriticalMetadataRows} Hebrew inventory rows with missingCritical metadata.`
          : null,
        !runtimeVsOk
          ? `Runtime/inventory vs catalog alignment weak (${rvBad}/${rvTotal} rows need review) — see hebrew-runtime-vs-official-source.`
          : null,
      ].filter(Boolean),
      remainingOwnerBlockers: [!ownerSignedOff ? "Owner POP/meyda strand verification — set HEBREW_OWNER_CLOSURE_SIGNOFF=1 after manual cross-check." : null].filter(
        Boolean
      ),
    },
  };

  const md = renderMarkdown(payload);
  await writeFile(join(OUT_DIR, "hebrew-final-closure.json"), JSON.stringify(payload, null, 2), "utf8");
  await writeFile(join(OUT_DIR, "hebrew-final-closure.md"), md, "utf8");
  console.log(`Wrote ${join(OUT_DIR, "hebrew-final-closure.json")}`);
}

function renderMarkdown(p) {
  const lines = [];
  lines.push(`# Hebrew Final Closure Report`);
  lines.push("");
  lines.push(`Generated: ${p.generatedAt}`);
  lines.push("");
  lines.push(`## Summary`);
  lines.push(`- Thin-branch warnings: **${p.summary.thinBranchWarnings}**`);
  lines.push(`- Weak variety flags (mixed topic): **${p.summary.weakVarietyFlags}**`);
  lines.push(`- Shallow comprehension advisories (g3–6): **${p.summary.shallowComprehensionAdvisoryCount}**`);
  lines.push(
    `- Automated variety gate: **${p.closureQuestions.automatedVarietyGatePassed ? "pass" : "fail"}**`
  );
  lines.push(
    `- Inventory present: **${p.closureQuestions.inventoryPresentGatePassed ? "yes" : "no"}**`
  );
  lines.push(
    `- Inventory critical-metadata gate: **${p.closureQuestions.inventoryCriticalMetadataGatePassed ? "pass" : "skip/n/a"}**`
  );
  lines.push(
    `- Runtime vs official catalog gate: **${p.closureQuestions.runtimeVsOfficialCatalogGatePassed ? "pass" : "fail"}**`
  );
  lines.push(
    `- Hebrew closed (automated development stage): **${p.closureQuestions.isHebrewClosedForAutomatedDevelopmentStage ? "yes" : "no"}**`
  );
  lines.push(
    `- Hebrew closed including owner signoff: **${p.closureQuestions.isHebrewFullyClosedIncludingOwnerSignoff ? "yes" : "no"}**`
  );
  if (p.closureQuestions.remainingAutomatedBlockers?.length) {
    lines.push(`### Remaining automated blockers`);
    for (const b of p.closureQuestions.remainingAutomatedBlockers) lines.push(`- ${b}`);
  }
  if (p.closureQuestions.remainingOwnerBlockers?.length) {
    lines.push(`### Owner blockers (full signoff)`);
    for (const b of p.closureQuestions.remainingOwnerBlockers) lines.push(`- ${b}`);
  }
  lines.push("");
  lines.push(`## Inventory (Hebrew)`);
  lines.push(`- Rows: **${p.inventory.hebrewRowCount ?? 0}**`);
  lines.push(`- Missing critical metadata: **${p.inventory.missingCriticalMetadataRows ?? 0}**`);
  lines.push(`- Thin inventory buckets (<3 rows): **${p.inventory.thinInventoryBucketCount ?? 0}**`);
  lines.push(`- Duplicate stem hashes (possible repetition risk): **${p.inventory.duplicateStemHashCount ?? 0}**`);
  lines.push("");
  lines.push(`## Text complexity (comprehension median chars)`);
  for (const t of p.textComplexityByGrade || []) {
    lines.push(`- **G${t.grade}:** easy=${t.comprehensionMedianCharsByDifficulty.easy}, medium=${t.comprehensionMedianCharsByDifficulty.medium}, hard=${t.comprehensionMedianCharsByDifficulty.hard}`);
  }
  lines.push("");
  if (p.shallowComprehensionAdvisory?.length) {
    lines.push(`## Shallow comprehension (advisory)`);
    for (const x of p.shallowComprehensionAdvisory) lines.push(`- ${x}`);
    lines.push("");
  }
  lines.push(`## Grade × topic × difficulty`);
  for (const g of p.grades) {
    lines.push(`#### כיתה ${g.grade} (${g.gradeKey})`);
    lines.push(`**UI topics:** ${g.uiTopics.join(", ")}`);
    for (const [topic, t] of Object.entries(g.topics)) {
      lines.push(`- **${topic}** — placement *${t.curriculum?.placement || "?"}* (${t.curriculum?.normalizedKey || ""})`);
      for (const lev of LEVELS) {
        const b = t.byDifficulty[lev];
        const v = b?.variety;
        lines.push(
          `  - ${lev}: samples=${b?.samples}, uniqueKinds=${v?.uniqueKinds}, stemPatternRatio=${v?.stemPatternRatio}, medianChars=${b?.medianStemChars}, topicMismatch=${b?.topicMismatchCount}`
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
    lines.push(`## Weak variety (mixed)`);
    for (const x of p.weakVarietyBranches) lines.push(`- ${x}`);
  }
  return lines.join("\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
