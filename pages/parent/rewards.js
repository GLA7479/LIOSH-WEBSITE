import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { useIOSViewportFix } from "../../hooks/useIOSViewportFix";
import {
  getCurrentYearMonth,
  loadMonthlyProgress,
  loadRewardChoice,
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
  }, [yearMonth]);

  function handleSave() {
    if (!selected) return;
    saveRewardChoice(yearMonth, selected);
    setMessage("הפרס נבחר בהצלחה! נחזור אליכם לתיאום הפרס.");
  }

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

