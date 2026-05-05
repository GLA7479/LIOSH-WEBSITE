#!/usr/bin/env node
/**
 * Generates profile-labeled parent-report PDFs via Playwright (requires healthy Next dev server).
 * Usage: QA_BASE_URL=http://127.0.0.1:PORT node scripts/overnight-parent-ai-sample-pdfs.mjs --outDir <path>
 *
 * All browser seeding runs inside a single serialized function so Playwright does not strip
 * closures (`now` and helpers must live in browser context only).
 *
 * Playwright harness: mocks `/api/student/me` (same family as qa-parent-pdf-export) and waits for
 * `#parent-report-detailed-print` + attached `.parent-report-parent-ai-insight` (same visibility contract
 * as qa-parent-pdf-export.mjs) so print/PDF is never captured on a half-hydrated route.
 *
 * Logs: stdout lines with ISO timestamps (flushed before long waits for overnight log capture).
 */
import fs from "fs";
import path from "path";
import { chromium } from "playwright";
import { PDFParse } from "pdf-parse";

const ROOT = process.cwd();
const args = process.argv.slice(2);
let outDir = path.join(ROOT, "reports", "overnight-parent-ai-audit", "sample-pdfs-temp");
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--outDir" && args[i + 1]) {
    outDir = path.resolve(args[i + 1]);
    i++;
  }
}

const base = process.env.QA_BASE_URL || "http://127.0.0.1:3001";

const PROFILE_IDS = [
  "strong-stable",
  "weak-but-improving",
  "very-little-data",
  "six-subject-mixed",
  "external-question-flow-report-surface",
];

const EXPECTED_PDF_COUNT = PROFILE_IDS.length * 2;
const MIN_PDF_BYTES = 2500;
const REQUIRED_HEBREW_SNIPPET = "תובנה להורה";

/** Cold first-hit on dev can exceed `domcontentloaded`+insight without the print root (Phase C.1 parity). */
const DETAILED_PRINT_ROOT_MS = 240_000;
const INSIGHT_WAIT_MS = 240_000;

/** Immediate stdout line (newline flush) before long Playwright waits. */
function logLine(msg) {
  process.stdout.write(`[${new Date().toISOString()}] [overnight-sample-pdfs] ${msg}\n`);
}

/**
 * Entire body runs in Chromium; must not reference Node or outer scope.
 * @param {{ profileId: string, now: number }} payload
 */
