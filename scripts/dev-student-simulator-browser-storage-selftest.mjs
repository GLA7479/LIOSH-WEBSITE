/**
 * Phase 3.5 / 3.6 — in-memory localStorage exercises for dev-student-simulator browser-storage.
 * Run: npm run test:dev-student-simulator-browser-storage
 */
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function createMemoryLocalStorage({ failSetForKey = null } = {}) {
  const map = new Map();
  return {
    getItem(k) {
      return map.has(k) ? map.get(k) : null;
    },
    setItem(k, v) {
      if (failSetForKey && k === failSetForKey) {
        throw new DOMException("Simulated quota", "QuotaExceededError");
      }
      map.set(k, String(v));
    },
    removeItem(k) {
      map.delete(k);
    },
    clear() {
      map.clear();
    },
    /** Test-only: seed without running fail hooks */
    __prime(k, v) {
      map.set(k, String(v));
    },
  };
}

async function loadBrowserStorage() {
  const fp = path.join(ROOT, "utils", "dev-student-simulator", "browser-storage.js");
  return import(pathToFileURL(fp).href);
}

async function withFreshWindow(memLs, fn) {
  globalThis.window = { localStorage: memLs };
  const bs = await loadBrowserStorage();
  try {
    await fn(bs, memLs);
  } finally {
    delete globalThis.window;
  }
}

