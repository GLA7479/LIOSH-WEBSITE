import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import { useIOSViewportFix } from "../../hooks/useIOSViewportFix";
import { generateDetailedParentReport } from "../../utils/detailed-parent-report";
import { improvingDiagnosticsDisplayLabelHe } from "../../utils/learning-patterns-analysis";

function SectionCard({ title, children, className = "" }) {
  return (
    <section
      className={`pr-detailed-section pr-detailed-break-avoid rounded-xl border border-white/15 bg-black/25 p-3 md:p-5 mb-4 md:mb-5 ${className}`}
    >
      <h2 className="pr-detailed-section-title text-base md:text-lg font-extrabold text-white/95 border-b border-white/10 pb-2 mb-3">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Bullets({ items }) {
  if (!items?.length) return <p className="text-sm text-white/60">אין נתונים להצגה.</p>;
  return (
    <ul className="list-disc pr-5 space-y-1.5 text-sm md:text-base text-white/85 leading-relaxed">
      {items.map((t, i) => (
        <li key={i}>{t}</li>
      ))}
    </ul>
  );
}

export default function ParentReportDetailedPage() {
  useIOSViewportFix();
  const router = useRouter();
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);

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
          .pr-detailed-break-avoid {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          @media print {
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
              padding: 10mm 12mm !important;
              background: #fff !important;
              box-shadow: none !important;
            }
            #parent-report-detailed-print,
            #parent-report-detailed-print * {
              color: #1a1a1a !important;
            }
            #parent-report-detailed-print .pr-detailed-section-title,
            #parent-report-detailed-print h1,
            #parent-report-detailed-print h2,
            #parent-report-detailed-print h3,
            #parent-report-detailed-print th {
              color: #000 !important;
            }
            #parent-report-detailed-print .pr-detailed-future-compare {
              color: #555 !important;
            }
            #parent-report-detailed-print .pr-detailed-section,
            #parent-report-detailed-print .pr-detailed-subject-block {
              background: #fff !important;
              border: 1px solid #333 !important;
            }
            #parent-report-detailed-print .pr-detailed-section-title {
              border-bottom-color: #999 !important;
            }
            #parent-report-detailed-print table {
              border-collapse: collapse !important;
              page-break-inside: avoid;
            }
            #parent-report-detailed-print th,
            #parent-report-detailed-print td {
              border: 1px solid #666 !important;
              padding: 6px 8px !important;
            }
            #parent-report-detailed-print thead {
              background: #f0f0f0 !important;
            }
            .no-pdf {
              display: none !important;
            }
          }
        `}</style>
      </Head>
      <div
        className="min-h-screen bg-gradient-to-b from-[#0a0f1d] to-[#141928] text-white p-3 md:p-6"
        dir="rtl"
        style={{
          paddingTop: "calc(var(--head-h, 56px) - 6px)",
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)",
        }}
      >
        <div className="max-w-3xl mx-auto w-full min-w-0">
          <div className="no-pdf flex flex-wrap items-center justify-between gap-2 mb-4">
            <Link
              href={backHref}
              className="inline-flex px-4 py-2 rounded-lg text-sm font-bold bg-white/10 border border-white/20 hover:bg-white/20 text-white transition-all"
            >
              ← חזרה לדוח המקוצר
            </Link>
          </div>

          {noPlayer ? (
            <p className="text-center text-white/80">
              לא נמצא שם שחקן. הזן שם בדף הדוח הרגיל או התחבר מחדש.
            </p>
          ) : !payload ? (
            <p className="text-center text-white/80">לא ניתן לטעון את הדוח המקיף.</p>
          ) : (
            <>
              <div id="parent-report-detailed-print">
                {/* A */}
                <header className="mb-6 text-center border-b border-white/10 pb-4 pr-detailed-break-avoid">
                  <h1 className="text-2xl md:text-3xl font-black text-white mb-1">דוח מקיף לתקופה</h1>
                  <p className="text-white/80 text-sm md:text-base">{pi.playerName}</p>
                  <p className="text-white/60 text-sm mt-2">
                    טווח תאריכים: {pi.startDateLabelHe} – {pi.endDateLabelHe}
                    <span className="text-white/40 mx-1">|</span>
                    מצב תקופה:{" "}
                    {pi.period === "custom" ? "תאריכים מותאמים" : pi.period === "month" ? "חודש" : "שבוע"}
                  </p>
                </header>

                {/* B */}
                <SectionCard title="תקציר מנהלים">
                  <div className="space-y-3 text-sm md:text-base text-white/85 leading-relaxed">
                    <div>
                      <p className="font-bold text-emerald-200/90 mb-1">חוזקות מרכזיות (עד 3)</p>
                      <Bullets items={payload.executiveSummary.topStrengthsAcrossHe} />
                    </div>
                    <div>
                      <p className="font-bold text-amber-200/90 mb-1">תחומים מרכזיים לחיזוק (עד 3)</p>
                      <Bullets items={payload.executiveSummary.topFocusAreasHe} />
                    </div>
                    <div>
                      <p className="font-bold text-sky-200/90 mb-1">מיקוד מומלץ לבית</p>
                      <p className="text-white/85 whitespace-pre-line leading-relaxed">
                        {payload.executiveSummary.homeFocusHe}
                      </p>
                    </div>
                  </div>
                </SectionCard>

                <p className="pr-detailed-future-compare text-xs text-white/50 mb-4 leading-relaxed border border-white/10 rounded-lg px-3 py-2 bg-black/15">
                  השוואה לתקופה קודמת תתווסף בהמשך.
                </p>

                {/* C */}
                <SectionCard title="תמונת מצב כוללת">
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
                <p className="font-semibold text-white/90 mb-2 text-sm">כיסוי לפי מקצוע</p>
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
                    <p className="font-semibold text-white/80 mb-1">מקצועות עם חשיפה מועטה</p>
                    <Bullets items={payload.overallSnapshot.lowExposureSubjectsHe} />
                  </div>
                  <div>
                    <p className="font-semibold text-white/80 mb-1">מקצועות בולטים</p>
                    <Bullets items={payload.overallSnapshot.notableSubjectsHe} />
                  </div>
                </div>
                </SectionCard>

                {/* D */}
                <SectionCard title="פירוט לפי מקצוע">
                <div className="space-y-5">
                  {payload.subjectProfiles.map((sp) => (
                    <div
                      key={sp.subject}
                      className="pr-detailed-subject-block rounded-lg border border-white/12 bg-black/20 p-3 md:p-4 space-y-2"
                    >
                      <h3 className="text-lg font-bold text-white border-b border-white/10 pb-1">
                        {sp.subjectLabelHe}
                      </h3>
                      {sp.summaryHe ? (
                        <p className="text-sm text-white/80 leading-relaxed">{sp.summaryHe}</p>
                      ) : (
                        <p className="text-sm text-white/45">אין סיכום טקסטואלי למקצוע זה בטווח.</p>
                      )}
                      {sp.excellence?.length ? (
                        <div>
                          <p className="text-xs font-bold text-violet-200 mb-1">הצטיינות היציבה</p>
                          <ul className="text-sm text-white/80 space-y-1">
                            {sp.excellence.map((x) => (
                              <li key={x.id}>
                                {x.labelHe} — {x.accuracy}% ({x.questions} שאלות)
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      {sp.topStrengths?.length ? (
                        <div>
                          <p className="text-xs font-bold text-emerald-200/80 mb-1">חוזקות מובילות</p>
                          <ul className="text-sm text-white/80 space-y-1">
                            {sp.topStrengths.map((x) => (
                              <li key={x.id}>
                                {x.labelHe} — {x.accuracy}% ({x.questions})
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      {sp.maintain?.length ? (
                        <div>
                          <p className="text-xs font-bold text-sky-200/80 mb-1">מומלץ לשמר</p>
                          <ul className="text-sm text-white/80 space-y-1">
                            {sp.maintain.map((x) => (
                              <li key={x.id}>
                                {x.labelHe} — {x.accuracy}% ({x.questions})
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      {sp.improving?.length ? (
                        <div>
                          <p className="text-xs font-bold text-amber-200/80 mb-1">נקודות לשיפור</p>
                          <ul className="text-sm text-white/80 space-y-1">
                            {sp.improving.map((x) => (
                              <li key={x.id}>
                                {improvingDiagnosticsDisplayLabelHe(x.labelHe)} — דיוק {x.accuracy}% (
                                {x.questions} שאלות)
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      {sp.topWeaknesses?.length ? (
                        <div>
                          <p className="text-xs font-bold text-red-200/80 mb-1">תחומים הדורשים תשומת לב</p>
                          <ul className="text-sm text-white/80 space-y-1">
                            {sp.topWeaknesses.map((w) => (
                              <li key={w.id}>
                                {w.labelHe}
                                {typeof w.mistakeCount === "number" ? ` (${w.mistakeCount} טעויות דומות)` : ""}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      {sp.parentActionHe ? (
                        <p className="text-sm text-yellow-100/90">
                          <span className="font-semibold">פעולה לבית: </span>
                          {sp.parentActionHe}
                        </p>
                      ) : null}
                      {sp.nextWeekGoalHe ? (
                        <p className="text-sm text-amber-100/85">
                          <span className="font-semibold">יעד לשבוע: </span>
                          {sp.nextWeekGoalHe}
                        </p>
                      ) : null}
                      {sp.evidenceExamples?.length ? (
                        <div>
                          <p className="text-xs font-bold text-white/60 mb-1">דוגמאות</p>
                          <ul className="text-xs text-white/65 space-y-1">
                            {sp.evidenceExamples.map((e, idx) => (
                              <li key={idx}>
                                {e.type === "mistake" ? "טעות לדוגמה" : "חיזוק לדוגמה"}
                                {e.exerciseText ? `: ${String(e.exerciseText).slice(0, 120)}` : ""}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
                </SectionCard>

                {/* cross insights — part of structure; placed after subjects for flow */}
                <SectionCard title="תובנות חוצות־מקצועות">
                <Bullets items={payload.crossSubjectInsights.bulletsHe} />
                {payload.crossSubjectInsights.dataQualityNoteHe ? (
                  <p className="text-sm text-amber-200/90 mt-2">{payload.crossSubjectInsights.dataQualityNoteHe}</p>
                ) : null}
                </SectionCard>

                {/* E */}
                <SectionCard title="פעולות מומלצות לבית">
                  <Bullets items={payload.homePlan.itemsHe} />
                </SectionCard>

                {/* F */}
                <SectionCard title="יעד לתקופה הבאה">
                  <Bullets items={payload.nextPeriodGoals.itemsHe} />
                </SectionCard>
              </div>

              <div className="no-pdf mt-8 pt-5 border-t border-white/15 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold bg-emerald-600/90 border border-emerald-400/50 hover:bg-emerald-600 text-white transition-all"
                >
                  🖨️ הדפס / 📄 ייצא ל-PDF
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
