#!/usr/bin/env node
/** npm run qa:learning-simulator:probes */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT = join(ROOT, "reports", "learning-simulator", "engine-professionalization", "probe-engine-summary.json");
const OUT_MD = join(ROOT, "reports", "learning-simulator", "engine-professionalization", "probe-engine-summary.md");

async function main() {
  await mkdir(join(ROOT, "reports", "learning-simulator", "engine-professionalization"), { recursive: true });
  const mod = await import(pathToFileURL(join(ROOT, "utils/learning-diagnostics/probe-engine-v1.js")).href);
  const { buildProbeRecommendationsV1 } = mod;

  const thin = buildProbeRecommendationsV1({ thinData: "true", targetSubjectId: "math" });
  if (!thin.probes.some((p) => p.probeType === "collect_more_data")) throw new Error("thin_data probe");

  const misc = buildProbeRecommendationsV1({
    suspectedMisconception: "denominator vs numerator swap",
    targetSubjectId: "math",
    targetSkillId: "fractions",
  });
  if (!misc.probes.some((p) => p.probeType === "misconception_confirmation")) {
    throw new Error("misconception probe");
  }

  const pre = buildProbeRecommendationsV1({
    prerequisiteUncertainty: "prereq strength unclear",
    targetSubjectId: "math",
    prerequisiteSkillId: "number_sense",
  });
  if (!pre.probes.some((p) => p.probeType === "prerequisite_check")) throw new Error("prerequisite probe");

  const adv = buildProbeRecommendationsV1({
    strongMasterySignal: true,
    strongMasterySubjectId: "math",
    strongMasterySkillId: "arithmetic_operations",
  });
  if (!adv.probes.some((p) => p.probeType === "challenge_advance")) throw new Error("challenge probe");

  const clin = JSON.stringify({ thin, misc, pre, adv }).toLowerCase();
  const banned = ["dyslexia", "adhd", "dyscalculia", "disorder"];
  for (const b of banned) {
    if (clin.includes(b)) throw new Error(`clinical term leak: ${b}`);
  }

  const summary = {
    status: "PASS",
    generatedAt: new Date().toISOString(),
    checks: ["thin_collect_more", "misconception_confirmation", "prerequisite_check", "challenge_advance", "no_clinical_terms"],
  };
  await writeFile(OUT, JSON.stringify(summary, null, 2), "utf8");
  await writeFile(OUT_MD, `# Probe engine QA\n\nPASS\n`, "utf8");
  console.log("PASS: probe-engine QA");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
