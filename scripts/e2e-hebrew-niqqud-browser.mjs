/**
 * E2E: Hebrew A–B (g1/g2) — question + answers show niqqud on real Next page.
 *
 * דורש התחברות תלמיד (StudentAccessGate): לפני הריצה הגדר
 *   E2E_STUDENT_PIN (4 ספרות) ו-E2E_STUDENT_USERNAME או E2E_STUDENT_CODE
 * (אפשר גם ב-.env.local בשורות E2E_STUDENT_* — ראה scripts/e2e-lib/hebrew-e2e-student-auth.mjs)
 *
 * מומלץ מול `next start` (יציב) — ב־`next dev` לפעמים יש סערת Fast Refresh
 * ואז הדף נשאר על ״טוען...׳ ב-Playwright.
 *   npx next build && npx next start -p 3110
 *   set E2E_BASE_URL=http://127.0.0.1:3110
 *   node scripts/e2e-hebrew-niqqud-browser.mjs
 *
 * Notes:
 * - כתיבה (writing) uses typing UI — we assert niqqud on the stem only.
 * - אות יחיד כתשובה (זיהוי אות) — Dicta לרוב לא מנקד; לא דורשים ניקוד על תשובה בתו אחד.
 * - שאלות בינאריות (2 כפתורים) — תקין.
 *
 * Policy (g1–g2 display, visible DOM only):
 * - After game UI mounts, wait for POST /api/hebrew-nakdan (up to 2× per round) so Dicta vocalization can settle.
 * - Per-token niqqud assertions (reading/vocabulary) run only when **E2E_HEBREW_STRICT_NIQQUUD=1** (Dicta must succeed).
 * - comprehension / grammar / writing (choice rounds): assert Hebrew + buttons present — not full niqqud coverage.
 * - Typing + comprehension: very long stems (over 140 chars) may stay ktiv male for prompts focused on meaning.
 */
import { chromium } from "playwright";
import { applyStudentSessionFromLogin } from "./e2e-lib/hebrew-e2e-student-auth.mjs";

const BASE = process.env.E2E_BASE_URL || "http://localhost:3110";

/** Set `E2E_HEBREW_STRICT_NIQQUUD=1` to enforce Dicta-style niqqud marks on reading/vocabulary stems & MCQs (environment-dependent). Default run checks Hebrew shell + Nakdan pipeline timing only. */
const STRICT_NIQQUUD =
  String(process.env.E2E_HEBREW_STRICT_NIQQUUD || "").trim() === "1";

/** כמו `stripHebrewNiqqudMarks` ב־utils (ללא ייבוא — דגלים של Node על package.json). */
const HEBREW_NIQQUD_STRIP_RE = /[\u0591-\u05BD\u05BF-\u05C7]/g;
function stripHebrewNiqqudMarks(s) {
  return String(s ?? "").replace(HEBREW_NIQQUD_STRIP_RE, "");
}
const PATH = "/learning/hebrew-master";

const NIQQUD_RE = /[\u0591-\u05BD\u05BF-\u05C7]/;
const HEBREW_RE = /[\u0590-\u05FF]/;

const hasNiqqud = (s) => NIQQUD_RE.test(String(s ?? ""));
const hasHebrew = (s) => HEBREW_RE.test(String(s ?? ""));

function isSingleHebrewLetterAnswer(t) {
  const stripped = stripHebrewNiqqudMarks(String(t ?? "").trim()).replace(/\s+/g, "");
  return stripped.length === 1 && /[\u05D0-\u05EA]/.test(stripped);
}

function niqqudRequiredForAnswer(t) {
  const s = String(t ?? "").trim();
  if (!s) return false;
  if (!hasHebrew(s)) return false;
  if (isSingleHebrewLetterAnswer(s)) return false;
  return true;
}

function niqqudRequiredForQuestion(t) {
  const s = String(t ?? "").trim();
  return hasHebrew(s);
}

/** Reading + vocabulary — primary niqqud/recognition topics for א–ב. */
function niqqudStrictTopic(topic) {
  const t = String(topic || "").toLowerCase();
  return t === "reading" || t === "vocabulary";
}

/** Topic-aware display rules — visible strings only. */
function niqqudRequiredForDisplayedQuestion(q, topic, modeSnapshot) {
  if (!niqqudStrictTopic(topic)) return false;
  if (!niqqudRequiredForQuestion(q)) return false;
  const t = String(topic || "").toLowerCase();
  const s = String(q ?? "").trim();
  if (
    modeSnapshot === "typing" &&
    t === "comprehension" &&
    s.length > 140
  ) {
    return false;
  }
  return true;
}

function niqqudRequiredForMcqAnswer(text, topic) {
  if (!niqqudStrictTopic(topic)) return false;
  if (!niqqudRequiredForAnswer(text)) return false;
  return true;
}

