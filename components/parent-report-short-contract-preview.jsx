import React from "react";

function clean(value) {
  return String(value || "").trim();
}

function line(label, value) {
  const t = clean(value);
  if (!t) return null;
  return (
    <p className="m-0 leading-relaxed">
      <span className="text-white/55">{label}: </span>
      {t}
    </p>
  );
}

export function ParentReportShortContractPreview({ top }) {
  if (!top || typeof top !== "object") return null;
  const status = line("מצב", top.mainStatusHe);
  const priority = line("מיקוד עיקרי", top.mainPriorityHe);
  const doNow = line("מה עושים עכשיו", top.doNowHe);
  if (!status && !priority && !doNow) return null;
  return (
    <div className="mb-3 md:mb-5 avoid-break rounded-lg border border-sky-400/25 bg-sky-950/15 p-3 md:p-4 text-sm text-white/90 space-y-2">
      <p className="font-bold text-sky-100/95 m-0 text-sm md:text-base">סיכום קצר להורה</p>
      {status}
      {priority}
      {doNow}
    </div>
  );
}

export default ParentReportShortContractPreview;

