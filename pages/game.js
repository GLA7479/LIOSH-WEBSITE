import Layout from "../components/Layout";
import Link from "next/link";
import { useIOSViewportFix } from "../hooks/useIOSViewportFix";

const GAMES = [
  {
    slug: "mleo-runner",
    title: "Mleo Runner",
    emoji: "🏃‍♂️",
    type: "Arcade Game",
    blurb: "Run with LEO and collect points!",
  },
  {
    slug: "mleo-flyer",
    title: "Mleo Flyer",
    emoji: "🪂",
    type: "Arcade Game",
    blurb: "Fly with LEO and collect coins!",
  },
  {
    slug: "mleo-catcher",
    title: "Mleo Catcher",
    emoji: "🎯",
    type: "Arcade Game",
    blurb: "Catch coins & diamonds, avoid bombs!",
  },
  {
    slug: "mleo-puzzle",
    title: "Mleo Puzzle",
    emoji: "🧩",
    type: "Arcade Game",
    blurb: "Match 3 tiles and score points!",
  },
  {
    slug: "mleo-memory",
    title: "Mleo Memory",
    emoji: "🧠",
    type: "Arcade Game",
    blurb: "Flip the cards and find matching pairs!",
  },
  {
    slug: "mleo-penalty",
    title: "Mleo Penalty",
    emoji: "⚽",
    type: "Arcade Game",
    blurb: "Score goals in the ultimate penalty shoot!",
  },
];

export default function Games() {
  useIOSViewportFix();
  return (
    <Layout>
      <main className="min-h-screen bg-gradient-to-b from-[#0f111a] to-[#1b1f2b] text-white px-4 py-10">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-semibold tracking-widest"
            >
              ← Home
            </Link>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
              Arcade Games
            </p>
          </div>

          <header className="text-center space-y-3">
            <p className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-sm tracking-wider uppercase text-sky-300 font-semibold">
              🎮 Action · Fun · Adventure
            </p>
            <h1 className="text-3xl md:text-4xl font-black">Arcade Games Hub</h1>
            <p className="text-sm md:text-base text-white/70 max-w-2xl mx-auto">
              Play and enjoy our exclusive LEO-themed games! Collect points, fly high, and have fun with the real Shiba Inu hero.
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
                  Play now
                  <span>→</span>
                </span>
              </Link>
            ))}
          </section>
        </div>
      </main>
    </Layout>
  );
}
