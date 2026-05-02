/**
 * Build ordered session specs (subject, bucket, level, dayIndex) from scenario + coverage matrix rows.
 */

/**
 * @param {string} grade
 * @param {string[]} subjects
 * @param {string[]} levels
 * @param {object[]} matrixRows
 */
export function filterValidQuads(grade, subjects, levels, matrixRows) {
  const set = new Set(subjects);
  const lev = new Set(levels);
  const out = [];
  for (const r of matrixRows) {
    if (r.grade !== grade) continue;
    if (!set.has(r.subjectCanonical)) continue;
    if (!lev.has(r.level)) continue;
    out.push({
      grade: r.grade,
      subjectCanonical: r.subjectCanonical,
      topic: r.topic,
      level: r.level,
    });
  }
  return out.sort((a, b) =>
    `${a.subjectCanonical}|${a.topic}|${a.level}`.localeCompare(`${b.subjectCanonical}|${b.topic}|${b.level}`)
  );
}

function pickQuad(pool, rng) {
  if (!pool.length) return null;
  const i = Math.floor(rng() * pool.length);
  return pool[i];
}

function quadsForSubjectTopic(quads, subject, topic, level) {
  return quads.filter(
    (q) => q.subjectCanonical === subject && q.topic === topic && (!level || q.level === level)
  );
}

function quadsForSubject(quads, subject) {
  return quads.filter((q) => q.subjectCanonical === subject);
}

/**
 * Weighted subject pick using profile.subjectWeights.
 */
function pickSubject(subjects, profile, rng) {
  const wmap = profile.subjectWeights || {};
  const weights = subjects.map((s) => Math.max(0.0001, Number(wmap[s]) || 1 / subjects.length));
  const sum = weights.reduce((a, b) => a + b, 0);
  let u = rng() * sum;
  for (let i = 0; i < subjects.length; i += 1) {
    u -= weights[i];
    if (u <= 0) return subjects[i];
  }
  return subjects[subjects.length - 1];
}

/**
 * @returns {{ sessions: object[], errors: string[], warnings: string[] }}
 */
export function buildSessionPlan(scenario, profile, matrixRows, rng) {
  const errors = [];
  const warnings = [];
  const grade = scenario.grade;
  const subjects = scenario.subjects || [];
  const levels = scenario.levels || [];
  const quads = filterValidQuads(grade, subjects, levels, matrixRows);

  if (!quads.length) {
    errors.push(`No matrix quads for grade=${grade} subjects=${subjects.join(",")} levels=${levels.join(",")}`);
    return { sessions: [], errors, warnings };
  }

  let targetSessions = Number(scenario.sessionPlan?.targetSessions);
  if (!Number.isFinite(targetSessions) || targetSessions < 1) {
    targetSessions = Math.max(1, subjects.length * 2);
    warnings.push(`scenario ${scenario.scenarioId}: invalid targetSessions — defaulted to ${targetSessions}`);
  }

  const topicTargets = Array.isArray(scenario.topicTargets) ? scenario.topicTargets : [];
  const weakTargets = topicTargets.filter((t) => !t.optional);
  const refs = Array.isArray(scenario.matrixCoverageRefs) ? scenario.matrixCoverageRefs : [];

  const spanDays = Math.max(1, Number(scenario.timeHorizonDays) || 7);
  const weakBias = 0.62;

  /** @type {object[]} */
  const planned = [];

  for (let i = 0; i < targetSessions; i += 1) {
    const dayIndex = Math.min(spanDays - 1, Math.floor((i / targetSessions) * spanDays));
    let quad = null;

    const subject = pickSubject(subjects, profile, rng);

    /* Prefer declared weak topic pools when rolling rng */
    if (weakTargets.length && rng() < weakBias) {
      const applicable = weakTargets.filter((w) => w.subjectCanonical === subject);
      const wt = applicable[i % applicable.length] || weakTargets[0];
      const pool = quadsForSubjectTopic(quads, wt.subjectCanonical, wt.topic, wt.level);
      if (pool.length) quad = pickQuad(pool, rng);
      else {
        const loose = quadsForSubjectTopic(quads, wt.subjectCanonical, wt.topic, null);
        if (loose.length) quad = pickQuad(loose, rng);
      }
    }

    if (!quad && refs.length) {
      const ref = refs[i % refs.length];
      if (ref.subjectCanonical === subject || subjects.length === 1) {
        const pool = quadsForSubjectTopic(quads, ref.subjectCanonical, ref.topic, ref.level);
        if (pool.length) quad = pickQuad(pool, rng);
      }
    }

    if (!quad) {
      const pool = quadsForSubject(quads, subject);
      quad = pickQuad(pool.length ? pool : quads, rng);
    }

    if (!quad) {
      errors.push(`Failed to assign quad for session index ${i}`);
      break;
    }

    planned.push({
      grade,
      subject: quad.subjectCanonical,
      bucket: quad.topic,
      level: quad.level,
      dayIndex,
      sessionIndex: i,
    });
  }

  return { sessions: planned, errors, warnings };
}
