import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const {
  FORBIDDEN_INTERNAL_PARENT_TERMS,
  PRODUCT_CONTRACT_MIN_EVIDENCE_QUESTIONS,
  getTrendEvidenceCounters,
} = await import(pathToFileURL(join(ROOT, "utils", "contracts", "parent-product-contract-v1.js")).href);
const { buildDetailedParentReportFromBaseReport } = await import(
  pathToFileURL(join(ROOT, "utils", "detailed-parent-report.js")).href
);
const { generateParentReportV2 } = await import(pathToFileURL(join(ROOT, "utils", "parent-report-v2.js")).href);
const { runParentCopilotTurn } = await import(pathToFileURL(join(ROOT, "utils", "parent-copilot", "index.js")).href);
const { PARENT_REPORT_PRODUCT_SCENARIOS } = await import(
  pathToFileURL(join(ROOT, "tests", "fixtures", "parent-report-product-scenarios.mjs")).href
);

const OUT_DIR = join(ROOT, "reports", "parent-report-product-contract");
mkdirSync(OUT_DIR, { recursive: true });

const STRONG_TREND_WORDS = [
  "משתפר",
  "בירידה",
  "מגמה חיובית",
  "מגמה שלילית",
  "שיפור מבוסס",
  "ירידה מבוססת",
];
const AGGRESSIVE_STEPS = new Set([
  "advance_level",
  "advance_grade_topic_only",
  "drop_one_level_topic_only",
  "drop_one_grade_topic_only",
  "remediate_same_level",
]);
const MONITORING_WORDS = ["מעקב", "ניטור", "איסוף", "נתונים", "זהיר", "לצפות", "לתעד", "בלבד"];
const INSUFFICIENT_WORDS = ["אין מספיק", "חלקי", "נדרש עוד", "לאסוף"];
const REMEDIATION_WORDS = ["לתקן פער", "פער", "שיקום", "חיזוק יסודי"];
const INCREASE_DIFFICULTY_WORDS = ["להעלות רמה", "להעלות קושי", "להעלות כיתה", "קושי גבוה יותר"];

function cleanText(v) {
  return String(v || "").replace(/\s+/g, " ").trim();
}

function hasAnyWord(text, words) {
  return words.some((w) => cleanText(text).includes(w));
}

function collectParentFacingTextsWithScope(report) {
  /** @type {Array<{path:string,text:string}>} */
  const out = [];
  const push = (path, v) => {
    const t = cleanText(v);
    if (t) out.push({ path, text: t });
  };
  const top = report?.parentProductContractV1?.top || {};
  for (const k of [
    "mainStatusHe",
    "mainPriorityHe",
    "whyHe",
    "doNowHe",
    "avoidNowHe",
    "confidenceHe",
    "evidenceSummaryHe",
    "nextCheckHe",
  ]) {
    push(`parentProductContractV1.top.${k}`, top[k]);
  }
  const subjects = report?.parentProductContractV1?.subjects || {};
  for (const [sid, row] of Object.entries(subjects)) {
    for (const [k, v] of Object.entries(row || {})) {
      if (typeof v === "string") push(`parentProductContractV1.subjects.${sid}.${k}`, v);
    }
  }
  return out;
}

function hasForbiddenInternalWords(scopedTexts) {
  const hits = [];
  for (const entry of scopedTexts) {
    for (const token of FORBIDDEN_INTERNAL_PARENT_TERMS) {
      const re = new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      if (re.test(entry.text)) hits.push({ ...entry, token });
    }
  }
  return hits;
}

