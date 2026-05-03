#!/usr/bin/env node
/**
 * One-shot: apply safe science metadata from enrichment suggestions.
 * Does not change stems, options, or correct indices.
 *
 * Run: npx tsx scripts/apply-science-metadata-safe.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const scienceMainPath = join(ROOT, "data", "science-questions.js");
const sciencePhase3Path = join(ROOT, "data", "science-questions-phase3.js");
const reportDir = join(ROOT, "reports", "question-metadata-qa");
const reportPath = join(reportDir, "science-metadata-apply-report.json");

async function main() {
  const { SCIENCE_QUESTIONS } = await import(new URL("../data/science-questions.js", import.meta.url).href);
  const { SCIENCE_QUESTIONS_PHASE3 } = await import(new URL("../data/science-questions-phase3.js", import.meta.url).href);

  const sugMod = await import(
    new URL("../utils/question-metadata-qa/question-metadata-enrichment-suggestions.js", import.meta.url).href
  );
  const { generateScienceSuggestions } = sugMod;

  const { suggestions } = generateScienceSuggestions();
  /** @type {Map<string, object>} */
  const byId = new Map(suggestions.map((s) => [s.questionId, s]));

  const mainLen = SCIENCE_QUESTIONS.length - SCIENCE_QUESTIONS_PHASE3.length;
  if (mainLen < 0 || mainLen > SCIENCE_QUESTIONS.length) {
    throw new Error("Unexpected SCIENCE_QUESTIONS / PHASE3 length split");
  }

  let rowsTouched = 0;
  let prereqSkippedSequential = 0;
  let prereqAppliedExplicit = 0;
  const fieldCounts = {
    paramsSubtype: 0,
    paramsCognitiveLevel: 0,
    paramsExpectedErrorTypes: 0,
    paramsDifficultyCanonical: 0,
    paramsPrerequisiteSkillIds: 0,
  };

  for (const q of SCIENCE_QUESTIONS) {
    const id = q.id != null ? String(q.id) : "";
    const sug = byId.get(id);
    if (!sug) continue;

    const conf = sug.confidence;
    const seq = !!sug.sequentialPrereqHeuristic;
    const suggested = sug.suggested || {};

    if (!q.params || typeof q.params !== "object") {
      q.params = {};
    } else {
      q.params = { ...q.params };
    }

    const hasPatternOrConcept = !!(q.params.patternFamily || q.params.conceptTag);
    if (!hasPatternOrConcept && suggested.subskillId) {
      q.params.subtype = suggested.subskillId;
      fieldCounts.paramsSubtype += 1;
    }

    if (suggested.cognitiveLevel) {
      q.params.cognitiveLevel = suggested.cognitiveLevel;
      fieldCounts.paramsCognitiveLevel += 1;
    }

    if (Array.isArray(suggested.expectedErrorTypes) && suggested.expectedErrorTypes.length > 0) {
      q.params.expectedErrorTypes = [...suggested.expectedErrorTypes];
      fieldCounts.paramsExpectedErrorTypes += 1;
    }

    if (suggested.difficulty) {
      q.params.difficulty = suggested.difficulty;
      fieldCounts.paramsDifficultyCanonical += 1;
    }

    const prereqIds = Array.isArray(suggested.prerequisiteSkillIds) ? suggested.prerequisiteSkillIds : [];
    if (prereqIds.length > 0 && seq) {
      prereqSkippedSequential += 1;
    }

    let applyPrereq = false;
    if (prereqIds.length > 0 && !seq) {
      if (conf === "low") {
        applyPrereq = false;
      } else if (conf === "medium") {
        applyPrereq = false;
      } else if (conf === "high") {
        const explicitRespiration =
          prereqIds.length === 1 &&
          prereqIds[0] === "sci_body_fact_recall" &&
          (q.params?.diagnosticSkillId === "sci_respiration_concept" || suggested.skillId === "sci_respiration_concept");
        if (explicitRespiration) {
          applyPrereq = true;
          q.params.prerequisiteSkillIds = [...prereqIds];
          fieldCounts.paramsPrerequisiteSkillIds += 1;
          prereqAppliedExplicit += 1;
        }
      }
    }

    rowsTouched += 1;
  }

  const mainPart = SCIENCE_QUESTIONS.slice(0, mainLen);
  const phasePart = SCIENCE_QUESTIONS.slice(mainLen);

  const headerMain = `// grades[] must list only grades where topic appears in SCIENCE_GRADES[g].topics (data/science-curriculum.js).
// Maintainer realignment: node scripts/fix-science-grades-metadata.mjs
// Metadata enrichment (safe pass): subskill via params.subtype when no patternFamily/conceptTag; params.cognitiveLevel; params.expectedErrorTypes; params.difficulty (canonical); prerequisiteSkillIds only for explicit high-confidence respiration link (no sequential-topic guesses).
import { SCIENCE_QUESTIONS_PHASE3 } from "./science-questions-phase3.js";

export const SCIENCE_QUESTIONS = `;

  const footerMain = `.concat(SCIENCE_QUESTIONS_PHASE3);
`;

  const headerPhase = `/**
 * Phase 3 expansion: deeper items for environment, experiments, earth_space
 * (emphasis g5/g6, mostly hard band). Concatenated in science-questions.js.
 * Metadata enrichment applied in same pass as science-questions.js (safe fields only).
 */
export const SCIENCE_QUESTIONS_PHASE3 = `;

  const mainBody = `${JSON.stringify(mainPart, null, 2)}`;
  const phaseBody = `${JSON.stringify(phasePart, null, 2)}`;

  writeFileSync(scienceMainPath, `${headerMain}${mainBody}${footerMain}`, "utf8");
  writeFileSync(sciencePhase3Path, `${headerPhase}${phaseBody};
`, "utf8");

  mkdirSync(reportDir, { recursive: true });
  writeFileSync(
    reportPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        scienceQuestionsTotal: SCIENCE_QUESTIONS.length,
        mainArrayLength: mainLen,
        phase3Length: SCIENCE_QUESTIONS_PHASE3.length,
        rowsTouched,
        prereqSkippedSequential,
        prereqAppliedExplicit,
        fieldCounts,
      },
      null,
      2
    ),
    "utf8"
  );

  console.log(JSON.stringify({ rowsTouched, prereqSkippedSequential, prereqAppliedExplicit, fieldCounts }, null, 2));
  console.log(`Wrote ${scienceMainPath}, ${sciencePhase3Path}, ${reportPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
