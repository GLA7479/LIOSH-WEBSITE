import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const BASE_URL = process.env.QA_BASE_URL || "http://localhost:3001";

const OUT_ROOT = join(ROOT, "reports", "parent-report-persona-corpus", "site-rendered");
const OUT_SHOTS = join(OUT_ROOT, "screenshots");
const OUT_PDF = join(OUT_ROOT, "pdf");
mkdirSync(OUT_ROOT, { recursive: true });
mkdirSync(OUT_SHOTS, { recursive: true });
mkdirSync(OUT_PDF, { recursive: true });

const FORBIDDEN_TERMS = [
  "P1",
  "P2",
  "P3",
  "P4",
  "gate",
  "canonical",
  "actionState",
  "confidenceBand",
  "withhold",
  "probe_only",
  "decisionTier",
  "outputGating",
  "rowSignals",
];
const STRONG_TREND_WORDS = ["משתפר", "בירידה", "מגמה חיובית", "מגמה שלילית", "שיפור מבוסס", "ירידה מבוססת"];

const { PARENT_REPORT_PERSONA_CORPUS } = await import(
  pathToFileURL(join(ROOT, "tests", "fixtures", "parent-report-persona-corpus.mjs")).href
);

function cleanText(v) {
  return String(v || "").replace(/\s+/g, " ").trim();
}

function emptySnapshot() {
  const emptyMath = JSON.stringify({ operations: {} });
  const emptyTopics = JSON.stringify({ topics: {} });
  const emptyProgress = JSON.stringify({ progress: {}, stars: 0, playerLevel: 1, xp: 0, badges: [] });
  return {
    mleo_time_tracking: emptyMath,
    mleo_math_master_progress: emptyProgress,
    mleo_geometry_time_tracking: emptyTopics,
    mleo_geometry_master_progress: emptyProgress,
    mleo_english_time_tracking: emptyTopics,
    mleo_english_master_progress: emptyProgress,
    mleo_science_time_tracking: emptyTopics,
    mleo_science_master_progress: emptyProgress,
    mleo_hebrew_time_tracking: emptyTopics,
    mleo_hebrew_master_progress: emptyProgress,
    mleo_moledet_geography_time_tracking: emptyTopics,
    mleo_moledet_geography_master_progress: emptyProgress,
    mleo_mistakes: "[]",
    mleo_geometry_mistakes: "[]",
    mleo_english_mistakes: "[]",
    mleo_science_mistakes: "[]",
    mleo_hebrew_mistakes: "[]",
    mleo_moledet_geography_mistakes: "[]",
    mleo_daily_challenge: JSON.stringify({ questions: 0, correct: 0, bestScore: 0 }),
    mleo_weekly_challenge: JSON.stringify({ current: 0, target: 100, completed: false }),
  };
}

function rowToSession(row, now, idx = 0) {
  const total = Math.max(1, Number(row?.questions) || 1);
  const correct = Math.max(0, Math.min(total, Number(row?.correct) || 0));
  return {
    timestamp: now - idx * 60_000,
    total,
    correct,
    mode: row?.modeKey || "learning",
    grade: row?.gradeKey || "g4",
    level: row?.levelKey || "medium",
    duration: Math.max(60, Math.round((Number(row?.timeMinutes) || 1) * 60)),
  };
}

function topicMapToStorage(map) {
  const out = {};
  const rows = Object.entries(map || {});
  rows.forEach(([rowKey, row], idx) => {
    const key = cleanText(row?.bucketKey) || rowKey.split("\u0001")[0] || rowKey;
    if (!out[key]) out[key] = { sessions: [] };
    out[key].sessions.push(rowToSession(row, Date.now(), idx));
  });
  return out;
}

function normalizeMistakes(subjectId, mistakes = []) {
  if (!Array.isArray(mistakes)) return [];
  return mistakes.map((m, i) => {
    const base = typeof m === "object" && m ? m : {};
    const topic = base.topic || base.operation || "addition";
    return {
      subject: subjectId,
      topic,
      operation: topic,
      bucketKey: topic,
      timestamp: base.timestamp || Date.now() - i * 1000,
      isCorrect: false,
      exerciseText: base.exerciseText || `${topic} item`,
      correctAnswer: base.correctAnswer || 1,
      userAnswer: base.userAnswer || 0,
      patternFamily: base.patternFamily || `pf:${subjectId}`,
      hintUsed: Boolean(base.hintUsed),
      responseMs: Number(base.responseMs) || 1200,
    };
  });
}

