import assert from "node:assert/strict";
import { normalizeParentFacingHe } from "../utils/parent-report-language/parent-facing-normalize-he.js";
import { pct, writeArtifact } from "./rollout-artifacts-lib.mjs";

const pairs = [
  {
    input: "נכון לעכשיו כדאי להמשיך לעקוב ולבדוק שוב בשבוע הבא.",
    mustContain: ["נכון לעכשיו", "כדאי להמשיך לעקוב"],
  },
  {
    input: "בשלב זה אין מספיק נתונים לקביעה חזקה.",
    mustContain: ["בשלב זה", "אין מספיק נתונים"],
  },
  {
    input: "נכון לעכשיו מומלץ תרגול קצר וממוקד.",
    mustContain: ["נכון לעכשיו", "מומלץ תרגול קצר"],
  },
  {
    input: "לא מדובר באבחון מקצועי, אלא בתמונת מצב לימודית.",
    mustContain: ["לא מדובר באבחון מקצועי", "תמונת מצב לימודית"],
  },
  {
    input: "כדאי להמשיך במעקב זהיר לפני העלאת רמת קושי.",
    mustContain: ["מעקב זהיר", "לפני העלאת רמת קושי"],
  },
];

let preserved = 0;
for (const p of pairs) {
  const out = normalizeParentFacingHe(p.input);
  const ok = p.mustContain.every((frag) => out.includes(frag));
  if (ok) preserved += 1;
}

const preservationRate = pct(preserved, pairs.length);
writeArtifact("hebrew-normalization-semantic-parity", {
  sampleSize: pairs.length,
  normalizationSemanticPreservationRate: preservationRate,
  pass: preservationRate >= 99,
});

assert.ok(pairs.length >= 5, "normalization parity sample too small");
assert.ok(preservationRate >= 99, `normalization semantic preservation below threshold: ${preservationRate.toFixed(2)}%`);

console.log("parent-hebrew-normalization-semantic-parity-suite: OK");
