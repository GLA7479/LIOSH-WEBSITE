import Layout from "../components/Layout";
import Link from "next/link";

const GAMES = [
  {
    slug: "mleo-runner",
    title: "מירוץ ליאו",
    emoji: "🏃‍♂️",
    type: "משחק ארקייד",
    blurb: "רוצים עם ליאו ואוספים נקודות!",
  },
  {
    slug: "mleo-flyer",
    title: "ליאו במטוס",
    emoji: "🪂",
    type: "משחק ארקייד",
    blurb: "טסים עם ליאו ואוספים מטבעות!",
  },
  {
    slug: "mleo-catcher",
    title: "תופס עם ליאו",
    emoji: "🎯",
    type: "משחק ארקייד",
    blurb: "תופסים מטבעות ויהלומים — מתרחקים מפצצות!",
  },
  {
    slug: "mleo-puzzle",
    title: "חידת ליאו",
    emoji: "🧩",
    type: "משחק ארקייד",
    blurb: "משלבים שלושה אריחים וצוברים נקודות!",
  },
  {
    slug: "mleo-memory",
    title: "זיכרון ליאו",
    emoji: "🧠",
    type: "משחק ארקייד",
    blurb: "הופכים קלפים ומוצאים זוגות מתאימים!",
  },
  {
    slug: "mleo-penalty",
    title: "פנדל ליאו",
    emoji: "⚽",
    type: "משחק ארקייד",
    blurb: "כובשים שערים בבעיטות עונשין!",
  },
];

export default function Games() {
  return (
    <Layout>
      <main className="min-h-screen bg-gradient-to-b from-[#0f111a] to-[#1b1f2b] text-white px-4 py-10" dir="rtl">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-semibold tracking-widest"
            >
              בית ←
            </Link>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
              משחקי ארקייד
            </p>
          </div>

          <header className="text-center space-y-3">
            <p className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-sm tracking-wider uppercase text-sky-300 font-semibold">
              🎮 פעולה · כיף · הרפתקאות
            </p>
            <h1 className="text-3xl md:text-4xl font-black">מרכז משחקי הארקייד</h1>
            <p className="text-sm md:text-base text-white/70 max-w-2xl mx-auto">
              שחקו ותיהנו ממשחקי ליאו! צברו נקודות, טסו גבוה — והכול עם גיבור השיבה אינו האמיתי.
            </p>
          </header>

          <section className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {GAMES.map((g) => (
              <Link
                key={g.slug}
                href={`/${g.slug}`}
                className="group rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition p-4 flex flex-col justify-between"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-3xl">{g.emoji}</div>
                  <div>
                    <h2 className="font-bold text-lg">{g.title}</h2>
                    <p className="text-xs text-white/60">{g.type}</p>
                  </div>
                </div>
                <p className="text-sm text-white/70 flex-1">{g.blurb}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-sky-300">
                  <span>←</span>
                  שחק עכשיו
                </span>
              </Link>
            ))}
          </section>
        </div>
      </main>
    </Layout>
  );
}
