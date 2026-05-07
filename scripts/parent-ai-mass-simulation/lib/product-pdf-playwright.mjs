/**
 * Product-format parent report PDFs via Playwright page.pdf (same stack as qa-parent-pdf-export.mjs).
 * Requires a running Next server (QA_BASE_URL).
 *
 * Env (optional):
 *   MASS_PDF_STUDENT_TIMEOUT_MS — wall-clock cap for the whole short+detailed pack per student (default 600000).
 *   MASS_PDF_DOM_WAIT_MS — waitForFunction timeout for each report shell (default 180000).
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { PDFParse } from "pdf-parse";

const pdfOpts = {
  format: "A4",
  printBackground: true,
  margin: { top: "10mm", right: "8mm", bottom: "10mm", left: "8mm" },
  preferCSSPageSize: true,
};

const REQUIRED_HEBREW_SNIPPETS = ["סיכום", "להורה"];

async function extractPdfText(buf) {
  const parser = new PDFParse({ data: buf });
  try {
    const textResult = await parser.getText();
    return String(textResult?.text || "");
  } finally {
    await parser.destroy?.();
  }
}

function estimatePageCount(buf) {
  try {
    const raw = buf.toString("latin1");
    const typePages = raw.match(/\/Type\s*\/Page\b(?!\w)/g);
    if (typePages && typePages.length) return typePages.length;
  } catch {
    /* ignore */
  }
  return 1;
}

function glyphCorruptionScore(text) {
  const t = String(text || "");
  const replacement = (t.match(/\uFFFD/g) || []).length;
  const controls = (t.match(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g) || []).length;
  const ratio = t.length ? replacement / t.length : 0;
  return { replacement, controls, ratio };
}

function envPdfStudentTimeoutMs() {
  const raw = process.env.MASS_PDF_STUDENT_TIMEOUT_MS;
  if (raw === undefined || raw === "") return 600_000;
  const n = parseInt(String(raw), 10);
  return Number.isFinite(n) && n >= 60_000 ? n : 600_000;
}

function envPdfWaitMs() {
  const raw = process.env.MASS_PDF_DOM_WAIT_MS;
  if (raw === undefined || raw === "") return 180_000;
  const n = parseInt(String(raw), 10);
  return Number.isFinite(n) && n >= 10_000 ? n : 180_000;
}

/**
 * @template T
 * @param {Promise<T>} promise
 * @param {number} ms
 * @param {string} label
 */
async function withTimeout(promise, ms, label) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, rej) => {
        timer = setTimeout(() => rej(new Error(`${label}: timeout ${ms}ms`)), ms);
      }),
    ]);
  } finally {
    clearTimeout(timer);
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
          id: "00000000-0000-0000-0000-000000000099",
          full_name: "MassSimStudent",
          grade_level: 4,
          is_active: true,
          coin_balance: 0,
        },
      }),
    });
  });
}

async function waitDetailedReady(page, label, timeoutMs) {
  await page.waitForFunction(
    () => !!document.querySelector("#parent-report-detailed-print"),
    undefined,
    { timeout: timeoutMs, polling: 250 },
  );
}

async function waitShortReady(page, label, timeoutMs) {
  await page.waitForFunction(
    () => !!document.querySelector("#parent-report-pdf"),
    undefined,
    { timeout: timeoutMs, polling: 250 },
  );
}

/**
 * @param {{ baseUrl: string, storageSnapshot: Record<string, string>, studentId: string, outputRoot: string }} opts
 * @returns {Promise<{ short: object, detailed: object, error?: string }>}
 */
