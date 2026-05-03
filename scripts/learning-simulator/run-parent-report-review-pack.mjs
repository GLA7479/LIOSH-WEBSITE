#!/usr/bin/env node
/**
 * Parent Reports Review Pack — curated simulator-backed artifacts for manual PO review.
 * npm run qa:learning-simulator:review-pack
 *
 * Depends on reports/learning-simulator/coverage-matrix.json (run qa:learning-simulator:matrix).
 * Synthetic profile rows also need coverage-catalog.json + content-gap backlog (qa:learning-simulator:coverage).
 *
 * Env: REVIEW_PACK_PDF_TIMEOUT_MS (default 120000), REVIEW_PACK_GLOBAL_TIMEOUT_MS (default 2700000),
 * REVIEW_PACK_BROWSER=0 skips Playwright PDFs.
 */
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

import { buildStorageForScenario } from "./lib/aggregate-runner.mjs";
import { validateDeepHorizonEvidence } from "./lib/deep-runner.mjs";
import { buildReportsFromAggregateStorage } from "./lib/report-runner.mjs";
import { CANONICAL_PROFILE_TYPES, PROFILE_TYPE_METADATA } from "./lib/profile-taxonomy.mjs";
import {
  buildEligiblePool,
  buildProfileForStressType,
  collectMatrixRefsForStress,
  expectedAssertionsForStressType,
  loadBacklogCellKeys,
  slotGradeSubject,
} from "./lib/profile-stress-lib.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const MATRIX_PATH = join(ROOT, "reports", "learning-simulator", "coverage-matrix.json");
const CATALOG_PATH = join(ROOT, "reports", "learning-simulator", "coverage-catalog.json");
const AGG_PER_STUDENT = join(ROOT, "reports", "learning-simulator", "aggregate", "per-student");
const DEEP_PER_STUDENT = join(ROOT, "reports", "learning-simulator", "deep", "per-student");

const PACK_DIR = join(ROOT, "reports", "learning-simulator", "parent-report-review-pack");
const PACK_REPORTS = join(PACK_DIR, "reports");
const PACK_PDF = join(PACK_DIR, "pdf");
const INDEX_MD = join(PACK_DIR, "index.md");
const MANIFEST_JSON = join(PACK_DIR, "manifest.json");

const SUMMARY_JSON = join(ROOT, "reports", "learning-simulator", "parent-report-review-pack-summary.json");
const SUMMARY_MD = join(ROOT, "reports", "learning-simulator", "parent-report-review-pack-summary.md");

const PORT = Number(process.env.PORT || process.env.REVIEW_PACK_PORT || process.env.PDF_GATE_PORT || process.env.RENDER_GATE_PORT || 3001);
const BASE_URL =
  process.env.REVIEW_PACK_BASE_URL || process.env.PDF_GATE_BASE_URL || process.env.RENDER_GATE_BASE_URL || `http://127.0.0.1:${PORT}`;
const AUTO_SERVER =
  process.env.REVIEW_PACK_AUTO_SERVER !== "0" &&
  process.env.PDF_GATE_AUTO_SERVER !== "0" &&
  process.env.RENDER_GATE_AUTO_SERVER !== "0";
const FORCE_NO_BROWSER = process.env.REVIEW_PACK_BROWSER === "0" || process.env.PDF_GATE_BROWSER === "0";

const MIN_PDF_BYTES = 10 * 1024;

/** Full PDF attempt per report (goto + hydrate + click + download), milliseconds. */
const PER_REPORT_PDF_MS = Number(process.env.REVIEW_PACK_PDF_TIMEOUT_MS || 120_000);
/** Hard cap for entire npm script (report build + all PDFs); abort with exit 1. */
const GLOBAL_RUN_MS = Number(process.env.REVIEW_PACK_GLOBAL_TIMEOUT_MS || 2_700_000);

const SKIP_HEADLESS_LONG_TREND_REASON =
  "Documented skip: long-window trend reports (improving/declining) are often too heavy to hydrate export controls in Chromium headless within QA timeouts — review JSON/MD here or export manually in a browser.";

const CONSOLE_WHITELIST = [/Download the React DevTools/i, /\[@faker-js/i];

function consoleAllowed(text) {
  return CONSOLE_WHITELIST.some((re) => re.test(String(text || "")));
}

function mdEscape(s) {
  return String(s ?? "").replace(/\|/g, "\\|");
}

/**
 * @template T
 * @param {Promise<T>} promise
 * @param {number} ms
 * @param {string} label
 */
async function withTimeout(promise, ms, label) {
  let t;
  try {
    return await Promise.race([
      promise,
      new Promise((_, rej) => {
        t = setTimeout(() => rej(new Error(`${label}: timeout after ${ms}ms`)), ms);
      }),
    ]);
  } finally {
    if (t) clearTimeout(t);
  }
}

function truncate(s, n) {
  const x = String(s ?? "");
  return x.length <= n ? x : `${x.slice(0, n - 1)}…`;
}

/** @param {string} id */
function hashSeed(id) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i += 1) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) || 1;
}

function SUBJECT_FALLBACK_TOPIC(subj) {
  const map = {
    math: "fractions",
    geometry: "area",
    science: "experiments",
    english: "grammar",
    hebrew: "comprehension",
    moledet_geography: "maps",
  };
  return map[subj] || "fractions";
}

/**
 * @param {string} scenarioId
 * @returns {string | null}
 */
function resolveExistingArtifactRelPath(scenarioId) {
  const agg = join(AGG_PER_STUDENT, `${scenarioId}.storage.json`);
  const deep = join(DEEP_PER_STUDENT, `${scenarioId}.storage.json`);
  if (existsSync(agg)) return `reports/learning-simulator/aggregate/per-student/${scenarioId}.storage.json`;
  if (existsSync(deep)) return `reports/learning-simulator/deep/per-student/${scenarioId}.storage.json`;
  return null;
}