function collectRawSourceTextsWithScope(report) {
  /** @type {Array<{path:string,text:string,field:string,sourcePath:string}>} */
  const out = [];
  const push = (sourcePath, field, v) => {
    const t = cleanText(v);
    if (t) out.push({ path: `${sourcePath}.${field}`, sourcePath, field, text: t });
  };
  const exec = report?.executiveSummary || {};
  const topFields = [
    "topImmediateParentActionHe",
    "headline",
    "narrativeHe",
    "topStrengthHe",
    "topRiskHe",
  ];
  for (const k of topFields) push("executiveSummary", k, exec?.[k]);
  for (const sp of report?.subjectProfiles || []) {
    const sid = String(sp?.subject || "unknown");
    const sourcePath = `subjectProfiles.${sid}`;
    for (const [k, v] of Object.entries(sp || {})) {
      if (typeof v === "string" && k.endsWith("He")) push(sourcePath, k, v);
    }
    for (const tr of sp?.topicRecommendations || []) {
      const rk = String(tr?.topicRowKey || "row");
      for (const [k, v] of Object.entries(tr || {})) {
        if (typeof v === "string" && k.endsWith("He")) {
          push(`${sourcePath}.topicRecommendations.${rk}`, k, v);
        }
      }
    }
  }
  return out;
}

function noDuplicateRecommendationLines(report) {
  const lines = [];
  for (const sp of report?.subjectProfiles || []) {
    for (const tr of sp?.topicRecommendations || []) {
      for (const k of ["whyThisRecommendationHe", "doNowHe", "avoidNowHe"]) {
        const t = cleanText(tr?.[k]);
        if (t) lines.push(t);
      }
    }
  }
  const uniq = new Set(lines.map((x) => x.toLowerCase()));
  return { ok: uniq.size === lines.length, duplicateCount: lines.length - uniq.size };
}

function withMockedStorage(storageMap, fn) {
  const prevWindow = globalThis.window;
  const prevLocalStorage = globalThis.localStorage;
  const store = new Map(Object.entries(storageMap || {}));
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };
  globalThis.window = globalThis;
  try {
    return fn();
  } finally {
    globalThis.window = prevWindow;
    globalThis.localStorage = prevLocalStorage;
  }
}

function buildReportForScenario(s) {
  if (s.type === "base_report") {
    const base = s.buildBaseReport();
    return buildDetailedParentReportFromBaseReport(base, { period: "week" });
  }
  if (s.type === "storage_runtime") {
    const base = withMockedStorage(s.storage, () =>
      generateParentReportV2(String(s.playerName || ""), "week")
    );
    return buildDetailedParentReportFromBaseReport(base, { period: "week" });
  }
  return null;
}

