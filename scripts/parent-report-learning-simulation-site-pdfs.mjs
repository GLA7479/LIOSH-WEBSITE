import fs from "fs/promises";
import path from "path";
import { chromium } from "playwright";

const ROOT = process.cwd();
const BASE_URL = process.env.PARENT_REPORT_BASE_URL || "http://localhost:3001";
const REPORT_DIR = path.join(ROOT, "reports", "parent-report-learning-simulations");
const SNAP_DIR = path.join(REPORT_DIR, "snapshots");
const OUT_PDF = path.join(REPORT_DIR, "pdf");
const OUT_IMG = path.join(REPORT_DIR, "screenshots");
const OUT_RAW = path.join(REPORT_DIR, "site-rendered-results.json");

const ROUTES = {
  short: "/learning/parent-report",
  detailed: "/learning/parent-report-detailed",
  summary: "/learning/parent-report-detailed?mode=summary",
};

const FORBIDDEN_TERMS = ["traceId", "confidenceBucket", "hypothesis"];

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function readJson(p) {
  return JSON.parse(await fs.readFile(p, "utf8"));
}

async function applyStorage(page, storageSnapshot) {
  await page.addInitScript((snap) => {
    Object.entries(snap || {}).forEach(([k, v]) => {
      const raw = typeof v === "string" ? v : JSON.stringify(v);
      window.localStorage.setItem(k, raw);
    });
  }, storageSnapshot);
}

async function gotoReady(page, url) {
  await page.goto(`${BASE_URL}${url}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(700);
}

async function captureRouteArtifacts(page, simId, routeKey, routePath, viewport, label) {
  await page.setViewportSize(viewport);
  await gotoReady(page, routePath);
  const shotPath = path.join(OUT_IMG, `${simId}.${routeKey}.${label}.top.png`);
  await page.screenshot({ path: shotPath, fullPage: false });
  return shotPath;
}

async function capturePdf(page, simId, routeKey, routePath) {
  await page.setViewportSize({ width: 1366, height: 900 });
  await gotoReady(page, routePath);
  await page.emulateMedia({ media: "print" });
  const pdfPath = path.join(OUT_PDF, `${simId}.${routeKey}.site.pdf`);
  await page.pdf({
    path: pdfPath,
    format: "A4",
    printBackground: true,
    margin: { top: "10mm", bottom: "10mm", left: "8mm", right: "8mm" },
  });
  await page.emulateMedia({ media: "screen" });
  return pdfPath;
}

function extractLine(text, label) {
  const r = new RegExp(`${label}\\s*[:\\-]?\\s*([^\\n]+)`, "m");
  const m = text.match(r);
  return m ? m[1].trim() : "";
}

async function collectChecks(page, expectedNoData = false) {
  const bodyText = await page.locator("body").innerText();
  const shortHasContract = bodyText.includes("סיכום קצר להורה");
  const detailedHasTop = bodyText.includes("סיכום להורה");
  const summaryHasTitle = bodyText.includes("תקציר להדפסה");
  const summaryOrderOk = bodyText.indexOf("סיכום להורה") >= 0 &&
    bodyText.indexOf("סיכום לתקופה") >= 0 &&
    bodyText.indexOf("סיכום להורה") < bodyText.indexOf("סיכום לתקופה");
  const missingPlayer = bodyText.includes("לא נמצא שם שחקן");
  const insufficient = bodyText.includes("אין עדיין מספיק פעילות בתקופה שנבחרה");
  const noDataState = missingPlayer || insufficient;
  const overflow = await page.evaluate(() => {
    const w = document.documentElement;
    return w.scrollWidth > w.clientWidth + 2;
  });
  const forbiddenHits = FORBIDDEN_TERMS.filter((t) => bodyText.includes(t));
  const mainPriority = extractLine(bodyText, "מיקוד עיקרי");
  const doNow = extractLine(bodyText, "מה עושים עכשיו");
  return {
    shortHasContract,
    detailedHasTop,
    summaryHasTitle,
    summaryOrderOk,
    missingPlayer,
    insufficient,
    noDataState,
    overflow,
    forbiddenHits,
    mainPriority,
    doNow,
    bodyText,
    expectedNoData,
  };
}

function pathRel(p) {
  return path.relative(ROOT, p).replace(/\\/g, "/");
}

async function main() {
  await ensureDir(OUT_PDF);
  await ensureDir(OUT_IMG);
  const manifest = await readJson(path.join(REPORT_DIR, "simulations-manifest.json"));
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const results = [];

  for (const sim of manifest.simulations) {
    const snapPath = path.join(ROOT, sim.snapshotPath);
    const storage = await readJson(snapPath);
    await applyStorage(page, storage);
    await gotoReady(page, "/");

    const imgs = {};
    imgs.shortMobile = await captureRouteArtifacts(
      page,
      sim.id,
      "short",
      ROUTES.short,
      { width: 360, height: 800 },
      "mobile"
    );
    imgs.shortDesktop = await captureRouteArtifacts(
      page,
      sim.id,
      "short",
      ROUTES.short,
      { width: 1366, height: 768 },
      "desktop"
    );
    await gotoReady(page, ROUTES.short);
    const shortCheck = await collectChecks(page, sim.expectedBehavior === "no_data");

    imgs.detailedMobile = await captureRouteArtifacts(
      page,
      sim.id,
      "detailed",
      ROUTES.detailed,
      { width: 360, height: 800 },
      "mobile"
    );
    imgs.detailedDesktop = await captureRouteArtifacts(
      page,
      sim.id,
      "detailed",
      ROUTES.detailed,
      { width: 1366, height: 768 },
      "desktop"
    );
    await gotoReady(page, ROUTES.detailed);
    const detailedCheck = await collectChecks(page, sim.expectedBehavior === "no_data");

    imgs.summaryMobile = await captureRouteArtifacts(
      page,
      sim.id,
      "summary",
      ROUTES.summary,
      { width: 360, height: 800 },
      "mobile"
    );
    imgs.summaryDesktop = await captureRouteArtifacts(
      page,
      sim.id,
      "summary",
      ROUTES.summary,
      { width: 1366, height: 768 },
      "desktop"
    );
    await gotoReady(page, ROUTES.summary);
    const summaryCheck = await collectChecks(page, sim.expectedBehavior === "no_data");

    const pdfShort = await capturePdf(page, sim.id, "short", ROUTES.short);
    const pdfDetailed = await capturePdf(page, sim.id, "detailed", ROUTES.detailed);
    const pdfSummary = await capturePdf(page, sim.id, "summary", ROUTES.summary);

    results.push({
      id: sim.id,
      studentName: sim.studentName,
      expectedBehavior: sim.expectedBehavior,
      expectedTopSignal: sim.expectedTopSignal,
      subjects: sim.subjects,
      totalQuestions: sim.totalQuestions,
      totalSessions: sim.totalSessions,
      dateSpanDays: sim.dateSpanDays,
      shortCheck,
      detailedCheck,
      summaryCheck,
      actualTopConclusion: detailedCheck.doNow || detailedCheck.mainPriority || "",
      screenshots: Object.fromEntries(Object.entries(imgs).map(([k, p]) => [k, pathRel(p)])),
      pdf: {
        short: pathRel(pdfShort),
        detailed: pathRel(pdfDetailed),
        summary: pathRel(pdfSummary),
      },
    });
  }

  await browser.close();
  await fs.writeFile(OUT_RAW, JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2), "utf8");
  console.log(`Generated site-rendered artifacts for ${results.length} simulations.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