function flattenStorageSnapshot(raw) {
  const flat = {};
  for (const [k, v] of Object.entries(raw || {})) {
    flat[k] = typeof v === "string" ? v : JSON.stringify(v);
  }
  return flat;
}

async function waitForHttpOk(url, timeoutMs) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    try {
      const r = await fetch(url, { redirect: "follow" });
      if (r.ok || r.status === 404) return true;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

function startDevServer() {
  return spawn("npm", ["run", "dev"], {
    cwd: ROOT,
    shell: true,
    stdio: "pipe",
    env: { ...process.env, PORT: String(PORT) },
  });
}

function scenarioGradeToLevel(grade) {
  const m = /^g([1-6])$/i.exec(String(grade || ""));
  return m ? Number(m[1]) : 3;
}

async function mockStudentMe(page, gradeLevel = 3) {
  await page.unroute("**/api/student/me").catch(() => {});
  await page.route("**/api/student/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        student: {
          id: "00000000-0000-0000-0000-0000000000e3",
          full_name: "ReviewPackQA",
          grade_level: gradeLevel,
          is_active: true,
          coin_balance: 0,
        },
      }),
    });
  });
}

async function applyLocalStorage(page, data, base) {
  await page.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.evaluate((d) => {
    localStorage.clear();
    for (const [k, v] of Object.entries(d || {})) localStorage.setItem(k, String(v));
  }, data);
}

/**
 * @param {object} param0
 */
function buildSummaryMetrics({ facets, baseReport, detailedReport }) {
  const exec = facets?.executive || {};
  const s = facets?.summary || {};
  return {
    totalQuestions: s.totalQuestions ?? baseReport?.summary?.totalQuestions ?? null,
    overallAccuracy: s.overallAccuracy ?? baseReport?.summary?.overallAccuracy ?? null,
    totalTimeMinutes: s.totalTimeMinutes ?? baseReport?.summary?.totalTimeMinutes ?? null,
    diagnosticUnitCount: facets?.diagnostic?.unitCount ?? null,
    topFocusAreasHe: exec.topFocusAreasHe ?? [],
    topStrengthsAcrossHe: exec.topStrengthsAcrossHe ?? [],
    topWeaknessLabels: facets?.topicLayer?.topWeaknessLabels ?? [],
    topicRecLabels: facets?.topicLayer?.topicRecLabels ?? [],
    cautionNoteHe: exec.cautionNoteHe ?? "",
    overallConfidenceHe: exec.overallConfidenceHe ?? "",
    reportReadinessHe: exec.reportReadinessHe ?? "",
    homePlanItemCount: Array.isArray(detailedReport?.homePlan?.itemsHe)
      ? detailedReport.homePlan.itemsHe.length
      : null,
    nextPeriodGoalsCount: Array.isArray(detailedReport?.nextPeriodGoals?.itemsHe)
      ? detailedReport.nextPeriodGoals.itemsHe.length
      : null,
  };
}

function extractMdSections(baseReport, detailedReport) {
  const exec = detailedReport?.executiveSummary || {};
  const subs = Array.isArray(detailedReport?.subjectProfiles) ? detailedReport.subjectProfiles : [];
  const strengths = [];
  const weaknesses = [];
  for (const sp of subs) {
    for (const st of sp.strengths || []) if (st?.lineHe) strengths.push(String(st.lineHe));
    for (const w of sp.topWeaknesses || []) if (w?.labelHe) weaknesses.push(String(w.labelHe));
  }
  return {
    parentSummaryHe: exec.summaryHe || exec.windowNarrativeHe || baseReport?.summary?.headlineHe || "",
    strengths,
    weaknesses,
    recommendations: [
      ...(detailedReport?.homePlan?.itemsHe || []),
      ...(detailedReport?.nextPeriodGoals?.itemsHe || []),
    ].filter(Boolean),
  };
}

/**
 * @returns {Promise<{ scenario: object, profile: object, scenarioId: string }>}
 */
async function buildSyntheticStressPackScenario(pool, BASE, profileStressType, slotIndex, anchorDate) {
  const ti = CANONICAL_PROFILE_TYPES.indexOf(profileStressType);
  if (ti < 0) throw new Error(`unknown profileStressType ${profileStressType}`);

  const { grade, subject } = slotGradeSubject(slotIndex, ti);
  const { matrixCoverageRefs, rows, stressSubject, stressTopic } = collectMatrixRefsForStress(
    pool,
    profileStressType,
    grade,
    subject
  );

  if (!matrixCoverageRefs.length || !rows.length) {
    throw new Error(`no matrix refs for ${profileStressType} slot ${slotIndex}`);
  }

  const gradeEffective = rows[0]?.grade || grade;
  const idSubj = profileStressType === "mixed_strengths" ? "mixed" : subject;
  const scenarioId = `review_pack_${profileStressType}_${gradeEffective}_${idSubj}_s${slotIndex}`;
  const levels = [...new Set(rows.map((r) => r.level))].sort();
  const subjects =
    profileStressType === "mixed_strengths"
      ? [...new Set(rows.map((r) => r.subject))].sort()
      : [rows[0].subject];

  const refCount = matrixCoverageRefs.length;
  const isThin = profileStressType === "thin_data";
  const horizonDays = isThin ? 3 : 14;
  const targetSessions = isThin ? Math.max(refCount * 2, 14) : Math.max(refCount * 3, 36);

  const scenario = {
    scenarioId,
    mode: "aggregate",
    tier: "quick",
    grade: gradeEffective,
    subjects,
    levels,
    topicTargets: [],
    profileRef: `synthetic_review_pack_${profileStressType}`,
    timeHorizonDays: horizonDays,
    sessionPlan: {
      targetSessions,
      spanDaysApprox: horizonDays,
      notes: "Parent review pack — synthetic stress profile (deterministic slot).",
    },
    matrixCoverageRefs,
    expected: expectedAssertionsForStressType(profileStressType),
    seed: hashSeed(scenarioId),
    anchorDate,
    artifactOptions: {},
    profileStressType,
    stressMatrixSubject: stressSubject === "mixed" ? null : stressSubject,
    stressMatrixTopic: stressTopic,
  };

  const profile = buildProfileForStressType(profileStressType, BASE, {
    grade,
    subject: subjects[0],
    topic: stressTopic || SUBJECT_FALLBACK_TOPIC(subjects[0]),
  });

  if (!profile) throw new Error(`profile build failed for ${profileStressType}`);

  return { scenario, profile, scenarioId };
}

