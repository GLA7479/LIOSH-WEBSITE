#!/usr/bin/env node
/** npm run qa:learning-simulator:dependencies */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT = join(ROOT, "reports", "learning-simulator", "engine-professionalization", "dependency-engine-summary.json");
const OUT_MD = join(ROOT, "reports", "learning-simulator", "engine-professionalization", "dependency-engine-summary.md");

const SEP = "\u0001";

async function main() {
  await mkdir(join(ROOT, "reports", "learning-simulator", "engine-professionalization"), { recursive: true });
  const { analyzePrerequisiteGap, getDependencyNode } = await import(
    pathToFileURL(join(ROOT, "utils/learning-diagnostics/dependency-engine-v1.js")).href
  );
  const { computeMasteryRollupV1 } = await import(pathToFileURL(join(ROOT, "utils/learning-diagnostics/mastery-engine-v1.js")).href);

  const node = getDependencyNode("math", "fractions");
  if (!node.prerequisiteSkillIds.length) throw new Error("expected prereqs for fractions");

  const masterySparse = computeMasteryRollupV1(
    {
      math: {
        [`fractions${SEP}learning${SEP}g3${SEP}easy`]: {
          questions: 20,
          correct: 8,
          accuracy: 40,
          wrong: 12,
          lastSessionMs: Date.now(),
        },
      },
    },
    { mathQuestions: 20 }
  );

  const gapSparse = analyzePrerequisiteGap({ mastery: masterySparse, subjectId: "math", skillId: "fractions" });
  if (!gapSparse.doNotConclude.length) throw new Error("doNotConclude");
  if (!gapSparse.suspectedPrerequisiteGap && !gapSparse.suspectedDirectSkillGap) throw new Error("expected gap signal");
  if (!String(gapSparse.doNotConclude.join(" ")).toLowerCase().includes("subject")) {
    throw new Error("should warn against subject-wide weakness from one dependency");
  }

  const masteryDirect = computeMasteryRollupV1(
    {
      math: {
        [`fractions${SEP}learning${SEP}g3${SEP}easy`]: {
          questions: 22,
          correct: 9,
          accuracy: 41,
          wrong: 13,
          lastSessionMs: Date.now(),
        },
        [`addition${SEP}learning${SEP}g3${SEP}easy`]: {
          questions: 35,
          correct: 32,
          accuracy: 91,
          wrong: 3,
          lastSessionMs: Date.now(),
        },
        [`number_sense${SEP}learning${SEP}g3${SEP}easy`]: {
          questions: 30,
          correct: 28,
          accuracy: 93,
          wrong: 2,
          lastSessionMs: Date.now(),
        },
      },
    },
    { mathQuestions: 87 }
  );
  const gapDirect = analyzePrerequisiteGap({ mastery: masteryDirect, subjectId: "math", skillId: "fractions" });
  if (!gapDirect.suspectedDirectSkillGap) throw new Error("weak advanced + strong prereqs → direct skill gap");
  if (gapDirect.suspectedPrerequisiteGap) throw new Error("should not flag prerequisite gap when prereqs look strong");
  const sid = gapDirect.skillId || gapDirect.blockedSkillId;
  if (sid !== "fractions") throw new Error("skill id on gap object");

  const masteryPrereq = computeMasteryRollupV1(
    {
      math: {
        [`fractions${SEP}learning${SEP}g3${SEP}easy`]: {
          questions: 24,
          correct: 9,
          accuracy: 38,
          wrong: 15,
          lastSessionMs: Date.now(),
        },
      },
    },
    { mathQuestions: 24 }
  );
  const gapPrereq = analyzePrerequisiteGap({ mastery: masteryPrereq, subjectId: "math", skillId: "fractions" });
  if (!gapPrereq.suspectedPrerequisiteGap) throw new Error("missing prereq rows → prerequisite uncertainty");
  if (!gapPrereq.nextBestPrerequisiteToCheck) throw new Error("should recommend a prerequisite probe target");

  await writeFile(
    OUT,
    JSON.stringify(
      {
        status: "PASS",
        samples: { gapSparse, gapDirect, gapPrereq, node },
        checks: [
          "sparse_gap_signals",
          "no_subject_wide_from_single_edge",
          "direct_gap_strong_prereqs",
          "prerequisite_gap_missing_prereq_rows",
        ],
        generatedAt: new Date().toISOString(),
      },
      null,
      2
    ),
    "utf8"
  );
  await writeFile(OUT_MD, `# Dependency engine QA\n\nPASS\n`, "utf8");
  console.log("PASS: dependency-engine QA");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
