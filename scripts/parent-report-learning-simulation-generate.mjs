import fs from "fs/promises";
import path from "path";
import {
  PARENT_REPORT_LEARNING_SIMULATIONS,
  buildLearningSimulationStorage,
} from "../tests/fixtures/parent-report-learning-simulations.mjs";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "reports", "parent-report-learning-simulations");
const SNAP_DIR = path.join(OUT_DIR, "snapshots");

function ensureDir(p) {
  return fs.mkdir(p, { recursive: true });
}

function countQuestions(storage) {
  const buckets = [
    ...Object.values(storage?.mleo_time_tracking?.operations || {}),
    ...Object.values(storage?.mleo_geometry_time_tracking?.topics || {}),
    ...Object.values(storage?.mleo_english_time_tracking?.topics || {}),
    ...Object.values(storage?.mleo_science_time_tracking?.topics || {}),
    ...Object.values(storage?.mleo_hebrew_time_tracking?.topics || {}),
    ...Object.values(storage?.mleo_moledet_geography_time_tracking?.topics || {}),
  ];
  return buckets.reduce((acc, b) => {
    const sessions = Array.isArray(b?.sessions) ? b.sessions : [];
    return acc + sessions.reduce((x, s) => x + (Number(s.total) || 0), 0);
  }, 0);
}

function countSessions(storage) {
  const buckets = [
    ...Object.values(storage?.mleo_time_tracking?.operations || {}),
    ...Object.values(storage?.mleo_geometry_time_tracking?.topics || {}),
    ...Object.values(storage?.mleo_english_time_tracking?.topics || {}),
    ...Object.values(storage?.mleo_science_time_tracking?.topics || {}),
    ...Object.values(storage?.mleo_hebrew_time_tracking?.topics || {}),
    ...Object.values(storage?.mleo_moledet_geography_time_tracking?.topics || {}),
  ];
  return buckets.reduce((acc, b) => acc + (Array.isArray(b?.sessions) ? b.sessions.length : 0), 0);
}

function dateSpanDays(storage) {
  const stamps = [];
  const buckets = [
    ...Object.values(storage?.mleo_time_tracking?.operations || {}),
    ...Object.values(storage?.mleo_geometry_time_tracking?.topics || {}),
    ...Object.values(storage?.mleo_english_time_tracking?.topics || {}),
    ...Object.values(storage?.mleo_science_time_tracking?.topics || {}),
    ...Object.values(storage?.mleo_hebrew_time_tracking?.topics || {}),
    ...Object.values(storage?.mleo_moledet_geography_time_tracking?.topics || {}),
  ];
  for (const b of buckets) {
    for (const s of b?.sessions || []) {
      if (Number.isFinite(Number(s?.timestamp))) stamps.push(Number(s.timestamp));
    }
  }
  if (!stamps.length) return 0;
  const min = Math.min(...stamps);
  const max = Math.max(...stamps);
  return Math.max(0, Math.round((max - min) / (24 * 60 * 60 * 1000)));
}

function activeSubjects(storage) {
  const out = [];
  if (Object.keys(storage?.mleo_time_tracking?.operations || {}).length) out.push("math");
  if (Object.keys(storage?.mleo_geometry_time_tracking?.topics || {}).length) out.push("geometry");
  if (Object.keys(storage?.mleo_hebrew_time_tracking?.topics || {}).length) out.push("hebrew");
  if (Object.keys(storage?.mleo_english_time_tracking?.topics || {}).length) out.push("english");
  if (Object.keys(storage?.mleo_science_time_tracking?.topics || {}).length) out.push("science");
  if (Object.keys(storage?.mleo_moledet_geography_time_tracking?.topics || {}).length) out.push("moledet_geography");
  return out;
}

async function main() {
  await ensureDir(SNAP_DIR);
  const manifest = [];

  for (const sim of PARENT_REPORT_LEARNING_SIMULATIONS) {
    const storage = buildLearningSimulationStorage(sim);
    const outPath = path.join(SNAP_DIR, `${sim.id}.storage.json`);
    await fs.writeFile(outPath, JSON.stringify(storage, null, 2), "utf8");
    manifest.push({
      id: sim.id,
      studentName: sim.studentName,
      expectedBehavior: sim.expectedBehavior,
      expectedTopSignal: sim.expectedTopSignal,
      subjects: activeSubjects(storage),
      totalQuestions: countQuestions(storage),
      totalSessions: countSessions(storage),
      dateSpanDays: dateSpanDays(storage),
      snapshotPath: path.relative(ROOT, outPath).replace(/\\/g, "/"),
    });
  }

  await fs.writeFile(
    path.join(OUT_DIR, "simulations-manifest.json"),
    JSON.stringify({ generatedAt: new Date().toISOString(), simulations: manifest }, null, 2),
    "utf8"
  );
  await fs.writeFile(
    path.join(OUT_DIR, "simulations-manifest.md"),
    [
      "# Parent Report Learning Simulations",
      "",
      "| Sim ID | Student | Subjects | Questions | Sessions | Date Span (days) | Expected | Snapshot |",
      "|---|---|---|---:|---:|---:|---|---|",
      ...manifest.map((s) =>
        `| ${s.id} | ${s.studentName} | ${s.subjects.join(", ") || "-"} | ${s.totalQuestions} | ${s.totalSessions} | ${s.dateSpanDays} | ${s.expectedBehavior} | ${s.snapshotPath} |`
      ),
      "",
    ].join("\n"),
    "utf8"
  );

  console.log(`Generated ${manifest.length} simulations in reports/parent-report-learning-simulations`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
