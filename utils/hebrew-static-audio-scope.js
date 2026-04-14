/**
 * Hebrew static audio — first pass envelope (Core v1).
 * g1–g2 × reading/comprehension × listen_and_choose | oral_comprehension_mcq
 * (phonological_discrimination_he + audio_grammar_choice_he = pass 1.5 per plan)
 */

/** @type {ReadonlySet<string>} */
export const HE_STATIC_CORE_V1_GRADES = new Set(["g1", "g2"]);

/** @type {ReadonlySet<string>} */
export const HE_STATIC_CORE_V1_TOPICS = new Set(["reading", "comprehension"]);

/** @type {ReadonlySet<string>} */
export const HE_STATIC_CORE_V1_MODES = new Set(["listen_and_choose", "oral_comprehension_mcq"]);

/** Pool slots per (grade, topic, task_mode) — bounded asset count */
export const HE_STATIC_CORE_V1_POOL = 4;

/**
 * @param {{ gradeKey: string, topic: string, task_mode: string }} opts
 */
export function isHebrewStaticCoreV1FirstPass(opts) {
  const g = String(opts.gradeKey || "").toLowerCase();
  const t = String(opts.topic || "");
  const m = String(opts.task_mode || "");
  return HE_STATIC_CORE_V1_GRADES.has(g) && HE_STATIC_CORE_V1_TOPICS.has(t) && HE_STATIC_CORE_V1_MODES.has(m);
}

/**
 * Deterministic asset id for registry lookup (bounded pool).
 * @param {string} gradeKey g1|g2
 * @param {string} topic reading|comprehension
 * @param {string} task_mode listen_and_choose|oral_comprehension_mcq
 * @param {number} sequenceIndex
 */
export function buildHebrewStaticCoreV1AssetId(gradeKey, topic, task_mode, sequenceIndex) {
  const g = String(gradeKey || "").toLowerCase();
  const t = String(topic || "");
  const m = String(task_mode || "");
  const seq = Math.max(0, Number(sequenceIndex) || 0);
  const p = seq % HE_STATIC_CORE_V1_POOL;
  return `he.core.v1.${g}.${t}.${m}.p${p}`;
}

/**
 * When true, missing registry row must not fall back to Hebrew browser TTS (attach skips audio for static-first rows).
 * Set via NEXT_PUBLIC_HEBREW_STATIC_NO_TTS_FALLBACK=1 after 100% coverage.
 */
export function hebrewStaticCoreV1NoTtsFallback() {
  if (typeof process === "undefined" || !process.env) return false;
  return String(process.env.NEXT_PUBLIC_HEBREW_STATIC_NO_TTS_FALLBACK || "").trim() === "1";
}