function checkScenario(s, report) {
  const failures = [];
  const top = report?.parentProductContractV1?.top || {};
  const topRequired = [
    "mainStatusHe",
    "mainPriorityHe",
    "whyHe",
    "doNowHe",
    "avoidNowHe",
    "confidenceHe",
    "evidenceSummaryHe",
    "nextCheckHe",
  ];
  for (const k of topRequired) {
    if (!cleanText(top[k])) failures.push(`missing_top_field:${k}`);
  }

  const allTopicRows = (report?.subjectProfiles || []).flatMap((sp) =>
    Array.isArray(sp?.topicRecommendations) ? sp.topicRecommendations : []
  );
  const strongRows = allTopicRows.filter(
    (tr) => AGGRESSIVE_STEPS.has(String(tr?.recommendedNextStep || "")) && !tr?.thinEvidenceDowngraded
  );
  for (const tr of strongRows) {
    const q = Number(tr?.questions) || 0;
    if (q < PRODUCT_CONTRACT_MIN_EVIDENCE_QUESTIONS) {
      failures.push(`strong_without_evidence:${tr?.topicRowKey || "unknown"}`);
    }
  }

  const enoughEvidence = (Number(top?.evidence?.questionCount) || 0) >= PRODUCT_CONTRACT_MIN_EVIDENCE_QUESTIONS;
  if (enoughEvidence) {
    const primarySubjectId = cleanText(report?.parentProductContractV1?.primarySubjectId || "");
    if (!primarySubjectId) failures.push("missing_primary_subject_when_enough_evidence");
  }

  const cautiousRows = allTopicRows.filter(
    (tr) => tr?.thinEvidenceDowngraded || String(tr?.gateReadiness || "") === "insufficient"
  );
  for (const tr of cautiousRows) {
    if (!cleanText(tr?.avoidNowHe)) failures.push(`missing_avoid_now:${tr?.topicRowKey || "unknown"}`);
  }

  const doNowTop = cleanText(top?.doNowHe);
  if (!doNowTop) {
    failures.push("missing_do_now_top");
  } else {
    if (doNowTop.length > 160) failures.push("do_now_too_long");
    if (doNowTop.length < 8) failures.push("do_now_too_short");
  }

  const finalScopedTexts = collectParentFacingTextsWithScope(report);
  const finalForbiddenHits = hasForbiddenInternalWords(finalScopedTexts);
  if (finalForbiddenHits.length) failures.push(`forbidden_internal_terms_final:${finalForbiddenHits.length}`);
  const rawScopedTexts = collectRawSourceTextsWithScope(report);
  const rawForbiddenHits = hasForbiddenInternalWords(rawScopedTexts);
  if (rawForbiddenHits.length) failures.push(`forbidden_internal_terms_raw:${rawForbiddenHits.length}`);

  const trendGuardHits = [];
  if (s.id === "trend_insufficient" || s?.expectations?.forbidsTrendDirectionWords) {
    for (const entry of finalScopedTexts) {
      for (const w of STRONG_TREND_WORDS) {
        if (entry.text.includes(w)) {
          trendGuardHits.push({ ...entry, word: w });
        }
      }
    }
    if (trendGuardHits.length) failures.push(`trend_word_on_insufficient:${trendGuardHits.length}`);
  }

  const semanticExpectationResults = evaluateSemanticExpectations(s, report, top, allTopicRows);
  for (const ex of semanticExpectationResults) {
    if (!ex.ok) failures.push(`semantic_expectation_failed:${ex.id}`);
  }

  // Verify trend counters can be read across both direct and nested trend shapes.
  const trendCounterReadChecks = allTopicRows
    .map((row) => ({ key: row?.topicRowKey || "unknown", counters: getTrendEvidenceCounters(row) }))
    .filter((x) => x.counters.trendEvidencePoints > 0 || x.counters.validCurrentSessionCount > 0 || x.counters.validPreviousSessionCount > 0);
  if (trendCounterReadChecks.some((x) => x.counters.minTrendPointsRequired <= 0)) {
    failures.push("trend_counters_invalid_min_required");
  }

  const primaryPriorityAlignment = evaluatePrimaryPriorityAlignment(report);
  if (!primaryPriorityAlignment.ok && (s?.expectations?.requiresGlobalPriorityAlignment || primaryPriorityAlignment.hardMismatch)) {
    failures.push("primary_priority_mismatch");
  }

  const dup = noDuplicateRecommendationLines(report);
  if (!dup.ok) failures.push(`duplicate_recommendation_lines:${dup.duplicateCount}`);

  return {
    ok: failures.length === 0,
    failures,
    rawForbiddenHits,
    finalForbiddenHits,
    semanticExpectationResults,
    primaryPriorityAlignment,
    trendGuardScope: finalScopedTexts.map((x) => x.path),
    trendGuardHits,
    trendCounterReadChecks,
    maintainOnlyContractCheck: evaluateMaintainOnlyContract(report),
    stableMasteryContractCheck: evaluateStableMasteryContract(report),
  };
}

