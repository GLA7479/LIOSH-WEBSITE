#!/usr/bin/env node
/**
 * Professional Diagnostic Framework V1 — structure QA + audit artifact refresh.
 * Deterministic mock contracts; also included in full orchestrator after engine truth (~1s).
 *
 * npm run qa:learning-simulator:diagnostic-framework
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT_DIR = join(ROOT, "reports", "learning-simulator", "professional-diagnostics");
const FW_PATH = join(ROOT, "utils", "learning-diagnostics", "diagnostic-framework-v1.js");

const REQUIRED_FINDING_KEYS = [
  "findingType",
  "subjectId",
  "topicId",
  "skillId",
  "evidenceLevel",
  "confidence",
  "basedOn",
  "reasoning",
  "doNotConclude",
  "nextAction",
  "frameworkMeta",
];

function assertFindingShape(sf, label) {
  for (const k of REQUIRED_FINDING_KEYS) {
    if (!(k in sf)) throw new Error(`${label}: missing structuredFinding.${k}`);
  }
  if (!sf.nextAction || typeof sf.nextAction !== "object") throw new Error(`${label}: nextAction object required`);
  if (typeof sf.nextAction.type !== "string" || !sf.nextAction.type.trim()) {
    throw new Error(`${label}: nextAction.type required`);
  }
  if (!Array.isArray(sf.reasoning)) throw new Error(`${label}: reasoning must be array`);
  if (!Array.isArray(sf.doNotConclude) || sf.doNotConclude.length < 1) {
    throw new Error(`${label}: doNotConclude must be non-empty`);
  }
  if (!sf.basedOn || typeof sf.basedOn !== "object") throw new Error(`${label}: basedOn object required`);
  if (!sf.frameworkMeta || typeof sf.frameworkMeta !== "object") throw new Error(`${label}: frameworkMeta required`);
}

function assertEnumsOnFinding(sf, label, mod) {
  const ev = new Set(mod.PROFESSIONAL_FRAMEWORK_V1.evidenceLevelEnum);
  const conf = new Set(mod.PROFESSIONAL_FRAMEWORK_V1.confidenceEnum);
  const rec = new Set(mod.PROFESSIONAL_FRAMEWORK_V1.recommendationTypeEnum);
  if (!ev.has(sf.evidenceLevel)) throw new Error(`${label}: evidenceLevel not in enum`);
  if (!conf.has(sf.confidence)) throw new Error(`${label}: confidence not in enum`);
  if (!rec.has(sf.nextAction.type)) throw new Error(`${label}: nextAction.type not in enum`);
}

function bannedLeakScan(text, banned) {
  const lower = text.toLowerCase();
  for (const b of banned) {
    if (lower.includes(String(b).toLowerCase())) return b;
  }
  return null;
}

/**
 * Direct unit tests for deriveEvidenceLevelV1 (threshold order: strong before medium).
 */
function assertEvidenceLevelBoundaries(deriveEvidenceLevelV1) {
  const eq = (label, got, want) => {
    if (got !== want) throw new Error(`deriveEvidenceLevelV1 ${label}: expected "${want}", got "${got}"`);
  };

  eq("none (no row, no subject)", deriveEvidenceLevelV1({ rowQuestions: 0, subjectQuestionTotal: 0 }), "none");

  eq("thin (very small q)", deriveEvidenceLevelV1({ rowQuestions: 2, subjectQuestionTotal: 200, accuracy: 80 }), "thin");
  eq(
    "thin (low sufficiency)",
    deriveEvidenceLevelV1({ rowQuestions: 20, subjectQuestionTotal: 80, accuracy: 80, dataSufficiencyLevel: "low" }),
    "thin"
  );

  eq("limited (small q)", deriveEvidenceLevelV1({ rowQuestions: 8, subjectQuestionTotal: 100, accuracy: 75 }), "limited");
  eq(
    "limited (below medium q threshold)",
    deriveEvidenceLevelV1({ rowQuestions: 20, subjectQuestionTotal: 50, accuracy: 82 }),
    "limited"
  );

  eq(
    "medium (q>=25, sub>=40)",
    deriveEvidenceLevelV1({ rowQuestions: 25, subjectQuestionTotal: 40, accuracy: 78 }),
    "medium"
  );
  eq(
    "medium (not strong: q<40)",
    deriveEvidenceLevelV1({ rowQuestions: 30, subjectQuestionTotal: 55, accuracy: 80 }),
    "medium"
  );

  eq(
    "strong (q>=40, sub>=60) — must not be downgraded to medium",
    deriveEvidenceLevelV1({ rowQuestions: 40, subjectQuestionTotal: 60, accuracy: 85 }),
    "strong"
  );
  eq("strong (high volume)", deriveEvidenceLevelV1({ rowQuestions: 50, subjectQuestionTotal: 90, accuracy: 88 }), "strong");
}

