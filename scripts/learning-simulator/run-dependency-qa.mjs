#!/usr/bin/env node
/** npm run qa:learning-simulator:dependencies */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT = join(ROOT, "reports/learning-simulator/engine-professionalization/dependency-engine-summary.json");
const OUT_MD = join(ROOT, "reports/learning-simulator/engine-professionalization/dependency-engine-summary.md");

async function main() {
  await mkdir(join(ROOT, "reports/learning-simulator/engine-professionalization"), { recursive: true });
  const { analyzePrerequisiteGap, getDependencyNode } = await import(
    pathToFileURL(join(ROOT, "utils/learning-diagnostics/dependency-engine-v1.js")).href
  );
  const { computeMasteryRollupV1 } = await import(pathToFileURL(join(ROOT, "utils/learning-diagnostics/mastery-engine-v1.js")).href);

  const node = getDependencyNode("math", "fractions");
  if (!node.prerequisiteSkillIds.length) throw new Error("expected prereqs for fractions");

  const mastery = computeMasteryRollupV1(
    {
      math: {
        [`fractions\u0001learning\u0001g3\u0001easy`]: {
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

  const gap = analyzePrerequisiteGap({ mastery, subjectId: "math", skillId: "fractions" });
  if (!gap.doNotConclude.length) throw new Error("doNotConclude");

  await writeFile(OUT, JSON.stringify({ status: "PASS", gap, node }, null, 2), "utf8");
  await writeFile(OUT_MD, `# Dependency engine QA\n\nPASS\n`, "utf8");
  console.log("PASS: dependency-engine QA");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
