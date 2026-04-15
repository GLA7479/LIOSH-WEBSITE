import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const ARTIFACT_DIR = path.join(ROOT, ".tmp", "rollout-artifacts");

export function ensureArtifactDir() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  return ARTIFACT_DIR;
}

/**
 * @param {string} name
 * @param {Record<string, unknown>} payload
 */
export function writeArtifact(name, payload) {
  ensureArtifactDir();
  const target = path.join(ARTIFACT_DIR, `${name}.json`);
  const body = {
    artifact: name,
    generatedAt: new Date().toISOString(),
    ...payload,
  };
  fs.writeFileSync(target, JSON.stringify(body, null, 2), "utf8");
  return target;
}

/**
 * @param {string} name
 */
export function readArtifact(name) {
  const target = path.join(ARTIFACT_DIR, `${name}.json`);
  const raw = fs.readFileSync(target, "utf8");
  return JSON.parse(raw);
}

export function pct(numerator, denominator) {
  return denominator > 0 ? (numerator / denominator) * 100 : 0;
}

/**
 * @param {number} value
 * @param {number} passMin
 * @param {number} failMaxExclusive
 */
export function classifyBand(value, passMin, failMaxExclusive) {
  if (value >= passMin) return "pass";
  if (value < failMaxExclusive) return "fail";
  return "conditional";
}

export default {
  ensureArtifactDir,
  writeArtifact,
  readArtifact,
  pct,
  classifyBand,
};
