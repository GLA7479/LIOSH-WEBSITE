import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, devices } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const BASE = "http://localhost:3001";
const OUT_DIR = join(ROOT, "reports", "parent-report-product-contract", "manual-qa-evidence");
mkdirSync(OUT_DIR, { recursive: true });

async function shot(page, name) {
  const p = join(OUT_DIR, name);
  await page.screenshot({ path: p, fullPage: false });
  return p;
}

async function evaluateShort(page) {
  return page.evaluate(() => {
    const text = document.body?.innerText || "";
    const hasShortContract = text.includes("סיכום קצר להורה");
    const hasActionHint = /מה עושים עכשיו|מיקוד עיקרי|מיקוד/.test(text);
    const hasDetailLink = [...document.querySelectorAll("a")]
      .some((a) => String(a.getAttribute("href") || "").includes("/learning/parent-report-detailed"));
    const root = document.documentElement;
    const noHorizontal = root.scrollWidth <= root.clientWidth + 1;
    return {
      hasShortContract,
      hasActionHint,
      hasDetailLink,
      noHorizontal,
      textTop: text.slice(0, 900),
    };
  });
}

async function evaluateDetailed(page) {
  return page.evaluate(() => {
    const text = document.body?.innerText || "";
    const iTop = text.indexOf("סיכום להורה");
    const iLegacy = text.indexOf("סיכום לתקופה");
    const topBeforeLegacy = iTop >= 0 && (iLegacy < 0 || iTop < iLegacy);
    const hasStatus = text.includes("מצב");
    const hasPriority = text.includes("מיקוד עיקרי");
    const hasDoNow = text.includes("מה עושים עכשיו");
    const hasSubjectContractLike = text.includes("סיכום מקצועות להורה") || text.includes("סיכום להורה");
    const root = document.documentElement;
    const noHorizontal = root.scrollWidth <= root.clientWidth + 1;
    return {
      topBeforeLegacy,
      hasStatus,
      hasPriority,
      hasDoNow,
      hasSubjectContractLike,
      noHorizontal,
      textTop: text.slice(0, 1200),
    };
  });
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const desktop = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const mobile = await browser.newContext({
    ...devices["iPhone 12"],
    viewport: { width: 360, height: 800 },
    userAgent: devices["iPhone 12"].userAgent,
  });

  const results = {
    executed: true,
    tool: "playwright",
    baseUrl: BASE,
    screenshots: {},
    checks: {},
    print: {},
  };

  // Short report
  {
    const p = await mobile.newPage();
    await p.goto(`${BASE}/learning/parent-report`, { waitUntil: "networkidle" });
    results.screenshots.shortMobile = await shot(p, "01-short-mobile-top.png");
    results.checks.shortMobile = await evaluateShort(p);
    await p.close();
  }
  {
    const p = await desktop.newPage();
    await p.goto(`${BASE}/learning/parent-report`, { waitUntil: "networkidle" });
    results.screenshots.shortDesktop = await shot(p, "02-short-desktop-top.png");
    results.checks.shortDesktop = await evaluateShort(p);
    await p.close();
  }

  // Detailed full
  {
    const p = await mobile.newPage();
    await p.goto(`${BASE}/learning/parent-report-detailed`, { waitUntil: "networkidle" });
    results.screenshots.detailedFullMobile = await shot(p, "03-detailed-full-mobile-top.png");
    results.checks.detailedFullMobile = await evaluateDetailed(p);
    await p.close();
  }
  {
    const p = await desktop.newPage();
    await p.goto(`${BASE}/learning/parent-report-detailed`, { waitUntil: "networkidle" });
    results.screenshots.detailedFullDesktop = await shot(p, "04-detailed-full-desktop-top.png");
    results.checks.detailedFullDesktop = await evaluateDetailed(p);
    await p.close();
  }

  // Detailed summary
  {
    const p = await mobile.newPage();
    await p.goto(`${BASE}/learning/parent-report-detailed?mode=summary`, { waitUntil: "networkidle" });
    results.screenshots.detailedSummaryMobile = await shot(p, "05-detailed-summary-mobile-top.png");
    results.checks.detailedSummaryMobile = await evaluateDetailed(p);
    await p.close();
  }
  {
    const p = await desktop.newPage();
    await p.goto(`${BASE}/learning/parent-report-detailed?mode=summary`, { waitUntil: "networkidle" });
    results.screenshots.detailedSummaryDesktop = await shot(p, "06-detailed-summary-desktop-top.png");
    results.checks.detailedSummaryDesktop = await evaluateDetailed(p);
    await p.close();
  }

  // Print-like evidence (emulate print media)
  {
    const p = await desktop.newPage();
    await p.goto(`${BASE}/learning/parent-report-detailed`, { waitUntil: "networkidle" });
    await p.emulateMedia({ media: "print" });
    results.screenshots.printFull = await shot(p, "07-print-full-first-page.png");
    results.print.full = await evaluateDetailed(p);
    await p.close();
  }
  {
    const p = await desktop.newPage();
    await p.goto(`${BASE}/learning/parent-report-detailed?mode=summary`, { waitUntil: "networkidle" });
    await p.emulateMedia({ media: "print" });
    results.screenshots.printSummary = await shot(p, "08-print-summary-first-page.png");
    results.print.summary = await evaluateDetailed(p);
    await p.close();
  }

  await mobile.close();
  await desktop.close();
  await browser.close();

  writeFileSync(
    join(ROOT, "reports", "parent-report-product-contract", "manual-browser-qa-results.json"),
    JSON.stringify(results, null, 2),
    "utf8"
  );
  console.log("manual-browser-qa-parent-reports: done");
}

run().catch((e) => {
  console.error("manual-browser-qa-parent-reports: failed", e);
  process.exit(1);
});

