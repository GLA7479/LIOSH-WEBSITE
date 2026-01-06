import { useEffect, useMemo, useState } from "react";
import Layout from "../../components/Layout";
import { useIOSViewportFix } from "../../hooks/useIOSViewportFix";
import {
  getCurrentYearMonth,
  loadMonthlyProgress,
  loadRewardChoice,
  loadProgressLog,
  saveRewardChoice,
} from "../../utils/progress-storage";
import {
  REWARD_OPTIONS,
  MONTHLY_MINUTES_TARGET,
  MONTHLY_EXERCISES_TARGET,
} from "../../data/reward-options";

function RewardCard({ option, selected, onSelect }) {
  const isActive = selected === option.key;
  return (
    <label
      className={`border rounded-xl p-4 block cursor-pointer transition-all ${
        isActive ? "border-emerald-400 ring-2 ring-emerald-300" : "border-white/20"
      }`}
    >
      <div className="flex items-start gap-3">
        <input
          type="radio"
          className="mt-1"
          checked={isActive}
          onChange={() => onSelect(option.key)}
        />
        <div>
          <p className="font-bold text-lg flex items-center gap-2">
            <span className="text-2xl">{option.icon}</span>
            <span>{option.label}</span>
          </p>
          <p className="text-sm text-white/70 mt-1">{option.description}</p>
        </div>
      </div>
    </label>
  );
}

