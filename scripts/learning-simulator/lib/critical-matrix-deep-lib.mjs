/**
 * Deterministic critical-cell selection for Critical Matrix Deep QA (risk-based subset).
 */

export const GRADES = ["g1", "g2", "g3", "g4", "g5", "g6"];
export const SUBJECTS_ORDER = ["math", "geometry", "science", "english", "hebrew", "moledet_geography"];
export const LEVELS_ORDER = ["easy", "medium", "hard"];

const MIN_PER_GRADE = 6;
const MAX_PER_GRADE = 12;

/** @type {Record<string, RegExp[]>} */
const TOPIC_PRIORITY_PATTERNS = {
  math: [/fraction/i, /number/i, /arith/i, /add/i, /mult/i, /div/i, /sub/i, /count/i, /digit/i],
  geometry: [/area/i, /perimeter/i, /shape/i, /angle/i, /volume/i],
  hebrew: [/read/i, /comprehen/i, /grammar/i, /spell/i, /vocab/i],
  english: [/grammar/i, /vocab/i, /sentence/i, /translat/i, /writing/i],
  science: [/cause/i, /experiment/i, /system/i, /material/i, /animal/i, /plant/i],
  moledet_geography: [/map/i, /place/i, /community/i, /homeland/i, /geo/i],
};

/**
 * @param {string} topic
 * @param {string} subject
 */
export function topicKeywordScore(topic, subject) {
  const t = String(topic || "");
  const pats = TOPIC_PRIORITY_PATTERNS[subject] || [];
  let s = 0;
  for (const re of pats) {
    if (re.test(t)) s += 12;
  }
  return s;
}

/**
 * @param {object} row — coverage-catalog row
 */
export function priorityScore(row) {
  let s = topicKeywordScore(row.topic, row.subject);
  if (row.coveredByMatrixSmoke) s += 100;
  if (row.coveredByQuick || row.coveredByDeep) s += 45;
  if (row.coveredByReportScenario) s += 15;
  return s;
}

/**
 * Integer quotas per grade, sum === totalCells. Prefers 6–12 per grade when total allows.
 * @param {number} totalCells
 * @returns {number[]}
 */
/**
 * Merge per-subject lists (each already score-sorted desc) into one sequence that
 * round-robins subjects so one subject cannot consume an entire grade quota.
 * @param {Record<string, { r: object, score: number, key: string }[]>} bySubjectLists
 */
export function interleaveGradeBuckets(bySubjectLists) {
  const buckets = { ...bySubjectLists };
  const out = [];
  let progressed = true;
  while (progressed) {
    progressed = false;
    for (const sub of SUBJECTS_ORDER) {
      const arr = buckets[sub];
      if (arr && arr.length) {
        out.push(arr.shift());
        progressed = true;
      }
    }
  }
  return out;
}

export function computeGradeQuotas(totalCells) {
  const n = GRADES.length;
  const maxBalanced = n * MAX_PER_GRADE;
  const minBalanced = n * MIN_PER_GRADE;

  if (totalCells > maxBalanced) {
    const base = Math.floor(totalCells / n);
    let rem = totalCells % n;
    return GRADES.map((_, i) => base + (i < rem ? 1 : 0));
  }

  if (totalCells < minBalanced) {
    const base = Math.floor(totalCells / n);
    let rem = totalCells % n;
    return GRADES.map((_, i) => base + (i < rem ? 1 : 0));
  }

  const base = Math.floor(totalCells / n);
  let rem = totalCells % n;
  /** @type {number[]} */
  let quotas = GRADES.map((_, i) => base + (i < rem ? 1 : 0));
  quotas = quotas.map((q) => Math.min(MAX_PER_GRADE, Math.max(MIN_PER_GRADE, q)));
  let sum = quotas.reduce((a, b) => a + b, 0);
  let diff = totalCells - sum;
  let guard = 0;
  while (diff !== 0 && guard < 5000) {
    const i = guard % n;
    if (diff > 0 && quotas[i] < MAX_PER_GRADE) {
      quotas[i]++;
      diff--;
    } else if (diff < 0 && quotas[i] > MIN_PER_GRADE) {
      quotas[i]--;
      diff++;
    }
    guard++;
  }
  return quotas;
}

/**
 * Select 40–80 covered cells with deterministic per-grade balance + keyword bias.
 * @param {object[]} catalogRows — from coverage-catalog.json rows
 * @param {{ targetCells?: number }} [opts]
 */