async function loadFrameworkModule() {
  const url = pathToFileURL(FW_PATH).href;
  return import(url);
}

function buildMockEngineAndMaps() {
  const maps = {
    math: {
      fractions: {
        questions: 6,
        accuracy: 55,
        wrong: 3,
        needsPractice: true,
        dataSufficiencyLevel: "low",
        trend: { accuracyDirection: "flat" },
        behaviorProfile: { dominantType: "knowledge_gap" },
      },
    },
    hebrew: {
      comprehension: {
        questions: 14,
        accuracy: 82,
        wrong: 2,
        needsPractice: false,
        dataSufficiencyLevel: "medium",
        trend: { accuracyDirection: "up" },
        behaviorProfile: { dominantType: "careless_pattern" },
      },
    },
  };

  const diagnosticEngineV2 = {
    units: [
      {
        subjectId: "math",
        topicRowKey: "fractions",
        bucketKey: "fractions",
        canonicalState: { actionState: "intervene" },
        diagnosis: { forbiddenInferencesHe: ["אין להסיק ליקוי קליני מתרגילי אימון בלבד."] },
        evidenceTrace: [],
      },
      {
        subjectId: "hebrew",
        topicRowKey: "comprehension",
        bucketKey: "comprehension",
        canonicalState: { actionState: "maintain" },
        diagnosis: { forbiddenInferencesHe: [] },
        evidenceTrace: [],
      },
      {
        subjectId: "geometry",
        topicRowKey: "angles",
        bucketKey: "angles",
        canonicalState: { actionState: "withhold" },
        evidenceTrace: [],
      },
    ],
  };

  return { maps, diagnosticEngineV2 };
}

