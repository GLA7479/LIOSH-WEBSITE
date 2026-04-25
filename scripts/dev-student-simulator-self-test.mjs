import fs from "fs/promises";
import path from "path";
import * as canonicalTopicKeysMod from "../utils/dev-student-simulator/canonical-topic-keys.js";
import * as simulatorCore from "../utils/dev-student-simulator/index.js";

const canonicalTopicKeys = canonicalTopicKeysMod.default || canonicalTopicKeysMod;

const simulatorApi =
  simulatorCore && simulatorCore.default && Object.keys(simulatorCore).length === 1
    ? simulatorCore.default
    : { ...(simulatorCore.default || {}), ...simulatorCore };

const {
  DEV_STUDENT_PRESETS,
  buildSimulatorCoreFromPreset,
  exportSimulatorPackage,
  serializeSimulatorPackage,
  listTopicKeysMissingHebrewLabel,
} = simulatorApi;

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "reports", "dev-student-simulator", "phase2-core");
const SNAPSHOT_DIR = path.join(OUT_DIR, "snapshots");

async function ensureDirs() {
  await fs.mkdir(SNAPSHOT_DIR, { recursive: true });
}

function summarizeSnapshot(snapshot) {
  return {
    keys: Object.keys(snapshot).sort(),
    totalQuestionsDaily: Number(snapshot?.mleo_daily_challenge?.questions || 0),
    totalCorrectDaily: Number(snapshot?.mleo_daily_challenge?.correct || 0),
    mathOps: Object.keys(snapshot?.mleo_time_tracking?.operations || {}),
    geometryTopics: Object.keys(snapshot?.mleo_geometry_time_tracking?.topics || {}),
    englishTopics: Object.keys(snapshot?.mleo_english_time_tracking?.topics || {}),
    scienceTopics: Object.keys(snapshot?.mleo_science_time_tracking?.topics || {}),
    hebrewTopics: Object.keys(snapshot?.mleo_hebrew_time_tracking?.topics || {}),
    moledetTopics: Object.keys(snapshot?.mleo_moledet_geography_time_tracking?.topics || {}),
  };
}

async function main() {
  await ensureDirs();
  canonicalTopicKeys.assertCanonicalSubjectBucketsAligned();
  const missingTopicHe = listTopicKeysMissingHebrewLabel?.() || [];
  if (missingTopicHe.length) {
    throw new Error(`Custom Builder UI: Hebrew label map missing for topic keys: ${missingTopicHe.join(", ")}`);
  }
  for (const sid of simulatorCore.SUBJECTS || []) {
    const list = simulatorCore.SUBJECT_BUCKETS?.[sid];
    if (!Array.isArray(list) || list.length === 0) {
      throw new Error(`Dev simulator SUBJECT_BUCKETS[${sid}] must be a non-empty array`);
    }
  }
  const presetResults = [];
  const touchedKeysByPreset = {};
  let sampleSnapshotPath = null;
  let samplePresetId = null;

  for (const preset of DEV_STUDENT_PRESETS) {
    let built = null;
    let anchorUsed = null;
    for (let attempt = 0; attempt < 80; attempt += 1) {
      const tryAnchor = Date.now() + attempt * 7919;
      try {
        built = buildSimulatorCoreFromPreset({
          presetId: preset.id,
          anchorEndMs: tryAnchor,
          existingStorageMap: {},
        });
        anchorUsed = tryAnchor;
        break;
      } catch {
        /* anchor-sensitive validators: try next wall-clock offset */
      }
    }
    if (!built || anchorUsed == null) {
      throw new Error(`Could not build valid sessions for preset ${preset.id} after anchor retries`);
    }

    const snapshotPath = path.join(SNAPSHOT_DIR, `${preset.id}.storage.json`);
    await fs.writeFile(snapshotPath, JSON.stringify(built.snapshot, null, 2), "utf8");

    const packagePath = path.join(SNAPSHOT_DIR, `${preset.id}.package.json`);
    const pkg = exportSimulatorPackage({
      presetId: preset.id,
      snapshot: built.snapshot,
      metadata: built.metadata,
    });
    await fs.writeFile(packagePath, serializeSimulatorPackage(pkg), "utf8");

    if (!sampleSnapshotPath) {
      sampleSnapshotPath = snapshotPath;
      samplePresetId = preset.id;
    }

    touchedKeysByPreset[preset.id] = built.touchedKeys;
    presetResults.push({
      presetId: preset.id,
      studentName: preset.studentName,
      anchorEndMs: anchorUsed,
      sessionsValidation: built.validation.sessions,
      namespaceValidation: built.validation.namespace,
      touchedKeys: built.touchedKeys,
      metadataShape: Object.keys(built.metadata),
      snapshotSummary: summarizeSnapshot(built.snapshot),
      output: {
        snapshotPath: path.relative(ROOT, snapshotPath).replace(/\\/g, "/"),
        packagePath: path.relative(ROOT, packagePath).replace(/\\/g, "/"),
      },
    });
  }

  const selfTest = {
    ok: presetResults.every(
      (r) => r.sessionsValidation.ok && r.namespaceValidation.ok
    ),
    generatedAt: new Date().toISOString(),
    anchorNote: "anchorEndMs varies per preset (see presetResults[].anchorEndMs)",
    presetCount: presetResults.length,
    samplePresetId,
    sampleSnapshotPath: path.relative(ROOT, sampleSnapshotPath).replace(/\\/g, "/"),
    touchedKeysByPreset,
    presetResults,
    resetBackupMetadataShape: {
      version: "number",
      simulator: "string",
      presetId: "string",
      playerName: "string",
      generatedAt: "ISO string",
      touchedKeys: "string[]",
      backupByKey: "{ [key: string]: string|null }",
    },
  };

  const resultPath = path.join(OUT_DIR, "self-test-result.json");
  await fs.writeFile(resultPath, JSON.stringify(selfTest, null, 2), "utf8");

  console.log(
    JSON.stringify(
      {
        ok: selfTest.ok,
        presetCount: selfTest.presetCount,
        resultPath: path.relative(ROOT, resultPath).replace(/\\/g, "/"),
        sampleSnapshotPath: selfTest.sampleSnapshotPath,
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
