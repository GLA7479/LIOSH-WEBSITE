import Layout from "../../components/Layout";
import Link from "next/link";
import { useIOSViewportFix } from "../../hooks/useIOSViewportFix";

const LEARNING_GAMES = [
  {
    slug: "math-master",
    title: "Math Master",
    emoji: "🧮",
    grades: "Grades 1–6",
    blurb: "Practice addition, subtraction, multiplication, division and more by grade.",
  },
  {
    slug: "geometry-master",
    title: "Geometry Master",
    emoji: "📐",
    grades: "Grades 3–8",
    blurb: "Areas, perimeters, volume, angles, Pythagoras and shapes with explanations.",
  },
  {
    slug: "english-master",
    title: "English Master",
    emoji: "🇬🇧",
    grades: "Grades 1–6",
    blurb: "Vocabulary, grammar, translation and sentence building with Hebrew support.",
  },
  {
    slug: "science-master",
    title: "Science Master",
    emoji: "🔬",
    grades: "Grades 1–8",
    blurb: "Body, animals, plants, space, matter, weather, forces and more with explanations.",
  },
];

export default function LearningHub() {
  useIOSViewportFix();
  return (
    <Layout>
      <main className="min-h-screen bg-gradient-to-b from-[#120b1f] to-[#1b1430] text-white px-4 py-10">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-semibold tracking-widest"
            >
              ← Home
            </Link>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
              Learning Zone
            </p>
          </div>

          <header className="text-center space-y-3">
            <p className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-sm tracking-wider uppercase text-amber-300 font-semibold">
              📚 Practice · Repeat · Improve
            </p>
            <h1 className="text-3xl md:text-4xl font-black">Learning Games Hub</h1>
            <p className="text-sm md:text-base text-white/70 max-w-2xl mx-auto">
              Choose a subject and start playing – each game is built for different grades,
              with scores, levels and question explanations.
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
                  Start learning
                  <span>→</span>
                </span>
              </Link>
            ))}
          </section>
          
          {/* קישור לדוח להורים */}
          <section className="mt-8">
            <Link
              href="/learning/parent-report"
              className="block rounded-2xl border-2 border-emerald-400/50 bg-emerald-500/10 hover:bg-emerald-500/20 transition p-6 text-center"
            >
              <div className="text-4xl mb-2">📊</div>
              <h2 className="font-bold text-xl mb-2">דוח להורים</h2>
              <p className="text-sm text-white/70">
                צפה בהתקדמות, סטטיסטיקות מפורטות והמלצות לשיפור
              </p>
            </Link>
          </section>
        </div>
      </main>
    </Layout>
  );
}
