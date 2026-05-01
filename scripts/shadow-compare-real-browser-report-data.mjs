import process from "node:process";
import { chromium } from "playwright";
import {
  buildReportInputFromDbData,
  compareDbReportInputToLocalSnapshot,
  REPORT_DB_SUBJECTS,
} from "../lib/learning-supabase/report-data-adapter.js";

const DEFAULT_STEP_TIMEOUT_MS = 12000;
const DEFAULT_NAV_TIMEOUT_MS = 15000;
const DEFAULT_MAX_RUNTIME_MS = 90000;

const LOCAL_STORAGE_KEYS = [
  "mleo_math_master_progress",
  "mleo_geometry_master_progress",
  "mleo_english_master_progress",
  "mleo_hebrew_master_progress",
  "mleo_science_master_progress",
  "mleo_moledet_geography_master_progress",
  "mleo_mistakes",
  "mleo_geometry_mistakes",
  "mleo_english_mistakes",
  "mleo_hebrew_mistakes",
  "mleo_science_mistakes",
  "mleo_moledet_geography_mistakes",
  "mleo_time_tracking",
  "mleo_geometry_time_tracking",
  "mleo_english_time_tracking",
  "mleo_hebrew_time_tracking",
  "mleo_science_time_tracking",
  "mleo_moledet_geography_time_tracking",
  "mleo_player_name",
];

const SUBJECT_TO_PROGRESS_KEY = {
  math: "mleo_math_master_progress",
  geometry: "mleo_geometry_master_progress",
  english: "mleo_english_master_progress",
  hebrew: "mleo_hebrew_master_progress",
  science: "mleo_science_master_progress",
  moledet_geography: "mleo_moledet_geography_master_progress",
};

const SUBJECT_TO_MISTAKES_KEY = {
  math: "mleo_mistakes",
  geometry: "mleo_geometry_mistakes",
  english: "mleo_english_mistakes",
  hebrew: "mleo_hebrew_mistakes",
  science: "mleo_science_mistakes",
  moledet_geography: "mleo_moledet_geography_mistakes",
};

const SUBJECT_TO_TIME_KEY = {
  math: "mleo_time_tracking",
  geometry: "mleo_geometry_time_tracking",
  english: "mleo_english_time_tracking",
  hebrew: "mleo_hebrew_time_tracking",
  science: "mleo_science_time_tracking",
  moledet_geography: "mleo_moledet_geography_time_tracking",
};

function parseArgs(argv) {
  const out = {
    headed: false,
    skipPrepare: false,
    extractOnlyAfterManualPrep: false,
    prepareSubjects: "",
    maxRuntimeMs: DEFAULT_MAX_RUNTIME_MS,
    manualPrepWaitMs: 30000,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--baseUrl") out.baseUrl = argv[i + 1];
    if (token === "--parentToken") out.parentToken = argv[i + 1];
    if (token === "--studentId") out.studentId = argv[i + 1];
    if (token === "--studentUsername") out.studentUsername = argv[i + 1];
    if (token === "--studentPin") out.studentPin = argv[i + 1];
    if (token === "--from") out.from = argv[i + 1];
    if (token === "--to") out.to = argv[i + 1];
    if (token === "--period") out.period = argv[i + 1];
    if (token === "--timezone") out.timezone = argv[i + 1];
    if (token === "--headed") out.headed = true;
    if (token === "--skipPrepare") out.skipPrepare = true;
    if (token === "--extractOnlyAfterManualPrep") out.extractOnlyAfterManualPrep = true;
    if (token === "--prepareSubjects") out.prepareSubjects = argv[i + 1] || "";
    if (token === "--manualPrepWaitMs") {
      const n = Number(argv[i + 1]);
      out.manualPrepWaitMs = Number.isFinite(n) ? Math.max(1000, n) : out.manualPrepWaitMs;
    }
    if (token === "--maxRuntimeMs") {
      const n = Number(argv[i + 1]);
      out.maxRuntimeMs = Number.isFinite(n) ? Math.max(30000, n) : out.maxRuntimeMs;
    }
  }
  return out;
}