function browserSeed(payload) {
  const { profileId, now } = payload;

  function seedSixSubjectsMinimal(ts) {
    const mkTopic = (sessions) => ({ topics: { t1: { sessions } } });
    const one = (corr, tot) => [
      {
        timestamp: ts,
        total: tot,
        correct: corr,
        mode: "learning",
        grade: "g3",
        level: "medium",
        duration: 300,
      },
    ];
    localStorage.setItem("mleo_english_time_tracking", JSON.stringify(mkTopic(one(8, 10))));
    localStorage.setItem("mleo_english_master_progress", JSON.stringify({ progress: { t1: { total: 50, correct: 42 } } }));
    localStorage.setItem("mleo_english_mistakes", JSON.stringify([]));
    localStorage.setItem("mleo_science_time_tracking", JSON.stringify(mkTopic(one(7, 10))));
    localStorage.setItem("mleo_science_master_progress", JSON.stringify({ progress: { t1: { total: 40, correct: 30 } } }));
    localStorage.setItem("mleo_science_mistakes", JSON.stringify([]));
    localStorage.setItem("mleo_hebrew_time_tracking", JSON.stringify(mkTopic(one(9, 11))));
    localStorage.setItem("mleo_hebrew_master_progress", JSON.stringify({ progress: { t1: { total: 44, correct: 38 } } }));
    localStorage.setItem("mleo_hebrew_mistakes", JSON.stringify([]));
    localStorage.setItem("mleo_moledet_geography_time_tracking", JSON.stringify(mkTopic(one(6, 9))));
    localStorage.setItem("mleo_moledet_geography_master_progress", JSON.stringify({ progress: { t1: { total: 36, correct: 28 } } }));
    localStorage.setItem("mleo_moledet_geography_mistakes", JSON.stringify([]));
  }

  function clearOtherSubjects() {
    ["mleo_geometry_time_tracking", "mleo_geometry_master_progress", "mleo_geometry_mistakes"].forEach((k) =>
      localStorage.removeItem(k)
    );
    ["english", "science", "hebrew", "moledet_geography"].forEach((sub) => {
      localStorage.removeItem(`mleo_${sub}_time_tracking`);
      localStorage.removeItem(`mleo_${sub}_master_progress`);
      localStorage.removeItem(`mleo_${sub}_mistakes`);
    });
  }

  switch (profileId) {
    case "strong-stable":
    case "external-question-flow-report-surface": {
      localStorage.setItem("mleo_player_name", "OvernightStrong");
      localStorage.setItem(
        "mleo_time_tracking",
        JSON.stringify({
          operations: {
            addition: {
              sessions: Array.from({ length: 8 }, (_, i) => ({
                timestamp: now - i * 3600000,
                total: 24,
                correct: 22,
                mode: "learning",
                grade: "g4",
                level: "medium",
                duration: 400,
              })),
            },
          },
        })
      );
      localStorage.setItem("mleo_math_master_progress", JSON.stringify({ progress: { addition: { total: 400, correct: 360 } } }));
      localStorage.setItem("mleo_mistakes", JSON.stringify([]));
      localStorage.setItem(
        "mleo_geometry_time_tracking",
        JSON.stringify({
          topics: {
            perimeter: {
              sessions: Array.from({ length: 6 }, (_, i) => ({
                timestamp: now - i * 400000,
                total: 20,
                correct: 18,
                mode: "learning",
                grade: "g4",
                level: "hard",
                duration: 380,
              })),
            },
          },
        })
      );
      localStorage.setItem("mleo_geometry_master_progress", JSON.stringify({ progress: { perimeter: { total: 120, correct: 108 } } }));
      localStorage.setItem("mleo_geometry_mistakes", JSON.stringify([]));
      seedSixSubjectsMinimal(now);
      break;
    }
    case "weak-but-improving": {
      localStorage.setItem("mleo_player_name", "OvernightWeakImp");
      localStorage.setItem(
        "mleo_time_tracking",
        JSON.stringify({
          operations: {
            subtraction: {
              sessions: [
                { timestamp: now - 86400000 * 5, total: 12, correct: 4, mode: "practice", grade: "g3", level: "easy", duration: 200 },
                { timestamp: now - 86400000 * 2, total: 14, correct: 7, mode: "learning", grade: "g3", level: "medium", duration: 260 },
                { timestamp: now, total: 16, correct: 11, mode: "learning", grade: "g3", level: "medium", duration: 280 },
              ],
            },
          },
        })
      );
      localStorage.setItem("mleo_math_master_progress", JSON.stringify({ progress: { subtraction: { total: 90, correct: 52 } } }));
      localStorage.setItem("mleo_mistakes", JSON.stringify([]));
      localStorage.setItem("mleo_geometry_time_tracking", JSON.stringify({ topics: {} }));
      localStorage.setItem("mleo_geometry_master_progress", JSON.stringify({ progress: {} }));
      localStorage.setItem("mleo_geometry_mistakes", JSON.stringify([]));
      clearOtherSubjects();
      break;
    }
    case "very-little-data": {
      localStorage.setItem("mleo_player_name", "OvernightThin");
      localStorage.setItem(
        "mleo_time_tracking",
        JSON.stringify({
          operations: {
            addition: {
              sessions: [{ timestamp: now, total: 3, correct: 2, mode: "learning", grade: "g2", level: "easy", duration: 120 }],
            },
          },
        })
      );
      localStorage.setItem("mleo_math_master_progress", JSON.stringify({ progress: { addition: { total: 3, correct: 2 } } }));
      localStorage.setItem("mleo_mistakes", JSON.stringify([]));
      clearOtherSubjects();
      break;
    }
    case "six-subject-mixed": {
      localStorage.setItem("mleo_player_name", "Overnight6Mix");
      localStorage.setItem(
        "mleo_time_tracking",
        JSON.stringify({
          operations: {
            division: {
              sessions: [{ timestamp: now, total: 11, correct: 7, mode: "learning", grade: "g4", level: "medium", duration: 340 }],
            },
          },
        })
      );
      localStorage.setItem("mleo_math_master_progress", JSON.stringify({ progress: { division: { total: 44, correct: 30 } } }));
      localStorage.setItem("mleo_mistakes", JSON.stringify([]));
      localStorage.setItem(
        "mleo_geometry_time_tracking",
        JSON.stringify({
          topics: {
            angles: {
              sessions: [{ timestamp: now - 1000, total: 9, correct: 6, mode: "learning", grade: "g4", level: "medium", duration: 310 }],
            },
          },
        })
      );
      localStorage.setItem("mleo_geometry_master_progress", JSON.stringify({ progress: { angles: { total: 36, correct: 24 } } }));
      localStorage.setItem("mleo_geometry_mistakes", JSON.stringify([]));
      seedSixSubjectsMinimal(now);
      break;
    }
    default:
      throw new Error(`unknown profileId: ${profileId}`);
  }
}

