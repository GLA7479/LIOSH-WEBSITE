#!/usr/bin/env node
/**
 * Aggregates engine-layer gate status into a single artifact.
 * npm run qa:learning-simulator:engine-completion-summary
 */
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");

const PATHS = {
  engineTruth: join(ROOT, "reports", "learning-simulator", "engine-truth", "engine-truth-summary.json"),
  realScenario: join(ROOT, "reports", "learning-simulator", "engine-completion", "real-scenario-framework-validation.json"),
  orchestrator: join(ROOT, "reports", "learning-simulator", "orchestrator", "run-summary.json"),
  outJson: join(ROOT, "reports", "learning-simulator", "engine-completion", "engine-completion-summary.json"),
  outMd: join(ROOT, "reports", "learning-simulator", "engine-completion", "engine-completion-summary.md"),
};

async function readJsonSafe(p) {
  try {
    return JSON.parse(await readFile(p, "utf8"));
  } catch {
    return null;
  }
}

export async function writeEngineCompletionSummary(root = ROOT) {
  await mkdir(join(root, "reports", "learning-simulator", "engine-completion"), { recursive: true });

  const engineTruth = await readJsonSafe(join(root, "reports", "learning-simulator", "engine-truth", "engine-truth-summary.json"));
  const realScenario = await readJsonSafe(
    join(root, "reports", "learning-simulator", "engine-completion", "real-scenario-framework-validation.json")
  );
  const orchestrator = await readJsonSafe(join(root, "reports", "learning-simulator", "orchestrator", "run-summary.json"));

  let fwMod = null;
  try {
    const url = pathToFileURL(join(root, "utils", "learning-diagnostics", "diagnostic-framework-v1.js")).href;
    fwMod = await import(url);
  } catch {
    fwMod = null;
  }

  const subjectsCovered = fwMod?.PROFESSIONAL_FRAMEWORK_V1?.supportedSubjectIds || [];
  const engineTruthPass = engineTruth?.overallPass === "PASS";
  const realPass = realScenario?.overallPass === true;
  const releasePass = orchestrator?.pass === true && orchestrator?.mode === "full";

  const remainingGaps = [
    "Parent-facing Hebrew copy and PDF presentation are intentionally unchanged in engine-only phases.",
    "sessionsApprox remains null until standardized session linkage on rows.",
    "Taxonomy bridge IDs may still use internal bucket keys as topicId.",
  ];

  const engineLayerClosed =
    engineTruthPass &&
    realPass &&
    subjectsCovered.length >= 6 &&
    subjectsCovered.includes("moledet-geography");

  const generatedAt = new Date().toISOString();

  const payload = {
    generatedAt,
    engineTruthAudit: {
      status: engineTruthPass ? "PASS" : engineTruth ? "FAIL" : "unknown",
      source: "reports/learning-simulator/engine-truth/engine-truth-summary.json",
    },
    professionalFramework: {
      version: fwMod?.PROFESSIONAL_FRAMEWORK_V1?.version ?? null,
      subjectsCovered,
    },
    realScenarioFrameworkValidation: {
      status: realScenario ? (realPass ? "PASS" : "FAIL") : "unknown",
      source: "reports/learning-simulator/engine-completion/real-scenario-framework-validation.json",
    },
    diagnosticFrameworkQa: {
      note: "Run `npm run qa:learning-simulator:diagnostic-framework` — included in full orchestrator after engine truth.",
    },
    releaseOrchestrator: {
      lastFullRunPass: releasePass || null,
      source: orchestrator ? "reports/learning-simulator/orchestrator/run-summary.json" : null,
    },
    buildStatus: {
      note: "Verify with `npm run build` — executed inside full orchestrator.",
    },
    engineLayerClosed,
    remainingGaps,
  };

  const outJson = join(root, "reports", "learning-simulator", "engine-completion", "engine-completion-summary.json");
  const outMd = join(root, "reports", "learning-simulator", "engine-completion", "engine-completion-summary.md");

  await writeFile(outJson, JSON.stringify(payload, null, 2), "utf8");

  const md = [
    "# Engine completion summary",
    "",
    `- Generated at: ${generatedAt}`,
    `- **Engine layer closed (criteria met):** ${engineLayerClosed ? "yes" : "no"}`,
    "",
    "## Gates",
    "",
    `- Engine Truth audit: **${payload.engineTruthAudit.status}**`,
    `- Real scenario framework validation: **${payload.realScenarioFrameworkValidation.status}**`,
    `- Professional Framework subjects: **${subjectsCovered.join(", ") || "—"}**`,
    `- Full orchestrator last run (if present): **${releasePass ? "PASS" : orchestrator ? "FAIL" : "unknown"}**`,
    "",
    "## Remaining gaps",
    "",
    ...remainingGaps.map((g) => `- ${g}`),
    "",
  ].join("\n");

  await writeFile(outMd, md, "utf8");
  console.log(`Wrote ${outJson}`);
  return payload;
}

function ranAsCli() {
  const a = process.argv[1];
  if (!a) return false;
  const norm = a.replace(/\\/g, "/");
  return norm.includes("run-engine-completion-summary.mjs");
}

if (ranAsCli()) {
  writeEngineCompletionSummary(ROOT).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
