import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

function isSafeLearningPath(path) {
  return (
    typeof path === "string" &&
    path.startsWith("/learning") &&
    !path.startsWith("//") &&
    !path.includes("://")
  );
}

export default function StudentAccessGate({ children }) {
  const router = useRouter();
  const [state, setState] = useState("checking");

  useEffect(() => {
    let mounted = true;
    fetch("/api/student/me")
      .then(async (res) => {
        const payload = await res.json().catch(() => ({}));
        if (!mounted) return;
        if (res.ok && payload?.student?.id) {
          setState("ok");
          return;
        }
        setState("blocked");
        const next = `${router.asPath || "/learning"}`;
        const target = isSafeLearningPath(next) ? next : "/learning";
        router.replace(`/student/login?next=${encodeURIComponent(target)}`);
      })
      .catch(() => {
        if (!mounted) return;
        setState("blocked");
      });
    return () => {
      mounted = false;
    };
  }, [router]);

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