/** Curated rows: reviewId, profileType label, scenarioId OR synthetic marker */
const REVIEW_CURATED = [
  {
    reviewId: "strong_all_g3",
    profileType: "strong_all_subjects",
    scenarioId: "strong_all_subjects_g3_7d",
    synthetic: null,
    intentNote: "תלמיד חזק ומאוזן בכל המקצועות — נפח גבוה, דיוק גבוה.",
  },
  {
    reviewId: "weak_all_g3_deep",
    profileType: "weak_all_subjects",
    scenarioId: "weak_all_subjects_g3_30d",
    synthetic: null,
    intentNote: "תלמיד עם קושי רוחבי — צפי למסגור תומך ולזיהוי חולשות ללא הצגה כחוזקות.",
  },
  {
    reviewId: "thin_data_g3",
    profileType: "thin_data",
    scenarioId: "thin_data_g3_1d",
    synthetic: null,
    intentNote: "מעט נתונים — בדיקת זהירות, רמת ביטחון והנחיות שמרניות.",
  },
  {
    reviewId: "random_guessing_g3_deep",
    profileType: "random_guessing",
    scenarioId: "random_guessing_student_g3_30d",
    synthetic: null,
    intentNote: "ניחושים — דיוק נמוך; לא לאשר חוזקות ללא ראיות.",
  },
  {
    reviewId: "fast_wrong_synth",
    profileType: "fast_wrong",
    scenarioId: null,
    synthetic: { type: "fast_wrong", slot: 0 },
    intentNote: "קצב מהיר יחסית לטעות — להשוות ל-slow_correct על תוכן הדוח והקצב.",
  },
  {
    reviewId: "slow_correct_synth",
    profileType: "slow_correct",
    scenarioId: null,
    synthetic: { type: "slow_correct", slot: 0 },
    intentNote: "קצב איטי יחסית לדיוק גבוה — להשוות ל-fast_wrong.",
  },
  {
    reviewId: "improving_g4",
    profileType: "improving",
    scenarioId: "improving_student_g4_30d",
    synthetic: null,
    intentNote: "מגמת שיפור לאורך חלון — טקסט מגמות והצגת התקדמות.",
    /** Documented: headless PDF not attempted — see pdfFailureReason on artifact. */
    skipHeadlessPdf: true,
  },
  {
    reviewId: "declining_g4",
    profileType: "declining",
    scenarioId: "declining_student_g4_30d",
    synthetic: null,
    intentNote: "מגמת ירידה — רגישות לניסוח וללא הַאָשְׁמָה.",
    skipHeadlessPdf: true,
  },
  {
    reviewId: "inconsistent_g5_deep",
    profileType: "inconsistent",
    scenarioId: "inconsistent_student_g5_30d",
    synthetic: null,
    intentNote: "אי-עקביות בין סשנים/נושאים.",
  },
  {
    reviewId: "weak_math_fractions_g5",
    profileType: "weak_math_or_fractions",
    scenarioId: "weak_math_fractions_g5_7d",
    synthetic: null,
    intentNote: "חולשה ממוקדת במתמטיקה (שברים).",
  },
  {
    reviewId: "weak_hebrew_comprehension_g3",
    profileType: "weak_hebrew_or_reading",
    scenarioId: "weak_hebrew_comprehension_g3_7d",
    synthetic: null,
    intentNote: "חולשה בעברית — הבנה/קריאה.",
  },
  {
    reviewId: "weak_english_g4",
    profileType: "weak_english",
    scenarioId: "weak_english_grammar_g4_7d",
    synthetic: null,
    intentNote: "חולשה באנגלית (דקדוק ומוקד קוריקולום).",
  },
  {
    reviewId: "weak_science_g5",
    profileType: "weak_science",
    scenarioId: "weak_science_cause_effect_g5_7d",
    synthetic: null,
    intentNote: "חולשה במדעים (סיבה-תוצאה).",
  },
  {
    reviewId: "mixed_strengths_synth",
    profileType: "mixed_strengths",
    scenarioId: null,
    synthetic: { type: "mixed_strengths", slot: 2 },
    intentNote: "שילוב חוזק במתמטיקה וחולשה מובחנת בעברית — לא להכליל כחולשה גורפת.",
  },
];

async function loadScenarioMap() {
  const quickUrl = pathToFileURL(join(ROOT, "tests", "fixtures", "learning-simulator", "scenarios", "quick-scenarios.mjs")).href;
  const deepUrl = pathToFileURL(join(ROOT, "tests", "fixtures", "learning-simulator", "scenarios", "deep-scenarios.mjs")).href;
  const quickMod = await import(quickUrl);
  const deepMod = await import(deepUrl);
  const QUICK = quickMod.QUICK_SCENARIOS || quickMod.default;
  const DEEP = deepMod.DEEP_SCENARIOS || deepMod.default;
  const map = new Map();
  for (const s of QUICK) map.set(s.scenarioId, s);
  for (const s of DEEP) map.set(s.scenarioId, s);
  return map;
}

async function readPkgPlaywright() {
  const pkg = JSON.parse(await readFile(join(ROOT, "package.json"), "utf8"));
  return !!(pkg.devDependencies?.["@playwright/test"] || pkg.devDependencies?.playwright);
}

