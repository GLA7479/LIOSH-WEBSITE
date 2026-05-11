import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "../../components/Layout";
import { syncStudentLocalStorageIdentity } from "../../lib/learning-student-local-sync";

export default function StudentHomePage() {
  const router = useRouter();
  const [student, setStudent] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!router.isReady) return undefined;
    let mounted = true;

    fetch("/api/student/me", { credentials: "same-origin" })
      .then(async (res) => {
        const payload = await res.json().catch(() => ({}));
        if (!mounted) return;
        if (!res.ok || !payload?.student?.id) {
          router.replace("/student/login");
          return;
        }
        syncStudentLocalStorageIdentity(payload.student);
        setStudent(payload.student);
      })
      .catch(() => {
        if (!mounted) return;
        router.replace("/student/login");
      });

    return () => {
      mounted = false;
    };
  }, [router.isReady]);

  const onLogout = async () => {
    setMessage("");
    try {
      await fetch("/api/student/logout", { method: "POST" });
      router.push("/student/login");
    } catch (_e) {
      setMessage("שגיאת רשת");
    }
  };

  if (!student) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 py-10 space-y-3">
          <p>טוען פרטי תלמיד...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-4">
        <h1 className="text-2xl font-bold">שלום, {student.full_name}</h1>
        <p>
          <Link
            href="/student/arcade"
            className="inline-flex items-center rounded-lg border border-amber-400/40 bg-amber-500/15 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-500/25 transition"
          >
            משחקים
          </Link>
        </p>
        <p className="text-white/80">כיתה: {student.grade_level || "-"}</p>
        <p className="text-white/80">יתרת מטבעות: {student.coin_balance ?? 0}</p>
        <button
          className="rounded bg-white/10 px-3 py-2"
          onClick={onLogout}
          type="button"
        >
          יציאה
        </button>
        <p className="text-white/70">
          משחקים ותרגולים מחוברים לתלמיד יתווספו בשלב הבא.
        </p>
        <p className="text-sm text-white/70">
          <Link href="/learning" className="underline text-amber-300">
            חזרה ללמידה
          </Link>
        </p>
        {message ? <p className="text-sm text-white/85">{message}</p> : null}
      </div>
    </Layout>
  );
}