function evaluateSemanticExpectations(s, report, top, allTopicRows) {
  const exp = s?.expectations || {};
  const texts = collectParentFacingTextsWithScope(report).map((x) => x.text).join(" ");
  const results = [];
  const push = (id, ok, detail) => results.push({ id, ok, detail });
  if (exp.requiresInsufficientLanguage) {
    push("requiresInsufficientLanguage", hasAnyWord(texts, INSUFFICIENT_WORDS), "needs insufficiency language");
  }
  if (exp.forbidsWeakDiagnosis) {
    push("forbidsWeakDiagnosis", !hasAnyWord(texts, ["פער ידע", "חולשה עמוקה"]), "must avoid strong weakness diagnosis");
  }
  if (exp.forbidsTrendDirectionWords) {
    push(
      "forbidsTrendDirectionWords",
      !STRONG_TREND_WORDS.some((w) => texts.includes(w)),
      "must avoid strong trend words when insufficient"
    );
  }
  if (exp.requiresClearPriority) {
    push("requiresClearPriority", cleanText(report?.parentProductContractV1?.primarySubjectId).length > 0, "primarySubjectId required");
  }
  if (exp.requiresConcreteAction) {
    push("requiresConcreteAction", cleanText(top?.doNowHe).length >= 8, "doNow should be concrete");
  }
  if (exp.forbidsCollectMoreOnly) {
    const onlyCollect = hasAnyWord(top?.mainPriorityHe, ["לאסוף", "נתונים"]) && cleanText(top?.doNowHe).length < 8;
    push("forbidsCollectMoreOnly", !onlyCollect, "not collect-data-only when enough evidence");
  }
  if (exp.requiresCautiousTone) {
    push("requiresCautiousTone", hasAnyWord(texts, MONITORING_WORDS), "needs caution/monitoring language");
  }
  if (exp.forbidsStrongDiagnosis) {
    push("forbidsStrongDiagnosis", !hasAnyWord(texts, ["כשל", "חמור", "פער יסודי"]), "no strong diagnosis on thin evidence");
  }
  if (exp.forbidsAggressiveIntervention) {
    const hasAggressive = AGGRESSIVE_STEPS.has(String(report?.parentProductContractV1?.top?.recommendedNextStep || ""));
    push("forbidsAggressiveIntervention", !hasAggressive, "no aggressive next step");
  }
  if (exp.requiresStrengthOrMaintain) {
    const enough = (Number(top?.evidence?.questionCount) || 0) >= PRODUCT_CONTRACT_MIN_EVIDENCE_QUESTIONS;
    const noRemediation = !hasAnyWord(texts, REMEDIATION_WORDS);
    push("requiresStrengthOrMaintain", hasAnyWord(texts, ["לשמר", "שימור", "הרחבה מבוקרת"]) || (enough && noRemediation), "must present maintain/strength framing");
  }
  if (exp.forbidsInsufficientLanguageWhenEnoughEvidence) {
    const enough = (Number(top?.evidence?.questionCount) || 0) >= PRODUCT_CONTRACT_MIN_EVIDENCE_QUESTIONS;
    const topText = [top?.mainStatusHe, top?.whyHe, top?.evidenceSummaryHe].map(cleanText).join(" ");
    const bad = enough && hasAnyWord(topText, ["אין מספיק נתונים", "נתון חסר"]);
    push("forbidsInsufficientLanguageWhenEnoughEvidence", !bad, "enough evidence should not read as insufficient");
  }
  if (exp.forbidsRemediation) {
    push("forbidsRemediation", !hasAnyWord(texts, REMEDIATION_WORDS), "strong stable mastery should not remediate");
  }
  if (exp.mustMentionFragilityOrCaution) {
    push("mustMentionFragilityOrCaution", hasAnyWord(texts, ["זהיר", "יציבות", "עצמאות", "שביר"]), "must mention fragility/caution");
  }
  if (exp.forbidsKnowledgeGapLabel) {
    push("forbidsKnowledgeGapLabel", !hasAnyWord(texts, ["פער ידע"]), "speed-only should not be labeled knowledge gap");
  }
  if (exp.requiresSpeedCaution) {
    push("requiresSpeedCaution", hasAnyWord(texts, ["קצב", "מהירות", "לחץ זמן"]), "must mention speed/pace cautiously");
  }
  if (exp.allowsTrendUpWhenSufficient) {
    const hasSufficient = String(top?.evidence?.trendEvidenceStatus || "") === "sufficient";
    const usesUpWords = hasAnyWord(texts, ["שיפור מבוסס", "מגמה חיובית", "משתפר"]);
    push(
      "allowsTrendUpWhenSufficient",
      !usesUpWords || hasSufficient,
      "improvement wording only if sufficient"
    );
  }
  if (exp.allowsTrendDownWhenSufficient) {
    const hasSufficient = String(top?.evidence?.trendEvidenceStatus || "") === "sufficient";
    const usesDownWords = hasAnyWord(texts, ["ירידה מבוססת", "מגמה שלילית", "בירידה"]);
    push(
      "allowsTrendDownWhenSufficient",
      !usesDownWords || hasSufficient,
      "decline wording only if sufficient"
    );
  }
  if (exp.requiresGlobalPriorityAlignment) {
    const align = evaluatePrimaryPriorityAlignment(report);
    push("requiresGlobalPriorityAlignment", align.ok, align.reason);
  }
  return results;
}

