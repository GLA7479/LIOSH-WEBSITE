#!/usr/bin/env node
/**
 * Expert Review Pack — artifact-only builder (writes under reports/). Logic lives in utils/expert-review-pack-artifact-snapshot.js.
 * For full professionalEngineV1 replay + rich aggregates, run:
 *   npm run qa:learning-simulator:expert-review-pack
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { buildExpertReviewPackSnapshot } from "../../utils/expert-review-pack-artifact-snapshot.js";

function buildIndexMarkdownForDisk(manifest, summary) {
  const lines = [
    "# Professional engine — Expert Review Pack",
    "",
    "**Disclaimer:** This is an internal educational diagnostic support review artifact. It is **not** a clinical or medical diagnosis. It is **not** a parent-facing report.",
    "",
    `> **Pack built from artifacts only** (\`${manifest.generationMode}\`). For the full engine replay pack, run \`npm run qa:learning-simulator:expert-review-pack\` locally.`,
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
  ];
  if (manifest.sourceArtifacts.orchestratorRunSummary) {
    lines.push(`- Orchestrator run summary: \`${manifest.sourceArtifacts.orchestratorRunSummary}\``);
  }
  lines.push("");
  return lines.join("\n");
}

/**
 * @param {string} root - repository root
 * @returns {Promise<{ outDir: string, manifest: object, summary: object }>}
 */
export async function generateExpertReviewPackFromArtifacts(root) {
  const OUT_DIR = join(root, "reports/learning-simulator/engine-professionalization/expert-review-pack");
  const SCENARIOS_DIR = join(OUT_DIR, "scenarios");
  await mkdir(SCENARIOS_DIR, { recursive: true });

  const built = await buildExpertReviewPackSnapshot(root);

  const manifestForDisk = { ...built.manifest };
  delete manifestForDisk.deliveryMode;

  const summaryForDisk = { ...built.summary };
  delete summaryForDisk.deliveryMode;

  for (const sc of built.scenarios) {
    await writeFile(join(SCENARIOS_DIR, `${sc.scenarioId}.json`), sc.json, "utf8");
    await writeFile(join(SCENARIOS_DIR, `${sc.scenarioId}.md`), sc.markdown, "utf8");
  }

  const indexMd = buildIndexMarkdownForDisk(manifestForDisk, summaryForDisk);

  await writeFile(join(OUT_DIR, "manifest.json"), JSON.stringify(manifestForDisk, null, 2), "utf8");
  await writeFile(join(OUT_DIR, "summary.json"), JSON.stringify(summaryForDisk, null, 2), "utf8");
  await writeFile(join(OUT_DIR, "summary.md"), built.summaryMarkdown, "utf8");
  await writeFile(join(OUT_DIR, "index.md"), indexMd, "utf8");

  return { outDir: OUT_DIR, manifest: manifestForDisk, summary: summaryForDisk };
}
