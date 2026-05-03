/**
 * Shared Parent AI summary insight ("תובנה להורה") — same structure as short parent report.
 * Renders validated `parentAiExplanation` from `enrichParentReportWithParentAi` /
 * `enrichDetailedParentReportWithParentAi`.
 */

import React from "react";

/**
 * @param {{
 *   explanation: { ok?: boolean; text?: string; source?: string } | null | undefined;
 *   className?: string;
 * }} props
 */
export function ParentReportInsight({ explanation, className = "" }) {
  if (!explanation?.ok || !explanation?.text) return null;
  return (
    <div
      className={`parent-report-parent-ai-insight mb-3 md:mb-5 avoid-break rounded-lg border border-sky-400/25 bg-sky-950/20 p-3 md:p-4 text-sm text-white/90 ${className}`}
    >
      <p className="font-bold text-sky-100/95 m-0 text-sm md:text-base mb-2">תובנה להורה</p>
      <p className="m-0 leading-relaxed text-xs md:text-sm text-white/88">{explanation.text}</p>
    </div>
  );
}

export default ParentReportInsight;
