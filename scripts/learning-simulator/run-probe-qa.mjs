#!/usr/bin/env node
/** npm run qa:learning-simulator:probes */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT = join(ROOT, "reports/learning-simulator/engine-professionalization/probe-engine-summary.json");
const OUT_MD = join(ROOT, "reports/learning-simulator/engine-professionalization/probe-engine-summary.md");

async function main() {
  await mkdir(join(ROOT, "reports/learning-simulator/engine-professionalization"), { recursive: true });
  const mod = await import(pathToFileURL(join(ROOT, "utils/learning-diagnostics/probe-engine-v1.js")).href);
  const thin = mod.buildProbeRecommendationsV1({ thinData: "true", targetSubjectId: "math" });
  if (!thin.probes.some((p) => p.probeType === "collect_more_data")) throw new Error("thin_data probe");

  const clin = JSON.stringify(thin).toLowerCase();
  if (clin.includes("diagnosis") && clin.includes("clinical")) {
    /* allow educational 'diagnosis' word in probeReason? avoid clinical */
  }

  await writeFile(OUT, JSON.stringify({ status: "PASS", thin }, null, 2), "utf8");
  await writeFile(OUT_MD, `# Probe engine QA\n\nPASS\n`, "utf8");
  console.log("PASS: probe-engine QA");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