function personaToStorage(persona) {
  const base = persona.buildBaseReport();
  const snap = emptySnapshot();
  snap.mleo_player_name = `Persona-${persona.id}`;

  snap.mleo_time_tracking = JSON.stringify({ operations: topicMapToStorage(base?.mathOperations || {}) });
  snap.mleo_geometry_time_tracking = JSON.stringify({ topics: topicMapToStorage(base?.geometryTopics || {}) });
  snap.mleo_english_time_tracking = JSON.stringify({ topics: topicMapToStorage(base?.englishTopics || {}) });
  snap.mleo_science_time_tracking = JSON.stringify({ topics: topicMapToStorage(base?.scienceTopics || {}) });
  snap.mleo_hebrew_time_tracking = JSON.stringify({ topics: topicMapToStorage(base?.hebrewTopics || {}) });
  snap.mleo_moledet_geography_time_tracking = JSON.stringify({
    topics: topicMapToStorage(base?.moledetGeographyTopics || {}),
  });

  const summary = base?.summary || {};
  snap.mleo_math_master_progress = JSON.stringify({
    progress: {},
    stars: 0,
    playerLevel: 1,
    xp: Math.max(0, Number(summary.totalQuestions) || 0),
    badges: [],
  });

  snap.mleo_mistakes = JSON.stringify(normalizeMistakes("math", base?.mistakes?.math || []));
  snap.mleo_geometry_mistakes = JSON.stringify(normalizeMistakes("geometry", base?.mistakes?.geometry || []));
  snap.mleo_english_mistakes = JSON.stringify(normalizeMistakes("english", base?.mistakes?.english || []));
  snap.mleo_science_mistakes = JSON.stringify(normalizeMistakes("science", base?.mistakes?.science || []));
  snap.mleo_hebrew_mistakes = JSON.stringify(normalizeMistakes("hebrew", base?.mistakes?.hebrew || []));
  snap.mleo_moledet_geography_mistakes = JSON.stringify(
    normalizeMistakes("moledet-geography", base?.mistakes?.["moledet-geography"] || [])
  );
  return snap;
}

function isNoDataPersona(persona) {
  return String(persona?.category || "").startsWith("A_");
}

async function assertServer() {
  const res = await fetch(`${BASE_URL}/learning/parent-report`);
  if (!res.ok) throw new Error(`Dev server not ready at ${BASE_URL} (status ${res.status})`);
}

async function applyStorage(page, snapshot) {
  await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
  await page.evaluate((data) => {
    localStorage.clear();
    for (const [k, v] of Object.entries(data || {})) localStorage.setItem(k, String(v));
  }, snapshot);
}

async function collectRouteChecks(page, { routeKind, allowNoData }) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(350);
  return page.evaluate(
    ({ routeKind, allowNoData, forbiddenTerms, strongTrendWords }) => {
      const t = document.body?.innerText || "";
      const root = document.documentElement;
      const top = t.slice(0, 3200);
      const noPlayer = t.includes("לא נמצא שם שחקן");
      const noData = t.includes("אין עדיין מספיק פעילות") || t.includes("אין נתונים להצגה");
      const firstTop = top.indexOf("סיכום להורה");
      const firstPeriod = top.indexOf("סיכום לתקופה");
      const priorityMatch = top.match(/מיקוד עיקרי:\s*([^\n]+)/);
      const priority = priorityMatch ? priorityMatch[1].trim() : "";
      const forbiddenHits = forbiddenTerms.filter((x) => t.includes(x));
      const strongTrendHits = strongTrendWords.filter((x) => t.includes(x));
      return {
        noPlayer,
        noData,
        hasShortTop: t.includes("סיכום קצר להורה"),
        hasDetailedTop: t.includes("סיכום להורה"),
        hasSummaryPrint: t.includes("תקציר להדפסה"),
        detailedOrderOk: firstTop >= 0 && firstPeriod >= 0 && firstTop < firstPeriod,
        noHorizontalOverflow: root.scrollWidth <= root.clientWidth + 2,
        forbiddenHits,
        strongTrendHits,
        mainPriorityHe: priority,
        passNoPlayerGate: !noPlayer,
        passNoDataGate: allowNoData ? true : !noData,
        routeKind,
      };
    },
    { routeKind, allowNoData, forbiddenTerms: FORBIDDEN_TERMS, strongTrendWords: STRONG_TREND_WORDS }
  );
}

