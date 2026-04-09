/**
 * Geometry-only: infer display units from Hebrew question text for trustworthy explanations.
 */

/** @returns {{ area: string | null, length: string | null, volume: string | null }} */
export function inferGeometryResultUnits(question) {
  const q = String(question?.question ?? "");
  const out = { area: null, length: null, volume: null };
  if (!q) return out;

  const hasCm = /ס[\u05F4"\u201C\u201D']מ/.test(q) || /בס"מ/.test(q);
  const hasMeters = /מטר/.test(q);
  const cubic =
    /מעוקב|מעוקבים|מ["״']ק|סמ["״']ק/.test(q) ||
    /בס["״']מ\s*מעוקב/.test(q);

  if (cubic) {
    if (hasCm) {
      out.volume = 'סמ"ק';
      out.length = 'ס"מ';
    } else if (hasMeters) {
      out.volume = 'מ"ק';
      out.length = "מ'";
    }
    return out;
  }

  if (/מטרים\s*רבועים|מטר\s*רבוע|מ["״']ר/.test(q)) {
    out.area = 'מ"ר';
    out.length = "מ'";
    return out;
  }

  if (
    hasMeters &&
    /שטח|רבועים|רצפה|גינה|גג|מגרש/.test(q) &&
    !/היקף|גדר|שביל/.test(q)
  ) {
    out.area = 'מ"ר';
    out.length = "מ'";
    return out;
  }

  if (/גדר|שביל|היקף.*מטר|כמה מטרים(?!.*רבוע)/.test(q) && hasMeters) {
    out.length = "מטרים";
    return out;
  }

  if (hasCm && /נפח|תיבה|קופסה|קובייה/.test(q)) {
    out.volume = 'סמ"ק';
    out.length = 'ס"מ';
    return out;
  }

  if (hasCm) {
    out.length = 'ס"מ';
    if (/שטח|סמ["״']ר/.test(q)) out.area = 'סמ"ר';
    return out;
  }

  return out;
}

/**
 * Labels for numeric measurements on SVG (short form).
 */
export function inferGeometryDiagramLengthUnit(question) {
  const u = inferGeometryResultUnits(question);
  if (u.length === "מטרים") return "מ'";
  return u.length;
}

export function resultPhraseArea(question, value) {
  const u = inferGeometryResultUnits(question);
  const s = u.area || "יחידות שטח";
  return `התוצאה: ${value} ${s}.`;
}

export function resultPhraseLength(question, value) {
  const u = inferGeometryResultUnits(question);
  const s = u.length || "יחידות אורך";
  return `התוצאה: ${value} ${s}.`;
}

export function resultPhraseVolume(question, value) {
  const u = inferGeometryResultUnits(question);
  const s = u.volume || "יחידות נפח";
  return `התוצאה: ${value} ${s}.`;
}

/** Space + unit for appending after LTR math, e.g. "5" → "5 מ'" */
export function geometryLengthSuffix(question) {
  const u = inferGeometryResultUnits(question);
  return u.length ? ` ${u.length}` : "";
}

export function geometryVolumeSuffix(question) {
  const u = inferGeometryResultUnits(question);
  return u.volume ? ` ${u.volume}` : "";
}

export function resultPhraseVolumeRounded(question, value) {
  const u = inferGeometryResultUnits(question);
  const s = u.volume || "יחידות נפח";
  return `התוצאה המעוגלת: ${value} ${s}.`;
}
