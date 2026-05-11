import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { syncStudentLocalStorageIdentity } from "../../lib/learning-student-local-sync";

/** מותר לשמור ב־next= אחרי login — ללא open redirect */
function isSafeNextPath(path) {
  return (
    typeof path === "string" &&
    !path.startsWith("//") &&
    !path.includes("://") &&
    (path.startsWith("/learning") || path.startsWith("/student/"))
  );
}

export default function StudentAccessGate({ children }) {
  const router = useRouter();
  const [state, setState] = useState("checking");

  useEffect(() => {
    if (!router.isReady) return undefined;
    let mounted = true;
    const pathForNext = router.asPath || "/learning";
    fetch("/api/student/me", { credentials: "same-origin" })
      .then(async (res) => {
        const payload = await res.json().catch(() => ({}));
        if (!mounted) return;
        if (res.ok && payload?.student?.id) {
          syncStudentLocalStorageIdentity(payload.student);
          setState("ok");
          return;
        }
        setState("blocked");
        const target = isSafeNextPath(pathForNext) ? pathForNext : "/learning";
        router.replace(`/student/login?next=${encodeURIComponent(target)}`);
      })
      .catch(() => {
        if (!mounted) return;
        setState("blocked");
      });
    return () => {
      mounted = false;
    };
    // רק isReady — לא router.asPath (משתנה בתדירות גבוהה בהידרציה/broadcast ומפעיל לולאת replace → שגיאת ריצה).
  }, [router.isReady]);

  if (state === "checking") {
    return <div className="max-w-3xl mx-auto px-4 py-10">בודק התחברות תלמיד...</div>;
  }

  if (state !== "ok") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-3">
        <p>יש להתחבר כתלמיד כדי להמשיך</p>
        <Link href="/student/login" className="inline-block rounded bg-amber-500 text-black px-3 py-2 font-semibold">
          כניסת תלמיד
        </Link>
      </div>
    );
  }

  return children;
}

