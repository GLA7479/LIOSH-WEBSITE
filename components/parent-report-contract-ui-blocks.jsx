import React from "react";

function row(label, value) {
  const t = String(value || "").trim();
  if (!t) return null;
  return (
    <div key={label} className="min-w-0">
      <p className="pr-detailed-mini-heading font-bold text-white/82 mb-1 text-xs">{label}</p>
      <p className="pr-detailed-body-text text-sm leading-relaxed m-0 text-white/[0.9]">{t}</p>
    </div>
  );
}

export function ParentTopContractSummaryBlock({ top }) {
  if (!top || typeof top !== "object") return null;
  const items = [
    row("מצב", top.mainStatusHe),
    row("מה חשוב קודם", top.mainPriorityHe),
    row("מה עושים עכשיו", top.doNowHe),
    row("למה", top.whyHe),
    row("מה לא לעשות כרגע", top.avoidNowHe),
    row("כמה אפשר לסמוך על זה", top.confidenceHe),
    row("על מה זה נשען", top.evidenceSummaryHe),
    row("בדיקה הבאה", top.nextCheckHe),
  ].filter(Boolean);
  if (!items.length) return null;
  return (
    <div className="space-y-3 rounded-lg border border-amber-400/28 bg-amber-950/14 px-3 py-3">
      {items}
    </div>
  );
}

export function ParentSubjectContractSummaryBlock({
  contractRow,
  compact = false,
  topMainPriority = "",
  topDoNow = "",
}) {
  if (!contractRow || typeof contractRow !== "object") return null;
  const topPriorityNorm = String(topMainPriority || "").trim();
  const subjectPriorityNorm = String(contractRow.mainPriorityHe || "").trim();
  const mainPriority = topPriorityNorm && subjectPriorityNorm === topPriorityNorm ? "" : subjectPriorityNorm;
  const topDoNowNorm = String(topDoNow || "").trim();
  const subjectDoNowNorm = String(contractRow.doNowHe || "").trim();
  const doNow = topDoNowNorm && subjectDoNowNorm === topDoNowNorm ? "" : subjectDoNowNorm;
  const items = [
    row("סיכום להורה", contractRow.mainStatusHe),
    row("מה הכי חשוב כאן", mainPriority),
    row("מה עושים עכשיו", doNow),
    row("מה לא לעשות כרגע", contractRow.avoidNowHe),
    row("כמה אפשר לסמוך על זה", contractRow.confidenceHe),
  ].filter(Boolean);
  if (!items.length) return null;
  return (
    <div
      className={`space-y-2.5 rounded-lg border border-sky-400/24 bg-sky-950/12 px-3 py-2.5 ${
        compact ? "text-xs" : ""
      }`.trim()}
    >
      {items}
    </div>
  );
}