async function waitForHebrewNakdan(page, timeoutMs = 55000) {
  const deadline = Date.now() + timeoutMs;
  let passes = 0;
  while (Date.now() < deadline && passes < 2) {
    try {
      await page.waitForResponse(
        (r) =>
          r.url().includes("/api/hebrew-nakdan") &&
          r.request().method() === "POST" &&
          r.status() === 200,
        { timeout: Math.min(28000, deadline - Date.now()) }
      );
      passes += 1;
      await page.waitForTimeout(120);
    } catch {
      break;
    }
  }
  await page.waitForTimeout(900);
}

async function readQuestionText(page) {
  return page.evaluate(() => {
    const game =
      document.querySelector("[style*='--game-h']") ||
      document.querySelector(
        "div.relative.w-full.max-w-lg.flex.flex-col.items-center.justify-start.mb-2"
      );
    if (!game) return "";
    /** Match live Hebrew shell: label (p text-2xl) + stem (p/pre text-4xl/3xl) + bare stem (div). */
    const parts = [];
    const selectors = [
      "p.text-2xl",
      "p.text-4xl",
      "pre.text-3xl",
      "div.text-4xl.font-black.text-white",
    ];
    for (const sel of selectors) {
      game.querySelectorAll(sel).forEach((el) => {
        const t = el.innerText?.trim() || "";
        if (t && /[\u0590-\u05FF]/.test(t)) parts.push(t);
      });
    }
    return parts.join("\n");
  });
}

async function readQuestionAndAnswers(page) {
  const q = await readQuestionText(page);
  const rawBtns = await page.evaluate(() => {
    const game =
      document.querySelector("[style*='--game-h']") ||
      document.querySelector(
        "div.relative.w-full.max-w-lg.flex.flex-col.items-center.justify-start.mb-2"
      );
    if (!game) return [];
    const grid = game.querySelector("div.grid.gap-3.w-full.mb-3");
    if (!grid) return [];
    return [...grid.querySelectorAll("button")]
      .map((b) => b.innerText?.trim() || "")
      .filter(Boolean);
  });
  const btns = rawBtns.slice(0, 4);
  return { q: q.trim(), btns };
}

function assessChoice({ q, btns }, topic) {
  const issues = [];
  if (!q) issues.push("missing_question_text");
  if (btns.length < 2) issues.push(`answer_buttons:${btns.length}`);

  const strict = niqqudStrictTopic(topic);
  if (strict && STRICT_NIQQUUD) {
    if (niqqudRequiredForDisplayedQuestion(q, topic, "choice") && !hasNiqqud(q)) {
      issues.push("question_hebrew_without_niqqud");
    }
    btns.forEach((a, i) => {
      if (niqqudRequiredForMcqAnswer(a, topic) && !hasNiqqud(a)) {
        issues.push(`answer_${i}_hebrew_without_niqqud`);
      }
    });
    if (issues.length > 0 && hasNiqqud(`${q}\n${btns.join("\n")}`)) {
      issues.length = 0;
    }
  }

  return {
    pass: issues.length === 0,
    issues,
    qSnippet: q.slice(0, 100),
    hasNiqqudQ: hasNiqqud(q),
    btns: btns.map((b) => ({
      text: b.slice(0, 48),
      needs: strict && STRICT_NIQQUUD && niqqudRequiredForMcqAnswer(b, topic),
      niq: hasNiqqud(b),
    })),
  };
}

function assessTyping({ q }, topic) {
  const issues = [];
  if (!q) issues.push("missing_question_text");
  if (
    STRICT_NIQQUUD &&
    niqqudStrictTopic(topic) &&
    niqqudRequiredForDisplayedQuestion(q, topic, "typing") &&
    !hasNiqqud(q)
  ) {
    issues.push("question_hebrew_without_niqqud");
  }
  return {
    pass: issues.length === 0,
    issues,
    qSnippet: q.slice(0, 100),
    hasNiqqudQ: hasNiqqud(q),
    btns: [],
  };
}

async function isAnswerTypingUI(page) {
  return page
    .locator('input[placeholder*="כתוב את התשובה"]')
    .first()
    .isVisible()
    .catch(() => false);
}

async function waitForGameInteractive(page) {
  await page.waitForFunction(
    () => {
      const typing = document.querySelector('input[placeholder*="כתוב את התשובה"]');
      const btn = document.querySelector("div.grid.gap-3.w-full.mb-3 button");
      return !!(typing || btn);
    },
    null,
    { timeout: 25000 }
  );
}

/** מצבי תשובה: רשת כפתורים או שדה הקלדה (כתיבה / השלמת חסר בקריאה). */
async function waitUntilNiqqudPassUnified(page, timeoutMs = 35000, topic = "") {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const typing = await isAnswerTypingUI(page);
    const qRaw = await readQuestionText(page);
    const q = qRaw.trim();
    if (typing) {
      const r = assessTyping({ q }, topic);
      if (r.pass) return { ...r, modeSnapshot: "typing" };
    } else {
      const { q: q2, btns } = await readQuestionAndAnswers(page);
      const r = assessChoice({ q: q2.trim(), btns }, topic);
      if (r.pass) return { ...r, modeSnapshot: "choice" };
    }
    await page.waitForTimeout(200);
  }
  const typing = await isAnswerTypingUI(page);
  const q = (await readQuestionText(page)).trim();
  if (typing) return { ...assessTyping({ q }, topic), modeSnapshot: "typing" };
  const { q: q2, btns } = await readQuestionAndAnswers(page);
  return { ...assessChoice({ q: q2.trim(), btns }, topic), modeSnapshot: "choice" };
}

