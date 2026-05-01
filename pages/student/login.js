import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "../../components/Layout";

export default function StudentLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const res = await fetch("/api/student/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, pin }),
      });
      const payload = await res.json();
      if (!res.ok) {
        setMessage(payload.error || "כניסה נכשלה");
        return;
      }
      router.push("/student/home");
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

