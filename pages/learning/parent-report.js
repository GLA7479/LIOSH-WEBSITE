import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { useIOSViewportFix } from "../../hooks/useIOSViewportFix";
import { generateParentReport, getOperationName, getTopicName, getEnglishTopicName, getScienceTopicName, getHebrewTopicName, getMoledetGeographyTopicName, exportReportToPDF } from "../../utils/math-report-generator";
import { useRouter } from "next/router";
import Head from "next/head";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function ParentReport() {
  useIOSViewportFix();
  const router = useRouter();
  const [report, setReport] = useState(null);
  const [period, setPeriod] = useState('week');
  const [playerName, setPlayerName] = useState("");
  const [loading, setLoading] = useState(true);
  const [customDates, setCustomDates] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [appliedStartDate, setAppliedStartDate] = useState("");
  const [appliedEndDate, setAppliedEndDate] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  // פונקציה לפרמט תאריך מ-YYYY-MM-DD ל-DD/MM/YYYY
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`; // DD/MM/YYYY
    }
    return dateStr;
  };

  // בדיקת גודל מסך
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const name = localStorage.getItem("mleo_player_name") || "";
      setPlayerName(name);
      
      // הגדרת תאריכים ברירת מחדל
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const defaultEndDate = today.toISOString().split('T')[0];
      const defaultStartDate = weekAgo.toISOString().split('T')[0];
      setEndDate(defaultEndDate);
      setStartDate(defaultStartDate);
      setAppliedEndDate(defaultEndDate);
      setAppliedStartDate(defaultStartDate);
      
      if (name) {
        const data = generateParentReport(name, period);
        setReport(data);
      }
      setLoading(false);
    }
  }, []);

  const handleShowReport = () => {
    if (startDate && endDate && startDate <= endDate) {
      setAppliedStartDate(startDate);
      setAppliedEndDate(endDate);
    } else {
      alert("אנא בחר תאריכים תקינים");
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && playerName && !loading) {
      let data;
      if (customDates && appliedStartDate && appliedEndDate) {
        data = generateParentReport(playerName, 'custom', appliedStartDate, appliedEndDate);
      } else if (!customDates) {
        data = generateParentReport(playerName, period);
      }
      if (data) {
        setReport(data);
      }
    }
  }, [period, customDates, appliedStartDate, appliedEndDate, playerName, loading]);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-b from-[#0a0f1d] to-[#141928] flex items-center justify-center">
          <div className="text-white text-xl">טוען דוח...</div>
        </div>
      </Layout>
    );
  }

  if (!report || !report.summary || (report.summary.totalQuestions === 0 && report.summary.totalTimeMinutes === 0)) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-b from-[#0a0f1d] to-[#141928] flex items-center justify-center p-4" dir="rtl">
          <div className="text-center text-white max-w-md w-full">
            {/* כפתור BACK */}
            <div className="mb-4 text-left">
              <button
                onClick={() => {
                  if (typeof window !== "undefined" && window.history.length > 1) {
                    router.back();
                  } else {
                    router.push("/learning");
                  }
                }}
                className="px-4 py-2 rounded-lg text-sm font-bold bg-white/10 border border-white/20 hover:bg-white/20 text-white transition-all"
              >
                BACK
              </button>
            </div>
            
            <div className="text-4xl mb-4">📊</div>
            <h1 className="text-2xl font-bold mb-2">דוח להורים</h1>
            <p className="text-white/70 mb-4">
              לא נמצאו נתונים לתקופה שנבחרה.
              <br />
              התחל לשחק כדי ליצור דוח.
            </p>
            
            {/* בחירת תקופה גם במסך "אין נתונים" */}
            <div className="mb-4 space-y-2">
              <div className="text-sm text-white/60 mb-2">בחר תקופה:</div>
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => {
                    setCustomDates(false);
                    setPeriod('week');
                    setAppliedStartDate("");
                    setAppliedEndDate("");
                  }}
                  className={`px-3 py-2 rounded-lg font-bold text-xs transition-all ${
                    !customDates && period === 'week'
                      ? "bg-blue-500/80 text-white"
                      : "bg-white/10 text-white/70 hover:bg-white/20"
                  }`}
                >
                  שבוע
                </button>
                <button
                  onClick={() => {
                    setCustomDates(false);
                    setPeriod('month');
                    setAppliedStartDate("");
                    setAppliedEndDate("");
                  }}
                  className={`px-3 py-2 rounded-lg font-bold text-xs transition-all ${
                    !customDates && period === 'month'
                      ? "bg-blue-500/80 text-white"
                      : "bg-white/10 text-white/70 hover:bg-white/20"
                  }`}
                >
                  חודש
                </button>
                <button
                  onClick={() => {
                    setCustomDates(true);
                    setPeriod('custom');
                  }}
                  className={`px-3 py-2 rounded-lg font-bold text-xs transition-all ${
                    customDates
                      ? "bg-blue-500/80 text-white"
                      : "bg-white/10 text-white/70 hover:bg-white/20"
                  }`}
                >
                  תאריכים מותאמים
                </button>
              </div>
              
              {/* בחירת תאריכים מותאמת אישית */}
              {customDates && (
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mt-3 mb-3 p-3 bg-black/20 rounded-lg">
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <label className="text-xs md:text-sm text-white/70 whitespace-nowrap">מתאריך:</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      max={endDate || new Date().toISOString().split('T')[0]}
                      dir="ltr"
                      className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <label className="text-xs md:text-sm text-white/70 whitespace-nowrap">עד תאריך:</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                      max={new Date().toISOString().split('T')[0]}
                      dir="ltr"
                      className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleShowReport();
                    }}
                    disabled={!startDate || !endDate || startDate > endDate}
                    className="px-4 md:px-6 py-2 rounded-lg bg-blue-500/80 hover:bg-blue-500 active:bg-blue-600 font-bold text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap cursor-pointer"
                  >
                    הצג
                  </button>
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => router.push("/learning")}
                className="px-6 py-3 rounded-lg bg-blue-500/80 hover:bg-blue-500 font-bold block w-full"
              >
                חזור למשחקים
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <style>{`
          @media print {
            body {
              background: white !important;
              color: black !important;
            }
            .bg-gradient-to-b,
            .bg-black\\/30,
            .bg-black\\/40,
            .bg-blue-500\\/20,
            .bg-emerald-500\\/20,
            .bg-purple-500\\/20,
            .bg-green-500\\/20,
            .bg-orange-500\\/20,
            .bg-cyan-500\\/20 {
              background: white !important;
              border: 1px solid #ccc !important;
            }
            .text-white {
              color: black !important;
            }
            .text-white\\/60,
            .text-white\\/70,
            .text-white\\/80,
            .text-white\\/90 {
              color: #333 !important;
            }
            button {
              display: none !important;
            }
            table {
              page-break-inside: avoid;
            }
            .recharts-wrapper {
              page-break-inside: avoid;
            }
          }
        `}</style>
      </Head>
      <div
        className="min-h-screen bg-gradient-to-b from-[#0a0f1d] to-[#141928] text-white p-2 md:p-4"
        dir="rtl"
        style={{
          paddingTop: "calc(var(--head-h, 56px) + 16px)",
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch"
        }}
      >
        <div className="max-w-4xl mx-auto w-full">
          {/* כפתור BACK */}
          <div className="mb-4 text-left">
            <button
              onClick={() => {
                if (typeof window !== "undefined" && window.history.length > 1) {
                  router.back();
                } else {
                  router.push("/learning");
                }
              }}
              className="px-4 py-2 rounded-lg text-sm font-bold bg-white/10 border border-white/20 hover:bg-white/20 text-white transition-all"
            >
              BACK
            </button>
          </div>
          
          {/* כותרת */}
          <div className="text-center mb-4 md:mb-6">
            <h1 className="text-2xl md:text-3xl font-extrabold mb-2">📊 דוח להורים</h1>
            <p className="text-white/70 text-sm md:text-base">{report.playerName}</p>
            
            {/* בחירת תקופה */}
            <div className="flex flex-wrap gap-2 justify-center mt-2 md:mt-4 mb-2 md:mb-3">
              <button
                onClick={() => {
                  setCustomDates(false);
                  setPeriod('week');
                }}
                className={`px-3 md:px-4 py-2 rounded-lg font-bold text-xs md:text-sm transition-all ${
                  !customDates && period === 'week'
                    ? "bg-blue-500/80 text-white"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                שבוע
              </button>
              <button
                onClick={() => {
                  setCustomDates(false);
                  setPeriod('month');
                }}
                className={`px-3 md:px-4 py-2 rounded-lg font-bold text-xs md:text-sm transition-all ${
                  !customDates && period === 'month'
                    ? "bg-blue-500/80 text-white"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                חודש
              </button>
              <button
                onClick={() => {
                  setCustomDates(true);
                  setPeriod('custom');
                }}
                className={`px-3 md:px-4 py-2 rounded-lg font-bold text-xs md:text-sm transition-all ${
                  customDates
                    ? "bg-blue-500/80 text-white"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                תאריכים מותאמים
              </button>
            </div>
            
            {/* בחירת תאריכים מותאמת אישית */}
            {customDates && (
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mt-3 mb-3 p-3 bg-black/20 rounded-lg">
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <label className="text-xs md:text-sm text-white/70 whitespace-nowrap">מתאריך:</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    max={endDate || new Date().toISOString().split('T')[0]}
                    dir="ltr"
                    className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <label className="text-xs md:text-sm text-white/70 whitespace-nowrap">עד תאריך:</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    max={new Date().toISOString().split('T')[0]}
                    dir="ltr"
                    className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleShowReport();
                  }}
                  disabled={!startDate || !endDate || startDate > endDate}
                  className="px-4 md:px-6 py-2 rounded-lg bg-blue-500/80 hover:bg-blue-500 active:bg-blue-600 font-bold text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap cursor-pointer"
                >
                  הצג
                </button>
              </div>
            )}
            
            <p className="text-xs md:text-sm text-white/60 mt-2 text-center" dir="ltr" style={{ direction: 'ltr', textAlign: 'center' }}>
              {formatDate(report.startDate)} - {formatDate(report.endDate)}
            </p>
          </div>

          {/* סיכום כללי */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-3 md:mb-6">
            <div className="bg-black/30 border border-white/10 rounded-lg p-2 md:p-4 text-center">
              <div className="text-[10px] md:text-xs text-white/60 mb-1">זמן כולל</div>
              <div className="text-lg md:text-2xl font-bold text-blue-400">
                {report.summary.totalTimeMinutes} דק'
              </div>
              <div className="text-[10px] md:text-xs text-white/60">
                ({report.summary.totalTimeHours} שעות)
              </div>
            </div>
            
            <div className="bg-black/30 border border-white/10 rounded-lg p-2 md:p-4 text-center">
              <div className="text-[10px] md:text-xs text-white/60 mb-1">שאלות</div>
              <div className="text-lg md:text-2xl font-bold text-emerald-400">
                {report.summary.totalQuestions}
              </div>
              <div className="text-[10px] md:text-xs text-white/60">
                {report.summary.totalCorrect} נכון
              </div>
            </div>
            
            <div className="bg-black/30 border border-white/10 rounded-lg p-2 md:p-4 text-center">
              <div className="text-[10px] md:text-xs text-white/60 mb-1">דיוק כללי</div>
              <div className="text-lg md:text-2xl font-bold text-yellow-400">
                {report.summary.overallAccuracy}%
              </div>
            </div>
            
            <div className="bg-black/30 border border-white/10 rounded-lg p-2 md:p-4 text-center">
              <div className="text-[10px] md:text-xs text-white/60 mb-1">רמה</div>
              <div className="text-lg md:text-2xl font-bold text-purple-400">
                Lv.{report.summary.playerLevel}
              </div>
              <div className="text-[10px] md:text-xs text-white/60">
                ⭐ {report.summary.stars} • 🏆 {report.summary.achievements}
              </div>
            </div>
          </div>

          {/* סיכום לפי מקצוע */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 mb-3 md:mb-6">
            <div className="bg-blue-500/20 border border-blue-400/50 rounded-lg p-2 md:p-4 text-center">
              <div className="text-xs md:text-sm text-white/60 mb-1">🧮 חשבון</div>
              <div className="text-base md:text-lg font-bold text-blue-400">
                {report.summary.mathQuestions || 0} שאלות
              </div>
              <div className="text-xs text-white/80">
                {report.summary.mathCorrect || 0} נכון • {report.summary.mathAccuracy || 0}% דיוק
              </div>
            </div>
            
            <div className="bg-emerald-500/20 border border-emerald-400/50 rounded-lg p-2 md:p-4 text-center">
              <div className="text-xs md:text-sm text-white/60 mb-1">📐 גאומטריה</div>
              <div className="text-base md:text-lg font-bold text-emerald-400">
                {report.summary.geometryQuestions || 0} שאלות
              </div>
              <div className="text-xs text-white/80">
                {report.summary.geometryCorrect || 0} נכון • {report.summary.geometryAccuracy || 0}% דיוק
              </div>
            </div>
            
            <div className="bg-purple-500/20 border border-purple-400/50 rounded-lg p-2 md:p-4 text-center">
              <div className="text-xs md:text-sm text-white/60 mb-1">📘 אנגלית</div>
              <div className="text-base md:text-lg font-bold text-purple-200">
                {report.summary.englishQuestions || 0} שאלות
              </div>
              <div className="text-xs text-white/80">
                {report.summary.englishCorrect || 0} נכון • {report.summary.englishAccuracy || 0}% דיוק
              </div>
            </div>
            
            <div className="bg-green-500/20 border border-green-400/50 rounded-lg p-2 md:p-4 text-center">
              <div className="text-xs md:text-sm text-white/60 mb-1">🔬 מדעים</div>
              <div className="text-base md:text-lg font-bold text-green-200">
                {report.summary.scienceQuestions || 0} שאלות
              </div>
              <div className="text-xs text-white/80">
                {report.summary.scienceCorrect || 0} נכון • {report.summary.scienceAccuracy || 0}% דיוק
              </div>
            </div>
            
            <div className="bg-orange-500/20 border border-orange-400/50 rounded-lg p-2 md:p-4 text-center">
              <div className="text-xs md:text-sm text-white/60 mb-1">📚 עברית</div>
              <div className="text-base md:text-lg font-bold text-orange-300">
                {report.summary.hebrewQuestions || 0} שאלות
              </div>
              <div className="text-xs text-white/80">
                {report.summary.hebrewCorrect || 0} נכון • {report.summary.hebrewAccuracy || 0}% דיוק
              </div>
            </div>
            
            <div className="bg-cyan-500/20 border border-cyan-400/50 rounded-lg p-2 md:p-4 text-center">
              <div className="text-xs md:text-sm text-white/60 mb-1">🗺️ מולדת וגאוגרפיה</div>
              <div className="text-base md:text-lg font-bold text-cyan-300">
                {report.summary.moledetGeographyQuestions || 0} שאלות
              </div>
              <div className="text-xs text-white/80">
                {report.summary.moledetGeographyCorrect || 0} נכון • {report.summary.moledetGeographyAccuracy || 0}% דיוק
              </div>
            </div>
          </div>

          {/* טבלת פעולות חשבון */}
          {Object.keys(report.mathOperations || {}).length > 0 && (
            <div className="bg-black/30 border border-white/10 rounded-lg p-2 md:p-4 mb-3 md:mb-6">
              <h2 className="text-base md:text-xl font-bold mb-3 md:mb-4 text-center">🧮 התקדמות בחשבון</h2>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-right py-2 px-1 md:px-2">פעולה</th>
                      <th className="text-center py-2 px-1 md:px-2">רמה</th>
                      <th className="text-center py-2 px-1 md:px-2">כיתה</th>
                      <th className="text-center py-2 px-1 md:px-2">זמן</th>
                      <th className="text-center py-2 px-1 md:px-2">שאלות</th>
                      <th className="text-center py-2 px-1 md:px-2">נכון</th>
                      <th className="text-center py-2 px-1 md:px-2">דיוק</th>
                      <th className="text-center py-2 px-1 md:px-2">סטטוס</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(report.mathOperations)
                      .sort(([_, a], [__, b]) => b.questions - a.questions)
                      .map(([op, data]) => (
                        <tr key={op} className="border-b border-white/10">
                          <td className="py-2 px-1 md:px-2 font-semibold text-[11px] md:text-sm">
                            {getOperationName(op)}
                          </td>
                          <td className="py-2 px-1 md:px-2 text-center text-white/80 text-[11px] md:text-sm">
                            {data.level || "לא זמין"}
                          </td>
                          <td className="py-2 px-1 md:px-2 text-center text-white/80 text-[11px] md:text-sm">
                            {data.grade || "לא זמין"}
                          </td>
                          <td className="py-2 px-1 md:px-2 text-center text-white/80 text-[11px] md:text-sm">
                            {data.timeMinutes} דק'
                          </td>
                          <td className="py-2 px-1 md:px-2 text-center text-white/80 text-[11px] md:text-sm">
                            {data.questions}
                          </td>
                          <td className="py-2 px-1 md:px-2 text-center text-emerald-400 text-[11px] md:text-sm">
                            {data.correct}
                          </td>
                          <td className={`py-2 px-1 md:px-2 text-center font-bold text-[11px] md:text-sm ${
                            data.accuracy >= 90 ? "text-emerald-400" :
                            data.accuracy >= 70 ? "text-yellow-400" :
                            "text-red-400"
                          }`}>
                            {data.accuracy}%
                          </td>
                          <td className="py-2 px-1 md:px-2 text-center text-[10px] md:text-sm">
                            {data.excellent ? (
                              <span className="text-emerald-400">✅</span>
                            ) : data.needsPractice ? (
                              <span className="text-red-400">⚠️</span>
                            ) : (
                              <span className="text-yellow-400">👍</span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {Object.entries(report.mathOperations)
                  .sort(([_, a], [__, b]) => b.questions - a.questions)
                  .map(([op, data]) => (
                    <div key={op} className="bg-black/40 border border-white/20 rounded-lg p-3">
                      <div className="font-semibold text-sm mb-2 text-blue-400">{getOperationName(op)}</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-white/60">רמה:</span> <span className="text-white/90">{data.level || "לא זמין"}</span>
                        </div>
                        <div>
                          <span className="text-white/60">כיתה:</span> <span className="text-white/90">{data.grade || "לא זמין"}</span>
                        </div>
                        <div>
                          <span className="text-white/60">זמן:</span> <span className="text-white/90">{data.timeMinutes} דק'</span>
                        </div>
                        <div>
                          <span className="text-white/60">שאלות:</span> <span className="text-white/90">{data.questions}</span>
                        </div>
                        <div>
                          <span className="text-white/60">נכון:</span> <span className="text-emerald-400">{data.correct}</span>
                        </div>
                        <div>
                          <span className="text-white/60">דיוק:</span> <span className={`font-bold ${
                            data.accuracy >= 90 ? "text-emerald-400" :
                            data.accuracy >= 70 ? "text-yellow-400" :
                            "text-red-400"
                          }`}>{data.accuracy}%</span>
                        </div>
                      </div>
                      <div className="mt-2 text-center">
                        {data.excellent ? (
                          <span className="text-emerald-400 text-xs">✅ מצוין</span>
                        ) : data.needsPractice ? (
                          <span className="text-red-400 text-xs">⚠️ דורש תרגול</span>
                        ) : (
                          <span className="text-yellow-400 text-xs">👍 טוב</span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* טבלת נושאים גאומטריה */}
          {Object.keys(report.geometryTopics || {}).length > 0 && (
            <div className="bg-black/30 border border-white/10 rounded-lg p-2 md:p-4 mb-3 md:mb-6">
              <h2 className="text-base md:text-xl font-bold mb-3 md:mb-4 text-center">📐 התקדמות בגאומטריה</h2>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-right py-2 px-1 md:px-2">נושא</th>
                      <th className="text-center py-2 px-1 md:px-2">רמה</th>
                      <th className="text-center py-2 px-1 md:px-2">כיתה</th>
                      <th className="text-center py-2 px-1 md:px-2">זמן</th>
                      <th className="text-center py-2 px-1 md:px-2">שאלות</th>
                      <th className="text-center py-2 px-1 md:px-2">נכון</th>
                      <th className="text-center py-2 px-1 md:px-2">דיוק</th>
                      <th className="text-center py-2 px-1 md:px-2">סטטוס</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(report.geometryTopics)
                      .sort(([_, a], [__, b]) => b.questions - a.questions)
                      .map(([topic, data]) => (
                        <tr key={topic} className="border-b border-white/10">
                          <td className="py-2 px-1 md:px-2 font-semibold text-[11px] md:text-sm">
                            {getTopicName(topic)}
                          </td>
                          <td className="py-2 px-1 md:px-2 text-center text-white/80 text-[11px] md:text-sm">
                            {data.level || "לא זמין"}
                          </td>
                          <td className="py-2 px-1 md:px-2 text-center text-white/80 text-[11px] md:text-sm">
                            {data.grade || "לא זמין"}
                          </td>
                          <td className="py-2 px-1 md:px-2 text-center text-white/80 text-[11px] md:text-sm">
                            {data.timeMinutes} דק'
                          </td>
                          <td className="py-2 px-1 md:px-2 text-center text-white/80 text-[11px] md:text-sm">
                            {data.questions}
                          </td>
                          <td className="py-2 px-1 md:px-2 text-center text-emerald-400 text-[11px] md:text-sm">
                            {data.correct}
                          </td>
                          <td className={`py-2 px-1 md:px-2 text-center font-bold text-[11px] md:text-sm ${
                            data.accuracy >= 90 ? "text-emerald-400" :
                            data.accuracy >= 70 ? "text-yellow-400" :
                            "text-red-400"
                          }`}>
                            {data.accuracy}%
                          </td>
                          <td className="py-2 px-1 md:px-2 text-center text-[10px] md:text-sm">
                            {data.excellent ? (
                              <span className="text-emerald-400">✅</span>
                            ) : data.needsPractice ? (
                              <span className="text-red-400">⚠️</span>
                            ) : (
                              <span className="text-yellow-400">👍</span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {Object.entries(report.geometryTopics)
                  .sort(([_, a], [__, b]) => b.questions - a.questions)
                  .map(([topic, data]) => (
                    <div key={topic} className="bg-black/40 border border-white/20 rounded-lg p-3">
                      <div className="font-semibold text-sm mb-2 text-emerald-400">{getTopicName(topic)}</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-white/60">רמה:</span> <span className="text-white/90">{data.level || "לא זמין"}</span>
                        </div>
                        <div>
                          <span className="text-white/60">כיתה:</span> <span className="text-white/90">{data.grade || "לא זמין"}</span>
                        </div>
                        <div>
                          <span className="text-white/60">זמן:</span> <span className="text-white/90">{data.timeMinutes} דק'</span>
                        </div>
                        <div>
                          <span className="text-white/60">שאלות:</span> <span className="text-white/90">{data.questions}</span>
                        </div>
                        <div>
                          <span className="text-white/60">נכון:</span> <span className="text-emerald-400">{data.correct}</span>
                        </div>
                        <div>
                          <span className="text-white/60">דיוק:</span> <span className={`font-bold ${
                            data.accuracy >= 90 ? "text-emerald-400" :
                            data.accuracy >= 70 ? "text-yellow-400" :
                            "text-red-400"
                          }`}>{data.accuracy}%</span>
                        </div>
                      </div>
                      <div className="mt-2 text-center">
                        {data.excellent ? (
                          <span className="text-emerald-400 text-xs">✅ מצוין</span>
                        ) : data.needsPractice ? (
                          <span className="text-red-400 text-xs">⚠️ דורש תרגול</span>
                        ) : (
                          <span className="text-yellow-400 text-xs">👍 טוב</span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
          
          {/* טבלת נושאים אנגלית */}
          {Object.keys(report.englishTopics || {}).length > 0 && (
            <div className="bg-black/30 border border-white/10 rounded-lg p-2 md:p-4 mb-3 md:mb-6">
              <h2 className="text-base md:text-xl font-bold mb-3 md:mb-4 text-center">📘 התקדמות באנגלית</h2>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-right py-2 px-1 md:px-2">נושא</th>
                      <th className="text-center py-2 px-1 md:px-2">רמה</th>
                      <th className="text-center py-2 px-1 md:px-2">כיתה</th>
                      <th className="text-center py-2 px-1 md:px-2">זמן</th>
                      <th className="text-center py-2 px-1 md:px-2">שאלות</th>
                      <th className="text-center py-2 px-1 md:px-2">נכון</th>
                      <th className="text-center py-2 px-1 md:px-2">דיוק</th>
                      <th className="text-center py-2 px-1 md:px-2">סטטוס</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(report.englishTopics)
                      .sort(([_, a], [__, b]) => b.questions - a.questions)
                      .map(([topic, data]) => (
                        <tr key={topic} className="border-b border-white/10">
                          <td className="py-2 px-1 md:px-2 font-semibold text-[11px] md:text-sm">
                            {getEnglishTopicName(topic)}
                          </td>
                          <td className="py-2 px-1 md:px-2 text-center text-white/80 text-[11px] md:text-sm">
                            {data.level || "לא זמין"}
                          </td>
                          <td className="py-2 px-1 md:px-2 text-center text-white/80 text-[11px] md:text-sm">
                            {data.grade || "לא זמין"}
                          </td>
                          <td className="py-2 px-1 md:px-2 text-center text-white/80 text-[11px] md:text-sm">
                            {data.timeMinutes} דק'
                          </td>
                          <td className="py-2 px-1 md:px-2 text-center text-white/80 text-[11px] md:text-sm">
                            {data.questions}
                          </td>
                          <td className="py-2 px-1 md:px-2 text-center text-emerald-400 text-[11px] md:text-sm">
                            {data.correct}
                          </td>
                          <td className={`py-2 px-1 md:px-2 text-center font-bold text-[11px] md:text-sm ${
                            data.accuracy >= 90 ? "text-emerald-400" :
                            data.accuracy >= 70 ? "text-yellow-400" :
                            "text-red-400"
                          }`}>
                            {data.accuracy}%
                          </td>
                          <td className="py-2 px-1 md:px-2 text-center text-[10px] md:text-sm">
                            {data.excellent ? (
                              <span className="text-emerald-400">✅</span>
                            ) : data.needsPractice ? (
                              <span className="text-red-400">⚠️</span>
                            ) : (
                              <span className="text-yellow-400">👍</span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {Object.entries(report.englishTopics)
                  .sort(([_, a], [__, b]) => b.questions - a.questions)
                  .map(([topic, data]) => (
                    <div key={topic} className="bg-black/40 border border-white/20 rounded-lg p-3">
                      <div className="font-semibold text-sm mb-2 text-purple-400">{getEnglishTopicName(topic)}</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-white/60">רמה:</span> <span className="text-white/90">{data.level || "לא זמין"}</span>
                        </div>
                        <div>
                          <span className="text-white/60">כיתה:</span> <span className="text-white/90">{data.grade || "לא זמין"}</span>
                        </div>
                        <div>
                          <span className="text-white/60">זמן:</span> <span className="text-white/90">{data.timeMinutes} דק'</span>
                        </div>
                        <div>
                          <span className="text-white/60">שאלות:</span> <span className="text-white/90">{data.questions}</span>
                        </div>
                        <div>
                          <span className="text-white/60">נכון:</span> <span className="text-emerald-400">{data.correct}</span>
                        </div>
                        <div>
                          <span className="text-white/60">דיוק:</span> <span className={`font-bold ${
                            data.accuracy >= 90 ? "text-emerald-400" :
                            data.accuracy >= 70 ? "text-yellow-400" :
                            "text-red-400"
                          }`}>{data.accuracy}%</span>
                        </div>
                      </div>
                      <div className="mt-2 text-center">
                        {data.excellent ? (
                          <span className="text-emerald-400 text-xs">✅ מצוין</span>
                        ) : data.needsPractice ? (
                          <span className="text-red-400 text-xs">⚠️ דורש תרגול</span>
                        ) : (
                          <span className="text-yellow-400 text-xs">👍 טוב</span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* טבלת נושאים מדעים */}
          {Object.keys(report.scienceTopics || {}).length > 0 && (
            <div className="bg-black/30 border border-white/10 rounded-lg p-2 md:p-4 mb-3 md:mb-6">
              <h2 className="text-base md:text-xl font-bold mb-3 md:mb-4 text-center">🔬 התקדמות במדעים</h2>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-right py-2 px-1 md:px-2">נושא</th>
                      <th className="text-center py-2 px-1 md:px-2">רמה</th>
                      <th className="text-center py-2 px-1 md:px-2">כיתה</th>
                      <th className="text-center py-2 px-1 md:px-2">זמן</th>
                      <th className="text-center py-2 px-1 md:px-2">שאלות</th>
                      <th className="text-center py-2 px-1 md:px-2">נכון</th>
                      <th className="text-center py-2 px-1 md:px-2">דיוק</th>
                      <th className="text-center py-2 px-1 md:px-2">סטטוס</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(report.scienceTopics)
                      .sort(([_, a], [__, b]) => b.questions - a.questions)
                      .map(([topic, data]) => (
                        <tr key={topic} className="border-b border-white/10">
                          <td className="py-2 px-1 md:px-2 font-semibold text-[11px] md:text-sm">
                            {getScienceTopicName(topic)}
                          </td>
                          <td className="py-2 px-1 md:px-2 text-center text-white/80 text-[11px] md:text-sm">
                            {data.level || "לא זמין"}
                          </td>
                          <td className="py-2 px-1 md:px-2 text-center text-white/80 text-[11px] md:text-sm">
                            {data.grade || "לא זמין"}
                          </td>
                          <td className="py-2 px-1 md:px-2 text-center text-white/80 text-[11px] md:text-sm">
                            {data.timeMinutes} דק'
                          </td>
                          <td className="py-2 px-1 md:px-2 text-center text-white/80 text-[11px] md:text-sm">
                            {data.questions}
                          </td>
                          <td className="py-2 px-1 md:px-2 text-center text-emerald-400 text-[11px] md:text-sm">
                            {data.correct}
                          </td>
                          <td
                            className={`py-2 px-1 md:px-2 text-center font-bold text-[11px] md:text-sm ${
                              data.accuracy >= 90
                                ? "text-emerald-400"
                                : data.accuracy >= 70
                                ? "text-yellow-400"
                                : "text-red-400"
                            }`}
                          >
                            {data.accuracy}%
                          </td>
                          <td className="py-2 px-1 md:px-2 text-center text-[10px] md:text-sm">
                            {data.excellent ? (
                              <span className="text-emerald-400">✅</span>
                            ) : data.needsPractice ? (
                              <span className="text-red-400">⚠️</span>
                            ) : (
                              <span className="text-yellow-400">👍</span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {Object.entries(report.scienceTopics)
                  .sort(([_, a], [__, b]) => b.questions - a.questions)
                  .map(([topic, data]) => (
                    <div key={topic} className="bg-black/40 border border-white/20 rounded-lg p-3">
                      <div className="font-semibold text-sm mb-2 text-green-400">{getScienceTopicName(topic)}</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-white/60">רמה:</span> <span className="text-white/90">{data.level || "לא זמין"}</span>
                        </div>
                        <div>
                          <span className="text-white/60">כיתה:</span> <span className="text-white/90">{data.grade || "לא זמין"}</span>
                        </div>
                        <div>
                          <span className="text-white/60">זמן:</span> <span className="text-white/90">{data.timeMinutes} דק'</span>
                        </div>
                        <div>
                          <span className="text-white/60">שאלות:</span> <span className="text-white/90">{data.questions}</span>
                        </div>
                        <div>
                          <span className="text-white/60">נכון:</span> <span className="text-emerald-400">{data.correct}</span>
                        </div>
                        <div>
                          <span className="text-white/60">דיוק:</span> <span className={`font-bold ${
                            data.accuracy >= 90 ? "text-emerald-400" :
                            data.accuracy >= 70 ? "text-yellow-400" :
                            "text-red-400"
                          }`}>{data.accuracy}%</span>
                        </div>
                      </div>
                      <div className="mt-2 text-center">
                        {data.excellent ? (
                          <span className="text-emerald-400 text-xs">✅ מצוין</span>
                        ) : data.needsPractice ? (
                          <span className="text-red-400 text-xs">⚠️ דורש תרגול</span>
                        ) : (
                          <span className="text-yellow-400 text-xs">👍 טוב</span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* טבלת נושאים עברית */}
          {Object.keys(report.hebrewTopics || {}).length > 0 && (
            <div className="bg-black/30 border border-white/10 rounded-lg p-2 md:p-4 mb-3 md:mb-6">
              <h2 className="text-base md:text-xl font-bold mb-3 md:mb-4 text-center">📚 התקדמות בעברית</h2>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-right py-2 px-1 md:px-2">נושא</th>
                      <th className="text-center py-2 px-1 md:px-2">רמה</th>
                      <th className="text-center py-2 px-1 md:px-2">כיתה</th>
                      <th className="text-center py-2 px-1 md:px-2">זמן</th>
                      <th className="text-center py-2 px-1 md:px-2">שאלות</th>
                      <th className="text-center py-2 px-1 md:px-2">נכון</th>
                      <th className="text-center py-2 px-1 md:px-2">דיוק</th>
                      <th className="text-center py-2 px-1 md:px-2">סטטוס</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(report.hebrewTopics)
                      .sort(([_, a], [__, b]) => b.questions - a.questions)
                      .map(([topic, data]) => (
                        <tr key={topic} className="border-b border-white/10">
                          <td className="py-2 px-1 md:px-2 font-semibold text-[11px] md:text-sm">
                            {getHebrewTopicName(topic)}
                          </td>
                          <td className="py-2 px-1 md:px-2 text-center text-white/80 text-[11px] md:text-sm">
                            {data.level || "לא זמין"}
                          </td>
                          <td className="py-2 px-1 md:px-2 text-center text-white/80 text-[11px] md:text-sm">
                            {data.grade || "לא זמין"}
                          </td>
                          <td className="py-2 px-1 md:px-2 text-center text-white/80 text-[11px] md:text-sm">
                            {data.timeMinutes} דק'
                          </td>
                          <td className="py-2 px-1 md:px-2 text-center text-white/80 text-[11px] md:text-sm">
                            {data.questions}
                          </td>
                          <td className="py-2 px-1 md:px-2 text-center text-emerald-400 text-[11px] md:text-sm">
                            {data.correct}
                          </td>
                          <td
                            className={`py-2 px-1 md:px-2 text-center font-bold text-[11px] md:text-sm ${
                              data.accuracy >= 90
                                ? "text-emerald-400"
                                : data.accuracy >= 70
                                ? "text-yellow-400"
                                : "text-red-400"
                            }`}
                          >
                            {data.accuracy}%
                          </td>
                          <td className="py-2 px-1 md:px-2 text-center text-[10px] md:text-sm">
                            {data.excellent ? (
                              <span className="text-emerald-400">✅</span>
                            ) : data.needsPractice ? (
                              <span className="text-red-400">⚠️</span>
                            ) : (
                              <span className="text-yellow-400">👍</span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {Object.entries(report.hebrewTopics)
                  .sort(([_, a], [__, b]) => b.questions - a.questions)
                  .map(([topic, data]) => (
                    <div key={topic} className="bg-black/40 border border-white/20 rounded-lg p-3">
                      <div className="font-semibold text-sm mb-2 text-orange-400">{getHebrewTopicName(topic)}</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-white/60">רמה:</span> <span className="text-white/90">{data.level || "לא זמין"}</span>
                        </div>
                        <div>
                          <span className="text-white/60">כיתה:</span> <span className="text-white/90">{data.grade || "לא זמין"}</span>
                        </div>
                        <div>
                          <span className="text-white/60">זמן:</span> <span className="text-white/90">{data.timeMinutes} דק'</span>
                        </div>
                        <div>
                          <span className="text-white/60">שאלות:</span> <span className="text-white/90">{data.questions}</span>
                        </div>
                        <div>
                          <span className="text-white/60">נכון:</span> <span className="text-emerald-400">{data.correct}</span>
                        </div>
                        <div>
                          <span className="text-white/60">דיוק:</span> <span className={`font-bold ${
                            data.accuracy >= 90 ? "text-emerald-400" :
                            data.accuracy >= 70 ? "text-yellow-400" :
                            "text-red-400"
                          }`}>{data.accuracy}%</span>
                        </div>
                      </div>
                      <div className="mt-2 text-center">
                        {data.excellent ? (
                          <span className="text-emerald-400 text-xs">✅ מצוין</span>
                        ) : data.needsPractice ? (
                          <span className="text-red-400 text-xs">⚠️ דורש תרגול</span>
                        ) : (
                          <span className="text-yellow-400 text-xs">👍 טוב</span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* טבלת נושאים מולדת וגאוגרפיה */}
          {Object.keys(report.moledetGeographyTopics || {}).length > 0 && (
            <div className="bg-black/30 border border-white/10 rounded-lg p-2 md:p-4 mb-3 md:mb-6">
              <h2 className="text-base md:text-xl font-bold mb-3 md:mb-4 text-center">🗺️ התקדמות במולדת וגאוגרפיה</h2>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-right py-2 px-1 md:px-2">נושא</th>
                      <th className="text-center py-2 px-1 md:px-2">רמה</th>
                      <th className="text-center py-2 px-1 md:px-2">כיתה</th>
                      <th className="text-center py-2 px-1 md:px-2">זמן</th>
                      <th className="text-center py-2 px-1 md:px-2">שאלות</th>
                      <th className="text-center py-2 px-1 md:px-2">נכון</th>
                      <th className="text-center py-2 px-1 md:px-2">דיוק</th>
                      <th className="text-center py-2 px-1 md:px-2">סטטוס</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(report.moledetGeographyTopics)
                      .sort(([_, a], [__, b]) => b.questions - a.questions)
                      .map(([topic, data]) => (
                        <tr key={topic} className="border-b border-white/10">
                          <td className="py-2 px-1 md:px-2 font-semibold text-[11px] md:text-sm">
                            {getMoledetGeographyTopicName(topic)}
                          </td>
                          <td className="py-2 px-1 md:px-2 text-center text-white/80 text-[11px] md:text-sm">
                            {data.level || "לא זמין"}
                          </td>
                          <td className="py-2 px-1 md:px-2 text-center text-white/80 text-[11px] md:text-sm">
                            {data.grade || "לא זמין"}
                          </td>
                          <td className="py-2 px-1 md:px-2 text-center text-white/80 text-[11px] md:text-sm">
                            {data.timeMinutes} דק'
                          </td>
                          <td className="py-2 px-1 md:px-2 text-center text-white/80 text-[11px] md:text-sm">
                            {data.questions}
                          </td>
                          <td className="py-2 px-1 md:px-2 text-center text-emerald-400 text-[11px] md:text-sm">
                            {data.correct}
                          </td>
                          <td
                            className={`py-2 px-1 md:px-2 text-center font-bold text-[11px] md:text-sm ${
                              data.accuracy >= 90
                                ? "text-emerald-400"
                                : data.accuracy >= 70
                                ? "text-yellow-400"
                                : "text-red-400"
                            }`}
                          >
                            {data.accuracy}%
                          </td>
                          <td className="py-2 px-1 md:px-2 text-center text-[10px] md:text-sm">
                            {data.excellent ? (
                              <span className="text-emerald-400">✅</span>
                            ) : data.needsPractice ? (
                              <span className="text-red-400">⚠️</span>
                            ) : (
                              <span className="text-yellow-400">👍</span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {Object.entries(report.moledetGeographyTopics)
                  .sort(([_, a], [__, b]) => b.questions - a.questions)
                  .map(([topic, data]) => (
                    <div key={topic} className="bg-black/40 border border-white/20 rounded-lg p-3">
                      <div className="font-semibold text-sm mb-2 text-cyan-400">{getMoledetGeographyTopicName(topic)}</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-white/60">רמה:</span> <span className="text-white/90">{data.level || "לא זמין"}</span>
                        </div>
                        <div>
                          <span className="text-white/60">כיתה:</span> <span className="text-white/90">{data.grade || "לא זמין"}</span>
                        </div>
                        <div>
                          <span className="text-white/60">זמן:</span> <span className="text-white/90">{data.timeMinutes} דק'</span>
                        </div>
                        <div>
                          <span className="text-white/60">שאלות:</span> <span className="text-white/90">{data.questions}</span>
                        </div>
                        <div>
                          <span className="text-white/60">נכון:</span> <span className="text-emerald-400">{data.correct}</span>
                        </div>
                        <div>
                          <span className="text-white/60">דיוק:</span> <span className={`font-bold ${
                            data.accuracy >= 90 ? "text-emerald-400" :
                            data.accuracy >= 70 ? "text-yellow-400" :
                            "text-red-400"
                          }`}>{data.accuracy}%</span>
                        </div>
                      </div>
                      <div className="mt-2 text-center">
                        {data.excellent ? (
                          <span className="text-emerald-400 text-xs">✅ מצוין</span>
                        ) : data.needsPractice ? (
                          <span className="text-red-400 text-xs">⚠️ דורש תרגול</span>
                        ) : (
                          <span className="text-yellow-400 text-xs">👍 טוב</span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* המלצות */}
          {report.analysis.recommendations.length > 0 && (
            <div className="bg-black/30 border border-white/10 rounded-lg p-2 md:p-4 mb-3 md:mb-6">
              <h2 className="text-base md:text-xl font-bold mb-2 md:mb-4 text-center">💡 המלצות</h2>
              <div className="space-y-2 md:space-y-3">
                {report.analysis.recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className={`p-2 md:p-3 rounded-lg border ${
                      rec.priority === 'high'
                        ? "bg-red-500/20 border-red-400/50"
                        : rec.priority === 'medium'
                        ? "bg-yellow-500/20 border-yellow-400/50"
                        : "bg-blue-500/20 border-blue-400/50"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg md:text-xl">
                        {rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🔵'}
                      </span>
                      <div className="flex-1">
                        <div className="font-semibold mb-1 text-sm md:text-base">{rec.operationName}</div>
                        <div className="text-xs md:text-sm text-white/80 break-words">{rec.message}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* גרף פעילות יומית */}
          {report.dailyActivity.length > 0 && (
            <div className="bg-black/30 border border-white/10 rounded-lg p-3 md:p-4 mb-3 md:mb-6">
              <h2 className="text-base md:text-xl font-bold mb-3 md:mb-4 text-center">📅 פעילות יומית</h2>
              <div className="h-56 md:h-80">
                <ResponsiveContainer width="100%" height={isMobile ? 220 : 320}>
                  <LineChart data={report.dailyActivity} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff30" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#ffffff90", fontSize: isMobile ? 10 : 12 }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getDate()}/${date.getMonth() + 1}`;
                      }}
                      style={{ direction: 'ltr' }}
                    />
                    <YAxis 
                      tick={{ fill: "#ffffff90", fontSize: isMobile ? 10 : 12 }}
                      width={isMobile ? 40 : 50}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(10, 15, 29, 0.95)",
                        border: "1px solid rgba(255, 255, 255, 0.3)",
                        borderRadius: "8px",
                        color: "#ffffff",
                        direction: 'rtl',
                      }}
                      labelFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString('he-IL');
                      }}
                      formatter={(value, name) => {
                        if (name === 'זמן (דקות)') return [`${value} דק'`, name];
                        if (name === 'שאלות') return [value, name];
                        return [value, name];
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '10px' }}
                      iconType="line"
                      iconSize={12}
                      formatter={(value) => <span style={{ fontSize: isMobile ? '11px' : '12px', color: '#ffffff90' }}>{value}</span>}
                    />
                    <Line
                      type="monotone"
                      dataKey="timeMinutes"
                      stroke="#3b82f6"
                      strokeWidth={isMobile ? 2 : 3}
                      name="זמן (דקות)"
                      dot={{ fill: "#3b82f6", r: isMobile ? 3 : 4 }}
                      activeDot={{ r: isMobile ? 5 : 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="questions"
                      stroke="#10b981"
                      strokeWidth={isMobile ? 2 : 3}
                      name="שאלות"
                      dot={{ fill: "#10b981", r: isMobile ? 3 : 4 }}
                      activeDot={{ r: isMobile ? 5 : 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* גרף פעילות לפי נושאים */}
          {report.dailyActivity.length > 0 && (
            <div className="bg-black/30 border border-white/10 rounded-lg p-3 md:p-4 mb-3 md:mb-6">
              <h2 className="text-base md:text-xl font-bold mb-3 md:mb-4 text-center">📚 פעילות לפי נושאים (יומי)</h2>
              <div className="h-56 md:h-80">
                <ResponsiveContainer width="100%" height={isMobile ? 220 : 320}>
                  <LineChart data={report.dailyActivity} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff30" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#ffffff90", fontSize: isMobile ? 10 : 12 }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getDate()}/${date.getMonth() + 1}`;
                      }}
                      style={{ direction: 'ltr' }}
                    />
                    <YAxis 
                      tick={{ fill: "#ffffff90", fontSize: isMobile ? 10 : 12 }}
                      width={isMobile ? 40 : 50}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(10, 15, 29, 0.95)",
                        border: "1px solid rgba(255, 255, 255, 0.3)",
                        borderRadius: "8px",
                        color: "#ffffff",
                        direction: 'rtl',
                      }}
                      labelFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString('he-IL');
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '10px' }}
                      iconType="line"
                      iconSize={12}
                      formatter={(value) => <span style={{ fontSize: isMobile ? '11px' : '12px', color: '#ffffff90' }}>{value}</span>}
                    />
                    <Line
                      type="monotone"
                      dataKey="mathTopics"
                      stroke="#60a5fa"
                      strokeWidth={isMobile ? 2 : 3}
                      name="חשבון"
                      dot={{ fill: "#60a5fa", r: isMobile ? 2 : 3 }}
                      activeDot={{ r: isMobile ? 4 : 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="geometryTopics"
                      stroke="#34d399"
                      strokeWidth={isMobile ? 2 : 3}
                      name="גאומטריה"
                      dot={{ fill: "#34d399", r: isMobile ? 2 : 3 }}
                      activeDot={{ r: isMobile ? 4 : 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="englishTopics"
                      stroke="#a855f7"
                      strokeWidth={isMobile ? 2 : 3}
                      name="אנגלית"
                      dot={{ fill: "#a855f7", r: isMobile ? 2 : 3 }}
                      activeDot={{ r: isMobile ? 4 : 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="hebrewTopics"
                      stroke="#f97316"
                      strokeWidth={isMobile ? 2 : 3}
                      name="עברית"
                      dot={{ fill: "#f97316", r: isMobile ? 2 : 3 }}
                      activeDot={{ r: isMobile ? 4 : 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="moledetGeographyTopics"
                      stroke="#06b6d4"
                      strokeWidth={isMobile ? 2 : 3}
                      name="מולדת וגאוגרפיה"
                      dot={{ fill: "#06b6d4", r: isMobile ? 2 : 3 }}
                      activeDot={{ r: isMobile ? 4 : 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* גרף דיוק לפי פעולות */}
          {Object.keys(report.allItems || {}).length > 0 && (
            <div className="bg-black/30 border border-white/10 rounded-lg p-3 md:p-4 mb-3 md:mb-6">
              <h2 className="text-base md:text-xl font-bold mb-3 md:mb-4 text-center">📊 דיוק לפי פעולות ונושאים</h2>
              <div className="h-72 md:h-96">
                <ResponsiveContainer width="100%" height={isMobile ? 288 : 384}>
                  <BarChart 
                    data={Object.entries(report.allItems)
                      .map(([key, data]) => {
                        const name = key.startsWith('math_') 
                          ? getOperationName(key.replace('math_', ''))
                          : key.startsWith('geometry_')
                          ? getTopicName(key.replace('geometry_', ''))
                          : key.startsWith('english_')
                          ? getEnglishTopicName(key.replace('english_', ''))
                          : key.startsWith('science_')
                          ? getScienceTopicName(key.replace('science_', ''))
                          : key.startsWith('hebrew_')
                          ? getHebrewTopicName(key.replace('hebrew_', ''))
                          : key.startsWith('moledet-geography_')
                          ? getMoledetGeographyTopicName(key.replace('moledet-geography_', ''))
                          : key;
                        return {
                          name: name.length > 15 ? name.substring(0, 15) + '...' : name,
                          fullName: name,
                          דיוק: data.accuracy,
                          שאלות: data.questions,
                        };
                      })
                      .sort((a, b) => b.דיוק - a.דיוק)
                      .slice(0, 10)
                    }
                    margin={{ top: 5, right: 20, left: -10, bottom: isMobile ? 60 : 80 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff30" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "#ffffff90", fontSize: isMobile ? 9 : 10 }}
                      angle={isMobile ? -45 : -45}
                      textAnchor="end"
                      height={isMobile ? 100 : 120}
                      interval={0}
                      dy={isMobile ? 25 : 30}
                    />
                    <YAxis 
                      tick={{ fill: "#ffffff90", fontSize: isMobile ? 10 : 12 }}
                      width={isMobile ? 40 : 50}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(10, 15, 29, 0.95)",
                        border: "1px solid rgba(255, 255, 255, 0.3)",
                        borderRadius: "8px",
                        color: "#ffffff",
                        direction: 'rtl',
                      }}
                      formatter={(value, name) => {
                        if (name === 'דיוק') return [`${value}%`, 'דיוק'];
                        return [value, name];
                      }}
                      labelFormatter={(label, payload) => {
                        if (payload && payload[0] && payload[0].payload.fullName) {
                          return payload[0].payload.fullName;
                        }
                        return label;
                      }}
                    />
                    <Bar 
                      dataKey="דיוק" 
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                    >
                      {Object.entries(report.allItems)
                        .map(([_, data], index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              data.accuracy >= 90 ? "#10b981" :
                              data.accuracy >= 70 ? "#f59e0b" :
                              "#ef4444"
                            }
                          />
                        ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* גרף זמן לפי פעולות */}
          {Object.keys(report.allItems || {}).length > 0 && (
            <div className="bg-black/30 border border-white/10 rounded-lg p-3 md:p-4 mb-3 md:mb-6">
              <h2 className="text-base md:text-xl font-bold mb-3 md:mb-4 text-center">⏰ זמן תרגול לפי פעולות ונושאים</h2>
              <div className="h-72 md:h-96">
                <ResponsiveContainer width="100%" height={isMobile ? 288 : 384}>
                  <BarChart 
                    data={Object.entries(report.allItems)
                      .map(([key, data]) => {
                        const name = key.startsWith('math_') 
                          ? getOperationName(key.replace('math_', ''))
                          : key.startsWith('geometry_')
                          ? getTopicName(key.replace('geometry_', ''))
                          : key.startsWith('english_')
                          ? getEnglishTopicName(key.replace('english_', ''))
                          : key.startsWith('science_')
                          ? getScienceTopicName(key.replace('science_', ''))
                          : key.startsWith('hebrew_')
                          ? getHebrewTopicName(key.replace('hebrew_', ''))
                          : key.startsWith('moledet-geography_')
                          ? getMoledetGeographyTopicName(key.replace('moledet-geography_', ''))
                          : key;
                        return {
                          name: name.length > 15 ? name.substring(0, 15) + '...' : name,
                          fullName: name,
                          זמן: data.timeMinutes,
                        };
                      })
                      .sort((a, b) => b.זמן - a.זמן)
                      .slice(0, 10)
                    }
                    margin={{ top: 5, right: 20, left: -10, bottom: isMobile ? 60 : 80 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff30" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "#ffffff90", fontSize: isMobile ? 9 : 10 }}
                      angle={isMobile ? -45 : -45}
                      textAnchor="end"
                      height={isMobile ? 100 : 120}
                      interval={0}
                      dy={isMobile ? 25 : 30}
                    />
                    <YAxis 
                      tick={{ fill: "#ffffff90", fontSize: isMobile ? 10 : 12 }}
                      width={isMobile ? 40 : 50}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(10, 15, 29, 0.95)",
                        border: "1px solid rgba(255, 255, 255, 0.3)",
                        borderRadius: "8px",
                        color: "#ffffff",
                        direction: 'rtl',
                      }}
                      formatter={(value) => `${value} דקות`}
                      labelFormatter={(label, payload) => {
                        if (payload && payload[0] && payload[0].payload.fullName) {
                          return payload[0].payload.fullName;
                        }
                        return label;
                      }}
                    />
                    <Bar 
                      dataKey="זמן" 
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* גרף עוגה - חלוקת זמן */}
          {Object.keys(report.allItems || {}).length > 0 && (
            <div className="bg-black/30 border border-white/10 rounded-lg p-3 md:p-4 mb-3 md:mb-6">
              <h2 className="text-base md:text-xl font-bold mb-3 md:mb-4 text-center">🥧 חלוקת זמן תרגול</h2>
              <div className="h-72 md:h-96">
                <ResponsiveContainer width="100%" height={isMobile ? 280 : 380}>
                  <PieChart>
                    <Pie
                      data={Object.entries(report.allItems)
                        .filter(([_, data]) => data.timeMinutes > 0)
                        .map(([key, data]) => {
                          const name = key.startsWith('math_') 
                            ? getOperationName(key.replace('math_', ''))
                            : key.startsWith('geometry_')
                            ? getTopicName(key.replace('geometry_', ''))
                            : key.startsWith('english_')
                            ? getEnglishTopicName(key.replace('english_', ''))
                            : key.startsWith('science_')
                            ? getScienceTopicName(key.replace('science_', ''))
                            : key.startsWith('hebrew_')
                            ? getHebrewTopicName(key.replace('hebrew_', ''))
                            : key.startsWith('moledet-geography_')
                            ? getMoledetGeographyTopicName(key.replace('moledet-geography_', ''))
                            : key;
                          return {
                            name: name.length > 15 ? name.substring(0, 15) + '...' : name,
                            fullName: name,
                            value: data.timeMinutes,
                            percentage: ((data.timeMinutes / Object.values(report.allItems).reduce((sum, item) => sum + (item.timeMinutes || 0), 0)) * 100).toFixed(1)
                          };
                        })
                        .sort((a, b) => b.value - a.value)
                        .slice(0, 8)
                      }
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={false}
                      outerRadius={isMobile ? 70 : 90}
                      innerRadius={isMobile ? 30 : 40}
                      fill="#8884d8"
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {Object.entries(report.allItems)
                        .filter(([_, data]) => data.timeMinutes > 0)
                        .sort(([_, a], [__, b]) => b.timeMinutes - a.timeMinutes)
                        .slice(0, 8)
                        .map(([_, data], index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={[
                              "#3b82f6",
                              "#10b981",
                              "#f59e0b",
                              "#ef4444",
                              "#8b5cf6",
                              "#ec4899",
                              "#06b6d4",
                              "#84cc16",
                            ][index % 8]}
                          />
                        ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        border: "2px solid #3b82f6",
                        borderRadius: "8px",
                        color: "#1a1a1a",
                        direction: 'rtl',
                        fontSize: isMobile ? '13px' : '14px',
                        fontWeight: '500',
                        padding: '10px 12px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
                      }}
                      labelStyle={{
                        color: "#1a1a1a",
                        fontWeight: 'bold',
                        fontSize: isMobile ? '14px' : '16px',
                        marginBottom: '4px',
                      }}
                      formatter={(value, name, props) => {
                        const fullName = props.payload.fullName || name;
                        const percentage = props.payload.percentage || ((value / Object.values(report.allItems).reduce((sum, item) => sum + (item.timeMinutes || 0), 0)) * 100).toFixed(1);
                        return [`${value} דקות (${percentage}%)`, fullName];
                      }}
                    />
                    <Legend 
                      verticalAlign="bottom"
                      align="center"
                      height={isMobile ? 100 : 120}
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ paddingTop: '15px' }}
                      formatter={(value, entry) => {
                        const fullName = entry.payload?.fullName || value;
                        const percentage = entry.payload?.percentage || '';
                        const displayText = percentage ? `${fullName} (${percentage}%)` : fullName;
                        return <span style={{ fontSize: isMobile ? '9px' : '10px', color: '#ffffff90', marginRight: '6px' }}>{displayText}</span>;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* אתגרים */}
          <div className="bg-black/30 border border-white/10 rounded-lg p-2 md:p-4 mb-3 md:mb-6">
            <h2 className="text-base md:text-xl font-bold mb-2 md:mb-4 text-center">🎯 אתגרים</h2>
            <div className="grid grid-cols-2 gap-2 md:gap-4">
              <div className="bg-blue-500/20 border border-blue-400/50 rounded-lg p-2 md:p-3">
                <div className="text-xs md:text-sm text-white/60 mb-1">אתגר יומי</div>
                <div className="text-base md:text-lg font-bold">
                  {report.challenges.daily.correct} / {report.challenges.daily.questions}
                </div>
                <div className="text-[10px] md:text-xs text-white/60">
                  ניקוד שיא: {report.challenges.daily.bestScore}
                </div>
              </div>
              <div className={`border rounded-lg p-2 md:p-3 ${
                report.challenges.weekly.completed
                  ? "bg-yellow-500/20 border-yellow-400/50"
                  : "bg-purple-500/20 border-purple-400/50"
              }`}>
                <div className="text-xs md:text-sm text-white/60 mb-1">אתגר שבועי</div>
                <div className="text-base md:text-lg font-bold">
                  {report.challenges.weekly.current} / {report.challenges.weekly.target}
                </div>
                {report.challenges.weekly.completed && (
                  <div className="text-[10px] md:text-xs text-yellow-400">🎉 הושלם!</div>
                )}
              </div>
            </div>
          </div>

          {/* הישגים */}
          {report.achievements.length > 0 && (
            <div className="bg-black/30 border border-white/10 rounded-lg p-2 md:p-4 mb-3 md:mb-6">
              <h2 className="text-base md:text-xl font-bold mb-2 md:mb-4 text-center">🏆 הישגים</h2>
              <div className="flex flex-wrap gap-2 justify-center">
                {report.achievements.map((achievement, idx) => (
                  <div
                    key={idx}
                    className="px-2 md:px-3 py-1 md:py-2 bg-emerald-500/20 border border-emerald-400/50 rounded-lg text-xs md:text-sm break-words"
                  >
                    {achievement.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* כפתורים */}
          <div className="flex gap-2 md:gap-3 justify-center flex-wrap mb-3 md:mb-6">
            <button
              onClick={() => window.print()}
              className="px-4 md:px-6 py-2 md:py-3 rounded-lg bg-blue-500/80 hover:bg-blue-500 font-bold text-sm md:text-base"
            >
              🖨️ הדפס
            </button>
            <button
              onClick={() => exportReportToPDF(report)}
              className="px-4 md:px-6 py-2 md:py-3 rounded-lg bg-red-500/80 hover:bg-red-500 font-bold text-sm md:text-base"
            >
              📄 ייצא ל-PDF
            </button>
            <button
              onClick={() => router.push("/learning")}
              className="px-4 md:px-6 py-2 md:py-3 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 font-bold text-sm md:text-base"
            >
              ← חזור ללמידה
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

