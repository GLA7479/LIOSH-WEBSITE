/**
 * E2E: Hebrew grades א׳–ב׳ (g1/g2) — product fit on real Next page.
 *
 * דורש התחברות תלמיד (StudentAccessGate): E2E_STUDENT_PIN + E2E_STUDENT_USERNAME או E2E_STUDENT_CODE
 * (ראה scripts/e2e-lib/hebrew-e2e-student-auth.mjs)
 *
 * לכל נושא (כולל דיבור אם מופיע ב־select): סבב תקין הוא או MCQ (בדיוק 4 כפתורים)
 * או סבב הקלדה מבוקר (שדה טקסט + ״בדוק תשובה׳) לפי `preferredAnswerMode` בבנק החי —
 * לא שילוב של שני המצבים. אין מטא/תוויות פנימיות בגוף השאלה הגלוי.
 *
 * מומלץ מול `next start` **מהשורש של הפרויקט** (אחרי `next build`), עם פורט פנוי —
 * אם `E2E_BASE_URL` מצביע על שרת אחר או build ישן, תראו «טוען...» ו־0 `<select>`.
 *
 *   npx next build && npx next start -p 3847
 *   set E2E_BASE_URL=http://127.0.0.1:3847
 *   node scripts/e2e-hebrew-g1-g2-product-fit.mjs
 */
import { chromium } from "playwright";
import { applyStudentSessionFromLogin } from "./e2e-lib/hebrew-e2e-student-auth.mjs";

const BASE = process.env.E2E_BASE_URL || "http://localhost:3110";
const PATH = "/learning/hebrew-master";