/** Math + Hebrew units with row/subject volume in strong tier; confidence should be high when rowQ >= 10. */
function buildStrongEvidenceMock() {
  const maps = {
    math: {
      addition: {
        questions: 45,
        accuracy: 90,
        wrong: 4,
        needsPractice: false,
        dataSufficiencyLevel: "high",
        trend: { accuracyDirection: "flat" },
        behaviorProfile: { dominantType: "careless_pattern" },
        modeKey: "speed",
      },
    },
    hebrew: {
      grammar: {
        questions: 42,
        accuracy: 88,
        wrong: 3,
        needsPractice: false,
        dataSufficiencyLevel: "high",
        trend: { accuracyDirection: "up" },
        behaviorProfile: { dominantType: "careless_pattern" },
        modeKey: "speed",
      },
    },
  };

  const diagnosticEngineV2 = {
    units: [
      {
        subjectId: "math",
        topicRowKey: "addition",
        bucketKey: "addition",
        canonicalState: { actionState: "maintain" },
        diagnosis: { forbiddenInferencesHe: [] },
        evidenceTrace: [],
      },
      {
        subjectId: "hebrew",
        topicRowKey: "grammar",
        bucketKey: "grammar",
        canonicalState: { actionState: "maintain" },
        diagnosis: { forbiddenInferencesHe: [] },
        evidenceTrace: [],
      },
    ],
  };

  return { maps, diagnosticEngineV2 };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const mod = await loadFrameworkModule();
  const {
    enrichDiagnosticEngineV2WithProfessionalFrameworkV1,
    deriveEvidenceLevelV1,
    PROFESSIONAL_FRAMEWORK_V1,
    MATH_SKILLS_V1,
    HEBREW_SKILLS_V1,
    mathSkillIdFromBucketKey,
    hebrewSkillIdFromBucketKey,
  } = mod;

  assertEvidenceLevelBoundaries(deriveEvidenceLevelV1);

  const { maps, diagnosticEngineV2 } = buildMockEngineAndMaps();
  const enriched = enrichDiagnosticEngineV2WithProfessionalFrameworkV1(diagnosticEngineV2, maps, {
    mathQuestions: 40,
    hebrewQuestions: 30,
    englishQuestions: 0,
    scienceQuestions: 0,
    geometryQuestions: 0,
    moledetGeographyQuestions: 0,
    mathAccuracy: 62,
    hebrewAccuracy: 78,
    englishAccuracy: 0,
    scienceAccuracy: 0,
    geometryAccuracy: 0,
    moledetGeographyAccuracy: 0,
    totalQuestions: 120,
  });

  const mathUnits = enriched.units.filter((u) => u.subjectId === "math" && u.professionalFrameworkV1);
  const hebrewUnits = enriched.units.filter((u) => u.subjectId === "hebrew" && u.professionalFrameworkV1);
  if (mathUnits.length !== 1) throw new Error("Expected exactly one math unit with professionalFrameworkV1");
  if (hebrewUnits.length !== 1) throw new Error("Expected exactly one hebrew unit with professionalFrameworkV1");
  if (enriched.units.some((u) => u.subjectId === "geometry" && u.professionalFrameworkV1)) {
    throw new Error("Geometry unit must not receive professionalFrameworkV1 when subject question total is 0");
  }

  for (const u of [...mathUnits, ...hebrewUnits]) {
    assertFindingShape(u.professionalFrameworkV1.structuredFinding, u.topicRowKey || u.bucketKey);
    assertEnumsOnFinding(u.professionalFrameworkV1.structuredFinding, u.topicRowKey || u.bucketKey, mod);
  }

  const { maps: strongMaps, diagnosticEngineV2: strongEng } = buildStrongEvidenceMock();
  const strongEnriched = enrichDiagnosticEngineV2WithProfessionalFrameworkV1(strongEng, strongMaps, {
    mathQuestions: 72,
    hebrewQuestions: 65,
    mathAccuracy: 88,
    hebrewAccuracy: 86,
    totalQuestions: 200,
  });
  const strongMath = strongEnriched.units.find((u) => u.subjectId === "math" && u.topicRowKey === "addition");
  const strongHebrew = strongEnriched.units.find((u) => u.subjectId === "hebrew" && u.topicRowKey === "grammar");
  if (!strongMath?.professionalFrameworkV1?.structuredFinding) throw new Error("Strong mock: missing math finding");
  if (!strongHebrew?.professionalFrameworkV1?.structuredFinding) throw new Error("Strong mock: missing hebrew finding");
  const sm = strongMath.professionalFrameworkV1.structuredFinding;
  const sh = strongHebrew.professionalFrameworkV1.structuredFinding;
  if (sm.evidenceLevel !== "strong") throw new Error(`Strong mock math: expected evidenceLevel strong, got ${sm.evidenceLevel}`);
  if (sm.confidence !== "high") throw new Error(`Strong mock math: expected confidence high, got ${sm.confidence}`);
  if (sh.evidenceLevel !== "strong") throw new Error(`Strong mock hebrew: expected evidenceLevel strong, got ${sh.evidenceLevel}`);
  if (sh.confidence !== "high") throw new Error(`Strong mock hebrew: expected confidence high, got ${sh.confidence}`);
  if (!sm.reasoning.some((line) => String(line).includes("Speed-mode performance"))) {
    throw new Error("Strong mock math: expected speed-mode reasoning line when modeKey is speed");
  }

  /** Per-subject taxonomy + mock unit enrichment */
  const { SKILL_PACK_BY_SUBJECT_ID, ERROR_TYPES_BY_SUBJECT_ID } = mod;
  for (const sid of PROFESSIONAL_FRAMEWORK_V1.supportedSubjectIds) {
    const pack = SKILL_PACK_BY_SUBJECT_ID[sid];
    const errs = ERROR_TYPES_BY_SUBJECT_ID[sid];
    if (!pack || typeof pack !== "object") throw new Error(`Missing skill pack for ${sid}`);
    if (!errs?.length) throw new Error(`Missing error types for ${sid}`);
    const skillKeys = Object.keys(pack);
    for (const sk of skillKeys) {
      if (!Array.isArray(pack[sk].subskills) || pack[sk].subskills.length < 1) {
        throw new Error(`${sid}.${sk} must have subskills`);
      }
    }
  }

  const allMaps = {
    math: { fractions: { questions: 30, accuracy: 70, wrong: 5, dataSufficiencyLevel: "medium", trend: { accuracyDirection: "flat" }, behaviorProfile: { dominantType: "knowledge_gap" } } },
    hebrew: { comprehension: { questions: 30, accuracy: 72, wrong: 4, dataSufficiencyLevel: "medium", trend: { accuracyDirection: "flat" }, behaviorProfile: { dominantType: "knowledge_gap" } } },
    english: { grammar: { questions: 30, accuracy: 75, wrong: 3, dataSufficiencyLevel: "medium", trend: { accuracyDirection: "flat" }, behaviorProfile: { dominantType: "careless_pattern" } } },
    science: { experiments: { questions: 35, accuracy: 78, wrong: 2, dataSufficiencyLevel: "medium", trend: { accuracyDirection: "up" }, behaviorProfile: { dominantType: "knowledge_gap" } } },
    geometry: { area: { questions: 32, accuracy: 80, wrong: 2, dataSufficiencyLevel: "medium", trend: { accuracyDirection: "flat" }, behaviorProfile: { dominantType: "careless_pattern" } } },
    "moledet-geography": { maps: { questions: 28, accuracy: 76, wrong: 3, dataSufficiencyLevel: "medium", trend: { accuracyDirection: "flat" }, behaviorProfile: { dominantType: "instruction_friction" } } },
  };
  const allUnits = {
    units: [
      { subjectId: "math", topicRowKey: "fractions", bucketKey: "fractions", canonicalState: { actionState: "intervene" }, diagnosis: { forbiddenInferencesHe: [] }, evidenceTrace: [] },
      { subjectId: "hebrew", topicRowKey: "comprehension", bucketKey: "comprehension", canonicalState: { actionState: "maintain" }, diagnosis: { forbiddenInferencesHe: [] }, evidenceTrace: [] },
      { subjectId: "english", topicRowKey: "grammar", bucketKey: "grammar", canonicalState: { actionState: "probe_only" }, diagnosis: { forbiddenInferencesHe: [] }, evidenceTrace: [] },
      { subjectId: "science", topicRowKey: "experiments", bucketKey: "experiments", canonicalState: { actionState: "intervene" }, diagnosis: { forbiddenInferencesHe: [] }, evidenceTrace: [] },
      { subjectId: "geometry", topicRowKey: "area", bucketKey: "area", canonicalState: { actionState: "maintain" }, diagnosis: { forbiddenInferencesHe: [] }, evidenceTrace: [] },
      { subjectId: "moledet-geography", topicRowKey: "maps", bucketKey: "maps", canonicalState: { actionState: "withhold" }, diagnosis: { forbiddenInferencesHe: [] }, evidenceTrace: [] },
    ],
  };
  const allEnriched = enrichDiagnosticEngineV2WithProfessionalFrameworkV1(allUnits, allMaps, {
    mathQuestions: 120,
    hebrewQuestions: 100,
    englishQuestions: 90,
    scienceQuestions: 95,
    geometryQuestions: 88,
    moledetGeographyQuestions: 70,
    mathAccuracy: 75,
    hebrewAccuracy: 74,
    englishAccuracy: 76,
    scienceAccuracy: 77,
    geometryAccuracy: 79,
    moledetGeographyAccuracy: 73,
    totalQuestions: 600,
  });
  if (allEnriched.professionalFrameworkV1.structuredFindings.length !== 6) {
    throw new Error("Expected six structured findings for six-subject mock");
  }
  for (const sf of allEnriched.professionalFrameworkV1.structuredFindings) {
    assertFindingShape(sf, `all-subjects/${sf.subjectId}`);
    assertEnumsOnFinding(sf, `all-subjects/${sf.subjectId}`, mod);
  }

  const thinEnriched = enrichDiagnosticEngineV2WithProfessionalFrameworkV1(
    {
      units: [
        {
          subjectId: "math",
          topicRowKey: "addition",
          bucketKey: "addition",
          canonicalState: { actionState: "withhold" },
          diagnosis: { forbiddenInferencesHe: [] },
          evidenceTrace: [],
        },
      ],
    },
    {
      math: {
        addition: {
          questions: 4,
          accuracy: 70,
          wrong: 1,
          dataSufficiencyLevel: "low",
          trend: { accuracyDirection: "flat" },
          behaviorProfile: { dominantType: "speed_pressure" },
        },
      },
    },
    {
      mathQuestions: 15,
      mathAccuracy: 68,
      hebrewQuestions: 0,
      englishQuestions: 0,
      scienceQuestions: 0,
      geometryQuestions: 0,
      moledetGeographyQuestions: 0,
      totalQuestions: 15,
    }
  );
  const thinSf = thinEnriched.units[0].professionalFrameworkV1?.structuredFinding;
  if (thinSf && thinSf.evidenceLevel === "strong" && thinSf.confidence === "high") {
    throw new Error("Thin sample must not yield strong+high");
  }

  const findingsText = JSON.stringify(enriched.professionalFrameworkV1?.structuredFindings || []);
  const globalRulesText = JSON.stringify(enriched.professionalFrameworkV1?.globalDoNotConclude || []);
  const leaked =
    bannedLeakScan(findingsText, PROFESSIONAL_FRAMEWORK_V1.bannedConclusionPhrases) ||
    bannedLeakScan(globalRulesText, PROFESSIONAL_FRAMEWORK_V1.bannedConclusionPhrases);
  if (leaked) {
    throw new Error(`Mock output leaked banned phrase surface: ${leaked}`);
  }

  /** Smoke: bucket → skill mapping */
  if (mathSkillIdFromBucketKey("fractions") !== "fractions") throw new Error("mathSkillIdFromBucketKey fractions");
  if (hebrewSkillIdFromBucketKey("grammar") !== "language_grammar") throw new Error("hebrewSkillIdFromBucketKey grammar");
  if (mod.englishSkillIdFromBucketKey("grammar") !== "grammar") throw new Error("englishSkillIdFromBucketKey");
  if (mod.scienceSkillIdFromBucketKey("experiments") !== "experiments") throw new Error("scienceSkillIdFromBucketKey");
  if (mod.geometrySkillIdFromBucketKey("area") !== "area") throw new Error("geometrySkillIdFromBucketKey area");
  if (mod.moledetSkillIdFromBucketKey("maps") !== "maps") throw new Error("moledetSkillIdFromBucketKey");

  const generatedAt = new Date().toISOString();
  const audit = {
    generatedAt,
    frameworkVersion: PROFESSIONAL_FRAMEWORK_V1.version,
    scope: {
      subjectsInPhase: [...PROFESSIONAL_FRAMEWORK_V1.supportedSubjectIds],
      deferredSubjects: [],
    },
    engineMapping: {
      readsFrom: [
        "diagnosticEngineV2.units[].subjectId",
        "diagnosticEngineV2.units[].topicRowKey",
        "diagnosticEngineV2.units[].bucketKey",
        "diagnosticEngineV2.units[].canonicalState.actionState",
        "diagnosticEngineV2.units[].diagnosis.forbiddenInferencesHe",
        "diagnosticEngineV2.units[].evidenceTrace",
        "maps[subjectId][topicRowKey] row diagnostics (accuracy, questions, trend, behaviorProfile, dataSufficiencyLevel, modeKey)",
      ],
      writesTo: [
        "diagnosticEngineV2.units[].professionalFrameworkV1 (all supported subjects with subject-level volume > 0)",
        "diagnosticEngineV2.professionalFrameworkV1 rollup",
      ],
      integrationFile: "utils/parent-report-v2.js",
      integrationPoint: "Immediately after runDiagnosticEngineV2({ maps, rawMistakesBySubject, startMs, endMs })",
    },
    mathStructure: {
      skillIds: Object.keys(MATH_SKILLS_V1),
      errorTypes: mod.MATH_ERROR_TYPES_V1,
    },
    hebrewStructure: {
      skillIds: Object.keys(HEBREW_SKILLS_V1),
      errorTypes: mod.HEBREW_ERROR_TYPES_V1,
    },
    guardrails: {
      noClinicalClaims: true,
      noUiOrPdfChangesThisPhase: true,
      orchestratorWiring: "diagnostic-framework + framework-real-scenarios after engine truth (full orchestrator)",
    },
    remainingGaps: [
      "sessionsApprox in basedOn is reserved (null) until session linkage is standardized.",
      "Taxonomy bridge ids (topic-taxonomy-bridge) not yet merged into structuredFinding.topicId (uses internal bucketKey).",
    ],
  };

  const summary = {
    generatedAt,
    frameworkVersion: PROFESSIONAL_FRAMEWORK_V1.version,
    qa: {
      mockUnitsProcessed: enriched.professionalFrameworkV1?.structuredFindings?.length ?? 0,
      rollupPresent: !!enriched.professionalFrameworkV1,
      globalDoNotConcludeCount: enriched.professionalFrameworkV1?.globalDoNotConclude?.length ?? 0,
    },
    integration: audit.engineMapping,
    mathSkillCount: Object.keys(MATH_SKILLS_V1).length,
    hebrewSkillCount: Object.keys(HEBREW_SKILLS_V1).length,
    subjectsWithTaxonomy: PROFESSIONAL_FRAMEWORK_V1.supportedSubjectIds.length,
  };

  await writeFile(join(OUT_DIR, "framework-audit.json"), JSON.stringify(audit, null, 2), "utf8");
  await writeFile(join(OUT_DIR, "framework-summary.json"), JSON.stringify(summary, null, 2), "utf8");

  const auditMd = [
    "# Professional Diagnostic Framework — audit",
    "",
    `- Generated at: ${generatedAt}`,
    `- Framework version: ${PROFESSIONAL_FRAMEWORK_V1.version}`,
    "",
    "## Scope",
    "",
    "- **In phase:** math, hebrew, english, science, geometry, moledet-geography (internal structured findings only).",
    "",
    "## Engine field mapping",
    "",
    "Reads unit identifiers and canonical action state from `diagnosticEngineV2`, and row-level metrics from `maps`.",
    "Writes `professionalFrameworkV1` on math/hebrew units and a rollup object on `diagnosticEngineV2`.",
    "",
    "## Integration",
    "",
    `- File: \`${audit.engineMapping.integrationFile}\``,
    `- Point: ${audit.engineMapping.integrationPoint}`,
    "",
    "## Remaining gaps",
    "",
    ...audit.remainingGaps.map((g) => `- ${g}`),
    "",
  ].join("\n");

  const summaryMd = [
    "# Professional Diagnostic Framework — summary",
    "",
    `- Generated at: ${generatedAt}`,
    `- Mock structured findings: ${summary.qa.mockUnitsProcessed}`,
    `- Rollup present: ${summary.qa.rollupPresent}`,
    `- Global do-not-conclude rules: ${summary.qa.globalDoNotConcludeCount}`,
    "",
    "## QA",
    "",
    "Deterministic mock enrichment exercised `enrichDiagnosticEngineV2WithProfessionalFrameworkV1` (offline).",
    "",
  ].join("\n");

  await writeFile(join(OUT_DIR, "framework-audit.md"), auditMd, "utf8");
  await writeFile(join(OUT_DIR, "framework-summary.md"), summaryMd, "utf8");

  console.log("qa:learning-simulator:diagnostic-framework PASS");
  console.log(`Wrote: ${OUT_DIR}/framework-audit.{json,md}, framework-summary.{json,md}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
