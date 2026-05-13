/**
 * Parent AI insight card — headings and provenance lines from `components/ParentReportInsight.jsx`.
 *
 * - Legacy single-paragraph: bold **"תובנה להורה"**.
 * - Structured narrative: bold **"סיכום חכם להורה"** plus a footnote (deterministic vs AI).
 *
 * Playwright/Chromium `pdf-parse` extraction often garbles the first bold Hebrew line; the
 * structured provenance sentences tend to survive. Gates accept those fingerprints so PDF
 * validation stays meaningful without requiring a single fragile substring.
 */

/** @param {string} [rawText] */
export function pdfTextContainsParentAiInsightFingerprint(rawText) {
  const t = String(rawText || "").replace(/\s+/g, " ");
  if (/(תובנה\s+להורה|סיכום\s+חכם\s+להורה)/u.test(t)) return true;
  if (/סיכום\s+זה\s+נבנה\s+אוטומטית/u.test(t)) return true;
  if (/סיכום\s+נכתב\s+על\s+ידי\s+מודל\s+AI/u.test(t)) return true;
  return false;
}

/** @param {string} [innerText] — `.parent-report-parent-ai-insight` card text (DOM, not PDF). */
export function domInsightCardShowsParentAiHeading(innerText) {
  const t = String(innerText || "");
  return /(תובנה\s+להורה|סיכום\s+חכם\s+להורה)/u.test(t);
}
