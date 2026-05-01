import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "../../components/Layout";
import { getLearningSupabaseBrowserClient } from "../../lib/learning-supabase/client";

const GRADE_OPTIONS = [
  { value: "grade_1", label: "כיתה א׳" },
  { value: "grade_2", label: "כיתה ב׳" },
  { value: "grade_3", label: "כיתה ג׳" },
  { value: "grade_4", label: "כיתה ד׳" },
  { value: "grade_5", label: "כיתה ה׳" },
  { value: "grade_6", label: "כיתה ו׳" },
];

function normalizeBalance(student) {
  const rel = student?.student_coin_balances;
  if (Array.isArray(rel)) return rel[0] || null;
  return rel || null;
}

export default function ParentDashboardPage() {
  const router = useRouter();
  const supabaseRef = useRef(null);

  const [session, setSession] = useState(null);
  const [students, setStudents] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [clientReady, setClientReady] = useState(false);

  const [newName, setNewName] = useState("");
  const [newGrade, setNewGrade] = useState("");
  const [credentialsByStudentId, setCredentialsByStudentId] = useState({});
  const [credentialsSavedByStudentId, setCredentialsSavedByStudentId] = useState({});

  const [editById, setEditById] = useState({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!supabaseRef.current) {
      supabaseRef.current = getLearningSupabaseBrowserClient();
    }
    setClientReady(true);
  }, []);

  const fetchStudents = useCallback(async (activeSession) => {
    if (!activeSession?.access_token) return;

    try {
      const res = await fetch("/api/parent/list-students", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${activeSession.access_token}`,
        },
      });
      const payload = await res.json();
      if (!res.ok) {
        setMessage(payload.error || "Failed to load students");
        return;
      }
      setStudents(payload.students || []);
      setMessage("");
    } catch (_err) {
      setMessage("Network error while loading students");
    }
  }, []);

  useEffect(() => {
    if (!clientReady || !supabaseRef.current) return;
    const supabase = supabaseRef.current;
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const s = data?.session || null;
      setSession(s);
      if (!s) {
        router.replace("/parent/login");
        return;
      }
      fetchStudents(s);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession || null);
      if (!newSession) {
        router.replace("/parent/login");
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [clientReady, router]);

  const createStudent = async (e) => {
    e.preventDefault();
    if (!session?.access_token) return;
    if (!newGrade) {
      setMessage("יש לבחור כיתה");
      return;
    }
    setBusy(true);
    setMessage("");

    const res = await fetch("/api/parent/create-student", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        fullName: newName,
        gradeLevel: newGrade,
      }),
    });
    const payload = await res.json();

    if (!res.ok) {
      setMessage(payload.error || "Failed to create student");
    } else {
      setNewName("");
      setNewGrade("");
      await fetchStudents(session);
      setMessage("Student created.");
    }
    setBusy(false);
  };

  const saveStudent = async (studentId) => {
    if (!session?.access_token) return;
    const edit = editById[studentId];
    if (!edit) return;

    setBusy(true);
    setMessage("");

    const res = await fetch("/api/parent/update-student", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        studentId,
        fullName: edit.fullName,
        gradeLevel: edit.gradeLevel,
        isActive: edit.isActive,
      }),
    });
    const payload = await res.json();

    if (!res.ok) {
      setMessage(payload.error || "Failed to update student");
    } else {
      await fetchStudents(session);
      setMessage("Student updated.");
    }
    setBusy(false);
  };

  const saveStudentCredentials = async (studentId) => {
    if (!session?.access_token) return;
    const form = credentialsByStudentId[studentId] || {};
    const username = String(form.username || "").trim();
    const pin = String(form.pin || "").trim();

    if (!username || !pin) {
      setMessage("יש להזין שם משתמש ו-PIN");
      return;
    }

    setBusy(true);
    setMessage("");

    const res = await fetch("/api/parent/create-student-access-code", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ studentId, username, pin }),
    });
    const payload = await res.json();
    if (!res.ok) {
      setMessage(payload.error || "שמירת פרטי כניסה נכשלה");
    } else {
      setCredentialsSavedByStudentId((prev) => ({
        ...prev,
        [studentId]: true,
      }));
      setMessage("");
    }
    setBusy(false);
  };

  const logout = async () => {
    if (!supabaseRef.current) {
      router.push("/parent/login");
      return;
    }
    const supabase = supabaseRef.current;
    await supabase.auth.signOut();
    router.push("/parent/login");
  };

  if (!session) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 py-10">בודק התחברות הורה...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">דשבורד הורים</h1>
            <p className="text-white/70 text-sm">{session.user?.email}</p>
          </div>
          <button onClick={logout} className="rounded bg-white/10 px-3 py-2">
            יציאה
          </button>
        </div>

        <form onSubmit={createStudent} className="space-y-2 rounded border border-white/15 p-4 bg-black/30">
          <h2 className="font-semibold">הוספת ילד</h2>
          <input
            className="w-full rounded bg-black/40 border border-white/20 px-3 py-2"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="שם הילד"
            required
          />
          <select
            className="w-full rounded bg-black/40 border border-white/20 px-3 py-2"
            value={newGrade}
            onChange={(e) => setNewGrade(e.target.value)}
            required
          >
            <option value="">בחר כיתה</option>
            {GRADE_OPTIONS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
          <button className="rounded bg-amber-500 text-black px-3 py-2 font-semibold disabled:opacity-60" disabled={busy}>
            הוסף ילד
          </button>
        </form>

        <section className="space-y-3">
          <h2 className="font-semibold">הילדים שלי ({students.length})</h2>
          {students.length === 0 ? <p className="text-white/70">עדיין לא נוספו ילדים</p> : null}
          {students.map((student) => {
            const edit = editById[student.id] || {
              fullName: student.full_name || "",
              gradeLevel: student.grade_level || "",
              isActive: Boolean(student.is_active),
            };
            const balance = normalizeBalance(student);
            return (
              <div key={student.id} className="rounded border border-white/15 p-4 bg-black/30 space-y-2">
                <div className="text-sm text-white/60">ID: {student.id}</div>
                <input
                  className="w-full rounded bg-black/40 border border-white/20 px-3 py-2"
                  value={edit.fullName}
                  onChange={(e) =>
                    setEditById((prev) => ({
                      ...prev,
                      [student.id]: { ...edit, fullName: e.target.value },
                    }))
                  }
                />
                <select
                  className="w-full rounded bg-black/40 border border-white/20 px-3 py-2"
                  value={edit.gradeLevel}
                  onChange={(e) =>
                    setEditById((prev) => ({
                      ...prev,
                      [student.id]: { ...edit, gradeLevel: e.target.value },
                    }))
                  }
                >
                  <option value="">בחר כיתה</option>
                  {GRADE_OPTIONS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={edit.isActive}
                    onChange={(e) =>
                      setEditById((prev) => ({
                        ...prev,
                        [student.id]: { ...edit, isActive: e.target.checked },
                      }))
                    }
                  />
                  פעיל
                </label>
                <div className="text-sm text-white/80">
                  יתרת מטבעות: {balance ? balance.balance : 0}
                </div>
                <button
                  className="rounded bg-amber-500 text-black px-3 py-2 font-semibold disabled:opacity-60"
                  disabled={busy}
                  onClick={() => saveStudent(student.id)}
                  type="button"
                >
                  שמור
                </button>

                <div className="mt-2 rounded border border-white/15 p-3 bg-black/30 space-y-2">
                  <div className="font-semibold">פרטי כניסת תלמיד</div>
                  <div>
                    <label className="text-sm text-white/80">שם משתמש לתלמיד</label>
                    <input
                      className="mt-1 w-full rounded bg-black/40 border border-white/20 px-3 py-2"
                      value={credentialsByStudentId[student.id]?.username || ""}
                      onChange={(e) =>
                        setCredentialsByStudentId((prev) => ({
                          ...prev,
                          [student.id]: {
                            ...(prev[student.id] || {}),
                            username: e.target.value,
                          },
                        }))
                      }
                      placeholder="לדוגמה: noam123"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-white/80">PIN לתלמיד</label>
                    <input
                      className="mt-1 w-full rounded bg-black/40 border border-white/20 px-3 py-2"
                      value={credentialsByStudentId[student.id]?.pin || ""}
                      onChange={(e) =>
                        setCredentialsByStudentId((prev) => ({
                          ...prev,
                          [student.id]: {
                            ...(prev[student.id] || {}),
                            pin: e.target.value,
                          },
                        }))
                      }
                      placeholder="4 ספרות"
                      inputMode="numeric"
                      type="password"
                      maxLength={4}
                    />
                  </div>
                  <button
                    className="rounded bg-sky-400 text-black px-3 py-2 font-semibold disabled:opacity-60"
                    disabled={busy}
                    onClick={() => saveStudentCredentials(student.id)}
                    type="button"
                  >
                    שמירת פרטי כניסה
                  </button>
                  {credentialsSavedByStudentId[student.id] ? (
                    <div className="text-emerald-300 text-sm">
                      פרטי הכניסה נשמרו. מסור לילד את שם המשתמש וה-PIN.
                  </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </section>

        {message ? <p className="text-sm text-white/85">{message}</p> : null}

        <p className="text-sm text-white/70">
          כניסת תלמיד זמינה עכשיו.{" "}
          <Link href="/student/login" className="underline text-amber-300 ml-1">
            מעבר לכניסת תלמיד
          </Link>{" "}
          ·{" "}
          <Link href="/learning" className="underline text-amber-300">
            חזרה ללמידה
          </Link>
        </p>
      </div>
    </Layout>
  );
}
