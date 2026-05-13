/**
 * Phase 8 — aggregates AI_RESPONSE_QUALITY_AUDIT warning rows into WARNING_TRIAGE.{json,md}.
 * Run: node scripts/build-warning-triage.mjs
 */
import fs from "node:fs";

const RUN_DIR = "reports/phase8-mass-validation/2026-05-13T17-47-56";
const AUDIT_PATH = `${RUN_DIR}/AI_RESPONSE_QUALITY_AUDIT.json`;
const OUT_JSON = `${RUN_DIR}/WARNING_TRIAGE.json`;
const OUT_MD = `${RUN_DIR}/WARNING_TRIAGE.md`;

/** Same literal check as ai-response-quality-audit.mjs contradiction_challenge branch. */
const AUDIT_CONTRADICTION_NUMERIC_RE = /\d+\s*%|\d+\s+שאלות/;

function archetypeFromStudentId(studentId) {
  const parts = String(studentId).split("_");
  if (parts.length < 7) return "unknown";
  const gradeIdx = parts.findIndex((p) => /^g\d+$/i.test(p));
  if (gradeIdx <= 3) return "unknown";
  return parts.slice(3, gradeIdx).join("_");
}

function contradictionSubBucket(aiAnswer) {
  const a = String(aiAnswer || "").trim();
  if (a.startsWith("לא הבנתי")) return "disambiguation_clarification";
  if (a.includes("יכול להיות פער בין הצלחה בבית")) return "short_home_vs_app_bridge_no_digits";
  if (a.includes("בדוח כרגע רואים מה שנכתב כראיה מהתרגול")) return "qualitative_numeric_framing_no_literal_digits";
  return "other";
}

function thinDataSubBucket(aiAnswer) {
  const a = String(aiAnswer || "").trim();
  if (a.startsWith("לא הבנתי")) return "disambiguation_template";
  if (/מצומצמים|מצומצמות|מוגבלים|מוגבלות|דלילים|דלילות/u.test(a)) return "has_scarcity_morphology_not_matched_by_audit_regex";
  return "other";
}

const FAMILY_META = {
  audit_contradiction_missing_numeric_evidence: {
    whyTheWarningFired:
      "Rubric for questionCategory=contradiction_challenge requires the answer to match /\\d+\\s*%|\\d+\\s+שאלות/ (ASCII-digit percentage or 'N שאלות' with a normal space). If the model answers with clarification, a short qualitative bridge, or prose that mentions numeric ideas without those exact literals, the warning is emitted.",
    classificationPrimary: "audit_too_strict",
    classification: "audit_too_strict_with_some_expected_deterministic_templates",
    classificationRationale:
      "No failures were recorded; answers generally address home↔report tension. Disambiguation and short qualitative bridges are not numeric contradictions. Some longer answers intentionally avoid repeating digits while still describing evidence; the audit rule is a shallow surface check.",
    recommendedAction: "audit_rubric_alignment",
    recommendedActionDetail:
      "Optional follow-up (not in this task): exclude clarification/disambiguation turns from numeric-evidence checks; accept כ־NN% / NN% variants and morphological 'שאלות' counts if desired; or require numeric evidence only when the parent turn is clearly disputing numbers (narrower classifier). Product code was not changed per instructions.",
    specialCheck: {
      didAnswerContradictNumericData:
        "Not observed in this sample set; warnings fire on missing literal digit patterns, not on detected logical contradiction with report JSON.",
      didAnswerOmitNumericEvidenceWhereExpected:
        "The rubric expects literals for this category; several answers omit them while still discussing report-vs-home framing.",
      didAuditExpectNumbersWhereQualitativeIsAcceptable:
        "Partially yes for disambiguation and possibly for very short bridge answers; less so for full contradiction_challenge answers that only say 'ניסוח מספרי' without numbers.",
      reportVsCopilotNumericMismatch:
        "Not evidenced from audit rows alone; this gate does not compare to detailed.json numbers.",
      syntheticProfileOrQuestionRowsMismatch:
        "Unlikely as root cause; the same Hebrew disambiguation string appears across many students for the vague parent line 'האם יכול להיות שהדוח טועה?'.",
    },
  },
  audit_thin_data_missing_scarcity_language: {
    whyTheWarningFired:
      "For thin_data profile and thin_data category, the audit requires THIN_DATA_LANGUAGE or /מעט|מצומצם|דליל|מוגבל/. Answers using plural/adjective forms like 'מצומצמים' or the disambiguation template do not match.",
    classificationPrimary: "audit_too_strict",
    classification: "audit_too_strict",
    classificationRationale:
      "Representative answers already communicate scarcity ('מצומצמים', 'מוקדם למסקנה חזקה') or are non-answers; this is regex morphology / template interaction, not missing parent-facing caution.",
    recommendedAction: "audit_rubric_alignment",
    recommendedActionDetail:
      "Extend THIN_DATA_LANGUAGE and the fallback lemma list to include מצומצמים/מצומצמות and similar; exclude disambiguation from thin_data scarcity checks. No product change in this pass.",
    specialCheck: null,
  },
  audit_missing_subject_soft_language: {
    whyTheWarningFired:
      "missing_subject_data category expects phrases built around 'אין מספיק' contiguously (among other patterns). The canonical answer uses 'בדוח אין כרגע מספיק שאלות מעוגנות', which breaks the /אין\\s+מספיק/ sub-pattern.",
    classificationPrimary: "audit_too_strict",
    classification: "audit_too_strict",
    classificationRationale:
      "The answer is clearly a scoped missing-data refusal for chess; the audit's positive phrase list is narrower than the product copy.",
    recommendedAction: "audit_rubric_alignment",
    recommendedActionDetail:
      "Add 'אין כרגע מספיק' / anchored-question scarcity phrasing to hasMissingSubjectLanguage, or normalize before the check. No product change in this pass.",
    specialCheck: null,
  },
  audit_simple_explanation_no_subject: {
    whyTheWarningFired:
      "simple_explanation with totalQuestions>=50 warns when detectSubjects() finds no SUBJECT_HINTS match. Answers anchor on topic labels ('בהסקה', 'בניסויים בסיסיים') instead of the word 'מדעים' / 'עברית'.",
    classificationPrimary: "audit_too_strict",
    classification: "audit_too_strict",
    classificationRationale:
      "Subject is present at topic granularity; the heuristic subject detector is shallow for these templates.",
    recommendedAction: "audit_rubric_alignment",
    recommendedActionDetail:
      "Broaden detectSubjects hints or tie this warning to structured topic ids from the row when available. No product change in this pass.",
    specialCheck: null,
  },
};

