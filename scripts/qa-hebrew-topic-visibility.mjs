/**
 * Config-level Hebrew topic visibility — GRADES[].topics must satisfy closure policy.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const modUrl = (rel) => pathToFileURL(join(ROOT, rel)).href;

const { assertAllGradesTopicPolicy } = await import(modUrl("utils/hebrew-grade-topic-policy.js"));

const r = assertAllGradesTopicPolicy();
console.log(JSON.stringify(r, null, 2));
if (!r.ok) {
  console.error("qa-hebrew-topic-visibility: FAILED");
  process.exit(1);
}
console.log("qa-hebrew-topic-visibility: OK");