function evaluatePrimaryPriorityAlignment(report) {
  const primarySubjectId = cleanText(report?.parentProductContractV1?.primarySubjectId);
  const execTop = cleanText(report?.executiveSummary?.parentPriorityLadder?.rankedSubjects?.[0]?.subject);
  const execAction = cleanText(report?.executiveSummary?.topImmediateParentActionHe);
  const mainActionRows = (report?.subjectProfiles || []).flatMap((sp) =>
    (sp?.topicRecommendations || [])
      .filter((r) => r?.isMainActionable)
      .map((r) => ({ subject: cleanText(sp?.subject), doNowHe: cleanText(r?.doNowHe), row: r }))
  );
  const mainActionSubject = cleanText(mainActionRows[0]?.subject || "");
  const topPriority = cleanText(report?.parentProductContractV1?.top?.mainPriorityHe);
  const monitoringException = hasAnyWord(execAction, MONITORING_WORDS) || hasAnyWord(execAction, INSUFFICIENT_WORDS);
  const availableSubjects = [primarySubjectId, execTop, mainActionSubject].filter(Boolean);
  const allSame = new Set(availableSubjects).size <= 1;
  const subjectAligned =
    availableSubjects.length <= 1 ||
    allSame ||
    primarySubjectId === execTop ||
    primarySubjectId === mainActionSubject ||
    monitoringException;
  const actionAligned =
    !execAction ||
    !topPriority ||
    execAction.includes(topPriority) ||
    topPriority.includes(execAction) ||
    monitoringException;
  return {
    ok: (!!subjectAligned && !!actionAligned) || availableSubjects.length <= 1,
    hardMismatch:
      availableSubjects.length >= 2 &&
      !monitoringException &&
      primarySubjectId &&
      execTop &&
      mainActionSubject &&
      (primarySubjectId !== execTop || primarySubjectId !== mainActionSubject),
    primarySubjectId,
    executiveTopSubject: execTop,
    mainActionableSubject: mainActionSubject,
    executiveTopAction: execAction,
    contractTopPriority: topPriority,
    allowedExceptionApplied: monitoringException && (!mainActionSubject || primarySubjectId !== mainActionSubject),
    reason: monitoringException
      ? "executive action is monitoring/evidence oriented"
      : "subjects/actions must align across executive, topic and contract",
  };
}

function evaluateMaintainOnlyContract(report) {
  const top = report?.parentProductContractV1?.top || {};
  const enough = (Number(top?.evidence?.questionCount) || 0) >= PRODUCT_CONTRACT_MIN_EVIDENCE_QUESTIONS;
  const text = [top?.mainStatusHe, top?.mainPriorityHe, top?.whyHe, top?.doNowHe].map(cleanText).join(" ");
  const ok = !enough || !hasAnyWord(text, ["אין מספיק נתונים", "נתון חסר"]);
  return { ok, enoughEvidence: enough, notes: ok ? "maintain-only profile remains non-insufficient" : "unexpected insufficient wording with enough evidence" };
}

