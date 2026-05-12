import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import Link from "next/link";
import InstallAppPrompt from "../components/InstallAppPrompt";
import InstallAppButton from "../components/InstallAppButton";

export default function HomePage() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState("");
  const [learningZoneBusy, setLearningZoneBusy] = useState(false);

  const goStudentLearningZone = async () => {
    setLearningZoneBusy(true);
    try {
      const res = await fetch("/api/student/me", {
        credentials: "include",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      const payload = await res.json().catch(() => ({}));
      if (res.ok && payload?.student?.id) {
        await router.push("/student/home");
      } else {
        await router.push("/student/login");
      }
    } catch {
      await router.push("/student/login");
    } finally {
      setLearningZoneBusy(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("mleo_player_name") || "";
    setPlayerName(saved);
  }, []);

  const handleNameChange = (e) => {
    const value = e.target.value;
    setPlayerName(value);
    if (typeof window !== "undefined") {
      localStorage.setItem("mleo_player_name", value);
    }
  };

  return (
    <Layout>
      <InstallAppPrompt />
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10" dir="rtl">
        <section className="text-center space-y-4">
          <p className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-xs tracking-[0.25em] uppercase text-amber-300 font-semibold">
            כיף · בטוח · חינוכי
          </p>
          <h1 className="text-4xl md:text-5xl font-black leading-tight">
            ברוכים הבאים ל־<span className="text-amber-300">LEO KIDS</span>
          </h1>
          <p className="text-base md:text-lg text-white/70 max-w-2xl mx-auto">
            עולם קטן של מיני־משחקים ופעילויות לימוד לילדים: ריצה, טיסה, חידות
            ותרגול במתמטיקה, גיאומטריה ואנגלית — הכול במקום אחד.
          </p>
        </section>

        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <button
            type="button"
            disabled={learningZoneBusy}
            onClick={() => void goStudentLearningZone()}
            className="group rounded-2xl bg-gradient-to-br from-amber-500/60 to-rose-600/70 p-[1px] text-right w-full disabled:opacity-60 disabled:pointer-events-none"
          >
            <div className="h-full rounded-2xl bg-black/60 p-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="text-4xl">📚</div>
                <h2 className="text-xl font-bold">אזור לימודים</h2>
                <p className="text-sm text-white/75">
                  תרגול במתמטיקה, גיאומטריה ואנגלית — מותאם לכיתות יסוד.
                </p>
              </div>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-amber-200 group-hover:-translate-x-1 transition">
                <span>←</span>
                {learningZoneBusy ? "טוען..." : "כניסה לאזור התלמיד"}
              </span>
            </div>
          </button>

          <Link href="/offline" className="group rounded-2xl bg-gradient-to-br from-emerald-500/60 to-teal-600/70 p-[1px]">
            <div className="h-full rounded-2xl bg-black/60 p-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="text-4xl">👨‍👩‍👧‍👦</div>
                <h2 className="text-xl font-bold">משחקים לא מקוונים</h2>
                <p className="text-sm text-white/75">
                  משחקים על אותו מכשיר — איקס־עיגול, אבן־נייר־מספריים ועוד.
                </p>
              </div>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-300 group-hover:-translate-x-1 transition">
                <span>←</span>
                כניסה למצב לא מקוון
              </span>
            </div>
          </Link>

          <Link href="/game" className="group rounded-2xl bg-gradient-to-br from-sky-500/60 to-indigo-600/70 p-[1px]">
            <div className="h-full rounded-2xl bg-black/60 p-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="text-4xl">🎮</div>
                <h2 className="text-xl font-bold">משחקי ארקייד</h2>
                <p className="text-sm text-white/75">
                  משחקי פעולה עם LEO: ריצה, טיסה, תפיסה, חידות ועוד.
                </p>
              </div>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-sky-300 group-hover:-translate-x-1 transition">
                <span>←</span>
                כניסה למשחקים
              </span>
            </div>
          </Link>

          <Link
            href="/student/arcade"
            className="group rounded-2xl bg-gradient-to-br from-violet-500/60 to-fuchsia-700/70 p-[1px]"
          >
            <div className="h-full rounded-2xl bg-black/60 p-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="text-4xl">🌐</div>
                <h2 className="text-xl font-bold">משחקים מקוונים</h2>
                <p className="text-sm text-white/75">
                  חדרים ומשחקי לוח ברשת — דמקה, לודו, נחשים וסולמות ועוד (כניסת תלמיד).
                </p>
              </div>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-fuchsia-200 group-hover:-translate-x-1 transition">
                <span>←</span>
                כניסה למשחקים מקוונים
              </span>
            </div>
          </Link>
        </section>

        {/* Player name + install app */}
        <div className="flex flex-col md:flex-row items-center md:items-end justify-center gap-4 pt-4">
          <div className="flex flex-col gap-1">
            <input
              type="text"
              value={playerName}
              onChange={handleNameChange}
              placeholder="שם שחקן"
              className="bg-black/40 border border-white/20 rounded-full px-4 py-2 text-sm text-white placeholder-white/40 w-48"
            />
          </div>

          <div>
            <InstallAppButton />
          </div>
        </div>
      </div>
    </Layout>
  );
}
