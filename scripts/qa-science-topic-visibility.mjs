/**
 * Config-level Science topic visibility — SCIENCE_GRADES[].topics + conservative curriculum map.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const modUrl = (rel) => pathToFileURL(join(ROOT, rel)).href;

const {
  assertAllScienceGradesTopicPolicy,
  assertAllScienceCurriculumPlacements,
} = await import(modUrl("utils/science-grade-topic-policy.js"));

const a = assertAllScienceGradesTopicPolicy();
const b = assertAllScienceCurriculumPlacements();

const merged = {
  ok: a.ok && b.ok,
  violations: [...a.violations, ...b.violations],
};

console.log(JSON.stringify(merged, null, 2));
if (!merged.ok) {
  console.error("qa-science-topic-visibility: FAILED");
  process.exit(1);
}
console.log("qa-science-topic-visibility: OK");