function safeString(value, maxLen = 500) {
  if (value == null) return "";
  const text = String(value).trim();
  if (!text) return "";
  return text.length > maxLen ? text.slice(0, maxLen) : text;
}

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function normalizeAccuracy(correct, total) {
  const c = Math.max(0, safeNumber(correct));
  const t = Math.max(0, safeNumber(total));
  if (t <= 0) return 0;
  return Number(((c / t) * 100).toFixed(2));
}

function ensureRequired(name, value) {
  if (!value) throw new Error(`Missing required value: ${name}`);
}

function stageLog(stage, details = {}) {
  console.log(
    JSON.stringify({
      type: "stage",
      stage,
      ts: new Date().toISOString(),
      ...details,
    })
  );
}

async function withTimeout(stage, timeoutMs, fn) {
  let timer = null;
  try {
    return await Promise.race([
      fn(),
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`Timeout at stage "${stage}" after ${timeoutMs}ms`)),
          timeoutMs
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function withOneRetry(stage, fn) {
  try {
    return await fn();
  } catch (error) {
    stageLog(`${stage}.retry`, { message: safeString(error?.message || "unknown", 160) });
    return fn();
  }
}

function parseJsonString(raw) {
  if (!raw || typeof raw !== "string") return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function parseMistakes(rawValue, subject) {
  const parsed = parseJsonString(rawValue);
  if (!parsed) return [];
  const list = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed.mistakes)
      ? parsed.mistakes
      : Array.isArray(parsed.items)
        ? parsed.items
        : [];
  return list
    .map(item => ({
      subject,
      topic: safeString(item?.topic || item?.bucket || item?.category, 120) || null,
    }))
    .filter(item => item.subject);
}

function parseDurationSeconds(rawValue) {
  const parsed = parseJsonString(rawValue);
  if (!parsed) return 0;
  if (typeof parsed === "number") return Math.max(0, Math.floor(parsed));
  if (typeof parsed === "object") {
    if (Number.isFinite(Number(parsed.durationSeconds))) return Math.max(0, Math.floor(Number(parsed.durationSeconds)));
    if (Number.isFinite(Number(parsed.totalSeconds))) return Math.max(0, Math.floor(Number(parsed.totalSeconds)));
    if (Number.isFinite(Number(parsed.seconds))) return Math.max(0, Math.floor(Number(parsed.seconds)));
    if (Number.isFinite(Number(parsed.timeSeconds))) return Math.max(0, Math.floor(Number(parsed.timeSeconds)));
  }
  return 0;
}

function parseSubjectProgress(rawValue) {
  const parsed = parseJsonString(rawValue);
  if (!parsed || typeof parsed !== "object") {
    return { total: 0, correct: 0, wrong: 0, accuracy: 0 };
  }

  if (parsed.progress && typeof parsed.progress === "object" && !Array.isArray(parsed.progress)) {
    let total = 0;
    let correct = 0;
    for (const topic of Object.values(parsed.progress)) {
      if (!topic || typeof topic !== "object") continue;
      total += Math.max(
        0,
        Math.floor(
          safeNumber(topic.total ?? topic.answers ?? topic.attempts ?? topic.questions)
        )
      );
      correct += Math.max(
        0,
        Math.floor(
          safeNumber(topic.correct ?? topic.correctAnswers ?? topic.successCount)
        )
      );
    }
    const wrong = Math.max(0, total - correct);
    return { total, correct, wrong, accuracy: normalizeAccuracy(correct, total) };
  }

  const total = Math.max(
    0,
    Math.floor(
      safeNumber(
        parsed.totalQuestions ?? parsed.questions ?? parsed.total ?? parsed.answered ?? parsed.answers
      )
    )
  );
  const correct = Math.max(
    0,
    Math.floor(safeNumber(parsed.correctAnswers ?? parsed.correct ?? parsed.right ?? parsed.successCount))
  );
  const wrong = Math.max(
    0,
    Math.floor(safeNumber(parsed.wrongAnswers ?? parsed.wrong ?? parsed.incorrect ?? parsed.errors))
  );
  return { total, correct, wrong, accuracy: normalizeAccuracy(correct, total) };
}

function buildLocalSnapshotFromStorage(rawStorage) {
  const values = rawStorage && typeof rawStorage === "object" ? rawStorage : {};
  const subjects = {};
  const allMistakes = [];
  let totalDurationSeconds = 0;

  for (const subject of REPORT_DB_SUBJECTS) {
    const progress = parseSubjectProgress(values[SUBJECT_TO_PROGRESS_KEY[subject]]);
    const mistakes = parseMistakes(values[SUBJECT_TO_MISTAKES_KEY[subject]], subject);
    const durationSeconds = parseDurationSeconds(values[SUBJECT_TO_TIME_KEY[subject]]);
    subjects[subject] = {
      total: progress.total,
      correct: progress.correct,
      wrong: progress.wrong,
      accuracy: progress.accuracy,
      durationSeconds,
      topics: {},
    };
    allMistakes.push(...mistakes);
    totalDurationSeconds += durationSeconds;
  }

  const totals = REPORT_DB_SUBJECTS.reduce(
    (acc, subject) => {
      const s = subjects[subject];
      acc.answers += s.total;
      acc.correct += s.correct;
      acc.wrong += s.wrong;
      return acc;
    },
    { answers: 0, correct: 0, wrong: 0 }
  );

  return {
    source: "localStorage",
    version: "real-browser",
    totals: {
      sessions: 0,
      completedSessions: 0,
      answers: totals.answers,
      correct: totals.correct,
      wrong: totals.wrong,
      accuracy: normalizeAccuracy(totals.correct, totals.answers),
      durationSeconds: totalDurationSeconds,
    },
    subjects,
    recentMistakes: allMistakes.slice(0, 50),
  };
}

function buildSubjectComparisons(localSnapshot, dbInput) {
  const out = {};
  for (const subject of REPORT_DB_SUBJECTS) {
    const local = localSnapshot.subjects?.[subject] || {
      total: 0,
      correct: 0,
      wrong: 0,
      accuracy: 0,
      durationSeconds: 0,
      topics: {},
    };
    const db = dbInput.subjects?.[subject] || {
      total: 0,
      correct: 0,
      wrong: 0,
      accuracy: 0,
      durationSeconds: 0,
      topics: {},
      mistakes: [],
    };
    const delta = {
      total: db.total - local.total,
      correct: db.correct - local.correct,
      wrong: db.wrong - local.wrong,
      accuracy: Number((safeNumber(db.accuracy) - safeNumber(local.accuracy)).toFixed(2)),
      durationSeconds: db.durationSeconds - local.durationSeconds,
      topicCoverageDelta: Object.keys(db.topics || {}).length - Object.keys(local.topics || {}).length,
      mistakeCountDelta:
        (db.mistakes || []).length -
        localSnapshot.recentMistakes.filter(item => item.subject === subject).length,
    };
    const status =
      local.total === 0 && db.total === 0
        ? "missing"
        : Math.abs(delta.total) > 5 || Math.abs(delta.accuracy) > 20
          ? "warn"
          : "ok";
    out[subject] = { local, db, delta, status };
  }
  return out;
}

function summarizeKeyPresence(storageData) {
  const present = [];
  const missing = [];
  for (const key of LOCAL_STORAGE_KEYS) {
    if (typeof storageData[key] === "string" && storageData[key].length > 0) present.push(key);
    else missing.push(key);
  }
  return { present, missing };
}

function validateDbInput(dbInput, studentId) {
  if (!dbInput || typeof dbInput !== "object") throw new Error("Adapter output invalid");
  if (dbInput.source !== "supabase") throw new Error("Adapter output source must be supabase");
  if (!dbInput.student?.id) throw new Error("Adapter output missing student id");
  if (safeString(dbInput.student.id, 100) !== safeString(studentId, 100)) {
    throw new Error("Adapter output student.id does not match requested studentId");
  }
  if (!dbInput.range?.from || !dbInput.range?.to) throw new Error("Adapter output missing range");
  for (const subject of REPORT_DB_SUBJECTS) {
    if (!dbInput.subjects?.[subject]) throw new Error(`Adapter output missing subject: ${subject}`);
  }
}

function parseSubjectList(raw) {
  return safeString(raw, 200)
    .split(",")
    .map(item => item.trim().toLowerCase())
    .filter(Boolean)
    .filter(item => item === "math" || item === "science");
}

async function answerFewQuestions(page, subject) {
  const controlRe =
    /(תוכנית לימודים|BACK|🔊|אווטר|למידה|אתגר|מהירות|מרתון|תרגול|רמז|הסבר מלא|עצור|התחל|שאלה הבאה|בדוק|leaderboard|סטטיסטיקות|איך משחקים|options)/i;

  const startButton = page.getByRole("button", { name: /התחל|Start/ }).first();
  if (await withTimeout("startButton.count", DEFAULT_STEP_TIMEOUT_MS, async () => startButton.count())) {
    await withTimeout("startButton.click", DEFAULT_STEP_TIMEOUT_MS, async () =>
      startButton.click().catch(() => {})
    );
  }
  await withTimeout("post-start wait", DEFAULT_STEP_TIMEOUT_MS, async () => page.waitForTimeout(800));

  let answered = 0;
  for (let loop = 0; loop < 8 && answered < 2; loop += 1) {
    let acted = false;
    const input = page.locator("input[type='text'],input[type='number']").first();
    if (await withTimeout("input.count", DEFAULT_STEP_TIMEOUT_MS, async () => input.count())) {
      await withTimeout("input.fill", DEFAULT_STEP_TIMEOUT_MS, async () =>
        input.fill(String(loop + 7)).catch(() => {})
      );
      const check = page.getByRole("button", { name: /בדוק|Check/ }).first();
      if (await withTimeout("check.count", DEFAULT_STEP_TIMEOUT_MS, async () => check.count())) {
        const disabled = await withTimeout("check.isDisabled", DEFAULT_STEP_TIMEOUT_MS, async () =>
          check.isDisabled().catch(() => true)
        );
        if (!disabled) {
          await withTimeout("check.click", DEFAULT_STEP_TIMEOUT_MS, async () =>
            check.click().catch(() => {})
          );
          acted = true;
          answered += 1;
        }
      }
    }
    if (!acted) {
      const buttons = page.locator("button");
      const count = await withTimeout("buttons.count", DEFAULT_STEP_TIMEOUT_MS, async () =>
        buttons.count()
      );
      const candidates = [];
      for (let i = 0; i < count; i += 1) {
        const text = (
          (await withTimeout("button.innerText", DEFAULT_STEP_TIMEOUT_MS, async () =>
            buttons.nth(i).innerText().catch(() => "")
          )) || ""
        ).trim();
        if (!text || controlRe.test(text)) continue;
        const disabled = await withTimeout("button.isDisabled", DEFAULT_STEP_TIMEOUT_MS, async () =>
          buttons.nth(i).isDisabled().catch(() => true)
        );
        if (candidates.length < 10) {
          candidates.push({ text: safeString(text, 60), disabled });
        }
        if (disabled) continue;
        await withTimeout("button.click", DEFAULT_STEP_TIMEOUT_MS, async () =>
          buttons.nth(i).click().catch(() => {})
        );
        acted = true;
        answered += 1;
        break;
      }
      stageLog("answer_candidates", { subject, candidates });
    }
    await withTimeout("between-answer wait", DEFAULT_STEP_TIMEOUT_MS, async () =>
      page.waitForTimeout(900)
    );
    const nextButton = page.getByRole("button", { name: /שאלה הבאה|Next/ }).first();
    if (await withTimeout("next.count", DEFAULT_STEP_TIMEOUT_MS, async () => nextButton.count())) {
      await withTimeout("next.click", DEFAULT_STEP_TIMEOUT_MS, async () =>
        nextButton.click().catch(() => {})
      );
    }
  }
  const stopButton = page.getByRole("button", { name: /עצור|Stop/ }).first();
  if (await withTimeout("stop.count", DEFAULT_STEP_TIMEOUT_MS, async () => stopButton.count())) {
    await withTimeout("stop.click", DEFAULT_STEP_TIMEOUT_MS, async () =>
      stopButton.click().catch(() => {})
    );
  }
  if (answered < 2) {
    throw new Error(`insufficient_answers:${answered}`);
  }
}

async function prepareLocalDataInBrowser(page, baseUrl, prepareSubjects) {
  const subjectList = parseSubjectList(prepareSubjects);
  for (const subject of subjectList) {
    const route = subject === "math" ? "/learning/math-master" : "/learning/science-master";
    stageLog("subject_prepare_started", { subject });
    await withOneRetry(`goto.${subject}`, () =>
      withTimeout(`goto.${subject}`, DEFAULT_NAV_TIMEOUT_MS, async () =>
        page.goto(`${baseUrl}${route}`, {
          waitUntil: "domcontentloaded",
          timeout: DEFAULT_NAV_TIMEOUT_MS,
        })
      )
    );
    await withTimeout(`route_check.${subject}`, DEFAULT_STEP_TIMEOUT_MS, async () =>
      page.waitForURL(url => String(url).includes(route), { timeout: DEFAULT_STEP_TIMEOUT_MS })
    );
    const playerInput = page.getByPlaceholder("שם שחקן").first();
    if (await withTimeout(`player.count.${subject}`, DEFAULT_STEP_TIMEOUT_MS, async () => playerInput.count())) {
      await withTimeout(`player.fill.${subject}`, DEFAULT_STEP_TIMEOUT_MS, async () =>
        playerInput.fill("ShadowC6").catch(() => {})
      );
    }
    try {
      await answerFewQuestions(page, subject);
    } catch (error) {
      throw new Error(`subject:${subject} ${safeString(error?.message || "practice failed", 220)}`);
    }
    stageLog("subject_prepare_completed", { subject });
  }
}

async function loginStudentAndReadStorage(
  baseUrl,
  username,
  pin,
  headed,
  prepareSubjects,
  skipPrepare,
  extractOnlyAfterManualPrep,
  manualPrepWaitMs
) {
  stageLog("browser_launching");
  const browser = await withTimeout("browser.launch", DEFAULT_STEP_TIMEOUT_MS, async () =>
    chromium.launch({ headless: !headed })
  );
  stageLog("browser_launched");

  const context = await withTimeout("context.new", DEFAULT_STEP_TIMEOUT_MS, async () =>
    browser.newContext()
  );
  let closed = false;

  try {
    const loginResponse = await withTimeout("studentLogin.post", DEFAULT_STEP_TIMEOUT_MS, async () =>
      context.request.post(`${baseUrl}/api/student/login`, {
        data: { username, pin },
      })
    );
    if (!loginResponse.ok()) {
      throw new Error(`Student login failed with status ${loginResponse.status()}`);
    }
    stageLog("student_login_submitted");

    const cookieHeader = loginResponse.headers()["set-cookie"] || "";
    const token = decodeURIComponent((cookieHeader.split(";")[0].split("=")[1] || "").trim());
    if (token) {
      await withTimeout("studentCookie.add", DEFAULT_STEP_TIMEOUT_MS, async () =>
        context.addCookies([
          {
            name: "liosh_student_session",
            value: token,
            domain: "localhost",
            path: "/",
          },
        ])
      );
    }

    const page = await withTimeout("page.new", DEFAULT_STEP_TIMEOUT_MS, async () => context.newPage());
    await withOneRetry("goto.learning", () =>
      withTimeout("goto.learning", DEFAULT_NAV_TIMEOUT_MS, async () =>
        page.goto(`${baseUrl}/learning`, {
          waitUntil: "domcontentloaded",
          timeout: DEFAULT_NAV_TIMEOUT_MS,
        })
      )
    );
    stageLog("learning_route_opened");

    if (extractOnlyAfterManualPrep) {
      stageLog("extract_only_after_manual_prep", { manualPrepWaitMs, headed });
      await withTimeout("manual_prep_wait", manualPrepWaitMs + 1000, async () =>
        page.waitForTimeout(manualPrepWaitMs)
      );
    } else if (!skipPrepare) {
      await prepareLocalDataInBrowser(page, baseUrl, prepareSubjects);
    } else {
      stageLog("skip_prepare_mode");
    }

    const rawStorage = await withTimeout("localStorage.extract", DEFAULT_STEP_TIMEOUT_MS, async () =>
      page.evaluate(keys => {
        const out = {};
        for (const key of keys) out[key] = window.localStorage.getItem(key);
        return out;
      }, LOCAL_STORAGE_KEYS)
    );
    stageLog("localStorage_extracted");
    return { rawStorage, browserClosed: true };
  } finally {
    await Promise.resolve(context.close()).catch(() => {});
    await Promise.resolve(browser.close()).catch(() => {});
    closed = true;
    stageLog("browser_closed", { browserClosed: closed });
  }
}

async function fetchParentReportData(baseUrl, parentToken, studentId, from, to) {
  const qs = new URLSearchParams();
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  const query = qs.toString();
  const url = `${baseUrl}/api/parent/students/${encodeURIComponent(studentId)}/report-data${
    query ? `?${query}` : ""
  }`;
  const response = await withTimeout("parentApi.fetch", DEFAULT_STEP_TIMEOUT_MS, async () =>
    fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${parentToken}` },
    })
  );
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body?.ok !== true) {
    throw new Error(`Parent report-data API failed with status ${response.status}`);
  }
  stageLog("parent_api_fetched");
  return body;
}

async function main() {
  const cli = parseArgs(process.argv.slice(2));
  const startedAt = Date.now();
  let failingStage = "starting";
  let activeSubject = null;
  let browserClosed = false;

  const baseUrl = safeString(cli.baseUrl || process.env.REPORT_API_BASE_URL || "http://localhost:3001", 400);
  const parentToken = safeString(cli.parentToken || process.env.REPORT_PARENT_BEARER_TOKEN, 5000);
  const studentId = safeString(cli.studentId || process.env.REPORT_STUDENT_ID, 80);
  const studentUsername = safeString(cli.studentUsername || process.env.STUDENT_USERNAME, 120);
  const studentPin = safeString(cli.studentPin || process.env.STUDENT_PIN, 120);
  const from = safeString(cli.from || process.env.REPORT_FROM, 10);
  const to = safeString(cli.to || process.env.REPORT_TO, 10);
  const period = safeString(cli.period || process.env.REPORT_PERIOD || "custom", 40);
  const timezone = safeString(cli.timezone || process.env.REPORT_TIMEZONE || "UTC", 80);
  const prepareSubjects = cli.prepareSubjects || process.env.SHADOW_PREPARE_SUBJECTS || "";

  ensureRequired("REPORT_PARENT_BEARER_TOKEN or --parentToken", parentToken);
  ensureRequired("REPORT_STUDENT_ID or --studentId", studentId);
  ensureRequired("STUDENT_USERNAME or --studentUsername", studentUsername);
  ensureRequired("STUDENT_PIN or --studentPin", studentPin);

  const runtimeLimit = cli.maxRuntimeMs || DEFAULT_MAX_RUNTIME_MS;
  const runtimeTimer = setTimeout(() => {
    console.error(
      JSON.stringify({
        ok: false,
        stage: failingStage,
        subject: activeSubject,
        error: `Max runtime exceeded (${runtimeLimit}ms)`,
        browserClosed,
      })
    );
    process.exit(1);
  }, runtimeLimit);

  try {
    stageLog("starting");
    failingStage = "browser_login_and_snapshot";
    const { rawStorage } = await loginStudentAndReadStorage(
      baseUrl,
      studentUsername,
      studentPin,
      Boolean(cli.headed),
      prepareSubjects,
      Boolean(cli.skipPrepare),
      Boolean(cli.extractOnlyAfterManualPrep),
      Number(cli.manualPrepWaitMs || 30000)
    );
    browserClosed = true;

    if (!rawStorage || typeof rawStorage !== "object") {
      throw new Error("localStorage snapshot read failed");
    }

    const keyPresence = summarizeKeyPresence(rawStorage);
    const localSnapshot = buildLocalSnapshotFromStorage(rawStorage);

    failingStage = "parent_api_fetch";
    const dbReportData = await fetchParentReportData(baseUrl, parentToken, studentId, from, to);

    failingStage = "adapter_build";
    const dbInput = buildReportInputFromDbData(dbReportData, {
      period,
      timezone,
      includeDebug: true,
    });
    validateDbInput(dbInput, studentId);
    stageLog("adapter_built");

    failingStage = "comparison_build";
    const topDiff = compareDbReportInputToLocalSnapshot(dbInput, localSnapshot);
    const subjectComparisons = buildSubjectComparisons(localSnapshot, dbInput);
    const localSubjectsDetected = REPORT_DB_SUBJECTS.filter(
      subject => safeNumber(localSnapshot.subjects?.[subject]?.total) > 0
    );
    stageLog("comparison_completed");

    const result = {
      ok: true,
      mode: "real-browser",
      studentId: dbInput.student.id,
      range: dbInput.range,
      localStorageKeys: keyPresence,
      localSubjectsDetected,
      totals: {
        local: localSnapshot.totals,
        db: dbInput.totals,
        delta: topDiff.totals,
      },
      subjects: subjectComparisons,
      mistakes: {
        localCount: localSnapshot.recentMistakes.length,
        dbCount: dbInput.recentMistakes.length,
        localBySubject: REPORT_DB_SUBJECTS.reduce((acc, subject) => {
          acc[subject] = localSnapshot.recentMistakes.filter(item => item.subject === subject).length;
          return acc;
        }, {}),
        dbBySubject: REPORT_DB_SUBJECTS.reduce((acc, subject) => {
          acc[subject] = (dbInput.subjects?.[subject]?.mistakes || []).length;
          return acc;
        }, {}),
      },
      duration: {
        localSeconds: safeNumber(localSnapshot.totals.durationSeconds),
        dbSeconds: safeNumber(dbInput.totals.durationSeconds),
        deltaSeconds:
          safeNumber(dbInput.totals.durationSeconds) - safeNumber(localSnapshot.totals.durationSeconds),
      },
      dbSnapshot: {
        range: dbInput.range,
        totals: dbInput.totals,
        subjectsWithData: REPORT_DB_SUBJECTS.filter(
          subject => safeNumber(dbInput.subjects?.[subject]?.total) > 0
        ),
        allSubjectsPresent: REPORT_DB_SUBJECTS.every(subject => Boolean(dbInput.subjects?.[subject])),
        gaps: dbInput.gaps,
      },
      gaps: [
        "starsXpBadges:not_available_from_db_yet",
        "streak:derive_later_or_fallback",
        "challengeState:localStorage_fallback",
        "learningIntel:derive_later_or_fallback",
      ],
      notes: [
        "Deltas are expected during transition.",
        "DB currently does not fully mirror local-only fields (stars/xp/badges/streak/challenge/intel).",
      ],
      meta: {
        source: "shadow-compare-real-browser",
        version: "phase-2d-c6",
        comparedAt: new Date().toISOString(),
        runtimeMs: Date.now() - startedAt,
      },
    };

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    browserClosed = true;
    console.error(
      JSON.stringify({
        ok: false,
        stage: failingStage,
        subject: activeSubject,
        error: safeString(error?.message || "unknown error", 500),
        browserClosed,
        runtimeMs: Date.now() - startedAt,
      })
    );
    process.exitCode = 1;
  } finally {
    clearTimeout(runtimeTimer);
  }
}

main();
