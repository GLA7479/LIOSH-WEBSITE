import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "reports", "parent-report-product-contract");
mkdirSync(OUT_DIR, { recursive: true });

function readJsonSafe(path) {
  try {
    return { ok: true, value: JSON.parse(readFileSync(path, "utf8")) };
  } catch (e) {
    return { ok: false, error: e?.message || String(e) };
  }
}

function num(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

const paths = {
  releaseGate: join(OUT_DIR, "release-gate.json"),
  browserQa: join(OUT_DIR, "parent-report-browser-qa.json"),
  readability: join(OUT_DIR, "readability-audit.json"),
  shortConsistency: join(OUT_DIR, "short-vs-detailed-consistency.json"),
  skillCoverage: join(ROOT, "reports", "curriculum-spine", "skill-coverage-summary.json"),
  questionFindings: join(ROOT, "reports", "question-audit", "findings.json"),
};

const release = readJsonSafe(paths.releaseGate);
const browser = readJsonSafe(paths.browserQa);
const readability = readJsonSafe(paths.readability);
const shortConsistency = readJsonSafe(paths.shortConsistency);
const skill = readJsonSafe(paths.skillCoverage);
const question = readJsonSafe(paths.questionFindings);

const checks = [
  {
    id: "automated_release_gate_pass",
    pass: release.ok && String(release.value?.automated_release_gate || "") === "PASS",
    details: release.ok ? release.value?.automated_release_gate : release.error,
  },
  {
    id: "seeded_browser_qa_pass",
    pass: browser.ok && String(browser.value?.valid_seeded_browser_qa?.status || "") === "PASS",
    details: browser.ok ? browser.value?.valid_seeded_browser_qa?.status : browser.error,
  },
  {
    id: "edge_browser_qa_pass",
    pass: browser.ok && String(browser.value?.edge_state_browser_qa?.status || "") === "PASS",
    details: browser.ok ? browser.value?.edge_state_browser_qa?.status : browser.error,
  },
  {
    id: "readability_10_10",
    pass:
      readability.ok &&
      num(readability.value?.summary?.pass, -1) === 10 &&
      num(readability.value?.summary?.fail, 1) === 0,
    details: readability.ok ? readability.value?.summary : readability.error,
  },
  {
    id: "short_consistency_10_10",
    pass:
      shortConsistency.ok &&
      num(shortConsistency.value?.summary?.passCount, -1) === 10 &&
      num(shortConsistency.value?.summary?.failCount, 1) === 0,
    details: shortConsistency.ok ? shortConsistency.value?.summary : shortConsistency.error,
  },
  {
    id: "zero_uncertain_skills_are_zero",
    pass:
      skill.ok &&
      num(skill.value?.coverage_class_counts?.zero, 1) === 0 &&
      num(skill.value?.coverage_class_counts?.uncertain, 1) === 0,
    details: skill.ok ? skill.value?.coverage_class_counts : skill.error,
  },
  {
    id: "question_critical_misses_zero",
    pass:
      question.ok &&
      num(question.value?.exactDuplicateCrossGradeStaticBanksOnly?.length, 1) === 0 &&
      num(question.value?.stage2Summary?.mathKindsNotHitSample, 1) === 0 &&
      num(question.value?.stage2Summary?.geoKindsNotHitSample, 1) === 0,
    details: question.ok
      ? {
          exactDuplicateCrossGradeStaticBanksOnly: num(
            question.value?.exactDuplicateCrossGradeStaticBanksOnly?.length,
            0
          ),
          mathKindsNotHitSample: num(question.value?.stage2Summary?.mathKindsNotHitSample, 0),
          geoKindsNotHitSample: num(question.value?.stage2Summary?.geoKindsNotHitSample, 0),
        }
      : question.error,
  },
];

const readyForLimited = checks.every((c) => c.pass);
const result = {
  generatedAt: new Date().toISOString(),
  limited_test_gate: readyForLimited ? "READY_FOR_LIMITED_TEST" : "NOT_READY_FOR_LIMITED_TEST",
  release_level: "NOT_READY_FOR_RELEASE",
  checks,
};

writeFileSync(join(OUT_DIR, "limited-test-gate.json"), JSON.stringify(result, null, 2), "utf8");

const md = [];
md.push("# Parent Report Limited Test Gate");
md.push("");
md.push(`- limited_test_gate: **${result.limited_test_gate}**`);
md.push(`- release_level: **${result.release_level}**`);
md.push("");
md.push("## Checks");
for (const c of checks) {
  md.push(`- [${c.pass ? "x" : " "}] ${c.id}`);
}
md.push("");
md.push("## Details");
for (const c of checks) {
  md.push(`### ${c.id}`);
  md.push(`- status: ${c.pass ? "PASS" : "FAIL"}`);
  md.push(`- details: \`${JSON.stringify(c.details)}\``);
}
writeFileSync(join(OUT_DIR, "limited-test-gate.md"), md.join("\n"), "utf8");

if (!readyForLimited) process.exitCode = 2;
console.log(`parent-report-limited-test-gate: ${result.limited_test_gate}`);