export async function exportProductParentReportPdfPack(opts) {
  const studentTimeoutMs = envPdfStudentTimeoutMs();
  const domWaitMs = envPdfWaitMs();
  const base = String(opts.baseUrl || "").replace(/\/$/, "");
  const previewShortDir = path.join(opts.outputRoot, "pdf-previews", "short");
  const previewDetailedDir = path.join(opts.outputRoot, "pdf-previews", "detailed");
  fs.mkdirSync(previewShortDir, { recursive: true });
  fs.mkdirSync(previewDetailedDir, { recursive: true });

  const shortPdfPath = path.join(opts.outputRoot, "pdfs", "short", `${opts.studentId}.pdf`);
  const detailedPdfPath = path.join(opts.outputRoot, "pdfs", "detailed", `${opts.studentId}.pdf`);
  const shortHtmlPath = path.join(opts.outputRoot, "parent-reports", opts.studentId, "short.html");
  const detailedHtmlPath = path.join(opts.outputRoot, "parent-reports", opts.studentId, "detailed.html");
  const shortPng = path.join(previewShortDir, `${opts.studentId}.png`);
  const detailedPng = path.join(previewDetailedDir, `${opts.studentId}.png`);

  const browser = await chromium.launch({ headless: true });
  try {
    const runPack = async () => {
      const context = await browser.newContext({ viewport: { width: 1366, height: 900 }, locale: "he-IL" });
      await context.addInitScript((snap) => {
        try {
          localStorage.clear();
          for (const [k, v] of Object.entries(snap || {})) {
            localStorage.setItem(k, String(v));
          }
        } catch {
          /* ignore */
        }
      }, opts.storageSnapshot);

      const page = await context.newPage();
      await mockStudentMe(page);

      await page.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout: 120_000 });
      await page.evaluate((snap) => {
        try {
          for (const [k, v] of Object.entries(snap || {})) localStorage.setItem(k, String(v));
        } catch {
          /* ignore */
        }
      }, opts.storageSnapshot);

      await page.goto(`${base}/learning/parent-report-detailed`, { waitUntil: "domcontentloaded", timeout: 120_000 });
      await waitDetailedReady(page, `${opts.studentId}-detailed`, domWaitMs);
      let htmlD = await page.content();
      fs.mkdirSync(path.dirname(detailedHtmlPath), { recursive: true });
      fs.writeFileSync(detailedHtmlPath, htmlD, "utf8");

      await page.emulateMedia({ media: "screen" });
      await page.screenshot({ path: detailedPng, fullPage: false });

      await page.emulateMedia({ media: "print" });
      let bufD = await page.pdf({ ...pdfOpts });
      fs.writeFileSync(detailedPdfPath, bufD);

      await page.goto(`${base}/learning/parent-report`, { waitUntil: "domcontentloaded", timeout: 120_000 });
      await waitShortReady(page, `${opts.studentId}-short`, domWaitMs);
      let htmlS = await page.content();
      fs.writeFileSync(shortHtmlPath, htmlS, "utf8");

      await page.emulateMedia({ media: "screen" });
      await page.screenshot({ path: shortPng, fullPage: false });

      await page.emulateMedia({ media: "print" });
      let bufS = await page.pdf({ ...pdfOpts });
      fs.writeFileSync(shortPdfPath, bufS);

      await context.close();

      const metaFor = async (kind, buf, pdfAbsPath, relPdf, relPng, relHtml) => {
        const stat = fs.statSync(pdfAbsPath);
        const text = await extractPdfText(buf);
        const pages = estimatePageCount(buf);
        const glyph = glyphCorruptionScore(text);
        const hasSnippet = REQUIRED_HEBREW_SNIPPETS.some((s) => text.includes(s));
        const hebrewLetters = (text.match(/[\u0590-\u05FF]/g) || []).length;
        const readableHeuristic =
          hebrewLetters >= 40 && glyph.replacement < 5 && glyph.controls < 40 && hasSnippet;

        return {
          studentId: opts.studentId,
          reportType: kind,
          productPdf: true,
          simulationPdf: false,
          pdfRenderer: "product-html-playwright",
          readableHebrew: readableHeuristic,
          visualValidationPassed: readableHeuristic,
          textExtractionPassed: hebrewLetters >= 20 && glyph.ratio < 0.02,
          textExtractionWarning: hebrewLetters >= 20 && hebrewLetters < 40,
          fileSizeBytes: stat.size,
          pageCount: pages,
          pdfPath: relPdf,
          htmlPath: relHtml,
          previewPngPath: relPng,
          extractedHebrewLetterCount: hebrewLetters,
          glyphMetrics: glyph,
        };
      };

      const shortMeta = await metaFor("short", bufS, shortPdfPath, `pdfs/short/${opts.studentId}.pdf`, `pdf-previews/short/${opts.studentId}.png`, `parent-reports/${opts.studentId}/short.html`);
      const detailedMeta = await metaFor("detailed", bufD, detailedPdfPath, `pdfs/detailed/${opts.studentId}.pdf`, `pdf-previews/detailed/${opts.studentId}.png`, `parent-reports/${opts.studentId}/detailed.html`);

      return { short: shortMeta, detailed: detailedMeta };
    };

    return await withTimeout(runPack(), studentTimeoutMs, `pdf_pack:${opts.studentId}`);
  } catch (e) {
    return {
      short: null,
      detailed: null,
      error: String(e?.message || e),
    };
  } finally {
    await browser.close();
  }
}

export async function assertPdfServerReachable(baseUrl) {
  const root = String(baseUrl || "").replace(/\/$/, "");
  const url = `${root}/learning/parent-report-detailed`;
  let lastErr = null;
  for (let attempt = 1; attempt <= 5; attempt++) {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 30_000);
    try {
      const res = await fetch(url, { method: "GET", redirect: "follow", signal: ac.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return;
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, attempt * 800));
    } finally {
      clearTimeout(t);
    }
  }
  throw new Error(
    `PDF server check failed after retries (${url}). Start Next on this port (e.g. npx next start -p 3001). Last error: ${lastErr?.message || lastErr}`
  );
}
