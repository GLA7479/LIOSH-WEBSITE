import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "../../components/Layout";
import { syncStudentLocalStorageIdentity } from "../../lib/learning-student-local-sync";
import { isStudentIdentityDiagnosticsEnabled } from "../../lib/dev-student-identity-client";

export default function StudentLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [sessionCheck, setSessionCheck] = useState("pending");

  useEffect(() => {
    if (!router.isReady) return undefined;
    let mounted = true;
    fetch("/api/student/me", { credentials: "same-origin", cache: "no-store" })
      .then((res) => {
        if (!mounted) return;
        if (res.ok) {
          router.replace("/student/home");
          return;
        }
        setSessionCheck("none");
      })
      .catch(() => {
        if (mounted) setSessionCheck("none");
      });
    return () => {
      mounted = false;
    };
  }, [router.isReady, router]);

  if (sessionCheck === "pending") {
    return (
      <Layout>
        <div className="min-h-[50vh] flex flex-col items-center justify-center px-4">
          <div className="h-10 w-10 rounded-full border-2 border-emerald-400/30 border-t-emerald-400 animate-spin mb-3" aria-hidden />
          <p className="text-white/85">בודקים חיבור...</p>
        </div>
      </Layout>
    );
  }

  const resolveNextTarget = () => {
    const raw = router.query?.next;
    if (typeof raw !== "string") return "/student/home";
    const decoded = decodeURIComponent(raw);
    if (
      decoded.startsWith("/learning") &&
      !decoded.startsWith("//") &&
      !decoded.includes("://")
    ) {
      return decoded;
    }
    return "/student/home";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      if (isStudentIdentityDiagnosticsEnabled()) {
        console.log("[student-login-page] submitting username", username);
      }

      const res = await fetch("/api/student/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, pin }),
      });
      const payload = await res.json();
      if (!res.ok) {
        setMessage(payload.error || "כניסה נכשלה");
        return;
      }

      if (isStudentIdentityDiagnosticsEnabled()) {
        console.log("[student-login-page] login response student", {
          id: payload.student?.id,
          fullName: payload.student?.full_name,
          gradeLevel: payload.student?.grade_level,
          debug: payload.debugStudentIdentity,
        });
      }

      if (payload?.student?.id) {
        syncStudentLocalStorageIdentity(payload.student, "student-login-page after login");
      }

      if (isStudentIdentityDiagnosticsEnabled()) {
        console.log("[student-login-page] localStorage after sync", {
          liosh_active_student_id: localStorage.getItem("liosh_active_student_id"),
          mleo_player_name: localStorage.getItem("mleo_player_name"),
        });
      }

      router.push(resolveNextTarget());
    } catch (_e) {
      setMessage("שגיאת רשת");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-6">כניסת תלמיד</h1>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="text-sm text-white/80">שם משתמש</label>
            <input
              className="mt-1 w-full rounded bg-black/40 border border-white/20 px-3 py-2"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="שם משתמש"
              required
            />
          </div>
          <div>
            <label className="text-sm text-white/80">PIN</label>
            <input
              className="mt-1 w-full rounded bg-black/40 border border-white/20 px-3 py-2"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="PIN"
              required
              inputMode="numeric"
            />
          </div>
          <button
            className="w-full rounded bg-amber-500 text-black font-semibold py-2 disabled:opacity-60"
            disabled={busy}
            type="submit"
          >
            {busy ? "מבצע פעולה..." : "כניסה"}
          </button>
        </form>

        {message ? <p className="mt-3 text-sm text-white/85">{message}</p> : null}

        <p className="mt-6 text-sm text-white/70">
          <Link href="/learning" className="underline text-amber-300">
            חזרה ללמידה
          </Link>
        </p>
      </div>
    </Layout>
  );
}
