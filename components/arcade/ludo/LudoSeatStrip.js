"use client";

/**
 * רצועת מושבים אופקית — תואם Ov2SeatStrip (MLEO online-v2).
 */

/**
 * @param {{
 *   count: number,
 *   labels?: (string|null|undefined)[],
 *   activeIndex?: number|null,
 *   selfIndex?: number|null,
 *   eliminatedIndices?: number[]|null,
 * }} props
 */
export default function LudoSeatStrip({
  count,
  labels = [],
  activeIndex = null,
  selfIndex = null,
  eliminatedIndices = null,
}) {
  const tones = [
    "border-red-300/80 bg-red-800/45",
    "border-sky-300/80 bg-sky-800/45",
    "border-emerald-300/80 bg-emerald-800/45",
    "border-amber-300/80 bg-amber-700/45",
    "border-violet-300/80 bg-violet-800/45",
    "border-cyan-300/80 bg-cyan-800/45",
    "border-orange-300/80 bg-orange-800/45",
    "border-fuchsia-300/80 bg-fuchsia-800/45",
  ];

  return (
    <div className="flex min-h-0 w-full shrink-0 gap-1 overflow-hidden pb-0.5 pt-0 sm:gap-1 sm:pb-0.5 sm:pt-0">
      {Array.from({ length: count }).map((_, idx) => {
        const label = labels[idx] ?? `מושב ${idx + 1}`;
        const isSelf = selfIndex === idx;
        const isActive = activeIndex === idx;
        const isEliminated = Array.isArray(eliminatedIndices) && eliminatedIndices.includes(idx);
        const tone = tones[idx % tones.length];
        return (
          <div
            key={idx}
            className={`flex min-w-0 flex-1 flex-col justify-center rounded-md border px-1.5 py-1.5 text-center sm:min-w-[5.75rem] sm:px-2 sm:py-2 ${tone} ${
              isSelf ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-950" : ""
            } ${isActive ? "brightness-110" : "opacity-90"} ${isEliminated ? "opacity-55 grayscale" : ""}`}
          >
            <span className="truncate text-[10px] font-bold leading-tight text-white sm:text-[12px]">{label}</span>
          </div>
        );
      })}
    </div>
  );
}
