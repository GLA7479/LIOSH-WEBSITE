/**
 * Aggregate scanned records into subject and skill summaries.
 */
import { ISSUE_CODES, MIN_QUESTIONS_PER_SKILL_FOR_DIAGNOSIS } from "./question-metadata-contract.js";

/** @param {object[]} records */
export function buildDuplicateIdReport(records) {
  /** @type {Map<string, string[]>} */
  const m = new Map();
  for (const r of records) {
    const id = r.declaredId;
    if (!id) continue;
    const list = m.get(id) || [];
    list.push(r.sourceFile);
    m.set(id, list);
  }
  /** @type {{ id: string, files: string[], count: number }[]} */
  const duplicates = [];
  for (const [id, files] of m.entries()) {
    const uniq = [...new Set(files)];
    if (uniq.length > 1) duplicates.push({ id, files: uniq, count: files.length });
  }
  return duplicates.sort((a, b) => b.count - a.count);
}

/** @param {object[]} records */
export function buildSubjectSummaries(records) {
  /** @type {Map<string, object[]>} */
  const bySub = new Map();
  for (const r of records) {
    const s = r.subject || "unknown";
    const arr = bySub.get(s) || [];
    arr.push(r);
    bySub.set(s, arr);
  }

  /** @type {Record<string, unknown>} */
  const out = {};

  for (const [subject, rows] of bySub.entries()) {
    const n = rows.length;
    const files = [...new Set(rows.map((x) => x.sourceFile))];
    const pct = (pred) => (n ? Math.round((rows.filter(pred).length / n) * 1000) / 10 : 0);

    const issueCounts = {};
    for (const r of rows) for (const iss of r.issues || []) issueCounts[iss] = (issueCounts[iss] || 0) + 1;

    const sortedIssues = Object.entries(issueCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);

    let weakestFields = sortedIssues.slice(0, 5).map(([code]) => code);

    const highRisk = rows.filter((r) => r.riskLevel === "high").length;
    const medRisk = rows.filter((r) => r.riskLevel === "medium").length;

    const avgComp =
      n > 0 ? rows.reduce((a, r) => a + (r.metadataCompletenessScore || 0), 0) / n : 0;
    const readinessScore =
      pct((r) => !!r.skillId) >= 85 &&
      pct((r) => !!r.subskillId) >= 50 &&
      highRisk / Math.max(1, n) < 0.08 &&
      avgComp >= 0.65
        ? "strong"
        : pct((r) => !!r.skillId) >= 50
          ? "medium"
          : pct((r) => !!r.skillId) >= 20
            ? "weak"
            : "missing";

    out[subject] = {
      subject,
      totalQuestions: n,
      filesScanned: files.length,
      filePaths: files.sort(),
      pctWithSkillId: pct((r) => !!r.skillId),
      pctWithSubskillId: pct((r) => !!r.subskillId),
      pctWithDifficulty: pct((r) => !!r.difficulty),
      pctWithCognitiveLevel: pct((r) => !!r.cognitiveLevel),
      pctWithExpectedErrorTypes: pct((r) => (r.expectedErrorTypes || []).length > 0),
      pctWithPrerequisiteSkillIds: pct((r) => (r.prerequisiteSkillIds || []).length > 0),
      pctWithCorrectAnswer: pct((r) => r.hasCorrectAnswer),
      pctWithExplanation: pct((r) => r.hasExplanation),
      duplicateIdsInSubject: 0,
      highRiskQuestionCount: highRisk,
      mediumRiskQuestionCount: medRisk,
      weakestMetadataFields: weakestFields,
      topIssueCodes: sortedIssues,
      readinessScore,
      avgCompleteness: Math.round(avgComp * 1000) / 1000,
    };
  }

  return out;
}

/** @param {object[]} records */
export function buildSkillSummaries(records) {
  /** @type {Map<string, object[]>} */
  const bySkill = new Map();
  for (const r of records) {
    const sk = r.skillId || "__missing_skill__";
    const key = `${r.subject || "unknown"}::${sk}`;
    const arr = bySkill.get(key) || [];
    arr.push(r);
    bySkill.set(key, arr);
  }

  /** @type {object[]} */
  const rows = [];
  for (const [key, list] of bySkill.entries()) {
    const [subject, skillId] = key.split("::");
    const n = list.length;
    const subskills = [...new Set(list.map((x) => x.subskillId).filter(Boolean))];
    /** @type {Record<string, number>} */
    const diffDist = {};
    for (const q of list) {
      const d = q.difficulty || "unknown";
      diffDist[d] = (diffDist[d] || 0) + 1;
    }
    const errCov = list.filter((q) => (q.expectedErrorTypes || []).length > 0).length;
    const prereqCov = list.filter((q) => (q.prerequisiteSkillIds || []).length > 0).length;
    const enoughForDiagnosis = n >= MIN_QUESTIONS_PER_SKILL_FOR_DIAGNOSIS;
    let riskLevel = "low";
    if (!enoughForDiagnosis || skillId === "__missing_skill__") riskLevel = "high";
    else if (errCov < n * 0.5 || prereqCov < n * 0.2) riskLevel = "medium";

    rows.push({
      subject,
      skillId,
      totalQuestions: n,
      subskillsCovered: subskills.length,
      subskillIds: subskills.slice(0, 24),
      difficultyDistribution: diffDist,
      expectedErrorCoverageCount: errCov,
      prerequisiteCoverageCount: prereqCov,
      enoughQuestionsForReliableDiagnosis: enoughForDiagnosis,
      riskLevel,
    });
  }

  return rows.sort((a, b) => a.subject.localeCompare(b.subject) || a.skillId.localeCompare(b.skillId));
}

/** @param {object[]} records */
export function globalIssueTopN(records, n = 16) {
  /** @type {Record<string, number>} */
  const h = {};
  for (const r of records) {
    for (const iss of r.issues || []) h[iss] = (h[iss] || 0) + 1;
  }
  return Object.entries(h)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

export { ISSUE_CODES };
