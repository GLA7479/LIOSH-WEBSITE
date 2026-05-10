/**
 * Production curriculum & question completion matrix (grades 1–6).
 * Compares unique stem counts per subject×grade×topic×difficulty against owner thresholds.
 *
 * Writes reports/curriculum-audit/production-curriculum-question-completion.{json,md}
 *
 * Notes:
 * - Math / Geometry / Hebrew are generator-primary: inventory rows include deterministic audit samples;
 *   readiness uses closure automated/runtime gates, not raw inventory stem floors.
 * - Science / English / Moledet–Geography use inventory unique stemHashes as the primary signal.
 */
import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT_DIR = join(ROOT, "reports", "curriculum-audit");

const modUrl = (rel) => pathToFileURL(join(ROOT, rel)).href;

const MIN_NORMAL = 11;
const MIN_INTRO = 7;
const MIN_STRETCH = 4;

const LEVELS = ["easy", "medium", "hard"];

function loadJson(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function normalizeDifficulty(raw) {
  const s = String(raw || "").toLowerCase();
  if (s.includes("easy") || s === "basic") return "easy";
  if (s.includes("hard") || s === "advanced") return "hard";
  if (s.includes("medium") || s === "standard" || s === "intermediate") return "medium";
  return "unknown";
}

const { GRADES: MATH_GRADES } = await import(modUrl("utils/math-constants.js"));
const { GRADES: GEO_GRADES } = await import(modUrl("utils/geometry-constants.js"));
const { GRADES: HEBREW_GRADES } = await import(modUrl("utils/hebrew-constants.js"));
const { ENGLISH_GRADES } = await import(modUrl("data/english-curriculum.js"));
const { SCIENCE_GRADES } = await import(modUrl("data/science-curriculum.js"));
const { GRADES: MG_GRADES } = await import(modUrl("utils/moledet-geography-constants.js"));

/** @type {typeof import(join(ROOT,"scripts/curriculum-audit/scan-question-inventory.mjs"))} */
async function loadInventoryRecords() {
  const invPath = join(OUT_DIR, "question-inventory.json");
  const invRaw = loadJson(invPath);
  const records = Array.isArray(invRaw) ? invRaw : invRaw?.records || [];
  return records;
}

/**
 * Build Map cellKey -> { stemHashes: Set, rowCount }
 * cellKey = subject|gN|topic|difficulty
 */
function aggregateInventoryCells(records, subjectFilter) {
  /** @type {Map<string, { stems: Set<string>, rowCount: number }>} */
  const m = new Map();
  for (const r of records) {
    const subj = String(r.subject || "");
    if (subjectFilter && subj !== subjectFilter && !(subjectFilter === "moledet-geography" && subj === "geography"))
      continue;
    const sid =
      subj === "geography"
        ? "moledet-geography"
        : subj === "math"
          ? "math"
          : subj === "geometry"
            ? "geometry"
            : subj === "hebrew"
              ? "hebrew"
              : subj === "english"
                ? "english"
                : subj === "science"
                  ? "science"
                  : subj === "moledet-geography"
                    ? "moledet-geography"
                    : null;
    if (!sid) continue;

    const gmin = Number(r.gradeMin ?? r.grade);
    const gmax = Number(r.gradeMax ?? r.grade);
    const topic = String(r.topic || "unknown").split("|")[0].trim() || "unknown";
    const diff = normalizeDifficulty(r.difficulty);
    if (diff === "unknown") continue;
    if (!Number.isFinite(gmin) || !Number.isFinite(gmax)) continue;
    const h = String(r.stemHash || "");

    for (let g = gmin; g <= gmax; g++) {
      const ck = `${sid}|g${g}|${topic}|${diff}`;
      if (!m.has(ck)) m.set(ck, { stems: new Set(), rowCount: 0 });
      const agg = m.get(ck);
      agg.rowCount++;
      if (h) agg.stems.add(h);
    }
  }
  return m;
}

function scienceAlignmentMap(scienceClosure) {
  /** @type {Map<string, { curriculumPlacement: string }>} */
  const map = new Map();
  for (const row of scienceClosure?.gradeTopicAlignment || []) {
    const gk = row.gradeKey || `g${row.grade}`;
    const key = `${gk}|${row.uiTopic}`;
    map.set(key, { curriculumPlacement: row.curriculumPlacement || "allowed" });
  }
  return map;
}

function englishPracticeTier(gradeNum, diff) {
  if (gradeNum <= 2 && diff === "hard") return { tier: "stretch", reason: "english_g12_hard_band" };
  if (gradeNum <= 2) return { tier: "intro", reason: "english_early_exposure" };
  return { tier: "normal", reason: "english_standard" };
}

/**
 * Inventory tags English as grammar | translation | sentence (see collectEnglishPool).
 * UI topics (vocabulary, sentences, writing, mixed) are views over those categories.
 */
function englishUiToInventoryCategories(uiTopic) {
  const t = String(uiTopic || "");
  switch (t) {
    case "vocabulary":
      return ["translation"];
    case "sentences":
      return ["sentence"];
    case "writing":
      return ["sentence", "translation"];
    case "mixed":
      return ["grammar", "translation", "sentence"];
    case "grammar":
      return ["grammar"];
    case "translation":
      return ["translation"];
    default:
      return [t];
  }
}

/**
 * @returns {{ stems: Set<string>, rowCount: number } | null}
 */
function englishMergedAggregate(base, invAggregate) {
  const categories = englishUiToInventoryCategories(base.topic);
  const stems = new Set();
  let rowCount = 0;
  for (const cat of categories) {
    const k = `english|${base.gradeKey}|${cat}|${base.difficulty}`;
    const part = invAggregate.get(k);
    if (part) {
      rowCount += part.rowCount;
      for (const h of part.stems) stems.add(h);
    }
  }
  if (rowCount === 0 && stems.size === 0) return null;
  return { stems, rowCount };
}

function sciencePracticeTier(gradeNum, topic, diff, sciAlign) {
  const gk = `g${gradeNum}`;
  const row = sciAlign.get(`${gk}|${topic}`);
  const placement = row?.curriculumPlacement || "allowed";
  const isStretchBand = gradeNum <= 2 && (diff === "medium" || diff === "hard");
  if (placement === "notExpectedYet" || placement === "not_yet") return { tier: "blocked", label: "not_in_grade" };
  if (placement === "enrichment") return { tier: "stretch", label: "enrichment" };
  if (isStretchBand) return { tier: "stretch", label: "g12_stretch_policy" };
  if (placement === "allowed" && gradeNum <= 2 && diff === "easy") return { tier: "intro", label: "early_exposure" };
  if (placement === "core") return { tier: "normal", label: "core_practice" };
  return { tier: "normal", label: "general_practice" };
}

function requiredMinimumForTier(tier) {
  if (tier === "normal") return MIN_NORMAL;
  if (tier === "intro") return MIN_INTRO;
  if (tier === "stretch") return MIN_STRETCH;
  return 0;
}

function enumerateMathCells() {
  /** @type {object[]} */
  const out = [];
  for (let g = 1; g <= 6; g++) {
    const gk = `g${g}`;
    const ops = (MATH_GRADES[gk]?.operations || []).filter((o) => o !== "mixed");
    for (const topic of ops) {
      for (const diff of LEVELS) {
        out.push({
          subject: "math",
          gradeKey: gk,
          gradeNum: g,
          topic,
          difficulty: diff,
          visibleInUi: true,
          generatedAtRuntime: true,
          mixedReachable: (MATH_GRADES[gk]?.operations || []).includes("mixed"),
          curriculumSupportSource: "math GRADES.operations + math-final-closure / PDF registry",
        });
      }
    }
  }
  return out;
}

function enumerateGeometryCells() {
  const out = [];
  for (let g = 1; g <= 6; g++) {
    const gk = `g${g}`;
    const topics = (GEO_GRADES[gk]?.topics || []).filter((t) => t !== "mixed");
    for (const topic of topics) {
      for (const diff of LEVELS) {
        out.push({
          subject: "geometry",
          gradeKey: gk,
          gradeNum: g,
          topic,
          difficulty: diff,
          visibleInUi: true,
          generatedAtRuntime: true,
          mixedReachable: (GEO_GRADES[gk]?.topics || []).includes("mixed"),
          curriculumSupportSource: "geometry GRADES.topics + geometry-final-closure",
        });
      }
    }
  }
  return out;
}

function enumerateHebrewCells() {
  const out = [];
  for (let g = 1; g <= 6; g++) {
    const gk = `g${g}`;
    const topics = (HEBREW_GRADES[gk]?.topics || []).filter((t) => t !== "mixed");
    for (const topic of topics) {
      for (const diff of LEVELS) {
        out.push({
          subject: "hebrew",
          gradeKey: gk,
          gradeNum: g,
          topic,
          difficulty: diff,
          visibleInUi: true,
          generatedAtRuntime: true,
          mixedReachable: (HEBREW_GRADES[gk]?.topics || []).includes("mixed"),
          curriculumSupportSource: "hebrew GRADES.topics + hebrew-final-closure",
        });
      }
    }
  }
  return out;
}

function enumerateEnglishCells() {
  const out = [];
  for (let g = 1; g <= 6; g++) {
    const gk = `g${g}`;
    const topics = ENGLISH_GRADES[gk]?.topics || [];
    for (const topic of topics) {
      for (const diff of LEVELS) {
        out.push({
          subject: "english",
          gradeKey: gk,
          gradeNum: g,
          topic,
          difficulty: diff,
          visibleInUi: true,
          generatedAtRuntime: true,
          mixedReachable: topics.length > 1,
          curriculumSupportSource: "ENGLISH_GRADES.topics + english-final-closure",
        });
      }
    }
  }
  return out;
}

function enumerateScienceCells() {
  const out = [];
  for (let g = 1; g <= 6; g++) {
    const gk = `g${g}`;
    const topics = (SCIENCE_GRADES[gk]?.topics || []).filter((t) => t !== "mixed");
    for (const topic of topics) {
      for (const diff of LEVELS) {
        out.push({
          subject: "science",
          gradeKey: gk,
          gradeNum: g,
          topic,
          difficulty: diff,
          visibleInUi: true,
          generatedAtRuntime: true,
          mixedReachable: (SCIENCE_GRADES[gk]?.topics || []).includes("mixed"),
          curriculumSupportSource: "SCIENCE_GRADES.topics + science-final-closure alignment",
        });
      }
    }
  }
  return out;
}

function enumerateMoledetCells() {
  const out = [];
  for (let g = 1; g <= 6; g++) {
    const gk = `g${g}`;
    const topics = (MG_GRADES[gk]?.topics || []).filter((t) => t !== "mixed");
    for (const topic of topics) {
      for (const diff of LEVELS) {
        out.push({
          subject: "moledet-geography",
          gradeKey: gk,
          gradeNum: g,
          topic,
          difficulty: diff,
          visibleInUi: true,
          generatedAtRuntime: true,
          mixedReachable: (MG_GRADES[gk]?.topics || []).includes("mixed"),
          curriculumSupportSource: "moledet-geography GRADES.topics + closure reports",
        });
      }
    }
  }
  return out;
}

function finalizeCell(base, invAggregate, options) {
  const {
    inventoryAuthoritative,
    generatorGateOk,
    sciAlign,
    practiceTierOverride,
  } = options;

  const ck = `${base.subject}|${base.gradeKey}|${base.topic}|${base.difficulty}`;
  const agg =
    base.subject === "english" ? englishMergedAggregate(base, invAggregate) : invAggregate.get(ck);
  const uniqueStemCount = agg ? agg.stems.size : 0;
  const rowCount = agg ? agg.rowCount : 0;
  const duplicateWithinCell = Math.max(0, rowCount - uniqueStemCount);

  let practiceTier = "normal";
  let tierReason = "default";
  if (base.subject === "english") {
    const et = englishPracticeTier(base.gradeNum, base.difficulty);
    practiceTier = et.tier;
    tierReason = et.reason;
  } else if (base.subject === "science") {
    const t = sciencePracticeTier(base.gradeNum, base.topic, base.difficulty, sciAlign);
    if (t.tier === "blocked") {
      return {
        ...base,
        cellKey: ck,
        uniqueStemCount,
        inventoryRowCount: rowCount,
        duplicateStemRowsInCell: duplicateWithinCell,
        requiredMinimum: 0,
        status: "should_be_blocked",
        practiceTier: "blocked",
        notes:
          "Curriculum alignment marks topic as not expected at this grade — verify runtime visibility separately.",
      };
    }
    practiceTier = t.tier;
    tierReason = t.label;
  }
  if (practiceTierOverride) {
    practiceTier = practiceTierOverride.tier;
    tierReason = practiceTierOverride.reason || tierReason;
  }

  const requiredMinimum =
    practiceTier === "blocked" ? 0 : requiredMinimumForTier(practiceTier === "blocked" ? "normal" : practiceTier);

  /** Generator-primary subjects: inventory stem floors are not production gates. */
  if (!inventoryAuthoritative && generatorGateOk) {
    return {
      ...base,
      cellKey: ck,
      uniqueStemCount,
      inventoryRowCount: rowCount,
      duplicateStemRowsInCell: duplicateWithinCell,
      requiredMinimum,
      practiceTier,
      tierReason,
      status: "production_ready",
      notes:
        "Generator-primary subject: automated closure variety/runtime gates satisfied — inventory unique stems are advisory (audit sampling), not a production floor.",
    };
  }

  if (!inventoryAuthoritative && !generatorGateOk) {
    return {
      ...base,
      cellKey: ck,
      uniqueStemCount,
      inventoryRowCount: rowCount,
      duplicateStemRowsInCell: duplicateWithinCell,
      requiredMinimum,
      practiceTier,
      tierReason,
      status: "needs_more_questions",
      notes: "Generator subject but automated variety gate did not pass in closure artifact — investigate closure report.",
    };
  }

  /** Static-bank authoritative */
  if (uniqueStemCount >= requiredMinimum && duplicateWithinCell === 0) {
    return {
      ...base,
      cellKey: ck,
      uniqueStemCount,
      inventoryRowCount: rowCount,
      duplicateStemRowsInCell: duplicateWithinCell,
      requiredMinimum,
      practiceTier,
      tierReason,
      status: "production_ready",
      notes: "",
    };
  }

  if (uniqueStemCount >= requiredMinimum && duplicateWithinCell > 0) {
    return {
      ...base,
      cellKey: ck,
      uniqueStemCount,
      inventoryRowCount: rowCount,
      duplicateStemRowsInCell: duplicateWithinCell,
      requiredMinimum,
      practiceTier,
      tierReason,
      status: "needs_more_questions",
      notes: "Meets unique stem floor but duplicate stems detected in cell — diversify distractors/stems.",
    };
  }

  if (practiceTier === "stretch") {
    if (uniqueStemCount >= requiredMinimum) {
      return {
        ...base,
        cellKey: ck,
        uniqueStemCount,
        inventoryRowCount: rowCount,
        duplicateStemRowsInCell: duplicateWithinCell,
        requiredMinimum,
        practiceTier,
        tierReason,
        status: "production_ready",
        notes: "",
      };
    }
    return {
      ...base,
      cellKey: ck,
      uniqueStemCount,
      inventoryRowCount: rowCount,
      duplicateStemRowsInCell: duplicateWithinCell,
      requiredMinimum,
      practiceTier,
      tierReason,
      status: "stretch_or_enrichment_owner_decision",
      notes:
        "Stretch/enrichment band — meets policy minimum or requires owner decision to hide from normal practice.",
    };
  }

  const shortfall = requiredMinimum - uniqueStemCount;
  return {
    ...base,
    cellKey: ck,
    uniqueStemCount,
    inventoryRowCount: rowCount,
    duplicateStemRowsInCell: duplicateWithinCell,
    requiredMinimum,
    shortfall,
    practiceTier,
    tierReason,
    status: base.visibleInUi ? "needs_more_questions" : "audit_artifact",
    notes: shortfall > 0 ? `Below minimum by ~${shortfall} unique stems.` : "",
  };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const records = await loadInventoryRecords();
  const invMath = aggregateInventoryCells(records, "math");
  const invGeo = aggregateInventoryCells(records, "geometry");
  const invHe = aggregateInventoryCells(records, "hebrew");
  const invEn = aggregateInventoryCells(records, "english");
  const invSci = aggregateInventoryCells(records, "science");
  const invMg = aggregateInventoryCells(records, "moledet-geography");

  const mathClosure = loadJson(join(OUT_DIR, "math-final-closure.json"));
  const geoClosure = loadJson(join(OUT_DIR, "geometry-final-closure.json"));
  const heClosure = loadJson(join(OUT_DIR, "hebrew-final-closure.json"));
  const enClosure = loadJson(join(OUT_DIR, "english-final-closure.json"));
  const sciClosure = loadJson(join(OUT_DIR, "science-final-closure.json"));
  const mgClosure = loadJson(join(OUT_DIR, "moledet-geography-final-closure.json"));

  const mathGate = mathClosure?.closureQuestions?.automatedVarietyGatePassed === true;
  const geoGate = geoClosure?.closureQuestions?.automatedVarietyGatePassed === true;
  const heGate = heClosure?.closureQuestions?.isHebrewClosedForAutomatedDevelopmentStage === true;

  const sciAlign = scienceAlignmentMap(sciClosure);

  /** Merge maps for lookup by subject */
  function aggFor(sub) {
    if (sub === "math") return invMath;
    if (sub === "geometry") return invGeo;
    if (sub === "hebrew") return invHe;
    if (sub === "english") return invEn;
    if (sub === "science") return invSci;
    if (sub === "moledet-geography") return invMg;
    return new Map();
  }

  /** @type {object[]} */
  const cells = [];

  for (const b of enumerateMathCells()) {
    cells.push(
      finalizeCell(b, aggFor("math"), {
        inventoryAuthoritative: false,
        generatorGateOk: mathGate,
        sciAlign,
      })
    );
  }
  for (const b of enumerateGeometryCells()) {
    cells.push(
      finalizeCell(b, aggFor("geometry"), {
        inventoryAuthoritative: false,
        generatorGateOk: geoGate,
        sciAlign,
      })
    );
  }
  for (const b of enumerateHebrewCells()) {
    cells.push(
      finalizeCell(b, aggFor("hebrew"), {
        inventoryAuthoritative: false,
        generatorGateOk: heGate,
        sciAlign,
      })
    );
  }
  for (const b of enumerateEnglishCells()) {
    cells.push(
      finalizeCell(b, aggFor("english"), {
        inventoryAuthoritative: true,
        generatorGateOk: true,
        sciAlign,
      })
    );
  }
  for (const b of enumerateScienceCells()) {
    cells.push(
      finalizeCell(b, aggFor("science"), {
        inventoryAuthoritative: true,
        generatorGateOk: true,
        sciAlign,
      })
    );
  }
  for (const b of enumerateMoledetCells()) {
    cells.push(
      finalizeCell(b, aggFor("moledet-geography"), {
        inventoryAuthoritative: true,
        generatorGateOk: true,
        sciAlign,
      })
    );
  }

  const byStatus = (s) => cells.filter((c) => c.status === s);
  const productionReady = byStatus("production_ready").length;
  const needsMore = byStatus("needs_more_questions");
  const blocked = byStatus("should_be_blocked");
  const stretchOwner = byStatus("stretch_or_enrichment_owner_decision");
  const auditArt = byStatus("audit_artifact");

  const staticNeedsNormal = needsMore.filter((c) =>
    ["english", "science", "moledet-geography"].includes(c.subject)
  );

  const curriculumAndQuestionsProductionReady =
    blocked.length === 0 &&
    needsMore.length === 0 &&
    stretchOwner.filter((c) => c.uniqueStemCount < (c.requiredMinimum || 0)).length === 0;

  const payload = {
    generatedAt: new Date().toISOString(),
    phase: "production-curriculum-question-completion",
    thresholds: {
      normalPracticeUniqueMin: MIN_NORMAL,
      introExposureUniqueMin: MIN_INTRO,
      stretchEnrichmentUniqueMin: MIN_STRETCH,
      notes:
        "Normal ≈10–12, intro ≈6–8, stretch ≈3–5 unique stems per cell (inventory-based where authoritative).",
    },
    closureGateRefs: {
      mathVarietyGatePassed: mathGate,
      geometryVarietyGatePassed: geoGate,
      hebrewAutomatedDevClosed: heGate,
      englishClosureLoaded: Boolean(enClosure),
      scienceClosureLoaded: Boolean(sciClosure),
      moledetClosureLoaded: Boolean(mgClosure),
    },
    inventoryRecordCount: records.length,
    summary: {
      totalCellsChecked: cells.length,
      production_ready: productionReady,
      needs_more_questions: needsMore.length,
      should_be_blocked: blocked.length,
      stretch_or_enrichment_owner_decision: stretchOwner.length,
      audit_artifact: auditArt.length,
      staticBankSubjectsBelowThreshold: staticNeedsNormal.length,
    },
    curriculumAndQuestionsProductionReady,
    productionBlockers:
      curriculumAndQuestionsProductionReady
        ? []
        : [
            ...(blocked.length ? [`${blocked.length} cells flagged should_be_blocked (science alignment notExpectedYet vs UI exposure — verify).`] : []),
            ...(needsMore.length ? [`${needsMore.length} cells need_more_questions (unique stems / duplicate rows).`] : []),
            ...(stretchOwner.length ? [`${stretchOwner.length} stretch cells pending owner decision or minimum fill.`] : []),
          ],
    advisories: [
      "Math/Geometry/Hebrew production readiness defers to generator closure gates when inventory sampling understates variety.",
      "Exact duplicate stems in authoritative subjects require bank diversification even when raw counts pass.",
    ],
    cells,
  };

  await writeFile(join(OUT_DIR, "production-curriculum-question-completion.json"), JSON.stringify(payload, null, 2), "utf8");

  const md = [];
  md.push("# Production curriculum & question completion");
  md.push("");
  md.push(`Generated: ${payload.generatedAt}`);
  md.push("");
  md.push(`## Verdict: **curriculumAndQuestionsProductionReady = ${payload.curriculumAndQuestionsProductionReady}**`);
  md.push("");
  md.push("## Summary");
  md.push(`- Total cells checked: **${payload.summary.totalCellsChecked}**`);
  md.push(`- production_ready: **${payload.summary.production_ready}**`);
  md.push(`- needs_more_questions: **${payload.summary.needs_more_questions}**`);
  md.push(`- should_be_blocked: **${payload.summary.should_be_blocked}**`);
  md.push(`- stretch_or_enrichment_owner_decision: **${payload.summary.stretch_or_enrichment_owner_decision}**`);
  md.push("");
  md.push("## Production blockers");
  if (!payload.productionBlockers.length) md.push("- None recorded.");
  else for (const b of payload.productionBlockers) md.push(`- ${b}`);
  md.push("");
  md.push("## Sample gaps (needs_more_questions, first 40)");
  for (const c of needsMore.slice(0, 40)) {
    md.push(`- ${c.cellKey}: unique=${c.uniqueStemCount}, required=${c.requiredMinimum}, dupRows=${c.duplicateStemRowsInCell ?? "n/a"}`);
  }
  md.push("");

  await writeFile(join(OUT_DIR, "production-curriculum-question-completion.md"), md.join("\n"), "utf8");
  console.log("Wrote production-curriculum-question-completion.{json,md}");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
