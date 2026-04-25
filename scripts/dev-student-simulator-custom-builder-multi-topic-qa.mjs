/**
 * Custom Builder multi-topic selection — Playwright Chromium verification.
 *
 *   npx playwright install chromium
 *   npx tsx scripts/dev-student-simulator-custom-builder-multi-topic-qa.mjs
 *
 * Spawns Next on QA_CUSTOM_BUILDER_PORT (default 3022) unless QA_FORCE_LOCAL=0.
 * External: QA_FORCE_LOCAL=0 QA_CONNECT_ONLY=1 QA_BASE_URL=http://host:port (SKIP_SERVER_SPAWN optional).
 */
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

/** Inline paths (tsx ESM cannot import named exports from this repo's utils/*.js reliably). */
const LEARNING_PARENT_REPORT_SHORT_PATH = "/learning/parent-report";
const LEARNING_PARENT_REPORT_DETAILED_PATH = "/learning/parent-report-detailed";
function learningParentReportDetailedSummaryHref() {
  return `${LEARNING_PARENT_REPORT_DETAILED_PATH}?mode=summary`;
}
/** Same order as `utils/math-constants.js` OPERATIONS (inline for tsx ESM import compatibility). */
const MATH_OPERATION_KEYS = [
  "addition",
  "subtraction",
  "multiplication",
  "division",
  "division_with_remainder",
  "fractions",
  "percentages",
  "sequences",
  "decimals",
  "rounding",
  "divisibility",
  "prime_composite",
  "powers",
  "ratio",
  "equations",
  "order_of_operations",
  "zero_one_properties",
  "estimation",
  "scale",
  "compare",
  "number_sense",
  "factors_multiples",
  "word_problems",
  "mixed",
];

/** Same keys as `utils/hebrew-constants.js` TOPICS (avoid ESM resolution quirks in this script). */
const HEBREW_TOPIC_KEYS = [
  "reading",
  "comprehension",
  "writing",
  "grammar",
  "vocabulary",
  "speaking",
  "mixed",
];

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PORT = Number(process.env.QA_CUSTOM_BUILDER_PORT || process.env.QA_PORT_ON || 3022);
const SIM_PASSWORD = process.env.DEV_STUDENT_SIMULATOR_PASSWORD || "phase42_browser_qa_pw";
const FORCE_LOCAL = process.env.QA_FORCE_LOCAL !== "0";
const CONNECT_ONLY =
  !FORCE_LOCAL && String(process.env.QA_CONNECT_ONLY || "").trim() === "1" && String(process.env.QA_BASE_URL || "").trim().length > 0;
const SKIP_SPAWN = CONNECT_ONLY;
const BASE = CONNECT_ONLY ? String(process.env.QA_BASE_URL).trim() : `http://localhost:${PORT}`;
const SIMULATOR_METADATA_KEY = "mleo_dev_student_simulator_metadata_v1";

const EXPECT_UNITS = [
  { subject: "math", topic: "division_with_remainder" },
  { subject: "math", topic: "multiplication" },
  { subject: "math", topic: "fractions" },
  { subject: "hebrew", topic: "reading" },
  { subject: "hebrew", topic: "comprehension" },
];

const HE_PREVIEW_SNIPPETS = [
  "חשבון / חילוק עם שארית",
  "חשבון / כפל",
  "חשבון / שברים",
  "עברית / קריאה",
  "עברית / הבנת הנקרא",
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForHttp(url, { timeoutMs = 180_000 } = {}) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    try {
      const res = await fetch(url, { redirect: "manual" });
      if (res.status < 500) return res;
    } catch {
      /* retry */
    }
    await sleep(800);
  }
  throw new Error(`Timeout waiting for ${url}`);
}

function startNext(port, envExtra) {
  return spawn("npx", ["next", "dev", "-p", String(port)], {
    cwd: ROOT,
    env: { ...process.env, ...envExtra, NODE_ENV: "development" },
    stdio: ["ignore", "pipe", "pipe"],
    shell: true,
  });
}

async function killTree(child) {
  if (!child || child.killed) return;
  try {
    if (process.platform === "win32") {
      spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
    } else {
      child.kill("SIGTERM");
    }
  } catch {
    /* no-op */
  }
  await sleep(1500);
}

function unitKey(u) {
  return `${u.subject}:${u.topic}`;
}

