/**
 * Server-only: rebuild `generateDetailedParentReport`-shaped payload from Supabase report-data JSON
 * by seeding a minimal browser-like localStorage + calling existing report builders (no product logic changes).
 */

import { buildReportInputFromDbData } from "../learning-supabase/report-data-adapter.js";

const REPORT_AGG_SUBJECTS = ["math", "geometry", "english", "hebrew", "science", "moledet_geography"];

/** @type {Promise<void>} */
let rebuildMutexTail = Promise.resolve();

/**
 * Serialize rebuilds — `generateParentReportV2` mutates `globalThis.localStorage`.
 * @template T
 * @param {() => Promise<T>} fn
 * @returns {Promise<T>}
 */
export function runWithParentReportRebuildLock(fn) {
  const run = rebuildMutexTail.then(() => fn());
  rebuildMutexTail = run.then(
    () => {},
    () => {}
  );
  return run;
}

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function makeStorageShim(store) {
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
}

/**
 * Seeds localStorage Map from adapted DB input (same shape as `buildReportInputFromDbData` output).
 * @param {Map<string, string>} store
 * @param {Record<string, unknown>} dbInput
 */
export function seedLocalStorageFromDbReportInput(store, dbInput) {
  const range = dbInput.range && typeof dbInput.range === "object" ? dbInput.range : {};
  const fromStr = String(range.from || "").slice(0, 10);
  const toStr = String(range.to || "").slice(0, 10);
  const fromMs = new Date(`${fromStr}T00:00:00.000Z`).getTime();
  const toMs = new Date(`${toStr}T23:59:59.999Z`).getTime();
  const midMs = Number.isFinite(fromMs) && Number.isFinite(toMs)
    ? Math.min(Math.floor((fromMs + toMs) / 2), Date.now())
    : Date.now();

  const subjects =
    dbInput.subjects && typeof dbInput.subjects === "object" && !Array.isArray(dbInput.subjects)
      ? dbInput.subjects
      : {};

  const mathOps = {};
  const mathProg = {};
  const geomTopics = {};
  const geomProg = {};
  const engTopics = {};
  const engProg = {};
  const sciTopics = {};
  const sciProg = {};
  const hebTopics = {};
  const hebProg = {};
  const molTopics = {};
  const molProg = {};

  const mathMistakes = [];
  const geomMistakes = [];
  const engMistakes = [];
  const sciMistakes = [];
  const hebMistakes = [];
  const molMistakes = [];

  for (const sid of REPORT_AGG_SUBJECTS) {
    const sub = subjects[sid] && typeof subjects[sid] === "object" ? subjects[sid] : {};
    const topics =
      sub.topics && typeof sub.topics === "object" && !Array.isArray(sub.topics) ? sub.topics : {};

    for (const [topicKey, rawTopic] of Object.entries(topics)) {
      const topic = rawTopic && typeof rawTopic === "object" ? rawTopic : {};
      const total = Math.max(0, Math.floor(safeNumber(topic.total)));
      if (total <= 0) continue;
      const correct = Math.max(0, Math.min(total, Math.floor(safeNumber(topic.correct))));
      const durationSec = Math.max(0, Math.floor(safeNumber(topic.durationSeconds)));
      const session = {
        timestamp: midMs,
        total,
        correct,
        mode: "learning",
        grade: "g4",
        level: "medium",
        duration: durationSec > 0 ? durationSec : Math.max(30, total * 30),
      };

      if (sid === "math") {
        mathOps[topicKey] = { sessions: [session] };
        mathProg[topicKey] = { total: total * 20, correct: correct * 20 };
      } else if (sid === "geometry") {
        geomTopics[topicKey] = { sessions: [session] };
        geomProg[topicKey] = { total: total * 20, correct: correct * 20 };
      } else if (sid === "english") {
        engTopics[topicKey] = { sessions: [session] };
        engProg[topicKey] = { total: total * 20, correct: correct * 20 };
      } else if (sid === "science") {
        sciTopics[topicKey] = { sessions: [session] };
        sciProg[topicKey] = { total: total * 20, correct: correct * 20 };
      } else if (sid === "hebrew") {
        hebTopics[topicKey] = { sessions: [session] };
        hebProg[topicKey] = { total: total * 20, correct: correct * 20 };
      } else if (sid === "moledet_geography") {
        molTopics[topicKey] = { sessions: [session] };
        molProg[topicKey] = { total: total * 20, correct: correct * 20 };
      }
    }

    const mistakes = Array.isArray(sub.mistakes) ? sub.mistakes : [];
    for (const m of mistakes) {
      if (!m || typeof m !== "object") continue;
      const topic = String(m.topic || "general").slice(0, 120);
      let ts = midMs;
      if (m.answeredAt != null) {
        const t = new Date(m.answeredAt).getTime();
        if (Number.isFinite(t)) ts = t;
      }
      const row = {
        timestamp: ts,
        topic,
        operation: sid === "math" ? topic : undefined,
        isCorrect: false,
      };
      if (sid === "math") mathMistakes.push(row);
      else if (sid === "geometry") geomMistakes.push(row);
      else if (sid === "english") engMistakes.push(row);
      else if (sid === "science") sciMistakes.push(row);
      else if (sid === "hebrew") hebMistakes.push(row);
      else if (sid === "moledet_geography") molMistakes.push(row);
    }
  }

  store.set("mleo_time_tracking", JSON.stringify({ operations: mathOps }));
  store.set("mleo_math_master_progress", JSON.stringify({ progress: mathProg }));
  store.set("mleo_mistakes", JSON.stringify(mathMistakes));

  store.set("mleo_geometry_time_tracking", JSON.stringify({ topics: geomTopics }));
  store.set("mleo_geometry_master_progress", JSON.stringify({ progress: geomProg }));
  store.set("mleo_geometry_mistakes", JSON.stringify(geomMistakes));

  store.set("mleo_english_time_tracking", JSON.stringify({ topics: engTopics }));
  store.set("mleo_english_master_progress", JSON.stringify({ progress: engProg }));
  store.set("mleo_english_mistakes", JSON.stringify(engMistakes));

  store.set("mleo_science_time_tracking", JSON.stringify({ topics: sciTopics }));
  store.set("mleo_science_master_progress", JSON.stringify({ progress: sciProg }));
  store.set("mleo_science_mistakes", JSON.stringify(sciMistakes));

  store.set("mleo_hebrew_time_tracking", JSON.stringify({ topics: hebTopics }));
  store.set("mleo_hebrew_master_progress", JSON.stringify({ progress: hebProg }));
  store.set("mleo_hebrew_mistakes", JSON.stringify(hebMistakes));

  store.set("mleo_moledet_geography_time_tracking", JSON.stringify({ topics: molTopics }));
  store.set("mleo_moledet_geography_master_progress", JSON.stringify({ progress: molProg }));
  store.set("mleo_moledet_geography_mistakes", JSON.stringify(molMistakes));
}