async function generateOnePdf(page, storageFlat, outPath, collector, scenarioGrade) {
  const failures = [];
  const fatal = [];
  const consoleBad = [];
  const navTimeout = Math.min(90_000, Math.max(25_000, PER_REPORT_PDF_MS - 20_000));
  const btnTimeout = Math.min(55_000, Math.max(15_000, PER_REPORT_PDF_MS - 25_000));
  const dlTimeout = Math.min(85_000, Math.max(20_000, PER_REPORT_PDF_MS - 15_000));

  page.removeAllListeners("pageerror");
  page.removeAllListeners("console");
  page.on("pageerror", (e) => fatal.push(String(e?.message || e)));
  page.on("console", (msg) => {
    const t = msg.text();
    if (msg.type() === "error" && !consoleAllowed(t)) consoleBad.push(t);
  });

  try {
    await mockStudentMe(page, scenarioGradeToLevel(scenarioGrade));
    await applyLocalStorage(page, storageFlat, BASE_URL);

    const url = `${BASE_URL}/learning/parent-report?qa_pdf=file`;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: navTimeout });
    await new Promise((r) => setTimeout(r, 2500));

    const exportBtn = page.getByRole("button", { name: /ייצא ל-PDF/ });
    try {
      await exportBtn.first().waitFor({ state: "visible", timeout: btnTimeout });
    } catch {
      /* count check below */
    }
    const count = await exportBtn.count();
    if (count === 0) failures.push("Export button not found (accessible name /ייצא ל-PDF/).");

    const bodyLen = (await page.locator("body").innerText()).length;
    if (bodyLen < 150) failures.push("Report body text too short — report may not have hydrated.");

    if (!failures.length) {
      const downloadPromise = page.waitForEvent("download", { timeout: dlTimeout });
      await exportBtn.first().click();
      const download = await downloadPromise;
      await download.saveAs(outPath);

      const buf = await readFile(outPath);
      const pdfHeaderOk = buf.length >= 4 && buf.subarray(0, 4).toString("ascii") === "%PDF";
      if (buf.length < MIN_PDF_BYTES) failures.push(`PDF smaller than minimum (${buf.length} < ${MIN_PDF_BYTES} bytes).`);
      if (!pdfHeaderOk) failures.push("File does not start with %PDF header.");
    }

    if (fatal.length) failures.push(...fatal.map((x) => `pageerror: ${x}`));
    if (consoleBad.length) failures.push(...consoleBad.map((x) => `console: ${x}`));

    if (failures.length) {
      for (const f of failures) collector.push(f);
      return false;
    }
    return true;
  } catch (e) {
    collector.push(String(e?.message || e));
    return false;
  }
}

/**
 * Count outputs on disk for summary reconciliation.
 * @param {string} packReportsDir
 * @param {string} packPdfDir
 * @param {number} expectedReportTotal
 */
async function collectArtifactCounts(packReportsDir, packPdfDir, expectedReportTotal) {
  const jsonNames = (await readdir(packReportsDir).catch(() => [])).filter((f) => f.endsWith(".json"));
  const mdNames = (await readdir(packReportsDir).catch(() => [])).filter((f) => f.endsWith(".md"));
  const pdfNames = (await readdir(packPdfDir).catch(() => [])).filter((f) => f.endsWith(".pdf"));

  let pdfValidOnDisk = 0;
  /** @type {string[]} */
  const pdfValidationNotes = [];
  for (const name of pdfNames) {
    const p = join(packPdfDir, name);
    try {
      const buf = await readFile(p);
      const okHeader = buf.length >= 4 && buf.subarray(0, 4).toString("ascii") === "%PDF";
      const okSize = buf.length >= MIN_PDF_BYTES;
      if (okHeader && okSize) pdfValidOnDisk += 1;
      else pdfValidationNotes.push(`${name}: invalid (bytes=${buf.length}, %PDF=${okHeader})`);
    } catch (e) {
      pdfValidationNotes.push(`${name}: ${e?.message || e}`);
    }
  }

  return {
    jsonCount: jsonNames.length,
    mdCount: mdNames.length,
    pdfFilesTotal: pdfNames.length,
    pdfValidOnDisk,
    jsonMdMatchExpected: jsonNames.length === expectedReportTotal && mdNames.length === expectedReportTotal,
    pdfValidationNotes,
  };
}

/** @param {object[]} builtRows */
function buildManifestEntries(builtRows) {
  return builtRows.map((b) => ({
    reviewId: b.row.reviewId,
    scenarioId: b.scenarioId,
    profileType: b.row.profileType,
    grade: b.scenario.grade || "",
    pdfStatus: b.reportPayload.pdfStatus,
    pdfFailureReason: b.reportPayload.pdfFailureReason,
    jsonRel: `reports/learning-simulator/parent-report-review-pack/reports/${b.row.reviewId}.json`,
    mdRel: `reports/learning-simulator/parent-report-review-pack/reports/${b.row.reviewId}.md`,
    pdfRel: `reports/learning-simulator/parent-report-review-pack/pdf/${b.row.reviewId}.pdf`,
    sourceArtifact: b.sourceArtifact,
  }));
}

