#!/usr/bin/env node
/**
 * Phase H — focused Parent AI final QA runner (no new product behavior).
 *
 * Runs the agreed npm scripts in sequence. PDF export requires a reachable Next dev server
 * unless QA_SKIP_PDF=1.
 *
 * Usage:
 *   npm run qa:parent-ai-final
 *   QA_SKIP_PDF=1 npm run qa:parent-ai-final
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

/** @type {string[]} */
const NPM_SCRIPTS = [
  "test:parent-ai-context:consistency",
  "test:parent-report-ai:integration",
  "test:parent-report-ai:scenario-simulator",
  "test:parent-copilot-phase6",
  "test:parent-ai-phase-e:external",
  "test:parent-ai:simulations",
  "test:parent-ai:feedback-aggregate",
  "test:parent-copilot-observability-contract",
];

function runNpm(script) {
  const r = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", ["run", script], {
    cwd: ROOT,
    stdio: "inherit",
    shell: true,
    env: { ...process.env },
  });
  const code = r.status ?? 1;
  if (code !== 0) {
    console.error(`\nparent-ai-final-qa: FAILED at npm run ${script} (exit ${code})\n`);
    process.exit(code);
  }
  console.log(`parent-ai-final-qa: OK — ${script}`);
}

console.log("parent-ai-final-qa: starting focused Parent AI QA suite\n");

for (const s of NPM_SCRIPTS) {
  runNpm(s);
}

if (process.env.QA_SKIP_PDF === "1") {
  console.log("\nparent-ai-final-qa: skipping qa:parent-pdf-export (QA_SKIP_PDF=1)");
} else {
  console.log("\nparent-ai-final-qa: running qa:parent-pdf-export (requires dev server on QA_BASE_URL)\n");
  runNpm("qa:parent-pdf-export");
}

console.log("\nparent-ai-final-qa: running production build\n");
runNpm("build");

console.log("\nparent-ai-final-qa: ALL PASS");