export function selectCriticalCells(catalogRows, opts = {}) {
  const targetCells = Math.min(80, Math.max(40, opts.targetCells ?? 56));

  const pool = catalogRows.filter(
    (r) => r.coverageStatus === "covered" && r.isRuntimeSupported && !String(r.coverageStatus || "").includes("unsupported")
  );

  const sorted = pool
    .map((r) => ({ r, score: priorityScore(r), key: r.cellKey }))
    .filter((x, i, a) => a.findIndex((y) => y.key === x.key) === i)
    .sort((a, b) => b.score - a.score || a.key.localeCompare(b.key));

  /** @type {Map<string, typeof sorted>} */
  const byGrade = new Map();
  for (const g of GRADES) byGrade.set(g, []);
  for (const x of sorted) {
    const g = x.r.grade;
    if (byGrade.has(g)) byGrade.get(g).push(x);
  }

  const selected = [];
  const seen = new Set();
  /** @type {Record<string, number>} */
  const gradeCounts = Object.fromEntries(GRADES.map((g) => [g, 0]));

  /**
   * @param {object} row
   * @param {{ bypassGradeCap?: boolean }} [opts]
   */
  function addRow(row, opts = {}) {
    if (!row || seen.has(row.cellKey)) return false;
    const g = row.grade;
    if (!opts.bypassGradeCap && (gradeCounts[g] || 0) >= MAX_PER_GRADE) return false;
    seen.add(row.cellKey);
    selected.push(row);
    gradeCounts[g] = (gradeCounts[g] || 0) + 1;
    return true;
  }

  const quotas = computeGradeQuotas(targetCells);
  /** @type {Record<string, number>} */
  const gradeQuotaShortfall = {};

  for (let gi = 0; gi < GRADES.length; gi++) {
    const g = GRADES[gi];
    const want = quotas[gi];
    const list = byGrade.get(g) || [];
    /** @type {Record<string, typeof sorted>} */
    const perSub = {};
    for (const x of list) {
      const s = x.r.subject;
      if (!perSub[s]) perSub[s] = [];
      perSub[s].push(x);
    }
    for (const s of Object.keys(perSub)) {
      perSub[s].sort((a, b) => b.score - a.score || a.key.localeCompare(b.key));
    }
    const interleaved = interleaveGradeBuckets(perSub);
    let taken = 0;
    for (const x of interleaved) {
      if (taken >= want) break;
      if (addRow(x.r, { bypassGradeCap: true })) taken += 1;
    }
    if (taken < want) gradeQuotaShortfall[g] = want - taken;
  }

  for (const lv of LEVELS_ORDER) {
    if (!selected.some((r) => r.level === lv)) {
      const pick = sorted.find((x) => x.r.level === lv && (gradeCounts[x.r.grade] || 0) < MAX_PER_GRADE);
      if (pick) addRow(pick.r);
    }
  }

  for (const sub of SUBJECTS_ORDER) {
    if (!selected.some((r) => r.subject === sub)) {
      const pick = sorted.find((x) => x.r.subject === sub && (gradeCounts[x.r.grade] || 0) < MAX_PER_GRADE);
      if (pick) addRow(pick.r);
    }
  }

  /** Round-robin subjects so global fill does not collapse into one high-scoring subject. */
  let rr = 0;
  while (selected.length < targetCells) {
    let progressed = false;
    for (let k = 0; k < SUBJECTS_ORDER.length; k++) {
      const sub = SUBJECTS_ORDER[(rr + k) % SUBJECTS_ORDER.length];
      const pick = sorted.find(
        (x) => !seen.has(x.key) && x.r.subject === sub && (gradeCounts[x.r.grade] || 0) < MAX_PER_GRADE
      );
      if (pick && addRow(pick.r)) {
        progressed = true;
        rr = (rr + 1) % SUBJECTS_ORDER.length;
        break;
      }
    }
    if (!progressed) {
      const pick = sorted.find((x) => !seen.has(x.key) && (gradeCounts[x.r.grade] || 0) < MAX_PER_GRADE);
      if (!pick || !addRow(pick.r)) break;
    }
  }

  for (const x of sorted) {
    if (selected.length >= 40) break;
    addRow(x.r, { bypassGradeCap: true });
  }

  const byGradeCount = {};
  const bySubject = {};
  const byLevel = {};
  for (const r of selected) {
    byGradeCount[r.grade] = (byGradeCount[r.grade] || 0) + 1;
    bySubject[r.subject] = (bySubject[r.subject] || 0) + 1;
    byLevel[r.level] = (byLevel[r.level] || 0) + 1;
  }

  const maxBalanced = GRADES.length * MAX_PER_GRADE;
  /** Met when ≥40 cells and each grade is either in 6–12 band or could not fill quota from pool */
  const balancingTargetMet =
    selected.length >= 40 &&
    GRADES.every((g) => {
      const c = byGradeCount[g] || 0;
      if (Object.prototype.hasOwnProperty.call(gradeQuotaShortfall, g)) return true;
      return c >= MIN_PER_GRADE && c <= MAX_PER_GRADE;
    });

  const evidence = {
    targetCells,
    poolSize: pool.length,
    strategy:
      "Balanced quotas per grade (6–12 when total≤72), then level/subject gaps with per-grade cap, round-robin subject fill to target, bypass cap only to reach minimum 40.",
    gradeQuotasDesired: Object.fromEntries(GRADES.map((g, i) => [g, quotas[i]])),
    gradeQuotaShortfall,
    balancingBandMinPerGrade: MIN_PER_GRADE,
    balancingBandMaxPerGrade: MAX_PER_GRADE,
    balancingTargetMet,
    balancingNote:
      selected.length > maxBalanced
        ? `Selection exceeds ${maxBalanced} cells — quotas allowed >${MAX_PER_GRADE} per grade because targetCells=${targetCells} > ${maxBalanced}.`
        : Object.keys(gradeQuotaShortfall).length
          ? "Some grades had fewer eligible covered cells than quota; see gradeQuotaShortfall."
          : GRADES.every((g) => (byGradeCount[g] || 0) <= MAX_PER_GRADE && (byGradeCount[g] || 0) >= MIN_PER_GRADE)
            ? "Each grade within 6–12 band (or pool-limited shortfall documented)."
            : "Review byGrade counts vs quotas.",
    finalCount: selected.length,
    byGrade: byGradeCount,
    bySubject,
    byLevel,
  };

  return { selectedRows: selected, selectionEvidence: evidence };
}

/**
 * Group catalog rows by grade + subject for scenario batches.
 * @param {object[]} selectedRows
 */
export function groupByGradeSubject(selectedRows) {
  /** @type {Map<string, object[]>} */
  const m = new Map();
  for (const r of selectedRows) {
    const k = `${r.grade}|${r.subject}`;
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(r);
  }
  for (const [, arr] of m) {
    arr.sort((a, b) => `${a.topic}|${a.level}`.localeCompare(`${b.topic}|${b.level}`));
  }
  return m;
}
