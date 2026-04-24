/**
 * Time / trend signal from a short accuracy history (additive; not wired to step overrides).
 * @param {unknown[]} history
 */
export function computeTimeSignal(history) {
  if (!Array.isArray(history) || history.length < 3) {
    return { trend: "insufficient" };
  }

  const last = history.slice(-3);

  const acc = last.map((x) => Number(x.accuracy) || 0);

  if (acc[2] > acc[1] && acc[1] > acc[0]) {
    return { trend: "improving" };
  }

  if (acc[2] < acc[1] && acc[1] < acc[0]) {
    return { trend: "declining" };
  }

  return { trend: "unstable" };
}