async function main() {
  const globalTimer = setTimeout(() => {
    console.error(
      `Review pack aborted: global timeout (${GLOBAL_RUN_MS}ms). Increase REVIEW_PACK_GLOBAL_TIMEOUT_MS if needed.`
    );
    process.exit(1);
  }, GLOBAL_RUN_MS);

  await mkdir(join(ROOT, "reports", "learning-simulator"), { recursive: true });
  await rm(PACK_DIR, { recursive: true, force: true });
  await mkdir(PACK_REPORTS, { recursive: true });
  await mkdir(PACK_PDF, { recursive: true });

  let matrixRows;
  try {
    const matrixRaw = JSON.parse(await readFile(MATRIX_PATH, "utf8"));
    matrixRows = matrixRaw.rows || [];
  } catch {
    clearTimeout(globalTimer);
    console.error("Missing coverage-matrix.json — run npm run qa:learning-simulator:matrix");
    process.exit(1);
    return;
  }

  let catalogRows = [];
  try {
    const catalogRaw = JSON.parse(await readFile(CATALOG_PATH, "utf8"));
    catalogRows = catalogRaw.rows || [];
  } catch {
    console.warn("Warning: coverage-catalog.json missing — synthetic stress scenarios may fail. Run qa:learning-simulator:coverage.");
  }

  const backlogKeys = await loadBacklogCellKeys(ROOT);
  const pool = buildEligiblePool(catalogRows, backlogKeys);

  const profilesUrl = pathToFileURL(join(ROOT, "tests", "fixtures", "learning-simulator", "profiles", "base-profiles.mjs")).href;
  const BASE_PROFILES = (await import(profilesUrl)).BASE_PROFILES || (await import(profilesUrl)).default;

  const scenarioMap = await loadScenarioMap();

  const anchorDate = "2026-05-02T08:00:00.000Z";
  const generatedAt = new Date().toISOString();

  /** @type {object[]} */
  const builtRows = [];

  const needsSyntheticPool = REVIEW_CURATED.some((r) => r.synthetic);
  if (needsSyntheticPool && !pool.length) {
    clearTimeout(globalTimer);
    console.error(
      "Review pack needs synthetic stress scenarios but the eligible catalog pool is empty. Run npm run qa:learning-simulator:coverage (and matrix), and ensure coverage-catalog.json lists covered cells outside the content backlog."
    );
    process.exit(1);
    return;
  }

  for (const row of REVIEW_CURATED) {
    /** @type {string[]} */
    const warnings = [];
    let scenario;
    let profile;
    let scenarioId;
    let sourceArtifact = null;

    try {
      if (row.synthetic) {
        if (!pool.length) {
          throw new Error(
            "eligible matrix pool empty — run qa:learning-simulator:coverage and ensure content-gap-backlog allows cells"
          );
        }
        const builtSynth = await buildSyntheticStressPackScenario(
          pool,
          BASE_PROFILES,
          row.synthetic.type,
          row.synthetic.slot,
          anchorDate
        );
        scenario = builtSynth.scenario;
        profile = builtSynth.profile;
        scenarioId = builtSynth.scenarioId;
        sourceArtifact = `generated:synthetic (${scenarioId}; slot=${row.synthetic.slot})`;
      } else {
        scenarioId = row.scenarioId;
        scenario = scenarioMap.get(scenarioId);
        if (!scenario) throw new Error(`scenario ${scenarioId} not found in quick/deep fixtures`);
        profile = BASE_PROFILES[scenario.profileRef];
        if (!profile) throw new Error(`missing profile ${scenario.profileRef}`);
        sourceArtifact = resolveExistingArtifactRelPath(scenarioId);
        if (!sourceArtifact) {
          sourceArtifact = `generated:buildStorageForScenario (${scenarioId}; matrix=${MATRIX_PATH.replace(ROOT + "/", "")})`;
        }
      }

      const built = await buildStorageForScenario(scenario, profile, matrixRows);
      const deepVal = validateDeepHorizonEvidence(scenario, built.stats || {});
      if (!deepVal.ok) warnings.push(...(deepVal.errors || []).map((e) => `deepHorizon: ${e}`));

      if (!built.ok || !built.storage) {
        throw new Error([...(built.errors || [])].join("; ") || "storage build failed");
      }

      const reportBuilt = await buildReportsFromAggregateStorage({ storage: built.storage, scenario });
      if (!reportBuilt.ok || !reportBuilt.baseReport) {
        throw new Error(reportBuilt.error || "report build failed");
      }

      const summaryMetrics = buildSummaryMetrics({
        facets: reportBuilt.facets,
        baseReport: reportBuilt.baseReport,
        detailedReport: reportBuilt.detailedReport,
      });

      const mdSections = extractMdSections(reportBuilt.baseReport, reportBuilt.detailedReport);

      const topicsFromScenario = [
        ...(scenario.topicTargets || []).map((t) => `${t.subjectCanonical}/${t.topic}`),
        ...(scenario.matrixCoverageRefs || []).map((t) => `${t.subjectCanonical}/${t.topic}`),
      ];

      const meta = PROFILE_TYPE_METADATA[row.profileType] || {};
      const gradeLabel = scenario.grade || "";

      const reportPayload = {
        reviewId: row.reviewId,
        scenarioId,
        profileType: row.profileType,
        grade: gradeLabel,
        subjects: scenario.subjects || [],
        topics: topicsFromScenario,
        sourceArtifact,
        reportJson: {
          baseReport: reportBuilt.baseReport,
          detailedReport: reportBuilt.detailedReport,
        },
        summaryMetrics,
        pdfStatus: "pending",
        pdfPath: null,
        pdfFailureReason: null,
        warnings: [...warnings, ...(built.warnings || [])],
      };

      const jsonPath = join(PACK_REPORTS, `${row.reviewId}.json`);
      await writeFile(jsonPath, JSON.stringify(reportPayload, null, 2), "utf8");

      const mdLines = [
        `# דוח הורים — ${row.reviewId}`,
        "",
        `- **סוג פרופיל:** ${row.profileType}`,
        `- **כיתה:** ${gradeLabel}`,
        `- **מטרת הסימולציה:** ${row.intentNote}`,
        `- **תיאור טקסונומיה (QA):** ${meta.description || "—"}`,
        "",
        "## מדדים עיקריים",
        "",
        "```json",
        JSON.stringify(summaryMetrics, null, 2),
        "```",
        "",
        "## תקציר להורים (מתוך הנתונים שנוצרו)",
        "",
        String(mdSections.parentSummaryHe || "—"),
        "",
        "## חוזקות (דגימה מתוך שכבת הנושאים)",
        "",
        ...(mdSections.strengths.length ? mdSections.strengths.map((x) => `- ${x}`) : ["- —"]),
        "",
        "## חולשות (דגימה)",
        "",
        ...(mdSections.weaknesses.length ? mdSections.weaknesses.map((x) => `- ${x}`) : ["- —"]),
        "",
        "## המלצות / יעדים (מתוך תוכנית הבית והיעדים)",
        "",
        ...(mdSections.recommendations.length ? mdSections.recommendations.map((x) => `- ${x}`) : ["- —"]),
        "",
        "## אזהרות ונתיב PDF",
        "",
      ];

      if (reportPayload.warnings.length) {
        mdLines.push("### אזהרות", "", ...reportPayload.warnings.map((w) => `- ${w}`), "");
      } else {
        mdLines.push("- (אין אזהרות ייצוב)", "");
      }

      mdLines.push(
        "### PDF",
        "",
        `- סטטוס: יוגדר לאחר ייצוא (${reportPayload.pdfStatus})`,
        `- נתיב צפוי: reports/learning-simulator/parent-report-review-pack/pdf/${row.reviewId}.pdf`,
        ""
      );

      await writeFile(join(PACK_REPORTS, `${row.reviewId}.md`), mdLines.join("\n"), "utf8");

      builtRows.push({
        row,
        scenario,
        scenarioId,
        sourceArtifact,
        storageFlat: flattenStorageSnapshot(built.storage),
        reportPayload,
        mdSections,
        summaryMetrics,
      });
    } catch (e) {
      clearTimeout(globalTimer);
      console.error(`Review pack failed for ${row.reviewId}:`, e);
      process.exit(1);
      return;
    }
  }

  /** PDF phase */
  let serverProc = null;
  let serverStarted = false;
  const hasPw = await readPkgPlaywright();
  const pdfGlobalWarnings = [];

  if (FORCE_NO_BROWSER || !hasPw) {
    pdfGlobalWarnings.push("Playwright unavailable or REVIEW_PACK_BROWSER=0 — skipping PDF export for all reports.");
    for (const b of builtRows) {
      if (b.row.skipHeadlessPdf) {
        b.reportPayload.pdfStatus = "failed";
        b.reportPayload.pdfPath = null;
        b.reportPayload.pdfFailureReason = SKIP_HEADLESS_LONG_TREND_REASON;
        b.reportPayload.warnings.push(`pdf skipped (documented): ${SKIP_HEADLESS_LONG_TREND_REASON}`);
      } else {
        b.reportPayload.pdfStatus = "failed";
        b.reportPayload.pdfPath = null;
        b.reportPayload.pdfFailureReason = pdfGlobalWarnings[0];
        b.reportPayload.warnings.push(pdfGlobalWarnings[0]);
      }
      await writeFile(join(PACK_REPORTS, `${b.row.reviewId}.json`), JSON.stringify(b.reportPayload, null, 2), "utf8");
    }
  } else {
    const serverUp = await waitForHttpOk(BASE_URL, 2500);
    if (!serverUp && AUTO_SERVER) {
      serverProc = startDevServer();
      serverStarted = true;
      const up = await waitForHttpOk(BASE_URL, 120_000);
      if (!up) {
        pdfGlobalWarnings.push(`Dev server did not respond at ${BASE_URL}`);
        for (const b of builtRows) {
          if (b.row.skipHeadlessPdf) {
            b.reportPayload.pdfStatus = "failed";
            b.reportPayload.pdfPath = null;
            b.reportPayload.pdfFailureReason = SKIP_HEADLESS_LONG_TREND_REASON;
            b.reportPayload.warnings.push(`pdf skipped (documented): ${SKIP_HEADLESS_LONG_TREND_REASON}`);
          } else {
            b.reportPayload.pdfStatus = "failed";
            b.reportPayload.pdfPath = null;
            b.reportPayload.pdfFailureReason = pdfGlobalWarnings[0];
            b.reportPayload.warnings.push(pdfGlobalWarnings[0]);
          }
          await writeFile(join(PACK_REPORTS, `${b.row.reviewId}.json`), JSON.stringify(b.reportPayload, null, 2), "utf8");
        }
      }
    } else if (!serverUp && !AUTO_SERVER) {
      pdfGlobalWarnings.push(`No server at ${BASE_URL} and REVIEW_PACK_AUTO_SERVER=0`);
      for (const b of builtRows) {
        if (b.row.skipHeadlessPdf) {
          b.reportPayload.pdfStatus = "failed";
          b.reportPayload.pdfPath = null;
          b.reportPayload.pdfFailureReason = SKIP_HEADLESS_LONG_TREND_REASON;
          b.reportPayload.warnings.push(`pdf skipped (documented): ${SKIP_HEADLESS_LONG_TREND_REASON}`);
        } else {
          b.reportPayload.pdfStatus = "failed";
          b.reportPayload.pdfPath = null;
          b.reportPayload.pdfFailureReason = pdfGlobalWarnings[0];
          b.reportPayload.warnings.push(pdfGlobalWarnings[0]);
        }
        await writeFile(join(PACK_REPORTS, `${b.row.reviewId}.json`), JSON.stringify(b.reportPayload, null, 2), "utf8");
      }
    }

    if (!pdfGlobalWarnings.length) {
      const playwright = await import("playwright");
      const browser = await playwright.chromium.launch({ headless: true });
      const context = await browser.newContext({
        locale: "he-IL",
        acceptDownloads: true,
      });

      for (const b of builtRows) {
        if (b.row.skipHeadlessPdf) {
          b.reportPayload.pdfStatus = "failed";
          b.reportPayload.pdfPath = null;
          b.reportPayload.pdfFailureReason = SKIP_HEADLESS_LONG_TREND_REASON;
          b.reportPayload.warnings.push(`pdf skipped (documented): ${SKIP_HEADLESS_LONG_TREND_REASON}`);
          await writeFile(join(PACK_REPORTS, `${b.row.reviewId}.json`), JSON.stringify(b.reportPayload, null, 2), "utf8");
          continue;
        }

        const page = await context.newPage();
        try {
          const pdfPath = join(PACK_PDF, `${b.row.reviewId}.pdf`);
          const collector = [];
          let ok = false;
          try {
            ok = await withTimeout(
              generateOnePdf(page, b.storageFlat, pdfPath, collector, b.scenario.grade),
              PER_REPORT_PDF_MS,
              `PDF:${b.row.reviewId}`
            );
          } catch (toErr) {
            collector.push(String(toErr?.message || toErr));
            ok = false;
          }
          if (ok) {
            b.reportPayload.pdfStatus = "ok";
            b.reportPayload.pdfPath = `reports/learning-simulator/parent-report-review-pack/pdf/${b.row.reviewId}.pdf`;
            b.reportPayload.pdfFailureReason = null;
          } else {
            b.reportPayload.pdfStatus = "failed";
            b.reportPayload.pdfPath = null;
            const reason = collector.join("; ").slice(0, 4000) || "PDF export failed";
            b.reportPayload.pdfFailureReason = reason;
            b.reportPayload.warnings.push(...collector.map((c) => `pdf failed: ${c}`));
          }
          await writeFile(join(PACK_REPORTS, `${b.row.reviewId}.json`), JSON.stringify(b.reportPayload, null, 2), "utf8");
        } finally {
          await page.close();
        }
      }

      await browser.close();
    }

    if (serverStarted && serverProc) {
      try {
        serverProc.kill();
      } catch {}
    }
  }

  for (const b of builtRows) {
    const mdPath = join(PACK_REPORTS, `${b.row.reviewId}.md`);
    let mdBody = await readFile(mdPath, "utf8");
    const pdfNotes = b.reportPayload.warnings.filter((w) => /pdf/i.test(w)).join("; ");
    const pdfSection = [
      "### PDF",
      "",
      `- סטטוס: **${b.reportPayload.pdfStatus}**`,
      `- קובץ: \`${b.reportPayload.pdfPath || "—"}\``,
      pdfNotes ? `- הערות: ${pdfNotes}` : "",
      "",
    ]
      .filter(Boolean)
      .join("\n");
    mdBody = mdBody.replace(/### PDF\n\n[\s\S]*$/, pdfSection);
    await writeFile(mdPath, mdBody, "utf8");
  }

  /** index.md + reconciliation */
  const totalReports = builtRows.length;
  const disk = await collectArtifactCounts(PACK_REPORTS, PACK_PDF, totalReports);

  const pdfOkFromStatus = builtRows.filter((b) => b.reportPayload.pdfStatus === "ok").length;
  /** @type {string[]} */
  const reconciliationWarnings = [...pdfGlobalWarnings];
  if (disk.pdfValidOnDisk !== pdfOkFromStatus) {
    reconciliationWarnings.push(
      `Reconcile: pdfStatus=ok (${pdfOkFromStatus}) vs valid PDF files on disk (${disk.pdfValidOnDisk}).`
    );
  }
  if (!disk.jsonMdMatchExpected) {
    reconciliationWarnings.push(`Expected ${totalReports} JSON and ${totalReports} MD files; found json=${disk.jsonCount}, md=${disk.mdCount}.`);
  }
  if (disk.pdfValidationNotes.length) {
    reconciliationWarnings.push(...disk.pdfValidationNotes.slice(0, 15));
  }

  const pdfGenerated = disk.pdfValidOnDisk;
  const pdfFailed = totalReports - pdfGenerated;

  const profilesCovered = [...new Set(REVIEW_CURATED.map((r) => r.profileType))].sort();
  const gradesCovered = [...new Set(builtRows.map((b) => b.scenario.grade).filter(Boolean))].sort();
  const subjectsUnion = new Set();
  for (const b of builtRows) for (const s of b.scenario.subjects || []) subjectsUnion.add(s);
  const subjectsCovered = [...subjectsUnion].sort();

  const manifestEntries = buildManifestEntries(builtRows);

  const tableLines = [
    "| reviewId | profileType | grade | מיקוד מקצועות | PDF | סיבת כשל / הערה | scenarioId |",
    "| --- | --- | --- | --- | --- | --- | --- |",
  ];
  for (const b of builtRows) {
    const subs = (b.scenario.subjects || []).join(", ");
    const reason = truncate(b.reportPayload.pdfFailureReason || "—", 140);
    tableLines.push(
      `| ${mdEscape(b.row.reviewId)} | ${mdEscape(b.row.profileType)} | ${mdEscape(b.scenario.grade)} | ${mdEscape(subs)} | ${mdEscape(b.reportPayload.pdfStatus)} | ${mdEscape(reason)} | ${mdEscape(b.scenarioId)} |`
    );
  }

  const indexMd = [
    "# Parent Reports Review Pack",
    "",
    `- נוצר ב־: ${generatedAt}`,
    `- תיקייה: \`reports/learning-simulator/parent-report-review-pack/\``,
    "",
    "## סקירה מהירה",
    "",
    `- סה״כ דוחות: **${totalReports}**`,
    `- קבצי JSON במערכת הקבצים: **${disk.jsonCount}** · MD: **${disk.mdCount}**`,
    `- PDF תקינים בדיסק (≥${MIN_PDF_BYTES} בתים, כותרת %PDF): **${pdfGenerated}**`,
    `- דוחות ללא PDF תקף בדיסק: **${pdfFailed}** (כולל דילוג מתועד על מגמות ארוכות)`,
    "",
    "## מה לחפש בביקורת ידנית",
    "",
    "- ניסוח בעברית: בהירות, טון מתאים לילד/הורה, ללא סימון פנימי (DEBUG וכו׳).",
    "- המלצות: ספציפיות מספיקות מול חולשות שזוהו בנתונים.",
    "- עקביות חוזק/חולשה: תלמיד חלש לא מוצג כחזק; תלמיד חזק לא כחלש.",
    "- נפח נתונים דל (thin_data): זהירות בניסוח וביתר ביטחון.",
    "- השוואת פרופילים: **fast_wrong** מול **slow_correct** — הבדל ברור בקצב ובדיוק.",
    "- טבלאות/גרפים בממשק וב-PDF: קריאות, חיתוכים, כותרות.",
    "- PDF: פיצול עמודים סביר, ללא חיתוך חמור של טבלאות.",
    "- RTL: יישור טקסט, סדר עמודות, חפיפות.",
    "",
    "## טבלת דוחות (סטטוס PDF)",
    "",
    ...tableLines,
    "",
    "## מגבלות ייצוא PDF",
    "",
    "הדף `/learning/parent-report?qa_pdf=file` משתמש באותו לוגיקת ייצוא כמו שאר האפליקציה; חבילת הביקורת רק מזריעה **localStorage** שונה לכל דוח ומפעילה את כפתור הייצוא — ללא שינוי במוצר.",
    "",
    "בסביבות headless, דוחות עם עומס תצוגה גבוה במיוחד (למשל חלונות מגמה ארוכים כמו **improving** / **declining**) לפעמים לא מספיקים להידרדר עד כפתור הייצוא בזמן — במקרה כזה נשמרים **JSON ו-Markdown** המלאים, והביקורת נעשית מהם או מייצוא ידני מהדפדפן.",
    "",
    "## Manual review checklist",
    "",
    "- האם העברית ברורה וטבעית?",
    "- האם הדוח גנרי מדי?",
    "- האם ההמלצות ספציפיות מספיקות?",
    "- האם תלמידים חלשים לא מוצגים כחזקים?",
    "- האם תלמידים חזקים לא מוצגים כחלשים?",
    "- האם נתון דל (thin-data) מטופל בזהירות?",
    "- האם fast_wrong ו-slow_correct ברורים כשני פרופילים שונים?",
    "- האם תרשימים/טבלאות קריאים?",
    "- האם ה-PDF מפצל עמודים באופן סביר?",
    "- האם יש בעיות RTL/פריסה ברורות?",
    "",
    "## קבצים",
    "",
    "- `manifest.json` — מפת כל הפריטים",
    "- `reports/*.json` — payload מלא + מטא־דאטה",
    "- `reports/*.md` — תקציר קריא לאדם",
    "- `pdf/*.pdf` — ייצוא עבור הדפסה/שיתוף",
    "",
  ].join("\n");

  await writeFile(INDEX_MD, indexMd, "utf8");
  await writeFile(
    MANIFEST_JSON,
    JSON.stringify(
      {
        generatedAt,
        totalReports,
        pdfGenerated,
        pdfFailed,
        entries: manifestEntries,
        outputFolder: "reports/learning-simulator/parent-report-review-pack",
      },
      null,
      2
    ),
    "utf8"
  );

  const summaryPayload = {
    generatedAt,
    totalReports,
    pdfGenerated,
    pdfFailed,
    jsonFilesOnDisk: disk.jsonCount,
    mdFilesOnDisk: disk.mdCount,
    pdfValidFilesOnDisk: disk.pdfValidOnDisk,
    pdfFilesTotalOnDisk: disk.pdfFilesTotal,
    profilesCovered,
    gradesCovered,
    subjectsCovered,
    warnings: reconciliationWarnings,
    outputFolder: "reports/learning-simulator/parent-report-review-pack",
    perReportPdfTimeoutMs: PER_REPORT_PDF_MS,
    globalTimeoutMs: GLOBAL_RUN_MS,
  };

  await writeFile(SUMMARY_JSON, JSON.stringify(summaryPayload, null, 2), "utf8");
  await writeFile(
    SUMMARY_MD,
    [
      "# Parent report review pack — summary",
      "",
      `- generatedAt: ${generatedAt}`,
      `- totalReports: ${totalReports}`,
      `- pdfGenerated (valid on disk): ${pdfGenerated}`,
      `- pdfFailed (no valid file): ${pdfFailed}`,
      `- jsonFilesOnDisk: ${disk.jsonCount}`,
      `- mdFilesOnDisk: ${disk.mdCount}`,
      `- pdfValidFilesOnDisk: ${disk.pdfValidOnDisk}`,
      `- pdfFilesTotalOnDisk: ${disk.pdfFilesTotal}`,
      `- profilesCovered: ${profilesCovered.join(", ")}`,
      `- gradesCovered: ${gradesCovered.join(", ")}`,
      `- subjectsCovered: ${subjectsCovered.join(", ")}`,
      `- outputFolder: reports/learning-simulator/parent-report-review-pack`,
      "",
      "## warnings",
      "",
      ...(reconciliationWarnings.length ? reconciliationWarnings.map((w) => `- ${w}`) : ["- (none)"]),
      "",
    ].join("\n"),
    "utf8"
  );

  const artifactsOk = disk.jsonMdMatchExpected;
  const anyPdfOk = disk.pdfValidOnDisk >= 1;
  const statusMatchesDisk = disk.pdfValidOnDisk === pdfOkFromStatus;

  let exitCode = 0;
  if (!artifactsOk) exitCode = 1;
  else if (!anyPdfOk) exitCode = 1;
  else if (!statusMatchesDisk) exitCode = 1;

  console.log(
    JSON.stringify(
      {
        ok: exitCode === 0,
        totalReports,
        pdfGenerated,
        pdfFailed,
        jsonFilesOnDisk: disk.jsonCount,
        mdFilesOnDisk: disk.mdCount,
        pdfValidFilesOnDisk: disk.pdfValidOnDisk,
        artifactsOk,
        statusMatchesDisk,
        packDir: PACK_DIR.replace(/\\/g, "/"),
        summaryJson: SUMMARY_JSON.replace(/\\/g, "/"),
      },
      null,
      2
    )
  );

  clearTimeout(globalTimer);
  process.exit(exitCode);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
