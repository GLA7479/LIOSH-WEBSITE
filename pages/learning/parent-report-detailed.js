import { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import { useIOSViewportFix } from "../../hooks/useIOSViewportFix";
import { generateDetailedParentReport } from "../../utils/detailed-parent-report";
import { improvingDiagnosticsDisplayLabelHe } from "../../utils/learning-patterns-analysis";

function SectionCard({ title, children, className = "", compact = false }) {
  return (
    <section
      className={`pr-detailed-section rounded-xl border border-white/20 bg-black/30 shadow-sm mb-5 md:mb-6 overflow-hidden ${
        compact ? "pr-detailed-section--compact" : ""
      } ${className}`}
    >
      <div className="pr-detailed-section-head px-3 md:px-5 py-2.5 md:py-3 border-b border-white/15 bg-white/[0.06]">
        <h2 className="pr-detailed-section-title text-base md:text-lg font-extrabold tracking-tight text-white m-0">
          {title}
        </h2>
      </div>
      <div className="pr-detailed-section-inner px-3 md:px-5 py-3 md:py-4">{children}</div>
    </section>
  );
}

function Bullets({ items, className = "" }) {
  if (!items?.length)
    return <p className={`pr-detailed-muted text-sm ${className}`.trim()}>אין נתונים להצגה.</p>;
  return (
    <ul
      className={`pr-detailed-body-text list-disc pr-5 space-y-1.5 text-sm md:text-base text-white/[0.88] leading-relaxed ${className}`.trim()}
    >
      {items.map((t, i) => (
        <li key={i}>{t}</li>
      ))}
    </ul>
  );
}

/** בלוק היררכי לפי סוג (מסך + הדפסה) — רק מחלקות, אותו תוכן */
function TierBlock({ tier, title, children }) {
  return (
    <div className={`pr-detailed-tier-${tier}`}>
      <h4 className="pr-detailed-subheading">{title}</h4>
      <div className="pr-detailed-tier-inner">{children}</div>
    </div>
  );
}

/** מצב תצוגה: אותו payload, תצוגה מלאה או תמצית להדפסה */
function normalizeDisplayMode(raw) {
  return raw === "summary" ? "summary" : "full";
}

/** query נקי לשיתוף/הדפסה — רק פרמטרים שמוכרים לדף המקיף */
function buildDetailedReportQuery(router, mode) {
  const next = normalizeDisplayMode(mode);
  const q = {};
  const period = router.query?.period;
  if (typeof period === "string" && period) q.period = period;
  const start = router.query?.start;
  const end = router.query?.end;
  if (typeof start === "string" && start) q.start = start;
  if (typeof end === "string" && end) q.end = end;
  if (next === "summary") q.mode = "summary";
  return q;
}

/** פירוט מקוצר למקצוע — רק שדות מה־payload הקיים (ללא מנוע נפרד) */
function SubjectSummaryBlock({ sp }) {
  const ex = Array.isArray(sp.excellence) ? sp.excellence.slice(0, 2) : [];
  const weak = Array.isArray(sp.topWeaknesses) ? sp.topWeaknesses.slice(0, 2) : [];
  return (
    <div className="pr-detailed-summary-subject rounded-xl border border-white/18 bg-black/25 overflow-hidden">
      <div className="pr-detailed-subject-header px-3 md:px-4 py-2.5 border-b border-white/15 bg-white/[0.05]">
        <h3 className="pr-detailed-subject-title text-base md:text-lg font-bold text-white m-0 tracking-tight">
          {sp.subjectLabelHe}
        </h3>
      </div>
      <div className="pr-detailed-subject-inner px-3 md:px-4 py-3 space-y-3">
        <div className="pr-detailed-subject-summary">
          {sp.summaryHe ? (
            <p className="pr-detailed-body-text text-sm leading-relaxed m-0">{sp.summaryHe}</p>
          ) : (
            <p className="pr-detailed-muted text-sm m-0">אין סיכום טקסטואלי למקצוע זה בטווח.</p>
          )}
        </div>
        {ex.length ? (
          <TierBlock tier="excellence" title="הצטיינות יציבה (עד 2)">
            <ul className="pr-detailed-body-text text-sm space-y-1 m-0 list-none pr-0">
              {ex.map((x) => (
                <li key={x.id} className="pr-0">
                  {x.labelHe} — {x.accuracy}% ({x.questions} שאלות)
                </li>
              ))}
            </ul>
          </TierBlock>
        ) : null}
        {weak.length ? (
          <TierBlock tier="attention" title="תחומים הדורשים תשומת לב (עד 2)">
            <ul className="pr-detailed-body-text text-sm space-y-1 m-0 list-none pr-0">
              {weak.map((w) => (
                <li key={w.id} className="pr-0">
                  {w.labelHe}
                  {typeof w.mistakeCount === "number" ? ` (${w.mistakeCount} טעויות דומות)` : ""}
                </li>
              ))}
            </ul>
          </TierBlock>
        ) : null}
        {sp.parentActionHe ? (
          <div className="pr-detailed-callout-action rounded-lg border px-3 py-2.5">
            <span className="pr-detailed-callout-label">פעולה לבית</span>
            <p className="pr-detailed-body-text text-sm m-0 mt-1 leading-relaxed">{sp.parentActionHe}</p>
          </div>
        ) : null}
        {sp.nextWeekGoalHe ? (
          <div className="pr-detailed-callout-goal rounded-lg border px-3 py-2.5">
            <span className="pr-detailed-callout-label">יעד לתקופה הבאה</span>
            <p className="pr-detailed-body-text text-sm m-0 mt-1 leading-relaxed">{sp.nextWeekGoalHe}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function ParentReportDetailedPage() {
  useIOSViewportFix();
  const router = useRouter();
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [displayMode, setDisplayMode] = useState("full");

  const queryPeriod = typeof router.query.period === "string" ? router.query.period : "week";
  const queryStart = typeof router.query.start === "string" ? router.query.start : null;
  const queryEnd = typeof router.query.end === "string" ? router.query.end : null;

  const backHref = useMemo(() => {
    const q = { period: queryPeriod };
    if (queryPeriod === "custom" && queryStart && queryEnd) {
      q.start = queryStart;
      q.end = queryEnd;
    }
    return { pathname: "/learning/parent-report", query: q };
  }, [queryPeriod, queryStart, queryEnd]);

  useEffect(() => {
    if (!router.isReady || typeof window === "undefined") return undefined;
    const name = localStorage.getItem("mleo_player_name") || "";
    if (!name) {
      setPayload(null);
      setLoading(false);
      return undefined;
    }
    let p = queryPeriod;
    let cs = null;
    let ce = null;
    if (p === "custom" && queryStart && queryEnd) {
      cs = queryStart;
      ce = queryEnd;
    } else if (p !== "week" && p !== "month" && p !== "custom") {
      p = "week";
    }
    if (p === "custom" && (!cs || !ce)) {
      p = "week";
      cs = null;
      ce = null;
    }
    const data = generateDetailedParentReport(name, p, cs, ce);
    setPayload(data);
    setLoading(false);
    return undefined;
  }, [router.isReady, queryPeriod, queryStart, queryEnd]);

  useEffect(() => {
    if (!router.isReady) return undefined;
    setDisplayMode(normalizeDisplayMode(router.query.mode));
    return undefined;
  }, [router.isReady, router.query.mode]);

  const setModeInUrl = useCallback(
    (mode) => {
      const next = normalizeDisplayMode(mode);
      const q = buildDetailedReportQuery(router, next);
      router.replace({ pathname: "/learning/parent-report-detailed", query: q }, undefined, {
        shallow: true,
      });
      setDisplayMode(next);
    },
    [router]
  );

  const printWithMode = useCallback(
    (mode) => {
      const next = normalizeDisplayMode(mode);
      setDisplayMode(next);
      const q = buildDetailedReportQuery(router, next);
      router.replace({ pathname: "/learning/parent-report-detailed", query: q }, undefined, {
        shallow: true,
      });
      window.setTimeout(() => window.print(), 120);
    },
    [router]
  );

  const ModeToggle = ({ className = "" }) => (
    <div
      className={`no-pdf flex flex-wrap items-center justify-center gap-2 ${className}`}
      role="group"
      aria-label="מצב תצוגת דוח"
    >
      <button
        type="button"
        onClick={() => setModeInUrl("full")}
        className={`inline-flex px-4 py-2 rounded-lg text-sm font-bold border transition-all ${
          displayMode === "full"
            ? "bg-sky-600/80 border-sky-300/60 text-white"
            : "bg-white/5 border-white/20 text-white/80 hover:bg-white/10"
        }`}
      >
        דוח מלא
      </button>
      <button
        type="button"
        onClick={() => setModeInUrl("summary")}
        className={`inline-flex px-4 py-2 rounded-lg text-sm font-bold border transition-all ${
          displayMode === "summary"
            ? "bg-amber-600/75 border-amber-300/55 text-white"
            : "bg-white/5 border-white/20 text-white/80 hover:bg-white/10"
        }`}
      >
        תקציר להדפסה
      </button>
    </div>
  );

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-b from-[#0a0f1d] to-[#141928] flex items-center justify-center">
          <div className="text-white text-lg">טוען דוח מקיף…</div>
        </div>
      </Layout>
    );
  }

  const pi = payload?.periodInfo;
  const noPlayer =
    typeof window !== "undefined" && !loading && !localStorage.getItem("mleo_player_name");

  return (
    <Layout>
      <Head>
        <title>דוח מקיף לתקופה — LIOSH</title>
        <style>{`
          .pr-detailed-page {
            --pr-h1: 1.35rem;
            --pr-h2: 1.05rem;
            --pr-h3: 0.98rem;
            --pr-h4: 0.78rem;
            --pr-body: 0.875rem;
            --pr-muted: 0.8rem;
          }

          .pr-detailed-subheading {
            margin: 0 0 0.4rem 0;
            padding: 0 0 0.2rem 0;
            font-size: var(--pr-h4);
            font-weight: 800;
            letter-spacing: 0.03em;
            text-transform: none;
            border-bottom: 1px solid rgba(255,255,255,0.12);
          }

          .pr-detailed-body-text { line-height: 1.55; }
          .pr-detailed-muted { color: rgba(255,255,255,0.58); line-height: 1.5; }
          .pr-detailed-mini-heading { letter-spacing: 0.02em; }

          .pr-detailed-layout-summary .pr-detailed-section {
            box-shadow: none;
          }
          .pr-detailed-layout-summary .pr-detailed-doc-header {
            margin-bottom: 1rem;
          }

          .pr-detailed-section--compact .pr-detailed-section-inner { padding-top: 0.65rem; padding-bottom: 0.65rem; }
          .pr-detailed-section--compact .pr-detailed-section-head { padding-top: 0.45rem; padding-bottom: 0.45rem; }

          #parent-report-detailed-print[data-display-mode="summary"] .pr-detailed-section { margin-bottom: 0.85rem; }
          #parent-report-detailed-print[data-display-mode="summary"] .pr-detailed-section-inner { padding: 0.75rem 0.9rem; }
          #parent-report-detailed-print[data-display-mode="summary"] .pr-detailed-subject-summary { font-size: 0.9rem; }

          .pr-detailed-tier-excellence {
            border-radius: 0.55rem;
            border: 1px solid rgba(167, 139, 250, 0.4);
            background: linear-gradient(160deg, rgba(76, 29, 149, 0.28), rgba(15, 23, 42, 0.55));
            padding: 0.65rem 0.85rem;
            margin-top: 0.35rem;
          }
          .pr-detailed-tier-excellence .pr-detailed-subheading { color: #e9d5ff; border-bottom-color: rgba(196, 181, 253, 0.35); }

          .pr-detailed-tier-strength {
            border-radius: 0.55rem;
            border: 1px solid rgba(52, 211, 153, 0.35);
            background: linear-gradient(160deg, rgba(6, 78, 59, 0.35), rgba(15, 23, 42, 0.5));
            padding: 0.65rem 0.85rem;
            margin-top: 0.35rem;
          }
          .pr-detailed-tier-strength .pr-detailed-subheading { color: #a7f3d0; border-bottom-color: rgba(52, 211, 153, 0.25); }

          .pr-detailed-tier-maintain {
            border-radius: 0.55rem;
            border: 1px solid rgba(56, 189, 248, 0.35);
            background: linear-gradient(160deg, rgba(12, 74, 110, 0.35), rgba(15, 23, 42, 0.5));
            padding: 0.65rem 0.85rem;
            margin-top: 0.35rem;
          }
          .pr-detailed-tier-maintain .pr-detailed-subheading { color: #bae6fd; border-bottom-color: rgba(56, 189, 248, 0.25); }

          .pr-detailed-tier-improving {
            border-radius: 0.55rem;
            border: 1px solid rgba(251, 191, 36, 0.38);
            background: linear-gradient(160deg, rgba(120, 53, 15, 0.32), rgba(15, 23, 42, 0.52));
            padding: 0.65rem 0.85rem;
            margin-top: 0.35rem;
          }
          .pr-detailed-tier-improving .pr-detailed-subheading { color: #fde68a; border-bottom-color: rgba(251, 191, 36, 0.28); }

          .pr-detailed-tier-attention {
            border-radius: 0.55rem;
            border: 1px solid rgba(248, 113, 113, 0.42);
            background: linear-gradient(160deg, rgba(127, 29, 29, 0.32), rgba(15, 23, 42, 0.52));
            padding: 0.65rem 0.85rem;
            margin-top: 0.35rem;
          }
          .pr-detailed-tier-attention .pr-detailed-subheading { color: #fecaca; border-bottom-color: rgba(248, 113, 113, 0.3); }

          .pr-detailed-tier-examples {
            border-radius: 0.5rem;
            border: 1px solid rgba(148, 163, 184, 0.25);
            background: rgba(15, 23, 42, 0.45);
            padding: 0.55rem 0.75rem;
            margin-top: 0.35rem;
          }
          .pr-detailed-tier-examples .pr-detailed-subheading { color: rgba(226, 232, 240, 0.85); border-bottom-color: rgba(148, 163, 184, 0.2); }

          .pr-detailed-callout-action {
            border-color: rgba(250, 204, 21, 0.35);
            background: rgba(66, 32, 6, 0.35);
          }
          .pr-detailed-callout-goal {
            border-color: rgba(251, 191, 36, 0.3);
            background: rgba(69, 26, 3, 0.28);
          }
          .pr-detailed-callout-label {
            display: block;
            font-size: 0.68rem;
            font-weight: 800;
            letter-spacing: 0.06em;
            color: rgba(253, 230, 138, 0.95);
            text-transform: uppercase;
          }

          .pr-detailed-topic-rec-block { margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid rgba(255,255,255,0.1); }
          .pr-detailed-topic-rec-head {
            font-size: 0.72rem;
            font-weight: 800;
            letter-spacing: 0.04em;
            color: rgba(165, 243, 252, 0.95);
            margin: 0 0 0.5rem 0;
          }

          .pr-detailed-topic-nextstep-card {
            border-radius: 0.55rem;
            border: 1px solid rgba(34, 211, 238, 0.32);
            background: linear-gradient(165deg, rgba(22, 78, 99, 0.4), rgba(15, 23, 42, 0.65));
            padding: 0.65rem 0.85rem;
          }
          .pr-detailed-topic-metrics {
            font-size: 0.68rem;
            line-height: 1.45;
            color: rgba(207, 250, 254, 0.82);
            margin: 0 0 0.45rem 0;
          }
          .pr-detailed-topic-reason { font-size: 0.84rem; line-height: 1.5; color: rgba(255,255,255,0.9); margin: 0 0 0.45rem 0; }
          .pr-detailed-topic-parent {
            font-size: 0.82rem;
            line-height: 1.48;
            color: rgba(224, 242, 254, 0.95);
            margin: 0 0 0.35rem 0;
            padding: 0.35rem 0.45rem;
            border-radius: 0.35rem;
            background: rgba(15, 23, 42, 0.45);
            border-right: 3px solid rgba(56, 189, 248, 0.55);
          }
          .pr-detailed-topic-student {
            font-size: 0.82rem;
            line-height: 1.48;
            color: rgba(209, 250, 229, 0.95);
            margin: 0;
            padding: 0.35rem 0.45rem;
            border-radius: 0.35rem;
            background: rgba(15, 23, 42, 0.45);
            border-right: 3px solid rgba(52, 211, 153, 0.5);
          }
          .pr-detailed-topic-badge {
            font-size: 0.65rem;
            font-weight: 800;
            padding: 0.15rem 0.45rem;
            border-radius: 0.35rem;
            border: 1px solid rgba(103, 232, 249, 0.45);
            color: #ecfeff;
            background: rgba(8, 47, 73, 0.55);
            white-space: normal;
            max-width: 11rem;
            text-align: right;
          }

          @media print {
            .pr-detailed-avoid-split {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }
            .pr-detailed-subheading {
              break-after: avoid !important;
              page-break-after: avoid !important;
            }

            body {
              background: white !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body * {
              visibility: hidden !important;
            }
            #parent-report-detailed-print,
            #parent-report-detailed-print * {
              visibility: visible !important;
            }
            #parent-report-detailed-print {
              position: absolute !important;
              inset: 0 auto auto 0 !important;
              top: 0 !important;
              left: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 8mm 6mm !important;
              background: #fafafa !important;
              box-shadow: none !important;
              font-size: 9.6pt;
              line-height: 1.48;
              color: #1c1917 !important;
            }
            #parent-report-detailed-print[data-display-mode="full"] {
              padding: 7mm 5.5mm !important;
              font-size: 9.35pt;
            }
            #parent-report-detailed-print[data-display-mode="summary"] {
              padding: 6mm 5mm !important;
              font-size: 9.45pt;
            }

            #parent-report-detailed-print h1 {
              font-size: 16.5pt !important;
              color: #020617 !important;
              margin: 0 0 4px 0 !important;
            }
            #parent-report-detailed-print .pr-detailed-section-title {
              font-size: 12pt !important;
              font-weight: 900 !important;
              color: #0f172a !important;
            }
            #parent-report-detailed-print .pr-detailed-subject-title {
              font-size: 12pt !important;
              font-weight: 900 !important;
              color: #0f172a !important;
            }
            #parent-report-detailed-print .pr-detailed-subheading {
              font-size: 9pt !important;
              font-weight: 800 !important;
              color: #1e293b !important;
              border-bottom-color: #cbd5e1 !important;
            }
            #parent-report-detailed-print .pr-detailed-body-text,
            #parent-report-detailed-print .pr-detailed-tier-inner li {
              color: #1c1917 !important;
            }
            #parent-report-detailed-print .pr-detailed-muted {
              color: #44403c !important;
            }
            #parent-report-detailed-print .pr-detailed-mode-hint {
              color: #92400e !important;
              font-weight: 800 !important;
            }
            #parent-report-detailed-print .pr-detailed-future-compare {
              color: #44403c !important;
              background: #f5f5f4 !important;
              border: 1px solid #d6d3d1 !important;
            }

            #parent-report-detailed-print .pr-detailed-section {
              background: #fff !important;
              border: 1px solid #d4d4d8 !important;
              margin-bottom: 10px !important;
              box-shadow: 0 1px 0 rgba(0,0,0,0.04) !important;
              break-inside: auto !important;
              page-break-inside: auto !important;
            }
            #parent-report-detailed-print .pr-detailed-section-head {
              background: #f4f4f5 !important;
              border-bottom: 1px solid #d4d4d8 !important;
            }
            #parent-report-detailed-print .pr-detailed-section--compact .pr-detailed-section-inner {
              padding: 6px 9px !important;
            }
            #parent-report-detailed-print .pr-detailed-section--compact .pr-detailed-section-head {
              padding: 5px 9px !important;
            }

            #parent-report-detailed-print .pr-detailed-subject-block {
              background: transparent !important;
              border: none !important;
              box-shadow: none !important;
              border-radius: 0 !important;
              overflow: visible !important;
              break-inside: auto !important;
              page-break-inside: auto !important;
              margin-bottom: 14px !important;
            }
            #parent-report-detailed-print .pr-detailed-subject-header {
              background: transparent !important;
              border: none !important;
              border-bottom: 2px solid #334155 !important;
              padding: 2px 0 8px 0 !important;
            }
            #parent-report-detailed-print .pr-detailed-subject-inner {
              padding: 10px 0 0 0 !important;
            }

            #parent-report-detailed-print .pr-detailed-subject-summary,
            #parent-report-detailed-print .pr-detailed-tier-excellence,
            #parent-report-detailed-print .pr-detailed-tier-strength,
            #parent-report-detailed-print .pr-detailed-tier-maintain,
            #parent-report-detailed-print .pr-detailed-tier-improving,
            #parent-report-detailed-print .pr-detailed-tier-attention,
            #parent-report-detailed-print .pr-detailed-tier-examples,
            #parent-report-detailed-print .pr-detailed-callout-action,
            #parent-report-detailed-print .pr-detailed-callout-goal,
            #parent-report-detailed-print .pr-detailed-topic-nextstep-card {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
              border-radius: 6px !important;
              padding: 8px 10px !important;
              margin-bottom: 8px !important;
            }

            #parent-report-detailed-print .pr-detailed-subject-summary {
              background: #ffffff !important;
              border: 1px solid #d6d3d1 !important;
              color: #1c1917 !important;
            }

            #parent-report-detailed-print .pr-detailed-tier-excellence {
              background: linear-gradient(135deg, #faf5ff 0%, #f0fdf4 55%, #f5f3ff 100%) !important;
              border: 1.5px solid #6d28d9 !important;
              border-right: 4px solid #6d28d9 !important;
              color: #1e1b4b !important;
            }
            #parent-report-detailed-print .pr-detailed-tier-strength {
              background: #ecfdf5 !important;
              border: 1.5px solid #047857 !important;
              border-right: 4px solid #059669 !important;
              color: #064e3b !important;
            }
            #parent-report-detailed-print .pr-detailed-tier-maintain {
              background: #eff6ff !important;
              border: 1.5px solid #0369a1 !important;
              border-right: 4px solid #0284c7 !important;
              color: #0c4a6e !important;
            }
            #parent-report-detailed-print .pr-detailed-tier-improving {
              background: #fffbeb !important;
              border: 1.5px solid #b45309 !important;
              border-right: 4px solid #d97706 !important;
              color: #78350f !important;
            }
            #parent-report-detailed-print .pr-detailed-tier-attention {
              background: #fef2f2 !important;
              border: 1.5px solid #b91c1c !important;
              border-right: 4px solid #dc2626 !important;
              color: #7f1d1d !important;
            }
            #parent-report-detailed-print .pr-detailed-tier-examples {
              background: #f1f5f9 !important;
              border: 1.5px solid #64748b !important;
              border-right: 4px solid #94a3b8 !important;
              color: #334155 !important;
            }

            #parent-report-detailed-print .pr-detailed-tier-excellence .pr-detailed-subheading { color: #5b21b6 !important; border-bottom-color: #ddd6fe !important; }
            #parent-report-detailed-print .pr-detailed-tier-strength .pr-detailed-subheading { color: #047857 !important; border-bottom-color: #a7f3d0 !important; }
            #parent-report-detailed-print .pr-detailed-tier-maintain .pr-detailed-subheading { color: #0369a1 !important; border-bottom-color: #bae6fd !important; }
            #parent-report-detailed-print .pr-detailed-tier-improving .pr-detailed-subheading { color: #b45309 !important; border-bottom-color: #fde68a !important; }
            #parent-report-detailed-print .pr-detailed-tier-attention .pr-detailed-subheading { color: #b91c1c !important; border-bottom-color: #fecaca !important; }
            #parent-report-detailed-print .pr-detailed-tier-examples .pr-detailed-subheading { color: #334155 !important; }

            #parent-report-detailed-print .pr-detailed-callout-action {
              background: #fffbeb !important;
              border: 1.5px solid #ca8a04 !important;
            }
            #parent-report-detailed-print .pr-detailed-callout-goal {
              background: #fff7ed !important;
              border: 1.5px solid #ea580c !important;
            }
            #parent-report-detailed-print .pr-detailed-callout-label { color: #713f12 !important; }

            #parent-report-detailed-print .pr-detailed-topic-rec-block {
              margin-top: 6px !important;
              padding-top: 0 !important;
              border-top: none !important;
              background: transparent !important;
              break-inside: auto !important;
              page-break-inside: auto !important;
            }
            #parent-report-detailed-print .pr-detailed-topic-rec-head {
              color: #0f766e !important;
              font-weight: 800 !important;
              break-after: avoid !important;
              page-break-after: avoid !important;
              margin: 0 0 6px 0 !important;
            }
            #parent-report-detailed-print .pr-detailed-topic-nextstep-card {
              background: linear-gradient(180deg, #f0fdfa 0%, #f8fafc 100%) !important;
              border: 1.5px solid #0f766e !important;
              border-right: 4px solid #14b8a6 !important;
            }
            #parent-report-detailed-print .pr-detailed-topic-metrics { color: #115e59 !important; }
            #parent-report-detailed-print .pr-detailed-topic-reason { color: #134e4a !important; }
            #parent-report-detailed-print .pr-detailed-topic-parent {
              background: #f8fafc !important;
              border-right-color: #0284c7 !important;
              color: #0f172a !important;
            }
            #parent-report-detailed-print .pr-detailed-topic-student {
              background: #f8fafc !important;
              border-right-color: #059669 !important;
              color: #0f172a !important;
            }
            #parent-report-detailed-print .pr-detailed-topic-badge {
              background: #ccfbf1 !important;
              border-color: #0d9488 !important;
              color: #134e4a !important;
            }

            #parent-report-detailed-print .pr-detailed-summary-subject {
              background: transparent !important;
              border: none !important;
              box-shadow: none !important;
              border-radius: 0 !important;
              overflow: visible !important;
              break-inside: auto !important;
              page-break-inside: auto !important;
              margin-bottom: 12px !important;
            }
            #parent-report-detailed-print .pr-detailed-summary-subject .pr-detailed-subject-header {
              background: transparent !important;
              border: none !important;
              border-bottom: 2px solid #334155 !important;
              padding: 2px 0 8px 0 !important;
            }
            #parent-report-detailed-print .pr-detailed-summary-subject .pr-detailed-subject-inner {
              padding: 10px 0 0 0 !important;
            }

            #parent-report-detailed-print .pr-detailed-mini-heading {
              color: #1e293b !important;
              font-weight: 800 !important;
              break-after: avoid !important;
              page-break-after: avoid !important;
            }
            #parent-report-detailed-print .pr-detailed-doc-title {
              color: #020617 !important;
            }

            #parent-report-detailed-print table {
              border-collapse: collapse !important;
              break-inside: auto !important;
              page-break-inside: auto !important;
            }
            #parent-report-detailed-print tr { break-inside: auto !important; page-break-inside: auto !important; }
            #parent-report-detailed-print th,
            #parent-report-detailed-print td {
              border: 1px solid #a8a29e !important;
              padding: 5px 7px !important;
              color: #1c1917 !important;
            }
            #parent-report-detailed-print thead {
              background: #e7e5e4 !important;
            }

            #parent-report-detailed-print[data-display-mode="summary"] .pr-detailed-section { margin-bottom: 7px !important; }
            #parent-report-detailed-print[data-display-mode="summary"] .pr-detailed-summary-subject { margin-bottom: 8px !important; }

            .no-pdf {
              display: none !important;
            }
          }
        `}</style>
      </Head>
      <div
        className={`pr-detailed-page min-h-screen bg-gradient-to-b from-[#0a0f1d] to-[#141928] text-white p-3 md:p-6 ${
          payload ? `pr-detailed-layout-${displayMode}` : ""
        }`}
        dir="rtl"
        style={{
          paddingTop: "calc(var(--head-h, 56px) - 6px)",
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)",
        }}
      >
        <div className="max-w-4xl mx-auto w-full min-w-0 overflow-x-hidden">
          <div className="no-pdf flex flex-col gap-3 mb-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link
                href={backHref}
                className="inline-flex px-4 py-2 rounded-lg text-sm font-bold bg-white/10 border border-white/20 hover:bg-white/20 text-white transition-all"
              >
                ← חזרה לדוח המקוצר
              </Link>
            </div>
            <ModeToggle />
          </div>

          {noPlayer ? (
            <p className="text-center text-white/80">
              לא נמצא שם שחקן. הזן שם בדף הדוח הרגיל או התחבר מחדש.
            </p>
          ) : !payload ? (
            <p className="text-center text-white/80">לא ניתן לטעון את הדוח המקיף.</p>
          ) : (
            <>
              <div
                id="parent-report-detailed-print"
                data-display-mode={displayMode}
                className={displayMode === "summary" ? "pr-detailed-print-root pr-detailed-print-root--summary" : "pr-detailed-print-root pr-detailed-print-root--full"}
              >
                {/* A */}
                <header className="pr-detailed-doc-header mb-6 text-center border-b border-white/15 pb-4">
                  <h1 className="pr-detailed-doc-title text-2xl md:text-3xl font-black text-white mb-1 tracking-tight">
                    דוח מקיף לתקופה
                  </h1>
                  <p className="pr-detailed-mode-hint text-xs font-semibold text-amber-200/90 mb-1">
                    {displayMode === "summary" ? "תקציר להדפסה" : "דוח מלא"}
                  </p>
                  <p className="pr-detailed-body-text text-white/85 text-sm md:text-base">{pi.playerName}</p>
                  <p className="pr-detailed-muted text-sm mt-2">
                    טווח תאריכים: {pi.startDateLabelHe} – {pi.endDateLabelHe}
                    <span className="text-white/40 mx-1">|</span>
                    מצב תקופה:{" "}
                    {pi.period === "custom" ? "תאריכים מותאמים" : pi.period === "month" ? "חודש" : "שבוע"}
                  </p>
                </header>

                {/* B */}
                <SectionCard title="תקציר מנהלים" compact={displayMode === "summary"}>
                  <div className="space-y-4">
                    <div>
                      <h4 className="pr-detailed-subheading text-emerald-200/95">חוזקות מרכזיות (עד 3)</h4>
                      <Bullets items={payload.executiveSummary.topStrengthsAcrossHe} />
                    </div>
                    <div>
                      <h4 className="pr-detailed-subheading text-amber-200/95">תחומים מרכזיים לחיזוק (עד 3)</h4>
                      <Bullets items={payload.executiveSummary.topFocusAreasHe} />
                    </div>
                    <div>
                      <h4 className="pr-detailed-subheading text-sky-200/95">מיקוד מומלץ לבית</h4>
                      <p className="pr-detailed-body-text whitespace-pre-line leading-relaxed m-0">
                        {payload.executiveSummary.homeFocusHe}
                      </p>
                    </div>
                  </div>
                </SectionCard>

                {displayMode === "full" ? (
                  <p className="pr-detailed-future-compare text-xs text-white/50 mb-4 leading-relaxed border border-white/10 rounded-lg px-3 py-2 bg-black/15">
                    השוואה לתקופה קודמת תתווסף בהמשך.
                  </p>
                ) : null}

                {/* C */}
                <SectionCard title="תמונת מצב כוללת" compact={displayMode === "summary"}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  <div className="rounded-lg bg-white/5 border border-white/10 p-3 text-center">
                    <div className="text-xs text-white/55 mb-1">זמן כולל</div>
                    <div className="text-xl font-bold text-blue-300">
                      {payload.overallSnapshot.totalTime} דק׳
                    </div>
                  </div>
                  <div className="rounded-lg bg-white/5 border border-white/10 p-3 text-center">
                    <div className="text-xs text-white/55 mb-1">שאלות</div>
                    <div className="text-xl font-bold text-emerald-300">
                      {payload.overallSnapshot.totalQuestions}
                    </div>
                  </div>
                  <div className="rounded-lg bg-white/5 border border-white/10 p-3 text-center">
                    <div className="text-xs text-white/55 mb-1">דיוק כללי</div>
                    <div className="text-xl font-bold text-amber-300">
                      {payload.overallSnapshot.overallAccuracy}%
                    </div>
                  </div>
                </div>
                <p className="pr-detailed-mini-heading font-bold text-white/90 mb-2 text-sm mt-1">כיסוי לפי מקצוע</p>
                <div className="overflow-x-auto rounded-lg border border-white/10">
                  <table className="w-full text-sm text-right">
                    <thead>
                      <tr className="border-b border-white/15 bg-white/5">
                        <th className="p-2 font-semibold">מקצוע</th>
                        <th className="p-2 font-semibold">שאלות</th>
                        <th className="p-2 font-semibold">דיוק</th>
                        <th className="p-2 font-semibold">זמן (דק׳)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payload.overallSnapshot.subjectCoverage.map((row) => (
                        <tr key={row.subject} className="border-b border-white/10">
                          <td className="p-2">{row.subjectLabelHe}</td>
                          <td className="p-2">{row.questionCount}</td>
                          <td className="p-2">{row.accuracy}%</td>
                          <td className="p-2">{row.timeMinutes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 grid md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="pr-detailed-mini-heading font-semibold text-white/82 mb-1">מקצועות עם חשיפה מועטה</p>
                    <Bullets items={payload.overallSnapshot.lowExposureSubjectsHe} />
                  </div>
                  <div>
                    <p className="pr-detailed-mini-heading font-semibold text-white/82 mb-1">מקצועות בולטים</p>
                    <Bullets items={payload.overallSnapshot.notableSubjectsHe} />
                  </div>
                </div>
                </SectionCard>

                {/* D — אותו payload; תצוגה מלאה או מקוצרת */}
                {displayMode === "summary" ? (
                  <SectionCard title="פירוט מקוצר לפי מקצוע" compact>
                    <div className="space-y-4">
                      {payload.subjectProfiles.map((sp) => (
                        <SubjectSummaryBlock key={sp.subject} sp={sp} />
                      ))}
                    </div>
                  </SectionCard>
                ) : (
                  <SectionCard title="פירוט לפי מקצוע">
                    <div className="space-y-6">
                      {payload.subjectProfiles.map((sp) => (
                        <div
                          key={sp.subject}
                          className="pr-detailed-subject-block rounded-xl border border-white/18 bg-black/25 overflow-hidden"
                        >
                          <div className="pr-detailed-subject-header px-3 md:px-4 py-2.5 border-b border-white/12 bg-white/[0.05]">
                            <h3 className="pr-detailed-subject-title text-lg font-bold text-white m-0 tracking-tight">
                              {sp.subjectLabelHe}
                            </h3>
                          </div>
                          <div className="pr-detailed-subject-inner px-3 md:px-4 py-3 space-y-3">
                            <div className="pr-detailed-subject-summary">
                              {sp.summaryHe ? (
                                <p className="pr-detailed-body-text text-sm leading-relaxed m-0">{sp.summaryHe}</p>
                              ) : (
                                <p className="pr-detailed-muted text-sm m-0">אין סיכום טקסטואלי למקצוע זה בטווח.</p>
                              )}
                            </div>
                            {sp.excellence?.length ? (
                              <TierBlock tier="excellence" title="הצטיינות היציבה">
                                <ul className="pr-detailed-body-text text-sm space-y-1 m-0 list-none pr-0">
                                  {sp.excellence.map((x) => (
                                    <li key={x.id} className="pr-0">
                                      {x.labelHe} — {x.accuracy}% ({x.questions} שאלות)
                                    </li>
                                  ))}
                                </ul>
                              </TierBlock>
                            ) : null}
                            {sp.topStrengths?.length ? (
                              <TierBlock tier="strength" title="חוזקות מובילות">
                                <ul className="pr-detailed-body-text text-sm space-y-1 m-0 list-none pr-0">
                                  {sp.topStrengths.map((x) => (
                                    <li key={x.id} className="pr-0">
                                      {x.labelHe} — {x.accuracy}% ({x.questions})
                                    </li>
                                  ))}
                                </ul>
                              </TierBlock>
                            ) : null}
                            {sp.maintain?.length ? (
                              <TierBlock tier="maintain" title="מומלץ לשמר">
                                <ul className="pr-detailed-body-text text-sm space-y-1 m-0 list-none pr-0">
                                  {sp.maintain.map((x) => (
                                    <li key={x.id} className="pr-0">
                                      {x.labelHe} — {x.accuracy}% ({x.questions})
                                    </li>
                                  ))}
                                </ul>
                              </TierBlock>
                            ) : null}
                            {sp.improving?.length ? (
                              <TierBlock tier="improving" title="נקודות לשיפור">
                                <ul className="pr-detailed-body-text text-sm space-y-1 m-0 list-none pr-0">
                                  {sp.improving.map((x) => (
                                    <li key={x.id} className="pr-0">
                                      {improvingDiagnosticsDisplayLabelHe(x.labelHe)} — דיוק {x.accuracy}% (
                                      {x.questions} שאלות)
                                    </li>
                                  ))}
                                </ul>
                              </TierBlock>
                            ) : null}
                            {sp.topWeaknesses?.length ? (
                              <TierBlock tier="attention" title="תחומים הדורשים תשומת לב">
                                <ul className="pr-detailed-body-text text-sm space-y-1 m-0 list-none pr-0">
                                  {sp.topWeaknesses.map((w) => (
                                    <li key={w.id} className="pr-0">
                                      {w.labelHe}
                                      {typeof w.mistakeCount === "number"
                                        ? ` (${w.mistakeCount} טעויות דומות)`
                                        : ""}
                                    </li>
                                  ))}
                                </ul>
                              </TierBlock>
                            ) : null}
                            {sp.parentActionHe ? (
                              <div className="pr-detailed-callout-action rounded-lg border px-3 py-2.5">
                                <span className="pr-detailed-callout-label">פעולה לבית</span>
                                <p className="pr-detailed-body-text text-sm m-0 mt-1 leading-relaxed">
                                  {sp.parentActionHe}
                                </p>
                              </div>
                            ) : null}
                            {sp.nextWeekGoalHe ? (
                              <div className="pr-detailed-callout-goal rounded-lg border px-3 py-2.5">
                                <span className="pr-detailed-callout-label">יעד לשבוע</span>
                                <p className="pr-detailed-body-text text-sm m-0 mt-1 leading-relaxed">
                                  {sp.nextWeekGoalHe}
                                </p>
                              </div>
                            ) : null}
                            {sp.evidenceExamples?.length ? (
                              <div className="pr-detailed-tier-examples">
                                <h4 className="pr-detailed-subheading">דוגמאות</h4>
                                <ul className="pr-detailed-muted text-xs space-y-1 m-0 list-none pr-0 leading-relaxed">
                                  {sp.evidenceExamples.map((e, idx) => (
                                    <li key={idx} className="pr-0">
                                      {e.type === "mistake" ? "טעות לדוגמה" : "חיזוק לדוגמה"}
                                      {e.exerciseText ? `: ${String(e.exerciseText).slice(0, 120)}` : ""}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ) : null}

                            {sp.topicRecommendations?.length ? (
                              <div className="pr-detailed-topic-rec-block">
                                <p className="pr-detailed-topic-rec-head">צעד הבא המומלץ לפי נושא (נתוני טווח + טעויות)</p>
                                <div className="space-y-2.5">
                                  {sp.topicRecommendations.map((tr) => (
                                    <div key={tr.topicRowKey} className="pr-detailed-topic-nextstep-card">
                                      <div className="flex flex-wrap items-start justify-between gap-2 mb-1.5">
                                        <span className="pr-detailed-body-text font-bold text-white/95 leading-snug">
                                          {tr.displayName}
                                        </span>
                                        <span className="pr-detailed-topic-badge shrink-0">
                                          {tr.recommendedStepLabelHe}
                                        </span>
                                      </div>
                                      <p className="pr-detailed-topic-metrics">
                                        שליטה {tr.currentMastery}% · יציבות {Math.round(tr.stability * 100)}% · ביטחון{" "}
                                        {Math.round(tr.confidence * 100)}% · {tr.questions} שאלות · דיוק {tr.accuracy}%
                                        {tr.mistakeEventCount > 0
                                          ? ` · ${tr.mistakeEventCount} אירועי טעות בנושא`
                                          : ""}
                                      </p>
                                      <p className="pr-detailed-topic-reason">{tr.recommendedStepReasonHe}</p>
                                      <p className="pr-detailed-topic-parent">
                                        <span className="font-extrabold text-sky-200/95">להורה: </span>
                                        {tr.recommendedParentActionHe}
                                      </p>
                                      <p className="pr-detailed-topic-student">
                                        <span className="font-extrabold text-emerald-200/95">לתלמיד: </span>
                                        {tr.recommendedStudentActionHe}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                )}

                {/* cross insights — part of structure; placed after subjects for flow */}
                <SectionCard title="תובנות חוצות־מקצועות" compact={displayMode === "summary"}>
                <Bullets items={payload.crossSubjectInsights.bulletsHe} />
                {payload.crossSubjectInsights.dataQualityNoteHe ? (
                  <p className="text-sm text-amber-200/90 mt-2">{payload.crossSubjectInsights.dataQualityNoteHe}</p>
                ) : null}
                </SectionCard>

                {/* E */}
                <SectionCard title="פעולות מומלצות לבית" compact={displayMode === "summary"}>
                  <Bullets items={payload.homePlan.itemsHe} />
                </SectionCard>

                {/* F */}
                <SectionCard title="יעד לתקופה הבאה" compact={displayMode === "summary"}>
                  <Bullets items={payload.nextPeriodGoals.itemsHe} />
                </SectionCard>
              </div>

              <div className="no-pdf mt-8 pt-5 border-t border-white/15 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
                <button
                  type="button"
                  onClick={() => printWithMode("full")}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold bg-sky-600/85 border border-sky-400/50 hover:bg-sky-600 text-white transition-all"
                >
                  🖨️ הדפס מלא
                </button>
                <button
                  type="button"
                  onClick={() => printWithMode("summary")}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold bg-amber-600/85 border border-amber-400/50 hover:bg-amber-600 text-white transition-all"
                >
                  🖨️ הדפס תקציר
                </button>
                <Link
                  href={backHref}
                  className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-bold bg-white/10 border border-white/20 hover:bg-white/20 text-white transition-all text-center"
                >
                  חזרה לדוח המקוצר
                </Link>
                <Link
                  href="/learning"
                  className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-bold bg-violet-600/50 border border-violet-300/40 hover:bg-violet-600/65 text-white transition-all text-center"
                >
                  חזרה ללמידה
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
