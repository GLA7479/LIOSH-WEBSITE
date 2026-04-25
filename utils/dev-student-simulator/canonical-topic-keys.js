/**
 * Canonical topic / operation keys for the dev student simulator Custom Builder.
 * Derived from the same sources as the learning apps + parent report row keys (no invented keys).
 */

import { OPERATIONS } from "../math-constants.js";
import { TOPICS as GEOMETRY_TOPICS } from "../geometry-constants.js";
import { TOPICS as HEBREW_TOPICS } from "../hebrew-constants.js";
import { TOPICS as MOLEDET_TOPICS } from "../moledet-geography-constants.js";

/** Mirrors `pages/learning/english-master.js` TOPICS keys (storage bucket ids). */
const ENGLISH_TOPIC_KEYS = Object.freeze([
  "vocabulary",
  "grammar",
  "translation",
  "sentences",
  "writing",
  "mixed",
]);

/** Mirrors `pages/learning/science-master.js` TOPICS keys (storage bucket ids). */
const SCIENCE_TOPIC_KEYS = Object.freeze([
  "body",
  "animals",
  "plants",
  "materials",
  "earth_space",
  "environment",
  "experiments",
  "mixed",
]);

function freezeArray(keys) {
  return Object.freeze([...keys]);
}

/**
 * Full supported keys per subject for simulator UI + session `bucket` validation.
 * Must stay aligned with report-facing storage (operations.* / topics.*).
 */
export const CANONICAL_SUBJECT_BUCKETS = Object.freeze({
  math: freezeArray(OPERATIONS),
  geometry: freezeArray(Object.keys(GEOMETRY_TOPICS)),
  english: ENGLISH_TOPIC_KEYS,
  science: SCIENCE_TOPIC_KEYS,
  hebrew: freezeArray(Object.keys(HEBREW_TOPICS)),
  "moledet-geography": freezeArray(Object.keys(MOLEDET_TOPICS)),
});

function setsEqual(a, b) {
  if (a.size !== b.size) return false;
  for (const x of a) {
    if (!b.has(x)) return false;
  }
  return true;
}

/**
 * Throws if simulator buckets drift from curriculum / page sources of truth.
 * Call from `scripts/dev-student-simulator-self-test.mjs` (Node), not from browser.
 */
export function assertCanonicalSubjectBucketsAligned() {
  const mathExpected = new Set(OPERATIONS);
  const mathGot = new Set(CANONICAL_SUBJECT_BUCKETS.math);
  if (!setsEqual(mathExpected, mathGot)) {
    const missing = [...mathExpected].filter((k) => !mathGot.has(k));
    const extra = [...mathGot].filter((k) => !mathExpected.has(k));
    throw new Error(
      `Dev simulator math topics out of sync with math-constants.OPERATIONS. missing=[${missing}] extra=[${extra}]`
    );
  }

  const geoExpected = new Set(Object.keys(GEOMETRY_TOPICS));
  const geoGot = new Set(CANONICAL_SUBJECT_BUCKETS.geometry);
  if (!setsEqual(geoExpected, geoGot)) {
    throw new Error("Dev simulator geometry topics out of sync with geometry-constants.TOPICS keys.");
  }

  const heExpected = new Set(Object.keys(HEBREW_TOPICS));
  const heGot = new Set(CANONICAL_SUBJECT_BUCKETS.hebrew);
  if (!setsEqual(heExpected, heGot)) {
    throw new Error("Dev simulator Hebrew topics out of sync with hebrew-constants.TOPICS keys.");
  }

  const moExpected = new Set(Object.keys(MOLEDET_TOPICS));
  const moGot = new Set(CANONICAL_SUBJECT_BUCKETS["moledet-geography"]);
  if (!setsEqual(moExpected, moGot)) {
    throw new Error("Dev simulator moledet-geography topics out of sync with moledet-geography-constants.TOPICS keys.");
  }

  const enGot = new Set(CANONICAL_SUBJECT_BUCKETS.english);
  if (!setsEqual(new Set(ENGLISH_TOPIC_KEYS), enGot)) {
    throw new Error("Dev simulator English topic keys corrupted.");
  }

  const scGot = new Set(CANONICAL_SUBJECT_BUCKETS.science);
  if (!setsEqual(new Set(SCIENCE_TOPIC_KEYS), scGot)) {
    throw new Error("Dev simulator Science topic keys corrupted.");
  }
}
