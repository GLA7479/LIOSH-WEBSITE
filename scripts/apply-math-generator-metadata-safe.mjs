#!/usr/bin/env node
/**
 * Records completion of math metadata integration (runtime attach + generator finalize).
 * Does not patch files — integration lives in `utils/math-question-metadata.js` + `utils/math-question-generator.js`.
 *
 * npm run qa:math-metadata:apply-safe
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const REPORT_DIR = join(ROOT, "reports", "question-metadata-qa");
const OUT_JSON = join(REPORT_DIR, "math-generator-metadata-apply-report.json");
const OUT_MD = join(REPORT_DIR, "math-generator-metadata-apply-report.md");

function main() {
  const metaJs = join(ROOT, "utils", "math-question-metadata.js");
  const genJs = join(ROOT, "utils", "math-question-generator.js");

  const integrationPresent =
    existsSync(metaJs) &&
    existsSync(genJs);

  const report = {
    version: 1,
    generatedAt: new Date().toISOString(),
    mode: "documentation_gate",
    integration: {
      helperModule: "utils/math-question-metadata.js",
      generatorHooks: "utils/math-question-generator.js → finalizeMathQuestionOutput on all exit paths",
      integrationPresent,
    },
    appliedChangesSummary: [
      "attachProfessionalMathMetadata merges professional diagnostic fields onto each generated question object.",
      "Preserves question/correctAnswer/answers — metadata only.",
    ],
    filesExpectedToExist: [metaJs, genJs],
  };

  mkdirSync(REPORT_DIR, { recursive: true });
  writeFileSync(OUT_JSON, JSON.stringify(report, null, 2), "utf8");

  const md = [
    "# Math generator metadata apply (safe integration)",
    "",
    `- **Verified helper + generator exist:** ${integrationPresent ? "yes" : "no"}`,
    "",
    "## Integration",
    "",
    `- ${report.integration.helperModule}`,
    `- ${report.integration.generatorHooks}`,
    "",
  ].join("\n");

  writeFileSync(OUT_MD, md, "utf8");

  console.log("");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`  Math metadata integration recorded — helper+generator: ${integrationPresent}`);
  console.log(`  Report: ${OUT_JSON}`);
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("");

  process.exit(integrationPresent ? 0 : 1);
}

main();