async function capturePersona(browser, persona) {
  const mobile = { width: 360, height: 800 };
  const desktop = { width: 1366, height: 768 };
  const routes = [
    { key: "short", path: "/learning/parent-report" },
    { key: "detailed", path: "/learning/parent-report-detailed" },
    { key: "summary", path: "/learning/parent-report-detailed?mode=summary" },
  ];
  const allowNoData = isNoDataPersona(persona);
  const snapshot = personaToStorage(persona);

  const results = { personaId: persona.id, category: persona.category, routes: {}, status: "PASS", failures: [] };
  const priorities = {};

  for (const vp of [
    { name: "mobile", viewport: mobile },
    { name: "desktop", viewport: desktop },
  ]) {
    const ctx = await browser.newContext({ viewport: vp.viewport, locale: "he-IL" });
    for (const rt of routes) {
      const page = await ctx.newPage();
      await applyStorage(page, snapshot);
      await page.goto(`${BASE_URL}${rt.path}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(600);

      const shotPath = join(OUT_SHOTS, `${persona.id}.${rt.key}.${vp.name}.png`);
      await page.screenshot({ path: shotPath, fullPage: false });

      const checks = await collectRouteChecks(page, { routeKind: rt.key, allowNoData });
      results.routes[`${rt.key}.${vp.name}`] = { screenshot: shotPath, ...checks };
      priorities[`${rt.key}.${vp.name}`] = checks.mainPriorityHe;

      if (vp.name === "desktop") {
        await page.emulateMedia({ media: "print" });
        const pdfPath = join(OUT_PDF, `${persona.id}.${rt.key}.site.pdf`);
        await page.pdf({ path: pdfPath, printBackground: true, format: "A4", preferCSSPageSize: true });
        results.routes[`${rt.key}.${vp.name}`].pdf = pdfPath;
      }
      await page.close();
    }
    await ctx.close();
  }

  const shortPriority = cleanText(priorities["short.desktop"] || priorities["short.mobile"]);
  const detailedPriority = cleanText(priorities["detailed.desktop"] || priorities["detailed.mobile"]);
  results.shortDetailedPriorityAgree =
    !shortPriority || !detailedPriority || shortPriority === detailedPriority;

  const speedGate = persona.expectedPrimaryFocusType === "speed_behavior";
  const strongGate = persona.expectedPrimaryFocusType === "strength_maintain";
  const trendInsufficientGate = persona.expectedPrimaryFocusType === "trend_insufficient";
  const detailedText = cleanText(
    [
      results.routes["detailed.mobile"]?.mainPriorityHe,
      results.routes["detailed.mobile"]?.strongTrendHits?.join(" "),
      results.routes["detailed.desktop"]?.mainPriorityHe,
    ].join(" ")
  );
  results.speedNoKnowledgeGapWording = !speedGate || !/פער ידע|ידע חסר/.test(detailedText);
  results.strongNoRemediation = !strongGate || !/שיקום|התערבות|remediate|פער ידע/.test(detailedText);
  const trendHitsCount =
    (results.routes["detailed.mobile"]?.strongTrendHits?.length || 0) +
    (results.routes["summary.mobile"]?.strongTrendHits?.length || 0);
  results.trendInsufficientNoStrongTrendWording = !trendInsufficientGate || trendHitsCount === 0;

  const requiredChecks = [
    results.routes["short.mobile"]?.passNoPlayerGate,
    results.routes["short.mobile"]?.passNoDataGate,
    results.routes["short.mobile"]?.noHorizontalOverflow,
    results.routes["detailed.mobile"]?.passNoPlayerGate,
    results.routes["detailed.mobile"]?.passNoDataGate,
    results.routes["detailed.mobile"]?.hasDetailedTop,
    results.routes["detailed.mobile"]?.detailedOrderOk,
    results.routes["summary.mobile"]?.passNoPlayerGate,
    results.routes["summary.mobile"]?.passNoDataGate,
    results.routes["summary.mobile"]?.hasSummaryPrint,
    results.shortDetailedPriorityAgree,
    results.speedNoKnowledgeGapWording,
    results.strongNoRemediation,
    results.trendInsufficientNoStrongTrendWording,
    (results.routes["short.mobile"]?.forbiddenHits || []).length === 0,
    (results.routes["detailed.mobile"]?.forbiddenHits || []).length === 0,
    (results.routes["summary.mobile"]?.forbiddenHits || []).length === 0,
  ];

  if (!allowNoData && !results.routes["short.mobile"]?.hasShortTop) {
    results.failures.push("short_missing_contract_top");
  }
  if (!requiredChecks.every(Boolean)) {
    results.status = "FAIL";
    if (!results.shortDetailedPriorityAgree) results.failures.push("short_detailed_priority_mismatch");
    if (!results.speedNoKnowledgeGapWording) results.failures.push("speed_has_knowledge_gap_wording");
    if (!results.strongNoRemediation) results.failures.push("strong_has_remediation_wording");
    if (!results.trendInsufficientNoStrongTrendWording) results.failures.push("trend_insufficient_strong_trend_wording");
    for (const [k, v] of Object.entries(results.routes)) {
      if (v?.passNoPlayerGate === false) results.failures.push(`${k}:missing_player_state`);
      if (v?.passNoDataGate === false) results.failures.push(`${k}:no_data_state`);
      if (v?.noHorizontalOverflow === false) results.failures.push(`${k}:horizontal_overflow`);
      if ((v?.forbiddenHits || []).length > 0) results.failures.push(`${k}:forbidden_terms`);
    }
  }
  return results;
}

function writeIndex(rows) {
  const md = [
    "# Site Rendered Parent Report Persona Corpus",
    "",
    "- Previous corpus PDFs in `reports/parent-report-persona-corpus/pdf/` are **TEXT_REVIEW_PDF** artifacts.",
    "- New corpus PDFs in `reports/parent-report-persona-corpus/site-rendered/pdf/` are **SITE_RENDERED_PDF** artifacts.",
    "",
    "| Persona | Category | Short Site PDF | Detailed Site PDF | Summary Site PDF | Screenshots | Status |",
    "|---|---|---|---|---|---|---|",
  ];
  for (const r of rows) {
    md.push(
      `| ${r.personaId} | ${r.category} | [short](./pdf/${r.personaId}.short.site.pdf) | [detailed](./pdf/${r.personaId}.detailed.site.pdf) | [summary](./pdf/${r.personaId}.summary.site.pdf) | [shots](./screenshots/${r.personaId}.short.mobile.png) | ${r.status} |`
    );
  }
  writeFileSync(join(OUT_ROOT, "index.md"), md.join("\n"), "utf8");
}

function writeAudit(rows) {
  const fail = rows.filter((r) => r.status !== "PASS");
  const audit = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    artifactType: "SITE_RENDERED_PDF",
    personaCount: rows.length,
    passCount: rows.length - fail.length,
    failCount: fail.length,
    failures: fail.map((r) => ({ personaId: r.personaId, failures: r.failures })),
    personas: rows,
  };
  writeFileSync(join(OUT_ROOT, "site-rendered-corpus-audit.json"), JSON.stringify(audit, null, 2), "utf8");

  const md = [
    "# Site Rendered Persona Corpus Audit",
    "",
    `- baseUrl: ${BASE_URL}`,
    `- artifactType: ${audit.artifactType}`,
    `- personas: ${audit.personaCount}`,
    `- pass: ${audit.passCount}`,
    `- fail: ${audit.failCount}`,
    "",
    "| Persona | Category | Status | Failures |",
    "|---|---|---|---|",
    ...rows.map((r) => `| ${r.personaId} | ${r.category} | ${r.status} | ${r.failures.join(", ") || "-"} |`),
  ];
  writeFileSync(join(OUT_ROOT, "site-rendered-corpus-audit.md"), md.join("\n"), "utf8");
  return audit;
}

async function main() {
  await assertServer();
  const browser = await chromium.launch({ headless: true });
  const rows = [];
  for (const persona of PARENT_REPORT_PERSONA_CORPUS) {
    const row = await capturePersona(browser, persona);
    rows.push(row);
  }
  await browser.close();
  writeIndex(rows);
  const audit = writeAudit(rows);

  const zipPath = join(OUT_ROOT, "parent-report-site-rendered-pdfs.zip");
  let zipGenerated = false;
  if (process.platform === "win32") {
    const ps = spawnSync(
      "powershell",
      ["-NoProfile", "-Command", `Compress-Archive -Path "${OUT_PDF}\\*" -DestinationPath "${zipPath}" -Force`],
      { stdio: "pipe" }
    );
    zipGenerated = ps.status === 0;
  }

  console.log(
    JSON.stringify(
      {
        ok: audit.failCount === 0,
        artifactType: "SITE_RENDERED_PDF",
        personaCount: audit.personaCount,
        passCount: audit.passCount,
        failCount: audit.failCount,
        outDir: OUT_ROOT,
        zipGenerated,
        zipPath: zipGenerated ? zipPath : null,
      },
      null,
      2
    )
  );

  if (audit.failCount > 0) process.exitCode = 2;
}

main().catch((e) => {
  console.error("parent-report-site-pdfs: failed", e);
  process.exit(1);
});