const pdfOpts = {
  format: "A4",
  printBackground: true,
  margin: { top: "10mm", right: "8mm", bottom: "10mm", left: "8mm" },
  preferCSSPageSize: true,
};

async function extractPdfText(buf) {
  const parser = new PDFParse({ data: buf });
  try {
    const textResult = await parser.getText();
    return String(textResult?.text || "");
  } finally {
    await parser.destroy?.();
  }
}

async function mockStudentMe(page) {
  await page.route("**/api/student/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        student: {
          id: "00000000-0000-0000-0000-0000000000b1",
          full_name: "OvernightSamplePdf",
          grade_level: 4,
          is_active: true,
          coin_balance: 0,
        },
      }),
    });
  });
}

/**
 * @param {import("playwright").Page} page
 * @param {string} label
 */
async function waitForDetailedReportReadyForPrint(page, label) {
  logLine(`waiting for detailed print root (#parent-report-detailed-print) label=${label}`);
  await page.waitForSelector("#parent-report-detailed-print", { timeout: DETAILED_PRINT_ROOT_MS });
  logLine(`waiting for Parent AI insight (detailed, .parent-report-parent-ai-insight) label=${label}`);
  await page.waitForSelector(".parent-report-parent-ai-insight", {
    timeout: INSIGHT_WAIT_MS,
    state: "attached",
  });
  const t = await page.locator(".parent-report-parent-ai-insight").first().innerText();
  if (!t.includes("תובנה")) {
    throw new Error(`[${label}] Parent AI insight card missing heading text (expected תובנה in card)`);
  }
  logLine(`detailed insight ready label=${label}`);
}

/**
 * @param {import("playwright").Page} page
 * @param {string} label
 */
async function waitForShortReportInsightForPrint(page, label) {
  logLine(`waiting for Parent AI insight (short report) label=${label}`);
  await page.waitForSelector(".parent-report-parent-ai-insight", {
    timeout: INSIGHT_WAIT_MS,
    state: "attached",
  });
  const t = await page.locator(".parent-report-parent-ai-insight").first().innerText();
  if (!t.includes("תובנה")) {
    throw new Error(`[${label}] short report insight missing heading text`);
  }
  logLine(`short insight ready label=${label}`);
}