function evaluateStableMasteryContract(report) {
  const top = report?.parentProductContractV1?.top || {};
  const text = [top?.mainStatusHe, top?.mainPriorityHe, top?.whyHe].map(cleanText).join(" ");
  const ok = !hasAnyWord(text, REMEDIATION_WORDS) && !hasAnyWord(text, ["פער ידע חמור"]);
  return { ok, notes: ok ? "no remediation language on stable mastery" : "stable mastery includes remediation wording" };
}

function evaluateCopilotAlignment(s, contract, answerText) {
  const primarySubjectId = cleanText(contract?.primarySubjectId);
  const top = contract?.top || {};
  const insufficient = String(top?.evidence?.trendEvidenceStatus || "") !== "sufficient";
  const allowsMaintain = hasAnyWord([top?.mainStatusHe, top?.mainPriorityHe].map(cleanText).join(" "), ["לשמר", "הרחבה מבוקרת"]);
  const forbidsIncrease = hasAnyWord(cleanText(top?.avoidNowHe), ["לא להעלות קושי", "לא לשנות רמת קושי"]);
  const checks = [
    {
      id: "same_primary_focus",
      ok:
        !primarySubjectId ||
        answerText.includes(primarySubjectId) ||
        answerText.includes(cleanText(top?.mainPriorityHe).slice(0, 18)),
    },
    {
      id: "not_stronger_than_contract",
      ok: insufficient ? !hasAnyWord(answerText, ["פער חמור", "טיפול מיידי"]) : true,
    },
    {
      id: "insufficient_no_strong_diagnosis",
      ok: insufficient ? !hasAnyWord(answerText, ["אבחנה חד משמעית", "בעיה עמוקה"]) : true,
    },
    {
      id: "forbid_difficulty_increase_when_blocked",
      ok: forbidsIncrease ? !hasAnyWord(answerText, INCREASE_DIFFICULTY_WORDS) : true,
    },
    {
      id: "maintain_mode_no_remediation",
      ok: allowsMaintain ? !hasAnyWord(answerText, REMEDIATION_WORDS) : true,
    },
  ];
  return {
    ok: checks.every((c) => c.ok),
    checks,
    scenarioId: s.id,
  };
}

/** @type {Array<Record<string, unknown>>} */
const scenarioResults = [];
let hasAnyFailure = false;

for (const s of PARENT_REPORT_PRODUCT_SCENARIOS) {
  if (s.type === "copilot_payload") {
    const payload = s.buildCopilotPayload();
    const turn = runParentCopilotTurn({
      audience: "parent",
      payload,
      utterance: "מה הכי חשוב לעשות השבוע בבית?",
      sessionId: "phase9-product-contract-audit",
    });
    const text = cleanText((turn?.answerBlocks || []).map((b) => b?.textHe || "").join(" "));
    const forbidden = hasForbiddenInternalWords([{ path: "copilot.answer", text }]);
    const copilotContract = payload?.parentProductContractV1 || payload?.detailedReport?.parentProductContractV1 || null;
    const copilotAlignmentDetails = evaluateCopilotAlignment(s, copilotContract, text);
    const ok = !!text && forbidden.length === 0 && copilotAlignmentDetails.ok;
    scenarioResults.push({
      id: s.id,
      ok,
      failures: ok ? [] : ["copilot_contract_alignment_failed"],
      copilot: {
        resolutionStatus: turn?.resolutionStatus || "unknown",
        validatorStatus: turn?.validatorStatus || "unknown",
        copilotAlignmentDetails,
      },
    });
    if (!ok) hasAnyFailure = true;
    continue;
  }

  const report = buildReportForScenario(s);
  const result = checkScenario(s, report);
  scenarioResults.push({
    id: s.id,
    ok: result.ok,
    failures: result.failures,
    top: report?.parentProductContractV1?.top || null,
    semanticExpectationResults: result.semanticExpectationResults,
    primaryPriorityAlignment: result.primaryPriorityAlignment,
    rawForbiddenTermHits: result.rawForbiddenHits,
    finalForbiddenTermHits: result.finalForbiddenHits,
    trendGuardScope: result.trendGuardScope,
    trendGuardHits: result.trendGuardHits,
    trendCounterReadChecks: result.trendCounterReadChecks,
    maintainOnlyContractCheck: result.maintainOnlyContractCheck,
    stableMasteryContractCheck: result.stableMasteryContractCheck,
  });
  if (!result.ok) hasAnyFailure = true;
}

