/**
 * Phase F — write JSON + Markdown artifacts under reports/parent-ai/simulations/
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = join(__dirname, "..", "..");
export const PHASE_F_SIM_DIR = join(REPO_ROOT, "reports", "parent-ai", "simulations");

/**
 * @param {string} baseName
 * @param {Record<string, unknown>} payload
 */
export function writePhaseFArtifacts(baseName, payload) {
  mkdirSync(PHASE_F_SIM_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const jsonPath = join(PHASE_F_SIM_DIR, `${baseName}-${stamp}.json`);
  const mdPath = join(PHASE_F_SIM_DIR, `${baseName}-${stamp}.md`);
  writeFileSync(jsonPath, JSON.stringify({ generatedAt: new Date().toISOString(), ...payload }, null, 2), "utf8");
  writeFileSync(mdPath, renderMarkdown(baseName, payload), "utf8");
  return { jsonPath, mdPath, stamp };
}

/**
 * @param {string} baseName
 * @param {Record<string, unknown>} payload
 */
function renderMarkdown(baseName, payload) {
  const lines = [];
  lines.push(`# Parent AI simulation — ${baseName}`);
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");

  const summary = payload.summary && typeof payload.summary === "object" ? payload.summary : {};
  lines.push("## Summary");
  lines.push("");
  lines.push(`- scenarios: ${summary.total ?? "—"}`);
  lines.push(`- passed: ${summary.passed ?? "—"}`);
  lines.push(`- failed: ${summary.failed ?? "—"}`);
  lines.push("");

  const scenarios = Array.isArray(payload.scenarios) ? payload.scenarios : [];
  lines.push("## Scenarios");
  lines.push("");
  for (const s of scenarios) {
    const id = String(s.id || "");
    const ok = s.pass === true ? "PASS" : "FAIL";
    lines.push(`### ${id} — ${ok}`);
    lines.push("");
    if (s.utterance) lines.push(`**Utterance:** ${String(s.utterance).slice(0, 200)}`);
    if (Array.isArray(s.failures) && s.failures.length) {
      lines.push("");
      lines.push(`**Failures:** ${s.failures.join(", ")}`);
    }
    if (s.answerExcerpt) {
      lines.push("");
      lines.push("```");
      lines.push(String(s.answerExcerpt).slice(0, 1200));
      lines.push("```");
    }
    lines.push("");
  }

  return lines.join("\n");
}