export default function ParentRewards() {
  useIOSViewportFix();
  const yearMonth = getCurrentYearMonth();
  const [progress, setProgress] = useState(null);
  const [reached, setReached] = useState(false);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState("");
  const [sessions, setSessions] = useState([]);
  const [fromDate, setFromDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const all = loadMonthlyProgress();
    const current = all[yearMonth] || { totalMinutes: 0, totalExercises: 0 };
    setProgress(current);
    const goalReached =
      current.totalMinutes >= MONTHLY_MINUTES_TARGET &&
      current.totalExercises >= MONTHLY_EXERCISES_TARGET;
    setReached(goalReached);

    const storedChoice = loadRewardChoice(yearMonth);
    if (storedChoice) {
      setSelected(storedChoice);
    }

    const log = loadProgressLog();
    setSessions(Array.isArray(log) ? log : []);
  }, [yearMonth]);

  function handleSave() {
    if (!selected) return;
    saveRewardChoice(yearMonth, selected);
    setMessage("הפרס נבחר בהצלחה! נחזור אליכם לתיאום הפרס.");
  }

  const filteredSessions = useMemo(() => {
    if (!sessions.length) return [];
    const fromTs = fromDate ? new Date(fromDate).getTime() : -Infinity;
    const toTs = toDate
      ? new Date(new Date(toDate).setHours(23, 59, 59, 999)).getTime()
      : Infinity;
    return sessions
      .filter((session) => {
        const ts = new Date(session.date).getTime();
        return ts >= fromTs && ts <= toTs;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [sessions, fromDate, toDate]);

  const summaryBySubject = useMemo(() => {
    const summary = {};
    filteredSessions.forEach((session) => {
      const key = session.subject || "אחר";
      if (!summary[key]) {
        summary[key] = { minutes: 0, exercises: 0 };
      }
      summary[key].minutes += session.minutes || 0;
      summary[key].exercises += session.exercises || 0;
    });
    return summary;
  }, [filteredSessions]);

  const totalMinutesRange = filteredSessions.reduce(
    (sum, session) => sum + (session.minutes || 0),
    0
  );
  const totalExercisesRange = filteredSessions.reduce(
    (sum, session) => sum + (session.exercises || 0),
    0
  );

  return (
    <Layout>
      <main className="min-h-screen bg-gradient-to-b from-[#050816] to-[#0a0f1d] text-white px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <header className="text-center">
            <h1 className="text-3xl font-extrabold mb-2">פרסי התמדה חודשיים</h1>
            <p className="text-white/70">
              עמדתם ביעד הלמידה החודשי? בחרו יחד עם הילד/ה את סוג הפרס שמקבלים.
            </p>
          </header>

          <section className="bg-white/5 border border-white/10 rounded-2xl p-5" dir="rtl">
            {progress ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  <div className="bg-black/30 rounded-xl p-4 text-center">
                    <p className="text-white/60 text-sm">זמן למידה החודש</p>
                    <p className="text-2xl font-bold text-emerald-300">
                      {progress.totalMinutes} דק׳
                    </p>
                    <p className="text-xs text-white/60">
                      יעד: {MONTHLY_MINUTES_TARGET} דק׳ (≈10 שעות)
                    </p>
                  </div>
                  <div className="bg-black/30 rounded-xl p-4 text-center">
                    <p className="text-white/60 text-sm">תרגילים שנפתרו</p>
                    <p className="text-2xl font-bold text-amber-300">
                      {progress.totalExercises}
                    </p>
                    <p className="text-xs text-white/60">
                      יעד: {MONTHLY_EXERCISES_TARGET} תרגילים
                    </p>
                  </div>
                </div>
                <div
                  className={`rounded-xl p-3 text-center text-sm font-bold ${
                    reached ? "bg-emerald-500/20 text-emerald-200" : "bg-red-500/20 text-red-200"
                  }`}
                >
                  {reached
                    ? "כל הכבוד! החודש עמדתם ביעד הלמידה. אפשר לבחור פרס."
                    : "עוד לא הגעתם ליעד. המשיכו לתרגל כדי לפתוח את בחירת הפרס."}
                </div>
              </>
            ) : (
              <p className="text-center text-white/70">אין עדיין נתונים לחודש הזה.</p>
            )}
          </section>

          <section className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4" dir="rtl">
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="flex-1">
                <label className="block text-sm text-white/70 mb-1">תאריך התחלה</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm text-white/70 mb-1">תאריך סיום</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-black/30 rounded-xl p-4 text-center">
                <p className="text-white/60 text-sm">סה״כ דקות בטווח</p>
                <p className="text-2xl font-bold text-emerald-300">{totalMinutesRange}</p>
              </div>
              <div className="bg-black/30 rounded-xl p-4 text-center">
                <p className="text-white/60 text-sm">סה״כ תרגילים בטווח</p>
                <p className="text-2xl font-bold text-amber-300">{totalExercisesRange}</p>
              </div>
              <div className="bg-black/30 rounded-xl p-4 text-center">
                <p className="text-white/60 text-sm">מספר סשנים</p>
                <p className="text-2xl font-bold text-blue-300">{filteredSessions.length}</p>
              </div>
            </div>

            <div className="bg-black/20 rounded-xl p-4">
              <h3 className="font-bold mb-3">חלוקה לפי מקצועות</h3>
              {Object.keys(summaryBySubject).length === 0 ? (
                <p className="text-white/60 text-sm">אין נתונים בטווח שנבחר.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(summaryBySubject).map(([subject, data]) => (
                    <div
                      key={subject}
                      className="bg-white/10 rounded-lg px-4 py-3 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-bold">{subject}</p>
                        <p className="text-xs text-white/60">
                          {data.exercises} תרגילים
                        </p>
                      </div>
                      <div className="text-emerald-300 font-bold text-lg">
                        {data.minutes} דק׳
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right border-separate border-spacing-y-2">
                <thead className="text-white/70">
                  <tr>
                    <th className="px-3 py-2">תאריך</th>
                    <th className="px-3 py-2">מקצוע</th>
                    <th className="px-3 py-2">נושא</th>
                    <th className="px-3 py-2">מצב משחק</th>
                    <th className="px-3 py-2 text-center">דקות</th>
                    <th className="px-3 py-2 text-center">תרגילים</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-white/60 py-4">
                        אין נתונים לטווח שנבחר.
                      </td>
                    </tr>
                  ) : (
                    filteredSessions.map((session) => (
                      <tr
                        key={session.id}
                        className="bg-white/5 border border-white/10 rounded-lg text-white"
                      >
                        <td className="px-3 py-2">{new Date(session.date).toLocaleDateString("he-IL")}</td>
                        <td className="px-3 py-2">{session.subject || "—"}</td>
                        <td className="px-3 py-2">{session.topic || "—"}</td>
                        <td className="px-3 py-2">{session.mode || "—"}</td>
                        <td className="px-3 py-2 text-center">{session.minutes}</td>
                        <td className="px-3 py-2 text-center">{session.exercises}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {reached && (
            <section className="bg-white/5 border border-white/10 rounded-2xl p-5" dir="rtl">
              <h2 className="text-2xl font-bold mb-4 text-center">בחרו את סוג הפרס</h2>
              <div className="space-y-3 mb-4">
                {REWARD_OPTIONS.map((option) => (
                  <RewardCard
                    key={option.key}
                    option={option}
                    selected={selected}
                    onSelect={setSelected}
                  />
                ))}
              </div>
              <button
                onClick={handleSave}
                disabled={!selected}
                className="w-full py-3 rounded-xl bg-emerald-500/80 hover:bg-emerald-500 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                שמירת בחירה
              </button>
              {message && (
                <p className="text-sm text-center text-emerald-300 mt-3">{message}</p>
              )}
            </section>
          )}
        </div>
      </main>
    </Layout>
  );
}

