/**
 * Derive per-session accuracy, duration, and mode from profile + scenario (deterministic RNG).
 */

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

/**
 * @param {object} profile
 * @param {number} rng - () => [0,1)
 */
function weaknessMultiplier(profile, subject, bucket) {
  const tw = profile.topicWeaknesses?.[subject];
  if (!tw || typeof tw !== "object") return 1;
  const w = tw[bucket];
  if (typeof w !== "number") return 1;
  return 0.35 + w * 0.5;
}

/**
 * @param {object} profile
 * @param {object} scenario
 * @param {{ sessionIndex: number, totalSessions: number, subject: string, bucket: string, rng: () => number }} ctx
 * @returns {{ accuracy: number, durationSec: number, mode: string }}
 */
export function computeSessionMetrics(profile, scenario, ctx) {
  const { sessionIndex, totalSessions, subject, bucket, rng } = ctx;
  const n = Math.max(1, totalSessions);
  const t = n <= 1 ? 0 : sessionIndex / (n - 1);
  const jitter = () => (rng() - 0.5) * 0.06;

  let baseAcc = 0.75;

  const ap = profile.accuracyPolicy || {};
  if (ap.kind === "band" && typeof ap.default === "number") {
    baseAcc = ap.default + jitter() * (ap.spread || 0.04);
  } else if (ap.kind === "point" && typeof ap.default === "number") {
    baseAcc = ap.default + jitter();
  } else if (ap.kind === "trend" && typeof ap.start === "number" && typeof ap.end === "number") {
    baseAcc = ap.start + (ap.end - ap.start) * t + jitter() * 0.02;
  } else if (ap.kind === "byTopic" && typeof ap.default === "number") {
    const low = ap.lowTopics?.[bucket];
    const weakHere =
      profile.topicWeaknesses?.[subject] &&
      Object.prototype.hasOwnProperty.call(profile.topicWeaknesses[subject], bucket);
    if (typeof low === "number" && weakHere) {
      baseAcc = low + jitter();
    } else {
      baseAcc = ap.default + jitter();
    }
  } else if (ap.kind === "volatile" && typeof ap.mean === "number") {
    const amp = typeof ap.amplitude === "number" ? ap.amplitude : 0.18;
    const wave =
      Math.sin(((sessionIndex + 1) / Math.max(4, n)) * Math.PI * 7) +
      Math.cos(((sessionIndex + 2) / Math.max(3, Math.floor(n / 2))) * Math.PI * 5) * 0.38;
    baseAcc = clamp01(ap.mean + amp * wave * 0.42 + jitter());
  } else if (typeof ap.default === "number") {
    baseAcc = ap.default + jitter();
  }

  /* Topic weakness emphasis (secondary taper) */
  const wm = weaknessMultiplier(profile, subject, bucket);
  if (wm < 1 && profile.topicWeaknesses?.[subject]?.[bucket] != null) {
    baseAcc = clamp01(baseAcc * (0.62 + wm * 0.35));
  }

  /* Thin data: keep accuracy moderate but few questions handled upstream */
  if (profile.dataVolumePolicy === "thin") {
    baseAcc = clamp01(baseAcc + jitter() * 0.04);
  }

  /* Scenario answerPolicy overrides (numeric only for Phase 2) */
  const ov = scenario.answerPolicy?.accuracyBoost;
  if (typeof ov === "number") {
    baseAcc = clamp01(baseAcc + ov);
  }

  const durationSec = computeDurationSec(profile, ctx);
  const mode = rng() < 0.12 && subject === "math" ? "speed" : "learning";

  let accuracy = clamp01(baseAcc);
  const gr = Number(profile.randomGuessRate);
  if (Number.isFinite(gr) && gr > 0) {
    const towardChance = 0.29;
    const g = Math.min(0.92, gr);
    accuracy = clamp01(accuracy * (1 - g) + towardChance * g);
  }

  return {
    accuracy,
    durationSec,
    mode,
  };
}

function computeDurationSec(profile, ctx) {
  const rtp = profile.responseTimePolicy || {};
  const rng = ctx.rng;
  if (rtp.model === "faster_over_time") {
    const base = 38 - (ctx.sessionIndex / Math.max(1, ctx.totalSessions - 1)) * 12;
    return Math.round((base + rng() * 8) * 60);
  }
  if (rtp.model === "slow_on_weak_topic" && rtp.topic === ctx.bucket) {
    return Math.round((42 + rng() * 18) * 60);
  }
  const mean = typeof rtp.secondsMean === "number" ? rtp.secondsMean : 28;
  const std = typeof rtp.secondsStd === "number" ? rtp.secondsStd : 10;
  const sec = Math.max(12, mean + (rng() - 0.5) * 2 * std);
  return Math.round(sec * 60);
}
