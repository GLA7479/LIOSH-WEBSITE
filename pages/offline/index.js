import Layout from "../../components/Layout";
import Link from "next/link";
import { useIOSViewportFix } from "../../hooks/useIOSViewportFix";

const OFFLINE_GAMES = [
  {
    slug: "tic-tac-toe",
    title: "Tic Tac Toe XL",
    emoji: "❌⭕️",
    players: "2 players",
    blurb: "Boards 3×3 up to 7×7 with score tracking.",
  },
  {
    slug: "rock-paper-scissors",
    title: "Rock · Paper · Scissors",
    emoji: "🪨📄✂️",
    players: "2 players or vs bot",
    blurb: "Quick matches, best-of rounds and score history.",
  },
  {
    slug: "tap-battle",
    title: "Tap Battle",
    emoji: "⚡️",
    players: "2 players",
    blurb: "Each side taps as fast as possible – first to the goal wins.",
  },
  {
    slug: "memory-match",
    title: "Memory Match",
    emoji: "🧠",
    players: "1–2 players",
    blurb: "Flip cards, find pairs and beat the timer.",
  },
];

export default function OfflineHub() {
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
              Offline Games
            </p>
          </div>

          <header className="text-center space-y-3">
            <p className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-sm tracking-wider uppercase text-emerald-300 font-semibold">
              🔌 Same Device • No Internet
            </p>
            <h1 className="text-3xl md:text-4xl font-black">Offline Games Hub</h1>
            <p className="text-sm md:text-base text-white/70 max-w-2xl mx-auto">
              Choose a game and play together on one phone or tablet. Perfect for car rides,
              flights and places without reception.
            </p>
          </header>

          <section className="grid sm:grid-cols-2 gap-4 md:gap-6">
            {OFFLINE_GAMES.map((g) => (
              <Link
                key={g.slug}
                href={`/offline/${g.slug}`}
                className="group rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition p-4 flex flex-col justify-between"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-3xl">{g.emoji}</div>
                  <div>
                    <h2 className="font-bold text-lg">{g.title}</h2>
                    <p className="text-xs text-white/60">{g.players}</p>
                  </div>
                </div>
                <p className="text-sm text-white/70 flex-1">{g.blurb}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-emerald-300">
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
