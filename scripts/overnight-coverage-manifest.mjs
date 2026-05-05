#!/usr/bin/env node
/**
 * Builds COVERAGE_MANIFEST.json/.md for an overnight-parent-ai-audit output folder.
 * Reads FINAL_REPORT + copied learning-simulator artifacts + sample PDFs + synthetic E2E.
 *
 * Usage: node scripts/overnight-coverage-manifest.mjs --outDir <overnight-run-folder>
 *
 * Threshold env (launch readiness — fail process if unmet when enforcement on):
 *   OVERNIGHT_COVERAGE_ENFORCE=1 — fail if thresholds missed (default when FINAL_REPORT.smokeMode=false)
 *   OVERNIGHT_COVERAGE_ENFORCE=0 — never fail on thresholds
 *   OVERNIGHT_MIN_GRADES (default 6)
 *   OVERNIGHT_MIN_SCENARIOS (default 50) — aggregate + deep + critical + synthetic profile rows
 *   OVERNIGHT_MIN_QUESTIONS (default 20000) — sum aggregate + deep question totals
 *   OVERNIGHT_MIN_SESSIONS (default 1000) — sum aggregate + deep sessions
 *   OVERNIGHT_MIN_PDF_PROFILES (default 5)
 *   OVERNIGHT_REQUIRE_SHORT_AND_LONG_PDF=1 (default 1)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

function argOutDir() {
  const a = process.argv.slice(2);
  const i = a.indexOf("--outDir");
  if (i >= 0 && a[i + 1]) return path.resolve(a[i + 1]);
  console.error("Usage: node scripts/overnight-coverage-manifest.mjs --outDir <path>");
  process.exit(2);
}

function readJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function numEnv(name, def) {
  const v = process.env[name];
  if (v == null || String(v).trim() === "") return def;
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

const GRADE_RE = /\bg([1-6])\b/g;

function gradesFromText(str) {
  const g = new Set();
  if (!str) return g;
  let m;
  const s = String(str);
  while ((m = GRADE_RE.exec(s)) !== null) g.add(`g${m[1]}`);
  return g;
}

const SUBJECT_LABELS = {
  hebrew: "עברית",
  english: "אנגלית",
  math: "מתמטיקה",
  geometry: "גיאומטריה",
  science: "מדעים",
  moledet_geography: "מולדת / גיאוגרפיה",
};

const PROFILE_BEHAVIOR_MAP = [
  { match: /strong_all_subjects|strong-stable|strong_stable/, label: "תלמיד חזק ויציב (רב-מקצועי)" },
  { match: /thin_data|very-little-data|very_little/, label: "מעט נתונים / דקירות נתונים" },
  { match: /improving/, label: "משתפר לאורך זמן" },
  { match: /declining/, label: "מצטנן / יורד בביצועים" },
  { match: /weak_all|weak_all_subjects/, label: "חלש ברוב המקצועות" },
  { match: /weak_math_fractions|weak_math/, label: "חולשה במתמטיקה (מוקד מדויק)" },
  { match: /weak_geometry/, label: "חולשה בגיאומטריה" },
  { match: /weak_hebrew/, label: "חולשה בעברית" },
  { match: /weak_english/, label: "חולשה באנגלית" },
  { match: /weak_science/, label: "חולשה במדעים" },
  { match: /weak_moledet/, label: "חולשה במולדת/גיאוגרפיה" },
  { match: /random_guessing/, label: "ניחושים / עקביות נמוכה" },
  { match: /inconsistent/, label: "דפוס לא עקבי" },
  { match: /fast_wrong|fast wrong/, label: "מהיר ושגוי" },
  { match: /slow_correct|slow correct/, label: "איטי ומדויק" },
  { match: /external-question|external_question/, label: "זרימת שאלה חיצונית" },
  { match: /six-subject|six_subject/, label: "מיקס רב-מקצועי" },
  { match: /inconsistent-guessing/, label: "ניחוש בלתי עקבי" },
  { match: /math-only/, label: "מיקוד מתמטיקה בלבד" },
  { match: /geometry-only/, label: "מיקוד גיאומטריה בלבד" },
  { match: /english-no-data/, label: "אנגלית עם חוסר נתונים" },
];

function behaviorLabelForId(id) {
  const s = String(id);
  for (const { match, label } of PROFILE_BEHAVIOR_MAP) {
    if (match.test(s)) return label;
  }
  return s;
}

function collectCatalogSubjectsLevels(catalog) {
  const subjects = new Map();
  const levels = new Map();
  const grades = new Map();
  const rows = catalog?.rows || [];
  for (const row of rows) {
    if (row.coverageStatus !== "covered") continue;
    const sub = row.subject;
    if (sub) subjects.set(sub, (subjects.get(sub) || 0) + 1);
    const lv = row.level;
    if (lv) levels.set(lv, (levels.get(lv) || 0) + 1);
    const gr = row.grade;
    if (gr) grades.set(gr, (grades.get(gr) || 0) + 1);
  }
  return { subjects, levels, grades };
}

function buildAiModuleRows(commands) {
  const ids = new Set([
    "b1",
    "b2",
    "b3",
    "d1",
    "d2",
    "d3",
    "d4",
    "d5",
    "d6",
    "d-manual",
    "e-ssr",
    "e-phase1",
    "f-pdf-export",
    "f-sample-pdfs",
    "f-ls-pdf-export",
    "g1",
    "g2",
    "g3",
    "g4",
    "g5",
    "h-quick",
    "h-full",
    "i-synthetic",
  ]);
  const label = {
    b1: "Parent AI core — הקשר עקבי",
    b2: "Parent report AI — אינטגרציה",
    b3: "Parent report AI — סימולטור תרחישים",
    d4: "Assistant QA",
    d5: "External question flow",
    d6: "Bad prompt handling",
    g1: "Question metadata",
    g2: "Adaptive planner — artifacts",
    g3: "Adaptive planner — runtime",
    g4: "Recommended practice",
    g5: "Planner scenario simulator",
    "f-pdf-export": "PDF export (parent QA)",
    "f-sample-pdfs": "Sample PDF profiles",
    "f-ls-pdf-export": "Learning simulator PDF export",
    "h-quick": "Learning simulator aggregate path",
    "h-full": "Learning simulator full orchestrator",
    "i-synthetic": "Synthetic E2E (copilot + payload)",
  };
  const rows = [];
  for (const c of commands || []) {
    if (!ids.has(c.id)) continue;
    const cmd = c.npmScript || c.command || "";
    rows.push({
      id: c.id,
      label: label[c.id] || c.id,
      npmOrCommand: cmd.slice(0, 120),
      status: c.status,
      ms: c.durationMs,
    });
  }
  // Parent Copilot C phase
  for (const c of commands || []) {
    if (String(c.id).startsWith("c-")) {
      rows.push({
        id: c.id,
        label: "Parent Copilot suite",
        npmOrCommand: c.npmScript || c.command || "",
        status: c.status,
        ms: c.durationMs,
      });
    }
  }
  return rows;
}

function main() {
  const OUT = argOutDir();
  const finalReportPath = path.join(OUT, "FINAL_REPORT.json");
  const final = readJson(finalReportPath);
  if (!final) {
    console.error("Missing or invalid FINAL_REPORT.json under", OUT);
    process.exit(1);
  }

  const lsRoot = path.join(OUT, "copied", "learning-simulator");
  const fallbackLs = path.join(ROOT, "reports", "learning-simulator");

  function pick(rel) {
    const a = path.join(lsRoot, rel);
    if (fs.existsSync(a)) return readJson(a);
    return readJson(path.join(fallbackLs, rel));
  }

  const agg = pick(path.join("aggregate", "run-summary.json"));
  const deep = pick(path.join("deep", "run-summary.json"));
  const catalog = pick("coverage-catalog.json");
  const critical = pick("critical-matrix-deep.json");
  const samplePdf = readJson(path.join(OUT, "sample-pdfs", "sample-pdfs-summary.json"));
  const synthetic = readJson(path.join(OUT, "synthetic-e2e", "synthetic-e2e-scenarios.json"));

  const aggSc = agg?.counts?.scenarios ?? 0;
  const deepSc = deep?.counts?.scenarios ?? 0;
  const critSc = critical?.scenarioCount ?? 0;
  const synthProfiles = Array.isArray(synthetic?.profiles) ? synthetic.profiles.length : 0;
  const combinedScenarios = aggSc + deepSc + critSc + synthProfiles;

  const aggQ = agg?.totals?.questions ?? 0;
  const aggSess = agg?.totals?.sessions ?? 0;
  const deepQ = deep?.totals?.questions ?? 0;
  const deepSess = deep?.totals?.sessions ?? 0;
  const combinedQuestions = aggQ + deepQ;
  const combinedSessions = aggSess + deepSess;

  const scenarioIds = new Set();
  for (const row of agg?.perScenario || []) scenarioIds.add(row.scenarioId);
  for (const row of deep?.perScenario || []) scenarioIds.add(row.scenarioId);

  let gradesFromScenarios = new Set();
  for (const id of scenarioIds) gradesFromScenarios = new Set([...gradesFromScenarios, ...gradesFromText(id)]);

  const catAgg = catalog ? collectCatalogSubjectsLevels(catalog) : { subjects: new Map(), levels: new Map(), grades: new Map() };
  const allGrades = new Set([...gradesFromScenarios, ...catAgg.grades.keys()]);
  for (const g of Object.keys(critical?.cellsByGrade || {})) allGrades.add(g);

  const gradeList = ["g1", "g2", "g3", "g4", "g5", "g6"];
  const gradeCoverage = Object.fromEntries(gradeList.map((g) => [g, catAgg.grades.get(g) ?? (allGrades.has(g) ? 1 : 0)]));
  const missingGrades = gradeList.filter((g) => !allGrades.has(g));

  const subjectUnion = new Set([...catAgg.subjects.keys()]);
  for (const row of agg?.perScenario || []) {
    for (const s of row.subjectsTouched || []) subjectUnion.add(s);
  }
  for (const s of Object.keys(critical?.cellsBySubject || {})) subjectUnion.add(s);

  const expectedSubjects = ["hebrew", "english", "math", "geometry", "science", "moledet_geography"];
  const subjectCounts = Object.fromEntries(expectedSubjects.map((s) => [s, catAgg.subjects.get(s) ?? 0]));
  const missingSubjects = expectedSubjects.filter((s) => !subjectUnion.has(s) && (catAgg.subjects.get(s) || 0) === 0);

  const levelKeys = ["easy", "medium", "hard"];
  const difficultyCounts = Object.fromEntries(levelKeys.map((lv) => [lv, critical?.cellsByLevel?.[lv] ?? catAgg.levels.get(lv) ?? 0]));
  const missingDifficulty = levelKeys.filter((lv) => !(Number(difficultyCounts[lv]) > 0));

  const syntheticStudentRows = [];
  for (const id of [...scenarioIds].sort()) {
    syntheticStudentRows.push({
      scenarioOrProfileId: id,
      behaviorSummary: behaviorLabelForId(id),
    });
  }
  for (const p of synthetic?.profiles || []) {
    syntheticStudentRows.push({
      scenarioOrProfileId: `synthetic:${p.profile}`,
      behaviorSummary: behaviorLabelForId(p.profile),
    });
  }

  const pdfProfiles = samplePdf?.profiles || [];
  const pdfOk = samplePdf?.ok === true;
  const pdfValidationErrors = samplePdf?.validationErrors || [];
  const shortDetailedPairs = pdfProfiles.filter((p) => p.detailedPath && p.shortPath).length;

  const critAssertions = critical?.assertionCounts || {};
  const deepAssertionsFail =
    (deep?.failures || []).length > 0 ||
    (deep?.perScenario || []).some((r) => !r.reportAssertionsPass || !r.behaviorPass);

  const thresholdResults = [];
  const smokeMode = final.smokeMode === true;
  let enforce = false;
  if (process.env.OVERNIGHT_COVERAGE_ENFORCE === "1") enforce = true;
  else if (process.env.OVERNIGHT_COVERAGE_ENFORCE === "0") enforce = false;
  else enforce = !smokeMode;

  const T = {
    minGrades: numEnv("OVERNIGHT_MIN_GRADES", 6),
    minScenarios: numEnv("OVERNIGHT_MIN_SCENARIOS", 50),
    minQuestions: numEnv("OVERNIGHT_MIN_QUESTIONS", 20000),
    minSessions: numEnv("OVERNIGHT_MIN_SESSIONS", 1000),
    minPdfProfiles: numEnv("OVERNIGHT_MIN_PDF_PROFILES", 5),
    requireShortLongPdf: process.env.OVERNIGHT_REQUIRE_SHORT_AND_LONG_PDF !== "0",
  };

  function pushTh(code, pass, detail) {
    thresholdResults.push({ code, pass, detail });
  }

  pushTh("SMOKE_MODE_OFF", !smokeMode, smokeMode ? "נמצא מצב smoke — לא מיועד כשגרת השקה מלאה" : "מצב מלא");
  pushTh("GRADE_COVERAGE_6", allGrades.size >= T.minGrades, `דירוגים ייחודיים: ${allGrades.size} (נדרש ≥ ${T.minGrades})`);
  pushTh("COMBINED_SCENARIOS", combinedScenarios >= T.minScenarios, `סה״כ תרחישים משוקללים: ${combinedScenarios} (נדרש ≥ ${T.minScenarios})`);
  pushTh("COMBINED_QUESTIONS", combinedQuestions >= T.minQuestions, `סה״כ שאלות מדומות: ${combinedQuestions} (נדרש ≥ ${T.minQuestions})`);
  pushTh("COMBINED_SESSIONS", combinedSessions >= T.minSessions, `סה״כ סשנים: ${combinedSessions} (נדרש ≥ ${T.minSessions})`);
  pushTh("PDF_PROFILES", pdfProfiles.length >= T.minPdfProfiles, `פרופילי PDF: ${pdfProfiles.length} (נדרש ≥ ${T.minPdfProfiles})`);
  pushTh("PDF_SUMMARY_OK", pdfOk, pdfOk ? "sample-pdfs-summary ok" : "sample-pdfs-summary לא עבר");
  pushTh("PDF_VALIDATION_CLEAN", pdfValidationErrors.length === 0, `שגיאות ולידציית PDF: ${pdfValidationErrors.length}`);
  pushTh(
    "SHORT_AND_DETAILED_PDF",
    !T.requireShortLongPdf || shortDetailedPairs >= T.minPdfProfiles,
    `זוגות קצר/מפורט: ${shortDetailedPairs}`
  );
  pushTh("SUBJECTS_MAJOR_SET", missingSubjects.length === 0, missingSubjects.length ? `חסרים מקצועות: ${missingSubjects.join(", ")}` : "כל המקצועות המרכזיים מיוצגים");
  pushTh("DIFFICULTY_LEVELS", missingDifficulty.length === 0, missingDifficulty.length ? `חסרים רמות: ${missingDifficulty.join(", ")}` : "easy/medium/hard מכוסים בקריטיקל דיפ");
  pushTh("DEEP_ASSERTION_HEALTH", !deepAssertionsFail, deepAssertionsFail ? "כשלים בדוח עמוק או assertions" : "אין כשל assertions בעומק");

  const critInternalOk =
    !critical || Number(critAssertions.no_internal_terms ?? 0) === Number(critical.scenarioCount ?? 0);
  pushTh(
    "CRITICAL_NO_INTERNAL_TERMS",
    critInternalOk,
    critical ? `no_internal_terms=${critAssertions.no_internal_terms} vs scenarios=${critical.scenarioCount}` : "אין קובץ critical-matrix"
  );

  /** Baselines: fixtures default to 10 quick + 12 deep + 9 synthetic profiles (one round). */
  const baselineAgg = agg?.counts?.baseQuickScenarios ?? 10;
  const baselineDeep = deep?.counts?.baseDeepScenarios ?? 12;
  const baselineSyntheticProfilesOneRound = 9;

  const soakModeDetected = process.env.OVERNIGHT_SOAK === "1";
  const expansionDetected =
    aggSc > baselineAgg ||
    deepSc > baselineDeep ||
    synthProfiles > baselineSyntheticProfilesOneRound;

  if (soakModeDetected) {
    pushTh(
      "SOAK_EXPANSION",
      expansionDetected,
      expansionDetected
        ? `הרחבה מדידה: aggregate ${aggSc} (בסיס ${baselineAgg}), deep ${deepSc} (בסיס ${baselineDeep}), synthetic שורות ${synthProfiles}`
        : "SOAK mode was requested but no measurable expansion was detected vs baseline counts."
    );
  } else {
    pushTh("SOAK_EXPANSION", true, "לא ריצת soak — בדיקת הרחבה לא חלה");
  }

  let thresholdsPass = thresholdResults.every((x) => x.pass);
  if (!enforce) thresholdsPass = true;

  const gapsHe = [];
  if (combinedScenarios < T.minScenarios) gapsHe.push(`ספירת תרחישים משוקללת (${combinedScenarios}) מתחת ליעד ${T.minScenarios}`);
  if (combinedQuestions < T.minQuestions) gapsHe.push(`סה״כ שאלות (${combinedQuestions}) מתחת ליעד ${T.minQuestions}`);
  if (combinedSessions < T.minSessions) gapsHe.push(`סה״כ סשנים (${combinedSessions}) מתחת ליעד ${T.minSessions}`);
  if (missingGrades.length) gapsHe.push(`דירוגים חסרים בקטלוג: ${missingGrades.join(", ")}`);
  if (missingSubjects.length) gapsHe.push(`מקצועות שלא הופיעו בקטלוג מכוסה: ${missingSubjects.join(", ")}`);
  if (!pdfOk || pdfValidationErrors.length) gapsHe.push("וולידציית PDF או sample-pdfs-summary נכשלו");
  if (deepAssertionsFail) gapsHe.push("כשל בדוחות/התנהגות בסימולטור עמוק");

  if (soakModeDetected && !expansionDetected) {
    gapsHe.push(
      "SOAK mode was requested but no measurable expansion was detected — בדוק משתני סביבה (OVERNIGHT_STUDENT_MULTIPLIER / OVERNIGHT_TARGET_SCENARIOS) או תקלות בסימולטור."
    );
  } else if (soakModeDetected && expansionDetected) {
    gapsHe.push(
      "ריצת soak הופעלה והרחבה מדידה זוהתה (שכפול תרחישי aggregate/deep ו/או סבבי synthetic)."
    );
    gapsHe.push(
      "אופציונלי לפני השקה: הגדלת חזרות/זרעים רנדומליים (OVERNIGHT_REPEATS), העלאת OVERNIGHT_TARGET_SCENARIOS למאמץ נוסף, מעקב אחר תאים דלילים במטריצה הקריטית (בעיקר רמת קושי medium), והרחבת תרחישי קצה חסרים."
    );
  } else if (!smokeMode) {
    gapsHe.push(
      "להקשחת השקה: שקלו `npm run qa:overnight-parent-ai:soak` או הגדרת OVERNIGHT_SOAK=1 עם מכפילים — מרחיב כיסוי בלי שינה."
    );
    gapsHe.push(
      "כיסוי נוסף: רנדומיזציה, הרצות ארוכות יותר באמצעות משתני סביבה (לא שינה), ומעקב אחר דילול בתאי המטריצה."
    );
  } else {
    gapsHe.push("מצב smoke — להערכת השקה יש להריץ מסלול מלא + soak.");
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    outputDir: OUT,
    smokeMode,
    soakModeDetected,
    expansionDetected,
    expansionSummary: {
      aggregateScenarios: aggSc,
      deepScenarios: deepSc,
      syntheticRows: synthProfiles,
      sessions: combinedSessions,
      questions: combinedQuestions,
    },
    baselineReference: {
      aggregateScenariosBaseline: baselineAgg,
      deepScenariosBaseline: baselineDeep,
      syntheticProfilesOneRoundBaseline: baselineSyntheticProfilesOneRound,
    },
    enforcementEnabled: enforce,
    thresholdsPass,
    thresholdConfig: T,
    thresholdResults,
    overall: {
      totalCommands: final.commands?.length ?? 0,
      combinedScenarios,
      scenarioBreakdown: { aggregate: aggSc, deep: deepSc, criticalDeep: critSc, syntheticProfiles: synthProfiles },
      syntheticStudentsUniqueScenarioIds: scenarioIds.size,
      combinedSessions,
      combinedQuestions,
      combinedMistakes: (agg?.totals?.mistakes ?? 0) + (deep?.totals?.mistakes ?? 0),
      parentReportsGeneratedApprox: deepSc + critSc,
      pdfsGeneratedCount: samplePdf?.generatedPdfCount ?? pdfProfiles.length * 2,
      aiTestsCommands: (final.commands || []).filter((c) => c.status === "pass").length,
    },
    grades: { covered: [...allGrades].sort(), countsByCatalogRow: gradeCoverage, missing: missingGrades },
    subjects: { labels: SUBJECT_LABELS, unionFromAggregateAndCatalog: [...subjectUnion].sort(), catalogCellCounts: subjectCounts, missingExpected: missingSubjects },
    difficulty: { criticalCellsByLevel: critical?.cellsByLevel || {}, catalogLevels: Object.fromEntries(catAgg.levels), missingLevels: missingDifficulty },
    studentProfiles: syntheticStudentRows.slice(0, 200),
    parentReportQuality: {
      samplePdfProfiles: pdfProfiles.map((p) => ({
        id: p.id,
        shortPdf: Boolean(p.shortPath),
        detailedPdf: Boolean(p.detailedPath),
        status: p.status,
      })),
      criticalMatrixAssertionTotals: critAssertions,
      deepFailures: (deep?.failures || []).length,
    },
    aiModules: buildAiModuleRows(final.commands),
    gapsHebrew: gapsHe,
    sources: {
      finalReport: finalReportPath,
      learningSimulatorCopied: lsRoot,
      samplePdfs: path.join(OUT, "sample-pdfs"),
      syntheticE2e: path.join(OUT, "synthetic-e2e"),
    },
  };

  const jsonPath = path.join(OUT, "COVERAGE_MANIFEST.json");
  fs.writeFileSync(jsonPath, JSON.stringify(manifest, null, 2), "utf8");

  const mdLines = [
    `# COVERAGE_MANIFEST — כיסוי בדיקות Parent AI / Learning Simulator / דוחות הורה`,
    ``,
    `נוצר: ${manifest.generatedAt}`,
    `תיקיית ריצה: \`${OUT}\``,
    `מצב enforcement: **${enforce ? "פעיל" : "כבוי"}** | ספי כיסוי: **${thresholdsPass ? "עבר" : "נכשל"}**`,
    `Soak (\`OVERNIGHT_SOAK=1\`): **${soakModeDetected ? "כן" : "לא"}** | הרחבה מדידה: **${expansionDetected ? "כן" : "לא"}** — aggregate ${aggSc}/${baselineAgg}, deep ${deepSc}/${baselineDeep}, synthetic ${synthProfiles} שורות`,
    ``,
    `## A. היקף כולל`,
    ``,
    "| מדד | ערך |",
    "| --- | ---: |",
    `| פקודות npm/node בריצת overnight | ${manifest.overall.totalCommands} |`,
    `| תרחישים משוקללים (aggregate+deep+critical+synthetic) | ${combinedScenarios} |`,
    `| מזהי תרחיש סינתטי ייחודיים (aggregate+deep) | ${manifest.overall.syntheticStudentsUniqueScenarioIds} |`,
    `| סשנים מדומים (aggregate+deep) | ${combinedSessions} |`,
    `| שאלות מדומות (aggregate+deep) | ${combinedQuestions} |`,
    `| שורות טעות מצטברות (aggregate+deep) | ${manifest.overall.combinedMistakes} |`,
    `| דוחות הורה מוערכים (deep+critical) | ${manifest.overall.parentReportsGeneratedApprox} |`,
    `| קבצי PDF שנוצרו (דוגמאות) | ${manifest.overall.pdfsGeneratedCount} |`,
    `| פקודות בסטטוס pass | ${manifest.overall.aiTestsCommands} |`,
    ``,
    `## B. כיסוי כיתות (g1–g6)`,
    ``,
    "| כיתה | כמות תאים בקטלוג (covered) |",
    "| --- | ---: |",
    ...gradeList.map((g) => `| ${g} | ${gradeCoverage[g] ?? 0} |`),
    ``,
    `**חסרות:** ${missingGrades.length ? missingGrades.join(", ") : "—"}`,
    ``,
    `## C. כיסוי מקצועות`,
    ``,
    "| מקצוע | תאים בקטלוג |",
    "| --- | ---: |",
    ...expectedSubjects.map((s) => `| ${SUBJECT_LABELS[s] || s} | ${subjectCounts[s] ?? 0} |`),
    ``,
    `**חסרים יחסית לציפייה:** ${missingSubjects.length ? missingSubjects.map((s) => SUBJECT_LABELS[s] || s).join(", ") : "—"}`,
    ``,
    `## D. רמות קושי`,
    ``,
    "| רמה | תאים במטריצה קריטית |",
    "| --- | ---: |",
    ...levelKeys.map((lv) => `| ${lv} | ${difficultyCounts[lv] ?? 0} |`),
    ``,
    `## E. פרופילי למידה / התנהגות ילד (חינוכי בלבד)`,
    ``,
    "| מזהה | תיאור התנהגות |",
    "| --- | --- |",
    ...manifest.studentProfiles.slice(0, 40).map((r) => `| \`${r.scenarioOrProfileId}\` | ${r.behaviorSummary} |`),
    manifest.studentProfiles.length > 40 ? `\n_(מוצגות 40 ראשונות; סה״כ ${manifest.studentProfiles.length} בשורות JSON)_\n` : "",
    ``,
    `## F. דוח הורה — איכות והוכחות`,
    ``,
    "| פרופיל PDF | קצר | מפורט | סטטוס |",
    "| --- | :---: | :---: | --- |",
    ...pdfProfiles.map((p) => `| ${p.id} | ${p.shortPath ? "כן" : "לא"} | ${p.detailedPath ? "כן" : "לא"} | ${p.status || "—"} |`),
    ``,
    "### מטריצה קריטית — בדיקות איכות (מניין עבר לכל תרחיש)",
    ``,
    "| מפתח בדיקה | כמות עוברות | משמעות |",
    "| --- | ---: | --- |",
    ...Object.entries(critAssertions).map(([k, v]) => {
      const hint = {
        storage_pipeline_ok: "זרימת אחסון",
        report_build_ok: "בניית דוח",
        behavior_summary_ok: "סיכום התנהגות",
        no_crash: "ללא קריסה",
        no_internal_terms: "ללא מונחי פיתוח פנימיים בטקסט להורה",
        non_generic_report_ok: "דוח לא גנרי / ממוקד נתונים",
        no_false_strong_weak_ok: "ללא היפוך חזק/חלש שגוי",
        trend_guard_ok: "שומר מגמה סבירה",
        evidence_level_ok: "רמת עדות עקבית לנתונים",
      }[k] || k;
      return `| \`${k}\` | ${v} | ${hint} |`;
    }),
    ``,
    "### מטריצה קריטית — JSON גולמי",
    ``,
    "```json",
    JSON.stringify(critAssertions, null, 2),
    "```",
    ``,
    `## G. רכיבי AI שנבדקו (מתוך FINAL_REPORT)`,
    ``,
    "| id | סטטוס | משך (ms) | פקודה |",
    "| --- | --- | ---: | --- |",
    ...buildAiModuleRows(final.commands)
      .slice(0, 60)
      .map((r) => `| ${r.id} | ${r.status} | ${r.ms ?? ""} | ${String(r.npmOrCommand).slice(0, 80)} |`),
    ``,
    `## ספי כיסוי (launch readiness)`,
    ``,
    ...thresholdResults.map((t) => `- **${t.code}**: ${t.pass ? "✓" : "✗"} — ${t.detail}`),
    ``,
    `## H. מה עדיין לא מכוסה מספיק לפני השקה`,
    ``,
    ...gapsHe.map((g) => `- ${g}`),
    ``,
  ];

  fs.writeFileSync(path.join(OUT, "COVERAGE_MANIFEST.md"), mdLines.join("\n"), "utf8");

  console.log("COVERAGE_MANIFEST written:", jsonPath, "thresholdsPass=", thresholdsPass, "enforce=", enforce);

  if (enforce && !thresholdsPass) {
    console.error("COVERAGE thresholds FAILED — see COVERAGE_MANIFEST.md");
    process.exit(1);
  }
}

main();
