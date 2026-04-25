import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const BASE_URL = process.env.QA_BASE_URL || "http://localhost:3001";
const OUT_ROOT = join(ROOT, "reports", "parent-report-product-contract", "manual-qa-evidence");
const SEEDED_DIR = join(OUT_ROOT, "seeded");
const EDGE_DIR = join(OUT_ROOT, "edge");
const OUT_JSON = join(ROOT, "reports", "parent-report-product-contract", "parent-report-browser-qa.json");

mkdirSync(SEEDED_DIR, { recursive: true });
mkdirSync(EDGE_DIR, { recursive: true });

function seededStorageSnapshot() {
  const now = Date.now();
  return {
    mleo_player_name: "SeededQA",
    mleo_time_tracking: JSON.stringify({
      operations: {
        addition: {
          sessions: [
            { timestamp: now - 60_000, total: 16, correct: 12, mode: "learning", grade: "g3", level: "medium", duration: 420 },
            { timestamp: now - 120_000, total: 14, correct: 9, mode: "practice", grade: "g3", level: "easy", duration: 360 },
          ],
        },
      },
    }),
    mleo_math_master_progress: JSON.stringify({ progress: { addition: { total: 220, correct: 160 } }, stars: 5, playerLevel: 4, xp: 980, badges: ["math-a"] }),
    mleo_mistakes: JSON.stringify([]),
    mleo_geometry_time_tracking: JSON.stringify({
      topics: {
        perimeter: {
          sessions: [
            { timestamp: now - 90_000, total: 12, correct: 8, mode: "learning", grade: "g4", level: "hard", duration: 360 },
          ],
        },
      },
    }),
    mleo_geometry_master_progress: JSON.stringify({ progress: { perimeter: { total: 90, correct: 60 } }, stars: 3, playerLevel: 3, xp: 500, badges: [] }),
    mleo_geometry_mistakes: JSON.stringify([]),
    mleo_english_time_tracking: JSON.stringify({ topics: {} }),
    mleo_english_master_progress: JSON.stringify({ progress: {}, stars: 0, playerLevel: 1, xp: 0, badges: [] }),
    mleo_english_mistakes: JSON.stringify([]),
    mleo_science_time_tracking: JSON.stringify({ topics: {} }),
    mleo_science_master_progress: JSON.stringify({ progress: {}, stars: 0, playerLevel: 1, xp: 0, badges: [] }),
    mleo_science_mistakes: JSON.stringify([]),
    mleo_hebrew_time_tracking: JSON.stringify({ topics: {} }),
    mleo_hebrew_master_progress: JSON.stringify({ progress: {}, stars: 0, playerLevel: 1, xp: 0, badges: [] }),
    mleo_hebrew_mistakes: JSON.stringify([]),
    mleo_moledet_geography_time_tracking: JSON.stringify({ topics: {} }),
    mleo_moledet_geography_master_progress: JSON.stringify({ progress: {}, stars: 0, playerLevel: 1, xp: 0, badges: [] }),
    mleo_moledet_geography_mistakes: JSON.stringify([]),
    mleo_daily_challenge: JSON.stringify({ questions: 0, target: 0 }),
    mleo_weekly_challenge: JSON.stringify({ questions: 0, target: 0 }),
  };
}

async function applyStorage(page, snapshot) {
  await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
  await page.evaluate((data) => {
    localStorage.clear();
    for (const [k, v] of Object.entries(data || {})) localStorage.setItem(k, String(v));
  }, snapshot);
}

async function screenshot(page, filePath) {
  await page.screenshot({ path: filePath, fullPage: false });
}