function sameUnitSet(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  const sa = new Set(a.map(unitKey));
  if (sa.size !== a.length) return false;
  for (const u of b) {
    if (!sa.has(unitKey(u))) return false;
  }
  return true;
}

async function waitLoggedIn(page) {
  await page.getByTestId("dev-sim-mode-quick").waitFor({ state: "visible", timeout: 120_000 });
}

async function loginIfNeeded(page) {
  const pw = await page.locator('input[type="password"]').count();
  if (pw > 0) {
    await page.locator('input[type="password"]').fill(SIM_PASSWORD);
    await page.getByRole("button", { name: "כניסה" }).click();
    await waitLoggedIn(page);
  } else {
    await waitLoggedIn(page);
  }
}

async function clickPreviewUntilCustomSuccess(page, { maxAttempts = 16 } = {}) {
  for (let i = 0; i < maxAttempts; i += 1) {
    await page.getByTestId("dev-sim-preview").click();
    await sleep(400);
    try {
      await page.getByTestId("dev-sim-preview-topic-list").waitFor({ state: "visible", timeout: 12_000 });
      const n = await page.getByTestId("dev-sim-preview-topic-list").locator("li").count();
      if (n >= 1) return;
    } catch {
      /* list not ready yet */
    }
    const body = await page.innerText("body");
    if (/נוצרה תצוגה מקדימה מנתונים ידניים/i.test(body)) return;
    if (/נוצרה תצוגה מקדימה/i.test(body) && page.url().includes("dev-student-simulator")) return;
    await sleep(600);
  }
  const body = await page.innerText("body").catch(() => "");
  const errLine = await page
    .getByTestId("dev-sim-error")
    .innerText()
    .catch(() => "");
  throw new Error(`Custom preview did not succeed. dev-sim-error: ${errLine.slice(0, 500)} | body tail: ${body.slice(-700)}`);
}

