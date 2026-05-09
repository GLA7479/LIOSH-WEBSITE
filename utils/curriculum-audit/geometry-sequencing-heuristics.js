/**
 * Advisory Geometry sequencing flags (Phase 4G). Not syllabus certification.
 * Extend when Geometry subsection pipeline adds grade-specific spine checks.
 */

/**
 * @param {object} invRecord inventory row
 * @param {string} normKey normalized topic key
 * @returns {Array<{ code: string, severity: string, note: string }>}
 */
export function geometrySequencingSuspicions(invRecord, normKey) {
  /** @type {Array<{ code: string, severity: string, note: string }>} */
  const flags = [];

  void invRecord;
  void normKey;

  return flags;
}