/**
 * @param {Record<string, unknown>} reportApiBody — output of {@link aggregateParentReportPayload}
 * @param {string} periodLabel original UI period (`week`|`month`|`custom`)
 * @returns {Promise<object|null>}
 */
export async function buildDetailedPayloadFromAggregatedReportBody(reportApiBody, periodLabel) {
  return runWithParentReportRebuildLock(async () => {
    const dbInput = buildReportInputFromDbData(reportApiBody, {
      period: periodLabel || "custom",
      timezone: "UTC",
    });
    const student = dbInput.student && typeof dbInput.student === "object" ? dbInput.student : {};
    const playerName = String(student.name || "").trim() || "Student";

    const store = new Map();
    globalThis.localStorage = makeStorageShim(store);
    globalThis.window = globalThis;

    store.set("mleo_player_name", playerName);
    seedLocalStorageFromDbReportInput(store, dbInput);

    const [{ generateParentReportV2 }, { buildDetailedParentReportFromBaseReport }] = await Promise.all([
      import("../../utils/parent-report-v2.js"),
      import("../../utils/detailed-parent-report.js"),
    ]);

    const from = String(dbInput.range?.from || "").slice(0, 10);
    const to = String(dbInput.range?.to || "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
      return null;
    }

    const base = generateParentReportV2(playerName, "custom", from, to);
    if (!base || typeof base !== "object") return null;

    const metaPeriod = periodLabel === "week" || periodLabel === "month" ? periodLabel : "custom";
    const detailed = buildDetailedParentReportFromBaseReport(base, {
      playerName,
      period: metaPeriod,
    });
    return detailed && typeof detailed === "object" ? detailed : null;
  });
}
