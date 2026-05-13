/**
 * Phase 9 — deterministic review oracle over an extracted Phase 8 full pack (no product changes, no re-sim).
 *
 * Usage:
 *   node scripts/phase9-review-oracle.mjs [pathToPhase8RunRoot]
 *
 * Default pack root: reports/phase8-mass-coverage-full/2026-05-13T18-37-21
 * Output: reports/phase9-review-oracle/<basename(runRoot)>/
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PDFParse } from "pdf-parse";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const DEFAULT_PACK = path.join(ROOT, "reports", "phase8-mass-coverage-full", "2026-05-13T18-37-21");

const LEAK_PATTERNS = [
  { id: "axis_symbolic", re: /ציר\s*\+\s*סימבולי/u },
  { id: "axis_distance", re: /ציר\s*\+\s*מרחק/u },
  { id: "register_he", re: /\bרגיסטר\b/u },
  { id: "pragmatics_he", re: /\bפרגמטיקה\b/u },
  { id: "mini_rule", re: /כלל\s+מיני/u },
  { id: "inference_ascii", re: /\binference\b/i },
  { id: "collocation_ascii", re: /\bcollocation\b/i },
  { id: "preposition_ascii", re: /\bpreposition\b/i },
  { id: "false_friend_ascii", re: /\bfalse\s*friend\b/i },
  { id: "he_she_it_ascii", re: /\bhe\/she\/it\b/i },
  { id: "past_present_ascii", re: /\bpast\/present\b/i },
  { id: "medical_problem", re: /בעיה\s*רפואית/u },
  { id: "medical_report", re: /דיווח\s*רפואי/u },
  { id: "social_teacher", re: /מורה\s*חברתי/u },
  { id: "prejudice", re: /דעות\s*קדומות/u },
  { id: "social_problem", re: /בעיה\s*חברתית/u },
  { id: "ruler_units", re: /סרגל\s*\+\s*יחידות/u },
  { id: "axis_physical_cards", re: /ציר\s*פיזי\s*\+\s*כרטיסיות/u },
  { id: "symbols_small_groups", re: /סימבולים\s*בקבוצות\s*קטנות/u },
  { id: "patternHe", re: /\bpatternHe\b/ },
  { id: "probeHe", re: /\bprobeHe\b/ },
  { id: "interventionHe", re: /\binterventionHe\b/ },
  { id: "doNotConcludeHe", re: /\bdoNotConcludeHe\b/ },
  { id: "escalationHe", re: /\bescalationHe\b/ },
  { id: "competitorsHe", re: /\bcompetitorsHe\b/ },
  { id: "rootsHe", re: /\brootsHe\b/ },
];

const GENERIC_RECOMMENDATION_RE = /להמשיך\s+תרגול|מומלץ\s+לתרגל|חשוב\s+לתרגל|כדאי\s+לתרגל/u;
const THIN_DATA_INSUFFICIENT_RE = /אין\s+מספיק|לא\s+מספיק\s+נתונים|מעט\s+מדי\s+נתונים|דליל|מצומצם|מוקדם\s+למסקנה/u;
const REMEDIATION_HEAVY_RE = /לתקן|תיקון\s+דחוף|חובה\s+לחזור|כישלון|כשלון/u;

function readJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function readText(p) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return "";
  }
}

function exists(p) {
  return fs.existsSync(p);
}

function hebrewLetters(s) {
  return (String(s).match(/[\u0590-\u05FF]/g) || []).length;
}

function parentInsightFingerprintOk(text) {
  const t = String(text || "");
  if (/תובנה\s+להורה/u.test(t)) return { ok: true, kind: "tovana_lehora" };
  if (/סיכום\s+חכם\s+להורה/u.test(t)) return { ok: true, kind: "sihum_haham_lehora" };
  if (/סיכום/u.test(t) && /להורה/u.test(t)) return { ok: true, kind: "sihum_lehora" };
  return { ok: false, kind: "none" };
}

async function extractPdfText(buf) {
  const parser = new PDFParse({ data: buf });
  try {
    const textResult = await parser.getText();
    return String(textResult?.text || "");
  } finally {
    await parser.destroy?.();
  }
}

function parseArchetype(studentId) {
  const parts = String(studentId).split("_");
  const gi = parts.findIndex((p) => /^g\d+$/i.test(p));
  if (gi <= 3) return "unknown";
  return parts.slice(3, gi).join("_");
}

function parsePrimarySubjectSuffix(studentId) {
  const parts = String(studentId).split("_");
  return parts[parts.length - 1] || "";
}

function scanLeaksOnSurface(text) {
  const hits = [];
  const t = String(text || "");
  for (const { id, re } of LEAK_PATTERNS) {
    if (re.test(t)) hits.push(id);
  }
  return hits;
}

function normReportBody(md) {
  return String(md || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 50_000);
}

function jsonExecutiveBlob(shortJson) {
  const lines = shortJson?.executiveLines || shortJson?.textSnapshotFromShortHtml || [];
  return Array.isArray(lines) ? lines.join("\n") : "";
}

function suspicionWeights() {
  return {
    missing_required_file: 25,
    pdf_extract_fail: 20,
    pdf_zero_hebrew: 20,
    pdf_missing_fingerprint: 15,
    profile_report_mismatch: 12,
    pdf_detailed_not_richer: 10,
    internal_leak_surface: 18,
    copilot_quality_flags: 8,
    copilot_generic_repeat: 6,
    thin_overconfident: 12,
    perfect_over_remediation: 10,
    weak_vague: 8,
    recommendation_action_equals_goal: 6,
    recommendation_generic: 5,
    empty_recommendations_heavy: 8,
    audit_warning_row: 3,
    report_json_md_divergence: 4,
  };
}

async function main() {
  const packRoot = path.resolve(process.argv[2] || DEFAULT_PACK);
  const stamp = path.basename(packRoot);
  const outDir = path.join(ROOT, "reports", "phase9-review-oracle", stamp);
  fs.mkdirSync(outDir, { recursive: true });

  if (!exists(packRoot)) {
    console.error("Pack root not found:", packRoot);
    process.exit(2);
  }

  const studentsDir = path.join(packRoot, "students");
  const studentIds = exists(studentsDir)
    ? fs
        .readdirSync(studentsDir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
        .sort()
    : [];

  const W = suspicionWeights();

  const perfect = readJson(path.join(packRoot, "PERFECT_TOPIC_CASES.json"))?.cases || [];
  const weak = readJson(path.join(packRoot, "WEAK_TOPIC_CASES.json"))?.cases || [];
  const thin = readJson(path.join(packRoot, "THIN_DATA_CASES.json"))?.cases || [];

  const perfectById = new Map(perfect.map((c) => [c.studentId, c]));
  const weakById = new Map(weak.map((c) => [c.studentId, c]));
  const thinById = new Map(thin.map((c) => [c.studentId, c]));

  const qualityFlags = readJson(path.join(packRoot, "QUALITY_FLAGS.json")) || {};
  const rawLeakPack = readJson(path.join(packRoot, "RAW_INTERNAL_LEAK_SCAN.json")) || { hitCount: 0, hits: [] };
  const blockedMd = readText(path.join(packRoot, "BLOCKED_IDS_CHECK.md"));

  let audit = null;
  let auditStudentWarnings = new Map();
  try {
    audit = readJson(path.join(packRoot, "AI_RESPONSE_QUALITY_AUDIT.json"));
    for (const row of audit?.answerRecords || []) {
      const sid = row.studentId;
      if (!sid) continue;
      for (const iss of row.issues || []) {
        if (iss.severity !== "warning") continue;
        if (iss.nonBlockingFormat || iss.code === "audit_report_md_html_divergence") continue;
        const arr = auditStudentWarnings.get(sid) || [];
        arr.push({ code: iss.code, detail: iss.detail });
        auditStudentWarnings.set(sid, arr);
      }
    }
  } catch {
    audit = null;
  }

  const failures = [];
  const warnings = [];
  const perStudent = [];
  const pdfRichnessRows = [];
  const copilotRows = [];
  const recommendationRows = [];
  const leakFindings = [];

  for (const sid of studentIds) {
    const base = path.join(studentsDir, sid);
    const pdfShortP = path.join(base, "pdf", "report-short.pdf");
    const pdfDetP = path.join(base, "pdf", "report-detailed.pdf");
    const paths = {
      profileJson: path.join(base, "profile.json"),
      profileMd: path.join(base, "profile.md"),
      shortJson: path.join(base, "report-short.json"),
      shortMd: path.join(base, "report-short.md"),
      detailedJson: path.join(base, "report-detailed.json"),
      detailedMd: path.join(base, "report-detailed.md"),
      recommendations: path.join(base, "recommendations.json"),
      copilot: path.join(base, "copilot-turns.json"),
      notes: path.join(base, "notes.md"),
      pdfShort: pdfShortP,
      pdfDetailed: pdfDetP,
    };

    const missing = Object.entries(paths)
      .filter(([, p]) => !exists(p))
      .map(([k]) => k);
    if (missing.length) {
      failures.push({ studentId: sid, code: "structure_missing_files", missing });
    }

    const profile = readJson(paths.profileJson) || {};
    const shortJ = readJson(paths.shortJson) || {};
    const detailedJ = readJson(paths.detailedJson) || {};
    const shortMd = readText(paths.shortMd);
    const detailedMd = readText(paths.detailedMd);

    let score = 0;
    const flags = [];

    if (missing.length) {
      score += W.missing_required_file * Math.min(4, missing.length);
      flags.push("missing_required_file");
    }

    if (profile.grade && shortJ.grade && profile.grade !== shortJ.grade) {
      score += W.profile_report_mismatch;
      flags.push("profile_grade_vs_short_json");
      warnings.push({ studentId: sid, code: "profile_grade_mismatch", profile: profile.grade, short: shortJ.grade });
    }
    if (profile.profileType && shortJ.profileType && profile.profileType !== shortJ.profileType) {
      score += W.profile_report_mismatch;
      flags.push("profile_type_vs_short_json");
      warnings.push({ studentId: sid, code: "profile_type_mismatch", profile: profile.profileType, short: shortJ.profileType });
    }

    const blobJ = normReportBody(jsonExecutiveBlob(shortJ));
    const blobM = normReportBody(shortMd);
    if (blobJ.length > 80 && blobM.length > 80) {
      const ratio = Math.min(blobJ.length, blobM.length) / Math.max(blobJ.length, blobM.length);
      if (ratio < 0.35) {
        score += W.report_json_md_divergence;
        flags.push("short_json_vs_md_low_overlap_heuristic");
        warnings.push({ studentId: sid, code: "short_json_md_divergence_heuristic", ratio: Math.round(ratio * 1000) / 1000 });
      }
    }

    let shortPdfText = "";
    let detPdfText = "";
    let shortBytes = 0;
    let detBytes = 0;
    if (exists(pdfShortP) && exists(pdfDetP)) {
      shortBytes = fs.statSync(pdfShortP).size;
      detBytes = fs.statSync(pdfDetP).size;
      if (shortBytes < 4000 || detBytes < 4000) {
        failures.push({ studentId: sid, code: "pdf_trivial_size", shortBytes, detBytes });
        score += W.missing_required_file;
        flags.push("pdf_trivial_size");
      }
      try {
        shortPdfText = await extractPdfText(fs.readFileSync(pdfShortP));
        detPdfText = await extractPdfText(fs.readFileSync(pdfDetP));
      } catch (e) {
        failures.push({ studentId: sid, code: "pdf_extract_failed", error: String(e?.message || e) });
        score += W.pdf_extract_fail;
        flags.push("pdf_extract_fail");
      }

      const heS = hebrewLetters(shortPdfText);
      const heD = hebrewLetters(detPdfText);
      if (heS < 30 || heD < 30) {
        warnings.push({ studentId: sid, code: "pdf_low_hebrew", heS, heD });
        score += W.pdf_zero_hebrew;
        flags.push("pdf_low_hebrew");
      }

      const fpS = parentInsightFingerprintOk(shortPdfText);
      const fpD = parentInsightFingerprintOk(detPdfText);
      if (!fpS.ok || !fpD.ok) {
        warnings.push({ studentId: sid, code: "pdf_parent_fingerprint_weak", fpS, fpD });
        score += W.pdf_missing_fingerprint;
        flags.push("pdf_fingerprint");
      }

      const lenS = shortPdfText.length;
      const lenD = detPdfText.length;
      const richerOk = lenD > lenS * 1.05 || detBytes > shortBytes * 1.02;
      const exceptionNote =
        !richerOk && heD >= heS && lenD >= lenS * 0.85
          ? "detailed_text_similar_length_possible_layout_duplicate_heuristic"
          : null;
      pdfRichnessRows.push({
        studentId: sid,
        shortPdfBytes: shortBytes,
        detailedPdfBytes: detBytes,
        shortExtractedChars: lenS,
        detailedExtractedChars: lenD,
        detailedRicherThanShort: richerOk,
        exceptionNote,
      });
      if (!richerOk && !exceptionNote) {
        score += W.pdf_detailed_not_richer;
        flags.push("pdf_detailed_not_richer");
        warnings.push({ studentId: sid, code: "pdf_detailed_not_richer", lenS, lenD });
      } else if (!richerOk && exceptionNote) {
        warnings.push({ studentId: sid, code: "pdf_richness_borderline", lenS, lenD, exceptionNote });
        score += Math.floor(W.pdf_detailed_not_richer / 2);
        flags.push("pdf_richness_borderline");
      }

      const leakBlob = `${shortMd}\n${detailedMd}\n${shortPdfText.slice(0, 120_000)}\n${detPdfText.slice(0, 200_000)}`;
      const leaks = scanLeaksOnSurface(leakBlob);
      if (leaks.length) {
        leakFindings.push({ studentId: sid, hits: leaks });
        score += W.internal_leak_surface;
        flags.push("internal_leak_surface");
        failures.push({ studentId: sid, code: "oracle_internal_leak_on_parent_surface", hits: leaks });
      }
    }

    const recs = readJson(paths.recommendations);
    const recList = Array.isArray(recs) ? recs : [];
    let nonemptyHe = 0;
    for (const r of recList) {
      const action = String(r?.immediateActionHe || "").trim();
      const goal = String(r?.shortPracticeHe || "").trim();
      const actionTextHe = action || null;
      const goalTextHe = goal || null;
      const taxonomyId = r?.taxonomyId ?? null;
      const generic = action && GENERIC_RECOMMENDATION_RE.test(action) && action.length < 140;
      const same = action && goal && action === goal;
      const row = {
        studentId: sid,
        subject: r?.subjectId || null,
        grade: profile.grade || shortJ.grade,
        topicOrBucket: r?.topicRowKey || r?.bucketKey || null,
        taxonomyId,
        actionTextHe,
        goalTextHe,
        gradeBand: profile.grade || null,
        source: taxonomyId ? "taxonomy_row" : action || goal ? "partial_or_template" : "null_copy",
        flags: [],
      };
      if (generic) row.flags.push("generic_action");
      if (same) row.flags.push("action_equals_goal");
      if (!action && !goal && taxonomyId == null) row.flags.push("missing_action_goal");
      recommendationRows.push(row);
      if (action || goal) nonemptyHe++;
      if (generic) {
        score += W.recommendation_generic;
        flags.push("recommendation_generic");
      }
      if (same) {
        score += W.recommendation_action_equals_goal;
        flags.push("rec_action_eq_goal");
      }
      const recHe = `${action}\n${goal}`;
      const recLeaks = scanLeaksOnSurface(recHe);
      if (recLeaks.length) {
        leakFindings.push({ studentId: sid, scope: "recommendation_he_fields", hits: recLeaks });
        score += W.internal_leak_surface;
        flags.push("leak_in_recommendation_he");
        failures.push({ studentId: sid, code: "oracle_internal_leak_recommendation_he", hits: recLeaks });
      }
    }
    if (recList.length > 3 && nonemptyHe < Math.min(3, Math.floor(recList.length * 0.05))) {
      score += W.empty_recommendations_heavy;
      flags.push("mostly_empty_recommendation_he");
      warnings.push({ studentId: sid, code: "sparse_recommendation_hebrew", total: recList.length, nonemptyHe });
    }

    const copilot = readJson(paths.copilot) || {};
    const turns = Array.isArray(copilot.turns) ? copilot.turns : [];
    const answerTexts = [];
    let genericRepeat = 0;
    const seen = new Map();
    for (const t of turns) {
      const a = String(t?.aiAnswer || "").trim();
      answerTexts.push(a);
      const k = a.slice(0, 160);
      seen.set(k, (seen.get(k) || 0) + 1);
      const row = {
        studentId: sid,
        parentQuestionId: t?.parentQuestionId,
        questionCategory: t?.questionCategory,
        resolutionStatus: t?.resolutionStatus,
        answerLength: a.length,
        qualityFlagCount: Array.isArray(t?.qualityFlags) ? t.qualityFlags.length : 0,
        generationPath: t?.telemetrySummary?.generationPath,
      };
      if (row.qualityFlagCount > 0) {
        score += W.copilot_quality_flags;
        flags.push("copilot_quality_flags");
      }
      copilotRows.push(row);
    }
    for (const [, c] of seen) {
      if (c >= 4) genericRepeat += c;
    }
    if (genericRepeat >= 4) {
      score += W.copilot_generic_repeat;
      flags.push("copilot_repeated_answers");
      warnings.push({ studentId: sid, code: "copilot_repeated_answer_templates", approximateRepeats: genericRepeat });
    }

    const bigSurface = `${answerTexts.join("\n")}\n${shortMd}\n${detailedMd}`;
    const copilotLeaks = scanLeaksOnSurface(bigSurface);
    if (copilotLeaks.length) {
      leakFindings.push({ studentId: sid, scope: "copilot_plus_report_md", hits: copilotLeaks });
      score += W.internal_leak_surface;
      flags.push("leak_in_copilot_or_md");
      failures.push({ studentId: sid, code: "oracle_internal_leak_copilot_or_md", hits: copilotLeaks });
    }

    const auditWs = auditStudentWarnings.get(sid) || [];
    if (auditWs.length) {
      score += W.audit_warning_row * Math.min(12, auditWs.length);
      flags.push("ai_audit_warnings");
    }

    if (thinById.has(sid)) {
      const tinfo = thinById.get(sid);
      const lowQ = Number(tinfo?.questionCount || 0) <= 20;
      const cautious = THIN_DATA_INSUFFICIENT_RE.test(bigSurface) || /מצומצם|מוקדם\s+למסקנה|מעט\s+נתונים/u.test(bigSurface);
      const over = /מצוין|מושלם|ללא\s+חולשות|דיוק\s+מלא|100%/u.test(bigSurface) && !cautious;
      if (!cautious && lowQ) {
        score += W.thin_overconfident;
        flags.push("thin_data_missing_explicit_caution");
        warnings.push({ studentId: sid, code: "thin_data_caution_language", questionCount: tinfo?.questionCount });
      }
      if (over) {
        score += W.thin_overconfident;
        flags.push("thin_possible_overconfident_language");
        warnings.push({ studentId: sid, code: "thin_overconfident_heuristic" });
      }
    }

    if (perfectById.has(sid)) {
      const pc = perfectById.get(sid);
      const accOk = Number(pc.accuracyPercent) === 100;
      const attOk = Number(pc.attemptsInTopic || 0) >= 8;
      const cop = String(pc.copilotAnswerHe || "");
      const badThin = THIN_DATA_INSUFFICIENT_RE.test(cop);
      const remediation = REMEDIATION_HEAVY_RE.test(cop);
      if (!accOk || !attOk) {
        warnings.push({ studentId: sid, code: "perfect_topic_metrics", accOk, attOk, pc });
        score += W.perfect_over_remediation;
        flags.push("perfect_metrics_mismatch");
      }
      if (badThin) {
        score += W.perfect_over_remediation;
        flags.push("perfect_copilot_insufficient_data");
        warnings.push({ studentId: sid, code: "perfect_topic_copilot_thin_language" });
      }
      if (remediation) {
        score += W.perfect_over_remediation;
        flags.push("perfect_heavy_remediation_language");
        warnings.push({ studentId: sid, code: "perfect_topic_remediation_tone" });
      }
    }

    if (weakById.has(sid)) {
      const wc = weakById.get(sid);
      const acc = Number(wc.accuracyPercent);
      if (acc >= 85) {
        warnings.push({ studentId: sid, code: "weak_topic_not_low_accuracy", accuracyPercent: acc });
        score += W.weak_vague;
        flags.push("weak_accuracy_not_low");
      }
      const wtext = bigSurface;
      const actionable = /תרגול|בית|שאלות|דקות|צעד/u.test(wtext);
      if (!actionable) {
        score += W.weak_vague;
        flags.push("weak_topic_low_actionability_heuristic");
        warnings.push({ studentId: sid, code: "weak_topic_actionability" });
      }
    }

    perStudent.push({
      studentId: sid,
      grade: profile.grade || shortJ.grade,
      archetype: parseArchetype(sid),
      primarySubject: parsePrimarySubjectSuffix(sid),
      profileType: profile.profileType,
      suspicionScore: Math.round(score),
      flags: [...new Set(flags)],
      missingPaths: missing,
      auditWarnings: auditWs,
    });
  }

  const suspiciousSorted = [...perStudent].sort((a, b) => b.suspicionScore - a.suspicionScore);

  const richIds = uniqueIds([
    ...perStudent.filter((r) => r.profileType === "rich_data").map((r) => r.studentId),
    ...perStudent.filter((r) => String(r.studentId).includes("high_volume_data")).map((r) => r.studentId),
  ]).slice(0, 4);

  function uniqueIds(arr) {
    const s = new Set();
    const out = [];
    for (const id of arr) {
      if (!id || s.has(id)) continue;
      s.add(id);
      out.push(id);
    }
    return out;
  }

  function pickManual25() {
    const top15 = suspiciousSorted.slice(0, 15);
    const picks = top15.map((x) => ({ studentId: x.studentId, reason: `top_suspicion_score=${x.suspicionScore}` }));
    const set = new Set(picks.map((p) => p.studentId));
    const add = (id, reason) => {
      if (!id || picks.length >= 25) return;
      if (set.has(id)) return;
      set.add(id);
      picks.push({ studentId: id, reason });
    };
    for (const c of perfect.slice(0, 5)) add(c.studentId, "perfect_topic_sample");
    for (const c of weak.slice(0, 5)) add(c.studentId, "weak_topic_sample");
    for (const c of thin.slice(0, 4)) add(c.studentId, "thin_data_sample");
    for (const id of richIds) add(id, "high_volume_rich_sample");
    let i = 15;
    while (picks.length < 25 && i < suspiciousSorted.length) {
      const x = suspiciousSorted[i++];
      if (!set.has(x.studentId)) {
        set.add(x.studentId);
        picks.push({ studentId: x.studentId, reason: `backfill_suspicion=${x.suspicionScore}` });
      }
    }
    return picks.slice(0, 25);
  }

  const manualPickMeta = pickManual25();
  const relPackToOracle = path.relative(outDir, packRoot).replace(/\\/g, "/");

  function manualHebrewChecklist(sid) {
    return [
      "לוודא שה־PDF הקצר והמפורט תואמים לתחושה מהדוח ב־MD.",
      "לבדוק שאין ניסוח פנימי/טכני בולט בטקסט שחולץ מה־PDF.",
      "לעבור על 2–3 תשובות Copilot בקטגוריות רגישות (סתירה, חוסר נתונים, בקשות לא נתמכות).",
      "אם מדובר בפרופיל thin_data — לוודא שההמלצות לא נשמעות כמו דוח עשיר מדי.",
    ].join(" ");
  }

  const manualTop = manualPickMeta.map(({ studentId, reason }) => {
    const st = perStudent.find((x) => x.studentId === studentId) || {};
    const base = `${relPackToOracle}/students/${studentId}`.replace(/\\/g, "/");
    return {
      studentId,
      grade: st.grade,
      archetype: st.archetype,
      primarySubject: st.primarySubject,
      profileType: st.profileType,
      reasonSelected: reason,
      suspicionScore: st.suspicionScore ?? 0,
      paths: {
        pdfShort: `${base}/pdf/report-short.pdf`,
        pdfDetailed: `${base}/pdf/report-detailed.pdf`,
        reportShortMd: `${base}/report-short.md`,
        reportDetailedMd: `${base}/report-detailed.md`,
        copilotTurns: `${base}/copilot-turns.json`,
      },
      ownerManualHe: manualHebrewChecklist(studentId),
    };
  });

  function aggregateFlagCounts(rows) {
    const m = {};
    for (const r of rows) for (const f of r.flags || []) m[f] = (m[f] || 0) + 1;
    return Object.entries(m)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([flag, count]) => ({ flag, count }));
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    packRoot: path.relative(ROOT, packRoot).replace(/\\/g, "/"),
    outputDir: path.relative(ROOT, outDir).replace(/\\/g, "/"),
    studentsAnalyzed: studentIds.length,
    pdfsAnalyzed: studentIds.filter((s) => exists(path.join(studentsDir, s, "pdf", "report-short.pdf"))).length * 2,
    blockerCount: failures.length,
    oracleWarningCount: warnings.length,
    harnessQualityFailedChecks: qualityFlags.failedChecks ?? null,
    harnessQualityWarningCount: qualityFlags.warningCount ?? null,
    auditFinalStatus: audit?.summary?.finalStatus ?? null,
    auditTotalFailures: audit?.summary?.totalFailures ?? null,
    rawInternalLeakHitCountPack: rawLeakPack.hitCount,
    leakFindingsOracle: leakFindings.length,
    topSuspicionCategories: aggregateFlagCounts(perStudent),
    perfectCases: perfect.length,
    weakCases: weak.length,
    thinCases: thin.length,
  };

  fs.writeFileSync(path.join(outDir, "REVIEW_ORACLE_SUMMARY.json"), JSON.stringify(summary, null, 2), "utf8");
  fs.writeFileSync(
    path.join(outDir, "REVIEW_ORACLE_SUMMARY.md"),
    [
      "# REVIEW_ORACLE_SUMMARY",
      "",
      `נוצר: ${summary.generatedAt}`,
      "",
      `- חבילת מקור: \`${summary.packRoot}\``,
      `- תלמידים: **${summary.studentsAnalyzed}**`,
      `- PDF שנסרקו (זוגות): **${summary.pdfsAnalyzed}**`,
      `- כשלי oracle (חוסמים): **${summary.blockerCount}**`,
      `- אזהרות oracle: **${summary.oracleWarningCount}**`,
      `- QUALITY_FLAGS failedChecks (הרנס): **${summary.harnessQualityFailedChecks}**`,
      `- AI audit finalStatus: **${summary.auditFinalStatus}**; כשלי audit: **${summary.auditTotalFailures}**`,
      "",
      "## Top suspicion flags",
      "",
      ...summary.topSuspicionCategories.map((x) => `- **${x.flag}**: ${x.count}`),
      "",
    ].join("\n"),
    "utf8",
  );

  fs.writeFileSync(path.join(outDir, "SUSPICIOUS_CASES.json"), JSON.stringify({ students: suspiciousSorted }, null, 2), "utf8");
  fs.writeFileSync(
    path.join(outDir, "SUSPICIOUS_CASES.md"),
    ["# SUSPICIOUS_CASES", "", ...suspiciousSorted.slice(0, 80).map((r) => `- **${r.studentId}** score=${r.suspicionScore} flags=${r.flags.join(",")}`)].join("\n"),
    "utf8",
  );

  fs.writeFileSync(path.join(outDir, "MANUAL_REVIEW_TOP_25.json"), JSON.stringify({ picks: manualTop }, null, 2), "utf8");
  fs.writeFileSync(
    path.join(outDir, "MANUAL_REVIEW_TOP_25.md"),
    [
      "# MANUAL_REVIEW_TOP_25",
      "",
      ...manualTop.map(
        (p, i) =>
          `## ${i + 1}. ${p.studentId}\n\n- ציון חשד: ${p.suspicionScore}\n- כיתה: ${p.grade}; ארכיטיפ: ${p.archetype}; מקצוע ממוקד: ${p.primarySubject}; פרופיל: ${p.profileType}\n- סיבת בחירה: ${p.reasonSelected}\n- PDF קצר: \`${p.paths.pdfShort}\`\n- PDF מפורט: \`${p.paths.pdfDetailed}\`\n- MD קצר: \`${p.paths.reportShortMd}\`\n- MD מפורט: \`${p.paths.reportDetailedMd}\`\n- Copilot: \`${p.paths.copilotTurns}\`\n- **מה לבדוק ידנית:** ${p.ownerManualHe}\n`,
      ),
    ].join("\n"),
    "utf8",
  );

  fs.writeFileSync(path.join(outDir, "PDF_RICHNESS_AUDIT.json"), JSON.stringify({ rows: pdfRichnessRows }, null, 2), "utf8");
  fs.writeFileSync(
    path.join(outDir, "PDF_RICHNESS_AUDIT.md"),
    [
      "# PDF_RICHNESS_AUDIT",
      "",
      `- סה״כ שורות: ${pdfRichnessRows.length}`,
      `- detailedRicherThanShort=false: **${pdfRichnessRows.filter((r) => !r.detailedRicherThanShort).length}**`,
      "",
    ].join("\n"),
    "utf8",
  );

  fs.writeFileSync(path.join(outDir, "COPILOT_QUALITY_AUDIT.json"), JSON.stringify({ rows: copilotRows }, null, 2), "utf8");
  fs.writeFileSync(
    path.join(outDir, "COPILOT_QUALITY_AUDIT.md"),
    ["# COPILOT_QUALITY_AUDIT", "", `- turn rows: ${copilotRows.length}`, ""].join("\n"),
    "utf8",
  );

  fs.writeFileSync(path.join(outDir, "RECOMMENDATION_SEMANTIC_AUDIT.json"), JSON.stringify({ rows: recommendationRows }, null, 2), "utf8");
  fs.writeFileSync(
    path.join(outDir, "RECOMMENDATION_SEMANTIC_AUDIT.md"),
    ["# RECOMMENDATION_SEMANTIC_AUDIT", "", `- recommendation row projections: ${recommendationRows.length}`, ""].join("\n"),
    "utf8",
  );

  const matrixLines = [];
  const subjects = ["hebrew", "math", "english", "science", "geometry", "moledet_geography"];
  const grades = ["g1", "g2", "g3", "g4", "g5", "g6"];
  matrixLines.push("# SUBJECT_GRADE_REVIEW_MATRIX", "", "| grade | " + subjects.join(" | ") + " |", "|---|" + subjects.map(() => "---").join("|") + "|");
  for (const g of grades) {
    const cells = subjects.map((subj) => {
      const sid = studentIds.find((id) => id.endsWith(`_${g}_${subj}`));
      if (!sid) return "—";
      const sc = perStudent.find((x) => x.studentId === sid)?.suspicionScore ?? 0;
      return `[\`${sid}\`](${relPackToOracle}/students/${sid}/) (${sc})`;
    });
    matrixLines.push(`| ${g} | ${cells.join(" | ")} |`);
  }
  fs.writeFileSync(path.join(outDir, "SUBJECT_GRADE_REVIEW_MATRIX.md"), matrixLines.join("\n"), "utf8");

  const idxLines = [
    "# STUDENT_REVIEW_INDEX",
    "",
    "| studentId | score | flags |",
    "|---|---:|---|",
    ...perStudent.map((r) => `| ${r.studentId} | ${r.suspicionScore} | ${r.flags.join("; ")} |`),
    "",
  ];
  fs.writeFileSync(path.join(outDir, "STUDENT_REVIEW_INDEX.md"), idxLines.join("\n"), "utf8");

  fs.writeFileSync(path.join(outDir, "ORACLE_FAILURES.md"), ["# ORACLE_FAILURES", "", ...failures.slice(0, 500).map((f) => `- **${f.code}** — ${JSON.stringify(f).slice(0, 500)}`)].join("\n"), "utf8");
  fs.writeFileSync(path.join(outDir, "ORACLE_FAILURES.json"), JSON.stringify({ failures }, null, 2), "utf8");
  fs.writeFileSync(path.join(outDir, "ORACLE_WARNINGS.md"), ["# ORACLE_WARNINGS", "", ...warnings.slice(0, 800).map((w) => `- **${w.code}** — ${JSON.stringify(w).slice(0, 400)}`)].join("\n"), "utf8");
  fs.writeFileSync(path.join(outDir, "ORACLE_WARNINGS.json"), JSON.stringify({ warnings }, null, 2), "utf8");

  console.log("Phase9 oracle OK", outDir);
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