async function main() {
  const metaPath = path.join(ROOT, "utils", "dev-student-simulator", "metadata.js");
  const { SIMULATOR_METADATA_KEY } = await import(pathToFileURL(metaPath).href);

  await withFreshWindow(createMemoryLocalStorage(), async (bs) => {
    assert.deepEqual(bs.deriveEffectiveTouchedKeysFromSnapshot({}), []);
    assert.deepEqual(bs.deriveEffectiveTouchedKeysFromSnapshot(null), []);
    assert.deepEqual(bs.deriveEffectiveTouchedKeysFromSnapshot({ "mleo_player_name": 1 }), ["mleo_player_name"]);

    const r1 = bs.validateSnapshotForApply({ leok_secret: "x" });
    assert.equal(r1.ok, false);
    assert.equal(r1.code, "leok_blocked");

    const r2 = bs.validateSnapshotForApply({ mleo_totally_fake_key_not_allowed: {} });
    assert.equal(r2.ok, false);
    assert.equal(r2.code, "key_not_in_allowlist");

    const r3 = bs.validateSnapshotForApply({ not_mleo: 1 });
    assert.equal(r3.ok, false);
    assert.equal(r3.code, "non_mleo_key");

    const r4 = bs.validateSnapshotForApply({ "mleo_player_name": "ok", leok_shadow: "no" });
    assert.equal(r4.ok, false);
    assert.equal(r4.code, "leok_blocked");
  });

  await withFreshWindow(createMemoryLocalStorage({ failSetForKey: SIMULATOR_METADATA_KEY }), async (bs, mem) => {
    mem.setItem("mleo_player_name", JSON.stringify("SEED"));
    const metadata = {
      version: 1,
      simulator: "dev-student-simulator-core",
      presetId: "t",
      touchedKeys: ["mleo_player_name"],
      backupByKey: { "mleo_player_name": JSON.stringify("BACKUP") },
    };
    const snap = { "mleo_player_name": "NEW" };
    const ar = bs.applyMetadataThenSnapshot({ metadata, snapshot: snap });
    assert.equal(ar.ok, false);
    assert.equal(ar.phase, "metadata");
    assert.equal(mem.getItem("mleo_player_name"), JSON.stringify("SEED"));
  });

  await withFreshWindow(createMemoryLocalStorage({ failSetForKey: "mleo_player_name" }), async (bs, mem) => {
    mem.__prime("mleo_player_name", JSON.stringify("PN0"));
    mem.__prime("mleo_mistakes", JSON.stringify("M0"));
    const metadata = {
      version: 1,
      simulator: "dev-student-simulator-core",
      presetId: "t",
      effectiveTouchedKeys: ["mleo_player_name", "mleo_mistakes"],
      touchedKeys: ["mleo_player_name", "mleo_mistakes"],
      backupByKey: {
        "mleo_player_name": JSON.stringify("PN0"),
        "mleo_mistakes": JSON.stringify("M0"),
      },
    };
    const snap = {
      "mleo_mistakes": "M1",
      "mleo_player_name": "PN1",
    };
    const ar = bs.applyMetadataThenSnapshot({ metadata, snapshot: snap });
    assert.equal(ar.ok, false);
    assert.equal(ar.phase, "snapshot");
    assert.equal(ar.metadataWritten, true);
    assert.ok(mem.getItem(SIMULATOR_METADATA_KEY));
    assert.equal(mem.getItem("mleo_player_name"), JSON.stringify("PN0"));
    assert.equal(mem.getItem("mleo_mistakes"), "M1");
    const reset = bs.resetSimulatedStudentFromMetadata();
    assert.equal(reset.ok, true);
    assert.equal(mem.getItem(SIMULATOR_METADATA_KEY), null);
    assert.equal(mem.getItem("mleo_player_name"), JSON.stringify("PN0"));
    assert.equal(mem.getItem("mleo_mistakes"), JSON.stringify("M0"));
  });

  await withFreshWindow(createMemoryLocalStorage(), async (bs, mem) => {
    mem.__prime("mleo_player_name", JSON.stringify("X"));
    const metadata = {
      version: 1,
      simulator: "dev-student-simulator-core",
      presetId: "t",
      touchedKeys: ["mleo_player_name"],
      backupByKey: { "mleo_player_name": JSON.stringify("X") },
    };
    const ok = bs.applyMetadataThenSnapshot({ metadata, snapshot: { "mleo_player_name": "Y" } });
    assert.equal(ok.ok, true);
    assert.equal(mem.getItem("mleo_player_name"), "Y");
    assert.ok(mem.getItem(SIMULATOR_METADATA_KEY));
  });

  await withFreshWindow(createMemoryLocalStorage(), async (bs, mem) => {
    mem.__prime("mleo_player_name", JSON.stringify("PN0"));
    mem.__prime("mleo_mistakes", JSON.stringify("M0"));
    mem.setItem(
      SIMULATOR_METADATA_KEY,
      JSON.stringify({
        version: 1,
        simulator: "dev-student-simulator-core",
        presetId: "t",
        touchedKeys: ["mleo_player_name"],
        effectiveTouchedKeys: ["mleo_player_name", "mleo_mistakes"],
        backupByKey: {
          "mleo_player_name": JSON.stringify("PN0"),
          "mleo_mistakes": JSON.stringify("M0"),
        },
      })
    );
    mem.setItem("mleo_player_name", "PN_CORRUPT");
    mem.setItem("mleo_mistakes", "M_CORRUPT");
    assert.equal(bs.resetSimulatedStudentFromMetadata().ok, true);
    assert.equal(mem.getItem("mleo_player_name"), JSON.stringify("PN0"));
    assert.equal(mem.getItem("mleo_mistakes"), JSON.stringify("M0"));
  });

  await withFreshWindow(createMemoryLocalStorage(), async (bs, mem) => {
    mem.__prime("mleo_player_name", JSON.stringify("PN0"));
    mem.__prime("mleo_daily_challenge", JSON.stringify("KEEP"));
    mem.setItem(
      SIMULATOR_METADATA_KEY,
      JSON.stringify({
        version: 1,
        simulator: "dev-student-simulator-core",
        presetId: "t",
        touchedKeys: ["mleo_player_name", "mleo_daily_challenge"],
        effectiveTouchedKeys: ["mleo_player_name"],
        backupByKey: { "mleo_player_name": JSON.stringify("PN0") },
      })
    );
    mem.setItem("mleo_player_name", "PN_CHANGED");
    assert.equal(bs.resetSimulatedStudentFromMetadata().ok, true);
    assert.equal(mem.getItem("mleo_player_name"), JSON.stringify("PN0"));
    assert.equal(mem.getItem("mleo_daily_challenge"), JSON.stringify("KEEP"));
  });

  await withFreshWindow(createMemoryLocalStorage(), async (bs, mem) => {
    mem.__prime("mleo_player_name", JSON.stringify("ROUND"));
    const meta = {
      version: 1,
      simulator: "dev-student-simulator-core",
      presetId: "t",
      effectiveTouchedKeys: ["mleo_player_name"],
      touchedKeys: ["mleo_player_name"],
      backupByKey: { "mleo_player_name": JSON.stringify("ROUND") },
    };
    assert.equal(bs.applyMetadataThenSnapshot({ metadata: meta, snapshot: { "mleo_player_name": "AFTER" } }).ok, true);
    assert.equal(mem.getItem("mleo_player_name"), "AFTER");
    assert.equal(bs.resetSimulatedStudentFromMetadata().ok, true);
    assert.equal(mem.getItem("mleo_player_name"), JSON.stringify("ROUND"));
    assert.equal(mem.getItem(SIMULATOR_METADATA_KEY), null);
  });

  console.log("dev-student-simulator-browser-storage-selftest: OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