async function main() {
  const evidence = join(ROOT, "reports", "dev-student-simulator", "custom-builder-multi-topic-qa");
  mkdirSync(evidence, { recursive: true });

  let proc;
  if (!SKIP_SPAWN) {
    proc = startNext(PORT, {
      ENABLE_DEV_STUDENT_SIMULATOR: "true",
      DEV_STUDENT_SIMULATOR_PASSWORD: SIM_PASSWORD,
    });
    await waitForHttp(`${BASE}/`, { timeoutMs: 180_000 });
  }

  const browser = await chromium.launch({ headless: String(process.env.HEADED || "").trim() !== "1" });
  const page = await browser.newPage();

  const result = {
    steps: [],
    allTopicsRemainedSelected: null,
    previewListText: "",
    affectedUnits: null,
    errors: [],
  };

  const log = (s) => {
    result.steps.push(s);
    console.log(s);
  };

  try {
    log(`1. Open ${BASE}/learning/dev-student-simulator`);
    await page.goto(`${BASE}/learning/dev-student-simulator`, { waitUntil: "networkidle", timeout: 120_000 });
    await loginIfNeeded(page);

    log("2. Reset baseline (only if metadata exists)");
    const hadMeta = await page.evaluate((k) => Boolean(window.localStorage.getItem(k)), SIMULATOR_METADATA_KEY);
    if (hadMeta) {
      await page.getByTestId("dev-sim-reset").click();
      await sleep(800);
    }

    log("3. Switch to בנייה ידנית (custom mode)");
    await page.getByTestId("dev-sim-mode-custom").click();
    await sleep(300);

    log("4. Open חשבון (math) — enable subject");
    await page.getByTestId("dev-sim-subject-enable-math").check();
    await sleep(200);

    log("4b. Clear default math topic(s) (e.g. addition from defaultCustomSpec), then select only the three requested");
    for (const t of MATH_OPERATION_KEYS) {
      const el = page.getByTestId(`dev-sim-topic-active-math-${t}`);
      if ((await el.count()) > 0 && (await el.isChecked())) await el.uncheck();
    }
    await sleep(150);

    log("5. Select math topics: חילוק עם שארית, כפל, שברים");
    for (const t of ["division_with_remainder", "multiplication", "fractions"]) {
      await page.getByTestId(`dev-sim-topic-active-math-${t}`).check();
    }
    await sleep(200);

    const m1 = await page.getByTestId("dev-sim-topic-active-math-division_with_remainder").isChecked();
    const m2 = await page.getByTestId("dev-sim-topic-active-math-multiplication").isChecked();
    const m3 = await page.getByTestId("dev-sim-topic-active-math-fractions").isChecked();
    result.allTopicsRemainedSelected = m1 && m2 && m3;
    log(`6. Math three topics still checked: ${result.allTopicsRemainedSelected}`);

    log("7. Open עברית — enable subject");
    await page.getByTestId("dev-sim-subject-enable-hebrew").check();
    await sleep(200);

    log("7b. Clear any Hebrew topic checkboxes, then select only קריאה + הבנת הנקרא");
    for (const t of HEBREW_TOPIC_KEYS) {
      const el = page.getByTestId(`dev-sim-topic-active-hebrew-${t}`);
      if ((await el.count()) > 0 && (await el.isChecked())) await el.uncheck();
    }
    await sleep(150);

    log("8. Select עברית: קריאה, הבנת הנקרא");
    await page.getByTestId("dev-sim-topic-active-hebrew-reading").check();
    await page.getByTestId("dev-sim-topic-active-hebrew-comprehension").check();
    await sleep(200);

    const h1 = await page.getByTestId("dev-sim-topic-active-hebrew-reading").isChecked();
    const h2 = await page.getByTestId("dev-sim-topic-active-hebrew-comprehension").isChecked();
    result.allTopicsRemainedSelected = result.allTopicsRemainedSelected && h1 && h2;
    log(`9. Hebrew two topics still checked: ${h1 && h2}`);

    log("10. Screenshot — selected topics before preview");
    await page.screenshot({ path: join(evidence, "01-selected-before-preview.png"), fullPage: true });

    log("11. Generate preview");
    await clickPreviewUntilCustomSuccess(page);

    const list = page.getByTestId("dev-sim-preview-topic-list");
    await list.waitFor({ state: "visible", timeout: 30_000 });
    const lis = await list.locator("li").count();
    if (lis !== 5) {
      result.errors.push(`Expected 5 preview rows, got ${lis}`);
    }
    result.previewListText = await list.innerText();
    for (const snip of HE_PREVIEW_SNIPPETS) {
      if (!result.previewListText.includes(snip)) {
        result.errors.push(`Preview list missing snippet: ${snip}`);
      }
    }

    const bodyAfterPreview = await page.innerText("body");
    if (/גיאומטריה.*חובה|חובה.*גיאומטריה|geometry.*required/i.test(bodyAfterPreview)) {
      result.errors.push("Unexpected geometry gate text in body");
    }

    log("12. Screenshot — preview with five topics");
    await page.screenshot({ path: join(evidence, "02-preview-five-topics.png"), fullPage: true });

    log("13. Per-topic question change — only כפל row should change");
    const beforeLines = await list.locator("li").allInnerTexts();
    await page.getByTestId("dev-sim-topic-questions-math-multiplication").fill("99");
    await sleep(150);
    await clickPreviewUntilCustomSuccess(page);
    const afterLines = await list.locator("li").allInnerTexts();
    const lineKefel = (arr) => arr.find((l) => l.includes("כפל") && l.includes("חשבון"));
    if (lineKefel(beforeLines) === lineKefel(afterLines)) {
      result.errors.push("Expected כפל preview line to change after question count edit");
    }
    const otherStable = beforeLines.filter((l) => !l.includes("כפל")).sort();
    const afterOther = afterLines.filter((l) => !l.includes("כפל")).sort();
    if (JSON.stringify(otherStable) !== JSON.stringify(afterOther)) {
      result.errors.push("Non-כפל preview lines changed unexpectedly");
    }

    log("14. Uncheck שברים — preview should drop only that topic");
    await page.getByTestId("dev-sim-topic-active-math-fractions").uncheck();
    await sleep(200);
    await clickPreviewUntilCustomSuccess(page);
    const lis4 = await list.locator("li").count();
    if (lis4 !== 4) {
      result.errors.push(`After uncheck fractions expected 4 preview rows, got ${lis4}`);
    }
    const t4 = await list.innerText();
    if (t4.includes("שברים")) {
      result.errors.push("שברים should not appear after uncheck");
    }

    log("15. Re-check שברים for Apply flow");
    await page.getByTestId("dev-sim-topic-active-math-fractions").check();
    await sleep(200);
    await clickPreviewUntilCustomSuccess(page);
    if ((await list.locator("li").count()) !== 5) {
      result.errors.push("Expected 5 preview rows after re-check fractions");
    }

    log("16. Apply");
    await page.getByTestId("dev-sim-apply").click();
    await sleep(1500);
    await page.waitForFunction((k) => Boolean(window.localStorage.getItem(k)), SIMULATOR_METADATA_KEY, { timeout: 90_000 });
    const metaRaw = await page.evaluate((k) => window.localStorage.getItem(k), SIMULATOR_METADATA_KEY);
    let meta;
    try {
      meta = JSON.parse(metaRaw || "null");
    } catch {
      meta = null;
    }
    result.affectedUnits = meta?.affectedUnits ?? null;
    if (!sameUnitSet(meta?.affectedUnits || [], EXPECT_UNITS)) {
      result.errors.push(
        `affectedUnits mismatch. Expected set ${EXPECT_UNITS.map(unitKey).sort().join(",")}, got ${JSON.stringify(meta?.affectedUnits)}`
      );
    }

    log("17. Reset — metadata cleared");
    await page.getByTestId("dev-sim-reset").click();
    await sleep(1200);
    const metaAfter = await page.evaluate((k) => window.localStorage.getItem(k), SIMULATOR_METADATA_KEY);
    if (metaAfter != null) {
      result.errors.push("metadata still present after Reset");
    }

    log("18. HTTP probe — simulator-linked parent report routes must not be 404");
    const reportPaths = [
      ["short", LEARNING_PARENT_REPORT_SHORT_PATH],
      ["detailed", LEARNING_PARENT_REPORT_DETAILED_PATH],
      ["summary", learningParentReportDetailedSummaryHref()],
    ];
    for (const [label, path] of reportPaths) {
      const res = await page.request.get(`${BASE}${path}`);
      const st = res.status();
      if (st === 404) {
        result.errors.push(`Report route ${label} HTTP 404: ${path}`);
      } else if (st < 200 || st >= 400) {
        result.errors.push(`Report route ${label} HTTP ${st}: ${path}`);
      }
    }

    log("19. Click simulator report links — full navigation, no 404 document");
    await page.goto(`${BASE}/learning/dev-student-simulator`, { waitUntil: "networkidle", timeout: 120_000 });
    await loginIfNeeded(page);
    await page.getByTestId("dev-sim-link-parent-report-short").click();
    await page.waitForURL((u) => u.pathname === "/learning/parent-report", { timeout: 60_000 });
    const short404ish = await page.evaluate(() => /This page could not be found|404\s*-\s*Page Not Found/i.test(document.body?.innerText || ""));
    if (short404ish) {
      result.errors.push("Short report page body looks like Next.js missing-page shell after link click");
    }
    await page.goto(`${BASE}/learning/dev-student-simulator`, { waitUntil: "networkidle", timeout: 120_000 });
    await loginIfNeeded(page);
    await page.getByTestId("dev-sim-link-parent-report-detailed").click();
    await page.waitForURL(/\/learning\/parent-report-detailed\/?/, { timeout: 60_000 });
    await page.goto(`${BASE}/learning/dev-student-simulator`, { waitUntil: "networkidle", timeout: 120_000 });
    await loginIfNeeded(page);
    await page.getByTestId("dev-sim-link-parent-report-summary").click();
    await page.waitForURL(/\/learning\/parent-report-detailed\/?/, { timeout: 60_000 });

    writeFileSync(join(evidence, "qa-result.json"), JSON.stringify(result, null, 2), "utf8");

    if (result.errors.length) {
      console.error("FAILURES:", result.errors);
      process.exitCode = 1;
    } else {
      console.log("custom-builder-multi-topic-qa: PASS");
    }
  } catch (e) {
    const msg = String(e?.message || e);
    result.errors.push(msg);
    writeFileSync(join(evidence, "qa-result.json"), JSON.stringify(result, null, 2), "utf8");
    await page.screenshot({ path: join(evidence, "99-error.png"), fullPage: true }).catch(() => {});
    console.error(e);
    process.exitCode = 1;
  } finally {
    await browser.close();
    await killTree(proc);
  }
}

main();
