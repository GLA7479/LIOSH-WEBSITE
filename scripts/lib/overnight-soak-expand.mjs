/**
 * Expand learning-simulator scenario lists for soak / launch-readiness runs.
 * No sleeps — only duplicates work with distinct scenarioId + seed offsets.
 *
 * Env:
 *   OVERNIGHT_SOAK=1 — enable target-based expansion with OVERNIGHT_TARGET_SCENARIOS
 *   OVERNIGHT_STUDENT_MULTIPLIER=<n> — repeat each base scenario n times (default 1)
 *   OVERNIGHT_TARGET_SCENARIOS=<n> — with OVERNIGHT_SOAK, raise per-scenario repeats to reach at least n total rows
 */
export function soakRepeatFactor(baseScenarioCount) {
  const soak = process.env.OVERNIGHT_SOAK === "1";
  const mult = Math.max(1, parseInt(String(process.env.OVERNIGHT_STUDENT_MULTIPLIER || "1"), 10) || 1);
  let factor = mult;
  const rawTarget = process.env.OVERNIGHT_TARGET_SCENARIOS;
  if (soak && rawTarget != null && String(rawTarget).trim() !== "") {
    const target = parseInt(String(rawTarget), 10);
    if (Number.isFinite(target) && target > 0 && baseScenarioCount > 0) {
      factor = Math.max(factor, Math.ceil(target / baseScenarioCount));
    }
  }
  return Math.max(1, factor);
}

/**
 * @template T
 * @param {T[]} baseScenarios
 * @param {(s: T, r: number) => T} cloneWithRepeat — r=0 returns original shape; r>0 must vary id/seed
 */
export function expandScenarios(baseScenarios, cloneWithRepeat) {
  const factor = soakRepeatFactor(baseScenarios.length);
  if (factor <= 1) return baseScenarios;

  const out = [];
  for (const s of baseScenarios) {
    for (let r = 0; r < factor; r++) {
      out.push(cloneWithRepeat(s, r));
    }
  }
  return out;
}

/** Default clone: suffix scenarioId + bump seed for aggregate/deep fixtures */
export function defaultScenarioClone(scenario, repeatIndex) {
  if (repeatIndex === 0) return scenario;
  return {
    ...scenario,
    scenarioId: `${scenario.scenarioId}__soak${repeatIndex}`,
    seed: (scenario.seed ?? 0) + repeatIndex * 10007,
  };
}
