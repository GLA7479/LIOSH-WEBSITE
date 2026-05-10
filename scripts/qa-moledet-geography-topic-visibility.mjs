/**
 * Moledet/Geography — curriculum.js topics vs constants + conservative curriculum map placement.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const modUrl = (rel) => pathToFileURL(join(ROOT, rel)).href;

const {
  assertMoledetGeographyCurriculumTopicsMatchData,
  assertAllMoledetGeographyCurriculumPlacements,
} = await import(modUrl("utils/moledet-geography-grade-topic-policy.js"));

const a = assertMoledetGeographyCurriculumTopicsMatchData();
const b = assertAllMoledetGeographyCurriculumPlacements();

const merged = {
  ok: a.ok && b.ok,
  violations: [...a.violations, ...b.violations],
};

console.log(JSON.stringify(merged, null, 2));
if (!merged.ok) {
  console.error("qa-moledet-geography-topic-visibility: FAILED");
  process.exit(1);
}
console.log("qa-moledet-geography-topic-visibility: OK");
