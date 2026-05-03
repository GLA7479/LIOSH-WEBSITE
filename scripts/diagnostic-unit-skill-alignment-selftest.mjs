#!/usr/bin/env node
/**
 * Targeted checks for diagnostic unit → bank skill alignment (offline).
 * npm run test:diagnostic-unit-skill-alignment
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const mod = await import(
  new URL("../utils/adaptive-learning-planner/diagnostic-unit-skill-alignment.js", import.meta.url).href
);
const metaMod = await import(
  new URL("../utils/adaptive-learning-planner/adaptive-planner-metadata-context.js", import.meta.url).href
);

const { resolveDiagnosticUnitSkillAlignment, inferGradeSubskillFromScenarioId } = mod;
const { buildPlannerQuestionMetadataIndex } = metaMod;

function assert(name, cond, detail = "") {
  if (!cond) throw new Error(`${name}${detail ? ` — ${detail}` : ""}`);
}

const metadataIndex = await buildPlannerQuestionMetadataIndex({ rootAbs: ROOT });

assert("infer_g3", inferGradeSubskillFromScenarioId("weak_hebrew_comprehension_g3_7d") === "g3");

let r = resolveDiagnosticUnitSkillAlignment(
  {
    subjectId: "math",
    bucketKey: "fractions",
  },
  { metadataIndex }
);
assert("math_topic_fractions", r.confidence === "inferred_safe" && r.source === "topic_mapping");
assert("math_pair", r.skillId === "math_frac_add_sub" && r.subskillId === "frac_add_sub");

r = resolveDiagnosticUnitSkillAlignment(
  {
    subjectId: "science",
    bucketKey: "experiments",
  },
  { metadataIndex }
);
assert("science_topic", r.skillId === "experiments" && r.subskillId === "sci_experiments_general");

r = resolveDiagnosticUnitSkillAlignment(
  {
    subjectId: "geometry",
    diagnosis: { taxonomyId: "G-03" },
  },
  { metadataIndex }
);
assert("geometry_taxonomy", r.skillId === "geo_rect_area_plan" && r.confidence === "inferred_safe");

r = resolveDiagnosticUnitSkillAlignment(
  {
    subjectId: "english",
    skillId: "en_grammar_be_present",
    subskillId: "be_basic",
  },
  { allowEnglishSkillRouting: true, metadataIndex }
);
assert("english_explicit", r.confidence === "exact" && r.source === "unit_field");

r = resolveDiagnosticUnitSkillAlignment(
  {
    subjectId: "english",
    questionMetadata: { skillId: "invalid_english_skill_xyz", subskillId: "nope" },
  },
  { allowEnglishSkillRouting: true, metadataIndex }
);
assert("english_bad_meta", r.confidence === "missing");

r = resolveDiagnosticUnitSkillAlignment(
  { subjectId: "english", displayName: "Grammar" },
  { metadataIndex }
);
assert("english_no_align", r.confidence === "missing" && r.source === "none");

r = resolveDiagnosticUnitSkillAlignment(
  { subjectId: "math", skillId: "math_mul", subskillId: "mul" },
  { metadataIndex }
);
assert("explicit_math", r.confidence === "exact" && r.source === "unit_field");

r = resolveDiagnosticUnitSkillAlignment(
  { subjectId: "math", skillId: "not_a_real_math_skill_id", subskillId: "x" },
  { metadataIndex }
);
assert("invalid_explicit", r.confidence === "missing" && r.warnings.some((w) => w.startsWith("alignment_invalid_taxonomy")));

r = resolveDiagnosticUnitSkillAlignment(
  { subjectId: "hebrew", bucketKey: "comprehension" },
  { scenarioId: "weak_hebrew_comprehension_g3_7d", metadataIndex }
);
assert("hebrew_archive_topic", r.skillId === "hebrew_archive_comprehension" && r.subskillId === "g3");

r = resolveDiagnosticUnitSkillAlignment(
  { subjectId: "english", skillId: "en_grammar_be_present", subskillId: "be_basic" },
  { allowEnglishSkillRouting: false, metadataIndex }
);
assert("english_blocked_without_flag", r.confidence === "missing");

console.log("OK — diagnostic-unit-skill-alignment selftest");
