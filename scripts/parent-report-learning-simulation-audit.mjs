import fs from "fs/promises";
import path from "path";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "reports", "parent-report-learning-simulations");
const RAW_RESULTS = path.join(OUT_DIR, "site-rendered-results.json");
const AUDIT_JSON = path.join(OUT_DIR, "simulation-audit.json");
const AUDIT_MD = path.join(OUT_DIR, "simulation-audit.md");
const INDEX_MD = path.join(OUT_DIR, "index.md");

function hasAny(text, list) {
  return list.some((x) => text.includes(x));
}

function evaluate(result) {
  const fails = [];
  const s = result.shortCheck;
  const d = result.detailedCheck;
  const m = result.summaryCheck;
  const allText = [s.bodyText, d.bodyText, m.bodyText].join("\n");
  const enoughEvidenceExpected = !["no_data", "cautious_low_activity"].includes(result.expectedBehavior);

  if (result.expectedBehavior === "no_data") {
    if (!s.noDataState) fails.push("expected_no_data_but_short_has_data_state");
  } else {
    if (s.noDataState) fails.push("short_unexpected_no_data");
    if (d.noDataState) fails.push("detailed_unexpected_no_data");
    if (!s.shortHasContract) fails.push("short_missing_contract_title");
    if (!d.detailedHasTop) fails.push("detailed_missing_parent_summary");
    if (!m.summaryHasTitle) fails.push("summary_missing_print_title");
    if (!d.summaryOrderOk) fails.push("detailed_wrong_summary_order");
  }

  const topOnly = `${d.mainPriority || ""}\n${d.doNow || ""}`;
  if (enoughEvidenceExpected && hasAny(topOnly, ["אין מספיק ראיות", "אין עדיין מספיק פעילות"])) {
    fails.push("enough_evidence_but_insufficient_message");
  }

  if (s.overflow || d.overflow || m.overflow) fails.push("mobile_or_route_horizontal_overflow");
  if (s.forbiddenHits.length || d.forbiddenHits.length || m.forbiddenHits.length) {
    fails.push("forbidden_internal_terms_visible");
  }

  const shortPriority = s.mainPriority || "";
  const detailedPriority = d.mainPriority || "";
  if (shortPriority && detailedPriority && shortPriority !== detailedPriority) {
    fails.push("short_detailed_priority_mismatch");
  }

  if (result.expectedTopSignal === "speed_or_fluency" || result.expectedTopSignal === "speed_behavior") {
    if (hasAny(allText, ["פער ידע"])) fails.push("speed_case_has_knowledge_gap_label");
  }

  if (result.expectedTopSignal === "strength") {
    if (hasAny(topOnly, ["פער ידע", "שיקום"])) fails.push("strong_case_has_remediation_language");
  }

  if (result.expectedBehavior === "trend_up" || result.expectedBehavior === "trend_down_stabilize") {
    if ((result.totalSessions || 0) < 4 || (result.dateSpanDays || 0) < 10) {
      fails.push("trend_case_without_enough_sessions_or_span");
    }
  }

  for (const key of ["short", "detailed", "summary"]) {
    if (!result.pdf?.[key]) fails.push(`missing_pdf_${key}`);
  }

  return {
    pass: fails.length === 0,
    fails,
    actualTopConclusion: d.doNow || d.mainPriority || "",
  };
}

async function main() {
  const raw = JSON.parse(await fs.readFile(RAW_RESULTS, "utf8"));
  const rows = [];
  for (const r of raw.results || []) {
    const verdict = evaluate(r);
    rows.push({
      id: r.id,
      studentName: r.studentName,
      subjects: r.subjects || [],
      totalQuestions: r.totalQuestions || 0,
      totalSessions: r.totalSessions || 0,
      dateSpanDays: r.dateSpanDays || 0,
      expectedBehavior: r.expectedBehavior,
      expectedTopSignal: r.expectedTopSignal,
      actualTopConclusion: verdict.actualTopConclusion,
      pdf: r.pdf,
      screenshots: r.screenshots,
      pass: verdict.pass,
      failures: verdict.fails,
    });
  }

  const passCount = rows.filter((x) => x.pass).length;
  const failCount = rows.length - passCount;
  const enoughEvidenceInsufficient = rows.filter(
    (r) =>
      !["no_data", "cautious_low_activity"].includes(r.expectedBehavior) &&
      r.failures.includes("enough_evidence_but_insufficient_message")
  ).map((x) => x.id);

  const audit = {
    generatedAt: new Date().toISOString(),
    summary: {
      total: rows.length,
      pass: passCount,
      fail: failCount,
      enoughEvidenceStillInsufficient: enoughEvidenceInsufficient,
    },
    students: rows,
  };

  await fs.writeFile(AUDIT_JSON, JSON.stringify(audit, null, 2), "utf8");

  const md = [
    "# Parent Report Learning Simulation Audit",
    "",
    `- Total: ${rows.length}`,
    `- Pass: ${passCount}`,
    `- Fail: ${failCount}`,
    `- Enough-evidence still insufficient: ${enoughEvidenceInsufficient.length ? enoughEvidenceInsufficient.join(", ") : "none"}`,
    "",
    "| Sim ID | Expected | Questions | Sessions | Date Span | Actual Top Conclusion | Status | Failures |",
    "|---|---|---:|---:|---:|---|---|---|",
    ...rows.map(
      (r) =>
        `| ${r.id} | ${r.expectedBehavior} | ${r.totalQuestions} | ${r.totalSessions} | ${r.dateSpanDays} | ${r.actualTopConclusion || "-"} | ${r.pass ? "PASS" : "FAIL"} | ${(r.failures || []).join(", ") || "-"} |`
    ),
    "",
  ].join("\n");
  await fs.writeFile(AUDIT_MD, md, "utf8");

  const index = [
    "# Parent Report Learning Simulations",
    "",
    "| Sim ID | Student profile | Activity volume | Expected behavior | Short PDF | Detailed PDF | Summary PDF | Status |",
    "|---|---|---:|---|---|---|---|---|",
    ...rows.map(
      (r) =>
        `| ${r.id} | ${r.studentName} (${r.subjects.join(", ") || "none"}) | ${r.totalQuestions}q / ${r.totalSessions}s / ${r.dateSpanDays}d | ${r.expectedBehavior} | [short](${r.pdf.short}) | [detailed](${r.pdf.detailed}) | [summary](${r.pdf.summary}) | ${r.pass ? "PASS" : "FAIL"} |`
    ),
    "",
  ].join("\n");
  await fs.writeFile(INDEX_MD, index, "utf8");

  console.log(`Simulation audit complete. pass=${passCount} fail=${failCount}`);
  if (failCount > 0) process.exitCode = 2;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