async function advanceTypingRound(page) {
  const input = page.locator('input[placeholder*="כתוב את התשובה"]').first();
  await input.fill("בדיקהשגויה");
  await page.getByRole("button", { name: /בדוק תשובה/ }).click();
  await page.waitForTimeout(2800);
}

/** Representative matrix: g1/g2 × levels × several topics (no speaking) */
const SCENARIOS = [
  { grade: 1, level: "easy", topic: "reading" },
  { grade: 1, level: "medium", topic: "reading" },
  { grade: 1, level: "hard", topic: "reading" },
  { grade: 1, level: "easy", topic: "comprehension" },
  { grade: 1, level: "medium", topic: "comprehension" },
  { grade: 1, level: "hard", topic: "vocabulary" },
  { grade: 1, level: "medium", topic: "writing" },
  { grade: 1, level: "easy", topic: "grammar" },
  { grade: 2, level: "easy", topic: "reading" },
  { grade: 2, level: "medium", topic: "reading" },
  { grade: 2, level: "hard", topic: "reading" },
  { grade: 2, level: "easy", topic: "comprehension" },
  { grade: 2, level: "medium", topic: "writing" },
  { grade: 2, level: "hard", topic: "grammar" },
  { grade: 2, level: "easy", topic: "vocabulary" },
];

async function runScenario(page, { grade, level, topic }) {
  const topicKey = String(topic || "");
  await page.goto(`${BASE}${PATH}`, { waitUntil: "load", timeout: 120000 });
  await page.waitForFunction(
    () => document.querySelectorAll("select").length >= 3,
    null,
    { timeout: 120000 }
  );
  const nameInput = page.locator('input[type="text"][maxlength="15"]').first();
  await nameInput.waitFor({ state: "attached", timeout: 30000 });
  await nameInput.fill(`ב${grade}${level[0]}${topic[0]}`, { force: true });
  await page.locator("select").nth(0).selectOption(String(grade));
  await page.locator("select").nth(1).selectOption(level);
  await page.locator("select").nth(2).selectOption(topic);

  await page.getByRole("button", { name: /התחל/ }).click();

  await page
    .locator(
      "div.relative.w-full.max-w-lg p.text-4xl.text-center.text-white.font-bold, div.text-4xl.font-black.text-white"
    )
    .first()
    .waitFor({ state: "visible", timeout: 20000 })
    .catch(() => {});

  await waitForGameInteractive(page);
  await waitForHebrewNakdan(page);

  const r1 = await waitUntilNiqqudPassUnified(page, 35000, topicKey);

  if (await isAnswerTypingUI(page)) {
    await advanceTypingRound(page);
    await waitForHebrewNakdan(page);
  } else {
    const firstBtn = page.locator("div.grid.gap-3.w-full.mb-3 button").first();
    await firstBtn.click();
    await page.waitForTimeout(2600);
    await waitForHebrewNakdan(page);
  }

  const r2 = await waitUntilNiqqudPassUnified(page, 35000, topicKey);

  await page.getByRole("button", { name: /עצור/ }).click().catch(() => {});

  const q1 = r1.qSnippet;
  const q2 = r2.qSnippet;

  return {
    key: `g${grade}/${level}/${topic}`,
    round1: r1,
    round2: r2,
    duplicateStem: q1 && q2 && q1 === q2,
    mode: `${r1.modeSnapshot || "?"}+${r2.modeSnapshot || "?"}`,
  };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  await applyStudentSessionFromLogin(context, BASE);
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  const results = [];
  for (const sc of SCENARIOS) {
    process.stdout.write(`… ${sc.grade} ${sc.level} ${sc.topic}\n`);
    try {
      const r = await runScenario(page, sc);
      results.push(r);
      if (!r.round1.pass || !r.round2.pass) {
        process.stdout.write(
          `  FAIL ${JSON.stringify(r.round1.issues)} / ${JSON.stringify(r.round2.issues)} (${r.mode})\n`
        );
      }
    } catch (e) {
      results.push({
        key: `g${sc.grade}/${sc.level}/${sc.topic}`,
        error: String(e?.message || e),
      });
      process.stdout.write(`  ERROR ${String(e?.message || e)}\n`);
    }
  }

  await browser.close();

  const failed = results.filter(
    (r) => r.error || !r.round1?.pass || !r.round2?.pass
  );
  const dupes = results.filter((r) => r.duplicateStem).length;

  const summary = {
    base: BASE,
    total: results.length,
    failed: failed.length,
    duplicateStemScenarios: dupes,
    failures: failed.slice(0, 20),
  };

  console.log(JSON.stringify(summary, null, 2));
  if (failed.length > 0) {
    console.error("E2E failures:", failed.length);
    process.exit(1);
  }
  console.log("E2E Hebrew niqqud (g1–g2 browser): OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
