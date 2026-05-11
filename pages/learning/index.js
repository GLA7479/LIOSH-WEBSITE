import { useEffect } from "react";
import Layout from "../../components/Layout";
import Link from "next/link";
import { useIOSViewportFix } from "../../hooks/useIOSViewportFix";
import { isStudentIdentityDiagnosticsEnabled } from "../../lib/dev-student-identity-client";

const LEARNING_GAMES = [
  {
    slug: "math-master",
    title: "חשבון",
    emoji: "🧮",
    grades: "כיתות א׳–ו׳",
    blurb: "תרגול חיבור, חיסור, כפל, חילוק ועוד לפי כיתה.",
  },
  {
    slug: "geometry-master",
    title: "גיאומטריה",
    emoji: "📐",
    grades: "כיתות א׳–ו׳",
    blurb: "שטחים, היקפים, נפח, זוויות, פיתגורס וצורות — עם הסברים.",
  },
  {
    slug: "english-master",
    title: "אנגלית",
    emoji: "🇬🇧",
    grades: "כיתות א׳–ו׳",
    blurb: "אוצר מילים, דקדוק, תרגום ובניית משפטים עם תמיכה בעברית.",
  },
  {
    slug: "science-master",
    title: "מדעים",
    emoji: "🔬",
    grades: "כיתות א׳–ו׳",
    blurb: "גוף, בעלי חיים, צמחים, חלל, חומר, מזג אוויר, כוחות ועוד — עם הסברים.",
  },
  {
    slug: "hebrew-master",
    title: "עברית",
    emoji: "📚",
    grades: "כיתות א׳–ו׳",
    blurb: "תרגול שפה, אוצר מילים, דקדוק, הבנת הנקרא ועוד לפי כיתה.",
  },
  {
    slug: "moledet-geography-master",
    title: "מולדת וגיאוגרפיה",
    emoji: "🗺️",
    grades: "כיתות א׳–ו׳",
    blurb: "מולדת, חברה, אזרחות וגיאוגרפיה בתרגילים אינטראקטיביים.",
  },
];

export async function getServerSideProps() {
  return {
    props: {
      showDevStudentSimulator:
        String(process.env.ENABLE_DEV_STUDENT_SIMULATOR || "").trim().toLowerCase() === "true",
    },
  };
}

export default function LearningHub({ showDevStudentSimulator }) {
  useIOSViewportFix();

  useEffect(() => {
    if (!isStudentIdentityDiagnosticsEnabled()) return undefined;
    console.log("[learning/index] localStorage on mount", {
      liosh_active_student_id: localStorage.getItem("liosh_active_student_id"),
      mleo_player_name: localStorage.getItem("mleo_player_name"),
    });
    fetch("/api/student/me", { credentials: "same-origin", cache: "no-store" })
      .then((r) => r.json().catch(() => ({})))
      .then((payload) => {
        console.log("[learning/index] GET /api/student/me", {
          ok: payload?.ok === true,
          id: payload.student?.id,
          fullName: payload.student?.full_name,
          gradeLevel: payload.student?.grade_level,
          debug: payload.debugStudentIdentity,
        });
        console.log("[learning/index] localStorage after /me response", {
          liosh_active_student_id: localStorage.getItem("liosh_active_student_id"),
          mleo_player_name: localStorage.getItem("mleo_player_name"),
        });
      })
      .catch((err) => {
        console.log("[learning/index] GET /api/student/me failed", String(err?.message || err));
      });
    return undefined;
  }, []);

  return (
    <Layout>
      <main className="min-h-screen bg-gradient-to-b from-[#120b1f] to-[#1b1430] text-white px-4 py-10" dir="rtl">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/"
                className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-semibold tracking-widest"
              >
                בית ←
              </Link>
            </div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
              אזור לימודים
            </p>
          </div>

          <header className="text-center space-y-3">
            <p className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-sm tracking-wider uppercase text-amber-300 font-semibold">
              📚 תרגול · חזרה · שיפור
            </p>
            <h1 className="text-3xl md:text-4xl font-black">מרכז משחקי הלימוד</h1>
            <p className="text-sm md:text-base text-white/70 max-w-2xl mx-auto">
              בחרו מקצוע והתחילו לשחק — לכל משחק התאמה לכיתות שונות, ציונים,
              רמות והסברים לשאלות.
            </p>
          </header>

          <section className="grid sm:grid-cols-3 gap-4 md:gap-6">
            {LEARNING_GAMES.map((g) => (
              <Link
                key={g.slug}
                href={`/learning/${g.slug}`}
                className="group rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition p-4 flex flex-col justify-between"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-3xl">{g.emoji}</div>
                  <div>
                    <h2 className="font-bold text-lg">{g.title}</h2>
                    <p className="text-xs text-white/60">{g.grades}</p>
                  </div>
                </div>
                <p className="text-sm text-white/70 flex-1">{g.blurb}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-amber-200">
                  <span>←</span>
                  התחל ללמוד
                </span>
              </Link>
            ))}
          </section>

          {showDevStudentSimulator ? (
            <section>
              <Link
                href="/learning/dev-student-simulator"
                className="block rounded-2xl border border-indigo-300/40 bg-indigo-500/10 hover:bg-indigo-500/20 transition p-4 text-center"
              >
                <h2 className="font-bold text-lg">סימולטור תלמידים (פיתוח)</h2>
                <p className="text-sm text-white/70">סימולטור תלמידים לפיתוח</p>
              </Link>
            </section>
          ) : null}
        </div>
      </main>
    </Layout>
  );
}