/** יישור עם audit-hebrew-g1-g2-hard.mjs (טקסט שמוצג למשתמש). */
const META_RES = [
  { id: "grade_tag_paren", re: /\(\s*כיתה\s+[אבגדהו]/i },
  { id: "grade_prefix_colon", re: /^\s*כיתה\s+[אבגדהו][׳']?\s*:/i },
  { id: "grade_bekita_colon", re: /^\s*בכיתה\s+[אבגדהו][׳']?\s*:/i },
  { id: "level_label", re: /רמה\s+(קלה|בינונית|קשה)/i },
  { id: "hitamat_dover", re: /התאמת\s+דובר/i },
  { id: "hitamat_guf_phrase", re: /התאמת\s+גוף/i },
  { id: "subtopic_token", re: /subtopic/i },
  { id: "pattern_token", re: /pattern\s*family|patternfamily/i },
  { id: "internal_underscore_id", re: /\bg[12]_[a-z0-9_]{12,}\b/i },
];

function metaHits(text) {
  const s = String(text || "");
  const hits = [];
  for (const { id, re } of META_RES) {
    if (re.test(s)) hits.push(id);
  }
  return hits;
}

async function readQuestionText(page) {
  return page.evaluate(() => {
    const game =
      document.querySelector("[style*='--game-h']") ||
      document.querySelector(
        "div.relative.w-full.max-w-lg.flex.flex-col.items-center.justify-start.mb-2"
      );
    if (!game) return "";
    const p4 = game.querySelectorAll("p.text-4xl");
    for (const p of p4) {
      const t = p.innerText?.trim() || "";
      if (t && /[\u0590-\u05FF]/.test(t)) return t;
    }
    const p2 = game.querySelectorAll("p.text-2xl");
    for (const p of p2) {
      const t = p.innerText?.trim() || "";
      if (t && /[\u0590-\u05FF]/.test(t)) return t;
    }
    const pre = game.querySelector("pre.text-3xl");
    if (pre) {
      const t = pre.innerText?.trim() || "";
      if (t && /[\u0590-\u05FF]/.test(t)) return t;
    }
    const div = game.querySelector("div.text-4xl.font-black.text-white");
    if (div) {
      const t = div.innerText?.trim() || "";
      if (t) return t;
    }
    return "";
  });
}

async function readChoiceGrid(page) {
  return page.evaluate(() => {
    const game =
      document.querySelector("[style*='--game-h']") ||
      document.querySelector(
        "div.relative.w-full.max-w-lg.flex.flex-col.items-center.justify-start.mb-2"
      );
    if (!game) return { texts: [] };
    const grid = game.querySelector("div.grid.gap-3.w-full.mb-3");
    if (!grid) return { texts: [] };
    const texts = [...grid.querySelectorAll("button")]
      .map((b) => b.innerText?.trim() || "")
      .filter(Boolean);
    return { texts };
  });
}

async function isTypingVisible(page) {
  return page
    .locator('input[placeholder*="כתוב את התשובה"]')
    .first()
    .isVisible()
    .catch(() => false);
}

async function snapshotRound(page) {
  const typing = await isTypingVisible(page);
  const q = (await readQuestionText(page)).trim();
  const { texts } = await readChoiceGrid(page);
  const meta = metaHits(q);
  const issues = [];
  if (typing) {
    if (texts.length !== 0) {
      issues.push(`typing_with_choice_grid:${texts.length}`);
    }
  } else {
    if (texts.length !== 4) issues.push(`choice_buttons:${texts.length}`);
    const binaryish =
      texts.length === 2 &&
      texts.join(" ").match(/נכון|לא\s+נכון|אמת|שקר/i);
    if (binaryish) issues.push("binary_two_button_row");
  }
  if (meta.length) issues.push(`meta_in_stem:${meta.join(",")}`);
  return {
    pass: issues.length === 0,
    issues,
    qSnippet: q.slice(0, 120),
    texts,
  };
}

async function waitForChoiceRound(page, timeoutMs = 22000) {
  const deadline = Date.now() + timeoutMs;
  let last = await snapshotRound(page);
  while (Date.now() < deadline) {
    last = await snapshotRound(page);
    if (last.pass) return last;
    if (last.issues.some((x) => String(x).startsWith("typing_with_choice_grid")))
      return last;
    await page.waitForTimeout(200);
  }
  return last;
}

const TOPICS_AB = [
  "reading",
  "comprehension",
  "writing",
  "grammar",
  "vocabulary",
  "speaking",
];

/** רמת קושי לכל נושא — מספיקה לווידוא UI; מפוזרת כדי לכסות בריכות שונות */
function levelFor(grade, topic) {
  const h = (grade + topic).length % 3;
  return h === 0 ? "easy" : h === 1 ? "medium" : "hard";
}

async function topicOptionsOnPage(page) {
  return page.locator("select").nth(2).evaluate((sel) =>
    [...sel.querySelectorAll("option")].map((o) => o.value).filter(Boolean)
  );
}

async function runScenario(page, { grade, topic }) {
  const level = levelFor(grade, topic);
  await page.goto(`${BASE}${PATH}`, { waitUntil: "load", timeout: 120000 });
  await page.waitForFunction(
    () => document.querySelectorAll("select").length >= 3,
    null,
    { timeout: 120000 }
  );

  const available = await topicOptionsOnPage(page);
  if (!available.includes(topic)) {
    return {
      key: `g${grade}/${level}/${topic}`,
      skipped: true,
      reason: "topic_not_in_select",
      available,
    };
  }

  const nameInput = page.locator('input[type="text"][maxlength="15"]').first();
  await nameInput.waitFor({ state: "attached", timeout: 30000 });
  await nameInput.fill(`ab${grade}${topic[0]}`, { force: true });
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

  const r1 = await waitForChoiceRound(page, 22000);

  if (r1.pass && Array.isArray(r1.texts) && r1.texts.length === 4) {
    const firstBtn = page.locator("div.grid.gap-3.w-full.mb-3 button").first();
    await firstBtn.click();
    await page.waitForTimeout(2600);
  } else if (r1.pass) {
    await page.waitForTimeout(400);
  }

  const r2 = await waitForChoiceRound(page, 22000);

  await page.getByRole("button", { name: /עצור/ }).click().catch(() => {});

  return {
    key: `g${grade}/${level}/${topic}`,
    round1: r1,
    round2: r2,
    mode: `${r1.pass ? "ok" : "fail"}+${r2.pass ? "ok" : "fail"}`,
  };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  await applyStudentSessionFromLogin(context, BASE);
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  await page.goto(`${BASE}${PATH}`, { waitUntil: "load", timeout: 120000 });
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
  });
  await page.reload({ waitUntil: "load", timeout: 120000 });

  const results = [];
  for (const grade of [1, 2]) {
    for (const topic of TOPICS_AB) {
      process.stdout.write(`… g${grade} ${topic}\n`);
      try {
        const r = await runScenario(page, { grade, topic });
        results.push(r);
        if (r.skipped) {
          process.stdout.write(`  SKIP ${r.reason}\n`);
        } else if (!r.round1?.pass || !r.round2?.pass) {
          process.stdout.write(
            `  FAIL r1=${JSON.stringify(r.round1?.issues)} r2=${JSON.stringify(r.round2?.issues)}\n`
          );
        }
      } catch (e) {
        results.push({
          key: `g${grade}/*/${topic}`,
          error: String(e?.message || e),
        });
        process.stdout.write(`  ERROR ${String(e?.message || e)}\n`);
      }
    }
  }

  await browser.close();

  const failed = results.filter(
    (r) =>
      r.error ||
      (!r.skipped && (!r.round1?.pass || !r.round2?.pass))
  );
  const skipped = results.filter((r) => r.skipped);

  const summary = {
    base: BASE,
    total: results.length,
    failed: failed.length,
    skipped: skipped.length,
    failures: failed.slice(0, 24),
  };

  console.log(JSON.stringify(summary, null, 2));
  if (failed.length > 0) {
    console.error("E2E g1/g2 product-fit failures:", failed.length);
    process.exit(1);
  }
  console.log("E2E Hebrew g1/g2 A–B product-fit: OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