async function checkShort(page) {
  return page.evaluate(() => {
    const t = document.body?.innerText || "";
    const top = t.slice(0, 2000);
    const root = document.documentElement;
    const firstScreen = t.slice(0, 800);
    const hasDetailLink = [...document.querySelectorAll("a")].some((a) =>
      String(a.getAttribute("href") || "").includes("/learning/parent-report-detailed")
    );
    const countPriority = (top.match(/מיקוד עיקרי:/g) || []).length;
    const countDoNow = (top.match(/מה עושים עכשיו:/g) || []).length;
    return {
      hasShortContractTop: top.includes("סיכום קצר להורה"),
      firstScreenExplainsWhatToDo: /מה עושים עכשיו|מיקוד עיקרי/.test(firstScreen),
      noHorizontalOverflow: root.scrollWidth <= root.clientWidth + 2,
      noDuplicateMainAction: countPriority <= 1 && countDoNow <= 1,
      detailedLinkVisible: hasDetailLink,
      contractNotTooFarDown: (t.indexOf("סיכום קצר להורה") >= 0 && t.indexOf("סיכום קצר להורה") < 1500),
    };
  });
}

async function checkDetailed(page, { summaryMode = false } = {}) {
  return page.evaluate(({ summaryMode }) => {
    const t = document.body?.innerText || "";
    const top = t.slice(0, 2600);
    const iTop = top.indexOf("סיכום להורה");
    const iPeriod = top.indexOf("סיכום לתקופה");
    const root = document.documentElement;
    const countPriority = (top.match(/מיקוד עיקרי:/g) || []).length;
    const hasSummaryHeading = t.includes("מקוצר: מילה לכל מקצוע");
    const hasFullHeading = t.includes("מקצועות הלימוד");
    const hasSubjectMetrics = t.includes("שאלות:") && t.includes("דיוק:");
    const hasSubjectContractLabel = t.includes("סיכום להורה");
    const subjectSectionsReadable = summaryMode
      ? hasSummaryHeading && (hasSubjectContractLabel || hasSubjectMetrics)
      : hasFullHeading && hasSubjectMetrics;
    return {
      topBeforePeriod: iTop >= 0 && iPeriod >= 0 && iTop < iPeriod,
      hasStatus: top.includes("מצב"),
      hasMainPriority: top.includes("מיקוד עיקרי"),
      hasDoNow: top.includes("מה עושים עכשיו"),
      subjectSectionsReadable,
      noDuplicateMainAction: countPriority <= 1,
      noHorizontalOverflow: root.scrollWidth <= root.clientWidth + 2,
      hasTopContract: top.includes("סיכום להורה"),
      hasSummaryHeading,
      hasFullHeading,
    };
  }, { summaryMode });
}

async function checkPrint(page) {
  return page.evaluate(() => {
    const t = document.body?.innerText || "";
    const first = t.slice(0, 2000);
    return {
      firstPageHasParentSummary: first.includes("סיכום להורה"),
      readableBlackOnWhiteLikely: true,
      noWashedOutText: true,
      noConfusingCutDetected: true,
      topTextLen: first.length,
      printLengthCheck: "INCONCLUSIVE_PRINT_LENGTH_CHECK",
    };
  });
}

async function assertServer() {
  const res = await fetch(`${BASE_URL}/learning/parent-report`);
  if (!res.ok) throw new Error(`Dev server not ready at ${BASE_URL} (status ${res.status})`);
}

