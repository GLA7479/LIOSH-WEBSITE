/**
 * Walk English static pool modules in the same order as `scanQuestionBankModule` / `walkQuestionTree`.
 * Used for enrichment suggestions and safe apply (objectPath alignment).
 */
import { buildScanRecord, looksLikeQuestionRow } from "./question-metadata-scanner.js";

function isPlainObject(o) {
  return o !== null && typeof o === "object" && !Array.isArray(o);
}

/**
 * @param {unknown} val
 * @param {string} sourceFile
 * @param {string} pathPrefix
 * @param {string} subjectId
 * @param {number[]} indexRef
 * @param {{ raw: Record<string, unknown>, objectPath: string, sourceFile: string, seqIndex: number }[]} out
 */
function walkWithRaw(val, sourceFile, pathPrefix, subjectId, indexRef, out) {
  if (Array.isArray(val)) {
    for (let i = 0; i < val.length; i += 1) {
      const el = val[i];
      if (looksLikeQuestionRow(el)) {
        const seq = indexRef[0]++;
        out.push({
          raw: /** @type {Record<string, unknown>} */ (el),
          objectPath: `${pathPrefix}[${i}]`,
          sourceFile,
          seqIndex: seq,
        });
      } else if (isPlainObject(el) && !looksLikeQuestionRow(el)) {
        walkWithRaw(el, sourceFile, `${pathPrefix}[${i}]`, subjectId, indexRef, out);
      }
    }
    return;
  }
  if (!isPlainObject(val)) return;

  const values = Object.values(val);
  const allArrays = values.length > 0 && values.every((v) => Array.isArray(v));
  if (allArrays) {
    for (const k of Object.keys(val)) {
      const arr = val[k];
      walkWithRaw(arr, sourceFile, `${pathPrefix}.${k}`, subjectId, indexRef, out);
    }
    return;
  }

  if (looksLikeQuestionRow(val)) {
    const seq = indexRef[0]++;
    out.push({
      raw: /** @type {Record<string, unknown>} */ (val),
      objectPath: pathPrefix,
      sourceFile,
      seqIndex: seq,
    });
  }
}

/**
 * @param {Record<string, unknown>} mod
 * @param {string} relPath
 * @param {string} subjectId
 */
export function collectEnglishPoolRowsInScanOrder(mod, relPath, subjectId) {
  /** @type {{ raw: Record<string, unknown>, objectPath: string, sourceFile: string, seqIndex: number }[]} */
  const out = [];
  const indexRef = [0];

  for (const key of Object.keys(mod)) {
    if (key === "default") continue;
    const val = mod[key];
    if (typeof val === "function") continue;
    walkWithRaw(val, relPath, key, subjectId, indexRef, out);
  }
  return out;
}

/**
 * @param {typeof import("../../data/english-questions/grammar-pools.js")} grammarMod
 * @param {typeof import("../../data/english-questions/translation-pools.js")} translationMod
 * @param {typeof import("../../data/english-questions/sentence-pools.js")} sentenceMod
 */
export function collectAllEnglishRows(grammarMod, translationMod, sentenceMod) {
  const g = collectEnglishPoolRowsInScanOrder(grammarMod, "data/english-questions/grammar-pools.js", "english");
  const t = collectEnglishPoolRowsInScanOrder(translationMod, "data/english-questions/translation-pools.js", "english");
  const s = collectEnglishPoolRowsInScanOrder(sentenceMod, "data/english-questions/sentence-pools.js", "english");
  return [...g, ...t, ...s];
}

/**
 * Build scanner records parallel to {@link collectAllEnglishRows} row order.
 * @param {{ raw: Record<string, unknown>, objectPath: string, sourceFile: string, seqIndex: number }[]} rows
 */
export function scanRecordsForEnglishRows(rows) {
  return rows.map((r, i) =>
    buildScanRecord(r.raw, r.sourceFile, r.objectPath, "english", i)
  );
}
