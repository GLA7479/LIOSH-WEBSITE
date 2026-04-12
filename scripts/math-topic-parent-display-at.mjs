/**
 * Acceptance — תווית שם נושא מתמטיקה (כיתה + רמה + מצב רק בכפילות).
 * npx tsx scripts/math-topic-parent-display-at.mjs
 */
import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href);

const { applyMathScopedParentDisplayNames, mathTopicParentDisplayCoreFromRow } = await load(
  "utils/math-topic-parent-display.js"
);

function rowStub({ bk, gk, lk, mode }) {
  return {
    subject: "math",
    bucketKey: bk,
    gradeKey: gk,
    levelKey: lk,
    modeKey: mode,
    questions: 10,
    accuracy: 70,
  };
}

function at1() {
  const m = {
    k1: rowStub({ bk: "addition", gk: "g2", lk: "easy", mode: "learning" }),
    k2: rowStub({ bk: "addition", gk: "g3", lk: "medium", mode: "learning" }),
  };
  applyMathScopedParentDisplayNames(m);
  assert.equal(m.k1.displayName, "חיבור — כיתה ב׳ — רמה קלה");
  assert.equal(m.k2.displayName, "חיבור — כיתה ג׳ — רמה בינונית");
}

function at2() {
  const m = {
    a: rowStub({ bk: "addition", gk: "g2", lk: "medium", mode: "learning" }),
    b: rowStub({ bk: "addition", gk: "g2", lk: "medium", mode: "practice" }),
  };
  applyMathScopedParentDisplayNames(m);
  assert.equal(m.a.displayName, "חיבור — כיתה ב׳ — רמה בינונית — למידה");
  assert.equal(m.b.displayName, "חיבור — כיתה ב׳ — רמה בינונית — תרגול");
}

function at3() {
  const r = rowStub({ bk: "addition", gk: "g2", lk: null, mode: "learning" });
  const m = { k: r };
  applyMathScopedParentDisplayNames(m);
  assert.equal(m.k.displayName, "חיבור — כיתה ב׳");
}

function at4() {
  const r = rowStub({ bk: "addition", gk: null, lk: "medium", mode: "learning" });
  const m = { k: r };
  applyMathScopedParentDisplayNames(m);
  assert.equal(m.k.displayName, "חיבור — רמה בינונית");
}

function at5_coreSingleTopicNoFakeUnknown() {
  const r = rowStub({ bk: "addition", gk: null, lk: null, mode: "learning" });
  assert.equal(mathTopicParentDisplayCoreFromRow(r, "addition"), "חיבור");
}

at1();
at2();
at3();
at4();
at5_coreSingleTopicNoFakeUnknown();
console.log("math-topic-parent-display-at: AT1–AT5 OK");
