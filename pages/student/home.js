import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "../../components/Layout";
import {
  clearAllStudentScopedBrowserStorage,
  syncStudentLocalStorageIdentity,
} from "../../lib/learning-student-local-sync";
import { isStudentIdentityDiagnosticsEnabled } from "../../lib/dev-student-identity-client";
import { buildStudentHomeView } from "../../lib/learning-client/studentHomeDashboardClient";
import { invalidateStudentLearningProfileClientCache } from "../../lib/learning-client/studentLearningProfileClient";

function LoadingScreen({ message }) {
  return (
    <Layout>
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="h-12 w-12 rounded-full border-2 border-emerald-400/30 border-t-emerald-400 animate-spin mb-4" aria-hidden />
        <p className="text-white/90 text-lg font-medium">{message}</p>
      </div>
    </Layout>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-inner shadow-black/20">
      <p className="text-xs md:text-sm text-white/65 mb-1">{label}</p>
      <p className="text-xl md:text-2xl font-bold text-white tabular-nums">{value}</p>
      {sub ? <p className="text-[11px] text-white/50 mt-1">{sub}</p> : null}
    </div>
  );
}

export default function StudentHomePage() {
  const router = useRouter();
  const [authPhase, setAuthPhase] = useState("checking");
  const [student, setStudent] = useState(null);
  const [profilePayload, setProfilePayload] = useState(null);
  const [profilePhase, setProfilePhase] = useState("idle");
  const [profileError, setProfileError] = useState("");
  const [logoutMessage, setLogoutMessage] = useState("");
  const [logoutBusy, setLogoutBusy] = useState(false);

  const loadLearningProfile = useCallback(async () => {
    setProfilePhase("loading");
    setProfileError("");
    try {
      const res = await fetch("/api/student/learning-profile", {
        credentials: "same-origin",
        cache: "no-store",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        setProfilePayload(null);
        setProfileError(json?.error ? String(json.error) : "טעינת הפרופיל נכשלה");
        setProfilePhase("error");
        return;
      }
      setProfilePayload({ row: json.row, derived: json.derived });
      setProfilePhase("ok");
    } catch {
      setProfilePayload(null);
      setProfileError("שגיאת רשת");
      setProfilePhase("error");
    }
  }, []);

  useEffect(() => {
    if (!router.isReady) return undefined;
    let mounted = true;
    setAuthPhase("checking");
    setStudent(null);
    setProfilePayload(null);
    setProfilePhase("idle");
    setProfileError("");

    fetch("/api/student/me", { credentials: "same-origin", cache: "no-store" })
      .then(async (res) => {
        const payload = await res.json().catch(() => ({}));
        if (!mounted) return;
        if (!res.ok || !payload?.student?.id) {
          setAuthPhase("anon");
          router.replace("/student/login");
          return;
        }

        if (isStudentIdentityDiagnosticsEnabled()) {
          console.log("[student/home] GET /api/student/me", {
            id: payload.student?.id,
            fullName: payload.student?.full_name,
            gradeLevel: payload.student?.grade_level,
          });
        }

        syncStudentLocalStorageIdentity(payload.student, "student/home after /me");
        setStudent(payload.student);
        setAuthPhase("authed");
        void loadLearningProfile();
      })
      .catch(() => {
        if (!mounted) return;
        setAuthPhase("anon");
        router.replace("/student/login");
      });

    return () => {
      mounted = false;
    };
  }, [router.isReady, loadLearningProfile]);

  const view = useMemo(() => {
    if (!student?.id) return null;
    return buildStudentHomeView({
      student,
      learningProfile: profilePhase === "ok" && profilePayload ? profilePayload : null,
    });
  }, [student, profilePayload, profilePhase]);

  const profilePending = profilePhase === "idle" || profilePhase === "loading";

  const onLogout = async () => {
    setLogoutMessage("");
    const sid = student?.id;
    setLogoutBusy(true);
    try {
      await fetch("/api/student/logout", { method: "POST", credentials: "same-origin" });
      clearAllStudentScopedBrowserStorage(sid);
      invalidateStudentLearningProfileClientCache();
      setStudent(null);
      setProfilePayload(null);
      setProfilePhase("idle");
      setAuthPhase("anon");
      await router.replace("/student/login");
    } catch {
      setLogoutMessage("שגיאת רשת בעת יציאה");
    } finally {
      setLogoutBusy(false);
    }
  };

  if (authPhase === "checking" || authPhase === "anon") {
    return <LoadingScreen message={authPhase === "anon" ? "מעבירים לכניסה..." : "טוען את דף הבית..."} />;
  }

  if (!student || !view) {
    return <LoadingScreen message="טוען..." />;
  }

  const { identity, accountStats, monthlyJourney, subjects, badges, recommendations } = view;
  const accLabel = (pct) => (pct == null ? "עדיין אין נתונים" : `${pct}%`);

  return (
    <Layout>
      <div key={identity.studentId} className="max-w-6xl mx-auto px-3 sm:px-4 py-6 md:py-10 pb-16 space-y-6 md:space-y-8">
        {/* Hero */}
        <section className="rounded-3xl border border-emerald-500/25 bg-gradient-to-br from-emerald-950/50 via-[#0c1224] to-indigo-950/40 p-5 md:p-8 shadow-xl shadow-black/40">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div className="flex items-start gap-4">
              <div
                className="text-5xl md:text-6xl shrink-0 rounded-2xl bg-black/30 border border-white/10 w-16 h-16 md:w-20 md:h-20 flex items-center justify-center"
                aria-hidden
              >
                {identity.avatarEmoji}
              </div>
              <div className="min-w-0 text-right">
                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                  שלום, {identity.fullName || "תלמיד"}
                </h1>
                <p className="text-white/80 mt-1 text-sm md:text-base">
                  כיתה: {identity.gradeLevel ? identity.gradeLevel : "עדיין אין נתונים"}
                </p>
                <p className="text-amber-200/95 mt-1 text-sm font-semibold tabular-nums">
                  מטבעות: {Number(student.coin_balance) || 0}
                </p>
                <p className="text-emerald-200/90 mt-2 text-sm md:text-base leading-relaxed">{identity.friendlyLineHe}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 md:gap-3 shrink-0">
              <Link
                href="/learning"
                className="inline-flex justify-center items-center rounded-xl bg-emerald-500 text-black font-bold px-5 py-3 text-sm md:text-base hover:bg-emerald-400 transition shadow-lg shadow-emerald-900/40"
              >
                התחל ללמוד
              </Link>
              <Link
                href="/student/arcade"
                className="inline-flex justify-center items-center rounded-xl border border-amber-400/40 bg-amber-500/15 px-5 py-3 text-sm md:text-base font-semibold text-amber-100 hover:bg-amber-500/25 transition"
              >
                משחקים
              </Link>
              <button
                type="button"
                disabled={logoutBusy}
                onClick={() => void onLogout()}
                className="inline-flex justify-center items-center rounded-xl border border-rose-400/40 bg-rose-500/15 px-5 py-3 text-sm md:text-base font-semibold text-rose-100 hover:bg-rose-500/25 transition disabled:opacity-50"
              >
                {logoutBusy ? "יוצאים..." : "התנתקות"}
              </button>
            </div>
          </div>
          {logoutMessage ? <p className="text-rose-200 text-sm mt-4 text-right">{logoutMessage}</p> : null}
        </section>

        {profilePending ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 animate-pulse space-y-4">
            <div className="h-4 bg-white/10 rounded w-1/3 mr-auto" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-24 rounded-2xl bg-white/5" />
              ))}
            </div>
            <div className="h-40 rounded-2xl bg-white/5" />
            <div className="h-56 rounded-2xl bg-white/5" />
          </div>
        ) : null}

        {!profilePending ? (
          <>
        {profilePhase === "error" ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-950/25 p-5 text-right">
            <p className="text-amber-100 font-semibold mb-2">לא הצלחנו לטעון את כל הנתונים</p>
            <p className="text-white/75 text-sm mb-4">{profileError}</p>
            <button
              type="button"
              onClick={() => void loadLearningProfile()}
              className="rounded-xl bg-amber-500 text-black font-bold px-4 py-2 text-sm hover:bg-amber-400"
            >
              נסו שוב
            </button>
          </div>
        ) : null}

        {/* Main stats */}
        <section>
          <h2 className="text-lg md:text-xl font-bold text-white mb-3 md:mb-4 text-right">הנתונים שלי</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
            <StatCard label="מטבעות" value={identity.coinBalance} />
            <StatCard label="רמה" value={accountStats.summaryLevel} />
            <StatCard label="כוכבים (סה״כ)" value={accountStats.summaryStars} />
            <StatCard label="ניקוד שיא" value={accountStats.bestScoreOverall} />
            <StatCard label="שיא רצף" value={accountStats.bestStreakOverall} />
            <StatCard label="דיוק כללי" value={accLabel(accountStats.overallAccuracyPct)} />
            <StatCard label="שאלות שנענו" value={accountStats.questionsAnswered} />
            <StatCard label="תשובות נכונות" value={accountStats.correctAnswers} />
            <StatCard
              label="דקות למידה החודש"
              value={accountStats.learningMinutesThisMonth}
              sub={`יעד חודשי: ${accountStats.monthlyGoalMinutes} דק׳`}
            />
            <StatCard label="דקות למידה מצטברות" value={accountStats.learningMinutesLifetimeRounded} sub="מסיכומי פגישות" />
          </div>
        </section>

        {/* Monthly journey */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 md:p-7">
          <h2 className="text-lg md:text-xl font-bold text-white mb-4 text-right">מסע חודשי</h2>
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
            <div className="flex-1 space-y-3 text-right">
              <p className="text-white/90">
                דקות החודש:{" "}
                <span className="font-bold text-emerald-300 tabular-nums">{monthlyJourney.minutesThisMonth}</span> /{" "}
                <span className="tabular-nums">{monthlyJourney.goalMinutes}</span>
              </p>
              <div className="h-3 rounded-full bg-black/40 overflow-hidden border border-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-l from-emerald-400 to-teal-500 transition-all duration-500"
                  style={{ width: `${monthlyJourney.progressPct}%` }}
                />
              </div>
              <p className="text-sm text-white/75">{monthlyJourney.encouragementHe}</p>
              {monthlyJourney.selectedRewardLabel ? (
                <p className="text-sm text-amber-200/95">
                  פרס שנבחר לחודש: <span className="font-semibold">{monthlyJourney.selectedRewardLabel}</span>
                </p>
              ) : (
                <p className="text-sm text-white/55">עדיין לא נבחר פרס לחודש — אפשר לבחור מעמוד הנושא אחרי התקדמות.</p>
              )}
            </div>
          </div>
        </section>

        {/* Subjects */}
        <section>
          <h2 className="text-lg md:text-xl font-bold text-white mb-3 md:mb-4 text-right">הנושאים שלי</h2>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
            {subjects.map((s) => (
              <div
                key={s.key}
                className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-950/90 p-4 flex flex-col text-right shadow-lg"
              >
                <h3 className="text-lg font-bold text-white mb-2">{s.labelHe}</h3>
                <div className="text-sm text-white/70 space-y-1 mb-3 flex-1">
                  <p>דיוק: {s.accuracyPct != null ? `${s.accuracyPct}%` : "עדיין אין נתונים"}</p>
                  <p>
                    שאלות / נכונות: {s.answersTotal} / {s.correctTotal}
                  </p>
                  <p>
                    רמה {s.level} · כוכבים {s.stars}
                  </p>
                  <p className="text-xs text-white/55">דקות למידה (הערכה): {s.sessionMinutesRounded}</p>
                </div>
                <div className="h-1.5 rounded-full bg-black/40 mb-3 overflow-hidden">
                  <div className="h-full bg-sky-500/80 rounded-full" style={{ width: `${s.progressIndicatorPct}%` }} />
                </div>
                <Link
                  href={s.href}
                  className="mt-auto inline-flex justify-center rounded-xl bg-sky-500/90 hover:bg-sky-400 text-black font-bold py-2.5 text-sm transition"
                >
                  כניסה לנושא
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Badges */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 md:p-7">
          <h2 className="text-lg md:text-xl font-bold text-white mb-4 text-right">תגים והישגים</h2>
          {badges.length === 0 ? (
            <p className="text-white/70 text-right leading-relaxed">
              עדיין אין תגים — אפשר להתחיל ללמוד ולצבור הישגים בכל נושא.
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2 justify-end">
              {badges.map((b, i) => (
                <li
                  key={`${b.label}-${i}`}
                  className="rounded-full border border-amber-400/35 bg-amber-500/10 px-3 py-1.5 text-sm text-amber-50"
                >
                  {b.label}
                  <span className="text-white/45 text-xs mr-1">({b.subjectLabelHe})</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recommendations */}
        <section>
          <h2 className="text-lg md:text-xl font-bold text-white mb-3 md:mb-4 text-right">המשך ללמוד</h2>
          <div className="grid md:grid-cols-2 gap-3 md:gap-4">
            {recommendations.map((r) => (
              <div
                key={r.id}
                className="rounded-2xl border border-violet-500/25 bg-violet-950/20 p-4 md:p-5 text-right flex flex-col"
              >
                <h3 className="font-bold text-violet-100 mb-2">{r.titleHe}</h3>
                <p className="text-sm text-white/75 flex-1 mb-4">{r.descriptionHe}</p>
                <Link
                  href={r.href}
                  className="inline-flex justify-center rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-bold py-2.5 text-sm transition"
                >
                  {r.ctaHe}
                </Link>
              </div>
            ))}
          </div>
        </section>
          </>
        ) : null}
      </div>
    </Layout>
  );
}