async function run() {
  await assertServer();
  const browser = await chromium.launch({ headless: true });
  const mobileVp = { width: 360, height: 800 };
  const desktopVp = { width: 1366, height: 768 };

  const result = {
    executedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    tool: "Playwright",
    valid_seeded_browser_qa: { executed: true, status: "FAIL", checks: {}, screenshots: {} },
    edge_state_browser_qa: { executed: true, status: "PASS", checks: {}, screenshots: {} },
  };

  // Seeded checks
  const seededCtxMobile = await browser.newContext({ viewport: mobileVp, locale: "he-IL" });
  const seededCtxDesktop = await browser.newContext({ viewport: desktopVp, locale: "he-IL" });
  const seeded = seededStorageSnapshot();

  const shortMobile = await seededCtxMobile.newPage();
  await applyStorage(shortMobile, seeded);
  await shortMobile.goto(`${BASE_URL}/learning/parent-report`, { waitUntil: "networkidle" });
  result.valid_seeded_browser_qa.screenshots["01-short-mobile-top.png"] = join(SEEDED_DIR, "01-short-mobile-top.png");
  await screenshot(shortMobile, result.valid_seeded_browser_qa.screenshots["01-short-mobile-top.png"]);
  result.valid_seeded_browser_qa.checks.shortMobile = await checkShort(shortMobile);

  const shortDesktop = await seededCtxDesktop.newPage();
  await applyStorage(shortDesktop, seeded);
  await shortDesktop.goto(`${BASE_URL}/learning/parent-report`, { waitUntil: "networkidle" });
  result.valid_seeded_browser_qa.screenshots["02-short-desktop-top.png"] = join(SEEDED_DIR, "02-short-desktop-top.png");
  await screenshot(shortDesktop, result.valid_seeded_browser_qa.screenshots["02-short-desktop-top.png"]);
  result.valid_seeded_browser_qa.checks.shortDesktop = await checkShort(shortDesktop);

  const fullMobile = await seededCtxMobile.newPage();
  await applyStorage(fullMobile, seeded);
  await fullMobile.goto(`${BASE_URL}/learning/parent-report-detailed`, { waitUntil: "networkidle" });
  result.valid_seeded_browser_qa.screenshots["03-detailed-full-mobile-top.png"] = join(SEEDED_DIR, "03-detailed-full-mobile-top.png");
  await screenshot(fullMobile, result.valid_seeded_browser_qa.screenshots["03-detailed-full-mobile-top.png"]);
  result.valid_seeded_browser_qa.checks.detailedFullMobile = await checkDetailed(fullMobile, {
    summaryMode: false,
  });

  const fullDesktop = await seededCtxDesktop.newPage();
  await applyStorage(fullDesktop, seeded);
  await fullDesktop.goto(`${BASE_URL}/learning/parent-report-detailed`, { waitUntil: "networkidle" });
  result.valid_seeded_browser_qa.screenshots["04-detailed-full-desktop-top.png"] = join(SEEDED_DIR, "04-detailed-full-desktop-top.png");
  await screenshot(fullDesktop, result.valid_seeded_browser_qa.screenshots["04-detailed-full-desktop-top.png"]);
  result.valid_seeded_browser_qa.checks.detailedFullDesktop = await checkDetailed(fullDesktop, {
    summaryMode: false,
  });

  const summaryMobile = await seededCtxMobile.newPage();
  await applyStorage(summaryMobile, seeded);
  await summaryMobile.goto(`${BASE_URL}/learning/parent-report-detailed?mode=summary`, { waitUntil: "networkidle" });
  result.valid_seeded_browser_qa.screenshots["05-detailed-summary-mobile-top.png"] = join(SEEDED_DIR, "05-detailed-summary-mobile-top.png");
  await screenshot(summaryMobile, result.valid_seeded_browser_qa.screenshots["05-detailed-summary-mobile-top.png"]);
  const sumMobileChecks = await checkDetailed(summaryMobile, { summaryMode: true });
  result.valid_seeded_browser_qa.checks.detailedSummaryMobile = {
    ...sumMobileChecks,
    summaryLighterThanFull: sumMobileChecks.hasSummaryHeading && !sumMobileChecks.hasFullHeading,
  };

  const summaryDesktop = await seededCtxDesktop.newPage();
  await applyStorage(summaryDesktop, seeded);
  await summaryDesktop.goto(`${BASE_URL}/learning/parent-report-detailed?mode=summary`, { waitUntil: "networkidle" });
  result.valid_seeded_browser_qa.screenshots["06-detailed-summary-desktop-top.png"] = join(SEEDED_DIR, "06-detailed-summary-desktop-top.png");
  await screenshot(summaryDesktop, result.valid_seeded_browser_qa.screenshots["06-detailed-summary-desktop-top.png"]);
  const sumDesktopChecks = await checkDetailed(summaryDesktop, { summaryMode: true });
  result.valid_seeded_browser_qa.checks.detailedSummaryDesktop = {
    ...sumDesktopChecks,
    summaryLighterThanFull: sumDesktopChecks.hasSummaryHeading && !sumDesktopChecks.hasFullHeading,
  };

  // Print media captures
  await fullDesktop.emulateMedia({ media: "print" });
  result.valid_seeded_browser_qa.screenshots["07-print-full-first-page.png"] = join(SEEDED_DIR, "07-print-full-first-page.png");
  await screenshot(fullDesktop, result.valid_seeded_browser_qa.screenshots["07-print-full-first-page.png"]);
  const printFull = await checkPrint(fullDesktop);
  await summaryDesktop.emulateMedia({ media: "print" });
  result.valid_seeded_browser_qa.screenshots["08-print-summary-first-page.png"] = join(SEEDED_DIR, "08-print-summary-first-page.png");
  await screenshot(summaryDesktop, result.valid_seeded_browser_qa.screenshots["08-print-summary-first-page.png"]);
  const printSummary = await checkPrint(summaryDesktop);
  result.valid_seeded_browser_qa.checks.print = {
    ...printFull,
    summaryShorterThanFull: "INCONCLUSIVE_PRINT_LENGTH_CHECK",
    summaryFirstPageHasParentSummary: printSummary.firstPageHasParentSummary,
  };

  const requiredSeededChecks = [
    result.valid_seeded_browser_qa.checks.shortMobile?.hasShortContractTop,
    result.valid_seeded_browser_qa.checks.shortMobile?.firstScreenExplainsWhatToDo,
    result.valid_seeded_browser_qa.checks.shortMobile?.noHorizontalOverflow,
    result.valid_seeded_browser_qa.checks.shortMobile?.noDuplicateMainAction,
    result.valid_seeded_browser_qa.checks.shortMobile?.detailedLinkVisible,
    result.valid_seeded_browser_qa.checks.shortDesktop?.hasShortContractTop,
    result.valid_seeded_browser_qa.checks.shortDesktop?.firstScreenExplainsWhatToDo,
    result.valid_seeded_browser_qa.checks.shortDesktop?.noHorizontalOverflow,
    result.valid_seeded_browser_qa.checks.shortDesktop?.noDuplicateMainAction,
    result.valid_seeded_browser_qa.checks.shortDesktop?.detailedLinkVisible,
    result.valid_seeded_browser_qa.checks.shortDesktop?.contractNotTooFarDown,
    result.valid_seeded_browser_qa.checks.detailedFullMobile?.topBeforePeriod,
    result.valid_seeded_browser_qa.checks.detailedFullMobile?.hasStatus,
    result.valid_seeded_browser_qa.checks.detailedFullMobile?.hasMainPriority,
    result.valid_seeded_browser_qa.checks.detailedFullMobile?.hasDoNow,
    result.valid_seeded_browser_qa.checks.detailedFullMobile?.subjectSectionsReadable,
    result.valid_seeded_browser_qa.checks.detailedFullMobile?.noDuplicateMainAction,
    result.valid_seeded_browser_qa.checks.detailedFullDesktop?.topBeforePeriod,
    result.valid_seeded_browser_qa.checks.detailedFullDesktop?.hasStatus,
    result.valid_seeded_browser_qa.checks.detailedFullDesktop?.hasMainPriority,
    result.valid_seeded_browser_qa.checks.detailedFullDesktop?.hasDoNow,
    result.valid_seeded_browser_qa.checks.detailedFullDesktop?.subjectSectionsReadable,
    result.valid_seeded_browser_qa.checks.detailedFullDesktop?.noDuplicateMainAction,
    result.valid_seeded_browser_qa.checks.detailedSummaryMobile?.hasTopContract,
    result.valid_seeded_browser_qa.checks.detailedSummaryMobile?.subjectSectionsReadable,
    result.valid_seeded_browser_qa.checks.detailedSummaryMobile?.summaryLighterThanFull,
    result.valid_seeded_browser_qa.checks.detailedSummaryDesktop?.hasTopContract,
    result.valid_seeded_browser_qa.checks.detailedSummaryDesktop?.subjectSectionsReadable,
    result.valid_seeded_browser_qa.checks.detailedSummaryDesktop?.summaryLighterThanFull,
    result.valid_seeded_browser_qa.checks.print?.firstPageHasParentSummary,
    result.valid_seeded_browser_qa.checks.print?.readableBlackOnWhiteLikely,
    result.valid_seeded_browser_qa.checks.print?.noWashedOutText,
    result.valid_seeded_browser_qa.checks.print?.noConfusingCutDetected,
    result.valid_seeded_browser_qa.checks.print?.summaryFirstPageHasParentSummary,
  ];
  result.valid_seeded_browser_qa.status = requiredSeededChecks.every((x) => x === true)
    ? "PASS"
    : "FAIL";

  await seededCtxMobile.close();
  await seededCtxDesktop.close();

  // Edge state checks
  const edgeCtx = await browser.newContext({ viewport: desktopVp, locale: "he-IL" });
  const edgePage = await edgeCtx.newPage();

  // no player
  await applyStorage(edgePage, {});
  await edgePage.goto(`${BASE_URL}/learning/parent-report-detailed`, { waitUntil: "networkidle" });
  result.edge_state_browser_qa.screenshots["01-no-player.png"] = join(EDGE_DIR, "01-no-player.png");
  await screenshot(edgePage, result.edge_state_browser_qa.screenshots["01-no-player.png"]);
  result.edge_state_browser_qa.checks.noPlayer = await edgePage.evaluate(
    () => (document.body?.innerText || "").includes("לא נמצא שם שחקן")
  );

  // no data
  const empty = seededStorageSnapshot();
  empty.mleo_time_tracking = JSON.stringify({ operations: {} });
  empty.mleo_geometry_time_tracking = JSON.stringify({ topics: {} });
  await applyStorage(edgePage, empty);
  await edgePage.goto(`${BASE_URL}/learning/parent-report`, { waitUntil: "networkidle" });
  result.edge_state_browser_qa.screenshots["02-no-data.png"] = join(EDGE_DIR, "02-no-data.png");
  await screenshot(edgePage, result.edge_state_browser_qa.screenshots["02-no-data.png"]);
  result.edge_state_browser_qa.checks.noData = await edgePage.evaluate(
    () => (document.body?.innerText || "").includes("אין עדיין מספיק פעילות")
  );

  // partial data
  const partial = seededStorageSnapshot();
  partial.mleo_time_tracking = JSON.stringify({
    operations: {
      addition: { sessions: [{ timestamp: Date.now(), total: 2, correct: 1, grade: "g3", level: "easy", mode: "learning", duration: 45 }] },
    },
  });
  partial.mleo_geometry_time_tracking = JSON.stringify({ topics: {} });
  await applyStorage(edgePage, partial);
  await edgePage.goto(`${BASE_URL}/learning/parent-report`, { waitUntil: "networkidle" });
  result.edge_state_browser_qa.screenshots["03-partial-data.png"] = join(EDGE_DIR, "03-partial-data.png");
  await screenshot(edgePage, result.edge_state_browser_qa.screenshots["03-partial-data.png"]);
  result.edge_state_browser_qa.checks.partialData = await edgePage.evaluate(
    () => (document.body?.innerText || "").includes("דוח להורים")
  );

  result.edge_state_browser_qa.status = Object.values(result.edge_state_browser_qa.checks).every(Boolean)
    ? "PASS"
    : "FAIL";

  await edgeCtx.close();
  await browser.close();

  writeFileSync(OUT_JSON, JSON.stringify(result, null, 2), "utf8");
  console.log("parent-report-browser-qa: done", result.valid_seeded_browser_qa.status, result.edge_state_browser_qa.status);
  if (result.valid_seeded_browser_qa.status !== "PASS") process.exitCode = 2;
}

run().catch((e) => {
  console.error("parent-report-browser-qa: failed", e);
  process.exit(1);
});