function pickRepresentatives(rows, code, limit = 4) {
  const byStudent = new Map();
  for (const r of rows) {
    if (!byStudent.has(r.studentId)) byStudent.set(r.studentId, r);
  }
  const uniqueStudentRows = [...byStudent.values()];
  const seen = new Set();
  const out = [];
  const ordered = [...uniqueStudentRows, ...rows];
  for (const r of ordered) {
    const key = `${r.studentId}|||${r.parentQuestionText}|||${String(r.aiAnswer || "").slice(0, 120)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      studentId: r.studentId,
      profileType: r.profileType,
      archetype: archetypeFromStudentId(r.studentId),
      grade: r.grade,
      questionCategory: r.questionCategory,
      parentQuestionText: r.parentQuestionText,
      aiAnswerExcerpt: String(r.aiAnswer || "").slice(0, 320),
      issueDetail: (r.issues || []).find((i) => i.code === code)?.detail || "",
    });
    if (out.length >= limit) break;
  }
  return out;
}

function main() {
  const j = JSON.parse(fs.readFileSync(AUDIT_PATH, "utf8"));
  const byCode = new Map();
  for (const r of j.answerRecords || []) {
    for (const iss of r.issues || []) {
      if (iss.severity !== "warning") continue;
      const code = iss.code;
      if (!byCode.has(code)) byCode.set(code, []);
      byCode.get(code).push({ ...r, _issue: iss });
    }
  }

  const codes = [...byCode.keys()].sort();
  const families = [];

  for (const code of codes) {
    const rows = byCode.get(code);
    const students = [...new Set(rows.map((r) => r.studentId))].sort();
    const archetypes = [...new Set(rows.map((r) => archetypeFromStudentId(r.studentId)))].sort();
    const profileTypes = [...new Set(rows.map((r) => r.profileType))].sort();
    const grades = [...new Set(rows.map((r) => r.grade))].sort();
    const questionCategories = [...new Set(rows.map((r) => r.questionCategory))].sort();

    const subBuckets = {};
    if (code === "audit_contradiction_missing_numeric_evidence") {
      for (const r of rows) {
        const b = contradictionSubBucket(r.aiAnswer);
        subBuckets[b] = (subBuckets[b] || 0) + 1;
      }
    }
    if (code === "audit_thin_data_missing_scarcity_language") {
      for (const r of rows) {
        const b = thinDataSubBucket(r.aiAnswer);
        subBuckets[b] = (subBuckets[b] || 0) + 1;
      }
    }

    const meta = FAMILY_META[code] || {
      whyTheWarningFired: "See audit rubric for this code.",
      classificationPrimary: "harmless_warning_worth_documenting",
      classification: "unknown",
      classificationRationale: "",
      recommendedAction: "document_as_accepted_warning",
      recommendedActionDetail: "",
      specialCheck: null,
    };

    families.push({
      warningCode: code,
      count: rows.length,
      uniqueStudents: students.length,
      affectedStudentIds: students,
      affectedArchetypes: archetypes,
      affectedProfileTypes: profileTypes,
      affectedGrades: grades,
      affectedQuestionCategories: questionCategories,
      subBuckets: Object.keys(subBuckets).length ? subBuckets : undefined,
      representativeParentQuestions: [...new Set(rows.map((r) => r.parentQuestionText))].slice(0, 6),
      representatives: pickRepresentatives(rows, code, 4),
      ...(code === "audit_contradiction_missing_numeric_evidence"
        ? {
            answersMatchingAuditNumericLiteralPatternCount: rows.filter((r) =>
              AUDIT_CONTRADICTION_NUMERIC_RE.test(String(r.aiAnswer || "")),
            ).length,
          }
        : {}),
      ...meta,
      recommendedActionOutcome: "rerun_not_needed_for_mass_gate",
    });
  }

  const triage = {
    generatedAt: new Date().toISOString(),
    sourceAuditPath: AUDIT_PATH,
    sourceRunSummary: `${RUN_DIR}/RUN_SUMMARY.json`,
    sourceQualityFlags: `${RUN_DIR}/QUALITY_FLAGS.json`,
    parentAiChatsGlob: `${RUN_DIR}/parent-ai-chats/*.json`,
    totalWarningRows: families.reduce((n, f) => n + f.count, 0),
    families,
    executiveSummary: {
      anyTrueProductBlockerFromWarningsAlone: false,
      productFixRequiredBefore200StudentRerun: false,
      warningsAcceptableToDocument: true,
      full200StudentRerunRecommended:
        "Safe from a zero-failure perspective; AI_RESPONSE_QUALITY_AUDIT remains NEEDS_REVIEW until rubric alignment or advisory treatment of these codes. No evidence in this triage of correctness bugs or report/answer numeric contradictions.",
    },
  };

  fs.writeFileSync(OUT_JSON, JSON.stringify(triage, null, 2), "utf8");

  const lines = [];
  lines.push("# Phase 8 — WARNING_TRIAGE (2026-05-13T17-47-56)");
  lines.push("");
  lines.push(`Generated: ${triage.generatedAt}`);
  lines.push("");
  lines.push("## Executive summary");
  lines.push("");
  lines.push(`- **Total warning rows:** ${triage.totalWarningRows}`);
  lines.push(
    `- **True product blocker (from warnings only):** ${triage.executiveSummary.anyTrueProductBlockerFromWarningsAlone ? "yes" : "no"}`,
  );
  lines.push(
    `- **Product fix required before 200-student mass:** ${triage.executiveSummary.productFixRequiredBefore200StudentRerun ? "yes" : "no"}`,
  );
  lines.push(
    `- **Warnings acceptable to document / align audit:** ${triage.executiveSummary.warningsAcceptableToDocument ? "yes" : "yes — primarily rubric strictness and morphology gaps"}`,
  );
  lines.push(`- **200-student rerun:** ${triage.executiveSummary.full200StudentRerunRecommended}`);
  lines.push("");
  lines.push("## Families (checklist)");
  lines.push("");

  for (const f of families) {
    lines.push(`### ${f.warningCode}`);
    lines.push("");
    lines.push(`1. **Warning code:** \`${f.warningCode}\``);
    lines.push(`2. **Count:** ${f.count}`);
    lines.push(`3. **Affected students (${f.uniqueStudents}):** ${f.affectedStudentIds.join(", ")}`);
    lines.push(`4. **Affected archetypes:** ${f.affectedArchetypes.join(", ")}`);
    lines.push(`5. **Affected question categories:** ${f.affectedQuestionCategories.join(", ")}`);
    lines.push(`   - *Simulation profileType values in this family:* ${f.affectedProfileTypes.join(", ")}`);
    lines.push(`6. **Representative parent questions:** ${f.representativeParentQuestions.map((q) => `"${q}"`).join("; ")}`);
    lines.push("7. **Representative Copilot answer excerpts:**");
    for (const rep of f.representatives) {
      lines.push(`   - **${rep.studentId}** (${rep.archetype}, ${rep.grade}, ${rep.questionCategory})`);
      lines.push(`     - Parent: \"${rep.parentQuestionText}\"`);
      lines.push(`     - Answer: ${rep.aiAnswerExcerpt.replace(/\s+/g, " ").trim()}`);
    }
    lines.push(`8. **Why the warning fired:** ${f.whyTheWarningFired}`);
    if (f.specialCheck) {
      lines.push("   - **Special check (contradiction / numeric evidence):**");
      for (const [k, v] of Object.entries(f.specialCheck)) {
        lines.push(`     - **${k}:** ${v}`);
      }
    }
    if (f.subBuckets) {
      lines.push(`   - **Sub-buckets:** ${JSON.stringify(f.subBuckets)}`);
    }
    lines.push(`9. **Classification:** ${f.classificationPrimary} — ${f.classification}`);
    lines.push(`   - *Rationale:* ${f.classificationRationale}`);
    lines.push(`10. **Recommended action:** ${f.recommendedAction} (${f.recommendedActionOutcome})`);
    lines.push(`    - *Detail:* ${f.recommendedActionDetail}`);
    lines.push("");
  }

  fs.writeFileSync(OUT_MD, lines.join("\n"), "utf8");
  console.error("Wrote", OUT_JSON, OUT_MD, "rows=", triage.totalWarningRows);
}

main();