async function main() {
  logLine(`start script baseUrl=${base} outDir=${outDir}`);
  fs.mkdirSync(outDir, { recursive: true });
  const summary = {
    baseUrl: base,
    expectedPdfCount: EXPECTED_PDF_COUNT,
    generatedPdfCount: 0,
    profiles: [],
    ok: true,
    validationErrors: [],
    generatedFiles: [],
  };

  const browser = await chromium.launch({ headless: true });
  logLine("browser launched");
  for (const profileId of PROFILE_IDS) {
    logLine(`start profile=${profileId}`);
    const sessionNow = Date.now();
    const payload = { profileId, now: sessionNow };
    const context = await browser.newContext({ viewport: { width: 1366, height: 900 }, locale: "he-IL" });
    await context.addInitScript(browserSeed, payload);
    const page = await context.newPage();
    const label = profileId;
    try {
      await mockStudentMe(page);
      logLine(`profile=${label} goto / (seed origin)`);
      await page.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout: 120000 });
      await page.evaluate(browserSeed, payload);

      logLine(`profile=${label} start detailed PDF flow → /learning/parent-report-detailed`);
      await page.goto(`${base}/learning/parent-report-detailed`, { waitUntil: "domcontentloaded", timeout: 120000 });
      await waitForDetailedReportReadyForPrint(page, `${label}-detailed`);
      logLine(`profile=${label} emulate print + page.pdf (detailed full)`);
      await page.emulateMedia({ media: "print" });
      let buf = await page.pdf({ ...pdfOpts });
      const detailedPath = path.join(outDir, `${label}__parent-report-detailed-full.pdf`);
      fs.writeFileSync(detailedPath, buf);
      logLine(`profile=${label} wrote detailed PDF path=${detailedPath} bytes=${buf.length}`);

      logLine(`profile=${label} start short PDF flow → /learning/parent-report`);
      await page.goto(`${base}/learning/parent-report`, { waitUntil: "domcontentloaded", timeout: 120000 });
      await waitForShortReportInsightForPrint(page, `${label}-short`);
      logLine(`profile=${label} emulate print + page.pdf (short)`);
      await page.emulateMedia({ media: "print" });
      buf = await page.pdf({ ...pdfOpts });
      const shortPath = path.join(outDir, `${label}__parent-report-short.pdf`);
      fs.writeFileSync(shortPath, buf);
      logLine(`profile=${label} wrote short PDF path=${shortPath} bytes=${buf.length}`);

      summary.profiles.push({ id: label, detailedPath, shortPath, status: "ok" });
      summary.generatedPdfCount += 2;
      summary.generatedFiles.push(path.basename(detailedPath), path.basename(shortPath));
    } catch (e) {
      logLine(`profile=${label} ERROR ${String(e?.message || e)}`);
      summary.ok = false;
      summary.validationErrors.push(`${label}: ${String(e?.message || e)}`);
      summary.profiles.push({ id: label, status: "error", error: String(e?.message || e) });
    } finally {
      await context.close();
    }
  }
  await browser.close();
  logLine("browser closed; starting post-generation validation");

  const summaryPath = path.join(outDir, "sample-pdfs-summary.json");

  // ---- Post-generation validation (filesystem + PDF text) ----
  const pdfFiles = fs.readdirSync(outDir).filter((f) => f.endsWith(".pdf"));
  if (pdfFiles.length < EXPECTED_PDF_COUNT) {
    summary.ok = false;
    summary.validationErrors.push(
      `Expected at least ${EXPECTED_PDF_COUNT} PDF files, found ${pdfFiles.length}: ${pdfFiles.join(", ") || "(none)"}`
    );
  }

  for (const p of summary.profiles) {
    if (p.status !== "ok") continue;
    for (const key of ["detailedPath", "shortPath"]) {
      const fp = p[key];
      const kind = key === "detailedPath" ? "detailed" : "short";
      if (!fp || !fs.existsSync(fp)) {
        summary.ok = false;
        summary.validationErrors.push(`Missing file: ${fp}`);
        logLine(`validation FAIL profile=${p.id} kind=${kind} missing file`);
        continue;
      }
      const st = fs.statSync(fp);
      if (st.size < MIN_PDF_BYTES) {
        summary.ok = false;
        summary.validationErrors.push(`PDF too small (${st.size} bytes): ${fp}`);
        logLine(`validation FAIL profile=${p.id} kind=${kind} file=${path.basename(fp)} reason=min_size bytes=${st.size} min=${MIN_PDF_BYTES}`);
        continue;
      }
      try {
        const text = await extractPdfText(fs.readFileSync(fp));
        const snippetOk = text.includes(REQUIRED_HEBREW_SNIPPET);
        if (!snippetOk) {
          summary.ok = false;
          summary.validationErrors.push(`PDF missing expected Hebrew insight text (${REQUIRED_HEBREW_SNIPPET}): ${path.basename(fp)}`);
          logLine(`validation FAIL profile=${p.id} kind=${kind} file=${path.basename(fp)} reason=missing_hebrew_snippet`);
        } else {
          logLine(`validation OK profile=${p.id} kind=${kind} file=${path.basename(fp)} bytes=${st.size} snippetOk=true`);
        }
      } catch (e) {
        summary.ok = false;
        summary.validationErrors.push(`PDF text extract failed for ${path.basename(fp)}: ${e?.message || e}`);
        logLine(`validation FAIL profile=${p.id} kind=${kind} file=${path.basename(fp)} reason=extract_error ${e?.message || e}`);
      }
    }
  }

  if (summary.ok !== true || summary.generatedPdfCount !== EXPECTED_PDF_COUNT) {
    summary.ok = false;
    if (summary.generatedPdfCount !== EXPECTED_PDF_COUNT) {
      summary.validationErrors.push(`generatedPdfCount ${summary.generatedPdfCount} !== expected ${EXPECTED_PDF_COUNT}`);
    }
  }

  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), "utf8");
  logLine(`wrote summary ${summaryPath} ok=${summary.ok}`);

  const label = summary.ok ? "OK" : "FAIL";
  console.log("overnight-parent-ai-sample-pdfs:", label, outDir);
  if (summary.validationErrors.length) {
    console.error("[validation]", summary.validationErrors.join("\n"));
  }

  if (!summary.ok) {
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
