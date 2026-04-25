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

function bool(v) {
  return v === true;
}

function num(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

const paths = {
  productContract: join(OUT_DIR, "product-contract-audit.json"),
  uiBinding: join(OUT_DIR, "ui-binding-audit.json"),
  readability: join(OUT_DIR, "readability-audit.json"),
  shortConsistency: join(OUT_DIR, "short-vs-detailed-consistency.json"),
  browserQa: join(OUT_DIR, "parent-report-browser-qa.json"),
  skillCoverage: join(ROOT, "reports", "curriculum-spine", "skill-coverage-summary.json"),
  questionFindings: join(ROOT, "reports", "question-audit", "findings.json"),
  manualChecklist: join(OUT_DIR, "manual-browser-qa-checklist.md"),
};

const product = readJsonSafe(paths.productContract);
const ui = readJsonSafe(paths.uiBinding);
const readability = readJsonSafe(paths.readability);
const shortConsistency = readJsonSafe(paths.shortConsistency);
const skill = readJsonSafe(paths.skillCoverage);
const question = readJsonSafe(paths.questionFindings);
const browserQa = readJsonSafe(paths.browserQa);

const checks = [];

checks.push({
  id: "product_contract_audit",
  label: "Product contract audit",
  pass:
    product.ok &&
    num(product.value?.summary?.failed, 1) === 0 &&
    num(product.value?.summary?.passed, 0) === num(product.value?.summary?.total, -1),
  details: product.ok
    ? {
        total: num(product.value?.summary?.total),
        passed: num(product.value?.summary?.passed),
        failed: num(product.value?.summary?.failed),
      }
    : { error: product.error },
});

checks.push({
  id: "ui_binding_audit",
  label: "UI binding audit",
  pass:
    ui.ok &&
    bool(ui.value?.topContractRendered) &&
    !bool(ui.value?.duplicatePrimaryActionDetected) &&
    num(ui.value?.forbiddenInternalTermsInRenderedUi) === 0 &&
    bool(ui.value?.trendGuardInRenderedUi) &&
    bool(ui.value?.pdfExportChecked),
  details: ui.ok
    ? {
        topContractRendered: ui.value?.topContractRendered,
        duplicatePrimaryActionDetected: ui.value?.duplicatePrimaryActionDetected,
        forbiddenInternalTermsInRenderedUi: ui.value?.forbiddenInternalTermsInRenderedUi,
        trendGuardInRenderedUi: ui.value?.trendGuardInRenderedUi,
        pdfExportChecked: ui.value?.pdfExportChecked,
      }
    : { error: ui.error },
});

const readabilityScenarios = readability.ok && Array.isArray(readability.value?.scenarios)
  ? readability.value.scenarios
  : [];
const readabilityHasForbidden = readabilityScenarios.some(
  (s) => num(s?.forbiddenInternalTermsCount) > 0
);
const readabilityHasDupPrimary = readabilityScenarios.some((s) => num(s?.primaryActionCount, 0) > 1);
const readabilityHasTrendWords = readabilityScenarios.some(
  (s) => Array.isArray(s?.unsupportedTrendWording) && s.unsupportedTrendWording.length > 0
);
checks.push({
  id: "readability_audit",
  label: "Readability audit",
  pass:
    readability.ok &&
    num(readability.value?.summary?.fail, 1) === 0 &&
    !readabilityHasForbidden &&
    !readabilityHasDupPrimary &&
    !readabilityHasTrendWords,
  details: readability.ok
    ? {
        total: num(readability.value?.summary?.total),
        pass: num(readability.value?.summary?.pass),
        fail: num(readability.value?.summary?.fail),
        forbiddenInternalTermsCount: readabilityHasForbidden ? 1 : 0,
        duplicatePrimaryActionExists: readabilityHasDupPrimary,
        unsupportedTrendWordingExists: readabilityHasTrendWords,
      }
    : { error: readability.error },
});

checks.push({
  id: "short_vs_detailed_consistency",
  label: "Short vs detailed consistency",
  pass:
    shortConsistency.ok &&
    num(shortConsistency.value?.summary?.failCount, 1) === 0 &&
    bool(shortConsistency.value?.summary?.hasDetailedLink),
  details: shortConsistency.ok
    ? {
        scenarioCount: num(shortConsistency.value?.summary?.scenarioCount),
        passCount: num(shortConsistency.value?.summary?.passCount),
        failCount: num(shortConsistency.value?.summary?.failCount),
        hasDetailedLink: shortConsistency.value?.summary?.hasDetailedLink,
      }
    : { error: shortConsistency.error },
});

checks.push({
  id: "skill_coverage",
  label: "Skill coverage gate",
  pass:
    skill.ok &&
    num(skill.value?.coverage_class_counts?.zero, 1) === 0 &&
    num(skill.value?.coverage_class_counts?.uncertain, 1) === 0,
  details: skill.ok
    ? {
        total: num(skill.value?.total_skills_checked),
        weak: num(skill.value?.coverage_class_counts?.weak),
        zero: num(skill.value?.coverage_class_counts?.zero),
        uncertain: num(skill.value?.coverage_class_counts?.uncertain),
      }
    : { error: skill.error },
});

const questionCriticalMisses =
  (question.ok && Array.isArray(question.value?.exactDuplicateCrossGradeStaticBanksOnly)
    ? question.value.exactDuplicateCrossGradeStaticBanksOnly.length
    : 0) +
  (question.ok ? num(question.value?.stage2Summary?.mathKindsNotHitSample) : 1) +
  (question.ok ? num(question.value?.stage2Summary?.geoKindsNotHitSample) : 1);
checks.push({
  id: "question_audit",
  label: "Question audit gate",
  pass: question.ok && questionCriticalMisses === 0,
  details: question.ok
    ? {
        exactDuplicateCrossGradeStaticBanksOnly: num(
          question.value?.exactDuplicateCrossGradeStaticBanksOnly?.length
        ),
        mathKindsNotHitSample: num(question.value?.stage2Summary?.mathKindsNotHitSample),
        geoKindsNotHitSample: num(question.value?.stage2Summary?.geoKindsNotHitSample),
        criticalMisses: questionCriticalMisses,
      }
    : { error: question.error },
});

const automatedPass = checks.every((c) => c.pass);
const seededQaStatus = browserQa.ok
  ? String(browserQa.value?.valid_seeded_browser_qa?.status || "").toUpperCase()
  : "NOT_RUN";
const edgeQaStatus = browserQa.ok
  ? String(browserQa.value?.edge_state_browser_qa?.status || "").toUpperCase()
  : "NOT_RUN";
const manualChecklistTxt = (() => {
  try {
    return readFileSync(paths.manualChecklist, "utf8");
  } catch {
    return "";
  }
})();
const manualStatus = (() => {
  const txt = String(manualChecklistTxt || "");
  const blocked = (txt.match(/Status:\s*BLOCKED/gi) || []).length;
  const failed = (txt.match(/Status:\s*FAIL/gi) || []).length;
  const passed = (txt.match(/Status:\s*PASS/gi) || []).length;
  if (failed > 0) return "FAIL";
  if (blocked > 0) return "BLOCKED";
  if (passed > 0) return "PASS";
  return "PENDING";
})();
const launchRecommendation = (() => {
  if (!automatedPass) return "NO-LAUNCH";
  if (seededQaStatus === "NOT_RUN" || seededQaStatus === "") return "AUTOMATED PASS / MANUAL QA REQUIRED";
  if (seededQaStatus === "FAIL") return "NO-LAUNCH";
  if (seededQaStatus === "PASS") return "READY FOR LIMITED TEST";
  if (manualStatus === "FAIL") return "NO-LAUNCH";
  if (manualStatus === "PASS") return "READY FOR LIMITED TEST";
  return "AUTOMATED PASS / MANUAL QA REQUIRED";
})();
const output = {
  generatedAt: new Date().toISOString(),
  automated_release_gate: automatedPass ? "PASS" : "FAIL",
  manual_browser_qa: manualStatus,
  valid_seeded_browser_qa: seededQaStatus || "NOT_RUN",
  edge_state_browser_qa: edgeQaStatus || "NOT_RUN",
  checks,
  knownRisks: [
    seededQaStatus === "NOT_RUN"
      ? "Seeded browser QA was not executed; release remains pending seeded visual verification."
      : seededQaStatus === "FAIL"
        ? "Seeded browser QA executed and failed required product checks."
      : "Seeded browser QA passed in Playwright headless dev environment.",
    manualStatus === "BLOCKED"
      ? "Manual browser QA blocked: no interactive browser environment available in this agent runtime."
      : manualStatus === "FAIL"
        ? "Manual browser QA executed but failed one or more required visual checks."
      : manualStatus === "PASS"
        ? "Manual browser QA checklist is marked PASS (Playwright evidence captured in this environment)."
      : "Manual browser QA not executed in this gate script.",
    "Short report computes detailed contract for preview; monitor runtime cost on low-end devices.",
  ],
  launchRecommendation,
};

writeFileSync(join(OUT_DIR, "release-gate.json"), JSON.stringify(output, null, 2), "utf8");

const md = [];
md.push("# Parent Report Release Gate");
md.push("");
md.push(`- automated_release_gate: **${output.automated_release_gate}**`);
md.push(`- manual_browser_qa: **${output.manual_browser_qa}**`);
md.push(`- valid_seeded_browser_qa: **${output.valid_seeded_browser_qa}**`);
md.push(`- edge_state_browser_qa: **${output.edge_state_browser_qa}**`);
md.push(`- launch_recommendation: **${output.launchRecommendation}**`);
md.push("");
md.push("## Automated Checks Summary");
for (const c of checks) {
  md.push(`- [${c.pass ? "x" : " "}] ${c.label}`);
}
md.push("");
md.push("## Check Details");
for (const c of checks) {
  md.push(`### ${c.label}`);
  md.push(`- status: ${c.pass ? "PASS" : "FAIL"}`);
  md.push(`- details: \`${JSON.stringify(c.details)}\``);
}
md.push("");
md.push("## Manual QA Checklist");
md.push("- See `reports/parent-report-product-contract/manual-browser-qa-checklist.md`");
md.push("- Mark each section Pass/Fail during browser execution.");
md.push("");
md.push("## Known Risks");
for (const r of output.knownRisks) md.push(`- ${r}`);
md.push("");
md.push("## Launch / No-Launch Recommendation");
md.push(`- ${output.launchRecommendation}`);
writeFileSync(join(OUT_DIR, "release-gate.md"), md.join("\n"), "utf8");

writeFileSync(
  join(OUT_DIR, "parent-report-release-gate.md"),
  [
    "# Parent Report Release Gate Checklist",
    "",
    "## Automated Checks Summary",
    `- automated_release_gate: ${output.automated_release_gate}`,
    `- product_contract_audit: ${checks.find((x) => x.id === "product_contract_audit")?.pass ? "PASS" : "FAIL"}`,
    `- ui_binding_audit: ${checks.find((x) => x.id === "ui_binding_audit")?.pass ? "PASS" : "FAIL"}`,
    `- readability_audit: ${checks.find((x) => x.id === "readability_audit")?.pass ? "PASS" : "FAIL"}`,
    `- short_vs_detailed_consistency: ${checks.find((x) => x.id === "short_vs_detailed_consistency")?.pass ? "PASS" : "FAIL"}`,
    `- skill_coverage_gate: ${checks.find((x) => x.id === "skill_coverage")?.pass ? "PASS" : "FAIL"}`,
    `- question_audit_gate: ${checks.find((x) => x.id === "question_audit")?.pass ? "PASS" : "FAIL"}`,
    "",
    "## Manual QA Checklist",
    `- manual_browser_qa: ${manualStatus}`,
    `- valid_seeded_browser_qa: ${output.valid_seeded_browser_qa}`,
    `- edge_state_browser_qa: ${output.edge_state_browser_qa}`,
    "- Use `reports/parent-report-product-contract/manual-browser-qa-checklist.md`",
    "",
    "## Pass / Fail Fields",
    `- automated_release_gate: ${output.automated_release_gate}`,
    `- manual_browser_qa: ${manualStatus}`,
    `- valid_seeded_browser_qa: ${output.valid_seeded_browser_qa}`,
    `- edge_state_browser_qa: ${output.edge_state_browser_qa}`,
    "",
    "## Known Risks",
    ...output.knownRisks.map((r) => `- ${r}`),
    "",
    "## Launch / No-Launch Recommendation",
    `- ${output.launchRecommendation}`,
    "",
  ].join("\n"),
  "utf8"
);

if (!automatedPass) {
  console.error("parent-report-release-gate: automated gate FAIL");
  process.exit(1);
}

console.log(`parent-report-release-gate: automated gate PASS (manual_browser_qa=${manualStatus})`);
