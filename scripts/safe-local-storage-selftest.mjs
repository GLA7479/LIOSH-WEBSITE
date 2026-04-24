/**
 * Selftest for utils/safe-local-storage.js — run: npm run test:safe-local-storage
 */
import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const store = new Map();
let getItemShouldThrow = false;
let setItemError = null;

function installWindowMock() {
  const ls = {
    getItem(key) {
      if (getItemShouldThrow) throw new Error("storage_unavailable");
      return store.has(String(key)) ? store.get(String(key)) : null;
    },
    setItem(key, value) {
      if (setItemError) {
        const err = setItemError;
        setItemError = null;
        throw err;
      }
      store.set(String(key), String(value));
    },
    removeItem(key) {
      store.delete(String(key));
    },
  };
  globalThis.window = { localStorage: ls };
}

function uninstallWindowMock() {
  delete globalThis.window;
  store.clear();
  getItemShouldThrow = false;
  setItemError = null;
}

installWindowMock();
const m = await import(
  pathToFileURL(join(ROOT, "utils", "safe-local-storage.js")).href
);
const {
  isLocalStorageAvailable,
  safeGetItem,
  safeSetItem,
  safeRemoveItem,
  safeGetJsonObject,
  safeGetJsonArray,
  safeSetJson,
} = m;

assert.equal(isLocalStorageAvailable(), true);

assert.equal(safeGetItem("missing"), null);
assert.deepEqual(safeSetItem("k1", "v1"), { ok: true });
assert.equal(safeGetItem("k1"), "v1");

safeRemoveItem("k1");
assert.equal(safeGetItem("k1"), null);

assert.deepEqual(safeGetJsonObject("noobj"), {});
store.set("badobj", "not-json");
assert.deepEqual(safeGetJsonObject("badobj"), {});
store.set("arrobj", "[1,2]");
assert.deepEqual(safeGetJsonObject("arrobj"), {});
store.set("goodobj", JSON.stringify({ a: 1 }));
assert.deepEqual(safeGetJsonObject("goodobj"), { a: 1 });

assert.deepEqual(safeGetJsonArray("narr"), []);
store.set("badarr", "{}");
assert.deepEqual(safeGetJsonArray("badarr"), []);
store.set("goodarr", JSON.stringify([1, 2]));
assert.deepEqual(safeGetJsonArray("goodarr"), [1, 2]);

assert.deepEqual(safeSetJson("j1", { x: 2 }), { ok: true });
assert.equal(safeGetItem("j1"), JSON.stringify({ x: 2 }));

getItemShouldThrow = true;
assert.equal(safeGetItem("any"), null);
getItemShouldThrow = false;

if (typeof DOMException !== "undefined") {
  setItemError = new DOMException("quota", "QuotaExceededError");
  assert.deepEqual(safeSetItem("q", "x"), { ok: false, error: "quota" });
} else {
  const e = new Error("quota");
  e.name = "QuotaExceededError";
  setItemError = e;
  assert.deepEqual(safeSetItem("q", "x"), { ok: false, error: "quota" });
}

const circular = {};
circular.self = circular;
assert.deepEqual(safeSetJson("circ", circular), { ok: false, error: "unknown" });

uninstallWindowMock();
assert.equal(safeGetItem("after"), null);
assert.deepEqual(safeSetJson("after", {}), { ok: false, error: "unknown" });

console.log("safe-local-storage-selftest: OK");