const summary = {
  total: scenarioResults.length,
  passed: scenarioResults.filter((r) => r.ok).length,
  failed: scenarioResults.filter((r) => !r.ok).length,
};

const out = {
  generatedAt: new Date().toISOString(),
  contract_version: "v1",
  checks: {
    top_fields_required: true,
    one_primary_action_when_enough_evidence: true,
    no_strong_diagnosis_on_thin_evidence: true,
    no_forbidden_internal_terms: true,
    trend_insufficient_language_guard: true,
    strong_recommendation_min_evidence_threshold: PRODUCT_CONTRACT_MIN_EVIDENCE_QUESTIONS,
    do_now_concrete_and_short: true,
    avoid_now_required_for_cautious: true,
    no_duplicate_recommendation_lines: true,
    copilot_contract_alignment_checked: true,
    raw_forbidden_pre_sanitization_checked: true,
    semantic_expectations_checked: true,
    primary_priority_alignment_checked: true,
    trend_guard_full_contract_scope_checked: true,
  },
  summary,
  primaryPriorityAlignment: scenarioResults.map((s) => ({
    id: s.id,
    alignment: s.primaryPriorityAlignment || null,
  })),
  rawForbiddenTermHits: scenarioResults.flatMap((s) =>
    Array.isArray(s.rawForbiddenTermHits) ? s.rawForbiddenTermHits.map((h) => ({ scenarioId: s.id, ...h })) : []
  ),
  finalForbiddenTermHits: scenarioResults.flatMap((s) =>
    Array.isArray(s.finalForbiddenTermHits) ? s.finalForbiddenTermHits.map((h) => ({ scenarioId: s.id, ...h })) : []
  ),
  trendGuardScope: scenarioResults.flatMap((s) =>
    Array.isArray(s.trendGuardScope) ? s.trendGuardScope.map((path) => ({ scenarioId: s.id, path })) : []
  ),
  copilotAlignmentDetails: scenarioResults
    .filter((s) => s.id === "copilot_contract_alignment")
    .map((s) => s.copilot?.copilotAlignmentDetails || null),
  maintainOnlyContractCheck: scenarioResults
    .filter((s) => s.id === "strong_stable_mastery")
    .map((s) => s.maintainOnlyContractCheck || null)[0] || null,
  stableMasteryContractCheck: scenarioResults
    .filter((s) => s.id === "strong_stable_mastery")
    .map((s) => s.stableMasteryContractCheck || null)[0] || null,
  scenarios: scenarioResults,
};

const md = `# Parent Product Contract Audit

- Generated: ${out.generatedAt}
- Passed: ${summary.passed}/${summary.total}
- Failed: ${summary.failed}

## Scenario Results

${scenarioResults
  .map((s) => `- ${s.ok ? "PASS" : "FAIL"} \`${s.id}\`${Array.isArray(s.failures) && s.failures.length ? ` — ${s.failures.join(", ")}` : ""}`)
  .join("\n")}
`;

writeFileSync(join(OUT_DIR, "product-contract-audit.json"), JSON.stringify(out, null, 2), "utf8");
writeFileSync(join(OUT_DIR, "product-contract-audit.md"), md, "utf8");

console.log(
  JSON.stringify(
    {
      ok: !hasAnyFailure,
      out_json: join(OUT_DIR, "product-contract-audit.json"),
      out_md: join(OUT_DIR, "product-contract-audit.md"),
      ...summary,
    },
    null,
    2
  )
);

if (hasAnyFailure) {
  process.exitCode = 1;
}

