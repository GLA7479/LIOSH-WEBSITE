/**
 * Server-only: rebuild `generateDetailedParentReport`-shaped payload from Supabase report-data JSON
 * by seeding a minimal browser-like localStorage + calling existing report builders (no product logic changes).
 */

import { buildReportInputFromDbData } from "../learning-supabase/report-data-adapter.js";
import { seedLocalStorageFromDbReportInput } from "../learning-supabase/seed-db-report-local-storage.js";

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

function makeStorageShim(store) {
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
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
