/**
 * Unified mistake-event shape for diagnostics (all subjects).
 * Legacy rows are upgraded at read time via normalizeMistakeEvent — no migration required.
 *
 * Schema (all fields optional except subject when normalizing; missing → null):
 * {
 *   subject: string,
 *   topicOrOperation: string|null,
 *   bucketKey: string|null,
 *   grade: string|null,
 *   level: string|null,
 *   mode: string|null,
 *   timestamp: number|null,
 *   exerciseText: string,
 *   questionLabel: string|null,
 *   correctAnswer: string|number|null,
 *   userAnswer: string|number|null,
 *   isCorrect: boolean,
 *   total: number|null,
 *   correctCountInSession: number|null,
 *   kind: string|null,
 *   patternFamily: string|null,
 *   subtype: string|null,
 *   distractorFamily: string|null,
 *   conceptTag: string|null,
 *   answerMode: string|null,
 * }
 */

/** Minimum wrong events sharing the same pattern family to emit a stable weakness. */
export const MIN_PATTERN_FAMILY_FOR_DIAGNOSIS = 5;

/** Minimum mistakes to suggest a "strong" (not tentative) recommendation. */
export const MIN_MISTAKES_FOR_STRONG_RECOMMENDATION = 10;

/**
 * @param {Record<string, unknown>|null|undefined} m
 * @returns {number|null}
 */
export function mistakeTimestampMs(m) {
  if (!m || typeof m !== "object") return null;
  const raw = m.timestamp ?? m.storedAt ?? m.date;
  if (raw == null || raw === "") return null;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  const t = new Date(raw).getTime();
  return Number.isFinite(t) ? t : null;
}

function strOrNull(v) {
  if (v == null || v === "") return null;
  const s = String(v).trim();
  return s || null;
}

function pickParams(raw, snap) {
  const direct = raw && typeof raw.params === "object" ? raw.params : null;
  const fromSnap = snap && typeof snap.params === "object" ? snap.params : null;
  return direct || fromSnap || {};
}

/**
 * Normalize any stored mistake row to MistakeEventV1.
 * @param {Record<string, unknown>} raw
 * @param {string} subjectId math|geometry|english|science|hebrew|moledet-geography
 */
export function normalizeMistakeEvent(raw, subjectId) {
  const p = raw && typeof raw === "object" ? raw : {};
  const snap =
    p.snapshot && typeof p.snapshot === "object" ? p.snapshot : null;

  const params = pickParams(p, snap);

  const topicOrOperation =
    strOrNull(p.topicOrOperation) ||
    strOrNull(p.operation) ||
    strOrNull(p.topic) ||
    strOrNull(snap?.operation) ||
    strOrNull(snap?.topic) ||
    null;

  const bucketKey =
    strOrNull(p.bucketKey) ||
    strOrNull(p.mathReportBucket) ||
    strOrNull(topicOrOperation);

  const exerciseText =
    String(
      p.exerciseText ??
        p.question ??
        p.stem ??
        snap?.exerciseText ??
        snap?.question ??
        ""
    ).trim();

  const correctAnswer =
    p.correctAnswer !== undefined
      ? p.correctAnswer
      : p.correct !== undefined
        ? p.correct
        : snap?.correctAnswer !== undefined
          ? snap.correctAnswer
          : null;

  const userAnswer =
    p.userAnswer !== undefined
      ? p.userAnswer
      : p.wrongAnswer !== undefined
        ? p.wrongAnswer
        : p.wrong !== undefined
          ? p.wrong
          : null;

  const kind = strOrNull(p.kind ?? params.kind);
  const patternFamily =
    strOrNull(p.patternFamily) ||
    strOrNull(params.patternFamily) ||
    strOrNull(params.semanticFamily);
  const subtype = strOrNull(p.subtype ?? params.subtype);
  const distractorFamily = strOrNull(p.distractorFamily ?? params.distractorFamily);
  const conceptTag = strOrNull(p.conceptTag ?? params.conceptTag);

  const isCorrectRaw = p.isCorrect;
  const isCorrect =
    typeof isCorrectRaw === "boolean"
      ? isCorrectRaw
      : userAnswer != null &&
          correctAnswer != null &&
          String(userAnswer).trim() === String(correctAnswer).trim();

  return {
    subject: subjectId,
    topicOrOperation,
    bucketKey,
    grade: strOrNull(p.grade ?? snap?.grade),
    level: strOrNull(p.level ?? snap?.level),
    mode: strOrNull(p.mode),
    timestamp: mistakeTimestampMs(p),
    exerciseText,
    questionLabel:
      strOrNull(p.questionLabel) ||
      strOrNull(p.id) ||
      strOrNull(snap?.questionLabel) ||
      null,
    correctAnswer,
    userAnswer,
    isCorrect: !!isCorrect,
    total: p.total != null && Number.isFinite(Number(p.total)) ? Number(p.total) : null,
    correctCountInSession:
      p.correctCountInSession != null && Number.isFinite(Number(p.correctCountInSession))
        ? Number(p.correctCountInSession)
        : p.correct != null && typeof p.correct === "number"
          ? p.correct
          : null,
    kind,
    patternFamily,
    subtype,
    distractorFamily,
    conceptTag,
    answerMode: strOrNull(p.answerMode),
  };
}

/**
 * Stable clustering key for wrong-answer patterns (never the whole "subject").
 * @param {ReturnType<typeof normalizeMistakeEvent>} ev
 */
export function mistakePatternClusterKey(ev) {
  if (!ev) return "unspecified";
  if (ev.patternFamily) return `pf:${ev.patternFamily}`;
  if (ev.subtype && ev.kind) return `k:${ev.kind}|st:${ev.subtype}`;
  if (ev.kind) return `k:${ev.kind}`;
  if (ev.conceptTag) return `ct:${ev.conceptTag}`;
  if (ev.topicOrOperation) return `to:${ev.topicOrOperation}`;
  return "unspecified";
}
