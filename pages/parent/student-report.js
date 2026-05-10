import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "../../components/Layout";
import { getLearningSupabaseBrowserClient } from "../../lib/learning-supabase/client";

function subjectLabelHe(key) {
  const map = {
    math: "חשבון",
    geometry: "גיאומטריה",
    english: "אנגלית",
    hebrew: "עברית",
    science: "מדעים",
    moledet_geography: "מולדת / גיאוגרפיה",
  };
  return map[key] || key;
}

export default function ParentStudentReportPage() {
  const router = useRouter();
  const studentIdRaw = router.query?.studentId;
  const studentId = typeof studentIdRaw === "string" ? studentIdRaw : Array.isArray(studentIdRaw) ? studentIdRaw[0] : "";

  const [session, setSession] = useState(null);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const supabase = getLearningSupabaseBrowserClient();
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const s = data?.session || null;
      if (!s) {
        router.replace("/parent/login");
        return;
      }
      setSession(s);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;
      setSession(newSession || null);
      if (!newSession) router.replace("/parent/login");
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    if (!router.isReady) return;
    if (!session?.access_token) return;
    if (!studentId) {
      setLoading(false);
      setError("חסר מזהה תלמיד");
      setReport(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    fetch(`/api/parent/students/${encodeURIComponent(studentId)}/report-data`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })
      .then(async (res) => {
        const payload = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setReport(null);
          setError(payload.error || "לא ניתן לטעון את הדוח");
          return;
        }
        setReport(payload);
      })
      .catch(() => {
        if (!cancelled) {
          setReport(null);
          setError("שגיאת רשת");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [router.isReady, session, studentId]);

  const subjectRows = useMemo(() => {
    if (!report?.subjects) return [];
    return Object.entries(report.subjects).map(([key, sub]) => ({
      key,
      label: subjectLabelHe(key),
      answers: sub?.answers ?? 0,
      correct: sub?.correct ?? 0,
      accuracy: sub?.accuracy ?? 0,
    }));
  }, [report]);

  if (!router.isReady || !session) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 py-10">טוען...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">דוח הורים</h1>
            <p className="text-white/70 text-sm">
              נתונים מאומתים לפי מזהה תלמיד — לא לפי שם מקומי בדפדפן.
            </p>
          </div>
          <Link href="/parent/dashboard" className="rounded bg-white/10 px-3 py-2 text-sm">
            חזרה לדשבורד
          </Link>
        </div>

        {!studentId ? (
          <p className="text-amber-300">יש לפתוח דוח מתוך דשבורד ההורה (כפתור &quot;דוח הורים&quot;).</p>
        ) : null}

        {loading ? <p className="text-white/80">טוען דוח...</p> : null}

        {error ? <p className="text-red-300">{error}</p> : null}

        {report?.student ? (
          <div className="rounded border border-white/15 bg-black/30 p-4 space-y-1">
            <div className="font-semibold text-lg">{report.student.full_name || "תלמיד"}</div>
            <div className="text-white/70 text-sm">
              כיתה: {report.student.grade_level || "—"} · טווח תאריכים: {report.range?.from} — {report.range?.to}
            </div>
          </div>
        ) : null}

        {report?.summary ? (
          <section className="rounded border border-white/15 bg-black/30 p-4 space-y-2">
            <h2 className="font-semibold">סיכום</h2>
            <ul className="text-sm text-white/85 space-y-1 list-disc list-inside">
              <li>סשנים: {report.summary.totalSessions}</li>
              <li>תשובות: {report.summary.totalAnswers} (נכון {report.summary.correctAnswers}, שגוי {report.summary.wrongAnswers})</li>
              <li>דיוק כולל: {report.summary.accuracy}%</li>
              <li>זמן למידה כולל (שניות): {report.summary.totalDurationSeconds ?? 0}</li>
            </ul>
          </section>
        ) : null}

        {subjectRows.length > 0 ? (
          <section className="rounded border border-white/15 bg-black/30 p-4 space-y-3">
            <h2 className="font-semibold">לפי מקצוע</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/15">
                    <th className="py-2 pr-2">מקצוע</th>
                    <th className="py-2 pr-2">תשובות</th>
                    <th className="py-2 pr-2">נכון</th>
                    <th className="py-2 pr-2">דיוק</th>
                  </tr>
                </thead>
                <tbody>
                  {subjectRows.map((row) => (
                    <tr key={row.key} className="border-b border-white/10">
                      <td className="py-2 pr-2">{row.label}</td>
                      <td className="py-2 pr-2">{row.answers}</td>
                      <td className="py-2 pr-2">{row.correct}</td>
                      <td className="py-2 pr-2">{row.accuracy}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {report?.dailyActivity?.length ? (
          <section className="rounded border border-white/15 bg-black/30 p-4 space-y-2">
            <h2 className="font-semibold">פעילות יומית (סיכום)</h2>
            <p className="text-white/70 text-sm">{report.dailyActivity.length} ימים עם נתונים בטווח.</p>
          </section>
        ) : null}

        <p className="text-xs text-white/50">
          דף מינימלי לצפייה בטוחה לפי תלמיד. לגרסה מורחבת עם גרפים ו-AI עדיין ניתן להשתמש בדוח הלמידה הכללי לאחר
          התאמות נוספות.
        </p>
      </div>
    </Layout>
  );
}
