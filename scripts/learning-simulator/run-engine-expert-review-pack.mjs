#!/usr/bin/env node
/**
 * Internal Expert Review Pack — educational diagnostic support artifacts only (not clinical; not parent-facing).
 * npm run qa:learning-simulator:expert-review-pack
 */
import { realpathSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { PROFESSIONAL_ENGINE_VALIDATION_SCENARIO_IDS_V1 } from "./lib/engine-truth-golden.mjs";
import {
  getProfessionalValidationScenarios,
  loadProfessionalValidationEngines,
  runProfessionalScenarioPipeline,
} from "./run-professional-engine-validation.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT_DIR = join(ROOT, "reports/learning-simulator/engine-professionalization/expert-review-pack");
const SCENARIOS_DIR = join(OUT_DIR, "scenarios");

/** Positive clinical-condition wording — disclaimers that say "not medical" are allowed. */
const BANNED_PHRASES = ["dyslexia", "dyscalculia", "adhd", "learning disability", "autism spectrum", "psychiatric disorder"];

const DISCLAIMER =
  "**Disclaimer:** This is an internal educational diagnostic support review artifact. It is **not** a clinical or medical diagnosis. It is **not** a parent-facing report.";

function defaultReviewerFields() {
  return {
    agreesWithEngine: null,
    concernLevel: null,
    notes: "",
    suggestedCorrection: "",
    needsEngineChange: null,
    needsQuestionMetadataChange: null,
    needsExpertRuleChange: null,
  };
}

function inferScenarioType(id) {
  if (id.startsWith("strong_")) return "strong_profile";
  if (id.startsWith("weak_")) return "weak_topic_or_subject";
  if (id.startsWith("thin")) return "thin_data";
  if (id.includes("prerequisite")) return "dependency";
  if (id.includes("cross_subject")) return "cross_subject";
  if (id.includes("misconception")) return "misconception";
  if (id.includes("mastery_decay") || id.includes("retention")) return "retention";
  if (id.includes("calibration") || id.includes("difficulty")) return "calibration";
  if (["random_guessing", "fast_wrong", "slow_correct", "inconsistent"].includes(id)) return "reliability_pace";
  if (["improving", "declining", "mixed_strengths"].includes(id)) return "trend_mixed";
  return "synthetic_validation";
}

function subjectsFromMaps(maps) {
  if (!maps || typeof maps !== "object") return [];
  return Object.keys(maps).filter((sid) => maps[sid] && typeof maps[sid] === "object" && Object.keys(maps[sid]).length > 0);
}

function summarizeAggregateRows(maps, summaryCounts) {
  /** @type {object[]} */
  const rows = [];
  for (const sid of subjectsFromMaps(maps)) {
    const tm = maps[sid];
    for (const [key, row] of Object.entries(tm)) {
      if (!row || typeof row !== "object") continue;
      const shortKey = String(key).includes("\u0001") ? String(key).split("\u0001")[0] + " … (graded row)" : key;
      rows.push({
        subjectId: sid,
        rowKeyShort: shortKey,
        questions: row.questions,
        correct: row.correct,
        wrong: row.wrong,
        accuracy: row.accuracy,
        displayName: row.displayName,
        difficultyTier: row.difficultyTier ?? row.matrixDifficulty ?? null,
        lastSessionMs: row.lastSessionMs ?? null,
        trend: row.trend?.accuracyDirection ?? null,
      });
    }
  }
  return {
    summaryCounts,
    topicRows: rows,
    paceNote:
      "Raw mistake timestamps/responseMs (when present) feed reliability/guessing signals in the professional engine.",
  };
}

function collectAllDoNotConclude(prof) {
  const out = [];
  for (const x of prof?.globalDoNotConclude || []) out.push(String(x));
  for (const p of prof?.crossSubjectPatterns?.patterns || []) {
    for (const x of p.doNotConclude || []) out.push(String(x));
  }
  for (const d of prof?.dependencies?.items || []) {
    for (const x of d.doNotConclude || []) out.push(String(x));
  }
  for (const sid of Object.keys(prof?.misconceptions || {})) {
    for (const it of prof.misconceptions[sid]?.items || []) {
      for (const x of it.doNotConclude || []) out.push(String(x));
    }
  }
  for (const f of prof?.skillFindings || []) {
    for (const x of f.doNotConclude || []) out.push(String(x));
  }
  return [...new Set(out)].filter(Boolean);
}

function buildEvidenceAndReasoning(prof) {
  /** @type {object[]} */
  const items = [];
  for (const f of prof?.skillFindings || []) {
    items.push({
      findingType: f.findingType,
      subjectId: f.subjectId,
      skillId: f.skillId,
      subskillId: f.subskillId ?? null,
      topicId: f.topicId ?? null,
      evidenceLevel: f.evidenceLevel,
      confidence: f.confidence,
      basedOn: f.basedOn,
      reasoning: f.reasoning,
      doNotConclude: f.doNotConclude,
      nextAction: f.nextAction,
    });
  }
  for (const d of prof?.dependencies?.items || []) {
    const blocked = d.blockedSkillId || d.skillId;
    const subj =
      (prof?.mastery?.items || []).find((m) => m.skillId === blocked)?.subjectId ||
      (prof?.mastery?.items || []).find((m) => m.skillId === d.skillId)?.subjectId ||
      null;
    items.push({
      findingType: "dependency_hypothesis",
      subjectId: subj,
      skillId: d.skillId || d.blockedSkillId,
      subskillId: null,
      evidenceLevel: "see_mastery",
      confidence: d.confidence,
      basedOn: d.evidence,
      reasoning: d.reasoning,
      doNotConclude: d.doNotConclude,
      nextAction: d.nextBestPrerequisiteToCheck
        ? { type: "prerequisite_probe", target: d.nextBestPrerequisiteToCheck }
        : null,
    });
  }
  return items;
}

function scanBanned(text) {
  const lower = String(text).toLowerCase();
  return BANNED_PHRASES.filter((b) => lower.includes(b));
}

async function readJsonSafe(p) {
  try {
    return JSON.parse(await readFile(p, "utf8"));
  } catch {
    return null;
  }
}

function qaAssert(cond, msg) {
  if (!cond) throw new Error(`Expert review pack QA failed: ${msg}`);
}

export async function generateExpertReviewPack(root = ROOT) {
  await mkdir(SCENARIOS_DIR, { recursive: true });

  const validationArtifact = await readJsonSafe(join(root, "reports/learning-simulator/engine-professionalization/professional-engine-validation.json"));
  qaAssert(validationArtifact?.status === "PASS", "professional-engine-validation.json missing or status !== PASS");
  qaAssert(
    Number(validationArtifact.scenarioCount) === PROFESSIONAL_ENGINE_VALIDATION_SCENARIO_IDS_V1.length,
    `scenarioCount mismatch (validation ${validationArtifact.scenarioCount} vs golden ${PROFESSIONAL_ENGINE_VALIDATION_SCENARIO_IDS_V1.length})`
  );

  const listFromValidation = validationArtifact.scenarioList || [];
  const goldenSet = new Set(PROFESSIONAL_ENGINE_VALIDATION_SCENARIO_IDS_V1);
  for (const id of listFromValidation) qaAssert(goldenSet.has(id), `unexpected scenario id in validation artifact: ${id}`);
  for (const id of PROFESSIONAL_ENGINE_VALIDATION_SCENARIO_IDS_V1) {
    qaAssert(listFromValidation.includes(id), `golden scenario missing from validation artifact: ${id}`);
  }

  const engines = await loadProfessionalValidationEngines(join(root));
  const scenarioDefs = getProfessionalValidationScenarios();
  qaAssert(scenarioDefs.length === PROFESSIONAL_ENGINE_VALIDATION_SCENARIO_IDS_V1.length, "scenario defs vs golden count");
  scenarioDefs.forEach((sc, i) =>
    qaAssert(sc.label === PROFESSIONAL_ENGINE_VALIDATION_SCENARIO_IDS_V1[i], `scenario order/id mismatch at index ${i}: ${sc.label}`)
  );

  const t0 = Date.now();
  const startMs = t0 - 120 * 86400000;
  const endMs = t0 + 86400000;

  /** @type {object[]} */
  const manifestScenarios = [];
  /** @type {object[]} */
  const summaryScenarios = [];

  const validationById = Object.fromEntries((validationArtifact.scenarios || []).map((s) => [s.scenario, s]));

  for (const sc of scenarioDefs) {
    const id = sc.label;
    const prof = runProfessionalScenarioPipeline(sc, engines, startMs, endMs);
    let pass = false;
    try {
      pass = !!sc.assert(prof);
    } catch {
      pass = false;
    }

    const valRow = validationById[id];
    qaAssert(valRow != null, `no validation row for ${id}`);
    qaAssert(valRow.pass === pass, `pass mismatch for ${id} (artifact ${valRow.pass} vs recomputed ${pass})`);

    qaAssert(prof?.engineConfidence != null, `${id}: engineConfidence`);
    qaAssert(prof?.engineReadiness != null, `${id}: engineReadiness`);

    const doNotAll = collectAllDoNotConclude(prof);
    qaAssert(doNotAll.length > 0, `${id}: expected non-empty doNotConclude aggregate`);

    const aggregateSummary = summarizeAggregateRows(sc.maps, sc.summaryCounts);
    const reviewer = defaultReviewerFields();

    const scenarioPayload = {
      scenarioId: id,
      scenarioType: inferScenarioType(id),
      subjects: subjectsFromMaps(sc.maps),
      intendedSignal: sc.expectSummary,
      validation: {
        expectedSummary: sc.expectSummary,
        actualValidationSnapshot: valRow.actual,
        pass,
      },
      rawAndAggregate: aggregateSummary,
      rawMistakesCounts: Object.fromEntries(
        Object.entries(sc.rawMistakesBySubject || {}).map(([k, arr]) => [k, Array.isArray(arr) ? arr.length : 0])
      ),
      professionalEngineV1: prof,
      evidenceAndReasoning: buildEvidenceAndReasoning(prof),
      limitations: {
        engineLayer: prof.limitations || [],
        sparseMetadata:
          "Subskill and misconception precision is limited until question pools carry dense expectedErrorTypes and prerequisiteSkillIds.",
        crossSubjectHeuristic: "Cross-subject patterns are hypotheses and require confirming probes per subject.",
      },
      reviewer,
    };

    const jsonStr = JSON.stringify(scenarioPayload, null, 2);
    const mdText = buildScenarioMarkdown(scenarioPayload, prof);

    const bannedHits = [...scanBanned(jsonStr), ...scanBanned(mdText)];
    qaAssert(bannedHits.length === 0, `banned phrases in ${id}: ${bannedHits.join(", ")}`);

    qaAssert(mdText.includes("## Human reviewer notes"), `${id}: reviewer section missing`);
    qaAssert(mdText.includes("Agree with engine conclusion"), `${id}: reviewer checklist missing`);

    await writeFile(join(SCENARIOS_DIR, `${id}.json`), jsonStr, "utf8");
    await writeFile(join(SCENARIOS_DIR, `${id}.md`), mdText, "utf8");

    manifestScenarios.push({
      scenarioId: id,
      pass,
      files: { markdown: `scenarios/${id}.md`, json: `scenarios/${id}.json` },
    });
    summaryScenarios.push({
      scenarioId: id,
      pass,
      engineConfidence: prof.engineConfidence,
      engineReadiness: prof.engineReadiness,
      expected: sc.expectSummary,
    });
  }

  const engineFinal = await readJsonSafe(join(root, "reports/learning-simulator/engine-professionalization/engine-final-summary.json"));
  const generatedAt = new Date().toISOString();

  const manifest = {
    kind: "expert_review_pack_v1",
    generatedAt,
    status: "PASS",
    scenarioCount: manifestScenarios.length,
    scenarioIds: PROFESSIONAL_ENGINE_VALIDATION_SCENARIO_IDS_V1,
    requiresHumanExpertReview: true,
    sourceArtifacts: {
      professionalEngineValidation: "reports/learning-simulator/engine-professionalization/professional-engine-validation.json",
      engineFinalSummary: engineFinal ? "reports/learning-simulator/engine-professionalization/engine-final-summary.json" : null,
    },
    scenarios: manifestScenarios,
    disclaimer: "Internal educational diagnostic support only — not clinical / not parent-facing.",
  };

  const summaryPayload = {
    generatedAt,
    status: "PASS",
    scenarioCount: summaryScenarios.length,
    requiresHumanExpertReview: true,
    engineFinal: engineFinal
      ? {
          engineFinalStatus: engineFinal.engineFinalStatus,
          engineTechnicallyComplete: engineFinal.engineTechnicallyComplete,
          professionalReadiness: engineFinal.professionalReadiness,
          releaseStatus: engineFinal.releaseStatus,
          knownLimitations: engineFinal.knownLimitations || [],
        }
      : null,
    limitations: [
      ...(engineFinal?.knownLimitations || []),
      "Cross-subject and dependency outputs are heuristic teaching hypotheses.",
      "Sparse expectedErrorTypes / prerequisiteSkillIds on generated questions limit fine-grained misconception and prerequisite mapping.",
    ],
    scenarios: summaryScenarios,
  };

  const indexMd = buildIndexMarkdown(manifest, summaryPayload);

  await writeFile(join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
  await writeFile(join(OUT_DIR, "summary.json"), JSON.stringify(summaryPayload, null, 2), "utf8");
  await writeFile(join(OUT_DIR, "summary.md"), buildSummaryMarkdown(summaryPayload), "utf8");
  await writeFile(join(OUT_DIR, "index.md"), indexMd, "utf8");

  const idxBanned = scanBanned(indexMd + JSON.stringify(manifest) + JSON.stringify(summaryPayload));
  qaAssert(idxBanned.length === 0, `banned phrases in index/summary: ${idxBanned.join(", ")}`);

  return { outDir: OUT_DIR, manifest, summary: summaryPayload };
}

function buildScenarioMarkdown(payload, prof) {
  const pr = prof;
  const lines = [
    `# Scenario: ${payload.scenarioId}`,
    "",
    DISCLAIMER,
    "",
    "## 1. Scenario identity",
    "",
    `- **Scenario id:** \`${payload.scenarioId}\``,
    `- **Scenario type:** ${payload.scenarioType}`,
    `- **Subject(s):** ${payload.subjects.join(", ") || "(none)"}`,
    `- **Intended signal:** ${payload.intendedSignal}`,
    "",
    "## 2. Expected vs actual",
    "",
    `- **Expected:** ${payload.validation.expectedSummary}`,
    `- **Pass / fail (validation):** ${payload.validation.pass ? "PASS" : "FAIL"}`,
    `- **engineConfidence:** ${pr.engineConfidence}`,
    `- **engineReadiness:** ${pr.engineReadiness}`,
    "",
    "### skillFindings (framework) / subskillFindings",
    "",
    "```json",
    JSON.stringify(
      { skillFindings: pr.skillFindings || [], subskillFindings: pr.subskillFindings || [] },
      null,
      2
    ),
    "```",
    "",
    "### Validation artifact snapshot",
    "",
    "```json",
    JSON.stringify(payload.validation.actualValidationSnapshot, null, 2),
    "```",
    "",
    "## 3. Raw / aggregate data summary",
    "",
    "```json",
    JSON.stringify(payload.rawAndAggregate, null, 2),
    "```",
    "",
    `- **Raw mistake events per subject:** ${JSON.stringify(payload.rawMistakesCounts)}`,
    "",
    "## 4. Professional engine output (high level)",
    "",
    `- **Version:** ${pr.version}`,
    `- **globalDoNotConclude (count):** ${(pr.globalDoNotConclude || []).length}`,
    "",
    "### Reliability",
    "",
    "```json",
    JSON.stringify(pr.reliability, null, 2),
    "```",
    "",
    "### Calibration (subjects)",
    "",
    "```json",
    JSON.stringify(pr.calibration?.subjects || [], null, 2),
    "```",
    "",
    "### Mastery items",
    "",
    "```json",
    JSON.stringify(pr.mastery?.items || [], null, 2),
    "```",
    "",
    "### Misconceptions",
    "",
    "```json",
    JSON.stringify(pr.misconceptions || {}, null, 2),
    "```",
    "",
    "### Dependencies",
    "",
    "```json",
    JSON.stringify(pr.dependencies || {}, null, 2),
    "```",
    "",
    "### Probes",
    "",
    "```json",
    JSON.stringify(pr.probes || {}, null, 2),
    "```",
    "",
    "### Cross-subject patterns",
    "",
    "```json",
    JSON.stringify(pr.crossSubjectPatterns || {}, null, 2),
    "```",
    "",
    "## 5. Evidence and reasoning (flattened)",
    "",
    "```json",
    JSON.stringify(payload.evidenceAndReasoning, null, 2),
    "```",
    "",
    "## 6. Limitations",
    "",
    ...payload.limitations.engineLayer.map((x) => `- ${x}`),
    `- ${payload.limitations.sparseMetadata}`,
    `- ${payload.limitations.crossSubjectHeuristic}`,
    "",
    "## 7. Reviewer fields (machine-readable)",
    "",
    "```json",
    JSON.stringify(payload.reviewer, null, 2),
    "```",
    "",
    "## Human reviewer notes",
    "",
    "- **Agree with engine conclusion:** ",
    "- **Concern level:** ",
    "- **Notes:** ",
    "- **Suggested correction:** ",
    "- **Needs engine change:** ",
    "- **Needs metadata change:** ",
    "- **Needs expert rule change:** ",
    "",
  ];
  return lines.join("\n");
}

function buildSummaryMarkdown(payload) {
  const lines = [
    "# Expert Review Pack — summary",
    "",
    DISCLAIMER,
    "",
    `- **Generated:** ${payload.generatedAt}`,
    `- **Status:** ${payload.status}`,
    `- **Scenario count:** ${payload.scenarioCount}`,
    `- **requiresHumanExpertReview:** ${payload.requiresHumanExpertReview}`,
    "",
    "## Engine final (if present)",
    "",
    "```json",
    JSON.stringify(payload.engineFinal, null, 2),
    "```",
    "",
    "## Limitations",
    "",
    ...payload.limitations.map((x) => `- ${x}`),
    "",
    "## Per scenario",
    "",
    ...payload.scenarios.map(
      (s) =>
        `- **${s.scenarioId}** — ${s.pass ? "PASS" : "FAIL"} — confidence ${s.engineConfidence} — readiness ${s.engineReadiness}`
    ),
    "",
  ];
  return lines.join("\n");
}

function buildIndexMarkdown(manifest, summary) {
  const lines = [
    "# Professional engine — Expert Review Pack",
    "",
    DISCLAIMER,
    "",
    `- **Generated:** ${manifest.generatedAt}`,
    `- **Pack status:** ${manifest.status}`,
    `- **Scenarios:** ${manifest.scenarioCount}`,
    `- **requiresHumanExpertReview:** ${manifest.requiresHumanExpertReview}`,
    "",
    "## Contents",
    "",
    "- [summary.md](./summary.md)",
    "- [summary.json](./summary.json)",
    "- [manifest.json](./manifest.json)",
    "",
    "## Scenarios",
    "",
    ...manifest.scenarios.map((s) => `- [${s.scenarioId}](./${s.files.markdown}) — ${s.pass ? "PASS" : "FAIL"}`),
    "",
    "## Source artifacts",
    "",
    `- Professional validation JSON: \`${manifest.sourceArtifacts.professionalEngineValidation}\``,
    manifest.sourceArtifacts.engineFinalSummary
      ? `- Engine final summary: \`${manifest.sourceArtifacts.engineFinalSummary}\``
      : "- Engine final summary: *(not found — run engine-final after validation)*",
    "",
  ];
  return lines.join("\n");
}

async function main() {
  try {
    await generateExpertReviewPack(ROOT);
    console.log("PASS: expert-review-pack");
    console.log(`Wrote: ${OUT_DIR}`);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

function isExpertReviewPackEntrypoint() {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return realpathSync(entry) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}
if (isExpertReviewPackEntrypoint()) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
